import TableNodeType from '@/graph/node/type/TableNodeType';
import Root from '@/graph/Root';
import {Element} from 'xml-js';
import {Size} from '@/graph/base/data';
import Port from '@/graph/base/Port';

interface TableCellConfig {
  rowSpan: number;
  columnSpan: number;
  border: number;
  backgroundColor: string;
}

export default class TableCell extends Port {
  public rowOffset?: number;
  public columnOffset?: number;
  public contentSize?: Size;
  public cellSize?: Size;
  private readonly nodeType: TableNodeType;
  private config?: TableCellConfig;
  private port?: string;
  private label?: string;
  private textSize?: Size;
  constructor(root: Root, parent: Port, nodeType: TableNodeType) {
     super(root, parent);
     this.nodeType = nodeType;
  }
  public setData(data: any) {
    this.config = {
      rowSpan: 1,
      columnSpan: 1,
      border: this.nodeType.getTableConfig()!.cellBorder,
      backgroundColor: 'white',
    };
    if (data.attributes) {
      for (const attribute of Object.keys(data.attributes)) {
        const value = data.attributes[attribute];
        switch (attribute.toLowerCase()) {
          case 'rowspan':
            this.config.rowSpan = parseInt(value, 10);
            break;
          case 'colspan':
            this.config.columnSpan = parseInt(value, 10);
            break;
          case 'border':
            this.config.border = parseInt(value, 10);
            break;
          case 'bgcolor':
            this.config.backgroundColor = value;
            break;
          case 'port':
            this.port = value;
            break;
          default:
            throw new Error('Unknown attribute for table cell');
        }
      }
    }
    function getText(element: Element): string {
      switch (element.type) {
        case 'text':
          if (typeof element.text === 'string') {
            return element.text;
          }
          return '';
        case 'element':
          if (element.name && element.name.toLowerCase() === 'br') {
            return '\n';
          }
          if (element.elements) {
            return element.elements.map(getText).join('');
          } else {
            return '';
          }
        default:
          throw new Error('Unknown element type');
      }
    }
    this.label = getText(data);
    const parentConfig = this.nodeType.getConfig()!;
    const tableConfig = this.nodeType.getTableConfig()!;
    const ctx = this.root.ctx;
    ctx.font = `${parentConfig.fontSize}px ${parentConfig.fontFamily}`;
    const lines = this.label ? this.label.split('\n') : [];
    this.textSize = {
      width: Math.max(...lines.map((x) => ctx.measureText(x).width), 0),
      height: lines.length * parentConfig.fontSize * parentConfig.lineHeight,
    };
    this.contentSize = {
      width: this.textSize.width + 2 * tableConfig.cellPadding,
      height: this.textSize.height + 2 * tableConfig.cellPadding,
    };
    this.cellSize = {
      width: this.contentSize.width,
      height: this.contentSize.height,
    };
    this.rowOffset = 0;
    this.columnOffset = 0;
  }
  public render() {
    const rect = {
      is: 'rect',
      x: -this.cellSize!.width / 2,
      y: -this.cellSize!.height / 2,
      width: this.cellSize!.width,
      height: this.cellSize!.height,
      fill: this.config!.backgroundColor,
      stroke: this.config!.border > 0 ? 'black' : undefined,
      strokeWidth: this.config!.border,
    };
    const rendered: object[] = [rect];
    if (this.label) {
      const parentConfig = this.nodeType.getConfig()!;
      const text = {
        is: 'text',
        x: -this.contentSize!.width / 2,
        y: -this.contentSize!.height / 2,
        text: this.label,
        fontSize: parentConfig.fontSize,
        fontFamily: parentConfig.fontFamily,
        lineHeight: parentConfig.lineHeight,
        padding: this.nodeType.getTableConfig()!.cellPadding,
        align: 'center',
      };
      rendered.push(text);
    }
    return {
      is: 'group',
      x: this.position.x,
      y: this.position.y,
      children: rendered,
    };
  }
  public getConfig(): TableCellConfig | undefined {
    return this.config;
  }
  public getPort(): string | undefined {
    return this.port;
  }
  public getBoundingBoxSize() {
    return {
      width: this.cellSize!.width + this.config!.border,
      height: this.cellSize!.height + this.config!.border,
    };
  }
  public distanceToBorder(angle: number) {
    const borderSize = this.getBoundingBoxSize();
    return Math.min(
      Math.abs(borderSize.width / 2 / Math.cos(angle)),
      Math.abs(borderSize.height / 2 / Math.sin(angle)),
    );
  }
}
