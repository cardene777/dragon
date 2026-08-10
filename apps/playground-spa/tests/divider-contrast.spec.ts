import { test, expect, type Page } from "@playwright/test";

/**
 * 表の区切り線の対比 (#1108)。
 *
 * `cardene777/cdl#423` が `node-row-divider` (名前と列の間の横線) と `node-column-divider`
 * (名前の列と値の列の間の縦線) の 2 役割を出すようになった。 本 repo はこの 2 つに主題ごとの
 * 色を当てる。 当てないと cdl の既定 (灰色) のままで、 どの主題でも同じ色になる。
 *
 * 測るのは **宣言された色** で、 撮った画素ではない。 線は 1.25px しかなく、 撮ると隣の画素と
 * 混ざる。 混色を測ると「指定した色」 より甘くも辛くも出るので、 計算値で判定する
 * (文字の対比を見る `rendered-contrast.spec.ts` が画素を撮るのは、 字形が画素を完全に覆う
 * 大きさだから)。
 */

const BASE = "http://localhost:4323";
const THEMES = ["blueprint", "circuit", "handdrawn", "isometric", "neumorphism", "pinboard"] as const;
const MODES = ["light", "dark"] as const;
/** 行を持つ箱がある見本。 `er` の実体は名前 + 列で、 2 本とも出る唯一の形。 */
const TARGET = { slug: "presets", id: "er-demo" } as const;
const NEED = 3;

type RGBA = { rgb: [number, number, number]; a: number };

function parseColor(v: string): RGBA | null {
  const m = v.match(/-?[\d.]+/g);
  if (!m || m.length < 3) return null;
  return { rgb: [Number(m[0]), Number(m[1]), Number(m[2])], a: m.length > 3 ? Number(m[3]) : 1 };
}

