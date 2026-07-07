/**
 * 7 category catalog SSOT。
 *
 * 各 category は route (/catalog/:slug) + 個別 topic diagram を持つ。
 * category diagram の実 export は src/lib/catalog-diagrams.ts SSOT。
 */

export type CategoryCluster = "basic" | "extended";

export interface CategoryMeta {
  slug: string;
  label: string;
  eyebrow: string;
  desc: string;
  items: string[];
  cluster: CategoryCluster;
}

export const CATEGORIES: CategoryMeta[] = [
  {
    slug: "presets",
    label: "presets",
    eyebrow: "PRESETS / HIGH-LEVEL API",
    desc: "図の高位 API。 sequence / flow / swimlane / topology / er / state など、 1 行宣言でよくある構造を書ける。",
    items: ["sequence", "flow", "swimlane", "topology", "er", "stateMachine"],
    cluster: "basic",
  },
  {
    slug: "cookbook",
    label: "cookbook",
    eyebrow: "COOKBOOK / RECIPES",
    desc: "現場で使える完全レシピ。 API call / 認証 / CRUD / 非同期 / 運用などをコピペで動かせる。",
    items: ["API / Auth", "データ操作", "UI / フォーム", "非同期", "運用"],
    cluster: "basic",
  },
  {
    slug: "patterns",
    label: "patterns",
    eyebrow: "PATTERNS / COMPOSITION",
    desc: "汎用の構成パターン集。 直結 / 経由 / 分岐 / ループ / Fan-out / Rollback など、 図の組み立て方の型。",
    items: ["Direct", "Branch", "Loop", "Fan-out", "Rollback", "Schedule"],
    cluster: "basic",
  },
  {
    slug: "primitives",
    label: "primitives",
    eyebrow: "PRIMITIVES / LOW-LEVEL",
    desc: "図の最小パーツ。 actor / function / storage など基本 5 種 + 人 / インフラ / アプリ系の NodeKind をまとめて。",
    items: ["NodeKind", "Lane", "Stack"],
    cluster: "extended",
  },
  {
    slug: "text-dsl",
    label: "text-dsl",
    eyebrow: "TEXT DSL / BLOCK",
    desc: "5 ブロックの箇条書きで書ける dragon DSL の動作確認場。 sequence / flow / state / topology / er などをそのまま試せる。",
    items: ["sequence", "flow", "swimlane", "state", "topology", "er"],
    cluster: "extended",
  },
  {
    slug: "animation",
    label: "animation",
    eyebrow: "ANIMATION / PHASE",
    desc: "phase / state / tween / set / badge の動作確認。 数値補間 / 即時切替 / 連続 phase / バッジ切替。",
    items: ["Tween", "Set", "Badge", "Tween + Set"],
    cluster: "extended",
  },
  {
    slug: "styles",
    label: "styles",
    eyebrow: "STYLES / TONE",
    desc: "edge 種類 (solid / dotted-flow) と tone 6 種 (accent / teal / success / error / warning / info)、 active / inactive 状態。",
    items: ["EdgeStyle", "Tone", "Active / Inactive"],
    cluster: "extended",
  },
];
