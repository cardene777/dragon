/**
 * 使い方の頁の言葉 (#3034)。日本語と英語を必ず両方持つ。
 *
 * 節の並びは `SECTIONS` が持ち、節の番号と札の行き先はこの並びから作るので、数を書き写さない。
 * 本文の中の `` ` `` で囲んだ語は `<code>` で出す。
 * 節の記法の例は `examples/` の file が持ち、頁と検査 (`lib/site.test.ts`) が同じ file を読む。
 * 書き出しの節の命令は package の README と同じ物を、設定は命令の使い方の表示と同じ物を出す (検査が突き合わせる)。
 */
import type { Lang } from "../text";

/** 節の並び。記法の要素を書く順に並べる */
export const SECTIONS = ["start", "boxes", "edges", "regions", "steps", "strip", "carry", "json", "export"] as const;
export type SectionId = (typeof SECTIONS)[number];

/** 特長の札が指す節。札はこの並びで並ぶ */
export const CARDS = ["start", "boxes", "regions", "steps", "json", "export"] as const satisfies readonly SectionId[];

/** 節の出口。同じ頁の節か、サイトの画面か、カタログの分類 */
export type Exit = { section: SectionId } | { screen: "editor" | "catalog" } | { kind: "sequence" | "architecture" };

export const EXITS: Record<SectionId, Exit> = {
  start: { screen: "editor" },
  boxes: { section: "edges" },
  edges: { section: "regions" },
  regions: { kind: "architecture" },
  steps: { section: "strip" },
  strip: { kind: "sequence" },
  carry: { section: "json" },
  json: { screen: "editor" },
  export: { screen: "editor" },
};

/** 節の本文の段落ごとに、その後ろへ図を描かない囲みで出す命令 (言葉で替わらない)。`null` の段落は命令を持たない */
export const COMMANDS: Partial<Record<SectionId, readonly (string | null)[]>> = {
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
  cards: Record<(typeof CARDS)[number], string>;
  /** 書き出しの設定の表。`palettes` は色味の名前の並び、`fallback` は既定の色味 */
  options: { head: readonly [string, string]; rows: (palettes: string, fallback: string) => readonly (readonly [string, string])[] };
}

