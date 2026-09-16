import { describe, it, expect } from "vitest";
import { execFileSync } from "node:child_process";
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

/**
 * 文書に書いた port が `ports.ts` と食い違わないことの検証 (#2054)。
 *
 * 手引きの類は、読む人が URL をそのまま開けるよう数字を書く。 数字を書くこと自体は止めず、
 * 書いた数字と URL の形を `ports.ts` に突き合わせる。 止めないと port を変えた時に文書だけ
 * 古い数字が残り、#1326 と同じ食い違いが文書の側で起きる。
 *
 * | 拾った形 | 通す条件 |
 * |---|---|
 * | `localhost:<開発の port>` | path が base path で始まらない (開発 server は root で配る) |
 * | `localhost:<preview の port>` | path が base path で始まる (#1438) |
 * | それ以外の数字 | 通さない |
 *
 * 対象は追跡中の Markdown から導き、`CHANGELOG.md` だけを外す。 変更履歴は過去の版の記録で、
 * 書いた当時の数字を残す。 調査用の `scripts/*.mjs` も対象にしない (`ports.ts` の説明の通り)。
 */
const ROOT = join(import.meta.dirname, "..", "..", "..", "..");

/** 本文から `localhost:<数字>` を拾い、`ports.ts` と食い違うものを理由付きで返す */
function portの食い違い(本文: string): { 拾った: number; 食い違い: string[] } {
  let 拾った = 0;
  const 食い違い: string[] = [];
  for (const m of 本文.matchAll(/localhost:(\d+)(\/[^\s)`"'>\]|]*)?/gu)) {
    拾った += 1;
    const port = Number(m[1]);
    const path = m[2] ?? "";
    const base付き = path === PREVIEW_BASE_PATH || path.startsWith(`${PREVIEW_BASE_PATH}/`);
    if (port === DEV_PORT) {
      if (base付き) 食い違い.push(`${m[0]} (開発 server は root で配るので ${PREVIEW_BASE_PATH} を付けない)`);
    } else if (port === PREVIEW_PORT) {
      if (!base付き) 食い違い.push(`${m[0]} (preview は ${PREVIEW_BASE_PATH} の下に配る)`);
    } else {
      食い違い.push(`${m[0]} (ports.ts に無い port)`);
    }
  }
  return { 拾った, 食い違い };
}

describe("文書に書いた port (#2054)", () => {
  it("追跡中の Markdown に書いた port が ports.ts と一致する", () => {
    const 文書 = execFileSync("git", ["-C", ROOT, "ls-files", "*.md"], { encoding: "utf8" })
      .split("\n")
      .filter((p) => p !== "" && p !== "CHANGELOG.md");
    expect(文書.length, "Markdown を 1 つも拾えていない (検査が空振りしている)").toBeGreaterThan(0);

    let 拾った = 0;
    const 食い違い: string[] = [];
    for (const rel of 文書) {
      const r = portの食い違い(readFileSync(join(ROOT, rel), "utf8"));
      拾った += r.拾った;
      食い違い.push(...r.食い違い.map((x) => `${rel}: ${x}`));
    }
    // 文書が port を 1 つも書いていなければ、以下の一致は何も確かめていない
    expect(拾った, "文書から localhost:<数字> を 1 つも拾えていない (検査が空振りしている)").toBeGreaterThan(0);
    expect(食い違い, "文書に書いた port が ports.ts と食い違っている").toEqual([]);
  });

  it("ports.ts に無い port を拾う", () => {
    expect(portの食い違い("http://localhost:3000/").食い違い).toHaveLength(1);
  });

  it("preview の port を base path 無しで書くと拾う", () => {
    // 開いても画面が出ない URL になる (preview は base path の下にしか配らない)
    expect(portの食い違い(`http://localhost:${PREVIEW_PORT}/catalog`).食い違い).toHaveLength(1);
    expect(portの食い違い(`localhost:${PREVIEW_PORT}`).食い違い).toHaveLength(1);
  });

  it("開発の port に base path を付けると拾う", () => {
    expect(portの食い違い(`http://localhost:${DEV_PORT}${PREVIEW_BASE_PATH}/`).食い違い).toHaveLength(1);
  });

  it("正しい形は拾っても食い違いにしない", () => {
    // 陰性対照。 上の 3 件が何でも食い違いにする判定で通っていないことを確かめる。
    const r = portの食い違い(
      [
        `pnpm dev # http://localhost:${DEV_PORT}`,
        `http://localhost:${DEV_PORT}/catalog/animation`,
        `http://localhost:${PREVIEW_PORT}${PREVIEW_BASE_PATH}/`,
        `localhost:${PREVIEW_PORT}${PREVIEW_BASE_PATH}`,
        // base path と同じ文字で始まる別の path は base 付きではない
        `http://localhost:${DEV_PORT}${PREVIEW_BASE_PATH}-notes`,
      ].join("\n"),
    );
    expect(r).toEqual({ 拾った: 5, 食い違い: [] });
  });
});
