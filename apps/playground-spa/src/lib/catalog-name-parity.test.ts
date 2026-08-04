/**
 * 一覧に出る名前と、図が持つ題名が一致することの検証 (#1030)。
 *
 * 2 つは別々の file に書かれており、突き合わせる仕組みが無かった。 実測すると 129 件全件で
 * 文言が違い、うち `inputSliderBar` は「バーの幅が変化」 と「棒の高さが変わる」 で
 * **内容そのものが矛盾** していた (実際に変わるのは高さ)。
 *
 * 一覧から選んだ人が図を開くと違う説明が出るため、どちらが正しいか判断できない。
 * 片方だけ直すとこの test が落ちる。
 */
import { describe, it, expect } from "vitest";
import * as InteractiveMod from "@/topics/catalog/interactive.cdl";
import { ITEM_NAME_JA } from "./i18n";

/** 図として組み立て済の export だけを対象にする (説明文の export を除く)。 */
function diagramEntries(mod: Record<string, unknown>): Array<readonly [string, { topic?: string }]> {
  return Object.entries(mod)
    .filter(([k]) => !k.startsWith("subtitle__"))
    .map(([k, v]) => [k, v as { lanes?: unknown[]; topic?: string }] as const)
    .filter(([, v]) => Array.isArray((v as { lanes?: unknown[] }).lanes));
}

describe("一覧の名前と図の題名 (#1030)", () => {
  const entries = diagramEntries(InteractiveMod as unknown as Record<string, unknown>);

  it("対象が空振りしていない", () => {
    // 抽出の条件を間違えて 0 件になると、以下の検証が全て素通りする
    expect(entries.length, "図が 1 件も取れていない").toBeGreaterThan(100);
  });

  it("全件で文言が一致する", () => {
    const diff = entries
      .filter(([k, d]) => ITEM_NAME_JA[k] !== undefined && ITEM_NAME_JA[k] !== d.topic)
      .map(([k, d]) => `${k}: 一覧="${ITEM_NAME_JA[k]}" / 図="${d.topic}"`);
    expect(diff, `文言が違う (${diff.length} 件)\n  ${diff.slice(0, 5).join("\n  ")}`).toHaveLength(0);
  });

  it("一覧に名前が無い図が無い", () => {
    // 名前が無いと一覧に export 名がそのまま出る
    const missing = entries.filter(([k]) => ITEM_NAME_JA[k] === undefined).map(([k]) => k);
    expect(missing, `一覧に名前が無い: ${missing.join(", ")}`).toHaveLength(0);
  });
});
