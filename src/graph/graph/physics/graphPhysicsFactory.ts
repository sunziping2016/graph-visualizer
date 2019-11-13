import {GraphPhysicsData} from '@/graph/base/dataInput';
import Graph from '@/graph/graph/Graph';
import GraphPhysics from '@/graph/graph/physics/GraphPhysics';
import BarnesHutGraphPhysics from '@/graph/graph/physics/BarnesHutGraphPhysics';
import GraphLayout from '@/graph/graph/layout/GraphLayout';

export default function physicsFactory(data: GraphPhysicsData | undefined)
    : new (graph: Graph, layout: GraphLayout) => GraphPhysics {
  switch (data && data.type) {
    default:
      return BarnesHutGraphPhysics;
  }
}
