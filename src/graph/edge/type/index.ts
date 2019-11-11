import {EdgeData} from '@/graph/base/data';
import Edge from '@/graph/edge/Edge';
import StraightEdgeType from '@/graph/edge/type/StraightEdgeType';
import EdgeType from '@/graph/edge/type/EdgeType';
import QuadraticEdgeType from '@/graph/edge/type/QuadraticEdgeType';

export default function edgeTypeFactory(data: EdgeData)
    : new (parent: Edge) => EdgeType {
  switch (data.shape) {
    case 'straight':
      return StraightEdgeType;
    default:
      return QuadraticEdgeType;
  }
}
