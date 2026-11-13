/**
 * 使い方の頁の言葉 (#3034)。日本語と英語を必ず両方持つ。
 *
 * 節の並びは `SECTIONS` が持ち、節の番号と札の行き先はこの並びから作るので、数を書き写さない。
 * 本文の中の `` ` `` で囲んだ語は `<code>` で出す。
 * 節の記法の例は `examples/` の file が持ち、頁と検査 (`lib/site-pages.test.ts`) が同じ file を読む。
 * 書き出しの節の命令は package の README と同じ物を、設定は命令の使い方の表示と同じ物を出す (検査が突き合わせる)。
 * ブロックの段落はブロックの見本帳の分 (`gallery/docs.ts`) が持ち、書き出した一覧 (`catalog/blocks-docs.gen.ts`) から、
 * 段落の `section` の節の中に、ブロックの並び (`rank`) の順に置く。ブロックの名前を手で並べない (#3345、#3341、#3350)。
 */
import { BLOCK_ORDER } from "../catalog/blocks.gen";
import { BLOCK_DOCS } from "../catalog/blocks-docs.gen";
import type { Lang } from "../text";

/**
 * 節の並び。最初の図の後に宣言と段を省いた短い書き方 (#3438) を置き、記法の決まりの後に記法の要素を書く順に並べ、
 * 図を外で使う 2 つの形 (頁に置く、書き出す) を続け、前の形から書き直す人の対応表を最後に置く
 */
export const SECTIONS = ["start", "short", "rules", "boxes", "edges", "regions", "state", "git", "time", "tree", "lineup", "try", "chart", "flow", "cycle", "mind", "er", "matrix", "venn", "sankey", "pipe", "extend", "steps", "strip", "carry", "json", "place", "export", "line", "migrate"] as const;
export type SectionId = (typeof SECTIONS)[number];

/** その節に置くブロックの段落。段落の `section` がその節のブロックを、ブロックの並びの順に */
function blockParagraphs(section: SectionId, lang: Lang): string[] {
  return BLOCK_ORDER.flatMap((name) => {
    const docs: ({ readonly section: string } & Readonly<Record<Lang, readonly string[]>>) | { readonly none: string } = BLOCK_DOCS[name];
    return "none" in docs || docs.section !== section ? [] : [...docs[lang]];
  });
}

/** 特長の札が指す節。札はこの並びで並ぶ */
export const CARDS = ["start", "boxes", "regions", "steps", "json", "export"] as const satisfies readonly SectionId[];

/** 節の出口。同じ頁の節か、サイトの画面か、カタログの分類 */
export type Exit = { section: SectionId } | { screen: "editor" | "catalog" } | { kind: "sequence" | "architecture" | "state" | "git" | "time" | "tree" | "lineup" | "try" | "chart" | "pipe" | "flow" | "cycle" | "mind" | "er" | "matrix" | "venn" | "sankey" };

export const EXITS: Record<SectionId, Exit> = {
  start: { screen: "editor" },
  short: { screen: "editor" },
  rules: { section: "boxes" },
  boxes: { section: "edges" },
  edges: { section: "regions" },
  regions: { kind: "architecture" },
  state: { kind: "state" },
  git: { kind: "git" },
  time: { kind: "time" },
  tree: { kind: "tree" },
  lineup: { kind: "lineup" },
  try: { kind: "try" },
  chart: { kind: "chart" },
  flow: { kind: "flow" },
  cycle: { kind: "cycle" },
  mind: { kind: "mind" },
  er: { kind: "er" },
  matrix: { kind: "matrix" },
  venn: { kind: "venn" },
  sankey: { kind: "sankey" },
  pipe: { kind: "pipe" },
  extend: { screen: "editor" },
  steps: { section: "strip" },
  strip: { kind: "sequence" },
  carry: { section: "json" },
  json: { screen: "editor" },
  place: { section: "export" },
  export: { screen: "editor" },
  line: { screen: "editor" },
  migrate: { screen: "editor" },
};

/**
 * 節の本文の段落ごとに、その後ろへ図を描かない囲みで出す命令か code (言葉で替わらない)。`null` の段落は囲みを持たない。
 * 頁に置く節の code は package の README の頁に置く節の例と同じ物 (検査が突き合わせる)
 */
export const COMMANDS: Partial<Record<SectionId, readonly (string | null)[]>> = {
  // ブロックを足す節の code は package の README の足し方の節と同じ形 (#3407)
  extend: [
    null,
    null,
    [
      '<link rel="dragon-blocks" href="bridge.dragon">',
      "",
      '<pre class="dragon">',
      "architecture Across the bridge",
      "",
      "box eth as Ethereum",
      "+bridge cc as CCIP",
      "box base as Base [icon: +key]",
      "",
      "step Hand over",
      "  say The bridge hands the token over.",
      "  cc +relay base: hand over",
      "</pre>",
    ].join("\n"),
    [
      'import { parseNotation, readBlocks, renderDiagram } from "@cardenelabs/dragon";',
      "",
      '// Pass notation text, or JSON shaped as { "format": 1, "blocks": [...] }',
      "const read = readBlocks(definition);",
      "if (read.ok) {",
      "  const parsed = parseNotation(notation, { blocks: read.blocks });",
      "  if (parsed.ok) renderDiagram(parsed.diagram, { blocks: read.blocks });",
      "}",
    ].join("\n"),
  ],
  place: [
    [
      'import "@cardenelabs/dragon/fonts";',
      'import { mountDiagram, parseNotation } from "@cardenelabs/dragon";',
      "",
      'const source = await (await fetch("login.dragon")).text();',
      "const parsed = parseNotation(source);",
      'if (!parsed.ok) throw new Error(parsed.errors.map((e) => `${e.line}: ${e.message}`).join("\\n"));',
      "",
      'const host = document.getElementById("figure");',
      'if (host === null) throw new Error("#figure not found");',
      "const player = mountDiagram(host, parsed.diagram);",
    ].join("\n"),
    null,
    null,
  ],
  export: ["npm install @cardenelabs/dragon", "pnpm add -D playwright-core\npnpm exec playwright-core install chromium", "dragon export login.dragon --out out"],
};

