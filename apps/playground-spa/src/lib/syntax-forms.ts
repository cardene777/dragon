/**
 * 記法一覧に出す書式の例。
 *
 * ここに並ぶ行は「こう書けば動く」 と読まれる。 動かない行が混ざると、 一覧を見て書いた人が
 * まず躓く。 例文を組み立てて実際に図にできることを test で確かめられるよう、 表示する行と
 * 「その行をどこに置けば動くか」 を一緒に持つ。
 *
 * 受け付ける値 (図種 / 箱の種類 / 色名) は実装から引くので、 ここには持たない。
 */

/** 例文のどこに行を差し込むか。 */
export type SampleSlot =
  | "root"
  | "actors"
  | "flow"
  | "states"
  | "values"
  | "animation"
  // 値を見せる部品 (#1374)
  | "readouts"
  // 読む人が動かすつまみ (#1389)
  | "inputs"
  // つまみの値から決まる値 (#1391)
  | "formulas"
  // 押下などの出来事で動く仕掛けと、巻き上げに応じて進む値 (#1393)
  | "events"
  | "scrolls"
  // 順序図で面が動いている間の帯 (#1466)
  | "bands"
  // 矢印をいつ出すか (#1470)
  | "reveal"
  // 箱に触れると関係する線だけを光らせるか (#1757)
  | "relations"
  // 図の並ぶ向き (#1494)
  | "direction"
  // 図の配色 (#1553)
  | "palette";

export type Section = {
  title: string;
  /**
   * 英語で開いた時の節の見出しと添え書き (#2463)。
   *
   * **書式の例 (`code`) は訳さない**。 記法そのものなので、画面の言語が変わっても変えると
   * 書き写した記法が読めなくなる。 訳すのは人が読む字だけ。
   *
   * **英語の側に日本語を書かない**。 記法の日本語の値 (`direction: 縦` / `palette: 青磁`) は
   * すぐ左の例が見せているので、添え書きは「日本語の名前も書ける」 と言えば足りる。
   * 書くと、英語の画面に残る日本語を数える検査が拾う。
   */
  titleEn: string;
  /**
   * 例文の組み立て方。
   *
   * `slot` = 表示する行を置く場所。 `actors` / `flow` / `states` = 例文を成立させるために
   * 足りない分。 行だけでは図にならない (基準にする相手が要る / 参照する値が要る等) ため、
   * 補いを持たせる。
   */
  sample: {
    slot: SampleSlot;
    type?: string;
    actors?: string[];
    flow?: string[];
    states?: string[];
  };
  lines: Array<{ code: string; note: string; noteEn: string }>;
};

/** 節の見出しを言語で引く (#2463) */
export function sectionTitle(sec: Section, locale: "ja" | "en"): string {
  return locale === "ja" ? sec.title : sec.titleEn;
}

/** 1 行の添え書きを言語で引く (#2463) */
export function lineNote(line: Section["lines"][number], locale: "ja" | "en"): string {
  return locale === "ja" ? line.note : line.noteEn;
}

/**
 * 書式の例。 実際に動く記述だけを載せる。
 *
 * 値は空白で並べる。 `{ }` も `( )` も要らない。 引用符付きは補足、 角括弧は行、 色名は色、
 * 残りが種類として読まれる。 形が違うので順番は自由。
 */
