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
import {globalGraphRoot} from '@/graph/Root';

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
  edgeType?: 'straight' | 'quadratic';
  initialLayout?: 'none' | 'kamadaKawai';
  physicsLayout?: 'none' | 'BarnesHut';
  componentLayout?: 'default' | 'linearLR' | 'linearRL'
    | 'linearTD' | 'linearDT';
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
        result.id = unescapeString(data.id.id);
      }
      if (data.computedAttrs) {
        if (data.computedAttrs.label !== undefined) {
          result.label = unescapeString(data.computedAttrs.label);
        }
        if (data.computedAttrs.style !== undefined) {
          result.style = data.computedAttrs.style as any;
        }
        if (data.computedAttrs.color !== undefined) {
          result.strokeColor = normalizeColor(data.computedAttrs.color as any);
        }
        if (data.computedAttrs.fillcolor !== undefined) {
          result.fillColor = normalizeColor(
            data.computedAttrs.fillcolor as any);
        }
        if (data.computedAttrs.shape !== undefined) {
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
        layout: config && config.initialLayout === 'none' ? {
          type: 'none',
        } : {
          type: 'KamadaKawai',
          preferredEdgeDirection: 90,
        },
        physics: {
          type: (config && config.physicsLayout) || 'BarnesHut',
        },
        children: [],
      };
      if (data.id) {
        result.id = data.id;
      }
      if (data.computedAttrs) {
        if (data.computedAttrs.label !== undefined) {
          result.label = unescapeString(data.computedAttrs.label);
        }
        if (data.computedAttrs.rankdir !== undefined) {
          const rankdir = data.computedAttrs.rankdir;
          if (result.component && result.component.type === 'linear') {
            result.component.direction = ({
              LR: 'TD',
              TB: 'LR',
              RL: 'TD',
              BT: 'LR',
            } as { [dir: string]: string })[rankdir as string] as any;
          }
          if (result.layout && result.layout.type === 'KamadaKawai') {
            result.layout.preferredEdgeDirection = ({
              LR: 0,
              TB: 90,
              RL: 180,
              BT: 279,
            } as { [dir: string]: number })[rankdir as string];
            recordHorizontal = !(rankdir === 'LR' || rankdir === 'RL');
          }
        }
        if (data.id && data.id.startsWith('cluster')) {
          if (data.computedAttrs.style !== undefined) {
            result.style = data.computedAttrs.style as any;
          }
          if (data.computedAttrs.color !== undefined) {
            result.strokeColor = normalizeColor(data.computedAttrs.color as any);
          }
          if (data.computedAttrs.fillcolor !== undefined) {
            result.fillColor = normalizeColor(
              data.computedAttrs.fillcolor as any);
          }
        }
      }
      if (config && config.preferredEdgeDirection !== undefined &&
        result.layout && result.layout.type === 'KamadaKawai') {
        result.layout.preferredEdgeDirection =
          config.preferredEdgeDirection;
      }

      if (config && config.componentLayout !== undefined &&
        config.componentLayout !== 'default' &&
        result.component && result.component.type === 'linear') {
        (result.component as LinearComponentLayoutData)
          .direction = ({
          linearLR: 'LR',
          linearRL: 'RL',
          linearTD: 'TD',
          linearDT: 'DT',
        } as any)[config.componentLayout];
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
                shape: (config && config.edgeType) || 'quadratic',
                id: generateId(),
                from: child.from.id + (child.from.port ?
                  ':' + child.from.port : ''),
                to: child.to.id + (child.to.port ?
                  ':' + child.to.port : ''),
              };
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
    xdotBoundingBoxPass(graph, globalGraphRoot.ctx);
    xdotReverseY(graph);
    if (graph.boundingBox) {
      const deltaX = -0.5 * (graph.boundingBox[0] + graph.boundingBox[2]);
      const deltaY = -0.5 * (graph.boundingBox[1] + graph.boundingBox[3]);
      xdotMovePass(graph, deltaX, deltaY);
    }
    return xdotToRenderablePass(graph);
  },
};
