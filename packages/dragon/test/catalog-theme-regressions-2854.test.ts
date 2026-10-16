import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

const css = readFileSync(
  fileURLToPath(new URL("../../../apps/playground-spa/src/styles/cdl-theme.css", import.meta.url)),
  "utf8",
);

const rules = [...css.matchAll(/([^{}]+)\{([^{}]*)\}/gu)].map((match) => ({
  selector: match[1] ?? "",
  body: match[2] ?? "",
}));

const leadRule = (role: string): { selector: string; body: string } | undefined =>
  rules.find(({ selector, body }) => selector.includes(`data-cdl-role="${role}"`) && body.includes("--theme-lead"));

const paletteBlocks = (palette: string): string =>
  rules
    .filter(({ selector }) => selector.includes(`[data-cdl-palette="${palette}"]`))
    .map(({ body }) => body)
    .join("\n");

const tableDeclarations = (palette: string): Map<string, string> => {
  const selector = `svg[data-cdl-stage][data-cdl-palette="${palette}"]`;
  const blocks = rules.filter((rule) =>
    rule.selector.includes(selector) && rule.body.includes("--dragon-theme-ground:"));
  if (blocks.length === 0) throw new Error(`${palette} の意匠表が無い`);
  const result = new Map<string, string>();
  for (const table of blocks) {
    for (const match of table.body.matchAll(/(--[a-z0-9-]+)\s*:\s*([^;]+);/giu)) {
      result.set(match[1]!, match[2]!.replace(/\s+/gu, " ").trim());
    }
  }
  return result;
};

const resolvedRole = (table: Map<string, string>, role: string): string | undefined => {
  const value = table.get(role);
  const reference = /^var\((--[a-z0-9-]+)\)$/iu.exec(value ?? "")?.[1];
  return reference ? resolvedRole(table, reference) : value;
};

const timelineLabels = [
  ["blueprint", "#1f7a6b", "#a8431f", "#ebf0f0", "#e3e9ea", "none", "none", "0", "9px"],
  ["letterpress", "#1a1510", "#1a1510", "#f0eadc", "#f0eadc", "none", "none", "0", "9px"],
  ["catalog", "#4fae9a", "#e8705a", "#1b222c", "#1b222c", "none", "none", "0", "9px"],
  ["terminal", "#c792ea", "#f5c451", "#03110a", "#03110a", "none", "none", "0", "4px"],
  ["sketch", "#2f7d4f", "#2a5ca8", "#fffdf7", "#fffdf7", "none", "none", "0", "9px"],
  ["neon", "#07060c", "#07060c", "#00e5ff", "#ffd000", "#00e5ff", "#ffd000", "2.5px", "9px"],
  ["relief", "#2f7a6e", "#c99a35", "#ffffff", "#383838", "none", "none", "0", "20px"],
] as const;

describe("#2854 5段目a の意匠 selector", () => {
  it("主役色を図形の stroke と文字の fill にだけ当てる", () => {
    const slopeName = leadRule("chart-slope-name");
    const journeyLine = leadRule("journey-line");
    const journeyNote = leadRule("journey-opportunity");
    expect(slopeName?.body).toContain("fill:");
    // 文字の輪郭を確実に消す none は許し、色付き stroke へは流さない。
    expect(slopeName?.body).toContain("stroke: none");
    expect(journeyLine?.body).toContain("stroke:");
    expect(journeyLine?.body).not.toContain("fill:");
    expect(journeyNote?.body).toContain("fill:");
    expect(journeyNote?.body).not.toContain("stroke:");
  });

  it.each(["accent", "teal", "success", "warning"])(
    "放射の %s 系列を枝と葉の下線へ同時に流す",
    (tone) => {
      const rule = rules.find(({ selector }) =>
        selector.includes(`stroke*="--cdl-tone-${tone}"`) &&
        selector.includes('data-cdl-role="mind-edge"') &&
        selector.includes('data-cdl-role="mind-leaf-underline"'));
      expect(rule, `${tone} の枝と下線を同じ規則で選ぶ`).toBeDefined();
    },
  );

  it("漏斗の主役色を値の字だけへ当てる", () => {
    const rule = rules.find(({ selector, body }) =>
      selector.includes('data-cdl-role="funnel-proportional-bar"') &&
      selector.includes('text[font-weight="700"]') &&
      body.includes("--theme-lead"));
    expect(rule).toBeDefined();
  });

  it.each(["blueprint", "letterpress", "catalog", "terminal", "sketch", "neon", "relief"])(
    "%s は傾き図の主役色を定義する",
    (palette) => {
      expect(paletteBlocks(palette), `${palette} の変数の塊`).toContain("--theme-lead:");
    },
  );

  it("傾き図の字体は名札 role だけへ当てる", () => {
    const blanket = rules.find(({ selector }) =>
      selector.includes('[data-cdl-kind="chart-slope"] text'));
    expect(blanket).toBeUndefined();
    for (const role of ["chart-slope-name", "chart-slope-value", "chart-slope-delta"]) {
      expect(
        rules.some(({ selector, body }) =>
          selector.includes(`data-cdl-role="${role}"`) &&
          body.includes("font-weight: 400")),
        `${role} だけに通常の太さを当てる`,
      ).toBe(true);
    }
  });

  it("手描きの内訳と漏斗を既存のペン模様にし、升目へは流さない", () => {
    const patterned = rules.filter(({ body }) => body.includes("var(--dragon-chart-series-"));
    expect(patterned.some(({ selector }) => selector.includes('chart-stacked-bar-slice'))).toBe(true);
    expect(patterned.some(({ selector }) => selector.includes('chart-waffle-cell'))).toBe(false);
    expect(patterned.some(({ selector }) => selector.includes('funnel-proportional-bar'))).toBe(true);
    const sketch = tableDeclarations("sketch");
    expect(resolvedRole(sketch, "--dragon-chart-series-1-fill")).toContain("url(#dragon-sketch-pen");
    expect(resolvedRole(sketch, "--dragon-chart-series-4-fill")).toContain("url(#dragon-sketch-pen");
  });

  it("全意匠の路線図の凡例駅は専用の面色を使う", () => {
    const station = rules.find(({ selector, body }) =>
      selector.includes('[data-cdl-legend-mark="station"]') &&
      body.includes("fill: var(--metro-station-face)"));
    expect(station, "凡例駅の面を指定する規則").toBeDefined();
    expect(station?.selector).toContain("[data-cdl-palette]");
  });

  it("棒の 0 基線だけは実線に戻す", () => {
    const baseline = rules.find(({ selector, body }) =>
      selector.includes('[data-cdl-kind="chart-bar"]') &&
      selector.includes('line:not([data-cdl-role])') &&
      body.includes("stroke-dasharray: none"));
    expect(baseline).toBeDefined();
  });
});

