import XDotAttrParser from '@/graph/dot/XDotAttrParser';
import {DotElement, DotGraph} from '@/graph/base/dataXdot';
import {RenderableData} from '@/graph/base/dataInput';

export function xdotAttrPass(graph: DotGraph) {
  function traversal(element: DotElement) {
    switch (element.type) {
      case 'graph':
      case 'subgraph':
        for (const attr of ['_draw_', '_ldraw_']) {
          if (element.attrs[attr]) {
            const parser = new XDotAttrParser(element.attrs[attr]);
            const newShapes = parser.parse();
            element.shapes = element.shapes || {};
            element.shapes[attr] = newShapes;
          }
        }
        for (const child of element.children) {
          traversal(child);
        }
        break;
      case 'node':
        for (const attr of ['_draw_', '_ldraw_']) {
          if (element.attrs[attr]) {
            const parser = new XDotAttrParser(element.attrs[attr]);
            const newShapes = parser.parse();
            element.shapes = element.shapes || {};
            element.shapes[attr] = newShapes;
          }
        }
        break;
      case 'edge':
        for (const attr of ['_draw_', '_ldraw_', '_hdraw_', '_tdraw_',
                            '_hldraw_', '_tldraw_']) {
          if (element.attrs[attr]) {
            const parser = new XDotAttrParser(element.attrs[attr]);
            const newShapes = parser.parse();
            element.shapes = element.shapes || {};
            element.shapes[attr] = newShapes;
          }
        }
        break;
      default:
        throw new Error('Should not reach here');
    }
  }
  traversal(graph);
}

export function xdotReverseY(graph: DotGraph) {
  function convert(element: DotElement) {
    if (element.shapes) {
      Object.keys(element.shapes).forEach((draw) => {
        const shapes = element.shapes![draw];
        shapes.forEach((shape) => {
          switch (shape.type) {
            case 'text':
            case 'ellipse':
            case 'image':
              shape.y *= -1;
              break;
            case 'bezier':
            case 'line':
            case 'polygon':
              shape.points.forEach((point) => point[1] *= -1);
              break;
            default:
              throw new Error('Should not reach here');
          }
        });
      });
    }
    if (element.type === 'graph' || element.type === 'subgraph') {
      element.children.forEach((child) => convert(child));
    }
  }
  convert(graph);
}

export function xdotToRenderablePass(graph: DotGraph): RenderableData {
  function convert(element: DotElement): RenderableData {
    switch (element.type) {
      case 'node':
        return {
          type: 'node',
          shape: 'xdot',
          id: element.id.id,
          xdotId: element.id,
          attrs: element.attrs,
          shapes: element.shapes,
        };
      case 'edge':
        return {
          type: 'edge',
          shape: 'xdot',
          from: element.from.port ? `${element.from.id}:${element.from.port}` :
            element.from.id,
          to: element.to.port ? `${element.to.id}:${element.to.port}` :
            element.to.id,
          xdotFrom: element.from,
          xdotTo: element.to,
          attrs: element.attrs,
          shapes: element.shapes,
        };
      case 'graph':
        return {
          type: 'graph',
          id: element.id || '',
          shape: 'xdot',
          strict: element.strict,
          directed: element.directed,
          children: element.children.map((x) => convert(x)),
          layout: { type: 'none' },
          physics: { type: 'none' },
          component: { type: 'none' },
          attrs: element.attrs,
          nodeAttrs: element.nodeAttrs,
          edgeAttrs: element.edgeAttrs,
          shapes: element.shapes,
        };
      case 'subgraph':
        return {
          type: 'graph',
          id: element.id || '',
          shape: 'xdot',
          children: element.children.map((x) => convert(x)),
          layout: { type: 'none' },
          physics: { type: 'none' },
          component: { type: 'none' },
          attrs: element.attrs,
          nodeAttrs: element.nodeAttrs,
          edgeAttrs: element.edgeAttrs,
          shapes: element.shapes,
        };
      default:
        throw new Error('Should not reach here');
    }
  }
  return convert(graph);
}
