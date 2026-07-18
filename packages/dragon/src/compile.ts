/**
 * AST (DslDocument) → 既存 preset API 経由 → LaidDiagram
 *
 * v0.3 ... アニメーション ブロック full compile 対応 (sequence preset のみ、 他 preset は v0.4 で順次)
 *   - state / tween / set / highlight / badge / body を実 phase に注入
 *   - アニメーション ありなら builder 直接経路 ... preset の標準 phase を置換
 *   - アニメーション なしは v0.2 と同じく preset 経由
 *
 * v0.2 ... 6 preset 全対応 (sequence / flow / swimlane / er / state / topology)
 */

import type { DslDocument, DslPhase } from "./types";
import type { CdlDiagram, ErRelationCardinality } from "@cardenelabs/cdl";
import { sequence, flow, swimlane, er, stateMachine, topology, diagram } from "@cardenelabs/cdl";

export interface CompileToCdlOpts {
  /**
   * CAR-1657 = parts identifier lookup catalog、 caller (CdlEditor / test) が inject。
   * DslActor.partId が set された actor を検出したら partsCatalog[partId] から CdlDiagram を
   * lookup + mergePartIntoDiagram で target に統合。 未渡し時は parts kind actor を skip + warn。
   */
  partsCatalog?: Record<string, CdlDiagram>;
}

/**
 * canvas pivot parts binding = source tween を sink の valueRange に自動 clamp する post-process。
 * counter parts は「n を 0 → 5000 tween」 のような display 用 large value を持つが、
 * sink parts (arc / ring / bar 等) の shape は sweepMax=100 前提のため、 100 を超えると飽和する。
 * binding 経路では source tween の to を sink の想定 range に auto-clamp する経路で共存させる。
 * (実測 root cause = counter 5000 tween で arc 0-100 clip = 動かない、 2026-07-18)
 */
function clampSourceTweensForBinding(target: CdlDiagram, doc: DslDocument): void {
  // 存在する alias set を作成 (dangling bind 検知用)
  const aliasSet = new Set(doc.actors.map((a) => a.name));
  // sink actor から binding target と sink valueRange (現状 default 0-100) を集計
  const sinkClamps = new Map<string, number>();  // sourceState -> clamp max
  for (const actor of doc.actors) {
    if (!actor.bind) continue;
    const m = actor.bind.match(/^([a-zA-Z_][\w-]*)\.([a-zA-Z_][\w]*)$/);
    if (!m) continue;
    const sourceAlias = m[1]!, sourceState = m[2]!;
    // canvas pivot parts binding error handling = source alias が存在しない (source parts 削除
    // 済 or typo) 時 warn。 sink の render 側は state 未存在で auto-init 0 fallback、 壊さない。
    if (!aliasSet.has(sourceAlias)) {
      if (typeof console !== "undefined" && console.warn) {
        console.warn(`[dragon] parts binding: source actor "${sourceAlias}" (referenced by "${actor.name}.bind = ${actor.bind}") not found in actors list. Sink will render with state initial (0). Add "${sourceAlias}" back to actors: or unbind the sink.`);
      }
      continue;
    }
    // sink parts は現状 sweepMax=100 前提の gauge/ring/bar 系、 default clamp = 100
    const sourceStateId = `${sourceAlias}__${sourceState}`;
    const prev = sinkClamps.get(sourceStateId) ?? Infinity;
    sinkClamps.set(sourceStateId, Math.min(prev, 100));
  }
  if (sinkClamps.size === 0) return;
  // target.phases の全 tween を再走査、 sink clamp 対象なら to を clamp
  for (const phase of target.phases) {
    phase.tweens = phase.tweens.map((t) => {
      const clampMax = sinkClamps.get(t.stateId);
      if (clampMax === undefined) return t;
      return { ...t, to: Math.min(t.to, clampMax) };
    });
  }
}

export function compileToCdl(doc: DslDocument, opts?: CompileToCdlOpts): CdlDiagram {
  // canvas pivot Phase 3+4 (CAR-1695/1696) = parts actor を preset (sequence/flow/等) 経路から除外する。
  // 従来 parts actor は preset の actors: に含まれ、 sequence 側で 1 lane 分の horizontal 領域を確保
  // していたため既存 actor の位置が shift (「間に挟まる」 表示、 2026-07-17 user 実使い verify 発見)。
  // Miro 風の overlay drop を実現するため、 preset は parts 抜き actor list で layout を計算、
  // parts merge (mergePartsFromActors) は元 doc.actors で処理して parts diagram を absolute
  // 座標 (parts 側 .lane("l", { x: 0, ... })) で target に overlay する。
  const docForPreset: DslDocument = {
    ...doc,
    actors: doc.actors.filter((a) => a.partId === undefined),
  };
  let diagram: CdlDiagram;
  switch (docForPreset.type) {
    case "sequence":
      diagram = compileSequence(docForPreset);
      break;
    case "flow":
      diagram = compileFlow(docForPreset);
      break;
    case "swimlane":
      diagram = compileSwimlane(docForPreset);
      break;
    case "er":
      diagram = compileEr(docForPreset);
      break;
    case "state":
      diagram = compileState(docForPreset);
      break;
    case "topology":
      diagram = compileTopology(docForPreset);
      break;
    case "solidity":
      diagram = compileSolidity(docForPreset);
      break;
    case "gantt":
      diagram = compileGantt(docForPreset);
      break;
    case "class":
      diagram = compileClass(docForPreset);
      break;
    case "pie":
      diagram = compilePie(docForPreset);
      break;
    case "c4":
      diagram = compileC4(docForPreset);
      break;
    case "mind":
      diagram = compileMind(docForPreset);
      break;
    default:
      // switch case で全 type を網羅済のため default は unreachable、 template expression で
      // never 型を直接埋込めないので String() で明示 (defensive runtime error message 用)。
      throw new Error(`unknown type: ${String(docForPreset.type)}`);
  }
  applyEdgeInlineOptions(diagram, docForPreset);
  applyGroupContainers(diagram, docForPreset);
  // v05 extensions は元 doc (parts 含む) で処理、 parts actor の inline option (posX/posY 等) も一貫参照
  const extended = applyV05Extensions(diagram, doc);
  // parts merge は元 doc.actors (parts 含む) で処理、 parts diagram の lane / node を target に overlay
  const merged = mergePartsFromActors(extended, doc, opts?.partsCatalog);
  // canvas pivot parts binding = source tween を sink valueRange に auto-clamp
  clampSourceTweensForBinding(merged, doc);
  return merged;
}

/**
 * CAR-1657 = doc.actors 中の partId set actor を検出、 partsCatalog から CdlDiagram を lookup、
 * mergePartIntoDiagram で target に prefix 付き統合する。 partsCatalog 未渡し or 該当 partId
 * 未登録なら warn を残して skip、 diagram render は継続 (壊さない設計)。
 */
