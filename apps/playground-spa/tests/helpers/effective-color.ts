/**
 * SVG の枠と線を、計算値から 1 色の地へ合成する共通部。
 *
 * 色の alpha、`fill-opacity`、`stroke-opacity`、要素と祖先の `opacity` は全て計算値として読めるため、
 * 箱の枠と線は同じ式で再現できる。字は半透明の地や host の背景との重なりを計算で再現できなかったので、
 * `pixel-contrast.ts` が描画済みの画素を読む。
 *
 * 地は呼び出し側が渡す舞台の台 1 色に限る。箱の後ろに別の面がある配置は再現しないが、箱の枠は
 * 自分の面との対比で見るため、面が不透明なら地は結果に影響しない。
 */
export type Rgb = [number, number, number];
export type Rgba = { rgb: Rgb; alpha: number };

/** 計算値の色を受け、sRGB 3 成分と色自身の alpha を返す。`none` は描画なしを表す `null`。 */
export function parseColor(value: string): Rgba | null {
  const normalized = value.trim().toLowerCase();
  if (normalized === "none") return null;
  if (normalized === "transparent") return { rgb: [0, 0, 0], alpha: 0 };

  const hex = /^#([0-9a-f]{6})$/i.exec(normalized)?.[1];
  if (hex) {
    const number = Number.parseInt(hex, 16);
    return { rgb: [number >> 16, (number >> 8) & 255, number & 255], alpha: 1 };
  }

  const functional = /^rgba?\((.*)\)$/i.exec(normalized)?.[1];
  if (functional !== undefined) {
    const slash = functional.split("/").map((part) => part.trim());
    if (slash.length > 2) throw new Error(`色として読めない: ${value}`);

    if (functional.includes(",")) {
      const parts = functional.split(",").map((part) => part.trim());
      if (parts.length !== 3 && parts.length !== 4) throw new Error(`色として読めない: ${value}`);
      const channels = parts.slice(0, 3).map(Number);
      const alpha = parts[3] === undefined ? 1 : Number(parts[3]);
      if (channels.some((channel) => !Number.isFinite(channel)) || !Number.isFinite(alpha)) {
        throw new Error(`色として読めない: ${value}`);
      }
      return { rgb: channels as Rgb, alpha };
    }

    const channels = (slash[0] ?? "").split(/\s+/).filter(Boolean).map(Number);
    const alpha = slash[1] === undefined ? 1 : Number(slash[1]);
    if (channels.length !== 3 || channels.some((channel) => !Number.isFinite(channel)) || !Number.isFinite(alpha)) {
      throw new Error(`色として読めない: ${value}`);
    }
    return { rgb: channels as Rgb, alpha };
  }

  throw new Error(`色として読めない: ${value}`);
}

/** 色 C、濃さ A、地 G を受け、各 sRGB 成分の `A·C + (1 − A)·G` を返す。 */
export function over(color: Rgb, alpha: number, ground: Rgb): Rgb {
  return color.map((channel, index) =>
    alpha * channel + (1 - alpha) * ground[index]!,
  ) as Rgb;
}

export type Paint = {
  fill: string;
  fillOpacity: number;
  stroke: string;
  strokeOpacity: number;
  strokeWidth: number;
  opacity: number;
  rendered: boolean;
  attrStrokeOpacity: string | null;
  parentStrokeOpacity: number;
  node: string | null;
  kind: string | null;
  active: boolean;
};

/** SVG 要素列を受け、計算値と自分から documentElement までの opacity の積を要素ごとに返す。 */
export function readPaints(elements: Element[]): Paint[] {
  return elements.map((element) => {
    const style = getComputedStyle(element);
    let opacity = 1;
    let rendered = true;
    for (let current: Element | null = element; current !== null; current = current.parentElement) {
      const currentStyle = getComputedStyle(current);
      opacity *= Number(currentStyle.opacity || 1);
      if (
        currentStyle.display === "none" ||
        currentStyle.visibility === "hidden" ||
        currentStyle.visibility === "collapse"
      ) {
        rendered = false;
      }
    }
    const node = element.closest("[data-cdl-node]");
    const kind = element.closest("[data-cdl-kind]");
    return {
      fill: style.fill,
      fillOpacity: Number(style.fillOpacity || 1),
      stroke: style.stroke,
      strokeOpacity: Number(style.strokeOpacity || 1),
      strokeWidth: Number.parseFloat(style.strokeWidth || "0"),
      opacity,
      rendered,
      attrStrokeOpacity: element.getAttribute("stroke-opacity"),
      parentStrokeOpacity: element.parentElement === null
        ? 1
        : Number(getComputedStyle(element.parentElement).strokeOpacity || 1),
      node: node?.getAttribute("data-cdl-node") ?? null,
      kind: kind?.getAttribute("data-cdl-kind") ?? null,
      active: element.closest('[data-cdl-active="true"]') !== null,
    };
  });
}

/**
 * 1 要素の塗り F / 枠 S と地 G を受け、塗りの実効色と、その上へ枠を描いた実効色を返す。
 * f / s は色の alpha と fill-opacity / stroke-opacity の積、O は要素と祖先の opacity の積。
 * `face = O·f·F + (1 − O·f)·G`
 * `frame = O·(s·S + f·(1 − s)·F) + (1 − O·(s + f·(1 − s)))·G`
 */
export function effectivePaint(
  paint: Pick<Paint, "fill" | "fillOpacity" | "stroke" | "strokeOpacity" | "opacity">,
  ground: Rgb,
): { face: Rgb; frame: Rgb | null } {
  const fill = parseColor(paint.fill);
  const stroke = parseColor(paint.stroke);
  const fillAlpha = (fill?.alpha ?? 0) * paint.fillOpacity;
  const strokeAlpha = (stroke?.alpha ?? 0) * paint.strokeOpacity;
  const fillColor = fill?.rgb ?? ground;
  const face = over(fillColor, paint.opacity * fillAlpha, ground);
  if (stroke === null) return { face, frame: null };

  const coveredAlpha = strokeAlpha + fillAlpha * (1 - strokeAlpha);
  const frame = ground.map((groundChannel, index) =>
    paint.opacity * (
      strokeAlpha * stroke.rgb[index]! +
      fillAlpha * (1 - strokeAlpha) * fillColor[index]!
    ) +
    (1 - paint.opacity * coveredAlpha) * groundChannel,
  ) as Rgb;
  return { face, frame };
}
