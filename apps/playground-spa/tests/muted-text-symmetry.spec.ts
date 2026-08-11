/**
 * 薄い文字が明暗どちらでも同じくらい読めることの検証 (#1116)。
 *
 * 以前は明るい側だけ `.pen` の値 (`#8a857a`) のまま残り、 白地に対する対比が 3.67 しか
 * なかった。 暗い側は #1112 で `#77716a` から `#a8a199` へ持ち上げてあり 5.46 ある。
 * 同じ役割の文字が明暗で倍近く開いていた。
 *
 * ## 変数の値ではなく描かれた文字を測る
 *
 * `--d-text-muted` の値だけを見ると「変数は直したが参照側に届いていない」 形を通す。
 * 実際に描かれた要素の色と、 その要素が乗っている地を辿って測る。
 *
 * ## 宣言した色ではなく重ねた後の色で測る
 *
 * `opacity` を数えないと、 薄い色の上に更に `opacity` を重ねた形を見逃す。 実測で
 * `/catalog/interactive` の読み取り部品が `--d-text-muted` に `opacity: 0.8` を重ねており、
 * 宣言値では 5.47 なのに実際は 3.58 だった (review 指摘、 本 PR で `opacity` 側を外した)。
 *
 * 自分と祖先の `opacity` と、 色自身の alpha を地に重ねてから測る。
 *
 * ## 測る対象が 0 件なら落とす
 *
 * 選択の仕方が実装とずれると、 何も確かめずに通る。 各画面で 1 件以上取れることを
 * 先に見る。
 *
 * **上の帯は数に入れない**。 全画面に出るので、 帯の中の薄い文字だけで件数条件を
 * 満たしてしまい、 画面固有の薄い文字を 1 件も測れなくても通る (実測 = `/docs` で
 * 取れた 2 件がどちらも帯の中だった)。
 */
import { test, expect } from "@playwright/test";