function mergePartsFromActors(
  target: CdlDiagram,
  doc: DslDocument,
  partsCatalog?: Record<string, CdlDiagram>,
): CdlDiagram {
  const partsActors = doc.actors.filter((a) => a.partId !== undefined);
  if (partsActors.length === 0) return target;
  if (!partsCatalog) {
    if (typeof console !== "undefined" && console.warn) {
      const names = partsActors.map((a) => `${a.name} (kind: ${a.partId ?? "?"})`).join(", ");
      console.warn(`[dragon] parts kind actors detected but no partsCatalog provided: ${names}`);
    }
    return target;
  }
  for (const actor of partsActors) {
    const partId = actor.partId;
    // codex-review CAR-1657 MAJOR fix (§ security) = partsCatalog は untrusted、 Object.hasOwn で
    // inherited property (`__proto__` 等) を除外する prototype pollution 対策。 `parts-` prefix 経路も
    // Object.hasOwn 経由で確認する。
    if (typeof partId !== "string" || partId.length === 0) continue;
    let part: CdlDiagram | undefined;
    if (Object.hasOwn(partsCatalog, partId)) {
      part = partsCatalog[partId];
    } else if (Object.hasOwn(partsCatalog, `parts-${partId}`)) {
      part = partsCatalog[`parts-${partId}`];
    }
    if (!part) {
      if (typeof console !== "undefined" && console.warn) {
        console.warn(`[dragon] parts kind "${partId}" not found in partsCatalog (actor: ${actor.name})`);
      }
      continue;
    }
    // codex-review MAJOR fix (§ sequence header/footer/spacer 削除) = preset (sequence 等) が生成した
    // parts actor 由来の node/edge を alias 経由で全削除する。 sequence は `{slugify(alias)}-header /
    // -spacer / -footer / s{N}-{slugify(alias)}` を生成、 alias slug prefix match で全 sweep。
    const aliasSlug = slugify(actor.name);
    target.nodes = target.nodes.filter((n) => {
      if (n.id === aliasSlug) return false;
      if (n.id.startsWith(`${aliasSlug}-`)) return false;
      // sequence step anchor = `s{N}-{aliasSlug}` pattern
      if (/^s\d+-/.test(n.id) && n.id.endsWith(`-${aliasSlug}`)) return false;
      return true;
    });
    // edge も同 alias prefix / suffix 経由で削除 (parts actor に接続していた flow を除去、
    // parts merge 後の flow は user が別途書く経路になる)
    target.edges = target.edges.filter((e) => {
      const relatedToAlias = (id: string) => id === aliasSlug || id.startsWith(`${aliasSlug}-`) || (id.startsWith("s") && id.endsWith(`-${aliasSlug}`));
      return !relatedToAlias(e.from) && !relatedToAlias(e.to);
    });
    // 削除された nodes を activate 参照している既存 phase の cleanup
    for (const phase of target.phases) {
      phase.activate = phase.activate.filter((id) => {
        if (id === aliasSlug) return false;
        if (id.startsWith(`${aliasSlug}-`)) return false;
        return true;
      });
    }
    // canvas pivot Phase 5 core fix (CAR-1697) = sequence preset が actor 1 個につき生成する lane も
    // 削除する。 parts actor は parts 側で独自 lane を持つため、 sequence 生成 lane (id = aliasSlug、
    // label = actor.name) は不要で orphan label 源になる (2026-07-17 user 実使い verify で
    // 「上に文字だけのもの (achievement)」 として検知)。 user が actor.lane 明示指定で
    // parts を既存 lane に merge する経路 (mergePartIntoDiagram の targetLaneId 経路) は本 filter
    // 対象外 (aliasSlug lane はそもそも生成されないため)。
    target.lanes = target.lanes.filter((l) => l.id !== aliasSlug);
    // canvas pivot 追加 fix = parts 内部座標 (parts spec の .lane("l", { x: 0, ... })) を
    // drop 位置 (actor.posX) で translate する。 従来 parts は internal x=0-400 の絶対座標で
    // merge され sequence の ユーザー lifeline (x=0) と重なって見切れる問題があった。
    // actor.posX 指定時のみ shift、 未指定なら parts 内部座標そのまま (backward compat)。
    // canvas pivot parts binding (CAR-1697+) = actor.bind ("counter1.n" 形式) を parse して
    // { sourceAlias, sourceState } を mergePartIntoDiagram に渡す。 mergePart 側で
    // 該当 alias の bindableState を source state と同名 rename → cdl state 共有で連動。
    let bindSpec: { sourceAlias: string; sourceState: string } | undefined;
    if (actor.bind && typeof actor.bind === "string") {
      const m = actor.bind.match(/^([a-zA-Z_][\w-]*)\.([a-zA-Z_][\w]*)$/);
      if (m) {
        bindSpec = { sourceAlias: m[1]!, sourceState: m[2]! };
      } else if (typeof console !== "undefined" && console.warn) {
        console.warn(`[dragon] invalid bind format for actor "${actor.name}": "${actor.bind}" (expected "alias.state")`);
      }
    }
    mergePartIntoDiagram(target, part, actor.name, actor.stateOverride ?? {}, actor.lane, actor.posX, bindSpec);
  }
  return target;
}

/**
 * CAR-1657 = parts CdlDiagram (単一 part 内容) を target CdlDiagram に prefix 付きで merge する。
 * alias = user が書く actor 名 ('arc1')、 全 id を '{alias}__{origId}' で prefix、 lane 参照 rename、
 * state initial は stateOverride で上書き可、 shape / subtitle / value 内の '{stateName}' template も
 * '{alias__stateName}' に rewrite する。 phase parallel merge (activate / tweens / sets の id 参照 rename)。
 */
