import Graph from '@/graph/graph/Graph';
import Positioned from '@/graph/base/Positioned';
import {Size} from '@/graph/base/data';

export default abstract class GraphLayout extends Positioned {
  protected readonly graph: Graph;
  protected constructor(graph: Graph) {
    super(graph);
    this.graph = graph;
  }
  public abstract solve(data: object | undefined): void;
  public abstract render(): object;
  public abstract getContentSize(): Size | undefined;
}
