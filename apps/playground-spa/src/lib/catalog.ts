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
    label: "プリセット",
    eyebrow: "定型テンプレート",
    desc: "図の高位テンプレート。 シーケンス、 フロー、 スイムレーン、 トポロジー、 ER、 ステートなど、 1行の宣言でよくある構造を書ける。",
    items: ["シーケンス", "フロー", "スイムレーン", "トポロジー", "ER", "ステート"],
    cluster: "basic",
  },
  {
    slug: "cookbook",
    label: "レシピ集",
    eyebrow: "頻出レシピ",
    desc: "現場で使える完全レシピ集。 API呼び出し、 認証、 CRUD、 非同期処理、 運用パターンをコピペで動かせる。",
    items: ["API・認証", "データ操作", "UI・フォーム", "非同期", "運用"],
    cluster: "basic",
  },
  {
    slug: "patterns",
    label: "パターン",
    eyebrow: "汎用構成パターン",
    desc: "汎用の構成パターン集。 直結、 経由、 分岐、 ループ、 ファンアウト、 ロールバックなど、 図の組み立て方の型。",
    items: ["直結", "分岐", "ループ", "ファンアウト", "ロールバック", "定期実行"],
    cluster: "basic",
  },
  {
    slug: "primitives",
    label: "基本要素",
    eyebrow: "図の最小パーツ",
    desc: "図の最小パーツ。 外部主体、 関数呼び出し、 保存データなど基本5種と、 人・インフラ・アプリ系のノード種類をまとめて。",
    items: ["ノード種類", "レーン", "スタック"],
    cluster: "extended",
  },
  {
    slug: "text-dsl",
    label: "テキストDSL",
    eyebrow: "テキスト記法",
    desc: "5ブロックの箇条書きで書けるdragon DSLの動作確認場。 シーケンス、 フロー、 ステート、 トポロジー、 ERなどをそのまま試せる。",
    items: ["シーケンス", "フロー", "スイムレーン", "ステート", "トポロジー", "ER"],
    cluster: "extended",
  },
  {
    slug: "animation",
    label: "アニメーション",
    eyebrow: "フェーズと状態遷移",
    desc: "フェーズと状態の動作確認。 数値の線形補間、 即時切替、 連続フェーズ、 バッジ切替の使い方。",
    items: ["補間", "切替", "バッジ", "併用"],
    cluster: "extended",
  },
  {
    slug: "styles",
    label: "スタイル",
    eyebrow: "線種と色調",
    desc: "線の種類 (実線・点線と粒子) と色調6種 (accent・teal・success・error・warning・info)、 アクティブと非アクティブ状態。",
    items: ["線種", "色調", "アクティブ状態"],
    cluster: "extended",
  },
  {
    slug: "interactive",
    label: "インタラクティブ",
    eyebrow: "インタラクション部品",
    desc: "インタラクション系の基本部品4種 (入力ウィジェット・計算式・スクロール駆動・イベントハンドラ) の使い方。 抽象例で特定分野固有の題材は含まず、 アプリ側でsignalとハンドラを実装して自身の応用先に組み込む前提。",
    items: ["スライダー", "計算式", "スクロール駆動", "クリック切替"],
    cluster: "extended",
  },
];
