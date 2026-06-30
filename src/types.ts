export type NodeStyle = 'circle' | 'square' | 'rect';
export type LineStyle = 'solid' | 'dashed';
export type InteractionMode = 'none' | 'place-spawn' | 'mark-fault';

export interface Node {
  id: string;
  x: number;
  y: number;
  isSpawn?: boolean;
}

export interface Connection {
  id: string;
  fromNodeId: string;
  toNodeId: string;
}

export interface Measurement {
  connectionId: string;
  label: string;
  unit?: string;
}

export interface StyleConfig {
  nodeStyle: NodeStyle[];   // one or more; multiple values cycle through per node
  lineStyle: LineStyle;
  strokeWidth: number;
  dashPattern?: string;
}
