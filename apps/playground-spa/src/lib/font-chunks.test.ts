/**
 * 字の `@font-face` を最初の CSS から外し、初めて開く端末では最初の画面を描いた後に読む (#3292)。
 *
 * 2 度目からは最初の画面を描く前に読むので、字の file が cache に在る端末は端末の字を挟まない。
 * 字の CSS は、build した頁の CSS のうち `@font-face` を持つ file で、最初に読む CSS は `index.html` が名指す file (`firstLoadFiles`)。
 */
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import { builtDir, firstLoadFiles } from "./playground-support";

const read = (name: string): string => readFileSync(join(builtDir(), "assets", name), "utf8");
const holdsFontFace = (name: string): boolean => read(name).includes("@font-face");
const fontCss = (): string[] => readdirSync(join(builtDir(), "assets")).filter((name) => name.endsWith(".css") && holdsFontFace(name));

describe("字の CSS を最初の画面の後に読む (#3292)", () => {

  it("first-load-css-carries-no-font-face", () => {
    const first = firstLoadFiles(builtDir()).filter((name) => name.endsWith(".css"));
    expect(first.length, "build した頁が最初に読む CSS が無い").toBeGreaterThan(0);
    expect(first.filter(holdsFontFace), "最初に読む CSS に @font-face が残っている").toEqual([]);
    expect(fontCss().length, "後から読む CSS に @font-face が無い").toBeGreaterThan(0);
  });
});
