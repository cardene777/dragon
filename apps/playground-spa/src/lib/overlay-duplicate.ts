/**
 * overlay parts の複製 (Cmd+D / Cmd+V / toolbar / context menu) で使う共通 helper。
 *
 * 複製処理は元々 4 箇所に同じ形で散らばっており、 rotate / bg を引き継ぐ修正を
 * keyboard 経路 2 つにだけ入れた結果、 toolbar と context menu では依然として
 * 回転・色が失われる不整合が生まれた (CAR-2158 Round 2 review で検出)。
 * 生成規則をここに集約して、 経路ごとの差が出ないようにする。
 */

import { unquoteAlias, quoteAlias } from "./overlay-dsl";

/** 複製元の最小情報。 呼び出し側の型 (OverlayPart / clipboard entry) の共通部分。 */
export type DuplicateSource = {
  kind: string;
  posX: number;
  posY: number;
  scale: number;
  rotate?: number;
  bg?: string;
};

/** 複製時の位置ずらし量 (world 単位)。 Miro / Figma と同じく右下に少しずらす。 */
export const DUPLICATE_OFFSET = 30;

/**
 * 既存 DSL と衝突しない alias を採番する。
 *
 * `- alias:` の substring 検索では、 quoted alias (`- "my part":`) や
 * 空白入り alias、 別 alias の prefix (`- achievement10:` があるのに `achievement1` を空きと誤判定)
 * を正しく判定できない。 行単位で actor 名を切り出して厳密に比較する。
 */
export function nextAvailableAlias(src: string, baseName: string): string {
  const used = new Set(collectActorAliases(src));
  let n = 1;
  while (used.has(`${baseName}${n}`)) n += 1;
  return `${baseName}${n}`;
}

/**
 * DSL 中の全 actor alias を集める (quoted / short form / inline map の 3 形式)。
 *
 * quoted alias の復号は `overlay-dsl` の `unquoteAlias` に委ねる。 独自の
 * `replace(/^"(.*)"$/)` で復号していた頃は escape (`\"`) が残り、 part の id
 * (`a " b`) と alias 集合 (`a \" b`) が食い違って削除が silent fail していた
 * (CAR-2158 Round 6 CRITICAL)。 複製時の採番も別集合を見て衝突しうる。
 */
export function collectActorAliases(src: string): string[] {
  const aliases: string[] = [];
  for (const line of src.split(/\r?\n/)) {
    // `  - name` / `  - name: {...}` / `  - "quoted name": {...}` の 3 形式に対応。
    // quoted 側は escape を含みうるので overlay-dsl の ACTOR_LINE_RE と同じ形で受ける。
    const m = line.match(/^[ \t]*-[ \t]*("(?:[^"\\]|\\.)*"|[^:\s][^:]*?)[ \t]*(?::|$)/);
    if (!m) continue;
    const raw = m[1]!.trim();
    if (!raw) continue;
    aliases.push(unquoteAlias(raw));
  }
  return aliases;
}

/**
 * 複製 actor 行を生成する。
 *
 * scale は 1、 rotate は 0 の時に field を省く (DSL を読みやすく保つため、 既定値は書かない)。
 */
export function buildDuplicateLine(source: DuplicateSource, newAlias: string): string {
  const scaleField = Math.abs(source.scale - 1) > 0.001 ? `, scale: ${source.scale.toFixed(3)}` : "";
  const rotate = source.rotate ?? 0;
  const rotateField = Math.abs(rotate) > 0.001 ? `, rotate: ${rotate.toFixed(1)}` : "";
  const bgField = source.bg ? `, bg: "${source.bg}"` : "";
  const x = Math.round(source.posX + DUPLICATE_OFFSET);
  const y = Math.round(source.posY + DUPLICATE_OFFSET);
  return `  - ${newAlias}: { kind: ${source.kind}${bgField}, posX: ${x}, posY: ${y}${scaleField}${rotateField} }`;
}

/**
 * alias の末尾連番を落として base 名を得る (`achievement3` → `achievement`)。
 * 連番を持たない alias はそのまま返す。
 */
export function aliasBaseName(alias: string): string {
  return alias.replace(/\d+$/, "") || alias;
}

/**
 * DSL から指定 alias の actor 行を削除する。
 *
 * 削除処理も duplicate と同様に 3 経路 (keyboard Delete / toolbar / context menu) へ
 * 散らばっており、 `\{[^}]*\}` のまま残った経路では nested map を持つ actor を消せなかった
 * (CAR-2158 Round 3 で 2/3 経路が未修正と判明)。 生成規則と同じくここに集約する。
 *
 * inner を `.+` (greedy) にしているのは `nodes: { header: { posX: 1 } }` のような
 * 入れ子を含む行を最初の `}` で打ち切らないため。
 */
export function removeActorLine(src: string, alias: string): string {
  const reEscape = (s: string): string => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  // DSL 上の表記は bare (`- a`) と quoted (`- "a \" b"`) の 2 通り。
  // quoted 側は素の alias を quote で囲むだけでは足りず、 DSL 表記へ再 escape してから
  // regex 化する (`a " b` → `"a \" b"`)。 囲むだけだと `"a " b"` になり実 DSL と
  // 一致せず削除が no-op になる (CAR-2158 Round 6 CRITICAL)。
  const quoted = `(?:${reEscape(quoteAlias(alias))}|${reEscape(alias)})`;
  // 行内の空白は `[ \t]` に限定する。 `\s` は改行を含むため、 CRLF の `\r` を跨いで
  // 前後の行を結合してしまう (JS の multiline `^` は `\r` 直後にも match するため実測で再現、
  // CAR-2158 Round 4 CRITICAL)。 行末も `(?:\r?\n|$)` で明示する。
  // inline map 形式 (`  - alias: { ... }`)
  const inlineRe = new RegExp(`^[ \t]*-[ \t]*${quoted}[ \t]*:[ \t]*\\{.+\\}[ \t]*(?:\\r?\\n|$)`, "m");
  if (inlineRe.test(src)) return src.replace(inlineRe, "");
  // short form (`  - alias`)
  const shortRe = new RegExp(`^[ \t]*-[ \t]*${quoted}[ \t]*(?:\\r?\\n|$)`, "m");
  return src.replace(shortRe, "");
}
