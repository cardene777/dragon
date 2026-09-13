/**
 * 見本帳の分類の SSOT。 分類の数はこの一覧が決めるので、数を書き写さない。
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
  cluster: CategoryCluster;
}

export const CATEGORIES: CategoryMeta[] = [
  {
    slug: "presets",
    label: "ひな形",
    eyebrow: "種類を選ぶだけ",
    desc: "「シーケンス図が欲しい」 「ER 図で書きたい」 と決まった時の最短経路。 1 行で骨格ができるので、 手を動かす前に完成形の当たりをつけたい時に使う。",
    cluster: "basic",
  },
  {
    slug: "cookbook",
    label: "実用例",
    eyebrow: "現場でよく出る要件",
    desc: "本番でよく議論される要件をそのまま図にした集合。 認証の流れ / データ操作 / 非同期処理などを動く形のまま写し取り、 会議での議論の起点として使う。",
    cluster: "basic",
  },
  {
    slug: "patterns",
    label: "組み方の型",
    eyebrow: "繰り返し出る組み方",
    desc: "図の組立てで繰返し出る汎用構造の型。 「今描きたいのは直結か分岐か繰り返しか」 を先に選ぶと、 描き方を毎回考えなくて済む。 部品を何に配線するかの参照書。",
    cluster: "basic",
  },
  {
    slug: "primitives",
    label: "基本要素",
    eyebrow: "記法の最小の部品",
    desc: "dragon のテキスト記法の最小の部品 (縦列 / 箱 / 矢印 / 段 / 値) と、 用途ごとの箱の種類を確認する場。 「この種類は何を描くか」 を学習する起点、 部品を選ぶ前の予備知識に。",
    cluster: "extended",
  },
  {
    slug: "text-dsl",
    label: "テキスト記法",
    eyebrow: "箇条書きで図を書く",
    desc: "TypeScript を書かず箇条書きだけで図を書く経路。 覚え書きと同じ感覚の 5 つの塊で済むので、 書き留めた箇条書きから図を起こしたい / 書き慣れていない人にも書かせたい時の入口。",
    cluster: "extended",
  },
  {
    slug: "animation",
    label: "動く図",
    eyebrow: "時間軸の物語",
    desc: "段で状態が推移 / 数値が滑らか補間 / 即時切替 / 名札で段の題を出す の 4 要素を組合せて時間軸の物語を作る。 静止図では伝わらない「変化」 「順序」 を語りたい時に。",
    cluster: "extended",
  },
  {
    slug: "ethereum",
    label: "イーサリアム",
    eyebrow: "仕組みを動きで理解する",
    desc: "ブロックチェーンの中で何が起きているかを、 数値が動く様子で説明する図。 残高が付け替わる / 手数料が上下する / ブロックが積まれる といった変化そのものを見せるので、 静止した箱と矢印では掴みにくい仕組みが直感的に分かる。",
    cluster: "extended",
  },
  {
    slug: "charts",
    label: "図表",
    eyebrow: "数を形にして比べる",
    desc: "数そのものを見せる図。 大小を棒の高さで比べる / 移り変わりを線で追う / 全体に占める割合を扇で見る といった、 箱と矢印では表せない量の関係を扱う。 値を持たせて描くので、 そのまま自分の数に差し替えて使える。",
    cluster: "extended",
  },
  {
    slug: "parts",
    label: "部品",
    eyebrow: "合成用の小さな部品",
    desc: "凝った図を組立てる時に「これ使いたい」 と選ぶ小部品の見本市。 入れ物 / 計器 / 指標 / 時系列 等、 1 つで 1 概念を体現する完成物、 動く図の一覧の側で複数の部品を合成して物語を作る。",
    cluster: "extended",
  },
  {
    slug: "styles",
    label: "線と色",
    eyebrow: "線と色で意味を分ける",
    desc: "実線 / 点線流れ / 6 つの色調 (中立 / teal / 成功 / 失敗 / 警告 / 情報) の組合せで、 図の中に意味の階層 (通常経路 / 例外 / 成功 / 失敗) を差込む。 描く前の設計段階でどの色調をどこに割当てるか決める為の見本。",
    cluster: "extended",
  },
  {
    slug: "interactive",
    label: "操作で動く",
    eyebrow: "読む人の操作で図が動く",
    desc: "読む人がつまみを動かすと数値が追随、 巻き上げに応じて段が進む、 押下で切替わる 等の対話的仕組みを図に組込む部品集。 静止図では表せない「試して理解する」 探索的可視化を作りたい時に。",
    cluster: "extended",
  },
];
