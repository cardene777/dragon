import { expect, type Page } from "@playwright/test";

import {
  FIXED_THEME_DEVICE_SCALE_FACTOR,
  colorKey,
  measureStrongestCore,
  openEditorTheme,
  setAllTextHidden,
  stopDiagram,
} from "./fixed-theme-checks";
import { shoot } from "./pixel-contrast";
import {
  readFixedThemeLabelToneStyles,
  readFixedThemeSingleSeriesBars,
} from "./theme-notes";

export const LABEL_TONE_SOURCE = `title: "札の色み"
type: flow
reveal: all

lanes:
  l1: { x: 0, width: 240 }
  l2: { x: 400, width: 240 }
  l3: { x: 800, width: 240 }

actors:
  - 注文: { kind: card, lane: l1, stack: 0 }
  - 受付: { kind: card, lane: l2, stack: 0 }
  - 発送: { kind: card, lane: l3, stack: 0 }
  - 凡例: { kind: card, lane: l1, stack: 1 }
  - 保留: { kind: card, lane: l2, stack: 1 }
  - 返品: { kind: card, lane: l3, stack: 1 }

flow:
  - 注文 -> 受付: "順路" (accent) { role: main }
  - 受付 -> 発送: "はい" (success)
  - 受付 -> 保留: "いいえ" (error)
  - 保留 -> 返品: "戻す" (accent)

animation:
  - step: "止める" 60s
    focus: [凡例]
`;

export const SINGLE_SERIES_SOURCE = `title: "単系列の棒"
type: chart
shape: bar

actors:
  - 東京: "420"
  - 大阪: "310"
  - 福岡: "180"
  - 札幌: "90"
`;

const NON_POSITIVE_SINGLE_SERIES_SOURCE = `title: "0 以下の単系列の棒"
type: chart
shape: bar

actors:
  - 東京: "0"
  - 大阪: "-10"
  - 福岡: "-20"
`;

const hexToRgb = (hex: string): string => {
  const value = Number.parseInt(hex.slice(1), 16);
  return `rgb(${value >> 16}, ${(value >> 8) & 255}, ${value & 255})`;
};

const labelStage = (page: Page, theme: string) =>
  page.locator(`svg[data-cdl-stage][data-cdl-palette="${theme}"]`);

type LabelValue = {
  text: string;
  tone: string | null;
  role: string | null;
  edgeTone: string | null;
  edgeRole: string | null;
  active: string | null;
  line: string;
  fill: string;
  stroke: string;
  ink: string;
  filter: string;
  weight: string;
  fits: boolean;
};

async function readLabels(page: Page, theme: string): Promise<LabelValue[]> {
  return labelStage(page, theme).evaluate((stage) => {
    const edges = new Map(
      [...stage.querySelectorAll<SVGGraphicsElement>("[data-cdl-edge]")].flatMap((edge) => {
        const id = edge.getAttribute("data-cdl-edge");
        return id === null ? [] : [[id, edge] as const];
      }),
    );
    return [...stage.querySelectorAll<SVGGraphicsElement>("[data-cdl-edge-label-for]")].flatMap(
      (group) => {
        const edgeId = group.getAttribute("data-cdl-edge-label-for");
        const edge = edgeId === null ? undefined : edges.get(edgeId);
        const background = group.querySelector<SVGGraphicsElement>('[data-cdl-role="edge-label-bg"]');
        const label = group.querySelector<SVGGraphicsElement>('[data-cdl-role="edge-label"]');
        const line = edge?.querySelector<SVGGraphicsElement>('[data-cdl-role="edge-line"]');
        if (!edge || !background || !label || !line) return [];
        const backgroundBox = background.getBBox();
        const labelBox = label.getBBox();
        const backgroundStyle = getComputedStyle(background);
        const labelStyle = getComputedStyle(label);
        return [{
          text: group.getAttribute("data-cdl-edge-label-text") ?? label.textContent ?? "",
          tone: group.getAttribute("data-cdl-tone"),
          role: group.getAttribute("data-cdl-edge-role"),
          edgeTone: edge.getAttribute("data-cdl-tone"),
          edgeRole: edge.getAttribute("data-cdl-edge-role"),
          active: edge.getAttribute("data-cdl-active"),
          line: getComputedStyle(line).stroke,
          fill: backgroundStyle.fill,
          stroke: backgroundStyle.stroke,
          ink: labelStyle.fill,
          filter: backgroundStyle.filter,
          weight: labelStyle.fontWeight,
          fits: labelBox.width <= backgroundBox.width && labelBox.height <= backgroundBox.height,
        }];
      },
    );
  });
}

