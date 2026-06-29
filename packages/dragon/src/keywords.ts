/**
 * Text DSL i18n キーワード一覧
 * 日本語 / 英語両対応 (大文字小文字無視)
 */

import type { NodeKind, Tone } from "@cardenelabs/cdl";

/** ブロック ヘッダー */
export const HEADERS = {
  title: ["タイトル", "title"],
  type: ["種類", "type"],
  actors: ["登場人物", "actors"],
  flow: ["流れ", "flow", "steps"],
  animate: ["アニメーション", "animate", "animation"],
} as const;

/** preset 名 */
export const PRESET_NAMES = ["sequence", "flow", "swimlane", "er", "state", "topology"] as const;

/** NodeKind 別名 (日本語 → English) */
export const NODE_KIND_ALIAS: Record<string, NodeKind> = {
  // 日本語
  人: "actor",
  関数: "function",
  ストレージ: "storage",
  イベント: "event",
  // 英語 (NodeKind そのまま)
  actor: "actor",
  function: "function",
  storage: "storage",
  event: "event",
  cdn: "cdn",
  service: "service",
  database: "database",
  cache: "cache",
  queue: "queue",
  // ... 残り 29 NodeKind は parser 内で types.NodeKind を直接受理
};

/** Tone 別名 */
export const TONE_ALIAS: Record<string, Tone> = {
  // 日本語
  成功: "success",
  失敗: "error",
  警告: "warning",
  情報: "info",
  中立: "accent",
  // 英語
  success: "success",
  error: "error",
  warning: "warning",
  info: "info",
  neutral: "accent",
  accent: "accent",
  teal: "teal",
};

/** アニメ サブキー */
export const ANIM_SUBKEYS = {
  state: ["状態", "state"],
  step: ["ステップ", "step"],
  highlight: ["強調", "highlight", "active", "activate"],
  tween: ["遷移", "tween"],
  set: ["切替", "set"],
  body: ["説明", "body", "description"],
  badge: ["バッジ", "badge"],
} as const;

/** 矢印記号 全変種を統一形 → に正規化 */
export const ARROW_PATTERNS = ["→", "->", "=>", ">>", "->>", "-->>", "->>"];

export function normalizeArrow(s: string): string {
  let r = s;
  for (const p of ARROW_PATTERNS) {
    r = r.split(p).join("→");
  }
  return r;
}

/** ヘッダー名 (日本語 or 英語) を canonical name に解決 */
export function resolveHeader(s: string): keyof typeof HEADERS | null {
  const lower = s.toLowerCase().trim();
  for (const [canon, aliases] of Object.entries(HEADERS)) {
    if ((aliases as readonly string[]).some((a) => a.toLowerCase() === lower)) {
      return canon as keyof typeof HEADERS;
    }
  }
  return null;
}

export function resolveAnimSubkey(s: string): keyof typeof ANIM_SUBKEYS | null {
  const lower = s.toLowerCase().trim();
  for (const [canon, aliases] of Object.entries(ANIM_SUBKEYS)) {
    if ((aliases as readonly string[]).some((a) => a.toLowerCase() === lower)) {
      return canon as keyof typeof ANIM_SUBKEYS;
    }
  }
  return null;
}

/** duration 文字列 (1.5 秒 / 1500ms / 2 秒) を ms に変換 */
export function parseDuration(s: string): number | null {
  const trimmed = s.trim();
  // "1.5 秒" / "2 秒"
  const sec = trimmed.match(/^([\d.]+)\s*秒$/);
  if (sec) return Math.round(parseFloat(sec[1]!) * 1000);
  // "1500ms" / "1500 ms"
  const ms = trimmed.match(/^([\d.]+)\s*ms$/i);
  if (ms) return Math.round(parseFloat(ms[1]!));
  // "1.5s" / "2s"
  const en = trimmed.match(/^([\d.]+)\s*s$/i);
  if (en) return Math.round(parseFloat(en[1]!) * 1000);
  return null;
}
