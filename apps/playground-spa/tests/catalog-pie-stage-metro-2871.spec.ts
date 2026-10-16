import { expect, test, type Locator, type Page } from "@playwright/test";
import { PNG } from "pngjs";

import { 一覧が落ち着くまで待つ } from "./wait-for-render";

const 画素倍率 = 2;

test.use({ deviceScaleFactor: 画素倍率 });

const 意匠 = [
  ["blueprint", "図面"],
  ["letterpress", "活版"],
  ["catalog", "図録"],
  ["terminal", "端末"],
  ["sketch", "手描き"],
  ["neon", "電飾"],
  ["relief", "浮彫"],
] as const;

const 静止までの刻み = 100;
const 静止の回数 = 15;

type 点 = { x: number; y: number };
type 色 = readonly [number, number, number];

function 画素(絵: PNG, 点: 点): 色 {
  const x = Math.round(点.x * 画素倍率);
  const y = Math.round(点.y * 画素倍率);
  if (x < 0 || x >= 絵.width || y < 0 || y >= 絵.height) {
    throw new Error(`画素 (${x}, ${y}) は写し ${絵.width}x${絵.height} の外にある`);
  }
  const index = (y * 絵.width + x) * 4;
  const red = 絵.data[index];
  const green = 絵.data[index + 1];
  const blue = 絵.data[index + 2];
  if (red === undefined || green === undefined || blue === undefined) throw new Error("画素を読めない");
  return [red, green, blue];
}

function 飽和度([red, green, blue]: 色): number {
  const max = Math.max(red, green, blue);
  return max === 0 ? 0 : (max - Math.min(red, green, blue)) / max;
}

function 明るさ([red, green, blue]: 色): number {
  return 0.2126 * red + 0.7152 * green + 0.0722 * blue;
}

async function 見本を開く(page: Page, 分類: "charts" | "presets", id: string): Promise<Locator> {
  await page.goto(`catalog/${分類}`, { waitUntil: "networkidle" });
  await 一覧が落ち着くまで待つ(page, 分類);
  await page.locator(`.catalog-list-item[data-item-id="${id}"]`).click();
  const preview = page.locator(".catalog-preview-stage:not([hidden])");
  await expect(preview.locator("svg[data-cdl-stage]")).toBeVisible();
  await page.evaluate(() => document.fonts.ready);
  return preview;
}

async function 意匠を選ぶ(page: Page, value: string, label: string): Promise<void> {
  const select = page.getByRole("combobox", { name: "図の色味" });
  await select.selectOption({ label });
  await expect(select).toHaveValue(value);
}

async function 最後の段で静止するまで待つ(page: Page, label: string): Promise<void> {
  let previous = "";
  let still = 0;
  for (let elapsed = 0; elapsed < 30_000; elapsed += 静止までの刻み) {
    await page.clock.runFor(静止までの刻み);
    const state = await page.evaluate(() => {
      const stage = document.querySelector(".catalog-preview-stage:not([hidden])");
      const diagram = stage?.querySelector("[data-cdl-diagram]");
      return {
        index: diagram?.getAttribute("data-cdl-phase-index") ?? "",
        phaseCount: stage?.querySelectorAll(".cdl-phase-seg").length ?? 0,
        body: stage?.querySelector("svg[data-cdl-stage]")?.innerHTML ?? "",
      };
    });
    const signature = `${state.index}\n${state.body}`;
    const atLastPhase = state.phaseCount === 0 || state.index === String(state.phaseCount - 1);
    still = atLastPhase && signature === previous ? still + 1 : 0;
    previous = signature;
    if (still >= 静止の回数) return;
  }
  throw new Error(`${label}が最後の段で静止しない`);
}

