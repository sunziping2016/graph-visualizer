import Graph from '@/graph/graph/Graph';
import Positioned from '@/graph/base/Positioned';
import {GraphLayoutData, Size} from '@/graph/base/data';
import Port from '@/graph/base/Port';
import Edge from '@/graph/edge/Edge';
import Renderable from '@/graph/base/Renderable';

export interface LayoutEdgeData {
  from: Port;
  to: Port;
  fromBelonging: Port;
  toBelonging: Port;
  edge: Edge;
}

export interface LayoutData {
  ports: Port[];
  edges: LayoutEdgeData[];
  children: Renderable[];
}

export default abstract class GraphLayout extends Positioned {
  protected readonly graph: Graph;
  protected constructor(graph: Graph, parent: Positioned | null) {
    super(parent);
    this.graph = graph;
  }
  public abstract solve(config: GraphLayoutData | undefined,
                        data: LayoutData,
                        index: number): void;
  public abstract render(): object;
  public abstract getContentSize(): Size | undefined;
}
