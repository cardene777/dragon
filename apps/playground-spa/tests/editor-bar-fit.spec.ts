/**
 * 操作列が画面に収まっていることの検証 (#1063)。
 *
 * 文字で書いたボタンが 12 個並び、合計 811px に対して操作列の幅は 491px しかなかった。
 * 320px が画面の外にあり、等倍表示と拡大縮小が押せない状態だった
 * (実測 = 1440px 幅で 107px、1280px 幅で 174px、1100px 幅で 208px のはみ出し)。
 *
 * アイコンにすると 1 個 30px になり、10 個で 300px に収まる。
 *
 * ## 検査の作り
 *
 * **「1 つ以上ある」 では守れない**。 選択子を全画面に対して掛けると、 プレビューの操作列を
 * まるごと消しても記法欄の 2 個だけで通る。 操作列の数と、 12 個それぞれの `data-testid` が
 * 1 個ずつ在ることを直接見る。
 */
import { test, expect } from "@playwright/test";

/** 操作列に並ぶ 12 個。 id が変わると e2e が壊れるので、ここを唯一の一覧にする。 */
const 操作 = [
  { id: "editor-share", 名: "共有URL" },
  { id: "editor-export", 名: "エクスポート" },
  { id: "editor-font-scale-down", 名: "文字を小さく" },
  { id: "editor-font-scale-up", 名: "文字を大きく" },
  { id: "editor-diagram-scale-down", 名: "図を縮小" },
  { id: "editor-diagram-scale-up", 名: "図を拡大" },
  { id: "editor-toggle-positions", 名: "位置を表示" },
  { id: "editor-fit", 名: "フィット" },
  { id: "editor-reset", 名: "リセット" },
  { id: "editor-actual-size", 名: "等倍表示" },
  { id: "editor-zoom-out", 名: "縮小" },
  { id: "editor-zoom-in", 名: "拡大" },
] as const;

/** 3 ペインを保つ幅の範囲。 900px 以下は 2 ペインに切り替わる (`editor.css`)。 */
const 幅一覧 = [1440, 1280, 1200, 1100, 1024, 960, 901];

async function openEditor(page: import("@playwright/test").Page, width: number): Promise<void> {
  await page.setViewportSize({ width, height: 900 });
  await page.goto("/editor");
  await page.waitForLoadState("networkidle");
  await page.waitForTimeout(1800);
}

/** 画面にある操作列を全部測る (左 = 記法欄 / 右 = プレビュー)。 */
async function bars(page: import("@playwright/test").Page) {
  return await page.evaluate(() =>
    [...document.querySelectorAll(".v4-editor-bar")].map((bar, i) => ({
      名: i === 0 ? "記法欄" : "プレビュー",
      幅: Math.round(bar.getBoundingClientRect().width),
      // `scrollWidth - clientWidth` が「画面の外に出ている量」
      はみ出し: Math.round(bar.scrollWidth - bar.clientWidth),
    })),
  );
}

for (const width of 幅一覧) {
  test(`画面幅 ${width}px で操作列が収まる`, async ({ page }) => {
    await openEditor(page, width);
    const 列 = await bars(page);
    // 操作列は 2 つある。 数を見ないと、 片方が消えても残った側だけで通る
    expect(列.length, `操作列が ${列.length} 本 (2 本必要)`).toBe(2);
    for (const b of 列) {
      expect(b.はみ出し, `${b.名} が ${b.はみ出し}px はみ出している (幅 ${b.幅}px)`).toBe(0);
    }
  });
}

test("12 個の操作がすべて画面の中にある", async ({ page }) => {
  // 収まっているだけでは足りない。 **消えていないこと** と **切られていないこと** を見る。
  // 親に隠れる形は `scrollWidth` では取れない
  await openEditor(page, 901);
  const 結果 = await page.evaluate((ids) =>
    ids.map((id) => {
      const els = document.querySelectorAll(`[data-testid="${id}"]`);
      if (els.length !== 1) return { id, 件数: els.length, 状態: "件数がおかしい" };
      const el = els[0]!;
      const r = el.getBoundingClientRect();
      if (r.width < 1 || r.height < 1) return { id, 件数: 1, 状態: "大きさが無い" };
      // 画面の外に出ていないか
      if (r.left < 0 || r.top < 0 || r.right > window.innerWidth || r.bottom > window.innerHeight) {
        return { id, 件数: 1, 状態: `画面の外 (left=${Math.round(r.left)} right=${Math.round(r.right)})` };
      }
      // 途中の親に隠れていないか。 中心の点にその要素が居るかで見る
      const 中心 = document.elementFromPoint(Math.round(r.left + r.width / 2), Math.round(r.top + r.height / 2));
      if (!中心 || (!el.contains(中心) && !中心.contains(el))) return { id, 件数: 1, 状態: "何かに隠れている" };
      return { id, 件数: 1, 状態: "ok" };
    }),
    操作.map((o) => o.id),
  );
  const 駄目 = 結果.filter((x) => x.状態 !== "ok");
  expect(駄目, `画面から取れない操作がある: ${JSON.stringify(駄目)}`).toEqual([]);
});

