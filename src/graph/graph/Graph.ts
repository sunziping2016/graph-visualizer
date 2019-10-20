import {GraphData} from '@/graph/base/data';
import Root from '@/graph/Root';
import renderableFactory from '@/graph/base/renderableFactory';
import Edge from '@/graph/edge/Edge';
import layoutFactory from '@/graph/graph/layout';
import graphTypeFactory from '@/graph/graph/type';
import GraphLayout from '@/graph/graph/layout/GraphLayout';
import GraphType from '@/graph/graph/type/GraphType';
import Port from '@/graph/base/Port';
import Renderable from '@/graph/base/Renderable';
import Positioned from '@/graph/base/Positioned';

export default class Graph extends Port implements Renderable {
  public static getId(data: GraphData) {
    if (!data.id) {
      throw new Error('Missing id field for graph');
    }
    return data.id;
  }
  public depth?: number;
  private children?: Map<string, Renderable>;
  private ports?: Map<string, Port>;
  private graphs?: Map<string, Graph>;
  private edges?: Map<string, Edge>;
  private layout?: GraphLayout;
  private graphType?: GraphType;
  constructor(root: Root, parent: Positioned | null = null) {
    super(root, parent);
  }
  public setData(data: GraphData) {
    this.id = Graph.getId(data);
    const layoutClass = layoutFactory(data.layout);
    if (!this.layout || this.layout.constructor !== layoutClass) {
      this.layout = new layoutClass(this);
    }
    const typeClass = graphTypeFactory(data);
    if (!this.graphType || this.graphType.constructor !== typeClass) {
      this.graphType = new typeClass(this, this.layout);
    }
    const newChildren = new Map();
    this.depth = data.depth || 0;
    if (data.children) {
      for (const child of data.children) {
        const type = renderableFactory(child);
        const id = type.getId(child);
        if (newChildren.has(id)) {
          throw new Error('Duplicated id');
        }
        const newChild = this.children &&
            this.children.has(id) &&
            this.children.get(id)!.constructor === type ?
            this.children.get(id)! : new type(this.root, this.layout);
        child.depth = this.depth + 1;
        newChild.setData(child);
        newChildren.set(id, newChild);
      }
    }
    this.children = newChildren;
    this.edges = new Map();
    this.ports = new Map();
    this.graphs = new Map();
    for (const [name, renderable] of this.children.entries()) {
      if (renderable instanceof Edge) {
        this.edges.set(name, renderable);
      } else {
        this.ports.set(name, renderable as any);
        if (renderable instanceof Graph) {
          this.graphs.set(name, renderable as any);
        }
      }
    }
    this.layout.solve(data.layout);
    this.graphType.setData(data);
  }
  public render() {
    return {
      is: 'Group',
      key: this.id,
      config: {
        x: this.position.x,
        y: this.position.y,
      },
      children: this.graphType!.render(),
    };
  }
  public findBelongingPort(id: string): Port | null {
    id = id.split(':')[0];
    if (this.ports!.has(id)) {
      return this.ports!.get(id)!;
    }
    for (const graph of this.graphs!.values()) {
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
    if (this.ports!.has(id[0])) {
      const node = this.ports!.get(id[0])!;
      return node.findPort(id.slice(1));
    }
    for (const graph of this.graphs!.values()) {
      const node = graph.findPort(id);
      if (node) {
        return node;
      }
    }
    return null;
  }
  public getPorts() {
    return this.ports;
  }
  public getEdges() {
    return this.edges;
  }
  public getChildren() {
    return this.children;
  }
  public getBoundingBoxSize() {
    return this.graphType!.getBoundingBoxSize();
  }
  public distanceToBorder(angle: number) {
    return this.graphType!.distanceToBorder(angle);
  }
}