function mergePartIntoDiagram(
  target: CdlDiagram,
  part: CdlDiagram,
  alias: string,
  stateOverride: Record<string, number | string | boolean>,
  laneMapping: string | undefined,
  posXOffset?: number,
  bindSpec?: { sourceAlias: string; sourceState: string },
): void {
  const prefix = (id: string): string => `${alias}__${id}`;
  // canvas pivot 追加 fix = parts 内部座標を drop 位置で translate。 posXOffset undefined なら 0
  // (backward compat = 従来通り parts 内部座標そのまま)。
  const xShift = posXOffset ?? 0;
  const stateIdSet = new Set(part.states.map((s) => s.id));
  // canvas pivot parts binding (CAR-1697+) = bind spec 有 の時、 parts の全 state から binding 対象を
  // 決定。 現状の spec = 「単一 numeric state を持つ parts」 が binding target = 最初の numeric-like
  // state (initial が number) を binding state と決定する。 該当 state の prefix を skip して
  // `{sourceAlias}__{sourceState}` に rename、 これで cdl diagram-level state を共有する。
  let bindTargetStateId: string | undefined;
  if (bindSpec) {
    for (const st of part.states) {
      if (typeof st.initial === "number") { bindTargetStateId = st.id; break; }
    }
    if (bindTargetStateId === undefined && typeof console !== "undefined" && console.warn) {
      console.warn(`[dragon] bind target state not found in parts for actor "${alias}" (no numeric state)`);
    }
  }
  const boundPrefix = (id: string): string => {
    if (bindSpec && bindTargetStateId && id === bindTargetStateId) {
      return `${bindSpec.sourceAlias}__${bindSpec.sourceState}`;
    }
    return prefix(id);
  };
  const rewriteTemplate = (s: string | undefined): string | undefined => {
    if (!s) return s;
    return s.replace(/\{([a-zA-Z_][a-zA-Z0-9_]*)\}/g, (m, name: string) => {
      return stateIdSet.has(name) ? `{${boundPrefix(name)}}` : m;
    });
  };

  // 決定的 lane 参照 = user が書いた lane 指定を優先、 なければ parts 内部 lane を prefix 付きで作る
  const targetLaneId = laneMapping;
  const laneIdMap = new Map<string, string>();
  for (const laneOrig of part.lanes) {
    if (targetLaneId) {
      laneIdMap.set(laneOrig.id, targetLaneId);
    } else {
      const newLaneId = prefix(laneOrig.id);
      laneIdMap.set(laneOrig.id, newLaneId);
      // parts 独自 lane が target に追加される (target 側 lane と衝突しない)
      // canvas pivot Phase 5 core fix (CAR-1697) = parts 側 laneOrig.label が undefined の時
      // alias fallback しない (undefined 継承)。 従来 alias fallback = "achievement1" 等の
      // orphan lane label が top に表示される bug 源で、 sequence preset が既に生成する
      // alias 名 lane と重複していた。 parts は自前で node title / subtitle 描画するため
      // lane label は不要。 cdl renderer が undefined を skip する前提 ("" 空文字は
      // lane.id を fallback にして "achievement1__l" 表示される bug で確認済)。
      target.lanes.push({
        ...laneOrig,
        id: newLaneId,
        label: laneOrig.label,
        // canvas pivot 座標一本化 = compile 側で lane.x に posX を bake せず、 CSS translate 一本で
        // X/Y 両方応用する経路に統一。 drop 直後の compile 非同期 + useEffect リセットの race で
        // 「元位置戻り」 or 「二重適用」 の flash が発生していた bug の直接対応。
        // xShift 経路は spec-canvas-pivot-adjustment.md の overlay layer 移行で恒久廃止予定、
        // 本 change は暫定 fix (parts internal x=0 のまま target に merge)。
        x: laneOrig.x ?? 0,
      });
    }
  }

  // node merge = id prefix + lane 参照 rewrite + shape / subtitle / value 内 template rewrite
  for (const nodeOrig of part.nodes) {
    const mappedLane = laneIdMap.get(nodeOrig.lane) ?? nodeOrig.lane;
    // codex-review MAJOR fix (§ nested shape template) = recursive walk で shape 内 nested object /
    // array の string leaf 全対象、 前実装は 1 depth のみで `fill: { gradient: "{v}" }` 等 miss。
    const newShape = nodeOrig.shape
      ? deepRewriteStrings(nodeOrig.shape as unknown, rewriteTemplate)
      : undefined;
    target.nodes.push({
      ...nodeOrig,
      id: prefix(nodeOrig.id),
      lane: mappedLane,
      title: rewriteTemplate(nodeOrig.title) ?? nodeOrig.title,
      subtitle: rewriteTemplate(nodeOrig.subtitle),
      value: rewriteTemplate(nodeOrig.value),
      ...(newShape ? { shape: newShape as CdlDiagram["nodes"][number]["shape"] } : {}),
    });
  }

  // state merge = id prefix + initial override
  // canvas pivot parts binding = binding target state は source alias.state に unify するため
  // 本 alias 側では state を追加せず skip (source 側 state を共有)。 target.states 内に既に
  // 該当 id があるかを事前 check して重複追加を防ぐ (binding 経路以外は従来通り prefix push)。
  for (const stateOrig of part.states) {
    const overrideVal = stateOverride[stateOrig.id];
    const targetId = boundPrefix(stateOrig.id);
    // binding 経路で source 側 state と同 id になった場合、 既に source 側で登録済 → skip
    if (target.states.some((s) => s.id === targetId)) continue;
    target.states.push({
      id: targetId,
      initial: overrideVal !== undefined ? (overrideVal as number | string) : stateOrig.initial,
    });
  }

  // edge merge = id / from / to prefix (parts 内 edge は稀だが対応)
  for (const edgeOrig of part.edges) {
    target.edges.push({
      ...edgeOrig,
      id: prefix(edgeOrig.id),
      from: prefix(edgeOrig.from),
      to: prefix(edgeOrig.to),
    });
  }

  // codex-review CRITICAL fix (§ readouts merge) = readout 系 parts (percent-ring / sparkline /
  // donut / KPI 等) は node/state だけでは render されず、 readouts field が必須。 全 readout の
  // id prefix + source / historySource / *Source field の state template rewrite で対応。
  if (part.readouts && part.readouts.length > 0) {
    if (!target.readouts) target.readouts = [];
    for (const readoutOrig of part.readouts) {
      const rewritten = deepRewriteStrings(readoutOrig as unknown, rewriteTemplate) as CdlDiagram["readouts"] extends readonly (infer R)[] ? R : never;
      // id は shape 全 walk で rewrite されないので個別に prefix
      target.readouts.push({
        ...(rewritten as { id: string }),
        id: prefix((rewritten as { id: string }).id),
      } as CdlDiagram["readouts"] extends readonly (infer R)[] ? R : never);
    }
  }

  // codex-review MAJOR fix (§ phase parallel merge) = 前実装は append (sequential)、 spec は parallel
  // default = parts phase を target 側 phase 個別に merge、 duration は max、 activate / tweens / sets
  // は union。 stateOverride.phase === false 時は parts phase 破棄 (opt-out)。
  const phaseOptOut = stateOverride["phase"] === false;
  if (phaseOptOut) {
    return; // parts phase を破棄、 activate / tweens / sets の rewrite 不要
  }
  // canvas pivot parts binding = sink parts (bindSpec ある side) の bindableState を drive する
  // tween / sets は source alias 側で既に定義済のため、 sink 側からは除外する。 これを除外しないと
  // 同 stateId に 2 tween が存在して cdl timeline で conflict → animation 発火せず全 sample で不変になる
  // (2026-07-18 実測 root cause)。
  const filterBoundTweens = <T extends { stateId: string }>(items: T[]): T[] => {
    if (!bindSpec || !bindTargetStateId) return items;
    return items.filter((t) => t.stateId !== bindTargetStateId);
  };
  if (target.phases.length === 0) {
    // target に phase なし = parts phase をそのまま追加 (prefix 付き)
    for (const phaseOrig of part.phases) {
      target.phases.push({
        ...phaseOrig,
        id: prefix(phaseOrig.id),
        activate: phaseOrig.activate.map(prefix),
        tweens: filterBoundTweens(phaseOrig.tweens).map((t) => ({ ...t, stateId: boundPrefix(t.stateId) })),
        sets: filterBoundTweens(phaseOrig.sets).map((s) => ({ ...s, stateId: boundPrefix(s.stateId) })),
      });
    }
  } else {
    // parallel merge = 各 target phase に対応する parts phase を index-wise で合成 (min の phase 数まで)、
    // 残 parts phase は追加 append (target より parts phase 数が多い場合)
    const targetLen = target.phases.length;
    const partsLen = part.phases.length;
    const commonLen = Math.min(targetLen, partsLen);
    for (let i = 0; i < commonLen; i++) {
      const targetPhase = target.phases[i]!;
      const partPhase = part.phases[i]!;
      targetPhase.duration = Math.max(targetPhase.duration, partPhase.duration);
      targetPhase.activate = [...targetPhase.activate, ...partPhase.activate.map(prefix)];
      targetPhase.tweens = [...targetPhase.tweens, ...filterBoundTweens(partPhase.tweens).map((t) => ({ ...t, stateId: boundPrefix(t.stateId) }))];
      targetPhase.sets = [...targetPhase.sets, ...filterBoundTweens(partPhase.sets).map((s) => ({ ...s, stateId: boundPrefix(s.stateId) }))];
    }
    // parts phase 余剰は append (target より parts が長い場合)
    for (let i = commonLen; i < partsLen; i++) {
      const phaseOrig = part.phases[i]!;
      target.phases.push({
        ...phaseOrig,
        id: prefix(phaseOrig.id),
        activate: phaseOrig.activate.map(prefix),
        tweens: filterBoundTweens(phaseOrig.tweens).map((t) => ({ ...t, stateId: boundPrefix(t.stateId) })),
        sets: filterBoundTweens(phaseOrig.sets).map((s) => ({ ...s, stateId: boundPrefix(s.stateId) })),
      });
    }
  }
}

/**
 * codex-review MAJOR fix = shape / readout の nested object / array 内 string leaf を全て
 * rewrite 関数に通す再帰 walk。 非 string leaf (number / boolean / null) は保持、
 * 循環参照は Set で防御 (現状 shape / readout は tree 構造で cycle なし想定、 defensive)。
 */
function deepRewriteStrings(
  value: unknown,
  rewrite: (s: string | undefined) => string | undefined,
  seen: WeakSet<object> = new WeakSet(),
): unknown {
  if (typeof value === "string") return rewrite(value) ?? value;
  if (value === null || typeof value !== "object") return value;
  if (seen.has(value as object)) return value;
  seen.add(value as object);
  if (Array.isArray(value)) {
    return value.map((v) => deepRewriteStrings(v, rewrite, seen));
  }
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
    out[k] = deepRewriteStrings(v, rewrite, seen);
  }
  return out;
}

/**
 * v0.5+ flow inline option (guard / cardinality / labelOffsetX / labelOffsetY) を
 * 既存 preset 経由で生成された CdlEdge に対し、 doc.flow の (from, to) 一致順マッチングで反映する。
 *
 * 設計:
 * - preset 経路ごとに edge id 命名規則が異なる (sequence: e{idx}-..、 ER: rel-{idx}-..、 FSM: t{idx}-..、
 *   topology: c{idx}-..、 flow preset: e-{prev}-{node}、 swimlane: e{idx}-..) ため、 id 直接マッチは脆い。
 * - 代わりに doc.flow の 1 step に対し、 同じ (slugified-from, slugified-to) を持つ未マッチ edge を
 *   順に 1 つ消費する double-pointer 走査で対応付ける。 同 from-to の重複は出現順で順番に対応。
 * - ER preset で cardinality が author 明示なら、 既存の label "places (1:N)" に "(1:N)" を再付与せず、
 *   既に label に含まれている場合はスキップ (`label.includes(cardinality)` で判定)。
 */
