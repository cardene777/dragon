/**
 * 判定の表 (`judge`、#3879) の定義。
 * 例を行に、規則を列に並べて✓と✕で照らし、最後の列に行ごとの判定を置く。字を縮めないよう SVG でなく HTML の表で描き、
 * 規則と例と外れる規則は種類の読み方 (`judge/read.ts`) が読むので、ブロックの付け方を受け付けない。
 * 見本帳を開いた時に読まない図の種類なので、並べ方 (`layout.ts`) を読まずに後から読むと名乗る
 */
import type { Kind } from "../kind";

export const kind: Kind = {
  name: "judge",
  accepts: [],
  // 種類の読み方が読む、列の規則と行の例と外れる規則の行。軽い入口は記法を読む前に、この種類の部品を読む
  fields: ["judge-rule", "judge-case", "judge-fail"],
  later: true,
};
