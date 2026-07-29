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

export function compileToCdl(doc: DslDocument, opts?: CompileToCdlOpts): CdlDiagram {
  let diagram: CdlDiagram;
  switch (doc.type) {
    case "sequence":
      diagram = compileSequence(doc);
      break;
    case "flow":
      diagram = compileFlow(doc);
      break;
    case "swimlane":
      diagram = compileSwimlane(doc);
      break;
    case "er":
      diagram = compileEr(doc);
      break;
    case "state":
      diagram = compileState(doc);
      break;
    case "topology":
      diagram = compileTopology(doc);
      break;
    case "solidity":
      diagram = compileSolidity(doc);
      break;
    case "gantt":
      diagram = compileGantt(doc);
      break;
    case "class":
      diagram = compileClass(doc);
      break;
    case "pie":
      diagram = compilePie(doc);
      break;
    case "c4":
      diagram = compileC4(doc);
      break;
    case "mind":
      diagram = compileMind(doc);
      break;
    default:
      // switch case で全 type を網羅済のため default は unreachable、 template expression で
      // never 型を直接埋込めないので String() で明示 (defensive runtime error message 用)。
      throw new Error(`unknown type: ${String(doc.type)}`);
  }
  applyEdgeInlineOptions(diagram, doc);
  applyGroupContainers(diagram, doc);
  applyNodeTones(diagram, doc);
  // canvas pivot 新 spec = 全 preset 共通の post-process で actor.posX/Y を CDL lane / node に伝播
  applyCanvasPivotPositions(diagram, doc);
  // CAR-1657 = parts kind actor を merge (opts.partsCatalog 経由)、 applyV05Extensions 後段で実行
  const extended = applyV05Extensions(diagram, doc);
  return mergePartsFromActors(extended, doc, opts?.partsCatalog);
}

/**
 * 全図種共通の後処理で、 登場人物に書かれた色を対応する箱に載せる。
 *
 * 箱を作る経路は図種ごとに違い、 cdl の preset を経由する図種 (流れ図 / ER / 状態遷移 / 構成図)
 * では preset の入力型が色の項目を持たない。 箱が出来上がった後に id で対応付けることで、
 * どの図種でも同じ書き方が効く。 座標を伝播する `applyCanvasPivotPositions` と同じ経路。
 *
 * 対応付けは箱に表示される名前との一致で行う。 id は使わない。
 *
 * id での対応付けは 2 通りに壊れる。 id は名前を slug に変換して作るが、 その変換規則が
 * dragon と cdl で違い、 記号を含む名前では一致しない (実測 = `A_B` が dragon 側で `a_b`、
 * cdl 側で `a-b`)。 逆に、 生成した id (`{slug}-header`) をそのまま名前に持つ登場人物が
 * 居ると、 別人の箱を巻き込む。
 *
 * 表示名は変換を経ないので前者が起きず、 別人と一致しないので後者も起きない。 順序図で
 * 1 人が分かれる複数の箱のうち、 間隔用と手順ごとの anchor は表示名が空なので自然に対象外に
 * なる (色を持っても幅 2 で見えない)。
 *
 * parts は対象外。 parts の `tone` は色ではなく状態の上書きとして parser が扱うため、
 * ここに色として渡ってこない。
 */
function applyNodeTones(diagram: CdlDiagram, doc: DslDocument): void {
  for (const actor of doc.actors) {
    if (actor.tone === undefined) continue;
    for (const node of diagram.nodes) {
      if (node.title === actor.name) node.tone = actor.tone;
    }
  }
}

/**
 * canvas pivot 新 spec = 全 preset 共通の post-process で actor.posX/Y/W/H を CDL 側 lane / node に伝播。
 * preset builder が生成した diagram に対して、 doc.actors の 4 field を絶対座標として反映する。
 * slugify で actor 名 → lane id / node id の逆引き、 posX/Y set 済 actor に対応する lane / node に
 * 座標を書込む。 未指定 actor は従来 auto layout 経路そのまま。
 */
