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
 */
export function findDragTarget(el: Element | null, actorNames: string[]): { name: string; kind: PartKind } | null {
  const slugToName = new Map<string, string>();
  for (const name of actorNames) {
    slugToName.set(slugify(name), name);
    slugToName.set(name, name); // raw も含める (backward compat)
  }
  let cur: Element | null = el;
  while (cur) {
    const lane = cur.getAttribute?.("data-cdl-lane");
    if (lane) {
      const dslName = resolveDslName(lane, slugToName);
      if (dslName) return { name: dslName, kind: "lane" };
    }
    const node = cur.getAttribute?.("data-cdl-node");
    if (node) {
      const dslName = resolveDslName(node, slugToName);
      if (dslName) return { name: dslName, kind: "node" };
    }
    const edge = cur.getAttribute?.("data-cdl-edge");
    if (edge) return { name: edge, kind: "edge" };
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
    // (3) inline mapping
    const inlineMatch = line.match(/^(\s*-\s*)("[^"]+"|\S+?)(\s*:\s*)\{([^}]*)\}(\s*)$/);
    if (inlineMatch && stripQuotes(inlineMatch[2]) === targetName) {
      const [, prefix, name, sep, inner, suffix] = inlineMatch;
      const cleaned = inner!
        .split(",")
        .map((seg) => seg.trim())
        .filter((seg) => seg && !seg.match(/^pos[XYWH]\s*:/))
        .join(", ");
      const newInner = [cleaned, ...extraFields].filter(Boolean).join(", ");
      return `${prefix}${name}${sep}{ ${newInner} }${suffix}`;
    }
    // (2) short form
    const shortMatch = line.match(/^(\s*-\s*)("[^"]+"|\S+?)(\s*:\s*)([^\s{][^\n]*)$/);
    if (shortMatch && stripQuotes(shortMatch[2]) === targetName) {
      const [, prefix, name, sep, kind] = shortMatch;
      return `${prefix}${name}${sep}{ kind: ${kind!.trim()}, ${extraFields.join(", ")} }`;
    }
    // (1) bare
    const bareMatch = line.match(/^(\s*-\s*)("[^"]+"|\S+)\s*$/);
    if (bareMatch && stripQuotes(bareMatch[2]) === targetName) {
      const [, prefix, name] = bareMatch;
      return `${prefix}${name}: { ${extraFields.join(", ")} }`;
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
 * DSL src から actor 名の posX/posY/posW/posH を抽出。
 */
export function extractActorPosition(src: string, targetName: string): { posX: number; posY: number; posW?: number; posH?: number } | null {
  for (const line of src.split("\n")) {
    const inlineMatch = line.match(/^\s*-\s*("[^"]+"|\S+?)\s*:\s*\{([^}]*)\}\s*$/);
    if (!inlineMatch || stripQuotes(inlineMatch[1]) !== targetName) continue;
    const inner = inlineMatch[2]!;
    const px = inner.match(/posX\s*:\s*(-?\d+(?:\.\d+)?)/);
    const py = inner.match(/posY\s*:\s*(-?\d+(?:\.\d+)?)/);
    const pw = inner.match(/posW\s*:\s*(-?\d+(?:\.\d+)?)/);
    const ph = inner.match(/posH\s*:\s*(-?\d+(?:\.\d+)?)/);
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
