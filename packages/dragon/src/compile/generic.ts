import { diagram } from "@cardenelabs/cdl";
import type { CdlDiagram, CdlEdge, NodeKind, Tone } from "@cardenelabs/cdl";
import { parseFocusEntry } from "../focus";
import type { DslDocument, DslPhase, DslStep } from "../types";
import { 始まりと終わりの決め方 } from "./actors";
import { 並べる向き, 後ろへ戻る矢印か, type GenericKind } from "./direction";
import { 描ける種別 } from "./kinds";
import { 縦列ごとの段を決める, 書いた縦列に置く } from "./lanes";
import { metroMarkFrameSize, placeMetro } from "./metro";
import { 箱の題 } from "./node-title";
import { slugify } from "./slug";
import {
  placeStages,
  STAGE_CARD_HEIGHT,
  STAGE_CARD_PITCH,
  STAGE_CARD_WIDTH,
  STAGE_FIRST_CARD_CENTER_Y,
  STAGE_LANE_GAP,
  STAGE_LANE_Y,
  段の箱の線の指定,
  type StagesPlacement,
} from "./stages";
import { 泳法図で印をどう描く } from "./swimlane-marks";
import {
  classifyTimelineEdge,
  placeTimeline,
  TIMELINE_AXIS_WIDTH,
  TIMELINE_CARD_HEIGHT,
  TIMELINE_DECISION_HEIGHT,
  TIMELINE_DECISION_WIDTH,
  TIMELINE_END_HEIGHT,
  TIMELINE_END_WIDTH,
  TIMELINE_NUMBER_SIZE,
} from "./timeline";

/** 時間軸の 40px 高の札を、横線から 20px 空けて上へ置く。 */
const 時間軸の横分岐の札の上げ幅 = -(40 / 2 + 20);

/**
 * 段を持つ図種の共通の組み立て (#2030 で `compile.ts` から移した)。
 *
 * `flow` / `swimlane` / `record` / `topology` の 4 図種が通る。 `record` は段を書かない図も
 * ここを通る (経路が 1 本なので、#2782)。
 */

export type GenericOpts = {
  kind: GenericKind;
  /** flow / topology は 1 lane に全 actor、 swimlane / record は actor ごと lane */
  laneId?: string;
  laneWidth: number;
  /** 図種固有の関係を、共通の edge に渡す既定値へ直す。本文に明記した値は後段で勝つ。 */
  edgeDefaults?: (step: DslStep) => Partial<CdlEdge>;
};

/**
 * 分かれ道から続く線と駅の色を返す。
 *
 * 枝の意味を表す明示の欄は無いため、読み手が追う flow の記述順を使い、1 本目を「はい」、
 * 2 本目以降を「いいえ」とする。枝の先も同じ結果の道筋なので色を引き継ぐ。
 * 分かれ道より手前へ戻る線にも色は付けるが、そこで止める = 戻った本線まで枝色にしない。
 */
function metroBranchTones(doc: DslDocument): {
  edgeToneByIndex: Map<number, Tone>;
  nodeToneByName: Map<string, Tone>;
} {
  const edgeToneByIndex = new Map<number, Tone>();
  const nodeToneByName = new Map<string, Tone>();
  const actorByName = new Map(doc.actors.map((actor) => [actor.name, actor]));
  const actorIndex = new Map(doc.actors.map((actor, index) => [actor.name, index]));
  const outgoing = new Map<string, number[]>();
  doc.flow.forEach((step, index) => {
    const indexes = outgoing.get(step.from) ?? [];
    indexes.push(index);
    outgoing.set(step.from, indexes);
  });

  doc.actors.forEach((decision, decisionIndex) => {
    if (decision.kind !== "decision") return;
    const branches = outgoing.get(decision.name) ?? [];
    branches.forEach((branchEdgeIndex, branchIndex) => {
      const tone: Tone = branchIndex === 0 ? "success" : "error";
      const follow = (edgeIndex: number): void => {
        // 合流した道筋は、flow に先に書いた枝の色を保つ。
        if (edgeToneByIndex.has(edgeIndex)) return;
        edgeToneByIndex.set(edgeIndex, tone);
        const targetName = doc.flow[edgeIndex]?.to;
        if (targetName === undefined) return;
        const target = actorByName.get(targetName);
        const targetIndex = actorIndex.get(targetName);
        if (target === undefined || targetIndex === undefined) return;
        if (
          targetIndex > decisionIndex &&
          target.kind !== "decision" &&
          target.kind !== "mark-start" &&
          target.kind !== "mark-end" &&
          !nodeToneByName.has(targetName)
        ) {
          nodeToneByName.set(targetName, tone);
        }
        if (targetIndex <= decisionIndex || target.kind === "decision") return;
        for (const nextEdgeIndex of outgoing.get(targetName) ?? []) follow(nextEdgeIndex);
      };
      follow(branchEdgeIndex);
    });
  });

  return { edgeToneByIndex, nodeToneByName };
}

