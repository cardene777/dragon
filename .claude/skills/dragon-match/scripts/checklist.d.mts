export type 一覧の判定 = {
  name: string;
  type: string;
  status: "合う" | "合わない" | "測れない" | "cdl 待ち";
  actual?: string;
  missing?: string[];
  expected?: string;
  cdl待ち?: { 理由: string; "cdl の課題": string };
};

export type 色の項目 = {
  名: string;
  種類: "色";
  字: string;
  部分: "地" | "枠" | "字";
  役: string | string[];
};

export type 崩れ = {
  count: number;
  overlaps: { first: string; second: string }[];
  textOverflows: { text: string; box: string; amount: number }[];
  outside: { kind: string; id: string; amount: number }[];
};

export function 一覧を検証する(checklist: unknown): unknown;
export function noteの値を読む(note: string): Map<string, string>;
export function 崩れを調べる(measurement: unknown): 崩れ;
export function 一覧を判定する(
  checklist: unknown,
  measurement: unknown,
  noteValues?: Map<string, string> | null,
): { items: 一覧の判定[]; layout: 崩れ };
export function 一覧の誤り(
  comparisons: { label: string; items: 一覧の判定[] }[],
): { label: string; name: string; status: "合わない"; actual: string }[];
export const 接続の許容距離: number;
export const 矢じりの接触距離: number;
export const 矢じりの最大距離: number;
