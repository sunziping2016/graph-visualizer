import {Position} from '@/graph/base/dataInput';

export default class Positioned {
  public parent: Positioned | null;
  protected position: Position;
  public constructor(parent: Positioned | null) {
    this.parent = parent;
    this.position = { x: 0, y: 0 };
  }
  public setPosition(position: Position): void {
    this.position = position;
  }
  public getPosition(): Position {
    return this.position;
  }
  public getAbsolutePosition(parent: Positioned): Position {
    let x = 0;
    let y = 0;
    let node: Positioned | null = this;
    while (node !== parent) {
      if (node === null) {
        throw new Error('Incorrect parent parameter');
      }
      x += node.position.x;
      y += node.position.y;
      node = node.parent;
    }
    return {x, y};
  }
}
