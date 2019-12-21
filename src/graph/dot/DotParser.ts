import {TokenEnum} from '@/graph/dot/DotScanner';
import BaseParser from '@/graph/dot/BaseParser';
import {DotEdge, DotGraph, DotNode, DotNodeId, DotSubgraph} from '@/graph/base/dataXdot';

export default class DotParser extends BaseParser<TokenEnum> {
  public constructor(lexer: Generator<[TokenEnum, string]>) {
    super(lexer);
  }
  // public consume() {
  //   const token = super.consume();
  //   // tslint:disable-next-line:no-console
  //   console.log(`${TokenEnum[token[0]]} ${token[1]}`);
  //   return token;
  // }
  public parse() {
    const graph = this.parseGraph();
    this.match([TokenEnum.EOF]);
    return graph;
  }
  public parseGraph(): DotGraph {
    let strict = false;
    if (this.lookahead[0] === TokenEnum.STRICT) {
      strict = true;
      this.consume();
    }
    this.match([TokenEnum.DIGRAPH, TokenEnum.GRAPH]);
    const directed = this.consume()[0] === TokenEnum.DIGRAPH;
    let id: string | undefined;
    if (this.lookahead[0] === TokenEnum.ID) {
      id = this.consume()[1];
    }
    this.match([TokenEnum.LCURLY]);
    this.consume();
    const graphAttrs: { [attr: string]: string } = {};
    const nodeAttrs: { [attr: string]: string } = {};
    const edgeAttrs: { [attr: string]: string } = {};
    const children: Array<DotNode | DotEdge | DotSubgraph> = [];
    while (this.lookahead[0] !== TokenEnum.RCURLY) {
      const [newGraphAttrs, newNodeAttrs, newEdgeAttrs, newChildren] =
        this.parseStmt();
      Object.assign(graphAttrs, newGraphAttrs);
      Object.assign(nodeAttrs, newNodeAttrs);
      Object.assign(edgeAttrs, newEdgeAttrs);
      children.push(...newChildren);
    }
    this.consume();
    return {
      type: 'graph',
      strict,
      directed,
      id,
      attrs: graphAttrs,
      nodeAttrs,
      edgeAttrs,
      children,
    };
  }
  public parseStmt(): [
    { [attr: string]: string },
    { [attr: string]: string },
    { [attr: string]: string },
    Array<DotNode | DotEdge | DotSubgraph>
  ] {
    let graphAttrs: { [attr: string]: string } = {};
    let nodeAttrs: { [attr: string]: string } = {};
    let edgeAttrs: { [attr: string]: string } = {};
    let children: Array<DotNode | DotEdge | DotSubgraph> = [];
    switch (this.lookahead[0]) {
      case TokenEnum.GRAPH: {
        this.consume();
        graphAttrs = this.parseAttrs();
        break;
      }
      case TokenEnum.NODE: {
        this.consume();
        nodeAttrs = this.parseAttrs();
        break;
      }
      case TokenEnum.EDGE: {
        this.consume();
        edgeAttrs = this.parseAttrs();
        break;
      }
      case TokenEnum.SUBGRAPH:
      case TokenEnum.LCURLY: {
        children = [this.parseSubgraph()];
        break;
      }
      default: {
        const id = this.parseNodeId();
        switch (this.lookahead[0]) {
          case TokenEnum.EDGE_OP: {
            this.consume();
            const ids = [id, this.parseNodeId()];
            while (this.lookahead[0] === TokenEnum.EDGE_OP) {
              this.consume();
              ids.push(this.parseNodeId());
            }
            const attrs = this.parseAttrs();
            for (let i = 0; i < ids.length - 1; ++i) {
              children.push({
                type: 'edge',
                from: ids[i],
                to: ids[i + 1],
                attrs,
              });
            }
            break;
          }
          case TokenEnum.EQUAL: {
            this.consume();
            this.parseId();
            break;
          }
          default: {
            const attrs = this.parseAttrs();
            children.push({
              type: 'node',
              id,
              attrs,
            });
          }
        }
        break;
      }
    }
    if (this.lookahead[0] === TokenEnum.SEMI) {
      this.consume();
    }
    return [graphAttrs, nodeAttrs, edgeAttrs, children];
  }
  public parseAttrs(): { [attr: string]: string } {
    const attrs: { [attr: string]: string } = {};
    while (this.lookahead[0] as TokenEnum === TokenEnum.LSQUARE) {
      this.consume();
      while (this.lookahead[0] !== TokenEnum.RSQUARE) {
        const [name, value] = this.parseAttr();
        attrs[name] = value;
        if (this.lookahead[0] === TokenEnum.COMMA ||
            this.lookahead[0] === TokenEnum.SEMI) {
          this.consume();
        }
      }
      this.consume();
    }
    return attrs;
  }
  public parseAttr(): [string, string] {
    const name = this.parseId();
    let value = 'true';
    if (this.lookahead[0] === TokenEnum.EQUAL) {
      this.consume();
      value = this.parseId();
    }
    return [name, value];
  }
  public parseSubgraph(): DotSubgraph {
    let id: string | undefined;
    const graphAttrs: { [attr: string]: string } = {};
    const nodeAttrs: { [attr: string]: string } = {};
    const edgeAttrs: { [attr: string]: string } = {};
    const children: Array<DotNode | DotEdge | DotSubgraph> = [];
    if (this.lookahead[0] as TokenEnum === TokenEnum.SUBGRAPH) {
      this.consume();
      if (this.lookahead[0] === TokenEnum.ID) {
        id = this.consume()[1];
      }
    }
    if (this.lookahead[0] as TokenEnum === TokenEnum.LCURLY) {
      this.consume();
      while (this.lookahead[0] !== TokenEnum.RCURLY) {
        const [newGraphAttrs, newNodeAttrs, newEdgeAttrs, newChildren] =
          this.parseStmt();
        Object.assign(graphAttrs, newGraphAttrs);
        Object.assign(nodeAttrs, newNodeAttrs);
        Object.assign(edgeAttrs, newEdgeAttrs);
        children.push(...newChildren);
      }
      this.consume();
    }
    return {
      type: 'subgraph',
      id,
      attrs: graphAttrs,
      nodeAttrs,
      edgeAttrs,
      children,
    };
  }
  public parseNodeId(): DotNodeId {
    const id = this.parseId();
    let port: string | undefined;
    let compass: string | undefined;
    if (this.lookahead[0] === TokenEnum.COLON) {
      this.consume();
      port = this.parseId();
      if (this.lookahead[0] === TokenEnum.COLON) {
        this.consume();
        compass = this.parseId();
        if (['n', 'ne', 'e', 'se', 's', 'sw', 'w', 'nw', 'c', '_']
            .indexOf(compass) === -1) {
          throw new Error('Error compass');
        }
      }
    }
    return {
      id,
      port,
      compass: compass as any,
    };
  }
  public parseId(): string {
    this.match([TokenEnum.ID]);
    return this.consume()[1];
  }
}
