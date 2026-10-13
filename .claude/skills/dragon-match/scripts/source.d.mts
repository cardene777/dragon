export type 図のsource = {
  type: "html" | "catalog";
  palette?: string;
  [key: string]: unknown;
};

export type 比較の設定 = {
  label?: string;
  expected: 図のsource;
  actual: 図のsource;
};

export type 比較 = 比較の設定 & {
  label: string;
  palette: string | null;
};

export function 比較一覧(config: {
  label?: string;
  expected?: 図のsource;
  actual?: 図のsource;
  comparisons?: 比較の設定[];
}): 比較[];
