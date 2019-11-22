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
  private fixed: Port[];
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
    this.fixed = [];
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
    this.clearFixed();
    this.fixed = fixed.map((id) => {
      const port = this.findPort(id);
      if (port === null) {
        throw new Error('Cannot find the port');
      }
      if (!(port instanceof Graph || port instanceof Node)) {
        throw new Error('Wrong type of port');
      }
      port.fixed = true;
      return port;
    });
  }
  public clearFixed() {
    for (const port of this.fixed) {
      port.fixed = false;
    }
    this.fixed = [];
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