function applyEdgeInlineOptions(diagram: CdlDiagram, doc: DslDocument): void {
  const used = new Set<string>();
  // sequence preset では actor 名 が lane id、 edge.from は `s{stepIdx}-{laneId}` 形式。
  // solidity は sorted-actor を sequence preset 経由するため sequence と同形。
  // それ以外 (flow / swimlane / er / state / topology / gantt / class / pie / c4 / mind) は
  // edge.from / edge.to が plain slug (slugify(actor 名))。
  const isSeqLike = doc.type === "sequence" || doc.type === "solidity";
  doc.flow.forEach((s, stepIdx) => {
    const fromId = slugify(s.from);
    const toId = slugify(s.to);
    const target = diagram.edges.find((e) => {
      if (used.has(e.id)) return false;
      if (isSeqLike) {
        // edge.from / edge.to は `s{stepIdx}-{laneId}` 命名規則
        return (
          (e.from === `s${stepIdx}-${fromId}` || e.from === fromId) &&
          (e.to === `s${stepIdx}-${toId}` || e.from === e.to)
        );
      }
      return e.from === fromId && e.to === toId;
    });
    if (!target) return;
    used.add(target.id);
    if (s.guard !== undefined) {
      target.guard = s.guard;
      // FSM preset では sub が guard 同期、 author 明示 guard を sub に反映 (sub 既存なら上書きしない)
      if (doc.type === "state" && target.sub === undefined) target.sub = s.guard;
    }
    if (s.cardinality !== undefined) {
      target.cardinality = s.cardinality;
      // ER preset の場合 label に "(1:N)" 形式で併記 (既に含まれていればスキップ)
      if (doc.type === "er" && !target.label.includes(s.cardinality)) {
        target.label = target.label
          ? `${target.label} (${s.cardinality})`
          : `(${s.cardinality})`;
      }
    }
    if (s.labelOffsetX !== undefined) target.labelOffsetX = s.labelOffsetX;
    if (s.labelOffsetY !== undefined) target.labelOffsetY = s.labelOffsetY;
  });
}

/**
 * v0.5+ groups section を topology preset 経由の diagram に container lane として反映。
 * group.lanes に含まれる lane id 集合に対し、 wrap する `group-{id}` lane を contain: true で生成。
 *
 * 簡易実装 ... group container lane を独立 lane として並べ、 lane label に group.label を採用。
 * lane の物理的内包 (子 lane を group container の x 内に再配置) は engine layout に委ねる範囲外なので、
 * 本実装は CdlDiagram 上に「contain: true な group container lane」 を追加する最小骨格に留める。
 */
function applyGroupContainers(diagram: CdlDiagram, doc: DslDocument): void {
  if (!doc.groups || Object.keys(doc.groups).length === 0) return;
  for (const [id, g] of Object.entries(doc.groups)) {
    const containerId = `group-${id}`;
    if (diagram.lanes.some((l) => l.id === containerId)) continue;
    diagram.lanes.push({
      id: containerId,
      width: 800,
      label: g.label ?? id,
      contain: true,
    });
  }
}

/**
 * Solidity 専用 preset。
 *
 * 設計:
 * - actors を kind=contract / eoa / multisig 等で配置 (EOA は左、 contract は中央、 storage は右など layered layout)
 * - flow は function call の sequence (msg.sender → contract.fn() → internal call → emit event)
 * - storage 更新は state + rows binding で自動 (kind: storage の actor に rows: ["bal[A]: {balA}", ...])
 * - event は kind: event の actor を右端に並べ、 emit edge で発火を表現
 * - revert は tone: error の edge で表現
 *
 * sequence preset を base に使い、 Solidity 文脈に最適化した default を載せる:
 * - default tone: accent (call) / success (emit) / error (revert)
 * - default style: solid (call) / dotted-flow (state-change)
 */
function compileSolidity(doc: DslDocument): CdlDiagram {
  // sequence preset と同等構造で組み立てる、 lane 順は eoa / contract / storage / event の優先順で sort
  const kindOrder: Record<string, number> = {
    eoa: 0,
    actor: 0,
    multisig: 0,
    signer: 0,
    wallet: 0,
    contract: 1,
    proxy: 1,
    library: 1,
    interface: 1,
    storage: 2,
    event: 3,
  };
  const sorted = [...doc.actors].sort(
    (a, b) => (kindOrder[a.kind] ?? 5) - (kindOrder[b.kind] ?? 5),
  );
  // sorted を doc.actors に上書きしてから sequence preset 経由で compile
  const sortedDoc: DslDocument = { ...doc, actors: sorted };
  return compileSequence(sortedDoc);
}

/**
 * Gantt preset (横棒 timeline 専用 layout)
 *
 * 設計 ... 各 actor = 1 行 (= 1 task) として、 actor.subtitle ("Q1" / "Q2" / "Q3" / "Q4") を
 * 横軸 (時間軸) 上の位置にマッピングし、 actor を上下に縦 stack する形で「横棒 timeline」 を
 * 視覚的に作る。
 *
 * 寸法 ... 全体 timeline 幅 1400px / 各 task 横棒 w=280 h=64 / 中央 cx は Q1=200 / Q2=600 /
 * Q3=900 / Q4=1200。
 *
 * 実装 ... 背景 container lane (gantt-timeline) を 1 本 + 各 actor 用個別 lane (lane.x 明示) を
 * 1 本ずつ。 actor の stack は row index で、 全 lane 共通の row cy が layout で計算される。
 * kind: card 強制、 w / h を明示することで Gantt bar の視覚 size を担保。
 *
 * flow は依存関係を edge で表現 (横棒間の矢印)。
 */
function compileGantt(doc: DslDocument): CdlDiagram {
  const b = diagram(slugify(doc.title), { topic: doc.title });
  const TASK_W = 280;
  const TASK_H = 64;
  const QUARTER_CX: Record<string, number> = { Q1: 200, Q2: 600, Q3: 900, Q4: 1200 };
  b.lane("gantt-timeline", { x: 0, width: 1400, label: doc.title });

  doc.actors.forEach((a, idx) => {
    const subtitle = (a.subtitle ?? "").trim().toUpperCase();
    const cx = QUARTER_CX[subtitle] ?? 200;
    const laneX = cx - TASK_W / 2;
    const laneId = `gantt-${slugify(a.name) || `t${idx}`}`;
    b.lane(laneId, { x: laneX, width: TASK_W, label: "" });
    const nodeId = slugify(a.name) || `t${idx}`;
    b.node(nodeId, {
      lane: laneId,
      stack: idx,
      kind: "card",
      title: a.name,
      w: TASK_W,
      h: TASK_H,
    });
  });

  for (const s of doc.flow) {
    const fromId = slugify(s.from);
    const toId = slugify(s.to);
    b.edge(fromId, toId, {
      label: s.label,
      ...(s.sub ? { sub: s.sub } : {}),
      ...(s.tone ? { tone: s.tone } : {}),
      ...(s.style ? { style: s.style } : {}),
    });
  }

  return b.build();
}

/**
 * Class preset (UML class diagram 専用 layout)
 *
 * 設計 ... 各 class を 1 storage node として配置、 縦に stack する。 storage node renderer は
 * title (class 名) + divider + rows (fields / methods) を UML class box 風に表示する。
 *
 * 実装 ... 全 class を 1 lane に縦 stack 配置。 actor の kind を強制 storage、 rows / subtitle は
 * applyV05Extensions で node に merge される。
 *
 * flow ... 継承 / 関連を edge で表現 (label に "extends" / "implements" 等を author が指定)。
 */
function compileClass(doc: DslDocument): CdlDiagram {
  const b = diagram(slugify(doc.title), { topic: doc.title });
  const CLASS_W = 400;
  b.lane("class-stack", { width: CLASS_W, label: doc.title });

  doc.actors.forEach((a, idx) => {
    const nodeId = slugify(a.name) || `c${idx}`;
    b.node(nodeId, {
      lane: "class-stack",
      stack: idx,
      kind: "storage",
      title: a.name,
      w: CLASS_W,
    });
  });

  for (const s of doc.flow) {
    const fromId = slugify(s.from);
    const toId = slugify(s.to);
    b.edge(fromId, toId, {
      label: s.label,
      ...(s.sub ? { sub: s.sub } : {}),
      ...(s.tone ? { tone: s.tone } : {}),
      ...(s.style ? { style: s.style } : {}),
    });
  }

  return b.build();
}

/**
 * Pie preset (円グラフ風 slice list 専用 layout)
 *
 * 設計 ... 円グラフの SVG arc 描画は engine 改修が大きいため、 簡易版として「slice list + value (%) 表示」
 * で代替する。 1 lane に slice を縦並びにし、 value 属性 (例 "30%") は applyV05Extensions が
 * node.value に merge することで「[Slice A] 30%」 「[Slice B] 25%」 のような pie chart 意図を伝える。
 *
 * 実装 ... 全 slice を 1 lane に縦 stack。 kind: card 強制、 w=480 h=120。
 *
 * flow は通常なし (slice 間に依存関係はない)、 author 明示時のみ edge を描く。
 */