test("電飾の円は4区画を3ずつ離し、輪の縁に暗い線を作らない (#2871)", async ({ page }) => {
  await page.clock.install({ time: new Date("2026-10-07T09:00:00+09:00") });
  await page.emulateMedia({ reducedMotion: "reduce" });
  const preview = await 見本を開く(page, "charts", "荷物の状態");
  await 意匠を選ぶ(page, "neon", "電飾");
  await 最後の段で静止するまで待つ(page, "電飾の円");
  const slices = preview.locator('[data-cdl-role="chart-pie-slice"]');
  await expect(slices).toHaveCount(4);

  const measured = await slices.evaluateAll((paths) => {
    const numberPattern = /[-+]?(?:\d*\.?\d+)(?:e[-+]?\d+)?/giu;
    const parsed = paths.map((path) => {
      const values = [...(path.getAttribute("d") ?? "").matchAll(numberPattern)].map((match) => Number(match[0]));
      if (values.length < 18) throw new Error(`円の区画の path を読めない: ${path.getAttribute("d") ?? ""}`);
      const outerRadius = values[2]!;
      const innerRadius = values[11]!;
      return {
        outerRadius,
        innerRadius,
        outerStart: { x: values[0]!, y: values[1]! },
        outerEnd: { x: values[7]!, y: values[8]! },
        innerEnd: { x: values[9]!, y: values[10]! },
        innerStart: { x: values[16]!, y: values[17]! },
        stroke: getComputedStyle(path).stroke,
      };
    });
    const first = parsed[0]!;
    const cx = (first.outerRadius * first.innerStart.x - first.innerRadius * first.outerStart.x) /
      (first.outerRadius - first.innerRadius);
    const cy = (first.outerRadius * first.innerStart.y - first.innerRadius * first.outerStart.y) /
      (first.outerRadius - first.innerRadius);
    const middleRadius = (first.outerRadius + first.innerRadius) / 2;
    const middlePoint = (outer: { x: number; y: number }, inner: { x: number; y: number }) => ({
      x: (outer.x + inner.x) / 2,
      y: (outer.y + inner.y) / 2,
    });
    const angle = (point: { x: number; y: number }) => Math.atan2(point.y - cy, point.x - cx);
    const gaps = parsed.map((slice, index) => {
      const next = parsed[(index + 1) % parsed.length]!;
      const end = angle(middlePoint(slice.outerEnd, slice.innerEnd));
      const start = angle(middlePoint(next.outerStart, next.innerStart));
      const difference = Math.abs(end - start);
      return Math.min(difference, Math.PI * 2 - difference) * middleRadius;
    });
    return { gaps, strokes: parsed.map((slice) => slice.stroke) };
  });

  expect(measured.gaps).toHaveLength(4);
  for (const gap of measured.gaps) expect(Math.abs(gap - 3), `区画の間は ${gap}`).toBeLessThanOrEqual(0.5);
  expect(measured.strokes).toEqual(["none", "none", "none", "none"]);

  const svg = preview.locator("svg[data-cdl-stage]");
  const ring = await svg.evaluate((stage) => {
    const origin = stage.getBoundingClientRect();
    const paths = [...stage.querySelectorAll<SVGPathElement>('[data-cdl-role="chart-pie-slice"]')];
    if (paths.length !== 4) throw new Error(`電飾の円の区画が4個でない: ${paths.length}`);
    const bounds = paths.map((path) => path.getBoundingClientRect()).reduce((left, right) => ({
      left: Math.min(left.left, right.left),
      top: Math.min(left.top, right.top),
      right: Math.max(left.right, right.right),
      bottom: Math.max(left.bottom, right.bottom),
    }), { left: Infinity, top: Infinity, right: -Infinity, bottom: -Infinity });
    const center = {
      x: (bounds.left + bounds.right) / 2 - origin.left,
      y: (bounds.top + bounds.bottom) / 2 - origin.top,
    };
    const outer = (bounds.right - bounds.left) / 2;
    const radii = [...(paths[0]?.getAttribute("d") ?? "").matchAll(/A ([\d.]+) /gu)]
      .map((match) => Number(match[1]));
    if (radii.length === 0) throw new Error("電飾の円の半径を path から読めない");
    const inner = Math.min(...radii) * outer / Math.max(...radii);
    const angles = paths.map((path) => {
      const point = path.getPointAtLength(path.getTotalLength() * 0.25);
      const matrix = path.getScreenCTM();
      if (matrix === null) throw new Error("電飾の円の画面座標を読めない");
      const screen = new DOMPoint(point.x, point.y).matrixTransform(matrix);
      return Math.atan2(screen.y - origin.top - center.y, screen.x - origin.left - center.x);
    });
    return { center, outer, inner, angles };
  });
  const picture = PNG.sync.read(await svg.screenshot({ animations: "disabled" }));
  const darkLines: string[] = [];
  for (const [index, angle] of ring.angles.entries()) {
    const directions = [
      { name: "外縁", from: ring.outer - 6, to: ring.outer + 12 },
      { name: "内縁", from: ring.inner + 6, to: ring.inner - 12 },
    ] as const;
    for (const direction of directions) {
      const step = direction.from < direction.to ? 0.5 : -0.5;
      const values: number[] = [];
      for (
        let radius = direction.from;
        step > 0 ? radius <= direction.to : radius >= direction.to;
        radius += step
      ) {
        values.push(明るさ(画素(picture, {
          x: ring.center.x + radius * Math.cos(angle),
          y: ring.center.y + radius * Math.sin(angle),
        })));
      }
      const ground = values.at(-1);
      if (ground === undefined) throw new Error(`${index + 1}区画の${direction.name}を測れない`);
      const minimum = Math.min(...values);
      if (minimum < ground - 2) {
        darkLines.push(`${index + 1}区画の${direction.name}: 最小 ${minimum.toFixed(1)} / 地 ${ground.toFixed(1)}`);
      }
    }
  }
  expect(darkLines, "4区画の外縁と内縁で、地より2以上暗い線").toEqual([]);
});

