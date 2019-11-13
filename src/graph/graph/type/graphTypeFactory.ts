import BoxGraphType from '@/graph/graph/type/BoxGraphType';
import GraphType from '@/graph/graph/type/GraphType';
import Graph from '@/graph/graph/Graph';
import {GraphData} from '@/graph/base/dataInput';

// noinspection JSUnusedLocalSymbols
export default function graphTypeFactory(data: GraphData)
    : new (parent: Graph, data: GraphData) => GraphType {
  data.shape = 'box';
  return BoxGraphType;
}
