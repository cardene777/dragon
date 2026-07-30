import { test, expect, type Page } from "@playwright/test";

/**
 * GH #889 = edge の tone が線の色に出ることを画面で確かめる。
 *
 * 色は cdl ではなく本 app の CSS が決める (CAR-643 = cdl は形だけ / dragon が見た目)。
 * 以前は theme ごとに 1 色を `!important` で焼き付けていたため、 cdl が tone を渡しても
 * 画面では全 edge が同じ色になっていた。 したがって「cdl の属性」 ではなく
 * 「画面で解決された色」 を測る必要がある。
 *
 * 測るのは 3 つ。
 *   1. 6 tone が別々の色になる (因果の向きが線から読める)
 *   2. 紙に対する対比が 4.5:1 以上 (線が薄くて追えない状態にならない)
 *   3. 隣り合う色が見分けられる (ΔE 15 以上、 暗くして同じ明度に揃うと accent と info が潰れる)
 *
 * 紙の色は画面から読む。 catalog は明暗どちらでも cream、 editor は明暗で別なので、
 * 4 通り (catalog / editor × 明 / 暗) を回す。
 */

const TONES = ["accent", "teal", "success", "error", "warning", "info"] as const;

/** 対比の下限。 文字の基準に合わせる (図形の基準 3:1 より厳しい側を採る)。 */
const MIN_CONTRAST = 4.5;
/** 色の見分けの下限。 ΔE 10 未満は並べても判別しづらい。 */
const MIN_DELTA_E = 15;

type Rgb = [number, number, number];

function parseRgb(s: string): Rgb {
  const m = s.match(/\d+(\.\d+)?/g);
  if (!m || m.length < 3) throw new Error(`色として読めない: ${s}`);
  return [Number(m[0]), Number(m[1]), Number(m[2])];
}

function linear(c: number): number {
  const v = c / 255;
  return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
}

function luminance([r, g, b]: Rgb): number {
  return 0.2126 * linear(r) + 0.7152 * linear(g) + 0.0722 * linear(b);
}

function contrast(a: Rgb, b: Rgb): number {
  const la = luminance(a);
  const lb = luminance(b);
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
}

/** stroke-opacity を掛けた後の実際に見える色。 */
function applyOpacity(fg: Rgb, bg: Rgb, alpha: number): Rgb {
  return [0, 1, 2].map((i) => fg[i]! * alpha + bg[i]! * (1 - alpha)) as Rgb;
}

function toLab([r, g, b]: Rgb): [number, number, number] {
  const R = linear(r);
  const G = linear(g);
  const B = linear(b);
  const x = (R * 0.4124 + G * 0.3576 + B * 0.1805) / 0.95047;
  const y = R * 0.2126 + G * 0.7152 + B * 0.0722;
  const z = (R * 0.0193 + G * 0.1192 + B * 0.9505) / 1.08883;
  const f = (t: number) => (t > 0.008856 ? Math.cbrt(t) : 7.787 * t + 16 / 116);
  return [116 * f(y) - 16, 500 * (f(x) - f(y)), 200 * (f(y) - f(z))];
}

function deltaE(a: Rgb, b: Rgb): number {
  const A = toLab(a);
  const B = toLab(b);
  return Math.hypot(A[0] - B[0], A[1] - B[1], A[2] - B[2]);
}

/**
 * 画面上の edge を tone ごとに複製して、 CSS が解決する色を読む。
 *
 * 1 つの図に 6 tone 全部が出ることは無いため、 実在する edge を複製して tone だけ差し替える。
 * CSS の selector は theme の祖先と `[data-cdl-tone]` で決まるので、 同じ SVG 内に複製すれば
 * 本番と同じ経路で解決される。
 */
async function readToneColors(
  page: Page,
): Promise<{ paper: string; tones: Record<string, { stroke: string; opacity: number; head: string | null }> }> {
  return page.evaluate((tones) => {
    const src = document.querySelector("[data-cdl-edge]");
    if (!src) throw new Error("edge が 1 本も無い");
    let el: HTMLElement | null = src.closest("svg")?.parentElement ?? null;
    let paper: string | null = null;
    while (el && !paper) {
      const c = getComputedStyle(el).backgroundColor;
      if (c && c !== "rgba(0, 0, 0, 0)" && c !== "transparent") paper = c;
      el = el.parentElement;
    }
    if (!paper) throw new Error("紙の色が読めない");
    const out: Record<string, { stroke: string; opacity: number; head: string | null }> = {};
    for (const tone of tones) {
      const clone = src.cloneNode(true) as Element;
      clone.setAttribute("data-cdl-tone", tone);
      clone.setAttribute("data-cdl-active", "false");
      // 元 edge が光っていると不透明度 0.95 のまま複製される。 光っていない側の値を明示する。
      clone.querySelector('[data-cdl-role="edge-line"]')?.setAttribute("stroke-opacity", "0.9");
      src.parentElement!.appendChild(clone);
      const line = clone.querySelector('[data-cdl-role="edge-line"]');
      const head = clone.querySelector('[data-cdl-role="edge-arrowhead"]');
      if (!line) throw new Error(`${tone} の線が無い`);
      const cs = getComputedStyle(line);
      out[tone] = {
        stroke: cs.stroke,
        opacity: Number(cs.strokeOpacity),
        head: head ? getComputedStyle(head).fill : null,
      };
      clone.remove();
    }
    return { paper, tones: out };
  }, TONES as unknown as string[]);
}