function applyCanvasPivotPositions(diagram: CdlDiagram, doc: DslDocument): void {
  for (const actor of doc.actors) {
    if (actor.partId !== undefined) continue; // parts actor は別経路 (mergePartsFromActors) で処理
    const aliasSlug = slugify(actor.name);
    // actor 全体 posX/Y = lane と単一 node に一括反映 (従来経路)
    if (actor.posX !== undefined && actor.posY !== undefined) {
      for (const lane of diagram.lanes) {
        if (lane.id === aliasSlug || lane.id === actor.name) {
          lane.posX = actor.posX;
          lane.posY = actor.posY;
          if (actor.posW !== undefined) lane.posW = actor.posW;
          if (actor.posH !== undefined) lane.posH = actor.posH;
        }
      }
      for (const node of diagram.nodes) {
        if (node.id === aliasSlug || node.id === actor.name) {
          node.posX = actor.posX;
          node.posY = actor.posY;
          if (actor.posW !== undefined) node.posW = actor.posW;
          if (actor.posH !== undefined) node.posH = actor.posH;
        }
      }
    }
    // canvas pivot UX 修正 (B1) = actor.nodes[subKey] を対応 CDL node に個別反映。
    // sub-node id pattern を actor scope 限定の 2 経路に絞る (subagent review MAJOR-1 対応、 CAR-canvas-pivot):
    //   1. `{aliasSlug}-{subKey}` = header / footer / spacer 等 suffix
    //   2. `{subKey}-{aliasSlug}` = sequence step box `s{N}-{aliasSlug}` 等 prefix
    // 旧 `node.id === subKey` 完全一致 fallback は actor scope を持たず cross-actor pollution risk
    // (別 actor が保有する同名 id node に座標が漏れる silent bug) のため削除。 全 sub-node は必ず
    // aliasSlug を接頭 / 接尾に含む形式で生成されるため、 2 経路で網羅済。
    // lane 側は触らない = 他 sub-node の auto layout 経路を保持 (B1 独立性の SSOT)。
    if (actor.nodes) {
      for (const [subKey, override] of Object.entries(actor.nodes)) {
        if (override.posX === undefined || override.posY === undefined) continue;
        for (const node of diagram.nodes) {
          if (
            node.id === `${aliasSlug}-${subKey}` ||
            node.id === `${subKey}-${aliasSlug}`
          ) {
            node.posX = override.posX;
            node.posY = override.posY;
            if (override.posW !== undefined) node.posW = override.posW;
            if (override.posH !== undefined) node.posH = override.posH;
          }
        }
      }
    }
  }
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
    // parts actor 由来の node/edge を alias 経由で全削除する。 sequence は `{slug}-header / -spacer /
    // -footer / s{N}-{slug}` を生成、 slug prefix match で全 sweep。
    //
    // sweep に使う slug は 2 系統ある (#873)。 dragon の slugify は `_` / 全角を保持するが、 非 animate
    // sequence / solidity の node は cdl preset 側の slugify (`_` → `-` 置換、 NFKC なし) で生成される
    // ため、 dragon slug だけで sweep すると `arc_one` → 実 id `arc-one-header` を取りこぼし、 header /
    // footer (title = actor 名) が残って actor 名が多重表示される。
    //
    // seq-like preset は「actor 専用 lane に属する node」 を exact set で特定する経路を使う。
    // lane.label === actor.name で lane を引き当て (label は両 slug 経路とも actor.name 生値)、 その
    // lane に属する node (header / spacer / footer / step anchor は全て actor lane 所属) を node.lane で
    // 厳密収集する。 slug の prefix 推測を挟まないため、 slug 実装差の取りこぼしと、 別 actor を巻き込む
    // 誤削除 (parts actor `a_b` の lane id `a-b` が actor `a-b-c` の `a-b-c-header` に prefix match する)
    // の両方を同時に排除する。
    const aliasSlug = slugify(actor.name);
    const ownedLaneIds = new Set<string>();
    if (doc.type === "sequence" || doc.type === "solidity") {
      for (const l of target.lanes) {
        // 明示 lane mapping (actor.lane) 先は part の張替え先で actor 専用 lane ではないため除外
        if (actor.lane !== undefined && l.id === actor.lane) continue;
        if (l.label === actor.name) ownedLaneIds.add(l.id);
      }
    }
    const ownedNodeIds = new Set<string>();
    for (const n of target.nodes) {
      if (ownedLaneIds.has(n.lane)) ownedNodeIds.add(n.id);
    }
    // actor 専用 lane を引き当てられない経路 (flow / topology 等の共有 lane preset) は従来どおり dragon
    // slug の prefix match に fallback する。 これらは 1 actor = 1 node (id = slug) の生成規則。
    const matchesAliasSlug = (id: string): boolean => {
      if (id === aliasSlug) return true;
      if (id.startsWith(`${aliasSlug}-`)) return true;
      // sequence step anchor = `s{N}-{aliasSlug}` pattern
      if (/^s\d+-/.test(id) && id.endsWith(`-${aliasSlug}`)) return true;
      return false;
    };
    const relatedToActor = (id: string): boolean =>
      ownedLaneIds.size > 0 ? ownedNodeIds.has(id) : matchesAliasSlug(id);
    target.nodes = target.nodes.filter((n) => !relatedToActor(n.id));
    // edge も同経路で削除 (parts actor に接続していた flow を除去、 parts merge 後の flow は user が
    // 別途書く経路になる)。 削除した edge の id は phase.activate に残ると dangling 参照になるため回収する。
    const removedEdgeIds = new Set<string>();
    target.edges = target.edges.filter((e) => {
      const drop = relatedToActor(e.from) || relatedToActor(e.to);
      if (drop) removedEdgeIds.add(e.id);
      return !drop;
    });
    // lane も削除 = sequence preset は parts actor 用に lane (id = aliasSlug、 label = actor 名) を
    // 生成する。 node/edge だけ消して lane を残すと、 merge 後の part 側 lane (label = alias) と 2 本が
    // 同じ label を lane-label として描画し二重表示になる (actor ラベル二重表示 bug の root cause)。
    //
    // 削除は seq-like preset (sequence / solidity = compileSequence 経由) に限定する。 これらは
    // 1 actor = 1 lane (lane.label === actor.name、 lane.id は actor 名の slug) の生成規則が成立し、
    // parts actor 用 lane を安全に削除できる。 他 preset (flow / topology / class / pie 等) は複数
    // actor が共有 lane (id = "main" 等) を参照するため、 一致 lane を消すと通常 actor の node が
    // 削除済 lane を参照する不正 diagram になる (cc-codex MAJOR 指摘)。
    //
    // leftover lane の特定は lane.label === actor.name を第一に使う。 seq-like preset は非 animate 経路
    // (cdl preset の slugify) と animate 経路 (dragon の slugify) で lane.id の slug 規則が異なり
    // (`_`/全角の扱い等)、 aliasSlug (dragon slugify) と lane.id が不一致になる actor 名がある。 lane.label
    // は両経路とも actor.name 生値なので slug 差の影響を受けず確実に一致する。 id === aliasSlug は
    // label 未設定 preset への fallback (exact match のみ、 prefix は false match risk のため付けない)。
    if (doc.type === "sequence" || doc.type === "solidity") {
      target.lanes = target.lanes.filter((l) => {
        // 明示 lane mapping (actor.lane) 先は part の張替え先なので保持する。
        if (actor.lane !== undefined && l.id === actor.lane) return true;
        if (l.label === actor.name) return false;
        if (l.id === aliasSlug) return false;
        return true;
      });
    }
    // 削除された node / edge を activate 参照している既存 phase の cleanup (node 削除と同じ判定経路
    // = 取りこぼすと存在しない id が activate に残り dangling 参照になる、 #873)
    for (const phase of target.phases) {
      phase.activate = phase.activate.filter((id) => !relatedToActor(id) && !removedEdgeIds.has(id));
    }
    const merged = applyColorHex(part, actor.colorHex, actor.stateOverride ?? {});
    mergePartIntoDiagram(target, part, actor.name, merged, actor.lane, actor.posX, actor.posY, actor.posW, actor.posH);
  }
  return target;
}

