/**
 * 記法と JSON を画面で色分けするための分解器 (#1310)。
 *
 * 本文を受けて `[種類, 開始, 終わり]` の並びを返す。 **色は知らない**。 実際の色は
 * 使う側 (画面) が種類名に当てる = 埋め込み先ごとに自分の配色を使えるようにするため。
 *
 * ## なぜ package 側に置くか
 *
 * 「記法をどう切るか」 は parser と同じ知識で、語彙 (色名 / 矢印の書き方) を
 * `keywords.ts` から直接引ける。 画面側に置くと語彙を写すことになり、語が増えた時に
 * 片方だけ古くなる (#1293 / #1304 / #1306 で 3 度踏んだ形)。
 *
 * ## 何を切るか
 *
 * | 種類 | 例 | 図での意味 |
 * |---|---|---|
 * | `項目名` | `title:` / `kind:` / `- 名前:` | 構造。 色ではなく太さで示す |
 * | `説明文` | `"ログイン"` / `: 検索` | 箱と矢印に出る文字 |
 * | `矢印` | `->` / `→` | 繋がりそのもの |
 * | `色名` | `success` / `成功` / `dotted-flow` | **その色で描く** (`色` に解決後の名前が入る) |
 * | `値の参照` | `{count}` | 段で動く値 |
 * | `注記` | `# ...` | 読み飛ばしてよい部分 |
 *
 * 色名だけ `色` を返すのは、画面が「その色名が図で引く色」 で描けるようにするため。
 * 本文の `(成功)` と図の緑が一致すると、どの語がどの見た目に効くかが読める。
 *
 * ## 重なりを作らない
 *
 * 返す並びは開始位置の昇順で、**互いに重ならない**。 使う側は並びをそのまま
 * `<span>` や装飾に変換するだけでよく、重なりの解決を持たなくて済む。
 *
 * 値の参照は説明文の中にも出る (`value: "{count}"`)。 その場合は説明文を参照の前後で
 * 分割して返す = 参照だけ別の色にできる。
 */
import { TONE_ALIAS, ARROW_PATTERNS } from "./keywords";
import { TONES } from "@cardenelabs/cdl";
import type { Tone } from "@cardenelabs/cdl";

/** 分解した部分の種類 (#1310) */
export type トークンの種類 = "項目名" | "説明文" | "矢印" | "色名" | "値の参照" | "注記";

/** 分解した部分 1 つ。 位置は本文の先頭からの文字数 (`slice` にそのまま渡せる) */
export type トークン = {
  種類: トークンの種類;
  開始: number;
  終わり: number;
  /** `色名` の時だけ入る、解決後の色の名前。 画面はこれで「その色」 を引く */
  色?: Tone;
};

/**
 * 線種の一覧 (#1310)。 `v05/parser.ts` の `STYLE_VALID` と同じ値を持つ。
 *
 * あちらを import すると parser 全体を引き込むため、分解器では持ち直す。 **2 箇所に
 * 分かれるので検査で突き合わせる** (`tokenize.test.ts`)。
 */
const 線種 = ["solid", "dotted-flow"] as const;

/** 色名として読める語 (小文字で引く)。 正規の色名と別名の両方 */
const 色名の表 = new Map<string, Tone>([
  ...TONES.map((t) => [t.toLowerCase(), t] as [string, Tone]),
  ...Object.entries(TONE_ALIAS).map(([k, v]) => [k.toLowerCase(), v] as [string, Tone]),
]);

/**
 * 矢印の書き方。 並べ替えない。
 *
 * `->` と `->>` は同じ位置から始まるため、どちらを取るかを決める必要がある。 それは
 * `重なりを外す` が「同じ開始なら長い方」 として 1 箇所で決める。 ここでも長い順に
 * 並べると **同じ規則が 2 箇所に分かれ、片方を外しても検査が通る** (実測)。
 */
const 矢印の表 = [...new Set(ARROW_PATTERNS)];

/**
 * 色名として読める語なら、解決後の名前を返す。
 *
 * 判定は `resolveTone` と同じ (別名を引き、小文字に寄せる) が、引用符は外さない =
 * 分解器は本文の位置を返すため、外した後の文字列を作ってはいけない。
 */
function 色名として読む(語: string): Tone | undefined {
  return 色名の表.get(語.toLowerCase());
}

/** 線種として読める語か */
function 線種として読むか(語: string): boolean {
  return (線種 as readonly string[]).includes(語.toLowerCase());
}

