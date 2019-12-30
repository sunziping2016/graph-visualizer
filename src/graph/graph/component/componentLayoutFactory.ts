import {ComponentLayoutData} from '@/graph/base/dataInput';
import Graph from '@/graph/graph/Graph';
import ComponentLayout from '@/graph/graph/component/ComponentLayout';
import LinearComponentLayout from '@/graph/graph/component/LinearComponentLayout';
import Positioned from '@/graph/base/Positioned';
import NoneComponentLayout from '@/graph/graph/component/NoneComponentLayout';

export default function componentFactory(data: ComponentLayoutData | undefined)
  : new (graph: Graph, parent: Positioned | null) => ComponentLayout {
  switch (data && data.type) {
    case 'none':
      return NoneComponentLayout;
    default:
      return LinearComponentLayout;
  }
}
