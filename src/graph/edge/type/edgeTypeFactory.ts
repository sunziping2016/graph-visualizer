import {EdgeData} from '@/graph/base/dataInput';
import Edge from '@/graph/edge/Edge';
import StraightEdgeType from '@/graph/edge/type/StraightEdgeType';
import EdgeType from '@/graph/edge/type/EdgeType';
import QuadraticEdgeType from '@/graph/edge/type/QuadraticEdgeType';

export default function edgeTypeFactory(data: EdgeData)
    : new (parent: Edge, data: EdgeData) => EdgeType {
  switch (data.shape) {
    case 'straight':
      return StraightEdgeType;
    default:
      data.shape = 'quadratic';
      return QuadraticEdgeType;
  }
}
