/**
 * 値 (`values`) と状態 (`states`) の名前と式が、記法として書ける範囲に収まっているかの判定。
 *
 * **入口が 2 つあるので 1 か所に置く** (#1181)。 記法 (`v05/parser.ts`) と JSON
 * (`json-parser.ts`) が同じ判定を使う。 別々に持つと片方だけが受け付ける形ができ、
 * 「YAML では弾かれるのに JSON では通る」 (またはその逆) が生まれる。
 *
 * 位置の付け方だけが入口で違う (記法は行番号、JSON は field の path)。 そのため本 file は
 * 位置を持たない指摘だけを返し、呼出側が自分の形に包む。
 */

/** 値と状態の名前。 描画側が `{名前}` を置き換える時に見る範囲と揃える (英数字と `_` のみ) */
const VALUE_NAME_RE = /^[a-zA-Z_][a-zA-Z0-9_]*$/;

/** 式に書ける関数。 spec が「関数呼び出しは入れない」 としつつ例外にしている 2 つだけ */
const VALUE_FNS: ReadonlySet<string> = new Set(["min", "max"]);

/** 位置を持たない指摘。 呼出側が行番号 (記法) か path (JSON) を付けて報告する */
export type ValueSyntaxIssue = {
  message: string;
  hint?: string;
};

/** 値 / 状態の名前として使えるか */
export function isValueName(name: string): boolean {
  return VALUE_NAME_RE.test(name);
}

/** 名前が使えない時の指摘 */
export function valueNameIssue(name: string): ValueSyntaxIssue {
  return {
    message: `invalid value name: "${name}"`,
    hint: "英字か _ で始め、 英数字と _ だけを使う (states と同じ規則)",
  };
}

/**
 * 式が記法として書ける範囲に収まっているかを見る。
 *
 * 式が文法として正しいかは見ない。 そこは描画側が評価する時に判定して、その値だけを止める
 * (spec § 4.2 = 1 箇所の壊れで図全体を止めない)。 ここで見るのは **記法として書ける範囲に
 * 収まっているか**で、描画側が受け付けるが記法としては認めない書き方 (余り / 条件分岐 /
 * `min` `max` 以外の関数) を弾く。
 *
 * `{名前}` の中身と外側を分けて見る。 分けないと、名前に紛れた記号を式の記号と読み違える。
 */
export function checkValueExpression(expression: string, name: string): ValueSyntaxIssue[] {
  const issues: ValueSyntaxIssue[] = [];

  // `{名前}` の中身は名前の規則で見る
  const refRe = /\{([^}]*)\}/g;
  let m: RegExpExecArray | null;
  while ((m = refRe.exec(expression)) !== null) {
    const ref = (m[1] ?? "").trim();
    if (!VALUE_NAME_RE.test(ref)) {
      issues.push({
        message: `invalid reference "{${ref}}" in "${name}"`,
        hint: "英字か _ で始め、 英数字と _ だけを使う",
      });
    }
  }
  if (expression.includes("{") && !expression.includes("}")) {
    issues.push({ message: `unclosed "{" in "${name}"`, hint: "`{名前}` の形で閉じる" });
  }

  // 名前を外した残りが式の骨格。 ここに記法外の記号や関数が無いかを見る
  const outside = expression.replace(/\{[^}]*\}/g, " ");
  if (outside.includes("%")) {
    issues.push({ message: `"%" は式に書けない ("${name}")`, hint: "四則 (+ - * /) だけを使う" });
  }
  if (outside.includes("?")) {
    issues.push({
      message: `条件分岐 (?:) は式に書けない ("${name}")`,
      hint: "比較の結果は真 = 1 / 偽 = 0 の数になるので、 掛け算で切り替える",
    });
  }
  for (const fn of outside.matchAll(/[a-zA-Z_][a-zA-Z0-9_.]*/g)) {
    const word = fn[0];
    if (VALUE_FNS.has(word)) continue;
    issues.push({
      message: `"${word}" は式に書けない ("${name}")`,
      hint:
        word.startsWith("Math.")
          ? "min / max は Math. を付けずに書く"
          : `使えるのは ${[...VALUE_FNS].join(" / ")} だけ。 値は {名前} で読む`,
    });
  }
  const stray = outside.replace(/[a-zA-Z_][a-zA-Z0-9_.]*/g, " ").match(/[^0-9.,+\-*/()<>=!\s]/g);
  if (stray) {
    issues.push({
      message: `"${[...new Set(stray)].join("")}" は式に書けない ("${name}")`,
      hint: "四則 (+ - * /) / 括弧 / 比較 (> >= < <= == !=) / min / max だけを使う",
    });
  }

  return issues;
}
