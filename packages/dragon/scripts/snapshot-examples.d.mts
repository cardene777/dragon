/** `snapshot-examples.mjs` の型 (#3345)。検査 (`test/examples-svg.test.ts`) が読む */

export { OUT, VARIANTS } from "./snapshot-variants.mjs";

/** 指紋を取る時に使う入口の関数 */
export interface SnapshotApi {
  parseNotation(text: string, options: { lang: "ja" | "en" }): { ok: boolean; diagram?: unknown; errors?: unknown };
  renderDiagram(diagram: unknown, options: Record<string, unknown>): { svg: string; layout: unknown; timeline: unknown; diagram: unknown };
}

/** 見本ごと、描き方ごとの指紋。鍵は `<file>|<描き方>|<svg か layout か timeline か json>` */
export declare function fingerprints(api: SnapshotApi): Record<string, string>;
