import Node from '@/graph/node/Node';
import {NodeData, XdotNodeData} from '@/graph/base/dataInput';
import NodeType from '@/graph/node/type/NodeType';
import {XdotShape} from '@/graph/base/dataXdot';
import {AnyShape} from '@/graph/base/dataOutput';
import Port from '@/graph/base/Port';

export default class XdotNodeType extends NodeType {
  private shapes!: XdotShape[];
  constructor(parent: Node, data: NodeData) {
    if (data.shape !== 'xdot') {
      throw new Error('Expect xdot shape');
    }
    super(parent);
    this.updateData(data);
  }
  public findPort(id: string[]): Port | null {
    return this.parent;
  }
  public updateData(data: XdotNodeData): void {
    this.shapes = data.shapes ? ([] as XdotShape[]).concat(
      ...Object.keys(data.shapes).map((x) => data.shapes![x])) : [];
  }
  public render(): AnyShape[] {
    return this.shapes;
  }
}