test("段の箱の7意匠で戻る線と札を同じ意匠の見本頁に揃える (#2871)", async ({ page }) => {
  const references = new Map<string, { targetInset: number; labelOffset: number }>();
  const referencePage = await page.context().newPage();
  for (const [, label] of 意匠) {
    await referencePage.goto(new URL(`../../../docs/design/proposal/static/段箱-${label}.html`, import.meta.url).href);
    await referencePage.evaluate(() => document.fonts.ready);
    const measured = await referencePage.evaluate(() => {
      const target = document.querySelector<HTMLElement>('.fig [data-ent="便に積む"]');
      const edge = document.querySelector<SVGPathElement>('.fig svg .wire > path[stroke-dasharray]');
      // 図の題 (#2749): 字が「翌日もう一度」と完全に一致する札だけを拾うので、題は数えない。
      const edgeLabelText = [...document.querySelectorAll<SVGTextElement>(".fig svg text")]
        .find((text) => text.textContent?.trim() === "翌日もう一度");
      const edgeLabel = edgeLabelText?.closest(".tag")?.querySelector<SVGRectElement>("rect");
      if (target === null || edge === null || edgeLabel === undefined || edgeLabel === null) {
        throw new Error("段箱の見本頁で、箱・戻る線・札のいずれかを測れない");
      }
      const end = edge.getPointAtLength(edge.getTotalLength());
      const labelBox = edgeLabel.getBBox();
      const targetCenter = target.offsetLeft + target.offsetWidth / 2;
      return {
        targetInset: target.offsetLeft + target.offsetWidth - end.x,
        labelOffset: labelBox.x + labelBox.width / 2 - targetCenter,
      };
    });
    references.set(label, measured);
  }
  await referencePage.close();

  await page.clock.install({ time: new Date("2026-10-07T09:00:00+09:00") });
  await page.goto("catalog/presets", { waitUntil: "networkidle" });
  await page.clock.pauseAt(new Date("2026-10-07T09:10:00+09:00"));
  await page.clock.runFor(2_000);
  await page.evaluate(() => document.fonts.ready);
  const item = page.locator('.catalog-list-item[data-item-id="delivery-stages-demo"]');
  await expect(item, "delivery-stages-demo の行").toHaveCount(1);
  await item.click();
  const preview = page.locator(".catalog-preview-stage:not([hidden])");
  await expect(preview.locator("svg[data-cdl-stage]")).toBeVisible();

  for (const [value, label] of 意匠) {
    await 意匠を選ぶ(page, value, label);
    await 最後の段で静止するまで待つ(page, label);
    const measured = await preview.evaluate(() => {
      const target = document.querySelector<SVGGElement>('.catalog-preview-stage:not([hidden]) [data-cdl-node="便に積む"]');
      const edge = document.querySelector<SVGGElement>('.catalog-preview-stage:not([hidden]) [data-cdl-from="持ち戻る"][data-cdl-to="便に積む"]');
      const edgeLabel = document.querySelector<SVGGElement>('.catalog-preview-stage:not([hidden]) [data-cdl-edge-label-text="翌日もう一度"]');
      if (target === null || edge === null || edgeLabel === null) throw new Error("段の箱の測定対象が無い");
      const d = edge.getAttribute("data-cdl-path-d");
      if (d === null) throw new Error("戻る線の path が無い");
      const probe = document.createElementNS("http://www.w3.org/2000/svg", "path");
      probe.setAttribute("d", d);
      edge.ownerSVGElement?.append(probe);
      const end = probe.getPointAtLength(probe.getTotalLength());
      probe.remove();
      const transform = edgeLabel.getAttribute("transform") ?? "";
      const match = /translate\(\s*([-+.\deE]+)[ ,]+([-+.\deE]+)\s*\)/u.exec(transform);
      if (match === null) throw new Error(`戻る線の札の位置を読めない: ${transform}`);
      const center = Number(target.getAttribute("data-cdl-cx"));
      const width = Number(target.getAttribute("data-cdl-w"));
      return {
        targetInset: center + width / 2 - end.x,
        labelOffset: Number(match[1]) - center,
      };
    });
    const reference = references.get(label);
    if (reference === undefined) throw new Error(`${label}の段箱の見本頁を測れていない`);
    expect(
      Math.abs(measured.targetInset - reference.targetInset),
      `${label}の戻る線: 見本帳 ${measured.targetInset} / 見本頁 ${reference.targetInset}`,
    ).toBeLessThanOrEqual(4);
    expect(
      Math.abs(measured.labelOffset - reference.labelOffset),
      `${label}の札: 見本帳 ${measured.labelOffset} / 見本頁 ${reference.labelOffset}`,
    ).toBeLessThanOrEqual(4);
  }
});

