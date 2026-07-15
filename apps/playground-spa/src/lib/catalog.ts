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
    desc: "「シーケンス図が欲しい」 「ER 図で書きたい」 と決まった時の最短経路。 1 行で骨格ができるので、 手を動かす前に完成形の当たりをつけたい時に使う。",
    items: ["シーケンス", "フロー", "スイムレーン", "トポロジー", "ER", "ステート"],
    cluster: "basic",
  },
  {
    slug: "cookbook",
    label: "レシピ集",
    eyebrow: "頻出レシピ",
    desc: "本番でよく議論される要件をそのまま図にした集合。 認証 flow / CRUD / 非同期処理などを動く形でコピペして、 会議での議論の起点として使う。",
    items: ["API・認証", "データ操作", "UI・フォーム", "非同期", "運用"],
    cluster: "basic",
  },
  {
    slug: "patterns",
    label: "パターン",
    eyebrow: "汎用構成パターン",
    desc: "図の組立てで繰返し出る汎用構造の型。 「今描きたいのは直結か分岐かループか」 を先に選ぶと、 描き方を毎回考えなくて済む。 パーツを何に配線するかの参照書。",
    items: ["直結", "分岐", "ループ", "ファンアウト", "ロールバック", "定期実行"],
    cluster: "basic",
  },
  {
    slug: "primitives",
    label: "基本要素",
    eyebrow: "cdl の最小構成",
    desc: "dragon DSL の最小構成要素 (lane / node / edge / phase / state) と、 業務ドメイン別 node kind を確認する場。 「この kind は何を描くか」 を学習する起点、 パーツを選ぶ前の予備知識に。",
    items: ["ノード種類", "レーン", "スタック"],
    cluster: "extended",
  },
  {
    slug: "text-dsl",
    label: "テキストDSL",
    eyebrow: "テキスト記法",
    desc: "TypeScript を書かず箇条書きだけで図を書く経路。 markdown 感覚の 5 ブロックで済むので、 メモから起こしたい / 非エンジニアにも書かせたい時の入口。",
    items: ["シーケンス", "フロー", "スイムレーン", "ステート", "トポロジー", "ER"],
    cluster: "extended",
  },
  {
    slug: "animation",
    label: "アニメーション",
    eyebrow: "時間軸の物語",
    desc: "動く図の書き方。 phase で状態が推移 / 数値が滑らか補間 / 即時切替 / badge で局面表示 の 4 要素を組合せて時間軸の物語を作る。 静止図では伝わらない「変化」 「順序」 を語りたい時に。",
    items: ["補間", "切替", "バッジ", "併用"],
    cluster: "extended",
  },
  {
    slug: "parts",
    label: "パーツ",
    eyebrow: "合成用の小さな部品",
    desc: "リッチな図を組立てる時に「これ使いたい」 と選ぶ小部品の見本市。 バケット / ゲージ / インジケーター / タイムライン等、 1 パーツで 1 概念を体現する完成物、 アニメーションカタログ側で複数パーツを合成して物語を作る。",
    items: ["波打つ矩形ゲージ", "縦積み層バー", "状態インジケーター", "3灯シグナル", "バケット貯留"],
    cluster: "extended",
  },
  {
    slug: "styles",
    label: "スタイル",
    eyebrow: "線と色で意味を分ける",
    desc: "実線 / 点線流れ / 6 色 tone (accent / teal / success / error / warning / info) の組合せで、 図の中に意味の階層 (通常経路 / 例外 / 成功 / 失敗) を差込む。 描く前の設計段階でどの tone をどこに割当てるか決める為の見本。",
    items: ["線種", "色調", "アクティブ状態"],
    cluster: "extended",
  },
  {
    slug: "interactive",
    label: "インタラクティブ",
    eyebrow: "user 操作で図が動く",
    desc: "user が slider を動かすと数値が追随、 scroll に応じて phase が進む、 click で切替わる 等の対話的仕組みを diagram に組込む部品集。 静止図では表せない「試して理解する」 探索的可視化を作りたい時に。",
    items: ["スライダー", "計算式", "スクロール駆動", "クリック切替"],
    cluster: "extended",
  },
];
