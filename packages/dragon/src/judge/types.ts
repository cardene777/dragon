/**
 * 判定の表 (`judge`、#3879) の原本の形。原本の根の `judge` の欄に持ち、ブロックの宣言の欄 (`blocks`) を使わない。
 * dragon は値を比べず、例ごとに書いた外れる規則 (`fails`) だけを✕にし、書かない規則を✓にする (docs/adr/0011)
 */

/** 列の規則。`id` は `fail` の行が名指す名札、`name` は見出しの名前、`value` は見出しの名前の下に出す値 */
export interface JudgeRule {
  id: string;
  name: string;
  value?: string;
}

/** 例が外れる規則。`value` は✕の下に出す外れた値。`stop` は照らせない印で、その後の列のセルを「—」にする */
export interface JudgeFail {
  rule: string;
  value?: string;
  stop?: true;
}

/** 行の例。`note` は例の名前の下に出す添え書き。外れる規則を持たない例は `fails` を持たない */
export interface JudgeCase {
  name: string;
  note?: string;
  fails?: JudgeFail[];
}

/** 判定の表の規則と例。`pass` と `block` は判定の語で、書かない時は頁の言葉の既定の語 (通すと止める、`pass` と `block`) を出す */
export interface JudgeSpec {
  pass?: string;
  block?: string;
  rules: JudgeRule[];
  cases: JudgeCase[];
}
