import {
  EdgeData,
  GraphData,
  KamadaKawaiGraphLayoutData,
  LinearComponentLayoutData,
  NodeData,
  RenderableData,
} from '@/graph/base/dataInput';
import parser from 'dotparser';
import DotScanner from '@/graph/dot/DotScanner';
import DotParser from '@/graph/dot/DotParser';
import {xdotAttrPass, xdotReverseY, xdotToRenderablePass} from '@/graph/dot/passes';

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
    const ast = parser(input);
    if (!ast[0]) {
      throw new Error('Expect one root element');
    }
    // const directed = ast[0].type === 'digraph';
    function parseNode(data: any): NodeData {
      const result: NodeData = {
        type: 'node',
        shape: 'box',
        id: generateId(),
      };
      if (data.node_id) {
        result.id = data.node_id.id;
      }
      if (data.attr_list) {
        for (const attr of data.attr_list) {
          switch (attr.id) {
            case 'label':
              // noinspection SuspiciousTypeOfGuard
              if (typeof attr.eq === 'string') {
                result.label = unescapeString(attr.eq);
              } else {
                result.label = unescapeString(attr.eq.value);
              }
              break;
            case 'style':
              result.style = attr.eq;
              break;
            case 'color':
              result.strokeColor = normalizeColor(attr.eq);
              break;
            case 'fillcolor':
              result.fillColor = normalizeColor(attr.eq);
              break;
            case 'shape':
              result.shape = attr.eq === 'none' ? 'table' : attr.eq;
              break;
            case 'height':
              // ignore
              break;
            case 'width':
              // ignore
              break;
            default:
              throw new Error(`Unknown node attribute ${attr.id}`);
          }
        }
      }
      return result;
    }
    function parseGraph(data: any): GraphData {
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
      if (data.children) {
        for (const child of data.children) {
          switch (child.type) {
            case 'attr_stmt':
              if (child.attr_list) {
                for (const attr of child.attr_list) {
                  switch (attr.id) {
                    case 'label':
                      result.label = attr.eq;
                      break;
                    case 'rankdir':
                      (result.component as LinearComponentLayoutData)
                        .direction = ({
                        LR: 'LR',
                        TB: 'TD',
                        RL: 'RL',
                        BT: 'DT',
                      } as { [dir: string]: string })[attr.eq as string] as any;
                      (result.layout as KamadaKawaiGraphLayoutData)
                        .preferredEdgeDirection = ({
                        LR: 0,
                        TB: 90,
                        RL: 180,
                        BT: 279,
                      } as { [dir: string]: number })[attr.eq as string];
                      recordHorizontal = !(attr.eq === 'LR' ||
                        attr.eq === 'RL');
                      break;
                    case 'style':
                      result.style = attr.eq;
                      break;
                    case 'color':
                      result.strokeColor = normalizeColor(attr.eq);
                      break;
                    case 'fillcolor':
                      result.fillColor = normalizeColor(attr.eq);
                      break;
                    default:
                      throw new Error(`Unknown graph attribute ${attr.id}`);
                  }
                }
              }
              break;
            case 'node_stmt': {
              const element = parseNode(child);
              if (element.shape === 'record') {
                element.direction = recordHorizontal ? 'horizontal' :
                  'vertical';
              }
              result.children!.push(element);
              break;
            }
            case 'edge_stmt': {
              if (!child.edge_list || child.edge_list.length !== 2) {
                throw new Error('Edge must have two ends');
              }
              const element: EdgeData = {
                type: 'edge',
                shape: 'quadratic',
                id: generateId(),
                from: child.edge_list[0].id + (child.edge_list[0].port ?
                  ':' + child.edge_list[0].port.id : ''),
                to: child.edge_list[1].id + (child.edge_list[1].port ?
                  ':' + child.edge_list[1].port.id : ''),
              };
              // TODO: edge attributes
              result.children!.push(element);
              break;
            }
            case 'subgraph':
              result.children!.push(parseGraph(child));
              break;
            default:
              throw new Error(`Unknown child type ${child.type}`);
          }
        }
      }
      return result;
    }
    return parseGraph(ast[0]);
  },
  xdot(input: string, config?: GraphParserConfig) {
    const dotScanner = new DotScanner();
    const dotParser = new DotParser(dotScanner.scan(input));
    const graph = dotParser.parse();
    xdotAttrPass(graph);
    xdotReverseY(graph);
    // tslint:disable-next-line:no-console
    // console.log(graph);
    return xdotToRenderablePass(graph);
  },
};
