import Edge from '@/graph/edge/Edge';
import {EdgeData} from '@/graph/base/data';

export default abstract class EdgeType {
  public readonly parent: Edge;
  public constructor(parent: Edge) {
    this.parent = parent;
  }
  public abstract setData(data: EdgeData): void;
  public abstract render(): object;
}
