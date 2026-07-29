/**
 * overlay parts と DSL の相互変換を pure function として提供。
 * CdlEditor.tsx から抽出、 DOM / React 依存ゼロで vitest 単発 test 可能にする (Layer 1)。
 */

import type { CatalogItem } from "@/lib/catalog-items";

export type OverlayPartRaw = { id: string; kind: string; posX: number; posY: number; scale: number; rotate: number; bg?: string; item: CatalogItem };

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
): { baseSrc: string; parts: OverlayPartRaw[] } {
  const partKindSet = new Set<string>();
  for (const k of Object.keys(partsCatalog)) {
    partKindSet.add(k);
    if (k.startsWith("parts-")) partKindSet.add(k.slice(6));
  }
  const lines = src.split("\n");
  const baseLines: string[] = [];
  const parts: OverlayPartRaw[] = [];
  for (const line of lines) {
    // ReDoS 耐性のため ACTOR_LINE_RE (capture: prefix / name / sep / inner) を共用する
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
          const item = partsItems.find((p) => p.id === `parts-${kindValue}` || p.id === kindValue);
          if (item) {
            parts.push({
              id: alias,
              kind: kindValue,
              posX: posXMatch ? parseFloat(posXMatch[1]!) : 0,
              posY: posYMatch ? parseFloat(posYMatch[1]!) : 0,
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
  return { baseSrc: baseLines.join("\n"), parts };
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
