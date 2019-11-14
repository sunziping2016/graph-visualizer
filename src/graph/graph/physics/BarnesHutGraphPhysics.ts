import GraphPhysics from '@/graph/graph/physics/GraphPhysics';
import {BarnesHutGraphPhysicsData, Vector} from '@/graph/base/dataInput';
import GraphLayout, {LayoutData} from '@/graph/graph/layout/GraphLayout';
import Graph from '@/graph/graph/Graph';
import Positioned from '@/graph/base/Positioned';

interface BarnesHutGraphPhysicsConfig {
  theta: number;
  gravitationalConstant: number;
  centralGravity: number;
  springLength: number;
  springConstant: number;
  damping: number;
}

export default class BarnesHutGraphPhysics extends GraphPhysics {
  private static defaultConfig: BarnesHutGraphPhysicsConfig = {
    theta: 0.5,
    gravitationalConstant: -2000,
    centralGravity: 0.3,
    springLength: 150,
    springConstant: 0.04,
    damping: 0.09,
  };
  private config: BarnesHutGraphPhysicsConfig;
  private layoutData: LayoutData;
  private positionedToIndex: Map<Positioned, number>;
  private indexToPositioned: Positioned[];
  private forces: Vector[];
  private velocities: Vector[];
  public constructor(graph: Graph, layout: GraphLayout) {
    super(graph, layout);
    this.config = BarnesHutGraphPhysics.defaultConfig;
    this.layoutData = {
      ports: [],
      edges: [],
      children: [],
    };
    this.positionedToIndex = new Map();
    this.indexToPositioned = [];
    this.forces = [];
    this.velocities = [];
  }
  public solve(config: BarnesHutGraphPhysicsData | undefined,
               data: LayoutData) {
    this.config = Object.assign({},
      BarnesHutGraphPhysics.defaultConfig, config);
    this.layoutData = data;
    this.positionedToIndex = new Map();
    this.indexToPositioned = [];
    // Create Index
    let i = 0;
    for (; i < this.layoutData.ports.length; ++i) {
      this.positionedToIndex.set(this.layoutData.ports[i], i);
      this.indexToPositioned.push(this.layoutData.ports[i]);
    }
    for (const edge of this.layoutData.edges) {
      const controlPoints = edge.edge.getControlPoints();
      for (const point of controlPoints) {
        this.positionedToIndex.set(point, i);
        this.indexToPositioned.push(point);
        ++i;
      }
    }
    this.forces = [];
    this.velocities = [];
    for (i = 0; i < this.positionedToIndex.size; ++i) {
      this.forces.push({ x: 0, y: 0 });
      this.velocities.push({ x: 0, y: 0 });
    }
  }
  public step(): boolean {
    // Calculate node repulsive force
    if (this.indexToPositioned.length) {
      // Calculate bounding box
    }
    // Calculate spring force
    for (const force of this.forces) {
      force.x = 0;
      force.y = 0;
    }
    for (const edge of this.layoutData.edges) {
      if (edge.fromBelonging !== edge.toBelonging) {
        const items = [
          edge.fromBelonging,
          ...edge.edge.getControlPoints(),
          edge.toBelonging,
        ];
        for (let i = 0; i < items.length - 1; ++i) {
          const item1 = items[i];
          const item2 = items[i + 1];
          const edgeLength = this.config.springLength / (items.length - 1);
          const dx = item1.getPosition().x - item2.getPosition().x;
          const dy = item1.getPosition().y - item2.getPosition().y;
          const distance = Math.max(Math.sqrt(dx * dx + dy * dy), 0.01);
          const springForce = this.config.springConstant *
            (edgeLength - distance) / distance;
          const fx = dx * springForce;
          const fy = dy * springForce;
          this.forces[this.positionedToIndex.get(item1)!].x += fx;
          this.forces[this.positionedToIndex.get(item1)!].y += fy;
          this.forces[this.positionedToIndex.get(item2)!].x -= fx;
          this.forces[this.positionedToIndex.get(item2)!].y -= fy;
        }
      }
    }
    // Move nodes
    const calculateVelocity = (velocity: number,
                               force: number,
                               mass: number): number => {
      const df = this.config.damping * velocity;
      const a = (force - df) / mass;
      velocity += a; // * time;
      return velocity;
    };
    // console.log(this.forces);
    for (let i = 0; i < this.indexToPositioned.length; ++i) {
      const item = this.indexToPositioned[i];
      const pos = item.getPosition();
      const force = this.forces[i];
      const velocity = this.velocities[i];
      if (item.fixed) {
        velocity.x = 0;
        velocity.y = 0;
      } else {
        velocity.x = calculateVelocity(velocity.x, force.x, 1);
        velocity.y = calculateVelocity(velocity.y, force.y, 1);
      }
      item.setPosition({
        x: pos.x + velocity.x, // * time
        y: pos.y + velocity.y, // * time
      });
    }
    for (const edge of this.layoutData.edges) {
      edge.edge.updatePosition();
    }
    return true;
  }
}
