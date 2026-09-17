import { ER_CARDINALITY_HEAD } from "@cardenelabs/cdl";
import type { EdgeHead, ErRelationCardinality } from "@cardenelabs/cdl";
import type { DslStep } from "../types";

/**
 * ER の関係 1 本を、記法から組み立て API の形へ直す (#2105)。
 *
 * ER は段を書くかどうかで組み立てが 2 つに分かれる。 段の無い図は描画側の `er()` を通り、
 * 段を持つ図は段を書ける共通の組み立て (`compileGenericWithAnimate`) を通る。
 * 多重度の語をそれぞれの組み立てが別々に読んでいた間、同じ語が 26 通りのうち 18 通りで
 * 別の図になっていた (欄に書いた語が端に届かない / 段を持つ図に端が付かない)。
 *
 * **語を読むのはここ 1 か所** にし、両方の組み立てがここから作る。
 */

/** 多重度の語と、それを見つける形。 語は描画側の `ErRelationCardinality` と同じ 6 語 */
export const CARDINALITY_PATTERNS: Array<[RegExp, ErRelationCardinality]> = [
  [/1:1/, "1:1"],
  [/1:N/i, "1:N"],
  [/N:1/i, "N:1"],
  [/N:M/i, "N:M"],
  [/0\.\.1/, "0..1"],
  [/1\.\.\*/, "1..*"],
];

/** 多重度から端の形が決まる語。 知らせに並べる時は手で書かず、描画側の表から導く (#2107) */
export const 端の形が決まる語 = Object.keys(ER_CARDINALITY_HEAD) as ErRelationCardinality[];

// cardinality token を「単語の途中でない」 境界で囲んだ RegExp を作る (parse / strip で共有する SSOT)。
// 前後が identifier 文字 (英数字 + アンダースコア) なら token とみなさない = `column:Metadata` の `n:M` /
// `10:11:12` の `1:1` / `field_1:N` の `1:N` を cardinality と誤認して壊すのを防ぐ
// (cc-codex #879 Round 9/10/11)。 `_` を含むのは ER label が DB schema 由来で snake_case 命名が多く、
// `_` 直後に cardinality 様の部分列が来る label が現実的に起こるため (`field_1:N` / `parent_N:M_child`)。
// strip と parse で別々に pattern.test / replace すると境界規則が drift するため、 この 1 関数を両経路で使う。
export function boundedCardinalityRegExp(pattern: RegExp, extraFlags = ""): RegExp {
  const base = pattern.flags.includes("i") ? "i" : "";
  return new RegExp(`(?<![A-Za-z0-9_])(?:${pattern.source})(?![A-Za-z0-9_])`, base + extraFlags);
}

export function parseCardinalityFromLabel(label: string): ErRelationCardinality | null {
  for (const [pattern, card] of CARDINALITY_PATTERNS) {
    if (boundedCardinalityRegExp(pattern).test(label)) return card;
  }
  return null;
}

// stripCardinality が「水平空白」 として畳んでよい文字を明示列挙する (space / tab / 全角空白 U+3000)。
// 改行系 (LF / CR / U+2028 line separator / U+2029 paragraph separator / vertical tab / form feed) は
// 含めない = これらは label の行構造として保持する (cc-codex #879 Round 5/6 指摘 = `\s` / `[^\S\r\n]`
// では Unicode 行区切りや CRLF を誤って畳んでしまう)。 括弧除去側と正規化側で同じ class を共有する。
export const HORIZONTAL_WS = " \\t\\u3000";

export const HWS = `[${HORIZONTAL_WS}]`;

