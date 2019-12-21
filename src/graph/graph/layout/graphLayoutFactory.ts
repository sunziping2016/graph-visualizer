import KamadaKawaiGraphLayout from './KamadaKawaiGraphLayout';
import {GraphLayoutData} from '@/graph/base/dataInput';
import GraphLayout from '@/graph/graph/layout/GraphLayout';
import Graph from '@/graph/graph/Graph';
import Positioned from '@/graph/base/Positioned';
import NoneGraphLayout from '@/graph/graph/layout/NoneGraphLayout';

export default function layoutFactory(data: GraphLayoutData | undefined)
    : new (graph: Graph, parent: Positioned | null) => GraphLayout {
  switch (data && data.type) {
    case 'none':
      return NoneGraphLayout;
    default:
      return KamadaKawaiGraphLayout;
  }
}
