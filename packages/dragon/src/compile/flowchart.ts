import { flowchart } from "@cardenelabs/cdl";
import type { CdlDiagram } from "@cardenelabs/cdl";
import type { DslActor, DslDocument } from "../types";
import { 箱の題 } from "./node-title";
import { 縦列ごとの段を決める, 書いた縦列に置く } from "./lanes";
import { slugify } from "./slug";
/**
 * 記法の `type: flowchart` を分かれ道の図に直す (#2513)。
 *
 * 一覧には「フローチャート」 の見本が並び、描画の library にも `flowchart()` が在り、
 * dragon の案内表にも「フローチャート」 が載っていた。 **記法だけが受理していなかった**ので、
 * 一覧で見た図を同じ名前で書けなかった。
 *
 * 縦列は役割を分ける入れ物で、箱はその中に置く。 `swimlane` は登場人物 1 人が縦列 1 本に
 * なるが、こちらは **登場人物が箱で、その `lane:` が役割の名前になる**。 分かれ道の図は
 * 1 人の役割の中に複数の箱 (申請を出す / 直して出し直す) が並ぶため。
 */

/**
 * 記法の箱の種類を、描画側の分かれ道の箱の形へ読み替える。
 *
 * 描画側が受ける形は 5 つ (`process` / `decision` / `start` / `end` / `loop`)。
 * 記法の側に 4 つ分の種類が在り、残る 1 つは書かない時の既定になる。
 *
 * | 記法に書く種類 | 描く形 | なぜ |
 * |---|---|---|
 * | `decision` | `decision` | 同じ名前がそのまま描画側にもある |
 * | `mark-start` | `start` | 始まりの印 |
 * | `mark-end` | `end` | 終わりの印 |
 * | `loop` | `loop` | 終わりまで繰り返す箱 (#2523) |
 * | それ以外 / 書かない | `process` | 普通の手順の箱 |
 *
 * **始まりと終わりの印は題を持たない**。 この決まりは `箱の題` が 15 図種と共有しており
 * (#1466)、 塗った丸に字を載せる場所が無いため。 題を出したい時は `title:` を書けば使われる
 * ので、黙って消える形ではない = ここで別の知らせを足さない。
 *
 * **`loop` は記法の種類として足した** (#2523)。 描画側は繰り返しを **形** としてだけ持ち、
 * 箱の種類 (`NODE_KINDS` の 98 件) には持たない。 そのまま書くと部品の名前として扱われ、
 * 「そんな部品は無い」 と言われるだけだった (実測)。
 * 記法だけが持つ種類 (`DSL_ONLY_KINDS`) に置き、ここで形へ読み替える。
 * 分かれ道の図以外で書いた時は `記法だけの種類の読み替え` が札に落とす。
 */
const 分かれ道の箱の形 = {
  decision: "decision",
  "mark-start": "start",
  "mark-end": "end",
  loop: "loop",
} as const;

type 分かれ道の形 = "process" | "decision" | "start" | "end" | "loop";

function 箱の形(actor: DslActor): 分かれ道の形 {
  const kind = actor.kind;
  if (kind !== undefined && kind in 分かれ道の箱の形) {
    return 分かれ道の箱の形[kind as keyof typeof 分かれ道の箱の形];
  }
  return "process";
}

/**
 * 縦列の名前を書いた順に並べる。
 *
 * **`lane:` を 1 つも書かない図でも描けるようにする**。 その時は縦列 1 本に全部入れる =
 * 分かれ道そのもの (判断と枝) は縦列が無くても成立するため、役割を分けたくない人に
 * `lane:` を強制しない。
 *
 * 書いた人と書かない人が混ざった図は、書かない箱を最初の縦列へ入れる。 行き先の規則が
 * 要る形だが、`swimlane` の混在と違ってこちらは **箱が縦列そのものではない** ので、
 * 入れ先が無いと箱を 1 つも置けない。
 *
 * **箱が 1 つも無い図では縦列も作らない**。 受け皿の縦列だけを置くと、中身の無い枠が
 * 図に残る (実測 = 登場人物 0 人の図で枠が 1 本だけ描かれた)。
 */
function 縦列の並び(doc: DslDocument): string[] {
  const 並び: string[] = [];
  for (const a of doc.actors) {
    const name = a.lane;
    if (name === undefined || name === "") continue;
    if (!並び.includes(name)) 並び.push(name);
  }
  if (並び.length > 0) return 並び;
  return doc.actors.length > 0 ? ["本流"] : [];
}

