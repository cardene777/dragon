/**
 * Text DSL i18n キーワード一覧
 * 日本語 / 英語両対応 (大文字小文字無視)
 */

import {
  LEGEND_MARKS,
  type BarCornerRadii,
  type CdlNode,
  type LegendMark,
  type NodeKind,
  type Tone,
} from "@cardenelabs/cdl";

/** ブロック ヘッダー */
export const HEADERS = {
  title: ["タイトル", "title"],
  type: ["種類", "type"],
  actors: ["登場人物", "actors"],
  flow: ["流れ", "flow", "steps"],
  animate: ["アニメーション", "animate", "animation"],
} as const;

/** preset 名 */
export const PRESET_NAMES = ["sequence", "flow", "swimlane", "record", "topology"] as const;

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
 * 箱を並べる順 (`order:`、 #2655)。
 *
 * 書かなければ **書いた順** のまま。 `種類` と書くと箱の種類で並べ替えてから置く。
 *
 * これは図の型として持っていた差を語に出したもの。 並べ替えの鍵しか持たない型が在り、
 * `compile.ts` は「順序図 または その型」 という条件を 6 か所で書いていた。 **型が 1 つ増えるたびに条件を 2 つ並べる形**になるので、差が並べ替えだけなら
 * 型ではなく語で表す。
 */
export const ORDERS = ["種類"] as const;
export type DslOrder = (typeof ORDERS)[number];

/**
 * 並び順の別名。 向きと同じく日本語と英語の両方で書ける。
 *
 * 正規の語を鍵にも入れておく = 引く側が別名かどうかを気にせず 1 度で解決できる。
 */
export const ORDER_ALIAS: Record<string, DslOrder> = {
  種類: "種類",
  kind: "種類",
};

/** 書いた並び順を正規の語に直す。 読めない語は `null`。 */
export function resolveOrder(s: string): DslOrder | null {
  const k = s.trim().toLowerCase();
  return Object.hasOwn(ORDER_ALIAS, k) ? ORDER_ALIAS[k]! : null;
}

/**
 * 数を描く図の形 (`shape:`、 #2657)。
 *
 * 数の書き方 (`- 名前: "45"` の 1 行 1 値) は 9 つとも同じで、違うのは描かれる形だけ。
 * 差が形だけなので型ではなく語で表す (並べ替えの語 #2655 と同じ判断)。
 *
 * **日本語の別名は持たない**。 いま `type:` に書く語が英語なので、語を移した先で
 * 書き手が覚える綴りが増えない形にする。
 */
export const SHAPES = [
  "pie",
  "bar",
  "line",
  "gauge",
  "radial",
  "stat",
  "waffle",
  "stacked",
  "slope",
] as const;
export type DslShape = (typeof SHAPES)[number];

/** 泳法図の形 (`shape:`、 #2797)。 後続の形も chart と混ぜずここへ足す。 */
export const SWIMLANE_SHAPES = ["stages", "metro", "timeline"] as const;
export type DslSwimlaneShape = (typeof SWIMLANE_SHAPES)[number];

/** 最上位の `shape:` が取り得る語。 図種ごとの集合は `DIAGRAM_SHAPES` が決める。 */
export type DslDiagramShape = DslShape | DslSwimlaneShape;

/**
 * `shape:` を選べる図種と、その図種で書ける語 (#2797)。
 *
 * 解析・組み立て・schema の照合はこの表から導く。 集合を別々の場所で対応付けると、形を
 * 足した時に一方だけが古くなり、同じ語が入口によって通ったり落ちたりする。
 */
export const DIAGRAM_SHAPES = {
  chart: SHAPES,
  swimlane: SWIMLANE_SHAPES,
} as const satisfies Record<string, readonly DslDiagramShape[]>;

export type ShapeDiagramType = keyof typeof DIAGRAM_SHAPES;

/** 全図種の `shape:` の語。 図種を決める前の読み取りと schema の照合に使う。 */
export const ALL_DIAGRAM_SHAPES: readonly DslDiagramShape[] = Object.values(DIAGRAM_SHAPES).flat();

/** 書いた形を正規の語に直す。 読めない語は `null`。 */
export function resolveShape(s: string): DslShape | null {
  const k = s.trim().toLowerCase();
  return (SHAPES as readonly string[]).includes(k) ? (k as DslShape) : null;
}

/** 書いた形を図種をまたぐ正規の語に直す。 読めない語は `null`。 */
export function resolveDiagramShape(s: string): DslDiagramShape | null {
  const k = s.trim().toLowerCase();
  return (ALL_DIAGRAM_SHAPES as readonly string[]).includes(k)
    ? (k as DslDiagramShape)
    : null;
}

/** その図種で書ける形。 形を持たない図種は空の並びを返す。 */
export function shapesForDiagramType(type: string): readonly DslDiagramShape[] {
  return Object.hasOwn(DIAGRAM_SHAPES, type)
    ? DIAGRAM_SHAPES[type as ShapeDiagramType]
    : [];
}

/**
 * 図の意匠 (`theme:`、 #1553 / #2790 / #2791 / #2792 / #2793 / #2794 / #2795 / #2796)。
 *
 * cdl は色を持たない (形だけを描く)。 名前を `data-cdl-palette` として markup に出すので、
 * dragon の `cdl-theme.css` がその名前を見て 9 つの口
 * (台 / 行の面 / 縞 / 枠 / 字 / 型名 / 線 / 所有 / 向きだけ) に色を当てる。
 *
 * **名前を自由文字列にしない**。 書き間違えると既定の色みのまま出るので、書き手には
 * 「効かない」 としか見えない。 語を絞れば読めない語をその場で知らせられる。
 *
 * どの意匠も地まで含めた 1 枚の絵で、画面の明暗に従わない。 色だけを変える生成りに茶と
 * 青磁に墨は外した (#2960、置き換え先は `v05/removed-syntax.ts` の `外した意匠`)。
 */
export const THEMES = ["blueprint", "letterpress", "catalog", "terminal", "sketch", "neon", "relief"] as const;
export type DslTheme = (typeof THEMES)[number];

/**
 * 意匠の別名 (#2790 / #2791 / #2792 / #2793 / #2794 / #2795 / #2796)。 向きと同じく日本語と英語の両方で書ける。
 *
 * `blueprint` = 図面、 `letterpress` = 活版、 `catalog` = 図録、 `terminal` = 端末、
 * `sketch` = 手描き、 `neon` = 電飾、 `relief` = 浮彫。
 *
 * record は用途を一つに決められないため既定の意匠を持たない。 意匠が要る時は書き手が
 * `theme:` を明記する。
 */
export const THEME_ALIAS: Record<string, DslTheme> = {
  blueprint: "blueprint",
  letterpress: "letterpress",
  catalog: "catalog",
  terminal: "terminal",
  sketch: "sketch",
  neon: "neon",
  relief: "relief",
  図面: "blueprint",
  活版: "letterpress",
  図録: "catalog",
  端末: "terminal",
  手描き: "sketch",
  電飾: "neon",
  浮彫: "relief",
};

/** 書いた意匠を正規の語に直す。 読めない語は `null`。 */
export function resolveTheme(s: string): DslTheme | null {
  const k = s.trim().toLowerCase();
  return Object.hasOwn(THEME_ALIAS, k) ? THEME_ALIAS[k]! : null;
}

/** 描画側の凡例の印と、日本語で書く名前の対応。 印が増えた時は型検査で不足を知らせる。 */
const LEGEND_MARK_NAMES = {
  diamond: "菱形",
  "filled-circle": "塗った丸",
  "double-circle": "二重丸",
  "dotted-line": "点線",
  "solid-line": "実線",
  "curved-line": "曲線",
  "rounded-label": "角丸の札",
  "numbered-circle": "番号の丸",
  station: "駅",
  arrow: "矢印",
  "line-triangle-hollow": "白抜き三角の線",
  "line-diamond-hollow": "白抜き菱形の線",
  "line-diamond-solid": "塗った菱形の線",
  "rounded-box": "角丸の囲い",
} satisfies Record<LegendMark, string>;

/** 凡例の印の日本語名を描画側の名前へ直す表。 */
export const LEGEND_MARK_ALIAS: Readonly<Record<string, LegendMark>> = Object.fromEntries(
  Object.entries(LEGEND_MARK_NAMES).map(([mark, name]) => [name, mark as LegendMark]),
);

/** 凡例の印を描画側の名前へ直す。 読めない語は `null`。 */
export function resolveLegendMark(s: string): LegendMark | null {
  const k = s.trim().toLowerCase();
  if ((LEGEND_MARKS as readonly string[]).includes(k)) return k as LegendMark;
  return Object.hasOwn(LEGEND_MARK_ALIAS, k) ? (LEGEND_MARK_ALIAS[k] ?? null) : null;
}

/**
 * 意匠から字の測り方を引く (#2818 / #2918)。
 *
 * 意匠を替えても骨組みを変えず、端末の等幅字も箱へ収めるため、比例・等幅の広い方で測る。
 * 公開済みの関数なので窓口を残し、どの意匠でも組み立てと同じ値を返す。
 */
export function 意匠の字の測り方(_theme: DslTheme): "widest" {
  return "widest";
}

/**
 * 意匠と節から円の区画間の弧の長さを引く (#2871 / #2926)。
 *
 * 区画の形を意匠で変えないため値は返さない。公開済みの関数なので互換の窓口だけを残す。
 */
export function 意匠の円の区画の間(
  _theme: DslTheme,
  _node: Pick<CdlNode, "kind">,
): undefined {
  return undefined;
}

/** `barCornerRadii` が効く棒を描く節か。 */
export function 棒を描く節か(
  node: Pick<CdlNode, "kind" | "funnelForm">,
): boolean {
  return node.kind === "chart-bar" ||
    node.kind === "gantt-timeline" ||
    node.kind === "chart-stacked-bar" ||
    (node.kind === "funnel-stages" && node.funnelForm === "proportional-bars");
}

/**
 * 意匠と節から、見本に合わせた棒の 4 隅の丸みを引く (#2863)。
 *
 * 手描きの見本は楕円の角 (`10px 14px 6px 12px / 14px 8px 12px 6px`) だが、cdl は
 * 円の角だけを持つため、各隅の横と縦の平均を丸めて 12 / 11 / 9 / 9 とする。
 * 棒を描かない節には値を返さない。
 */
export function 意匠の棒の角(
  theme: DslTheme,
  node: Pick<CdlNode, "kind" | "funnelForm">,
): BarCornerRadii | undefined {
  if (!棒を描く節か(node)) return undefined;

  const category = node.kind === "chart-bar"
    ? "vertical"
    : node.kind === "gantt-timeline"
      ? "schedule"
      : "horizontal";

  const values = {
    blueprint: {
      vertical: [0, 0, 0, 0], schedule: [0, 0, 0, 0], horizontal: [0, 0, 0, 0],
    },
    letterpress: {
      vertical: [0, 0, 0, 0], schedule: [0, 0, 0, 0], horizontal: [0, 0, 0, 0],
    },
    catalog: {
      vertical: [4, 4, 0, 0], schedule: [4, 4, 0, 0], horizontal: [4, 4, 0, 0],
    },
    terminal: {
      vertical: [3, 3, 0, 0], schedule: [0, 3, 3, 0], horizontal: [0, 3, 3, 0],
    },
    sketch: {
      vertical: [12, 11, 9, 9], schedule: [12, 11, 9, 9], horizontal: [12, 11, 9, 9],
    },
    neon: {
      vertical: [10, 10, 3, 3], schedule: [3, 10, 10, 3], horizontal: [12, 12, 12, 12],
    },
    relief: {
      vertical: [12, 12, 5, 5], schedule: [5, 12, 12, 5], horizontal: [10, 10, 10, 10],
    },
  } as const;
  const [topLeft, topRight, bottomRight, bottomLeft] = values[theme][category];
  return { topLeft, topRight, bottomRight, bottomLeft };
}

/**
 * 意匠で決まる棒の角と行の縞を箱に当てる (#1553 / #2863 / #2960)。
 *
 * 記法と JSON の組み立て (`compile.ts`) と、組み立てた図へ外から意匠を当てる側 (見本帳の
 * 意匠の切替) の両方がこの関数を通る。 側ごとに持つと、外から当てた図だけ縞が欠ける
 * (切替が縞を宅配の 2 図でしか扱っていなかった、#2960)。
 *
 * - 棒の角は意匠の値で置き換える
 * - 縞は行を書いた表の箱 (`storage`) にだけ敷く。 縞は行を横に追う目印なので、行が無い箱には
 *   追う相手が無い (#2782)。 書き手が `rowStripe` を書いた箱はその値を保つ
 *
 * 変わらない時は同じ object を返す。 見本帳の切替は object が同じかで描き直すかを決める。
 */
export function 意匠を箱に当てる<T extends CdlNode>(node: T, theme: DslTheme): T {
  let next = node;
  const 棒の角 = 意匠の棒の角(theme, node);
  if (棒の角 !== undefined && !同じ角か(node.barCornerRadii, 棒の角)) {
    next = { ...next, barCornerRadii: 棒の角 };
  }
  if (node.kind === "storage" && (node.rows?.length ?? 0) > 0 && node.rowStripe === undefined) {
    next = { ...next, rowStripe: true };
  }
  return next;
}

function 同じ角か(a: BarCornerRadii | undefined, b: BarCornerRadii): boolean {
  return a?.topLeft === b.topLeft &&
    a.topRight === b.topRight &&
    a.bottomRight === b.bottomRight &&
    a.bottomLeft === b.bottomLeft;
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

/**
 * 段の説明を受ける語 (#2621)。 先頭が正の語で、後ろは同じ意味の別名。
 *
 * **2 形 (記法 / JSON) の入口と、公開している schema はここから導く**。 3 か所に別々に
 * 書いていたため、記法は `description` を受けるのに JSON は弾く状態が生まれた
 * (実測 = `$.animation[N].description: unknown key`)。
 *
 * 別名を落とさないのは、見本の記法の中に `description:` が 859 行あり、利用者が書いた
 * 記法も同じ語を使えるため。 落とすと外から見える壊し方になる。
 */
export const PHASE_BODY_KEYS = ["body", "description"] as const;

/** 段の説明の正の語 (別名を写す先) */
export const PHASE_BODY_CANONICAL = PHASE_BODY_KEYS[0];

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