/**
 * この共通の組み立てへ回すか (#2348)。
 *
 * **条件を 1 箇所に集める**。 図種ごとの入口が同じ条件を手で並べていた間、
 * 「縦列を書いた形」 が 2 図種 (状態の図 / 表の図) で抜け落ちていた =
 * 動きを書かない図では、書いた縦列に箱が入らず、代わりに箱ごとの縦列が作られ、
 * 「どの箱も入らない縦列です」 という **事実と逆の知らせ** だけが出ていた。
 * その 2 図種は #2782 で `record` に畳み、経路を 1 本にしたのでここを通らない。
 *
 * 2 つの条件はどちらも「静止図の経路が持っていない並べ方を書いた」 ことを意味する。
 * 静止図の経路は並びを固定で持つため、通すと書いた指定が黙って消える (#1263)。
 *
 * `図種ごとの理由` はその図種にしか無い条件 (泳法図の向き) を渡す。
 * フローは `鎖でつなぐ形か` が同じ判定を内側に持つため、ここは通らない。
 */
export function 共通の組み立てへ回す(
  kind: GenericKind,
  doc: DslDocument,
  図種ごとの理由 = false,
): boolean {
  if (doc.animate !== undefined && doc.animate.phases.length > 0) return true;
  if (書いた縦列に置く(kind, doc)) return true;
  return 図種ごとの理由;
}

/**
 * v0.4 ... 5 preset (flow / swimlane / er / state / topology) 共通 animation compile。
 * sequence preset と異なり header / footer / step box 構造はない、 シンプルな lane + node + edge 構造。
 * preset kind ごとに lane 配置と layout を切替。
 */
