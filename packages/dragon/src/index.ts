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
export { lintDiagram, autoFix } from "./notation-lint";
export type { LintIssue, LintReport, LintSeverity } from "./notation-lint";
// canvas pivot 新 spec 図境界計算 helper (§diagram-boundary SSOT)
export {
  computeDiagramBoundingBox,
  rectsOverlap,
  DIAGRAM_BOUNDARY_PADDING,
} from "./canvas-bounds";
export type { DiagramBoundingBox } from "./canvas-bounds";

// LLM 向け JSON DSL (Issue #208)
export { jsonToDiagram, validateDragonJson } from "./json-parser";
export { diagramJsonSchema } from "./schema";
export type {
  DragonJson,
  JsonActor,
  JsonStep,
  JsonPhase,
  JsonDslError,
} from "./json-parser";
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
 * CAR-1657 = compile 時 parts identifier lookup 用 catalog。
 * caller (CdlEditor 等) が loadPartsItems() の結果を Record<partId, CdlDiagram> で inject。
 * 未渡し時 partId set actor は「未解決」 として skip + console.warn (diagram render は継続)。
 */
export interface CompileOpts {
  partsCatalog?: Record<string, CdlDiagram>;
}

/**
 * Dragon DSL から CdlDiagram に一発変換。 v0.5 (英語 keyword) / v0.4 (日本語 keyword) を auto-detect。
 *
 * 判定 ... src 内に v0.5 専用 syntax (`animation:` block / `- A -> B` flow / `step: "..."` ) を含むなら v0.5、
 * 含まなければ v0.4 (deprecated、 console.warn を出す)。
 *
 * エラー時は throw、 詳細を取りたい場合は parseTextDslV05 / parseTextDsl を直接呼ぶ。
 * opts.partsCatalog を渡すと CAR-1657 parts kind (arc-gauge 等) の actor が merge 展開される。
 */
export function textDslToDiagram(src: string, opts?: CompileOpts): CdlDiagram {
  if (isV05Source(src)) {
    const r = parseTextDslV05(src);
    if (!r.ok) {
      const msg = r.errors
        .map((e) => `  L${e.line}: ${e.message}${e.hint ? `\n         hint: ${e.hint}` : ""}`)
        .join("\n");
      throw new Error(`Dragon DSL v0.5 parse error:\n${msg}`);
    }
    return compileToCdl(r.doc, opts);
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
  return compileToCdl(r.doc, opts);
}

function isV05Source(src: string): boolean {
  // CAR-1657 (+ codex-review MAJOR fix) = v0.5 default + v0.4 marker detect。
  //
  // v0.4 は 2026-12-31 廃止予定、 新規 source は v0.5 前提で default を v0.5 に倒す。
  // v0.4 marker (Japanese header + v0.4-specific English syntax) を 1 個でも検出したら v0.4 route。
  //
  // codex 指摘 = v0.4 も英語 alias `animate:` / `animation:` を受理するため、 header 名だけでは
  // 判定不足。 v0.4-specific syntax (`step "..." Xs` = colon なし step / `^\d+\.\s+` = 番号 flow) を
  // negative marker に追加。
  const V04_KEYWORDS = [
    // Japanese v0.4 専用 keyword (v0.5 は英語のみ)
    /^\s*タイトル\s*[:：]/,     // title (JA)
    /^\s*種類\s*[:：]/,          // type (JA)
    /^\s*登場人物\s*[:：]/,      // actors (JA)
    /^\s*流れ\s*[:：]/,          // flow (JA)
    /^\s*アニメーション\s*[:：]/,  // animation (JA)
    /^\s*動作\s*[:：]/,          // step (JA)
    /^\s*状態\s*[:：]/,          // state (JA)
    /^\s*ステップ\s*[「『]/,     // step (JA)
    // v0.4 English-specific syntax = colon なし step (v0.5 は step: 必須)
    /^\s*step\s+"[^"]+"\s+[\d.]+\s*s\b/,
    /^\s*step\s+'[^']+'\s+[\d.]+\s*s\b/,
    // v0.4 numbered flow (`1. A → B`、 v0.5 は `- A -> B`)
    /^\s*\d+\.\s+\S+\s*(?:→|->)\s*\S+/,
  ];
  const lines = src.split("\n");
  for (const ln of lines) {
    for (const kw of V04_KEYWORDS) {
      if (kw.test(ln)) return false; // v0.4 detected → false
    }
  }
  return true; // no v0.4 marker → v0.5 default
}
