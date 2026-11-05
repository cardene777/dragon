/**
 * 見本帳で使う字だけを切り出した 1 つの字の file を読む (#3296)。
 *
 * 分割された字の file は残すので、切り出した字に無い字はそこから読む。
 * 字の一覧は組み立て結果の script と CSS から作る。文言に新しい字が増えると `site-font-covers-every-word` が落ちるので、
 * `apps/playground-spa/scripts/site-fonts.mjs` で字を作り直す。
 */
import { spawnSync } from "node:child_process";
import { existsSync, mkdtempSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import type { Page } from "playwright";
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";

import { codesOf } from "../../scripts/unicode-ranges.mjs";
import { app, BASE, root, type Site, startSite } from "./playground-support";

/** 頁が書き換わるのを待つ長さ */
const WAIT = { timeout: 15_000, interval: 100 } as const;
/** 字が読み終わった後に、遅れて始まる読み込みが無いことを確かめる長さ */
const SETTLE = 300;

const SANS = "Noto Sans JP Variable";
const FONT_DIR = join(app, "src/site/font");
const FONT = join(FONT_DIR, "noto-sans-jp-site.woff2");
const SCRIPT = join(app, "scripts/site-fonts.mjs");
/** 組み立て結果の切り出した字の file の名前 */
const SITE_FILE = /noto-sans-jp-site-[^/)"']*\.woff2/u;
/** 分割された番号付きの字の file の名前 */
const NUMBERED_FILE = /noto-sans-jp-\d+-wght/u;
/** 見本帳の文言に無い字。切り出した字に入らず、分割された字の file から読む */
const UNLISTED = "鬱";
/** 字の間隔の情報が効く文。13 字で、`と` と `、` の間が 0.04 字分狭い */
const KERNED = { text: "文章で書くと、動く図になる", size: 100, width: 1296 };

const fontsource = createRequire(join(root, "packages/dragon/package.json"));
const unicode = JSON.parse(
  readFileSync(join(dirname(fontsource.resolve("@fontsource-variable/noto-sans-jp/package.json")), "unicode.json"), "utf8"),
) as Record<string, string>;

const latin = new Set(codesOf(unicode.latin ?? ""));
const noto = new Set(codesOf(Object.values(unicode).join(",")));

let site: Site;

const assets = (): string[] => readdirSync(join(site.built.dir, "assets"));
const read = (name: string): string => readFileSync(join(site.built.dir, "assets", name), "utf8");

/** 組み立て結果の `@font-face` を CSS に書かれた順に並べる */
const faces = (): string[] =>
  assets()
    .filter((name) => name.endsWith(".css"))
    .flatMap((name) => [...read(name).matchAll(/@font-face\s*\{[^}]*\}/gu)].map((match) => match[0]));

const siteFaces = (): string[] => faces().filter((face) => SITE_FILE.test(face));

/** 面の範囲の字の番号 */
const rangeCodes = (face: string): number[] => codesOf(/unicode-range:\s*([^;}]+)/u.exec(face)?.[1] ?? "");

/** 切り出した字が持つ字の番号。切り出した字の面が無い時は空 */
const coveredCodes = (): Set<number> => new Set(siteFaces().flatMap(rangeCodes));

/** 頁が読んだ字の file の名前 */
const fontFiles = (page: Page): Promise<string[]> =>
  page.evaluate(() =>
    performance
      .getEntriesByType("resource")
      .map((entry) => entry.name.split("/").pop() ?? "")
      .filter((name) => name.includes(".woff2")),
  );

/** 字の読み込みが全て終わるまで待つ */
async function fontsSettled(page: Page): Promise<void> {
  await page.waitForFunction(() => [...document.fonts].some((face) => face.status === "loaded") && document.fonts.status === "loaded", undefined, { timeout: WAIT.timeout });
  await page.waitForTimeout(SETTLE);
}

/** 頁に `id` の要素を足して字を描かせる */
const addText = (page: Page, id: string, text: string, size: number): Promise<void> =>
  page.evaluate(
    async ([id, text, size, family]) => {
      const span = document.createElement("span");
      span.id = String(id);
      span.textContent = String(text);
      span.style.cssText = `position:fixed;top:0;left:0;z-index:99;white-space:nowrap;background:#fff;font-size:${String(size)}px;font-family:"${String(family)}"`;
      document.body.append(span);
      await document.fonts.load(`${String(size)}px "${String(family)}"`, String(text));
      await document.fonts.ready;
    },
    [id, text, size, SANS] as const,
  );

/** 要素の字を実際に描いた font */
async function platformFonts(page: Page, selector: string): Promise<{ custom: boolean; glyphs: number }[]> {
  const cdp = await page.context().newCDPSession(page);
  await cdp.send("DOM.enable");
  await cdp.send("CSS.enable");
  const { root: documentRoot } = await cdp.send("DOM.getDocument", { depth: 0 });
  const { nodeId } = await cdp.send("DOM.querySelector", { nodeId: documentRoot.nodeId, selector });
  const { fonts } = await cdp.send("CSS.getPlatformFontsForNode", { nodeId });
  return fonts.map((font) => ({ custom: font.isCustomFont, glyphs: font.glyphCount }));
}