interface DocsText {
  /** 前置きの札。`version` は版の札と同じ `v{major}.{minor}` */
  eyebrow: (version: string) => string;
  lead: string;
  /** 前置きの強い釦 (編集画面へ) と弱い釦 (カタログへ) */
  start: string;
  browse: string;
  sections: Record<SectionId, { title: string; text: readonly string[]; exit: string }>;
  /** 箱の節から、使える絵柄を全て並べた部品「絵」の頁へ移る案内 (#3172) */
  iconLink: string;
  cards: Record<(typeof CARDS)[number], string>;
  /** 書き出しの設定の表。`palettes` は色味の名前の並び、`fallback` は既定の色味 */
  options: { head: readonly [string, string]; rows: (palettes: string, fallback: string) => readonly (readonly [string, string])[] };
  /** 決まりの節に番号付きで並べる dragon記法の決まり。日本語は repo の README と同じ文 (検査が突き合わせる) */
  rules: readonly [string, string, string, string];
  /**
   * 前の形から書き直す節の対応表。左が前の形、右が新しい形で、右の欄の `` ` `` で囲んだ字はどれも 1 行の形。
   * 日本語の表は `CHANGELOG.ja.md` と、英語の表は `CHANGELOG.md` と同じ物で、英語の表は前の英語の語の形を左に置く (検査が突き合わせる)
   */
  migration: { head: readonly [string, string]; rows: readonly (readonly [string, string])[] };
}

