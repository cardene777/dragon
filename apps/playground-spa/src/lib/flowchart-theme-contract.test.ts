import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { CdlDiagramView } from "@cardenelabs/cdl";
import { JSDOM } from "jsdom";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { presetDeliveryFlow } from "@/topics/catalog/presets.cdl";

import { readFlowchartDecisionStyles } from "../../tests/helpers/theme-notes";

const css = readFileSync(
  fileURLToPath(new URL("../styles/cdl-theme.css", import.meta.url)),
  "utf8",
);
const fixedPalettes =
  ':is([data-cdl-palette="blueprint"], [data-cdl-palette="letterpress"], [data-cdl-palette="catalog"], [data-cdl-palette="terminal"], [data-cdl-palette="sketch"], [data-cdl-palette="neon"], [data-cdl-palette="relief"])';
const fixedFlowcharts = `svg[data-cdl-stage][data-cdl-type="flowchart"]${fixedPalettes}`;
const flowchartDecisionStyles = readFlowchartDecisionStyles();
const letterpressDecision = flowchartDecisionStyles.get("letterpress");
const sketchDecision = flowchartDecisionStyles.get("sketch");
const neonDecision = flowchartDecisionStyles.get("neon");
if (!letterpressDecision || !sketchDecision || !neonDecision) {
  throw new Error("活版と手描きと電飾の流れ図の分かれ道を意匠帳から読めない");
}
const palettes = [
  {
    palette: "blueprint",
    main: "#143a52",
    mark: "#143a52",
    yes: "#1f7a6b",
    no: "#a8431f",
    yesText: "#e3e9ea",
    noText: "#e3e9ea",
    frame: "none",
    radius: "9px",
    frameWidth: "0",
  },
  {
    palette: "letterpress",
    main: "#c8431f",
    mark: "#1a1510",
    yes: "#1a1510",
    no: "#1a1510",
    yesText: "#f0eadc",
    noText: "#f0eadc",
    frame: "none",
    radius: "9px",
    frameWidth: "0",
  },
  {
    palette: "catalog",
    main: "#dca443",
    mark: "#efe7d8",
    yes: "#4fae9a",
    no: "#e8705a",
    yesText: "#1b222c",
    noText: "#1b222c",
    frame: "none",
    radius: "9px",
    frameWidth: "0",
  },
  {
    palette: "terminal",
    main: "#4ade80",
    mark: "#a6f0bd",
    yes: "#c792ea",
    no: "#f5c451",
    yesText: "#03110a",
    noText: "#03110a",
    frame: "none",
    radius: "4px",
    frameWidth: "0",
  },
  {
    palette: "sketch",
    main: "#d2491f",
    mark: "#2b2620",
    yes: "#2f7d4f",
    no: "#2a5ca8",
    yesText: "#fffdf7",
    noText: "#fffdf7",
    frame: "none",
    radius: "9px",
    frameWidth: "0",
  },
  {
    palette: "neon",
    main: "#ff2e97",
    mark: "#f3eefe",
    yes: "#07060c",
    no: "#07060c",
    yesText: "#00e5ff",
    noText: "#ffd000",
    frame: "#00e5ff",
    radius: "9px",
    frameWidth: "2.5px",
  },
  {
    palette: "relief",
    main: "#c4573c",
    mark: "#463e33",
    yes: "#2f7a6e",
    no: "#c99a35",
    yesText: "#ffffff",
    noText: "#ffffff",
    frame: "none",
    radius: "20px",
    frameWidth: "0",
  },
] as const;
const diamonds = [
  {
    palette: "blueprint",
    face: "#e3e9ea",
    frame: "#143a52",
    width: "1.5",
    overrides: { stroke: "#143a52 !important", "stroke-width": "1.5 !important" },
  },
  {
    palette: "letterpress",
    face: letterpressDecision.face,
    frame: letterpressDecision.frame,
    width: String(letterpressDecision.width),
    overrides: {
      fill: `${letterpressDecision.face} !important`,
      "stroke-width": `${letterpressDecision.width} !important`,
    },
  },
  {
    palette: "catalog",
    face: "#f4eee2",
    frame: "none",
    width: "0",
    overrides: { stroke: "none !important", "stroke-width": "0 !important" },
  },
  {
    palette: "sketch",
    face: sketchDecision.face,
    frame: sketchDecision.frame,
    width: String(sketchDecision.width),
    overrides: {
      stroke: `${sketchDecision.frame} !important`,
      "stroke-width": `${sketchDecision.width} !important`,
    },
  },
  {
    palette: "neon",
    face: neonDecision.face,
    frame: neonDecision.frame,
    width: String(neonDecision.width),
    overrides: {
      stroke: `${neonDecision.frame} !important`,
      "stroke-width": `${neonDecision.width} !important`,
    },
  },
  {
    palette: "relief",
    face: "#e8e3da",
    frame: "none",
    width: "0",
    overrides: { stroke: "none !important", "stroke-width": "0 !important" },
  },
] as const;

