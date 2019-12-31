import Graph from '@/graph/graph/Graph';
import {GraphData, Size} from '@/graph/base/dataInput';
import {AnyShape} from '@/graph/base/dataOutput';

export default abstract class GraphType {
  protected parent: Graph;
  protected constructor(parent: Graph) {
    this.parent = parent;
  }
  public abstract updateData(data: GraphData): void;
  public abstract render(): AnyShape[];
  public getBoundingBoxSize(): Size {
    return {
      width: 0,
      height: 0,
    };
  }
  public distanceToBorder(angle: number): number {
    return 0;
  }
  public onSelect(select: boolean): boolean {
    return false;
  }
}
