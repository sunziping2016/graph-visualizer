import BoxNodeType from '@/graph/node/type/BoxNodeType';
import NodeType from '@/graph/node/type/NodeType';
import {NodeData} from '@/graph/base/dataInput';
import Node from '@/graph/node/Node';
import RecordNodeType from '@/graph/node/type/RecordNodeType';
import TableNodeType from '@/graph/node/type/TableNodeType';

export default function nodeTypeFactory(data: NodeData)
    : new (parent: Node, data: NodeData) => NodeType {
  switch (data.shape) {
    case 'table':
      return TableNodeType;
    case 'record':
      return RecordNodeType;
    default:
      data.shape = 'box';
      return BoxNodeType;
  }
}
