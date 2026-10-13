export type 点 = { x: number; y: number };

export type 印の測定値 = {
  position: "start" | "end";
  endpoint: 点;
  oppositeEndpoint: 点;
  tangentAngle: number;
  points: 点[];
  viewBox: { x: number; y: number; width: number; height: number };
  refX: number;
  refY: number;
  markerWidth: number;
  markerHeight: number;
  markerUnits: "strokeWidth" | "userSpaceOnUse";
  strokeWidth: number;
  preserveAspectRatio: string;
  orient: "angle" | "auto" | "auto-start-reverse";
  angle: number;
  matrix: { a: number; b: number; c: number; d: number; e: number; f: number };
};

export function 印の最遠点(marker: 印の測定値): 点;
