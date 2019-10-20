/*
 * recordLabel
 *   : field ('|' field )*
 *   ;
 * field
 *   : (’<’ string ’>’)? string?
 *   | '{' recordLabel '}'
 *   ;
 */

enum TokenEnum {
  EOF,
  VERTICAL_BAR,
  LEFT_CURLY_BRACE,
  RIGHT_CURLY_BRACE,
  LEFT_ANGLE_BRACE,
  RIGHT_ANGLE_BRACE,
  STRING,
}

interface Token {
  type: TokenEnum;
  text?: string;
}

export interface Record {
  type: 'record';
  children: RecordData[];
}

export interface Field {
  type: 'field';
  port?: string;
  text?: string;
}

export type RecordData = Record | Field;

export default function recordParser(record: string): RecordData {
  let position = 0;
  const buffer: Token[] = [];
  function lexer(): Token {
    if (buffer.length) {
      return buffer.pop()!;
    }
    while (position < record.length &&
           ' \t\n\r\v'.indexOf(record[position]) > -1) {
      ++position;
    }
    if (position >= record.length) {
      return { type: TokenEnum.EOF };
    }
    switch (record[position]) {
      case '|':
        ++position;
        return { type: TokenEnum.VERTICAL_BAR };
      case '{':
        ++position;
        return { type: TokenEnum.LEFT_CURLY_BRACE };
      case '}':
        ++position;
        return { type: TokenEnum.RIGHT_CURLY_BRACE };
      case '<':
        ++position;
        return { type: TokenEnum.LEFT_ANGLE_BRACE };
      case '>':
        ++position;
        return { type: TokenEnum.RIGHT_ANGLE_BRACE };
      default: {
        let text = '';
        while (position < record.length &&
               ' \t\n\r\v|{}<>'.indexOf(record[position]) === -1) {
          if (record[position] === '\\') {
            ++position;
            if (position === record.length) {
              throw new Error('Unexpected end of escape sequence');
            }
            switch (record[position]) {
              case 'n':
                text += '\n';
                break;
              default:
                text += record[position];
            }
          } else {
            text += record[position];
          }
          ++position;
        }
        return { type: TokenEnum.STRING, text };
      }
    }
  }
  function parseRecordLabel(): Record {
    const children = [parseField()];
    let token;
    while ((token = lexer())!.type === TokenEnum.VERTICAL_BAR) {
      children.push(parseField());
    }
    buffer.push(token);
    return { type: 'record', children };
  }
  function parseField(): RecordData {
    let token = lexer();
    if (token.type === TokenEnum.LEFT_CURLY_BRACE) {
      const ret = parseRecordLabel();
      if (lexer().type !== TokenEnum.RIGHT_CURLY_BRACE) {
        throw new Error('Expect \'}\'');
      }
      return ret;
    }
    const result: Field = { type: 'field' };
    if (token.type === TokenEnum.LEFT_ANGLE_BRACE) {
      token = lexer();
      if (token.type === TokenEnum.STRING) {
        let port = token.text;
        while ((token = lexer()).type === TokenEnum.STRING) {
          port += ' ' + token.text;
        }
        result.port = port;
      }
      if (token.type !== TokenEnum.RIGHT_ANGLE_BRACE) {
        throw new Error('Expect \'>\'');
      }
      token = lexer();
    }
    if (token.type === TokenEnum.STRING) {
      let text = token.text;
      while ((token = lexer()).type === TokenEnum.STRING) {
        text += ' ' + token.text;
      }
      result.text = text;
    }
    buffer.push(token);
    return result;
  }
  const tree = parseRecordLabel();
  if (lexer().type !== TokenEnum.EOF) {
    throw new Error('Unexpected token');
  }
  return tree;
}
