/**
 * 記法から読んだ図は、描く時に原本の形の検査を省く (#3400)。
 *
 * 省いた図にも、字のまま SVG と頁に入る値 (足したブロックの path、箱の飛び先の URL) の守りを残す。
 * `parseNotation` で読んだ後にその値を書き換えて描いても、原本の形の検査を読んでいない軽い入口で誤りになって止まる。
 * 省く前提として、全ての見本を記法から読んだ図が原本の形の検査を通ることを確かめる。
 */
import { execFileSync } from "node:child_process";
import { readdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const EXAMPLES = join(ROOT, "examples");
const name = "@cardenelabs/dragon";

interface Whole {
  parseNotation(text: string): { ok: true; diagram: unknown } | { ok: false; errors: { line: number; message: string }[] };
  renderDiagram(diagram: unknown): { svg: string };
  validateDiagram(input: unknown): { ok: true } | { ok: false; errors: { pointer: string; message: string }[] };
}

const importWhole = (): Promise<Whole | undefined> => (import(/* @vite-ignore */ name) as Promise<Whole>).catch(() => undefined);

interface Drawn {
  svg?: string;
  error?: string;
  validator: unknown;
}

/** 新しい Node で軽い入口を読み、記法 `text` を読んだ図を `rewrite` で書き換えてから描く。描いた SVG か誤りの文と、原本の形の検査を読んだかを返す */
function drawRewritten(text: string, rewrite: string): Drawn {
  const code = [
    `const light = await import("${name}/light");`,
    "const out = {};",
    `const text = ${JSON.stringify(text)};`,
    "await light.loadFor(text);",
    "const parsed = light.parseNotation(text);",
    "if (!parsed.ok) throw new Error(parsed.errors[0].message);",
    "const diagram = parsed.diagram;",
    rewrite,
    "try { out.svg = light.renderDiagram(diagram).svg; } catch (e) { out.error = e.message; }",
    `out.validator = typeof light.validatorLoaded === "function" ? light.validatorLoaded() : "missing";`,
    "console.log(JSON.stringify(out));",
  ].join("\n");
  const stdout = execFileSync(process.execPath, ["--input-type=module", "-e", code], { cwd: ROOT, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });
  return JSON.parse(stdout) as Drawn;
}

/** 箱を元にした足したブロックを使う記法 (#3399) */
const WITH_BLOCK = `architecture 橋

blocks 1
block +bridge
  base box
  shape path "M 0 70 Q 50 0 100 70 Z"
end

box eth as Ethereum
+bridge cc as CCIP

step 送る
  say 橋へ送る。
  eth -> cc: 送る
`;

/** 飛び先を持つ箱の記法 */
const WITH_LINK = `architecture 飛び先

box docs as 使い方 [link: /docs]
box app as アプリ

step 開く
  say 使い方を開く。
  app -> docs: 開く
`;

describe("記法から読んだ図の守り (#3400)", () => {
  it("parsed-diagram-rewritten-path-refused", async () => {
    const whole = await importWhole();
    expect(whole, "既定の入口を読めない").toBeDefined();
    if (!whole) return;
    const rewrite = `diagram.define.blocks[0].path = 'M 0 0" onload="alert(1)';`;
    const out = drawRewritten(WITH_BLOCK, rewrite);
    // 原本の形の検査を読んでいない軽い入口でも、書き換えた path は SVG に入らない
    expect(out.validator, "書き換えた path を止めるために、原本の形の検査を読んだ").toBe(false);
    expect(out.svg, "書き換えた path の図を描いた").toBeUndefined();
    expect(out.error ?? "", "書き換えた path を止めた誤りが path を名指さない").toMatch(/path/u);
    // 既定の入口でも同じく止まる
    const parsed = whole.parseNotation(WITH_BLOCK);
    expect(parsed.ok, "足したブロックの記法を読めない").toBe(true);
    if (!parsed.ok) return;
    (parsed.diagram as { define: { blocks: { path: string }[] } }).define.blocks[0]!.path = 'M 0 0" onload="alert(1)';
    expect(() => whole.renderDiagram(parsed.diagram), "既定の入口が書き換えた path の図を描いた").toThrow(/path/u);
  });

  it("parsed-diagram-rewritten-link-refused", async () => {
    const whole = await importWhole();
    expect(whole, "既定の入口を読めない").toBeDefined();
    if (!whole) return;
    const rewrite = `diagram.blocks.box[0].link = "javascript:alert(1)";`;
    const out = drawRewritten(WITH_LINK, rewrite);
    expect(out.validator, "書き換えた飛び先を止めるために、原本の形の検査を読んだ").toBe(false);
    expect(out.svg, "書き換えた飛び先の図を描いた").toBeUndefined();
    expect(out.error ?? "", "書き換えた飛び先を止めた誤りが link を名指さない").toMatch(/link/u);
    const parsed = whole.parseNotation(WITH_LINK);
    expect(parsed.ok, "飛び先を持つ記法を読めない").toBe(true);
    if (!parsed.ok) return;
    (parsed.diagram as { blocks: { box: { link?: string }[] } }).blocks.box[0]!.link = "javascript:alert(1)";
    expect(() => whole.renderDiagram(parsed.diagram), "既定の入口が書き換えた飛び先の図を描いた").toThrow(/link/u);
  });

  it("every-parsed-example-passes-validator", async () => {
    const whole = await importWhole();
    expect(whole, "既定の入口を読めない").toBeDefined();
    if (!whole) return;
    const files = readdirSync(EXAMPLES).filter((file) => file.endsWith(".dragon")).sort();
    expect(files.length, "見本の記法が無い (走査の空振り)").toBeGreaterThan(0);
    const failed = files.flatMap((file) => {
      const parsed = whole.parseNotation(readFileSync(join(EXAMPLES, file), "utf8"));
      if (!parsed.ok) return [`${file}: 読めない (${parsed.errors[0]?.message ?? ""})`];
      const checked = whole.validateDiagram(parsed.diagram);
      return checked.ok ? [] : [`${file}: ${checked.errors.map((e) => `${e.pointer} ${e.message}`).join(" / ")}`];
    });
    // 記法から読んだ図は描く時の検査を省くので、読む処理が原本の形の外の図を作らないことをここで固める
    expect(failed, "記法から読んだ図が原本の形の検査を通らない見本").toEqual([]);
  });
});
