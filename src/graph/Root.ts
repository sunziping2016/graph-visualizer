import EventEmitter from '@/graph/base/EventEmitter';
import { RenderableData } from '@/graph/base/data';
import renderableFactory from '@/graph/base/renderableFactory';

export default class Root extends EventEmitter {
  public ctx: CanvasRenderingContext2D;
  public child: Renderable | null;
  public stepTimer: number;
  public constructor() {
    super();
    this.ctx = document.createElement('canvas').getContext('2d')!;
    this.child = null;
    this.stepTimer = setInterval(() => {
      if (this.child instanceof Graph) {
        if (this.child.step()) {
          this.refresh();
        }
      }
    }, 1000 / 60);
  }
  public findPort(id: string[]) {
    // noinspection SuspiciousTypeOfGuard
    if (this.child instanceof Port) {
      return this.child.findPort(id);
    }
    return null;
  }
  public setData(data: RenderableData) {
    const newClass = renderableFactory(data);
    if (this.child === null || this.child.constructor !== newClass) {
      this.child = new newClass(this, null, null);
    }
    this.child!.setData(data);
    this.refresh();
  }
  public redraw(data: RenderableData) {
    this.child = new (renderableFactory(data))(this, null, null);
    this.child.setData(data);
    this.refresh();
  }
  public moveDraggable(fullId: string,
                       delta: { deltaX: number, deltaY: number }) {
    const id = fullId.split(':');
    // noinspection SuspiciousTypeOfGuard
    if (this.child instanceof Port) {
      if (this.child.id !== id[0]) {
        return null;
      }
      const element = this.findPort(id.slice(1));
      if (element !== null) {
        element.getPosition().x += delta.deltaX;
        element.getPosition().y += delta.deltaY;
        this.refresh();
      }
    }
  }
  public refresh() {
    this.emit('render', [{
      key: 'main',
      children: [
        this.child!.render(),
      ],
    }]);
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
import subGraphJson from '!raw-loader!./examples/subgraph.txt';
import icosahedronJson from '!raw-loader!./examples/icosahedron.txt';
import tableJson from '!raw-loader!./examples/table.txt';
import edgeJson from '!raw-loader!./examples/edge.txt';
import Renderable from '@/graph/base/Renderable';
import Port from '@/graph/base/Port';
import Graph from '@/graph/graph/Graph';

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
    name: 'subGraph',
    parser: 'json',
    content: subGraphJson,
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
