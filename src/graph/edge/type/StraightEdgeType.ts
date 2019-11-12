import EdgeType from '@/graph/edge/type/EdgeType';
import {StraightEdgeData} from '@/graph/base/data';

export interface StraightEdgeConfig {
  fromPointer: boolean;
  toPointer: boolean;
  lineColor: string;
  lineWidth: number;
  pointerColor: string;
  pointerWidth: number;
  pointerHeight: number;
}

export default class StraightEdgeType extends EdgeType {
  private static defaultConfig: StraightEdgeConfig = {
    fromPointer: false,
    toPointer: true,
    lineColor: 'black',
    lineWidth: 1,
    pointerColor: 'black',
    pointerWidth: 10,
    pointerHeight: 15,
  };
  private config?: StraightEdgeConfig;
  public setData(data: StraightEdgeData): void {
    this.config = Object.assign({}, StraightEdgeType.defaultConfig, data);
  }
  public render(): object {
    if (!this.parent.graph) {
      throw new Error('Top level edge cannot be rendered');
    }
    const fromNode = this.parent.graph.findPort(this.parent.from!.split(':'));
    const toNode = this.parent.graph.findPort(this.parent.to!.split(':'));
    if (!fromNode || !toNode) {
      throw new Error('Unknown start or end node for edge');
    }
    const fromPos = fromNode.getAbsolutePosition(this.parent.parent!);
    const toPos = toNode.getAbsolutePosition(this.parent.parent!);
    const fromAngle = Math.atan2(toPos.y - fromPos.y, toPos.x - fromPos.x);
    const toAngle = Math.PI + fromAngle;
    const fromDistance = fromNode.distanceToBorder(fromAngle);
    const toDistance = toNode.distanceToBorder(toAngle);
    let realFromPosX = fromPos.x + fromDistance * Math.cos(fromAngle);
    let realFromPosY = fromPos.y + fromDistance * Math.sin(fromAngle);
    let realToPosX = toPos.x + toDistance * Math.cos(toAngle);
    let realToPosY = toPos.y + toDistance * Math.sin(toAngle);
    const children: object[] = [];
    if (this.config!.fromPointer) {
      children.push({
        is: 'MyPointer',
        key: 'toPointer',
        x: realFromPosX,
        y: realFromPosY,
        angle: fromAngle,
        width: this.config!.pointerWidth,
        height: this.config!.pointerHeight,
        fill: this.config!.pointerColor,
      });
      realFromPosX += this.config!.pointerWidth * Math.cos(fromAngle);
      realFromPosY += this.config!.pointerWidth * Math.sin(fromAngle);
    }
    if (this.config!.toPointer) {
      children.push({
        is: 'MyPointer',
        key: 'toPointer',
        x: realToPosX,
        y: realToPosY,
        angle: toAngle,
        width: this.config!.pointerWidth,
        height: this.config!.pointerHeight,
        fill: this.config!.pointerColor,
      });
      realToPosX += this.config!.pointerWidth * Math.cos(toAngle);
      realToPosY += this.config!.pointerWidth * Math.sin(toAngle);
    }
    children.unshift({
      is: 'MyLine',
      key: 'line',
      points: [
        realFromPosX, realFromPosY, realToPosX, realToPosY,
      ],
      stroke: this.config!.lineColor,
      strokeWidth: this.config!.lineWidth,
    });
    return {
      is: 'MyGroup',
      key: this.parent.id,
      children,
    };
  }
}
