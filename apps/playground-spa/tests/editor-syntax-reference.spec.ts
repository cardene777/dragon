import { test, expect } from "@playwright/test";

/**
 * 記法一覧が「実際に受け付ける値」 を出しているかを見る。
 *
 * 一覧を手書きすると、 記法に値が増えた時に一覧だけが取り残される。 そこで一覧は記法側の
 * 実装から値を引いている。 その配線が生きているかを、 実際に書ける記述で確かめる。
 *
 * 測るのは「一覧が表示されたか」 ではなく、 **載っている値が実際に書けるか**。
 */

const openEditor = async (page: import("@playwright/test").Page): Promise<void> => {
  await page.goto("/editor");
  await page.waitForSelector('[data-testid="editor-preview-stage"]');
  await page.waitForTimeout(600);
};

/**
 * DSL を書き換える。 共有 URL の経路 (`#s=<符号化>`) を使う。
 *
 * 本番に test 専用の書き込み口を足すと、 出荷物に test のための穴が残る。 共有 URL は
 * user が実際に使う経路なので、 それを通す。
 */
const setDsl = async (page: import("@playwright/test").Page, src: string): Promise<void> => {
  const encoded = await page.evaluate((s) => btoa(unescape(encodeURIComponent(s))), src);
  await page.goto(`/editor#s=${encoded}`);
  await page.waitForSelector('[data-testid="editor-preview-stage"]');
  await page.waitForTimeout(900);
};

const dsl = (page: import("@playwright/test").Page): Promise<string> =>
  page.evaluate(() => (window as unknown as { __cdlEditorSrc?: string }).__cdlEditorSrc ?? "");

test("記法タブを開くと一覧が出る", async ({ page }) => {
  await openEditor(page);
  await page.locator('[data-testid="editor-syntax-tab"]').click();
  await expect(page.locator('[data-testid="editor-syntax-panel"]')).toBeVisible();
});

test("載っている図種が実際に書ける", async ({ page }) => {
  await openEditor(page);
  await page.locator('[data-testid="editor-syntax-tab"]').click();
  const types = await page.locator('[data-testid="editor-syntax-types"] code').allTextContents();
  expect(types.length, "図種が 1 つ以上").toBeGreaterThan(0);

  // 一覧の図種をそのまま書いて、 図が出ることを確かめる。
  // 動きの指定は図種によって必須 (`c4` / `class` は無いと組み立てに失敗する) なので付ける。
  for (const type of types.slice(0, 4)) {
    await setDsl(page, `title: "t"\ntype: ${type}\n\nactors:\n  - A\n  - B\n\nflow:\n  - A -> B: "x"\n\nanimation:\n  - step: "s" 1.0s\n    focus: [A, B]\n`);
    const err = await page.locator(".v4-editor-error").count();
    expect(err, `${type} で組み立てに失敗した`).toBe(0);
  }
});

test("載っている箱の種類が実際に書ける", async ({ page }) => {
  await openEditor(page);
  await page.locator('[data-testid="editor-syntax-tab"]').click();
  const kinds = await page.locator('[data-testid="editor-syntax-kinds"] code').allTextContents();
  expect(kinds.length, "種類が 1 つ以上").toBeGreaterThan(0);

  // 未知の種類は部品名として扱われて警告が出る。 一覧の値ならそうならない
  const sample = kinds.slice(0, 6);
  const lines = sample.map((k, i) => `  - N${i}: ${k}`).join("\n");
  await setDsl(page, `title: "t"\ntype: flow\n\nactors:\n${lines}\n\nflow:\n  - N0 -> N1: "x"\n\nanimation:\n  - step: "s" 1.0s\n    focus: [N0, N1]\n`);
  expect(await page.locator(".v4-editor-error").count(), "組み立てに失敗した").toBe(0);
  expect(await page.locator("[data-cdl-node]").count(), "箱が出ない").toBeGreaterThan(0);
});

/** 段に `draw:` を書いた最小の図。 語と図種を別々に渡せる形にして、食い違いも作れるようにする */
const drawDsl = (type: string, word: string): string =>
  `title: "t"\ntype: ${type}\n\nactors:\n  - W1: "180"\n  - W2: "240"\n  - W3: "210"\n\nanimation:\n  - step: "描く" 1.2s\n    draw: ${word}\n`;

