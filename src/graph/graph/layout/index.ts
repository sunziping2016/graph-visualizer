import KamadaKawaiGraphLayout from './KamadaKawaiGraphLayout';
import {GraphLayoutData} from '@/graph/base/data';
import GraphLayout from '@/graph/graph/layout/GraphLayout';
import Graph from '@/graph/graph/Graph';

export default function layoutFactory(data: GraphLayoutData | undefined)
    : new (graph: Graph) => GraphLayout {
  switch (data && data.type) {
    default:
      return KamadaKawaiGraphLayout;
  }
}
