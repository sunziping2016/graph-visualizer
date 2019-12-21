import GraphType from '@/graph/graph/type/GraphType';
import {XdotShape} from '@/graph/base/dataXdot';
import {GraphData, XdotGraphData} from '@/graph/base/dataInput';
import {AnyShape} from '@/graph/base/dataOutput';
import Graph from '@/graph/graph/Graph';

export default class XdotGraphType extends GraphType {
  private shapes!: XdotShape[];
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
  }
  public render(): AnyShape[] {
    const shapes: AnyShape[] = this.shapes.slice();
    shapes.push(this.parent.componentLayout.render());
    return shapes;
  }
}