/**
 * `色:` に書かれた色番号を、 パーツが持つ色の状態に入れる。
 *
 * 色を保持する状態の名前はパーツごとに違う (`bg` / `stFill` / `gFill` / `hue` など)。 名前を
 * 決め打ちすると、 別の名前を使うパーツで色を書いても何も起きない。
 *
 * パーツの状態のうち初期値が色番号のものを探して、 そこに入れる。 複数あれば全部に入れる
 * (`cpuC` / `memC` / `netC` のように系統ごとに分かれている場合、 1 つだけ変えるとちぐはぐになる)。
 */
function applyColorHex(
  part: CdlDiagram,
  colorHex: string | undefined,
  stateOverride: Record<string, number | string | boolean>,
): Record<string, number | string | boolean> {
  if (!colorHex) return stateOverride;
  const colorStates = part.states.filter(
    (st) => typeof st.initial === "string" && /^#[0-9a-fA-F]{3,8}$/.test(st.initial),
  );
  if (colorStates.length === 0) return stateOverride;
  const out = { ...stateOverride };
  for (const st of colorStates) {
    // 名前を指定して書いた値が優先。 `色:` はまとめて塗る指定
    if (out[st.id] === undefined) out[st.id] = colorHex;
  }
  return out;
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
  /**
   * parts drop 位置 (drag-and-drop or click 追加時に呼出側が SVG viewBox 座標を書出す)。
   * 未指定 = 従来 (lane.x = 0 baked-in で canvas 左端に描画)、 指定時 = parts 内部 lane の
   * x / y に加算して drop 座標付近に描画。 D1 forensic (drop 座標乖離) の core fix。
   */
  offsetX?: number,
  offsetY?: number,
  /**
   * parts 全体 resize 対応 (I2 forensic) = parts を Miro 相当の「1 unit」 として扱い、
   * user が SE handle drag で拡大すると actor.posW/posH が書出される。 compile で受け取り、
   * parts 全 sub-node の w / h と cx / cy 相対位置に scale 係数を適用して等比拡大する。
   * 未指定 = 従来の parts 原寸 で描画 (scale なし)。
   */
  targetW?: number,
  targetH?: number,
): void {
  const prefix = (id: string): string => `${alias}__${id}`;
  const stateIdSet = new Set(part.states.map((s) => s.id));
  const rewriteTemplate = (s: string | undefined): string | undefined => {
    if (!s) return s;
    return s.replace(/\{([a-zA-Z_][a-zA-Z0-9_]*)\}/g, (m, name: string) => {
      return stateIdSet.has(name) ? `{${prefix(name)}}` : m;
    });
  };

  // 決定的 lane 参照 = user が書いた lane 指定を優先、 なければ parts 内部 lane を prefix 付きで作る
  const targetLaneId = laneMapping;
  const laneIdMap = new Map<string, string>();
  // parts lane の横位置。
  //   offset (drop / click 座標) 指定時 = part 中心を offsetX に合わせる = user が置いた位置に
  //     parts の中心が来る。 node は lane 中心 (lane.x + laneW/2) に描画されるため、 lane 左端を
  //     offsetX - laneW/2 に置くと node 中心 = offsetX となり cursor / viewport 中央に一致する
  //     (縦方向 offsetY と対称、 offsetY 側は partCenterStack で既に中心合わせ済)。
  //     従来の auto-adjust (max(offsetX, existingMax + gap) で既存 lane 右端へ強制右寄せ) は user
  //     directive で廃止 (2026-07-21)。 重なりは user の意図位置を優先し、 手動移動で回避する経路。
  //   未指定 (座標なし fallback) 時のみ existingMax + gap で右外配置 (通常経路は drop/click で座標を渡す)。
  const PARTS_LANE_GAP = 300;
  const existingLaneMaxX = target.lanes.length > 0
    ? Math.max(...target.lanes.map((l) => (l.x ?? 0) + l.width))
    : 0;
  // parts 全体 resize (I2 forensic): user が SE handle drag で targetW/H 指定 = actor.posW/H。
  // scale 基準は part 全体の bbox 幅 (全 lane の最左端〜最右端) にする。 lane[0] 幅だけを基準にすると
  // multi-lane part (複数 lane を横に並べた part) で全体幅を過小評価し、 非先頭 lane の node が自 lane
  // 中心からずれる (#880)。
  const partMinLaneX = part.lanes.length > 0
    ? Math.min(...part.lanes.map((l) => l.x ?? 0))
    : 0;
  const partMaxLaneRight = part.lanes.length > 0
    ? Math.max(...part.lanes.map((l) => (l.x ?? 0) + l.width))
    : 400;
  // 幅は max >= min で常に非負。 正の幅 (極小 sub-pixel 含む) はそのまま scale 基準に使い、
  // 0 (全 lane が同一 x + 幅 0 の退化ケース) の時だけ除算保護で 1 に fallback する。
  // Math.max(1, w) だと 0 < w < 1 の正当な幅まで 1 に floor して over-scale するため使わない。
  const rawBboxW = partMaxLaneRight - partMinLaneX;
  const partsBboxW = rawBboxW > 0 ? rawBboxW : 1;
  const laneScaleX = targetW !== undefined && targetW > 0 ? targetW / partsBboxW : 1;
  // part 全体を「元 bbox 中心 → drop 座標」 の scale 変換で写す単一式 mapLaneX。 lane も node も同じ式で
  // 変換し、 lane.x = mapLaneX(元 lane 左端) にすることで全 lane / 全 node が一貫して drop 座標を中心に
  // scale 配置される (cc-codex #879 の mapPartX と同じ発想を lane push まで前倒し、 #880 root fix)。
  const partOrigBboxCenterX = partMinLaneX + partsBboxW / 2;
  const dropCenterX = offsetX !== undefined
    ? offsetX
    : existingLaneMaxX + PARTS_LANE_GAP + (partsBboxW * laneScaleX) / 2;
  const mapLaneX = (x: number): number => (x - partOrigBboxCenterX) * laneScaleX + dropCenterX;

  for (const laneOrig of part.lanes) {
    if (targetLaneId) {
      laneIdMap.set(laneOrig.id, targetLaneId);
    } else {
      const newLaneId = prefix(laneOrig.id);
      laneIdMap.set(laneOrig.id, newLaneId);
      // lane の左端を mapLaneX で変換 = 元 lane 左端 (x) を scale 変換後の位置に置く。 lane 幅も
      // scale して lane 中心が mapLaneX(元 lane 中心) に一致する。 これで multi-lane でも各 lane が
      // part 全体の scale 変換に沿って配置される。
      target.lanes.push({
        ...laneOrig,
        id: newLaneId,
        label: laneOrig.label ?? alias,
        x: mapLaneX(laneOrig.x ?? 0),
        width: laneOrig.width * laneScaleX,
      });
    }
  }

  // parts drop 位置 fix (D1 + D2 root fix):
  //   D2 = parts の stack 番号 (0/1/2/…) が target sequence の stack と衝突すると
  //        CDL layout の rowH 計算で全 lane の同 row cy が拡張、 sequence footer 等が縦 shift。
  //        → 2 段防御 で分離する:
  //             (1) 全 parts node に posX/posY 明示 set (CDL layout の絶対配置経路 = stack 計算 skip)
  //             (2) parts の stack 番号を target 側 max stack + STACK_ISOLATION_OFFSET (1000) に shift
  //                 = 万一 layout が rowH で参照しても sequence stack と重ならず影響 0 化
  //   D1 = drop 座標尊重の縦方向 = parts の元 stack (0..N) から近似 pitch で cy を組み立て、
  //        offsetY を加算して drop 座標付近に描画。 lane.x + lane.width/2 + offsetX で横位置。
  //
  // parts 内部 stack 別の垂直 pitch (world unit) = STACK_PITCH_APPROX。 CDL layout の実 stackGap
  // (~100) + 標準 node h (~140-200) の合計相当。 これは parts の cy を厳密に再現しないが、
  // drop 座標 (dropX, dropY) 付近に parts が中心配置される見た目に十分な近似。
  const STACK_PITCH_APPROX = 220;
  const STACK_ISOLATION_OFFSET = 1000;
  // parts の全 node の中心を drop 座標に合わせるため、 stack 範囲を計算して中心を offsetY に一致させる。
  const partStacks = part.nodes.map((n) => n.stack ?? 0);
  const minStack = partStacks.length > 0 ? Math.min(...partStacks) : 0;
  const maxStack = partStacks.length > 0 ? Math.max(...partStacks) : 0;
  const partCenterStack = (minStack + maxStack) / 2;
  const shouldForcePos = offsetX !== undefined || offsetY !== undefined;
  // target 側の現在 max stack + isolation offset で parts node の stack を shift、
  // sequence の rowH 計算と完全分離 (D2 fix、 posX/posY 明示との 2 段防御)。
  const targetMaxStack = shouldForcePos && target.nodes.length > 0
    ? Math.max(...target.nodes.map((n) => n.stack ?? 0))
    : 0;
  const stackShiftBase = shouldForcePos ? targetMaxStack + STACK_ISOLATION_OFFSET : 0;
  // parts 全体 resize scale (I2 forensic 対応): targetW / targetH 指定時、 parts の元 total size
  // に対する比率 = scale 係数、 全 sub-node の w / h + cx / cy 相対位置に scale 反映。
  // scaleX は lane push と同じ part bbox 幅基準 (laneScaleX) を使う = multi-lane で lane と node の
  // scale 係数が一致する (#880、 lane[0] 幅基準だと非先頭 lane の node がずれる)。
  const partOrigH = Math.max(1, (maxStack - minStack + 1) * STACK_PITCH_APPROX);
  const scaleX = laneScaleX;
  const scaleY = targetH !== undefined && targetH > 0 ? targetH / partOrigH : 1;

  // node merge = id prefix + lane 参照 rewrite + shape / subtitle / value 内 template rewrite
  for (const nodeOrig of part.nodes) {
    const mappedLane = laneIdMap.get(nodeOrig.lane) ?? nodeOrig.lane;
    // codex-review MAJOR fix (§ nested shape template) = recursive walk で shape 内 nested object /
    // array の string leaf 全対象、 前実装は 1 depth のみで `fill: { gradient: "{v}" }` 等 miss。
    let newShape = nodeOrig.shape
      ? deepRewriteStrings(nodeOrig.shape as unknown, rewriteTemplate)
      : undefined;
    // parts 全体 resize (I2 forensic): shape 内 radius / outerRadius / innerRadius / thickness に
    // scale 反映 = user が SE handle drag で拡大すると shape の見た目も比例拡大される。 scaleX を採用
    // (等比 scale 相当、 縦方向 scaleY と乖離する場合は近似)、 shape 内数値 field のうち幾何寸法系
    // のみ scale 適用 (fill / stroke 色 field 等 non-numeric は影響なし)。
    if (newShape && (scaleX !== 1 || scaleY !== 1)) {
      const shapeScale = Math.min(scaleX, scaleY); // 等比 scale で circle 崩れ回避
      const geomKeys = new Set(["radius", "outerRadius", "innerRadius", "thickness"]);
      const scaleGeom = (obj: unknown): unknown => {
        if (obj === null || typeof obj !== "object") return obj;
        if (Array.isArray(obj)) return obj.map(scaleGeom);
        const out: Record<string, unknown> = {};
        for (const [k, v] of Object.entries(obj as Record<string, unknown>)) {
          if (geomKeys.has(k) && typeof v === "number") {
            out[k] = v * shapeScale;
          } else if (typeof v === "object" && v !== null) {
            out[k] = scaleGeom(v);
          } else {
            out[k] = v;
          }
        }
        return out;
      };
      newShape = scaleGeom(newShape) as typeof newShape;
    }
    // parts drop 位置 offset 反映:
    //   - node.posX set 済 (parts が絶対座標を持つ) = その posX を part 中心基準で scale 変換
    //   - offsetX 指定時 (drop 経路) で posX 未設定 = node が属する lane 中央を同じ式で変換
    //   - offset なし (従来経路) は auto layout 継続 (posX undefined)
    //
    // 明示 posX と auto-layout の両経路を、 lane push と同じ単一式 mapLaneX で変換する
    // (cc-codex #879 Round 2/3 MAJOR + #880)。 mapLaneX は part bbox 中心 → drop 座標の scale 変換で、
    // lane / node / 明示 posX / auto-layout の全経路がこの 1 式を共有するため、 lane.x != 0 でも
    // multi-lane でも node 中心と自 lane 中心が一致する。
    let nodePosX: number | undefined = nodeOrig.posX !== undefined ? mapLaneX(nodeOrig.posX) : undefined;
    let nodePosY: number | undefined = nodeOrig.posY !== undefined ? nodeOrig.posY + (offsetY ?? 0) : undefined;
    if (shouldForcePos && nodePosX === undefined) {
      // posX を持たない node は所属 lane の中央 (auto layout の cx 相当) を同じ mapLaneX で変換する。
      const partLane = part.lanes.find((l) => l.id === nodeOrig.lane);
      const laneX = partLane?.x ?? 0;
      const laneW = partLane?.width ?? 320;
      nodePosX = mapLaneX(laneX + laneW / 2);
    }
    if (shouldForcePos && nodePosY === undefined) {
      // parts の元 stack から近似 pitch で cy を組み立て、 全 parts の中心が offsetY に来るよう調整、
      // scaleY で拡大縮小反映
      const stack = nodeOrig.stack ?? 0;
      nodePosY = (stack - partCenterStack) * STACK_PITCH_APPROX * scaleY + (offsetY ?? 0);
    }
    // parts sub-node の w / h に scale 適用 (I2 forensic 対応、 targetW/H 指定時のみ)
    const nodeW = nodeOrig.w !== undefined && (scaleX !== 1 || scaleY !== 1)
      ? nodeOrig.w * scaleX
      : nodeOrig.w;
    const nodeH = nodeOrig.h !== undefined && (scaleX !== 1 || scaleY !== 1)
      ? nodeOrig.h * scaleY
      : nodeOrig.h;
    target.nodes.push({
      ...nodeOrig,
      id: prefix(nodeOrig.id),
      lane: mappedLane,
      title: rewriteTemplate(nodeOrig.title) ?? nodeOrig.title,
      subtitle: rewriteTemplate(nodeOrig.subtitle),
      value: rewriteTemplate(nodeOrig.value),
      // parts stack を target 側と分離 (D2 fix、 posX/posY 明示との 2 段防御)
      stack: (nodeOrig.stack ?? 0) + stackShiftBase,
      ...(newShape ? { shape: newShape as CdlDiagram["nodes"][number]["shape"] } : {}),
      ...(nodePosX !== undefined ? { posX: nodePosX } : {}),
      ...(nodePosY !== undefined ? { posY: nodePosY } : {}),
      ...(nodeW !== undefined ? { w: nodeW } : {}),
      ...(nodeH !== undefined ? { h: nodeH } : {}),
    });
  }

  // state merge = id prefix + initial override
  for (const stateOrig of part.states) {
    const overrideVal = stateOverride[stateOrig.id];
    target.states.push({
      id: prefix(stateOrig.id),
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
  if (target.phases.length === 0) {
    // target に phase なし = parts phase をそのまま追加 (prefix 付き)
    for (const phaseOrig of part.phases) {
      target.phases.push({
        ...phaseOrig,
        id: prefix(phaseOrig.id),
        activate: phaseOrig.activate.map(prefix),
        tweens: phaseOrig.tweens.map((t) => ({ ...t, stateId: prefix(t.stateId) })),
        sets: phaseOrig.sets.map((s) => ({ ...s, stateId: prefix(s.stateId) })),
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
      targetPhase.tweens = [...targetPhase.tweens, ...partPhase.tweens.map((t) => ({ ...t, stateId: prefix(t.stateId) }))];
      targetPhase.sets = [...targetPhase.sets, ...partPhase.sets.map((s) => ({ ...s, stateId: prefix(s.stateId) }))];
    }
    // parts phase 余剰は append (target より parts が長い場合)
    for (let i = commonLen; i < partsLen; i++) {
      const phaseOrig = part.phases[i]!;
      target.phases.push({
        ...phaseOrig,
        id: prefix(phaseOrig.id),
        activate: phaseOrig.activate.map(prefix),
        tweens: phaseOrig.tweens.map((t) => ({ ...t, stateId: prefix(t.stateId) })),
        sets: phaseOrig.sets.map((s) => ({ ...s, stateId: prefix(s.stateId) })),
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
  // actor の主要 node を preset 種別で回収する。 sequence / solidity は header/footer を対で生成する
  // preset で主要 node は header、 それ以外の preset は actor 名 slug がそのまま node id になる。
  //
  // seq-like の非 animate 経路は実 node id を CDL preset 側 slugify (`_` → `-` 置換 + 全角正規化) で
  // 生成する。 dragon slugify (`_` / 全角 保持) で `{slug}-header` を決め打つと、 actor `A_B` の
  // primaryNodeId `a_b-header` が実 node `a-b-header` と食い違い、 inline option (subtitle / eyebrow /
  // value / rows) が drop する (#881、 #873 / #877 と同根の dragon⇔CDL slug 不一致)。 lane.label は
  // 両 slug 経路とも actor.name の生値なので (#877)、 actor 専用 lane を label 一致で引き当て、 その
  // lane 内の `-header` node を権威 primary として回収する。 slug 決め打ちを廃して実装差を構造的に吸収。
  //
  // 経路を preset 種別 (isSeqLike) で分け、 かつ lane.label / node id を actor.name の exact 一致で
  // 引くことで、 actor 名 "A Header" の slug `a-header` が actor "A" の node に漏れる cross-actor leak
  // (#879) も同時に断つ。
  const isSeqLike = doc.type === "sequence" || doc.type === "solidity";
  // actor inline option → node merge
  for (const a of doc.actors) {
    const dragonSlug = slugify(a.name);
    let primaryNodes: CdlDiagram["nodes"];
    if (isSeqLike) {
      const ownedLaneIds = new Set(
        diagram.lanes.filter((l) => l.label === a.name).map((l) => l.id),
      );
      // lane.label で actor 専用 lane を引けた場合はその lane の header node を回収する。 引けない
      // (label 未設定等の) preset は従来どおり dragon slug の `{slug}-header` 決め打ちに fallback する。
      //
      // header node id は `{laneId}-header` の構造。 `endsWith("-header")` で判定すると step box
      // `s{idx}-{laneId}` が actor 名末尾 "Header" (slug `...-header`) で誤マッチし、 option が invisible
      // な step anchor にも copy される (cc-codex #883 MAJOR)。 lane id との構造 exact 一致で header だけを
      // 引くことで step box / spacer / footer を排除する。
      primaryNodes = ownedLaneIds.size > 0
        ? diagram.nodes.filter((n) => ownedLaneIds.has(n.lane) && n.id === `${n.lane}-header`)
        : diagram.nodes.filter((n) => n.id === `${dragonSlug}-header`);
    } else {
      // 非 seq preset は 1 actor = 1 node (id = dragon slug) で node id と dragon slug が一致する。
      primaryNodes = diagram.nodes.filter((n) => n.id === dragonSlug);
    }
    for (const node of primaryNodes) {
      if (a.subtitle !== undefined) node.subtitle = a.subtitle;
      if (a.eyebrow !== undefined) node.eyebrow = a.eyebrow;
      if (a.value !== undefined) node.value = a.value;
      if (a.rows !== undefined) node.rows = a.rows;
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
  // viewport.width / height / gap / laneGap / nodeGap / scale / labelMargin → CdlDiagram.viewport に集約
  if (doc.viewport) {
    diagram.viewport = {
      ...(diagram.viewport ?? {}),
      ...(doc.viewport.width !== undefined ? { width: doc.viewport.width } : {}),
      ...(doc.viewport.height !== undefined ? { height: doc.viewport.height } : {}),
      ...(doc.viewport.gap !== undefined ? { gap: doc.viewport.gap } : {}),
      ...(doc.viewport.laneGap !== undefined ? { laneGap: doc.viewport.laneGap } : {}),
      ...(doc.viewport.nodeGap !== undefined ? { nodeGap: doc.viewport.nodeGap } : {}),
      ...(doc.viewport.scale !== undefined ? { scale: doc.viewport.scale } : {}),
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
    // canvas pivot 新 spec = actor.posX/posY set 済なら CDL layout skip 経路に流す。
    // sequence preset の lane はここで生成、 posW/posH は lane 全体の rect を上書き。
    const laneOpts: Parameters<typeof b.lane>[1] = { width: laneW, label: a.name, lifeline: true };
    if (a.posX !== undefined && a.posY !== undefined) {
      laneOpts.posX = a.posX;
      laneOpts.posY = a.posY;
      if (a.posW !== undefined) laneOpts.posW = a.posW;
      if (a.posH !== undefined) laneOpts.posH = a.posH;
    }
    b.lane(id, laneOpts);
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

// cardinality token を「単語の途中でない」 境界で囲んだ RegExp を作る (parse / strip で共有する SSOT)。
// 前後が identifier 文字 (英数字 + アンダースコア) なら token とみなさない = `column:Metadata` の `n:M` /
// `10:11:12` の `1:1` / `field_1:N` の `1:N` を cardinality と誤認して壊すのを防ぐ
// (cc-codex #879 Round 9/10/11)。 `_` を含むのは ER label が DB schema 由来で snake_case 命名が多く、
// `_` 直後に cardinality 様の部分列が来る label が現実的に起こるため (`field_1:N` / `parent_N:M_child`)。
// strip と parse で別々に pattern.test / replace すると境界規則が drift するため、 この 1 関数を両経路で使う。
function boundedCardinalityRegExp(pattern: RegExp, extraFlags = ""): RegExp {
  const base = pattern.flags.includes("i") ? "i" : "";
  return new RegExp(`(?<![A-Za-z0-9_])(?:${pattern.source})(?![A-Za-z0-9_])`, base + extraFlags);
}

function parseCardinalityFromLabel(label: string): ErRelationCardinality | null {
  for (const [pattern, card] of CARDINALITY_PATTERNS) {
    if (boundedCardinalityRegExp(pattern).test(label)) return card;
  }
  return null;
}

// stripCardinality が「水平空白」 として畳んでよい文字を明示列挙する (space / tab / 全角空白 U+3000)。
// 改行系 (LF / CR / U+2028 line separator / U+2029 paragraph separator / vertical tab / form feed) は
// 含めない = これらは label の行構造として保持する (cc-codex #879 Round 5/6 指摘 = `\s` / `[^\S\r\n]`
// では Unicode 行区切りや CRLF を誤って畳んでしまう)。 括弧除去側と正規化側で同じ class を共有する。
const HORIZONTAL_WS = " \\t\\u3000";
const HWS = `[${HORIZONTAL_WS}]`;

function stripCardinality(label: string): string {
  let r = label;
  let removed = false;
  for (const [pattern] of CARDINALITY_PATTERNS) {
    // cardinality token を「それを囲む括弧ごと 1 単位」 で除去する。
    // まず `(1:N)` のように token を直接包む括弧つき形を除去し、 次に裸の token を除去する。
    // 括弧を token 単位で消すことで、 label 中の cardinality と無関係な正当な括弧 (例
    // `fn() now` の `()`) を壊さない (cc-codex #879 Round 4 指摘 = 空括弧の全域除去は過剰)。
    // 括弧と token の間は水平空白のみ許容し、 改行を挟む形 (`(\n1:N\n)`) は括弧除去の対象外にする
    // (改行を消費して行構造を壊すのを防ぐ、 Round 6 Finding 2)。
    const src = pattern.source;
    const flags = pattern.flags.includes("i") ? "gi" : "g";
    const before = r;
    r = r.replace(new RegExp(`\\(${HWS}*${src}${HWS}*\\)`, flags), "");
    // 裸 token 除去 = parse と同じ単語境界付き matcher (boundedCardinalityRegExp) を global で適用する。
    // 前後が英数字なら token とみなさないため、 timestamp (`10:11:12`) / 比率 (`10:11`) / alphabet 埋め込み
    // (`column:Metadata`) を壊さず、 同一 token の複数出現 (`1:N and 1:N`) は全て消す。 parse 側と境界規則を
    // 単一 SSOT にすることで strip/parse の乖離 (strip は消すが parse は残す等) を構造的に防ぐ
    // (cc-codex #879 Round 9/10 = 数字境界だけ / strip 側だけの修正では 2 経路 drift + alphabet 埋め込み穴)。
    r = r.replace(boundedCardinalityRegExp(pattern, "g"), "");
    if (r !== before) removed = true;
  }
  // token を除去していない label は空白を一切いじらない (無条件適用でも改行 / 複数空白を保持する、
  // cc-codex #879 Round 5 指摘 = 無条件正規化は改行を含む label を破壊した)。
  if (!removed) return label;
  // 除去で生じた水平空白 (space / tab / 全角空白) のみ単一化する (例 "A 1:N B" → "A  B" → "A B")。
  // 改行系は HWS に含めないため保持される。
  //   - 各行内の連続水平空白を単一化
  //   - 改行 (LF / CR) の前後の水平空白を除去 (改行直前の trailing 空白も落とす)
  r = r
    .replace(new RegExp(`${HWS}{2,}`, "g"), " ")
    .replace(new RegExp(`${HWS}*([\\r\\n])${HWS}*`, "g"), "$1")
    .replace(new RegExp(`^${HWS}+|${HWS}+$`, "g"), "");
  // fallback = cardinality 除去後に「視覚的に意味のある文字」 が残らない場合は元 label を返す
  // (Round 6 Finding 1 = 除去後に空白/不可視文字だけ残ると不可視 label になるのを防ぐ)。
  //
  // 「意味のある文字」 の判定は個別の空白/不可視文字を列挙 (denylist) すると際限が無く、
  // Round 7 で `\s` → `\p{White_Space}` に変えたら NEL は拾えたが BOM を落とす等のいたちごっこに
  // なった (cc-codex #879 Round 7/8/9)。 そこで Unicode の「見えない文字」 を 4 カテゴリで構造的に
  // 判定する = 以下のいずれでもない可視文字が 1 つでもあれば意味あり。
  //   - White_Space ... 全空白 (space / tab / NBSP / NEL / 全角空白 / 各種 Unicode space / 改行系)
  //   - Cf (Format) ... BOM / ZWSP / ZWNJ / ZWJ / WORD JOINER / soft hyphen 等
  //   - Cc (Control) ... 制御文字
  //   - Default_Ignorable_Code_Point ... variation selector (Mn) / Hangul filler (Lo) 等、 Cf に
  //     入らない不可視文字 (Cf/Cc/White_Space だけでは取りこぼすと Round 9 で判明)
  // 4 カテゴリで Unicode の非表示文字を網羅する (Braille blank U+2800 や通常文字は content 維持)。
  const hasVisible = /[^\p{White_Space}\p{Cf}\p{Cc}\p{Default_Ignorable_Code_Point}]/u.test(r);
  return hasVisible ? r : label;
}
