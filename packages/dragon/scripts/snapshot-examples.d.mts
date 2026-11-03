/** `snapshot-examples.mjs` の型 (#3345)。検査 (`test/examples-svg.test.ts`) が読む */

/** 見本の指紋を書き出す file */
export declare const OUT: string;

/** 描き方の組 */
export declare const VARIANTS: Record<string, Record<string, unknown>>;

/** 指紋を取る時に使う入口の関数 */
export interface SnapshotApi {
  parseNotation(text: string, options: { lang: "ja" | "en" }): { ok: boolean; diagram?: unknown; errors?: unknown };
  renderDiagram(diagram: unknown, options: Record<string, unknown>): { svg: string; layout: unknown; timeline: unknown };
}

/** 見本ごと、描き方ごとの指紋。鍵は `<file>|<描き方>|<svg か layout か timeline か json>` */
export declare function fingerprints(api: SnapshotApi): Record<string, string>;
