import {DotElement, DotGraph} from '@/graph/dot/DotParser';
import XDotAttrParser from '@/graph/dot/XDotAttrParser';

export function xdotAttrPass(graph: DotGraph) {
  function traversal(element: DotElement) {
    switch (element.type) {
      case 'graph':
      case 'subgraph':
        for (const attr of ['_draw_', '_ldraw_', '_hdraw_', '_tdraw_',
                            '_hldraw_', '_tldraw_']) {
          if (element.attrs[attr]) {
            const parser = new XDotAttrParser(element.attrs[attr]);
            const newShapes = parser.parse();
            element.shapes = element.shapes ?
              element.shapes.concat(newShapes) : newShapes;
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
            element.shapes = element.shapes ?
              element.shapes.concat(newShapes) : newShapes;
          }
        }
        break;
      case 'edge':
        for (const attr of ['_draw_', '_ldraw_', '_hdraw_', '_tdraw_',
                            '_hldraw_', '_tldraw_']) {
          if (element.attrs[attr]) {
            const parser = new XDotAttrParser(element.attrs[attr]);
            const newShapes = parser.parse();
            element.shapes = element.shapes ?
              element.shapes.concat(newShapes) : newShapes;
          }
        }
        break;
      default:
        throw new Error('Should not reach here');
    }
  }
  traversal(graph);
}
