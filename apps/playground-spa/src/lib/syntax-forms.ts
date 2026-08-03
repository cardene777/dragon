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
export type SampleSlot = "root" | "actors" | "flow" | "animation";

export type Section = {
  title: string;
  /**
   * 例文の組み立て方。
   *
   * `slot` = 表示する行を置く場所。 `actors` / `flow` = 例文を成立させるために足りない分。
   * 行だけでは図にならない (基準にする相手が要る等) ため、 補いを持たせる。
   */
  sample: {
    slot: SampleSlot;
    type?: string;
    actors?: string[];
    flow?: string[];
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
    sample: { slot: "actors", actors: ["  - Client"], flow: ['  - Client -> Client: "動く"'] },
    lines: [
      { code: "  - 時計: alarm-clock", note: "パーツの名前を種類に書く" },
      { code: "  - 実績:", note: "変えられる値があれば縦に並ぶ" },
      { code: "      kind: achievement", note: "" },
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
];

/**
 * 一覧の行から、 実際に図にできる例文を組む。
 *
 * 表示する行をそのまま使う。 test 用に別の例文を書くと、 一覧の行が動かなくなっても
 * test は通ってしまう。
 */
export function buildSample(section: Section): string {
  const { slot, actors = [], flow = [] } = section.sample;
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
  if (slot === "animation") out.push("animation:", ...codes);
  return `${out.join("\n")}\n`;
}