/** 組み立ての知らせのうち `draw` に触れているものだけを読む */
const drawNotices = async (page: import("@playwright/test").Page): Promise<string[]> => {
  const all = await page
    .locator('[data-testid="editor-compile-notices"] .v4-editor-notice-text')
    .allTextContents();
  return all.filter((t) => t.includes("draw"));
};

test("載っている描ける図種が実際に効く", async ({ page }) => {
  await openEditor(page);
  await page.locator('[data-testid="editor-syntax-tab"]').click();
  const draws = await page.locator('[data-testid="editor-syntax-draws"] code').allTextContents();
  expect(draws.length, "描ける図種が 1 つ以上 (検査が空振りしていない)").toBeGreaterThan(0);

  // 一覧の語を、同じ名前の図種の段にそのまま書く。 その語が組み立ての対応表に無ければ
  // 「効きません」 の知らせが出る = 一覧だけが先に増えた形をここで捕まえる
  let 確かめた = 0;
  for (const word of draws) {
    await setDsl(page, drawDsl(word, word));
    expect(await page.locator(".v4-editor-error").count(), `${word} で組み立てに失敗した`).toBe(0);
    expect(await page.locator("[data-cdl-node]").count(), `${word} で図が出ない`).toBeGreaterThan(0);
    expect(await drawNotices(page), `${word} が効いていない`).toEqual([]);
    確かめた += 1;
  }
  expect(確かめた, "一覧の語を 1 つも確かめていない").toBe(draws.length);
});

test("効かない形は 2 通りとも知らせる", async ({ page }) => {
  // 陰性対照。 上の検査は「知らせが 0 件」 を見るため、知らせが出ない作りだと恒真になる。
  //
  // **2 通りを別々に見る**。 まとめて 1 通りだけ見ると、片方の分岐を外しても もう片方が
  // 同じ入力で発火して落ちない (実測で `draw-not-honored` を外しても 0 件 FAIL だった)
  await openEditor(page);

  // (1) 描く動きを持たない図種に書いた
  await setDsl(page, drawDsl("flow", "line"));
  expect(await drawNotices(page), "描けない図種で知らせが出ない").toHaveLength(1);

  // (2) 描ける図種だが、語が別の図種を指している
  await setDsl(page, drawDsl("line", "bar"));
  const 食い違い = await drawNotices(page);
  expect(食い違い, "語の食い違いで知らせが出ない").toHaveLength(1);
  expect(食い違い[0], "どう直すかが読めない").toContain("bar");
});

test("載っている色が実際に効く", async ({ page }) => {
  await openEditor(page);
  await page.locator('[data-testid="editor-syntax-tab"]').click();
  const tones = await page.locator('[data-testid="editor-syntax-tones"] .v4-editor-syntax-code').allTextContents();
  expect(tones.length, "色が 1 つ以上").toBeGreaterThan(0);

  const tone = tones.find((t) => t !== "accent") ?? tones[0]!;
  await setDsl(page, `title: "t"\ntype: flow\n\nactors:\n  - A: service ${tone}\n  - B\n\nflow:\n  - A -> B: "x"\n\nanimation:\n  - step: "s" 1.0s\n    focus: [A, B]\n`);
  const node = page.locator('[data-cdl-node]').first();
  await expect(node, "色を指定した箱に印が付く").toHaveAttribute("data-cdl-tone", tone);
});

test("例をクリックすると入力欄に足される", async ({ page }) => {
  await openEditor(page);
  const before = await dsl(page);
  await page.locator('[data-testid="editor-syntax-tab"]').click();
  const row = page.locator('.v4-editor-syntax-row[data-syntax-code]').first();
  const code = await row.getAttribute("data-syntax-code");
  await row.click();
  await page.waitForTimeout(600);
  const after = await dsl(page);
  expect(after, "内容が増える").not.toBe(before);
  expect(after, "押した例が入る").toContain(code!);
});

