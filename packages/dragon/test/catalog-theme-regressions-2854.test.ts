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
    const patterned = rules.filter(({ body }) => body.includes("url(#dragon-sketch-pen)"));
    expect(patterned.some(({ selector }) => selector.includes('chart-stacked-bar-slice'))).toBe(true);
    expect(patterned.some(({ selector }) => selector.includes('chart-waffle-cell'))).toBe(false);
    expect(patterned.some(({ selector }) => selector.includes('funnel-proportional-bar'))).toBe(true);
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
    expect(labelRules.some(({ body }) => body.includes("--theme-chart-name-color"))).toBe(true);
    expect(labelRules.some(({ body }) => body.includes("--theme-slope-osaka"))).toBe(true);
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
    const radius = (palette: string, role: string, px: number): boolean =>
      rules.some(({ selector, body }) =>
        selector.includes(`[data-cdl-palette="${palette}"]`) &&
        selector.includes(`data-cdl-role="${role}"`) &&
        body.includes(`rx: ${px}px`) &&
        body.includes(`ry: ${px}px`));

    expect(radius("catalog", "chart-stacked-bar-slice", 4)).toBe(true);
    expect(radius("sketch", "funnel-proportional-bar", 10)).toBe(true);
    expect(radius("neon", "chart-stacked-bar-slice", 12)).toBe(true);
    expect(radius("relief", "gantt-bar", 12)).toBe(true);
    expect(radius("neon", "chart-bar-top", 10)).toBe(true);
    expect(radius("neon", "chart-bar-bottom", 3)).toBe(true);
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
        body.includes("url(#dragon-neon-figure-frame)")),
    ).toBe(true);
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
        body.includes("url(#dragon-metro-terminal-glow)")),
    ).toBe(true);
  });

  it("手描き漏斗の斜線を帯と同じ半径 10 にし、四象限の点名を 500 にする", () => {
    expect(
      rules.some(({ selector, body }) =>
        selector.includes('[data-cdl-palette="sketch"]') &&
        selector.includes('[data-cdl-kind="funnel-stages"]') &&
        selector.includes('[data-cdl-role="funnel-stage-hatch"]') &&
        body.includes("rx: 10px") &&
        body.includes("ry: 10px")),
    ).toBe(true);
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
        body.includes("url(#dragon-relief-figure-frame)")),
    ).toBe(true);
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
    expect(gantt.some(({ body }) => body.includes("url(#dragon-relief-chart-4)"))).toBe(true);
    expect(gantt.some(({ body }) => body.includes("url(#dragon-relief-chart-1)"))).toBe(true);
    expect(gantt.some(({ body }) => body.includes("rx: 12px") && body.includes("ry: 12px"))).toBe(true);
  });

  it.each([
    ["terminal", "dragon-metro-terminal-glow"],
    ["neon", "dragon-metro-neon-glow"],
  ])("%s のジャーニーへ %s を戻す", (palette, filter) => {
    expect(
      rules.some(({ selector, body }) =>
        selector.includes(`[data-cdl-palette="${palette}"]`) &&
        selector.includes('data-cdl-role="journey-line"') &&
        body.includes(`url(#${filter})`)),
    ).toBe(true);
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
        body.includes("fill: #fffdf7 !important") &&
        body.includes("filter: none !important") &&
        body.includes("stroke: #2b2620 !important") &&
        body.includes("stroke-width: 2px !important") &&
        body.includes("rx: 13px !important") &&
        body.includes("ry: 13px !important")),
    ).toBe(true);
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
      body.includes("drop-shadow(3px 4px 0 rgb(43 38 32 / 16%))"));
    expect(timelineCard, "時間軸の札は影だけを残す").toBeDefined();
    expect(timelineCard?.body).not.toContain("dragon-sketch-wobble");
  });

  it("浮彫の段札を地色と小さい浮き出しにし、分岐札の字は対比の下限を守る濃い色にする", () => {
    // 見本の白 #ffffff は #c99a35 の上で 2.57:1 で、大きな字の下限 3 を割る
    expect(css).toContain("--theme-stage-label-error-text: #383838;");
    expect(
      rules.some(({ selector, body }) =>
        selector.includes('[data-cdl-palette="relief"]:has([data-cdl-role="stage-column"])') &&
        selector.includes('[data-cdl-node][data-cdl-lane][data-cdl-kind="card"]') &&
        body.includes("fill: #e8e3da !important") &&
        body.includes("url(#dragon-relief-raised-sm)")),
    ).toBe(true);
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
      body.includes("url(#dragon-relief-raised-sm)"));
    expect(raised).toBeDefined();
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

  it("この 2 図の外枠だけを 7 意匠で外す", () => {
    const frame = rules.find(({ selector, body }) =>
      selector.includes('data-cdl-node="営業所の階層-chart"') &&
      selector.includes('data-cdl-node="再配達を減らす-chart"') &&
      selector.includes('data-cdl-role="node-body"') &&
      body.includes("display: none"));

    expect(frame).toBeDefined();
    for (const palette of fixedPalettes) {
      expect(frame?.selector, palette).toContain(`[data-cdl-palette="${palette}"]`);
    }
    expect(frame?.selector).not.toMatch(/\[data-cdl-palette\](?!\s*=)/u);
  });

  it("枝と葉の下線を見本の 4.5 にして tree の矢じりへ同じ比を渡す", () => {
    const stroke = rules.find(({ selector, body }) =>
      selector.includes('data-cdl-node="営業所の階層-chart"') &&
      selector.includes('data-cdl-role="tree-edge"') &&
      selector.includes('data-cdl-node="再配達を減らす-chart"') &&
      selector.includes('data-cdl-role="mind-edge"') &&
      selector.includes('data-cdl-role="mind-leaf-underline"') &&
      body.includes("stroke-width: 4.5px"));
    expect(stroke).toBeDefined();
  });

  it("階層図の矢じりを 7 意匠だけで箱の手前へ戻す", () => {
    const arrowhead = rules.find(({ selector, body }) =>
      selector.includes('data-cdl-node="営業所の階層-chart"') &&
      selector.includes('data-cdl-role="tree-edge-head"') &&
      body.includes("transform: translateY(-12.5px)"));

    expect(arrowhead).toBeDefined();
    for (const palette of fixedPalettes) {
      expect(arrowhead?.selector, palette).toContain(`[data-cdl-palette="${palette}"]`);
    }
    expect(arrowhead?.selector).not.toMatch(/\[data-cdl-palette\](?!\s*=)/u);

    const marker = rules.find(({ selector, body }) =>
      selector.includes('data-cdl-node="営業所の階層-chart"') &&
      selector.includes('marker:has(> [data-cdl-role="tree-edge-head"])') &&
      body.includes("overflow: visible"));
    expect(marker).toBeDefined();
  });

  it("端末の札は見本の暗い階調を使う", () => {
    const terminal = rules.find(({ selector, body }) =>
      selector.includes('[data-cdl-palette="terminal"]') &&
      selector.includes('data-cdl-node="営業所の階層-chart"') &&
      selector.includes('data-cdl-node="再配達を減らす-chart"') &&
      body.includes("fill: url(#dragon-terminal-card-gradient)"));
    expect(terminal).toBeDefined();

    const terminalCorner = rules.find(({ selector, body }) =>
      selector.includes('[data-cdl-palette="terminal"]') &&
      selector.includes('data-cdl-node="営業所の階層-chart"') &&
      selector.includes('data-cdl-role="tree-node"') &&
      body.includes("rx: 6px") &&
      body.includes("ry: 6px"));
    expect(terminalCorner).toBeDefined();
  });

  it("図面の方眼を見本の 2 層・1px・7% と採取後 40px になる 20px 間隔にする", () => {
    const blueprint = rules.find(({ selector, body }) =>
      selector.includes('[data-cdl-palette="blueprint"]:has(') &&
      selector.includes('data-cdl-node="営業所の階層-chart"') &&
      selector.includes('data-cdl-node="再配達を減らす-chart"') &&
      body.match(/rgb\(20 58 82 \/ 7%\)/gu)?.length === 2 &&
      body.includes("1px, transparent 1px") &&
      body.includes("background-size: 20px 20px"));
    const terminal = rules.find(({ selector, body }) =>
      selector.includes('[data-cdl-palette="terminal"]:has(') &&
      selector.includes('data-cdl-node="営業所の階層-chart"') &&
      selector.includes('data-cdl-node="再配達を減らす-chart"') &&
      body.includes("var(--theme-lead) 1%") &&
      body.includes("22px 22px"));
    expect(blueprint).toBeDefined();
    expect(terminal).toBeDefined();
  });

  it("図面の札を 0.82 で透かし、図録と浮彫の影を見本へ揃える", () => {
    const blueprint = rules.find(({ selector, body }) =>
      selector.includes('[data-cdl-palette="blueprint"]') &&
      selector.includes('data-cdl-node="営業所の階層-chart"') &&
      selector.includes('data-cdl-node="再配達を減らす-chart"') &&
      body.includes("fill: rgba(227, 233, 234, 0.82)"));
    const catalog = rules.find(({ selector, body }) =>
      selector.includes('[data-cdl-palette="catalog"]') &&
      selector.includes('data-cdl-node="営業所の階層-chart"') &&
      body.includes("stroke: none") &&
      body.includes("filter: url(#dragon-catalog-tree-shadow)"));
    const relief = rules.find(({ selector, body }) =>
      selector.includes('[data-cdl-palette="relief"]') &&
      selector.includes('data-cdl-role="tree-node"') &&
      body.includes("filter: url(#dragon-relief-raised-contained)"));

    expect(blueprint).toBeDefined();
    expect(catalog).toBeDefined();
    expect(relief).toBeDefined();
  });

  it("端末の階層図の補足は CDL の寸法を保ち、放射の枝札の光を外す", () => {
    const subtitle = rules.find(({ selector, body }) =>
      selector.includes('[data-cdl-palette="terminal"]') &&
      selector.includes('data-cdl-node="営業所の階層-chart"') &&
      selector.includes('data-cdl-role="tree-node-subtitle"') &&
      body.includes("fill: #8a9b90") &&
      !body.includes("font-size:"));
    const mindBoxes = rules.find(({ selector, body }) =>
      selector.includes('[data-cdl-palette="terminal"]') &&
      selector.includes('data-cdl-node="再配達を減らす-chart"') &&
      selector.includes('data-cdl-role="mind-box"') &&
      body.includes("filter: none"));

    expect(subtitle).toBeDefined();
    expect(mindBoxes).toBeDefined();
  });

  it("電飾の 1100px の地を元の半径・中心のまま上下へ分ける", () => {
    const hierarchyGlow = rules.find(({ selector, body }) =>
      selector.includes('[data-cdl-palette="neon"]:has([data-cdl-node="営業所の階層-chart"])') &&
      body.includes("820px 560px at 18% 132px") &&
      body.includes("760px 540px at 84% 880px") &&
      body.includes("1300px 900px at 50% 495px"));
    const mindGlow = rules.find(({ selector, body }) =>
      selector.includes('[data-cdl-palette="neon"]:has([data-cdl-node="再配達を減らす-chart"])') &&
      body.includes("820px 560px at 18% -378px") &&
      body.includes("760px 540px at 84% 370px") &&
      body.includes("1300px 900px at 50% -15px"));
    const root = rules.find(({ selector, body }) =>
      selector.includes('[data-cdl-palette="neon"]') &&
      selector.includes('data-cdl-node="再配達を減らす-chart"') &&
      selector.includes('data-cdl-role="mind-root"') &&
      body.includes("stroke: rgba(255, 182, 219, 1)"));

    expect(hierarchyGlow).toBeDefined();
    expect(mindGlow).toBeDefined();
    expect(root).toBeDefined();
  });

  it("浮彫の枝札は地色と標準の浮き出しを保ち、活版と図録の地を見本の位置へ置く", () => {
    const relief = rules.find(({ selector, body }) =>
      selector.includes('[data-cdl-palette="relief"]') &&
      selector.includes('data-cdl-node="再配達を減らす-chart"') &&
      selector.includes('data-cdl-role="mind-box"') &&
      body.includes("fill: #e8e3da") &&
      body.includes("filter: url(#dragon-relief-raised)"));
    const letterpress = rules.find(({ selector, body }) =>
      selector.includes('[data-cdl-palette="letterpress"]:has([data-cdl-node="再配達を減らす-chart"])') &&
      body.includes("circle at 18% 88%"));
    const catalog = rules.find(({ selector, body }) =>
      selector.includes('[data-cdl-palette="catalog"]:has([data-cdl-node="再配達を減らす-chart"])') &&
      body.includes("background-position: center bottom") &&
      body.includes("background-size: 100% 186.441%"));

    expect(relief).toBeDefined();
    expect(letterpress).toBeDefined();
    expect(catalog).toBeDefined();
  });

  it("電飾の階層札は見本の 94% の黒い面を保つ", () => {
    const node = rules.find(({ selector, body }) =>
      selector.includes('[data-cdl-palette="neon"]') &&
      selector.includes('data-cdl-node="営業所の階層-chart"') &&
      selector.includes('data-cdl-role="tree-node"') &&
      body.includes("fill: rgb(10 8 18 / 94%)"));
    expect(node).toBeDefined();
  });

  it("枝の字を 700 以上、葉を 500 にして、葉へ箱の規則を足さない", () => {
    const branches = rules.filter(({ selector }) =>
      selector.includes('data-cdl-node="再配達を減らす-chart"') &&
      selector.includes('data-cdl-role="mind-box-title"'));
    const leaves = rules.filter(({ selector }) =>
      selector.includes('data-cdl-node="再配達を減らす-chart"') &&
      selector.includes('data-cdl-role="mind-leaf-title"'));

    expect(branches.some(({ body }) => body.includes("font-weight: 700"))).toBe(true);
    expect(branches.some(({ body }) => body.includes("font-weight: 800"))).toBe(true);
    expect(leaves.some(({ body }) => body.includes("font-weight: 500"))).toBe(true);
    expect(leaves.some(({ body }) => /\b(?:stroke|filter)\s*:/u.test(body))).toBe(false);
  });

  it("木を切り取らず、放射だけ 20px 右へ寄せて板の中央へ合わせる", () => {
    const tree = rules.find(({ selector, body }) =>
      selector.includes('data-cdl-node="営業所の階層-chart"') &&
      body.includes("translate: 0 -14px"));
    const mind = rules.find(({ selector, body }) =>
      selector.includes('data-cdl-node="再配達を減らす-chart"') &&
      body.includes("translate: 20px -32px"));

    expect(css).not.toContain("clip-path: inset(0 0 20px 0)");
    for (const rule of [tree, mind]) {
      expect(rule).toBeDefined();
      for (const palette of fixedPalettes) {
        expect(rule?.selector, palette).toContain(`[data-cdl-palette="${palette}"]`);
      }
      expect(rule?.selector).not.toMatch(/\[data-cdl-palette\](?!\s*=)/u);
    }
  });

  it("放射の箱の字を基準 7px 下げ、端末と浮彫は見本固有の位置へ戻す", () => {
    const mindTitle = rules.find(({ selector, body }) =>
      selector.includes('data-cdl-node="再配達を減らす-chart"') &&
      selector.includes('data-cdl-role="mind-root-title"') &&
      selector.includes('data-cdl-role="mind-box-title"') &&
      body.includes("translate: 0 7px"));
    const subtitle = rules.find(({ selector, body }) =>
      selector.includes('data-cdl-node="営業所の階層-chart"') &&
      selector.includes('data-cdl-role="tree-node-subtitle"') &&
      body.includes("letter-spacing: 0.04em"));
    const terminal = rules.find(({ selector, body }) =>
      selector.includes('[data-cdl-palette="terminal"]') &&
      selector.includes('data-cdl-node="再配達を減らす-chart"') &&
      selector.includes('data-cdl-role="mind-root-title"') &&
      body.includes("translate: 0 0"));
    const relief = rules.find(({ selector, body }) =>
      selector.includes('[data-cdl-palette="relief"]') &&
      selector.includes('data-cdl-node="再配達を減らす-chart"') &&
      selector.includes('data-cdl-role="mind-root-title"') &&
      body.includes("translate: 0 11px"));

    expect(mindTitle).toBeDefined();
    expect(subtitle).toBeDefined();
    expect(terminal).toBeDefined();
    expect(relief).toBeDefined();
    for (const palette of fixedPalettes) {
      expect(mindTitle?.selector, palette).toContain(`[data-cdl-palette="${palette}"]`);
      expect(subtitle?.selector, palette).toContain(`[data-cdl-palette="${palette}"]`);
    }
  });

  it("端末は同梱した Variable 等幅書体を先頭に置き、題を 25・中心枠を 1・光を 10 にする", () => {
    const family = rules.find(({ selector, body }) =>
      selector.includes('[data-cdl-palette="terminal"]') &&
      selector.includes('data-cdl-node="営業所の階層-chart"') &&
      selector.includes('data-cdl-node="再配達を減らす-chart"') &&
      body.includes('"JetBrains Mono Variable", "JetBrains Mono", "M PLUS 1 Code", "SF Mono", Menlo, Monaco, "Osaka-Mono", ui-monospace, monospace'));
    const title = rules.find(({ selector, body }) =>
      selector.includes('[data-cdl-palette="terminal"]') &&
      selector.includes('data-cdl-role="tree-node-title"') &&
      selector.includes('data-cdl-role="mind-root-title"') &&
      selector.includes('data-cdl-role="mind-box-title"') &&
      body.includes("font-size: 25px") &&
      body.includes("font-weight: 700") &&
      body.includes("drop-shadow(0 0 10px rgb(74 222 128 / 35%))"));
    const root = rules.find(({ selector, body }) =>
      selector.includes('[data-cdl-palette="terminal"]') &&
      selector.includes('data-cdl-node="再配達を減らす-chart"') &&
      selector.includes('data-cdl-role="mind-root"') &&
      body.includes("stroke-width: 1px"));

    expect(family).toBeDefined();
    expect(family?.body).toContain("-webkit-font-smoothing: antialiased");
    expect(title).toBeDefined();
    expect(root).toBeDefined();
  });

  it("電飾は矢じりの光を外し、札と題へ見本の三段光・二段光を戻す", () => {
    const arrowhead = rules.find(({ selector, body }) =>
      selector.includes('[data-cdl-palette="neon"]') &&
      selector.includes('data-cdl-node="営業所の階層-chart"') &&
      selector.includes('data-cdl-role="tree-edge-head"') &&
      body.includes("filter: none"));
    const frame = rules.find(({ selector, body }) =>
      selector.includes('[data-cdl-palette="neon"]') &&
      selector.includes('data-cdl-role="tree-node"') &&
      selector.includes('data-cdl-role="mind-root"') &&
      selector.includes('data-cdl-role="mind-box"') &&
      body.includes("stroke-width: 2px") &&
      body.includes("rgb(10 8 18 / 94%)") &&
      body.includes("drop-shadow(0 0 24px rgb(255 46 151 / 22%))"));
    const title = rules.find(({ selector, body }) =>
      selector.includes('[data-cdl-palette="neon"]') &&
      selector.includes('data-cdl-role="tree-node-title"') &&
      selector.includes('data-cdl-role="mind-root-title"') &&
      body.includes("font-weight: 800") &&
      body.includes("drop-shadow(0 0 12px rgb(255 46 151 / 60%))"));

    expect(arrowhead).toBeDefined();
    expect(frame).toBeDefined();
    expect(title).toBeDefined();
  });

  it("図録と浮彫の階層・放射の札は枠の値と幅を共に 0 にする", () => {
    const borderless = rules.find(({ selector, body }) =>
      selector.includes('[data-cdl-palette="catalog"]') &&
      selector.includes('[data-cdl-palette="relief"]') &&
      selector.includes('data-cdl-node="営業所の階層-chart"') &&
      selector.includes('data-cdl-node="再配達を減らす-chart"') &&
      body.includes("stroke: none") &&
      body.includes("stroke-width: 0"));
    expect(borderless).toBeDefined();
  });

  it("浮彫の木は枝と同じ系列色の不透明な矢じりにし、字を札の中央へ下げる", () => {
    const redHead = rules.find(({ selector, body }) =>
      selector.includes('[data-cdl-palette="relief"]') &&
      selector.includes('data-cdl-role="tree-edge-head"') &&
      selector.includes('fill*="--cdl-chart-1"') &&
      body.includes("fill: #c4573c") &&
      body.includes("fill-opacity: 1"));
    const tealHead = rules.find(({ selector, body }) =>
      selector.includes('[data-cdl-palette="relief"]') &&
      selector.includes('data-cdl-role="tree-edge-head"') &&
      selector.includes('fill*="--cdl-chart-2"') &&
      body.includes("fill: #2f7a6e") &&
      body.includes("fill-opacity: 1"));
    const labels = rules.find(({ selector, body }) =>
      selector.includes('[data-cdl-palette="relief"]') &&
      selector.includes('data-cdl-node="営業所の階層-chart"') &&
      selector.includes('data-cdl-role="tree-node-title"') &&
      selector.includes('data-cdl-role="tree-node-subtitle"') &&
      body.includes("translate: 0 3px"));

    expect(redHead).toBeDefined();
    expect(tealHead).toBeDefined();
    expect(labels).toBeDefined();
  });

  it.each([
    ["relief", "dragon-metro-relief-shadow", 'data-cdl-role="chart-slope-line"'],
    ["terminal", "dragon-metro-terminal-glow", 'data-cdl-role="quadrant-point"'],
    ["neon", "dragon-neon-tube", 'data-cdl-role="chart-line"'],
  ] as const)("%s の SVG 相当 role だけへ見本の %s を当てる", (palette, filter, role) => {
    const light = rules.find(({ selector, body }) =>
      selector.includes(`[data-cdl-palette="${palette}"]`) &&
      selector.includes(role) &&
      body.includes(`filter: url(#${filter}) !important`));
    expect(light).toBeDefined();
    expect(light?.selector).not.toContain('data-cdl-role="chart-bar"]');
    expect(light?.selector).not.toContain('data-cdl-role="chart-stacked-bar-slice"');
    expect(light?.selector).not.toContain('data-cdl-role="funnel-proportional-bar"');
    expect(light?.selector).not.toContain('data-cdl-role="gantt-bar"');
  });

  it("題の意匠別の光を確定し、浮彫の題と電飾の HTML 相当の字から見本に無い影を外す", () => {
    const terminalTitle = rules.find(({ selector, body }) =>
      selector.includes('[data-cdl-palette="terminal"]') &&
      selector.includes('data-cdl-role="figure-title"') &&
      body.includes("drop-shadow(0 0 10px rgb(74 222 128 / 35%))"));
    const neonTitle = rules.find(({ selector, body }) =>
      selector.includes('[data-cdl-palette="neon"]') &&
      selector.includes('data-cdl-role="figure-title"') &&
      body.includes("filter: url(#dragon-neon-title-cyan) !important") &&
      !body.includes("drop-shadow") &&
      !body.includes("dragon-neon-tube"));
    const withoutExtraShadow = rules.find(({ selector, body }) =>
      selector.includes('[data-cdl-palette="relief"] [data-cdl-role="figure-title"]') &&
      selector.includes('data-cdl-role="figure-footer-label"') &&
      selector.includes('data-cdl-role="figure-footer-note"') &&
      body.includes("filter: none !important"));
    const tablesWithoutLight = rules.find(({ selector, body }) =>
      selector.includes('[data-cdl-palette="neon"]') &&
      selector.includes('data-cdl-role="chart-pie-table-label"') &&
      selector.includes('data-cdl-role="chart-pie-table-value"') &&
      selector.includes('data-cdl-role="chart-waffle-item-label"') &&
      selector.includes('data-cdl-role="chart-waffle-item-share"') &&
      body.includes("filter: none !important"));
    const chartTextWithTube = rules.filter(({ selector, body }) =>
      selector.includes('[data-cdl-palette="neon"]') &&
      selector.includes("text") &&
      /data-cdl-kind="(?:chart-|funnel-stages|gantt-timeline|journey-map|quadrant-matrix)/u.test(selector) &&
      body.includes("filter: url(#dragon-neon-tube) !important"));

    expect(terminalTitle).toBeDefined();
    expect(neonTitle).toBeDefined();
    expect(withoutExtraShadow).toBeDefined();
    expect(tablesWithoutLight).toBeDefined();
    expect(chartTextWithTube).toEqual([]);
  });

  it("電飾の段・段内札・時間軸札を管色の題と淡い芯の枠へ分け、端末の塗り帯は SVG の光から外す", () => {
    const stageName = rules.find(({ selector, body }) =>
      selector.includes('[data-cdl-palette="neon"]') &&
      selector.includes('data-cdl-role="stage-name"') &&
      body.includes("filter: url(#dragon-neon-title-pink) !important"));
    const nestedName = rules.find(({ selector, body }) =>
      selector.includes('[data-cdl-palette="neon"]') &&
      selector.includes('data-cdl-role="stage-column"') &&
      selector.includes('data-cdl-kind="card"') &&
      selector.includes('data-cdl-role="node-label"') &&
      body.includes("filter: url(#dragon-neon-title-violet) !important"));
    const timelineName = rules.find(({ selector, body }) =>
      selector.includes('[data-cdl-palette="neon"]') &&
      selector.includes('data-cdl-role="timeline-axis"') &&
      selector.includes('data-cdl-lane="timeline-steps"') &&
      selector.includes('data-cdl-role="node-label"') &&
      body.includes("filter: url(#dragon-neon-title-pink) !important"));
    const timelineFrame = rules.find(({ selector, body }) =>
      selector.includes('[data-cdl-palette="neon"]') &&
      selector.includes('data-cdl-role="timeline-axis"') &&
      selector.includes('data-cdl-role="node-body"') &&
      body.includes("fill: rgb(10 8 18 / 94%) !important") &&
      body.includes("stroke: #ffb6db !important") &&
      body.includes("stroke-width: 2px !important") &&
      body.includes("filter: url(#dragon-neon-pink-frame) !important") &&
      body.includes("rx: 16px !important") &&
      body.includes("ry: 16px !important"));
    const stagePalette = rules.find(({ selector, body }) =>
      selector.includes('svg[data-cdl-stage][data-cdl-palette="neon"]') &&
      body.includes("--theme-stage-card-shadow: url(#dragon-neon-violet-frame)") &&
      body.includes("--theme-stage-shadow: url(#dragon-neon-pink-frame)") &&
      body.includes("--theme-stage-card-radius: 16px") &&
      body.includes("--theme-stage-face: rgb(10 8 18 / 94%)"));
    const bands = rules.find(({ selector, body }) =>
      selector.includes('[data-cdl-palette="terminal"]') &&
      selector.includes('data-cdl-role="chart-stacked-bar-slice"') &&
      body.includes("filter: none !important"));

    expect(stageName).toBeDefined();
    expect(nestedName).toBeDefined();
    expect(timelineName).toBeDefined();
    expect(timelineFrame).toBeDefined();
    expect(stagePalette).toBeDefined();
    expect(bands).toBeDefined();
  });
});
