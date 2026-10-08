import { expect, test, type Page } from "@playwright/test";
import type { PNG } from "pngjs";

import { EDITOR_SAMPLES } from "../src/data/editor-samples";
import { 六色の記法, 記法をURLに載せる } from "./box-and-edge-figure";
import {
  FIXED_THEME_DEVICE_SCALE_FACTOR,
  checkBoxAndLineContrast,
  checkTextContrast,
  color,
  colorKey,
  openEditorTheme,
  samplesByType,
  stopDiagram,
} from "./helpers/fixed-theme-checks";
import {
  captureThemeAppear,
  themeAppearCounts,
  themeAppearSource,
  themeEdgeAppearCounts,
} from "./helpers/theme-appear-capture";
import {
  readFixedThemeLead,
  readFixedThemeRoleColor,
  readThemeNotes,
  readThemeNoteText,
} from "./helpers/theme-notes";
import { contrast, luminance, shoot, type Box } from "./helpers/pixel-contrast";

const relief = readThemeNotes().get("relief");
if (relief?.mode !== "fixed") throw new Error("浮彫の意匠帳が固定の表ではない");
const lead = readFixedThemeLead().get("relief");
const pale = readFixedThemeRoleColor("relief", "淡");
const title = readFixedThemeRoleColor("relief", "題");
const white = readFixedThemeRoleColor("relief", "白");
if (!lead || !pale || !title || !white) throw new Error("浮彫の作りの色を意匠帳から読めない");

const stage = (page: Page) => page.locator('svg[data-cdl-stage][data-cdl-palette="relief"]');
const samples = samplesByType();
const 段のない六色の記法 = 六色の記法.replace(/\nanimation:\n[\s\S]*$/, "");
const 鍵の記法 = `title: "鍵の見本"
type: record

actors:
  - 利用者: { subtitle: "利用者", rows: ["id: bigint", "email: text"], marks: ["鍵", ""] }
`;

type Shadow = { dx: number; dy: number; deviation: number; color: string; opacity: number };

function roleValue(role: string): string {
  const row = new RegExp(`^\\|\\s*${role}\\s*\\|([^\\n]+)$`, "m").exec(readThemeNoteText("relief"))?.[1];
  if (!row) throw new Error(`浮彫の意匠帳から「${role}」を読めない`);
  return row.trim();
}

function normalizeFlood(value: string): { color: string; opacity: number } {
  const rgba = /^rgba\((\d+),(\d+),(\d+),([.\d]+)\)$/.exec(value);
  if (rgba) return { color: `rgb(${rgba[1]},${rgba[2]},${rgba[3]})`, opacity: Number(rgba[4]) };
  const rgb = /^rgb\((\d+),(\d+),(\d+)\)$/.exec(value);
  if (rgb) return { color: `rgb(${rgb[1]},${rgb[2]},${rgb[3]})`, opacity: 1 };
  if (value === "#fff" || value === "#ffffff") return { color: "#ffffff", opacity: 1 };
  throw new Error(`浮彫の影の色を読めない: ${value}`);
}

