import Graph from '@/graph/graph/Graph';
import GraphLayout from '@/graph/graph/layout/GraphLayout';
import {GraphData, Size} from '@/graph/base/data';

export default abstract class GraphType {
  protected parent: Graph;
  protected layout: GraphLayout;
  protected constructor(parent: Graph, layout: GraphLayout) {
    this.parent = parent;
    this.layout = layout;
  }
  public abstract setData(data: GraphData): void;
  public abstract render(): void;
  public abstract getBoundingBoxSize(): Size;
  public abstract distanceToBorder(angle: number): number;
}