/** sRGB → 相対輝度 (WCAG)。 */
function luminance(rgb: number[]): number {
  const [r, g, b] = rgb.map((c) => {
    const s = c / 255;
    return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r! + 0.7152 * g! + 0.0722 * b!;
}

const 対比 = (a: number[], b: number[]): number => {
  const [hi, lo] = [luminance(a), luminance(b)].sort((p, q) => q - p);
  return (hi! + 0.05) / (lo! + 0.05);
};

/**
 * その画面で `--d-text-muted` が実際に当たっている文字を集め、 地との対比を返す。
 *
 * 地は透けている親を遡って辿る。 半透明の地は「透けている」 とみなして更に遡る
 * (合成せずに扱うと実際より明るい / 暗い地で測ることになる)。
 */
async function 薄い文字の対比(page: import("@playwright/test").Page): Promise<
  { 文: string; 色: number[]; 地: number[]; 実効: number }[]
> {
  return await page.evaluate(() => {
    const 数値 = (s: string): number[] | null => {
      const m = s.match(/[\d.]+/g);
      return m && m.length >= 3 ? m.slice(0, 3).map(Number) : null;
    };
    const 薄 = getComputedStyle(document.documentElement).getPropertyValue("--d-text-muted").trim();
    // 変数を解決した実 rgb を得る (hex のままでは computed color と比べられない)
    const probe = document.createElement("span");
    probe.style.color = 薄;
    document.body.appendChild(probe);
    const 薄rgb = getComputedStyle(probe).color;
    probe.remove();
    const 目標 = 数値(薄rgb);
    if (!目標) return [];

    const out: { 文: string; 色: number[]; 地: number[]; 実効: number }[] = [];
    for (const e of document.querySelectorAll("*")) {
      const 直 = [...e.childNodes]
        .filter((n) => n.nodeType === 3 && n.textContent?.trim())
        .map((n) => n.textContent!.trim())
        .join("");
      if (!直) continue;
      // 全画面に出る上の帯は数に入れない (帯だけで件数条件を満たさないため)
      if (e.closest("header.v4-nav")) continue;
      const c = getComputedStyle(e);
      const box = e.getBoundingClientRect();
      if (box.width < 2 || box.height < 2) continue;
      if (c.visibility === "hidden" || c.display === "none" || Number(c.opacity) < 0.15) continue;
      const 色 = 数値(c.color);
      if (!色 || 色.some((v, i) => v !== 目標[i])) continue;

      let 地: number[] | null = null;
      let n: Element | null = e;
      while (n && n !== document.documentElement) {
        const v = getComputedStyle(n).backgroundColor;
        const a = v.match(/[\d.]+/g);
        // 不透明な地だけを採る。 半透明は透けているので更に遡る
        if (a && (a.length < 4 || Number(a[3]) > 0.9)) {
          地 = a.slice(0, 3).map(Number);
          break;
        }
        n = n.parentElement;
      }
      if (!地) 地 = 数値(getComputedStyle(document.documentElement).backgroundColor);
      if (!地) continue;

      // **宣言した色のままでは測れない**。 効くものを 3 つとも数えて地に重ねる。
      //
      // 1. 色自身の alpha (`rgba(...)`)
      // 2. 要素と祖先の `opacity` — 薄い色に更に重ねると二重に薄まる
      // 3. 祖先は `documentElement` 自身も含めて遡る (root に掛けた分を見落とさない)
      const alpha = (c.color.match(/[\d.]+/g) ?? []).length === 4
        ? Number((c.color.match(/[\d.]+/g) as string[])[3])
        : 1;
      let 実効 = alpha;
      let a: Element | null = e;
      while (a) {
        実効 *= Number(getComputedStyle(a).opacity || 1);
        if (a === document.documentElement) break;
        a = a.parentElement;
      }
      const 重ねた = [0, 1, 2].map((i) => 色[i]! * 実効 + 地[i]! * (1 - 実効));
      out.push({ 文: 直.slice(0, 24), 色: 重ねた, 地, 実効 });
    }
    return out;
  });
}

async function 開く(
  page: import("@playwright/test").Page,
  path: string,
  暗い: boolean,
  部品?: string,
): Promise<void> {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto(path);
  await page.waitForLoadState("networkidle");
  await page.evaluate((d) => {
    document.documentElement.classList.toggle("dark", d);
  }, 暗い);
  await page.waitForTimeout(1200);
  if (!部品) {
    await 動きを止める(page);
    return;
  }
  // 一覧の中の選択は URL に出ないので押して開く (`CategoryPage` が state で持つ)
  const 押せた = await page.evaluate((id) => {
    const 札 = [...document.querySelectorAll(".catalog-list-item")].find((e) =>
      (e.textContent ?? "").includes(id),
    );
    if (!札) return false;
    (札 as HTMLElement).scrollIntoView({ block: "center" });
    (札 as HTMLElement).click();
    return true;
  }, 部品);
  expect(押せた, `${path} に ${部品} が見つからない (一覧の中身が変わった)`).toBe(true);
  await page.waitForTimeout(2000);
  await 動きを止める(page);
}

/**
 * 画面の動きを止める。
 *
 * 本検査は 4 並列の中で 26 秒走り、 その間ずっと動く図を開いたままにする。 他の worker で
 * 寸法を測る検査が走ると CPU を奪われて標本を取り損ね、 図が壊れていないのに落ちる
 * (実測 = 本 file を外すと 383 件が安定して通り、 入れると `row-bounds-offset` /
 * `pattern-validate-process` が回ごとに入れ替わって落ちた)。
 *
 * 測る対象は動かない札の文字なので、 止めても値は変わらない。 `animation: none` ではなく
 * `paused` にするのは、 途中の状態を保ったまま止めるため (`none` は初期状態へ戻すので、
 * 動きの中で色が変わる要素を実際とは違う色で測ることになる)。
 */
async function 動きを止める(page: import("@playwright/test").Page): Promise<void> {
  await page.addStyleTag({
    content: `*, *::before, *::after {
      animation-play-state: paused !important;
      transition: none !important;
    }`,
  });
}

/**
 * 薄い文字が出る画面。 括弧内は上の帯を除いた実測件数。
 *
 * `/catalog/interactive` の読み取り部品は、 薄い色に `opacity` を重ねていた実例
 * (review 指摘)。 一覧から押して開かないと到達しないので `部品` を指定する。
 *
 * **`/docs` は入れない**。 帯の外に薄い文字を 1 つも持たないため (実測 0 件)、
 * 入れると件数条件を満たせない。
 */
const 画面 = [
  { path: "/" }, // 35 件
  { path: "/catalog/presets" }, // 26 件
  { path: "/editor" }, // 90 件
  { path: "/contribute" }, // 5 件
  { path: "/catalog/interactive", 部品: "interactive-dynamic-readouts" }, // 135 件
] as const;

for (const 暗い of [false, true]) {
  const 名 = 暗い ? "暗い" : "明るい";
  test(`${名}画面で薄い文字が地の上で読める`, async ({ page }) => {
    for (const { path, 部品 } of 画面.map((s) => ({ 部品: undefined, ...s }))) {
      await 開く(page, path, 暗い, 部品);
      const 件 = await 薄い文字の対比(page);
      expect(件.length, `${path} で薄い文字を 1 つも測れていない (選択子が実装とずれた)`).toBeGreaterThan(0);
      for (const { 文, 色, 地, 実効 } of 件) {
        const v = 対比(色, 地);
        expect(
          v,
          `${名}画面 ${path} の「${文}」 が地に溶ける (重ねた後 ${色.map(Math.round)} / 地 ${地} / 実効 ${実効.toFixed(2)} / 対比 ${v.toFixed(2)})`,
        ).toBeGreaterThanOrEqual(4.5);
      }
    }
  });
}

test("薄い文字の読みやすさが明暗で揃っている", async ({ page }) => {
  // 本 Issue の中身。 片側だけを直しても落ちないと、 同じ非対称がまた作られる。
  //
  // **地が明暗で違うので色そのものは比べられない**。 地に対する対比で比べる。
  const 測る = async (暗い: boolean): Promise<number> => {
    await 開く(page, "/catalog/presets", 暗い);
    const 件 = await 薄い文字の対比(page);
    expect(件.length, `${暗い ? "暗い" : "明るい"}側で薄い文字を測れていない`).toBeGreaterThan(0);
    // 面の上に乗るものが多数派なので中央値を採る (端の 1 件に引きずられない)
    const v = 件.map(({ 色, 地 }) => 対比(色, 地)).sort((a, b) => a - b);
    return v[Math.floor(v.length / 2)]!;
  };
  const 明 = await 測る(false);
  const 暗 = await 測る(true);
  expect(
    Math.abs(明 - 暗),
    `薄い文字の読みやすさが明暗で開いている (明 ${明.toFixed(2)} / 暗 ${暗.toFixed(2)})`,
  ).toBeLessThanOrEqual(1.5);
});