type Specificity = readonly [id: number, classLike: number, type: number];

function splitTopLevel(value: string): string[] {
  const parts: string[] = [];
  let start = 0;
  let parentheses = 0;
  let brackets = 0;
  let quote = "";
  for (let index = 0; index < value.length; index += 1) {
    const character = value[index] ?? "";
    if (quote !== "") {
      if (character === quote && value[index - 1] !== "\\") quote = "";
      continue;
    }
    if (character === '"' || character === "'") quote = character;
    else if (character === "(") parentheses += 1;
    else if (character === ")") parentheses -= 1;
    else if (character === "[") brackets += 1;
    else if (character === "]") brackets -= 1;
    else if (character === "," && parentheses === 0 && brackets === 0) {
      parts.push(value.slice(start, index).trim());
      start = index + 1;
    }
  }
  parts.push(value.slice(start).trim());
  return parts.filter(Boolean);
}

function addSpecificity(left: Specificity, right: Specificity): Specificity {
  return [left[0] + right[0], left[1] + right[1], left[2] + right[2]];
}

function compareSpecificity(left: Specificity, right: Specificity): number {
  return left[0] - right[0] || left[1] - right[1] || left[2] - right[2];
}

function selectorSpecificity(selector: string): Specificity {
  let specificity: Specificity = [0, 0, 0];
  for (let index = 0; index < selector.length;) {
    const character = selector[index] ?? "";
    if (character === "#") {
      specificity = addSpecificity(specificity, [1, 0, 0]);
      index += 1;
      while (/[-_a-zA-Z0-9]/.test(selector[index] ?? "")) index += 1;
      continue;
    }
    if (character === ".") {
      specificity = addSpecificity(specificity, [0, 1, 0]);
      index += 1;
      while (/[-_a-zA-Z0-9]/.test(selector[index] ?? "")) index += 1;
      continue;
    }
    if (character === "[") {
      specificity = addSpecificity(specificity, [0, 1, 0]);
      let quote = "";
      index += 1;
      while (index < selector.length) {
        const current = selector[index] ?? "";
        if (quote !== "") {
          if (current === quote && selector[index - 1] !== "\\") quote = "";
        } else if (current === '"' || current === "'") quote = current;
        else if (current === "]") {
          index += 1;
          break;
        }
        index += 1;
      }
      continue;
    }
    if (character === ":") {
      const pseudoElement = selector[index + 1] === ":";
      index += pseudoElement ? 2 : 1;
      const nameStart = index;
      while (/[-a-zA-Z]/.test(selector[index] ?? "")) index += 1;
      const name = selector.slice(nameStart, index);
      if (pseudoElement) {
        specificity = addSpecificity(specificity, [0, 0, 1]);
        continue;
      }
      if (selector[index] !== "(") {
        specificity = addSpecificity(specificity, [0, 1, 0]);
        continue;
      }
      const argumentStart = index + 1;
      let depth = 1;
      index += 1;
      while (depth > 0 && index < selector.length) {
        if (selector[index] === "(") depth += 1;
        else if (selector[index] === ")") depth -= 1;
        index += 1;
      }
      if (name === "where") continue;
      if (name === "is" || name === "not" || name === "has") {
        const argument = selector.slice(argumentStart, index - 1);
        const maximum = splitTopLevel(argument)
          .map(selectorSpecificity)
          .sort((left, right) => compareSpecificity(right, left))[0] ?? [0, 0, 0];
        specificity = addSpecificity(specificity, maximum);
      } else {
        specificity = addSpecificity(specificity, [0, 1, 0]);
      }
      continue;
    }
    if (/[a-zA-Z]/.test(character)) {
      specificity = addSpecificity(specificity, [0, 0, 1]);
      index += 1;
      while (/[-_a-zA-Z0-9]/.test(selector[index] ?? "")) index += 1;
      continue;
    }
    index += 1;
  }
  return specificity;
}

