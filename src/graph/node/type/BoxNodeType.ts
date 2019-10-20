import NodeType from '@/graph/node/type/NodeType';
import Node from '@/graph/node/Node';
import {BoxNodeData, Size} from '@/graph/base/data';

interface BoxNodeConfig {
  label: string | null;
  style: 'solid' | 'filled';
  fillColor: string;
  strokeColor: string;
  strokeWidth: number;
  fontSize: number;
  fontFamily: string;
  lineHeight: number;
  padding: number;
  align: 'left' | 'center' | 'right';
}

export default class BoxNodeType extends NodeType {
  private static defaultConfig: BoxNodeConfig = {
    label: null,
    style: 'solid',  // or 'filled'
    fillColor: 'white',
    strokeColor: 'black',
    strokeWidth: 1,
    fontSize: 12,
    fontFamily: 'sans-serif',
    lineHeight: 1.2,
    padding: 4,
    align: 'center',
  };
  private config?: BoxNodeConfig;
  private textSize?: Size;
  private contentSize?: Size;
  private borderSize?: Size;
  constructor(parent: Node) {
    super(parent);
  }
  public setData(data: BoxNodeData) {
    const newConfig = Object.assign({}, BoxNodeType.defaultConfig, data);
    const textSizeNeedsUpdate = !this.config ||
      this.config.label !== newConfig.label ||
      this.config.fontSize !== newConfig.fontSize ||
      this.config.fontFamily !== newConfig.fontFamily ||
      this.config.lineHeight !== newConfig.lineHeight;
    const contentSizeNeedsUpdate = textSizeNeedsUpdate ||
      this.config!.padding !== newConfig.padding;
    const borderSizeNeedsUpdate = contentSizeNeedsUpdate ||
      this.config!.strokeWidth !== newConfig.strokeWidth;
    if (textSizeNeedsUpdate) {
      const ctx = this.parent.root.ctx;
      ctx.font = `${newConfig.fontSize}px ${newConfig.fontFamily}`;
      const lines = newConfig.label ? newConfig.label.split('\n') : [];
      this.textSize = {
        width: Math.max(...lines.map((x) => ctx.measureText(x).width), 0),
        height: lines.length * newConfig.fontSize * newConfig.lineHeight,
      };
    }
    if (contentSizeNeedsUpdate) {
      this.contentSize = {
        width: this.textSize!.width + 2 * newConfig.padding,
        height: this.textSize!.height + 2 * newConfig.padding,
      };
    }
    if (borderSizeNeedsUpdate) {
      // Konva's border extends towards both inner and outer
      this.borderSize = {
        width: this.contentSize!.width + newConfig.strokeWidth,
        height: this.contentSize!.height + newConfig.strokeWidth,
      };
    }
    this.config = newConfig;
  }
  public render() {
    const rect = {
      is: 'v-rect',
      key: 'rect',
      config: {
        x: -this.contentSize!.width / 2,
        y: -this.contentSize!.height / 2,
        width: this.contentSize!.width,
        height: this.contentSize!.height,
        fill: this.config!.style === 'filled' ?
          this.config!.fillColor : undefined,
        stroke: this.config!.strokeWidth > 0 ?
          this.config!.strokeColor : undefined,
        strokeWidth: this.config!.strokeWidth,
      },
    };
    const rendered: object[] = [rect];
    if (this.config!.label) {
      const text = {
        is: 'v-text',
        key: 'text',
        config: {
          x: -this.contentSize!.width / 2,
          y: -this.contentSize!.height / 2,
          text: this.config!.label,
          fontSize: this.config!.fontSize,
          fontFamily: this.config!.fontFamily,
          lineHeight: this.config!.lineHeight,
          padding: this.config!.padding,
          align: this.config!.align,
        },
      };
      rendered.push(text);
    }
    return rendered;
  }
  public getBoundingBoxSize() {
    return this.borderSize!;
  }
  public distanceToBorder(angle: number) {
    return Math.min(
      Math.abs(this.borderSize!.width / 2 / Math.cos(angle)),
      Math.abs(this.borderSize!.height / 2 / Math.sin(angle)),
    );
  }
}
