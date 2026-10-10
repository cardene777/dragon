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

  it("手描きの内訳と升目を模様にせず、漏斗だけを斜線にする", () => {
    const patterned = rules.filter(({ body }) => body.includes("url(#dragon-sketch-pen)"));
    expect(patterned.some(({ selector }) => selector.includes('chart-stacked-bar-slice'))).toBe(false);
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

  it("端末は OS の等幅候補へ落とし、題を 25・中心枠を 1・光を 10 にする", () => {
    const family = rules.find(({ selector, body }) =>
      selector.includes('[data-cdl-palette="terminal"]') &&
      selector.includes('data-cdl-node="営業所の階層-chart"') &&
      selector.includes('data-cdl-node="再配達を減らす-chart"') &&
      body.includes('"JetBrains Mono", "M PLUS 1 Code", "SF Mono", Menlo, Monaco, "Osaka-Mono", ui-monospace, monospace'));
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
});
