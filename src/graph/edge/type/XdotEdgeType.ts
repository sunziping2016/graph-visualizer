import EdgeType from '@/graph/edge/type/EdgeType';
import {EdgeData, XdotEdgeData} from '@/graph/base/dataInput';
import {XdotShape} from '@/graph/base/dataXdot';
import {AnyShape} from '@/graph/base/dataOutput';
import Edge from '@/graph/edge/Edge';

export default class XdotEdgeType extends EdgeType {
  private shapes!: XdotShape[];
  constructor(parent: Edge, data: EdgeData) {
    if (data.shape !== 'xdot') {
      throw new Error('Expect xdot shape');
    }
    super(parent);
    this.updateData(data);
  }
  public updateData(data: XdotEdgeData): void {
    this.shapes = data.shapes ? ([] as XdotShape[]).concat(
      ...Object.keys(data.shapes).map((x) => data.shapes![x])) : [];
  }
  public render(): AnyShape {
    return{
      is: 'group',
      children: this.shapes,
    };
  }
}
