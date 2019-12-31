import GraphType from '@/graph/graph/type/GraphType';
import {XdotShape} from '@/graph/base/dataXdot';
import {GraphData, Size, XdotGraphData} from '@/graph/base/dataInput';
import {AnyShape} from '@/graph/base/dataOutput';
import Graph from '@/graph/graph/Graph';
import {selectedBoundingBoxPen} from '@/graph/palette';

export default class XdotGraphType extends GraphType {
  private shapes!: XdotShape[];
  private size!: Size;
  private boundingBox: [number, number, number, number] | undefined;
  private selected!: boolean;
  constructor(parent: Graph, data: GraphData) {
    if (data.shape !== 'xdot') {
      throw new Error('Expect xdot shape');
    }
    super(parent);
    this.updateData(data);
  }
  public updateData(data: XdotGraphData): void {
    this.shapes = data.shapes ? ([] as XdotShape[]).concat(
      ...Object.keys(data.shapes).map((x) => data.shapes![x])) : [];
    if (data.boundingBox) {
      this.size = {
        width: data.boundingBox[2] - data.boundingBox[0],
        height: data.boundingBox[3] - data.boundingBox[1],
      };
      this.boundingBox = data.boundingBox;
    } else {
      this.size = {
        width: 0,
        height: 0,
      };
    }
    this.selected = false;
  }
  public render(): AnyShape[] {
    const shapes: AnyShape[] = this.shapes.map(
      (x) => Object.assign({}, x, {
        pen: this.parent.root.applyHighlighted(x.pen, this.parent.highlighted),
      }));
    shapes.push(this.parent.componentLayout.render());
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
  public getBoundingBoxSize(): Size {
    return this.size;
  }
  public onSelect(select: boolean): boolean {
    this.selected = select;
    return !!this.boundingBox;
  }
}