test("パーツを足すと入れ子なしの行が入る", async ({ page }) => {
  // 一覧の書き方と、 画面が実際に足す行の書き方が食い違うと、 読んだ通りに書けない
  await openEditor(page);
  await page.locator('[data-testid="editor-parts-tab"]').click();
  await page.waitForTimeout(400);
  await page.locator('[data-testid="editor-part-item-parts-achievement"]').click();
  await page.waitForTimeout(900);

  const added = await dsl(page);
  const lines = added.split("\n");
  const headIdx = lines.findIndex((l) => /^\s*- achievement\d*:/.test(l));
  expect(headIdx, `パーツの行が入っていない: ${added.slice(-200)}`).toBeGreaterThan(-1);
  // 変えられる値を縦に並べて出す。 1 行に詰めると色番号が読めない形で並ぶ
  const block = lines.slice(headIdx, headIdx + 3).map((l) => l.trimEnd());
  expect(block[0]!.trim(), `1 件目に番号が付いている: ${block[0]}`).toBe("- achievement:");
  expect(block[1]).toBe("      kind: achievement");
  expect(block[2], "色が出ていない").toMatch(/^\s+色: "#[0-9a-fA-F]{6}"$/);
  expect(added, "入れ子が残っている").not.toContain("{ kind:");
  expect(await page.locator(".v4-editor-error").count(), "組み立てに失敗した").toBe(0);
  expect(await page.locator("[data-overlay-part]").count(), "図に出ていない").toBe(1);
});

test("同じパーツを 2 つ置くと 2 件目に番号が付く", async ({ page }) => {
  await openEditor(page);
  await page.locator('[data-testid="editor-parts-tab"]').click();
  await page.waitForTimeout(400);
  const item = page.locator('[data-testid="editor-part-item-parts-achievement"]');
  await item.click();
  await page.waitForTimeout(700);
  await item.click();
  await page.waitForTimeout(900);

  const heads = (await dsl(page)).split("\n").filter((l) => /^\s*- achievement\d*:/.test(l));
  expect(heads.map((l) => l.trim()), heads.join(" / ")).toEqual([
    "- achievement:",
    "- achievement2:",
  ]);
  expect(await page.locator(".v4-editor-error").count(), "組み立てに失敗した").toBe(0);
});

test("短い形で書いたパーツも図に出る", async ({ page }) => {
  // 生成する行を短くした時、 図に出す側が入れ子の形しか読んでいなかった。 行は入るのに
  // 図には出ない状態になり、 書いた人には理由が分からない。
  //
  // パーツの目録はタブを開いた時に読み込まれる。 開かずに書いても図には出ないので、
  // 実際の使い方 (タブを開いてから書く) に合わせる。
  await openEditor(page);
  await page.locator('[data-testid="editor-parts-tab"]').click();
  await page.waitForTimeout(700);
  await setDsl(page, [
    'title: "t"',
    "type: flow",
    "",
    "actors:",
    "  - 実績: achievement",
    "  - X",
    "",
    "flow:",
    '  - 実績 -> X: "y"',
  ].join("\n"));
  expect(await page.locator("[data-overlay-part]").count(), "パーツが図に出ない").toBe(1);
  expect(await page.locator(".v4-editor-error").count(), "組み立てに失敗した").toBe(0);
});

test("パーツが既存の図に重ならない", async ({ page }) => {
  // 図に出す経路 (overlay) と組み立ての経路は別々に座標を決める。 片方だけ直すと画面がずれる。
  // 以前 overlay 側が 0,0 固定で、 パーツが図の左上に重なって出ていた。
  await openEditor(page);
  await page.locator('[data-testid="editor-parts-tab"]').click();
  await page.waitForTimeout(600);
  await page.locator('[data-testid="editor-part-item-parts-achievement"]').click();
  await page.waitForTimeout(1200);

  const part = page.locator("[data-overlay-part]").first();
  await expect(part, "パーツが出ていない").toBeVisible();

  const partBox = await part.boundingBox();
  expect(partBox, "パーツの位置が取れない").toBeTruthy();

  // 既存の図の箱と重なっていないか。
  // overlay は中に図を描くので、 その中身は数えない (自分自身との重なりになる)
  const nodes = page.locator("[data-cdl-node]:not([data-overlay-part] [data-cdl-node])");
  const count = await nodes.count();
  expect(count, "既存の図が無い").toBeGreaterThan(0);

  const hits: string[] = [];
  for (let i = 0; i < count; i++) {
    const b = await nodes.nth(i).boundingBox();
    if (!b || b.width < 5 || b.height < 5) continue; // 幅 2 の目印は除く
    const p = partBox!;
    if (p.x < b.x + b.width && p.x + p.width > b.x && p.y < b.y + b.height && p.y + p.height > b.y) {
      hits.push(`${Math.round(b.x)},${Math.round(b.y)}`);
    }
  }
  expect(hits, `既存の図に重なった: ${hits.join(" / ")}`).toEqual([]);
});
