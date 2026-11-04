/** 座標を小数 2 桁に丸める。ブロックの描き方 (`blocks/<名前>/draw.ts`) も同じ丸めで書く。描く部品の下請け (`parts.ts`) が同じ名前で出す */
export const r1 = (v: number): number => Math.round(v * 100) / 100;