export async function checkEdgeLabelTones(page: Page, theme: string): Promise<string> {
  const style = readFixedThemeLabelToneStyles().get(theme as never);
  if (!style) throw new Error(`${theme} の札を意匠帳から読めない`);
  await openEditorTheme(page, LABEL_TONE_SOURCE, theme, false);
  const labels = await readLabels(page, theme);
  expect(labels.map((label) => label.text).sort(), `${theme} の札`).toEqual(
    ["順路", "はい", "いいえ", "戻す"].sort(),
  );
  const expected = new Map([
    ["順路", { tone: "accent", role: "main", group: style.one }],
    ["はい", { tone: "success", role: null, group: style.two }],
    ["いいえ", { tone: "error", role: null, group: style.three }],
    ["戻す", { tone: "accent", role: null, group: style.one }],
  ]);
  for (const label of labels) {
    const want = expected.get(label.text);
    if (!want) throw new Error(`${theme} の想定外の札 ${label.text}`);
    expect(label.active, `${theme}/${label.text} の強調`).toBe("false");
    expect(label.tone, `${theme}/${label.text} の札の色み`).toBe(want.tone);
    expect(label.edgeTone, `${theme}/${label.text} の線の色み`).toBe(want.tone);
    expect(label.role, `${theme}/${label.text} の札の役目`).toBe(want.role);
    expect(label.edgeRole, `${theme}/${label.text} の線の役目`).toBe(want.role);
    expect(colorKey(style.paint === "fill" ? label.fill : label.stroke), `${theme}/${label.text} の札`)
      .toBe(colorKey(want.group));
    if (style.face) expect(colorKey(label.fill), `${theme}/${label.text} の面`).toBe(colorKey(style.face));
    const expectedInk = style.inkMode === "tone" ? want.group : style.ink;
    if (!expectedInk) throw new Error(`${theme}/${label.text} の字の色を読めない`);
    expect(colorKey(label.ink), `${theme}/${label.text} の字`).toBe(colorKey(expectedInk));
    expect(label.fits, `${theme}/${label.text} の字が面からはみ出す`).toBe(true);
    if (theme === "neon") {
      expect(label.filter, `${theme}/${label.text} の外光`).toContain(hexToRgb(want.group));
    }
    if (theme === "relief") expect(Number(label.weight), `${theme}/${label.text} の太さ`).toBeGreaterThanOrEqual(700);
  }

  const byText = new Map(labels.map((label) => [label.text, label]));
  const inks = [...new Set(labels.map((label) => label.ink))].join("/");
  return `${theme} labels: accent=${byText.get("戻す")?.[style.paint]} ` +
    `success=${byText.get("はい")?.[style.paint]} error=${byText.get("いいえ")?.[style.paint]} ` +
    `main=${byText.get("順路")?.[style.paint]} ink=${inks}`;
}

type BarValue = {
  primary: boolean;
  fill: string;
  stroke: string;
  strokeWidth: string;
  authoredOpacity: string | null;
  opacity: string;
  filter: string;
};

async function readBars(page: Page, theme: string): Promise<BarValue[]> {
  return labelStage(page, theme).locator('[data-cdl-role="chart-bar"]').evaluateAll((elements) =>
    elements.map((element) => {
      const style = getComputedStyle(element);
      return {
        primary: element.getAttribute("data-cdl-emphasis") === "primary",
        fill: style.fill,
        stroke: style.stroke,
        strokeWidth: style.strokeWidth,
        authoredOpacity: element.getAttribute("fill-opacity"),
        opacity: style.fillOpacity,
        filter: style.filter,
      };
    }),
  );
}

