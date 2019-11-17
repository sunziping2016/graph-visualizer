import {GraphData, RenderableData} from '@/graph/base/dataInput';
import Root from '@/graph/Root';
import renderableFactory from '@/graph/base/renderableFactory';
import Edge from '@/graph/edge/Edge';
import layoutFactory from '@/graph/graph/layout/graphLayoutFactory';
import componentFactory from '@/graph/graph/component/componentLayoutFactory';
import graphTypeFactory from '@/graph/graph/type/graphTypeFactory';
import Port from '@/graph/base/Port';
import Renderable, {ParentData} from '@/graph/base/Renderable';
import Positioned from '@/graph/base/Positioned';
import GraphLayout, {LayoutData, LayoutEdgeData} from '@/graph/graph/layout/GraphLayout';
import ComponentLayout from '@/graph/graph/component/ComponentLayout';
import GraphType from '@/graph/graph/type/GraphType';
import GraphPhysics from '@/graph/graph/physics/GraphPhysics';
import physicsFactory from '@/graph/graph/physics/graphPhysicsFactory';
import {AnyShape} from '@/graph/base/dataOutput';
import Node from '@/graph/node/Node';

export default class Graph extends Port implements Renderable {
  public static getId(data: GraphData) {
    if (!data.id) {
      throw new Error('Missing id field for graph');
    }
    return data.id;
  }
  public readonly graph: Graph | null;
  public fullId!: string;
  public depth!: number;
  public fromEdges!: Set<Edge>;
  public toEdges!: Set<Edge>;
  public children!: Map<string, Renderable>;
  public ports!: Map<string, Node | Graph>;
  public edges!: Map<string, Edge>;
  public subgraphs!: Map<string, Graph>;
  public layouts!: GraphLayout[];
  public physics!: GraphPhysics[];
  public layoutsData!: LayoutData[];
  public componentLayout!: ComponentLayout;
  private graphType!: GraphType;
  constructor(root: Root,
              graph: Graph | null,
              parent: Positioned | null,
              data: RenderableData,
              parentData: ParentData | null) {
    if (data.type !== 'graph') {
      throw new Error('Expect node type');
    }
    super(root, parent);
    this.graph = graph;
    this.updateData(data, parentData);
  }
  public updateData(data: GraphData, parentData: ParentData | null) {
    this.id = Graph.getId(data);
    const newChildren = new Map();
    this.depth = parentData ? parentData.depth + 1 : 0;
    this.fullId = parentData ? `${parentData.parentId}:${this.id}` : this.id;
    this.fromEdges = new Set();
    this.toEdges = new Set();
    const oldChildren = this.children;
    this.children = new Map();
    this.edges = new Map();
    this.ports = new Map();
    this.subgraphs = new Map();
    if (data.children) {
      for (const child of data.children) {
        const type = renderableFactory(child);
        const id = type.getId(child);
        if (this.children.has(id)) {
          throw new Error(`Duplicated id ${id}`);
        }
        let newChild: Renderable;
        if (oldChildren && oldChildren.has(id) &&
            oldChildren.get(id)!.constructor === type) {
          newChild = oldChildren.get(id)!;
          newChild.updateData(child, {
            parentId: this.fullId,
            depth: this.depth,
          });
        } else {
          newChild = new type(this.root, this, null, child, {
            parentId: this.fullId,
            depth: this.depth,
          });
        }
        this.children.set(id, newChild);
        if (newChild instanceof Edge) {
          this.edges.set(id, newChild);
        } else {
          this.ports.set(id, newChild as any);
          if (newChild instanceof Graph) {
            this.subgraphs.set(id, newChild);
          }
        }
      }
    }
    // Create adjacency list
    const adjacencyList: Map<Node | Graph, Array<Node | Graph>> = new Map();
    const edgesData: LayoutEdgeData[] = [];
    for (const edge of this.edges.values()) {
      const from = this.findPort(edge.from.split(':'));
      const to = this.findPort(edge.to.split(':'));
      const fromBelonging = this.findBelongingPort(edge.from);
      const toBelonging = this.findBelongingPort(edge.to);
      if (from && to && fromBelonging && toBelonging) {
        if (!adjacencyList.has(fromBelonging)) {
          adjacencyList.set(fromBelonging, []);
        }
        if (!adjacencyList.has(toBelonging)) {
          adjacencyList.set(toBelonging, []);
        }
        adjacencyList.get(fromBelonging)!.push(toBelonging);
        adjacencyList.get(toBelonging)!.push(fromBelonging);
        edgesData.push({ from, to, fromBelonging, toBelonging, edge });
      } else {
        throw new Error('Cannot find starting or ending port of edge');
      }
    }
    // Compute connected components by DFS
    const unvisited: Set<Node | Graph> = new Set(this.ports.values());
    this.layoutsData = [];
    const calculateConnectedComponent = (from: Node | Graph) => {
      unvisited.delete(from);
      const component = this.layoutsData[this.layoutsData.length - 1];
      component.ports.push(from);
      const adjacency = adjacencyList.get(from);
      if (adjacency) {
        for (const to of adjacency) {
          if (unvisited.has(to)) {
            calculateConnectedComponent(to);
          }
        }
      }
    };
    while (unvisited.size) {
      const node = unvisited.values().next().value;
      const component: LayoutData = {
        ports: [],
        edges: [],
        children: [],
      };
      this.layoutsData.push(component);
      calculateConnectedComponent(node);
    }
    // Classify edges to belonging component
    const portToComponent: Map<Port, LayoutData> = new Map();
    for (const component of this.layoutsData) {
      for (const port of component.ports) {
        portToComponent.set(port, component);
      }
    }
    for (const edgeData of edgesData) {
      const {fromBelonging} = edgeData;
      portToComponent.get(fromBelonging)!.edges.push(edgeData);
    }
    // Add children
    for (const component of this.layoutsData) {
      component.children = (component.ports as any[])
        .concat(component.edges.map((x) => x.edge));
    }
    // Create layout
    const componentClass = componentFactory(data.component);
    if (!this.componentLayout ||
        this.componentLayout.constructor !== componentClass) {
      this.componentLayout = new componentClass(this, this);
    }
    const layoutClass = layoutFactory(data.layout);
    const physicsClass = physicsFactory(data.physics);
    const newLayouts: GraphLayout[] = [];
    const newPhysics: GraphPhysics[] = [];
    for (let i = 0; i < this.layoutsData.length; ++i) {
      const layout = this.layouts && i < this.layouts.length &&
        this.layouts[i].constructor === layoutClass ?
        this.layouts[i] : new layoutClass(this, this.componentLayout);
      const physics = this.physics && i < this.physics.length &&
        this.physics[i].constructor === physicsClass ?
        this.physics[i] : new physicsClass(this, layout);
      for (const child of this.layoutsData[i].children) {
        (child as any).parent = layout;
      }
      layout.solve(data.layout, this.layoutsData[i], i);
      physics.solve(data.physics, this.layoutsData[i]);
      newLayouts.push(layout);
      newPhysics.push(physics);
    }
    this.layouts = newLayouts;
    this.physics = newPhysics;
    this.componentLayout.updateData(data.component);
    const typeClass = graphTypeFactory(data);
    if (!this.graphType || this.graphType.constructor !== typeClass) {
      this.graphType = new typeClass(this, data);
    } else {
      this.graphType.updateData(data);
    }
  }
  public step(): boolean {
    let updated = false;
    if (this.subgraphs) {
      for (const subgraph of this.subgraphs.values()) {
        if (subgraph.step()) {
          updated = true;
        }
      }
    }
    if (this.physics) {
      for (const physics of this.physics) {
        if (physics.step()) {
          updated = true;
        }
      }
    }
    return updated;
  }
  public render(): AnyShape {
    return {
      is: 'group',
      draggable: true,
      id: this.fullId,
      x: this.position.x,
      y: this.position.y,
      children: this.graphType.render(),
    };
  }
  public findBelongingPort(id: string): Node | Graph | null {
    id = id.split(':')[0];
    if (this.ports.has(id)) {
      return this.ports.get(id)!;
    }
    for (const graph of this.subgraphs.values()) {
      if (graph.findBelongingPort(id)) {
        return graph;
      }
    }
    return null;
  }
  public findPort(id: string[]): Port | null {
    if (id.length === 0) {
      return this;
    }
    if (this.ports.has(id[0])) {
      const node = this.ports.get(id[0])!;
      return node.findPort(id.slice(1));
    }
    for (const graph of this.subgraphs.values()) {
      const node = graph.findPort(id);
      if (node) {
        return node;
      }
    }
    return null;
  }
  public getBoundingBoxSize() {
    return this.graphType.getBoundingBoxSize();
  }
  public distanceToBorder(angle: number) {
    return this.graphType.distanceToBorder(angle);
  }
}
