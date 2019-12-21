export interface XdotPen {
  color: [number, number, number, number];
  fillcolor: [number, number, number, number];
  linewidth: number;
  fontsize: number;
  fontname: string;
  bold: boolean;
  italic: boolean;
  underline: boolean;
  superscript: boolean;
  subscript: boolean;
  strikethrough: boolean;
  overline: boolean;
  dash: number[];
}

interface XdotCommonShape {
  is: 'xdot';
  pen: XdotPen;
  id?: string;
  draggable?: boolean;
}

export interface XdotTextShape extends XdotCommonShape {
  type: 'text';
  x: number;
  y: number;
  centering: -1 | 0 | 1;
  width: number;
  text: string;
}

export interface XdotEllipseShape extends XdotCommonShape {
  type: 'ellipse';
  x: number;
  y: number;
  width: number;
  height: number;
  filled: boolean;
}

export interface XdotLineShape extends XdotCommonShape {
  type: 'line';
  points: Array<[number, number]>;
}

export interface XdotBezierShape extends XdotCommonShape {
  type: 'bezier';
  points: Array<[number, number]>;
  filled: boolean;
}

export interface XdotPolygonShape extends XdotCommonShape {
  type: 'polygon';
  points: Array<[number, number]>;
  filled: boolean;
}

export interface XdotImageShape extends XdotCommonShape {
  type: 'image';
  x: number;
  y: number;
  width: number;
  height: number;
  path: string;
}

export type XdotShape = XdotTextShape | XdotEllipseShape | XdotLineShape | XdotBezierShape |
  XdotPolygonShape | XdotImageShape;

export interface DotNodeId {
  id: string;
  port?: string;
  compass?: 'n' | 'ne' | 'e' | 'se' | 's' | 'sw' | 'w' | 'nw' | 'c' | '_';
}

export interface DotCommonElement {
  attrs: { [attr: string]: string };
  shapes?: { [draw: string]: XdotShape[] };
}

export interface DotCommonGraph extends DotCommonElement {
  id?: string;
  nodeAttrs: { [attr: string]: string };
  edgeAttrs: { [attr: string]: string };
  children: Array<DotNode | DotEdge | DotSubgraph>;
}

export interface DotGraph extends DotCommonGraph {
  type: 'graph';
  strict: boolean;
  directed: boolean;
}

export interface DotSubgraph extends DotCommonGraph {
  type: 'subgraph';
}

export interface DotNode extends DotCommonElement {
  type: 'node';
  id: DotNodeId;
}

export interface DotEdge extends DotCommonElement {
  type: 'edge';
  from: DotNodeId;
  to: DotNodeId;
}

export type DotElement = DotGraph | DotSubgraph | DotNode | DotEdge;
