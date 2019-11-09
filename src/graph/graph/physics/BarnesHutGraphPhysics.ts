import GraphPhysics from '@/graph/graph/physics/GraphPhysics';
import {BarnesHutGraphPhysicsData} from '@/graph/base/data';
import {LayoutData} from '@/graph/graph/layout/GraphLayout';

interface BarnesHutGraphPhysicsConfig {
  theta: number;
  gravitationalConstant: number;
  centralGravity: number;
  springLength: number;
  springConstant: number;
}

export default class BarnesHutGraphPhysics extends GraphPhysics {
  private static defaultConfig: BarnesHutGraphPhysicsConfig = {
    theta: 0.5,
    gravitationalConstant: -2000,
    centralGravity: 0.3,
    springLength: 95,
    springConstant: 0.04,
  };
  private config?: BarnesHutGraphPhysicsConfig;
  private layoutData?: LayoutData;
  public solve(config: BarnesHutGraphPhysicsData | undefined,
               data: LayoutData) {
    this.config = Object.assign({},
      BarnesHutGraphPhysics.defaultConfig, config);
    this.layoutData = data;
  }
  public step(): boolean {
    return false;
  }
}