export function stripCardinality(label: string): string {
  let r = label;
  let removed = false;
  for (const [pattern] of CARDINALITY_PATTERNS) {
    // cardinality token を「それを囲む括弧ごと 1 単位」 で除去する。
    // まず `(1:N)` のように token を直接包む括弧つき形を除去し、 次に裸の token を除去する。
    // 括弧を token 単位で消すことで、 label 中の cardinality と無関係な正当な括弧 (例
    // `fn() now` の `()`) を壊さない (cc-codex #879 Round 4 指摘 = 空括弧の全域除去は過剰)。
    // 括弧と token の間は水平空白のみ許容し、 改行を挟む形 (`(\n1:N\n)`) は括弧除去の対象外にする
    // (改行を消費して行構造を壊すのを防ぐ、 Round 6 Finding 2)。
    const src = pattern.source;
    const flags = pattern.flags.includes("i") ? "gi" : "g";
    const before = r;
    r = r.replace(new RegExp(`\\(${HWS}*${src}${HWS}*\\)`, flags), "");
    // 裸 token 除去 = parse と同じ単語境界付き matcher (boundedCardinalityRegExp) を global で適用する。
    // 前後が英数字なら token とみなさないため、 timestamp (`10:11:12`) / 比率 (`10:11`) / alphabet 埋め込み
    // (`column:Metadata`) を壊さず、 同一 token の複数出現 (`1:N and 1:N`) は全て消す。 parse 側と境界規則を
    // 単一 SSOT にすることで strip/parse の乖離 (strip は消すが parse は残す等) を構造的に防ぐ
    // (cc-codex #879 Round 9/10 = 数字境界だけ / strip 側だけの修正では 2 経路 drift + alphabet 埋め込み穴)。
    r = r.replace(boundedCardinalityRegExp(pattern, "g"), "");
    if (r !== before) removed = true;
  }
  // token を除去していない label は空白を一切いじらない (無条件適用でも改行 / 複数空白を保持する、
  // cc-codex #879 Round 5 指摘 = 無条件正規化は改行を含む label を破壊した)。
  if (!removed) return label;
  // 除去で生じた水平空白 (space / tab / 全角空白) のみ単一化する (例 "A 1:N B" → "A  B" → "A B")。
  // 改行系は HWS に含めないため保持される。
  //   - 各行内の連続水平空白を単一化
  //   - 改行 (LF / CR) の前後の水平空白を除去 (改行直前の trailing 空白も落とす)
  r = r
    .replace(new RegExp(`${HWS}{2,}`, "g"), " ")
    .replace(new RegExp(`${HWS}*([\\r\\n])${HWS}*`, "g"), "$1")
    .replace(new RegExp(`^${HWS}+|${HWS}+$`, "g"), "");
  // fallback = cardinality 除去後に「視覚的に意味のある文字」 が残らない場合は元 label を返す
  // (Round 6 Finding 1 = 除去後に空白/不可視文字だけ残ると不可視 label になるのを防ぐ)。
  //
  // 「意味のある文字」 の判定は個別の空白/不可視文字を列挙 (denylist) すると際限が無く、
  // Round 7 で `\s` → `\p{White_Space}` に変えたら NEL は拾えたが BOM を落とす等のいたちごっこに
  // なった (cc-codex #879 Round 7/8/9)。 そこで Unicode の「見えない文字」 を 4 カテゴリで構造的に
  // 判定する = 以下のいずれでもない可視文字が 1 つでもあれば意味あり。
  //   - White_Space ... 全空白 (space / tab / NBSP / NEL / 全角空白 / 各種 Unicode space / 改行系)
  //   - Cf (Format) ... BOM / ZWSP / ZWNJ / ZWJ / WORD JOINER / soft hyphen 等
  //   - Cc (Control) ... 制御文字
  //   - Default_Ignorable_Code_Point ... variation selector (Mn) / Hangul filler (Lo) 等、 Cf に
  //     入らない不可視文字 (Cf/Cc/White_Space だけでは取りこぼすと Round 9 で判明)
  // 4 カテゴリで Unicode の非表示文字を網羅する (Braille blank U+2800 や通常文字は content 維持)。
  const hasVisible = /[^\p{White_Space}\p{Cf}\p{Cc}\p{Default_Ignorable_Code_Point}]/u.test(r);
  return hasVisible ? r : label;
}

/** 欄に書いた語が 6 語のどれかそのものなら、その語。 大文字小文字は見本を見つける形と同じく問わない */
function 欄の語(書いた: string): ErRelationCardinality | null {
  const 字 = 書いた.trim();
  for (const [pattern, card] of CARDINALITY_PATTERNS) {
    if (new RegExp(`^(?:${pattern.source})$`, pattern.flags).test(字)) return card;
  }
  return null;
}

/**
 * 矢印の欄に書いた多重度を読む。 空白だけの欄は書かなかったものとして `undefined` を返す。
 *
 * `語` は 6 語のどれかそのものならその語、そうでなければ `null` (名前に `(字)` と添えるだけで端を決めない形)。
 * 組み立てが名前と端を決める時と、効かない形を知らせる時 (#2107) の両方がこれを読む = 判定が割れない
 */
