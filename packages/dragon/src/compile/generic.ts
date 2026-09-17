import { diagram } from "@cardenelabs/cdl";
import type { CdlDiagram } from "@cardenelabs/cdl";
import { parseFocusEntry } from "../focus";
import type { DslDocument, DslPhase } from "../types";
import { 始まりと終わりの決め方 } from "./actors";
import { 並べる向き, 後ろへ戻る矢印か, type GenericKind } from "./direction";
import { ERの関係の指定を作る, ERの関係の矢印 } from "./er-relation";
import { 描ける種別 } from "./kinds";
import { 書いた縦列に置く } from "./lanes";
import { 箱の題 } from "./node-title";
import { slugify } from "./slug";
/**
 * 段を持つ図種の共通の組み立て (#2030 で `compile.ts` から移した)。
 *
 * `flow` / `swimlane` / `er` / `state` / `topology` の 5 図種が、段を書いた時にここを通る。
 */

export type GenericOpts = {
  kind: GenericKind;
  /** flow / topology は 1 lane に全 actor、 swimlane / state は actor ごと lane */
  laneId?: string;
  laneWidth: number;
};

/**
 * v0.4 ... 5 preset (flow / swimlane / er / state / topology) 共通 animation compile。
 * sequence preset と異なり header / footer / step box 構造はない、 シンプルな lane + node + edge 構造。
 * preset kind ごとに lane 配置と layout を切替。
 */
export function compileGenericWithAnimate(doc: DslDocument, opts: GenericOpts): CdlDiagram {
  const { kind, laneWidth } = opts;
  const b = diagram(slugify(doc.title), { topic: doc.title, type: kind });

  // lane / node 配置 ... preset kind に応じて切替
  const actorToNodeId = new Map<string, string>();
  if (書いた縦列に置く(kind, doc)) {
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
    /*
     * 段は **書いた番号をそのまま持つ** (#1394)。
     *
     * 書き順で 0 から詰め直していた間、`stack: 1` と書いた箱が 0 へ落ちていた。
     * 決定木のように「同じ高さに並ばない」 ことが図の意味そのものになる形では、
     * 詰めた瞬間に別の図になる (実測 = 3 段の木の根が 1 段目へ上がった)。
     *
     * 書かなかった箱は、その縦列で **空いている一番小さい段** に置く。 単に数え上げると
     * 書いた番号と重なり、2 つの箱が同じ段に載る。
     */
    const 埋まった段 = new Map<string, Set<number>>();
    const 埋める = (lid: string, stack: number): void => {
      const 集合 = 埋まった段.get(lid) ?? new Set<number>();
      集合.add(stack);
      埋まった段.set(lid, 集合);
    };
    for (const a of doc.actors) {
      if (a.lane !== undefined && a.stack !== undefined) 埋める(a.lane, a.stack);
    }
    doc.actors.forEach((a, idx) => {
      const id = slugify(a.name) || `n${idx}`;
      actorToNodeId.set(a.name, id);
      const lid = a.lane!;
      let stack = a.stack;
      if (stack === undefined) {
        stack = 0;
        const 集合 = 埋まった段.get(lid);
        while (集合?.has(stack)) stack += 1;
        埋める(lid, stack);
      }
      b.node(id, {
        lane: lid,
        stack,
        kind: 描ける種別(a.kind),
        title: 箱の題(a),
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
        kind: 描ける種別(a.kind),
        title: 箱の題(a),
      });
    });
  } else {
    // actor ごとに 1 lane (横並び)。 `swimlane` / `er` / `state` の既定と、
    // `向き: 横` を書いた流れ図がここに来る (#1494)
    //
    // **見出しを付けるのは `swimlane` だけ** (#1241)。 3 図種とも箱を 1 つずつ持ち、
    // その箱が既に名前を描く。 縦列にも同じ名前を渡すと **同じ字が縦に 2 つ並ぶ**
    // (実測 = 描いた絵に `Alpha` `Beta` が 2 度出る)。
    //
    // `swimlane` は縦列そのものが「誰の担当か」 を読ませる図なので見出しが要る。
    // `er` の縦列は表を並べるための入れ物、 `state` の縦列は状態を並べるための入れ物で、
    // どちらも読む人に見せる意味を持たない (組立て API 側も見出しを空のまま置く)。
    const 見出しを付ける = kind === "swimlane";
    const 決め方2 = 始まりと終わりの決め方(doc);
    doc.actors.forEach((a, idx) => {
      const lid = `lane-${slugify(a.name) || idx}`;
      b.lane(lid, { width: laneWidth, ...(見出しを付ける ? { label: a.name } : {}) });
      const id = slugify(a.name) || `n${idx}`;
      actorToNodeId.set(a.name, id);
      // er は entity、 state は initial/final marker、 swimlane はそのまま actor
      const isInitial = kind === "state" && 決め方2.始まり(a, idx);
      const isFinal = kind === "state" && 決め方2.終わり(a, idx);
      b.node(id, {
        lane: lid,
        stack: 0,
        kind: 描ける種別(a.kind),
        title: 箱の題(a),
        ...(isInitial ? { eyebrow: "初期" } : {}),
        ...(isFinal ? { eyebrow: "最終" } : {}),
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
    // ER の多重度は、段の無い図 (`compileEr`) と同じ 1 か所から名前と名前の下の行と両端を作る (#2105)。
    // 札に `(1:N)` と添えるだけだった間、段を持つ ER 図には端の形が 1 つも付かなかった
    const 関係 = kind === "er" ? ERの関係の矢印(ERの関係の指定を作る(s)) : undefined;
    b.edge(fromId, toId, {
      id: edgeId,
      label: 関係?.label ?? s.label,
      ...(後ろへ戻る矢印か(kind, fromId, toId, 箱の並び)
        ? { routing: "back-detour" as const }
        : {}),
      ...(関係?.sub ? { sub: 関係.sub } : {}),
      ...(関係?.head ? { head: 関係.head } : {}),
      ...(関係?.tailHead ? { tailHead: 関係.tailHead } : {}),
      ...(s.sub ? { sub: s.sub } : {}),
      ...(s.side ? { side: s.side } : {}),

      ...(s.tone ? { tone: s.tone } : {}),
      ...(s.style ? { style: s.style } : {}),
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
    // (実測 = `api-gateway` が順序図では光り、 流れ図では何も光らなかった)
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
