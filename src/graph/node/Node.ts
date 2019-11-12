import {NodeData} from '@/graph/base/data';
import Root from '@/graph/Root';
import nodeTypeFactory from '@/graph/node/type';
import NodeType from '@/graph/node/type/NodeType';
import Renderable from '@/graph/base/Renderable';
import Port from '@/graph/base/Port';
import Positioned from '@/graph/base/Positioned';
import Graph from '@/graph/graph/Graph';

export default class Node extends Port implements Renderable {
  public static getId(data: NodeData) {
    if (!data.id) {
      throw new Error('Missing id field for node');
    }
    return data.id;
  }
  public readonly graph: Graph | null;
  public fullId?: string;
  private nodeType?: NodeType;
  constructor(root: Root,
              graph: Graph | null = null,
              parent: Positioned | null = null) {
    super(root, parent);
    this.graph = graph;
  }
  public setData(data: NodeData) {
    this.id = Node.getId(data);
    this.fullId = data.parentId ? `${data.parentId}:${this.id}` : this.id;
    const typeClass = nodeTypeFactory(data);
    if (!this.nodeType || this.nodeType.constructor !== typeClass) {
      this.nodeType = new typeClass(this);
    }
    this.nodeType.setData(data);
  }
  public render() {
    return {
      is: 'MyGroup',
      key: this.id,
      draggable: true,
      id: this.fullId,
      x: this.position.x,
      y: this.position.y,
      children: this.nodeType!.render(),
    };
  }
  public findPort(id: string[]): Port | null {
    if (id.length === 0) {
      return this;
    }
    return this.nodeType!.findPort(id);
  }
  public getBoundingBoxSize() {
    return this.nodeType!.getBoundingBoxSize();
  }
  public distanceToBorder(angle: number) {
    return this.nodeType!.distanceToBorder(angle);
  }
}