/*
 * 箱の種類 (`service` / `database` 等) は色分けしない (#1310 review r1-f1)。
 *
 * 一度は種類名を `項目名` として扱ったが、**箱の名前まで巻き込む**。 受理する 108 種には
 * `user` / `api` / `actor` / `card` / `state` / `service` が含まれ、`- User` や `- API` の
 * ような普通の名前と衝突する (実測で両方とも項目名になった)。
 *
 * 正しく分けるには「種類の位置に書かれているか」 を見る必要があり、それは 5 種
 * (項目名 / 説明文 / 矢印 / 色名 / 値の参照) の外側になる。 語だけで判定できないものは
 * 色分けしない。
 */

/** 重なりを持たない並びに整える。 先に入れたものを優先し、後から重なる分は捨てる */
function 重なりを外す(候補: トークン[]): トークン[] {
  const out: トークン[] = [];
  for (const t of [...候補].sort((a, b) => a.開始 - b.開始 || b.終わり - a.終わり)) {
    if (t.終わり <= t.開始) continue;
    const 直前 = out[out.length - 1];
    if (直前 !== undefined && t.開始 < 直前.終わり) continue;
    out.push(t);
  }
  return out;
}

/** `{名前}` を拾う。 名前は英数字と `_` だけ (描画側が置き換える時に見る範囲と揃える) */
function 値の参照を拾う(src: string, 起点: number, 本文: string, 積む: (t: トークン) => void): void {
  for (const m of 本文.matchAll(/\{[A-Za-z_][\w]*\}/g)) {
    積む({ 種類: "値の参照", 開始: 起点 + m.index, 終わり: 起点 + m.index + m[0].length });
  }
}

/**
 * 引用符で囲まれた部分を拾い、中に値の参照があれば前後で割る。
 *
 * 割らずに 1 つの説明文として返すと、`value: "{count}"` の参照に色を当てられない。
 */
function 説明文を拾う(src: string, 起点: number, 本文: string, 積む: (t: トークン) => void): void {
  for (const m of 本文.matchAll(/"[^"]*"|'[^']*'/g)) {
    const 開始 = 起点 + m.index;
    const 終わり = 開始 + m[0].length;
    const 参照: トークン[] = [];
    値の参照を拾う(src, 開始, m[0], (t) => 参照.push(t));
    if (参照.length === 0) {
      積む({ 種類: "説明文", 開始, 終わり });
      continue;
    }
    let 位置 = 開始;
    for (const r of 参照.sort((a, b) => a.開始 - b.開始)) {
      if (r.開始 > 位置) 積む({ 種類: "説明文", 開始: 位置, 終わり: r.開始 });
      積む(r);
      位置 = r.終わり;
    }
    if (位置 < 終わり) 積む({ 種類: "説明文", 開始: 位置, 終わり });
  }
}

/**
 * 記法を分解する (#1310)。
 *
 * 行ごとに見る。 記法は行単位で意味が決まるため、行をまたぐ状態を持たない。
 */
export function 記法を分解する(src: string): トークン[] {
  const 候補: トークン[] = [];
  const 積む = (t: トークン): void => {
    候補.push(t);
  };
  let 起点 = 0;
  for (const 行 of src.split("\n")) {
    分解する1行(src, 起点, 行, 積む);
    起点 += 行.length + 1;
  }
  return 重なりを外す(候補);
}