function checkBars(theme: string, bars: BarValue[], allowPrimary: boolean): void {
  const style = readFixedThemeSingleSeriesBars().get(theme as never);
  if (!style) throw new Error(`${theme} の単系列の棒を意匠帳から読めない`);
  expect(bars.length, `${theme} の単系列の棒`).toBeGreaterThan(0);
  expect(bars.filter((bar) => bar.primary).length, `${theme} の主役の棒`)
    .toBe(allowPrimary ? 1 : 0);
  for (const bar of bars) {
    const expected = bar.primary ? style.primary : style.secondary;
    const expectedPattern = /^url\((#[a-z0-9-]+)\)$/.exec(expected.fill)?.[1];
    if (expectedPattern) {
      expect(bar.fill, `${theme} の${bar.primary ? "主役" : "それ以外"}の棒の模様`)
        .toMatch(new RegExp(`^url\\(["']?${expectedPattern}["']?\\)$`));
    } else {
      expect(colorKey(bar.fill), `${theme} の${bar.primary ? "主役" : "それ以外"}の棒`).toBe(
        colorKey(expected.fill),
      );
    }
    const expectedOpacity = theme === "letterpress" && !bar.primary
      ? bar.authoredOpacity
      : String(expected.opacity);
    expect(bar.opacity, `${theme} の棒の濃さ`).toBe(expectedOpacity);
    if (expected.stroke) {
      expect(colorKey(bar.stroke), `${theme} の${bar.primary ? "主役" : "それ以外"}の棒の枠`)
        .toBe(colorKey(expected.stroke));
      expect(Number.parseFloat(bar.strokeWidth), `${theme} の${bar.primary ? "主役" : "それ以外"}の棒の枠幅`)
        .toBe(expected.strokeWidth);
    }
    if (bar.primary && (theme === "terminal" || theme === "neon")) {
      expect(bar.filter, `${theme} の主役の棒の光`).toContain("drop-shadow");
    }
    if (theme === "relief") expect(bar.filter, `${theme} の棒の浮き`).toContain("dragon-relief-raised-sm");
  }
}

export async function checkSingleSeriesBars(page: Page, theme: string): Promise<string> {
  await openEditorTheme(page, SINGLE_SERIES_SOURCE, theme, false);
  const bars = await readBars(page, theme);
  checkBars(theme, bars, true);
  await openEditorTheme(page, NON_POSITIVE_SINGLE_SERIES_SOURCE, theme, false);
  const nonPositive = await readBars(page, theme);
  checkBars(theme, nonPositive, false);
  const primary = bars.find((bar) => bar.primary);
  const secondary = bars.find((bar) => !bar.primary);
  return `${theme} bars: primary=${primary?.fill} secondary=${secondary?.fill} ` +
    `nonPositivePrimary=${nonPositive.filter((bar) => bar.primary).length}`;
}

export async function checkEdgeLabelContrast(
  page: Page,
  theme: string,
  dark: boolean,
): Promise<string> {
  const mode = dark ? "暗" : "明";
  await openEditorTheme(page, LABEL_TONE_SOURCE, theme, dark);
  await stopDiagram(page);
  const stage = labelStage(page, theme);
  const stageBox = await stage.boundingBox();
  if (!stageBox) throw new Error(`${theme}/${mode} の舞台の矩形が無い`);
  const labels = await stage.locator('[data-cdl-edge-label-for] > [data-cdl-role="edge-label"]').evaluateAll(
    (elements) => elements.map((element) => {
      const box = element.getBoundingClientRect();
      return {
        text: element.textContent ?? "",
        box: { x: box.x, y: box.y, width: box.width, height: box.height },
      };
    }),
  );
  expect(labels.length, `${theme}/${mode} の札の字`).toBe(4);
  await setAllTextHidden(page, true);
  const hidden = await shoot(page, stageBox);
  await setAllTextHidden(page, false);
  const visible = await shoot(page, stageBox);
  const originX = Math.floor(stageBox.x);
  const originY = Math.floor(stageBox.y);
  const cssWidth = Math.ceil(stageBox.x + stageBox.width) - originX;
  const scale = visible.width / cssWidth;
  expect(scale, `${theme}/${mode} の写しの拡大率`).toBeCloseTo(FIXED_THEME_DEVICE_SCALE_FACTOR, 5);
  const ratios: string[] = [];
  for (const label of labels) {
    const result = measureStrongestCore(visible, hidden, {
      x: (label.box.x - originX) * scale,
      y: (label.box.y - originY) * scale,
      width: label.box.width * scale,
      height: label.box.height * scale,
    });
    expect(result.kind, `${theme}/${mode}/${label.text} の対比を測れない`).toBe("ok");
    if (result.kind !== "ok") continue;
    expect(result.ratio, `${theme}/${mode}/${label.text} の対比`).toBeGreaterThanOrEqual(4.5);
    ratios.push(`${label.text}=${result.ratio.toFixed(2)}`);
  }
  return `${theme} labels contrast ${mode}: ${ratios.join(" ")}`;
}
