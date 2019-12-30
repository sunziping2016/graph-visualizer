import Graph from '@/graph/graph/Graph';
import Positioned from '@/graph/base/Positioned';
import {ComponentLayoutData, Size} from '@/graph/base/dataInput';
import {AnyShape} from '@/graph/base/dataOutput';

export default abstract class ComponentLayout extends Positioned {
  protected readonly graph: Graph;
  public constructor(graph: Graph, parent: Positioned | null) {
    super(parent);
    this.graph = graph;
  }
  public updateData(config: ComponentLayoutData | undefined): void {
    // do nothing
  }
  public render(): AnyShape {
    return {
      is: 'group',
      x: this.position.x,
      y: this.position.y,
      children: this.graph.layouts.map((x) => x.render()),
    };
  }
  public getContentSize(): Size {
    return {
      width: 0,
      height: 0,
    };
  }
}