function relLuminance([r, g, b]: [number, number, number]): number {
  // 境界は現行の WCAG が書く 0.04045。 本 repo は 0.04045 が 3 件 / 0.03928 が 2 件と割れて
  // いるので、 現行値かつ多数派に揃える。 2 値の差は暗い側の極端な値でしか効かず、 本 spec の
  // 判定は 12 通りとも変わらない (実測)
  const f = (x: number): number => {
    const c = x / 255;
    return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
}

/** 透過のある線を塗りの上に重ねた実効色。 */
function over(line: RGBA, fill: [number, number, number]): [number, number, number] {
  return [0, 1, 2].map((i) => line.a * line.rgb[i] + (1 - line.a) * fill[i]) as [number, number, number];
}

function contrast(a: [number, number, number], b: [number, number, number]): number {
  const [hi, lo] = [relLuminance(a), relLuminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

async function open(page: Page, theme: string, mode: string): Promise<void> {
  await page.goto(`${BASE}/catalog/${TARGET.slug}`);
  await page.waitForSelector(".catalog-list-item", { timeout: 20000 });
  await page.locator(".catalog-list-item").filter({ hasText: TARGET.id }).first().click();
  await page.waitForSelector(`[data-cdl-diagram="${TARGET.id}"]`, { timeout: 20000 });
  // 主題は <html> と 図の <svg> の両方に置く。 svg 側を置かないと 12 通りが同じ画面になる
  await page.evaluate(([t, m]) => {
    document.documentElement.classList.toggle("dark", m === "dark");
    document.documentElement.setAttribute("data-cdl-theme", t);
    document.querySelectorAll("[data-cdl-diagram] svg").forEach((el) => {
      el.setAttribute("data-cdl-theme", t);
    });
  }, [theme, mode] as const);
  await page.waitForFunction(
    (t) => document.querySelector("[data-cdl-diagram] svg")?.getAttribute("data-cdl-theme") === t,
    theme,
    { timeout: 20000 },
  );
  await page.waitForTimeout(600);
}

test.describe("表の区切り線の対比 (#1108)", () => {
  test.describe.configure({ timeout: 120000 });

  for (const theme of THEMES) {
    for (const mode of MODES) {
      test(`${theme} / ${mode} の区切り線が塗りに対して ${NEED}:1 以上`, async ({ page }) => {
        await open(page, theme, mode);
        const 測定 = await page.evaluate((id) => {
          // 塗りが階調 (`url(#...)`) の主題がある。 停止色を全て取り出し、 判定は最も
          // 対比が出ない停止色で行う (一番濃い所で線が沈まないことを確かめる)
          const 塗りを色に = (v: string): string[] => {
            const m = /^url\(["']?#([^"')]+)["']?\)/.exec(v);
            if (!m) return [v];
            const grad = document.getElementById(m[1]);
            if (!grad) return [];
            return [...grad.querySelectorAll("stop")].map((s) => getComputedStyle(s).stopColor);
          };
          const root = document.querySelector(`[data-cdl-diagram="${id}"]`);
          const out: Array<{ node: string; fills: string[]; row: string | null; column: string | null }> = [];
          for (const n of root?.querySelectorAll("[data-cdl-node]") ?? []) {
            const body = n.querySelector('[data-cdl-role="node-body"]');
            const row = n.querySelector('[data-cdl-role="node-row-divider"]');
            const column = n.querySelector('[data-cdl-role="node-column-divider"]');
            if (!body || !row) continue;
            out.push({
              node: n.getAttribute("data-cdl-node") ?? "",
              fills: 塗りを色に(getComputedStyle(body).fill),
              row: getComputedStyle(row).stroke,
              column: column ? getComputedStyle(column).stroke : null,
            });
          }
          return out;
        }, TARGET.id);

        // 前提 = 区切り線を持つ箱が実際にあること。 0 件なら以下の判定が空回りする
        expect(測定.length, "区切り線を持つ箱の数").toBeGreaterThan(0);

        const 不足: string[] = [];
        for (const m of 測定) {
          const fills = m.fills.map(parseColor).filter((v): v is RGBA => v !== null);
          const row = parseColor(m.row ?? "");
          if (fills.length === 0 || !row) {
            不足.push(`${m.node} の色を読めない (塗り=${m.fills.join(" / ")} 線=${m.row})`);
            continue;
          }
          // 階調は停止色ごとに測り、 最も対比が出ない所で判定する
          let c = Infinity;
          let 最悪 = "";
          for (const f of fills) {
            const v = contrast(over(row, f.rgb), f.rgb);
            if (v < c) {
              c = v;
              最悪 = `rgb(${f.rgb.join(",")})`;
            }
          }
          if (c < NEED) {
            不足.push(`${m.node} の横線は ${NEED}:1 が要るが ${c.toFixed(2)}:1 (線=${m.row} 塗り=${最悪})`);
          }
          // 2 本は 1 組の表なので同じ色で描く。 片方だけ主題色になると組に見えない
          if (m.column !== null && m.column !== m.row) {
            不足.push(`${m.node} の縦線が横線と違う色 (縦=${m.column} 横=${m.row})`);
          }
        }
        expect(不足, 不足.join("\n")).toEqual([]);
      });
    }
  }

  test("cdl の既定色のまま残っている主題が無い", async ({ page }) => {
    // 主題ごとの指定が 1 つでも抜けると、 その主題だけ cdl の既定 (灰色) に落ちる。
    // 上の 12 件は対比しか見ないので、 既定色でも通ってしまう主題があり得る
    const 既定 = "rgb(126, 132, 142)";
    const 残り: string[] = [];
    for (const theme of THEMES) {
      await open(page, theme, "light");
      const 色 = await page.evaluate((id) => {
        const row = document.querySelector(`[data-cdl-diagram="${id}"] [data-cdl-role="node-row-divider"]`);
        return row ? getComputedStyle(row).stroke : null;
      }, TARGET.id);
      if (色 === 既定) 残り.push(theme);
    }
    expect(残り, `${残り.join(" / ")} が cdl の既定色のまま`).toEqual([]);
  });
});