function styleRules(): Array<{ selector: string; body: string }> {
  const withoutComments = css.replace(/\/\*[\s\S]*?\*\//g, "");
  return [...withoutComments.matchAll(/([^{}]+)\{([^{}]*)\}/g)].flatMap((match) =>
    splitTopLevel(match[1] ?? "").map((selector) => ({ selector, body: match[2] ?? "" })),
  );
}

function importantProperties(body: string): Set<string> {
  return new Set(
    [...body.matchAll(/(?:^|;)\s*([\w-]+)\s*:[^;]+!important\s*(?=;|$)/gm)].flatMap(
      (match) => match[1] === undefined ? [] : [match[1]],
    ),
  );
}

function diamondSelector(palette: string): string {
  return (
    `svg[data-cdl-stage][data-cdl-type="flowchart"][data-cdl-palette="${palette}"] ` +
    `[data-cdl-kind="decision"]:not([data-cdl-active="true"]) ` +
    `[data-cdl-role="node-body"] > path`
  );
}

function normalizeSelector(selector: string): string {
  return selector
    .replace(/\s+/g, " ")
    .replace(/\(\s+/g, "(")
    .replace(/\s+\)/g, ")")
    .trim();
}

function ruleBody(selector: string): string {
  const rule = styleRules().find((candidate) => normalizeSelector(candidate.selector) === selector);
  if (!rule) throw new Error(`${selector} の CSS 規則が無い`);
  return rule.body;
}

function declaration(body: string, property: string): string {
  const escaped = property.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const value = new RegExp(`(?:^|;)\\s*${escaped}\\s*:\\s*([^;]+)`, "m").exec(body)?.[1]?.trim();
  if (!value) throw new Error(`${property} の CSS 宣言が無い`);
  return value;
}

function flowchartRuleSelectors(): string[] {
  const heading = css.indexOf("固定 7 意匠の流れ図。");
  const start = css.lastIndexOf("/*", heading);
  const end = css.indexOf("/* 時間軸の線の札は", heading);
  if (heading < 0 || start < 0 || end < 0)
    throw new Error("固定 7 意匠の流れ図の CSS 節を読めない");
  const section = css.slice(start, end).replace(/\/\*[\s\S]*?\*\//g, "");
  return [...section.matchAll(/([^{}]+)\{/g)].map((match) =>
    normalizeSelector(match[1] ?? ""),
  );
}

function paletteを外す(selector: string): string {
  return selector
    .replace(/:is\((?:\[data-cdl-palette="[^"]+"\](?:, )?)+\)/g, "")
    .replace(/\[data-cdl-palette="[^"]+"\]/g, "");
}

describe("固定の 7 意匠の流れ図を見本の線と札で描く (#2835)", () => {
  it("全図共通の太さ 7 を残し、主役と枝を 5、戻る点線を 6 にする", () => {
    expect(declaration(ruleBody('[data-cdl-role="edge-line"]'), "stroke-width")).toBe(
      "7 !important",
    );
    expect(
      declaration(ruleBody(`${fixedFlowcharts} [data-cdl-role="edge-line"]`), "stroke-width"),
    ).toBe("5 !important");
    const dotted = ruleBody(
      `${fixedFlowcharts} [data-cdl-role="edge-line"][stroke-dasharray="10 8"]`,
    );
    expect(declaration(dotted, "stroke-width")).toBe("6 !important");
    expect(declaration(dotted, "stroke-dasharray")).toBe("0 9.6 !important");
    expect(declaration(dotted, "stroke-linecap")).toBe("round !important");
  });

  it("三角の矢じりを横 17・縦 19 にする", () => {
    const body = ruleBody(
      `${fixedFlowcharts} [data-cdl-role="edge-arrowhead"]:is([data-cdl-edge-head="triangle"], :not([data-cdl-edge-head]))`,
    );
    expect(declaration(body, "transform")).toBe("scale(1.2142857143, 1.3571428571)");
    expect(declaration(body, "transform-origin")).toBe("9px 5px");
  });

  it("分かれ道の字を 26・太字 700 にする", () => {
    const body = ruleBody(
      `${fixedFlowcharts} [data-cdl-kind="decision"] [data-cdl-role="node-label"]`,
    );
    expect(declaration(body, "font-size")).toBe("26px !important");
    expect(declaration(body, "font-weight")).toBe("700 !important");
  });

  it.each(diamonds)(
    "$palette の分かれ道の面 $face・枠 $frame・太さ $width に必要な差だけを当てる",
    (expected) => {
      const selector = diamondSelector(expected.palette);
      const body = ruleBody(selector);
      for (const [property, value] of Object.entries(expected.overrides)) {
        expect(declaration(body, property)).toBe(value);
      }
    },
  );

  it("意匠帳の分かれ道の例外を活版・手描き・電飾から読む", () => {
    expect([...flowchartDecisionStyles.keys()]).toEqual(["letterpress", "sketch", "neon"]);
  });

  it("光っていない菱形の上書きが各意匠の箱の規則より詳細になる", () => {
    const markup = renderToStaticMarkup(
      createElement(CdlDiagramView, { diagram: presetDeliveryFlow }),
    );
    const svgDocument = new JSDOM(markup).window.document;
    const stage = svgDocument.querySelector("svg[data-cdl-stage]");
    const decision = svgDocument.querySelector(
      '[data-cdl-kind="decision"] [data-cdl-role="node-body"] > path',
    );
    const SVGElement = svgDocument.defaultView?.SVGElement;
    if (
      SVGElement === undefined ||
      !(stage instanceof SVGElement) ||
      !(decision instanceof SVGElement)
    ) {
      throw new Error("宅配の流れの菱形を読めない");
    }
    for (const active of svgDocument.querySelectorAll("[data-cdl-active]")) {
      active.removeAttribute("data-cdl-active");
    }
    const rules = styleRules();

    for (const diamond of diamonds) {
      stage.setAttribute("data-cdl-palette", diamond.palette);
      const overrideSelector = diamondSelector(diamond.palette);
      const override = selectorSpecificity(overrideSelector);
      for (const property of Object.keys(diamond.overrides)) {
        const existing = rules.filter(
          ({ selector, body }) =>
            !selector.includes('[data-cdl-type="flowchart"]') &&
            !selector.includes('[data-cdl-active="true"]') &&
            importantProperties(body).has(property) &&
            decision.matches(selector),
        );
        expect(
          existing.length,
          `${diamond.palette} / ${property} の比較相手が無い`,
        ).toBeGreaterThan(0);
        const maximum = existing
          .map(({ selector }) => selectorSpecificity(selector))
          .sort((left, right) => compareSpecificity(right, left))[0];
        if (maximum === undefined) {
          throw new Error(`${diamond.palette} / ${property} の比較相手が無い`);
        }
        expect(
          compareSpecificity(override, maximum),
          `${diamond.palette} / ${property}: ${override.join("-")} <= ${maximum.join("-")}`,
        ).toBeGreaterThan(0);
      }
    }
  });

  it.each(palettes)("$palette の主役線・印・分岐札を見本の値にする", (expected) => {
    const body = ruleBody(
      `svg[data-cdl-stage][data-cdl-type="flowchart"][data-cdl-palette="${expected.palette}"]`,
    );
    expect(declaration(body, "--theme-flow-main")).toBe(expected.main);
    expect(declaration(body, "--theme-flow-mark-fixed")).toBe(expected.mark);
    expect(declaration(body, "--theme-flow-label-success-fill")).toBe(expected.yes);
    expect(declaration(body, "--theme-flow-label-error-fill")).toBe(expected.no);
    expect(declaration(body, "--theme-flow-label-success-text")).toBe(expected.yesText);
    expect(declaration(body, "--theme-flow-label-error-text")).toBe(expected.noText);
    expect(declaration(body, "--theme-flow-label-success-frame")).toBe(expected.frame);
    expect(declaration(body, "--theme-flow-label-radius")).toBe(expected.radius);
    expect(declaration(body, "--theme-flow-label-frame-width")).toBe(expected.frameWidth);
  });

  it("終わりの印を半径 19 の輪・半径 10 の芯にする", () => {
    const outer = ruleBody(
      `${fixedFlowcharts} [data-cdl-kind="mark-end"] [data-cdl-role="node-body"]`,
    );
    const inner = ruleBody(
      `${fixedFlowcharts} [data-cdl-kind="mark-end"] [data-cdl-role="node-inner"]`,
    );
    expect(declaration(outer, "r")).toBe("19px");
    expect(declaration(outer, "stroke-width")).toBe("3.5 !important");
    expect(declaration(inner, "r")).toBe("10px");
  });

  it("流れ図へ足した全ての選択子が宅配の流れの DOM に当たる", () => {
    const markup = renderToStaticMarkup(
      createElement(CdlDiagramView, {
        diagram: presetDeliveryFlow,
        focusPhaseId: presetDeliveryFlow.phases.at(-1)?.id,
      }),
    );
    const svgDocument = new JSDOM(markup).window.document;
    for (const active of svgDocument.querySelectorAll("[data-cdl-active]")) {
      active.removeAttribute("data-cdl-active");
    }
    const selectors = flowchartRuleSelectors();
    expect(selectors.length, "流れ図の CSS 規則が 1 件も無い").toBeGreaterThan(0);

    const misses = selectors.flatMap((selector) => {
      const domSelector = paletteを外す(selector);
      const count = svgDocument.querySelectorAll(domSelector).length;
      return count === 0 ? [`${selector} → ${domSelector}`] : [];
    });
    expect(misses, `宅配の流れの DOM に当たらない選択子:\n${misses.join("\n")}`).toEqual([]);
  });
});
