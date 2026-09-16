/**
 * `src/compile/` が親を取り込み返していないことを固定する (#2031)。
 *
 * #2030 で `compile.ts` を 30 file へ分けた時、両側から呼ばれる宣言を葉へ出すことで輪を避けた。
 * その判断は当時の手作業で、次に file を足す時に同じ輪ができても気付けない。
 *
 * 「0 件」 を期待する検査なので、植え込み対照を置く (`rules/quality.md` の条件 8)。
 * 違反する形を一時 dir に 1 件作り、**本番と同じ探し方** がそれを見つけることを確かめる。
 */

import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { 取り込みを読む, 走査対象, 輪を探す } from "./support/import-cycle";

/**
 * 走査する dir と、取り込んではいけない親。
 *
 * 2 つは同じ文字列になる。 dir が `src/compile/` で、親の module が `src/compile.ts` から
 * 拡張子を落とした `src/compile` だから。 同じ値だが役割が別なので名前を分けて持つ。
 */
const 分けた先 = resolve(__dirname, "../src/compile");
const 親 = resolve(__dirname, "../src/compile");

describe("取り込みの輪", () => {
  const 結果 = 輪を探す(分けた先, 親);

  it("`src/compile/` の どの file も `../compile` を取り込んでいない", () => {
    const 内訳 = 結果.輪.map((t) => `${t.file}:${t.line} → ${t.行き先}`).join("\n");
    expect(結果.輪, `親を取り込み返している取り込み文がある\n${内訳}`).toHaveLength(0);
  });

  it("走査が空振りしていない (file と取り込み文を実際に読んでいる)", () => {
    expect(結果.走査数, "`src/compile/` の file を 1 つも読めていない").toBeGreaterThan(0);
    expect(結果.取り込み数, "取り込み文を 1 つも読み取れていない").toBeGreaterThan(0);
  });

  it("走査した file の数が dir の実物と一致する", () => {
    expect(結果.走査数).toBe(走査対象(分けた先).length);
  });
});

describe("植え込み対照", () => {
  let dir = "";

  beforeAll(() => {
    dir = mkdtempSync(join(tmpdir(), "dragon-import-cycle-"));
    // 親に当たる file。 中身は空でよい (探すのは取り込み文であって中身ではない)
    writeFileSync(join(dir, "compile.ts"), "export const x = 1;\n");
  });

  afterAll(() => {
    if (dir !== "") rmSync(dir, { recursive: true, force: true });
  });

  it("親を取り込み返す形を 1 件置くと、本番と同じ探し方が見つける", () => {
    const 子dir = mkdtempSync(join(tmpdir(), "dragon-import-cycle-kid-"));
    writeFileSync(
      join(子dir, "mind.ts"),
      `import { x } from "${join(dir, "compile")}";\nexport const y = x;\n`,
    );
    const 結果 = 輪を探す(子dir, join(dir, "compile"));
    expect(結果.輪, "輪のある形を見つけられていない").toHaveLength(1);
    expect(結果.輪[0].line).toBe(1);
    rmSync(子dir, { recursive: true, force: true });
  });

  it("括弧の中で改行する取り込み文も見つける", () => {
    const 子dir = mkdtempSync(join(tmpdir(), "dragon-import-cycle-multiline-"));
    writeFileSync(
      join(子dir, "mind.ts"),
      `import {\n  a,\n  b,\n} from "${join(dir, "compile")}";\nexport const y = [a, b];\n`,
    );
    const 結果 = 輪を探す(子dir, join(dir, "compile"));
    expect(結果.輪, "改行を跨ぐ取り込み文を読み飛ばしている").toHaveLength(1);
    expect(結果.輪[0].line, "行番号が取り込み文の開始行を指していない").toBe(1);
    rmSync(子dir, { recursive: true, force: true });
  });

  it("再輸出 (`export ... from`) も取り込みとして見つける", () => {
    const 子dir = mkdtempSync(join(tmpdir(), "dragon-import-cycle-reexport-"));
    writeFileSync(join(子dir, "mind.ts"), `export { a } from "${join(dir, "compile")}";\n`);
    const 結果 = 輪を探す(子dir, join(dir, "compile"));
    expect(結果.輪).toHaveLength(1);
    rmSync(子dir, { recursive: true, force: true });
  });
});

describe("陰性対照", () => {
  it("親でない行き先は輪に数えない", () => {
    const 子dir = mkdtempSync(join(tmpdir(), "dragon-import-cycle-negative-"));
    writeFileSync(
      join(子dir, "mind.ts"),
      'import { readFileSync } from "node:fs";\nimport { x } from "./sibling";\nexport const y = [readFileSync, x];\n',
    );
    const 結果 = 輪を探す(子dir, join(子dir, "..", "compile"));
    expect(結果.取り込み数, "取り込み文を読めていない (空振り)").toBe(2);
    expect(結果.輪, "親でない行き先を輪に数えている").toHaveLength(0);
    rmSync(子dir, { recursive: true, force: true });
  });

  it("説明文の中の綴りは取り込みに数えない", () => {
    const 子dir = mkdtempSync(join(tmpdir(), "dragon-import-cycle-comment-"));
    writeFileSync(
      join(子dir, "mind.ts"),
      `/**\n * この file はかつて import { x } from "../compile"; と書いていた。\n */\nexport const y = 1;\n// import { z } from "../compile";\n`,
    );
    const 結果 = 取り込みを読む(join(子dir, "mind.ts"));
    expect(結果, "注釈の中の綴りを取り込みとして読んでいる").toHaveLength(0);
    rmSync(子dir, { recursive: true, force: true });
  });
});
