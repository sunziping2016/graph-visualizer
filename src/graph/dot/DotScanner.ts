import BaseScanner from '@/graph/dot/BaseScanner';

export enum TokenEnum {
  EOF = -1,
  SKIP = -2,

  ID = 0,
  STR_ID = 1,
  HTML_ID = 2,
  EDGE_OP = 3,

  LSQUARE = 4,
  RSQUARE = 5,
  LCURLY = 6,
  RCURLY = 7,
  COMMA = 8,
  COLON = 9,
  SEMI = 10,
  EQUAL = 11,
  PLUS = 12,

  STRICT = 13,
  GRAPH = 14,
  DIGRAPH = 15,
  NODE = 16,
  EDGE = 17,
  SUBGRAPH = 18,
}

export default class DotScanner extends BaseScanner<TokenEnum> {
  private static tokens: Array<[TokenEnum, string, boolean]> = [
    [TokenEnum.SKIP, '[ \\t\\f\\r\\n\\v]+|//[^\\r\\n]*|/\\*(?:.|\\n)*?\\*/|#[^\\r\\n]*',
      false],
    [TokenEnum.ID, '[a-zA-Z_\\x80-\\xff][a-zA-Z0-9_\\x80-\\xff]*', true],
    [TokenEnum.ID, '-?(?:\\.[0-9]+|[0-9]+(?:\\.[0-9]*)?)', false],
    [TokenEnum.STR_ID, '"[^"\\\\]*(?:\\\\(?:.|\\n)[^"\\\\]*)*"', false],
    [TokenEnum.HTML_ID, '<[^<>]*(?:<[^<>]*>[^<>]*)*>', false],
    [TokenEnum.EDGE_OP, '-[>-]', false],
  ];
  private static symbols: { [symbol: string]: TokenEnum } = {
    '[': TokenEnum.LSQUARE,
    ']': TokenEnum.RSQUARE,
    '{': TokenEnum.LCURLY,
    '}': TokenEnum.RCURLY,
    ',': TokenEnum.COMMA,
    ':': TokenEnum.COLON,
    ';': TokenEnum.SEMI,
    '=': TokenEnum.EQUAL,
    '+': TokenEnum.PLUS,
  };
  private static literals: { [symbol: string]: TokenEnum } = {
    strict: TokenEnum.STRICT,
    graph: TokenEnum.GRAPH,
    digraph: TokenEnum.DIGRAPH,
    node: TokenEnum.NODE,
    edge: TokenEnum.EDGE,
    subgraph: TokenEnum.SUBGRAPH,
  };
  public constructor() {
    super(
      DotScanner.tokens,
      DotScanner.symbols,
      DotScanner.literals,
      true,
      TokenEnum.EOF,
      TokenEnum.SKIP,
    );
  }
  public * scan(input: string): Generator<[TokenEnum, string]> {
    for (let [type, text] of super.scan(input)) {
      if (type === TokenEnum.STR_ID) {
        text = text.slice(1, -1);
        text = text.replace(/\\(?:\r\n|\r|\n)/g, '');
        text = text.replace(/\\"/g, '"');
        type = TokenEnum.ID;
      } else if (type === TokenEnum.HTML_ID) {
        text = text.slice(1, -1);
        type = TokenEnum.ID;
      }
      yield [type, text];
    }
  }
}