function shadows(role: string): Shadow[] {
  return [...roleValue(role).matchAll(/(-?\d+)px\s+(-?\d+)px\s+(\d+)px\s+(rgba?\([^)]+\)|#[0-9a-f]+)/gi)]
    .map((match) => {
      const flood = normalizeFlood(match[4]!.toLowerCase());
      return {
        dx: Number(match[1]),
        dy: Number(match[2]),
        deviation: Number(match[3]) / 2,
        ...flood,
      };
    });
}

const ALL_CIRCLE_GROUP_SELECTOR =
  'g[data-cdl-role="node-body"]:not([data-cdl-look]):not([data-cdl-mark]) > g:not(:where([data-cdl-role="node-kind-icon"])):has(> circle):not(:has(> :not(circle)))';
const BOX_FILTER_SELECTOR = [
  ':is(rect, path, ellipse, circle, polygon)[data-cdl-role="node-body"]:not([data-cdl-look]):not([data-cdl-mark])',
  'g[data-cdl-role="node-body"]:not([data-cdl-look]):not([data-cdl-mark]) > :is(rect, path, ellipse, circle, polygon)',
  'g[data-cdl-role="node-body"]:not([data-cdl-look]):not([data-cdl-mark]) > g:not(:where([data-cdl-role="node-kind-icon"])):not(:has(> circle):not(:has(> :not(circle)))) > :is(rect, path, ellipse, circle, polygon)',
  ALL_CIRCLE_GROUP_SELECTOR,
].join(", ");

type Point = { x: number; y: number };
type ShadingPoints = {
  box: Box;
  topInner: Point;
  center: Point;
  bottomInner: Point;
  topOuter?: Point;
  bottomOuter?: Point;
};

async function shadingPoints(
  page: Page,
  filterId: "dragon-relief-dome" | "dragon-relief-well",
  inset: number,
): Promise<ShadingPoints> {
  const shapes = stage(page).locator(BOX_FILTER_SELECTOR);
  const index = await shapes.evaluateAll((elements, expected) =>
    elements.findIndex((element) => getComputedStyle(element).filter.includes(expected)), filterId);
  expect(index, `${filterId} を持つ箱`).toBeGreaterThanOrEqual(0);

  return shapes.nth(index).evaluate((element, insetUnits) => {
    const box = element.getBoundingClientRect();
    const ctm = (element as SVGGraphicsElement).getScreenCTM();
    const scaleY = ctm === null ? 1 : Math.hypot(ctm.c, ctm.d);
    const edge = Math.max(1.5, scaleY * 2);
    const insetPx = insetUnits * scaleY;
    const topInnerY = box.top + insetPx + edge;
    const bottomInnerY = box.bottom - insetPx - edge;
    const owner = element.closest("[data-cdl-node]") ?? element.parentElement;
    // 図の題も障害物に含める (#2749)。題の画素も内縁や面の輝度へ混ざれば向きを誤判定するため。
    const obstacles = owner === null ? [] : [...owner.querySelectorAll<SVGGraphicsElement>(
      'text, line, rect[data-cdl-role^="chart-"], path[data-cdl-role^="chart-"], circle[data-cdl-role^="chart-"], ellipse[data-cdl-role^="chart-"], polygon[data-cdl-role^="chart-"], polyline[data-cdl-role^="chart-"]',
    )]
      .filter((candidate) => candidate !== element && !element.contains(candidate))
      .filter((candidate) => {
        const style = getComputedStyle(candidate);
        return style.display !== "none" && style.visibility !== "hidden" && Number(style.opacity || 1) > 0;
      })
      .map((candidate) => candidate.getBoundingClientRect())
      .filter((rect) => rect.width > 0 || rect.height > 0);
    const covered = (x: number, y: number): boolean => obstacles.some((rect) =>
      x >= rect.left - 2 && x <= rect.right + 2 && y >= rect.top - 2 && y <= rect.bottom + 2);
    const centerY = [0.5, 0.4, 0.6, 0.3, 0.7]
      .map((ratio) => box.top + box.height * ratio)
      .find((y) => y > topInnerY + edge && y < bottomInnerY - edge) ?? box.top + box.height / 2;
    const fixedYs = [topInnerY, bottomInnerY];
    if (insetUnits > 0) fixedYs.push(box.top + insetPx / 2, box.bottom - insetPx / 2);
    const x = [0.18, 0.82, 0.28, 0.72, 0.38, 0.62, 0.5]
      .map((ratio) => box.left + box.width * ratio)
      .find((candidate) => fixedYs.every((y) => !covered(candidate, y)) && !covered(candidate, centerY));
    if (x === undefined) throw new Error(`${filterId} の字・棒・目盛りと重ならない測定列が無い`);

    return {
      box: { x: box.x, y: box.y, width: box.width, height: box.height },
      topInner: { x, y: topInnerY },
      center: { x, y: centerY },
      bottomInner: { x, y: bottomInnerY },
      ...(insetUnits > 0 ? {
        topOuter: { x, y: box.top + insetPx / 2 },
        bottomOuter: { x, y: box.bottom - insetPx / 2 },
      } : {}),
    };
  }, inset);
}

function sampledLuminance(image: PNG, box: Box, point: Point): number {
  const left = Math.floor(box.x), top = Math.floor(box.y);
  const width = Math.ceil(box.x + box.width) - left;
  const height = Math.ceil(box.y + box.height) - top;
  const scaleX = image.width / width, scaleY = image.height / height;
  const centerX = Math.round((point.x - left) * scaleX);
  const centerY = Math.round((point.y - top) * scaleY);
  const values: number[] = [];
  for (let dy = -1; dy <= 1; dy += 1) {
    for (let dx = -1; dx <= 1; dx += 1) {
      const x = Math.max(0, Math.min(image.width - 1, centerX + dx));
      const y = Math.max(0, Math.min(image.height - 1, centerY + dy));
      const offset = (y * image.width + x) * 4;
      values.push(luminance([image.data[offset]!, image.data[offset + 1]!, image.data[offset + 2]!]));
    }
  }
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

const readEdgeLabels = (page: Page) =>
  stage(page).evaluate((root) => {
    const edges = new Map(
      [...root.querySelectorAll<SVGGraphicsElement>("[data-cdl-edge]")].flatMap((edge) => {
        const id = edge.getAttribute("data-cdl-edge");
        return id === null ? [] : [[id, edge] as const];
      }),
    );
    return [...root.querySelectorAll<SVGGraphicsElement>("[data-cdl-edge-label-for]")].flatMap((group) => {
      const edgeId = group.getAttribute("data-cdl-edge-label-for");
      const edge = edgeId === null ? undefined : edges.get(edgeId);
      const background = group.querySelector<SVGGraphicsElement>('[data-cdl-role="edge-label-bg"]');
      const label = group.querySelector<SVGGraphicsElement>('[data-cdl-role="edge-label"]');
      if (!edge || !background || !label) return [];
      return [{
        tone: group.getAttribute("data-cdl-tone"),
        background: getComputedStyle(background).fill,
        label: getComputedStyle(label).fill,
        weight: getComputedStyle(label).fontWeight,
        filter: getComputedStyle(background).filter,
      }];
    });
  });

test.describe("relief theme (#2796)", () => {
  test.describe.configure({ timeout: 300_000 });
  test.use({
    viewport: { width: 1920, height: 1080 },
    deviceScaleFactor: FIXED_THEME_DEVICE_SCALE_FACTOR,
  });

  for (const [type, source] of samples) {
    test(`relief ${type}: 地・板・線・対比が意匠帳どおりになる`, async ({ page }) => {
      const grounds: string[] = [];
      let boxes = 0;
      let raised = 0;
      let dome = 0;
      let well = 0;
      let lines = 0;
      const failures: string[] = [];

      for (const dark of [false, true]) {
        const mode = dark ? "暗" : "明";
        await openEditorTheme(page, source, "relief", dark);
        const root = stage(page);
        grounds.push(await root.evaluate((element) => getComputedStyle(element).backgroundColor));

        const shapes = await root.locator(BOX_FILTER_SELECTOR).evaluateAll((elements) =>
          elements.map((element) => {
            const children = [...element.children];
            const paint = children.length > 0 && children.every((child) => child.tagName.toLowerCase() === "circle")
              ? children[0]!
              : element;
            return {
              active: element.closest('[data-cdl-active="true"]') !== null,
              chart: element.closest('[data-cdl-kind^="chart-"]') !== null,
              fill: getComputedStyle(paint).fill,
              stroke: getComputedStyle(paint).stroke,
              filter: getComputedStyle(element).filter,
            };
          }),
        );
        boxes = Math.max(boxes, shapes.length);
        for (const shape of shapes) {
          expect(shape.stroke, `${type}/${mode} の箱に縁線がある`).toBe("none");
          expect(colorKey(shape.fill), `${type}/${mode} の箱の面`).toBe(colorKey(relief.value.face));
          const expected = shape.chart
            ? "dragon-relief-well"
            : shape.active
              ? "dragon-relief-dome"
              : "dragon-relief-raised";
          expect(shape.filter, `${type}/${mode} の箱の filter`).toContain(expected);
          if (!dark) {
            if (shape.chart) well += 1;
            else if (shape.active) dome += 1;
            else raised += 1;
          }
        }

        const edgeValues = await root.locator('[data-cdl-role="edge-line"]').evaluateAll((elements) =>
          elements.map((element) => ({
            stroke: getComputedStyle(element).stroke,
            filter: getComputedStyle(element).filter,
          })),
        );
        lines = Math.max(lines, edgeValues.length);
        const allowed = new Set([lead, relief.value.link, relief.value.own, relief.value.ink].map(colorKey));
        for (const line of edgeValues) {
          expect(allowed.has(colorKey(line.stroke)), `${type}/${mode} の線 ${line.stroke}`).toBe(true);
          expect(line.filter, `${type}/${mode} の線に影がある`).not.toContain("dragon-relief");
        }

        const filteredRoles = await root.evaluate((element, boxSelector) => {
          const contours = new Set(element.querySelectorAll(boxSelector));
          return (
          [...element.querySelectorAll<SVGGraphicsElement>("*")].flatMap((candidate) => {
            if (!getComputedStyle(candidate).filter.includes("dragon-relief")) return [];
            if (candidate.matches('[data-cdl-role="edge-label-bg"], [data-cdl-role="chart-bar"]')) return [];
            return contours.has(candidate)
              ? []
              : [candidate.getAttribute("data-cdl-role") ?? candidate.tagName];
          })
          );
        }, BOX_FILTER_SELECTOR);
        expect(filteredRoles, `${type}/${mode} の箱の中の図形へ影が届いた`).toEqual([]);

        const shapeContrast = await checkBoxAndLineContrast(page, root, type, mode, relief, lead);
        const textContrast = await checkTextContrast(page, type, mode);
        failures.push(...shapeContrast.failures, ...textContrast.failures);
      }

      const expectedGround = `rgb(${color(relief.value.ground).join(", ")})`;
      expect(grounds).toEqual([expectedGround, expectedGround]);
      console.log(
        `relief ${type}: ground=${grounds.join("/")} boxes=${boxes} raised=${raised} ` +
          `dome=${dome} well=${well} lines=${lines} violations=${failures.length}`,
      );
      expect(failures).toEqual([]);
    });
  }

  test("relief filter: 4 つの filter の外の影が意匠帳どおりになる", async ({ page }) => {
    await openEditorTheme(page, samples.values().next().value ?? themeAppearSource("relief"), "relief", false);
    for (const id of ["dragon-relief-raised", "dragon-relief-dome", "dragon-relief-well", "dragon-relief-raised-sm"]) {
      const filter = page.locator(`filter#${id}`);
      await expect(filter, id).toHaveCount(1);
      await expect(filter).toHaveAttribute("filterUnits", "userSpaceOnUse");
      await expect(filter).toHaveAttribute("x", "-10%");
      await expect(filter).toHaveAttribute("y", "-10%");
      await expect(filter).toHaveAttribute("width", "120%");
      await expect(filter).toHaveAttribute("height", "120%");
      await expect(filter).toHaveAttribute("color-interpolation-filters", "sRGB");
    }

    const expected = new Map([
      ["dragon-relief-raised", shadows("板の影")],
      ["dragon-relief-dome", shadows("主役")],
      ["dragon-relief-well", shadows("板の影")],
      ["dragon-relief-raised-sm", shadows("小さな板")],
    ]);
    expect(expected.size, "外の影を読む filter が空").toBe(4);
    for (const [id, values] of expected) {
      expect(values, `${id} の意匠帳の影`).toHaveLength(2);
      const actual = await page.locator(`filter#${id}`).evaluate((filter) => ({
        offsets: [...filter.querySelectorAll("feOffset")].slice(0, 2).map((node) => ({
          dx: Number(node.getAttribute("dx")),
          dy: Number(node.getAttribute("dy")),
        })),
        deviations: [...filter.querySelectorAll("feGaussianBlur")].slice(0, 2)
          .map((node) => Number(node.getAttribute("stdDeviation"))),
        floods: [...filter.querySelectorAll("feFlood")].slice(0, 2).map((node) => ({
          color: node.getAttribute("flood-color") ?? "",
          opacity: Number(node.getAttribute("flood-opacity")),
        })),
      }));
      expect(actual.offsets).toEqual(values.map(({ dx, dy }) => ({ dx, dy })));
      expect(actual.deviations).toEqual(values.map(({ deviation }) => deviation));
      expect(actual.floods.map(({ color: floodColor, opacity }) => ({
        color: colorKey(floodColor),
        opacity,
      }))).toEqual(values.map(({ color: floodColor, opacity }) => ({
        color: colorKey(floodColor),
        opacity,
      })));
    }

    const domeMatch = /白\s+([.\d]+).*?`rgb\(160,144,120\)`\s+([.\d]+).*?(\d+)px.*?標準偏差\s+(\d+)/
      .exec(roleValue("主役"));
    if (!domeMatch) throw new Error("浮彫の意匠帳から主役の内側の縁を読めない");
    const domeInner = await page.locator("filter#dragon-relief-dome").evaluate((filter) => ({
      deviation: Number(filter.querySelector('[result="dome-inner-blur"]')?.getAttribute("stdDeviation")),
      lightOffset: {
        dx: Number(filter.querySelector('[result="dome-inner-light-offset"]')?.getAttribute("dx")),
        dy: Number(filter.querySelector('[result="dome-inner-light-offset"]')?.getAttribute("dy")),
      },
      darkOffset: {
        dx: Number(filter.querySelector('[result="dome-inner-dark-offset"]')?.getAttribute("dx")),
        dy: Number(filter.querySelector('[result="dome-inner-dark-offset"]')?.getAttribute("dy")),
      },
      lightOpacity: Number(filter.querySelector('[result="dome-inner-light-color"]')?.getAttribute("flood-opacity")),
      darkOpacity: Number(filter.querySelector('[result="dome-inner-dark-color"]')?.getAttribute("flood-opacity")),
    }));
    const domeDistance = Number(domeMatch[3]);
    expect(domeInner).toEqual({
      deviation: Number(domeMatch[4]),
      lightOffset: { dx: domeDistance, dy: domeDistance },
      darkOffset: { dx: -domeDistance, dy: -domeDistance },
      lightOpacity: Number(domeMatch[1]),
      darkOpacity: Number(domeMatch[2]),
    });

    const wellRole = roleValue("窪み");
    const inset = Number(/内側へ\s+(\d+)px/.exec(wellRole)?.[1]);
    const wellShadows = shadows("窪み");
    expect(wellShadows, "窪みの内側の影").toHaveLength(2);
    const wellInner = await page.locator("filter#dragon-relief-well").evaluate((filter) => ({
      inset: Number(filter.querySelector('[result="well-inner"]')?.getAttribute("radius")),
      offsets: ["dark", "light"].map((side) => ({
        dx: Number(filter.querySelector(`[result="well-inner-${side}-offset"]`)?.getAttribute("dx")),
        dy: Number(filter.querySelector(`[result="well-inner-${side}-offset"]`)?.getAttribute("dy")),
      })),
      deviation: Number(filter.querySelector('[result="well-inner-blur"]')?.getAttribute("stdDeviation")),
      floods: ["dark", "light"].map((side) => ({
        color: filter.querySelector(`[result="well-inner-${side}-color"]`)
          ?.getAttribute("flood-color") ?? "",
        opacity: Number(filter.querySelector(`[result="well-inner-${side}-color"]`)?.getAttribute("flood-opacity")),
      })),
    }));
    expect({
      ...wellInner,
      floods: wellInner.floods.map(({ color: floodColor, opacity }) => ({
        color: colorKey(floodColor),
        opacity,
      })),
    }).toEqual({
      inset,
      offsets: wellShadows.map(({ dx, dy }) => ({ dx, dy })),
      deviation: wellShadows[0]!.deviation,
      floods: wellShadows.map(({ color: floodColor, opacity }) => ({
        color: colorKey(floodColor),
        opacity,
      })),
    });
  });

  test("relief shading: 主役は膨らみ図表は窪む", async ({ page }) => {
    const classSource = EDITOR_SAMPLES.find(
      (sample) => sample.slug === "class" && /^type:\s*record\s*$/m.test(sample.code),
    )?.code;
    const chartSource = EDITOR_SAMPLES.find((sample) =>
      /^type:\s*chart\s*$/m.test(sample.code) && /^shape:\s*bar\s*$/m.test(sample.code))?.code;
    if (!classSource || !chartSource) throw new Error("主役と図表の画素を測る見本が無い");

    await openEditorTheme(page, classSource, "relief", false);
    await stopDiagram(page);
    const dome = await shadingPoints(page, "dragon-relief-dome", 0);
    const domeImage = await shoot(page, dome.box);
    const domeLight = {
      top: sampledLuminance(domeImage, dome.box, dome.topInner),
      center: sampledLuminance(domeImage, dome.box, dome.center),
      bottom: sampledLuminance(domeImage, dome.box, dome.bottomInner),
    };
    console.log(`relief shading dome luminance=${JSON.stringify(domeLight)}`);
    expect(domeLight.top, "主役の左上の内縁が面より明るい").toBeGreaterThan(domeLight.center + 0.01);
    expect(domeLight.bottom, "主役の右下の内縁が面より暗い").toBeLessThan(domeLight.center - 0.01);

    const inset = Number(/内側へ\s+(\d+)px/.exec(roleValue("窪み"))?.[1]);
    expect(inset, "意匠帳の窪みの縮める量").toBeGreaterThan(0);
    await openEditorTheme(page, chartSource, "relief", false);
    await stopDiagram(page);
    const well = await shadingPoints(page, "dragon-relief-well", inset);
    const wellImage = await shoot(page, well.box);
    if (!well.topOuter || !well.bottomOuter) throw new Error("窪みの外側の測定点が無い");
    const wellLight = {
      top: sampledLuminance(wellImage, well.box, well.topInner),
      center: sampledLuminance(wellImage, well.box, well.center),
      bottom: sampledLuminance(wellImage, well.box, well.bottomInner),
      topOutside: sampledLuminance(wellImage, well.box, well.topOuter),
      bottomOutside: sampledLuminance(wellImage, well.box, well.bottomOuter),
    };
    console.log(`relief shading well luminance=${JSON.stringify(wellLight)}`);
    expect(wellLight.top, "窪みの左上の内縁が面より暗い").toBeLessThan(wellLight.center - 0.01);
    expect(wellLight.bottom, "窪みの右下の内縁が面より明るい").toBeGreaterThan(wellLight.center + 0.01);
    expect(Math.abs(wellLight.topOutside - wellLight.center), "窪みの上外側は板の面のまま").toBeLessThan(0.01);
    expect(Math.abs(wellLight.bottomOutside - wellLight.center), "窪みの下外側は板の面のまま").toBeLessThan(0.01);
  });

  test("relief lead: 主役・札・棒・鍵が意匠帳どおりになる", async ({ page }) => {
    await openEditorTheme(page, themeAppearSource("relief"), "relief", false);
    const labels = await stage(page).locator('[data-cdl-role="node-label"]').evaluateAll((elements) =>
      elements.map((element) => ({
        active: element.closest('[data-cdl-active="true"]') !== null,
        fill: getComputedStyle(element).fill,
      })),
    );
    expect(labels.some((label) => label.active), "主役の箱の名前が無い").toBe(true);
    expect(labels.some((label) => !label.active), "主役でない箱の名前が無い").toBe(true);
    for (const label of labels) {
      expect(colorKey(label.fill)).toBe(colorKey(label.active ? title : relief.value.ink));
    }
    expect(contrast(color(title), color(relief.value.face)), "主役の題の対比").toBeGreaterThanOrEqual(4.5);

    await openEditorTheme(page, 段のない六色の記法, "relief", false);
    const toned = await readEdgeLabels(page);
    expect(toned).toHaveLength(6);
    expect(new Set(toned.map((label) => colorKey(label.background)))).toEqual(
      new Set([title, relief.value.link, relief.value.own].map(colorKey)),
    );
    for (const label of toned) {
      expect(colorKey(label.label), `${label.tone} の札の字`).toBe(colorKey(white));
      expect(Number(label.weight), `${label.tone} の札の太さ`).toBeGreaterThanOrEqual(700);
      expect(label.filter, `${label.tone} の札の浮き`).toContain("dragon-relief-raised-sm");
      expect(contrast(color(white), color(label.background)), `${label.tone} の札の対比`).toBeGreaterThanOrEqual(4.5);
    }

    await openEditorTheme(page, 六色の記法, "relief", false);
    const staged = await readEdgeLabels(page);
    expect(new Set(staged.map((label) => colorKey(label.background)))).toEqual(
      new Set([title, relief.value.link, relief.value.own].map(colorKey)),
    );
    for (const label of staged) {
      expect(label.tone, "段のある札の色み").not.toBeNull();
      expect(colorKey(label.label)).toBe(colorKey(white));
    }

    const chartSource = EDITOR_SAMPLES.find((sample) =>
      /^type:\s*chart\s*$/m.test(sample.code) && /^shape:\s*bar\s*$/m.test(sample.code))?.code;
    if (!chartSource) throw new Error("図表の見本が無い");
    await openEditorTheme(page, chartSource, "relief", false);
    const bars = await stage(page).locator('[data-cdl-role="chart-bar"]').evaluateAll((elements) =>
      elements.map((element) => ({
        main: element.getAttribute("data-cdl-emphasis") === "primary",
        fill: getComputedStyle(element).fill,
        opacity: getComputedStyle(element).fillOpacity,
        filter: getComputedStyle(element).filter,
      })),
    );
    expect(bars.some((bar) => bar.main), "主役の棒が無い").toBe(true);
    expect(bars.some((bar) => !bar.main), "主役でない棒が無い").toBe(true);
    for (const bar of bars) {
      expect(colorKey(bar.fill)).toBe(colorKey(bar.main ? lead : pale));
      expect(bar.opacity).toBe("1");
      expect(bar.filter).toContain("dragon-relief-raised-sm");
    }

    await openEditorTheme(page, 鍵の記法, "relief", false);
    const keys = await stage(page).locator('[data-cdl-role="node-row-underline"]')
      .evaluateAll((elements) => elements.map((element) => getComputedStyle(element).stroke));
    expect(keys.length, "鍵の下線が無い").toBeGreaterThan(0);
    expect(new Set(keys.map(colorKey))).toEqual(new Set([colorKey(lead)]));
  });

  test("relief initial-animation: 箱と線は各 1 回だけ浮き出る", async ({ page }) => {
    await captureThemeAppear(page);
    await page.goto(`editor#s=${記法をURLに載せる(themeAppearSource("relief"))}`);
    await page.waitForSelector('svg[data-cdl-stage][data-cdl-palette="relief"]');
    await page.waitForFunction(() => {
      const c = document.querySelector('[data-cdl-node="c"]');
      return c !== null && !c.hasAttribute("data-cdl-hidden");
    }, undefined, { timeout: 5_000 });
    await expect(page.locator("[data-cdl-phase-index]").first()).toHaveAttribute(
      "data-cdl-phase-index",
      "2",
      { timeout: 5_000 },
    );
    await page.waitForTimeout(1_400);

    const edgeIds = await page.locator("[data-cdl-edge]").evaluateAll((elements) =>
      elements.flatMap((element) => element.getAttribute("data-cdl-edge") ?? []));
    const boxes = await themeAppearCounts(page);
    const edges = await themeEdgeAppearCounts(page);
    console.log(`relief initial-animation boxes=${JSON.stringify(boxes)} edges=${JSON.stringify(edges)}`);
    expect(boxes).toMatchObject({ a: 1, b: 1, c: 1 });
    expect(Object.values(boxes).every((count) => count === 1)).toBe(true);
    expect(Object.keys(edges).sort()).toEqual(edgeIds.sort());
    expect(Object.values(edges).every((count) => count === 1)).toBe(true);
  });
});
