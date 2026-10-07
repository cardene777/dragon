import { expect, test, type Page } from "@playwright/test";

import { EDITOR_SAMPLES } from "../src/data/editor-samples";
import { 六色の記法 } from "./box-and-edge-figure";
import { openEditorTheme } from "./helpers/fixed-theme-checks";
import {
  readFixedThemeLead,
  readFixedThemeRoleColor,
  readThemeNotes,
  readThemeNoteText,
} from "./helpers/theme-notes";

const neon = readThemeNotes().get("neon");
if (neon?.mode !== "fixed") throw new Error("電飾の意匠帳が固定の表ではない");

const lead = readFixedThemeLead().get("neon");
const pale = readFixedThemeRoleColor("neon", "淡");
const title = readFixedThemeRoleColor("neon", "題");
if (!lead || !pale || !title) throw new Error("電飾の作りの色を意匠帳から読めない");

const tubeRow = /^\|\s*管\s*\|([^\n]+)$/m.exec(readThemeNoteText("neon"))?.[1] ?? "";
const tubeMix = [...tubeRow.matchAll(/(\d+)%/g)].map((match) => Number(match[1]) / 100);
if (tubeMix.length !== 2) throw new Error("電飾の意匠帳の「管」から 2 つの割合を読めない");
const [tubeColor, white] = tubeMix as [number, number];

const hexToRgb = (hex: string): string => {
  const value = Number.parseInt(hex.slice(1), 16);
  return `rgb(${value >> 16}, ${(value >> 8) & 255}, ${value & 255})`;
};

const stage = (page: Page) => page.locator('svg[data-cdl-stage][data-cdl-palette="neon"]');

function sample(type: string, shape?: "bar" | "pie"): string {
  const found = EDITOR_SAMPLES.find((value) => {
    if (!new RegExp(`^type:\\s*${type}\\s*$`, "m").test(value.code)) return false;
    return shape === undefined || new RegExp(`^shape:\\s*${shape}\\s*$`, "m").test(value.code);
  });
  if (!found) throw new Error(`editor-samples に ${type}${shape ? ` / ${shape}` : ""} の見本が無い`);
  return found.code;
}

const 段のない六色の記法 = 六色の記法.replace(/\nanimation:\n[\s\S]*$/, "");

const 鍵の記法 = `title: "鍵の見本"
type: record

actors:
  - 利用者: { subtitle: "利用者", rows: ["id: bigint", "email: text"], marks: ["鍵", ""] }
`;

const BOX_SHAPE_SELECTOR = [
  ':is(rect, path, ellipse, circle, polygon)[data-cdl-role="node-body"]:not([data-cdl-look]):not([data-cdl-mark])',
  'g[data-cdl-role="node-body"]:not([data-cdl-look]):not([data-cdl-mark]) > :is(rect, path, ellipse, circle, polygon)',
  'g[data-cdl-role="node-body"]:not([data-cdl-look]):not([data-cdl-mark]) > g:not(:where([data-cdl-role="node-kind-icon"])) > :is(rect, path, ellipse, circle, polygon)',
].join(", ");

const readEdgeLabels = (page: Page) =>
  stage(page).evaluate((root) => {
    const edges = new Map(
      [...root.querySelectorAll<SVGGraphicsElement>("[data-cdl-edge]")].flatMap((edge) => {
        const id = edge.getAttribute("data-cdl-edge");
        return id === null ? [] : [[id, edge] as const];
      }),
    );
    return [...root.querySelectorAll<SVGGraphicsElement>("[data-cdl-edge-label-for]")].flatMap(
      (group) => {
        const edgeId = group.getAttribute("data-cdl-edge-label-for");
        const edge = edgeId === null ? undefined : edges.get(edgeId);
        const background = group.querySelector<SVGGraphicsElement>(
          '[data-cdl-role="edge-label-bg"]',
        );
        const label = group.querySelector<SVGGraphicsElement>('[data-cdl-role="edge-label"]');
        const line = edge?.querySelector<SVGGraphicsElement>('[data-cdl-role="edge-line"]');
        if (!edge || !background || !label || !line) return [];
        const backgroundBox = background.getBBox();
        const labelBox = label.getBBox();
        const backgroundStyle = getComputedStyle(background);
        return [
          {
            tone: group.getAttribute("data-cdl-tone"),
            background: backgroundStyle.fill,
            frame: backgroundStyle.stroke,
            filter: backgroundStyle.filter,
            line: getComputedStyle(line).stroke,
            label: getComputedStyle(label).fill,
            fits: labelBox.width <= backgroundBox.width,
          },
        ];
      },
    );
  });

