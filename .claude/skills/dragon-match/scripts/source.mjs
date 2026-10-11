/* global document, Element, getComputedStyle, window */
import path from "node:path";
import { pathToFileURL } from "node:url";

const FONT_MARKER = "data-dragon-match-font-id";
const 意匠名 = {
  blueprint: "図面",
  letterpress: "活版",
  catalog: "図録",
  terminal: "端末",
  sketch: "手描き",
  neon: "電飾",
  relief: "浮彫",
};

const STEP_MS = 100;
const MAX_CLOCK_MS = 30_000;
const STILL_STEPS = 15;

const 書体の太さ =
  /\s+(?:Thin|ExtraLight|Light|Regular|Medium|SemiBold|Bold|ExtraBold|Black|Heavy)$/;

function 書体名を整える(value) {
  return value.replace(書体の太さ, "");
}

function 必須の字(value, name) {
  if (typeof value !== "string" || value.trim() === "") {
    throw new Error(`${name} を字で指定してください`);
  }
  return value;
}

function sourceの範囲(source) {
  if (source.region === undefined) return null;
  const region = source.region;
  const valid =
    region !== null &&
    [region.x, region.y, region.width, region.height].every(Number.isFinite) &&
    region.width > 0 &&
    region.height > 0;
  if (!valid) throw new Error("region は正の width / height を持つ { x, y, width, height } にしてください");
  return region;
}

function sourceの無視する字(source) {
  if (source.ignoreTexts === undefined) return [];
  if (!Array.isArray(source.ignoreTexts) || !source.ignoreTexts.every((text) => typeof text === "string")) {
    throw new Error("ignoreTexts は字の配列にしてください");
  }
  return source.ignoreTexts;
}

function baseUrl(value) {
  const raw = 必須の字(value, "catalog.baseUrl");
  return new URL(raw.endsWith("/") ? raw : `${raw}/`);
}

async function 状態(page) {
  return page.evaluate(() => {
    const stage = document.querySelector(".catalog-preview-stage:not([hidden])");
    return {
      index:
        stage?.querySelector("[data-cdl-diagram]")?.getAttribute("data-cdl-phase-index") ??
        null,
      palette:
        stage?.querySelector("svg[data-cdl-stage]")?.getAttribute("data-cdl-palette") ?? null,
      phases: stage?.querySelectorAll(".cdl-phase-seg").length ?? 0,
      body: stage?.querySelector("svg[role=img]")?.innerHTML ?? "",
    };
  });
}

async function 最後まで進める(page, lastPhase) {
  let previous = await 状態(page);
  let still = 0;
  for (let elapsed = 0; elapsed < MAX_CLOCK_MS; elapsed += STEP_MS) {
    await page.clock.runFor(STEP_MS);
    const current = await 状態(page);
    const unchanged =
      current.index === String(lastPhase) &&
      previous.index === current.index &&
      previous.body === current.body;
    still = unchanged ? still + 1 : 0;
    previous = current;
    if (still >= STILL_STEPS) return;
  }
  throw new Error("見本帳の図が最後の段で止まりませんでした");
}

async function catalogを開く(page, source) {
  const pageName = 必須の字(source.page, "catalog.page");
  const name = 必須の字(source.name, "catalog.name");
  const palette = 必須の字(source.palette, "catalog.palette");
  const label = 意匠名[palette];
  if (label === undefined) throw new Error(`catalog.palette が不明です: ${palette}`);

  await page.clock.install({ time: new Date("2026-10-07T09:00:00+09:00") });
  await page.goto(new URL(`catalog/${pageName}`, baseUrl(source.baseUrl)).toString());
  await page.waitForLoadState("networkidle");
  await page.clock.pauseAt(new Date("2026-10-07T09:10:00+09:00"));
  await page.clock.runFor(2000);
  await page.evaluate(() => document.fonts.ready);

  const idSelector = `.catalog-list-item[data-item-id=${JSON.stringify(name)}]`;
  const byId = page.locator(idSelector);
  if ((await byId.count()) > 0) {
    await byId.first().click();
  } else {
    const byLabel = page.locator(".catalog-list").getByText(name, { exact: true });
    if ((await byLabel.count()) === 0) throw new Error(`見本帳の図がありません: ${name}`);
    await byLabel.first().click();
  }
  await page.clock.runFor(500);

  const selector = ".catalog-preview-stage:not([hidden]) svg[data-cdl-stage]";
  const root = page.locator(selector);
  await root.waitFor({ state: "visible" });
  await page
    .getByRole("radiogroup", { name: "図の色味" })
    .getByRole("radio", { name: label, exact: true })
    .click();

  for (let i = 0; i < 50; i += 1) {
    if ((await 状態(page)).palette === palette) break;
    await page.clock.runFor(STEP_MS);
    if (i === 49) throw new Error(`意匠 ${palette} に切り替わりませんでした`);
  }
  await page.evaluate(() => document.fonts.ready);
  const phaseCount = Math.max(1, (await 状態(page)).phases);
  await 最後まで進める(page, phaseCount - 1);
  return { locator: root, selector, mode: "svg" };
}