function 分解する1行(
  src: string,
  起点: number,
  行: string,
  積む: (t: トークン) => void,
): void {
  const 字下げ = 行.length - 行.trimStart().length;
  const 本体 = 行.trimStart();
  if (本体 === "") return;

  // 注記は行ごと。 `#` を色番号 (`#f59e0b`) と取り違えないよう、行の頭だけを見る
  if (本体.startsWith("#")) {
    積む({ 種類: "注記", 開始: 起点 + 字下げ, 終わり: 起点 + 行.length });
    return;
  }

  // 説明文と値の参照を先に取る = 引用符の中の `->` や色名を拾わないため
  説明文を拾う(src, 起点, 行, 積む);
  値の参照を拾う(src, 起点, 行, 積む);

  // 項目名 = 行頭 (`- ` の後も含む) の `名前:`
  const 見出し = 本体.match(/^(-\s*)?([^\s:{}[\]"']+)\s*:/);
  if (見出し) {
    const 前 = 見出し[1]?.length ?? 0;
    const 名 = 見出し[2] ?? "";
    const 開始 = 起点 + 字下げ + 前;
    積む({ 種類: "項目名", 開始, 終わり: 開始 + 名.length + 1 });
  }

  // 矢印
  for (const 記号 of 矢印の表) {
    let i = 行.indexOf(記号);
    while (i >= 0) {
      積む({ 種類: "矢印", 開始: 起点 + i, 終わり: 起点 + i + 記号.length });
      i = 行.indexOf(記号, i + 記号.length);
    }
  }

  // 色名と線種。 語の切れ目で区切って 1 語ずつ見る = 説明文の一部を拾わないよう、
  // 引用符の中は上で説明文として先に取ってある (重なりを外す時に落ちる)
  for (const m of 行.matchAll(/[^\s(),:{}[\]"']+/g)) {
    const 語 = m[0];
    const 色 = 色名として読む(語);
    if (色 !== undefined) {
      積む({ 種類: "色名", 開始: 起点 + m.index, 終わり: 起点 + m.index + 語.length, 色 });
      continue;
    }
    if (線種として読むか(語)) {
      積む({ 種類: "色名", 開始: 起点 + m.index, 終わり: 起点 + m.index + 語.length });
    }
  }
}

/**
 * JSON を分解する (#1310)。
 *
 * 記法と違い鍵は英語で、記法の語彙は出ない。 したがって **鍵 / 文字列 / 数を汎用の色で塗る**。
 *
 * 例外は `tone` と `color` の値で、こちらは記法と同じ語彙を持つため色名として扱う。
 * 同じ `"success"` が入口によって別の色になる状態を作らないため。
 */
export function JSONを分解する(src: string): トークン[] {
  const 候補: トークン[] = [];
  // 鍵 (`"name":`) と、その値が色名を取る欄かを見る
  for (const m of src.matchAll(/"((?:[^"\\]|\\.)*)"(\s*:)?/g)) {
    const 開始 = m.index;
    const 終わり = 開始 + m[0].length;
    if (m[2] !== undefined) {
      候補.push({ 種類: "項目名", 開始, 終わり });
      continue;
    }
    候補.push({ 種類: "説明文", 開始, 終わり });
  }
  // 数値も文字列と同じ「値」の色にする。 JSON の数値文法に合わせ、符号・小数・指数を拾う。
  // 文字列の中に現れた数字は、先に積んだ説明文と重なるため `重なりを外す` で落ちる。
  for (const m of src.matchAll(/-?(?:0|[1-9]\d*)(?:\.\d+)?(?:[eE][+-]?\d+)?/g)) {
    候補.push({ 種類: "説明文", 開始: m.index, 終わり: m.index + m[0].length });
  }
  // 色名を取る欄の値を色名に格上げする
  for (const m of src.matchAll(/"(tone|color)"\s*:\s*"((?:[^"\\]|\\.)*)"/g)) {
    const 値の開始 = m.index + m[0].lastIndexOf('"' + m[2] + '"');
    const 値 = m[2] ?? "";
    const 色 = 色名として読む(値);
    if (色 === undefined) continue;
    const i = 候補.findIndex((t) => t.開始 === 値の開始);
    if (i >= 0) 候補[i] = { 種類: "色名", 開始: 値の開始, 終わり: 値の開始 + 値.length + 2, 色 };
  }
  // 値の参照は文字列の中に出る (`"{count}"`)
  const 参照: トークン[] = [];
  値の参照を拾う(src, 0, src, (t) => 参照.push(t));
  for (const r of 参照) {
    const i = 候補.findIndex((t) => t.開始 < r.開始 && r.終わり <= t.終わり && t.種類 === "説明文");
    const 元 = i < 0 ? undefined : 候補[i];
    if (元 === undefined) continue;
    候補.splice(
      i,
      1,
      { 種類: "説明文", 開始: 元.開始, 終わり: r.開始 },
      r,
      { 種類: "説明文", 開始: r.終わり, 終わり: 元.終わり },
    );
  }
  return 重なりを外す(候補);
}

/**
 * 分解した並びを、本文を覆う区間の列に広げる (#1310)。
 *
 * 分解器は色が付く部分だけを返すため、間の文字が抜ける。 画面はそのまま並べると本文が
 * 欠けるので、**色の付かない部分も種類なしの区間として挟む**。
 *
 * 返す区間は本文を過不足なく覆う (連結すると元の本文に戻る)。
 */
export function 区間に広げる(
  src: string,
  tokens: トークン[],
): Array<{ 文字: string; 種類?: トークンの種類; 色?: Tone }> {
  const out: Array<{ 文字: string; 種類?: トークンの種類; 色?: Tone }> = [];
  let 位置 = 0;
  for (const t of tokens) {
    if (t.開始 > 位置) out.push({ 文字: src.slice(位置, t.開始) });
    out.push({ 文字: src.slice(t.開始, t.終わり), 種類: t.種類, 色: t.色 });
    位置 = t.終わり;
  }
  if (位置 < src.length) out.push({ 文字: src.slice(位置) });
  return out;
}
