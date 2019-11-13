/*
 * Any shape whose draggable is true and id is present will be a real draggable
 * shape. And all its children (including not directly) will also be a draggable
 * shape with its id.
 */
export interface CommonShape {
  id?: string;
  draggable?: boolean;                  // default false
}

export interface GroupShape extends CommonShape {
  is: 'group';
  x?: number;                           // default 0
  y?: number;                           // default 0
  scaleX?: number;                      // default 1
  scaleY?: number;                      // default 1
  children?: AnyShape[];
}

/*
 * `RectShape` has a hit region of which size equals to fill region and, when
 * stroked, stroke region.
 */
export interface RectShape extends CommonShape {
  is: 'rect';
  x?: number;                           // default 0
  y?: number;                           // default 0
  width?: number;                       // default 0
  height?: number;                      // default 0
  fill?: string;                        // default not fill
  stroke?: string;                      // default not stoke
  strokeWidth?: number;                 // default 1
}

export interface TextShape extends CommonShape {
  is: 'text';
  x?: number;                           // default 0
  y?: number;                           // default 0
  text?: string;
  fontSize?: number;                    // default 12
  fontFamily?: string;                  // default 'sans-serif'
  lineHeight?: number;                  // default 1.2
  padding?: number;                     // default 4
  fill?: string;                        // default 'black'
  align?: 'left' | 'right' | 'center';  // default center
}

export interface LineShape extends CommonShape {
  is: 'line';
  stroke?: string;                      // default ‘black'
  strokeWidth?: number;                 // default 1
  points?: number[];                    // default [0, 0, 0, 0]
}

export interface LineQuadraticShape extends CommonShape {
  is: 'quadraticLine';
  stroke?: string;                      // default ‘black'
  strokeWidth?: number;                 // default 1
  points?: number[];                    // default [0, 0, 0, 0, 0, 0]
}

export interface PointerShape extends CommonShape {
  is: 'pointer';
  x?: number;                           // default 0
  y?: number;                           // default 0
  angle?: number;                       // default 0
  width?: number;                       // default 10
  height?: number;                      // default 15
  fill?: string;                        // default 'black'
}

export interface RectWithWholeShape extends CommonShape {
  is: 'rectWithWhole';
  outerLeft: number;                    // default 0
  outerRight: number;                   // default 0
  outerTop: number;                     // default 0
  outerBottom: number;                  // default 0
  innerLeft: number;                    // default 0
  innerRight: number;                   // default 0
  innerTop: number;                     // default 0
  innerBottom: number;                  // default 0
  fill?: string;                        // default 'white'
}

export type AnyShape = GroupShape | RectShape | TextShape | LineShape |
  LineQuadraticShape | PointerShape | RectWithWholeShape;
