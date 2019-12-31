import Root from '@/graph/Root';
import Graph from '@/graph/graph/Graph';
import Node from '@/graph/node/Node';
import Edge from '@/graph/edge/Edge';

export type HighlightMode = 'no' | 'directInput' | 'directOutput'
  | 'allInput' | 'allOutput';

const highlightSeeker: {
  [mode: string]: (root: Root) => Set<Graph | Node | Edge>;
} = {
  no(root: Root) {
    return new Set();
  },
  directInput(root: Root) {
    const result = new Set<Graph | Node | Edge>();
    for (const item of root.selected) {
      const port = root.findPort(item);
      if (port === null) {
        throw new Error('Cannot find the port');
      }
      if (port instanceof Graph || port instanceof Node) {
        result.add(port);
        for (const edge of port.toEdges) {
          result.add(edge);
          result.add(edge.fromNodeOrGraph);
        }
      }
    }
    return result;
  },
  directOutput(root: Root) {
    const result = new Set<Graph | Node | Edge>();
    for (const item of root.selected) {
      const port = root.findPort(item);
      if (port === null) {
        throw new Error('Cannot find the port');
      }
      if (port instanceof Graph || port instanceof Node) {
        result.add(port);
        for (const edge of port.fromEdges) {
          result.add(edge);
          result.add(edge.toNodeOrGraph);
        }
      }
    }
    return result;
  },
  allInput(root: Root) {
    const result = new Set<Graph | Node | Edge>();
    function traversal(node: Graph | Node) {
      result.add(node);
      for (const edge of node.toEdges) {
        result.add(edge);
        if (!result.has(edge.fromNodeOrGraph)) {
          traversal(edge.fromNodeOrGraph);
        }
      }
    }
    for (const item of root.selected) {
      const port = root.findPort(item);
      if (port === null) {
        throw new Error('Cannot find the port');
      }
      if (port instanceof Graph || port instanceof Node) {
        traversal(port);
      }
    }
    return result;
  },
  allOutput(root: Root) {
    const result = new Set<Graph | Node | Edge>();
    function traversal(node: Graph | Node) {
      result.add(node);
      for (const edge of node.fromEdges) {
        result.add(edge);
        if (!result.has(edge.toNodeOrGraph)) {
          traversal(edge.toNodeOrGraph);
        }
      }
    }
    for (const item of root.selected) {
      const port = root.findPort(item);
      if (port === null) {
        throw new Error('Cannot find the port');
      }
      if (port instanceof Graph || port instanceof Node) {
        traversal(port);
      }
    }
    return result;
  },
};

export default highlightSeeker;