export const FORMS: Section[] = [
  {
    title: "全体",
    titleEn: "Top level",
    sample: {
      slot: "root",
      actors: ["  - Client", "  - API"],
      flow: ['  - Client -> API: "要求"'],
    },
    lines: [
      { code: 'title: "ログイン"', note: "図の題名", noteEn: "The diagram title" },
      { code: "type: sequence", note: "図種。 一覧は下", noteEn: "The diagram type. The list is below" },
    ],
  },
  {
    title: "登場人物",
    titleEn: "Actors",
    sample: { slot: "actors", flow: ['  - Client -> API: "要求"'] },
    lines: [
      { code: "  - Client", note: "名前だけ", noteEn: "Name only" },
      { code: "  - API: service", note: "種類", noteEn: "Kind" },
      { code: '  - Web: service "APIサーバー"', note: "種類と補足", noteEn: "Kind and a note" },
      { code: "  - DB: database 失敗", note: "種類と色", noteEn: "Kind and color" },
      { code: '  - LB: cloud "振り分け" 警告', note: "並べる順番は自由", noteEn: "The order is free" },
      { code: "  - 決済: 失敗", note: "色だけ", noteEn: "Color only" },
      { code: '  - 表: storage ["id: PK", "name: 文字列"]', note: "行を持つ箱", noteEn: "A box that holds rows" },
      { code: "  - 保存: s3", note: "固有名でも書ける (storage になる)", noteEn: "A product name works too (it reads as storage)" },
      // 値は箱に出して初めて見える。 書き方を「値」 の節と離さない
      {
        code: '  - 受付: actor "待ち行列" "{waiting}"',
        note: "2 つ目の引用符が値の欄 ({名前} で読む)", noteEn: "The second quoted string is the value field (read it with {name})",
      },
    ],
  },
  {
    title: "項目が多い時",
    titleEn: "When a box has many fields",
    sample: { slot: "actors", actors: ["  - Client"], flow: ['  - Client -> Web: "要求"'] },
    lines: [
      { code: "  - Web:", note: "名前だけ書いて改行", noteEn: "Write the name, then break the line" },
      { code: "      kind: service", note: "項目を縦に並べる", noteEn: "List the fields one per line" },
      { code: '      補足: "APIサーバー"', note: "日本語の項目名でもよい", noteEn: "A Japanese field name is fine" },
      { code: "      色: 失敗", note: "色は 色: にまとめた", noteEn: "Color is collected into one field" },
    ],
  },
  {
    title: "部品",
    titleEn: "Parts",
    // 自分へ戻る矢印は描けない (#1227)。 例文が使うと、記法一覧が描けない形を教えることになる
    sample: {
      slot: "actors",
      actors: ["  - Client", "  - API"],
      flow: ['  - Client -> API: "動く"'],
    },
    lines: [
      { code: "  - 時計: alarm-clock", note: "部品の名前を種類に書く", noteEn: "Write the part name as the kind" },
      { code: "  - 実績:", note: "変えられる値があれば縦に並ぶ", noteEn: "Fields you can change are listed one per line" },
      { code: "      kind: achievement", note: "", noteEn: "" },
      { code: "      倍率: 2", note: "部品だけを大きくする", noteEn: "Enlarges the part alone" },
      { code: '      色: "#f59e0b"', note: "色を変えたい時はここを書き換える", noteEn: "Rewrite this line to change the color" },
    ],
  },
  {
    title: "流れ",
    titleEn: "Flow",
    sample: { slot: "flow", actors: ["  - Client", "  - API", "  - DB"] },
    lines: [
      { code: '  - Client -> API: "要求"', note: "矢印と説明", noteEn: "An arrow and its label" },
      { code: '  - API -> DB: "検索" 成功', note: "矢印の色", noteEn: "Arrow color" },
      { code: '  - DB -> API: "結果" 成功 dotted-flow', note: "色と線の種類", noteEn: "Color and line style" },
    ],
  },
  {
    title: "矢印をいつ出すか (reveal:)",
    titleEn: "When arrows appear (reveal:)",
    // 段が矢印を名指しする図でだけ意味を持つ。 例文も段を持つ形にする
    sample: {
      slot: "reveal",
      type: "topology",
      actors: ["  - Web", "  - API"],
      flow: ['  - Web -> API: "頼む"'],
    },
    lines: [
      { code: "reveal: phase", note: "段が来るまで矢印を出さない (既定)", noteEn: "Holds each arrow back until its phase arrives (default)" },
      { code: "reveal: all", note: "段に関わらず最初から全部出す", noteEn: "Shows them all from the start, whatever the phase" },
    ],
  },
  {
    title: "触れた箱の関係を光らせるか (relations:)",
    titleEn: "Whether touching a box lights its relations (relations:)",
    /*
     * 順番を持たない図でだけ意味を持つ。 例文も関係の図 (ER) にする。
     *
     * クラス図と ER 図は箱と箱の関係が同時に成り立っている = 線を引く順番は作り手の
     * 読ませ方でしかなく、読み手の問い (この箱はどこと繋がっているか) には答えない。
     */
    sample: {
      slot: "relations",
      type: "er",
      actors: ["  - 注文", "  - 明細"],
      flow: ['  - 注文 -> 明細: "持つ"'],
    },
    lines: [
      { code: "relations: off", note: "何もしない (既定)", noteEn: "Does nothing (default)" },
      { code: "relations: hover", note: "触れた箱と繋がる線と相手の箱だけが光る", noteEn: "Only the lines out of the box you touch, and the boxes they reach, light up" },
    ],
  },
  {
    title: "図の並ぶ向き (direction:)",
    titleEn: "Which way the diagram runs (direction:)",
    // フローと泳法図でだけ効く。 例文は既定と逆の向きを書いて、変わることが読めるようにする
    sample: {
      slot: "direction",
      type: "flow",
      actors: ["  - Web", "  - API"],
      flow: ['  - Web -> API: "頼む"'],
    },
    lines: [
      { code: "direction: 横", note: "1 人ずつ縦列を作る (フローの既定は縦)", noteEn: "One lane per actor (a flow stacks vertically by default)" },
      { code: "direction: 縦", note: "1 つの縦列に積む (泳法図の既定は横)", noteEn: "Stacks them into one lane (a swimlane runs across by default)" },
      // 別名は同じ画面の「向き」 の区画が記法から引いて並べる (#1850)。
      // ここに綴りを書くと、同じ値を 2 箇所に置くことになる
      { code: "direction: horizontal", note: "英語でも書ける", noteEn: "The English spelling works too" },
    ],
  },
  {
    title: "図の配色 (palette:)",
    titleEn: "Diagram palette (palette:)",
    // 色の値は図が持たない。 名前だけが図に載り、画面側が名前を見て色を当てる。
    // 例文は ER 図にする = 既定を持つ図種の一つで、書き換えたことが絵で読める
    sample: {
      slot: "palette",
      type: "er",
      actors: [
        // 種類 (`kind`) は書かない (#2388)。 縦列も動きも書かない ER 図は実体 1 つにつき
        // 表の箱を作る経路で組むので、書いても届かない
        '  - users: { subtitle: "利用者", rows: ["id: bigint", "email: text"], marks: ["pk", ""] }',
        '  - orders: { subtitle: "注文", rows: ["id: bigint", "user_id: bigint"], marks: ["pk", "fk"] }',
      ],
      flow: ['  - users -> orders: "注文する"'],
    },
    lines: [
      { code: "palette: kinari", note: "ER 図とクラス図は書かなくても生成りに茶になる", noteEn: "ER and class diagrams take this ecru and brown pair even if you leave it out" },
      { code: "palette: celadon", note: "青磁に墨", noteEn: "Celadon with sumi ink" },
      { code: "palette: 青磁", note: "日本語でも書ける (生成り / 青磁)", noteEn: "The Japanese names work too" },
    ],
  },
  {
    title: "動いている間の帯 (bands:)",
    titleEn: "The band while a message is in flight (bands:)",
    // 帯は順序図だけの項目。 面が動いている言づての範囲を 0 から数えて書く = 書かなければ
    // 「最初に関わった言づてから最後まで」 の 1 本になる
    sample: {
      slot: "bands",
      type: "sequence",
      actors: ["  - Browser", "  - API", "  - DB"],
      flow: ['  - Browser -> API: "頼む"', '  - API -> DB: "引く"', '  - DB -> API: "返す"'],
    },
    lines: [
      { code: "  - Browser: 0..2", note: "面と、動いている言づての範囲 (0 から数える)", noteEn: "The participant, and the span of messages it stays busy for (counted from 0)" },
      { code: "  - DB: 1..1", note: "途中で手が空く面は区間を分けて書く", noteEn: "A participant that goes idle in between gets its spans written separately" },
    ],
  },
  {
    // 節の題に記法の項目名を出す。 中身は字下げした行なので、どの節の下に書くのかが
    // 題からしか分からない
    title: "値 (states:)",
    titleEn: "Values (states:)",
    // 値は箱に出して初めて意味がある。 例文の箱に `{名前}` を置いて、出るところまで見せる
    sample: {
      slot: "states",
      actors: ['  - 受付: "待ち行列" "{inflow}"', "  - 処理"],
      flow: ['  - 受付 -> 処理: "渡す"'],
    },
    lines: [
      { code: "  inflow: 10", note: "名前は英数字と _ だけ", noteEn: "Names take letters, digits and _ only" },
      { code: "  done: 4", note: "数でも文字列でもよい", noteEn: "A number or a string, either is fine" },
    ],
  },
  {
    title: "値どうしの関係 (values:)",
    titleEn: "Relations between values (values:)",
    sample: {
      slot: "values",
      actors: ['  - 受付: "待ち行列" "{waiting}"', "  - 処理"],
      flow: ['  - 受付 -> 処理: "渡す"'],
      states: ["  inflow: 10", "  done: 4"],
    },
    lines: [
      { code: '  waiting: "{inflow} - {done}"', note: "四則 + 括弧。 参照は {名前}", noteEn: "The four operators and parentheses. Refer to a value with {name}" },
      { code: '  busy: "{waiting} > 80"', note: "比較は 真 = 1 / 偽 = 0", noteEn: "A comparison yields 1 for true and 0 for false" },
      { code: '  peak: "max({waiting}, 50)"', note: "min / max が書ける", noteEn: "min and max are available" },
    ],
  },
  {
    title: "値を見せる部品 (readouts:)",
    titleEn: "Parts that show a value (readouts:)",
    sample: {
      slot: "readouts",
      type: "flow",
      actors: ['  - 処理: { kind: card, value: "{done}" }'],
      // 部品が読む元は全て `states` に在ること。 無い名前を指した見本は、
      // それに沿って書いた人がまず躓く (#2405 で `hist` の書き落としを検出)
      states: ["  done: 0", "  total: 100", "  hist: 0"],
    },
    lines: [
      {
        code: '  ring: { kind: percent-ring, source: total, max: 500, label: "進捗" }',
        note: "円の環で割合を出す", noteEn: "Shows a share as a ring",
      },
      {
        code: '  cu: { kind: countup, source: done, unit: " 件", decimals: 0 }',
        note: "数を数え上げて出す", noteEn: "Counts the number up",
      },
      {
        code: "  g: { kind: gauge, source: done, min: 0, max: 100 }",
        note: "目盛りで出す。 他に bar / stat / sparkline / delta / typewriter / heat-cell", noteEn: "Shows it on a gauge. Also bar / stat / sparkline / delta / typewriter / heat-cell",
      },
      {
        code: '  d: { kind: donut, source: total, colors: ["#4e9dc4", "#22c55e"] }',
        note: "内訳を輪で出す。 他に radar / kpi-card / notification", noteEn: "Shows the breakdown as a donut. Also radar / kpi-card / notification",
      },
      {
        code: '  dot: { kind: status-dot, source: done, map: [{ value: "ok", color: "#22c55e" }] }',
        note: "値に対応する色の点。 他に step-progress / status-timeline", noteEn: "A dot colored by the value. Also step-progress / status-timeline",
      },
      {
        code: "  lc: { kind: line-chart, source: hist, min: 0, max: 100 }",
        note: "種類は 107 ある。 描ける部品はすべて書ける (#1385)", noteEn: "There are 107 kinds. Every part that can be drawn can be written",
      },
    ],
  },
  {
    title: "読む人が動かすつまみ (inputs:)",
    titleEn: "Controls the reader can move (inputs:)",
    sample: {
      slot: "inputs",
      type: "flow",
      actors: ['  - 処理: { kind: card, value: "{v}" }'],
      states: ["  v: 50"],
    },
    lines: [
      {
        code: '  v: { kind: slider, min: 0, max: 100, defaultValue: 50, label: "量" }',
        note: "つまみを動かすと値が変わる。 名前が状態の名前になる", noteEn: "Moving the control changes the value. Its name becomes the state name",
      },
      {
        code: "  n: { kind: number, defaultValue: 3, min: 0, max: 10 }",
        note: "数を直に打つ。 他に stepper (増減ボタン)", noteEn: "Type the number directly. Also stepper (plus and minus buttons)",
      },
      {
        code: "  mode: { kind: dropdown, options: [日, 週, 月], defaultValue: 日 }",
        note: "選択肢から 1 つ。 他に radio / tabs (見た目が違うだけ)", noteEn: "One of several choices. Also radio / tabs (the same thing drawn differently)",
      },
      {
        code: '  status: { kind: dropdown, options: [{ value: red, label: "失敗" }, green], defaultValue: green }',
        note: "組は値と見せる名前を分ける。 選択肢と箱の {status} は名前で描き、値は綴りのまま", noteEn: "A pair separates the value from the name shown. The choices and the box's {status} draw the name, while the value keeps its spelling",
      },
      {
        code: "  on: { kind: toggle, defaultValue: true }",
        note: "入り切り。 他に color (色) / text (文字) / datetime (日時)", noteEn: "On and off. Also color / text / datetime",
      },
      {
        code: '  pressed: { kind: toggle, defaultValue: false, onLabel: "押した", offLabel: "押していない" }',
        note: "箱に差し込む切り替えの値を、真偽の字でなく名前で描く", noteEn: "Draws a toggle's value in a box by its name instead of true or false",
      },
      {
        code: "  clock: { kind: timeline, duration: 3000, speeds: [0.5, 1, 2] }",
        note: "時間を進める。 他に range (下限と上限) / multi-select / xypad", noteEn: "Advances time. Also range (a low and a high end) / multi-select / xypad",
      },
    ],
  },
  {
    title: "つまみの値から決まる値 (formulas:)",
    titleEn: "Values derived from the controls (formulas:)",
    sample: {
      slot: "formulas",
      type: "flow",
      actors: ['  - 処理: { kind: card, value: "{doubled}" }'],
    },
    lines: [
      {
        code: '  doubled: "input * 2"',
        note: "つまみの値から決まる。 名前は中括弧で囲っても囲わなくてもよい", noteEn: "Derived from the controls. The name may be wrapped in braces or left bare",
      },
      {
        code: '  clamped: "Math.min(doubled, 80)"',
        note: "他の式も読める。 min / max / abs / floor / ceil / round", noteEn: "Other functions read too. min / max / abs / floor / ceil / round",
      },
      {
        code: '  flag: "doubled >= 100 ? 1 : 0"',
        note: "比較と三項も書ける", noteEn: "Comparisons and the three-part conditional work too",
      },
      {
        code: '  total: { expression: "doubled + 10", label: "合計" }',
        note: "組で書くと操作部に名札を出す。 中身の名前も名札を持つつまみと式は名札で出す", noteEn: "Written as a pair, the control panel shows a label. Controls and formulas that carry a label are drawn by that label",
      },
    ],
  },
  {
    title: "押下などの出来事 (events:)",
    titleEn: "Events such as a press (events:)",
    sample: {
      slot: "events",
      type: "flow",
      actors: ["  - 押す: { kind: card }", "  - 受ける: { kind: card }"],
      flow: ['  - 押す -> 受ける: "呼ぶ"'],
    },
    lines: [
      {
        code: "  - { on: click, box: 押す, handler: toggle }",
        note: "箱を押した時に仕掛けを呼ぶ。 仕掛けの中身は画面側が持つ", noteEn: "Calls a handler when the box is pressed. The handler itself lives on the page side",
      },
      {
        code: "  - { on: hover, arrow: 押す -> 受ける, handler: highlight }",
        note: "矢印に乗せる。 他に lane (縦列) / diagram: true (図全体)", noteEn: "Puts it on an arrow. Also lane / diagram: true (the whole diagram)",
      },
      {
        code: "  - { on: keydown, diagram: true, handler: onKey }",
        note: "他の種類 = double-click / long-press / drag / drop / focus / blur", noteEn: "The other kinds are double-click / long-press / drag / drop / focus / blur",
      },
    ],
  },
  {
    title: "巻き上げに応じて進む値 (scrolls:)",
    titleEn: "Values that advance as the page scrolls (scrolls:)",
    sample: {
      slot: "scrolls",
      type: "flow",
      actors: ["  - 節: { kind: card }"],
    },
    lines: [
      {
        code: '  intro: { start: 0.9, end: 0.1, scrub: 1, label: "導入" }',
        note: "画面を巻き上げた量から 0 から 1 の進み具合を作る", noteEn: "Turns how far the page has scrolled into a progress value from 0 to 1",
      },
      {
        code: "  outro: { start: 0.5, end: 0 }",
        note: "start は進み始める位置、end は進み終わる位置 (0 が上端、1 が下端)", noteEn: "start is where it begins to advance and end is where it stops (0 is the top edge, 1 the bottom)",
      },
    ],
  },
  {
    title: "箱の中に描く図形 (shape:)",
    titleEn: "Shapes drawn inside a box (shape:)",
    sample: {
      slot: "actors",
      type: "flow",
      flow: [],
      states: ["  s: 0"],
    },
    lines: [
      {
        code: '  - 水位: { kind: dyn-wave, posW: 140, posH: 200, shape: { kind: wave, level: "{s}", amplitude: 100 } }',
        note: "水面が状態で上下する", noteEn: "The water level rises and falls with the state",
      },
      {
        code: '  - 角度: { kind: dyn-arc, shape: { kind: arc, angle: "{s}", sweepMax: 360 } }',
        note: "扇形が状態で開く", noteEn: "The wedge opens with the state",
      },
      {
        code: "  - 六角: { kind: card, shape: { kind: polygon, sides: 6, radius: 40 } }",
        note: "他に rect / circle", noteEn: "Also rect / circle",
      },
    ],
  },
  {
    title: "名前と別の題を出す (title: / visibleIf:)",
    titleEn: "Showing a title apart from the name (title: / visibleIf:)",
    sample: {
      slot: "actors",
      type: "flow",
      flow: [],
      states: ["  shown: 1"],
    },
    lines: [
      {
        code: '  - 星1: { kind: card, title: "★" }',
        note: "名前は 1 つに決まる、題は重なってよい", noteEn: "A name is unique, while titles may repeat",
      },
      {
        code: '  - 星2: { kind: card, title: "★" }',
        note: "同じ題の箱を並べられる", noteEn: "Boxes with the same title can sit side by side",
      },
      {
        code: '  - 場所取り: { kind: card, visibleIf: "{shown}", title: "" }',
        note: "条件が偽なら出ない。 場所だけ空ける箱に使う", noteEn: "Hidden when the condition is false. Use it for a box that only holds space",
      },
    ],
  },
  {
    title: "動き (図種により必須)",
    titleEn: "Motion (required by some diagram types)",
    sample: {
      slot: "animation",
      actors: ["  - Client", "  - API"],
      flow: ['  - Client -> API: "要求"'],
    },
    lines: [
      { code: '  - step: "呼ぶ" 1.4s', note: "1 段の長さ", noteEn: "How long one phase lasts" },
      { code: "    focus: [Client, API]", note: "その段で光らせる", noteEn: "Lights these up during that phase" },
    ],
  },
  {
    // 例は折れ線で見せる。 `draw:` は語と同じ図種にだけ効く (#1312 / #1314 / #1318)。
    // **受ける語をここに並べない**。 この file の役割は書式の例で、受け付ける値は
    // `SyntaxReference` が実装から引いて並べる (図種 / 箱の種類 / 色と同じ扱い)
    title: "図を起点から描く",
    titleEn: "Drawing the diagram from its starting point",
    sample: {
      slot: "animation",
      type: "line",
      actors: ['  - W1: "180"', '  - W2: "240"', '  - W3: "210"'],
    },
    lines: [
      { code: '  - step: "描く" 1.2s', note: "1 段の長さ", noteEn: "How long one phase lasts" },
      { code: "    draw: line", note: "図種と同じ語を書く。 受ける語は下の一覧", noteEn: "Write the same word as the diagram type. The accepted words are listed below" },
      { code: '  - step: "読む" 1.2s', note: "書かない段は全長のまま", noteEn: "A phase you leave out keeps the full length" },
    ],
  },
  {
    title: "位置と大きさ",
    titleEn: "Position and size",
    sample: { slot: "actors", actors: ["  - Client"], flow: ['  - Client -> Web: "要求"'] },
    lines: [
      { code: "  - Web: service @300,200", note: "位置。 書かなければ自動で決まる", noteEn: "Position. Left out, it is decided automatically" },
      { code: "  - DB:", note: "縦に並べる時は", noteEn: "When stacking them vertically" },
      { code: "      位置: 300,400", note: "左からの距離, 上からの距離", noteEn: "Distance from the left, distance from the top" },
      { code: "      大きさ: 400,180", note: "幅, 高さ", noteEn: "Width, height" },
    ],
  },
  {
    title: "他の箱を基準に置く",
    titleEn: "Placing a box relative to another",
    // 縦の相対は順序図では効かない (縦列は横に並ぶもの)。 4 向きが全て効く図種で例を組む
    sample: {
      slot: "actors",
      type: "flow",
      actors: ["  - Web: service"],
      flow: ['  - Web -> API: "要求"'],
    },
    lines: [
      { code: "  - API:", note: "座標を知らなくても置ける", noteEn: "Place it without knowing any coordinates" },
      { code: "      位置: Web の右", note: "向きは 右 左 上 下", noteEn: "The directions are right, left, up and down" },
      { code: "  - 決済:", note: "", noteEn: "" },
      { code: "      位置: Web の下 200", note: "数を書くとその分だけ離す", noteEn: "Write a number to leave that much of a gap" },
      { code: "  - 監視:", note: "", noteEn: "" },
      { code: "      位置: Web left 200", note: "英語でも書ける", noteEn: "The English spelling works too" },
    ],
  },
  {
    title: "図全体",
    titleEn: "The whole diagram",
    sample: {
      slot: "root",
      actors: ["  - Client", "  - API"],
      flow: ['  - Client -> API: "要求"'],
    },
    lines: [
      { code: "viewport: { scale: 1.5 }", note: "図全体の倍率", noteEn: "The scale of the whole diagram" },
      { code: "viewport: { laneWidth: 400 }", note: "縦列の幅", noteEn: "Lane width" },
    ],
  },
  {
    // 箱を並べる入れ物として縦列を使う図種でだけ効く。 順序図は縦列が骨格なので選べない (#1263)
    title: "箱を縦列へ入れる (lane:)",
    titleEn: "Putting a box into a lane (lane:)",
    sample: {
      slot: "actors",
      type: "topology",
      flow: ['  - 画面 -> 受付: "要求"', '  - 受付 -> 記録: "保存"'],
    },
    lines: [
      // 縦列は書いた id から自動で作られる。 見出しや幅を付けたい時だけ `lanes:` も書く
      { code: "  - 画面: { lane: front }", note: "箱をその縦列へ入れる", noteEn: "Puts the box into that lane" },
      { code: "  - 受付: { lane: back }", note: "全ての箱に書く (一部だけだと知らせが出る)", noteEn: "Write it on every box (leaving some out raises a notice)" },
      { code: "  - 記録: { lane: back }", note: "同じ縦列に書けば縦に積む", noteEn: "Boxes written into the same lane stack vertically" },
    ],
  },
  {
    // 箱の大きさ。 書かないと描画側の既定になる。 既定より狭い幅を書くと縦列に収まる (#1259)
    title: "箱の大きさ (posW: / posH:)",
    titleEn: "Box size (posW: / posH:)",
    sample: {
      slot: "actors",
      type: "state",
      flow: ['  - 待機 -> 読込み: "start"'],
    },
    lines: [
      { code: "  - 待機: { kind: card, posW: 280 }", note: "幅", noteEn: "Width" },
      { code: "  - 読込み: { kind: card, posW: 280, posH: 120 }", note: "幅と高さ", noteEn: "Width and height" },
    ],
  },
  {
    // 工程の並びだけが持つ欄。 他の図種で書くと組み立て側が知らせる (#1251)
    title: "工程の並びの欄 (owner: / end:)",
    titleEn: "Schedule fields (owner: / end:)",
    sample: {
      slot: "actors",
      type: "gantt",
    },
    lines: [
      { code: '  - 設計: { value: "Q1", owner: "デザイナー" }', note: "担当", noteEn: "Owner" },
      { code: '  - 実装: { value: "Q2", end: "Q3" }', note: "終わる時期。 帯が 2 コマになる", noteEn: "When it ends. The bar then spans two periods" },
      { code: '  - 検証: { value: "Q3", end: "{done}" }', note: "状態から取ると段で伸び縮みする", noteEn: "Taken from a state, it grows and shrinks by phase" },
    ],
  },
  {
    // 2 つの軸で仕分ける図だけが持つ。 他の図種で書くと組み立て側が知らせる (#1251)
    title: "軸の名前 (axes:)",
    titleEn: "Axis names (axes:)",
    sample: {
      slot: "root",
      type: "quadrant",
      actors: ['  - 重複削除: "左上"', '  - 型を直す: "右上"'],
    },
    lines: [
      { code: "axes:", note: "2 つの軸に名前を付ける", noteEn: "Names the two axes" },
      { code: '  x: { left: "手間 小", right: "手間 大" }', note: "横の軸", noteEn: "The horizontal axis" },
      {
        code: '  y: { bottom: "効き 小", top: "効き 大" }',
        note: "縦の軸。 区画の名前は軸から決まる", noteEn: "The vertical axis. The quadrant names follow from the axes",
      },
    ],
  },
  {
    // ユーザージャーニーの段だけが持つ欄。 他の図種で書くと組み立て側が知らせる (#1251)
    title: "ユーザージャーニーの欄 (touchpoint: / opportunity:)",
    titleEn: "Journey fields (touchpoint: / opportunity:)",
    sample: {
      slot: "actors",
      type: "journey",
    },
    lines: [
      { code: '  - 登録: { value: "不満", touchpoint: "申込み画面" }', note: "どこで起きたか", noteEn: "Where it happened" },
      { code: '  - 決済: { value: "普通", opportunity: "入力を減らす" }', note: "何を直せるか", noteEn: "What can be improved" },
    ],
  },
  {
    // 図表は箱を 1 つしか作らないため、 上の小見出しの相手が決まる。 箱ごとに分かれる図種で
    // 書くと組み立て側が知らせる (#1247)
    title: "図表の上の小見出し (eyebrow:)",
    titleEn: "The small heading above a chart (eyebrow:)",
    sample: {
      slot: "root",
      type: "bar",
      actors: ['  - 検索: "420"', '  - SNS: "310"'],
    },
    lines: [
      {
        code: 'eyebrow: "棒グラフ"',
        note: "図表の箱の上に出す。 箱ごとに分かれる図種では書けない", noteEn: "Shown above the chart box. Not available on diagram types that split per box",
      },
    ],
  },
  {
    // 縦列と囲みは `topology` / `swimlane` で使う。 一覧に無いと、記法にあることすら伝わらない
    title: "縦列と囲み (lanes: / groups:)",
    titleEn: "Lanes and groups (lanes: / groups:)",
    sample: {
      slot: "root",
      type: "topology",
      actors: ["  - Web: service", "  - DB: database"],
      flow: ['  - Web -> DB: "問い合わせ"'],
    },
    lines: [
      { code: "lanes:", note: "縦列の位置と幅を決める", noteEn: "Sets each lane's position and width" },
      // **図が作る縦列の id を書く**。 合わない id を書くと箱の入らない縦列が増えるだけで、
      // 書いた幅も見出しも元の縦列に届かない (#1241 で知らせが出るようにした)。
      // `type: topology` は箱を全て `main` に入れる
      { code: '  main: { x: 0, width: 360, label: "表" }', note: "id: { x, width, label }", noteEn: "id: { x, width, label }" },
      { code: "groups:", note: "縦列をまとめて囲む", noteEn: "Wraps several lanes together" },
      { code: '  aws: { label: "AWS", lanes: [main] }', note: "id: { label, lanes: [...] }", noteEn: "id: { label, lanes: [...] }" },
    ],
  },
];

