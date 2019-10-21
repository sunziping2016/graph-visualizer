import Graph from '@/graph/graph/Graph';
import {GraphData, Size} from '@/graph/base/data';

export default abstract class GraphType {
  protected parent: Graph;
  protected constructor(parent: Graph) {
    this.parent = parent;
  }
  public abstract setData(data: GraphData): void;
  public abstract render(): object[];
  public abstract getBoundingBoxSize(): Size;
  public abstract distanceToBorder(angle: number): number;
}
