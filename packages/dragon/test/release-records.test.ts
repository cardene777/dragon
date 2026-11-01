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

  it("changelog-0-37-0-releases-state", () => {
    // 状態遷移図 (#3163) と、その見た目を試作に揃えた変更 (#3171) は 0.37.0 で出す (#3172)
    const [major = 0, minor = 0] = version().split(".").map(Number);
    expect(major > 0 || minor >= 37, `package の版 ${version()} が 0.37.0 より前`).toBe(true);
    const released = section(readFileSync(join(ROOT, "CHANGELOG.md"), "utf8").replace(/^## \[0\.37\.0\] - \d{4}-\d{2}-\d{2}$/mu, "## 0.37.0"), "0.37.0");
    expect(released, "CHANGELOG.md に日付付きの ## [0.37.0] の節が無い").not.toBe("");
    expect(released, "CHANGELOG.md の 0.37.0 の節に状態遷移図 (#3163) の項が無い").toContain("(#3163)");
    expect(released, "CHANGELOG.md の 0.37.0 の節に見た目を揃えた変更 (#3171) の項が無い").toContain("(#3171)");
  });

  it("changelog-0-38-0-releases-fixes", () => {
    // 0.37.0 を手元で見て受けた 3 つの指摘の直し (字の重なり #3175、運ぶ物の置き場 #3176、時系列図の縦の長さ #3177) は 0.38.0 で出す (#3182)
    const [major = 0, minor = 0] = version().split(".").map(Number);
    expect(major > 0 || minor >= 38, `package の版 ${version()} が 0.38.0 より前`).toBe(true);
    const released = section(readFileSync(join(ROOT, "CHANGELOG.md"), "utf8").replace(/^## \[0\.38\.0\] - \d{4}-\d{2}-\d{2}$/mu, "## 0.38.0"), "0.38.0");
    expect(released, "CHANGELOG.md に日付付きの ## [0.38.0] の節が無い").not.toBe("");
    for (const issue of ["#3175", "#3176", "#3177"]) expect(released, `CHANGELOG.md の 0.38.0 の節に ${issue} の項が無い`).toContain(`(${issue})`);
  });

  it("changelog-0-39-0-releases-fixes", () => {
    // 字の重なりの知らせ (#3178) と、段の番号が重なる所の直し (#3184、#3186、#3189、#3187) は 0.39.0 で出す (#3193)
    const [major = 0, minor = 0] = version().split(".").map(Number);
    expect(major > 0 || minor >= 39, `package の版 ${version()} が 0.39.0 より前`).toBe(true);
    const released = section(readFileSync(join(ROOT, "CHANGELOG.md"), "utf8").replace(/^## \[0\.39\.0\] - \d{4}-\d{2}-\d{2}$/mu, "## 0.39.0"), "0.39.0");
    expect(released, "CHANGELOG.md に日付付きの ## [0.39.0] の節が無い").not.toBe("");
    for (const issue of ["#3178", "#3184", "#3186", "#3189", "#3187"]) expect(released, `CHANGELOG.md の 0.39.0 の節に ${issue} の項が無い`).toContain(`(${issue})`);
  });

  it("changelog-0-40-0-releases-git", () => {
    // 枝分かれの図 (#3164) と、その書き方を使い方と README に載せた変更 (#3202) は 0.40.0 で出す
    const [major = 0, minor = 0] = version().split(".").map(Number);
    expect(major > 0 || minor >= 40, `package の版 ${version()} が 0.40.0 より前`).toBe(true);
    const released = section(readFileSync(join(ROOT, "CHANGELOG.md"), "utf8").replace(/^## \[0\.40\.0\] - \d{4}-\d{2}-\d{2}$/mu, "## 0.40.0"), "0.40.0");
    expect(released, "CHANGELOG.md に日付付きの ## [0.40.0] の節が無い").not.toBe("");
    for (const issue of ["#3164", "#3202"]) expect(released, `CHANGELOG.md の 0.40.0 の節に ${issue} の項が無い`).toContain(`(${issue})`);
  });

  it("changelog-0-41-0-releases-browser-entry", () => {
    // 頁で描く入口から Node でだけ動く migrateFile を外した変更 (#3206) は 0.41.0 で出す (#3209)
    const [major = 0, minor = 0] = version().split(".").map(Number);
    expect(major > 0 || minor >= 41, `package の版 ${version()} が 0.41.0 より前`).toBe(true);
    const released = section(readFileSync(join(ROOT, "CHANGELOG.md"), "utf8").replace(/^## \[0\.41\.0\] - \d{4}-\d{2}-\d{2}$/mu, "## 0.41.0"), "0.41.0");
    expect(released, "CHANGELOG.md に日付付きの ## [0.41.0] の節が無い").not.toBe("");
    expect(released, "CHANGELOG.md の 0.41.0 の節に #3206 の項が無い").toContain("(#3206)");
  });

  it("changelog-0-41-1-releases-blank-font-fix", () => {
    // 空白の類しか残らない字の file を読める形にして、英語だけの図も書き出せるようにした直し (#3212) は 0.41.1 で出す (#3215)
    const [major = 0, minor = 0, patch = 0] = version().split(".").map(Number);
    expect(major > 0 || minor > 41 || (minor === 41 && patch >= 1), `package の版 ${version()} が 0.41.1 より前`).toBe(true);
    const released = section(readFileSync(join(ROOT, "CHANGELOG.md"), "utf8").replace(/^## \[0\.41\.1\] - \d{4}-\d{2}-\d{2}$/mu, "## 0.41.1"), "0.41.1");
    expect(released, "CHANGELOG.md に日付付きの ## [0.41.1] の節が無い").not.toBe("");
    expect(released, "CHANGELOG.md の 0.41.1 の節に #3212 の項が無い").toContain("(#3212)");
  });

  it("changelog-0-42-0-releases-time-colors-still-links", () => {
    // 時間軸の図 (#3165)、色の値 (#3198)、箱の飛び先と段の出典 (#3199)、止め絵と 1 度だけ流す設定 (#3200) は 0.42.0 で出す (#3222)
    const [major = 0, minor = 0] = version().split(".").map(Number);
    expect(major > 0 || minor >= 42, `package の版 ${version()} が 0.42.0 より前`).toBe(true);
    const released = section(readFileSync(join(ROOT, "CHANGELOG.md"), "utf8").replace(/^## \[0\.42\.0\] - \d{4}-\d{2}-\d{2}$/mu, "## 0.42.0"), "0.42.0");
    expect(released, "CHANGELOG.md に日付付きの ## [0.42.0] の節が無い").not.toBe("");
    for (const issue of ["#3165", "#3198", "#3199", "#3200"]) expect(released, `CHANGELOG.md の 0.42.0 の節に ${issue} の項が無い`).toContain(`(${issue})`);
  });

  it("changelog-0-45-5-releases-time-window-fix", () => {
    // 時間軸の図で針が止まる段の出来事へ窓を寄せる直し (#3284) は 0.45.5 で npm と見本帳に出す (#3286)
    const [major = 0, minor = 0, patch = 0] = version().split(".").map(Number);
    expect(major > 0 || minor > 45 || (minor === 45 && patch >= 5), `package の版 ${version()} が 0.45.5 より前`).toBe(true);
    const released = section(readFileSync(join(ROOT, "CHANGELOG.md"), "utf8").replace(/^## \[0\.45\.5\] - \d{4}-\d{2}-\d{2}$/mu, "## 0.45.5"), "0.45.5");
    expect(released, "CHANGELOG.md に日付付きの ## [0.45.5] の節が無い").not.toBe("");
    expect(released, "CHANGELOG.md の 0.45.5 の節に #3284 の項が無い").toContain("(#3284)");
  });

  it("changelog-0-45-4-releases-lighter-first-load", () => {
    // 使い方と部品の一覧の頁を最初の読み込みから外した変更 (#3280) は 0.45.4 で見本帳に出す (#3282)
    const [major = 0, minor = 0, patch = 0] = version().split(".").map(Number);
    expect(major > 0 || minor > 45 || (minor === 45 && patch >= 4), `package の版 ${version()} が 0.45.4 より前`).toBe(true);
    const released = section(readFileSync(join(ROOT, "CHANGELOG.md"), "utf8").replace(/^## \[0\.45\.4\] - \d{4}-\d{2}-\d{2}$/mu, "## 0.45.4"), "0.45.4");
    expect(released, "CHANGELOG.md に日付付きの ## [0.45.4] の節が無い").not.toBe("");
    expect(released, "CHANGELOG.md の 0.45.4 の節に #3280 の項が無い").toContain("(#3280)");
  });

  it("changelog-0-45-3-releases-narrow-step-buttons", () => {
    // 電話の幅で値の表を持つ図の全体図を出さない直し (#3274) は 0.45.3 で npm と見本帳に出す (#3276)
    const [major = 0, minor = 0, patch = 0] = version().split(".").map(Number);
    expect(major > 0 || minor > 45 || (minor === 45 && patch >= 3), `package の版 ${version()} が 0.45.3 より前`).toBe(true);
    const released = section(readFileSync(join(ROOT, "CHANGELOG.md"), "utf8").replace(/^## \[0\.45\.3\] - \d{4}-\d{2}-\d{2}$/mu, "## 0.45.3"), "0.45.3");
    expect(released, "CHANGELOG.md に日付付きの ## [0.45.3] の節が無い").not.toBe("");
    expect(released, "CHANGELOG.md の 0.45.3 の節に #3274 の項が無い").toContain("(#3274)");
  });

  it("changelog-0-45-2-releases-follow-strip-fix", () => {
    // 寄って追う図の値の表を窓の下へ移した直し (#3270) は 0.45.2 で npm と見本帳に出す (#3272)
    const [major = 0, minor = 0, patch = 0] = version().split(".").map(Number);
    expect(major > 0 || minor > 45 || (minor === 45 && patch >= 2), `package の版 ${version()} が 0.45.2 より前`).toBe(true);
    const released = section(readFileSync(join(ROOT, "CHANGELOG.md"), "utf8").replace(/^## \[0\.45\.2\] - \d{4}-\d{2}-\d{2}$/mu, "## 0.45.2"), "0.45.2");
    expect(released, "CHANGELOG.md に日付付きの ## [0.45.2] の節が無い").not.toBe("");
    expect(released, "CHANGELOG.md の 0.45.2 の節に #3270 の項が無い").toContain("(#3270)");
  });

  it("changelog-0-45-1-releases-site-fixes", () => {
    // 編集画面の状態の欄の直し (#3261) と、図を待つ間の字の位置の直し (#3264) は 0.45.1 で見本帳に出す (#3266)
    const [major = 0, minor = 0, patch = 0] = version().split(".").map(Number);
    expect(major > 0 || minor > 45 || (minor === 45 && patch >= 1), `package の版 ${version()} が 0.45.1 より前`).toBe(true);
    const released = section(readFileSync(join(ROOT, "CHANGELOG.md"), "utf8").replace(/^## \[0\.45\.1\] - \d{4}-\d{2}-\d{2}$/mu, "## 0.45.1"), "0.45.1");
    expect(released, "CHANGELOG.md に日付付きの ## [0.45.1] の節が無い").not.toBe("");
    for (const issue of ["#3261", "#3264"]) expect(released, `CHANGELOG.md の 0.45.1 の節に ${issue} の項が無い`).toContain(`(${issue})`);
  });

  it("changelog-0-45-0-releases-light-entry-and-tall-figure-fix", () => {
    // 軽い入口 (#3248) と、最初に読む量を減らした変更 (#3246) と、図の下が切れる形の直し (#3250) と、受容の記録 (#3251) と、編集画面の状態の欄の直し (#3259) は 0.45.0 で出す (#3258)。0.44.1 は出さない (#3254)
    const [major = 0, minor = 0] = version().split(".").map(Number);
    expect(major > 0 || minor >= 45, `package の版 ${version()} が 0.45.0 より前`).toBe(true);
    const changelog = readFileSync(join(ROOT, "CHANGELOG.md"), "utf8");
    expect(changelog, "出していない 0.44.1 の節が CHANGELOG.md に在る").not.toMatch(/^## \[0\.44\.1\]/mu);
    const released = section(changelog.replace(/^## \[0\.45\.0\] - \d{4}-\d{2}-\d{2}$/mu, "## 0.45.0"), "0.45.0");
    expect(released, "CHANGELOG.md に日付付きの ## [0.45.0] の節が無い").not.toBe("");
    for (const issue of ["#3246", "#3248", "#3250", "#3251", "#3259"]) expect(released, `CHANGELOG.md の 0.45.0 の節に ${issue} の項が無い`).toContain(`(${issue})`);
  });

  it("changelog-0-44-0-releases-lineup-and-tree-fixes", () => {
    // 列の図 (#3239) と、木の図の点線と見本の説明の直し (#3240) は 0.44.0 で出す (#3243)
    const [major = 0, minor = 0] = version().split(".").map(Number);
    expect(major > 0 || minor >= 44, `package の版 ${version()} が 0.44.0 より前`).toBe(true);
    const released = section(readFileSync(join(ROOT, "CHANGELOG.md"), "utf8").replace(/^## \[0\.44\.0\] - \d{4}-\d{2}-\d{2}$/mu, "## 0.44.0"), "0.44.0");
    expect(released, "CHANGELOG.md に日付付きの ## [0.44.0] の節が無い").not.toBe("");
    for (const issue of ["#3239", "#3240"]) expect(released, `CHANGELOG.md の 0.44.0 の節に ${issue} の項が無い`).toContain(`(${issue})`);
  });

  it("changelog-0-43-0-releases-tree", () => {
    // 木の図 (#3233) と、その書き方を載せた変更 (#3235) は 0.43.0 で出す (#3237)
    const [major = 0, minor = 0] = version().split(".").map(Number);
    expect(major > 0 || minor >= 43, `package の版 ${version()} が 0.43.0 より前`).toBe(true);
    const released = section(readFileSync(join(ROOT, "CHANGELOG.md"), "utf8").replace(/^## \[0\.43\.0\] - \d{4}-\d{2}-\d{2}$/mu, "## 0.43.0"), "0.43.0");
    expect(released, "CHANGELOG.md に日付付きの ## [0.43.0] の節が無い").not.toBe("");
    for (const issue of ["#3233", "#3235"]) expect(released, `CHANGELOG.md の 0.43.0 の節に ${issue} の項が無い`).toContain(`(${issue})`);
  });

  it("changelog-0-42-2-releases-font-dedupe", () => {
    // 書き出しが同じ字を 2 つの字の file に重ねて埋めないようにした変更 (#3213) は 0.42.2 で出す (#3229)
    const [major = 0, minor = 0, patch = 0] = version().split(".").map(Number);
    expect(major > 0 || minor > 42 || (minor === 42 && patch >= 2), `package の版 ${version()} が 0.42.2 より前`).toBe(true);
    const released = section(readFileSync(join(ROOT, "CHANGELOG.md"), "utf8").replace(/^## \[0\.42\.2\] - \d{4}-\d{2}-\d{2}$/mu, "## 0.42.2"), "0.42.2");
    expect(released, "CHANGELOG.md に日付付きの ## [0.42.2] の節が無い").not.toBe("");
    expect(released, "CHANGELOG.md の 0.42.2 の節に #3213 の項が無い").toContain("(#3213)");
  });

  it("changelog-records-tree-docs", () => {
    // 木の図の書き方を使い方の頁と README と書き方の手引きに載せた変更 (#3235) を更新履歴に残す。版を切っても項は残るので節を問わない
    expect(readFileSync(join(ROOT, "CHANGELOG.md"), "utf8"), "CHANGELOG.md に #3235 の項が無い").toContain("(#3235)");
  });

  it("changelog-0-42-1-releases-time-docs", () => {
    // 時間軸の図の書き方を使い方の頁と README と書き方の手引きに載せた変更 (#3221) は 0.42.1 で出す (#3225)
    const [major = 0, minor = 0, patch = 0] = version().split(".").map(Number);
    expect(major > 0 || minor > 42 || (minor === 42 && patch >= 1), `package の版 ${version()} が 0.42.1 より前`).toBe(true);
    const released = section(readFileSync(join(ROOT, "CHANGELOG.md"), "utf8").replace(/^## \[0\.42\.1\] - \d{4}-\d{2}-\d{2}$/mu, "## 0.42.1"), "0.42.1");
    expect(released, "CHANGELOG.md に日付付きの ## [0.42.1] の節が無い").not.toBe("");
    expect(released, "CHANGELOG.md の 0.42.1 の節に #3221 の項が無い").toContain("(#3221)");
  });

  it("changelog-lists-time-docs", () => {
    // 時間軸の図の書き方を使い方と README に載せた変更 (#3221) を更新履歴に載せる。版は #3222 が切るので、どの版の節に移っても通る形で見る
    const items = readFileSync(join(ROOT, "CHANGELOG.md"), "utf8")
      .split("\n")
      .filter((line) => line.startsWith("- **"));
    expect(
      items.some((line) => line.includes("(#3221)")),
      "CHANGELOG.md に時間軸の図の書き方を載せた変更 (#3221) の項が無い",
    ).toBe(true);
  });
});