/**
 * 一覧の行から、 実際に図にできる例文を組む。
 *
 * 表示する行をそのまま使う。 test 用に別の例文を書くと、 一覧の行が動かなくなっても
 * test は通ってしまう。
 */
export function buildSample(section: Section): string {
  const { slot, actors = [], flow = [], states = [] } = section.sample;
  const codes = section.lines.map((l) => l.code);
  // `reveal` は最上位に 1 行で書く語なので、`root` と同じ場所へ置く (#1470)
  // 最上位に 1 行で書く項目は、頭の並びにそのまま足す (`reveal` / `relations` / `direction`)
  const 最上位に置く: readonly SampleSlot[] = ["root", "reveal", "relations", "direction", "palette"];
  const rootLines = 最上位に置く.includes(slot) ? codes : [];
  // 題名と図種は例文に必ず要る。 一覧側で書いている時は重ねて書かない (後に書いた方が効く)
  const head = [
    ...(rootLines.some((l) => /^title\s*:/.test(l)) ? [] : ['title: "見本"']),
    ...(rootLines.some((l) => /^type\s*:/.test(l))
      ? []
      // 既定は `topology` (#1466)。 順序図は 1 枚の板になり、面に書いた種類 / 大きさ / 位置 /
      // 行 / 色が効かなくなった = 例文の下敷きにすると「書いても効かない」 見本になる
      : [`type: ${section.sample.type ?? "topology"}`]),
    ...rootLines,
  ];
  const out = [...head, "actors:", ...actors, ...(slot === "actors" ? codes : [])];
  const flowLines = [...flow, ...(slot === "flow" ? codes : [])];
  if (flowLines.length > 0) out.push("flow:", ...flowLines);
  // 値は `states` → `values` の順に置く。 解く順は参照から決まるので順序に意味は無いが、
  // 例文として読む時に「初期値があって、そこから決まる」 の順が自然
  const stateLines = [...states, ...(slot === "states" ? codes : [])];
  if (stateLines.length > 0) out.push("states:", ...stateLines);
  if (slot === "values") out.push("values:", ...codes);
  // 値を見せる部品 (#1374)。 状態を見せるものなので `states` の後ろに置く
  if (slot === "readouts") out.push("readouts:", ...codes);
  // 読む人が動かすつまみ (#1389)。 値を握るものなので部品と同じ並びに置く
  if (slot === "inputs") out.push("inputs:", ...codes);
  // 押下などの出来事と巻き上げ (#1393)。 箱と矢印を指すので、それより後ろに置く
  if (slot === "events") out.push("events:", ...codes);
  if (slot === "scrolls") out.push("scrolls:", ...codes);
  // 動いている間の帯 (#1466)。 面と段を指すので、その両方より後ろに置く
  if (slot === "bands") out.push("bands:", ...codes);
  // つまみの値から決まる値 (#1391)。 つまみを読むので、その後ろに置く
  if (slot === "formulas") {
    out.push(
      "inputs:",
      "  input: { kind: slider, min: 0, max: 100, defaultValue: 50 }",
      "formulas:",
      ...codes,
    );
  }
  if (slot === "animation") out.push("animation:", ...codes);
  return `${out.join("\n")}\n`;
}