export function compileFlowchart(doc: DslDocument): CdlDiagram {
  const lanes = 縦列の並び(doc);
  const 既定の縦列 = lanes[0];

  const fc = flowchart({
    id: slugify(doc.title),
    topic: doc.title,
    lanes,
  });

  /*
   * 箱の id は名前から作る。 **重なったら並び順を足して分ける**。
   *
   * `slugify` は残せる字が 1 つも無い名前に `n` を返すため、記号だけの名前 (`***` / `---`)
   * が 2 つあると同じ id になる。 記号の位置だけが違う名前 (`A-B` と `A/B`) も同じになる。
   * 重なると後から置いた箱が前の箱を上書きし、矢印が別の箱へ向かう。
   */
  const 使ったid = new Set<string>();
  const idOf = (a: DslActor, i: number): string => {
    const 元 = slugify(a.name);
    if (!使ったid.has(元)) return 元;
    let 候補 = `${元}-${i}`;
    for (let k = i; 使ったid.has(候補); k++) 候補 = `${元}-${k + 1}`;
    return 候補;
  };
  const id一覧 = new Map<string, string>();
  /** 箱ごとに決まった id を書いた順で持つ。 決め直すと重なりの回避が二度効いて別の id になる */
  const 決めたid: string[] = [];

  doc.actors.forEach((a, i) => {
    const id = idOf(a, i);
    使ったid.add(id);
    決めたid.push(id);
    id一覧.set(a.name, id);
    fc.node({
      id,
      title: 箱の題(a),
      shape: 箱の形(a),
      lane: a.lane !== undefined && a.lane !== "" ? a.lane : (既定の縦列 ?? ""),
    });
  });

  for (const s of doc.flow) {
    const from = id一覧.get(s.from);
    const to = id一覧.get(s.to);
    // 箱に無い名前を指した矢印は引かない。 描画側は知らない id の位置を引けずに落ちる
    if (from === undefined || to === undefined) continue;
    fc.edge({
      from,
      to,
      ...(s.label !== undefined && s.label !== "" ? { label: s.label } : {}),
    });
  }

  const diagram = fc.build();
  const 箱の一覧 = new Map(diagram.nodes.map((n) => [n.id, n]));

  /*
   * 形に読み替えなかった種類は、箱の見た目としてそのまま渡す。
   *
   * 描画側は形を箱の種類で表す (判断 = `card`、 印 = `event`、 手順 = `function`)。 その 3 つに
   * 当たらない種類 (`database` / `service` 等) を捨てると、書いた人には手順の箱しか出ない。
   * 残る図種では同じ書き方が箱の見た目になるので、ここだけ黙って消える形になっていた。
   *
   * **書いた箱だけを渡す** (`kindWritten`)。 記法は種類を書かない箱にも既定の `actor` を
   * 入れるため、見ずに渡すと手順の箱が 1 つ残らず既定で塗り潰される (実測 = 7 箱の図で
   * 手順の箱 4 つが描画側の `function` から `actor` へ変わった)。
   */
  doc.actors.forEach((a, i) => {
    if (a.kindWritten !== true) return;
    if (a.kind === undefined || a.kind in 分かれ道の箱の形) return;
    const node = 箱の一覧.get(決めたid[i] ?? "");
    if (node !== undefined) node.kind = a.kind as typeof node.kind;
  });

  /*
   * 段は **箱を並べる図種すべてと同じ決め方** に従う (`縦列ごとの段を決める`)。
   *
   * 描画側は書いた順に 0 から詰めるため、書いた番号がそのまま消える。 全ての箱に縦列を
   * 書いた図でだけ効かせるのは、縦列を書かない箱の段は残る図種でも効かないため = ここだけ
   * 効かせると、効かないと伝える知らせのほうが誤りになる。
   */
  if (書いた縦列に置く("flowchart", doc)) {
    const 段 = 縦列ごとの段を決める(doc.actors);
    doc.actors.forEach((a, i) => {
      const v = 段.get(a);
      if (v === undefined) return;
      const node = 箱の一覧.get(決めたid[i] ?? "");
      if (node !== undefined) node.stack = v;
    });
  }

  /*
   * 段を書いた図では、描画側が自分で作った段を捨てる。
   *
   * 描画側の `flowchart()` は「全部を一度に光らせる」 段を 1 つ必ず作る。 それが残っていると
   * 組み立ての後段 (`injectPhasesFallback`) が「段は既に在る」 と見て、書いた `animation:` を
   * 1 段も入れない = 書いた `focus:` が黙って消える (実測 = 3 箱の図で `focus: [あ]` を書いても
   * 3 箱とも光った)。
   *
   * 捨てるのは書いた時だけ。 書いていない図では描画側の段がそのまま既定の見せ方になる。
   */
  if ((doc.animate?.phases.length ?? 0) > 0) diagram.phases = [];

  return diagram;
}
