import Graph from '@/graph/graph/Graph';
import GraphLayout, {LayoutData} from '@/graph/graph/layout/GraphLayout';
import {KamadaKawaiGraphLayoutData, Size} from '@/graph/base/dataInput';
import Port from '@/graph/base/Port';
import Positioned from '@/graph/base/Positioned';
import {AnyShape} from '@/graph/base/dataOutput';

interface KamadaKawaiGraphLayoutConfig {
  springLength: number;
  springConstant: number;
  preferredEdgeDirection: number | 'any';
}

export default class KamadaKawaiGraphLayout extends GraphLayout {
  private static defaultConfig: KamadaKawaiGraphLayoutConfig = {
    springLength: 150,
    springConstant: 0.05,
    preferredEdgeDirection: 'any',
  };
  private contentSize: Size;
  constructor(graph: Graph, parent: Positioned | null) {
    super(graph, parent);
    this.contentSize = { width: 0, height: 0 };
  }
  public solve(config: KamadaKawaiGraphLayoutData | undefined,
               data: LayoutData,
               index: number) {
    super.solve(config, data, index);
    const newConfig: KamadaKawaiGraphLayoutConfig = Object.assign({},
      KamadaKawaiGraphLayout.defaultConfig, config);
    const portToIndex: Map<Port, number> = new Map();
    for (let i = 0; i < data.ports.length; ++i) {
      portToIndex.set(data.ports[i], i);
    }
    // Initial random placement
    for (const port of data.ports) {
      if (!port.initialPlaced) {
        port.position = {
          x: newConfig.springLength * ( Math.random() - 0.5),
          y: newConfig.springLength * ( Math.random() - 0.5),
        };
        port.initialPlaced = true;
      }
    }
    // Compute distance matrix by Floyd Warshall
    const distanceMatrix: number[][] = [];
    for (let i = 0; i < data.ports.length; ++i) {
      distanceMatrix.push(Array(data.ports.length).fill(Infinity));
      distanceMatrix[distanceMatrix.length - 1][i] = 0;
    }
    for (const {fromBelonging, toBelonging} of data.edges) {
      const fromIndex = portToIndex.get(fromBelonging)!;
      const toIndex = portToIndex.get(toBelonging)!;
      distanceMatrix[fromIndex][toIndex] = 1;
      distanceMatrix[toIndex][fromIndex] = 1;
    }
    for (let k = 0; k < data.ports.length; ++k) {
      for (let i = 0; i < data.ports.length; ++i) {
        for (let j = 0; j < data.ports.length; ++j) {
          const dist = distanceMatrix[i][k] + distanceMatrix[k][j];
          if (distanceMatrix[i][j] > dist) {
            distanceMatrix[i][j] = dist;
          }
        }
      }
    }
    // Place ports using Kamada Kawai
    // Compute length matrix
    const lengthMatrix = [];
    for (let i = 0; i < data.ports.length; ++i) {
      const length = [];
      for (let j = 0; j < data.ports.length; ++j) {
        length.push(newConfig.springLength * distanceMatrix[i][j]);
      }
      lengthMatrix.push(length);
    }
    // Compute k matrix
    const kMatrix = [];
    for (let i = 0; i < data.ports.length; ++i) {
      const k = [];
      for (let j = 0; j < data.ports.length; ++j) {
        k.push(newConfig.springConstant *
          Math.pow(distanceMatrix[i][j], -2));
      }
      kMatrix.push(k);
    }
    // Compute energy matrix
    const energyMatrix = [];
    for (const port of data.ports) {
      energyMatrix.push(Array(data.ports.length));
    }
    for (let m = 0; m < data.ports.length; ++m) {
      const mPos = data.ports[m].position;
      energyMatrix[m][m] = [0, 0];
      for (let i = m + 1; i < data.ports.length; ++i) {
        const iPos = data.ports[i].position;
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
    for (let i = 0; i < data.ports.length; ++i) {
      const sum = [0, 0];
      for (let j = 0; j < data.ports.length; ++j) {
        sum[0] += energyMatrix[i][j][0];
        sum[1] += energyMatrix[i][j][1];
      }
      energySum.push(sum);
    }
    // Compute position
    const threshold = 0.01;
    const maxIterations = Math.max(1000,
      Math.min(10 * data.ports.length, 6000));
    const maxInnerIterations = 5;
    let iterations = 0;
    let maxEnergy;
    while (iterations < maxIterations) {
      iterations += 1;
      // Get port with highest energy
      let m = 0;
      let deDx = 0;
      let deDy = 0;
      maxEnergy = -1;
      for (let i = 0; i < data.ports.length; ++i) {
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
      const mPos = data.ports[m].position;
      let delta = maxEnergy;
      let subIterations = 0;
      while (delta > threshold && subIterations < maxInnerIterations) {
        subIterations += 1;
        // Move port
        let d2eDx2 = 0;
        let d2eDxDy = 0;
        let d2eDy2 = 0;
        for (let i = 0; i < data.ports.length; ++i) {
          if (i !== m) {
            const iPos = data.ports[i].position;
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
        for (let i = 0; i < data.ports.length; ++i) {
          if (i !== m) {
            const [oldDx, oldDy] = energyMatrix[m][i];
            const iPos = data.ports[i].position;
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
    // Rotate graph to satisfy preferred edge direction
    if (typeof newConfig.preferredEdgeDirection === 'number') {
      const preferredEdgeDirection: number = newConfig.preferredEdgeDirection /
        180 * Math.PI;
      let totalX = 0;
      let totalY = 0;
      for (const edge of data.edges) {
        totalX += edge.toBelonging.position.x - edge.fromBelonging.position.x;
        totalY += edge.toBelonging.position.y - edge.fromBelonging.position.y;
      }
      const currentAngle = Math.atan2(totalY, totalX);
      const rotateAngle = preferredEdgeDirection - currentAngle;
      const rotateMatrix: number[][] = [
        [Math.cos(rotateAngle), -Math.sin(rotateAngle)],
        [Math.sin(rotateAngle), Math.cos(rotateAngle)],
      ];
      for (const node of data.ports) {
        node.position = {
          x: rotateMatrix[0][0] * node.position.x +
            rotateMatrix[0][1] * node.position.y,
          y: rotateMatrix[1][0] * node.position.x +
            rotateMatrix[1][1] * node.position.y,
        };
      }
    }
    // Calculate component size and position
    const upperLeft = [Infinity, Infinity];
    const lowerRight = [-Infinity, -Infinity];
    for (const port of data.ports) {
      const pos = port.position;
      const size = port.getBoundingBoxSize();
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
    const position = {
      x: (upperLeft[0] + lowerRight[0]) / 2,
      y: (upperLeft[1] + lowerRight[1]) / 2,
    };
    this.contentSize = {
      width: lowerRight[0] - upperLeft[0],
      height: lowerRight[1] - upperLeft[1],
    };
    // Move ports to center
    for (const port of data.ports) {
      port.position.x -= position.x;
      port.position.y -= position.y;
    }
    this.informAllEdgesFullyUpdatePosition();
  } // solve method

  public getContentSize() {
    return this.contentSize;
  }
}
