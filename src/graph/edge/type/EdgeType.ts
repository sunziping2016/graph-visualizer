import Edge from '@/graph/edge/Edge';
import {EdgeData} from '@/graph/base/dataInput';
import {AnyShape} from '@/graph/base/dataOutput';
import Positioned from '@/graph/base/Positioned';

export default abstract class EdgeType {
  public readonly parent: Edge;
  protected constructor(parent: Edge) {
    this.parent = parent;
  }
  public abstract updateData(data: EdgeData): void;
  public fullyUpdatePosition(): void {
    // do nothing
  }
  public updatePosition(): void {
    // do nothing
  }
  public getControlPoints(): Positioned[] {
    return [];
  }
  public abstract render(): AnyShape;
}
