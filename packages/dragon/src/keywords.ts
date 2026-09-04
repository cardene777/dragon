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

/**
 * 図の並ぶ向き (`direction:`、 #1494)。
 *
 * 縦列 (`lane`) は横、段 (`stack`) は縦に置かれるので、向きは「1 つの縦列に積む」 か
 * 「1 人ずつ縦列を作る」 かの選択になる。 どちらも組み立て側に既にある経路で、
 * 記法から名指しできる言葉が無かった。
 */
export const DIRECTIONS = ["縦", "横"] as const;
export type DslDirection = (typeof DIRECTIONS)[number];

/**
 * 向きの別名。 色 (`色` / `color` / `tone`) と同じく日本語と英語の両方で書ける。
 *
 * 正規の語を鍵にも入れておく = 引く側が別名かどうかを気にせず 1 度で解決できる。
 */
export const DIRECTION_ALIAS: Record<string, DslDirection> = {
  縦: "縦",
  横: "横",
  vertical: "縦",
  horizontal: "横",
};

/** 書いた向きを正規の語に直す。 読めない語は `null`。 */
export function resolveDirection(s: string): DslDirection | null {
  const k = s.trim().toLowerCase();
  return Object.hasOwn(DIRECTION_ALIAS, k) ? DIRECTION_ALIAS[k]! : null;
}

/**
 * 図の配色 (`palette:`、 #1553)。
 *
 * cdl は色を持たない (形だけを描く)。 名前を `data-cdl-palette` として markup に出すので、
 * dragon の `cdl-theme.css` がその名前を見て 7 つの口 (台 / 行の面 / 縞 / 枠 / 字 / 型名 / 線)
 * に色を当てる。
 *
 * **名前を自由文字列にしない**。 書き間違えると既定の色みのまま出るので、書き手には
 * 「効かない」 としか見えない。 語を絞れば読めない語をその場で知らせられる。
 */
export const PALETTES = ["kinari", "celadon"] as const;
export type DslPalette = (typeof PALETTES)[number];

/**
 * 配色の別名。 向きと同じく日本語と英語の両方で書ける。
 *
 * `kinari` = 生成りに茶、 `celadon` = 青磁に墨。
 *
 * ER 図とクラス図は書かなくても `kinari` (生成りに茶) になる。 どちらも箱の作りが同じ
 * (行頭の印 + 左に名前 + 右に型) で、名前と型が離れて並ぶため、行を横に追う目印
 * (行の縞) が要る。 縞の色は配色からしか来ないので、既定が無いと縞が箱の面と同じ色に
 * 落ちて 1 本も出ない。 書き手が `palette:` を書いた時はそちらが勝つ。
 */
export const PALETTE_ALIAS: Record<string, DslPalette> = {
  kinari: "kinari",
  celadon: "celadon",
  生成り: "kinari",
  生成りに茶: "kinari",
  青磁: "celadon",
  青磁に墨: "celadon",
};

/** 書いた配色を正規の語に直す。 読めない語は `null`。 */
export function resolvePalette(s: string): DslPalette | null {
  const k = s.trim().toLowerCase();
  return Object.hasOwn(PALETTE_ALIAS, k) ? PALETTE_ALIAS[k]! : null;
}

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
