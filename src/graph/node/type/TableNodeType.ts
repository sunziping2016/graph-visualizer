import convert, {Element} from 'xml-js';
import NodeType from './NodeType';
import TableCell from './TableCell';
import Node from '@/graph/node/Node';
import {Size, TableNodeData} from '@/graph/base/data';
import Port from '@/graph/base/Port';

interface TableNodeConfig {
  label: string;
  fontSize: number;
  fontFamily: string;
  lineHeight: number;
}

interface TableConfig {
  border: number;
  cellBorder: number;
  cellSpacing: number;
  cellPadding: number;
}

export default class TableNodeType extends NodeType {
  public static defaultConfig: TableNodeConfig = {
    label: '',
    fontSize: 12,
    fontFamily: 'sans-serif',
    lineHeight: 1.2,
  };
  private config?: TableNodeConfig;
  private tableConfig?: TableConfig;
  private table?: TableCell[][];
  private ports?: Map<string, Port>;
  private contentSize?: Size;
  private borderSize?: Size;
  constructor(parent: Node) {
    super(parent);
  }
  public setData(data: TableNodeData) {
    const newConfig = Object.assign({}, TableNodeType.defaultConfig, data);
    const layoutNeedsUpdate = !this.config ||
      this.config.label !== newConfig.label ||
      this.config.fontSize !== newConfig.fontSize ||
      this.config.fontFamily !== newConfig.fontFamily ||
      this.config.lineHeight !== newConfig.lineHeight;
    this.config = newConfig;
    if (layoutNeedsUpdate) {
      const jsonObj = convert.xml2js(this.config.label) as Element;
      if (!jsonObj.elements || !jsonObj.elements[0] ||
          !jsonObj.elements[0].name ||
          jsonObj.elements[0].name.toLowerCase() !== 'table') {
        throw new Error('Expect table element');
      }
      const tableElement = jsonObj.elements[0];
      this.tableConfig = {
        border: 0,
        cellBorder: 1,
        cellSpacing: 0,
        cellPadding: 4,
      };
      if (tableElement.attributes) {
        for (const attribute of Object.keys(tableElement.attributes)) {
          const value = tableElement.attributes[attribute] as string;
          switch (attribute.toLowerCase()) {
            case 'border':
              this.tableConfig.border = parseInt(value, 10);
              break;
            case 'cellborder':
              this.tableConfig.cellBorder = parseInt(value, 10);
              break;
            case 'cellspacing':
              this.tableConfig.cellSpacing = parseInt(value, 10);
              break;
            case 'cellpadding':
              this.tableConfig.cellPadding = parseInt(value, 10);
              break;
            default:
              throw new Error('Unknown attribute for table');
          }
        }
      }
      // Parse table and get numbers of rows and columns
      this.table = [];
      this.ports = new Map();
      let rows = 0;
      let columns = 0;
      let firstRow = true;
      if (tableElement.elements) {
        for (const tr of tableElement.elements) {
          if (!tr.name || tr.name.toLowerCase() !== 'tr') {
            throw new Error('Expect tr element');
          }
          const row = [];
          if (tr.elements) {
            for (const td of tr.elements) {
              if (!td.name || td.name.toLowerCase() !== 'td') {
                throw new Error('Expect td element');
              }
              const cell = new TableCell(this.parent.root, this.parent, this);
              cell.setData(td);
              const port = cell.getPort();
              if (port) {
                this.ports.set(port, cell);
              }
              if (firstRow) {
                columns += cell.getConfig()!.columnSpan;
              }
              row.push(cell);
            }
          }
          ++rows;
          if (firstRow) {
            firstRow = false;
          }
          this.table.push(row);
        }
      }
      // Create empty cell size table
      const cellSizes = [];
      for (let i = 0; i < rows; ++i) {
        cellSizes.push(Array(columns).fill(null));
      }
      // Fill size table with minimum required size
      for (let rowOffset = 0; rowOffset < rows; ++rowOffset) {
        let columnOffset = 0;
        for (const cell of this.table[rowOffset]) {
          while (columnOffset < columns && cellSizes[rowOffset][columnOffset]) {
            ++columnOffset;
          }
          cell.rowOffset = rowOffset;
          cell.columnOffset = columnOffset;
          const {rowSpan, columnSpan} = cell.getConfig()!;
          const cellHeight = (cell.contentSize!.height -
            (rowSpan - 1) * this.tableConfig.cellSpacing) / rowSpan;
          const cellWidth = (cell.contentSize!.width -
            (columnSpan - 1) * this.tableConfig.cellSpacing) / columnSpan;
          for (let i = 0; i < rowSpan; ++i) {
            for (let j = 0; j < columnSpan; ++j) {
              cellSizes[rowOffset + i][columnOffset + j] = {
                width: cellWidth,
                height: cellHeight,
              };
            }
          }
          columnOffset += columnSpan;
        }
      }
      // Get height of rows and width of columns
      const rowHeight = [];
      const columnWidth = [];
      for (let i = 0; i < rows; ++i) {
        let max = -Infinity;
        for (let j = 0; j < columns; ++j) {
          if (cellSizes[i][j].height > max) {
            max = cellSizes[i][j].height;
          }
        }
        rowHeight.push(max);
      }
      for (let j = 0; j < columns; ++j) {
        let max = -Infinity;
        for (let i = 0; i < rows; ++i) {
          if (cellSizes[i][j].width > max) {
            max = cellSizes[i][j].width;
          }
        }
        columnWidth.push(max);
      }
      // Get accumulated height and width
      const accRowHeight = [0];
      const accColumnWidth = [0];
      for (let i = 0; i < rows; ++i) {
        accRowHeight.push(accRowHeight[i] + rowHeight[i] +
          this.tableConfig.cellSpacing);
      }
      for (let i = 0; i < columns; ++i) {
        accColumnWidth.push(accColumnWidth[i] + columnWidth[i] +
          this.tableConfig.cellSpacing);
      }
      this.contentSize = {
        width: accColumnWidth[accColumnWidth.length - 1] -
          this.tableConfig.cellSpacing,
        height: accRowHeight[accRowHeight.length - 1] -
          this.tableConfig.cellSpacing,
      };
      // Set size and position to cells
      for (const row of this.table) {
        for (const cell of row) {
          const {rowSpan, columnSpan} = cell.getConfig()!;
          const {rowOffset, columnOffset} = cell;
          const upperLeftX = accColumnWidth[columnOffset!];
          const upperLeftY = accRowHeight[rowOffset!];
          const width = accColumnWidth[columnOffset! + columnSpan] -
            upperLeftX - this.tableConfig.cellSpacing;
          const height = accRowHeight[rowOffset! + rowSpan] -
            upperLeftY - this.tableConfig.cellSpacing;
          cell.setPosition({
            x: upperLeftX + width / 2 - this.contentSize.width / 2,
            y: upperLeftY + height / 2 - this.contentSize.height / 2,
          });
          cell.cellSize = { width, height };
        }
      }
      this.borderSize = {
        width: this.contentSize.width + this.tableConfig.border +
          2 * this.tableConfig.cellSpacing,
        height: this.contentSize.height + this.tableConfig.border +
          2 * this.tableConfig.cellSpacing,
      };
    }
  }
  public render() {
    const rendered = [];
    rendered.push( {
      is: 'rect',
      x: -this.contentSize!.width / 2 - this.tableConfig!.cellSpacing,
      y: -this.contentSize!.height / 2 - this.tableConfig!.cellSpacing,
      width: this.contentSize!.width + 2 * this.tableConfig!.cellSpacing,
      height: this.contentSize!.height + 2 * this.tableConfig!.cellSpacing,
      fill: 'white',
      stroke: this.tableConfig!.border > 0 ? 'black' : undefined,
      strokeWidth: this.tableConfig!.border,
    });
    for (const row of this.table!) {
      for (const cell of row) {
        rendered.push(cell.render());
      }
    }
    return rendered;
  }
  public getConfig(): TableNodeConfig | undefined {
    return this.config;
  }
  public getTableConfig(): TableConfig | undefined {
    return this.tableConfig;
  }
  public findPort(id: string[]): Port | null {
    if (id.length === 1) {
      const founded = this.ports!.get(id[0]);
      if (founded) {
        return founded;
      }
      return null;
    }
    return null;
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
