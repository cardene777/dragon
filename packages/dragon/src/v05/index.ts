/**
 * Text DSL v0.5 public API
 *
 * 新 DSL (英語 keyword + 日本語値 quote 必須 + YAML 風 syntax)。
 * v0.4 (日本語 keyword) は deprecated、 6 ヶ月後削除予定。
 */

export { parseTextDslV05 } from "./parser";
export type { V05ParseResult } from "./parser";
