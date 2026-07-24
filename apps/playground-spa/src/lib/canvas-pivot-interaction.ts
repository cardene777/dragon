/**
 * canvas pivot 新 spec の drag / resize interaction logic (dragon canvas pivot spec §product-spec-redefinition)。
 *
 * SVG 上の element (data-cdl-lane / data-cdl-node / data-cdl-edge) を対象に、
 * pointer down → move (live CSS transform) → up (DSL 側 posX/posY/posW/posH write back) の
 * 3 phase で Miro 相当 free drag / resize を実現する。
 *
 * spec 対応:
 * - spec 項目 1 = 自由移動 (drag body)
 * - spec 項目 2 = 自由 resize (四隅 handle、 aspect 固定)
 * - spec 項目 3 = 図単位 resize (図の bounding box 四隅 handle、 内部パーツを比例縮尺)
 *
 * DSL 側書出しは actor entry の inline mapping に posX/posY/posW/posH を追記する経路、
 * 「- ユーザー: { posX: 200, posY: 300 }」 のように actor 名 → inline map 展開。
 */

export type PartKind = "lane" | "node" | "edge";
export type ResizeCorner = "nw" | "ne" | "sw" | "se";
export type InteractionMode = "drag" | "resize" | "diagram-resize";

export interface PartHandle {
  /** どの target と紐づく handle か (該当 element data-*= の値、 actor 名相当) */
  targetId: string;
  /** 内部 kind 情報 (drag semantic 判定に使用) */
  kind: PartKind;
  /** hover したときの SVG bounding rect (client coord) */
  rect: DOMRect;
}

export interface DragState {
  mode: InteractionMode;
  /** DSL 側で識別される actor 名 (write back key) */
  targetName: string;
  /** drag 開始時の client 座標 */
  startClientX: number;
  startClientY: number;
  /** drag 開始時の viewBox 座標 (getCTM inverse で client → SVG 変換) */
  startSvgX: number;
  startSvgY: number;
  /** drag 開始時の DSL 側 posX/posY (未指定なら 0) */
  initPosX: number;
  initPosY: number;
  /** resize 用 = drag 開始時の DSL 側 posW/posH */
  initPosW?: number;
  initPosH?: number;
  /** resize corner (mode='resize' or 'diagram-resize' のみ) */
  corner?: ResizeCorner;
  /** viewBox 単位 の SVG 座標変換行列 (client → SVG のスケール) */
  svgScale: number;
  /** commandBypass = Cmd キー押下フラグ (PR-C で自動調整無効化に利用) */
  commandBypass: boolean;
  /**
   * canvas pivot UX 修正 = resize 対象の individual SVG element の CSS selector。
   * mode='resize' で hover した実 element を単一で resize するために保持 (parent lane 全体を bulk 拡大しない)。
   */
  hoveredSelector?: string;
  /**
   * canvas pivot UX 修正 (B1 individual node isolation) = 対象 sub-node key (`header` / `footer` /
   * `spacer` / `s0` 等)。 set 時 (findDragTarget が data-cdl-node の suffix / prefix pattern から抽出)
   * は updateActorNodePosition (nested `nodes: { subKey: {...} }` 書出し) 経路、 未 set 時は actor 全体
   * updateActorPosition 経路。 lane 全体を触らず個別 sub-node のみ固定する SSOT。
   */
  subNodeKey?: string;
  /**
   * Task #65 fix = drag 開始時の SVG CTM inverse matrix (client → SVG world 変換行列)。
   *
   * 従来 = updateElementInteraction 内で毎回 svg.getScreenCTM() を再取得、 svg element が hover 追跡
   * 等の副次 re-render で更新されると getScreenCTM が異なる matrix を返し、 client → world 変換が
   * 途中で狂う。 実測 = drag 中 step 9 → 10 で svgPt.x が同じ値を返し element が特定位置で凍る
   * (user 目視「マウスと関係ない場所に飛ぶ / 決まった軌道で動く」 の root cause)。
   *
   * 修正 = drag 開始時に inverse matrix を capture、 以降は保存 matrix で自前変換 = svg element 変化に
   * 完全不変な drag 挙動を実現。
   */
  startCtmInverse?: DOMMatrix;
}

