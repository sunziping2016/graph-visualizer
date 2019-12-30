import Node from '@/graph/node/Node';
import {NodeData, Size} from '@/graph/base/dataInput';
import Port from '@/graph/base/Port';
import {AnyShape} from '@/graph/base/dataOutput';

export default abstract class NodeType {
  public readonly parent: Node;
  protected constructor(parent: Node) {
    this.parent = parent;
  }
  public abstract updateData(data: NodeData): void;
  public abstract render(): AnyShape[];
  public findPort(id: string[]): Port | null {
    return null;
  }
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
