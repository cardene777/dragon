/**
 * Kind geometry check proof (層 3 の 実型証明 harness)。
 *
 * kind-geometry-check.spec.ts の各 axis が「本当に bug を検知できるか」 を
 * 意図的な DOM mutation で確認する negative-path test。
 *
 * 動機 = 前回の gantt arrow axis は bug 注入しても検知しない dead axis になっていた。
 * axis の実効性を CI で構造的に保証するため、 各 axis に対応する proof を書く。
 *
 * 各 test = 「(1) axis 検査ロジックを inline 再実装 (2) mutate 前 = clean で検査
 * 結果 OK を確認 (3) mutate 後 = fault 注入で検査結果 FAIL を確認」。
 *
 * これで 「axis の検査ロジック自体が壊れて全 pass」 に なる dead axis の回帰を防ぐ。
 *
 * LLM 不要、 pure DOM inspection + assertion。
 */
import { test, expect } from "@playwright/test";

/**
 * gantt の依存の矢印が出るまで待つ (#1357)。
 *
 * 帯を起点から描く段では、矢印は **帯が出揃ってから** 出る (`cdl` の `draw` の仕様)。
 * 固定の待ち時間だと、描いている途中を読んで 0 件になる。
 *
 * 上限を置いて待ち、出なければそのまま先へ進む = 「1 件以上」 の assert がそこで落ちるので、
 * 本当に出ない形は見逃さない。
 */
async function 矢印が出るまで待つ(page: import("@playwright/test").Page): Promise<void> {
  for (let i = 0; i < 60; i++) {
    const n = await page.evaluate(
      () => document.querySelectorAll('[data-cdl-role="gantt-arrow"] path').length,
    );
    if (n > 0) return;
    await page.waitForTimeout(100);
  }
}