/**
 * DSL 側から全 actor 名を抽出する。
 * 対応 pattern:
 *   - `  - name`
 *   - `  - name: kind`
 *   - `  - name: { kind: ..., ... }`
 *   - `  - "quoted name"` 等の quote 付き
 */
export function extractAllActorNames(src: string): string[] {
  const out: string[] = [];
  const lines = src.split("\n");
  let inActors = false;
  for (const line of lines) {
    const trimmed = line.trim();
    if (/^actors\s*:\s*$/.test(trimmed)) {
      inActors = true;
      continue;
    }
    // 別 top-level key が来たら actors block 終了
    if (inActors && /^[a-zA-Z]+\s*:/.test(trimmed) && !/^-\s/.test(trimmed)) {
      inActors = false;
    }
    if (!inActors) continue;
    const m = trimmed.match(/^-\s*("[^"]+"|\S+?)(\s*:\s*|\s*$)/);
    if (m) {
      const raw = m[1]!;
      const name = raw.replace(/^"(.+)"$/, "$1");
      out.push(name);
    }
  }
  return out;
}

/**
 * slugify (dragon compile.ts の logic と一致)。
 * カタカナ範囲は ァ-ヶ (U+30A1-U+30F6)、 ー (U+30FC 長音記号) と U+30FF は除外され '-' に置換される点に注意。
 * 例: 「ユーザー」 → 「ユ-ザ」 (ー が '-' 化)、 CDL の data-cdl-lane 属性値と一致。
 */
export function slugify(s: string): string {
  return (
    s
      .toLowerCase()
      .normalize("NFKC")
      .replace(/[^a-z0-9ぁ-んァ-ヶ一-龯\-_]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 64) || "n"
  );
}

/**
 * SVG element を親から辿り、 canvas pivot の drag target になり得るか判定する。
 * data-cdl-lane / data-cdl-node / data-cdl-edge のいずれかを持つ祖先を探す。
 * DSL 側の全 actor 名を渡して、 data-* 属性値 (slug 済み) を DSL 名に逆引きする。
 *
 * canvas pivot UX 修正 (B1) = data-cdl-node hit 時、 sub-node key (`header` / `footer` / `spacer` /
 * `s0` 等) を抽出して返す。 caller は subNodeKey 有無で「actor 全体」 vs 「個別 sub-node」 の 2 段判定を行う。
 * subNodeKey 未検出 = actor 単独 node (flow / class / pie 等の単一 node preset)、 caller は actor 全体経路。
 */
export function findDragTarget(
  el: Element | null,
  actorNames: string[],
): { name: string; kind: PartKind; subNodeKey?: string } | null {
  const slugToName = new Map<string, string>();
  for (const name of actorNames) {
    slugToName.set(slugify(name), name);
    slugToName.set(name, name); // raw も含める (backward compat)
  }
  let cur: Element | null = el;
  while (cur) {
    // canvas pivot UX 修正 (B1) = node → edge → lane の順で判定 (specific → generic)。
    // 旧実装は lane を先に判定し、 node の親 lane 属性を先に hit して subNodeKey なしで return する
    // bug があった (SVG DOM は lane group が node group を包含するため parent traversal で lane が先に来る)。
    // hover 中の handle overlay の elementSelector 生成経路も node → edge → lane 優先で対称化済。
    const node = cur.getAttribute?.("data-cdl-node");
    if (node) {
      const resolved = resolveDslNameWithSubKey(node, slugToName);
      if (resolved) return { name: resolved.name, kind: "node", subNodeKey: resolved.subNodeKey };
    }
    const edge = cur.getAttribute?.("data-cdl-edge");
    if (edge) return { name: edge, kind: "edge" };
    const lane = cur.getAttribute?.("data-cdl-lane");
    if (lane) {
      const dslName = resolveDslName(lane, slugToName);
      if (dslName) return { name: dslName, kind: "lane" };
    }
    cur = cur.parentElement;
  }
  return null;
}

/**
 * data-* 値 (slug 済み) から DSL 側 actor 名に逆引き。
 * sequence preset は header/footer/spacer/s{N}- 等の suffix 付き ID を生成するため suffix 除去 + slug 照合。
 */
function resolveDslName(rawId: string, slugToName: Map<string, string>): string | null {
  const stripped = rawId
    .replace(/-header$/, "")
    .replace(/-footer$/, "")
    .replace(/-spacer$/, "")
    .replace(/^s\d+-/, "");
  return slugToName.get(stripped) ?? null;
}

/**
 * data-cdl-node 値から actor 名 + sub-node key を抽出。
 * pattern:
 *   - `{slug}-header` / `{slug}-footer` / `{slug}-spacer` → subNodeKey = `header` / `footer` / `spacer`
 *   - `s{N}-{slug}` (sequence step box) → subNodeKey = `s{N}`
 *   - `{slug}` (単独 node) → subNodeKey = undefined (actor 全体経路)
 * hit した slug が長いほうを優先することで、 短い slug が別 actor と誤 match することを防ぐ。
 */
export function resolveDslNameWithSubKey(
  rawId: string,
  slugToName: Map<string, string>,
): { name: string; subNodeKey?: string } | null {
  // slug を長さ降順で試行 (`ユ-ザ` と `ユ` が両方存在するケースで長い slug 優先)
  const slugs = Array.from(slugToName.keys()).sort((a, b) => b.length - a.length);
  for (const slug of slugs) {
    if (rawId === slug) return { name: slugToName.get(slug)! };
    // parts merge 系 = `{alias}__{subId}` pattern (CAR-1657 unified syntax の parts 内部 node、
    // 例 achievement1__arc / achievement1__ring)、 `__` 区切りで alias 抽出 + subKey 保持。
    // 前実装は `-` 区切りしか認識せず parts sub-node が hover 対象として認識されなかった bug の fix。
    if (rawId.startsWith(`${slug}__`)) {
      const suffix = rawId.slice(slug.length + 2);
      return { name: slugToName.get(slug)!, subNodeKey: suffix };
    }
    // subagent review MAJOR-2 対応 = slug 自体が `s\d+` pattern (state-machine actor 名 `s0` / `s1` 等)
    // の場合、 startsWith 経路を skip する。 例 actor 名 = [`s0`, `x`]、 rawId = `s0-x` (step-box 0 for x)
    // は endsWith 経路で `{ name: "x", subNodeKey: "s0" }` が正解、 startsWith(`s0-`) 経路を先に取ると
    // `{ name: "s0", subNodeKey: "x" }` に誤 hit する silent bug。 endsWith 分岐 (下 `/^s\d+$/` guard)
    // と対称化して step-box 命名規約を優先する。
    if (rawId.startsWith(`${slug}-`) && !/^s\d+$/.test(slug)) {
      const suffix = rawId.slice(slug.length + 1);
      return { name: slugToName.get(slug)!, subNodeKey: suffix };
    }
    if (rawId.endsWith(`-${slug}`)) {
      const prefix = rawId.slice(0, rawId.length - slug.length - 1);
      // step box pattern `s{N}-{slug}` = prefix が `s\d+` に限定 (別 preset の任意 prefix と衝突回避)
      if (/^s\d+$/.test(prefix)) return { name: slugToName.get(slug)!, subNodeKey: prefix };
    }
  }
  return null;
}

/**
 * client 座標 → SVG viewBox 座標変換 (getCTM inverse)。
 */
export function clientToSvg(svg: SVGSVGElement, clientX: number, clientY: number): { x: number; y: number; scale: number } {
  const pt = svg.createSVGPoint();
  pt.x = clientX;
  pt.y = clientY;
  const ctm = svg.getScreenCTM();
  if (!ctm) return { x: clientX, y: clientY, scale: 1 };
  const svgPt = pt.matrixTransform(ctm.inverse());
  return { x: svgPt.x, y: svgPt.y, scale: Math.abs(ctm.a) };
}

/**
 * parts 追加時の world 配置座標を決める pure function 群。
 *
 * 設計 = SVG / DOM への依存を「client → world 変換」 と「描画済 element の rect 列」 の 2 入力に絞り、
 * 座標決定 logic を DOM 非依存で unit test できる形にする (CdlEditor から呼ばれる)。
 */

/** 描画済 element 1 個の world bbox (呼出側が client rect を world 変換して渡す)。 */
export interface WorldRect {
  id: string;
  minX: number;
  maxX: number;
  maxY: number;
}

/** parts 配置座標。 world 変換不能時は null (呼出側は posX/posY を書かず compile 側 fallback に委ねる)。 */
export interface PartPlacement {
  x: number;
  y: number;
}

/**
 * click 追加時の配置座標 = 「今見えている viewport 中央付近の空いた場所」。
 *
 * 縦は既存 content の下端の下に置いて重なりを避ける (中央に既存 sequence があると重なり、 resize
 * handle も occlude されるため)。 横は viewport 中央 X を content 範囲に clamp して中央付近を保つ。
 * content が 1 つも無い (空 diagram) 場合は viewport 中央そのものを使う。
 *
 * `rects` には parts merge 由来 (`__` を含む id) も含めて渡す = parts-only diagram で 2 個目以降を
 * 追加する時、 既存 parts の下に積んで重なりを避けるため (#876)。
 *
 * @param rects       描画済 element の world bbox 列 (空なら content なし扱い)
 * @param center      viewport 中央の world 座標
 * @param partSpanH   追加する part の world 高さ (stack span × pitch)
 * @param margin      content 下端からの余白 (world unit)
 */
export function resolveClickPlacement(
  rects: readonly WorldRect[],
  center: PartPlacement,
  partSpanH: number,
  margin = 120,
): PartPlacement {
  if (rects.length === 0) return { x: center.x, y: center.y };
  let minX = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const r of rects) {
    minX = Math.min(minX, r.minX);
    maxX = Math.max(maxX, r.maxX);
    maxY = Math.max(maxY, r.maxY);
  }
  if (!Number.isFinite(minX) || !Number.isFinite(maxX) || !Number.isFinite(maxY)) {
    return { x: center.x, y: center.y };
  }
  return {
    x: Math.max(minX, Math.min(maxX, center.x)),
    y: maxY + partSpanH / 2 + margin,
  };
}