export function compileGenericWithAnimate(doc: DslDocument, opts: GenericOpts): CdlDiagram {
  const { kind, laneWidth } = opts;
  const b = diagram(slugify(doc.title), { topic: doc.title, type: kind });

  /*
   * 行を持つ図で、書かなかった時の既定 (#2352 / #2782)。
   *
   * **行を書いた箱は表の箱 (`storage`)、書かない箱は札 (`card`)**。 畳む前は図種で
   * 決めており (移り変わりの図は札、表の図は書かないと人の形)、同じ本文でも動きの段を
   * 1 つ足すだけで箱が札の形から人の形に変わっていた。
   *
   * 書いた種類はそのまま通す。 **書いたかどうかは `kindWritten` で見る** = 書かなかった箱の
   * `kind` には既定の `actor` が入るので、値だけでは「`actor` と書いた」 と「書かなかった」 を
   * 分けられない。
   */
  const 箱の種類 = (a: (typeof doc.actors)[number]): NodeKind => {
    // 段の箱は札で固定するのでここを通らない。路線図と時間軸の印は書いた種類で描く
    if (泳法図で印をどう描く(doc, a) === "描く") return 描ける種別(a.kind);
    if (kind !== "record" || a.kindWritten === true) return 描ける種別(a.kind);
    return (a.rows?.length ?? 0) > 0 ? "storage" : "card";
  };

  /*
   * 始まりと終わりと途中の札 (#2349 / #2352)。
   *
   * **並べ方の分岐ごとに書かない**。 3 つある並べ方のうち 1 つにしか札の処理が無く、
   * 縦列を書いた状態の図では `initial: true` を書いても札が 1 つも出なかった
   * (知らせも無い = 縦列を足しただけで別の意味の図になっていた)。
   *
   * 札を出すのは状態の図だけ。 どの箱が始まり / 終わりかは `始まりと終わりの決め方` が
   * 1 箇所で決める。 **書いた値はどの並べ方でも効き**、1 つも書いていない時の既定
   * (並びの最初と最後) は、並びが意味を持つ並べ方でだけ効く。
   *
   * **札を出すのは既定の形の箱だけ** (#2352)。 印の箱 (`mark-start` / `mark-end`) は
   * 形そのものが始点と終点を表すので、字を重ねると同じことを 2 度言う
   * (実測 = #2349 で既定を無条件に配った時、印の箱に「初期」 の字が出て見本が壊れた)。
   */
  /*
   * **並びで決める既定を使わない** (#2782)。 書いた値だけを見る。
   *
   * 並びから推し量ると、1 つだけ書いた図でもう片方が勝手に決まる
   * (実測 = 真ん中の箱に始まりを書いた図で、最後の箱に「最終」 が出た)。
   */
  const 決め方 = 始まりと終わりの決め方(doc, { 並びで決める: false });
  /*
   * 始まりと終わりの札 (#2349 / #2352 / #2782)。
   *
   * **書いた箱にだけ出す**。 畳む前は移り変わりの図だけが札を出し、1 つも書かない図では
   * 並びの最初と最後を始まり / 終わりとみなし、残りの箱に「状態」 の字を配っていた。
   * 畳んだ後も同じ形にすると、行を並べた表の箱に「状態」 の字が出る = 書いた人が
   * 言っていないことを図が名乗る。
   *
   * **札を出すのは札の形の箱だけ**。 印の箱 (`mark-start` / `mark-end`) は形そのものが
   * 始点と終点を表すので、字を重ねると同じことを 2 度言う。
   */
  const 札 = (a: (typeof doc.actors)[number], idx: number): { eyebrow?: string } => {
    if (kind !== "record") return {};
    if (箱の種類(a) !== "card") return {};
    if (決め方.始まり(a, idx)) return { eyebrow: "初期" };
    if (決め方.終わり(a, idx)) return { eyebrow: "最終" };
    return {};
  };

  // lane / node 配置 ... preset kind に応じて切替
  const actorToNodeId = new Map<string, string>();
  const 段階ごとの箱か = kind === "swimlane" && doc.shape === "stages";
  const 路線図か = kind === "swimlane" && doc.shape === "metro";
  const 時間軸か = kind === "swimlane" && doc.shape === "timeline";
  const 路線図の色 = 路線図か ? metroBranchTones(doc) : undefined;
  let timelineActorIndex: Map<string, number> | undefined;
  let timelineNumberIdByCardId: Map<string, string> | undefined;
  let stagesPlacement: StagesPlacement | undefined;
  if (時間軸か) {
    const numberIdByCardId = new Map<string, string>();
    timelineNumberIdByCardId = numberIdByCardId;
    const actorsByName = new Map(doc.actors.map((actor) => [actor.name, actor]));
    const numberToneByActorName = new Map(
      doc.flow.flatMap((edge) =>
        actorsByName.get(edge.from)?.kind === "decision" && edge.tone !== undefined
          ? [[edge.to, edge.tone] as const]
          : []),
    );
    const 軸に置く段 = new Set(
      doc.actors
        .filter((actor) => 泳法図で印をどう描く(doc, actor) === "描く")
        .map((actor) => actor.name),
    );
    const placement = placeTimeline(doc, 軸に置く段);
    const timelineStageByName = new Map<string, number>();
    timelineActorIndex = timelineStageByName;
    doc.actors.forEach((actor, index) => {
      const step = placement.steps[index];
      if (step === undefined) throw new Error(`時間軸の段 "${actor.name}" の配置がありません`);
      timelineStageByName.set(actor.name, step.stage);
    });
    b.lane("timeline-axis", {
      width: TIMELINE_AXIS_WIDTH,
      role: "overlay",
      timelineAxis: true,
      posX: placement.axisX - TIMELINE_AXIS_WIDTH / 2,
      posY: 0,
      posW: TIMELINE_AXIS_WIDTH,
      posH: placement.axisHeight,
    });
    b.lane("timeline-steps", {
      width: placement.width,
      role: "overlay",
      posX: 0,
      posY: 0,
      posW: placement.width,
      posH: placement.stepsHeight,
    });
    doc.actors.forEach((actor, index) => {
      const step = placement.steps[index];
      if (step === undefined) throw new Error(`時間軸の段 "${actor.name}" の配置がありません`);
      actorToNodeId.set(actor.name, step.cardId);
      if (泳法図で印をどう描く(doc, actor) === "描く") {
        const markSize = actor.kind === "decision"
          ? { w: TIMELINE_DECISION_WIDTH, h: TIMELINE_DECISION_HEIGHT }
          : actor.kind === "mark-end"
            ? { w: TIMELINE_END_WIDTH, h: TIMELINE_END_HEIGHT }
            : {};
        b.node(step.cardId, {
          lane: "timeline-axis",
          stack: index,
          kind: 箱の種類(actor),
          title: 箱の題(actor),
          ...(actor.subtitlePlacement !== undefined
            ? { subtitlePlacement: actor.subtitlePlacement }
            : {}),
          ...markSize,
          posX: placement.axisX,
          posY: step.y,
        });
        return;
      }
      const numberId = step.numberId;
      if (numberId !== undefined) {
        numberIdByCardId.set(step.cardId, numberId);
        const numberTone = numberToneByActorName.get(actor.name);
        b.node(numberId, {
          lane: "timeline-axis",
          stack: index,
          kind: "timeline-number",
          title: String(numberIdByCardId.size),
          w: TIMELINE_NUMBER_SIZE,
          h: TIMELINE_NUMBER_SIZE,
          ...(numberTone !== undefined ? { tone: numberTone } : {}),
          posX: placement.axisX,
          posY: step.y,
        });
      }
      b.node(step.cardId, {
        lane: "timeline-steps",
        stack: index,
        kind: "card",
        title: 箱の題(actor),
        ...(actor.lane !== undefined
          ? { subtitle: doc.lanes?.[actor.lane]?.label ?? actor.lane }
          : {}),
        ...(actor.subtitlePlacement !== undefined
          ? { subtitlePlacement: actor.subtitlePlacement }
          : {}),
        ...(numberId !== undefined ? { leaderTo: numberId } : {}),
        w: step.cardWidth,
        h: TIMELINE_CARD_HEIGHT,
        posX: step.cardX,
        posY: step.y,
      });
    });
  } else if (路線図か) {
    const placement = placeMetro(doc);
    for (const track of placement.tracks) {
      b.lane(track.id, {
        width: placement.width,
        label: track.label,
        metro: track.subtitle === undefined ? {} : { subtitle: track.subtitle },
        posX: track.posX,
        posY: track.posY,
        posW: track.posW,
        posH: track.posH,
      });
    }
    doc.actors.forEach((actor, index) => {
      const station = placement.stations[index]!;
      const id = slugify(actor.name) || `n${index}`;
      const markFrameSize = metroMarkFrameSize(actor.kind);
      actorToNodeId.set(actor.name, id);
      b.node(id, {
        lane: station.trackId,
        stack: index,
        kind: 泳法図で印をどう描く(doc, actor) === "描く" ? 箱の種類(actor) : "station",
        title: 箱の題(actor),
        ...(actor.stationNamePosition !== undefined
          ? { stationNamePosition: actor.stationNamePosition }
          : {}),
        ...(路線図の色?.nodeToneByName.get(actor.name) !== undefined
          ? { tone: 路線図の色.nodeToneByName.get(actor.name) }
          : {}),
        ...(markFrameSize === undefined ? {} : { w: markFrameSize, h: markFrameSize }),
        posX: station.posX,
        posY: station.posY,
      });
    });
  } else if (段階ごとの箱か) {
    /*
     * 段階ごとに同じ高さの列を左から並べ、その中へ札を積む (#2797 / #2831)。
     *
     * 列の見出し (`段階 N` と段階の名前) と、札の右の担当は描く側が描く。
     * 列と札の決め方は `placeStages` が持ち、静止図と動く図を同じ配置に揃える。
     * 種類は札 (`card`) で固定する = 札の右の字は描く側が `card` にだけ描く。
     */
    const placement = placeStages(doc);
    stagesPlacement = placement;
    const lastStack = Math.max(0, ...[...placement.cards.values()].map((card) => card.stack));
    const stageLaneHeight =
      STAGE_FIRST_CARD_CENTER_Y + lastStack * STAGE_CARD_PITCH + STAGE_CARD_HEIGHT / 2;
    for (const [columnIndex, column] of placement.columns.entries()) {
      b.lane(column.id, {
        width: laneWidth,
        // cdl は段階列の面の間を 48 取る。見本の 64 にするため、
        // lane 自体の間に残りの 16 を書き、描画側の列幅は変えない。
        posX: columnIndex * (laneWidth + STAGE_LANE_GAP),
        posY: STAGE_LANE_Y,
        posW: laneWidth,
        posH: stageLaneHeight,
        stage: {
          number: column.number,
          name: column.name,
          ...(doc.theme !== undefined && doc.stageHeaders?.[doc.theme] !== undefined
            ? { header: doc.stageHeaders[doc.theme] }
            : {}),
        },
      });
    }
    doc.actors.forEach((a, idx) => {
      const id = slugify(a.name) || `n${idx}`;
      actorToNodeId.set(a.name, id);
      const card = placement.cards.get(a.name);
      if (card === undefined) throw new Error(`段の箱の "${a.name}" を置く列がありません`);
      b.node(id, {
        lane: card.columnId,
        stack: card.stack,
        w: STAGE_CARD_WIDTH,
        h: STAGE_CARD_HEIGHT,
        posX: card.column * (laneWidth + STAGE_LANE_GAP) + laneWidth / 2,
        posY: STAGE_FIRST_CARD_CENTER_Y + card.stack * STAGE_CARD_PITCH,
        kind: "card",
        title: 箱の題(a),
        ...(card.subtitle === undefined ? {} : { subtitle: card.subtitle }),
      });
    });
  } else if (書いた縦列に置く(kind, doc)) {
    /*
     * **書いた縦列に置く** (#1263)。 縦列を並べるための入れ物として使う図種でだけ効く。
     *
     * 縦列の並びは **`lanes:` に書いた順** を優先する (#1394)。 箱が最初に使った順で
     * 並べていた間、`lanes:` で左から順に宣言しても箱の書き順で入れ替わっていた
     * (実測 = 中心を先に書いた放射の図で、左端の縦列が中心の右へ回った)。
     *
     * `lanes:` に無い縦列は、これまでどおり箱が使った順で後ろに続ける。
     */
    const 使った: string[] = [];
    for (const a of doc.actors) {
      const lid = a.lane;
      if (lid !== undefined && !使った.includes(lid)) 使った.push(lid);
    }
    const 書いた順 = doc.lanes ? Object.keys(doc.lanes) : [];
    const 並び = [
      ...書いた順.filter((lid) => 使った.includes(lid)),
      ...使った.filter((lid) => !書いた順.includes(lid)),
    ];
    for (const lid of 並び) {
      b.lane(lid, { width: laneWidth, ...(kind === "topology" ? { contain: true } : {}) });
    }
    // 段の決め方は `縦列ごとの段を決める` が持つ (#1394 / #2396)。
    // 箱を並べる図種すべてが同じ決め方を使う = 2 か所に置くと片方だけ直した日に食い違う
    const 段 = 縦列ごとの段を決める(doc.actors);
    doc.actors.forEach((a, idx) => {
      const id = slugify(a.name) || `n${idx}`;
      actorToNodeId.set(a.name, id);
      const lid = a.lane!;
      b.node(id, {
        lane: lid,
        stack: 段.get(a) ?? 0,
        kind: 箱の種類(a),
        title: 箱の題(a),
        ...札(a, idx),
      });
    });
  } else if (並べる向き(kind, doc) === "縦") {
    // 1 lane に全 actor を縦 stack
    const lid = opts.laneId ?? "main";
    b.lane(lid, {
      width: laneWidth,
      /*
       * **見出しは自然に縦へ積む図種だけ** (#1494)。
       *
       * `direction: 縦` を書いた泳法図がここへ来るようになった。 その図に題を渡すと、図の題が
       * 縦列の見出しとしてもう 1 度出る (実測 = 「認証の流れ」 が題と見出しの 2 箇所に並んだ)。
       */
      ...(kind === "flow" || kind === "topology" ? { label: doc.title } : {}),
      ...(kind === "topology" ? { contain: true } : {}),
    });
    doc.actors.forEach((a, idx) => {
      const id = slugify(a.name) || `n${idx}`;
      actorToNodeId.set(a.name, id);
      b.node(id, {
        lane: lid,
        stack: idx,
        kind: 箱の種類(a),
        title: 箱の題(a),
        ...札(a, idx),
      });
    });
  } else {
    // actor ごとに 1 lane (横並び)。 `swimlane` / `record` の既定と、
    // `向き: 横` を書いたフローがここに来る (#1494)
    //
    // **見出しを付けるのは `swimlane` だけ** (#1241)。 どちらも箱を 1 つずつ持ち、
    // その箱が既に名前を描く。 縦列にも同じ名前を渡すと **同じ字が縦に 2 つ並ぶ**
    // (実測 = 描いた絵に `Alpha` `Beta` が 2 度出る)。
    //
    // `swimlane` は縦列そのものが「誰の担当か」 を読ませる図なので見出しが要る。
    // `record` の縦列は箱を並べるための入れ物で、読む人に見せる意味を持たない
    // (組立て API 側も見出しを空のまま置く)。
    const 見出しを付ける = kind === "swimlane";
    doc.actors.forEach((a, idx) => {
      const lid = `lane-${slugify(a.name) || idx}`;
      b.lane(lid, { width: laneWidth, ...(見出しを付ける ? { label: a.name } : {}) });
      const id = slugify(a.name) || `n${idx}`;
      actorToNodeId.set(a.name, id);
      b.node(id, {
        lane: lid,
        stack: 0,
        kind: 箱の種類(a),
        title: 箱の題(a),
        ...札(a, idx),
      });
    });
  }

  // edge ... flow の各 step を edge として登録
  //
  // 解決できない名前の矢印は **落とす** (#1209)。 以前は名前をそのまま id として使っており、
  // 存在しない node を指す図ができて描画の直前で落ちていた
  // (実測 = `unknown-ref: edge "e0-v-c" の from "v" が node に存在しません`)。
  // 書いた人には `flow-actor-missing` の知らせが届く。
  // 箱の並び。 後ろへ戻る矢印を見分けるために使う (#1260)
  const 箱の並び = new Map([...actorToNodeId.values()].map((id, i) => [id, i]));
  const edgeIds: string[] = [];
  doc.flow.forEach((s, idx) => {
    // 名前は入口で正規化済 (`canonicalizeFlowActors`)。 ここで slug を受け直すと、
    // 動きを書いていない図の組み立てと扱いが割れる
    const fromId = actorToNodeId.get(s.from);
    const toId = actorToNodeId.get(s.to);
    if (fromId === undefined || toId === undefined) return;
    const edgeId = `e${idx}-${fromId}-${toId}`;
    // 多重度と名前と両端は 1 か所で作る (#2105)。 札に `(1:N)` と添えるだけだった間、
    // 段を持つ図には端の形が 1 つも付かなかった。
    //
    // **端の既定は持たない** (#2591 / #2595 / #2782)。 畳む前は移り変わりの図にだけ
    // 「実線に開いた矢」 を無条件で渡していたが、畳んだ後も渡すと多重度から導いた端を
    // 上から潰す = 箱どうしの個数が消える。 書いた端だけを渡す形に倒す
    const 関係 = opts.edgeDefaults?.(s);
    const timelineEdgeKind = timelineActorIndex !== undefined
      ? classifyTimelineEdge(timelineActorIndex.get(s.from)!, timelineActorIndex.get(s.to)!)
      : undefined;
    const timelineHorizontalBranch = timelineEdgeKind === "branch"
      && timelineActorIndex?.get(s.from) === timelineActorIndex?.get(s.to);
    const edgeFromId =
      timelineEdgeKind === "advance" ? (timelineNumberIdByCardId!.get(fromId) ?? fromId) : fromId;
    const edgeToId =
      timelineEdgeKind === "advance" ? (timelineNumberIdByCardId!.get(toId) ?? toId) : toId;
    const timelineEnd = 時間軸か && doc.actors.find((actor) => actor.name === s.to)?.kind === "mark-end";
    b.edge(edgeFromId, edgeToId, {
      id: edgeId,
      label: 関係?.label ?? s.label,
      ...(関係?.tone !== undefined ? { tone: 関係.tone } : {}),
      ...(関係?.style !== undefined ? { style: 関係.style } : {}),
      ...(路線図の色?.edgeToneByIndex.get(idx) !== undefined
        ? { tone: 路線図の色.edgeToneByIndex.get(idx) }
        : {}),
      ...(timelineEdgeKind === "back"
        ? { routing: "back-detour" as const, fromSide: "right" as const, toSide: "right" as const }
        : 路線図か
        ? { routing: "metro" as const }
        : stagesPlacement !== undefined
          ? 段の箱の線の指定(stagesPlacement, s)
          : 後ろへ戻る矢印か(kind, fromId, toId, 箱の並び, 書いた縦列に置く(kind, doc))
            ? { routing: "back-detour" as const }
            : {}),
      ...(関係?.sub ? { sub: 関係.sub } : {}),
      ...(関係?.head ? { head: 関係.head } : {}),
      ...(関係?.headFill ? { headFill: 関係.headFill } : {}),
      ...(路線図か && s.style !== "dashed" ? { head: "none" as const } : {}),
      ...(関係?.tailHead ? { tailHead: 関係.tailHead } : {}),
      ...(関係?.tailHeadFill ? { tailHeadFill: 関係.tailHeadFill } : {}),
      ...(関係?.headLabel ? { headLabel: 関係.headLabel } : {}),
      ...(関係?.tailLabel ? { tailLabel: 関係.tailLabel } : {}),
      ...(s.side ? { side: s.side } : {}),
      ...(s.fromSide !== undefined ? { fromSide: s.fromSide } : {}),
      ...(s.toSide !== undefined ? { toSide: s.toSide } : {}),
      ...(timelineHorizontalBranch && s.label !== ""
        ? { overlay: true, labelOffsetY: 時間軸の横分岐の札の上げ幅 }
        : timelineEdgeKind !== undefined && s.label !== ""
          ? { overlay: true }
          : {}),
      ...(timelineEdgeKind === "advance" && !timelineEnd ? { head: "none" as const } : {}),
    });
    edgeIds.push(edgeId);
  });

  // state 登録
  for (const st of doc.animate?.states ?? []) {
    b.state(st.name, { initial: st.initial });
  }

  // phase 注入
  for (const p of doc.animate?.phases ?? []) {
    b.phase(
      slugify(p.name) || p.name,
      {
        duration: p.durationMs,
        title: p.name,
        body: p.body ?? "",
      },
      (pb) => {
        const activateIds = resolveHighlightGeneric(p, doc, actorToNodeId, edgeIds);
        if (timelineNumberIdByCardId !== undefined) {
          const activeNumberIds = new Set<string>();
          for (const id of activateIds) {
            const numberId = timelineNumberIdByCardId.get(id);
            if (numberId !== undefined) activeNumberIds.add(numberId);
          }
          for (const numberId of timelineNumberIdByCardId.values()) {
            if (activeNumberIds.has(numberId)) activateIds.push(numberId);
          }
        }
        if (activateIds.length > 0) {
          pb.activate(...activateIds);
        }
        for (const t of p.tweens ?? []) {
          pb.tween(t.state, t.from, t.to);
        }
        for (const s of p.sets ?? []) {
          pb.set(s.state, s.value);
        }
        if (p.badge) {
          pb.badge(p.badge);
        }
        return pb;
      },
    );
  }

  const built = b.build();
  if (時間軸か) {
    const endIds = new Set(
      doc.actors.filter((actor) => actor.kind === "mark-end").map((actor) => actorToNodeId.get(actor.name)),
    );
    for (const edge of built.edges) {
      // `head` を書かないことが既定の三角を表すため、終わりへ入る線には欄自体を残さない。
      if (endIds.has(edge.to) && edge.head === undefined) delete edge.head;
    }
  }
  return built;
}