function compilePie(doc: DslDocument): CdlDiagram {
  const b = diagram(slugify(doc.title), { topic: doc.title });
  const SLICE_W = 480;
  b.lane("pie-slices", { width: SLICE_W, label: doc.title });

  doc.actors.forEach((a, idx) => {
    const nodeId = slugify(a.name) || `p${idx}`;
    b.node(nodeId, {
      lane: "pie-slices",
      stack: idx,
      kind: "card",
      title: a.name,
      w: SLICE_W,
      h: 120,
    });
  });

  for (const s of doc.flow) {
    const fromId = slugify(s.from);
    const toId = slugify(s.to);
    b.edge(fromId, toId, {
      label: s.label,
      ...(s.sub ? { sub: s.sub } : {}),
      ...(s.tone ? { tone: s.tone } : {}),
      ...(s.style ? { style: s.style } : {}),
    });
  }

  return b.build();
}

/**
 * C4 preset (C4 model 階層 system context 専用 layout)
 *
 * 設計 ... actor.subtitle に "L1" / "L2" / "L3" マーカーを置き、 階層 lane を生成。
 * - L1 = System Context (左 lane)
 * - L2 = Container (中央 lane)
 * - L3 = Component (右 lane)
 *
 * 実装 ... 3 lane を横並び (contain: true で囲む) 配置し、 各 actor を対応 L lane に配置する。
 * 同 L lane 内の actor は内部 stack で縦並びになる (横並びは layout 制約上不可、
 * 段の区別が視覚的に最重要)。 subtitle marker 未指定なら L1 fallback。
 *
 * flow ... actor 間の関係を edge で表現。
 */
function compileC4(doc: DslDocument): CdlDiagram {
  const b = diagram(slugify(doc.title), { topic: doc.title });
  const LANE_W = 400;
  b.lane("c4-l1", { x: 0, width: LANE_W, label: "System Context", contain: true });
  b.lane("c4-l2", { x: LANE_W + 80, width: LANE_W, label: "Container", contain: true });
  b.lane("c4-l3", { x: (LANE_W + 80) * 2, width: LANE_W, label: "Component", contain: true });

  const stackPerLane: Record<string, number> = { "c4-l1": 0, "c4-l2": 0, "c4-l3": 0 };
  doc.actors.forEach((a, idx) => {
    const subtitle = (a.subtitle ?? "").trim().toUpperCase();
    const lid = subtitle === "L2" ? "c4-l2" : subtitle === "L3" ? "c4-l3" : "c4-l1";
    const stack = stackPerLane[lid]!;
    stackPerLane[lid] = stack + 1;
    const nodeId = slugify(a.name) || `n${idx}`;
    b.node(nodeId, {
      lane: lid,
      stack,
      kind: a.kind,
      title: a.name,
    });
  });

  for (const s of doc.flow) {
    const fromId = slugify(s.from);
    const toId = slugify(s.to);
    b.edge(fromId, toId, {
      label: s.label,
      ...(s.sub ? { sub: s.sub } : {}),
      ...(s.tone ? { tone: s.tone } : {}),
      ...(s.style ? { style: s.style } : {}),
    });
  }

  return b.build();
}

/**
 * Mind map preset (中央 root + leaf 専用 layout)
 *
 * 設計 ... 1 つ目の actor を root として中央 lane に配置、 残りを leaf として root の左右の
 * lane に交互配置する。 完全な放射状 (8 方向) は実装が大きいので、 簡略実装 layer 1 として
 * left / center (root) / right の 3 lane に leaf を交互配置する。
 *
 * 実装 ... 3 lane (mind-left / mind-center / mind-right)。 root を center に stack=中央 で配置
 * (leaf 数の半分相当の stack で root を中央化)、 leaf を奇数番 → left、 偶数番 → right に分配。
 * kind: card 強制。
 *
 * flow ... 宣言なしなら root → 各 leaf の暗黙 edge を自動生成、 宣言ありならそれを採用。
 */
function compileMind(doc: DslDocument): CdlDiagram {
  const b = diagram(slugify(doc.title), { topic: doc.title });
  const LEAF_W = 280;
  const ROOT_W = 320;
  b.lane("mind-left", { x: 0, width: LEAF_W, label: "" });
  b.lane("mind-center", { x: LEAF_W + 80, width: ROOT_W, label: doc.title });
  b.lane("mind-right", { x: LEAF_W + 80 + ROOT_W + 80, width: LEAF_W, label: "" });

  if (doc.actors.length === 0) return b.build();

  const root = doc.actors[0]!;
  const rootId = slugify(root.name) || "root";
  const leafCount = doc.actors.length - 1;
  const rootStack = Math.floor(leafCount / 2);
  b.node(rootId, {
    lane: "mind-center",
    stack: rootStack,
    kind: "card",
    title: root.name,
    w: ROOT_W,
  });

  const stackLeft = { v: 0 };
  const stackRight = { v: 0 };
  doc.actors.slice(1).forEach((a, i) => {
    const isLeft = i % 2 === 0;
    const lid = isLeft ? "mind-left" : "mind-right";
    const counter = isLeft ? stackLeft : stackRight;
    const nodeId = slugify(a.name) || `leaf-${i}`;
    b.node(nodeId, {
      lane: lid,
      stack: counter.v,
      kind: "card",
      title: a.name,
      w: LEAF_W,
    });
    counter.v += 1;
  });

  if (doc.flow.length === 0 && doc.actors.length > 1) {
    doc.actors.slice(1).forEach((a) => {
      const leafId = slugify(a.name);
      b.edge(rootId, leafId, { label: "" });
    });
  } else {
    for (const s of doc.flow) {
      const fromId = slugify(s.from);
      const toId = slugify(s.to);
      b.edge(fromId, toId, {
        label: s.label,
        ...(s.sub ? { sub: s.sub } : {}),
        ...(s.tone ? { tone: s.tone } : {}),
        ...(s.style ? { style: s.style } : {}),
      });
    }
  }

  return b.build();
}

/**
 * v0.5+ inline option (subtitle / eyebrow / value / rows / stack / lane) +
 * top-level lanes / viewport / groups を post-process で反映。
 *
 * 設計: preset compile が既に基本 layout を作るので、 後付けで
 * - actor の inline option を該当 node に merge
 * - top-level lanes section の x / width / contain / lifeline / label を該当 lane に merge
 * - viewport の laneWidth (default lane width override) を全 lane に適用
 *
 * これにより v0.5 syntax で 19 機能のうち以下が動く:
 * subtitle / eyebrow / value / rows / contain / lifeline / label / lane.x / lane.width / laneWidth
 */
function applyV05Extensions(diagram: CdlDiagram, doc: DslDocument): CdlDiagram {
  // actor inline option → node merge
  for (const a of doc.actors) {
    const actorId = slugify(a.name);
    // 該当 actor の主要 node (header / single node) を見つけて option を merge
    for (const node of diagram.nodes) {
      if (node.id === actorId || node.id === `${actorId}-header` || node.id === actorId.replace(/-header$/, "")) {
        if (a.subtitle !== undefined) node.subtitle = a.subtitle;
        if (a.eyebrow !== undefined) node.eyebrow = a.eyebrow;
        if (a.value !== undefined) node.value = a.value;
        if (a.rows !== undefined) node.rows = a.rows;
      }
    }
  }
  // v0.5+ animation phase 後段注入 (CAR-1657 fix、 元 dragon PR #413 report user)。
  // preset (class / pie / c4 / mind / gantt) が doc.animate を無視して build するケースを補償。
  // 既に preset が phase を生成済 (sequence / flow / swimlane / er / state / topology 経由 = compileGenericWithAnimate) なら skip。
  // doc に phase 指定があって diagram.phases が空なら、 preset 由来 lane/node/edge に対して generic phase を注入する。
  if (doc.animate && doc.animate.phases.length > 0 && diagram.phases.length === 0) {
    injectPhasesFallback(diagram, doc);
  }
  // top-level lanes section → lane merge
  if (doc.lanes) {
    for (const [id, laneOpt] of Object.entries(doc.lanes)) {
      const lane = diagram.lanes.find((l) => l.id === id);
      if (lane) {
        if (laneOpt.x !== undefined) lane.x = laneOpt.x;
        if (laneOpt.width !== undefined) lane.width = laneOpt.width;
        if (laneOpt.label !== undefined) lane.label = laneOpt.label;
        if (laneOpt.contain !== undefined) lane.contain = laneOpt.contain;
        if (laneOpt.lifeline !== undefined) lane.lifeline = laneOpt.lifeline;
      } else {
        // lane が preset で作られていなければ新規追加
        diagram.lanes.push({
          id,
          x: laneOpt.x ?? 0,
          width: laneOpt.width ?? 320,
          label: laneOpt.label,
          contain: laneOpt.contain,
          lifeline: laneOpt.lifeline,
        });
      }
    }
  }
  // viewport.laneWidth → 全 lane width に override
  if (doc.viewport?.laneWidth !== undefined) {
    for (const lane of diagram.lanes) {
      lane.width = doc.viewport.laneWidth;
    }
  }
  // viewport.width / height / gap / laneGap / nodeGap / labelMargin → CdlDiagram.viewport に集約
  if (doc.viewport) {
    diagram.viewport = {
      ...(diagram.viewport ?? {}),
      ...(doc.viewport.width !== undefined ? { width: doc.viewport.width } : {}),
      ...(doc.viewport.height !== undefined ? { height: doc.viewport.height } : {}),
      ...(doc.viewport.gap !== undefined ? { gap: doc.viewport.gap } : {}),
      ...(doc.viewport.laneGap !== undefined ? { laneGap: doc.viewport.laneGap } : {}),
      ...(doc.viewport.nodeGap !== undefined ? { nodeGap: doc.viewport.nodeGap } : {}),
      ...(doc.viewport.labelMargin !== undefined ? { labelMargin: doc.viewport.labelMargin } : {}),
    };
  }
  return diagram;
}

