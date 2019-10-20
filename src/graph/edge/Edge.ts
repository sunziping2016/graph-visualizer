import {EdgeData} from '@/graph/base/data';
import Root from '@/graph/Root';
import Renderable from '@/graph/base/Renderable';
import Positioned from '@/graph/base/Positioned';

export default class Edge implements Renderable {
  public static getId(data: EdgeData) {
    return data.id || `${data.from}-${data.to}`;
  }
  public from?: string;
  public to?: string;
  private readonly root: Root;
  private readonly parent: Positioned | null;
  private id?: string;
  constructor(root: Root, parent: Positioned | null) {
    this.root = root;
    this.parent = parent;
  }
  public setData(data: EdgeData) {
    this.id = Edge.getId(data);
    this.from = data.from;
    this.to = data.to;
  }
  public render() {
    const fromNode = this.root.findPort(this.from!.split(':'));
    const toNode = this.root.findPort(this.to!.split(':'));
    if (!fromNode || !toNode) {
      throw new Error('Unknown start or end node for edge');
    }
    const fromPos = fromNode.getAbsolutePosition(this.parent!);
    const toPos = toNode.getAbsolutePosition(this.parent!);
    const fromAngle = Math.atan2(toPos.y - fromPos.y, toPos.x - fromPos.x);
    const toAngle = Math.PI + fromAngle;
    const fromDistance = fromNode.distanceToBorder(fromAngle);
    const toDistance = toNode.distanceToBorder(toAngle);
    return {
      is: 'v-line',
      key: this.id,
      config: {
        points: [
          fromPos.x + fromDistance * Math.cos(fromAngle),
          fromPos.y + fromDistance * Math.sin(fromAngle),
          toPos.x + toDistance * Math.cos(toAngle),
          toPos.y + toDistance * Math.sin(toAngle),
        ],
        stroke: 'black',
        strokeWidth: 1,
      },
    };
  }
}
