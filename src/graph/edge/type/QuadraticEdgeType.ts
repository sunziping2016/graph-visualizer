import EdgeType from '@/graph/edge/type/EdgeType';
import {QuadraticEdgeData} from '@/graph/base/data';
import Positioned from '@/graph/base/Positioned';

export interface QuadraticEdgeConfig {
  fromPointer: boolean;
  toPointer: boolean;
  lineColor: string;
  lineWidth: number;
  pointerColor: string;
  pointerWidth: number;
  pointerHeight: number;
}

export default class QuadraticEdgeType extends EdgeType {
  private static defaultConfig: QuadraticEdgeConfig = {
    fromPointer: false,
    toPointer: true,
    lineColor: 'black',
    lineWidth: 1,
    pointerColor: 'black',
    pointerWidth: 10,
    pointerHeight: 15,
  };
  private config?: QuadraticEdgeConfig;
  private controlPoint?: Positioned;
  public setData(data: QuadraticEdgeData): void {
    this.config = Object.assign({}, QuadraticEdgeType.defaultConfig, data);
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
    if (!this.controlPoint) {
      this.controlPoint = new Positioned(this.parent.parent);
      this.controlPoint.setPosition({
        x: 0.5 * (fromNode.getPosition().x + toNode.getPosition().x),
        y: 0.5 * (fromNode.getPosition().y + toNode.getPosition().y),
      });
    }
    const fromPos = fromNode.getAbsolutePosition(this.parent.parent!);
    const toPos = toNode.getAbsolutePosition(this.parent.parent!);
    const viaPos = this.controlPoint.getPosition();
    const fromAngle = Math.atan2(viaPos.y - fromPos.y, viaPos.x - fromPos.x);
    const toAngle = Math.PI + Math.atan2(toPos.y - viaPos.y, toPos.x - viaPos.x);
    const fromDistance = fromNode.distanceToBorder(fromAngle);
    const toDistance = toNode.distanceToBorder(toAngle);
    let realFromPosX = fromPos.x + fromDistance * Math.cos(fromAngle);
    let realFromPosY = fromPos.y + fromDistance * Math.sin(fromAngle);
    let realToPosX = toPos.x + toDistance * Math.cos(toAngle);
    let realToPosY = toPos.y + toDistance * Math.sin(toAngle);
    const children: object[] = [];
    if (this.config!.fromPointer) {
      children.push({
        is: 'Pointer',
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
        is: 'Pointer',
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
      is: 'QuadraticLine',
      key: 'line',
      config: {
        points: [
          realFromPosX, realFromPosY,
          this.controlPoint.getPosition().x,
          this.controlPoint.getPosition().y,
          realToPosX, realToPosY,
        ],
        stroke: this.config!.lineColor,
        strokeWidth: this.config!.lineWidth,
      },
    });
    return {
      is: 'Group',
      key: this.parent.id,
      children,
    };
  }
}
