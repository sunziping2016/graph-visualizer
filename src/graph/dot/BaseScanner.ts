export default class BaseScanner<T> {
  private readonly tokens: Array<[T, string, boolean]>;
  private readonly symbols: { [symbol: string]: T };
  private readonly literals: { [symbol: string]: T };
  private readonly eofToken: T;
  private readonly skipToken?: T;
  private readonly tokensRegex: RegExp;
  public constructor(tokens: Array<[T, string, boolean]>,
                     symbols: { [symbol: string]: T },
                     literals: { [symbol: string]: T },
                     ignoreCase: boolean,
                     eofToken: T,
                     skipToken: T | undefined) {
    this.tokens = tokens;
    this.symbols = symbols;
    this.literals = literals;
    this.eofToken = eofToken;
    this.skipToken = skipToken;
    let flags = 's';
    if (ignoreCase) {
      flags += 'i';
    }
    this.tokensRegex = new RegExp('^(?:' + tokens.map(
      (x) => '(' + x[1] + ')').join('|') + ')', flags);
  }
  public next(buf: string): [T, string, string] {
    if (!buf.length) {
      return [this.eofToken, '', ''];
    }
    const mo = buf.match(this.tokensRegex);
    if (mo) {
      let lastIndex = -1;
      for (let i = 0; i < this.tokens.length; ++i) {
        if (mo[i + 1]) {
          lastIndex = i;
          break;
        }
      }
      if (lastIndex < 0) {
        throw new Error('Cannot find token index');
      }
      const [type, , testLit] = this.tokens[lastIndex];
      const finalType = testLit ? this.literals[mo[0]] || type : type;
      return [finalType, mo[0], buf.slice(mo[0].length)];
    } else {
      const type = this.symbols[buf[0]];
      if (!type) {
        throw new Error('Unexpected character');
      }
      return [type, buf[0], buf.slice(1)];
    }
  }
  public * scan(input: string): Generator<[T, string]> {
    while (true) {
      const [type, text, newInput] = this.next(input);
      input = newInput;
      if (this.skipToken && type === this.skipToken) {
        continue;
      }
      yield [type, text];
      if (type === this.eofToken) {
        break;
      }
    }
  }
}
