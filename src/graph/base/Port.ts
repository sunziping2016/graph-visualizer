import Positioned from '@/graph/base/Positioned';
import {Size} from '@/graph/base/dataInput';
import Root from '@/graph/Root';

export default abstract class Port extends Positioned {
  public readonly root: Root;
  public initialPlaced: boolean; // for graph layout
  public id: string;
  protected constructor(root: Root, parent: Positioned | null = null) {
    super(parent);
    this.root = root;
    this.initialPlaced = false;
    this.id = '';
  }
  public findPort(id: string[]): Port | null {
    if (id.length === 0) {
      return this;
    }
    return null;
  }
  public abstract getBoundingBoxSize(): Size;
  public abstract distanceToBorder(angle: number): number;
  // Return true to trigger a refresh
  public onHover(hover: boolean): boolean {
    return false;
  }
  // Return true to trigger a refresh
  public onSelect(select: boolean): boolean {
    return false;
  }
}
