import XDotAttrParser from '@/graph/dot/XDotAttrParser';
import {DotElement, DotGraph, DotSubgraph} from '@/graph/base/dataXdot';
import {RenderableData} from '@/graph/base/dataInput';

export function xdotComputedAttrPass(graph: DotGraph) {
  function traversal(element: DotElement,
                     graphAttrs: { [attr: string]: string },
                     nodeAttrs: { [attr: string]: string },
                     edgeAttrs: { [attr: string]: string }) {
    switch (element.type) {
      case 'graph':
      case 'subgraph': {
        const newGraphAttrs = Object.assign({}, graphAttrs);
        const newNodeAttrs = Object.assign({}, nodeAttrs);
        const newEdgeAttrs = Object.assign({}, edgeAttrs);
        element.entities = [];
        for (const child of element.children) {
          switch (child.type) {
            case 'graphAttr':
              Object.assign(newGraphAttrs, child.attrs);
              break;
            case 'nodeAttr':
              Object.assign(newNodeAttrs, child.attrs);
              break;
            case 'edgeAttr':
              Object.assign(newEdgeAttrs, child.attrs);
              break;
            default:
              element.entities.push(child);
              traversal(child, newGraphAttrs, newNodeAttrs, newEdgeAttrs);
              break;
          }
        }
        element.computedAttrs = newGraphAttrs;
        break;
      }
      case 'node':
      case 'edge':
        element.computedAttrs = Object.assign({}, nodeAttrs, element.attrs);
        break;
      default:
        throw new Error('Should not reach here');
    }
  }
  traversal(graph, {}, {}, {});
}

export function xdotShapeAttrPass(graph: DotGraph) {
  function traversal(element: DotElement) {
    switch (element.type) {
      case 'graph':
      case 'subgraph':
        if (element.computedAttrs) {
          for (const attr of ['_draw_', '_ldraw_']) {
            if (element.computedAttrs[attr]) {
              const parser = new XDotAttrParser(element.computedAttrs[attr]);
              const newShapes = parser.parse();
              element.shapes = element.shapes || {};
              element.shapes[attr] = newShapes;
            }
          }
        }
        if (element.entities) {
          for (const child of element.entities) {
            traversal(child);
          }
        }
        break;
      case 'node':
        if (element.computedAttrs) {
          for (const attr of ['_draw_', '_ldraw_']) {
            if (element.computedAttrs[attr]) {
              const parser = new XDotAttrParser(element.computedAttrs[attr]);
              const newShapes = parser.parse();
              element.shapes = element.shapes || {};
              element.shapes[attr] = newShapes;
            }
          }
        }
        break;
      case 'edge':
        if (element.computedAttrs) {
          for (const attr of ['_draw_', '_ldraw_', '_hdraw_', '_tdraw_',
            '_hldraw_', '_tldraw_']) {
            if (element.computedAttrs[attr]) {
              const parser = new XDotAttrParser(element.computedAttrs[attr]);
              const newShapes = parser.parse();
              element.shapes = element.shapes || {};
              element.shapes[attr] = newShapes;
            }
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
    if ((element.type === 'graph' || element.type === 'subgraph')
        && element.boundingBox) {
      element.boundingBox = [
        element.boundingBox[0],
        -element.boundingBox[3],
        element.boundingBox[2],
        -element.boundingBox[1],
      ];
    }
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
    if ((element.type === 'graph' || element.type === 'subgraph')
        && element.entities) {
      element.entities.forEach((child) => {
        convert(child);
      });
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
          attrs: element.computedAttrs || {},
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
          attrs: element.computedAttrs || {},
          shapes: element.shapes,
        };
      case 'graph':
        return {
          type: 'graph',
          id: element.id || '',
          shape: 'xdot',
          strict: element.strict,
          directed: element.directed,
          children: (element.entities || []).map((x) => convert(x)),
          layout: { type: 'none' },
          physics: { type: 'none' },
          component: { type: 'none' },
          attrs: element.computedAttrs || {},
          shapes: element.shapes,
          boundingBox: element.boundingBox,
        };
      case 'subgraph':
        return {
          type: 'graph',
          id: element.id || '',
          shape: 'xdot',
          children: (element.entities || []).map((x) => convert(x)),
          layout: { type: 'none' },
          physics: { type: 'none' },
          component: { type: 'none' },
          attrs: element.computedAttrs || {},
          shapes: element.shapes,
          boundingBox: element.boundingBox,
        };
      default:
        throw new Error('Should not reach here');
    }
  }
  return convert(graph);
}

export function xdotBoundingBoxPass(graph: DotGraph) {
  function traversal(element: DotGraph | DotSubgraph) {
    if (element.computedAttrs && element.computedAttrs.bb) {
      element.boundingBox = element.computedAttrs.bb.split(',')
        .map((x) => parseInt(x, 10)) as any;
      if (element.entities) {
        for (const child of element.entities) {
          if (child.type === 'subgraph') {
            traversal(child);
          }
        }
      }
    }
  }
  traversal(graph);
}

export function xdotMovePass(graph: DotGraph, deltaX: number, deltaY: number) {

  function convert(element: DotElement) {
    if ((element.type === 'graph' || element.type === 'subgraph')
      && element.boundingBox) {
      element.boundingBox = [
        element.boundingBox[0] + deltaX,
        element.boundingBox[1] + deltaY,
        element.boundingBox[2] + deltaX,
        element.boundingBox[3] + deltaY,
      ];
    }
    if (element.shapes) {
      Object.keys(element.shapes).forEach((draw) => {
        const shapes = element.shapes![draw];
        shapes.forEach((shape) => {
          switch (shape.type) {
            case 'text':
            case 'ellipse':
            case 'image':
              shape.x += deltaX;
              shape.y += deltaY;
              break;
            case 'bezier':
            case 'line':
            case 'polygon':
              shape.points.forEach((point) => {
                point[0] += deltaX;
                point[1] += deltaY;
              });
              break;
            default:
              throw new Error('Should not reach here');
          }
        });
      });
    }
    if ((element.type === 'graph' || element.type === 'subgraph')
      && element.entities) {
      element.entities.forEach((child) => {
        convert(child);
      });
    }
  }
  convert(graph);
}