describe("見本帳で使う字だけを 1 つの file から読む (#3296)", () => {
  beforeAll(async () => {
    site = await startSite();
  });

  afterEach(async () => {
    await site?.closeContexts();
  });

  afterAll(async () => {
    await site?.close();
  });

  it("site-font-has-one-face", () => {
    const found = siteFaces();
    expect(found, "切り出した字の @font-face が 1 件ではない").toHaveLength(1);
    const face = found[0] ?? "";
    expect(face, "切り出した字の面の字の名前が元の字と違う").toContain(SANS);
    expect(face, "切り出した字の面の太さの範囲が元の字の面と違い、別の組になる").toMatch(/font-weight:\s*100 900/u);
  });

  it("site-font-trims-original-faces", () => {
    const covered = coveredCodes();
    expect(covered.size, "切り出した字の面が unicode-range を持たない").toBeGreaterThan(0);
    const numbered = faces().filter((face) => NUMBERED_FILE.test(face));
    expect(numbered.length, "分割された字の面が無い").toBeGreaterThan(0);
    const overlap = new Set(numbered.flatMap(rangeCodes).filter((code) => covered.has(code) || latin.has(code)));
    expect(String.fromCodePoint(...[...overlap].sort((a, b) => a - b)), "分割された字の面に重なった字が残り、Firefox が分割された字の file も読む").toBe("");
  });

  describe.for([
    { width: 1440, height: 900 },
    { width: 390, height: 844 },
  ])("$width × $height", (viewport) => {
    it("site-font-reads-three-files", async () => {
      for (const [name, path] of [
        ["概要の頁", BASE],
        ["編集画面", `${BASE}editor`],
        ["使い方の頁", `${BASE}docs`],
      ] as const) {
        const { page } = await site.open({ path, viewport });
        await fontsSettled(page);
        const files = await fontFiles(page);
        const label = `幅${String(viewport.width)}の${name}: ${files.join(" ")}`;
        expect(files.filter((file) => SITE_FILE.test(file)), `切り出した字を読まない ${label}`).toHaveLength(1);
        expect(files.filter((file) => NUMBERED_FILE.test(file)), `分割された字を読んだ ${label}`).toEqual([]);
        expect(files, `字の file が 3 件ではない ${label}`).toHaveLength(3);
        await site.closeContexts();
      }
    });
  });

  it("site-font-covers-every-word", () => {
    const covered = coveredCodes();
    expect(covered.size, "切り出した字の面が unicode-range を持たない").toBeGreaterThan(0);
    const text = [
      ...assets()
        .filter((name) => /\.(?:js|css)$/u.test(name))
        .map(read),
      ...readdirSync(site.built.dir)
        .filter((name) => name.endsWith(".html"))
        .map((name) => readFileSync(join(site.built.dir, name), "utf8")),
    ].join("");
    const missing = [...new Set(text)].filter((char) => {
      const code = char.codePointAt(0) ?? 0;
      return noto.has(code) && !latin.has(code) && !covered.has(code);
    });
    expect(missing.sort().join(""), "頁の文言の字が切り出した字に無い。`node apps/playground-spa/scripts/site-fonts.mjs <分割前の字>` で作り直す").toBe("");
  });

  it("site-font-refuses-other-source", () => {
    expect(existsSync(FONT), "切り出した字の file が無い").toBe(true);
    const before = readFileSync(FONT);
    const other = join(mkdtempSync(join(tmpdir(), "dragon-font-")), "other.ttf");
    writeFileSync(other, "別の字");
    const result = spawnSync(process.execPath, [SCRIPT, other], { encoding: "utf8" });
    expect(result.stderr, "別の字を渡した時に sha256 の違いを名指さない").toContain("sha256");
    expect(result.status, "別の字を渡しても字を作る命令が止まらない").toBe(1);
    expect(readFileSync(FONT).equals(before), "別の字を渡した時に字の file が書き換わった").toBe(true);
  });

  it("site-font-carries-license", () => {
    const notice = join(FONT_DIR, "THIRD_PARTY_NOTICES.md");
    expect(existsSync(notice), "切り出した字の隣に利用許諾が無い").toBe(true);
    const body = readFileSync(notice, "utf8");
    expect(body).toContain("Noto Sans JP");
    expect(body).toContain("Reserved Font Name 'Source'");
    expect(body).toContain("SIL OPEN FONT LICENSE Version 1.1");
    expect(body, "利用許諾の全文の最後の節が無い").toContain("OTHER DEALINGS IN THE FONT SOFTWARE");
  });

  it(
    "unlisted-char-reads-original-file",
    async () => {
      expect(coveredCodes().has(UNLISTED.codePointAt(0) ?? 0), `${UNLISTED} が切り出した字に入ったので、別の字で確かめる`).toBe(false);
      const key = Object.keys(unicode).find((name) => codesOf(unicode[name] ?? "").includes(UNLISTED.codePointAt(0) ?? 0));
      const number = key?.replace(/\D/gu, "");
      expect(number, `${UNLISTED} を持つ分割された字が無い`).toMatch(/^\d+$/u);
      const { page } = await site.open({ path: `${BASE}editor` });
      await addText(page, "probe", UNLISTED, 20);
      await expect.poll(() => fontFiles(page), { ...WAIT, message: "分割された字の file を読まない" }).toContainEqual(expect.stringContaining(`noto-sans-jp-${String(number)}-wght`));
      const fonts = await platformFonts(page, "#probe");
      expect(fonts, `${UNLISTED} が端末の字で描かれた`).toEqual([{ custom: true, glyphs: 1 }]);
    },
  );

  it(
    "site-font-keeps-kerning",
    async () => {
      const { page } = await site.open({ path: `${BASE}editor` });
      await addText(page, "kerned", KERNED.text, KERNED.size);
      const box = await page.locator("#kerned").boundingBox();
      expect(box?.width ?? 0, "字の間隔の情報が効いていない").toBeCloseTo(KERNED.width, 0);
      expect(await platformFonts(page, "#kerned"), "端末の字で描かれた").toEqual([{ custom: true, glyphs: KERNED.text.length }]);
    },
  );
});