async function htmlを開く(page, source) {
  const file = path.resolve(必須の字(source.path, "html.path"));
  const selector =
    typeof source.selector === "string" && source.selector !== "" ? source.selector : "body";
  await page.goto(pathToFileURL(file).href);
  await page.waitForLoadState("load");
  await page.evaluate(async () => {
    await document.fonts.ready;
    for (const animation of document.getAnimations()) animation.finish();
  });
  const root = page.locator(selector).first();
  if ((await root.count()) === 0) throw new Error(`HTML の図がありません: ${selector}`);
  await root.waitFor({ state: "visible" });
  const mode = await root.evaluate((element) =>
    element instanceof window.SVGSVGElement ? "svg" : "html",
  );
  return { locator: root, selector, mode };
}

export async function 図を開く(page, source) {
  sourceの範囲(source);
  sourceの無視する字(source);
  if (source?.type === "html") return htmlを開く(page, source);
  if (source?.type === "catalog") return catalogを開く(page, source);
  throw new Error("source.type は html または catalog にしてください");
}

async function 実際の書体を読む(page, ids) {
  const result = new Map(ids.map((id) => [id, null]));
  if (ids.length === 0) return result;
  const session = await page.context().newCDPSession(page);
  try {
    await session.send("DOM.enable");
    await session.send("CSS.enable");
    const documentNode = await session.send("DOM.getDocument", { depth: 0 });
    for (const id of ids) {
      try {
        const selected = await session.send("DOM.querySelector", {
          nodeId: documentNode.root.nodeId,
          selector: `[${FONT_MARKER}=${JSON.stringify(id)}]`,
        });
        if (selected.nodeId === 0) continue;
        const response = await session.send("CSS.getPlatformFontsForNode", {
          nodeId: selected.nodeId,
        });
        const font = [...response.fonts].sort((a, b) => b.glyphCount - a.glyphCount)[0];
        if (font !== undefined && font.glyphCount > 0) result.set(id, font.familyName);
      } catch {
        // CDP がこの node の書体を返せない時は、比較側で「測れない」として残す。
      }
    }
  } catch {
    // CSS domain 自体を使えない Chromium でも、他の測定結果は捨てない。
  } finally {
    await session.detach();
  }
  return result;
}

