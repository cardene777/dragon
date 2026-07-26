/**
 * overlay parts の複製 (Cmd+D / Cmd+V / toolbar / context menu) で使う共通 helper。
 *
 * 複製処理は元々 4 箇所に同じ形で散らばっており、 rotate / bg を引き継ぐ修正を
 * keyboard 経路 2 つにだけ入れた結果、 toolbar と context menu では依然として
 * 回転・色が失われる不整合が生まれた (CAR-2158 Round 2 review で検出)。
 * 生成規則をここに集約して、 経路ごとの差が出ないようにする。
 */

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

/** DSL 中の全 actor alias を集める (quoted / short form / inline map の 3 形式)。 */
export function collectActorAliases(src: string): string[] {
  const aliases: string[] = [];
  for (const line of src.split("\n")) {
    // `  - name` / `  - name: {...}` / `  - "quoted name": {...}` の 3 形式に対応
    const m = line.match(/^\s*-\s*("[^"]*"|[^:\s][^:]*?)\s*(?::|$)/);
    if (!m) continue;
    const raw = m[1]!.trim();
    if (!raw) continue;
    aliases.push(raw.replace(/^"(.*)"$/, "$1"));
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
  const escaped = alias.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const quoted = `(?:"${escaped}"|${escaped})`;
  // inline map 形式 (`  - alias: { ... }`)
  const inlineRe = new RegExp(`^\\s*-\\s*${quoted}\\s*:\\s*\\{.+\\}\\s*\\r?\\n`, "m");
  if (inlineRe.test(src)) return src.replace(inlineRe, "");
  // short form (`  - alias`)
  const shortRe = new RegExp(`^\\s*-\\s*${quoted}\\s*\\r?\\n`, "m");
  return src.replace(shortRe, "");
}
