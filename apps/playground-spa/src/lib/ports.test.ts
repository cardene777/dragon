import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import {
  DEV_PORT,
  DEV_URL,
  PREVIEW_PORT,
  PREVIEW_BASE_PATH,
  PREVIEW_BASE_URL,
  PREVIEW_URL,
} from "../../ports";

/**
 * 画面を配る port が 1 箇所から導かれることの検証 (#1326)。
 *
 * 数字が散ると、片方だけ直したずれに気付けない。 実際に踏んだ = 検査は 4324 を探すのに
 * 配る側は 4323 のままで、**22 件が常に落ちていた**。
 *
 * ここで見るのは 2 つ。 開発と本番 build が別の port を使うことと、設定と検査が
 * `ports.ts` 以外に数字を持たないこと。
 */

const 読む = (rel: string): string => readFileSync(join(import.meta.dirname, "../..", rel), "utf8");

/** `ports.ts` 以外に port の数字を持たせない file */
const 数字を持たない = [
  "vite.config.ts",
  "playwright.config.ts",
  "package.json",
  "scripts/test-editor-dashboard.sh",
  "tests/prod-check.spec.ts",
  "tests/a11y-check.spec.ts",
  "tests/final-check.spec.ts",
];

describe("画面を配る port (#1326)", () => {
  it("開発と本番 build で別の port を使う", () => {
    // 同じにすると片方を立てている間もう片方を立てられない
    expect(DEV_PORT, "開発と本番 build が同じ port を使っている").not.toBe(PREVIEW_PORT);
  });

  it("URL が port と base から組まれる", () => {
    expect(DEV_URL).toBe(`http://localhost:${DEV_PORT}`);
    expect(PREVIEW_URL).toBe(`http://localhost:${PREVIEW_PORT}${PREVIEW_BASE_PATH}`);
  });

  it("検査が見に行く先が base 相対の解決で subpath を落とさない", () => {
    // 末尾 `/` が無いと `URL()` は base の最後の一区画を捨てる。 実際に踏んだ = 49 spec を
    // subpath 配信へ向けた 1 回目が、根こそぎ「画面が出ない」 形で落ちた (#1438)
    expect(new URL("editor", PREVIEW_BASE_URL).pathname).toBe(`${PREVIEW_BASE_PATH}/editor`);
    expect(new URL("", PREVIEW_BASE_URL).pathname).toBe(`${PREVIEW_BASE_PATH}/`);
    // 対照 = 末尾 `/` を落とすと base ごと消える。 これが無いと「末尾 `/` が要る」 の
    // 主張が恒真になる (どちらでも通る形に気付けない)
    expect(new URL("editor", PREVIEW_URL).pathname).toBe("/editor");
  });

  it("設定が宣言どおりの port を配る", async () => {
    // **数字を持たないことだけでは足りない**。 `vite.config.ts` が `PREVIEW_PORT` ではなく
    // `DEV_PORT` を配る形にしても、literal は 1 つも増えないので上の検査は通る (実測で
    // 0 件 FAIL だった)。 設定を実際に読んで、配る port が宣言と一致することを見る
    const mod = (await import("../../vite.config")) as {
      default: (env: { command: string; mode: string }) => {
        server?: { port?: number };
        preview?: { port?: number };
      };
    };
    const 開発 = mod.default({ command: "serve", mode: "development" });
    const 本番 = mod.default({ command: "serve", mode: "production" });
    expect(開発.server?.port, "開発 server の port が宣言と違う").toBe(DEV_PORT);
    expect(本番.preview?.port, "本番 build を配る port が宣言と違う").toBe(PREVIEW_PORT);
  });

  it("設定と検査が port の数字を自分で持たない", () => {
    const 持っている: string[] = [];
    let 読めた = 0;
    for (const rel of 数字を持たない) {
      const src = 読む(rel);
      読めた += 1;
      if (new RegExp(`\\b(${DEV_PORT}|${PREVIEW_PORT})\\b`, "u").test(src)) 持っている.push(rel);
    }
    expect(読めた, "対象 file を 1 つも読めていない (検査が空振りしている)").toBe(
      数字を持たない.length,
    );
    expect(持っている, "port の数字が ports.ts の外にある").toEqual([]);
  });
});
