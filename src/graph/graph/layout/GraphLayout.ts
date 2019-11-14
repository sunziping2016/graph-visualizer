import Graph from '@/graph/graph/Graph';
import Positioned from '@/graph/base/Positioned';
import {GraphLayoutData, Size} from '@/graph/base/dataInput';
import Port from '@/graph/base/Port';
import Edge from '@/graph/edge/Edge';
import Renderable from '@/graph/base/Renderable';
import {AnyShape} from '@/graph/base/dataOutput';
import Node from '@/graph/node/Node';

export interface LayoutEdgeData {
  from: Port;
  to: Port;
  fromBelonging: Node | Graph;
  toBelonging: Node | Graph;
  edge: Edge;
}

export interface LayoutData {
  ports: Array<Node | Graph>;
  edges: LayoutEdgeData[];
  children: Renderable[];
}

export default abstract class GraphLayout extends Positioned {
  protected readonly graph: Graph;
  protected data: LayoutData;
  protected constructor(graph: Graph, parent: Positioned | null) {
    super(parent);
    this.graph = graph;
    this.data = {
      ports: [],
      edges: [],
      children: [],
    };
  }
  public solve(config: GraphLayoutData | undefined,
               data: LayoutData,
               index: number): void {
    this.data = data;
  }
  public informAllEdgesFullyUpdatePosition() {
    if (this.data) {
      for (const edge of this.data.edges) {
        edge.edge.fullyUpdatePosition();
      }
    }
  }
  public abstract render(): AnyShape;
  public abstract getContentSize(): Size;
}
