import type { CdlDiagram } from "@cardenelabs/cdl";

/**
 * 部品の図 (`CdlDiagram`) を JSON のまま本文に埋め込んだ形の、先頭行に置く印。
 *
 * 印の行の下に図の JSON を書く。 画面はこの形を作らない (一覧の部品を押すと `actors:` に行を足す) が、
 * 共有 URL や保存した本文に残っていることがあるので、開いた時に読めるよう読み取りだけを持つ。
 */
export const PARTS_MARKER = "#!parts";

/**
 * 本文が印の形かを判定する。
 * 先頭の空白と空行を除いた 1 行目が印と完全に一致する時だけ真で、それより後の内容は問わない。
 * `#!parts-draft` のように印で始まる別の行は印とみなさない。
 */
export function isPartsMarker(src: string): boolean {
  const trimmed = src.trimStart();
  const firstLine = trimmed.split(/\r?\n/, 1)[0] ?? "";
  return firstLine === PARTS_MARKER;
}

/**
 * 印の形の本文から図を読み出す。
 * 印が無い、印より後が JSON として読めない、`id` (文字列) と `nodes` (配列) を持つ object でない時は null。
 * 大きさの上限や色の値の検査は呼出側 (`CdlEditor.tsx`) が行う。
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
