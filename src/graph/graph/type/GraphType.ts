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
  public abstract getBoundingBoxSize(): Size;
  public abstract distanceToBorder(angle: number): number;
}
