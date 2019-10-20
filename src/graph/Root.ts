import EventEmitter from '@/graph/base/EventEmitter';
import { RenderableData } from '@/graph/base/data';
import renderableFactory from '@/graph/base/renderableFactory';

export default class Root extends EventEmitter {
  public ctx: CanvasRenderingContext2D = document.createElement('canvas')
    .getContext('2d')!;
  public child: Renderable | null = null;
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
      this.child = new newClass(this, null);
    }
    this.child!.setData(data);
    this.emit('render', [{
      key: 'main',
      children: [
        this.child!.render(),
      ],
    }]);
  }
  public redraw(data: RenderableData) {
    this.child = new (renderableFactory(data))(this, null);
    this.child.setData(data);
    this.emit('render', [{
      key: 'main',
      children: [
        this.child.render(),
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
import Renderable from '@/graph/base/Renderable';
import Port from '@/graph/base/Port';

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
];