test("操作の名前と説明が id ごとに合っている", async ({ page }) => {
  // アイコンには文字が無い。 名前 (`aria-label`) が無いと読み上げで「ボタン」 としか読まれず、
  // 説明 (`title`) が無いと押す前に何が起きるか分からない。
  //
  // **空でないことだけを見ては足りない**。 `title` を `x` にしても通ってしまうので、
  // どの id にどの名前が付くかを直接照合する
  await openEditor(page, 1440);
  const 実際 = await page.evaluate((ids) =>
    ids.map((id) => {
      const el = document.querySelector(`[data-testid="${id}"]`);
      return {
        id,
        名: el?.getAttribute("aria-label") ?? null,
        説明: (el?.getAttribute("title") ?? "").trim(),
      };
    }),
    操作.map((o) => o.id),
  );

  for (const 期待 of 操作) {
    const 実 = 実際.find((x) => x.id === 期待.id)!;
    expect(実.名, `${期待.id} の名前が違う`).toBe(期待.名);
    // 説明は文面を固定しない (書き直す自由を残す) が、 短すぎるものは説明になっていない
    expect(実.説明.length, `${期待.id} の説明が短すぎる ("${実.説明}")`).toBeGreaterThanOrEqual(6);
  }
});

test("アイコンのボタンが押せる大きさを保っている", async ({ page }) => {
  // 幅を中身任せにすると、 線の少ないアイコンだけ狭くなって押しにくい。 正方形で揃える
  await openEditor(page, 1440);
  const 小さい = await page.evaluate(() =>
    [...document.querySelectorAll(".v4-editor-bar-btn-icon")]
      .map((el) => {
        const r = el.getBoundingClientRect();
        return { 名: el.getAttribute("aria-label") ?? "?", w: Math.round(r.width), h: Math.round(r.height) };
      })
      .filter((x) => x.w < 28 || x.h < 28),
  );
  expect(小さい, `押しにくい大きさのボタンがある: ${JSON.stringify(小さい)}`).toEqual([]);
});

test("似た役割のアイコンが同じ形になっていない", async ({ page }) => {
  // 拡大縮小に見える操作が 5 つある (図そのもの 2 / 表示倍率 2 / 等倍 1)。
  //
  // 実測で **等倍表示と拡大が同じ形だった** = どちらも虫めがね + プラスで、線の長さが
  // 0.4 違うだけ。 4 倍に拡大して並べても見分けが付かなかった。
  await openEditor(page, 1440);
  const 形 = await page.evaluate(() =>
    ["editor-diagram-scale-down", "editor-diagram-scale-up", "editor-actual-size", "editor-zoom-out", "editor-zoom-in"]
      .map((id) => {
        const svg = document.querySelector(`[data-testid="${id}"] svg`);
        // 描いた線をそのまま並べたものを形の指紋にする
        return {
          id,
          指紋: svg ? [...svg.children].map((c) => c.getAttribute("d") ?? c.tagName).join("|") : null,
        };
      }),
  );
  for (const x of 形) expect(x.指紋, `${x.id} のアイコンが無い`).not.toBeNull();
  const 重複 = 形.filter((a, i) => 形.findIndex((b) => b.指紋 === a.指紋) !== i);
  expect(重複.map((x) => x.id), `同じ形のアイコンがある: ${重複.map((x) => x.id).join(", ")}`).toEqual([]);
});

test("狭い画面で名前が省略記号で切れる", async ({ page }) => {
  // 名前は縮む側に置いた。 ただし **省略記号が出ないと、ただ切れただけに見える**。
  // 親が `inline-flex` だと裸の文字には `text-overflow` が効かないので、span で包む
  await openEditor(page, 901);
  const r = await page.evaluate(() => {
    const el = document.querySelector(".v4-editor-bar-file-name");
    if (!el) return null;
    const cs = getComputedStyle(el);
    return {
      省略: cs.textOverflow,
      折返し: cs.whiteSpace,
      切れている: el.scrollWidth > el.clientWidth,
      幅: Math.round(el.getBoundingClientRect().width),
    };
  });
  expect(r, "名前を包む要素が無い").not.toBeNull();
  expect(r!.省略, "省略記号が出ない").toBe("ellipsis");
  expect(r!.折返し, "折り返してしまう").toBe("nowrap");
});

test("狭い画面でも状態の点が潰れない", async ({ page }) => {
  // 名前と一緒に縮めると、 「今つながっているか」 を示す点が 0px になって消える
  await openEditor(page, 901);
  const 点 = await page.evaluate(() => {
    const el = document.querySelector(".v4-editor-live");
    if (!el) return null;
    const r = el.getBoundingClientRect();
    return { w: Math.round(r.width), h: Math.round(r.height) };
  });
  expect(点, "状態の点が無い").not.toBeNull();
  expect(点!.w, `状態の点が潰れている (幅 ${点!.w}px)`).toBeGreaterThanOrEqual(4);
});
