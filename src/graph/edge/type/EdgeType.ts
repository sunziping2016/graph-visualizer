import Edge from '@/graph/edge/Edge';
import {EdgeData} from '@/graph/base/dataInput';
import {AnyShape} from '@/graph/base/dataOutput';

export default abstract class EdgeType {
  public readonly parent: Edge;
  protected constructor(parent: Edge) {
    this.parent = parent;
  }
  public abstract updateData(data: EdgeData): void;
  public abstract fullyUpdatePosition(): void;
  public abstract updatePosition(): void;
  public abstract render(): AnyShape;
}
