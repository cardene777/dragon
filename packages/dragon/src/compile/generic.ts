import { diagram } from "@cardenelabs/cdl";
import type { CdlDiagram, NodeKind } from "@cardenelabs/cdl";
import { parseFocusEntry } from "../focus";
import type { DslDocument, DslPhase } from "../types";
import { 始まりと終わりの決め方 } from "./actors";
import { 並べる向き, 後ろへ戻る矢印か, type GenericKind } from "./direction";
import { ERの関係の指定を作る, ERの関係の矢印 } from "./er-relation";
import { 描ける種別 } from "./kinds";
import { 縦列ごとの段を決める, 書いた縦列に置く } from "./lanes";
import { 箱の題 } from "./node-title";
import { slugify } from "./slug";
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
};

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
  const actorStageByName = new Map<string, string>();
  const 段階名 = (a: (typeof doc.actors)[number]): string => a.stage ?? a.lane ?? a.name;
  if (段階ごとの箱か) {
    /*
     * 段階を横に並べ、その中へ箱を縦に積む (#2797)。
     *
     * 担当 (`lane`) は縦列ではなく札の補足として読むため、`lanes:` の宣言からは名前だけを
     * 引く。 段階の並びは箱に最初に現れた順で、静止図と動く図を同じ経路に揃える。
     */
    const 段階たち: string[] = [];
    const 見つけた段階 = new Set<string>();
    for (const a of doc.actors) {
      const stage = 段階名(a);
      actorStageByName.set(a.name, stage);
      if (!見つけた段階.has(stage)) {
        見つけた段階.add(stage);
        段階たち.push(stage);
      }
    }
    const laneIdByStage = new Map<string, string>();
    const 使ったid = new Set<string>();
    段階たち.forEach((stage, index) => {
      const base = `stage-${slugify(stage) || index}`;
      let id = base;
      let suffix = 2;
      while (使ったid.has(id)) id = `${base}-${suffix++}`;
      使ったid.add(id);
      laneIdByStage.set(stage, id);
      const 担当: string[] = [];
      for (const a of doc.actors) {
        if (段階名(a) !== stage || a.lane === undefined || a.lane === stage) continue;
        const 名前 = doc.lanes?.[a.lane]?.label ?? a.lane;
        if (名前 === stage) continue;
        if (!担当.includes(名前)) 担当.push(名前);
      }
      b.lane(id, {
        width: laneWidth,
        contain: true,
        label: 担当.length > 0 ? `${stage} ・ ${担当.join("、")}` : stage,
      });
    });
    const 段 = 縦列ごとの段を決める(doc.actors, (a) => 段階名(a));
    doc.actors.forEach((a, idx) => {
      const id = slugify(a.name) || `n${idx}`;
      actorToNodeId.set(a.name, id);
      b.node(id, {
        lane: laneIdByStage.get(段階名(a)) ?? `stage-${idx}`,
        stack: 段.get(a) ?? 0,
        // 囲みを 3 本以上並べても一覧で読める幅に収める。 明示した viewport.laneWidth は後段で優先する。
        w: Math.max(1, laneWidth - 60),
        kind: 箱の種類(a),
        title: 箱の題(a),
        ...札(a, idx),
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
    const 関係 = kind === "record" ? ERの関係の矢印(ERの関係の指定を作る(s)) : undefined;
    b.edge(fromId, toId, {
      id: edgeId,
      label: 関係?.label ?? s.label,
      ...(段階ごとの箱か && actorStageByName.get(s.from) !== actorStageByName.get(s.to)
        ? { routing: "curve" as const }
        : !段階ごとの箱か &&
            後ろへ戻る矢印か(kind, fromId, toId, 箱の並び, 書いた縦列に置く(kind, doc))
          ? { routing: "back-detour" as const }
          : {}),
      ...(関係?.sub ? { sub: 関係.sub } : {}),
      ...(関係?.head ? { head: 関係.head } : {}),
      ...(関係?.tailHead ? { tailHead: 関係.tailHead } : {}),
      ...(s.sub ? { sub: s.sub } : {}),
      ...(s.side ? { side: s.side } : {}),
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

  return b.build();
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
