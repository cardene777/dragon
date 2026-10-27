/**
 * 版の記録 (#3151)。
 *
 * 版を上げるたびに、`package.json` の版を前提の配り方の節と更新履歴の見出しへ手で書き足す。
 * 書き足し忘れても build も他の検査も通るので、ここで版が 2 か所に載っているかを確かめる。
 */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "../../..");

const version = (): string =>
  (JSON.parse(readFileSync(join(ROOT, "packages/dragon/package.json"), "utf8")) as { version: string }).version;

const escaped = (text: string): string => text.replaceAll(".", "\\.");

/** `## <見出し>` の次の行から、次の `## ` の手前までの行 */
function section(text: string, heading: string): string {
  const lines = text.split("\n");
  const start = lines.indexOf(`## ${heading}`);
  if (start < 0) return "";
  const end = lines.findIndex((line, i) => i > start && line.startsWith("## "));
  return lines.slice(start + 1, end < 0 ? undefined : end).join("\n");
}

/** 版が、別の版の一部としてでなく書かれているか (`0.36.3` は `0.36.30` にも `10.36.3` にも当たらない) */
function mentions(text: string, version: string): boolean {
  return new RegExp(`(?<![\\d.])${escaped(version)}(?!\\.?\\d)`).test(text);
}

describe("版の記録 (#3151)", () => {
  it("release-version-in-premise", () => {
    const delivery = section(readFileSync(join(ROOT, ".ikkan/premises/product.md"), "utf8"), "配り方");
    expect(delivery, "前提に配り方の節が在る").not.toBe("");
    expect(mentions(delivery, version()), `前提の配り方の節に ${version()} が無い`).toBe(true);
  });

  it("release-version-in-changelog", () => {
    const heading = new RegExp(`^## \\[${escaped(version())}\\] - \\d{4}-\\d{2}-\\d{2}$`, "m");
    const changelog = readFileSync(join(ROOT, "CHANGELOG.md"), "utf8");
    expect(heading.test(changelog), `CHANGELOG.md に ## [${version()}] の見出しが無い`).toBe(true);
  });

  it("version-match-needs-whole-version", () => {
    expect(mentions("0.36.3 として出した", "0.36.3")).toBe(true);
    expect(mentions("0.36.30 として出した", "0.36.3")).toBe(false);
    expect(mentions("10.36.3 として出した", "0.36.3")).toBe(false);
    expect(mentions("0.36.3.1 として出した", "0.36.3")).toBe(false);
  });
});
