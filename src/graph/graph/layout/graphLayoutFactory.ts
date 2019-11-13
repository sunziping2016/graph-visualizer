import KamadaKawaiGraphLayout from './KamadaKawaiGraphLayout';
import {GraphLayoutData} from '@/graph/base/dataInput';
import GraphLayout from '@/graph/graph/layout/GraphLayout';
import Graph from '@/graph/graph/Graph';
import Positioned from '@/graph/base/Positioned';

export default function layoutFactory(data: GraphLayoutData | undefined)
    : new (graph: Graph, parent: Positioned | null) => GraphLayout {
  switch (data && data.type) {
    default:
      return KamadaKawaiGraphLayout;
  }
}
