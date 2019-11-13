import Graph from '@/graph/graph/Graph';
import {GraphPhysicsData} from '@/graph/base/dataInput';
import GraphLayout, {LayoutData} from '@/graph/graph/layout/GraphLayout';

export default abstract class GraphPhysics {
  protected readonly graph: Graph;
  protected readonly layout: GraphLayout;
  public constructor(graph: Graph, layout: GraphLayout) {
    this.graph = graph;
    this.layout = layout;
  }
  public abstract solve(config: GraphPhysicsData | undefined,
                        data: LayoutData): void;
  public abstract step(): boolean;
}
