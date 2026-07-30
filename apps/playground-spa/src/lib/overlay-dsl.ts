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
  type RelativePos,
  type AnchorBox,
} from "@cardenelabs/dragon";

export type OverlayPartRaw = { id: string; kind: string; posX: number; posY: number; scale: number; rotate: number; bg?: string; item: CatalogItem };

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
 * パーツは自分の図として重ねて描かれ、 その大きさは `editor.css` の
 * `.v4-editor-svg-wrap svg` の既定値で決まる。 catalog の図枠から求めると実際の見た目と
 * ずれる (実測 = 図枠 525x500 のパーツが 800x600 で描かれていた)。
 *
 * 組み立て側は catalog の図枠を実寸とするため、 位置を書かないパーツの置き場所が 2 経路で
 * 違う (実測 = 中心が (400,1300) と (200,670))。 揃えるには画面側の描画を catalog の図枠に
 * 合わせる必要があり、 図枠と箱の外接矩形が別 (525x500 と 380x380) で縦横比の扱いも要る。
 * 格子の規則は共有済で、 残るのは大きさの出所。 Issue #937 で続ける。
 */
export const PART_RENDER_W = 800;
export const PART_RENDER_H = 600;

export function partWorldSize(part: OverlayPartParsed): { w: number; h: number } {
  const k = Number.isFinite(part.scale) && part.scale > 0 ? part.scale : 1;
  return { w: PART_RENDER_W * k, h: PART_RENDER_H * k };
}

/**
 * 読んだパーツに置き場所を決める。
 *
 * 位置を書いていないパーツは格子に並べる (従来通り)。 座標で書いたパーツと、 相対で書いた
 * パーツは、 書いた位置に置く。
 *
 * 書いた座標は箱の中心を指す。 登場人物の `位置:` と組み立て側のパーツ配置がどちらも中心
 * なので、 画面側だけ左上にすると同じ数字が別の場所を指すことになる。 画面に置く時に
 * 大きさの半分を引いて左上に直す。
 *
 * @param sizeOf パーツ 1 個の world 単位での大きさ。 中心と左上の変換に使う
 * @param boxes 基準にできる要素の位置。 図の組み立て結果から測ったもの
 */
export function placeParts(
  parsed: OverlayPartParsed[],
  boxes: ReadonlyMap<string, AnchorBox>,
  sizeOf: (part: OverlayPartParsed) => { w: number; h: number },
  baseNodeCount: number,
  onNotice?: (notice: PartPlacementNotice) => void,
): OverlayPartRaw[] {
  const byId = new Map(parsed.map((p) => [p.id, p] as const));
  const sizes = new Map(parsed.map((p) => [p.id, sizeOf(p)] as const));
  // 基準に使える中心。 図の側の要素に、 座標で書いたパーツを足す
  const centers = new Map<string, AnchorBox>(boxes);
  for (const p of parsed) {
    if (p.posX === undefined || p.posY === undefined) continue;
    const s = sizes.get(p.id)!;
    centers.set(p.id, { cx: p.posX, cy: p.posY, w: s.w, h: s.h });
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
    const s = sizes.get(p.id)!;
    const c = resolveRelativePos(p.posRel, anchor, s);
    resolved.set(p.id, c);
    centers.set(p.id, { cx: c.posX, cy: c.posY, w: s.w, h: s.h });
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
    const explicit =
      p.posX !== undefined && p.posY !== undefined
        ? { posX: p.posX, posY: p.posY }
        : resolved.get(p.id);
    const gridCenter = grid.get(p.id);
    const center = explicit ?? (gridCenter ? { posX: gridCenter.cx, posY: gridCenter.cy } : undefined);
    // 書いた位置も格子も、 まず中心として求めてから左上に直す。 片方だけ中心のままにすると、
    // 同じ数字が経路によって別の場所を指す
    if (!center) return { ...p, posX: 0, posY: 0 };
    return { ...p, posX: center.posX - s.w / 2, posY: center.posY - s.h / 2 };
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
export function extractPartsFromSrc(
  src: string,
  partsCatalog: Record<string, unknown>,
  partsItems: CatalogItem[],
): { baseSrc: string; parts: OverlayPartParsed[] } {
  const partKindSet = new Set<string>();
  for (const k of Object.keys(partsCatalog)) {
    partKindSet.add(k);
    if (k.startsWith("parts-")) partKindSet.add(k.slice(6));
  }
  const findItem = (kindValue: string): CatalogItem | undefined =>
    partsItems.find((p) => p.id === `parts-${kindValue}` || p.id === kindValue);
  const lines = src.split("\n");
  const baseLines: string[] = [];
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
  let pending: { alias: string; indent: number; lines: string[] } | null = null;

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
      baseLines.push(...block.lines);
      return;
    }
    // 図には overlay として描くので、 図の中に箱は要らない。 block ごと落とす
    parts.push({
      id: block.alias,
      kind: kindValue,
      item,
      scale: 1,
      rotate: 0,
      ...readPositionFromBlock(block.lines),
    });
  };

  for (const line of lines) {
    // 字下げのない `key:` で項目が切り替わる。 `actors:` の中かどうかを追う
    if (/^[^\s#][^:]*:/.test(line)) {
      flushPending();
      inActors = /^actors[ \t]*:[ \t]*$/.test(line);
      baseLines.push(line);
      continue;
    }
    if (!inActors) {
      flushPending();
      baseLines.push(line);
      continue;
    }
    if (pending !== null) {
      const indent = line.length - line.trimStart().length;
      // 空行と、 名前の行より深い字下げは block の続き
      if (line.trim() === "" || indent > pending.indent) {
        pending.lines.push(line);
        continue;
      }
      flushPending();
    }
    // 名前だけの行 (`- 実績:`) は、 種類が続く行で決まる
    const head = line.match(/^(\s*)-\s*("(?:[^"\\]|\\.)+"|[^:\s]+)\s*:\s*$/);
    if (head) {
      pending = { alias: unquoteAlias(head[2]!), indent: head[1]!.length, lines: [line] };
      continue;
    }
    // ReDoS 耐性のため ACTOR_LINE_RE (capture: prefix / name / sep / inner) を共用する
    const short = line.match(ACTOR_SHORT_RE);
    if (short) {
      // 短い形は先頭の語が種類。 残りは状態の上書き (`v=50`) と位置 (`@300,200`)
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
            scale: 1,
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
          const scaleMatch = num("scale");
          const rotateMatch = num("rotate");
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
              scale: scaleMatch ? parseFloat(scaleMatch[1]!) : 1,
              rotate: rotateMatch ? parseFloat(rotateMatch[1]!) : 0,
              bg: bgMatch ? bgMatch[1]! : undefined,
              item,
            });
            continue;
          }
        }
      }
    }
    baseLines.push(line);
  }
  // 判定が終わらないまま終端に達した分を振り分ける
  flushPending();
  return { baseSrc: baseLines.join("\n"), parts };
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