test.describe("neon theme (#2795)", () => {
  test.describe.configure({ timeout: 180_000 });
  test.use({ viewport: { width: 1920, height: 1080 } });

  test("neon look: 管・題・札・地のにじみ・鍵・棒が意匠帳どおりになる", async ({ page }) => {
    const expectedTubeColors = new Set(
      [lead, neon.value.link, neon.value.own].map(hexToRgb),
    );
    let boxesCount = 0;
    let activeBoxesCount = 0;
    let linesCount = 0;
    let labelsCount = 0;
    let textsCount = 0;
    const titleRoles = new Set<string>();

    const targets = [
      { name: "class", source: sample("class") },
      { name: "record", source: sample("record") },
      { name: "flowchart", source: sample("flowchart") },
      { name: "chart/bar", source: sample("chart", "bar") },
      { name: "chart/pie", source: sample("chart", "pie") },
      { name: "sequence", source: sample("sequence") },
    ];

    for (const target of targets) {
      await openEditorTheme(page, target.source, "neon", false);
      await expect(page.locator("filter#dragon-neon-tube")).toHaveCount(1);
      const filter = page.locator("filter#dragon-neon-tube");
      await expect(filter.locator('feMorphology[operator="erode"]')).toHaveCount(1);
      const coreMatrix = await filter
        .locator('feColorMatrix[result="core"]')
        .getAttribute("values");
      const matrix = (coreMatrix ?? "").trim().split(/\s+/).map(Number);
      expect(matrix).toHaveLength(20);
      expect(matrix[0], "管の色の混ぜる割合").toBeCloseTo(tubeColor, 5);
      expect(matrix[4], "白の混ぜる割合").toBeCloseTo(white, 5);
      expect(matrix[6]).toBeCloseTo(tubeColor, 5);
      expect(matrix[9]).toBeCloseTo(white, 5);
      expect(matrix[12]).toBeCloseTo(tubeColor, 5);
      expect(matrix[14]).toBeCloseTo(white, 5);

      const background = await stage(page).evaluate((element) => {
        const style = getComputedStyle(element);
        return { color: style.backgroundColor, image: style.backgroundImage };
      });
      expect(background.color, `${target.name} の台`).toBe(hexToRgb(neon.value.ground));
      expect(
        background.image.match(/radial-gradient/g)?.length,
        `${target.name} の地のにじみ`,
      ).toBe(2);

      const boxes = await stage(page)
        .locator(BOX_SHAPE_SELECTOR)
        .evaluateAll((elements) =>
          elements.map((element) => {
            const style = getComputedStyle(element);
            return {
              active: element.closest('[data-cdl-active="true"]') !== null,
              filter: style.filter,
              stroke: style.stroke,
              width: style.strokeWidth,
            };
          }),
        );
      boxesCount += boxes.length;
      for (const box of boxes) {
        expect(box.filter, `${target.name} の箱の管`).toContain("url(");
        expect(box.filter, `${target.name} の箱の管`).toContain("dragon-neon-tube");
        expect(box.stroke, `${target.name} の箱の枠`).toBe(hexToRgb(neon.value.frame));
        expect(box.width, `${target.name} の箱の太さ`).toBe(box.active ? "3px" : "2px");
        if (box.active) {
          activeBoxesCount += 1;
          expect(box.filter, `${target.name} の強調の箱の外光`).toContain("drop-shadow");
        }
      }

      if (target.name === "class" || target.name === "flowchart") {
        const lines = await stage(page)
          .locator('[data-cdl-role="edge-line"]')
          .evaluateAll((elements) =>
            elements.map((element) => {
              const style = getComputedStyle(element);
              return { filter: style.filter, stroke: style.stroke };
            }),
          );
        linesCount += lines.length;
        expect(lines.length, `${target.name} の線が無い`).toBeGreaterThan(0);
        for (const line of lines) {
          expect(line.filter, `${target.name} の線の管`).toContain("dragon-neon-tube");
          expect(expectedTubeColors.has(line.stroke), `${target.name} の線 ${line.stroke}`).toBe(true);
        }
      }

      const titles = await stage(page)
        .locator(
          '[data-cdl-node]:has([data-cdl-role="node-body"]:not([data-cdl-look]):not([data-cdl-mark])) [data-cdl-role="node-label"], [data-cdl-role="figure-title"]',
        )
        .evaluateAll((elements) =>
          elements.map((element) => {
            const style = getComputedStyle(element);
            return {
              role: element.getAttribute("data-cdl-role") ?? "",
              fill: style.fill,
              weight: style.fontWeight,
              filter: style.filter,
            };
          }),
        );
      for (const value of titles) {
        titleRoles.add(value.role);
        expect(value.fill, `${target.name} の題`).toBe(hexToRgb(title));
        expect(value.weight, `${target.name} の題の太さ`).toBe("800");
        expect(value.filter, `${target.name} の題の光`).toContain("drop-shadow");
      }

      const textResult = await stage(page).evaluate((root) => {
        const failures: string[] = [];
        let count = 0;
        // 図の題も数える (#2749)。管を祖先へ掛けない約束と書体を足さない約束は、
        // 箱の中身だけでなく題を含む舞台の全ての字に及ぶ。
        for (const text of root.querySelectorAll("text")) {
          count += 1;
          if (getComputedStyle(text).fontFamily.includes("M PLUS Rounded")) {
            failures.push(`${text.textContent ?? ""}: 書体`);
          }
          for (let current: Element | null = text; current && current !== root.parentElement; current = current.parentElement) {
            if (getComputedStyle(current).filter.includes("dragon-neon-tube")) {
              failures.push(`${text.textContent ?? ""}: ${current.tagName}`);
              break;
            }
          }
        }
        return { count, failures };
      });
      textsCount += textResult.count;
      expect(textResult.count, `${target.name} の字が無い`).toBeGreaterThan(0);
      expect(textResult.failures, `${target.name} の字へ管が届いた`).toEqual([]);
    }

    for (const type of ["topology", "c4"]) {
      await openEditorTheme(page, sample(type), "neon", false);
      const textFailures = await stage(page).evaluate((root) => {
        const failures: string[] = [];
        for (const text of root.querySelectorAll("text")) {
          for (let current: Element | null = text; current && current !== root.parentElement; current = current.parentElement) {
            if (getComputedStyle(current).filter.includes("dragon-neon-tube")) {
              failures.push(`${text.textContent ?? ""}: ${current.tagName}`);
              break;
            }
          }
        }
        return failures;
      });
      expect(textFailures, `${type} の字へ管が届いた`).toEqual([]);
    }

    await openEditorTheme(page, sample("chart", "bar"), "neon", false);
    const bars = await stage(page)
      .locator('[data-cdl-role="chart-bar"]')
      .evaluateAll((elements) =>
        elements.map((element) => {
          const style = getComputedStyle(element);
          return {
            main: element.getAttribute("data-cdl-emphasis") === "primary",
            fill: style.fill,
            opacity: style.fillOpacity,
            stroke: style.stroke,
            strokeWidth: style.strokeWidth,
          };
        }),
      );
    expect(bars.some((bar) => bar.main), "図表に主役の棒が無い").toBe(true);
    expect(bars.some((bar) => !bar.main), "図表に主役でない棒が無い").toBe(true);
    // #2837 で、主役でない棒を淡い塗りから暗い面と淡い細枠へ変えた。
    for (const bar of bars) {
      expect(bar.fill).toBe(hexToRgb(bar.main ? lead : neon.value.face));
      expect(bar.opacity).toBe("1");
      if (!bar.main) {
        expect(bar.stroke).toBe(hexToRgb(pale));
        expect(bar.strokeWidth).toBe("1px");
      }
    }

    await openEditorTheme(page, 段のない六色の記法, "neon", false);
    const tonedLabels = await readEdgeLabels(page);
    labelsCount += tonedLabels.length;
    expect(tonedLabels.length, "面に色みを持つ線の札が無い").toBe(6);
    expect(new Set(tonedLabels.map((label) => label.frame)), "札に一・二・三が揃わない").toEqual(
      expectedTubeColors,
    );
    for (const label of tonedLabels) {
      expect(label.background).toBe(hexToRgb(neon.value.face));
      expect(label.frame, `${label.tone} の札と線`).toBe(label.line);
      expect(label.label, `${label.tone} の札の字`).toBe(label.line);
      expect(label.filter, `${label.tone} の札の外光`).toContain("drop-shadow");
      expect(label.filter, `${label.tone} の札へ管が当たった`).not.toContain("dragon-neon-tube");
      expect(label.fits, `${label.tone} の札の字が面からはみ出す`).toBe(true);
    }

    await openEditorTheme(page, 六色の記法, "neon", false);
    const stagedLabels = await readEdgeLabels(page);
    labelsCount += stagedLabels.length;
    for (const label of stagedLabels) {
      expect(label.tone, "段のある札の色み").not.toBeNull();
      expect(label.background).toBe(hexToRgb(neon.value.face));
      expect(label.frame).toBe(label.line);
      expect(label.label).toBe(label.line);
      expect(label.filter).toContain("drop-shadow");
      expect(label.filter).not.toContain("dragon-neon-tube");
    }

    await openEditorTheme(page, 鍵の記法, "neon", false);
    const keys = await stage(page)
      .locator('[data-cdl-role="node-row-underline"]')
      .evaluateAll((elements) => elements.map((element) => getComputedStyle(element).stroke));
    expect(keys.length, "鍵の下線が無い").toBeGreaterThan(0);
    expect(new Set(keys), "鍵の下線が一ではない").toEqual(new Set([hexToRgb(lead)]));

    console.log(
      `neon look counts: boxes=${boxesCount} activeBoxes=${activeBoxesCount} ` +
        `lines=${linesCount} labels=${labelsCount} texts=${textsCount} titles=${[...titleRoles].join(",")}`,
    );
    expect(boxesCount, "箱を 1 件も測れていない").toBeGreaterThan(0);
    expect(activeBoxesCount, "強調の箱を 1 件も測れていない").toBeGreaterThan(0);
    expect(linesCount, "線を 1 件も測れていない").toBeGreaterThan(0);
    expect(labelsCount, "札を 1 件も測れていない").toBeGreaterThan(0);
    expect(textsCount, "字を 1 件も測れていない").toBeGreaterThan(0);
    expect(titleRoles, "箱の名前と図の題を両方測れていない").toEqual(
      new Set(["node-label", "figure-title"]),
    );
  });
});
