import GraphPhysics from '@/graph/graph/physics/GraphPhysics';
import {LayoutData} from '@/graph/graph/layout/GraphLayout';
import {NoneGraphPhysicsData} from '@/graph/base/dataInput';

export default class NoneGraphPhysics extends GraphPhysics {
  public solve(config: NoneGraphPhysicsData | undefined,
               data: LayoutData): void {
    // do nothing
  }
  public step(): boolean {
    return false;
  }
}
