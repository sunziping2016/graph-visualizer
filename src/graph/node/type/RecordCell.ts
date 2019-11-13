import RecordNodeType from '@/graph/node/type/RecordNodeType';
import {Field, Record, RecordData} from '@/graph/node/type/recordParser';
import {Size} from '@/graph/base/dataInput';
import Root from '@/graph/Root';
import Port from '@/graph/base/Port';
import {AnyShape} from '@/graph/base/dataOutput';

export default class RecordCell extends Port {
  private readonly nodeType: RecordNodeType;
  private isField!: boolean;
  private isHorizontal!: boolean;
  private label?: string;
  private children?: RecordCell[];
  private textSize?: Size;
  private contentSize?: Size;
  private cellSize!: Size;
  constructor(root: Root, parent: Port, nodeType: RecordNodeType,
              data: RecordData, isHorizontal = true) {
    super(root, parent);
    this.nodeType = nodeType;
    this.updateData(data, isHorizontal);
  }
  public updateData(data: RecordData, isHorizontal = true) {
    this.isField = data.type === 'field';
    this.isHorizontal = isHorizontal;
    if (this.isField) {
      const fieldData = data as Field;
      if (fieldData.port) {
        this.nodeType.getPorts()!.set(fieldData.port, this);
      }
      const ctx = this.root.ctx;
      const config = this.nodeType.getConfig()!;
      this.label = fieldData.text || '';
      ctx.font = `${config.fontSize}px ${config.fontFamily}`;
      const lines =  this.label ?  this.label.split('\n') : [];
      this.textSize = {
        width: Math.max(...lines.map((x) => ctx.measureText(x).width), 0),
        height: lines.length * config.fontSize * config.lineHeight,
      };
      this.contentSize = {
        width: this.textSize.width + 2 * config.padding,
        height: this.textSize.height + 2 * config.padding,
      };
      this.cellSize = {
        width: this.contentSize.width,
        height: this.contentSize.height,
      };
    } else {
      const recordData = data as Record;
      this.children = [];
      for (const child of recordData.children) {
        const cell = new RecordCell(this.root, this, this.nodeType,
          child, !isHorizontal);
        this.children.push(cell);
      }
      if (isHorizontal) {
        this.cellSize = {
          width: this.children.map((x: RecordCell) => x.cellSize.width)
            .reduce((a, b) => a + b, 0),
          height: Math.max(...this.children.map(
            (x: RecordCell) => x.cellSize.height)),
        };
      } else {
        this.cellSize = {
          width: Math.max(...this.children.map(
            (x: RecordCell) => x.cellSize.width)),
          height: this.children.map((x: RecordCell) => x.cellSize.height)
            .reduce((a, b) => a + b, 0),
        };
      }
    }
  }
  public updateCellSize(width: number, height: number) {
    if (!this.isField) {
      if (!this.children) {
        throw new Error('Non-field record should have children');
      }
      if (this.isHorizontal) {
        const deltaWidth = (width - this.cellSize.width) / this.children.length;
        let startX = -width / 2;
        for (const child of this.children) {
          child.updateCellSize(child.cellSize.width + deltaWidth, height);
          child.position = {
            x: startX + child.cellSize.width / 2,
            y: 0,
          };
          startX += child.cellSize.width;
        }
      } else {
        const deltaHeight = (height - this.cellSize.height) /
          this.children.length;
        let startY = -height / 2;
        for (const child of this.children) {
          child.updateCellSize(width, child.cellSize.height + deltaHeight);
          child.position = {
            x: 0,
            y: startY + child.cellSize.height / 2,
          };
          startY += child.cellSize.height;
        }
      }
    }
    this.cellSize = { width, height };
  }
  public getCellSize(): Size | undefined {
    return this.cellSize;
  }
  public render(): AnyShape[] {
    let rendered: AnyShape[];
    if (this.isField) {
      const config = this.nodeType.getConfig()!;
      rendered = [
        {
          is: 'rect',
          x: -this.cellSize.width / 2,
          y: -this.cellSize.height / 2,
          width: this.cellSize.width,
          height: this.cellSize.height,
          fill: config.style === 'filled' ? config.fillColor : undefined,
          stroke: config.strokeWidth > 0 ? config.strokeColor : undefined,
          strokeWidth: config.strokeWidth,
        },
      ];
      if (this.label) {
        if (!this.contentSize) {
          throw new Error('Field record should have content size');
        }
        rendered.push({
          is: 'text',
          x: -this.contentSize.width / 2,
          y: -this.contentSize.height / 2,
          text: this.label,
          fontSize: config.fontSize,
          fontFamily: config.fontFamily,
          lineHeight: config.lineHeight,
          padding: config.padding,
          align: config.align,
        });
      }
    } else {
      if (!this.children) {
        throw new Error('Non-field record should have children');
      }
      rendered = this.children.map((x) => {
        const position = x.getPosition();
        return {
          is: 'group',
          x: position.x,
          y: position.y,
          children: x.render(),
        };
      });
    }
    return rendered;
  }
  public getBoundingBoxSize(): Size {
    const config = this.nodeType.getConfig()!;
    return {
      width: this.cellSize.width + config.strokeWidth,
      height: this.cellSize.height + config.strokeWidth,
    };
  }
  public distanceToBorder(angle: number): number {
    const borderSize = this.getBoundingBoxSize();
    return Math.min(
      Math.abs(borderSize.width / 2 / Math.cos(angle)),
      Math.abs(borderSize.height / 2 / Math.sin(angle)),
    );
  }
}