export function 書いた多重度を読む(
  欄: string | undefined,
): { 字: string; 語: ErRelationCardinality | null } | undefined {
  const 字 = 欄?.trim();
  if (!字) return undefined;
  return { 字, 語: 欄の語(字) };
}

/** 組み立て API の `er().relation` に渡す指定のうち、多重度と名前と端に関わる分 */
export type ERの関係の指定 = {
  label?: string;
  cardinality?: ErRelationCardinality;
  head?: EdgeHead;
  tailHead?: EdgeHead;
};

/**
 * 記法の 1 行から、組み立て API に渡す指定を作る。
 *
 * **語は欄 (`cardinality`) を先に読み、無ければ名前から読む**。 名前に書いた語はどちらの場合も名前から外す
 * (名前が語だけなら、名前を書かなかったものとして扱う = 組み立て API が語を名前として出す)。
 *
 * 欄に 6 語以外を書いた時 (`2..5` 等) は、名前に `(2..5)` と添えて端は決めない。 組み立て API の語は
 * 6 語に限られ、それ以外を渡す口が無い。 書いた字を消さずに読み手へ見せる形にし、
 * 描かない端があることは組み立ての知らせ (`cardinality-not-honored`、#2107) が伝える。
 */
export function ERの関係の指定を作る(
  s: Pick<DslStep, "label" | "cardinality" | "head" | "tailHead">,
): ERの関係の指定 {
  const 端 = {
    ...(s.head !== undefined ? { head: s.head } : {}),
    ...(s.tailHead !== undefined ? { tailHead: s.tailHead } : {}),
  };
  const 書いた = 書いた多重度を読む(s.cardinality);
  if (書いた && 書いた.語 === null) {
    return { label: s.label ? `${s.label} (${書いた.字})` : `(${書いた.字})`, ...端 };
  }
  const 語 = 書いた?.語 ?? parseCardinalityFromLabel(s.label);
  if (語 === null) return { ...(s.label ? { label: s.label } : {}), ...端 };
  // 欄に書いた時も名前の語は外す。 残すと、名前と名前の下の行に語が 2 度並ぶ (欄の語が勝つ)
  const 名前 = 語を外した名前(s.label);
  return { ...(名前 ? { label: 名前 } : {}), cardinality: 語, ...端 };
}

/** 名前から多重度の語を外す。 語だけの名前は空にする */
function 語を外した名前(label: string): string {
  if (parseCardinalityFromLabel(label) === null) return label;
  const 外した = stripCardinality(label);
  // 外すと見える字が残らない時、`stripCardinality` は元の名前を返す = 名前は語だけだった
  return 外した === label ? "" : 外した;
}

/**
 * 指定を矢印の欄にする。 **組み立て API の `er().relation` と同じ規則**。
 *
 * 段を持つ図は `er()` を通らないので、ここに規則を写す。 写した規則が組み立て API とずれていないことは
 * 検査 (`er-cardinality-notation.test.ts`) が 6 語の全ての組で突き合わせる。
 *
 * | 欄 | 決まり方 |
 * |---|---|
 * | 名前 (`label`) | 書いた名前。 無ければ語 |
 * | 名前の下の行 (`sub`) | 名前と語の両方があり、端を明示していない時だけ語 |
 * | 両端 (`tailHead` / `head`) | 明示が勝つ。 無ければ語から描画側の表 (`ER_CARDINALITY_HEAD`) で引く |
 */
export function ERの関係の矢印(指定: ERの関係の指定): {
  label: string;
  sub?: string;
  head?: EdgeHead;
  tailHead?: EdgeHead;
} {
  const 表の端 = 指定.cardinality ? ER_CARDINALITY_HEAD[指定.cardinality] : undefined;
  const 端を明示した = 指定.tailHead !== undefined || 指定.head !== undefined;
  const head = 指定.head ?? 表の端?.head;
  const tailHead = 指定.tailHead ?? 表の端?.tail;
  return {
    label: 指定.label ?? 指定.cardinality ?? "",
    ...(指定.label && 指定.cardinality && !端を明示した ? { sub: 指定.cardinality } : {}),
    ...(head !== undefined ? { head } : {}),
    ...(tailHead !== undefined ? { tailHead } : {}),
  };
}
