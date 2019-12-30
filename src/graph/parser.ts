import {
  EdgeData,
  GraphData,
  KamadaKawaiGraphLayoutData,
  LinearComponentLayoutData,
  NodeData,
  RenderableData,
} from '@/graph/base/dataInput';
import DotScanner from '@/graph/dot/DotScanner';
import DotParser from '@/graph/dot/DotParser';
import {
  xdotShapeAttrPass,
  xdotReverseY,
  xdotToRenderablePass,
  xdotComputedAttrPass,
  xdotBoundingBoxPass,
  xdotMovePass,
} from '@/graph/dot/passes';
import {DotGraph, DotNode, DotSubgraph} from '@/graph/base/dataXdot';

const alnumChars: string = '0123456789' +
  'abcdefghijklmnopqrstuvwxyz' +
  'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

function randomAlnumString(length: number): string {
  let result = '';
  for (let i = 0; i < length; ++i) {
    result += alnumChars[Math.floor(Math.random() * alnumChars.length)];
  }
  return result;
}

function generateId(): string {
  return randomAlnumString(16);
}

function unescapeString(str: string): string {
  str = str.replace(/\\n/g, '\n');
  str = str.replace(/\\r/g, '\r');
  str = str.replace(/\\t/g, '\t');
  str = str.replace(/\\'/g, '\'');
  str = str.replace(/\\"/g, '\"');
  str = str.replace(/&gamma;/g, 'γ');
  return str;
}

function normalizeColor(color: string): string {
  let end = color.length - 1;
  while (end >= 0 && (color[end] >= '0' && color[end] <= '9')) {
    --end;
  }
  return color.slice(0, end + 1);
}

export interface GraphParserConfig {
  preferredEdgeDirection?: number | 'any';
}

export const graphParsers
  : { [input: string]: (input: string, config?: GraphParserConfig) =>
    RenderableData } = {
  json(input: string): RenderableData {
    return JSON.parse(input);
  },
  graphviz(input: string, config?: GraphParserConfig): RenderableData {
    const dotScanner = new DotScanner();
    const dotParser = new DotParser(dotScanner.scan(input));
    const graph = dotParser.parse();
    xdotComputedAttrPass(graph);

    function parseNode(data: DotNode): NodeData {
      const result: NodeData = {
        type: 'node',
        shape: 'box',
        id: generateId(),
        label: data.id.id,
      };
      if (data.id) {
        result.id = data.id.id;
      }
      if (data.computedAttrs) {
        if (data.computedAttrs.label) {
          result.label = data.computedAttrs.label;
        }
        if (data.computedAttrs.style) {
          result.style = data.computedAttrs.style as any;
        }
        if (data.computedAttrs.color) {
          result.strokeColor = normalizeColor(data.computedAttrs.color as any);
        }
        if (data.computedAttrs.fillcolor) {
          result.fillColor = normalizeColor(
            data.computedAttrs.fillcolor as any);
        }
        if (data.computedAttrs.shape) {
          const shape = data.computedAttrs.shape as any;
          result.shape = shape === 'none' ? 'table' : shape;
        }
      }
      return result;
    }

    function parseGraph(data: DotGraph | DotSubgraph): GraphData {
      let recordHorizontal = true;
      const result: GraphData = {
        type: 'graph',
        shape: 'box',
        id: generateId(),
        component: {
          type: 'linear',
          direction: 'TD',
        },
        layout: {
          type: 'KamadaKawai',
          preferredEdgeDirection: 90,
        },
        physics: {
          type: 'BarnesHut',
        },
        children: [],
      };
      if (config && config.preferredEdgeDirection !== undefined) {
        (result.layout as KamadaKawaiGraphLayoutData).preferredEdgeDirection =
          config.preferredEdgeDirection;
      }
      if (data.id) {
        result.id = data.id;
      }
      if (data.computedAttrs) {
        if (data.computedAttrs.label) {
          result.label = data.computedAttrs.label;
        }
        if (data.computedAttrs.rankdir) {
          const rankdir = data.computedAttrs.rankdir;
          (result.component as LinearComponentLayoutData)
            .direction = ({
            LR: 'LR',
            TB: 'TD',
            RL: 'RL',
            BT: 'DT',
          } as { [dir: string]: string })[rankdir as string] as any;
          (result.layout as KamadaKawaiGraphLayoutData)
            .preferredEdgeDirection = ({
            LR: 0,
            TB: 90,
            RL: 180,
            BT: 279,
          } as { [dir: string]: number })[rankdir as string];
          recordHorizontal = !(rankdir === 'LR' || rankdir === 'RL');
        }
        if (data.id && data.id.startsWith('cluster')) {
          if (data.computedAttrs.style) {
            result.style = data.computedAttrs.style as any;
          }
          if (data.computedAttrs.color) {
            result.strokeColor = normalizeColor(data.computedAttrs.color as any);
          }
          if (data.computedAttrs.fillcolor) {
            result.fillColor = normalizeColor(
              data.computedAttrs.fillcolor as any);
          }
        }
      }
      if (data.entities) {
        for (const child of data.entities) {
          switch (child.type) {
            case 'node': {
              const element = parseNode(child);
              if (element.shape === 'record') {
                element.direction = recordHorizontal ? 'horizontal' :
                  'vertical';
              }
              result.children!.push(element);
              break;
            }
            case 'edge': {
              const element: EdgeData = {
                type: 'edge',
                shape: 'quadratic',
                id: generateId(),
                from: child.from.id + (child.from.port ?
                  ':' + child.from.port : ''),
                to: child.to.id + (child.to.port ?
                  ':' + child.to.port : ''),
              };
              // TODO: edge attributes
              result.children!.push(element);
              break;
            }
            case 'subgraph':
              result.children!.push(parseGraph(child));
              break;
            default:
              throw new Error(`Unknown child type`);
          }
        }
      }
      return result;
    }
    return parseGraph(graph);
  },
  xdot(input: string, config?: GraphParserConfig) {
    const dotScanner = new DotScanner();
    const dotParser = new DotParser(dotScanner.scan(input));
    const graph = dotParser.parse();
    xdotComputedAttrPass(graph);
    xdotShapeAttrPass(graph);
    xdotBoundingBoxPass(graph);
    xdotReverseY(graph);
    if (graph.boundingBox) {
      const deltaX = -0.5 * (graph.boundingBox[0] + graph.boundingBox[2]);
      const deltaY = -0.5 * (graph.boundingBox[1] + graph.boundingBox[3]);
      xdotMovePass(graph, deltaX, deltaY);
    }
    return xdotToRenderablePass(graph);
  },
};
