import stdThreadJoinGv from '!raw-loader!./examples/stdThreadJoin.gv';
import stdThreadJoinJson from '!raw-loader!./examples/stdThreadJoin.txt';
import recordJson from '!raw-loader!./examples/record.txt';
import subgraphJson from '!raw-loader!./examples/subgraph.txt';
import icosahedronGv from '!raw-loader!./examples/icosahedron.txt';
import tableJson from '!raw-loader!./examples/table.txt';
import edgeGv from '!raw-loader!./examples/edge.txt';
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
    name: 'icosahedronGv',
    parser: 'graphviz',
    content: icosahedronGv,
  },
  {
    name: 'table',
    parser: 'json',
    content: tableJson,
  },
  {
    name: 'edgeGv',
    parser: 'graphviz',
    content: edgeGv,
  },
  {
    name: 'stdThreadJoinXdot',
    parser: 'xdot',
    content: stdThreadJoinXdot,
  },
];