test.describe("kind geometry proof (層 3 axis の実効性証明)", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("catalog/presets", { waitUntil: "networkidle" });
    await page.waitForTimeout(800);
  });

  test("[proof] gantt arrow head gap axis = 食い込み状態を注入すると検知される", async ({ page }) => {
    await page.getByText("ガントチャート", { exact: true }).first().click();
    await page.waitForTimeout(1000);
    // 帯を起点から描く段では、矢印は帯が出揃ってから出る (#1357)
    await 矢印が出るまで待つ(page);

    // 検査ロジックを inline 再実装 (kind-geometry-check.spec.ts と同一)
    const checkGap = async () => {
      return await page.evaluate(() => {
        const bars: Array<{ left: number; top: number; height: number }> = [];
        document.querySelectorAll('[data-cdl-role="gantt-bar"]').forEach((b) => {
          bars.push({
            left: parseFloat(b.getAttribute("x") ?? "0"),
            top: parseFloat(b.getAttribute("y") ?? "0"),
            height: parseFloat(b.getAttribute("height") ?? "0"),
          });
        });
        const violations: number[] = [];
        document.querySelectorAll('[data-cdl-role="gantt-arrow"] path').forEach((p) => {
          const d = p.getAttribute("d") ?? "";
          if (!d.includes("Z")) return;
          const tokens = d.trim().split(/[\s,]+/);
          const pts: Array<{ x: number; y: number }> = [];
          for (let i = 0; i < tokens.length; i++) {
            const t = tokens[i];
            if (t === "M" || t === "L") {
              // 続く 2 つが無い = 並びの終わり
              const xs = tokens[i + 1];
              const ys = tokens[i + 2];
              if (xs === undefined || ys === undefined) break;
              pts.push({ x: parseFloat(xs), y: parseFloat(ys) });
              i += 2;
            }
          }
          if (pts.length !== 3) return;
          const tipRight = Math.max(...pts.map((p) => p.x));
          const tipY = pts.reduce((sum, p) => sum + p.y, 0) / pts.length;
          const targetBar = bars.find((b) => tipY >= b.top && tipY <= b.top + b.height);
          if (targetBar) {
            const gap = targetBar.left - tipRight;
            if (gap < 4) violations.push(gap);
          }
        });
        return violations;
      });
    };

    // clean 状態 = 違反 0 件
    const cleanViolations = await checkGap();
    expect(cleanViolations, "clean 状態で違反 0 件").toHaveLength(0);

    // 食い込み状態を DOM に注入 = arrow head 三角形を右に 20px 移動 (bar 内埋没)
    await page.evaluate(() => {
      document.querySelectorAll('[data-cdl-role="gantt-arrow"] path').forEach((p) => {
        const d = p.getAttribute("d") ?? "";
        if (!d.includes("Z")) return;
        // path の全 x 座標に +20 加算
        const shifted = d.replace(/([ML])\s+([\d.]+)\s+([\d.]+)/g, (_, cmd, x, y) => `${cmd} ${parseFloat(x) + 20} ${y}`);
        p.setAttribute("d", shifted);
      });
    });

    const injectedViolations = await checkGap();
    expect(
      injectedViolations.length,
      `bug 注入後 = 検知が実効性ある証明として violation が >= 1 (実測 ${injectedViolations.length} 件): ${JSON.stringify(injectedViolations)}`,
    ).toBeGreaterThanOrEqual(1);
  });

  test("[proof] funnel monotonic 幅減少 axis = 逆順に並替えると検知される", async ({ page }) => {
    await page.getByText("ファネル図", { exact: true }).first().click();
    await page.waitForTimeout(1000);

    const checkMonotonic = async () => {
      return await page.evaluate(() => {
        const w: number[] = [];
        document.querySelectorAll('[data-cdl-role="funnel-stage"]').forEach((el) => {
          w.push((el as SVGGraphicsElement).getBBox().width);
        });
        const violations: string[] = [];
        for (let i = 1; i < w.length; i++) {
          const 今 = w[i];
          const 前 = w[i - 1];
          if (今 === undefined || 前 === undefined) continue;
          if (今 > 前 + 0.5) violations.push(`stage[${i}] w=${今} > stage[${i - 1}] w=${前}`);
        }
        return violations;
      });
    };

    const clean = await checkMonotonic();
    expect(clean, "clean 状態で違反 0").toHaveLength(0);

    // 最後の polygon の幅を「最初より大きく」 なるよう強制拡大
    await page.evaluate(() => {
      const stages = document.querySelectorAll('[data-cdl-role="funnel-stage"]');
      if (stages.length < 2) return;
      const last = stages[stages.length - 1] as SVGPolygonElement | null;
      if (!last) return;
      // 全 point を y は保持したまま x を左端 0 右端 800 に強制展開 = 幅 800 で単調減少違反
      const pts = (last.getAttribute("points") ?? "").split(/\s+/);
      const ys = pts.map((p) => p.split(",")[1] ?? "0");
      const newPoints = [
        `0,${ys[0]}`,
        `800,${ys[1]}`,
        `800,${ys[2]}`,
        `0,${ys[3]}`,
      ].join(" ");
      last.setAttribute("points", newPoints);
    });

    const injected = await checkMonotonic();
    expect(injected.length, `bug 注入後 違反 >= 1`).toBeGreaterThanOrEqual(1);
  });

  test("[proof] chart-line value/axis label 重なり axis = 座標を強制重ねると検知される", async ({ page }) => {
    await page.getByText("折れ線グラフ", { exact: true }).first().click();
    await page.waitForTimeout(1000);

    const checkOverlap = async () => {
      return await page.evaluate(() => {
        const svg = document.querySelector('svg[role="img"]');
        if (!svg) return [];
        const valueLabels: Array<{ x: number; y: number; w: number; h: number; t: string }> = [];
        const axisLabels: Array<{ x: number; y: number; w: number; h: number; t: string }> = [];
        svg.querySelectorAll("text").forEach((t) => {
          const bb = (t as SVGGraphicsElement).getBBox();
          const content = t.textContent ?? "";
          if (/^[\d,]+$/.test(content) && content.includes(",")) {
            valueLabels.push({ x: bb.x, y: bb.y, w: bb.width, h: bb.height, t: content });
          } else if (/^(Jan|Feb|Mar|Apr)$/.test(content)) {
            axisLabels.push({ x: bb.x, y: bb.y, w: bb.width, h: bb.height, t: content });
          }
        });
        const overlaps: string[] = [];
        for (const v of valueLabels) {
          for (const a of axisLabels) {
            if (v.x < a.x + a.w && v.x + v.w > a.x && v.y < a.y + a.h && v.y + v.h > a.y) {
              overlaps.push(`"${v.t}" ∩ axis "${a.t}"`);
            }
          }
        }
        return overlaps;
      });
    };

    const clean = await checkOverlap();
    expect(clean, "clean 状態で重なり 0").toHaveLength(0);

    // 全 value label を強制的に axis 位置 (canvas 下端) に移動 = overlap 誘発
    await page.evaluate(() => {
      const svg = document.querySelector('svg[role="img"]');
      if (!svg) return;
      const janText = Array.from(svg.querySelectorAll("text")).find((t) => t.textContent === "Jan");
      if (!janText) return;
      const janY = janText.getAttribute("y") ?? "0";
      svg.querySelectorAll("text").forEach((t) => {
        const content = t.textContent ?? "";
        if (/^[\d,]+$/.test(content) && content.includes(",")) {
          t.setAttribute("y", janY);
          const janX = janText.getAttribute("x") ?? "0";
          t.setAttribute("x", janX);
        }
      });
    });

    const injected = await checkOverlap();
    expect(injected.length, `bug 注入後 重なり >= 1`).toBeGreaterThanOrEqual(1);
  });

  test("[proof] card text overflow axis = subtitle を極端に長く設定すると検知される", async ({ page }) => {
    await page.getByText("拡張ステート図", { exact: true }).first().click();
    await page.waitForTimeout(1000);

    const checkOverflow = async () => {
      return await page.evaluate(() => {
        const violations: string[] = [];
        document.querySelectorAll("[data-cdl-node]").forEach((g) => {
          const rect = g.querySelector('[data-cdl-role="node-body"]');
          if (!rect) return;
          const cardW = parseFloat(rect.getAttribute("width") ?? "0");
          g.querySelectorAll("text").forEach((t) => {
            const bb = (t as SVGGraphicsElement).getBBox();
            if (bb.x + bb.width > cardW + 4) {
              violations.push(`text "${t.textContent}" endX=${bb.x + bb.width} > cardW=${cardW}`);
            }
          });
        });
        return violations;
      });
    };

    const clean = await checkOverflow();
    expect(clean, "clean 状態で overflow 0").toHaveLength(0);

    // 任意 text を長文に置換 → SVG は truncate しないので溢れる
    await page.evaluate(() => {
      const firstText = document.querySelector('[data-cdl-node] text');
      if (firstText) {
        firstText.textContent = "THIS IS A VERY VERY LONG TEXT THAT WILL DEFINITELY OVERFLOW THE CARD BOUNDS";
      }
    });

    const injected = await checkOverflow();
    expect(injected.length, `bug 注入後 overflow >= 1`).toBeGreaterThanOrEqual(1);
  });

  test("[proof] edge-line fill:none axis = fill を色に変更すると検知される", async ({ page }) => {
    await page.getByText("フローチャート", { exact: true }).first().click();
    await page.waitForTimeout(1000);

    const checkFill = async () => {
      return await page.evaluate(() => {
        const violations: string[] = [];
        document.querySelectorAll('[data-cdl-role="edge-line"]').forEach((el) => {
          const fill = getComputedStyle(el).fill;
          if (!/none|rgba?\(\s*0,\s*0,\s*0,\s*0/.test(fill)) {
            violations.push(fill);
          }
        });
        return violations;
      });
    };

    const clean = await checkFill();
    expect(clean, "clean 状態で fill:#XXX 違反 0").toHaveLength(0);

    // edge-line の fill を強制的に blue に = 「polygon 塗り」 bug 再現
    await page.evaluate(() => {
      document.querySelectorAll('[data-cdl-role="edge-line"]').forEach((el) => {
        (el as SVGElement).style.fill = "#6ab3d8";
      });
    });

    const injected = await checkFill();
    expect(injected.length, `bug 注入後 fill 違反 >= 1`).toBeGreaterThanOrEqual(1);
  });
});
