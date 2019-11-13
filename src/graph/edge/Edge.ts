import {EdgeData, RenderableData} from '@/graph/base/dataInput';
import Root from '@/graph/Root';
import Renderable from '@/graph/base/Renderable';
import Positioned from '@/graph/base/Positioned';
import Graph from '@/graph/graph/Graph';
import EdgeType from '@/graph/edge/type/EdgeType';
import edgeTypeFactory from '@/graph/edge/type/edgeTypeFactory';

export default class Edge implements Renderable {
  public static getId(data: EdgeData) {
    return data.id || `${data.from}-${data.to}`;
  }
  public from!: string;
  public to!: string;
  public fullId!: string;
  public readonly root: Root;
  public readonly graph: Graph | null;
  public readonly parent: Positioned | null;
  public id!: string;
  private edgeType!: EdgeType;
  constructor(root: Root,
              graph: Graph | null,
              parent: Positioned | null,
              data: RenderableData) {
    if (data.type !== 'edge') {
      throw new Error('Expect edge type');
    }
    this.root = root;
    this.graph = graph;
    this.parent = parent;
    this.updateData(data);
  }
  public updateData(data: EdgeData) {
    this.id = Edge.getId(data);
    this.from = data.from;
    this.to = data.to;
    this.fullId = data.parentId ? `${data.parentId}:${this.id}` : this.id;
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
  public render() {
    return this.edgeType.render();
  }
}