test("浮彫の路線図は駅と印の際まで線の色を保ち、右下へ影を落とす (#2871)", async ({ page }) => {
  await page.clock.install({ time: new Date("2026-10-07T09:00:00+09:00") });
  await page.emulateMedia({ reducedMotion: "reduce" });
  const preview = await 見本を開く(page, "presets", "delivery-metro-demo");
  await 意匠を選ぶ(page, "relief", "浮彫");
  await 最後の段で静止するまで待つ(page, "浮彫の路線図");

  const svg = preview.locator("svg[data-cdl-stage]");
  const settledLines = await svg.evaluate((stage) => {
    const origin = stage.getBoundingClientRect();
    return [...stage.querySelectorAll<SVGPathElement>(
      '[data-cdl-routing="metro"] [data-cdl-role="edge-line"]',
    )].map((line) => {
      const route = line.closest<SVGGElement>('[data-cdl-routing="metro"]');
      const name = `${route?.getAttribute("data-cdl-from") ?? "?"}→${route?.getAttribute("data-cdl-to") ?? "?"}`;
      let opacity = 1;
      for (let element: Element | null = line; element !== null && element !== stage; element = element.parentElement) {
        opacity *= Number.parseFloat(getComputedStyle(element).opacity) || 0;
      }
      const style = getComputedStyle(line);
      opacity *= Number.parseFloat(style.strokeOpacity) || 0;
      const stroke = style.stroke;
      const channels = [...stroke.matchAll(/[\d.]+/gu)].slice(0, 3).map((match) => Number(match[0]));
      const maximum = Math.max(...channels);
      const expectedSaturation = maximum === 0 ? 0 : (maximum - Math.min(...channels)) / maximum;
      const matrix = line.getScreenCTM();
      if (matrix === null) throw new Error(`${name}の画面座標を読めない`);
      const length = line.getTotalLength();
      const points: 点[] = [];
      for (let at = length * 0.2; at <= length * 0.8; at += 1) {
        const point = line.getPointAtLength(at);
        const screen = new DOMPoint(point.x, point.y).matrixTransform(matrix);
        points.push({ x: screen.x - origin.left, y: screen.y - origin.top });
      }
      return { name, opacity, expectedSaturation, points, dotted: style.strokeDasharray !== "none" };
    });
  });
  expect(settledLines.length, "最後の段の路線").toBeGreaterThan(0);
  expect(settledLines.some((line) => line.dotted), "最後の段の戻る点線").toBe(true);
  expect(
    settledLines.flatMap((line) => line.opacity >= 0.99 ? [] : [`${line.name}: ${line.opacity}`]),
    "最後の段で不透明でない路線",
  ).toEqual([]);

  const picture = PNG.sync.read(await svg.screenshot({ animations: "disabled" }));
  expect(
    settledLines.flatMap((line) => {
      const saturation = Math.max(...line.points.map((point) => 飽和度(画素(picture, point))));
      const ratio = line.expectedSaturation === 0 ? 0 : saturation / line.expectedSaturation;
      return ratio >= 0.75 ? [] : [`${line.name}: ${(ratio * 100).toFixed(1)}%`];
    }),
    "最後の段で線色まで描かれていない路線",
  ).toEqual([]);

  const measured = await preview.evaluate(() => {
    const network = document.querySelector<SVGGElement>('.catalog-preview-stage:not([hidden]) [data-cdl-role="metro-network"]');
    if (network === null) throw new Error("metro-network が無い");
    const selector = '[data-cdl-routing="metro"], [data-cdl-node][data-cdl-kind="station"], [data-cdl-node][data-cdl-kind="mark-start"], [data-cdl-node][data-cdl-kind="mark-end"], [data-cdl-node][data-cdl-kind="decision"]';
    const elements = [...document.querySelectorAll<SVGElement>(`.catalog-preview-stage:not([hidden]) ${selector}`)];
    const guide = document.querySelector<SVGElement>('.catalog-preview-stage:not([hidden]) [data-cdl-role="metro-lane-guide"]');
    return {
      count: elements.length,
      allInside: elements.every((element) => network.contains(element)),
      outsideCount: elements.filter((element) => !network.contains(element)).length,
      networkFilter: getComputedStyle(network).filter,
      childFilters: elements.map((element) => getComputedStyle(element).filter),
      guideOutside: guide !== null && !network.contains(guide),
      guideFilter: guide === null ? "missing" : getComputedStyle(guide).filter,
    };
  });

  expect(measured.count).toBeGreaterThan(0);
  expect(measured.allInside).toBe(true);
  expect(measured.outsideCount).toBe(0);
  expect(measured.networkFilter).toBe('url("#dragon-metro-relief-shadow")');
  expect(measured.childFilters.every((filter) => filter === "none")).toBe(true);
  expect(measured.guideOutside).toBe(true);
  expect(measured.guideFilter).toBe('url("#dragon-metro-relief-shadow")');

  const probes = await svg.evaluate((stage) => {
    const origin = stage.getBoundingClientRect();
    const toScreen = (element: SVGGraphicsElement, x: number, y: number) => {
      const matrix = element.getScreenCTM();
      if (matrix === null) throw new Error("路線図の画面座標を読めない");
      const point = new DOMPoint(x, y).matrixTransform(matrix);
      return { x: point.x - origin.left, y: point.y - origin.top };
    };
    const lines = [...stage.querySelectorAll<SVGPathElement>(
      '[data-cdl-routing="metro"] [data-cdl-role="edge-line"]',
    )];
    const nodes = [...stage.querySelectorAll<SVGGElement>(
      '[data-cdl-node]:is([data-cdl-kind="station"], [data-cdl-kind="mark-start"], [data-cdl-kind="mark-end"])',
    )];
    const stations = nodes.map((node) => {
      const body = node.querySelector<SVGGraphicsElement>(
        '[data-cdl-role="node-body"], [data-cdl-role="mark-start"], [data-cdl-role="mark-end"]',
      ) ?? node;
      const bounds = body.getBoundingClientRect();
      const center = {
        x: bounds.left + bounds.width / 2 - origin.left,
        y: bounds.top + bounds.height / 2 - origin.top,
      };
      const scale = Math.abs(body.getScreenCTM()?.a ?? 1);
      const strokeWidth = Number.parseFloat(getComputedStyle(body).strokeWidth) || 0;
      const radius = Math.max(bounds.width, bounds.height) / 2 + strokeWidth * scale / 2;
      const sides: { name: string; dotted: boolean; samples: 点[]; middle: 点 }[] = [];
      let connectedSides = 0;

      for (const line of lines) {
        const length = line.getTotalLength();
        const atScreen = (at: number) => {
          const point = line.getPointAtLength(Math.min(length, Math.max(0, at)));
          return toScreen(line, point.x, point.y);
        };
        const style = getComputedStyle(line);
        const dotted = style.strokeDasharray !== "none";
        const route = line.closest<SVGGElement>('[data-cdl-routing="metro"]');
        const routeName = `${route?.getAttribute("data-cdl-from") ?? "?"}→${route?.getAttribute("data-cdl-to") ?? "?"}`;

        for (const [from, direction] of [[0, 1], [length, -1]] as const) {
          const endpoint = atScreen(from);
          if (Math.hypot(endpoint.x - center.x, endpoint.y - center.y) > radius + 4) continue;
          connectedSides += 1;
          const name = `${node.getAttribute("data-cdl-node") ?? node.getAttribute("data-cdl-kind") ?? "?"} / ${routeName}`;

          if (!dotted) {
            const samples: 点[] = [];
            let middle: 点 | null = null;
            let at = from;
            let distance = 1;
            while (at >= 0 && at <= length) {
              const point = atScreen(at);
              const fromCenter = Math.hypot(point.x - center.x, point.y - center.y);
              if (distance <= 8 && fromCenter >= radius + distance) {
                samples.push(point);
                distance += 1;
              }
              if (fromCenter >= radius + 40) {
                middle = point;
                break;
              }
              at += direction * 0.25;
            }
            if (middle === null) {
              const point = line.getPointAtLength(length / 2);
              middle = toScreen(line, point.x, point.y);
            }
            if (samples.length === 8) sides.push({ name, dotted, samples, middle });
            continue;
          }

          // 丸い点線は dash の長さが 0 でも線端が点になるため、dash 区間の中心を画素測定に使う。
          let dash = style.strokeDasharray.split(/[ ,]+/u)
            .map((value) => Number.parseFloat(value))
            .filter((value) => Number.isFinite(value));
          if (dash.length % 2 === 1) dash = [...dash, ...dash];
          const period = dash.reduce((sum, value) => sum + value, 0);
          if (dash.length === 0 || period <= 0) continue;
          const offset = Number.parseFloat(style.strokeDashoffset) || 0;
          let base = ((-offset % period) + period) % period - period;
          const centers: number[] = [];
          for (; base <= length; base += period) {
            let cursor = base;
            for (const [index, width] of dash.entries()) {
              if (index % 2 === 0) {
                const dot = cursor + width / 2;
                if (dot >= 0 && dot <= length) centers.push(dot);
              }
              cursor += width;
            }
          }
          centers.sort((left, right) => direction > 0 ? left - right : right - left);
          const outward = centers.filter((at) => direction > 0 ? at >= from : at <= from);
          const first = outward.find((at) => {
            const point = atScreen(at);
            return Math.hypot(point.x - center.x, point.y - center.y) >= radius + 1;
          });
          const distantMiddle = outward.find((at) => {
            const point = atScreen(at);
            return Math.hypot(point.x - center.x, point.y - center.y) >= radius + 40;
          });
          const middle = distantMiddle ?? centers.reduce<number | undefined>((nearest, at) => {
            if (nearest === undefined) return at;
            return Math.abs(at - length / 2) < Math.abs(nearest - length / 2) ? at : nearest;
          }, undefined);
          if (first !== undefined && middle !== undefined) {
            sides.push({ name, dotted, samples: [atScreen(first)], middle: atScreen(middle) });
          }
        }
      }
      return {
        name: node.getAttribute("data-cdl-node") ?? node.getAttribute("data-cdl-kind") ?? "?",
        center,
        radius,
        connectedSides,
        sides,
      };
    });
    return {
      stations,
      ground: { x: origin.width * 0.5, y: origin.height * 0.97 },
    };
  });

  expect(probes.stations.length, "駅と始まり・終わりの印").toBeGreaterThan(0);
  expect(
    probes.stations.filter((station) => station.connectedSides === 0).map((station) => station.name),
    "線の側が1つも無い駅と印",
  ).toEqual([]);
  expect(
    probes.stations.flatMap((station) => station.connectedSides === station.sides.length ? [] : [
      `${station.name}: 接続 ${station.connectedSides} / 測定 ${station.sides.length}`,
    ]),
    "測定できなかった線の側",
  ).toEqual([]);
  const sideCount = probes.stations.reduce((sum, station) => sum + station.sides.length, 0);
  expect(sideCount, "測った線の側の総数").toBeGreaterThan(0);

  const faded: string[] = [];
  for (const station of probes.stations) {
    for (const side of station.sides) {
      const middle = 飽和度(画素(picture, side.middle));
      if (middle === 0) {
        faded.push(`${side.name}: 線の中ほどの飽和度が0`);
        continue;
      }
      const minimum = Math.min(...side.samples.map((sample) => 飽和度(画素(picture, sample)) / middle));
      if (minimum < 0.9) {
        faded.push(`${side.name}${side.dotted ? " (点線)" : ""}: ${(minimum * 100).toFixed(1)}%`);
      }
    }
  }
  expect(faded, `線の側 ${sideCount} 個で、外縁の飽和度が中ほどの90%未満`).toEqual([]);

  const ground = 明るさ(画素(picture, probes.ground));
  const missingShadows = probes.stations.flatMap((station) => {
    const distance = (station.radius + 3) / Math.SQRT2;
    const value = 明るさ(画素(picture, {
      x: station.center.x + distance,
      y: station.center.y + distance,
    }));
    return value < ground ? [] : [`${station.name}: 右下 ${value.toFixed(1)} / 地 ${ground.toFixed(1)}`];
  });
  expect(missingShadows, "右下の外が地より暗くない駅と印").toEqual([]);
});
