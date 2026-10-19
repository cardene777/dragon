/* global document, Element, getComputedStyle, window */
import path from "node:path";
import { pathToFileURL } from "node:url";

import { 矢じりの接触距離, 矢じりの最大距離 } from "./checklist.mjs";
import { 印の最遠点 } from "./marker.mjs";

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
/** palette を省いた見本帳の図は、サイトの既定の意匠 (活版) で描かれる (#2962) */
const 既定の意匠 = "letterpress";

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
  if (!valid) {
    throw new Error("region は正の width / height を持つ { x, y, width, height } にしてください");
  }
  return region;
}

function sourceの無視する字(source) {
  if (source.ignoreTexts === undefined) return [];
  if (
    !Array.isArray(source.ignoreTexts) ||
    !source.ignoreTexts.every((text) => typeof text === "string")
  ) {
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
        stage?.querySelector("[data-cdl-diagram]")?.getAttribute("data-cdl-phase-index") ?? null,
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
  const palette = source.palette === undefined ? 既定の意匠 : 必須の字(source.palette, "catalog.palette");
  const label = 意匠名[palette];
  if (label === undefined) {
    throw new Error(`catalog.palette が不明です: ${palette}`);
  }

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
    .getByRole("combobox", { name: "図の色味" })
    .selectOption({ label });
  for (let index = 0; index < 50; index += 1) {
    const selected = (await 状態(page)).palette;
    if (selected === palette) break;
    await page.clock.runFor(STEP_MS);
    if (index === 49) {
      throw new Error(`意匠 ${palette} に切り替わりませんでした`);
    }
  }
  await page.evaluate(() => document.fonts.ready);
  const phaseCount = Math.max(1, (await 状態(page)).phases);
  await 最後まで進める(page, phaseCount - 1);
  await page.evaluate(() => {
    // 最終段で追加された図録の線を、待機間隔の境界に左右されず完成状態で測る。
    for (const animation of document.getAnimations()) {
      const timing = animation.effect?.getComputedTiming();
      if (
        typeof timing?.endTime === "number" &&
        Number.isFinite(timing.endTime)
      ) {
        animation.finish();
      }
    }
  });
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
    for (const animation of document.getAnimations()) {
      const timing = animation.effect?.getComputedTiming();
      if (
        typeof timing?.endTime === "number" &&
        Number.isFinite(timing.endTime)
      ) {
        animation.finish();
      }
    }
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

export async function 図を測る(page, opened, source) {
  const measurement = await page.evaluate(
    ({ selector, mode, region, ignoreTexts, arrowContactDistance, arrowMaxDistance }) => {
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

      const canvas = document.createElement("canvas");
      canvas.width = 1;
      canvas.height = 1;
      const context = canvas.getContext("2d", { willReadFrequently: true });
      if (context === null) throw new Error("色を読む canvas を作れませんでした");
      const color = (value, opacity = 1) => {
        if (value === "none" || value === "transparent" || value === "") {
          return "rgba(0, 0, 0, 0)";
        }
        context.clearRect(0, 0, 1, 1);
        context.fillStyle = "rgba(0, 0, 0, 0)";
        context.fillStyle = value;
        context.fillRect(0, 0, 1, 1);
        const data = context.getImageData(0, 0, 1, 1).data;
        const alpha = round((data[3] / 255) * opacity);
        if (alpha === 1) {
          return `#${[data[0], data[1], data[2]]
            .map((part) => part.toString(16).padStart(2, "0"))
            .join("")}`;
        }
        return `rgba(${data[0]}, ${data[1]}, ${data[2]}, ${alpha})`;
      };
      const transparent = (value) => value === "rgba(0, 0, 0, 0)";
      const excludedTags = new Set(["defs", "mask", "clippath", "marker", "pattern", "symbol"]);
      const excluded = (element) => {
        let current = element;
        while (current instanceof Element && current !== root) {
          if (excludedTags.has(current.tagName.toLowerCase())) return true;
          current = current.parentElement;
        }
        return false;
      };
      const drawn = (element) => {
        if (element.getClientRects().length === 0) return false;
        if (typeof element.checkVisibility !== "function") return true;
        try {
          return element.checkVisibility({ checkOpacity: true, checkVisibilityCSS: true });
        } catch {
          return element.checkVisibility();
        }
      };
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
      const paint = (style, kind, element) =>
        color(
          style[kind],
          cumulativeOpacity(element) * number(style[`${kind}Opacity`] || "1"),
        );
      const screenPointToRoot = (point) => {
        if (rootMatrix !== null) return point.matrixTransform(rootMatrix);
        return new window.DOMPoint(
          (point.x - rootRect.left) / rootScreenScale,
          (point.y - rootRect.top) / rootScreenScale,
        );
      };
      const screenBoxToRoot = (rect) => {
        const points = [
          new window.DOMPoint(rect.left, rect.top),
          new window.DOMPoint(rect.right, rect.top),
          new window.DOMPoint(rect.right, rect.bottom),
          new window.DOMPoint(rect.left, rect.bottom),
        ].map(screenPointToRoot);
        const xs = points.map((point) => point.x);
        const ys = points.map((point) => point.y);
        const left = Math.min(...xs);
        const top = Math.min(...ys);
        return {
          x: round(left),
          y: round(top),
          width: round(Math.max(...xs) - left),
          height: round(Math.max(...ys) - top),
        };
      };
      const svgPointToRoot = (element, point) => {
        const matrix = element.getScreenCTM();
        if (matrix === null) return null;
        const value = screenPointToRoot(
          new window.DOMPoint(point.x, point.y).matrixTransform(matrix),
        );
        return { x: round(value.x), y: round(value.y) };
      };
      const svgBoxToRoot = (element) => {
        if (typeof element.getBBox !== "function") return null;
        try {
          const box = element.getBBox();
          const matrix = element.getScreenCTM();
          if (matrix === null) return null;
          const points = [
            new window.DOMPoint(box.x, box.y),
            new window.DOMPoint(box.x + box.width, box.y),
            new window.DOMPoint(box.x + box.width, box.y + box.height),
            new window.DOMPoint(box.x, box.y + box.height),
          ].map((point) => screenPointToRoot(point.matrixTransform(matrix)));
          const xs = points.map((point) => point.x);
          const ys = points.map((point) => point.y);
          const left = Math.min(...xs);
          const top = Math.min(...ys);
          return {
            x: round(left),
            y: round(top),
            width: round(Math.max(...xs) - left),
            height: round(Math.max(...ys) - top),
          };
        } catch {
          return null;
        }
      };
      const boxFor = (element) =>
        element instanceof window.SVGElement
          ? svgBoxToRoot(element)
          : screenBoxToRoot(element.getBoundingClientRect());
      const inRegion = (box) =>
        region === null ||
        (box.x + box.width / 2 >= region.x &&
          box.x + box.width / 2 <= region.x + region.width &&
          box.y + box.height / 2 >= region.y &&
          box.y + box.height / 2 <= region.y + region.height);
      const hasSize = (box) => box !== null && box.width > 0 && box.height > 0;
      const hasExtent = (box) => box !== null && (box.width > 0 || box.height > 0);

      const 字と箱の許容距離 = 8;
      let nextBoxId = 1;
      const svgBoxData = (element, measured) => {
        const style = getComputedStyle(element);
        return {
          element,
          ...measured,
          fill: String(style.fill).trim().startsWith("url(")
            ? String(style.fill).trim()
            : paint(style, "fill", element),
          borderColor: paint(style, "stroke", element),
        };
      };
      const geometryKey = (box) => [box.x, box.y, box.width, box.height].join(":");
      const mergeBoxes = (entries) => {
        const groups = new Map();
        for (const entry of entries) {
          const key = geometryKey(entry);
          const group = groups.get(key) ?? {
            id: `box-${nextBoxId++}`,
            x: entry.x,
            y: entry.y,
            width: entry.width,
            height: entry.height,
            fill: "rgba(0, 0, 0, 0)",
            borderColor: "rgba(0, 0, 0, 0)",
            elements: [],
          };
          group.elements.push(entry.element);
          if (!transparent(entry.fill)) group.fill = entry.fill;
          if (!transparent(entry.borderColor)) group.borderColor = entry.borderColor;
          groups.set(key, group);
        }
        return [...groups.values()];
      };
      const shapeEntries = [
        ...root.querySelectorAll("rect,path,circle,ellipse,polygon"),
      ]
        .filter((element) => !excluded(element) && drawn(element))
        .filter((element) => {
          if (element.tagName.toLowerCase() !== "path") return true;
          const style = getComputedStyle(element);
          return String(style.fill).trim().startsWith("url(") || !transparent(paint(style, "fill", element));
        })
        .map((element) => ({ element, measured: boxFor(element) }))
        .filter((entry) => hasSize(entry.measured) && inRegion(entry.measured));
      const svgBoxes = mergeBoxes(
        shapeEntries
          .map(({ element, measured }) => svgBoxData(element, measured))
          .filter((box) => !transparent(box.fill) || !transparent(box.borderColor)),
      );
      const htmlBoxData = (element) => {
        if (!drawn(element)) return null;
        const style = getComputedStyle(element);
        const opacity = cumulativeOpacity(element);
        const fill =
          style.backgroundImage === "none"
            ? color(style.backgroundColor, opacity)
            : style.backgroundImage;
        const sides = ["Top", "Right", "Bottom", "Left"].map((side) => ({
          width: number(style[`border${side}Width`]),
          style: style[`border${side}Style`],
          color: color(style[`border${side}Color`], opacity),
        }));
        const border = sides.find(
          (side) => side.width > 0 && side.style !== "none" && !transparent(side.color),
        );
        if (transparent(fill) && border === undefined) return null;
        const measured = boxFor(element);
        if (!hasSize(measured) || !inRegion(measured)) return null;
        return {
          element,
          ...measured,
          fill,
          borderColor: border?.color ?? "rgba(0, 0, 0, 0)",
        };
      };
      const htmlBoxes =
        mode === "html"
          ? mergeBoxes(
              [...root.querySelectorAll("*")]
                .filter((element) => !(element instanceof window.SVGElement) && !excluded(element))
                .map(htmlBoxData)
                .filter((box) => box !== null),
            )
          : [];
      const htmlBoxByElement = new Map(
        htmlBoxes.flatMap((box) => box.elements.map((element) => [element, box])),
      );
      const htmlBox = (textElement) => {
        let current = textElement;
        while (current instanceof Element && current !== root) {
          if (!(current instanceof window.SVGElement)) {
            const box = htmlBoxByElement.get(current);
            if (box !== undefined) return box;
          }
          current = current.parentElement;
        }
        return null;
      };
      const shapeContains = (shape, screenPoint) => {
        if (shape.getScreenCTM() === null || typeof shape.isPointInFill !== "function") {
          return false;
        }
        try {
          return shape.isPointInFill(screenPoint.matrixTransform(shape.getScreenCTM().inverse()));
        } catch {
          return false;
        }
      };
      const svgBox = (textElement) => {
        const rect = textElement.getBoundingClientRect();
        const center = new window.DOMPoint(
          rect.left + rect.width / 2,
          rect.top + rect.height / 2,
        );
        const chosen = svgBoxes
          .filter((box) => box.elements.some((element) => shapeContains(element, center)))
          .sort(
            (a, b) =>
              a.width * a.height - b.width * b.height,
          )[0];
        return chosen ?? null;
      };
      const 横が重なる = (text, box) =>
        Math.min(text.x + text.width, box.x + box.width) > Math.max(text.x, box.x);
      const 縦の隙間 = (text, box) => {
        if (text.y + text.height <= box.y) return box.y - (text.y + text.height);
        if (text.y >= box.y + box.height) return text.y - (box.y + box.height);
        return 0;
      };
      const 近くの箱 = (text, boxes) => {
        const candidates = boxes
          .map((box) => ({ box, gap: round(縦の隙間(text, box)), area: box.width * box.height }))
          .filter((entry) => 横が重なる(text, entry.box) && entry.gap <= 字と箱の許容距離);
        if (candidates.length === 0) return null;
        const nearest = Math.min(...candidates.map((entry) => entry.gap));
        const nearestBoxes = candidates.filter((entry) => entry.gap === nearest);
        const largest = Math.max(...nearestBoxes.map((entry) => entry.area));
        const chosen = nearestBoxes.filter((entry) => entry.area === largest);
        return chosen.length === 1 ? chosen[0].box : null;
      };
      const plainBox = ({ elements: _elements, ...box }) => box;

      const distance = (first, second) => Math.hypot(first.x - second.x, first.y - second.y);
      const filledShapeOutlines = shapeEntries.flatMap(({ element, measured }) => {
        if (
          !(element instanceof window.SVGGeometryElement) ||
          measured.width > arrowMaxDistance ||
          measured.height > arrowMaxDistance
        ) {
          return [];
        }
        const style = getComputedStyle(element);
        if (transparent(paint(style, "fill", element))) return [];
        try {
          const length = element.getTotalLength();
          const steps = Math.max(1, Math.ceil(length * 2));
          const points = Array.from({ length: steps + 1 }, (_entry, index) =>
            svgPointToRoot(element, element.getPointAtLength(length * (index / steps))),
          ).filter((point) => point !== null);
          return points.length === 0 ? [] : [{ points }];
        } catch {
          return [];
        }
      });
      const arrowTip = (point, outward) => {
        let chosen = point;
        let chosenProjection = 0;
        for (const outline of filledShapeOutlines) {
          const distances = outline.points.map((entry) => ({
            point: entry,
            distance: distance(point, entry),
          }));
          const nearest = Math.min(...distances.map((entry) => entry.distance));
          const farthest = distances.reduce((best, entry) =>
            entry.distance > best.distance ? entry : best,
          );
          const projected = outline.points
            .map((entry) => ({
              point: entry,
              projection:
                (entry.x - point.x) * outward.x + (entry.y - point.y) * outward.y,
            }))
            .reduce((best, entry) => entry.projection > best.projection ? entry : best);
          if (
            nearest <= arrowContactDistance &&
            farthest.distance <= arrowMaxDistance &&
            projected.projection > chosenProjection
          ) {
            chosen = projected.point;
            chosenProjection = projected.projection;
          }
        }
        return chosen;
      };

      const lineOutwardDirection = (element, position) => {
        try {
          const length = element.getTotalLength();
          const nearbyLength = Math.min(1, Math.max(0.01, length / 1000));
          const endpointLength = position === "start" ? 0 : length;
          const nearbyPosition = position === "start"
            ? Math.min(length, nearbyLength)
            : Math.max(0, length - nearbyLength);
          const endpoint = svgPointToRoot(element, element.getPointAtLength(endpointLength));
          const nearby = svgPointToRoot(element, element.getPointAtLength(nearbyPosition));
          if (endpoint === null || nearby === null) return null;
          return { x: endpoint.x - nearby.x, y: endpoint.y - nearby.y };
        } catch {
          return null;
        }
      };

      const markerId = (value) => {
        const match = String(value).match(/^url\((['"]?)(.*?)\1\)$/);
        if (match === null) return null;
        const hash = match[2].lastIndexOf("#");
        if (hash < 0) return null;
        try {
          return decodeURIComponent(match[2].slice(hash + 1));
        } catch {
          return match[2].slice(hash + 1);
        }
      };
      const markerElement = (element, position) => {
        const style = getComputedStyle(element);
        const value = position === "start" ? style.markerStart : style.markerEnd;
        const id = markerId(value);
        if (id === null) return null;
        const owner = element.ownerSVGElement;
        const marker = owner?.querySelector(`#${window.CSS.escape(id)}`) ?? document.getElementById(id);
        return marker instanceof window.SVGMarkerElement ? marker : null;
      };
      const markerPoint = (element, marker, point) => {
        let placed = new window.DOMPoint(point.x, point.y);
        let current = element;
        while (current instanceof window.SVGGraphicsElement && current !== marker) {
          const style = getComputedStyle(current);
          if (style.transform !== "none") {
            const [originX, originY] = style.transformOrigin.split(/\s+/).map(number);
            placed = new window.DOMPoint(placed.x - originX, placed.y - originY)
              .matrixTransform(new window.DOMMatrix(style.transform));
            placed = new window.DOMPoint(placed.x + originX, placed.y + originY);
          }
          current = current.parentElement;
        }
        return { x: placed.x, y: placed.y };
      };
      const hasMarkerPaint = (value) => {
        const paintValue = String(value).trim();
        return paintValue !== "" &&
          paintValue !== "none" &&
          paintValue !== "transparent" &&
          paintValue !== "rgba(0, 0, 0, 0)";
      };
      const straightPathVertices = (element) => {
        const tokens = (element.getAttribute("d") ?? "").match(
          /[a-zA-Z]|[+-]?(?:\d+\.?\d*|\.\d+)(?:e[+-]?\d+)?/gi,
        ) ?? [];
        if (
          tokens.length === 0 ||
          tokens.some((token) => /^[a-z]$/i.test(token) && !/^[mlhvz]$/i.test(token))
        ) {
          return [];
        }

        const points = [];
        let command = null;
        let current = { x: 0, y: 0 };
        let start = current;
        let index = 0;
        const read = () => {
          const token = tokens[index];
          if (token === undefined || /^[a-z]$/i.test(token)) return null;
          index += 1;
          return Number(token);
        };
        while (index < tokens.length) {
          const token = tokens[index];
          if (token !== undefined && /^[a-z]$/i.test(token)) {
            command = token;
            index += 1;
            if (command.toLowerCase() === "z") {
              current = start;
              points.push(current);
              command = null;
              continue;
            }
          }
          if (command === null) return [];

          const relative = command === command.toLowerCase();
          const kind = command.toLowerCase();
          if (kind === "h" || kind === "v") {
            const value = read();
            if (value === null) return [];
            current = kind === "h"
              ? { x: relative ? current.x + value : value, y: current.y }
              : { x: current.x, y: relative ? current.y + value : value };
          } else {
            const x = read();
            const y = read();
            if (x === null || y === null) return [];
            current = {
              x: relative ? current.x + x : x,
              y: relative ? current.y + y : y,
            };
          }
          points.push(current);
          if (kind === "m") {
            start = current;
            command = relative ? "l" : "L";
          }
        }
        return points;
      };
      const markerShapePoints = (marker) =>
        [...marker.querySelectorAll("path,line,polyline,polygon,rect,circle,ellipse")].flatMap(
          (element) => {
            if (!(element instanceof window.SVGGeometryElement)) return [];
            const style = getComputedStyle(element);
            if (
              style.display === "none" ||
              style.visibility === "hidden" ||
              cumulativeOpacity(element) === 0 ||
              (!hasMarkerPaint(style.fill) && !hasMarkerPaint(style.stroke))
            ) {
              return [];
            }
            try {
              const length = element.getTotalLength();
              const steps = Math.max(1, Math.ceil(length * 2));
              const sampled = Array.from({ length: steps + 1 }, (_entry, index) =>
                markerPoint(
                  element,
                  marker,
                  element.getPointAtLength(length * (index / steps)),
                ),
              );
              // 等間隔の輪郭点だけでは角を外すため、直線 path の頂点を正確に候補へ加える。
              const vertices = element instanceof window.SVGPathElement
                ? straightPathVertices(element).map((point) => markerPoint(element, marker, point))
                : [];
              return [...sampled, ...vertices];
            } catch {
              return [];
            }
          },
        );
      const elementToRootMatrix = (element) => {
        const origin = svgPointToRoot(element, { x: 0, y: 0 });
        const x = svgPointToRoot(element, { x: 1, y: 0 });
        const y = svgPointToRoot(element, { x: 0, y: 1 });
        if (origin === null || x === null || y === null) return null;
        return {
          a: x.x - origin.x,
          b: x.y - origin.y,
          c: y.x - origin.x,
          d: y.y - origin.y,
          e: origin.x,
          f: origin.y,
        };
      };
      const markerMeasurement = (element, position) => {
        const marker = markerElement(element, position);
        const matrix = elementToRootMatrix(element);
        if (marker === null || matrix === null) return null;
        try {
          const length = element.getTotalLength();
          const endpointLength = position === "start" ? 0 : length;
          const oppositeEndpoint = element.getPointAtLength(position === "start" ? length : 0);
          const nearbyLength = Math.min(1, Math.max(0.01, length / 1000));
          const endpoint = element.getPointAtLength(endpointLength);
          const nearby = element.getPointAtLength(
            position === "start"
              ? Math.min(length, nearbyLength)
              : Math.max(0, length - nearbyLength),
          );
          const tangent =
            position === "start"
              ? { x: nearby.x - endpoint.x, y: nearby.y - endpoint.y }
              : { x: endpoint.x - nearby.x, y: endpoint.y - nearby.y };
          const markerWidth = marker.markerWidth.baseVal.value;
          const markerHeight = marker.markerHeight.baseVal.value;
          const view = marker.viewBox.baseVal;
          const orient = marker.getAttribute("orient")?.trim() ?? "0";
          return {
            position,
            endpoint: { x: endpoint.x, y: endpoint.y },
            oppositeEndpoint: { x: oppositeEndpoint.x, y: oppositeEndpoint.y },
            tangentAngle: (Math.atan2(tangent.y, tangent.x) * 180) / Math.PI,
            points: markerShapePoints(marker),
            viewBox:
              view.width > 0 && view.height > 0
                ? { x: view.x, y: view.y, width: view.width, height: view.height }
                : { x: 0, y: 0, width: markerWidth, height: markerHeight },
            refX: marker.refX.baseVal.value,
            refY: marker.refY.baseVal.value,
            markerWidth,
            markerHeight,
            markerUnits:
              marker.getAttribute("markerUnits") === "userSpaceOnUse"
                ? "userSpaceOnUse"
                : "strokeWidth",
            strokeWidth: number(getComputedStyle(element).strokeWidth),
            preserveAspectRatio: marker.getAttribute("preserveAspectRatio") ?? "xMidYMid meet",
            orient:
              orient === "auto" || orient === "auto-start-reverse" ? orient : "angle",
            angle: marker.orientAngle.baseVal.value,
            matrix,
          };
        } catch {
          return null;
        }
      };

      const lines = [];
      const lineElements = [];
      // CDL は 1 本の論理線を主線と縁取りの同一経路 2 枚で描くため、端点でまとめる。
      const lineKeys = new Set();
      for (const element of root.querySelectorAll("line,polyline,path")) {
        if (excluded(element) || !drawn(element)) continue;
        const style = getComputedStyle(element);
        const tag = element.tagName.toLowerCase();
        const stroke = paint(style, "stroke", element);
        const noFill = style.fill === "none" || transparent(paint(style, "fill", element));
        const measured = boxFor(element);
        if (
          !hasExtent(measured) ||
          !inRegion(measured) ||
          number(style.strokeWidth) <= 0 ||
          transparent(stroke) ||
          (tag === "path" && !noFill)
        ) {
          continue;
        }
        let from;
        let to;
        if (element instanceof window.SVGLineElement) {
          from = svgPointToRoot(element, {
            x: element.x1.baseVal.value,
            y: element.y1.baseVal.value,
          });
          to = svgPointToRoot(element, {
            x: element.x2.baseVal.value,
            y: element.y2.baseVal.value,
          });
        } else if (element instanceof window.SVGPolylineElement) {
          from =
            element.points.length === 0 ? null : svgPointToRoot(element, element.points[0]);
          to =
            element.points.length === 0
              ? null
              : svgPointToRoot(element, element.points[element.points.length - 1]);
        } else {
          try {
            const length = element.getTotalLength();
            from = svgPointToRoot(element, element.getPointAtLength(0));
            to = svgPointToRoot(element, element.getPointAtLength(length));
          } catch {
            from = null;
            to = null;
          }
        }
        if (from === null || to === null) continue;
        const fromMarker = markerMeasurement(element, "start");
        const toMarker = markerMeasurement(element, "end");
        if (fromMarker === null) {
          const outward = lineOutwardDirection(element, "start");
          if (outward !== null) from = arrowTip(from, outward);
        }
        if (toMarker === null) {
          const outward = lineOutwardDirection(element, "end");
          if (outward !== null) to = arrowTip(to, outward);
        }
        const key = `${from.x}:${from.y}:${to.x}:${to.y}`;
        if (lineKeys.has(key)) continue;
        lineKeys.add(key);
        lines.push({ from, to, fromMarker, toMarker });
        lineElements.push({ kind: "line", id: `line-${lines.length}`, ...measured });
      }

      const ignored = new Set(ignoreTexts);
      const texts = [];
      const addText = (element, text, box) => {
        const normalized = text.trim().replace(/\s+/g, " ");
        if (
          normalized === "" ||
          ignored.has(normalized) ||
          !drawn(element) ||
          !hasSize(box) ||
          !inRegion(box)
        ) {
          return;
        }
        const style = getComputedStyle(element);
        const containedBox = element instanceof window.SVGElement ? svgBox(element) : htmlBox(element);
        const nearbyBox =
          containedBox === null
            ? 近くの箱(box, element instanceof window.SVGElement ? svgBoxes : htmlBoxes)
            : null;
        const associatedBox = containedBox ?? nearbyBox;
        texts.push({
          text: normalized,
          ...box,
          color:
            element instanceof window.SVGElement
              ? paint(style, "fill", element)
              : color(style.color, cumulativeOpacity(element)),
          box: associatedBox === null ? null : plainBox(associatedBox),
          boxRelation: containedBox === null && nearbyBox !== null ? "nearby" : "inside",
        });
      };
      for (const element of root.querySelectorAll("text,tspan")) {
        if (excluded(element) || !drawn(element)) continue;
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
          !drawn(parent) ||
          ["SCRIPT", "STYLE", "NOSCRIPT"].includes(parent.tagName)
        ) {
          continue;
        }
        const characters = [...(node.textContent ?? "")];
        const rows = [];
        let offset = 0;
        for (const character of characters) {
          const range = document.createRange();
          range.setStart(node, offset);
          range.setEnd(node, offset + character.length);
          offset += character.length;
          const rect = range.getBoundingClientRect();
          if (rect.width === 0 && rect.height === 0) continue;
          let row = rows.find((entry) => Math.abs(entry.top - rect.top) <= 1);
          if (row === undefined) {
            row = {
              text: "",
              top: rect.top,
              left: rect.left,
              right: rect.right,
              bottom: rect.bottom,
            };
            rows.push(row);
          }
          row.text += character;
          row.left = Math.min(row.left, rect.left);
          row.right = Math.max(row.right, rect.right);
          row.bottom = Math.max(row.bottom, rect.bottom);
        }
        for (const row of rows) {
          addText(
            parent,
            row.text,
            screenBoxToRoot({
              ...row,
              width: row.right - row.left,
              height: row.bottom - row.top,
            }),
          );
        }
      }

      const textBoxes = [
        ...new Map(
          texts.filter((text) => text.box !== null).map((text) => [text.box.id, text.box]),
        ).values(),
      ];
      const usedBoxIds = new Set(textBoxes.map((box) => box.id));
      const center = (box) => ({ x: box.x + box.width / 2, y: box.y + box.height / 2 });
      const farFromTextBoxes = (candidate) =>
        textBoxes.every((box) => {
          const first = center(candidate);
          const second = center(box);
          return (
            Math.max(
              Math.abs(first.x - second.x),
              Math.abs(first.y - second.y),
              Math.abs(candidate.width - box.width),
              Math.abs(candidate.height - box.height),
            ) > 10
          );
        });
      const otherBoxes = [];
      for (const box of svgBoxes) {
        if (!usedBoxIds.has(box.id) && farFromTextBoxes(box)) otherBoxes.push(plainBox(box));
      }
      if (mode === "html") {
        for (const box of htmlBoxes) {
          if (!usedBoxIds.has(box.id) && farFromTextBoxes(box)) {
            otherBoxes.push(plainBox(box));
          }
        }
      }
      const boxes = [...textBoxes, ...otherBoxes];
      const bounds =
        region ??
        (rootSvg instanceof window.SVGSVGElement
          ? {
              x: rootSvg.viewBox.baseVal.x,
              y: rootSvg.viewBox.baseVal.y,
              width: rootSvg.viewBox.baseVal.width,
              height: rootSvg.viewBox.baseVal.height,
            }
          : {
              x: 0,
              y: 0,
              width: round(rootRect.width / rootScreenScale),
              height: round(rootRect.height / rootScreenScale),
            });
      return {
        bounds,
        texts,
        boxes,
        lines,
        elements: [
          ...boxes.map((box) => ({
            kind: "box",
            id: box.id,
            x: box.x,
            y: box.y,
            width: box.width,
            height: box.height,
          })),
          ...texts.map((text, index) => ({
            kind: "text",
            id: `text-${index + 1}`,
            x: text.x,
            y: text.y,
            width: text.width,
            height: text.height,
          })),
          ...lineElements,
        ],
      };
    },
    {
      selector: opened.selector,
      mode: opened.mode,
      region: sourceの範囲(source),
      ignoreTexts: sourceの無視する字(source),
      arrowContactDistance: 矢じりの接触距離,
      arrowMaxDistance: 矢じりの最大距離,
    },
  );
  return {
    ...measurement,
    lines: measurement.lines.map(({ fromMarker, toMarker, ...line }) => ({
      ...line,
      from: fromMarker === null ? line.from : 印の最遠点(fromMarker),
      to: toMarker === null ? line.to : 印の最遠点(toMarker),
    })),
  };
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
  const 整える = (entry, index, fallbackLabel) => {
    const catalogSource = [entry.actual, entry.expected].find(
      (source) => source?.type === "catalog",
    );
    const palette =
      catalogSource === undefined
        ? (entry.actual?.type === "html" ? entry.actual.palette : undefined) ??
          (entry.expected?.type === "html" ? entry.expected.palette : undefined) ??
          null
        : (catalogSource.palette ?? 既定の意匠);
    return {
      label: typeof entry.label === "string" && entry.label !== "" ? entry.label : fallbackLabel,
      palette,
      expected: entry.expected,
      actual: entry.actual,
    };
  };
  if (Array.isArray(config?.comparisons) && config.comparisons.length > 0) {
    return config.comparisons.map((entry, index) => 整える(entry, index, `比較 ${index + 1}`));
  }
  if (config?.expected !== undefined && config?.actual !== undefined) {
    return [整える(config, 0, "比較")];
  }
  throw new Error("設定に expected と actual、または comparisons を指定してください");
}

export function sourceのpathを整える(source) {
  if (source?.type !== "html") return source;
  return { ...source, path: path.resolve(source.path) };
}
