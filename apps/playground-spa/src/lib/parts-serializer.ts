import type { CdlDiagram } from "@cardenelabs/cdl";

/**
 * parts JSON escape hatch marker。
 *
 * 背景 = dragon text DSL (v0.5 parser) と JSON DSL parser は共に actors + flow model のみ対応、
 * parts.cdl.ts の cdl builder が使う shape / w / h / dyn-* rich field は parse できない。
 * text DSL への round-trip 不可能な parts を editor で扱うため、 text buffer 先頭に marker を置き
 * その下に JSON.stringify(CdlDiagram) を配置する escape hatch を導入する (decision-log
 * 2026-07-16-dragon-editor-parts-json-escape-hatch)。
 *
 * CdlEditor の parse pipeline は先頭 marker を検出したら JSON.parse に切替、
 * textDslToDiagram を bypass して CdlDiagramView に直接 AST を渡す。
 */
export const PARTS_MARKER = "#!parts";

/**
 * CdlDiagram を editor text buffer 用 escape hatch text に serialize する。
 * 先頭 `#!parts\n` marker + pretty-printed JSON。 全 field が保持される (JSON-safe な parts 前提)。
 */
export function serializePart(diagram: CdlDiagram): string {
  return `${PARTS_MARKER}\n${JSON.stringify(diagram, null, 2)}`;
}

/**
 * text buffer が parts escape hatch (先頭に marker あり) かを判定する。
 * 前後 whitespace は許容、 marker より後の内容は問わない。
 */
export function isPartsMarker(src: string): boolean {
  const trimmed = src.trimStart();
  return trimmed.startsWith(PARTS_MARKER);
}

/**
 * parts escape hatch text から CdlDiagram を復元する。
 * marker 不在 or JSON.parse 失敗時は null。
 * validation は最小限 (id + nodes field 存在)、 詳細 validation は呼出側の compile / visualValidate に委譲。
 */
export function deserializePart(src: string): CdlDiagram | null {
  if (!isPartsMarker(src)) return null;
  const trimmed = src.trimStart();
  const body = trimmed.slice(PARTS_MARKER.length).trimStart();
  try {
    const parsed = JSON.parse(body) as unknown;
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return null;
    const obj = parsed as Record<string, unknown>;
    if (typeof obj.id !== "string" || !Array.isArray(obj.nodes)) return null;
    return parsed as CdlDiagram;
  } catch {
    return null;
  }
}