/**
 * SVG から world 座標を引く経路の guard = getScreenCTM が null (SVG 非表示 / detached) なら null を返す。
 *
 * `clientToSvg` は CTM 不在時に raw client 座標をそのまま返す fail-open 仕様のため、 呼出側でそのまま
 * 使うと world 変換されていない座標が DSL に永続化され parts が意図しない位置に飛ぶ。 本関数は
 * 「変換できたか」 を呼出側が判定できるよう null を返す (#876)。
 */
export function toWorldOrNull(svg: SVGSVGElement, clientX: number, clientY: number): PartPlacement | null {
  const ctm = svg.getScreenCTM();
  if (!ctm) return null;
  const pt = svg.createSVGPoint();
  pt.x = clientX;
  pt.y = clientY;
  const w = pt.matrixTransform(ctm.inverse());
  return { x: w.x, y: w.y };
}

/**
 * hit test = client 座標が rect の四隅 handle (半径 8px CSS) に触れているか判定。
 * touched なら該当 corner を返す、 それ以外は null。
 */
export function hitResizeHandle(clientX: number, clientY: number, rect: DOMRect): ResizeCorner | null {
  const R = 10;
  const corners: Array<{ c: ResizeCorner; x: number; y: number }> = [
    { c: "nw", x: rect.left, y: rect.top },
    { c: "ne", x: rect.right, y: rect.top },
    { c: "sw", x: rect.left, y: rect.bottom },
    { c: "se", x: rect.right, y: rect.bottom },
  ];
  for (const cn of corners) {
    if (Math.abs(clientX - cn.x) <= R && Math.abs(clientY - cn.y) <= R) return cn.c;
  }
  return null;
}

