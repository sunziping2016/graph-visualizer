import {EdgeData, RenderableData} from '@/graph/base/dataInput';
import Root from '@/graph/Root';
import Renderable, {ParentData} from '@/graph/base/Renderable';
import Positioned from '@/graph/base/Positioned';
import Graph from '@/graph/graph/Graph';
import EdgeType from '@/graph/edge/type/EdgeType';
import edgeTypeFactory from '@/graph/edge/type/edgeTypeFactory';
import Port from '@/graph/base/Port';
import Node from '@/graph/node/Node';

export default class Edge implements Renderable {
  public static getId(data: EdgeData) {
    return data.id || `${data.from}-${data.to}`;
  }
  private static findParentNodeOrGraph(node: Positioned | null)
    : Node | Graph | null {
    while (node && !(node instanceof Graph || node instanceof Node)) {
      node = node.parent;
    }
    return node;
  }
  public from!: string;
  public to!: string;
  public depth!: number;
  public fullId!: string;
  public highlighted!: boolean;
  public readonly root: Root;
  public readonly graph: Graph | null;
  public readonly parent: Positioned | null;
  public id!: string;
  public fromPort!: Port;
  public toPort!: Port;
  public fromNodeOrGraph!: Node | Graph;
  public toNodeOrGraph!: Node | Graph;
  private edgeType!: EdgeType;
  constructor(root: Root,
              graph: Graph | null,
              parent: Positioned | null,
              data: RenderableData,
              parentData: ParentData | null) {
    if (data.type !== 'edge') {
      throw new Error('Expect edge type');
    }
    this.root = root;
    this.graph = graph;
    this.parent = parent;
    this.updateData(data, parentData);
  }
  public updateData(data: EdgeData, parentData: ParentData | null) {
    this.id = Edge.getId(data);
    this.from = data.from;
    this.to = data.to;
    this.depth = parentData ? parentData.depth + 1 : 0;
    this.fullId = parentData ? `${parentData.parentId}:${this.id}` : this.id;
    if (!this.graph) {
      throw new Error('Top level edge cannot be rendered');
    }
    this.highlighted = false;
    const fromPort = this.graph.findPort(this.from.split(':'));
    const toPort = this.graph.findPort(this.to.split(':'));
    if (!fromPort || !toPort) {
      throw new Error(`Unknown start or end port ${this.from}-${this.to} for edge`);
    }
    this.fromPort = fromPort;
    this.toPort = toPort;
    if (this.fromNodeOrGraph) {
      this.fromNodeOrGraph.fromEdges.delete(this);
    }
    if (this.toNodeOrGraph) {
      this.toNodeOrGraph.toEdges.delete(this);
    }
    const fromNodeOrGraph = Edge.findParentNodeOrGraph(fromPort);
    const toNodeOrGraph = Edge.findParentNodeOrGraph(toPort);
    if (!fromNodeOrGraph || !toNodeOrGraph) {
      throw new Error('Unknown start or end node for edge');
    }
    fromNodeOrGraph.fromEdges.add(this);
    toNodeOrGraph.toEdges.add(this);
    this.fromNodeOrGraph = fromNodeOrGraph;
    this.toNodeOrGraph = toNodeOrGraph;
    const typeClass = edgeTypeFactory(data);
    if (!this.edgeType || this.edgeType.constructor !== typeClass) {
      this.edgeType = new typeClass(this, data);
    } else {
      this.edgeType.updateData(data);
    }
  }
  public fullyUpdatePosition() {
    this.edgeType.fullyUpdatePosition();
  }
  public updatePosition() {
    this.edgeType.updatePosition();
  }
  public getControlPoints(): Positioned[] {
    return this.edgeType.getControlPoints();
  }
  public render() {
    return this.edgeType.render();
  }
}
