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
export type SampleSlot = "root" | "actors" | "flow" | "states" | "values" | "animation";

export type Section = {
  title: string;
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
  lines: Array<{ code: string; note: string }>;
};

/**
 * 書式の例。 実際に動く記述だけを載せる。
 *
 * 値は空白で並べる。 `{ }` も `( )` も要らない。 引用符付きは補足、 角括弧は行、 色名は色、
 * 残りが種類として読まれる。 形が違うので順番は自由。
 */
export const FORMS: Section[] = [
  {
    title: "全体",
    sample: { slot: "root", actors: ["  - Client", "  - API"], flow: ['  - Client -> API: "要求"'] },
    lines: [
      { code: 'title: "ログイン"', note: "図の題名" },
      { code: "type: sequence", note: "図種。 一覧は下" },
    ],
  },
  {
    title: "登場人物",
    sample: { slot: "actors", flow: ['  - Client -> API: "要求"'] },
    lines: [
      { code: "  - Client", note: "名前だけ" },
      { code: "  - API: service", note: "種類" },
      { code: '  - Web: service "APIサーバー"', note: "種類と補足" },
      { code: "  - DB: database 失敗", note: "種類と色" },
      { code: '  - LB: cloud "振り分け" 警告', note: "並べる順番は自由" },
      { code: "  - 決済: 失敗", note: "色だけ" },
      { code: '  - 表: storage ["id: PK", "name: 文字列"]', note: "行を持つ箱" },
      { code: "  - 保存: s3", note: "固有名でも書ける (storage になる)" },
      // 値は箱に出して初めて見える。 書き方を「値」 の節と離さない
      { code: '  - 受付: actor "待ち行列" "{waiting}"', note: "2 つ目の引用符が値の欄 ({名前} で読む)" },
    ],
  },
  {
    title: "項目が多い時",
    sample: { slot: "actors", actors: ["  - Client"], flow: ['  - Client -> Web: "要求"'] },
    lines: [
      { code: "  - Web:", note: "名前だけ書いて改行" },
      { code: "      kind: service", note: "項目を縦に並べる" },
      { code: '      補足: "APIサーバー"', note: "日本語の項目名でもよい" },
      { code: "      色: 失敗", note: "色は 色: にまとめた" },
    ],
  },
  {
    title: "パーツ",
    // 自分へ戻る矢印は描けない (#1227)。 例文が使うと、記法一覧が描けない形を教えることになる
    sample: { slot: "actors", actors: ["  - Client", "  - API"], flow: ['  - Client -> API: "動く"'] },
    lines: [
      { code: "  - 時計: alarm-clock", note: "パーツの名前を種類に書く" },
      { code: "  - 実績:", note: "変えられる値があれば縦に並ぶ" },
      { code: "      kind: achievement", note: "" },
      { code: "      倍率: 2", note: "パーツだけを大きくする" },
      { code: '      色: "#f59e0b"', note: "色を変えたい時はここを書き換える" },
    ],
  },
  {
    title: "流れ",
    sample: { slot: "flow", actors: ["  - Client", "  - API", "  - DB"] },
    lines: [
      { code: '  - Client -> API: "要求"', note: "矢印と説明" },
      { code: '  - API -> DB: "検索" 成功', note: "矢印の色" },
      { code: '  - DB -> API: "結果" 成功 dotted-flow', note: "色と線の種類" },
    ],
  },
  {
    // 節の題に記法の項目名を出す。 中身は字下げした行なので、どの節の下に書くのかが
    // 題からしか分からない
    title: "値 (states:)",
    // 値は箱に出して初めて意味がある。 例文の箱に `{名前}` を置いて、出るところまで見せる
    sample: {
      slot: "states",
      actors: ['  - 受付: "待ち行列" "{inflow}"', "  - 処理"],
      flow: ['  - 受付 -> 処理: "渡す"'],
    },
    lines: [
      { code: "  inflow: 10", note: "名前は英数字と _ だけ" },
      { code: "  done: 4", note: "数でも文字列でもよい" },
    ],
  },
  {
    title: "値どうしの関係 (values:)",
    sample: {
      slot: "values",
      actors: ['  - 受付: "待ち行列" "{waiting}"', "  - 処理"],
      flow: ['  - 受付 -> 処理: "渡す"'],
      states: ["  inflow: 10", "  done: 4"],
    },
    lines: [
      { code: '  waiting: "{inflow} - {done}"', note: "四則 + 括弧。 参照は {名前}" },
      { code: '  busy: "{waiting} > 80"', note: "比較は 真 = 1 / 偽 = 0" },
      { code: '  peak: "max({waiting}, 50)"', note: "min / max が書ける" },
    ],
  },
  {
    title: "動き (図種により必須)",
    sample: {
      slot: "animation",
      actors: ["  - Client", "  - API"],
      flow: ['  - Client -> API: "要求"'],
    },
    lines: [
      { code: '  - step: "呼ぶ" 1.4s', note: "1 段の長さ" },
      { code: "    focus: [Client, API]", note: "その段で光らせる" },
    ],
  },
  {
    title: "位置と大きさ",
    sample: { slot: "actors", actors: ["  - Client"], flow: ['  - Client -> Web: "要求"'] },
    lines: [
      { code: "  - Web: service @300,200", note: "位置。 書かなければ自動で決まる" },
      { code: "  - DB:", note: "縦に並べる時は" },
      { code: "      位置: 300,400", note: "左からの距離, 上からの距離" },
      { code: "      大きさ: 400,180", note: "幅, 高さ" },
    ],
  },
  {
    title: "他の箱を基準に置く",
    // 縦の相対は順序図では効かない (縦列は横に並ぶもの)。 4 向きが全て効く図種で例を組む
    sample: { slot: "actors", type: "flow", actors: ["  - Web: service"], flow: ['  - Web -> API: "要求"'] },
    lines: [
      { code: "  - API:", note: "座標を知らなくても置ける" },
      { code: "      位置: Web の右", note: "向きは 右 左 上 下" },
      { code: "  - 決済:", note: "" },
      { code: "      位置: Web の下 200", note: "数を書くとその分だけ離す" },
      { code: "  - 監視:", note: "" },
      { code: "      位置: Web left 200", note: "英語でも書ける" },
    ],
  },
  {
    title: "図全体",
    sample: { slot: "root", actors: ["  - Client", "  - API"], flow: ['  - Client -> API: "要求"'] },
    lines: [
      { code: "viewport: { scale: 1.5 }", note: "図全体の倍率" },
      { code: "viewport: { laneWidth: 400 }", note: "縦列の幅" },
    ],
  },
  {
    // 工程の並びだけが持つ欄。 他の図種で書くと組み立て側が知らせる (#1251)
    title: "工程の並びの欄 (owner: / end:)",
    sample: {
      slot: "actors",
      type: "gantt",
    },
    lines: [
      { code: '  - 設計: { value: "Q1", owner: "デザイナー" }', note: "担当" },
      { code: '  - 実装: { value: "Q2", end: "Q3" }', note: "終わる時期。 帯が 2 コマになる" },
      { code: '  - 検証: { value: "Q3", end: "{done}" }', note: "状態から取ると段で伸び縮みする" },
    ],
  },
  {
    // 2 つの軸で仕分ける図だけが持つ。 他の図種で書くと組み立て側が知らせる (#1251)
    title: "軸の名前 (axes:)",
    sample: {
      slot: "root",
      type: "quadrant",
      actors: ['  - 重複削除: "左上"', '  - 型を直す: "右上"'],
    },
    lines: [
      { code: "axes:", note: "2 つの軸に名前を付ける" },
      { code: '  x: { left: "手間 小", right: "手間 大" }', note: "横の軸" },
      { code: '  y: { bottom: "効き 小", top: "効き 大" }', note: "縦の軸。 区画の名前は軸から決まる" },
    ],
  },
  {
    // 体験の道筋の段だけが持つ欄。 他の図種で書くと組み立て側が知らせる (#1251)
    title: "体験の道筋の欄 (touchpoint: / opportunity:)",
    sample: {
      slot: "actors",
      type: "journey",
    },
    lines: [
      { code: '  - 登録: { value: "不満", touchpoint: "申込み画面" }', note: "どこで起きたか" },
      { code: '  - 決済: { value: "普通", opportunity: "入力を減らす" }', note: "何を直せるか" },
    ],
  },
  {
    // 図表は箱を 1 つしか作らないため、 上の小見出しの相手が決まる。 箱ごとに分かれる図種で
    // 書くと組み立て側が知らせる (#1247)
    title: "図表の上の小見出し (eyebrow:)",
    sample: {
      slot: "root",
      type: "bar",
      actors: ['  - 検索: "420"', '  - SNS: "310"'],
    },
    lines: [{ code: 'eyebrow: "棒グラフ"', note: "図表の箱の上に出す。 箱ごとに分かれる図種では書けない" }],
  },
  {
    // 縦列と囲みは `topology` / `swimlane` で使う。 一覧に無いと、記法にあることすら伝わらない
    title: "縦列と囲み (lanes: / groups:)",
    sample: {
      slot: "root",
      type: "topology",
      actors: ["  - Web: service", "  - DB: database"],
      flow: ['  - Web -> DB: "問い合わせ"'],
    },
    lines: [
      { code: "lanes:", note: "縦列の位置と幅を決める" },
      { code: '  front: { x: 0, width: 360, label: "表" }', note: "id: { x, width, label }" },
      { code: "groups:", note: "縦列をまとめて囲む" },
      { code: '  aws: { label: "AWS", lanes: [front] }', note: "id: { label, lanes: [...] }" },
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
  const rootLines = slot === "root" ? codes : [];
  // 題名と図種は例文に必ず要る。 一覧側で書いている時は重ねて書かない (後に書いた方が効く)
  const head = [
    ...(rootLines.some((l) => /^title\s*:/.test(l)) ? [] : ['title: "見本"']),
    ...(rootLines.some((l) => /^type\s*:/.test(l)) ? [] : [`type: ${section.sample.type ?? "sequence"}`]),
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
  if (slot === "animation") out.push("animation:", ...codes);
  return `${out.join("\n")}\n`;
}
