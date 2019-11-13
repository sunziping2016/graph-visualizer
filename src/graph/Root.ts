import EventEmitter from '@/graph/base/EventEmitter';
import { RenderableData } from '@/graph/base/dataInput';
import renderableFactory from '@/graph/base/renderableFactory';

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
      return port;
    });
  }
  public clearFixed() {
    for (const port of this.fixed) {
      port.fixed = false;
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
    port.getPosition().x += delta.deltaX;
    port.getPosition().y += delta.deltaY;
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
      this.emit('render', [this.child.render()]);
    }
  }
}

export const globalRoot = new Root();
// @ts-ignore
window.globalRoot = globalRoot;
export const globalParsers
    : { [input: string]: (input: string) => RenderableData } = {
  json(input: string): RenderableData { return JSON.parse(input); },
  graphviz(/* input: string */): RenderableData { throw new Error('Not implemented'); },
};

// Examples
import stdThreadJoinGv from '!raw-loader!./examples/stdThreadJoin.gv';
import stdThreadJoinJson from '!raw-loader!./examples/stdThreadJoin.txt';
import recordJson from '!raw-loader!./examples/record.txt';
import subgraphJson from '!raw-loader!./examples/subgraph.txt';
import icosahedronJson from '!raw-loader!./examples/icosahedron.txt';
import tableJson from '!raw-loader!./examples/table.txt';
import edgeJson from '!raw-loader!./examples/edge.txt';
import Renderable from '@/graph/base/Renderable';
import Port from '@/graph/base/Port';
import Graph from '@/graph/graph/Graph';
import Node from '@/graph/node/Node';

interface Example {
  name: string;
  parser: string;
  content: string;
}

export const globalExamples: Example[] = [
  {
    name: 'stdThreadJoinGv',
    parser: 'graphviz',
    content: stdThreadJoinGv,
  },
  {
    name: 'stdThreadJoinJson',
    parser: 'json',
    content: stdThreadJoinJson,
  },
  {
    name: 'record',
    parser: 'json',
    content: recordJson,
  },
  {
    name: 'subgraph',
    parser: 'json',
    content: subgraphJson,
  },
  {
    name: 'icosahedronJson',
    parser: 'json',
    content: icosahedronJson,
  },
  {
    name: 'table',
    parser: 'json',
    content: tableJson,
  },
  {
    name: 'edge',
    parser: 'json',
    content: edgeJson,
  },
];