/**
 * v0.5+ animation phase 後段 fallback 注入 (CAR-1657)。
 *
 * class / pie / c4 / mind / gantt preset は独自 layout を持ち、 compileGenericWithAnimate 経路に
 * 乗らないため、 doc.animate.phases があっても diagram.phases が空になる。
 * 本 helper が applyV05Extensions から呼ばれて post-hoc に phase を差込む、 lane/node/edge は
 * 既存 preset 出力を保持したまま animation だけ追加する。
 *
 * highlight resolution = actor 名 = slugify → diagram.nodes.id 対応、 edge の "A -> B" は
 * from/to の slug で 1:1 対応する edge を検索。 preset 由来 edge id は各種 (`e-{from}-{to}` /
 * `e{idx}-{fromId}-{toId}` 等) 揺れがあるため、 (edge.from === slug(A) && edge.to === slug(B))
 * で辞書 lookup せず走査で解決する。
 */
function injectPhasesFallback(diagram: CdlDiagram, doc: DslDocument): void {
  if (!doc.animate) return;

  // states 反映 (未登録なら追加、 既存は上書きしない)。 CdlState は id field (name ではない)。
  const existingStateIds = new Set(diagram.states.map((s) => s.id));
  for (const st of doc.animate.states) {
    if (!existingStateIds.has(st.name)) {
      diagram.states.push({ id: st.name, initial: st.initial });
    }
  }

  // highlight 解決関数 = actor 名 or "A -> B" / "A → B" を node.id / edge.id に変換。
  // codex-review CAR-1659 MAJOR fix = 全角矢印 `→` を対応 (generic 経路との互換)、
  // 同 from/to で複数 edge がある場合は全件 activate (`.find` → filter loop)。
  const resolveIds = (highlight: readonly string[]): string[] => {
    const out: string[] = [];
    for (const h of highlight) {
      const arrowMatch = h.match(/^(.+?)\s*(?:->|→)\s*(.+?)$/);
      if (arrowMatch) {
        const fromSlug = slugify((arrowMatch[1] ?? "").trim());
        const toSlug = slugify((arrowMatch[2] ?? "").trim());
        for (const e of diagram.edges) {
          if (e.from === fromSlug && e.to === toSlug) out.push(e.id);
        }
        continue;
      }
      const nodeSlug = slugify(h.trim());
      const node = diagram.nodes.find((n) => n.id === nodeSlug || n.id === `${nodeSlug}-header`);
      if (node) out.push(node.id);
    }
    return out;
  };

  // phase 注入。 CdlPhase.tweens[].stateId / sets[].stateId で state 参照 (state ではない)。
  for (const p of doc.animate.phases) {
    const activateIds: string[] = [...resolveIds(p.highlight ?? [])];
    diagram.phases.push({
      id: slugify(p.name) || p.name,
      duration: p.durationMs,
      title: p.name,
      body: p.body ?? "",
      activate: activateIds,
      tweens: (p.tweens ?? []).map((t) => ({ stateId: t.state, from: t.from, to: t.to })),
      sets: (p.sets ?? []).map((s) => ({ stateId: s.state, value: s.value })),
      ...(p.badge ? { badge: p.badge } : {}),
    });
  }
}

function compileSequence(doc: DslDocument): CdlDiagram {
  // v0.3 ... アニメーション 有無で経路を分岐。
  // 有り = builder 直接経路で state / 複数 phase を注入。
  // 無し = v0.2 と同じく sequence preset の標準 phase を採用。
  if (doc.animate && doc.animate.phases.length > 0) {
    return compileSequenceWithAnimate(doc);
  }
  const seqBuilder = sequence({
    id: slugify(doc.title),
    topic: doc.title,
    actors: doc.actors.map((a) => a.name),
  });
  for (const s of doc.flow) {
    seqBuilder.step({
      from: s.from,
      to: s.to,
      label: s.label,
      ...(s.sub ? { sub: s.sub } : {}),
      ...(s.tone ? { tone: s.tone } : {}),
      ...(s.style ? { style: s.style } : {}),
    });
  }
  return seqBuilder.build();
}

/**
 * v0.3 ... アニメーション full compile (sequence 向け)。
 * sequence preset と同じ構造 (lane / header / spacer / step box / footer) を builder 直接で組み立て、
 * 標準の 1 phase を DSL の複数 phase に置き換える。
 *
 * 標準 phase 1 個 → DSL phases N 個に展開。
 * state / tween / set / badge / body / highlight 全反映。
 */
