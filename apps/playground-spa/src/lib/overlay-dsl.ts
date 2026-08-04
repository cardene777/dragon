/**
 * overlay parts と DSL の相互変換を pure function として提供。
 * CdlEditor.tsx から抽出、 DOM / React 依存ゼロで vitest 単発 test 可能にする (Layer 1)。
 */

import type { CatalogItem } from "@/lib/catalog-items";
import {
  parseRelativePos,
  resolveRelativePos,
  orderByDependency,
  partsGridCenters,
  partRenderSize,
  partBoxInFrame,
  partTargetScale,
  normalizePartScale,
  MAX_PART_SCALE,
  isColorValue,
  NODE_KIND_VALID,
  type RelativePos,
  type AnchorBox,
} from "@cardenelabs/dragon";

export type OverlayPartRaw = {
  id: string;
  kind: string;
  posX: number;
  posY: number;
  scale: number;
  rotate: number;
  bg?: string;
  /** `大きさ:` で書かれた寸法。 伸縮の率は `partTargetScale` が持つ (#1018) */
  posW?: number;
  posH?: number;
  item: CatalogItem;
};

/**
 * 本文から読んだだけで、 まだ置き場所が決まっていないパーツ。
 *
 * 位置を書いていないパーツは格子に並べるが、 その順番は全部読み終わらないと決まらない。
 * 相対で書いたパーツも、 基準の座標が分かるまで置けない。 読む処理と置く処理を分ける。
 */
/**
 * パーツの置き場所が書いた通りにならなかった、 という知らせ。
 *
 * パーツは記法の解析より前に本文から抜き出すため、 組み立て側の知らせ経路に乗らない。
 * 画面側で拾って同じ場所に出す。
 */
export type PartPlacementNotice = {
  part: string;
  anchor: string;
  reason: "missing" | "cyclic";
  message: string;
};

export type OverlayPartParsed = Omit<OverlayPartRaw, "posX" | "posY"> & {
  /** 座標で書かれた中心。 書いていなければ undefined */
  posX?: number;
  posY?: number;
  /** 他の要素を基準にして書かれた位置 */
  posRel?: RelativePos;
};

/**
 * actor 行 (`  - alias: { ... }`) の parse regex。
 *
 * inner を `(.+)` (greedy) にしているのは nested brace を含む行を落とさないため。
 * cdl の actor には `state: { phase: false }` のような入れ子が実在し、
 * `[^}]*` (閉じ括弧を含まない) にすると最初の `}` で打ち切られて行全体が非 match になる
 * = parts が overlay から消えて drag / resize が保存されなくなる。
 *
 * ReDoS を懸念して `[^}]*` に変えた版を一度入れたが、 実測すると旧形は
 * 1000 → 16000 repeat で 0.011ms → 0.148ms と線形で、 catastrophic backtracking は起きていなかった。
 * 懸念が実測で否定されたので greedy 形に戻し、 nested brace の取りこぼしを避ける方を採る。
 */
const ACTOR_LINE_RE = /^(\s*-\s*)("(?:[^"\\]|\\.)+"|\S+?)(\s*:\s*)\{(.+)\}\s*$/;

/**
 * 入れ子を使わない書き方 (`- 実績: achievement v=50`) の行。
 *
 * 記法を空白区切りに揃えた時、 パーツもこの形で書けるようになった。 入れ子の形だけを見ていると
 * 短い形で書いたパーツが図に出ない。
 */

/**
 * パーツ 1 個が画面上で占める大きさ (world 単位)。
 *
 * **見本の図枠を実寸として使う** (`partRenderSize`、 `packages/dragon`)。 以前は
 * `editor.css` の固定値 (800x600) で、 見本の実寸と無関係だった (実測 = 図枠 525x520 の
 * パーツが 800x600 で描かれていた)。
 *
 * 箱の外接矩形ではなく図枠を使う。 SVG は図枠を基準に `preserveAspectRatio` で収めるため、
 * 箱の値を渡すと縮んで、 置いた場所と描かれた大きさが食い違う (実測 = achievement が
 * 箱の値だと約 275x275 になった)。
 *
 * 使うのは **描く大きさと、 格子に並べる時の場所の確保** の 2 つ。 書いた座標と相対指定の
 * 間隔は見えている箱で解くので、 そちらは `partBoxRect` を使う (#1014)。
 */
export function partWorldSize(part: OverlayPartParsed): { w: number; h: number } {
  const k = normalizePartScale(part.scale);
  const e = partFrameSize(part);
  return { w: e.w * k, h: e.h * k };
}

/**
 * パーツ 1 個を描く大きさ (倍率 `scale:` を掛ける前)。
 *
 * `大きさ:` を書いた分だけ図枠を伸縮する。 倍率の求め方は組み立て側と同じ関数を使う
 * (`partTargetScale`)。 別々に持つと、`大きさ:` を書いた見本だけ経路で大きさが変わる (#1018)。
 *
 * `scale:` は CSS の `transform` で掛けるため、ここでは掛けない。 画面に渡す助変数
 * (`--cdl-svg-w/h`) はこの値をそのまま使う。
 */