export const DOCS: Record<Lang, DocsText> = {
  ja: {
    eyebrow: (version) => `使い方の案内 · ${version}`,
    lead: "記法の書き方を 1 枚にまとめた読み物。最初の 5 分で図を動かし、箱、線、区画、段、帯、運ぶ物の順に記法の要素を掴む。JSON との行き来と、mp4 や GIF への書き出しもここで扱う。",
    start: "5 分で始める →",
    browse: "カタログで図を見る",
    sections: {
      start: {
        title: "5 分で動かす",
        text: [
          "何も入れずに試すなら、編集画面を開く。左の欄に記法を書くと、右にその場で動く図が出る。",
          "記法は行の頭の語で、その行に何を書くかが決まる。最初の行に図の種類と題を書き、`sequence` なら時間の順に箱どうしのやり取りを、`architecture` なら区画に置いた箱のつながりを描く。",
          "次に登場する箱を `box` の行で並べ、`step` の行の下に字下げして、その段で起きることを起きる順に書く。下の例は箱 2 つと段 1 つの、いちばん小さな図になる。",
        ],
        exit: "編集画面で書いてみる →",
      },
      boxes: {
        title: "箱",
        text: [
          "箱は `box <名札> as <名前> [note: <下の字>]` で宣言する。名札は線や処理で箱を指す時の呼び名で、図には名前と下の字が出る。`as <名前>` を省くと、名札がそのまま名前になる。",
          "`[ ]` の中に `color: <色>` を足すと箱の色の役が、`icon: <印>` を足すと名前の横の印が付き、2 つ以上は `,` で区切る。色は `blue` や `green` のような色の役の名前で、印は `user` や `db` のような名前で選ぶ。名前に `[` を、値に `,` か `]` を含める時は `\"` で囲む。",
          "箱は宣言した順に並ぶ。時系列図では箱ごとに縦の線が左から右へ立ち、線はその間を走る。",
        ],
        exit: "続き → 線",
      },
      edges: {
        title: "線",
        text: [
          "線は `<名札> -> <名札>: <線の名前>` で書き、段の中に書いた順に走る。名前は省ける。",
          "`act <名札>: <処理の名前>` は、線を引かずに箱の中で行う処理を表す。受け取った物を確かめる、数を数える、のような箱の中だけで済む動きに使う。",
          "線の名前の置き場所は自動で決まる。崩れた時だけ、線の行の終わりに `[side: above]` か `below`、`left`、`right` を足して置く側を指す。",
        ],
        exit: "続き → 区画",
      },
      regions: {
        title: "区画",
        text: [
          "構成図では、箱を区画に分けて置ける。区画は `group <名札> as <名前> [note: <添え書き>]` の行で開いて `end` の行で閉じ、その間に書いた `box` の行の箱が区画の中に置かれる。",
          "区画も `color:` と `icon:` を持てる。仕組みの持ち主や置き場所の境目 (チェーンと網、店と倉庫) を見せる時に使う。",
          "同じ区画の箱が離れて並ぶ時は、同じ `group <名札>` をもう一度開いて続きの箱を書く。2 度目は名札だけを書き、名前と札は最初の 1 度だけ書く。",
        ],
        exit: "構成図の見本を見る →",
      },
      steps: {
        title: "段",
        text: [
          "段は `step <見出し>` の行で区切り、図はこの単位で 1 段ずつ進む。段の中の行は字下げして書き、その段で起きることを語る `say` の行を必ず書く。本文を 2 行以上に分ける時は、`say` だけの行の下に、さらに深く字下げして続ける。",
          "例の `code pay(1200)` の行のように、`code` の行はその段で打つ命令になる。1 つの段に 1 行まで書ける。",
          "`note <名札>: <字>` は、その段から箱の下の字を書き換える。残高や状態のように、段を追って替わる値を箱の上で見せる。",
          "見せ方は最初の行の終わりに `[view: fixed]` か `[view: follow]` を足して選ぶ。`fixed` は全体を止めて中だけを動かし、`follow` は今動いている所へ寄って動かす。書かなければ、全体を枠に収めた時の字の大きさで決まる。",
        ],
        exit: "続き → 帯",
      },
      strip: {
        title: "帯",
        text: [
          "帯は図に添える中身の表で、段を追って替わる値を見せる。`strip <題>: <欄>, <欄>` で欄を宣言する。",
          "段の中で `set <欄>: <値>` と書くとその欄に値が入り、`set <欄> [tag: <札>]` と書くとその欄に札が付く。",
          "認可コードや注文の状態のように、やり取りの間に持ち物が替わる様子を、線とは別に追える。",
        ],
        exit: "時系列図の見本を見る →",
      },
      carry: {
        title: "運ぶ物",
        text: [
          "線の上には、何が運ばれたかを示す物が走る。何も書かなければ封筒が走る。",
          "線の行の終わりに `[tag: <値>]` を足すと字を書いた札を、`[carry: coin]` を足すと硬貨を走らせる。番号や証明のような値が動く線には札を、代金やトークンのように価値が動く線には硬貨を使う。",
          "`[carry: none]` は何も走らせない。知らせるだけで物が動かない線に使う。",
        ],
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
      export: {
        title: "書き出し",
        text: [
          "同じ原本から、mp4、GIF、HTML、PNG を書き出せる。package を入れると `dragon` の命令が使える。",
          "書き出しは画面なしの Chromium で、頁と同じ描画を 1 コマずつ撮る。Chromium を動かす `playwright-core` は、書き出しを使う時だけ入れる。",
          "原本の JSON (`.json`) か記法 (`.dragon`) を渡すと、同じ名前の 4 つの file を書き出す。PNG は最後の段の止め絵になる。",
        ],
        exit: "編集画面から書き出す →",
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
        ["--theme <明暗>", "`light` か `dark`"],
        ["--lang <言葉>", "図の中の字と命令の文の言葉 (`ja` か `en`)。既定は `ja`"],
        ["--fps <数>", "mp4 の 1 秒のコマの数 (既定 30)"],
        ["--gif-fps <数>", "GIF の 1 秒のコマの数 (既定 10)"],
        ["--format <形>", "書き出す形を `,` で区切る (既定 `mp4,gif,html,png`)"],
      ],
    },
  },
  en: {
    // 英語の側の区切りは `•` にする。`·` は日本語の字の並びに使われ、英語の頁に日本語が残ったように読めるため (前のサイトの #2455)
    eyebrow: (version) => `guide • ${version}`,
    lead: "One page that lays out how to write the notation. Get a diagram moving in the first five minutes, then take in the parts of the notation in order: boxes, lines, regions, steps, the strip and what travels. Going between the notation and JSON, and exporting to mp4 or GIF, are covered here too.",
    start: "Start in five minutes →",
    browse: "Browse the catalog",
    sections: {
      start: {
        title: "Up and running in five minutes",
        text: [
          "To try it without installing anything, open the editor. Write notation in the box on the left and a moving diagram appears on the right as you type.",
          "The first word of each line says what the line holds. The first line gives the diagram kind and title: `sequence` draws boxes exchanging messages in time order, and `architecture` draws how boxes placed in regions connect.",
          "Then list the boxes that take part with `box` lines, and indented under a `step` line, write what happens in that step in the order it happens. The example below is the smallest diagram: two boxes and one step.",
        ],
        exit: "Write one in the editor →",
      },
      boxes: {
        title: "Boxes",
        text: [
          "Declare a box with `box <id> as <name> [note: <caption>]`. The id is how lines and actions point at the box, and the name and caption are what the diagram shows. Without `as <name>`, the id is the name.",
          'Inside the `[ ]`, add `color: <color>` to give the box a colour role and `icon: <icon>` to put an icon next to its name, separating two or more with `,`. Colours are role names such as `blue` or `green`, and icons are names such as `user` or `db`. Wrap a name in `"` when it contains `[`, and a value when it contains `,` or `]`.',
          "Boxes line up in the order you declare them. In a sequence diagram each box gets a vertical line from left to right, and lines run between them.",
        ],
        exit: "Next → Lines",
      },
      edges: {
        title: "Lines",
        text: [
          "Write a line as `<id> -> <id>: <label>`. Lines run in the order they are written in the step, and the label can be left out.",
          "`act <id>: <action>` is something a box does inside itself, without drawing a line. Use it for work that stays inside the box, such as checking what arrived or counting.",
          "The label is placed automatically. Only when the placement breaks, add `[side: above]`, `below`, `left` or `right` at the end of the line to say which side it goes.",
        ],
        exit: "Next → Regions",
      },
      regions: {
        title: "Regions",
        text: [
          "In an architecture diagram, boxes can be placed in regions. Open a region with a `group <id> as <name> [note: <note>]` line and close it with an `end` line, and the boxes on the `box` lines in between go inside it.",
          "Regions can also take `color:` and `icon:`. Use them to show where ownership or placement changes, such as between chains and a network, or a shop and a warehouse.",
          "When boxes of the same region are not next to each other, open the same `group <id>` again and write the rest of its boxes. The second time, write only the id, and give the name and attributes only the first time.",
        ],
        exit: "See the architecture samples →",
      },
      steps: {
        title: "Steps",
        text: [
          "Steps are separated by `step <heading>` lines, and the diagram moves on one step at a time. Indent the lines inside a step, and every step needs a `say` line that tells what happens in it. To split the body over two or more lines, write `say` alone and continue on lines indented further below it.",
          "A `code` line, like the `code pay(1200)` line in the example, is the command for that step. A step can have at most one.",
          "`note <id>: <text>` rewrites the caption under a box from that step on. Use it to show a value that changes step by step, such as a balance or a state, right on the box.",
          "Choose the view by adding `[view: fixed]` or `[view: follow]` at the end of the first line. `fixed` keeps the whole diagram still and moves only what is inside, and `follow` moves to where things are happening. Without it, the view is chosen by the text size when the whole diagram fits the frame.",
        ],
        exit: "Next → The strip",
      },
      strip: {
        title: "The strip",
        text: [
          "The strip is a table that goes with the diagram and shows values that change step by step. Declare its fields with `strip <title>: <field>, <field>`.",
          "Inside a step, `set <field>: <value>` puts a value in a field, and `set <field> [tag: <tag>]` puts a tag on it.",
          "It lets you follow what is held while messages go back and forth, such as an authorization code or the state of an order, apart from the lines.",
        ],
        exit: "See the sequence samples →",
      },
      carry: {
        title: "What travels",
        text: [
          "Something runs along each line to show what was carried. Without any option, an envelope travels.",
          "Adding `[tag: <value>]` at the end of the line sends a tag with text on it, and `[carry: coin]` sends a coin. Use a tag for lines that move a value such as a number or a proof, and a coin for lines that move worth such as money or tokens.",
          "`[carry: none]` sends nothing. Use it for lines that only tell, with nothing changing hands.",
        ],
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
      export: {
        title: "Export",
        text: [
          "The same source can be exported to mp4, GIF, HTML and PNG. Install the package and the `dragon` command is available.",
          "Export uses a headless Chromium and captures the same drawing as the page one frame at a time. Install `playwright-core`, which runs Chromium, only when you use export.",
          "Pass the source JSON (`.json`) or the notation (`.dragon`) and it writes four files with the same name. The PNG is a still of the last step.",
        ],
        exit: "Export from the editor →",
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
        ["--theme <mode>", "`light` or `dark`"],
        ["--lang <lang>", "Language of the diagram text and command messages (`ja` or `en`). Defaults to `ja`"],
        ["--fps <n>", "Frames per second of the mp4 (default 30)"],
        ["--gif-fps <n>", "Frames per second of the GIF (default 10)"],
        ["--format <list>", "Formats to write, separated by `,` (default `mp4,gif,html,png`)"],
      ],
    },
  },
};