describe("#2854 2 回目の図表回帰", () => {
  it("SVG の座標属性で要素を選ばず、図表本体の role を display none にしない", () => {
    const coordinateAttribute = /\[(?:x|y|cx|cy|width|height)=/u;
    expect(rules.filter(({ selector }) => coordinateAttribute.test(selector))).toEqual([]);

    const figureRoles = [
      "chart-bar-top",
      "chart-bar-bottom",
      "chart-stacked-bar-slice",
      "funnel-proportional-bar",
      "gantt-bar",
    ] as const;
    for (const role of figureRoles) {
      expect(
        rules.filter(({ selector, body }) =>
          selector.includes(`data-cdl-role="${role}"`) && /display\s*:\s*none/u.test(body)),
        role,
      ).toEqual([]);
    }
  });

  it("0.132.0 の傾きラベル role を通常色と 2 本の主役色へ流す", () => {
    const labelRules = rules.filter(({ selector }) =>
      selector.includes('data-cdl-role="chart-slope-label"'));
    expect(labelRules.some(({ body }) => body.includes("--dragon-chart-name-text"))).toBe(true);
    expect(labelRules.some(({ body }) => body.includes("--dragon-chart-slope-osaka"))).toBe(true);
    expect(labelRules.some(({ body }) => body.includes("--theme-lead"))).toBe(true);
  });

  it("上下に分かれた棒を残し、clip 境界だけを画素へそろえる", () => {
    expect(
      rules.some(({ selector, body }) =>
        selector.includes('[data-cdl-kind="chart-bar"] clipPath > rect') &&
        body.includes("shape-rendering: crispEdges")),
    ).toBe(true);
    expect(css).not.toMatch(/data-cdl-role="chart-bar-top"[^{}]*\{[^{}]*clip-path\s*:\s*none/gu);
    expect(css).not.toMatch(/data-cdl-role="chart-bar-bottom"[^{}]*\{[^{}]*display\s*:\s*none/gu);
  });

  it("四象限の quadrant-label role の区画名だけを細い補助色へ戻す", () => {
    expect(
      rules.some(({ selector, body }) =>
        selector.includes('[data-cdl-kind="quadrant-matrix"]') &&
        selector.includes('[data-cdl-role="quadrant-label"]') &&
        body.includes("--theme-quadrant-label") &&
        body.includes("font-weight: 400")),
    ).toBe(true);
  });

  it("小さな四象限の点名だけを墨へ戻し、見本帳の四象限には広げない", () => {
    const pointLabels = rules.find(({ selector, body }) =>
      selector.includes('[data-cdl-kind="quadrant-matrix"]:not([data-cdl-node="打ち手の手間と効き目-chart"])') &&
      selector.includes('[data-cdl-role="quadrant-point-label"]') &&
      body.includes("fill: var(--er-ink) !important"));
    expect(pointLabels).toBeDefined();
    expect(pointLabels?.selector).toContain('[data-cdl-palette="blueprint"]');
    expect(pointLabels?.selector).toContain('[data-cdl-palette="letterpress"]');
    expect(pointLabels?.selector).toContain('[data-cdl-palette="catalog"]');
    expect(pointLabels?.selector).toContain('[data-cdl-palette="relief"]');
  });

  it("浮彫の見本帳ジャーニーの字の大きさを規則で固定しない", () => {
    expect(
      rules.some(({ selector, body }) =>
        selector.includes('[data-cdl-palette="relief"]') &&
        selector.includes('[data-cdl-node="荷主の気持ち-chart"][data-cdl-kind="journey-map"]') &&
        selector.includes('[data-cdl-role="journey-step"]') &&
        body.includes("font-size")),
    ).toBe(false);
  });

  it("工程名を正解頁の太さ 500 で描く", () => {
    expect(
      rules.some(({ selector, body }) =>
        selector.includes('[data-cdl-kind="gantt-timeline"]') &&
        selector.includes('text:not([data-cdl-role])') &&
        body.includes("font-weight: 500")),
    ).toBe(true);
  });

  it("段名は描画側の 29/25 を保ち、段の札だけを 22/700、担当を 16 で描く", () => {
    expect(
      rules.some(({ selector, body }) =>
        selector.includes('data-cdl-role="stage-name"') &&
        (body.includes("font-size: 22px") || body.includes("font-weight: 700"))),
    ).toBe(false);
    expect(
      rules.some(({ selector, body }) =>
        selector.includes('data-cdl-role="stage-column"') &&
        selector.includes('data-cdl-kind="card"') &&
        selector.includes('data-cdl-role="node-label"') &&
        body.includes("font-size: 22px") &&
        body.includes("font-weight: 700")),
    ).toBe(true);
    expect(
      rules.some(({ selector, body }) =>
        selector.includes('data-cdl-role="stage-column"') &&
        selector.includes('data-cdl-role="stage-note"') &&
        body.includes("font-size: 16px")),
    ).toBe(true);
  });

  it("時間軸の番号を 21 にし、路線図の凡例は CDL の配置を保つ", () => {
    expect(
      rules.some(({ selector, body }) =>
        selector.includes('data-cdl-mark="timeline-number"') &&
        selector.includes('data-cdl-role="node-label"') &&
        body.includes("font-size: 21px")),
    ).toBe(true);
    expect(css).not.toMatch(/data-cdl-routing="metro"[^{}]*data-cdl-role="legend"[^{}]*\{[^{}]*transform/gu);
  });

  it("棒の地名と値を正解頁の意匠別 y へ分ける", () => {
    expect(css).toContain("--catalog-bar-label-y: 24px; --catalog-bar-value-y: -18px;");
    expect(css).toContain("--catalog-bar-label-y: 20px; --catalog-bar-value-y: -15px;");
    expect(css).toContain("--catalog-bar-label-y: 7px; --catalog-bar-value-y: -14.5px;");
  });

  it("図表の帯と工程の棒を正解頁の意匠別半径へ分ける", () => {
    expect(tableDeclarations("catalog").get("--dragon-chart-band-radius")).toBe("4px");
    expect(tableDeclarations("sketch").get("--dragon-chart-band-radius")).toBe("10px");
    expect(tableDeclarations("neon").get("--dragon-chart-band-radius")).toBe("12px");
    expect(tableDeclarations("relief").get("--dragon-gantt-bar-radius")).toBe("12px");
    expect(tableDeclarations("neon").get("--dragon-chart-bar-top-radius")).toBe("10px");
    expect(tableDeclarations("neon").get("--dragon-chart-bar-bottom-radius")).toBe("3px");
    for (const role of [
      "--dragon-chart-band-radius",
      "--dragon-gantt-bar-radius",
      "--dragon-chart-bar-top-radius",
      "--dragon-chart-bar-bottom-radius",
    ]) {
      expect(rules.some(({ body }) => body.includes(`var(${role})`)), role).toBe(true);
    }
  });

  it("電飾の図表札は発光中も不透明な水色の管を保つ", () => {
    expect(
      rules.some(({ selector, body }) =>
        selector.includes('[data-cdl-palette="neon"]') &&
        selector.includes('data-cdl-node]:has([data-cdl-role="figure-head"])') &&
        body.includes("animation: none !important") &&
        body.includes("opacity: 1 !important")),
    ).toBe(true);
    expect(
      rules.some(({ selector, body }) =>
        selector.includes('[data-cdl-palette="neon"]') &&
        selector.includes('data-cdl-role="node-body"') &&
        body.includes("35%, white 65%") &&
        body.includes("var(--dragon-chart-frame-effect)")),
    ).toBe(true);
    expect(tableDeclarations("neon").get("--dragon-chart-frame-effect")).toBe(
      "url(#dragon-neon-figure-frame)",
    );
  });

  it("電飾の円は黒い区切り線を外し、端末の半円は正解頁の緑の光を使う", () => {
    expect(
      rules.some(({ selector, body }) =>
        selector.includes('[data-cdl-palette="neon"]') &&
        selector.includes('[data-cdl-kind="chart-pie"]') &&
        selector.includes('[data-cdl-role="chart-pie-slice"]') &&
        body.includes("stroke: none !important")),
    ).toBe(true);
    expect(
      rules.some(({ selector, body }) =>
        selector.includes('[data-cdl-palette="terminal"]') &&
        selector.includes('[data-cdl-role="chart-gauge-arc"]') &&
        selector.includes('[data-cdl-role="chart-gauge-value"]') &&
        selector.includes('[data-cdl-role="chart-gauge-delta"]') &&
        body.includes("var(--dragon-chart-glow-effect)")),
    ).toBe(true);
    expect(tableDeclarations("terminal").get("--dragon-chart-glow-effect")).toBe(
      "url(#dragon-metro-terminal-glow)",
    );
  });

  it("手描き漏斗の斜線を帯と同じ半径 10 にし、四象限の点名を 500 にする", () => {
    expect(
      rules.some(({ selector, body }) =>
        selector.includes('[data-cdl-palette="sketch"]') &&
        selector.includes('[data-cdl-kind="funnel-stages"]') &&
        selector.includes('[data-cdl-role="funnel-stage-hatch"]') &&
        body.includes("var(--dragon-chart-band-radius)")),
    ).toBe(true);
    expect(tableDeclarations("sketch").get("--dragon-chart-band-radius")).toBe("10px");
    expect(
      rules.some(({ selector, body }) =>
        selector.includes('[data-cdl-kind="quadrant-matrix"]') &&
        selector.includes('[data-cdl-role="quadrant-point-label"]') &&
        body.includes("font-weight: 500")),
    ).toBe(true);
  });

  it("浮彫の図表札と凹みを専用 filter に分け、CDL 個別 filter を参照しない", () => {
    // 外枠の板は figure-head を持つ 11 図だけ。figure-title だけの木と放射には広げない。
    expect(
      rules.some(({ selector, body }) =>
        selector.includes('[data-cdl-palette="relief"]') &&
        selector.includes('data-cdl-node]:has([data-cdl-role="figure-head"])') &&
        body.includes("var(--dragon-chart-frame-effect)")),
    ).toBe(true);
    expect(tableDeclarations("relief").get("--dragon-chart-frame-effect")).toBe(
      "url(#dragon-relief-figure-frame)",
    );
    expect(
      rules.some(({ selector, body }) =>
        selector.includes('[data-cdl-palette="relief"]') &&
        selector.includes('data-cdl-node]:has([data-cdl-role="figure-title"])') &&
        body.includes("url(#dragon-relief-figure-frame)")),
    ).toBe(false);
    expect(
      rules.some(({ selector, body }) =>
        selector.includes('[data-cdl-palette="relief"]') &&
        selector.includes('[data-cdl-role="figure-content-inset"]') &&
        body.includes("fill: #e8e3da") &&
        body.includes("url(#dragon-relief-figure-inset)")),
    ).toBe(true);
    expect(css).not.toContain("var(--cdl-figure-content-inset-filter)");
  });

  it("折れ線の座標と月名基線を CSS で動かさない", () => {
    expect(css).not.toContain("--catalog-line-series-matrix");
    expect(css).not.toContain("--catalog-line-grid-matrix");
    expect(css).not.toContain("--catalog-line-tick-x");
    expect(css).not.toContain("--catalog-line-label-y");
    expect(css).not.toMatch(/data-cdl-role="chart-line-label"[^{}]*\{[^{}]*translateY/gu);
  });

  it("図面・端末の路線図系だけ方眼を 20/22 に細かくする", () => {
    expect(
      rules.some(({ selector, body }) =>
        selector.includes('[data-cdl-palette="blueprint"]') &&
        selector.includes('data-cdl-routing="metro"') &&
        body.includes("background-size: 20px 20px")),
    ).toBe(true);
    expect(
      rules.some(({ selector, body }) =>
        selector.includes('[data-cdl-palette="terminal"]') &&
        selector.includes('data-cdl-role="timeline-axis"') &&
        body.includes("22px 22px")),
    ).toBe(true);
  });

  it("端末の升目率を 16 左へ戻す", () => {
    expect(
      rules.some(({ selector, body }) =>
        selector.includes('[data-cdl-palette="terminal"]') &&
        selector.includes('data-cdl-role="chart-waffle-item-share"') &&
        body.includes("translateX(-16px)")),
    ).toBe(true);
  });

  it("浮彫の工程帯を系列階調と正解頁の半径 12 で描く", () => {
    const gantt = rules.filter(({ selector }) =>
      selector.includes('[data-cdl-palette="relief"]') &&
      selector.includes('data-cdl-role="gantt-bar"'));
    expect(gantt.some(({ body }) => body.includes("var(--dragon-chart-series-4-fill)"))).toBe(true);
    expect(gantt.some(({ body }) => body.includes("var(--dragon-chart-series-1-fill)"))).toBe(true);
    expect(rules.some(({ selector, body }) =>
      selector.includes('data-cdl-role="gantt-bar"') &&
      body.includes("var(--dragon-gantt-bar-radius)"))).toBe(true);
    const relief = tableDeclarations("relief");
    expect(relief.get("--dragon-chart-series-4-fill")).toBe("url(#dragon-relief-chart-4)");
    expect(relief.get("--dragon-chart-series-1-fill")).toBe("url(#dragon-relief-chart-1)");
    expect(relief.get("--dragon-gantt-bar-radius")).toBe("12px");
  });

  it.each([
    ["terminal", "dragon-metro-terminal-glow"],
    ["neon", "dragon-metro-neon-glow"],
  ])("%s のジャーニーへ %s を戻す", (palette, filter) => {
    expect(
      rules.some(({ selector, body }) =>
        selector.includes(`[data-cdl-palette="${palette}"]`) &&
        selector.includes('data-cdl-role="journey-line"') &&
        body.includes("var(--dragon-chart-glow-effect)")),
    ).toBe(true);
    expect(tableDeclarations(palette).get("--dragon-chart-glow-effect")).toBe(`url(#${filter})`);
  });

  it("手描きの段の箱は線も札も揺らさず、札を滑らかな 2px 枠にする (#2831)", () => {
    expect(
      rules.some(({ selector, body }) =>
        selector.includes('[data-cdl-palette="sketch"]:has([data-cdl-role="stage-column"])') &&
        selector.includes('data-cdl-role="edge-line"') &&
        body.includes("filter: none !important")),
    ).toBe(true);
    expect(
      rules.some(({ selector, body }) =>
        selector.includes('[data-cdl-palette="sketch"]:has([data-cdl-role="stage-column"])') &&
        selector.includes('[data-cdl-kind="card"] [data-cdl-role="node-body"]') &&
        body.includes("fill: var(--theme-stage-face) !important") &&
        body.includes("filter: none !important") &&
        body.includes("stroke: var(--theme-stage-frame) !important") &&
        body.includes("stroke-width: var(--theme-stage-frame-width) !important") &&
        body.includes("rx: var(--dragon-stage-detail-card-radius) !important") &&
        body.includes("ry: var(--dragon-stage-detail-card-radius) !important")),
    ).toBe(true);
    expect(tableDeclarations("sketch").get("--dragon-stage-detail-card-radius")).toBe("13px");
    expect(
      rules.filter(({ selector, body }) =>
        selector.includes('[data-cdl-palette="sketch"]:has([data-cdl-role="stage-column"])') &&
        (selector.includes('data-cdl-role="edge-line"') || selector.includes('[data-cdl-kind="card"]')) &&
        body.includes("url(#dragon-sketch-wobble)")),
      "段の線と札へ揺れを戻す規則を置かない",
    ).toEqual([]);

    const timelineCard = rules.find(({ selector, body }) =>
      selector.includes('[data-cdl-palette="sketch"]:has([data-cdl-role="timeline-axis"])') &&
      selector.includes('[data-cdl-lane="timeline-steps"][data-cdl-kind="card"]') &&
      selector.includes('[data-cdl-role="node-body"]') &&
      body.includes("var(--dragon-stage-detail-card-effect)"));
    expect(timelineCard, "時間軸の札は影だけを残す").toBeDefined();
    expect(tableDeclarations("sketch").get("--dragon-stage-detail-card-effect")).toBe(
      "drop-shadow(3px 4px 0 rgb(43 38 32 / 16%))",
    );
    expect(timelineCard?.body).not.toContain("dragon-sketch-wobble");
  });

  it("浮彫の段札を地色と小さい浮き出しにし、分岐札の字は対比の下限を守る濃い色にする", () => {
    // 見本の白 #ffffff は #c99a35 の上で 2.57:1 で、大きな字の下限 3 を割る
    expect(css).toContain("--theme-stage-label-error-text: #383838;");
    expect(
      rules.some(({ selector, body }) =>
        selector.includes('[data-cdl-palette="relief"]:has([data-cdl-role="stage-column"])') &&
        selector.includes('[data-cdl-node][data-cdl-lane][data-cdl-kind="card"]') &&
        body.includes("fill: var(--theme-stage-face) !important") &&
        body.includes("var(--dragon-chart-secondary-effect)")),
    ).toBe(true);
    expect(tableDeclarations("relief").get("--dragon-chart-secondary-effect")).toBe(
      "url(#dragon-relief-raised-sm)",
    );
  });

  it.each(timelineLabels)(
    "%s の時間軸は意匠帳の分岐札を値の表に持つ",
    (palette, successFill, errorFill, successText, errorText, successFrame, errorFrame, frameWidth, radius) => {
      const table = tableDeclarations(palette);
      expect(resolvedRole(table, "--theme-timeline-label-success-fill")).toBe(successFill);
      expect(resolvedRole(table, "--theme-timeline-label-error-fill")).toBe(errorFill);
      expect(resolvedRole(table, "--theme-timeline-label-success-text")).toBe(successText);
      expect(resolvedRole(table, "--theme-timeline-label-error-text")).toBe(errorText);
      expect(resolvedRole(table, "--theme-timeline-label-success-frame")).toBe(successFrame);
      expect(resolvedRole(table, "--theme-timeline-label-error-frame")).toBe(errorFrame);
      expect(table.get("--theme-timeline-label-frame-width")).toBe(frameWidth);
      expect(table.get("--theme-timeline-label-radius")).toBe(radius);
      expect(table.get("--theme-timeline-label-height")).toBe("40px");
      expect(table.get("--theme-timeline-label-font-size")).toBe("21px");
      expect(table.get("--theme-timeline-label-font-weight")).toBe("700");
    },
  );

  it("浮彫の円は扇を平らに保ち、字だけを小さく浮かせる", () => {
    const raised = rules.find(({ selector, body }) =>
      selector.includes('[data-cdl-palette="relief"]') &&
      selector.includes('[data-cdl-kind="chart-pie"] text:not([data-cdl-role])') &&
      body.includes("var(--dragon-chart-secondary-effect)"));
    expect(raised).toBeDefined();
    expect(tableDeclarations("relief").get("--dragon-chart-secondary-effect")).toBe(
      "url(#dragon-relief-raised-sm)",
    );
    expect(raised?.selector).not.toContain('[data-cdl-role="chart-pie-slice"]');
  });

  it("端末の時間軸だけを等幅書体へ戻す", () => {
    expect(
      rules.some(({ selector, body }) =>
        selector.includes('[data-cdl-palette="terminal"]:has([data-cdl-role="timeline-axis"])') &&
        selector.includes('data-cdl-role="edge-label"') &&
        body.includes("font-family: var(--d-mono)")),
    ).toBe(true);
  });
});

describe("#2854 6段目の階層図とマインドマップ", () => {
  const fixedPalettes = [
    "blueprint",
    "letterpress",
    "catalog",
    "terminal",
    "sketch",
    "neon",
    "relief",
  ] as const;

  const ruleReading = (parts: string[], role: string): { selector: string; body: string } | undefined =>
    rules.find(({ selector, body }) =>
      parts.every((part) => selector.includes(part)) && body.includes(`var(${role})`));

  it("この 2 図だけの外枠と外題を 7 意匠で外し、図種全体へ広げない", () => {
    for (const role of ["node-body", "figure-title"]) {
      const hidden = rules.find(({ selector, body }) =>
        selector.includes('data-cdl-node="営業所の階層-chart"') &&
        selector.includes('data-cdl-node="再配達を減らす-chart"') &&
        selector.includes(`data-cdl-role="${role}"`) &&
        body.includes("display: none"));
      expect(hidden, role).toBeDefined();
      for (const palette of fixedPalettes) {
        expect(hidden?.selector, palette).toContain(`[data-cdl-palette="${palette}"]`);
      }
      expect(hidden?.selector).not.toMatch(/\[data-cdl-palette\](?!\s*=)/u);
    }
  });

  it("枝幅・札・題・補足は図だけの規則から値表の役を読む", () => {
    expect(ruleReading([
      'data-cdl-node="営業所の階層-chart"',
      'data-cdl-role="tree-edge"',
      'data-cdl-node="再配達を減らす-chart"',
      'data-cdl-role="mind-leaf-underline"',
    ], "--dragon-hierarchy-edge-width")).toBeDefined();
    expect(ruleReading([
      '[data-cdl-palette="terminal"]',
      'data-cdl-node="営業所の階層-chart"',
      'data-cdl-node="再配達を減らす-chart"',
      'data-cdl-role="tree-node"',
    ], "--dragon-hierarchy-card-fill")).toBeDefined();
    expect(ruleReading([
      '[data-cdl-palette="terminal"]',
      'data-cdl-node="営業所の階層-chart"',
      'data-cdl-role="tree-node"',
    ], "--dragon-hierarchy-card-radius")).toBeDefined();
    expect(ruleReading([
      '[data-cdl-palette="terminal"]',
      'data-cdl-role="tree-node-title"',
      'data-cdl-role="mind-root-title"',
    ], "--dragon-hierarchy-title-effect")).toBeDefined();
    expect(ruleReading([
      '[data-cdl-palette="terminal"]',
      'data-cdl-node="営業所の階層-chart"',
      'data-cdl-role="tree-node-subtitle"',
    ], "--dragon-hierarchy-subtitle-text")).toBeDefined();
  });

  it("階層図とマインドマップの値表は移動前の値を保つ", () => {
    for (const palette of fixedPalettes) {
      expect(tableDeclarations(palette).get("--dragon-hierarchy-edge-width"), palette).toBe("4.5px");
    }

    const blueprint = tableDeclarations("blueprint");
    expect(blueprint.get("--dragon-hierarchy-card-fill")).toBe("rgba(227, 233, 234, 0.82)");
    expect(blueprint.get("--dragon-hierarchy-card-radius")).toBe("12px");

    const terminal = tableDeclarations("terminal");
    expect(terminal.get("--dragon-hierarchy-card-fill")).toBe("url(#dragon-terminal-card-gradient)");
    expect(terminal.get("--dragon-hierarchy-card-radius")).toBe("6px");
    expect(terminal.get("--dragon-hierarchy-title-effect")).toBe(
      "drop-shadow(0 0 10px rgb(74 222 128 / 35%))",
    );

    const catalog = tableDeclarations("catalog");
    expect(catalog.get("--dragon-hierarchy-card-effect")).toBe("url(#dragon-catalog-tree-shadow)");
    expect(catalog.get("--dragon-mind-redelivery-ground-pattern")).toContain("ellipse at 50% 0%");

    const relief = tableDeclarations("relief");
    expect(relief.get("--dragon-hierarchy-card-fill")).toBe("#e8e3da");
    expect(relief.get("--dragon-hierarchy-card-effect")).toBe("url(#dragon-relief-raised)");

    const neon = tableDeclarations("neon");
    expect(neon.get("--dragon-hierarchy-card-fill")).toBe("rgb(10 8 18 / 94%)");
    expect(neon.get("--dragon-hierarchy-card-frame-width")).toBe("2px");
    expect(neon.get("--dragon-hierarchy-card-effect")).toContain(
      "drop-shadow(0 0 24px rgb(255 46 151 / 22%))",
    );
    expect(neon.get("--dragon-hierarchy-title-effect")).toContain(
      "drop-shadow(0 0 12px rgb(255 46 151 / 60%))",
    );
    expect(neon.get("--dragon-tree-sales-office-ground-pattern")).toContain("820px 560px at 18% 132px");
    expect(neon.get("--dragon-mind-redelivery-ground-pattern")).toContain("820px 560px at 18% -378px");
  });

  it("共通規則より先の意匠別補正と要素ごとの発光色を役へ引き継ぐ", () => {
    const localRole = (parts: string[], role: string, value: string): void => {
      expect(
        rules.some(({ selector, body }) =>
          parts.every((part) => selector.includes(part)) &&
          body.includes(`${role}: ${value}`)),
        `${parts.join(" / ")} の ${role}`,
      ).toBe(true);
    };

    localRole(
      ['[data-cdl-palette="letterpress"]', 'data-cdl-node="営業所の階層-chart"', 'data-cdl-role="tree-node"'],
      "--dragon-hierarchy-card-fill",
      "var(--er-face)",
    );
    for (const palette of ["catalog", "relief"] as const) {
      localRole(
        [`[data-cdl-palette="${palette}"]`, 'data-cdl-node="営業所の階層-chart"', 'data-cdl-role="tree-node"'],
        "--dragon-hierarchy-card-effect",
        "var(--dragon-tree-sales-office-card-effect)",
      );
    }
    expect(tableDeclarations("catalog").get("--dragon-tree-sales-office-card-effect")).toContain(
      "drop-shadow(0 22px 40px rgb(0 0 0 / 62%))",
    );
    expect(tableDeclarations("relief").get("--dragon-tree-sales-office-card-effect")).toBe(
      "url(#dragon-relief-raised-contained)",
    );
    localRole(
      ['[data-cdl-palette="terminal"]', '[data-cdl-mind-form="outline"]', 'data-cdl-role="mind-root"'],
      "--dragon-hierarchy-card-frame",
      "var(--theme-mind-root-stroke)",
    );

    localRole(
      ['[data-cdl-palette="neon"]', 'data-cdl-role="chart-stacked-bar-slice"'],
      "--dragon-chart-band-effect",
      "var(--dragon-chart-stacked-bar-effect)",
    );
    localRole(
      ['[data-cdl-palette="neon"]', 'data-cdl-role="funnel-proportional-bar"', '[data-cdl-emphasis="primary"]'],
      "--dragon-chart-band-effect",
      "var(--dragon-funnel-primary-effect)",
    );
    expect(tableDeclarations("neon").get("--dragon-chart-stacked-bar-effect")).toBe(
      "drop-shadow(0 0 6px currentColor)",
    );
    expect(tableDeclarations("neon").get("--dragon-funnel-primary-effect")).toBe(
      "drop-shadow(0 0 6px var(--theme-lead))",
    );

    const terminalFrame = rules.find(({ selector, body }) =>
      selector.includes('[data-cdl-palette="terminal"]') &&
      selector.includes('data-cdl-role="figure-head"') &&
      selector.includes('data-cdl-role="node-body"') &&
      body.includes("stroke: var(--dragon-chart-figure-card-frame)"));
    expect(terminalFrame).toBeDefined();
    const terminalDivider = rules.find(({ selector, body }) =>
      selector.includes('[data-cdl-palette="terminal"]') &&
      selector.includes('data-cdl-role="figure-head-divider"') &&
      selector.includes('data-cdl-role="figure-footer-divider"') &&
      body.includes("stroke: var(--dragon-chart-figure-divider)"));
    expect(terminalDivider).toBeDefined();
    expect(tableDeclarations("terminal").get("--dragon-chart-figure-card-frame")).toBe(
      "rgba(74, 222, 128, 0.3)",
    );
    expect(tableDeclarations("terminal").get("--dragon-chart-figure-divider")).toBe(
      "rgba(74, 222, 128, 0.16)",
    );
  });

  it("図ごとの地は図名を含む役を読み、活版・図録・電飾の位置を保つ", () => {
    expect(ruleReading(
      ['[data-cdl-palette="neon"]:has([data-cdl-node="営業所の階層-chart"])'],
      "--dragon-tree-sales-office-ground-pattern",
    )).toBeDefined();
    expect(ruleReading(
      ['[data-cdl-palette="neon"]:has([data-cdl-node="再配達を減らす-chart"])'],
      "--dragon-mind-redelivery-ground-pattern",
    )).toBeDefined();
    const catalogGround = ruleReading(
      ['[data-cdl-palette="catalog"]:has([data-cdl-node="再配達を減らす-chart"])'],
      "--dragon-mind-redelivery-ground-pattern",
    );
    expect(catalogGround).toBeDefined();
    expect(catalogGround?.body).toContain("background-position: center bottom");
    expect(catalogGround?.body).toContain("background-size: 100% 186.441%");
    expect(ruleReading(
      ['[data-cdl-palette="letterpress"]:has([data-cdl-node="再配達を減らす-chart"])'],
      "--dragon-mind-redelivery-ground-pattern",
    )).toBeDefined();
  });

  it("持ち越した位置補正と矢じり表示域は対象図と 7 意匠だけへ当たる", () => {
    const expected = [
      ['data-cdl-node="営業所の階層-chart"', "translate: 0 -14px"],
      ['data-cdl-node="再配達を減らす-chart"', "translate: 20px -32px"],
      ['data-cdl-role="tree-edge-head"', "transform: translateY(-12.5px)"],
      ['data-cdl-role="mind-root-title"', "translate: 0 7px"],
    ] as const;
    for (const [selectorPart, declaration] of expected) {
      const rule = rules.find(({ selector, body }) =>
        selector.includes(selectorPart) && body.includes(declaration));
      expect(rule, declaration).toBeDefined();
    }
    expect(
      rules.some(({ selector, body }) =>
        selector.includes('data-cdl-node="営業所の階層-chart"') &&
        selector.includes('marker:has(> [data-cdl-role="tree-edge-head"])') &&
        body.includes("overflow: visible")),
    ).toBe(true);
  });

  it("端末の同梱等幅書体と題の 25/700、枝札の位置を保つ", () => {
    const family = rules.find(({ selector, body }) =>
      selector.includes('[data-cdl-palette="terminal"]') &&
      selector.includes('data-cdl-node="営業所の階層-chart"') &&
      selector.includes('data-cdl-node="再配達を減らす-chart"') &&
      selector.includes('data-cdl-role="tree-node-title"') &&
      body.includes('"JetBrains Mono Variable", "JetBrains Mono", "M PLUS 1 Code", "SF Mono"'));
    expect(family).toBeDefined();
    expect(family?.body).toContain("-webkit-font-smoothing: antialiased");

    const title = ruleReading(
      ['[data-cdl-palette="terminal"]', 'data-cdl-role="tree-node-title"', 'data-cdl-role="mind-root-title"'],
      "--dragon-hierarchy-title-effect",
    );
    expect(title?.body).toContain("font-size: 25px");
    expect(title?.body).toContain("font-weight: 700");
    expect(
      rules.some(({ selector, body }) =>
        selector.includes('[data-cdl-palette="terminal"]') &&
        selector.includes('data-cdl-node="再配達を減らす-chart"') &&
        selector.includes('data-cdl-role="mind-root-title"') &&
        body.includes("translate: 0 0")),
    ).toBe(true);
  });

  it("電飾の矢じり・札・題は専用役を読み、図録と浮彫の枠は 0 のまま", () => {
    expect(ruleReading([
      '[data-cdl-palette="neon"]',
      'data-cdl-node="営業所の階層-chart"',
      'data-cdl-role="tree-edge-head"',
    ], "--dragon-hierarchy-edge-head-effect")).toBeDefined();
    expect(ruleReading([
      '[data-cdl-palette="neon"]',
      'data-cdl-role="tree-node"',
      'data-cdl-role="mind-root"',
      'data-cdl-role="mind-box"',
    ], "--dragon-hierarchy-card-effect")).toBeDefined();
    expect(ruleReading([
      '[data-cdl-palette="neon"]',
      'data-cdl-role="tree-node-title"',
      'data-cdl-role="mind-root-title"',
    ], "--dragon-hierarchy-title-effect")).toBeDefined();

    const borderless = rules.find(({ selector, body }) =>
      selector.includes('[data-cdl-palette="catalog"]') &&
      selector.includes('[data-cdl-palette="relief"]') &&
      selector.includes('data-cdl-node="営業所の階層-chart"') &&
      body.includes("stroke: none") &&
      body.includes("var(--dragon-hierarchy-card-frame-width)"));
    expect(borderless).toBeDefined();
    expect(tableDeclarations("catalog").get("--dragon-hierarchy-card-frame-width")).toBe("0");
    expect(tableDeclarations("relief").get("--dragon-hierarchy-card-frame-width")).toBe("0");
  });

  it("浮彫の系列矢じりは表の 2 系列を読み、字の 3px 補正を保つ", () => {
    expect(ruleReading(
      ['[data-cdl-palette="relief"]', 'data-cdl-role="tree-edge-head"', 'fill*="--cdl-chart-1"'],
      "--dragon-hierarchy-edge-head-series-1",
    )).toBeDefined();
    expect(ruleReading(
      ['[data-cdl-palette="relief"]', 'data-cdl-role="tree-edge-head"', 'fill*="--cdl-chart-2"'],
      "--dragon-hierarchy-edge-head-series-2",
    )).toBeDefined();
    expect(
      rules.some(({ selector, body }) =>
        selector.includes('[data-cdl-palette="relief"]') &&
        selector.includes('data-cdl-node="営業所の階層-chart"') &&
        selector.includes('data-cdl-role="tree-node-subtitle"') &&
        body.includes("translate: 0 3px")),
    ).toBe(true);
  });

  it("図表・題・段札の filter は表の役を読み、表が元の filter ID を持つ", () => {
    const readers = [
      ["--dragon-chart-frame-effect", 'data-cdl-role="figure-head"'],
      ["--dragon-chart-secondary-effect", 'data-cdl-role="chart-gauge-arc"'],
      ["--dragon-chart-glow-effect", 'data-cdl-role="quadrant-point"'],
      ["--dragon-chart-line-effect", 'data-cdl-role="chart-line"'],
      ["--dragon-chart-title-effect", 'data-cdl-role="figure-title"'],
      ["--dragon-stage-name-effect", 'data-cdl-role="stage-name"'],
      ["--dragon-stage-card-name-effect", 'data-cdl-role="stage-column"'],
    ] as const;
    for (const [role, selectorPart] of readers) {
      expect(ruleReading([selectorPart], role), role).toBeDefined();
    }

    expect(tableDeclarations("relief").get("--dragon-chart-frame-effect")).toBe(
      "url(#dragon-relief-figure-frame)",
    );
    expect(tableDeclarations("terminal").get("--dragon-chart-glow-effect")).toBe(
      "url(#dragon-metro-terminal-glow)",
    );
    expect(tableDeclarations("neon").get("--dragon-chart-line-effect")).toBe(
      "url(#dragon-neon-tube)",
    );
    expect(tableDeclarations("neon").get("--dragon-chart-title-effect")).toBe(
      "url(#dragon-neon-title-cyan)",
    );
    expect(tableDeclarations("neon").get("--dragon-stage-name-effect")).toBe(
      "url(#dragon-neon-title-pink)",
    );
    expect(tableDeclarations("neon").get("--dragon-stage-card-name-effect")).toBe(
      "url(#dragon-neon-title-violet)",
    );
  });

  it("浮彫の図表系列と図表半径は表の値を読み分ける", () => {
    const relief = tableDeclarations("relief");
    expect(relief.get("--dragon-chart-series-1-fill")).toBe("url(#dragon-relief-chart-1)");
    expect(relief.get("--dragon-chart-series-4-fill")).toBe("url(#dragon-relief-chart-4)");
    expect(relief.get("--dragon-gantt-bar-radius")).toBe("12px");
    expect(relief.get("--dragon-chart-bar-top-radius")).toBe("12px");

    const neon = tableDeclarations("neon");
    expect(neon.get("--dragon-chart-band-radius")).toBe("12px");
    expect(neon.get("--dragon-chart-bar-top-radius")).toBe("10px");
    expect(neon.get("--dragon-chart-bar-bottom-radius")).toBe("3px");

    expect(ruleReading(['data-cdl-role="gantt-bar"'], "--dragon-gantt-bar-radius")).toBeDefined();
    expect(ruleReading(['data-cdl-role="chart-bar-top"'], "--dragon-chart-bar-top-radius")).toBeDefined();
    expect(ruleReading(['data-cdl-role="chart-stacked-bar-slice"'], "--dragon-chart-band-radius")).toBeDefined();
  });

  it("棒と升目の持ち越し補正、光を外す規則を保つ", () => {
    expect(
      rules.some(({ selector, body }) =>
        selector.includes('[data-cdl-palette="terminal"]') &&
        selector.includes('data-cdl-role="chart-waffle-item-share"') &&
        body.includes("translateX(-16px)")),
    ).toBe(true);
    expect(
      rules.some(({ selector, body }) =>
        selector.includes('[data-cdl-palette="terminal"]') &&
        selector.includes('data-cdl-role="chart-stacked-bar-slice"') &&
        body.includes("filter: none !important")),
    ).toBe(true);
    expect(
      rules.some(({ selector, body }) =>
        selector.includes('[data-cdl-palette="neon"]') &&
        selector.includes('data-cdl-role="chart-pie-table-label"') &&
        selector.includes('data-cdl-role="chart-waffle-item-share"') &&
        body.includes("filter: none !important")),
    ).toBe(true);
  });
});
