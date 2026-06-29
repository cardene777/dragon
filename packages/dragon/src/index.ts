/**
 * Dragon — Text DSL public API
 *
 * Mermaid 感覚で animated SVG を生成する Text DSL。 cdl engine を呼出して CdlDiagram を返す。
 *
 * 使い方:
 *   const diagram = textDslToDiagram(source);
 *   // diagram は @cardenelabs/cdl の CdlDiagram、 そのまま CdlDiagramView 等に渡せる
 */

export { parseTextDsl } from "./parser";
export { compileToCdl } from "./compile";
export { parseTextDslV05 } from "./v05";
export type {
  DslDocument,
  DslActor,
  DslStep,
  DslAnimate,
  DslState,
  DslPhase,
  DslTween,
  DslSet,
  DslError,
  PresetType,
  DslLane,
  DslGroup,
  DslViewport,
} from "./types";

import { parseTextDsl } from "./parser";
import { parseTextDslV05 } from "./v05";
import { compileToCdl } from "./compile";
import type { CdlDiagram } from "@cardenelabs/cdl";

/**
 * Dragon DSL から CdlDiagram に一発変換。 v0.5 (英語 keyword) / v0.4 (日本語 keyword) を auto-detect。
 *
 * 判定 ... src 内に v0.5 専用 syntax (`animation:` block / `- A -> B` flow / `step: "..."` ) を含むなら v0.5、
 * 含まなければ v0.4 (deprecated、 console.warn を出す)。
 *
 * エラー時は throw、 詳細を取りたい場合は parseTextDslV05 / parseTextDsl を直接呼ぶ。
 */
export function textDslToDiagram(src: string): CdlDiagram {
  if (isV05Source(src)) {
    const r = parseTextDslV05(src);
    if (!r.ok) {
      const msg = r.errors
        .map((e) => `  L${e.line}: ${e.message}${e.hint ? `\n         hint: ${e.hint}` : ""}`)
        .join("\n");
      throw new Error(`Dragon DSL v0.5 parse error:\n${msg}`);
    }
    return compileToCdl(r.doc);
  }
  // v0.4 fallback (deprecated)
  if (typeof console !== "undefined" && console.warn) {
    console.warn(
      "[dragon] v0.4 syntax (Japanese keywords) is deprecated. Please migrate to v0.5 (English keywords) by 2026-12-31.",
    );
  }
  const r = parseTextDsl(src);
  if (!r.ok) {
    const msg = r.errors
      .map((e) => `  L${e.line}: ${e.message}${e.hint ? `\n         ヒント: ${e.hint}` : ""}`)
      .join("\n");
    throw new Error(`Dragon DSL parse error:\n${msg}`);
  }
  return compileToCdl(r.doc);
}

function isV05Source(src: string): boolean {
  // v0.5 判定 ... 以下のいずれかを含む場合:
  // 1. `animation:` (v0.5 専用 keyword、 v0.4 は `アニメーション:` / `animate:` を使う)
  // 2. `- A -> B` 形式の flow (v0.4 は `1. A → B` のように番号 + 全角矢印)
  // 3. `step: "..." 1s` 形式 (v0.4 は `step "..." 1s` で colon なし)
  // どれも v0.4 source には含まれないので衝突なし。
  //
  // 全行を走査するが、 最初の match で即 return するため 1000 行入力でも early exit。
  // (60 行制限版では 100 actor 超で flow / animation 行が窓外に出て v0.4 fallback に誤 routing していた)
  const lines = src.split("\n");
  for (const ln of lines) {
    if (/^\s*animation\s*:/.test(ln)) return true;
    if (/^\s*-\s+\S+\s*->\s*\S+/.test(ln)) return true;
    if (/^\s*-?\s*step\s*:\s*["'][^"']+["']/.test(ln)) return true;
  }
  return false;
}