function compileSequenceWithAnimate(doc: DslDocument): CdlDiagram {
  const b = diagram(slugify(doc.title), { topic: doc.title });
  const laneW = 340;

  // actor 名 → lane id / header / footer / spacer の slug 生成 (sequence preset と整合)
  const actorIds = new Map<string, string>();
  const headerNodeIds: string[] = [];
  doc.actors.forEach((a, i) => {
    const id = slugify(a.name) || `actor-${i}`;
    actorIds.set(a.name, id);
    actorIds.set(id, id);
    b.lane(id, { width: laneW, label: a.name, lifeline: true });
    const headerId = `${id}-header`;
    // header/footer 幅を title 長に応じて auto-size (text-readability warning 解消)。
    // formula = 22px/char + 52px padding (visualValidate text-readability と完全一致)、 min 140 で従来 sample 互換維持。
    const actorW = Math.max(140, a.name.length * 22 + 52);
    b.node(headerId, { lane: id, stack: 0, kind: "card", title: a.name, w: actorW, h: 72 });
    headerNodeIds.push(headerId);
    const spacerId = `${id}-spacer`;
    b.node(spacerId, { lane: id, stack: 1, kind: "card", title: "", w: 2, h: 40 });
  });

  // step boxes (sequence preset と同じ命名 ... `s${idx}-${laneId}` / `e${idx}-${from}-${to}`)
  // step ごとに DSL flow item に対応、 actor 名 → lane id の slugify を活用。
  const stepEdgeIds: string[] = [];
  doc.flow.forEach((s, idx) => {
    const fromLaneId = actorIds.get(s.from) ?? s.from;
    const toLaneId = actorIds.get(s.to) ?? s.to;
    const stack = idx + 2;
    const fromBoxId = `s${idx}-${fromLaneId}`;
    const toBoxId = `s${idx}-${toLaneId}`;
    b.node(fromBoxId, { lane: fromLaneId, stack, kind: "card", title: "", w: 2, h: 2 });
    if (fromLaneId !== toLaneId) {
      b.node(toBoxId, { lane: toLaneId, stack, kind: "card", title: "", w: 2, h: 2 });
    }
    const edgeId = `e${idx}-${fromLaneId}-${toLaneId}`;
    b.edge(fromBoxId, fromLaneId === toLaneId ? fromBoxId : toBoxId, {
      id: edgeId,
      label: s.label,
      ...(s.sub ? { sub: s.sub } : {}),
      ...(s.tone ? { tone: s.tone } : {}),
      ...(s.style ? { style: s.style } : {}),
      ...(s.guard ? { guard: s.guard } : {}),
      ...(s.cardinality ? { cardinality: s.cardinality } : {}),
      ...(s.labelOffsetX !== undefined ? { labelOffsetX: s.labelOffsetX } : {}),
      ...(s.labelOffsetY !== undefined ? { labelOffsetY: s.labelOffsetY } : {}),
    });
    stepEdgeIds.push(edgeId);
  });

  // footer (sequence preset と整合)
  const footerStack = doc.flow.length + 2;
  doc.actors.forEach((a) => {
    const laneId = actorIds.get(a.name) ?? slugify(a.name);
    const footerId = `${laneId}-footer`;
    const actorW = Math.max(140, a.name.length * 22 + 52);
    b.node(footerId, { lane: laneId, stack: footerStack, kind: "card", title: a.name, w: actorW, h: 72 });
  });

  // state を builder に登録
  for (const st of doc.animate!.states) {
    b.state(st.name, { initial: st.initial });
  }

  // phase を順次注入 ... highlight / tween / set / badge / body 全反映
  for (const p of doc.animate!.phases) {
    b.phase(
      slugify(p.name) || p.name,
      {
        duration: p.durationMs,
        title: p.name,
        body: p.body ?? "",
      },
      (pb) => {
        // highlight ... DSL の name (actor 名 or "from→to") を実 id に解決
        const activateIds = resolveHighlight(p, doc, actorIds, stepEdgeIds);
        if (activateIds.length > 0) {
          pb.activate(...activateIds);
        }
        // tween
        for (const t of p.tweens ?? []) {
          pb.tween(t.state, t.from, t.to);
        }
        // set
        for (const s of p.sets ?? []) {
          pb.set(s.state, s.value);
        }
        // badge
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
 * DSL の highlight item (actor 名 or "A→B" or "A-B" 等) を実 node/edge id に解決する。
 */
function resolveHighlight(
  phase: DslPhase,
  doc: DslDocument,
  actorIds: Map<string, string>,
  _stepEdgeIds: string[],
): string[] {
  const out: string[] = [];
  for (const raw of phase.highlight ?? []) {
    const item = raw.trim();
    // "A→B" or "A->B" 等の矢印つき → 該当 step edge を全部探して active
    if (/[→\->]/.test(item)) {
      const arrowMatch = item.match(/^(.+?)\s*[→\->]+\s*(.+)$/);
      if (arrowMatch) {
        const fromName = arrowMatch[1]!.trim();
        const toName = arrowMatch[2]!.trim();
        const fromLaneId = actorIds.get(fromName) ?? slugify(fromName);
        const toLaneId = actorIds.get(toName) ?? slugify(toName);
        // 該当 edge を flow から検索
        doc.flow.forEach((s, idx) => {
          const sFromId = actorIds.get(s.from) ?? slugify(s.from);
          const sToId = actorIds.get(s.to) ?? slugify(s.to);
          if (sFromId === fromLaneId && sToId === toLaneId) {
            out.push(`e${idx}-${fromLaneId}-${toLaneId}`);
          }
        });
        // 関連する step box も active 化
        const stackIdx = doc.flow.findIndex((s) => {
          const sFromId = actorIds.get(s.from) ?? slugify(s.from);
          const sToId = actorIds.get(s.to) ?? slugify(s.to);
          return sFromId === fromLaneId && sToId === toLaneId;
        });
        if (stackIdx >= 0) {
          out.push(`s${stackIdx}-${fromLaneId}`);
          if (fromLaneId !== toLaneId) out.push(`s${stackIdx}-${toLaneId}`);
        }
      }
      continue;
    }
    // actor 名 → header + footer + 全 step box を active
    const laneId = actorIds.get(item);
    if (laneId) {
      out.push(`${laneId}-header`);
      out.push(`${laneId}-footer`);
      // この lane の全 step box
      doc.flow.forEach((s, idx) => {
        const sFromId = actorIds.get(s.from) ?? slugify(s.from);
        const sToId = actorIds.get(s.to) ?? slugify(s.to);
        if (sFromId === laneId || sToId === laneId) {
          out.push(`s${idx}-${laneId}`);
        }
      });
    }
  }
  return out;
}

function compileFlow(doc: DslDocument): CdlDiagram {
  // v0.4 ... animation あり時 builder 直接経路で複数 phase 注入
  if (doc.animate && doc.animate.phases.length > 0) {
    return compileGenericWithAnimate(doc, { kind: "flow", laneId: "main", laneWidth: 400 });
  }
  // flow preset は actors を順に step として配置、 step 間に edge auto
  const flowBuilder = flow({
    id: slugify(doc.title),
    topic: doc.title,
  });
  // 各 actor を step として登録、 edge label は流れ から拾う
  for (let i = 0; i < doc.actors.length; i++) {
    const a = doc.actors[i]!;
    // 直前の step との edge label = この actor を to に持つ flow から拾う
    const incomingEdge = doc.flow.find((s) => s.to === a.name);
    const edgeLabel = incomingEdge?.label;
    flowBuilder.step(
      {
        id: slugify(a.name) || `n${i}`,
        kind: a.kind,
        title: a.name,
      },
      edgeLabel,
    );
  }
  return flowBuilder.build();
}

function compileSwimlane(doc: DslDocument): CdlDiagram {
  // v0.4 ... animation あり時 builder 直接経路 (各 actor 別 lane で配置)
  if (doc.animate && doc.animate.phases.length > 0) {
    return compileGenericWithAnimate(doc, { kind: "swimlane", laneWidth: 400 });
  }
  // swimlane preset は lane 配置 + 自由 node/edge。
  // v0.2 では actors を lane 化、 流れ の各 step から node を生成、 edge を引く。
  const swim = swimlane({
    id: slugify(doc.title),
    topic: doc.title,
    lanes: doc.actors.map((a) => a.name),
  });

  // 各 step で from / to の node を lane 内 stack 配置
  const placedNodes = new Set<string>();
  const laneStackCount = new Map<string, number>();
  let edgeIdx = 0;

  for (const s of doc.flow) {
    for (const actorName of [s.from, s.to]) {
      if (placedNodes.has(actorName)) continue;
      const laneId = swim.laneId(actorName);
      const actor = doc.actors.find((a) => a.name === actorName);
      const stack = laneStackCount.get(laneId) ?? 0;
      const nodeId = slugify(actorName) || `n${placedNodes.size}`;
      swim.node(nodeId, {
        lane: laneId,
        stack,
        kind: actor?.kind ?? "actor",
        title: actorName,
      });
      laneStackCount.set(laneId, stack + 1);
      placedNodes.add(actorName);
    }
    const fromId = slugify(s.from);
    const toId = slugify(s.to);
    swim.edge(fromId, toId, {
      id: `e${edgeIdx++}-${fromId}-${toId}`,
      label: s.label,
      ...(s.sub ? { sub: s.sub } : {}),
      ...(s.tone ? { tone: s.tone } : {}),
      ...(s.style ? { style: s.style } : {}),
      ...(s.guard ? { guard: s.guard } : {}),
      ...(s.cardinality ? { cardinality: s.cardinality } : {}),
      ...(s.labelOffsetX !== undefined ? { labelOffsetX: s.labelOffsetX } : {}),
      ...(s.labelOffsetY !== undefined ? { labelOffsetY: s.labelOffsetY } : {}),
    });
  }
  return swim.build();
}

function compileEr(doc: DslDocument): CdlDiagram {
  // v0.4 ... animation あり時 builder 直接経路 (entity を box として配置)
  if (doc.animate && doc.animate.phases.length > 0) {
    return compileGenericWithAnimate(doc, { kind: "er", laneWidth: 460 });
  }
  // er preset ... actors を entity に、 流れ を relation に
  const erBuilder = er({
    id: slugify(doc.title),
    topic: doc.title,
  });
  for (const a of doc.actors) {
    // entity rows は DSL では宣言できないので、 actor 名のみ entity 化
    // v0.3 で「列定義」 ブロックを追加検討
    erBuilder.entity({
      id: slugify(a.name) || a.name,
      title: a.name,
      rows: [], // v0.2 では rows なし
    });
  }
  for (const s of doc.flow) {
    erBuilder.relation({
      from: slugify(s.from),
      to: slugify(s.to),
      cardinality: parseCardinalityFromLabel(s.label) ?? "1:N",
      label: stripCardinality(s.label),
      ...(s.tone ? { tone: s.tone } : {}),
    });
  }
  return erBuilder.build();
}

function compileState(doc: DslDocument): CdlDiagram {
  // v0.4 ... animation あり時 builder 直接経路 (各 state を lane で配置、 transition を edge)
  if (doc.animate && doc.animate.phases.length > 0) {
    return compileGenericWithAnimate(doc, { kind: "state", laneWidth: 360 });
  }
  // stateMachine preset ... actors を state に、 流れ を transition に
  const fsm = stateMachine({
    id: slugify(doc.title),
    topic: doc.title,
  });
  for (let i = 0; i < doc.actors.length; i++) {
    const a = doc.actors[i]!;
    // 初期 / 最終 は (initial) / (final) を kind 部分に書く慣習、 もしくは順序で決め打ち
    const initial = i === 0;
    const final = i === doc.actors.length - 1 && doc.actors.length > 1;
    fsm.state({
      id: slugify(a.name) || `s${i}`,
      title: a.name,
      ...(initial ? { initial: true } : {}),
      ...(final ? { final: true } : {}),
    });
  }
  for (const s of doc.flow) {
    fsm.transition({
      from: slugify(s.from),
      to: slugify(s.to),
      trigger: s.label,
      ...(s.sub ? { guard: s.sub } : {}),
      ...(s.tone ? { tone: s.tone } : {}),
    });
  }
  return fsm.build();
}

function compileTopology(doc: DslDocument): CdlDiagram {
  // v0.4 ... animation あり時 builder 直接経路 (各 actor を別 lane に)
  if (doc.animate && doc.animate.phases.length > 0) {
    return compileGenericWithAnimate(doc, { kind: "topology", laneWidth: 460 });
  }
  // topology preset ... actors を 1 つの group 内 container として配置
  // v0.3 で「group」 ブロックを追加して複数 group 対応検討
  const topo = topology({
    id: slugify(doc.title),
    topic: doc.title,
  });
  const groupId = "main";
  const groupBuilder = topo.group(groupId, { label: doc.title });
  for (const a of doc.actors) {
    groupBuilder.add({
      id: slugify(a.name) || a.name,
      kind: a.kind,
      title: a.name,
    });
  }
  for (const s of doc.flow) {
    topo.connect(slugify(s.from), slugify(s.to), {
      label: s.label,
      ...(s.sub ? { sub: s.sub } : {}),
      ...(s.tone ? { tone: s.tone } : {}),
      ...(s.style ? { style: s.style } : {}),
    });
  }
  return topo.build();
}

/**
 * v0.4 ... 5 preset (flow / swimlane / er / state / topology) 共通 animation compile。
 * sequence preset と異なり header / footer / step box 構造はない、 シンプルな lane + node + edge 構造。
 * preset kind ごとに lane 配置と layout を切替。
 */
type GenericKind = "flow" | "swimlane" | "er" | "state" | "topology";

type GenericOpts = {
  kind: GenericKind;
  /** flow / topology は 1 lane に全 actor、 swimlane / state は actor ごと lane */
  laneId?: string;
  laneWidth: number;
};

function compileGenericWithAnimate(doc: DslDocument, opts: GenericOpts): CdlDiagram {
  const b = diagram(slugify(doc.title), { topic: doc.title });
  const { kind, laneWidth } = opts;

  // lane / node 配置 ... preset kind に応じて切替
  const actorToNodeId = new Map<string, string>();
  if (kind === "flow" || kind === "topology") {
    // 1 lane に全 actor を縦 stack
    const lid = opts.laneId ?? "main";
    b.lane(lid, { width: laneWidth, label: doc.title, ...(kind === "topology" ? { contain: true } : {}) });
    doc.actors.forEach((a, idx) => {
      const id = slugify(a.name) || `n${idx}`;
      actorToNodeId.set(a.name, id);
      b.node(id, { lane: lid, stack: idx, kind: a.kind, title: a.name });
    });
  } else {
    // swimlane / er / state ... actor ごとに 1 lane (横並び)
    doc.actors.forEach((a, idx) => {
      const lid = `lane-${slugify(a.name) || idx}`;
      b.lane(lid, { width: laneWidth, label: a.name });
      const id = slugify(a.name) || `n${idx}`;
      actorToNodeId.set(a.name, id);
      // er は entity、 state は initial/final marker、 swimlane はそのまま actor
      const isInitial = kind === "state" && idx === 0;
      const isFinal = kind === "state" && idx === doc.actors.length - 1 && doc.actors.length > 1;
      b.node(id, {
        lane: lid,
        stack: 0,
        kind: a.kind,
        title: a.name,
        ...(isInitial ? { eyebrow: "初期" } : {}),
        ...(isFinal ? { eyebrow: "最終" } : {}),
      });
    });
  }

  // edge ... flow の各 step を edge として登録
  const edgeIds: string[] = [];
  doc.flow.forEach((s, idx) => {
    const fromId = actorToNodeId.get(s.from) ?? slugify(s.from);
    const toId = actorToNodeId.get(s.to) ?? slugify(s.to);
    const edgeId = `e${idx}-${fromId}-${toId}`;
    // ER preset では cardinality を label に "(1:N)" 形式で併記、 他 preset は label そのまま。
    const labelWithCard =
      kind === "er" && s.cardinality && !s.label.includes(s.cardinality)
        ? s.label
          ? `${s.label} (${s.cardinality})`
          : `(${s.cardinality})`
        : s.label;
    b.edge(fromId, toId, {
      id: edgeId,
      label: labelWithCard,
      ...(s.sub ? { sub: s.sub } : {}),
      ...(s.tone ? { tone: s.tone } : {}),
      ...(s.style ? { style: s.style } : {}),
      ...(s.guard ? { guard: s.guard } : {}),
      ...(s.cardinality ? { cardinality: s.cardinality } : {}),
      ...(s.labelOffsetX !== undefined ? { labelOffsetX: s.labelOffsetX } : {}),
      ...(s.labelOffsetY !== undefined ? { labelOffsetY: s.labelOffsetY } : {}),
    });
    edgeIds.push(edgeId);
  });

  // state 登録
  for (const st of doc.animate!.states) {
    b.state(st.name, { initial: st.initial });
  }

  // phase 注入
  for (const p of doc.animate!.phases) {
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
function resolveHighlightGeneric(
  phase: DslPhase,
  doc: DslDocument,
  actorToNodeId: Map<string, string>,
  edgeIds: string[],
): string[] {
  const out: string[] = [];
  for (const raw of phase.highlight ?? []) {
    const item = raw.trim();
    // 矢印あり → edge を特定
    if (/[→\->]/.test(item)) {
      const arrowMatch = item.match(/^(.+?)\s*[→\->]+\s*(.+)$/);
      if (arrowMatch) {
        const fromName = arrowMatch[1]!.trim();
        const toName = arrowMatch[2]!.trim();
        const fromId = actorToNodeId.get(fromName) ?? slugify(fromName);
        const toId = actorToNodeId.get(toName) ?? slugify(toName);
        // 該当 edge を探す
        for (const edgeId of edgeIds) {
          // edge id format: `e${idx}-${fromId}-${toId}`
          if (edgeId.includes(`-${fromId}-${toId}`)) {
            out.push(edgeId);
          }
        }
      }
      continue;
    }
    // actor 名 → node id
    const nodeId = actorToNodeId.get(item);
    if (nodeId) {
      out.push(nodeId);
    }
  }
  return out;
}

// ─── helpers ──────────────────────────────────────────────────

function slugify(s: string): string {
  return (
    s
      .toLowerCase()
      .normalize("NFKC")
      .replace(/[^a-z0-9ぁ-んァ-ヶ一-龯\-_]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 64) || "n"
  );
}

const CARDINALITY_PATTERNS: Array<[RegExp, ErRelationCardinality]> = [
  [/1:1/, "1:1"],
  [/1:N/i, "1:N"],
  [/N:1/i, "N:1"],
  [/N:M/i, "N:M"],
  [/0\.\.1/, "0..1"],
  [/1\.\.\*/, "1..*"],
];

function parseCardinalityFromLabel(label: string): ErRelationCardinality | null {
  for (const [pattern, card] of CARDINALITY_PATTERNS) {
    if (pattern.test(label)) return card;
  }
  return null;
}

function stripCardinality(label: string): string {
  let r = label;
  for (const [pattern] of CARDINALITY_PATTERNS) {
    r = r.replace(pattern, "").trim();
  }
  return r.replace(/^[(\s]+|[)\s]+$/g, "") || label;
}
