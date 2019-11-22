export interface CommonNodeData {
  type: 'node';
  id: string;
}

export interface BoxNodeData extends CommonNodeData {
  shape: 'box';
  label?: string;
  style?: 'solid' | 'filled';           // default 'solid'
  fillColor?: string;                   // default 'white'
  strokeColor?: string;                 // default 'black'
  strokeWidth?: number;                 // default 1
  fontSize?: number;                    // default 12
  fontFamily?: string;                  // default 'sans-serif'
  lineHeight?: number;                  // default 1.2
  padding?: number;                     // default 4
  align?: 'left' | 'center' | 'right';  // default 'center'
}

/*
 * `label` contains text followed by following syntax:
 *
 * ```
 * recordLabel
 *   : field ('|' field )*
 *   ;
 * field
 *   : (’<’ string ’>’)? string?
 *   | '{' recordLabel '}'
 *   ;
 * ```
 *
 * The string enclosed in the angle brackets is port, which is used to refer
 * to that cell.
 */
export interface RecordNodeData extends CommonNodeData {
  shape: 'record';
  label: string;                        // see above
  direction: 'horizontal' | 'vertical'; // default 'horizontal'
  style?: 'solid' | 'filled';           // default 'solid'
  fillColor?: string;                   // default 'white'
  strokeColor?: string;                 // default 'black'
  strokeWidth?: number;                 // default 1
  fontSize?: number;                    // default 12
  fontFamily?: string;                  // default 'sans-serif'
  lineHeight?: number;                  // default 1.2
  padding?: number;                     // default 4
  align?: 'left' | 'center' | 'right';  // default 'center'
}

/*
 * `label` must be html, the only valid elements are `table`, `tr` and `td`.
 * There must be only one `table` as the root element in html, several `tr`
 * may be nested in `table`, and several `td` may be nested in every `tr`.
 *
 * `table` element may contain following four attributes:
 * - `border`: width of the border of the whole table. It expands in both
 *   inner and outer direction.
 * - `cellborder`: width of the border of every `td`, It also expands in
 *   both inner and outer direction.
 * - `cellspacing`: space between cell. By default, cell border is collapsed.
 * - `cellpadding`: space between content and cell border.
 *
 * `tr` element is not allowed to contain attributes.
 *
 * `td` element may contain following four attributes:
 * - `rowspan`: number of rows spanned by the cell.
 * - `colspan`: number of columns spanned by the cell.
 * - `border`: width of the border of the cell. It expands in both inner
 *   and outer direction.
 * - `bgcolor`: background color of the cell.
 * - `port`: id of the cell, used to refer to that cell.
 */
export interface TableNodeData extends CommonNodeData {
  shape: 'table';
  label: string;                        // see above
  fontSize?: number;                    // default 12
  fontFamily?: string;                  // default 'sans-serif'
  lineHeight?: number;                  // default 1.2
}

export type NodeData = BoxNodeData | RecordNodeData | TableNodeData;

/*
 * `from` and `to` are the `:` separated id string. Lookup starts from root.
 * Graph id may be omitted. For example, assuming node `n` is in graph `d`,
 * node `n` can be referred as both `d:n` and `n`.
 */
export interface CommonEdgeData {
  type: 'edge';
  id?: string;
  from: string;                         // starting node for edge
  to: string;                           // ending node for edge
}

export interface CommonLineEdgeData extends CommonEdgeData {
  fromPointer?: boolean;                // default false
  toPointer?: boolean;                  // default true
  lineColor?: string;                   // default 'black'
  lineWidth?: number;                   // default 1
  pointerColor?: string;                // default 'black'
  pointerWidth?: number;                // default 10
  pointerHeight?: number;               // default 15
}

export interface StraightEdgeData extends CommonLineEdgeData {
  shape: 'straight';
}

export interface QuadraticEdgeData extends CommonLineEdgeData {
  shape: 'quadratic';
}

export type EdgeData = StraightEdgeData | QuadraticEdgeData;

export interface KamadaKawaiGraphLayoutData {
  type: 'KamadaKawai';
  springLength?: number;                 // default 150
  springConstant?: number;               // default 0.05
  preferredEdgeDirection?: number | 'any'; // angle in degree, default 'any'
}

export type GraphLayoutData = KamadaKawaiGraphLayoutData;

export interface BarnesHutGraphPhysicsData {
  type: 'BarnesHut';
  theta?: number;                        // default 1
  gravitationalConstant?: number;        // default -2000
  centralGravity?: number;               // default 0.3
  springLength?: number;                 // default 150
  springConstant?: number;               // default 0.04
  damping?: number;                      // default 0.09
  maxVelocity?: number;                  // default 50
}

export type GraphPhysicsData = BarnesHutGraphPhysicsData;

export interface LinearComponentLayoutData {
  type: 'linear';
  direction?: 'TD' | 'DT' | 'LR' | 'RL'; // layout direction for components
                                         // default 'TD'
  spaceBetween?: number;                 // default 12
}

export type ComponentLayoutData = LinearComponentLayoutData;

export interface CommonGraphData {
  type: 'graph';
  id: string;
  children?: RenderableData[];
  layout?: GraphLayoutData;
  physics?: GraphPhysicsData;
  component?: ComponentLayoutData;
}

export interface BoxGraphData extends CommonGraphData {
  shape: 'box';
  label?: string;
  labelPosition?: 'top' | 'right' | 'bottom' | 'left'; // default top
  style?: 'solid' | 'filled' | 'none';  // default 'none'
  fillColor?: string;                   // default 'white'
  strokeColor?: string;                 // default 'black'
  strokeWidth?: number;                 // default 0
  fontSize?: number;                    // default 12
  fontFamily?: string;                  // default 'sans-serif'
  lineHeight?: number;                  // default 1.2
  padding?: number;                     // default 4
  align?: 'left' | 'center' | 'right';  // default 'center'
  spaceBetween?: number;                // default 12, space between title and
                                        // content
}

export type GraphData = BoxGraphData;

export type RenderableData = GraphData | NodeData | EdgeData;

export interface Size {
  width: number;
  height: number;
}

export interface Position {
  x: number;
  y: number;
}

export type Vector = Position;
