import NodeType from './NodeType';
import Node from '@/graph/node/Node';
import recordParser from './recordParser';
import RecordCell from './RecordCell';
import {NodeData, RecordNodeData, Size} from '@/graph/base/dataInput';
import Port from '@/graph/base/Port';
import {AnyShape} from '@/graph/base/dataOutput';

interface RecordNodeConfig {
  label: string;
  direction: 'horizontal' | 'vertical';
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

export default class RecordNodeType extends NodeType {
  public static defaultConfig: RecordNodeConfig = {
    label: '',
    direction: 'horizontal', // or 'vertical'
    style: 'solid',
    fillColor: 'white',
    strokeColor: 'black',
    strokeWidth: 1,
    fontSize: 12,
    fontFamily: 'sans-serif',
    lineHeight: 1.2,
    padding: 4,
    align: 'center',
  };
  private config!: RecordNodeConfig;
  private ports!: Map<string, Port>;
  private root!: RecordCell;
  private borderSize!: Size;
  constructor(parent: Node, data: NodeData) {
    if (data.shape !== 'record') {
      throw new Error('Expect record shape');
    }
    super(parent);
    this.updateData(data);
  }
  public getConfig(): RecordNodeConfig | undefined {
    return this.config;
  }
  public getPorts(): Map<string, Port> | undefined {
    return this.ports;
  }
  public updateData(data: RecordNodeData) {
    const newConfig = Object.assign({}, RecordNodeType.defaultConfig, data);
    const contentNeedsUpdate = !this.config ||
      this.config.label !== newConfig.label ||
      this.config.direction !== newConfig.direction ||
      this.config.fontSize !== newConfig.fontSize ||
      this.config.fontFamily !== newConfig.fontFamily ||
      this.config.lineHeight !== newConfig.lineHeight ||
      this.config.padding !== newConfig.padding;
    const borderNeedsUpdate = contentNeedsUpdate ||
      this.config.strokeWidth !== newConfig.strokeWidth;
    this.config = newConfig;
    if (contentNeedsUpdate) {
      const record = recordParser(data.label);
      this.ports = new Map();
      this.root = new RecordCell(this.parent.root, this.parent, this,
        record, this.config.direction === 'horizontal');
      const rootCellSize = this.root.getCellSize()!;
      this.root.updateCellSize(rootCellSize.width, rootCellSize.height);
    }
    if (borderNeedsUpdate) {
      const rootCellSize = this.root.getCellSize()!;
      this.borderSize = {
        width: rootCellSize.width + this.config.strokeWidth,
        height: rootCellSize.height + this.config.strokeWidth,
      };
    }
  }
  public render(): AnyShape[] {
    return this.root.render();
  }
  public findPort(id: string[]): Port | null {
    if (id.length === 1) {
      const founded = this.ports.get(id[0]);
      if (founded) {
        return founded;
      }
      return null;
    }
    return null;
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