export function partFrameSize(part: OverlayPartParsed): { w: number; h: number } {
  const e = partRenderSize(part.item.diagram);
  const t = partTargetScale(part.item.diagram, part.posW, part.posH);
  return { w: e.w * normalizePartScale(t.x), h: e.h * normalizePartScale(t.y) };
}



// 倍率の直し方と上限は組み立て側 (`packages/dragon`) が持つ (#1026)。 別々に持つと、
// 同じ本文が経路で別の大きさになる。 呼び出し側の import 元を変えずに済むよう再輸出する。
export { normalizePartScale, MAX_PART_SCALE };

/**
 * 書かれた値を倍率として読む。
 *
 * 引用符を外して値全体を数として読む。 先頭の 10 進部分だけを取ると `1e2` が 1 になり、
 * 同じ値を書いても書き方で結果が変わる (実測 = 縦に並べた形は 100、中括弧の形は 1)。
 */
function parsePartScale(raw: string | null | undefined): number {
  if (raw === null || raw === undefined) return 1;
  const trimmed = raw.trim().replace(/^["']|["']$/g, "");
  if (trimmed === "") return 1;
  return normalizePartScale(Number(trimmed));
}

/**
 * パーツ 1 個の、 見えている箱の大きさと図枠の中での位置 (world 単位)。
 *
 * 書いた座標と相対指定の間隔は、 見えている箱を基準にする。 図枠で解くと余白のぶんだけ
 * ずれる (実測 = `Web の右 200` と書いて、 組み立て側は 200、 画面側は 260 空いた)。
 * 組み立て側は箱で解いているので、 画面側も箱に合わせる (#1014)。
 */
export function partBoxRect(part: OverlayPartParsed): {
  w: number;
  h: number;
  left: number;
  top: number;
} {
  const k = normalizePartScale(part.scale);
  const b = partBoxInFrame(part.item.diagram);
  const t = partTargetScale(part.item.diagram, part.posW, part.posH);
  const tx = normalizePartScale(t.x);
  const ty = normalizePartScale(t.y);
  return {
    w: b.w * tx * k,
    h: b.h * ty * k,
    left: b.left * tx * k,
    top: b.top * ty * k,
  };
}

/**
 * 読んだパーツに置き場所を決める。
 *
 * 位置を書いていないパーツは格子に並べる (従来通り)。 座標で書いたパーツと、 相対で書いた
 * パーツは、 書いた位置に置く。
 *
 * 書いた座標は箱の中心を指す。 登場人物の `位置:` と組み立て側のパーツ配置がどちらも中心
 * なので、 画面側だけ左上にすると同じ数字が別の場所を指すことになる。
 *
 * 返すのは **図枠の左上**。 画面は図枠を置くが、 座標と間隔は箱で解くため、 最後に余白を
 * 引いて図枠の左上に直す。 格子だけは図枠で場所を決める (隣と重ならない幅を確保するのが
 * 目的なので、 描く大きさそのものが要る)。
 *
 * @param sizeOf パーツ 1 個の図枠の大きさ。 格子に並べる時の場所の確保に使う
 * @param boxes 基準にできる要素の位置。 図の組み立て結果から測ったもの
 * @param boxOf パーツ 1 個の見えている箱。 座標と間隔を解くのに使う (既定は `partBoxRect`)
 */
export function placeParts(
  parsed: OverlayPartParsed[],
  boxes: ReadonlyMap<string, AnchorBox>,
  sizeOf: (part: OverlayPartParsed) => { w: number; h: number },
  baseNodeCount: number,
  onNotice?: (notice: PartPlacementNotice) => void,
  boxOf: (part: OverlayPartParsed) => {
    w: number;
    h: number;
    left: number;
    top: number;
  } = partBoxRect,
): OverlayPartRaw[] {
  const byId = new Map(parsed.map((p) => [p.id, p] as const));
  const sizes = new Map(parsed.map((p) => [p.id, sizeOf(p)] as const));
  const boxRects = new Map(parsed.map((p) => [p.id, boxOf(p)] as const));
  // 基準に使える中心。 図の側の要素に、 座標で書いたパーツを足す。
  // 基準として出すのは箱で、 図枠ではない (組み立て側も箱を基準に出している)
  const centers = new Map<string, AnchorBox>(boxes);
  for (const p of parsed) {
    if (p.posX === undefined || p.posY === undefined) continue;
    const b = boxRects.get(p.id)!;
    centers.set(p.id, { cx: p.posX, cy: p.posY, w: b.w, h: b.h });
  }

  // 相対で書いた分を、 基準の浅い順に解く
  const { order, cyclic } = orderByDependency(parsed.map((p) => ({ name: p.id, rel: p.posRel })));
  const resolved = new Map<string, { posX: number; posY: number }>();
  for (const name of order) {
    const p = byId.get(name);
    if (!p?.posRel) continue;
    const anchor = centers.get(p.posRel.anchor);
    if (!anchor) {
      // 基準が見つからない分は格子に落ちる。 黙って落とすと綴りの誤りに気付けない
      onNotice?.({
        part: p.id,
        anchor: p.posRel.anchor,
        reason: "missing",
        message: `"${p.id}" の位置の基準が見つかりません: "${p.posRel.anchor}"`,
      });
      continue;
    }
    const b = boxRects.get(p.id)!;
    const c = resolveRelativePos(p.posRel, anchor, b);
    resolved.set(p.id, c);
    centers.set(p.id, { cx: c.posX, cy: c.posY, w: b.w, h: b.h });
  }
  for (const name of cyclic) {
    const p = byId.get(name);
    if (!p?.posRel) continue;
    onNotice?.({
      part: name,
      anchor: p.posRel.anchor,
      reason: "cyclic",
      message: `"${name}" の位置の基準が互いを指しています`,
    });
  }

  // 位置を書かなかった分は格子に並べる。 規則は組み立て側と共有する (`partsGridCenters`)。
  // 別々に計算すると、 同じ本文でもパーツの位置が経路によって変わる
  const autoIds = parsed
    .filter((p) => !(p.posX !== undefined && p.posY !== undefined) && !resolved.has(p.id))
    .map((p) => ({ id: p.id, ...sizes.get(p.id)! }));
  const grid = partsGridCenters(baseNodeCount, autoIds);

  return parsed.map((p) => {
    const s = sizes.get(p.id)!;
    const b = boxRects.get(p.id)!;
    const explicit =
      p.posX !== undefined && p.posY !== undefined
        ? { posX: p.posX, posY: p.posY }
        : resolved.get(p.id);
    // 書いた位置と相対で解いた位置は箱の中心。 図枠の左上に直すには、 箱の左上まで戻してから
    // 余白のぶん外へ出す
    if (explicit) {
      return {
        ...p,
        posX: explicit.posX - b.w / 2 - b.left,
        posY: explicit.posY - b.h / 2 - b.top,
      };
    }
    // 格子は図枠で場所を決めるので、 返るのは図枠の中心。 半分引けば図枠の左上になる
    const gridCenter = grid.get(p.id);
    if (!gridCenter) return { ...p, posX: 0, posY: 0 };
    return { ...p, posX: gridCenter.cx - s.w / 2, posY: gridCenter.cy - s.h / 2 };
  });
}

const ACTOR_SHORT_RE = /^(\s*-\s*)("(?:[^"\\]|\\.)+"|[^:\s]+)(\s*:\s*)([^{\s][^{]*)$/;

/** quoted alias を素の文字列に戻す (`"a \" b"` → `a " b`)。 unquoted はそのまま。 */
function unquoteAlias(raw: string): string {
  if (!raw.startsWith('"') || !raw.endsWith('"') || raw.length < 2) return raw;
  return raw.slice(1, -1).replace(/\\(.)/g, "$1");
}

/**
 * inline map の inner を top-level の field 単位に分割する。
 *
 * `kind: achievement, nodes: { header: { posX: 1 } }, posX: 10` のような nested map を
 * 単純な `,` split や正規表現で扱うと、 入れ子の中の `posX` / `kind` を top-level のものと
 * 取り違えて誤抽出・データ欠落を起こす (CAR-2158 Round 3 CRITICAL)。
 * brace の深さを数えて、 深さ 0 の `,` でだけ区切る。
 */
export function splitTopLevelFields(inner: string): string[] {
  const out: string[] = [];
  let depth = 0;
  let start = 0;
  // double / single の 2 種を追跡する。 single を見ていなかった頃は
  // `label: 'x,y'` を 2 field に割り、 `label: 'p, posX: 999'` の内側を top-level の
  // posX と誤読して DSL を壊していた (CAR-2158 Round 6 CRITICAL)。
  let quote: '"' | "'" | null = null;
  // 直前の非空白文字。 quote の開始を「値の先頭」 に限るために持つ。
  let prev: string | null = null;
  for (let i = 0; i < inner.length; i += 1) {
    const ch = inner[i]!;
    if (quote === '"') {
      // double-quoted の中でだけ backslash escape を解釈する。
      // 見ないと `label: "a \" b, c"` の `\"` を終端と誤認して以降の `,` を拾う。
      // 逆に quote 外でも読み飛ばすと `label: x\, posX: 100` の `\,` を食べて分割されない。
      if (ch === "\\") { i += 1; continue; }
      if (ch === '"') quote = null;
      continue;
    }
    if (quote === "'") {
      // YAML の single-quoted scalar は backslash escape を解釈せず、
      // `''` (2 連続) が単一の `'` を表す。
      if (ch === "'") {
        if (inner[i + 1] === "'") { i += 1; continue; }
        quote = null;
      }
      continue;
    }
    // quote の開始は値の先頭 (`:` `,` `{` `[` の直後、 または文字列先頭) でのみ認める。
    // YAML では unquoted scalar 中の `'` (`label: It's fine`) は区切りの意味を持たないため、
    // これを quote 開始と誤認すると以降の `,` を飲んで field が分割されなくなる。
    if ((ch === '"' || ch === "'") && (prev === null || ":,{[".includes(prev))) {
      quote = ch;
      prev = ch;
      continue;
    }
    if (ch === "{" || ch === "[") depth += 1;
    else if (ch === "}" || ch === "]") depth -= 1;
    else if (ch === "," && depth === 0) {
      out.push(inner.slice(start, i));
      start = i + 1;
    }
    if (ch !== " " && ch !== "\t") prev = ch;
  }
  out.push(inner.slice(start));
  return out.map((f) => f.trim()).filter((f) => f.length > 0);
}

/** top-level field 群から key の値を取り出す (見つからなければ null)。 */
export function readTopLevelField(inner: string, key: string): string | null {
  for (const field of splitTopLevelFields(inner)) {
    const idx = field.indexOf(":");
    if (idx < 0) continue;
    if (field.slice(0, idx).trim() !== key) continue;
    return field.slice(idx + 1).trim();
  }
  return null;
}

/**
 * src から parts kind actor 行を抽出、 base src (parts なし) と parts list を返す。
 * cdl compile pipeline 前段で呼び、 cdl には base のみ渡す = parts は cdl の auto-layout 対象外。
 */
/**
 * 組み込みの種類。 これに載っているものは見本ではない。
 *
 * 記法が受理する種類の全体 (`NODE_KIND_VALID`) をそのまま使う。 手書きの一覧を別に持つと、
 * 種類が増えた時にこちらだけ取り残されて余分な読み込みが起きる。
 */
const BUILTIN_KINDS: ReadonlySet<string> = new Set(
  [...NODE_KIND_VALID].map((k) => k.toLowerCase()),
);

/**
 * 本文が見本 (パーツ) を使っている見込みがあるか (#1022)。
 *
 * 見本の一覧は 80 件あるため、開いた時に読む形で遅延させている。 そのため一覧を一度も
 * 開いていない状態で共有 URL を開くと、見本の中身が無いまま組み立てられ、別名がそのまま
 * 箱になる (実測 = `achievement` を置いた本文が `ach` という名前の箱になった)。
 *
 * 本文の側から読み込みを起こすための判定。 見本かどうかは一覧が無いと決められないので、
 * **組み込みの種類でないものが書かれていたら候補とみなす**。 多めに拾う側に倒す
 * (見本を使わない本文で 1 回余分に読むだけで、絵は変わらない)。
 *
 * 見る書き方は `extractPartsFromSrc` と同じ 3 つ。 別々の規則で見ると、
 * 「読み込んだのに使われない」 か「使うのに読み込まない」 のどちらかが起きる。
 * 特に一覧から置いた時に作られる短い形 (`- 実績: achievement`) は、種類の行を持たない。
 *
 * `actors:` の中だけを見る。 外の文字列や注釈に種類の語があっても読み込みを起こさない。
 */
/**
 * 書かれた種類が見本の候補か。 組み込みの種類なら候補ではない。
 *
 * 除かないと `- Web: service` を書いた本文で毎回 80 件を読み込むことになる。
 */
function isPartKindCandidate(kind: string | null | undefined): boolean {
  if (kind === undefined || kind === null) return false;
  const k = kind.trim().replace(/^["']|["']$/g, "").toLowerCase();
  if (k === "") return false;
  return !BUILTIN_KINDS.has(k);
}

/**
 * YAML 欄の本文が見本を使っている見込みがあるか (#1022)。
 *
 * YAML は登場人物を `{ name, kind }` の形で書くため、本文欄とは文法が違う。 同じ走査を当てると
 * 2 つの誤りが出る = `- name: user` を本文欄の短い形と読んで名前を種類とみなし (`- name: Alice`
 * だけで読み込みが起きる)、次の行にある `kind:` は名前だけの行の続きではないため読み飛ばす。
 *
 * こちらは **`kind:` の項目だけ** を見る。 名前は見ない。
 */
export function yamlMayUseParts(src: string): boolean {
  let inActors = false;
  for (const line of src.split(/\r?\n/)) {
    // 字下げのない `key:` で項目が切り替わる
    const top = line.match(/^([^\s#][^:]*):(.*)$/);
    if (top) {
      inActors = /^actors[ \t]*$/.test(top[1]!);
      if (!inActors) continue;
      // 同じ行に書いた形 (`actors: [{ name: a, kind: x }]`)
      if (hasPartKindInline(top[2]!)) return true;
      continue;
    }
    if (!inActors) continue;
    // 縦に並べた形 (`- name: a` の次の行に `kind: x`)
    const kv = line.match(/^\s*-?\s*(kind|種類)\s*:\s*(.+)$/);
    if (kv && isPartKindCandidate(kv[2])) return true;
    // 波括弧の形
    if (hasPartKindInline(line)) return true;
  }
  return false;
}

/** 波括弧の中に見本の候補になる種類が書かれているか。 */
function hasPartKindInline(text: string): boolean {
  const m = text.match(/\{(.+)\}/);
  if (!m) return false;
  const inner = m[1]!;
  const kind = readTopLevelField(inner, "kind") ?? readTopLevelField(inner, "種類");
  return isPartKindCandidate(kind);
}

export function srcMayUseParts(src: string): boolean {
  const lines = src.split(/\r?\n/);
  let inActors = false;
  let blockIndent = -1;

  for (const line of lines) {
    // 字下げのない `key:` で項目が切り替わる
    if (/^[^\s#][^:]*:/.test(line)) {
      inActors = /^actors[ \t]*:[ \t]*$/.test(line);
      blockIndent = -1;
      continue;
    }
    if (!inActors) continue;
    if (line.trim() === "") continue;

    const indent = line.length - line.trimStart().length;
    // 縦に並べた形の続き。 種類の行を見る
    if (blockIndent >= 0 && indent > blockIndent) {
      const m = line.trim().match(/^(kind|種類)\s*:\s*(.+)$/);
      if (m && isPartKindCandidate(m[2])) return true;
      continue;
    }
    blockIndent = -1;

    // 中括弧の形
    const inline = line.match(ACTOR_LINE_RE);
    if (inline) {
      const kind = readTopLevelField(inline[4]!, "kind") ?? readTopLevelField(inline[4]!, "種類");
      if (isPartKindCandidate(kind)) return true;
      continue;
    }

    // 空白区切りの短い形 (`- 実績: achievement v=50`)。 一覧から置くとこの形になる
    const short = line.match(ACTOR_SHORT_RE);
    if (short) {
      const first = short[4]!.trim().split(/\s+/)[0];
      if (isPartKindCandidate(first)) return true;
      continue;
    }

    // 名前だけの行 (`- 実績:`) は、次の行から縦に並べた形が続く
    if (/^\s*-\s*("(?:[^"\\]|\\.)+"|[^:\s]+)\s*:\s*$/.test(line)) blockIndent = indent;
  }
  return false;
}

export function extractPartsFromSrc(
  src: string,
  partsCatalog: Record<string, unknown>,
  partsItems: CatalogItem[],
): { baseSrc: string; parts: OverlayPartParsed[]; lineMap: number[] } {
  const partKindSet = new Set<string>();
  for (const k of Object.keys(partsCatalog)) {
    partKindSet.add(k);
    if (k.startsWith("parts-")) partKindSet.add(k.slice(6));
  }
  const findItem = (kindValue: string): CatalogItem | undefined =>
    partsItems.find((p) => p.id === `parts-${kindValue}` || p.id === kindValue);
  const lines = src.split("\n");
  const baseLines: string[] = [];
  /**
   * `baseSrc` の行 (0 始まり) から元の `src` の行 (1 始まり) を引く表。
   *
   * パーツの行を落とすので、 組み立て側が返す行番号は `baseSrc` の座標になる。 元の本文を
   * 書き換える側 (自動修正) はこの表で戻す。 無いと、 `flow:` より前にパーツがある本文で
   * 別の行を書き換える (#998)。
   */
  const lineMap: number[] = [];
  /** 行を base 側に残す。 元の行番号を控える。 */
  const keep = (line: string, srcIdx: number): void => {
    baseLines.push(line);
    lineMap.push(srcIdx + 1);
  };
  const parts: OverlayPartParsed[] = [];
  // パーツを抜き出すのは `actors:` の中だけ。 全文を走ると、 別の項目の下に並ぶ行
  // (`notes:` の下の `- fake: achievement` 等) までパーツとして図から消える (実測)
  let inActors = false;

  /**
   * 縦に並べて書いた 1 件分の持ち越し。
   *
   * パーツかどうかは続く `kind:` の行で決まるので、 名前の行を見た時点では判断できない。
   * 判断が付くまで block 全体を貯めておき、 終わりが来てから振り分ける。
   *
   * 以前は `kind:` を見た時点でパーツと判定して名前と種類の 2 行だけを落としていた。 残りの行
   * (`色:` / `位置:`) は base 側に残り、 1 つ前の登場人物の続きとして読まれていた (実測 =
   * パーツに書いた色と位置が前の箱に付いた)。 block ごと扱えば取りこぼさない。
   */
  let pending: { alias: string; indent: number; lines: string[]; srcIdx: number[] } | null = null;

  /** 貯めた block を振り分ける。 パーツなら overlay に、 そうでなければ base に戻す。 */
  const flushPending = (): void => {
    if (!pending) return;
    const block = pending;
    pending = null;
    // 項目名は日本語でも英語でもよい (記法側と同じ)。 `種類:` を読まないと、 同じ本文が
    // 画面と組み立てで別の絵になる
    const kindLine = block.lines.find((l) => /^\s*(kind|種類)\s*:/.test(l));
    const kindValue = kindLine
      ?.trim()
      .match(/^(?:kind|種類)\s*:\s*"?([^"\s]+)"?/)?.[1]
      ?.toLowerCase();
    const item = kindValue && partKindSet.has(kindValue) ? findItem(kindValue) : undefined;
    if (!kindValue || !item) {
      block.lines.forEach((l, i) => keep(l, block.srcIdx[i]));
      return;
    }
    // 図には overlay として描くので、 図の中に箱は要らない。 block ごと落とす
    parts.push({
      id: block.alias,
      kind: kindValue,
      item,
      scale: readScaleFromBlock(block.lines),
      rotate: 0,
      ...readPositionFromBlock(block.lines),
      ...readSizeFromBlock(block.lines),
    });
  };

  for (const [srcIdx, line] of lines.entries()) {
    // 字下げのない `key:` で項目が切り替わる。 `actors:` の中かどうかを追う
    if (/^[^\s#][^:]*:/.test(line)) {
      flushPending();
      inActors = /^actors[ \t]*:[ \t]*$/.test(line);
      keep(line, srcIdx);
      continue;
    }
    if (!inActors) {
      flushPending();
      keep(line, srcIdx);
      continue;
    }
    if (pending !== null) {
      const indent = line.length - line.trimStart().length;
      // 空行と注釈の行、 名前の行より深い字下げは block の続き。
      //
      // 注釈を字下げで判定すると、 項目より浅く置いた `# ...` が block を終わらせ、
      // その後の項目が丸ごと読まれなくなる (実測 = `scale: 4` が 1 になった)。
      // 空行と同じ扱いにする = どちらも項目ではないので、 読む側が数から外す
      if (line.trim() === "" || line.trim().startsWith("#") || indent > pending.indent) {
        pending.lines.push(line);
        pending.srcIdx.push(srcIdx);
        continue;
      }
      flushPending();
    }
    // 名前だけの行 (`- 実績:`) は、 種類が続く行で決まる
    const head = line.match(/^(\s*)-\s*("(?:[^"\\]|\\.)+"|[^:\s]+)\s*:\s*$/);
    if (head) {
      pending = { alias: unquoteAlias(head[2]!), indent: head[1]!.length, lines: [line], srcIdx: [srcIdx] };
      continue;
    }
    // ReDoS 耐性のため ACTOR_LINE_RE (capture: prefix / name / sep / inner) を共用する
    const short = line.match(ACTOR_SHORT_RE);
    if (short) {
      // 短い形は先頭の語が種類。 残りは倍率 (`scale=2`) と状態の上書き (`v=50`) と
      // 位置 (`@300,200`)。
      //
      // `倍率` は組み立て側でも図形の倍率として予約した (#1026)。 予約する前は状態の名前として
      // 読まれており、同じ本文が 2 経路で別の絵になっていた
      const alias = unquoteAlias(short[2]!);
      const values = short[4]!.trim().split(/\s+/);
      const kindValue = values[0]!.toLowerCase();
      if (partKindSet.has(kindValue)) {
        const item = findItem(kindValue);
        if (item) {
          parts.push({
            id: alias,
            kind: kindValue,
            item,
            scale: readScaleToken(values),
            rotate: 0,
            ...readAtToken(values),
          });
          continue;
        }
      }
    }
    const m = line.match(ACTOR_LINE_RE);
    if (m) {
      const alias = unquoteAlias(m[2]!);
      const inner = m[4]!;
      // nested map (`nodes: { header: { kind: x, posX: 1 } }`) の内側を top-level と
      // 取り違えないよう、 depth を数えて top-level field だけを読む。
      const kindRaw = readTopLevelField(inner, "kind");
      if (kindRaw) {
        const kindValue = kindRaw.match(/^[a-zA-Z0-9-_]+/)?.[0] ?? "";
        if (partKindSet.has(kindValue)) {
          const num = (key: string): RegExpMatchArray | null => {
            const raw = readTopLevelField(inner, key);
            return raw ? raw.match(/^(-?\d+(?:\.\d+)?)/) : null;
          };
          const posXMatch = num("posX");
          const posYMatch = num("posY");
          const rotateMatch = num("rotate");
          // 中括弧の形で書いた寸法。 組み立て側はこの形の `posW` / `posH` を受けるので、
          // 読まないと同じ本文が画面側だけ元の大きさになる (#1018)。
          // `大きさ: 2000,300` は中括弧の中では深さ 0 の `,` で 2 つに割れるため、
          // 組み立て側も受けない。 揃えて受けない。
          //
          // 数の読み方は先頭の 10 進部分だけを取る `num` ではなく、値全体を数として読む。
          // 組み立て側が `Number()` で読むため、`posW: 1e3` が画面側だけ 1 になる
          const size = (key: string): number | undefined => {
            const raw = readTopLevelField(inner, key);
            if (raw === undefined || raw === null) return undefined;
            const trimmed = raw.trim().replace(/^["']|["']$/g, "");
            if (trimmed === "") return undefined;
            const n = Number(trimmed);
            return Number.isFinite(n) ? n : undefined;
          };
          // 2026-07-26 CAR-2158 correctness fix = bg を parse する。
          // 旧実装は bg を無視していたため、 color picker で DSL に bg を書いても canvas に反映されなかった。
          const bgRaw = readTopLevelField(inner, "bg");
          const bgMatch = bgRaw ? bgRaw.match(/^"([^"]*)"/) : null;
          const item = findItem(kindValue);
          if (item) {
            parts.push({
              id: alias,
              kind: kindValue,
              // 中括弧の形は座標を直接持つ。 片方だけ書かれた時は書かなかった扱いにする
              // (縦横 2 つ揃って初めて位置になる)
              posX: posXMatch && posYMatch ? parseFloat(posXMatch[1]!) : undefined,
              posY: posXMatch && posYMatch ? parseFloat(posYMatch[1]!) : undefined,
              scale: parsePartScale(readTopLevelField(inner, "scale") ?? readTopLevelField(inner, "倍率")),
              rotate: rotateMatch ? parseFloat(rotateMatch[1]!) : 0,
              posW: size("posW"),
              posH: size("posH"),
              // 背景色は SVG の `fill` に直接入る。 色として読めない値を持ち回ると、
              // `url(https://...)` を書いた本文を共有された人の環境から外部へ要求が飛ぶ (#1004)。
              // 色でなければ「書かなかった」 扱いにして、 既定の見た目に戻す
              bg: bgMatch && isColorValue(bgMatch[1]) ? bgMatch[1] : undefined,
              item,
            });
            continue;
          }
        }
      }
    }
    keep(line, srcIdx);
  }
  // 判定が終わらないまま終端に達した分を振り分ける
  flushPending();
  return { baseSrc: baseLines.join("\n"), parts, lineMap };
}

/**
 * 縦に並べた block から `位置:` を読む。
 *
 * 読み方は記法側と同じにする。 座標の形なら中心、 相対の形なら基準と向きを持つ。
 * どちらでもなければ書かなかった扱い (自動配置) にする。
 */
function readPositionFromBlock(
  lines: string[],
): { posX?: number; posY?: number; posRel?: RelativePos } {
  for (const line of lines) {
    const m = line.trim().match(/^(位置|pos)\s*:\s*(.+)$/);
    if (!m) continue;
    const value = m[2]!.trim().replace(/^["']|["']$/g, "");
    const abs = value.match(/^(-?\d+(?:\.\d+)?)\s*[,、]\s*(-?\d+(?:\.\d+)?)$/);
    if (abs) return { posX: Number(abs[1]), posY: Number(abs[2]) };
    const rel = parseRelativePos(value);
    if (rel) return { posRel: rel };
  }
  return {};
}

/**
 * 縦に並べて書いた 1 件から `scale: 2` を読む (#1020)。
 *
 * 中括弧の形は読んでいたが、縦に並べた形は常に 1 として扱っていた。 書いても効かず、
 * しかも何も知らせないため、書いた人からは倍率が無いように見える。
 *
 * 数の読み方は中括弧の形と揃える (値全体を数として読み、`normalizePartScale` を通す)。
 * 書いていなければ 1。
 */
/**
 * 縦に並べて書いた 1 件から倍率を読む (#1020)。
 *
 * **画面側だけの意味**。 組み立て側は `scale` を状態の名前として読む (実測 = 3 つの書き方すべてで
 * `stateOverride.scale` になった)。 重ねたパーツは本文から抜いてから組み立てるため、この値を
 * 読むのは画面側だけ = 通常の操作では食い違いは表に出ない。
 * 見本を library として使う経路との意味の違いは #1026 に切り出した。
 */
function readScaleFromBlock(lines: string[]): number {
  const raw = readDirectField(lines, ["scale", "倍率"]);
  return parsePartScale(raw);
}

/**
 * 縦に並べて書いた 1 件から、**直下の項目** だけを読む。
 *
 * 字下げを見ずに読むと、入れ子の中の同名の項目まで拾う (実測 = `nodes` の下に書いた
 * `scale: 7` がパーツ全体の倍率になった)。 一番浅い字下げを直下とみなす。
 *
 * 同じ項目を 2 度書いた時は後を採る。 前を採ると、書き直した値が効かない。
 */
function readDirectField(lines: string[], keys: readonly string[]): string | null {
  // 先頭は名前の行 (`  - 実績:`) で、項目より浅い。 これを混ぜると直下の字下げを見誤る。
  // 注釈の行も除く = 項目より浅く置かれた `# ...` を数に入れると直下を見誤り、
  // 本来読める項目が読めなくなる (実測 = 浅い注釈があると `scale: 4` が 1 になった)
  const body = lines.slice(1).filter((l) => l.trim() !== "" && !l.trim().startsWith("#"));
  const indents = body.map((l) => l.length - l.trimStart().length);
  if (indents.length === 0) return null;
  const direct = Math.min(...indents);
  // 別名 (`scale` / `倍率`) は **先に並べた名前を優先** する。 中括弧の形も同じ順で引くので、
  // 両方書いた時にどちらが効くかが書き方で変わらない
  for (const key of keys) {
    let found: string | null = null;
    for (const line of body) {
      if (line.length - line.trimStart().length !== direct) continue;
      const m = line.trim().match(new RegExp(`^${key}\\s*:\\s*(.*)$`));
      // 同じ名前を 2 度書いた時は後を採る。 前を採ると書き直した値が効かない
      if (m) found = m[1] ?? "";
    }
    if (found !== null) return found;
  }
  return null;
}

/**
 * 縦に並べて書いた 1 件から `大きさ: 400,180` を読む。
 *
 * 読まないと、組み立て側だけが拡大して画面と大きさが変わる (実測 = `大きさ: 2000,300` の
 * 見本が組み立て側 2000 幅、画面側 400 幅。それを基準にした相対指定が 800 ずれた)。
 *
 * 項目名は日本語でも英語でもよい (`位置:` と同じ)。 読んだ値はそのまま持ち、伸縮するか
 * どうかは `partTargetScale` が縦横それぞれで決める。 ここで「両方が正の時だけ」 と絞ると、
 * `大きさ: 2000,0` のように片方だけ有効な形で組み立て側と食い違う (あちらは横だけ伸ばす)。
 */
function readSizeFromBlock(lines: string[]): { posW?: number; posH?: number } {
  for (const line of lines) {
    const m = line.trim().match(/^(大きさ|size)\s*:\s*(.+)$/);
    if (!m) continue;
    const value = m[2]!.trim().replace(/^["']|["']$/g, "");
    const wh = value.match(/^(-?\d+(?:\.\d+)?)\s*[,、]\s*(-?\d+(?:\.\d+)?)$/);
    if (!wh) continue;
    return { posW: Number(wh[1]), posH: Number(wh[2]) };
  }
  return {};
}

/**
 * 空白区切りの値から `scale=2` / `倍率=2` を読む (#1026)。
 *
 * 別名は先に並べた方を採る。 他の 2 つの書き方と同じ順にしないと、書き方で効く名前が変わる。
 */
function readScaleToken(values: string[]): number {
  for (const key of ["scale", "倍率"]) {
    const hit = values.find((v) => v.startsWith(`${key}=`));
    if (hit) return parsePartScale(hit.slice(key.length + 1));
  }
  return 1;
}

/** 空白区切りの値から `@300,200` を読む。 */
function readAtToken(values: string[]): { posX?: number; posY?: number } {
  for (const v of values) {
    const m = v.match(/^@(-?\d+(?:\.\d+)?)\s*[,、]\s*(-?\d+(?:\.\d+)?)$/);
    if (m) return { posX: Number(m[1]), posY: Number(m[2]) };
  }
  return {};
}

/**
 * src YAML の actors block 末尾に 1 行 append する (CAR-1657)。
 * actors block が無ければ null を返す (caller が新規 diagram を作る fallback 経路)。
 *
 * 行と改行コードを分けて扱う (偶数 index = 行、 奇数 index = separator)。
 * LF 固定で挿入すると CRLF の DSL に LF 行が混ざり、 以後の座標更新で
 * 無関係な行の改行まで巻き込まれる (CAR-2158 Round 6 MAJOR)。
 */
export function appendActorLine(src: string, newLine: string): string | null {
  const seg = src.split(/(\r\n|\n)/);
  const lines: string[] = [];
  for (let i = 0; i < seg.length; i += 2) lines.push(seg[i]!);
  const actorsIdx = lines.findIndex((l) => /^actors[ \t]*:[ \t]*$/.test(l));
  if (actorsIdx < 0) return null;
  let insertIdx = lines.length;
  for (let i = actorsIdx + 1; i < lines.length; i++) {
    if (/^[a-zA-Z]/.test(lines[i] ?? "")) {
      insertIdx = i;
      break;
    }
  }
  while (insertIdx > actorsIdx + 1 && (lines[insertIdx - 1] ?? "").trim() === "") {
    insertIdx -= 1;
  }
  // 挿入位置の直前で実際に使われている改行コードに合わせる。
  // 直前が無い (末尾改行なしの DSL で末尾に足す) 場合は、 最後の行を終端している
  // separator を見る。 buffer 先頭の separator を見ると、 改行が混在した DSL で
  // 挿入位置と無関係な改行コードを拾って混在をさらに進めてしまう。
  const sep = seg[insertIdx * 2 - 1] ?? seg[seg.length - 2] ?? (src.includes("\r\n") ? "\r\n" : "\n");
  if (insertIdx * 2 >= seg.length) {
    // 挿入位置が buffer の末尾を越える = 末尾に改行が無い状態。
    // ここで `splice(idx, 0, newLine, sep)` にすると直前の行と newLine が改行なしで
    // 連結される (`  - a` + `  - b: {...}` が 1 行になる)。 改行を先に置く。
    seg.push(sep, newLine);
  } else {
    seg.splice(insertIdx * 2, 0, newLine, sep);
  }
  return seg.join("");
}
