import stdThreadJoinGv from '!raw-loader!./examples/stdThreadJoin.gv';
import stdThreadJoinJson from '!raw-loader!./examples/stdThreadJoin.txt';
import recordJson from '!raw-loader!./examples/record.txt';
import subgraphJson from '!raw-loader!./examples/subgraph.txt';
import icosahedronJson from '!raw-loader!./examples/icosahedron.txt';
import tableJson from '!raw-loader!./examples/table.txt';
import edgeJson from '!raw-loader!./examples/edge.txt';
import stdThreadJoinXdot from '!raw-loader!./examples/stdThreadJoin.xdot.txt';

interface Example {
  name: string;
  parser: string;
  content: string;
}

export const graphExamples: Example[] = [
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
  {
    name: 'stdThreadJoinXdot',
    parser: 'xdot',
    content: stdThreadJoinXdot,
  },
];
