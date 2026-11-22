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
import { describe, expect, it } from "vitest";

import { codesOf } from "../../scripts/unicode-ranges.mjs";
import { builtDir, app, root } from "./playground-support";

const SANS = "Noto Sans JP Variable";
const FONT_DIR = join(app, "src/site/font");
const FONT = join(FONT_DIR, "noto-sans-jp-site.woff2");
const SCRIPT = join(app, "scripts/site-fonts.mjs");
/** 組み立て結果の切り出した字の file の名前 */
const SITE_FILE = /noto-sans-jp-site-[^/)"']*\.woff2/u;
/** 分割された番号付きの字の file の名前 */
const NUMBERED_FILE = /noto-sans-jp-\d+-wght/u;

const fontsource = createRequire(join(root, "packages/dragon/package.json"));
const unicode = JSON.parse(
  readFileSync(join(dirname(fontsource.resolve("@fontsource-variable/noto-sans-jp/package.json")), "unicode.json"), "utf8"),
) as Record<string, string>;

const latin = new Set(codesOf(unicode.latin ?? ""));
const noto = new Set(codesOf(Object.values(unicode).join(",")));

const assets = (): string[] => readdirSync(join(builtDir(), "assets"));
const read = (name: string): string => readFileSync(join(builtDir(), "assets", name), "utf8");

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

describe("見本帳で使う字だけを 1 つの file から読む (#3296)", () => {

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

  it("site-font-covers-every-word", () => {
    const covered = coveredCodes();
    expect(covered.size, "切り出した字の面が unicode-range を持たない").toBeGreaterThan(0);
    const text = [
      ...assets()
        .filter((name) => /\.(?:js|css)$/u.test(name))
        .map(read),
      ...readdirSync(builtDir())
        .filter((name) => name.endsWith(".html"))
        .map((name) => readFileSync(join(builtDir(), name), "utf8")),
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
});
