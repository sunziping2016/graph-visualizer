import Node from '@/graph/node/Node';
import {NodeData, XdotNodeData} from '@/graph/base/dataInput';
import NodeType from '@/graph/node/type/NodeType';
import {XdotShape} from '@/graph/base/dataXdot';
import {AnyShape} from '@/graph/base/dataOutput';
import Port from '@/graph/base/Port';
import {selectedBoundingBoxPen} from '@/graph/palette';

export default class XdotNodeType extends NodeType {
  private shapes!: XdotShape[];
  private boundingBox: [number, number, number, number] | undefined;
  private selected!: boolean;
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
    this.boundingBox = data.boundingBox;
    this.selected = false;
  }
  public render(): AnyShape[] {
    const shapes = this.shapes.map(
      (x) => Object.assign({}, x, {
        pen: this.parent.root.applyHighlighted(x.pen, this.parent.highlighted),
      }));
    if (this.selected && this.boundingBox) {
      return shapes.concat({
        is: 'xdot',
        type: 'polygon',
        pen: selectedBoundingBoxPen,
        points: [
          [this.boundingBox[0], this.boundingBox[1]],
          [this.boundingBox[2], this.boundingBox[1]],
          [this.boundingBox[2], this.boundingBox[3]],
          [this.boundingBox[0], this.boundingBox[3]],
        ],
        filled: false,
      });
    } else {
      return shapes;
    }
  }
  public onSelect(select: boolean): boolean {
    this.selected = select;
    return !!this.boundingBox;
  }
}
