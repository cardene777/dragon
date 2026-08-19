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

/** きっかけ形の読み取り結果。 位置は呼出側が付ける (本 file の方針) */
export type ParsedValueTrigger = {
  trigger:
    | { kind: "step"; step: string }
    | { kind: "reaches"; source: string; op: TriggerOp; threshold: number };
  to: number;
  durationMs: number;
};

export type TriggerOp = ">=" | ">" | "<=" | "<" | "==" | "!=";

/** 比較の記号。 **2 文字を先に見る** = `>=` を `>` と読むと境目が 1 つずれる */
const TRIGGER_OPS: readonly TriggerOp[] = [">=", "<=", "==", "!=", ">", "<"];

/**
 * 動く長さを ms に直す。 段の頭 (`"取込み" 2s`) と同じ書き方を受ける。
 *
 * 単位を書かない形は秒として読む (段の頭と揃える)。 0 以下は動かないので受けない。
 */
export function parseDurationMs(text: string): number | null {
  const m = text.trim().match(/^(\d+(?:\.\d+)?)\s*(ms|s)?$/);
  if (!m) return null;
  const n = parseFloat(m[1] ?? "0");
  if (!Number.isFinite(n) || n <= 0) return null;
  const unit = m[2] ?? "s";
  return unit === "ms" ? Math.round(n) : Math.round(n * 1000);
}

/**
 * 引用の外にある `,` だけで切る。
 *
 * 素朴な `split(",")` を使えない。 段の名前に `,` を書ける (`step "取込み, 検証"`) ため、
 * 引用の中で切ると名前が 2 つに割れる。
 */
function splitOutsideQuotes(body: string): string[] {
  const out: string[] = [];
  let cur = "";
  let quote: string | null = null;
  for (const ch of body) {
    if (quote) {
      if (ch === quote) quote = null;
      cur += ch;
      continue;
    }
    if (ch === '"' || ch === "'") {
      quote = ch;
      cur += ch;
      continue;
    }
    if (ch === ",") {
      out.push(cur);
      cur = "";
      continue;
    }
    cur += ch;
  }
  out.push(cur);
  return out.map((s) => s.trim()).filter((s) => s !== "");
}

/** 引用を外す。 引用の中の `,` を守るために引用を残したまま切っているので、 ここで落とす */
function unquote(s: string): string {
  const t = s.trim();
  if (t.length >= 2 && (t[0] === '"' || t[0] === "'") && t[t.length - 1] === t[0]) {
    return t.slice(1, -1);
  }
  return t;
}

/**
 * きっかけの本体を読む (`step "取込み"` / `vDone >= 100`)。
 *
 * **`step` を先に見る**。 後に回すと `step "x"` が比較の記号を含まない形として
 * 「相手の値の名前」 に落ち、 名前として不正という別の理由で弾かれる = 直し方が伝わらない。
 */
function parseTriggerExpression(raw: string, name: string): ParsedValueTrigger["trigger"] | ValueSyntaxIssue {
  const text = raw.trim();
  const stepMatch = text.match(/^step\s+(.+)$/);
  if (stepMatch) {
    const step = unquote(stepMatch[1] ?? "");
    if (step === "") {
      return { message: `trigger の段名が空です ("${name}")`, hint: '`trigger: step "取込み"` の形で段の名前を書く' };
    }
    return { kind: "step", step };
  }
  for (const op of TRIGGER_OPS) {
    const at = text.indexOf(op);
    if (at < 0) continue;
    const source = text.slice(0, at).trim();
    const rhs = text.slice(at + op.length).trim();
    if (!isValueName(source)) {
      return {
        message: `trigger が見張る値の名前が使えません: "${source}" ("${name}")`,
        hint: "英字か _ で始め、 英数字と _ だけを使う",
      };
    }
    const threshold = Number(rhs);
    if (rhs === "" || !Number.isFinite(threshold)) {
      return {
        message: `trigger の境目が数ではありません: "${rhs}" ("${name}")`,
        hint: "`trigger: vDone >= 100` のように数で書く",
      };
    }
    return { kind: "reaches", source, op, threshold };
  }
  return {
    message: `trigger の形が読めません: "${text}" ("${name}")`,
    hint: '`step "取込み"` か `vDone >= 100` の形で書く',
  };
}