async function open(page: Page, path: string, dark: boolean): Promise<void> {
  await page.goto(path);
  await page.waitForLoadState("networkidle");
  await page.evaluate((d) => document.documentElement.classList.toggle("dark", d), dark);
  await page.waitForTimeout(1500);
}

const SCREENS = [
  { name: "catalog", path: "/catalog/interactive" },
  { name: "editor", path: "/editor" },
] as const;

test.use({ viewport: { width: 1500, height: 1000 } });

for (const screen of SCREENS) {
  for (const dark of [false, true]) {
    const label = `${screen.name} / ${dark ? "暗い画面" : "明るい画面"}`;

    test(`${label}: 6 tone が別々の色になる`, async ({ page }) => {
      await open(page, screen.path, dark);
      const { tones } = await readToneColors(page);
      const strokes = TONES.map((t) => tones[t]!.stroke);
      expect(new Set(strokes).size, `色が重複している: ${strokes.join(" / ")}`).toBe(TONES.length);
    });

    test(`${label}: 紙に対する対比が ${MIN_CONTRAST}:1 以上`, async ({ page }) => {
      await open(page, screen.path, dark);
      const { paper, tones } = await readToneColors(page);
      const bg = parseRgb(paper);
      const low: string[] = [];
      for (const t of TONES) {
        const v = tones[t]!;
        const r = contrast(applyOpacity(parseRgb(v.stroke), bg, v.opacity), bg);
        if (r < MIN_CONTRAST) low.push(`${t} ${r.toFixed(2)} (${v.stroke} on ${paper})`);
      }
      expect(low, `対比が足りない tone:\n${low.join("\n")}`).toHaveLength(0);
    });

    test(`${label}: 隣り合う色が見分けられる (ΔE ${MIN_DELTA_E} 以上)`, async ({ page }) => {
      await open(page, screen.path, dark);
      const { tones } = await readToneColors(page);
      const close: string[] = [];
      for (let i = 0; i < TONES.length; i++) {
        for (let j = i + 1; j < TONES.length; j++) {
          const a = TONES[i]!;
          const b = TONES[j]!;
          const d = deltaE(parseRgb(tones[a]!.stroke), parseRgb(tones[b]!.stroke));
          if (d < MIN_DELTA_E) close.push(`${a} / ${b} ΔE ${d.toFixed(1)}`);
        }
      }
      expect(close, `見分けづらい組:\n${close.join("\n")}`).toHaveLength(0);
    });

    test(`${label}: 矢頭も線と同じ色になる`, async ({ page }) => {
      await open(page, screen.path, dark);
      const { tones } = await readToneColors(page);
      const mismatch: string[] = [];
      for (const t of TONES) {
        const v = tones[t]!;
        if (v.head === null) continue;
        if (v.head !== v.stroke) mismatch.push(`${t}: 線 ${v.stroke} / 矢頭 ${v.head}`);
      }
      expect(mismatch, `線と矢頭の色が違う:\n${mismatch.join("\n")}`).toHaveLength(0);
    });
  }
}

test("実在する edge も tone の色で描かれる (複製ではなく本物で確かめる)", async ({ page }) => {
  // interactive-ab-test = info (対照群へ) と success (処理群へ) の 2 本を持つ図。
  await open(page, "/catalog/interactive", false);
  const seen = await page.evaluate(() => {
    const out: Array<{ tone: string; stroke: string; opacity: number }> = [];
    for (const g of document.querySelectorAll("[data-cdl-edge]")) {
      const tone = g.getAttribute("data-cdl-tone");
      const line = g.querySelector('[data-cdl-role="edge-line"]');
      if (!tone || !line) continue;
      const cs = getComputedStyle(line);
      out.push({ tone, stroke: cs.stroke, opacity: Number(cs.strokeOpacity) });
    }
    return out;
  });
  expect(seen.length, "edge が読めていない").toBeGreaterThan(0);
  // tone が 2 種類以上あるなら、 色も 2 種類以上になる (以前は全部同じ色だった)
  const tones = new Set(seen.map((s) => s.tone));
  if (tones.size > 1) {
    expect(new Set(seen.map((s) => s.stroke)).size).toBeGreaterThan(1);
  }
  // 灰色に落ちていない = 以前の焼き付け色 (#6d3f18 / #f0b840) が残っていない
  for (const s of seen) {
    expect(s.stroke).not.toBe("rgb(109, 63, 24)");
    expect(s.stroke).not.toBe("rgb(240, 184, 64)");
  }
});
