import Graph from '@/graph/graph/Graph';
import GraphLayout from '@/graph/graph/layout/GraphLayout';
import {KamadaKawaiGraphLayoutData, Size} from '@/graph/base/data';

function setEqual<T>(a: Set<T>, b: Set<T>): boolean {
  if (a.size !== b.size) {
    return false;
  }
  for (const i of a) {
    if (!b.has(i)) {
      return false;
    }
  }
  return true;
}

interface KamadaKawaiGraphLayoutConfig {
  direction: 'TD' | 'DT' | 'LR' | 'RL';
  spaceBetween: number;
  springLength: number;
  springConstant: number;
}

export default class KamadaKawaiGraphLayout extends GraphLayout {
  private static defaultConfig = {
    direction: 'TD',
    spaceBetween: 12,
    springLength: 150,
    springConstant: 0.05,
  };
  private nodeIds?: Set<string>;
  private edgeIds?: Set<string>;
  private config?: KamadaKawaiGraphLayoutConfig;
  // noinspection JSMismatchedCollectionQueryUpdate
  private nodesIndexToId?: string[];
  // noinspection JSMismatchedCollectionQueryUpdate
  private components?: Array<{
    nodes: number[];
    edges: Map<number, Set<number>>;
  }>;
  private contentSize?: Size;
  constructor(graph: Graph) {
    super(graph);
  }
  public solve(data: KamadaKawaiGraphLayoutData) {
    const newConfig = Object.assign({},
      KamadaKawaiGraphLayout.defaultConfig, data);
    if (!data || !data.springLength) {
      newConfig.springLength = KamadaKawaiGraphLayout.defaultConfig
          .springLength / (this.graph.depth! + 1);
    }
    const newNodeIds = new Set(this.graph.getPorts()!.keys());
    const newEdgeIds = new Set(this.graph.getEdges()!.keys());
    if (!this.nodeIds || !this.edgeIds || !this.config ||
      !setEqual(this.nodeIds, newNodeIds) ||
      !setEqual(this.edgeIds, newEdgeIds) ||
      this.config.springLength !== newConfig.springLength ||
      this.config.springConstant !== newConfig.springConstant
    ) {
      this.nodeIds = newNodeIds;
      this.edgeIds = newEdgeIds;
      // Create adjacent list
      const nodes = Array.from(this.graph.getPorts()!.values());
      const nodesIndexToId = Array.from(this.graph.getPorts()!.keys());
      const nodesIdToIndex: {[id: string]: number} = {};
      for (let i = 0; i < nodes.length; ++i) {
        nodesIdToIndex[nodesIndexToId[i]] = i;
      }
      const edges = new Map();
      for (const edge of this.graph.getEdges()!.values()) {
        const from = this.graph.findBelongingPort(edge.from!);
        const to = this.graph.findBelongingPort(edge.to!);
        if (from && to) {
          const fromIndex = nodesIdToIndex[from.getId()];
          const toIndex = nodesIdToIndex[to.getId()];
          if (!edges.has(fromIndex)) {
            edges.set(fromIndex, new Set());
          }
          edges.get(fromIndex).add(toIndex);
          if (!edges.has(toIndex)) {
            edges.set(toIndex, new Set());
          }
          edges.get(toIndex).add(fromIndex);
        }
      }
      // Initial random placement
      for (const node of this.graph.getPorts()!.values()) {
        if (!node.initialPlaced) {
          node.setPosition({
            x: newConfig.springLength * ( Math.random() - 0.5),
            y: newConfig.springLength * ( Math.random() - 0.5),
          });
          node.initialPlaced = true;
        }
      }
      // Compute connected components by DFS
      const visited = Array(nodes.length).fill(false);
      const components: Array<{
        nodes: number[];
        edges: Map<number, Set<number>>;
      }> = [];
      function calculateConnectedComponent(from: number) {
        visited[from] = true;
        const component = components[components.length - 1];
        component.nodes.push(from);
        const adjacent = edges.get(from);
        if (adjacent) {
          for (const to of adjacent) {
            if (!component.edges.has(from)) {
              component.edges.set(from, new Set());
            }
            component.edges.get(from)!.add(to);
            if (!component.edges.has(to)) {
              component.edges.set(to, new Set());
            }
            component.edges.get(to)!.add(from);
            if (!visited[to]) {
              calculateConnectedComponent(to);
            }
          }
        }
      }
      for (let i = 0; i < this.nodeIds.size; ++i) {
        if (!visited[i]) {
          components.push({
            nodes: [],
            edges: new Map(),
          });
          calculateConnectedComponent(i);
        }
      }
      const indexToComponentIndex = Array(nodes.length);
      for (const component of components) {
        for (let i = 0; i < component.nodes.length; ++i) {
          indexToComponentIndex[component.nodes[i]] = i;
        }
      }
      for (const component of components) {
        // Compute distance matrix by Floyd Warshall
        const distanceMatrix = [];
        for (let i = 0; i < component.nodes.length; ++i) {
          distanceMatrix.push(Array(component.nodes.length).fill(Infinity));
          distanceMatrix[distanceMatrix.length - 1][i] = 0;
        }
        for (const [from, tos] of component.edges.entries()) {
          for (const to of tos) {
            const localFromIndex = indexToComponentIndex[from];
            const localToIndex = indexToComponentIndex[to];
            distanceMatrix[localFromIndex][localToIndex] = 1;
            distanceMatrix[localToIndex][localFromIndex] = 1;
          }
        }
        for (let k = 0; k < component.nodes.length; ++k) {
          for (let i = 0; i < component.nodes.length; ++i) {
            for (let j = 0; j < component.nodes.length; ++j) {
              const dist = distanceMatrix[i][k] + distanceMatrix[k][j];
              if (distanceMatrix[i][j] > dist) {
                distanceMatrix[i][j] = dist;
              }
            }
          }
        }
        // Place nodes using Kamada Kawai
        // Compute length matrix
        const lengthMatrix = [];
        for (let i = 0; i < component.nodes.length; ++i) {
          const length = [];
          for (let j = 0; j < component.nodes.length; ++j) {
            length.push(newConfig.springLength * distanceMatrix[i][j]);
          }
          lengthMatrix.push(length);
        }
        // Compute k matrix
        const kMatrix = [];
        for (let i = 0; i < component.nodes.length; ++i) {
          const k = [];
          for (let j = 0; j < component.nodes.length; ++j) {
            k.push(newConfig.springConstant *
              Math.pow(distanceMatrix[i][j], -2));
          }
          kMatrix.push(k);
        }
        // Compute energy matrix
        const energyMatrix = [];
        for (const node of component.nodes) {
          energyMatrix.push(Array(component.nodes.length));
        }
        for (let m = 0; m < component.nodes.length; ++m) {
          const mPos = this.graph.getPorts()!.get(
            nodesIndexToId[component.nodes[m]])!.getPosition();
          energyMatrix[m][m] = [0, 0];
          for (let i = m + 1; i < component.nodes.length; ++i) {
            const iPos = this.graph.getPorts()!.get(
              nodesIndexToId[component.nodes[i]])!.getPosition();
            const denominator = 1.0 / Math.sqrt(
              Math.pow(mPos.x - iPos.x, 2) + Math.pow(mPos.y - iPos.y, 2));
            energyMatrix[m][i] = [
              kMatrix[m][i] * (mPos.x - iPos.x) *
                (1 - lengthMatrix[m][i] * denominator),
              kMatrix[m][i] * (mPos.y - iPos.y) *
                (1 - lengthMatrix[m][i] * denominator),
            ];
            energyMatrix[i][m] = [
              -energyMatrix[m][i][0],
              -energyMatrix[m][i][1],
            ];
          }
        }
        const energySum = [];
        for (let i = 0; i < component.nodes.length; ++i) {
          const sum = [0, 0];
          for (let j = 0; j < component.nodes.length; ++j) {
            sum[0] += energyMatrix[i][j][0];
            sum[1] += energyMatrix[i][j][1];
          }
          energySum.push(sum);
        }
        // Compute position
        const threshold = 0.01;
        const maxIterations = Math.max(1000,
          Math.min(10 * component.nodes.length, 6000));
        const maxInnerIterations = 5;
        let iterations = 0;
        let maxEnergy;
        while (iterations < maxIterations) {
          iterations += 1;
          // Get node with highest energy
          let m = 0;
          let deDx = 0;
          let deDy = 0;
          maxEnergy = -1;
          for (let i = 0; i < component.nodes.length; ++i) {
            const e = Math.sqrt(Math.pow(energySum[i][0], 2) +
              Math.pow(energySum[i][1], 2));
            if (e > maxEnergy) {
              m = i;
              deDx = energySum[i][0];
              deDy = energySum[i][1];
              maxEnergy = e;
            }
          }
          if (maxEnergy <= threshold) {
            break;
          }
          const mPos = this.graph.getPorts()!.get(
            nodesIndexToId[component.nodes[m]])!.getPosition();
          let delta = maxEnergy;
          let subIterations = 0;
          while (delta > threshold && subIterations < maxInnerIterations) {
            subIterations += 1;
            // Move node
            let d2eDx2 = 0;
            let d2eDxDy = 0;
            let d2eDy2 = 0;
            for (let i = 0; i < component.nodes.length; ++i) {
              if (i !== m) {
                const iPos = this.graph.getPorts()!.get(
                  nodesIndexToId[component.nodes[i]])!.getPosition();
                const factor = 1.0 / Math.pow(Math.pow(mPos.x - iPos.x, 2) +
                  Math.pow(mPos.y - iPos.y, 2), 1.5);
                const k = kMatrix[m][i];
                const l = lengthMatrix[m][i];
                d2eDx2 += k * (1 - l * Math.pow(mPos.y - iPos.y, 2) * factor);
                d2eDxDy += k * l * (mPos.x - iPos.x) * (mPos.y - iPos.y) *
                  factor;
                d2eDy2 += k * (1 - l * Math.pow(mPos.x - iPos.x, 2) * factor);
              }
            }
            // Solve equation using Cramer's rule
            const denominator = d2eDx2 * d2eDy2 - Math.pow(d2eDxDy, 2);
            const dx = (d2eDxDy * deDy - d2eDy2 * deDx) / denominator;
            const dy = (d2eDxDy * deDx - d2eDx2 * deDy) / denominator;
            mPos.x += dx;
            mPos.y += dy;
            // Recalculate energy matrix
            let sumX = 0;
            let sumY = 0;
            for (let i = 0; i < component.nodes.length; ++i) {
              if (i !== m) {
                const [oldDx, oldDy] = energyMatrix[m][i];
                const iPos = this.graph.getPorts()!.get(
                  nodesIndexToId[component.nodes[i]])!.getPosition();
                const factor = 1.0 / Math.sqrt(
                  Math.pow(mPos.x - iPos.x, 2) + Math.pow(mPos.y - iPos.y, 2));
                const deltaX = kMatrix[m][i] * (mPos.x - iPos.x) *
                  (1 - lengthMatrix[m][i] * factor);
                const deltaY = kMatrix[m][i] * (mPos.y - iPos.y) *
                  (1 - lengthMatrix[m][i] * factor);
                energyMatrix[m][i] = [deltaX, deltaY];
                energyMatrix[i][m] = [-deltaX, -deltaY];
                energySum[i][0] += oldDx - deltaX;
                energySum[i][1] += oldDy - deltaY;
                sumX += deltaX;
                sumY += deltaY;
              }
            }
            energySum[m] = [sumX, sumY];
            // Update
            delta = Math.sqrt(Math.pow(energySum[m][0], 2) +
              Math.pow(energySum[m][1], 2));
            deDx = energySum[m][0];
            deDy = energySum[m][1];
          } // for kamada kawai inner iteration
        } // for kamada kawai outer iteration
      } // for every component
      // Save results for further evaluation
      this.nodesIndexToId = nodesIndexToId;
      this.components = components;
    } // if needs update position
    // Calculate component size and position
    const componentsSize = [];
    const componentsPosition = [];
    for (const component of this.components!) {
      const upperLeft = [Infinity, Infinity];
      const lowerRight = [-Infinity, -Infinity];
      for (const nodeIndex of component.nodes) {
        const node = this.graph.getPorts()!.get(
          this.nodesIndexToId![nodeIndex])!;
        const pos = node.getPosition();
        const size = node.getBoundingBoxSize();
        const halfWidth = size.width / 2;
        const halfHeight = size.height / 2;
        if (pos.x - halfWidth < upperLeft[0]) {
          upperLeft[0] = pos.x - halfWidth;
        }
        if (pos.x + halfWidth > lowerRight[0]) {
          lowerRight[0] = pos.x + halfWidth;
        }
        if (pos.y - halfHeight < upperLeft[1]) {
          upperLeft[1] = pos.y - halfHeight;
        }
        if (pos.y + halfHeight > lowerRight[1]) {
          lowerRight[1] = pos.y + halfHeight;
        }
      }
      componentsSize.push([
        lowerRight[0] - upperLeft[0],
        lowerRight[1] - upperLeft[1],
      ]);
      componentsPosition.push([
        (upperLeft[0] + lowerRight[0]) / 2,
        (upperLeft[1] + lowerRight[1]) / 2,
      ]);
    }
    if (newConfig.direction === 'LR' || newConfig.direction === 'RL') {
      this.contentSize = {
        width: componentsSize.map((x) => x[0]).reduce((a, b) => a + b, 0) +
          Math.max(this.components!.length - 1, 0) * newConfig.spaceBetween,
        height: Math.max(...componentsSize.map((x) => x[1]), 0),
      };
      let begin = newConfig.direction === 'LR' ?
        -this.contentSize.width / 2 : this.contentSize.width / 2;
      for (let i = 0; i < this.components!.length; ++i) {
        const deltaX = (newConfig.direction === 'LR' ?
          componentsSize[i][0] / 2 : -componentsSize[i][0] / 2) +
          begin - componentsPosition[i][0];
        const deltaY = -componentsPosition[i][1];
        for (const nodeIndex of this.components![i].nodes) {
          const node = this.graph.getPorts()!.get(
            this.nodesIndexToId![nodeIndex])!;
          node.getPosition().x += deltaX;
          node.getPosition().y += deltaY;
        }
        if (newConfig.direction === 'LR') {
          begin += componentsSize[i][0] + newConfig.spaceBetween;
        } else {
          begin -= componentsSize[i][0] + newConfig.spaceBetween;
        }
      }
    } else {
      this.contentSize = {
        width: Math.max(...componentsSize.map((x) => x[0]), 0),
        height: componentsSize.map((x) => x[1]).reduce((a, b) => a + b, 0) +
          Math.max(this.components!.length - 1, 0) * newConfig.spaceBetween,
      };
      let begin = newConfig.direction === 'DT' ?
        this.contentSize.height / 2 : -this.contentSize.height / 2;
      for (let i = 0; i < this.components!.length; ++i) {
        const deltaX = -componentsPosition[i][0];
        const deltaY = (newConfig.direction === 'DT' ?
          -componentsSize[i][1] / 2 : componentsSize[i][1] / 2) +
          begin - componentsPosition[i][1];
        for (const nodeIndex of this.components![i].nodes) {
          const node = this.graph.getPorts()!.get(
            this.nodesIndexToId![nodeIndex])!;
          node.getPosition()!.x += deltaX;
          node.getPosition()!.y += deltaY;
        }
        if (newConfig.direction === 'DT') {
          begin -= componentsSize[i][1] + newConfig.spaceBetween;
        } else {
          begin += componentsSize[i][1] + newConfig.spaceBetween;
        }
      }
    } // position calculation
  } // solve method
  public render() {
    return {
      is: 'Group',
      key: 'content',
      config: {
        x: this.position.x,
        y: this.position.y,
      },
      children: Array.from(this.graph.getChildren()!.values())
        .map((x) => x.render()),
    };
  }
  public getContentSize() {
    return this.contentSize;
  }
}
