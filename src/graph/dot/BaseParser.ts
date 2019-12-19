export default class BaseParser<T> {
  protected lookahead: [T, string];
  private lexer: Generator<[T, string]>;
  public constructor(lexer: Generator<[T, string]>) {
    this.lexer = lexer;
    const lookahead = lexer.next();
    if (lookahead.done) {
      throw new Error('Unexpected end of token');
    }
    this.lookahead = lookahead.value;
  }
  public match(types: T[]) {
    if (types.indexOf(this.lookahead[0]) === -1) {
      throw new Error(`Unexpected token ${this.lookahead[1]}`);
    }
  }
  public consume(): [T, string] {
    const token = this.lookahead;
    const lookahead = this.lexer.next();
    if (lookahead.done) {
      throw new Error('Unexpected end of token');
    }
    this.lookahead = lookahead.value;
    return token;
  }
}
