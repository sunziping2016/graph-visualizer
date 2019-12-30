import EventEmitter from '@/graph/base/EventEmitter';
import { RenderableData } from '@/graph/base/dataInput';
import renderableFactory from '@/graph/base/renderableFactory';
import Renderable from '@/graph/base/Renderable';
import Port from '@/graph/base/Port';
import Graph from '@/graph/graph/Graph';
import Node from '@/graph/node/Node';


export default class Root extends EventEmitter {
  public ctx: CanvasRenderingContext2D;
  public child: (Renderable & Port) | null;
  private stepTimer: number;
  private fixed: Set<string>;
  private selected: Set<string>;
  public constructor() {
    super();
    this.ctx = document.createElement('canvas').getContext('2d')!;
    this.child = null;
    this.stepTimer = setInterval(() => {
      if (this.child instanceof Graph) {
        if (this.child.step()) {
          this.informRender();
        }
      }
    }, 1000 / 60);
    this.fixed = new Set();
    this.selected = new Set();
  }
  public findPort(id: string) {
    const idArray = id.split(':');
    if (this.child) {
      if (this.child.id !== idArray[0]) {
        return null;
      }
      return this.child.findPort(idArray.slice(1));
    }
    return null;
  }
  public setFixed(fixed: string[]) {
    const newFixed = new Set(fixed);
    const removed = [...this.fixed].filter((x) => !newFixed.has(x));
    for (const item of removed) {
      const port = this.findPort(item);
      if (port === null) {
        throw new Error('Cannot find the port');
      }
      port.fixed = false;
    }
    const added = [...newFixed].filter((x) => !this.fixed.has(x));
    for (const item of added) {
      const port = this.findPort(item);
      if (port === null) {
        throw new Error('Cannot find the port');
      }
      port.fixed = true;
    }
    this.fixed = newFixed;
  }
  public setSelected(selected: string[]) {
    const newSelected = new Set(selected);
    let refresh = false;
    const removed = [...this.selected].filter((x) => !newSelected.has(x));
    for (const item of removed) {
      const port = this.findPort(item);
      if (port === null) {
        throw new Error('Cannot find the port');
      }
      refresh = port.onSelect(false) || refresh;
    }
    const added = [...newSelected].filter((x) => !this.selected.has(x));
    for (const item of added) {
      const port = this.findPort(item);
      if (port === null) {
        throw new Error('Cannot find the port');
      }
      refresh = port.onSelect(true) || refresh;
    }
    this.selected = newSelected;
    if (refresh) {
      this.informRender();
    }
  }
  public movePort(id: string,
                  delta: { deltaX: number, deltaY: number }) {
    const port = this.findPort(id);
    if (port === null) {
      throw new Error('Cannot find the port');
    }
    if (!(port instanceof Graph || port instanceof Node)) {
      throw new Error('Wrong type of port');
    }
    port.position.x += delta.deltaX;
    port.position.y += delta.deltaY;
    for (const edge of [...port.fromEdges, ...port.toEdges]) {
      edge.updatePosition();
    }
    this.informRender();
  }
  public updateData(data: RenderableData) {
    const newClass = renderableFactory(data);
    if (!this.child || this.child.constructor !== newClass) {
      const renderable = new newClass(this, null, null, data, null);
      // noinspection SuspiciousTypeOfGuard
      if (!(renderable instanceof Port)) {
        throw new Error('Root element must be renderable port');
      }
      this.child = renderable;
    } else {
      this.child.updateData(data, null);
    }
    this.informRender();
  }
  public fullyUpdateData(data: RenderableData) {
    const renderable = new (renderableFactory(data))(
      this, null, null, data, null);
    // noinspection SuspiciousTypeOfGuard
    if (!(renderable instanceof Port)) {
      throw new Error('Root element must be renderable port');
    }
    this.child = renderable;
    this.informRender();
  }
  public informRender() {
    if (this.child) {
      const data = [this.child.render()];
      Object.freeze(data);
      this.emit('render', data);
    }
  }
}

export const globalGraphRoot = new Root();
