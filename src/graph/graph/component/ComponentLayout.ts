import Graph from '@/graph/graph/Graph';
import Positioned from '@/graph/base/Positioned';
import {ComponentLayoutData, Size} from '@/graph/base/data';

export default abstract class ComponentLayout extends Positioned {
  protected readonly graph: Graph;
  protected constructor(graph: Graph, parent: Positioned | null) {
    super(parent);
    this.graph = graph;
  }
  public abstract solve(config: ComponentLayoutData | undefined): void;
  public abstract render(): object;
  public abstract getContentSize(): Size | undefined;
}
