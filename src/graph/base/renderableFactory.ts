import Root from '@/graph/Root';
import Edge from '@/graph/edge/Edge';
import Graph from '@/graph/graph/Graph';
import Node from '@/graph/node/Node';
import {RenderableData} from '@/graph/base/data';
import Renderable from '@/graph/base/Renderable';
import Positioned from '@/graph/base/Positioned';

interface RenderableConstructor {
  new (root: Root, parent: Positioned | null): Renderable;
  getId(data: RenderableData): string;
}

export default function renderableFactory(data: RenderableData)
    : RenderableConstructor {
  switch (data.type) {
    case 'node':
      return Node;
    case 'edge':
      return Edge;
    case 'graph':
      return Graph;
    default:
      throw new Error('Unknown renderable object');
  }
}
