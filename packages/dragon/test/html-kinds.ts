/**
 * 図を SVG でなく HTML で描く種類 (判定の表、#3879)。描いた結果は SVG でなく HTML の表の根 (`data-dragon="<種類>"`) で、
 * SVG の線の曲がりと箱の角と字を読む検査 (角を落とす色味、手描きの線) は、この種類の見本を外す
 */
import { readFileSync } from "node:fs";

export const HTML_KINDS: readonly string[] = ["judge"];

/** 記法の図の種類。最初の空でない、注釈でない行の頭の語 */
export const notationKind = (text: string): string =>
  text
    .split("\n")
    .map((line) => line.trim())
    .find((line) => line !== "" && !line.startsWith("//"))
    ?.split(/[\s[]/u)[0] ?? "";

/** 見本の file (原本の JSON か記法) を HTML で描く種類か。原本は `kind` の欄、記法は頭の語で見る */
export function drawnAsHtml(path: string): boolean {
  const text = readFileSync(path, "utf8");
  const kind = path.endsWith(".json") ? (JSON.parse(text) as { kind?: unknown }).kind : notationKind(text);
  return typeof kind === "string" && HTML_KINDS.includes(kind);
}
