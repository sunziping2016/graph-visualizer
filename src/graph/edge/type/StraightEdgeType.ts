import EdgeType from '@/graph/edge/type/EdgeType';
import {EdgeData, Position, StraightEdgeData} from '@/graph/base/dataInput';
import {AnyShape} from '@/graph/base/dataOutput';
import Edge from '@/graph/edge/Edge';

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
  private config!: StraightEdgeConfig;
  private fromPointerPos: Position;
  private toPointerPos: Position;
  private fromAngle: number;
  private toAngle: number;
  private lineFromPos: Position;
  private lineToPos: Position;
  public constructor(parent: Edge, data: EdgeData) {
    if (data.shape !== 'straight') {
      throw new Error('Expect straight shape');
    }
    super(parent);
    this.updateData(data);
    this.fromPointerPos = { x: 0, y: 0 };
    this.toPointerPos = { x: 0, y: 0 };
    this.fromAngle = this.toAngle = 0;
    this.lineFromPos = { x: 0, y: 0 };
    this.lineToPos = { x: 0, y: 0 };
  }
  public updateData(data: StraightEdgeData): void {
    this.config = Object.assign({}, StraightEdgeType.defaultConfig, data);
  }
  public fullyUpdatePosition(): void {
    this.updatePosition();
  }
  public updatePosition(): void {
    if (!this.parent.parent) {
      throw new Error('Top level edge cannot be rendered');
    }
    const fromPort = this.parent.fromPort;
    const toPort = this.parent.toPort;
    const fromPos = fromPort.getAbsolutePosition(this.parent.parent);
    const toPos = toPort.getAbsolutePosition(this.parent.parent);
    this.fromAngle = Math.atan2(toPos.y - fromPos.y, toPos.x - fromPos.x);
    this.toAngle = Math.PI + this.fromAngle;
    const fromDistance = fromPort.distanceToBorder(this.fromAngle);
    const toDistance = toPort.distanceToBorder(this.toAngle);
    let realFromPosX = fromPos.x + fromDistance * Math.cos(this.fromAngle);
    let realFromPosY = fromPos.y + fromDistance * Math.sin(this.fromAngle);
    let realToPosX = toPos.x + toDistance * Math.cos(this.toAngle);
    let realToPosY = toPos.y + toDistance * Math.sin(this.toAngle);
    this.fromPointerPos = {
      x: realFromPosX,
      y: realFromPosY,
    };
    if (this.config.fromPointer) {
      realFromPosX += this.config.pointerWidth * Math.cos(this.fromAngle);
      realFromPosY += this.config.pointerWidth * Math.sin(this.fromAngle);
    }
    this.lineFromPos = {
      x: realFromPosX,
      y: realFromPosY,
    };
    this.toPointerPos = {
      x: realToPosX,
      y: realToPosY,
    };
    if (this.config.toPointer) {
      realToPosX += this.config.pointerWidth * Math.cos(this.toAngle);
      realToPosY += this.config.pointerWidth * Math.sin(this.toAngle);
    }
    this.lineToPos = {
      x: realToPosX,
      y: realToPosY,
    };
  }

  public render(): AnyShape {
    const children: AnyShape[] = [];
    if (this.config.fromPointer) {
      children.push({
        is: 'pointer',
        x: this.fromPointerPos.x,
        y: this.fromPointerPos.y,
        angle: this.fromAngle,
        width: this.config.pointerWidth,
        height: this.config.pointerHeight,
        fill: this.config.pointerColor,
      });
    }
    if (this.config.toPointer) {
      children.push({
        is: 'pointer',
        x: this.toPointerPos.x,
        y: this.toPointerPos.y,
        angle: this.toAngle,
        width: this.config.pointerWidth,
        height: this.config.pointerHeight,
        fill: this.config.pointerColor,
      });
    }
    children.unshift({
      is: 'line',
      points: [
        this.lineFromPos.x, this.lineFromPos.y,
        this.lineToPos.x, this.lineToPos.y,
      ],
      stroke: this.config.lineColor,
      strokeWidth: this.config.lineWidth,
    });
    return {
      is: 'group',
      children,
    };
  }
}
