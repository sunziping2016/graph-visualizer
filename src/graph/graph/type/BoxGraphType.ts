import GraphType from '@/graph/graph/type/GraphType';
import Graph from '@/graph/graph/Graph';
import {BoxGraphData, GraphData, Position, Size} from '@/graph/base/dataInput';
import {AnyShape} from '@/graph/base/dataOutput';

interface BoxGraphConfig {
  label: string | null;
  labelPosition: 'top' | 'right' | 'bottom' | 'left';
  style: 'solid' | 'filled' | 'none';
  fillColor: string;
  strokeColor: string;
  strokeWidth: number;
  fontSize: number;
  fontFamily: string;
  lineHeight: number;
  padding: number;
  align: 'left' | 'center' | 'right';
  spaceBetween: number;
}

export default class BoxGraphType extends GraphType {
  public static defaultConfig = {
    label: null,
    labelPosition: 'top', // or 'right', 'bottom', 'left'
    style: 'none',  // or 'filled'
    fillColor: 'white',
    strokeColor: 'black',
    strokeWidth: 0,
    fontSize: 12,
    fontFamily: 'sans-serif',
    lineHeight: 1.2,
    padding: 6,
    align: 'center',
    spaceBetween: 12,
  };
  private config!: BoxGraphConfig;
  private textSize!: Size;
  private contentSize!: Size;
  private textPosition!: Position;
  private borderSize!: Size;
  constructor(parent: Graph, data: GraphData) {
    if (data.shape !== 'box') {
      throw new Error('Expect box shape');
    }
    super(parent);
    this.updateData(data);
  }
  public updateData(data: BoxGraphData) {
    const newConfig = Object.assign({}, BoxGraphType.defaultConfig, data);
    delete newConfig.layout;
    delete newConfig.children;
    const textSizeNeedsUpdate = !this.config ||
      this.config.label !== newConfig.label ||
      this.config.fontSize !== newConfig.fontSize ||
      this.config.fontFamily !== newConfig.fontFamily ||
      this.config.lineHeight !== newConfig.lineHeight;
    if (textSizeNeedsUpdate) {
      const ctx = this.parent.root.ctx;
      ctx.font = `${newConfig.fontSize}px ${newConfig.fontFamily}`;
      const lines = newConfig.label ? (newConfig.label as string)
        .split('\n') : [];
      this.textSize = {
        width: Math.max(...lines.map((x) => ctx.measureText(x).width), 0),
        height: lines.length * newConfig.fontSize * newConfig.lineHeight,
      };
    }
    const layoutContentSize = this.parent.componentLayout.getContentSize()!;
    this.contentSize = {
      width: layoutContentSize.width + 2 * newConfig.padding,
      height: layoutContentSize.height + 2 * newConfig.padding,
    };
    this.parent.componentLayout.position = { x: 0, y: 0 };
    this.textPosition = { x: 0, y: 0 };
    if (newConfig.label) {
      if (newConfig.labelPosition === 'left' ||
          newConfig.labelPosition === 'right') {
        this.contentSize.width += this.textSize.width + newConfig.spaceBetween;
        if (this.textSize.height > layoutContentSize.height) {
          this.contentSize.height = this.textSize.height +
            2 * newConfig.padding;
        }
        if (newConfig.labelPosition === 'left') {
          this.parent.componentLayout.position.x = (this.textSize.width +
            newConfig.spaceBetween) / 2;
          this.textPosition.x = -(layoutContentSize.width +
            newConfig.spaceBetween) / 2;
        } else {
          this.parent.componentLayout.position.x = -(this.textSize.width +
            newConfig.spaceBetween) / 2;
          this.textPosition.x = (layoutContentSize.width +
            newConfig.spaceBetween) / 2;
        }
      } else {
        this.contentSize.height += this.textSize.height +
          newConfig.spaceBetween;
        if (this.textSize.width > layoutContentSize.width) {
          this.contentSize.width = this.textSize.width + 2 * newConfig.padding;
        }
        if (newConfig.labelPosition === 'bottom') {
          this.parent.componentLayout.position.y = -(this.textSize.height +
            newConfig.spaceBetween) / 2;
          this.textPosition.y = (layoutContentSize.height +
            newConfig.spaceBetween) / 2;
        } else {
          this.parent.componentLayout.position.y = (this.textSize.height +
            newConfig.spaceBetween) / 2;
          this.textPosition.y = -(layoutContentSize.height +
            newConfig.spaceBetween) / 2;
        }
      }
    }
    this.borderSize = {
      width: this.contentSize.width + newConfig.strokeWidth,
      height: this.contentSize.height + newConfig.strokeWidth,
    };
    this.config = newConfig;
  }
  public render(): AnyShape[] {
    const rendered: AnyShape[] = [];
    if (this.config.style && this.config.style !== 'none') {
      const rect: AnyShape = {
        is: 'rect',
        x: -this.contentSize.width / 2,
        y: -this.contentSize.height / 2,
        width: this.contentSize.width,
        height: this.contentSize.height,
        fill: this.config.style === 'filled' ?
          this.config.fillColor : undefined,
        stroke: this.config.strokeWidth > 0 ?
          this.config.strokeColor : undefined,
        strokeWidth: this.config.strokeWidth,
      };
      rendered.push(rect);
    }
    if (this.config.label) {
      const text: AnyShape = {
        is: 'text',
        x: -this.textSize.width / 2,
        y: this.textPosition.y - this.textSize.height / 2,
        text: this.config.label,
        fontSize: this.config.fontSize,
        fontFamily: this.config.fontFamily,
        lineHeight: this.config.lineHeight,
        align: this.config.align,
      };
      rendered.push(text);
    }
    rendered.push(this.parent.componentLayout.render());
    return rendered;
  }
  public getBoundingBoxSize() {
    return this.borderSize;
  }
  public distanceToBorder(angle: number) {
    return Math.min(
      Math.abs(this.borderSize.width / 2 / Math.cos(angle)),
      Math.abs(this.borderSize.height / 2 / Math.sin(angle)),
    );
  }
}
