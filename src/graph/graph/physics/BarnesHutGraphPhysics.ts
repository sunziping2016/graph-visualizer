import GraphPhysics from '@/graph/graph/physics/GraphPhysics';
import {BarnesHutGraphPhysicsData, Position, Vector} from '@/graph/base/dataInput';
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
  maxVelocity: number;
}

interface BarnesHutTree {
  centerOfMass: Position;
  mass: number;
  range: {
    minX: number;
    maxX: number;
    minY: number;
    maxY: number;
  };
  children?: {
    NW: BarnesHutTree;
    NE: BarnesHutTree;
    SW: BarnesHutTree;
    SE: BarnesHutTree;
  };
  data?: Positioned;
  size: number;
}

export default class BarnesHutGraphPhysics extends GraphPhysics {
  private static defaultConfig: BarnesHutGraphPhysicsConfig = {
    theta: 0,
    gravitationalConstant: -2000,
    centralGravity: 0.05,
    springLength: 150,
    springConstant: 0.04,
    damping: 0.09,
    maxVelocity: 50,
  };
  private static splitBranch(branch: BarnesHutTree) {
    if (branch.children) {
      throw new Error('Cannot split branch on an already split branch');
    }
    const containedNode: Positioned | undefined = branch.data;
    if (containedNode) {
      branch.mass = 0;
      branch.centerOfMass.x = 0;
      branch.centerOfMass.y = 0;
    }
    delete branch.data;
    const childSize = 0.5 * branch.size;
    branch.children = {
      NW: {
        centerOfMass: { x: 0, y: 0},
        mass: 0,
        range: {
          minX: branch.range.minX, maxX: branch.range.minX + childSize,
          minY: branch.range.minY, maxY: branch.range.minY + childSize,
        },
        size: childSize,
      },
      NE: {
        centerOfMass: { x: 0, y: 0},
        mass: 0,
        range: {
          minX: branch.range.minX + childSize, maxX: branch.range.maxX,
          minY: branch.range.minY, maxY: branch.range.minY + childSize,
        },
        size: childSize,
      },
      SW: {
        centerOfMass: { x: 0, y: 0},
        mass: 0,
        range: {
          minX: branch.range.minX, maxX: branch.range.minX + childSize,
          minY: branch.range.minY + childSize, maxY: branch.range.maxY,
        },
        size: childSize,
      },
      SE: {
        centerOfMass: { x: 0, y: 0},
        mass: 0,
        range: {
          minX: branch.range.minX + childSize, maxX: branch.range.maxX,
          minY: branch.range.minY + childSize, maxY: branch.range.maxY,
        },
        size: childSize,
      },
    };
    if (containedNode) {
      this.placeInTree(branch, containedNode);
    }
  }
  private static placeInTree(branch: BarnesHutTree,
                             node: Positioned): void {
    if (!branch.children) {
      throw new Error('Place in tree can be only called on a split branch');
    }
    this.updateBranchMass(branch, node);
    const range = branch.children.NW.range;
    const pos = node.position;
    let region: 'NW' | 'SW' | 'NE' | 'SE';
    if (range.maxX > pos.x) {
      if (range.maxY > pos.y) {
        region = 'NW';
      } else {
        region = 'SW';
      }
    } else {
      if (range.maxY > pos.y) {
        region = 'NE';
      } else {
        region = 'SE';
      }
    }
    const child = branch.children[region];
    if (child.children) {
      this.placeInTree(child, node);
    } else if (child.data) {
      // ignore overlapping node
      if (child.data.position.x === pos.x &&
          child.data.position.y === pos.y ) {
        pos.x += Math.random() - 0.5;
        pos.y += Math.random() - 0.5;
      } else {
        this.splitBranch(child);
        this.placeInTree(child, node);
      }
    } else {
      child.data = node;
      this.updateBranchMass(child, node);
    }
  }
  private static updateBranchMass(branch: BarnesHutTree,
                                  node: Positioned) {
    const nodeMass = 1;
    const totalMass = branch.mass + nodeMass;
    branch.centerOfMass.x = (branch.centerOfMass.x * branch.mass +
      node.position.x * nodeMass) / totalMass;
    branch.centerOfMass.y = (branch.centerOfMass.y * branch.mass +
      node.position.y * nodeMass) / totalMass;
    branch.mass = totalMass;
  }
  private config: BarnesHutGraphPhysicsConfig;
  private layoutData: LayoutData;
  private nodeToIndex: Map<Positioned, number>;
  private nodes: Positioned[];
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
    this.nodeToIndex = new Map();
    this.nodes = [];
    this.forces = [];
    this.velocities = [];
  }
  public solve(config: BarnesHutGraphPhysicsData | undefined,
               data: LayoutData) {
    this.config = Object.assign({},
      BarnesHutGraphPhysics.defaultConfig, config);
    this.layoutData = data;
    this.nodeToIndex = new Map();
    this.nodes = [];
    // Create Index
    let i = 0;
    for (; i < this.layoutData.ports.length; ++i) {
      this.nodeToIndex.set(this.layoutData.ports[i], i);
      this.nodes.push(this.layoutData.ports[i]);
    }
    for (const edge of this.layoutData.edges) {
      const controlPoints = edge.edge.getControlPoints();
      for (const point of controlPoints) {
        this.nodeToIndex.set(point, i);
        this.nodes.push(point);
        ++i;
      }
    }
    this.forces = [];
    this.velocities = [];
    for (i = 0; i < this.nodeToIndex.size; ++i) {
      this.forces.push({ x: 0, y: 0 });
      this.velocities.push({ x: 0, y: 0 });
    }
  }
  public formBarnesHutTree(): BarnesHutTree {
    if (this.nodes.length < 1) {
      throw new Error('Expect at least one node to form Barnes Hut tree');
    }
    let minX = this.nodes[0].position.x;
    let maxX = this.nodes[0].position.x;
    let minY = this.nodes[0].position.y;
    let maxY = this.nodes[0].position.y;
    for (let i = 1; i < this.nodes.length; ++i) {
      const positioned = this.nodes[i];
      const pos = positioned.position;
      if (pos.x < minX) {
        minX = pos.x;
      }
      if (pos.x > maxX) {
        maxX = pos.x;
      }
      if (pos.y < minY) {
        minY = pos.y;
      }
      if (pos.y > maxY)  {
        maxY = pos.y;
      }
    }
    const sizeDiff = Math.abs(maxX - minX) - Math.abs(maxY - minY);
    if (sizeDiff > 0) {
      minY -= 0.5 * sizeDiff;
      maxY += 0.5 * sizeDiff;
    } else {
      minX += 0.5 * sizeDiff;
      maxX -= 0.5 * sizeDiff;
    }
    const rootSize = Math.abs(maxX - minX);
    const halfRootSize = 0.5 * rootSize;
    const centerX = 0.5 * (minX + maxX);
    const centerY = 0.5 * (minY + maxY);
    const tree: BarnesHutTree = {
      centerOfMass: { x: 0, y: 0},
      mass: 0,
      range: {
        minX: centerX - halfRootSize, maxX: centerX + halfRootSize,
        minY: centerY - halfRootSize, maxY: centerY + halfRootSize,
      },
      size: rootSize,
    };
    BarnesHutGraphPhysics.splitBranch(tree);
    for (const node of this.nodes) {
      BarnesHutGraphPhysics.placeInTree(tree, node);
    }
    return tree;
  }
  public step(): boolean {
    for (const force of this.forces) {
      force.x = 0;
      force.y = 0;
    }
    const that = this;
    // Calculate central gravity
    for (let i = 0; i < this.nodes.length; ++i) {
      const node = this.nodes[i];
      const dx = -node.position.x;
      const dy = -node.position.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      const gravityForce = (distance === 0) ? 0 :
        (this.config.centralGravity / distance);
      this.forces[i].x = dx * gravityForce;
      this.forces[i].y = dy * gravityForce;
    }
    // Calculate node repulsive force
    if (this.nodes.length) {
      function calculateForces(dx: number, dy: number,
                               node: Positioned,
                               branch: BarnesHutTree) {
        if (dx === 0 && dy === 0) {
          dx = 0.1;
        }
        const nodeMass = 1;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const gravityForce = that.config.gravitationalConstant * branch.mass *
          nodeMass / Math.pow(distance, 3);
        const force = that.forces[that.nodeToIndex.get(node)!];
        force.x += dx * gravityForce;
        force.y += dy * gravityForce;
      }
      function getForceContributions(branch: BarnesHutTree, node: Positioned) {
        if (!branch.children) {
          throw new Error('Get force contributions ' +
            'can be only called on a split branch');
        }
        getForceContribution(branch.children.NW, node);
        getForceContribution(branch.children.NE, node);
        getForceContribution(branch.children.SW, node);
        getForceContribution(branch.children.SE, node);
      }
      function getForceContribution(branch: BarnesHutTree, node: Positioned) {
        if (!branch.children && !branch.data) {
          return;
        }
        const dx = branch.centerOfMass.x - node.position.x;
        const dy = branch.centerOfMass.y - node.position.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        if (branch.size / distance < that.config.theta) {
          calculateForces(dx, dy, node, branch);
        } else if (branch.children) {
          getForceContributions(branch, node);
        } else if (branch.data !== node) {
          calculateForces(dx, dy, node, branch);
        }
      }
      const tree = this.formBarnesHutTree();
      for (const node of this.nodes) {
        getForceContributions(tree, node);
      }
      // Naive method
      // for (let i = 0; i < this.nodes.length - 1; ++i) {
      //   const node1 = this.nodes[i];
      //   const pos1 = node1.position;
      //   for (let j = i + 1; j < this.nodes.length; ++j) {
      //     const node2 = this.nodes[j];
      //     const pos2 = node2.position;
      //     const dx = pos1.x - pos2.x;
      //     const dy = pos1.y - pos2.y;
      //     const distance = Math.sqrt(dx * dx + dy * dy);
      //     const gravityForce = -2000 / Math.pow(distance + 1e-3, 3);
      //     this.forces[i].x -= dx * gravityForce;
      //     this.forces[i].y -= dy * gravityForce;
      //     this.forces[j].x += dx * gravityForce;
      //     this.forces[j].y += dy * gravityForce;
      //   }
      // }
    }
    // Calculate spring force
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
          const dx = item1.position.x - item2.position.x;
          const dy = item1.position.y - item2.position.y;
          const distance = Math.max(Math.sqrt(dx * dx + dy * dy), 0.01);
          const springForce = this.config.springConstant *
            (edgeLength - distance) / distance;
          const fx = dx * springForce;
          const fy = dy * springForce;
          this.forces[this.nodeToIndex.get(item1)!].x += fx;
          this.forces[this.nodeToIndex.get(item1)!].y += fy;
          this.forces[this.nodeToIndex.get(item2)!].x -= fx;
          this.forces[this.nodeToIndex.get(item2)!].y -= fy;
        }
      }
    }
    // Move nodes
    function calculateVelocity(velocity: number,
                               force: number,
                               mass: number): number {
      const df = that.config.damping * velocity;
      const a = (force - df) / mass;
      velocity += a; // * time;
      if (Math.abs(velocity) > that.config.maxVelocity) {
        velocity = velocity > 0 ? that.config.maxVelocity :
          -that.config.maxVelocity;
      }
      return velocity;
    }
    for (let i = 0; i < this.nodes.length; ++i) {
      const item = this.nodes[i];
      const pos = item.position;
      const force = this.forces[i];
      const velocity = this.velocities[i];
      if (item.fixed) {
        velocity.x = 0;
        velocity.y = 0;
      } else {
        velocity.x = calculateVelocity(velocity.x, force.x, 1);
        velocity.y = calculateVelocity(velocity.y, force.y, 1);
      }
      item.position = {
        x: pos.x + velocity.x, // * time
        y: pos.y + velocity.y, // * time
      };
    }
    for (const edge of this.layoutData.edges) {
      edge.edge.updatePosition();
    }
    return true;
  }
}