export const DOCS: Record<Lang, DocsText> = {
  ja: {
    eyebrow: (version) => `使い方の案内 · ${version}`,
    lead: "dragon記法の書き方を 1 枚にまとめた読み物。最初の 5 分で図を動かし、宣言と段を省いた短い書き方を見て、決まり 4 つを押さえてから、箱、線、区画、状態遷移図、枝分かれの図、時間軸の図、木の図、列の図、試す図、量の図、手順の図、回り続ける図、考えを広げる地図、表どうしの関係の図、2つの軸で置く図、集合の重なりの図、量の行き先の図、配管の図、段、帯、運ぶ物の順に記法の要素を掴み、使う人が手元でブロックを足す書き方も載せる。JSON との行き来と、mp4 や GIF への書き出しと、前の形から書き直す対応表もここで扱う。",
    start: "5 分で始める →",
    browse: "カタログで図を見る",
    iconLink: "使える絵柄を部品「絵」の頁で全て見る →",
    sections: {
      start: {
        title: "5 分で動かす",
        text: [
          "何も入れずに試すなら、編集画面を開く。左の欄に記法を書くと、右にその場で動く図が出る。",
          "記法は行の頭の語で、その行に何を書くかが決まる。最初の行に図の種類と題を書き、`sequence` なら時間の順に箱どうしのやり取りを、`architecture` なら区画に置いた箱のつながりを描く。",
          "次に登場する箱を `box` の行で並べ、`step` の行の下に字下げして、その段で起きることを起きる順に書く。下の例は箱 2 つと段 1 つの図になる。",
        ],
        exit: "編集画面で書いてみる →",
      },
      short: {
        title: "省いて書く",
        text: [
          "時系列図と構成図と状態遷移図は、箱の宣言と段を省いて書ける。最初の行は図の種類の語だけでよく、箱どうしを `->` で結ぶ行を並べると、線 1 本が 1 段になり、書いた順に光る。",
          "`box` の行を 1 つも書かない図は、線に出た名前を出た順に箱にする。`say` を書かない段は線の名前を段の本文にし、名前の無い線は箱の名前を「→」で結んだ字を出す。",
          "1 字だけ違う名前の箱が出ると、書き間違いかもしれないと、図を描いたまま知らせる。箱に添え書きや色を付ける時と、段に題と本文を付ける時は `box` と `step` の行を書く。`box` を 1 つでも書いた図は、宣言の無い名前を誤りにする。",
        ],
        exit: "編集画面で書いてみる →",
      },
      rules: {
        title: "決まり",
        text: [
          "dragon記法は、どの行も次の決まり 4 つに従う。決まりを押さえておけば、初めて見る行も形から読める。",
          "下の例は 4 つの決まりを全部使う。区画を `group` と `end` で囲み、`,` を含む札の値を `\"` で囲み、長い本文を `say` の下に字下げして続けている。",
        ],
        exit: "続き → 箱",
      },
      boxes: {
        title: "箱",
        text: [
          ...blockParagraphs("boxes", "ja"),
        ],
        exit: "続き → 線",
      },
      edges: {
        title: "線",
        text: [
          ...blockParagraphs("edges", "ja"),
        ],
        exit: "続き → 区画",
      },
      regions: {
        title: "区画",
        text: [...blockParagraphs("regions", "ja")],
        exit: "構成図の見本を見る →",
      },
      state: {
        title: "状態遷移図",
        text: [
          "1 つの物が状態を移る様子を段ごとに追う時は、最初の行を `state <題>` にする。箱が状態になり、線は状態から状態への移り変わりになる。札が乗っている状態は光り、札が出た状態には済んだ印が残る。",
          ...blockParagraphs("state", "ja"),
        ],
        exit: "状態遷移図の見本を見る →",
      },
      git: {
        title: "枝分かれの図",
        text: [
          "git の枝に commit を積み、取り込むまでを段ごとに追う時は、最初の行を `git <題>` にする。枝は `branch <枝> [note: <添え書き>]` の行で上から順に宣言し、枝ごとに帯が並ぶ。箱は無くてもよい。",
          ...blockParagraphs("git", "ja"),
        ],
        exit: "枝分かれの図の見本を見る →",
      },
      time: {
        title: "時間軸の図",
        text: [
          ...blockParagraphs("time", "ja"),
          "段の中では `now -> <目盛り>` で針を進める。針は目盛り 1 つを決まった速さで進み、過ぎた目盛りの印がその時に出るので、秒数は書かない。`mark <列> <範囲> [color: <色>]` は印の色を変え、`span <範囲>: <字>` は軸の下に範囲の括弧を出し、`[shape: box]` を付けると印の列を囲む枠になる。節目の状態は `note` で書き換え、節目どうしにも線を引ける。",
          "中身の帯の欄の名前の後ろに `[meter: <割合>]` を付けると物差しになり、その割合の所に線を引く。`set <欄>: <割合>` を書いた段で、針と一緒に値まで満ちる。",
        ],
        exit: "時間軸の図の見本を見る →",
      },
      tree: {
        title: "木の図",
        text: [
          ...blockParagraphs("tree", "ja"),
          "親子の箱どうしに `<子> -> <親> [tag: <値>]` の線を書くと、運ぶ物は木の線の上を走り、通った木の線はその色で残る。木の線を運ぶ物が通った段から後は、運ぶ物を送るか受けた箱だけを濃く出す。木の図では `group` を書けず、`box` で宣言した箱は木の右に並ぶ。",
        ],
        exit: "木の図の見本を見る →",
      },
      lineup: {
        title: "列の図",
        text: [
          ...blockParagraphs("lineup", "ja"),
          "列に並ぶチップが段ごとに入れ替わる様子を追う時は、最初の行を `lineup <題>` にする。既定はボードの見た目で、`box <名札> as <名前>` の行が書いた順に左から淡い色の縦の帯になり、`item <名札>, <名札> [color: <色>, note: <説明>]` で宣言したチップが帯の中に札として上から積まれる。段の中の `line <列>: <チップ>, <チップ>` はその列のチップを書いた順に並べ、ほかの列に居たチップは滑って移る。`:` の後ろに何も書かない `line <列>:` は列を空にする。帯の見出しには名前と札の数が並び、`note <列>: <字>` は名前の下に値の札を出す。`pick` と `seal` と `open` と `stamp` は列を選び、封をし、封を外し、札を押す。",
          "`box 作業中 [limit: 3]` のように箱に上限を書くと、札の数を `2/3` の形で出し、見出しの下に上限の数の目盛りを並べて札の数だけ塗る。チップが前の列へ戻る段は差し戻しになり、戻りの線と「差し戻し」の札を引き、元の列に抜けた跡を点線で残す。駅をつなぐ流れとして見せる時は、最初の行に `[shape: stations]` を足して `lineup <題> [shape: stations]` にする。箱は1本の線の上の駅になり、札は駅の下に積まれ、上限を書いた駅は空いた席を点線の受け口で示す。流れの線は `seal` と `open` と `pick` と `stamp` を描かないので、書くと断る。携帯の幅では、ボードは帯を上から積み、流れの線は線を縦に引く。",
          "1件の頼みや取引が層を下りていく流れは、最初の行に `[shape: layers]` を足して `lineup <題> [shape: layers]` にする。箱は書いた順に上から横の帯になり、帯の左に層の名前と `note` の説明と層の番号が並ぶ。段の中の `line <層>: <チップ>` はチップの居る層を書き、チップの居る帯を最も濃く、通った帯を薄く光らせる。`note <層>: <字>` はその層の印で、層でした事や掛かった時間を書く。層は8つまで書け、層の間に矢印は描かない。層の見た目は `[order: none]` と `role` と `seal` と `open` と `pick` と `stamp` を描かないので、書くと断る。",
          "層を階段にする時は、`[shape: layers]` の代わりに `[shape: stairs]` を書いて `lineup <題> [shape: stairs]` にする。層は下の層ほど同じ幅だけ右へずれ、行は層の見た目と同じに書く。`box <名札> as <名前> [time: <長さ>]` はその層で掛かった時間で、全ての箱に書くかどの箱にも書かない。時間の掛からない層は `0s` と書ける。`time` を書いた図は階段の右に経った時間の目盛りを置き、数字を0から切りのよい間隔で、箱に書いた中で一番大きい単位で並べる。目盛りの針は段ごとに、チップが下りた層までに経った時間の所へ進み、`1分3秒` のような札を添える。携帯の幅では目盛りを図の下に横向きで置く。",
        ],
        exit: "列の図の見本を見る →",
      },
      try: {
        title: "試す図",
        text: [
          "読み手が値を打ち込み、釦を押して動かせる図にする時は、最初の行を `try <題>` にする。最初の段より前に部品の行を上から並べると、その順に上から積んで描く。`route <名札>: <節> - <節>, ... [from: <節>, to: <節>]` は網で、送ったチップを `from` から `to` まで最短の道で運ぶ。`queue <名札> [order: <欄>, accept: <名前>]` は待ち行列で、`order` の欄の値の高い順に上から並べる。`accept` を書くと、入力の帯はその名前のチップだけをこの待ち行列へ送れ、ほかの名前では送る釦を押せない。名前を 2 つ以上書く時は `accept: \"<名前>, <名前>\"` と囲み、最初の欄に `choose` の行を書いた時は `accept` の名前をその値から選ぶ。",
          "`chain <名札> [edit: <欄>]` は機械の列で、ブロックは 1 つ前のブロックの `hash` を `prev` に持つ。`edit` を書くと、読み手はブロックの中のチップを押してその欄を書き換えられ、書き換えたブロックと次のブロックの間に食い違いの印 `≠` が出る。`log <名札> [all: <欄> = <値>, yes: <印>, no: <印>]` は記録の列で、釦がまとめたチップを番号の付いた記録に並べ、機械の列と違って `prev` と `hash` を持たない。`all` を書くと、記録の中のチップのその欄が全てその値なら `yes` の印を、1 つでも違えば `no` の印を記録に出す。`ask <欄>, <欄>, ... [into: <待ち行列か欄>, via: <網>]` は入力の帯で、最初の欄の値がチップの名前になる。`into` に欄を書くと、送ったチップはその欄の値と同じ名札の待ち行列へ入るので、その欄には `choose` の行を書き、`choose` の値ごとに同じ名札の待ち行列を置く。`choose <欄>: <値>, <値>, ...` を足すと、その欄は打たずに、書いた順に並ぶ値から選ぶ欄になり、ブロックの中のチップを書き換える欄も同じ値から選ぶ。`press <名札> [from: <待ち行列>, into: <機械の列か記録の列>, take: <件数>]` は釦で、`at: <部品>` を書くとその部品の所に置く。`from: \"<待ち行列>, <待ち行列>\"` と 2 つ以上の待ち行列を書くと、書いた順にそれぞれの上から `take` 件ずつを 1 つのブロックか記録にまとめ、どれかの待ち行列が `take` 件に満たない間は押せない。`side <部品>, <部品>, ...` を書くと、枠が広い時に網と待ち行列と機械の列と記録の列のうち書いた部品を、書いた順に左から 1 つの行に並べ、待ち行列はチップが入る幅だけを取る。枠の幅が足りず字が小さくなる時は、今どおり上から積む。",
          "`check <節>: <欄> <比べ方> <値> [no: <エラーの名前>, retry, into: <記録の列>]` は網の節の関門で、最初の段より前に書く。節は `ask` の `via` の網の最短の道の節で、送ったチップは着いた節の関門を書いた順に確かめ、条件が成り立たない最初の関門でその節に止まる。止まったチップはどの待ち行列にも入らず、`into` の記録の列 (`all` を持たない `log`) に、チップと止まった節と `no` のエラーの名前と再試行できるかを持つ記録が 1 件増える。比べ方は `>=`、`<=`、`>`、`<`、`==`、`!=` で、値が数なら欄の値も数として比べ、数でない欄の値は通らない。数でない値は `==` と `!=` で字として比べる。`retry` を書いた関門の記録には「再試行できる」の印が、書かない関門の記録には「直して送り直す」の印が付く。",
          "チップは `item <名札> [<欄>: <値>]` で書く。段の中の `line` で待ち行列の並びとブロックを書き、`ask <値>, ...` と `press <名札>` と `item <名札> [<欄>: <値>]` で書き手の例 (送る、作る、書き換える) を書く。再生の部品は最初の段で止まって読み手を待ち、送るか押すか書き換えるたびに段を 1 つ足して流す。打ち込んだ値は保存しない。画像と動画と印刷には書き手の例の段を描く。",
        ],
        exit: "試す図の見本を見る →",
      },
      chart: {
        title: "量の図",
        text: [...blockParagraphs("chart", "ja")],
        exit: "量の図の見本を見る →",
      },
      flow: {
        title: "手順の図",
        text: [...blockParagraphs("flow", "ja")],
        exit: "手順の図の見本を見る →",
      },
      cycle: {
        title: "回り続ける図",
        text: [...blockParagraphs("cycle", "ja")],
        exit: "回り続ける図の見本を見る →",
      },
      mind: {
        title: "考えを広げる地図",
        text: [...blockParagraphs("mind", "ja")],
        exit: "考えを広げる地図の見本を見る →",
      },
      er: {
        title: "表どうしの関係の図",
        text: [...blockParagraphs("er", "ja")],
        exit: "表どうしの関係の図の見本を見る →",
      },
      matrix: {
        title: "2つの軸で置く図",
        text: [...blockParagraphs("matrix", "ja")],
        exit: "2つの軸で置く図の見本を見る →",
      },
      venn: {
        title: "集合の重なりの図",
        text: [...blockParagraphs("venn", "ja")],
        exit: "集合の重なりの図の見本を見る →",
      },
      sankey: {
        title: "量の行き先の図",
        text: [...blockParagraphs("sankey", "ja")],
        exit: "量の行き先の図の見本を見る →",
      },
      pipe: {
        title: "配管の図",
        text: [...blockParagraphs("pipe", "ja")],
        exit: "配管の図の見本を見る →",
      },
      extend: {
        title: "ブロックを足す",
        text: [
          "dragon が持つブロックの他に、使う人が自分の手元でブロックを足せる。今の箱 (`box`)、線 (`edge`)、箱に付く印 (`icon`) のどれかを元にして、形と色の役を替えた物を足す。足したブロックは元の置き場所と動きのまま描かれ、色を色味の表から読むので、他のブロックと同じ見た目に揃う。",
          "定義は図の頭に、`blocks 1` の行の後へ `block +<名前>` から `end` までを書く。`base` に元を、`shape` に形を、`color` に色の役を書く。形は名前の付いた形 (箱は `round`、`circle`、`cylinder`、`diamond`、`hexagon`、線は `solid`、`dashed`、`dotted`) か、path の文法だけで書いた `path` にする。図では、箱の行の `box` と線の行の `->` の代わりに `+<名前>` を書き、印は `[icon: +<名前>]` と書く。箱を元にした定義は `icon` の行に箱の絵柄も書ける。書ける名前は箱の行の `icon:` と同じ (手描きの絵柄か `tabler:<名前>`) で、箱の行に書いた絵柄が勝つ。",
          "同じブロックを複数の図で使う時は、定義を 1 つの file に置く。頁で描く時は `<link rel=\"dragon-blocks\">` でその file を指すと、頁の全ての図がその定義を読む。",
          "code で描く時は `readBlocks` で定義を読み、`parseNotation` と `renderDiagram` の `blocks` に渡す。定義は字のデータだけで、URL や code や SVG の要素を書くと誤りで断るので、他の人が書いた定義を読んでも何も実行されない。",
        ],
        exit: "編集画面で書いてみる →",
      },
      steps: {
        title: "段",
        text: [
          ...blockParagraphs("steps", "ja"),
        ],
        exit: "続き → 帯",
      },
      strip: {
        title: "帯",
        text: [...blockParagraphs("strip", "ja")],
        exit: "時系列図の見本を見る →",
      },
      carry: {
        title: "運ぶ物",
        text: [...blockParagraphs("carry", "ja")],
        exit: "続き → JSON",
      },
      json: {
        title: "JSON",
        text: [
          "記法と JSON は行き来できる。人は記法で書き、道具や AI は JSON (原本) で持つ。下の例は 5 分で動かすの節の図を JSON で書いた物で、図はその JSON をそのまま読んで描いている。",
          "JSON は `version` に形式の版を持ち、古い版は読む時に今の形へ直す。形は package の `src/schemas/diagram.schema.json` が持つ。",
          "`parseNotation` は記法を JSON に、`printNotation` は JSON を記法に直し、`readDiagram` は JSON を確かめて読む。JSON から記法へ書き戻すと決まった並べ方に整うので、書き手の行の並べ方と `//` で始まる注釈の行は残らない。",
        ],
        exit: "編集画面で JSON を取り込む →",
      },
      place: {
        title: "頁に置く",
        text: [
          "自分の頁に図を置く時は、頁で 1 度だけ字の入口 `@cardenelabs/dragon/fonts` を import し、記法を読んだ原本を `mountDiagram` に渡す。下の例は package の README と同じ物。",
          "字の入口は、同梱の 2 つの字 (Noto Sans JP と JetBrains Mono) の CSS を読み込むだけで、何も出さない。図は同梱の字で測った字の幅で組むため、読み込まないと端末の字で描かれ、札から字がはみ出すことがある。CSS と字の file は、束ねる道具 (Vite など) が頁へ運ぶ。",
          "`mountDiagram` が返す `player` で段を動かす (`next`、`prev`、`play`、`pause`、`destroy`)。3 つめの引数には、色味や段が替わった時に呼ぶ関数などの設定 (`PlayerOptions`) を渡す。",
        ],
        exit: "続き → 書き出し",
      },
      export: {
        title: "書き出し",
        text: [
          "同じ原本から、mp4、GIF、HTML、PNG を書き出せる。package を入れると `dragon` の命令が使える。",
          "書き出しは画面なしの Chromium で、頁と同じ描画を 1 コマずつ撮る。Chromium を動かす `playwright-core` は、書き出しを使う時だけ入れる。",
          "原本の JSON (`.json`) か記法 (`.dragon`) を渡すと、同じ名前の 4 つの file を書き出す。PNG は最後の段の止め絵になる。",
        ],
        exit: "編集画面から書き出す →",
      },
      line: {
        title: "線の描き方",
        text: [
          "図の線は、定規で引いたまっすぐな線 (`ruler`、既定) か、手で引いたようにゆるく揺れるペンの線 (`pen`) で描ける。線の描き方は色味と同じく描く時に選び、記法には書かない。",
          "手描きの線は、箱の縁と線と矢印と段の番号の輪を揺れる線で描く。絵柄と字と図の地の枠はそのまま描き、線の端と折れ目と尖った角は元の位置に残すので、矢じりの先は箱に着いたまま。同じ図は何度描いても同じ形に揺れる。下の図は手描きの線で描いた見本。",
          "書き出しの命令では `--line pen`、頁に置く時は `mountDiagram` の 3 つめの引数に `line: \"pen\"` を渡す。編集画面では、図の上の帯の色味の丸の隣の釦で選ぶ。",
        ],
        exit: "編集画面で手描きを選ぶ →",
      },
      migrate: {
        title: "前の形から書き直す",
        text: [
          "前の形の記法 (`時系列図` か `構成図` で始まり、段を `#` で区切る形) は読めなくなった。前の形の行を読むと、その行の新しい形を示す誤りで止まる。",
          "前の形を新しい形へ移す命令は無いので、下の表を見て行ごとに書き直す。左が前の形、右が新しい形になる。",
        ],
        exit: "編集画面で書き直す →",
      },
    },
    cards: {
      start: "導入なし。編集画面を開いて書くだけで図が動く。",
      boxes: "名前と下の字と色と印で、登場する物を描く。",
      regions: "構成図の箱を、持ち主ごとの区画に分けて置く。",
      steps: "図は段ごとに進み、本文がその段の動きを語る。",
      json: "人は記法で、道具は JSON で、同じ図を持つ。",
      export: "同じ図を mp4、GIF、HTML、PNG に書き出す。",
    },
    options: {
      head: ["設定", "意味"],
      rows: (palettes, fallback) => [
        ["--out <dir>", "書き出す先。無ければ作る (既定は今の dir)"],
        ["--width <px>", "枠の幅。見せ方 (`fixed` / `follow`) を選び、`follow` の時の窓の幅になる"],
        ["--palette <名前>", `色味 (${palettes}、既定は \`${fallback}\`)`],
        ["--line <名前>", "線の描き方 (`ruler` / `pen`、既定は `ruler`)。`pen` は手描きのペンの線で描く"],
        ["--theme <明暗>", "`light` か `dark`"],
        ["--lang <言葉>", "図の中の字と命令の文の言葉 (`ja` か `en`)。無ければ、図の中の字は図の題か `say` に日本語の字があれば `ja`、無ければ `en` で、命令の文は `en`"],
        ["--fps <数>", "mp4 の 1 秒のコマの数 (既定 30)"],
        ["--gif-fps <数>", "GIF の 1 秒のコマの数 (既定 10)"],
        ["--format <形>", "書き出す形を `,` で区切る (既定 `mp4,gif,html,png`)"],
        ["--step <段>", "PNG に撮る段 (1 から数える。既定は最後の段)"],
        ["--blocks <file>", "足したブロックの定義の file。その定義で図を描き、HTML にも定義を入れる"],
      ],
    },
    rules: [
      "行の種類は行の頭の英語の語で決まる。矢印の行だけは箱の名札から始まる",
      "鍵と値はコロンで区切り、属性は `[ ]` の中に `,` で並べる",
      "空白を含む名前と文は、行末か `[` の前に置く。`,` か `]` を含む値と、`[` を含む名前だけを `\"` で囲む",
      "入れ子は `group … end` だけ。段は次の `step` までで、字下げは読みやすさのために付ける。`say` の続きの行だけは `say` より深く字下げする",
    ],
    migration: {
      head: ["前の形", "新しい形"],
      rows: [
        ["`時系列図 <題>`", "`sequence <題>`"],
        ["`構成図 <題>`", "`architecture <題>`"],
        ["`見せ方 止める`、`見せ方 寄る`", "`sequence <題> [view: fixed]`、`sequence <題> [view: follow]`"],
        ["`区画 <名札> = <名前>「<添え書き>」`", "`group <名札> as <名前> [note: <添え書き>]` から `end` まで"],
        ["箱の行の `[区画 <名札>]`", "`group <名札>` と `end` の間に `box` の行を書く"],
        ["`<名札> = <名前>「<下の字>」`", "`box <名札> as <名前> [note: <下の字>]`"],
        ["`[色 <色>]`、`[印 <印>]`", "`box <名札> [color: <色>, icon: <印>]`"],
        ["`帯 <題> = <欄>, <欄>`", "`strip <題>: <欄>, <欄>`"],
        ["`# <題>`", "`step <題>`"],
        ["`> <本文>`", "`say <本文>`"],
        ["バッククォートで囲んだ行", "`code <命令>`"],
        ["`<名札> -> <名札> : <線の名前>`", "`<名札> -> <名札>: <線の名前>`"],
        ["`[札 <値>]`、`[硬貨]`、`[なし]`", "`<名札> -> <名札> [tag: <値>]`、`<名札> -> <名札> [carry: coin]`、`<名札> -> <名札> [carry: none]`"],
        ["`[名前 上]`", "`<名札> -> <名札> [side: above]`"],
        ["`[名前 下]`", "`<名札> -> <名札> [side: below]`"],
        ["`[名前 左]`", "`<名札> -> <名札> [side: left]`"],
        ["`[名前 右]`", "`<名札> -> <名札> [side: right]`"],
        ["`<名札> : <処理の名前>`", "`act <名札>: <処理の名前>`"],
        ["`<名札>「<字>」`", "`note <名札>: <字>`"],
        ["`帯 <欄> = <値>`", "`set <欄>: <値>`"],
        ["`帯 <欄> [<札>]`", "`set <欄> [tag: <札>]`"],
      ],
    },
  },
  en: {
    // 英語の側の区切りは `•` にする。`·` は日本語の字の並びに使われ、英語の頁に日本語が残ったように読めるため (前のサイトの #2455)
    eyebrow: (version) => `guide • ${version}`,
    lead: "One page that lays out how to write dragon notation. Get a diagram moving in the first five minutes, see the short form that leaves out declarations and steps, learn the four rules, then take in the parts of the notation in order: boxes, lines, regions, state diagrams, git graphs, time diagrams, tree diagrams, lineup diagrams, try diagrams, charts, flow diagrams, cycle diagrams, mind maps, table relation diagrams, two-axis matrices, set overlap diagrams, Sankey diagrams, pipe diagrams, steps, the strip and what travels, and how to add your own blocks. Going between the notation and JSON, exporting to mp4 or GIF, and a table for rewriting the old form are covered here too.",
    start: "Start in five minutes →",
    browse: "Browse the catalog",
    iconLink: "See every icon on the Icon part page →",
    sections: {
      start: {
        title: "Up and running in five minutes",
        text: [
          "To try it without installing anything, open the editor. Write notation in the box on the left and a moving diagram appears on the right as you type.",
          "The first word of each line says what the line holds. The first line gives the diagram kind and title: `sequence` draws boxes exchanging messages in time order, and `architecture` draws how boxes placed in regions connect.",
          "Then list the boxes that take part with `box` lines, and indented under a `step` line, write what happens in that step in the order it happens. The example below has two boxes and one step.",
        ],
        exit: "Write one in the editor →",
      },
      short: {
        title: "Leave things out",
        text: [
          "Sequence, architecture and state diagrams can leave out the box declarations and the steps. The first line can be just the diagram kind, and when you list lines joining boxes with `->`, each line becomes one step that lights up in the order written.",
          "A diagram with no `box` line makes a box of each name on the lines, in the order the names appear. A step without `say` uses the line label as its body, and a line without a label shows the box names joined by an arrow.",
          "When two box names differ by one character, the editor and the export command point it out as a possible typo and still draw the diagram. Write `box` and `step` lines when a box needs a caption or a color, or a step needs a title and a body. Once a diagram has one `box` line, a name that is not declared is an error.",
        ],
        exit: "Write one in the editor →",
      },
      rules: {
        title: "Rules",
        text: [
          "Every line of dragon notation follows the four rules below. Once you know them, you can read a line you have not seen before from its shape.",
          'The example below uses all four rules. It wraps the regions in `group` and `end`, wraps a tag value that contains `,` in `"`, and continues a long body indented under `say`.',
        ],
        exit: "Next → Boxes",
      },
      boxes: {
        title: "Boxes",
        text: [
          ...blockParagraphs("boxes", "en"),
        ],
        exit: "Next → Lines",
      },
      edges: {
        title: "Lines",
        text: [
          ...blockParagraphs("edges", "en"),
        ],
        exit: "Next → Regions",
      },
      regions: {
        title: "Regions",
        text: [...blockParagraphs("regions", "en")],
        exit: "See the architecture samples →",
      },
      state: {
        title: "State diagrams",
        text: [
          "To follow one thing as it moves between states step by step, start the first line with `state <title>`. Each box is a state, and each line is a move from one state to another. The state the tag sits on lights up, and a state the tag has left keeps a done mark.",
          ...blockParagraphs("state", "en"),
        ],
        exit: "See the state diagram samples →",
      },
      git: {
        title: "Git graphs",
        text: [
          "To follow commits on git branches step by step until they are merged, start the first line with `git <title>`. Declare branches from top to bottom with `branch <branch> [note: <note>]` lines, and each branch gets its own band. Boxes are optional.",
          ...blockParagraphs("git", "en"),
        ],
        exit: "See the git graph samples →",
      },
      time: {
        title: "Time diagrams",
        text: [
          ...blockParagraphs("time", "en"),
          "Inside a step, `now -> <tick>` moves the needle. The needle moves one tick at a fixed speed and the marks it passes appear as it goes, so no seconds are written. `mark <row> <range> [color: <color>]` recolors marks, `span <range>: <text>` puts a bracket under the axis, and `[shape: box]` turns it into a frame around the rows. `note` rewrites the state of a point, and lines can join points too.",
          "Add `[meter: <ratio>]` after the name of a strip field to make it a meter with a line at that ratio. In a step with `set <field>: <ratio>`, it fills up to the value along with the needle.",
        ],
        exit: "See the time diagram samples →",
      },
      tree: {
        title: "Tree diagrams",
        text: [
          ...blockParagraphs("tree", "en"),
          "A line `<child> -> <parent> [tag: <value>]` between a parent and a child sends its carrier along the tree line, and the tree line keeps that color once passed. From the step where a carrier first runs a tree line, only the boxes that have sent or received a carrier stay strong. A tree diagram takes no `group`, and boxes declared with `box` sit to the right of the tree.",
        ],
        exit: "See the tree diagram samples →",
      },
      lineup: {
        title: "Lineup diagrams",
        text: [
          ...blockParagraphs("lineup", "en"),
          "To follow chips that line up in lanes and change places step by step, start the first line with `lineup <title>`. By default it uses the board look: each `box <id> as <name>` line becomes a pale vertical column from left to right in the written order, and the chips declared with `item <id>, <id> [color: <color>, note: <note>]` stack in the columns as cards from the top. Inside a step, `line <lane>: <chip>, <chip>` sets the chips of that lane in the written order, and a chip that was in another lane slides over. `line <lane>:` with nothing after the `:` empties the lane. The column head shows the name and the number of cards, and `note <lane>: <text>` shows a value chip under the name. `pick`, `seal`, `open`, and `stamp` pick a lane, seal it, take the seal off, and land a stamp on it.",
          "Write a limit on a box, as in `box Doing [limit: 3]`, to show the count as `2/3` and to put that many ticks under the head, filled for each card. When a chip moves back to an earlier lane, the step is a send-back: a return line and a \"Sent back\" label are drawn, and a dashed trace stays in the lane it left. To show the lanes as stops on a flow, add `[shape: stations]` to the first line: `lineup <title> [shape: stations]`. The boxes become stops on one line, the cards stack under each stop, and a stop with a limit shows its free seats as dashed slots. The stations look refuses `seal`, `open`, `pick`, and `stamp`, because it does not draw them. On a phone-width frame, the board stacks its columns from the top and the stations line runs down.",
          "For one request or transaction going down through layers, add `[shape: layers]` to the first line: `lineup <title> [shape: layers]`. The boxes become horizontal bands from top to bottom in the written order, and the left of each band shows the layer's name, its `note`, and its number. Inside a step, `line <layer>: <chip>` writes the layer the chip is in, drawing that band strongest and the bands it has passed lighter. `note <layer>: <text>` is the mark of that layer, such as what it did and how long it took. A layers lineup takes up to 8 layers and draws no arrows between them. It refuses `[order: none]`, `role`, `seal`, `open`, `pick`, and `stamp`, because the layers look does not draw them.",
          "To set the layers as stairs, write `[shape: stairs]` instead of `[shape: layers]`: `lineup <title> [shape: stairs]`. Each lower layer shifts right by the same width, and the lines are written as in the layers look. `box <id> as <name> [time: <length>]` is the time spent in that layer, written on every box or on none, and a layer that takes no time can be written as `0s`. With `time`, a scale of the time spent so far sits to the right of the stairs, with numbers from 0 in round steps in the largest unit written on the boxes. At each step, the needle of the scale moves to the time spent through the layer the chip went down to, with a card such as `1min 3s`. On a phone-width frame, the scale lies horizontally under the diagram.",
        ],
        exit: "See the lineup samples →",
      },
      try: {
        title: "Try diagrams",
        text: [
          "To make a figure readers move themselves by typing values and pressing buttons, start the first line with `try <title>`. Write the part lines before the first step, from top to bottom, and they are stacked in that order. `route <name>: <node> - <node>, ... [from: <node>, to: <node>]` is a network that carries a sent chip from `from` to `to` along the shortest path. `queue <name> [order: <field>, accept: <name>]` is a waiting line that sorts chips from the highest value of the `order` field. With `accept`, the input strip sends only chips with those names into the queue, and the send button cannot be pressed for any other name. Wrap two or more names as `accept: \"<name>, <name>\"`, and when the first field has a `choose` line, take the names in `accept` from its choices.",
          "`chain <name> [edit: <field>]` is a chain of blocks, and each block holds the previous block's `hash` as `prev`. With `edit`, the reader taps a chip inside a block to change that field, and the mismatch mark `≠` appears between the changed block and the next one. `log <name> [all: <field> = <value>, yes: <mark>, no: <mark>]` is a log that lists the chips a button gathers as numbered records, and unlike a chain a record has no `prev` or `hash`. With `all`, a record shows the `yes` mark when that field of every chip in it has the value, and the `no` mark when even one differs. `ask <field>, <field>, ... [into: <queue or field>, via: <route>]` is the input strip, and the first field's value becomes the chip's name. When `into` names a field, a sent chip enters the queue whose name matches that field's value, so give that field a `choose` line and place a queue named after each choice. Add `choose <field>: <value>, <value>, ...` and that field becomes a pick from the choices in the written order instead of typing, and changing that field of a chip inside a block picks from the same choices. `press <name> [from: <queue>, into: <chain or log>, take: <count>]` is a button, and `at: <part>` places it on that part. Write two or more queues as `from: \"<queue>, <queue>\"` and it gathers the top `take` chips of each, in the written order, into one block or record, and cannot be pressed while any of those queues holds fewer than `take`. Write `side <part>, <part>, ...` and the named route, queue, chain, and log parts sit on one row, left to right in the written order, when the frame is wide, with the queue taking only the width its chips need. When the frame is too narrow for readable text, they stack from the top as before.",
          "`check <node>: <field> <op> <value> [no: <error>, retry, into: <log>]` is a gate on a route node, written before the first step. The node is on the shortest path of the route that `ask` sends through (`via`). A sent chip checks the gates of each node it reaches in the written order, and stops at that node on the first gate whose condition does not hold. A stopped chip enters no queue, and the `into` log (a `log` without `all`) gains one record with the chip, the node, the `no` error and whether it can be retried. The op is `>=`, `<=`, `>`, `<`, `==` or `!=`. When the value is a number, the field is compared as a number and a field that is not a number does not pass. A value that is not a number is compared as text with `==` and `!=`. Records of a gate with `retry` are marked retryable, and those of a gate without it are marked fix and resend.",
          "Declare chips with `item <name> [<field>: <value>]`. Inside a step, `line` writes a queue's contents or a block, and `ask <value>, ...`, `press <name>`, and `item <name> [<field>: <value>]` write the author's example (send, build, change). The player stops at the first step and waits for the reader, and adds one step and plays it each time the reader sends, presses, or changes a value. Nothing the reader types is stored. Images, videos, and print draw the author's example steps.",
        ],
        exit: "See the try diagram samples →",
      },
      chart: {
        title: "Charts",
        text: [...blockParagraphs("chart", "en")],
        exit: "See the chart samples →",
      },
      flow: {
        title: "Flow diagrams",
        text: [...blockParagraphs("flow", "en")],
        exit: "See the flow diagram samples →",
      },
      cycle: {
        title: "Cycle diagrams",
        text: [...blockParagraphs("cycle", "en")],
        exit: "See the cycle diagram samples →",
      },
      mind: {
        title: "Mind maps",
        text: [...blockParagraphs("mind", "en")],
        exit: "See the mind map samples →",
      },
      er: {
        title: "Table relation diagrams",
        text: [...blockParagraphs("er", "en")],
        exit: "See the table relation diagram samples →",
      },
      matrix: {
        title: "Two-axis matrices",
        text: [...blockParagraphs("matrix", "en")],
        exit: "See the two-axis matrix samples →",
      },
      venn: {
        title: "Set overlap diagrams",
        text: [...blockParagraphs("venn", "en")],
        exit: "See the set overlap diagram samples →",
      },
      sankey: {
        title: "Sankey diagrams",
        text: [...blockParagraphs("sankey", "en")],
        exit: "See the Sankey diagram samples →",
      },
      pipe: {
        title: "Pipe diagrams",
        text: [...blockParagraphs("pipe", "en")],
        exit: "See the pipe diagram samples →",
      },
      extend: {
        title: "Adding blocks",
        text: [
          "Besides the blocks dragon has, you can add your own blocks in your own project. Base one on a box (`box`), a line (`edge`), or an icon on a box (`icon`), and change its shape and color role. An added block is drawn with the placement and motion of its base and reads its colors from the palette table, so it looks like every other block.",
          "Write the definitions at the head of a diagram, after a `blocks 1` line, each from `block +<name>` to `end`. Write the base after `base`, the shape after `shape`, and the color role after `color`. A shape is a named shape (`round`, `circle`, `cylinder`, `diamond`, `hexagon` for boxes, `solid`, `dashed`, `dotted` for lines) or a `path` of path syntax only. In the diagram, write `+<name>` in place of `box` on a box line and in place of `->` on a line, and write an icon as `[icon: +<name>]`. A definition based on a box can also give its boxes an icon on an `icon` line. It takes the same names as `icon:` on a box line (a hand-drawn icon or `tabler:<name>`), and an icon written on the box line wins.",
          "To use the same blocks in several diagrams, keep the definitions in one file. On a page, point `<link rel=\"dragon-blocks\">` at that file, and every diagram on the page reads them.",
          "In code, read the definitions with `readBlocks` and pass them as the `blocks` option of `parseNotation` and `renderDiagram`. A definition is data only, and one with URLs, code, or SVG elements is refused, so reading a definition someone else wrote runs nothing.",
        ],
        exit: "Write one in the editor →",
      },
      steps: {
        title: "Steps",
        text: [
          ...blockParagraphs("steps", "en"),
        ],
        exit: "Next → The strip",
      },
      strip: {
        title: "The strip",
        text: [...blockParagraphs("strip", "en")],
        exit: "See the sequence samples →",
      },
      carry: {
        title: "What travels",
        text: [...blockParagraphs("carry", "en")],
        exit: "Next → JSON",
      },
      json: {
        title: "JSON",
        text: [
          "The notation and JSON convert both ways. People write the notation, and tools and AI keep the JSON (the source). The example below is the diagram from the five-minute section written as JSON, and the diagram is drawn by reading that JSON as it is.",
          "The JSON holds the format version in `version`, and older versions are converted to the current shape when read. The shape is defined in the package's `src/schemas/diagram.schema.json`.",
          "`parseNotation` turns the notation into JSON, `printNotation` turns JSON back into the notation, and `readDiagram` checks and reads JSON. Writing JSON back as notation uses a fixed layout, so the writer's line order and the comment lines that start with `//` are not kept.",
        ],
        exit: "Import JSON in the editor →",
      },
      place: {
        title: "Placing on a page",
        text: [
          "To place a diagram on your own page, import the font entry `@cardenelabs/dragon/fonts` once on the page, and pass the source read from the notation to `mountDiagram`. The example below is the same as in the package README.",
          "The font entry only loads the CSS for the two bundled fonts (Noto Sans JP and JetBrains Mono) and exports nothing. Diagrams are laid out with character widths measured from the bundled fonts, so without it they are drawn in the device's fonts and text can overflow its labels. A bundler (such as Vite) carries the CSS and font files to the page.",
          "Use the `player` returned by `mountDiagram` to move through the steps (`next`, `prev`, `play`, `pause`, `destroy`). The third argument takes settings such as the palette and a function called when the step changes (`PlayerOptions`).",
        ],
        exit: "Next → Export",
      },
      export: {
        title: "Export",
        text: [
          "The same source can be exported to mp4, GIF, HTML and PNG. Install the package and the `dragon` command is available.",
          "Export uses a headless Chromium and captures the same drawing as the page one frame at a time. Install `playwright-core`, which runs Chromium, only when you use export.",
          "Pass the source JSON (`.json`) or the notation (`.dragon`) and it writes four files with the same name. The PNG is a still of the last step.",
        ],
        exit: "Export from the editor →",
      },
      line: {
        title: "How lines are drawn",
        text: [
          "Lines can be drawn straight, as with a ruler (`ruler`, the default), or as gently wobbling pen lines, as if drawn by hand (`pen`). Pick how lines are drawn when drawing, as with the palette; the notation does not say it.",
          "Pen lines draw box edges, lines, arrows and step number rings as wobbling lines. Icons, text and the diagram frame stay as they are, and line ends, bends and sharp corners stay where they were, so arrow tips still touch their boxes. The same diagram wobbles the same way every time it is drawn. The diagram below is drawn with pen lines.",
          "Pass `--line pen` to the export command, or `line: \"pen\"` in the third argument of `mountDiagram` on your page. In the editor, pick it with the buttons next to the palette dots above the diagram.",
        ],
        exit: "Pick pen lines in the editor →",
      },
      migrate: {
        title: "Rewriting the old form",
        text: [
          "The old form of the notation (steps separated by `#`, bodies starting with `>`, and the same lines in Japanese words) is no longer read. Reading an old line stops with an error that shows the new form of that line.",
          "There is no command that moves the old form to the new one, so rewrite each line with the table below. The left column is the old form with English words, and the right column is the new form.",
        ],
        exit: "Rewrite in the editor →",
      },
    },
    cards: {
      start: "Nothing to set up. Open the editor and write.",
      boxes: "Draw what takes part with a name, a caption, a colour and an icon.",
      regions: "Put the boxes of an architecture diagram in regions by owner.",
      steps: "The diagram moves step by step, and the body tells what each step does.",
      json: "People keep the notation, and tools keep the same diagram as JSON.",
      export: "Export the same diagram to mp4, GIF, HTML and PNG.",
    },
    options: {
      head: ["Option", "Meaning"],
      rows: (palettes, fallback) => [
        ["--out <dir>", "Where to write. Created if missing (default: the current dir)"],
        ["--width <px>", "Frame width. Picks the view (`fixed` / `follow`) and sets the window width for `follow`"],
        ["--palette <name>", `Colours (${palettes}, default \`${fallback}\`)`],
        ["--line <name>", "How lines are drawn (`ruler` / `pen`, default `ruler`). `pen` draws hand-drawn pen lines"],
        ["--theme <mode>", "`light` or `dark`"],
        ["--lang <lang>", "Language of the diagram text and command messages (`ja` or `en`). Without it, the diagram text is `ja` when the title or a `say` line has kana or kanji and `en` otherwise, and the messages are `en`"],
        ["--fps <n>", "Frames per second of the mp4 (default 30)"],
        ["--gif-fps <n>", "Frames per second of the GIF (default 10)"],
        ["--format <list>", "Formats to write, separated by `,` (default `mp4,gif,html,png`)"],
        ["--step <n>", "Step the PNG shows (counted from 1, default: the last step)"],
        ["--blocks <file>", "A file of block definitions. The diagram is drawn with them, and the HTML carries them"],
      ],
    },
    rules: [
      "The first English word of a line decides its kind. Only arrow lines start with a box id",
      "A colon separates a key from its value, and attributes go inside `[ ]`, separated by `,`",
      'Names and text with spaces go at the end of the line or before `[`. Wrap only values that contain `,` or `]` and names that contain `[` in `"`',
      "The only nesting is `group … end`. A step runs until the next `step`, and indentation is for reading. Only the lines that continue a `say` must be indented deeper than `say`",
    ],
    migration: {
      head: ["Old form", "New form"],
      rows: [
        ["`sequence <title>`, `architecture <title>`", "`sequence <title>`, `architecture <title>` (unchanged)"],
        ["`view fixed`, `view follow`", "`sequence <title> [view: fixed]`, `sequence <title> [view: follow]`"],
        ['`region <id> = <name> "<note>"`', "`group <id> as <name> [note: <note>]` through `end`"],
        ["`[region <id>]` on a box line", "`box` lines between `group <id>` and `end`"],
        ['`<id> = <name> "<caption>"`', "`box <id> as <name> [note: <caption>]`"],
        ["`[color <color>]`, `[icon <icon>]`", "`box <id> [color: <color>, icon: <icon>]`"],
        ["`strip <title> = <field>, <field>`", "`strip <title>: <field>, <field>`"],
        ["`# <heading>`", "`step <heading>`"],
        ["`> <body>`", "`say <body>`"],
        ["A line wrapped in backticks", "`code <command>`"],
        ["`<id> -> <id> : <label>`", "`<id> -> <id>: <label>`"],
        ["`[tag <value>]`, `[coin]`, `[none]`", "`<id> -> <id> [tag: <value>]`, `<id> -> <id> [carry: coin]`, `<id> -> <id> [carry: none]`"],
        ["`[label above]`", "`<id> -> <id> [side: above]`"],
        ["`[label below]`", "`<id> -> <id> [side: below]`"],
        ["`[label left]`", "`<id> -> <id> [side: left]`"],
        ["`[label right]`", "`<id> -> <id> [side: right]`"],
        ["`<id> : <action>`", "`act <id>: <action>`"],
        ['`<id> "<text>"`', "`note <id>: <text>`"],
        ["`strip <field> = <value>`", "`set <field>: <value>`"],
        ["`strip <field> [<tag>]`", "`set <field> [tag: <tag>]`"],
      ],
    },
  },
};
