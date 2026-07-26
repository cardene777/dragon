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
export function unquoteAlias(raw: string): string {
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
  let inQuote = false;
  for (let i = 0; i < inner.length; i += 1) {
    const ch = inner[i]!;
    // quote の中でだけ backslash escape を解釈する。
    // quote 内で見ないと `label: "a \" b, c"` の `\"` を終端と誤認して以降の `,` を
    // field 区切りに拾う。 逆に quote 外でも読み飛ばすと `label: x\, posX: 100` の `\,` を
    // 食べて field が分割されなくなる (Round 4 で後者を作り込んだ)。
    if (inQuote && ch === "\\") { i += 1; continue; }
    if (ch === '"') { inQuote = !inQuote; continue; }
    if (inQuote) continue;
    if (ch === "{" || ch === "[") depth += 1;
    else if (ch === "}" || ch === "]") depth -= 1;
    else if (ch === "," && depth === 0) {
      out.push(inner.slice(start, i));
      start = i + 1;
    }
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
 * DSL から 1 つの overlay part の top-level 座標を読む (catalog 不要)。
 *
 * `extractPartsFromSrc` は catalog を引いて item を解決するため、 catalog がまだ用意できていない
 * 文脈 (state 更新関数の内側など) では null になる。 座標だけが要る経路はこちらを使う。
 */
export function readOverlayPartPos(
  src: string,
  alias: string,
): { posX: number; posY: number; scale: number; rotate: number } | null {
  for (const line of src.split(/\r?\n/)) {
    const m = line.match(ACTOR_LINE_RE);
    if (!m) continue;
    if (unquoteAlias(m[2]!) !== alias) continue;
    const inner = m[4]!;
    const num = (key: string, fallback: number): number => {
      const raw = readTopLevelField(inner, key);
      const parsed = raw ? raw.match(/^(-?\d+(?:\.\d+)?)/) : null;
      return parsed ? Number(parsed[1]) : fallback;
    };
    return { posX: num("posX", 0), posY: num("posY", 0), scale: num("scale", 1), rotate: num("rotate", 0) };
  }
  return null;
}

/**
 * overlay parts の posX / posY / scale field を DSL actor 行に upsert。
 * 他 field (kind / bg / state override 等) は保持。 scale が 1 以外の時のみ scale field 書出し。
 */
export function writeOverlayPartToDsl(
  src: string,
  alias: string,
  posX: number,
  posY: number,
  scale: number,
  rotate: number = 0,
): string {
  // 改行コードを保持したまま行単位で処理する
  const newline = src.includes("\r\n") ? "\r\n" : "\n";
  const lines = src.split(/\r?\n/);
  const rx = Math.round(posX);
  const ry = Math.round(posY);
  const sScale = Number.isFinite(scale) ? Number(scale.toFixed(3)) : 1;
  const sRotate = Number.isFinite(rotate) ? Number(rotate.toFixed(1)) : 0;
  const next = lines.map((line) => {
    const headMatch = line.match(ACTOR_LINE_RE);
    if (!headMatch) return line;
    const rawName = unquoteAlias(headMatch[2]!);
    if (rawName !== alias) return line;
    const prefix = headMatch[1]! + headMatch[2]! + headMatch[3]!;
    // top-level の座標 field だけを差し替える。 global な正規表現置換は
    // nested map (`nodes: { header: { posX: 50 } }`) の中の posX まで消してしまう。
    const kept = splitTopLevelFields(headMatch[4]!).filter((field) => {
      const key = field.slice(0, field.indexOf(":")).trim();
      return !["posX", "posY", "scale", "rotate"].includes(key);
    });
    const inner = kept.join(", ");
    const newFields = [`posX: ${rx}`, `posY: ${ry}`];
    if (Math.abs(sScale - 1) > 0.001) newFields.push(`scale: ${sScale}`);
    if (Math.abs(sRotate) > 0.05) newFields.push(`rotate: ${sRotate}`);
    const merged = inner.length > 0 ? `${inner}, ${newFields.join(", ")}` : newFields.join(", ");
    return `${prefix}{ ${merged} }`;
  });
  // 元の改行コードを保つ (CRLF の DSL を LF に潰さない)
  return next.join(newline);
}
