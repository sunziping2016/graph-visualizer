import Node from '@/graph/node/Node';
import {NodeData, Size} from '@/graph/base/data';
import Port from '@/graph/base/Port';

export default abstract class NodeType {
  public readonly parent: Node;
  protected constructor(parent: Node) {
    this.parent = parent;
  }
  public abstract setData(data: NodeData): void;
  public abstract render(): object[];
  public findPort(id: string[]): Port | null {
    return null;
  }
  public abstract getBoundingBoxSize(): Size;
  public abstract distanceToBorder(angle: number): number;
}
