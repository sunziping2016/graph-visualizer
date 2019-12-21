/* tslint:disable:no-bitwise */

import {XdotPen, XdotShape} from '@/graph/base/dataXdot';

enum FontCharacteristics {
  BOLD = 1,
  ITALIC = 2,
  UNDERLINE = 4,
  SUPERSCRIPT = 8,
  SUBSCRIPT = 16,
  STRIKE_THROUGH = 32,
  OVERLINE = 64,
}

function HSVtoRGB(h: number, s: number, v: number): [number, number, number] {
  let r = 0;
  let g = 0;
  let b = 0;
  const i = Math.floor(h * 6);
  const f = h * 6 - i;
  const p = v * (1 - s);
  const q = v * (1 - f * s);
  const t = v * (1 - (1 - f) * s);
  switch (i % 6) {
    case 0: r = v; g = t; b = p; break;
    case 1: r = q; g = v; b = p; break;
    case 2: r = p; g = v; b = t; break;
    case 3: r = p; g = q; b = v; break;
    case 4: r = t; g = p; b = v; break;
    case 5: r = v; g = p; b = q; break;
  }
  return [r, g, b];
}

export default class XDotAttrParser {
  private readonly pen: XdotPen;
  private readonly input: string;
  private pos: number;
  public constructor(input: string) {
    this.pen = {
      color: [0.0, 0.0, 0.0, 1.0],
      fillcolor: [0.0, 0.0, 0.0, 1.0],
      linewidth: 1.0,
      fontsize: 14.0,
      fontname: 'Times-Roman',
      bold: false,
      italic: false,
      underline: false,
      superscript: false,
      subscript: false,
      strikethrough: false,
      overline: false,
      dash: [],
    };
    this.input = input;
    this.pos = 0;
  }
  public parse(): XdotShape[] {
    const shapes: XdotShape[] = [];
    while (this.pos < this.input.length) {
      const op = this.readCode();
      switch (op) {
        case 'c':
          this.pen.color = this.readColor();
          break;
        case 'C':
          this.pen.fillcolor = this.readColor();
          break;
        case 'S': {
          const style = this.readText();
          if (style.startsWith('setlinewidth')) {
            const lw = style.split('(')[1].split(')')[0];
            this.pen.linewidth = parseFloat(lw);
          } else if (['solid', 'dashed', 'dotted'].indexOf(style) !== -1) {
            if (style === 'solid') {
              this.pen.dash = [];
            } else if (style === 'dashed') {
              this.pen.dash = [6];
            } else {
              this.pen.dash = [2, 4];
            }
          } else {
            throw new Error('Unknown line style');
          }
          break;
        }
        case 'F':
          this.pen.fontsize = this.readFloat();
          this.pen.fontname = this.readText();
          break;
        case 'T': {
          const [x, y] = this.readPoint();
          const centering = this.readInt();
          if ([-1, 0, 1].indexOf(centering) === -1) {
            throw new Error('Wrong centering parameter');
          }
          const width = this.readFloat();
          const text = this.readText();
          shapes.push({
            is: 'xdot',
            type: 'text',
            pen: Object.assign({}, this.pen),
            x, y,
            centering: centering as any,
            width, text,
          });
          break;
        }
        case 't': {
          const f = this.readInt();
          this.pen.bold = !!(f & FontCharacteristics.BOLD);
          this.pen.italic = !!(f & FontCharacteristics.ITALIC);
          this.pen.underline = !!(f & FontCharacteristics.UNDERLINE);
          this.pen.superscript = !!(f & FontCharacteristics.SUPERSCRIPT);
          this.pen.subscript = !!(f & FontCharacteristics.SUBSCRIPT);
          this.pen.strikethrough = !!(f & FontCharacteristics.STRIKE_THROUGH);
          this.pen.overline = !!(f & FontCharacteristics.OVERLINE);
          break;
        }
        case 'E': case 'e': {
          const [x, y] = this.readPoint();
          const width = this.readFloat();
          const height = this.readFloat();
          if (op === 'E') {
            shapes.push({
              is: 'xdot',
              type: 'ellipse',
              pen: Object.assign({}, this.pen),
              x, y, width, height,
              filled: true,
            });
          }
          shapes.push({
            is: 'xdot',
            type: 'ellipse',
            pen: Object.assign({}, this.pen),
            x, y, width, height,
            filled: false,
          });
          break;
        }
        case 'L': {
          const points = this.readPolygon();
          shapes.push({
            is: 'xdot',
            type: 'line',
            pen: Object.assign({}, this.pen),
            points,
          });
          break;
        }
        case 'B': case 'b': {
          const points = this.readPolygon();
          if (op === 'b') {
            shapes.push({
              is: 'xdot',
              type: 'bezier',
              pen: Object.assign({}, this.pen),
              points: JSON.parse(JSON.stringify(points)),
              filled: true,
            });
          }
          shapes.push({
            is: 'xdot',
            type: 'bezier',
            pen: Object.assign({}, this.pen),
            points,
            filled: false,
          });
          break;
        }
        case 'P': case 'p': {
          const points = this.readPolygon();
          if (op === 'P') {
            shapes.push({
              is: 'xdot',
              type: 'polygon',
              pen: Object.assign({}, this.pen),
              points: JSON.parse(JSON.stringify(points)),
              filled: true,
            });
          }
          shapes.push({
            is: 'xdot',
            type: 'polygon',
            pen: Object.assign({}, this.pen),
            points,
            filled: false,
          });
          break;
        }
        case 'I': {
          const [x, y] = this.readPoint();
          const width = this.readFloat();
          const height = this.readFloat();
          const path = this.readText();
          shapes.push({
            is: 'xdot',
            type: 'image',
            pen: Object.assign({}, this.pen),
            x, y, width, height, path,
          });
          break;
        }
        default:
          throw new Error(`Unknown operation code ${op}`);
      }
    }
    return shapes;
  }
  private readCode(): string {
    const pos = this.input.indexOf(' ', this.pos);
    if (pos === -1) {
      throw new Error('Unexpected ending of xdot attribute');
    }
    const res = this.input.slice(this.pos, pos);
    this.pos = pos + 1;
    this.skipSpace();
    return res;
  }
  private skipSpace() {
    while (this.pos < this.input.length && this.input[this.pos] === ' ') {
      ++this.pos;
    }
  }
  private readInt(): number {
    return parseInt(this.readCode(), 10);
  }
  private readFloat(): number {
    return parseFloat(this.readCode());
  }
  private readPoint(): [number, number] {
    const x = this.readFloat();
    const y = this.readFloat();
    return [x, y];
  }
  private readText(): string {
    const num = this.readInt();
    const pos = this.input.indexOf('-', this.pos) + 1;
    this.pos = pos + num;
    const res = this.input.slice(pos, this.pos);
    this.skipSpace();
    return res;
  }
  private readPolygon(): Array<[number, number]> {
    const n = this.readInt();
    const p = [];
    for (let i = 0; i < n; ++i) {
      p.push(this.readPoint());
    }
    return p;
  }
  private readColor(): [number, number, number, number] {
    const c = this.readText();
    const c1 = c[0];
    if (c1 === '#') {
      const r = parseInt(c.slice(1, 3), 16);
      const g = parseInt(c.slice(3, 5), 16);
      const b = parseInt(c.slice(5, 7), 16);
      const a = c.length >= 9 ? parseInt(c.slice(7, 9), 16) / 255.0 : 1.0;
      return [r, g, b, a];
    } else if ((c1 >= '0' && c1 <= '9') || c1 === '.') {
      const hsv = c.replace(/,/g, ' ').split(/\s+/);
      if (hsv.length !== 3) {
        throw new Error('Wrong HSV color');
      }
      const [h, s, v] = hsv.map(parseFloat);
      const [r, g, b] = HSVtoRGB(h, s, v);
      return [r, g, b, 1.0];
    } else {
      throw new Error('Unsupported color');
    }
  }
}