/**
 * 中括弧で囲まれた本体が「きっかけ形」 かを見分ける。
 *
 * 式も中括弧で始まり中括弧で終わることがある (`{a} + {b}` / `{a}`)。 見分けるのは
 * **引用の外に `:` があるか**で、 式の中括弧は値の名前しか包まないため `:` を持たない。
 *
 * 名前で見分けない (`trigger` を含むか等)。 `{trigger} + 1` のように `trigger` という名前の値を
 * 読む式が書けるため、 名前で見ると式をきっかけ形と読み違える。
 */
export function isTriggerBody(raw: string): boolean {
  const t = raw.trim();
  if (!t.startsWith("{") || !t.endsWith("}") || t.length < 2) return false;
  const inner = t.slice(1, -1);
  let quote: string | null = null;
  for (const ch of inner) {
    if (quote) {
      if (ch === quote) quote = null;
      continue;
    }
    if (ch === '"' || ch === "'") {
      quote = ch;
      continue;
    }
    if (ch === ":") return true;
  }
  return false;
}

/**
 * きっかけ形の中身を読む (`{ trigger: step "取込み", to: 100, dur: 2s }`)。
 *
 * 3 つとも必須にする。 既定値を置くと「書かなかった」 と「その値を書いた」 が同じになり、
 * 動かない時に何を直せばよいか分からなくなる。
 */
export function parseValueTriggerBody(
  body: string,
  name: string,
): { spec: ParsedValueTrigger; issues: [] } | { spec: null; issues: ValueSyntaxIssue[] } {
  const issues: ValueSyntaxIssue[] = [];
  const seen = new Map<string, string>();
  for (const part of splitOutsideQuotes(body)) {
    const at = part.indexOf(":");
    if (at < 0) {
      issues.push({ message: `"${part}" は key: value の形ではありません ("${name}")`, hint: "`trigger: ... , to: 100, dur: 2s` の形で書く" });
      continue;
    }
    const key = part.slice(0, at).trim().toLowerCase();
    const value = part.slice(at + 1).trim();
    if (seen.has(key)) {
      issues.push({ message: `"${key}" を 2 度書いています ("${name}")`, hint: "同じ項目は 1 度だけ書く" });
      continue;
    }
    seen.set(key, value);
  }

  const known = new Set(["trigger", "to", "dur"]);
  for (const key of seen.keys()) {
    if (known.has(key)) continue;
    issues.push({
      message: `"${key}" は values に書けません ("${name}")`,
      hint: `書けるのは ${[...known].join(" / ")} だけ`,
    });
  }

  const triggerRaw = seen.get("trigger");
  let trigger: ParsedValueTrigger["trigger"] | null = null;
  if (triggerRaw === undefined) {
    issues.push({ message: `trigger がありません ("${name}")`, hint: '`trigger: step "取込み"` か `trigger: vDone >= 100` を書く' });
  } else {
    const parsed = parseTriggerExpression(triggerRaw, name);
    if ("message" in parsed) issues.push(parsed);
    else trigger = parsed;
  }

  const toRaw = seen.get("to");
  let to = 0;
  if (toRaw === undefined) {
    issues.push({ message: `to がありません ("${name}")`, hint: "`to: 100` のように動いた先の値を書く" });
  } else {
    to = Number(unquote(toRaw));
    if (!Number.isFinite(to)) {
      issues.push({ message: `to が数ではありません: "${toRaw}" ("${name}")`, hint: "`to: 100` のように数で書く" });
    }
  }

  const durRaw = seen.get("dur");
  let durationMs = 0;
  if (durRaw === undefined) {
    issues.push({ message: `dur がありません ("${name}")`, hint: "`dur: 2s` のように動く長さを書く" });
  } else {
    const parsedDur = parseDurationMs(unquote(durRaw));
    if (parsedDur === null) {
      issues.push({ message: `dur が読めません: "${durRaw}" ("${name}")`, hint: "`2s` / `1.5s` / `500ms` の形で、 0 より大きい長さを書く" });
    } else {
      durationMs = parsedDur;
    }
  }

  if (issues.length > 0 || trigger === null) return { spec: null, issues };
  return { spec: { trigger, to, durationMs }, issues: [] };
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