export async function 図を測る(page, opened, source) {
  const measured = await page.evaluate(
    ({ selector, mode, region, ignoreTexts, fontMarker }) => {
      const root = document.querySelector(selector);
      if (!(root instanceof Element)) throw new Error(`図がありません: ${selector}`);

      const round = (value) => Math.round(value * 1000) / 1000;
      const number = (value) => {
        const parsed = Number.parseFloat(value);
        return Number.isFinite(parsed) ? round(parsed) : 0;
      };
      const matrixScale = (matrix) =>
        matrix === null ? 1 : Math.sqrt(Math.abs(matrix.a * matrix.d - matrix.b * matrix.c));
      const cssScaleToDocument = (element) => {
        let scale = 1;
        let current = element;
        while (current instanceof Element) {
          const transform = getComputedStyle(current).transform;
          if (transform !== "none") scale *= matrixScale(new window.DOMMatrix(transform));
          current = current.parentElement;
        }
        return scale;
      };
      const rootRect = root.getBoundingClientRect();
      const rootSvg = mode === "svg" ? root : null;
      const rootScreenCtm =
        rootSvg instanceof window.SVGSVGElement ? rootSvg.getScreenCTM() : null;
      const rootScreenScale =
        rootScreenCtm === null ? cssScaleToDocument(root) : matrixScale(rootScreenCtm);
      const rootMatrix = rootScreenCtm?.inverse() ?? null;
      const scaleToRoot = (element) => {
        const screenCtm =
          element instanceof window.SVGGraphicsElement ? element.getScreenCTM() : null;
        const screenScale =
          screenCtm === null ? cssScaleToDocument(element) : matrixScale(screenCtm);
        return round(screenScale / rootScreenScale);
      };

      const canvas = document.createElement("canvas");
      canvas.width = 1;
      canvas.height = 1;
      const context = canvas.getContext("2d", { willReadFrequently: true });
      if (context === null) throw new Error("色を読む canvas を作れませんでした");
      const color = (value, alpha = 1) => {
        if (value === "none" || value === "transparent" || value === "") {
          return "rgba(0, 0, 0, 0)";
        }
        context.clearRect(0, 0, 1, 1);
        context.fillStyle = "rgba(0, 0, 0, 0)";
        context.fillStyle = value;
        context.fillRect(0, 0, 1, 1);
        const data = context.getImageData(0, 0, 1, 1).data;
        const finalAlpha = round((data[3] / 255) * alpha);
        return `rgba(${data[0]}, ${data[1]}, ${data[2]}, ${finalAlpha})`;
      };
      const transparent = (value) => value.endsWith(", 0)");
      const fonts = (value) =>
        value
          .split(",")
          .map((part) =>
            part.trim().replace(/^(['"])(.*)\1$/, "$2").replace(/\s+/g, " ").toLowerCase(),
          )
          .filter(Boolean)
          .join(",");
      const excludedTags = new Set(["defs", "mask", "clippath", "marker", "pattern", "symbol"]);
      const excluded = (element) => {
        let current = element;
        while (current instanceof Element && current !== root) {
          if (excludedTags.has(current.tagName.toLowerCase())) return true;
          current = current.parentElement;
        }
        return false;
      };
      const inRegion = (box) =>
        region === null ||
        (box.x + box.width / 2 >= region.x &&
          box.x + box.width / 2 <= region.x + region.width &&
          box.y + box.height / 2 >= region.y &&
          box.y + box.height / 2 <= region.y + region.height);

      const screenBoxToRoot = (rect) => {
        if (rootMatrix === null) {
          return {
            x: round((rect.left - rootRect.left) / rootScreenScale),
            y: round((rect.top - rootRect.top) / rootScreenScale),
            width: round(rect.width / rootScreenScale),
            height: round(rect.height / rootScreenScale),
          };
        }
        const corners = [
          new window.DOMPoint(rect.left, rect.top),
          new window.DOMPoint(rect.right, rect.top),
          new window.DOMPoint(rect.right, rect.bottom),
          new window.DOMPoint(rect.left, rect.bottom),
        ].map((point) => point.matrixTransform(rootMatrix));
        const xs = corners.map((point) => point.x);
        const ys = corners.map((point) => point.y);
        const left = Math.min(...xs);
        const top = Math.min(...ys);
        return {
          x: round(left),
          y: round(top),
          width: round(Math.max(...xs) - left),
          height: round(Math.max(...ys) - top),
        };
      };
      const svgBoxToRoot = (element) => {
        if (typeof element.getBBox !== "function" || element.getScreenCTM() === null) return null;
        try {
          const box = element.getBBox();
          const matrix =
            rootMatrix === null
              ? element.getScreenCTM()
              : rootMatrix.multiply(element.getScreenCTM());
          const points = [
            new window.DOMPoint(box.x, box.y),
            new window.DOMPoint(box.x + box.width, box.y),
            new window.DOMPoint(box.x + box.width, box.y + box.height),
            new window.DOMPoint(box.x, box.y + box.height),
          ].map((point) => point.matrixTransform(matrix));
          const xs = points.map((point) => point.x);
          const ys = points.map((point) => point.y);
          const left = Math.min(...xs);
          const top = Math.min(...ys);
          const boxInRoot = {
            x: round(left),
            y: round(top),
            width: round(Math.max(...xs) - left),
            height: round(Math.max(...ys) - top),
          };
          if (rootMatrix === null) {
            boxInRoot.x = round((boxInRoot.x - rootRect.left) / rootScreenScale);
            boxInRoot.y = round((boxInRoot.y - rootRect.top) / rootScreenScale);
            boxInRoot.width = round(boxInRoot.width / rootScreenScale);
            boxInRoot.height = round(boxInRoot.height / rootScreenScale);
          }
          return boxInRoot;
        } catch {
          return null;
        }
      };
      const boxFor = (element) =>
        element instanceof window.SVGElement
          ? svgBoxToRoot(element)
          : screenBoxToRoot(element.getBoundingClientRect());
      const hasPositiveSize = (box) => box.width > 0 && box.height > 0;
      const boxCenter = (box) => ({ x: box.x + box.width / 2, y: box.y + box.height / 2 });

      const cumulativeOpacity = (element) => {
        let opacity = 1;
        let current = element;
        while (current instanceof Element) {
          opacity *= number(getComputedStyle(current).opacity || "1");
          if (current === root) break;
          current = current.parentElement;
        }
        return opacity;
      };
      const alpha = (style, kind, element) =>
        cumulativeOpacity(element) * number(style[`${kind}Opacity`] || "1");
      const paint = (style, kind, element) => color(style[kind], alpha(style, kind, element));
      const gradient = (style, kind) => String(style[kind]).trim().startsWith("url(");
      const splitArguments = (value) => {
        const parts = [];
        let depth = 0;
        let start = 0;
        for (let index = 0; index < value.length; index += 1) {
          if (value[index] === "(") depth += 1;
          else if (value[index] === ")") depth -= 1;
          else if (value[index] === "," && depth === 0) {
            parts.push(value.slice(start, index).trim());
            start = index + 1;
          }
        }
        parts.push(value.slice(start).trim());
        return parts;
      };
      const cssColor = (value, opacity) => {
        const match = value.match(/^(rgba?\([^)]*\)|#[\da-f]{3,8}|[a-z]+)(?:\s|$)/i);
        return match === null || !window.CSS.supports("color", match[1])
          ? null
          : color(match[1], opacity);
      };
      const linearCssFill = (value, element) => {
        if (!value.startsWith("linear-gradient(") || !value.endsWith(")")) return null;
        const parts = splitArguments(value.slice("linear-gradient(".length, -1));
        const opacity = cumulativeOpacity(element);
        const firstColor = cssColor(parts[0] ?? "", opacity);
        const colorParts = firstColor === null ? parts.slice(1) : parts;
        const colors = colorParts.map((part) => cssColor(part, opacity));
        if (colors.length < 2 || colors.some((entry) => entry === null)) return null;
        return {
          fill: value,
          fillKind: "線形の階調",
          fillStartColor: colors[0],
          fillEndColor: colors.at(-1),
          fillDirection: firstColor === null ? parts[0] : "to bottom",
          fillUnmeasurable: false,
        };
      };
      const htmlFill = (style, element) => {
        const value = String(style.backgroundImage).trim();
        if (value === "none") {
          return {
            fill: color(style.backgroundColor, cumulativeOpacity(element)),
            fillKind: "一色",
            fillStartColor: null,
            fillEndColor: null,
            fillDirection: null,
            fillUnmeasurable: false,
          };
        }
        const linear = linearCssFill(value, element);
        if (linear !== null) return linear;
        const fillKind = value.startsWith("radial-gradient(") || value.startsWith("conic-gradient(")
          ? "他の階調"
          : value.includes("url(")
            ? "模様"
            : "読めない値";
        return {
          fill: value,
          fillKind,
          fillStartColor: null,
          fillEndColor: null,
          fillDirection: null,
          fillUnmeasurable: true,
        };
      };
      const svgFill = (style, element) => {
        const value = String(style.fill).trim();
        const reference = value.match(/^url\(\s*["']?#([^"')\s]+)["']?\s*\)$/);
        if (reference === null) {
          return {
            fill: paint(style, "fill", element),
            fillKind: "一色",
            fillStartColor: null,
            fillEndColor: null,
            fillDirection: null,
            fillUnmeasurable: false,
          };
        }
        const target =
          root.querySelector(`[id=${JSON.stringify(reference[1])}]`) ??
          document.getElementById(reference[1]);
        if (target instanceof window.SVGLinearGradientElement) {
          const stops = [...target.querySelectorAll(":scope > stop")];
          if (stops.length >= 2) {
            const stopColor = (stop) => {
              const stopStyle = getComputedStyle(stop);
              return color(
                stopStyle.stopColor,
                alpha(style, "fill", element) * number(stopStyle.stopOpacity || "1"),
              );
            };
            return {
              fill: value,
              fillKind: "線形の階調",
              fillStartColor: stopColor(stops[0]),
              fillEndColor: stopColor(stops.at(-1)),
              fillDirection: {
                x1: target.getAttribute("x1") ?? "0%",
                y1: target.getAttribute("y1") ?? "0%",
                x2: target.getAttribute("x2") ?? "100%",
                y2: target.getAttribute("y2") ?? "0%",
              },
              fillUnmeasurable: false,
            };
          }
          return {
            fill: value,
            fillKind: "読めない値",
            fillStartColor: null,
            fillEndColor: null,
            fillDirection: null,
            fillUnmeasurable: true,
          };
        }
        return {
          fill: value,
          fillKind: target instanceof window.SVGRadialGradientElement ? "他の階調" :
            target instanceof window.SVGPatternElement ? "模様" : "読めない値",
          fillStartColor: null,
          fillEndColor: null,
          fillDirection: null,
          fillUnmeasurable: true,
        };
      };
      const visibleStroke = (style, element) =>
        number(style.strokeWidth) > 0 && !transparent(paint(style, "stroke", element));

      const shapeEntries = [...root.querySelectorAll("rect,path,circle,ellipse,polygon")]
        .filter((element) => !excluded(element))
        .map((element) => {
          const style = getComputedStyle(element);
          const measured = boxFor(element);
          const tag = element.tagName.toLowerCase();
          const visibleFill = gradient(style, "fill") || !transparent(paint(style, "fill", element));
          const linePath = tag === "path" && !visibleFill;
          if (
            measured === null ||
            !hasPositiveSize(measured) ||
            !inRegion(measured) ||
            linePath ||
            (!visibleFill && !visibleStroke(style, element))
          ) {
            return null;
          }
          return { element, measured };
        })
        .filter(Boolean);
      const shapeIds = new Map();
      const htmlBoxIds = new Map();
      const fontIds = new Map();
      let nextBoxId = 1;
      let nextFontId = 1;

      const shadowFrame = (style, element) => {
        if (style.boxShadow === "none") return null;
        for (const shadow of style.boxShadow.split(/,(?![^()]*\))/)) {
          if (!shadow.includes("inset")) continue;
          const widths = [...shadow.matchAll(/(-?\d+(?:\.\d+)?)px/g)].map((match) =>
            Number(match[1]),
          );
          const rawWidth = Math.abs(widths[3] ?? 0);
          if (rawWidth <= 0) continue;
          const foundColor = shadow.match(/rgba?\([^)]*\)|#[\da-f]{3,8}/i)?.[0] ?? "transparent";
          return {
            rawWidth: round(rawWidth),
            width: round(rawWidth * scaleToRoot(element)),
            color: color(foundColor, cumulativeOpacity(element)),
          };
        }
        return null;
      };
      const htmlFrame = (style, element) => {
        const sides = ["Top", "Right", "Bottom", "Left"].map((side) => {
          const rawWidth = number(style[`border${side}Width`]);
          return {
            rawWidth,
            width: round(rawWidth * scaleToRoot(element)),
            color: color(style[`border${side}Color`], cumulativeOpacity(element)),
            style: style[`border${side}Style`],
          };
        });
        const visible = sides.filter(
          (side) => side.width > 0 && side.style !== "none" && !transparent(side.color),
        );
        if (visible.length >= 2) return visible.sort((a, b) => b.width - a.width)[0];
        return shadowFrame(style, element);
      };
      const htmlBoxData = (element) => {
        const style = getComputedStyle(element);
        const fill = htmlFill(style, element);
        const frame = htmlFrame(style, element);
        if (fill.fillKind === "一色" && transparent(fill.fill) && frame === null) return null;
        const measured = boxFor(element);
        if (measured === null || !hasPositiveSize(measured) || !inRegion(measured)) return null;
        if (!htmlBoxIds.has(element)) htmlBoxIds.set(element, `box-${nextBoxId++}`);
        return {
          id: htmlBoxIds.get(element),
          ...measured,
          ...fill,
          borderColor: frame?.color ?? "rgba(0, 0, 0, 0)",
          borderWidth: frame?.width ?? 0,
          rawBorderWidth: frame?.rawWidth ?? 0,
        };
      };
      const htmlBox = (textElement) => {
        let current = textElement;
        while (current instanceof Element && current !== root) {
          if (!(current instanceof window.SVGElement)) {
            const box = htmlBoxData(current);
            if (box !== null) return box;
          }
          current = current.parentElement;
        }
        return null;
      };
      const shapeContains = (shape, screenPoint) => {
        if (shape.getScreenCTM() === null || typeof shape.isPointInFill !== "function") return false;
        try {
          const local = screenPoint.matrixTransform(shape.getScreenCTM().inverse());
          return shape.isPointInFill(local);
        } catch {
          return false;
        }
      };
      const svgBoxData = (shape, measured) => {
        if (!shapeIds.has(shape)) shapeIds.set(shape, `box-${nextBoxId++}`);
        const style = getComputedStyle(shape);
        const rawBorderWidth = number(style.strokeWidth);
        return {
          id: shapeIds.get(shape),
          ...measured,
          ...svgFill(style, shape),
          borderColor: paint(style, "stroke", shape),
          borderWidth: round(rawBorderWidth * scaleToRoot(shape)),
          rawBorderWidth,
        };
      };
      const svgBox = (textElement) => {
        const rect = textElement.getBoundingClientRect();
        const center = new window.DOMPoint(rect.left + rect.width / 2, rect.top + rect.height / 2);
        const choices = shapeEntries
          .filter(({ element }) => shapeContains(element, center))
          .sort(
            (a, b) =>
              a.measured.width * a.measured.height - b.measured.width * b.measured.height,
          );
        const chosen = choices[0];
        return chosen === undefined ? null : svgBoxData(chosen.element, chosen.measured);
      };

      const lineBoxes = [];
      const lineCounts = new Map();
      for (const element of root.querySelectorAll("line,polyline,path")) {
        if (excluded(element)) continue;
        const style = getComputedStyle(element);
        const tag = element.tagName.toLowerCase();
        const noFill = transparent(paint(style, "fill", element)) || style.fill === "none";
        const measured = boxFor(element);
        if (
          measured === null ||
          !inRegion(measured) ||
          !visibleStroke(style, element) ||
          (tag === "path" && !noFill)
        ) {
          continue;
        }
        const rawWidth = number(style.strokeWidth);
        const width = round(rawWidth * scaleToRoot(element));
        const key = `${paint(style, "stroke", element)}|${width}|${rawWidth}`;
        const segmentCount = tag === "path"
          ? [...(element.getAttribute("d") ?? "").matchAll(/[Mm]/g)].length
          : 1;
        lineCounts.set(key, (lineCounts.get(key) ?? 0) + segmentCount);
        lineBoxes.push({ kind: "line", ...measured });
      }

      const ignored = new Set(ignoreTexts);
      const textParts = [];
      const addText = (element, text, box) => {
        const normalized = text.trim().replace(/\s+/g, " ");
        if (
          normalized === "" ||
          ignored.has(normalized) ||
          box === null ||
          box.width <= 0 ||
          box.height <= 0 ||
          !inRegion(box)
        ) {
          return;
        }
        const style = getComputedStyle(element);
        const isSvg = element instanceof window.SVGElement;
        const rawFontSize = number(style.fontSize);
        let fontNodeId = fontIds.get(element);
        if (fontNodeId === undefined) {
          fontNodeId = `font-${nextFontId++}`;
          fontIds.set(element, fontNodeId);
          element.setAttribute(fontMarker, fontNodeId);
        }
        textParts.push({
          text: normalized,
          ...box,
          fontSize: round(rawFontSize * scaleToRoot(element)),
          rawFontSize,
          fontWeight: String(style.fontWeight),
          color: isSvg
            ? paint(style, "fill", element)
            : color(style.color, cumulativeOpacity(element)),
          platformFont: null,
          fontFamily: fonts(style.fontFamily),
          fontNodeId,
          box: isSvg ? svgBox(element) : htmlBox(element),
        });
      };

      for (const element of root.querySelectorAll("text,tspan")) {
        if (excluded(element)) continue;
        if (
          element.tagName.toLowerCase() === "text" &&
          element.querySelector(":scope > tspan") !== null
        ) {
          continue;
        }
        addText(element, element.textContent ?? "", boxFor(element));
      }
      const walker = document.createTreeWalker(root, window.NodeFilter.SHOW_TEXT);
      while (walker.nextNode()) {
        const node = walker.currentNode;
        const parent = node.parentElement;
        if (
          parent === null ||
          parent.closest("svg") !== null ||
          excluded(parent) ||
          ["SCRIPT", "STYLE", "NOSCRIPT"].includes(parent.tagName) ||
          (node.textContent ?? "").trim() === ""
        ) {
          continue;
        }
        const characters = [...(node.textContent ?? "")];
        const lines = [];
        let offset = 0;
        for (const character of characters) {
          const length = character.length;
          const range = document.createRange();
          range.setStart(node, offset);
          range.setEnd(node, offset + length);
          offset += length;
          const rect = range.getBoundingClientRect();
          if (rect.width === 0 && rect.height === 0) continue;
          let line = lines.find((entry) => Math.abs(entry.top - rect.top) <= 1);
          if (line === undefined) {
            line = {
              text: "",
              top: rect.top,
              left: rect.left,
              right: rect.right,
              bottom: rect.bottom,
            };
            lines.push(line);
          }
          line.text += character;
          line.left = Math.min(line.left, rect.left);
          line.right = Math.max(line.right, rect.right);
          line.bottom = Math.max(line.bottom, rect.bottom);
        }
        for (const line of lines) {
          addText(
            parent,
            line.text,
            screenBoxToRoot({
              left: line.left,
              top: line.top,
              right: line.right,
              bottom: line.bottom,
              width: line.right - line.left,
              height: line.bottom - line.top,
            }),
          );
        }
      }

      const textBoxes = [
        ...new Map(
          textParts.filter((text) => text.box !== null).map((text) => [text.box.id, text.box]),
        ).values(),
      ];
      const usedBoxIds = new Set(textBoxes.map((box) => box.id));
      const farFromTextBoxes = (candidate) => {
        const center = boxCenter(candidate);
        return textBoxes.every((box) => {
          const other = boxCenter(box);
          return Math.max(
            Math.abs(center.x - other.x),
            Math.abs(center.y - other.y),
            Math.abs(candidate.width - box.width),
            Math.abs(candidate.height - box.height),
          ) > 10;
        });
      };
      const unlabeledBoxes = [];
      for (const entry of shapeEntries) {
        const box = svgBoxData(entry.element, entry.measured);
        if (!usedBoxIds.has(box.id) && farFromTextBoxes(box)) unlabeledBoxes.push(box);
      }
      if (mode === "html") {
        for (const element of root.querySelectorAll("*")) {
          if (element instanceof window.SVGElement || excluded(element)) continue;
          const box = htmlBoxData(element);
          if (box !== null && !usedBoxIds.has(box.id) && farFromTextBoxes(box)) {
            unlabeledBoxes.push(box);
          }
        }
      }

      const bounds =
        region ??
        (rootSvg instanceof window.SVGSVGElement
          ? (() => {
              const view = rootSvg.viewBox.baseVal;
              return { x: view.x, y: view.y, width: view.width, height: view.height };
            })()
          : {
              x: 0,
              y: 0,
              width: round(rootRect.width / rootScreenScale),
              height: round(rootRect.height / rootScreenScale),
            });
      const boxes = [...textBoxes, ...unlabeledBoxes];
      return {
        mode,
        bounds,
        texts: textParts,
        boxes,
        unlabeledBoxes,
        lines: [...lineCounts.entries()].map(([key, count]) => {
          const [stroke, width, rawWidth] = key.split("|");
          return { stroke, width: Number(width), rawWidth: Number(rawWidth), count };
        }),
        elements: [
          ...boxes.map((box) => ({
            kind: "box",
            id: box.id,
            x: box.x,
            y: box.y,
            width: box.width,
            height: box.height,
          })),
          ...textParts.map((text, index) => ({
            kind: "text",
            id: `text-${index + 1}`,
            x: text.x,
            y: text.y,
            width: text.width,
            height: text.height,
          })),
          ...lineBoxes.map((line, index) => ({ ...line, id: `line-${index + 1}` })),
        ],
      };
    },
    {
      selector: opened.selector,
      mode: opened.mode,
      region: sourceの範囲(source),
      ignoreTexts: sourceの無視する字(source),
      fontMarker: FONT_MARKER,
    },
  );

  const ids = [...new Set(measured.texts.map((text) => text.fontNodeId))];
  const platformFonts = await 実際の書体を読む(page, ids);
  for (const text of measured.texts) {
    const rawPlatformFont = platformFonts.get(text.fontNodeId) ?? null;
    text.platformFont = rawPlatformFont === null ? null : 書体名を整える(rawPlatformFont);
    text.rawPlatformFont = rawPlatformFont;
    delete text.fontNodeId;
  }
  await page.evaluate((fontMarker) => {
    for (const element of document.querySelectorAll(`[${fontMarker}]`)) {
      element.removeAttribute(fontMarker);
    }
  }, FONT_MARKER);
  return measured;
}

export async function 図の撮影情報(page, opened, source) {
  return page.evaluate(
    ({ selector, region }) => {
      const root = document.querySelector(selector);
      if (!(root instanceof Element)) throw new Error(`図がありません: ${selector}`);
      const rect = root.getBoundingClientRect();
      let bounds;
      let clip;
      if (root instanceof window.SVGSVGElement) {
        const view = root.viewBox.baseVal;
        bounds = region ?? { x: view.x, y: view.y, width: view.width, height: view.height };
        const matrix = root.getScreenCTM();
        if (matrix === null) throw new Error("SVG の撮影倍率を読めませんでした");
        const points = [
          new window.DOMPoint(bounds.x, bounds.y),
          new window.DOMPoint(bounds.x + bounds.width, bounds.y),
          new window.DOMPoint(bounds.x + bounds.width, bounds.y + bounds.height),
          new window.DOMPoint(bounds.x, bounds.y + bounds.height),
        ].map((point) => point.matrixTransform(matrix));
        const xs = points.map((point) => point.x);
        const ys = points.map((point) => point.y);
        clip = {
          x: Math.min(...xs),
          y: Math.min(...ys),
          width: Math.max(...xs) - Math.min(...xs),
          height: Math.max(...ys) - Math.min(...ys),
        };
      } else {
        const full = {
          x: 0,
          y: 0,
          width: root instanceof window.HTMLElement ? root.offsetWidth : rect.width,
          height: root instanceof window.HTMLElement ? root.offsetHeight : rect.height,
        };
        bounds = region ?? full;
        const scaleX = rect.width / full.width;
        const scaleY = rect.height / full.height;
        clip = {
          x: rect.left + bounds.x * scaleX,
          y: rect.top + bounds.y * scaleY,
          width: bounds.width * scaleX,
          height: bounds.height * scaleY,
        };
      }
      return { bounds, clip };
    },
    { selector: opened.selector, region: sourceの範囲(source) },
  );
}

export function 比較一覧(config) {
  if (Array.isArray(config?.comparisons) && config.comparisons.length > 0) {
    return config.comparisons.map((entry, index) => ({
      label:
        typeof entry.label === "string" && entry.label !== "" ? entry.label : `比較 ${index + 1}`,
      expected: entry.expected,
      actual: entry.actual,
    }));
  }
  if (config?.expected !== undefined && config?.actual !== undefined) {
    return [
      {
        label: typeof config.label === "string" ? config.label : "比較",
        expected: config.expected,
        actual: config.actual,
      },
    ];
  }
  throw new Error("設定に expected と actual、または comparisons を指定してください");
}

export function sourceのpathを整える(source) {
  if (source?.type !== "html") return source;
  return { ...source, path: path.resolve(source.path) };
}
