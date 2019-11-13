import {EdgeData, RenderableData} from '@/graph/base/dataInput';
import Root from '@/graph/Root';
import Renderable, {ParentData} from '@/graph/base/Renderable';
import Positioned from '@/graph/base/Positioned';
import Graph from '@/graph/graph/Graph';
import EdgeType from '@/graph/edge/type/EdgeType';
import edgeTypeFactory from '@/graph/edge/type/edgeTypeFactory';
import Port from '@/graph/base/Port';

export default class Edge implements Renderable {
  public static getId(data: EdgeData) {
    return data.id || `${data.from}-${data.to}`;
  }
  public from!: string;
  public to!: string;
  public depth!: number;
  public fullId!: string;
  public readonly root: Root;
  public readonly graph: Graph | null;
  public readonly parent: Positioned | null;
  public id!: string;
  public fromPort!: Port;
  public toPort!: Port;
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
    const fromPort = this.graph.findPort(this.from.split(':'));
    const toPort = this.graph.findPort(this.to.split(':'));
    if (!fromPort || !toPort) {
      throw new Error('Unknown start or end node for edge');
    }
    this.fromPort = fromPort;
    this.toPort = toPort;
    const typeClass = edgeTypeFactory(data);
    // console.log(this.graph!.findPort(this.from.split(':')));
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
  public render() {
    return this.edgeType.render();
  }
}