/**
 * 5 preset 共通 ... highlight item (actor 名 or "A→B") を node/edge id に解決。
 * sequence と異なり header/footer/step box はないのでシンプル。
 */
export function resolveHighlightGeneric(
  phase: DslPhase,
  doc: DslDocument,
  actorToNodeId: Map<string, string>,
  edgeIds: string[],
): string[] {
  const out: string[] = [];
  const knownNames = new Set(actorToNodeId.keys());
  for (const raw of phase.highlight ?? []) {
    const entry = parseFocusEntry(raw, knownNames);
    // 矢印あり → edge を特定
    if (entry.kind === "edge") {
      const fromId = actorToNodeId.get(entry.from) ?? slugify(entry.from);
      const toId = actorToNodeId.get(entry.to) ?? slugify(entry.to);
      // edge id は `e{idx}-{fromId}-{toId}` の形。 末尾一致で見る。
      // 部分一致で見ると、 名前に `-` を含む箱 (`api-gateway`) の id が別の矢印の id に
      // 混ざって当たる (実測 = 箱を光らせたい指定で矢印が光った)
      for (const edgeId of edgeIds) {
        if (edgeId.endsWith(`-${fromId}-${toId}`)) {
          out.push(edgeId);
        }
      }
      continue;
    }
    // actor 名 → node id。 見つからなければ slug の形でも探す。
    // 順序図だけが slug を受理する状態にすると、 同じ記述が図種で別の意味になる
    // (実測 = `api-gateway` が順序図では光り、 フローでは何も光らなかった)
    const nodeId = actorToNodeId.get(entry.name) ?? slugLookup(actorToNodeId, entry.name);
    if (nodeId) {
      out.push(nodeId);
    }
  }
  return out;
}

/**
 * 名前が見つからない時に、 slug の形でも探す。
 *
 * 記法は表示名で書くが、 書く人は id の形 (`api-gateway`) で書くこともある。 図種によって
 * 受理する / しないが分かれると、 同じ記述が別の意味になる。
 *
 * 2 つ以上の名前が同じ slug になる時は解決しない。 どちらを指したか決められないため、
 * 黙ってどちらかを選ぶより光らせない方が書いた人が気付ける。
 */
export function slugLookup(
  byName: ReadonlyMap<string, string>,
  wanted: string,
): string | undefined {
  let hit: string | undefined;
  for (const [name, id] of byName) {
    if (slugify(name) !== wanted) continue;
    if (hit !== undefined) return undefined;
    hit = id;
  }
  return hit;
}
