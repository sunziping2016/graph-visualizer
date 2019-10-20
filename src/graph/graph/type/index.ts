import BoxGraphType from '@/graph/graph/type/BoxGraphType';
import GraphType from '@/graph/graph/type/GraphType';
import Graph from '@/graph/graph/Graph';
import GraphLayout from '@/graph/graph/layout/GraphLayout';
import {GraphData} from '@/graph/base/data';

// noinspection JSUnusedLocalSymbols
export default function graphTypeFactory(data: GraphData)
    : new (parent: Graph, layout: GraphLayout) => GraphType {
  return BoxGraphType;
}