/**
 * DSL src 中の actor entry に posX/posY/posW/posH を write back。
 * 対応 pattern:
 *   1. `  - name` (bare) → `  - name: { posX: N, posY: N }`
 *   2. `  - name: kind` (short) → `  - name: { kind: kind, posX: N, posY: N }`
 *   3. `  - name: { kind: X, ... }` (inline) → posX/posY/posW/posH を追加 or 更新
 */
export function updateActorPosition(
  src: string,
  targetName: string,
  posX: number,
  posY: number,
  posW?: number,
  posH?: number,
): string {
  const lines = src.split("\n");
  const roundedX = Math.round(posX);
  const roundedY = Math.round(posY);
  const roundedW = posW !== undefined ? Math.round(posW) : undefined;
  const roundedH = posH !== undefined ? Math.round(posH) : undefined;
  const extraFields: string[] = [`posX: ${roundedX}`, `posY: ${roundedY}`];
  if (roundedW !== undefined) extraFields.push(`posW: ${roundedW}`);
  if (roundedH !== undefined) extraFields.push(`posH: ${roundedH}`);

  const nextLines = lines.map((line) => {
    // (3) inline mapping (depth-aware = nested `nodes: {...}` を含む inner も正確に切出す)
    const extract = extractActorInlineMapLine(line, targetName);
    if (extract) {
      const { prefix, name, sep, inner, suffix } = extract;
      // 既存 top-level pos[XYWH] field を除去、 新 extraFields を末尾に追加
      const parts = splitDepthAwareCommas(inner);
      const kept = parts
        .map((s) => s.trim())
        .filter((s) => s && !/^pos[XYWH]\s*:/.test(s));
      const newInner = [...kept, ...extraFields].filter(Boolean).join(", ");
      return `${prefix}${name}${sep}{ ${newInner} }${suffix}`;
    }
    // (2) short form
    const shortMatch = line.match(/^(\s*-\s*)("[^"]+"|\S+?)(\s*:\s*)([^\s{][^\n]*)$/);
    if (shortMatch && stripQuotes(shortMatch[2]!) === targetName) {
      const [, sPrefix, sName, sSep, kind] = shortMatch;
      return `${sPrefix}${sName}${sSep}{ kind: ${kind!.trim()}, ${extraFields.join(", ")} }`;
    }
    // (1) bare
    const bareMatch = line.match(/^(\s*-\s*)("[^"]+"|\S+)\s*$/);
    if (bareMatch && stripQuotes(bareMatch[2]!) === targetName) {
      const [, bPrefix, bName] = bareMatch;
      return `${bPrefix}${bName}: { ${extraFields.join(", ")} }`;
    }
    return line;
  });
  return nextLines.join("\n");
}

function stripQuotes(s: string): string {
  return s.replace(/^"(.+)"$/, "$1").trim();
}

/**
 * 図単位 resize = 図の bounding box の四隅 handle drag で内部パーツ全体を比例縮尺。
 * 各パーツの posX/posY/posW/posH を factor 倍して新 pos に置換。
 */
export function scaleDiagramPositions(
  src: string,
  targetNames: string[],
  factor: number,
  originX: number,
  originY: number,
): string {
  let out = src;
  for (const name of targetNames) {
    const info = extractActorPosition(out, name);
    if (!info) continue;
    const newX = originX + (info.posX - originX) * factor;
    const newY = originY + (info.posY - originY) * factor;
    const newW = info.posW !== undefined ? info.posW * factor : undefined;
    const newH = info.posH !== undefined ? info.posH * factor : undefined;
    out = updateActorPosition(out, name, newX, newY, newW, newH);
  }
  return out;
}

/**
 * canvas pivot UX 修正 (B1) = actor entry の inline map に nested `nodes: { subKey: { posX/Y/W/H } }`
 * を追加 or 更新する。 sub-node 単位で「絶対座標 / サイズ」 を固定、 lane 全体を触らないため
 * 同 actor の他 sub-node (spacer / footer / s{N} 等) の auto layout が保持される。
 *
 * 対応 pattern (updateActorPosition と同じ 3 形式に対応):
 *   1. `  - name`                    → `  - name: { nodes: { {subKey}: { posX:..., ... } } }`
 *   2. `  - name: kind`              → `  - name: { kind: kind, nodes: { {subKey}: { ... } } }`
 *   3. `  - name: { existing... }`   → depth-aware で inner から nodes field を検出し merge (nested subKey 上書き)
 *
 * `updateActorPosition` (actor 全体 posX/Y 書出し) とは補完関係、 caller は subNodeKey 有無で使い分ける。
 */
export function updateActorNodePosition(
  src: string,
  targetName: string,
  subNodeKey: string,
  posX: number,
  posY: number,
  posW?: number,
  posH?: number,
): string {
  const roundedX = Math.round(posX);
  const roundedY = Math.round(posY);
  const roundedW = posW !== undefined ? Math.round(posW) : undefined;
  const roundedH = posH !== undefined ? Math.round(posH) : undefined;
  const subFields: string[] = [`posX: ${roundedX}`, `posY: ${roundedY}`];
  if (roundedW !== undefined) subFields.push(`posW: ${roundedW}`);
  if (roundedH !== undefined) subFields.push(`posH: ${roundedH}`);
  const subMapText = `{ ${subFields.join(", ")} }`;

  const lines = src.split("\n");
  const nextLines = lines.map((line) => {
    // (3) inline mapping (depth-aware = nested { } を含む値も抽出、 outer brace を正確に切出す)
    const inlineExtract = extractActorInlineMapLine(line, targetName);
    if (inlineExtract) {
      const { prefix, name, sep, inner, suffix } = inlineExtract;
      const rewrittenInner = mergeNodesFieldInInner(inner, subNodeKey, subMapText);
      return `${prefix}${name}${sep}{ ${rewrittenInner} }${suffix}`;
    }
    // (2) short form: `- name: kind`
    const shortMatch = line.match(/^(\s*-\s*)("[^"]+"|\S+?)(\s*:\s*)([^\s{][^\n]*)$/);
    if (shortMatch && stripQuotes(shortMatch[2]!) === targetName) {
      const [, sPrefix, sName, sSep, kind] = shortMatch;
      return `${sPrefix}${sName}${sSep}{ kind: ${kind!.trim()}, nodes: { ${subNodeKey}: ${subMapText} } }`;
    }
    // (1) bare: `- name`
    const bareMatch = line.match(/^(\s*-\s*)("[^"]+"|\S+)\s*$/);
    if (bareMatch && stripQuotes(bareMatch[2]!) === targetName) {
      const [, bPrefix, bName] = bareMatch;
      return `${bPrefix}${bName}: { nodes: { ${subNodeKey}: ${subMapText} } }`;
    }
    return line;
  });
  return nextLines.join("\n");
}

/**
 * 対象 actor 行の inline mapping を depth-aware に抽出する (nested `{ }` 値も正確に切出す)。
 * updateActorPosition の regex 版 (`\{([^}]*)\}` の flat brace) と違い、 本 fn は brace depth を数えて
 * nested `{ }` を含む inner を1件の inner として返す。 `nodes: { header: { posX: 10 } }` のような
 * ネスト構造を含む actor entry に対応するために必要。
 */
function extractActorInlineMapLine(
  line: string,
  targetName: string,
): { prefix: string; name: string; sep: string; inner: string; suffix: string } | null {
  const headMatch = line.match(/^(\s*-\s*)("[^"]+"|\S+?)(\s*:\s*)\{/);
  if (!headMatch) return null;
  if (stripQuotes(headMatch[2]!) !== targetName) return null;
  const [, prefix, name, sep] = headMatch;
  const braceStart = headMatch[0]!.length - 1; // '{' の位置
  let depth = 0;
  let endIdx = -1;
  for (let i = braceStart; i < line.length; i += 1) {
    const c = line[i]!;
    if (c === "{") depth += 1;
    else if (c === "}") {
      depth -= 1;
      if (depth === 0) {
        endIdx = i;
        break;
      }
    }
  }
  if (endIdx < 0) return null;
  const inner = line.slice(braceStart + 1, endIdx);
  const suffix = line.slice(endIdx + 1);
  return { prefix: prefix!, name: name!, sep: sep!, inner, suffix };
}

/**
 * actor entry inline map の inner 文字列内で `nodes: { ... }` field を検出、
 * 指定 subKey を「新規追加 / 既存 subKey 上書き」 で merge する。 nodes field 未存在なら append。
 * その他既存 field (kind / subtitle / posX 等) は保持。
 */
function mergeNodesFieldInInner(inner: string, subNodeKey: string, subMapText: string): string {
  const parts = splitDepthAwareCommas(inner);
  let nodesIdx = -1;
  let existingNodesInner = "";
  for (let i = 0; i < parts.length; i += 1) {
    const p = parts[i]!;
    const colonIdx = p.indexOf(":");
    if (colonIdx < 0) continue;
    const key = p.slice(0, colonIdx).trim();
    const val = p.slice(colonIdx + 1).trim();
    if (key === "nodes" && val.startsWith("{") && val.endsWith("}")) {
      nodesIdx = i;
      existingNodesInner = val.slice(1, -1).trim();
      break;
    }
  }
  const mergedNodesInner = upsertSubKey(existingNodesInner, subNodeKey, subMapText);
  const nodesField = `nodes: { ${mergedNodesInner} }`;
  if (nodesIdx >= 0) {
    parts[nodesIdx] = nodesField;
  } else {
    parts.push(nodesField);
  }
  return parts.map((p) => p.trim()).filter(Boolean).join(", ");
}

/**
 * `nodes: { ... }` inner の各 subKey ペアから対象 subKey を上書き or 追加。
 * 他 subKey は元のまま保持。
 */
function upsertSubKey(existingInner: string, subNodeKey: string, subMapText: string): string {
  const parts = splitDepthAwareCommas(existingInner);
  let replaced = false;
  const outParts: string[] = [];
  for (const p of parts) {
    const colonIdx = p.indexOf(":");
    if (colonIdx < 0) {
      outParts.push(p);
      continue;
    }
    const key = p.slice(0, colonIdx).trim();
    if (key === subNodeKey) {
      outParts.push(`${subNodeKey}: ${subMapText}`);
      replaced = true;
      continue;
    }
    outParts.push(p.trim());
  }
  if (!replaced) outParts.push(`${subNodeKey}: ${subMapText}`);
  return outParts.filter(Boolean).join(", ");
}

/**
 * comma split で nested `[ ]` / `{ }` 内の comma を無視する depth-aware split。
 * parseInlineMapping の logic を local reuse。
 */
function splitDepthAwareCommas(s: string): string[] {
  const parts: string[] = [];
  let depth = 0;
  let buf = "";
  for (let i = 0; i < s.length; i += 1) {
    const c = s[i]!;
    if (c === "[" || c === "{") depth += 1;
    else if (c === "]" || c === "}") depth -= 1;
    if (c === "," && depth === 0) {
      parts.push(buf);
      buf = "";
      continue;
    }
    buf += c;
  }
  if (buf.trim()) parts.push(buf);
  return parts;
}

/**
 * DSL src から actor 名の nested `nodes: { subKey: { posX/Y/W/H } }` を抽出。
 * 該当 actor entry の inner から nodes field を depth-aware に切出、 各 subKey の 4 field を返す。
 * subKey 単位で resize handler の init 値 (drag delta の起点) 用途。
 */
export function extractActorNodePosition(
  src: string,
  targetName: string,
  subNodeKey: string,
): { posX: number; posY: number; posW?: number; posH?: number } | null {
  for (const line of src.split("\n")) {
    const extract = extractActorInlineMapLine(line, targetName);
    if (!extract) continue;
    const nodesField = findFieldValue(extract.inner, "nodes");
    if (!nodesField || !nodesField.startsWith("{") || !nodesField.endsWith("}")) return null;
    const subInner = nodesField.slice(1, -1).trim();
    const subMap = findFieldValue(subInner, subNodeKey);
    if (!subMap || !subMap.startsWith("{") || !subMap.endsWith("}")) return null;
    const nodeInner = subMap.slice(1, -1);
    const px = nodeInner.match(/posX\s*:\s*(-?\d+(?:\.\d+)?)/);
    const py = nodeInner.match(/posY\s*:\s*(-?\d+(?:\.\d+)?)/);
    const pw = nodeInner.match(/posW\s*:\s*(-?\d+(?:\.\d+)?)/);
    const ph = nodeInner.match(/posH\s*:\s*(-?\d+(?:\.\d+)?)/);
    if (!px || !py) return null;
    return {
      posX: parseFloat(px[1]!),
      posY: parseFloat(py[1]!),
      posW: pw ? parseFloat(pw[1]!) : undefined,
      posH: ph ? parseFloat(ph[1]!) : undefined,
    };
  }
  return null;
}

function findFieldValue(inner: string, key: string): string | null {
  const parts = splitDepthAwareCommas(inner);
  for (const p of parts) {
    const colonIdx = p.indexOf(":");
    if (colonIdx < 0) continue;
    if (p.slice(0, colonIdx).trim() === key) return p.slice(colonIdx + 1).trim();
  }
  return null;
}

/**
 * DSL src から actor 名の posX/posY/posW/posH を抽出。
 * canvas pivot UX 修正 (B1) 対応 = actor entry が nested `nodes: {...}` を含む場合も depth-aware で
 * outer brace を正確に切出し、 top-level の posX/Y/W/H (actor 全体座標) だけを取り出す。
 */
export function extractActorPosition(src: string, targetName: string): { posX: number; posY: number; posW?: number; posH?: number } | null {
  for (const line of src.split("\n")) {
    const extract = extractActorInlineMapLine(line, targetName);
    if (!extract) continue;
    // top-level field のみから posX/Y を拾う (nested nodes: { header: { posX } } を誤検出しない)
    const px = findFieldValue(extract.inner, "posX");
    const py = findFieldValue(extract.inner, "posY");
    const pw = findFieldValue(extract.inner, "posW");
    const ph = findFieldValue(extract.inner, "posH");
    if (px === null || py === null) return null;
    const nx = parseFloat(px);
    const ny = parseFloat(py);
    if (!Number.isFinite(nx) || !Number.isFinite(ny)) return null;
    return {
      posX: nx,
      posY: ny,
      posW: pw !== null && Number.isFinite(parseFloat(pw)) ? parseFloat(pw) : undefined,
      posH: ph !== null && Number.isFinite(parseFloat(ph)) ? parseFloat(ph) : undefined,
    };
  }
  return null;
}
