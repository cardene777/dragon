/**
 * 参加方法の画面の「PR を出すまでの 5 手順」 の検証 (#1126)。
 *
 * 設計 (`docs/design/app.pen` の「08 参加方法」) が持つ節を実装に足した。 9 画面の節を
 * 突き合わせた中で、 見本のデータ由来の差を除いた唯一の実質的な欠けだった。
 *
 * ## 命令が実物と食い違わないことを見る
 *
 * 設計は `bun` 前提の検査を置いていたが、 この repo には無い。 画面に出す命令が
 * `package.json` の scripts と食い違うと、 **読んだ人がそのまま打って失敗する**。
 *
 * 画面の文字列を `package.json` と `CONTRIBUTING.md` に突き合わせる。 実物が変わった時に
 * 画面だけ古いまま残る形を検知する。
 *
 * ## 日英の両方を見る
 *
 * 片方だけ出る形 (訳を足し忘れる) を通さない。
 */
import { test, expect, type Page } from "@playwright/test";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const 読む = (rel: string): string => readFileSync(fileURLToPath(new URL(rel, import.meta.url)), "utf8");

async function 開く(page: Page, 言語: "ja" | "en"): Promise<void> {
  await page.addInitScript((l) => localStorage.setItem("dragon-locale", l), 言語);
  await page.goto("/contribute");
  await page.waitForLoadState("networkidle");
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(600);
}

/** 節の中身を読む。 段ごとに見出し / 説明 / 命令。 */
async function 段を読む(page: Page): Promise<{ 番号: string; 見出し: string; 説明: string; 命令: string }[]> {
  return await page.$$eval(".pr-step", (els) =>
    els.map((e) => ({
      番号: (e.querySelector(".pr-step-num")?.textContent ?? "").trim(),
      見出し: (e.querySelector(".pr-step-title")?.textContent ?? "").trim(),
      説明: (e.querySelector(".pr-step-desc")?.textContent ?? "").trim(),
      命令: (e.querySelector(".pr-step-cmd")?.textContent ?? "").trim(),
    })),
  );
}

for (const 言語 of ["ja", "en"] as const) {
  test(`${言語} で 5 手順がすべて出る`, async ({ page }) => {
    await 開く(page, 言語);
    const 段 = await 段を読む(page);
    expect(段.length, "段の数が 5 でない").toBe(5);
    expect(
      段.map((s) => s.番号),
      "番号が 01-05 の順で並んでいない",
    ).toEqual(["01", "02", "03", "04", "05"]);
    for (const [i, s] of 段.entries()) {
      expect(s.見出し.length, `${i + 1} 段目に見出しが無い`).toBeGreaterThan(0);
      expect(s.説明.length, `${i + 1} 段目に説明が無い`).toBeGreaterThan(0);
    }
  });
}

test("日英で文言が入れ替わる", async ({ page }) => {
  // 訳を足し忘れて日本語のまま出る形を通さない。
  await 開く(page, "ja");
  const 日 = (await 段を読む(page)).map((s) => s.見出し);
  await 開く(page, "en");
  const 英 = (await 段を読む(page)).map((s) => s.見出し);
  expect(日.length, "日本語で段を読めていない").toBe(5);
  expect(英.length, "英語で段を読めていない").toBe(5);
  for (const [i, ja] of 日.entries()) {
    expect(英[i], `${i + 1} 段目の見出しが日英で同じ (訳が無い)`).not.toBe(ja);
  }
});

test("画面に出す命令が実物と食い違わない", async ({ page }) => {
  // **画面の文字列を実物に突き合わせる**。 設計は `bun` 前提の検査を置いていたが、
  // この repo には無い。 食い違うと読んだ人がそのまま打って失敗する。
  await 開く(page, "ja");
  const 命令 = (await 段を読む(page)).map((s) => s.命令).filter((c) => c !== "" && c !== "—");
  expect(命令.length, "命令を 1 つも読めていない").toBeGreaterThan(0);

  const pkg = JSON.parse(読む("../../../package.json")) as { scripts?: Record<string, string> };
  const scripts = pkg.scripts ?? {};
  const 手順 = 読む("../../../CONTRIBUTING.md");

  for (const c of 命令) {
    if (c.startsWith("pnpm ")) {
      const 名 = c.slice("pnpm ".length).split(/\s+/)[0]!;
      expect(scripts[名], `画面が出す \`${c}\` が package.json の scripts に無い`).toBeTruthy();
      continue;
    }
    // `pnpm` 以外は外部の道具 (git / gh) と PR 本文の書式。 実在を機械では確かめられないので、
    // 先頭の語だけ許可した集合に入るかを見る (綴り間違いと、 別の道具への差し替えを検知する)
    const 先頭 = c.split(/\s+/)[0]!;
    expect(
      ["git", "gh", "Closes"],
      `画面が出す \`${c}\` の先頭が想定外`,
    ).toContain(先頭);
  }

  // `CONTRIBUTING.md § 開発フロー` が挙げる検査と食い違わないこと。
  // 画面が `pnpm verify` を出すなら、 その中身が typecheck と test を含む
  const verify = scripts["verify"] ?? "";
  if (命令.includes("pnpm verify")) {
    expect(verify, "`pnpm verify` が typecheck を含まない").toContain("typecheck");
    expect(verify, "`pnpm verify` が test を含まない").toContain("test");
    expect(手順, "CONTRIBUTING.md が typecheck に触れていない").toContain("typecheck");
  }

  // branch 名の書式が `CONTRIBUTING.md` と揃っていること
  const branch = 命令.find((c) => c.startsWith("git switch"));
  if (branch !== undefined) {
    expect(branch, "branch 名が feature/ で始まっていない").toMatch(/feature\//);
    expect(手順, "CONTRIBUTING.md の branch 書式と揃っていない").toContain("feature/{N}-{slug}");
  }
});
