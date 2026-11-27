/**
 * 判定の表 (`judge`、#3879) の原本の形。原本の根の `judge` の欄に持ち、ブロックの宣言の欄 (`blocks`) を使わない。
 * dragon は値を比べず、例ごとに書いた外れる規則 (`fails`) だけを✕にし、書かない規則を✓にする (docs/adr/0011)
 */

/**
 * 列の規則。`id` は `fail` の行が名指す名札、`name` は見出しの名前、`value` は見出しの名前の下に出す値。
 * `note` は規則の説明で、札で見せる表 (#3890) では見出しを押すと出る札の本文に、札で見せない表では表の下に番号と名前と一緒に並べる (#4008)。
 * `example` は札の下の灰色の例の帯で、札で見せる表の `note` を持つ規則だけが持てる
 */
export interface JudgeRule {
  id: string;
  name: string;
  value?: string;
  note?: string;
  example?: string;
}

/** 例が外れる規則。`value` は✕の下に出す外れた値。`stop` は照らせない印で、その後の列のセルを「—」にする */
export interface JudgeFail {
  rule: string;
  value?: string;
  stop?: true;
}

/**
 * 行の例。`note` は例の名前の下に出す添え書きで、札で見せる表 (#3890) では名前の下に描かず、名前を押すと出る札の本文にする。
 * `example` は札の下の灰色の例の帯で、札で見せる表の `note` を持つ例だけが持てる。外れる規則を持たない例は `fails` を持たない。
 * `scene` は説明の頁の同じ問いの節の場面の図の場面の名前で、例の行を押すとその場面を止まる段まで追う (#3892)
 */
export interface JudgeCase {
  name: string;
  note?: string;
  example?: string;
  scene?: string;
  fails?: JudgeFail[];
}

/** 判定の表の規則と例。`pass` と `block` は判定の語で、書かない時は頁の言葉の既定の語 (通すと止める、`pass` と `block`) を出す */
export interface JudgeSpec {
  pass?: string;
  block?: string;
  rules: JudgeRule[];
  cases: JudgeCase[];
}
