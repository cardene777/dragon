/**
 * 版の記録 (#3151)。
 *
 * 版を上げるたびに、`package.json` の版を前提の配り方の節と更新履歴の見出しへ手で書き足す。
 * 書き足し忘れても build も他の検査も通るので、ここで版が 2 か所に載っているかを確かめる。
 */
import { execFile, execFileSync, spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";
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

  it("changelog-languages-carry-the-same-versions", () => {
    // 英語の CHANGELOG.md と日本語の CHANGELOG.ja.md は、0.35.0 以降の版を同じ見出しで持ち、版ごとに同じ課題番号を挙げる (#3321)。
    // 版を出す時に片方へ書き忘れると落ちる。0.34.0 以前は作り直す前の記録なので日本語の file だけが持つ
    const read = (file: string): string => readFileSync(join(ROOT, file), "utf8");
    const headings = (text: string): string[] => text.split("\n").filter((line) => /^## \[\d+\.\d+\.\d+\] - \d{4}-\d{2}-\d{2}$/u.test(line));
    const since = (heading: string): boolean => {
      const [major = 0, minor = 0] = (/\[(\d+)\.(\d+)\./u.exec(heading) ?? []).slice(1).map(Number);
      return major > 0 || minor >= 35;
    };
    const issues = (text: string, heading: string): string[] => [...new Set([...section(text, heading.slice(3)).matchAll(/#(\d+)/gu)].map((m) => m[1] ?? ""))].sort();
    const en = read("CHANGELOG.md");
    const ja = read("CHANGELOG.ja.md");
    expect(headings(en), "CHANGELOG.md の版の見出しが CHANGELOG.ja.md の 0.35.0 以降と違う").toEqual(headings(ja).filter(since));
    expect(headings(en).length, "CHANGELOG.md に版の見出しが無い").toBeGreaterThan(0);
    for (const heading of headings(en)) expect(issues(en, heading), `${heading} の節が 2 つの file で違う課題番号を挙げる`).toEqual(issues(ja, heading));
  });

  it("changelog-english-has-no-japanese-prose", () => {
    // 英語の CHANGELOG.md の地の文に日本語を残さない (#3321)。囲みの印の中の字 (前の記法の例など) は書いたままの字なので見ない
    const prose = readFileSync(join(ROOT, "CHANGELOG.md"), "utf8")
      .replace(/```[\s\S]*?```/gu, "")
      .split("\n")
      .map((line, i) => ({ line: i + 1, text: line.replace(/`[^`]*`/gu, "") }));
    const japanese = prose.filter(({ text }) => /[぀-ヿ㐀-鿿]/u.test(text)).map(({ line, text }) => `${line}: ${text.trim()}`);
    expect(japanese, "CHANGELOG.md の地の文に日本語が残る行").toEqual([]);
  });

  it("security-policy-names-no-version", () => {
    // 脆弱性の報告の決まりは、対象の版を番号で書かず「npm の最新の minor」と書く (#3325)。
    // 番号で書いた表は版を出すたびに手で直す形で、0.34.x のまま 12 の版が過ぎた
    for (const file of ["SECURITY.md", "SECURITY.ja.md"]) {
      const text = readFileSync(join(ROOT, file), "utf8");
      expect(text, `${file} が無いか空`).not.toBe("");
      // 1.0 の前の版 (`0.34.x` や `0.46`) を数える。「1.0 の前なので」の 1.0 は対象の版ではないので数えない
      const versions = [...text.matchAll(/(?<![\w.])0\.\d+(?:\.(?:\d+|x))?(?![\w.])/gu)].map((m) => m[0]);
      expect(versions, `${file} が対象の版を番号で書いている`).toEqual([]);
      expect(text, `${file} が Security Advisory の報告の入口を挙げない`).toContain("https://github.com/cardene777/dragon/security/advisories/new");
    }
    expect(readFileSync(join(ROOT, "SECURITY.md"), "utf8"), "SECURITY.md が日本語版へ link しない").toContain("](SECURITY.ja.md)");
    expect(readFileSync(join(ROOT, "SECURITY.ja.md"), "utf8"), "SECURITY.ja.md が英語版へ link しない").toContain("](SECURITY.md)");
  });

  it("package-description-is-english-readme-lead", () => {
    // npm の頁に出る説明文は、README の 1 行目の文から始まる英文にする (#3327)。
    // 日本語で図の種類を 2 つだけ挙げた説明文が、図の種類を足した後も npm に出ていた
    const description = (JSON.parse(readFileSync(join(ROOT, "packages/dragon/package.json"), "utf8")) as { description: string }).description;
    const lead = readFileSync(join(ROOT, "packages/dragon/README.md"), "utf8").split("\n").find((line) => line !== "" && !line.startsWith("#")) ?? "";
    expect(lead, "packages/dragon/README.md に見出しの次の文が無い").not.toBe("");
    expect(description.startsWith(lead), "package.json の description が README の 1 行目の文で始まらない").toBe(true);
    expect(description, "package.json の description に日本語の字が在る").not.toMatch(/[぀-ヿ㐀-鿿]/u);
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

  it("changelog-0-56-0-adds-try-choices", () => {
    // 試す図の入力の帯の欄に選択肢を書く行 (choose) を足す変更 (#3422) は 0.56.0 で npm に出す
    const [major = 0, minor = 0] = version().split(".").map(Number);
    expect(major > 0 || minor >= 56, `package の版 ${version()} が 0.56.0 より前`).toBe(true);
    for (const file of ["CHANGELOG.md", "CHANGELOG.ja.md"]) {
      const released = section(readFileSync(join(ROOT, file), "utf8").replace(/^## \[0\.56\.0\] - \d{4}-\d{2}-\d{2}$/mu, "## 0.56.0"), "0.56.0");
      expect(released, `${file} に日付付きの ## [0.56.0] の節が無い`).not.toBe("");
      expect(released, `${file} の 0.56.0 の節に #3422 の項が無い`).toContain("(#3422)");
      expect(released, `${file} の 0.56.0 の節が choose を名指さない`).toContain("`choose`");
    }
  });

  it("changelog-0-57-0-adds-try-side", () => {
    // 試す図の部品を横に並べる行 (side) を足す変更 (#3429) は 0.57.0 で npm に出す
    const [major = 0, minor = 0] = version().split(".").map(Number);
    expect(major > 0 || minor >= 57, `package の版 ${version()} が 0.57.0 より前`).toBe(true);
    for (const file of ["CHANGELOG.md", "CHANGELOG.ja.md"]) {
      const released = section(readFileSync(join(ROOT, file), "utf8").replace(/^## \[0\.57\.0\] - \d{4}-\d{2}-\d{2}$/mu, "## 0.57.0"), "0.57.0");
      expect(released, `${file} に日付付きの ## [0.57.0] の節が無い`).not.toBe("");
      expect(released, `${file} の 0.57.0 の節に #3429 の項が無い`).toContain("(#3429)");
      expect(released, `${file} の 0.57.0 の節が side を名指さない`).toContain("`side`");
    }
  });

  it("changelog-0-64-0-adds-pipe-gist", () => {
    // 配管の図の段に要点を書く gist の行 (#3464) は 0.64.0 で出す (#3474)
    const [major = 0, minor = 0] = version().split(".").map(Number);
    expect(major > 0 || minor >= 64, `package の版 ${version()} が 0.64.0 より前`).toBe(true);
    for (const file of ["CHANGELOG.md", "CHANGELOG.ja.md"]) {
      const text = readFileSync(join(ROOT, file), "utf8");
      const released = section(text.replace(/^## \[0\.64\.0\] - \d{4}-\d{2}-\d{2}$/mu, "## 0.64.0"), "0.64.0");
      expect(released, `${file} に日付付きの ## [0.64.0] の節が無い`).not.toBe("");
      const entry = released.split("\n- ").find((item) => item.includes("(#3464)")) ?? "";
      expect(entry, `${file} の 0.64.0 の節に #3464 の項が無い`).not.toBe("");
      expect(entry, `${file} の 0.64.0 の節の #3464 の項が gist を名指さない`).toContain("`gist <");
      expect(section(text, "[Unreleased]"), `${file} の Unreleased に出した項が残る`).not.toContain("(#3464)");
    }
  });

  it("changelog-0-65-0-adds-try-gate", () => {
    // 試す図の網の節に check の行で関門を置き、送ったチップを止めて記録に残す変更 (#3476) は 0.65.0 で出す
    const [major = 0, minor = 0] = version().split(".").map(Number);
    expect(major > 0 || minor >= 65, `package の版 ${version()} が 0.65.0 より前`).toBe(true);
    for (const file of ["CHANGELOG.md", "CHANGELOG.ja.md"]) {
      const text = readFileSync(join(ROOT, file), "utf8");
      const released = section(text.replace(/^## \[0\.65\.0\] - \d{4}-\d{2}-\d{2}$/mu, "## 0.65.0"), "0.65.0");
      expect(released, `${file} に日付付きの ## [0.65.0] の節が無い`).not.toBe("");
      const entry = released.split("\n- ").find((item) => item.includes("(#3476)")) ?? "";
      expect(entry, `${file} の 0.65.0 の節に #3476 の項が無い`).not.toBe("");
      expect(entry, `${file} の 0.65.0 の節の #3476 の項が check を名指さない`).toContain("`check <");
      expect(section(text, "[Unreleased]"), `${file} の Unreleased に出した項が残る`).not.toContain("(#3476)");
    }
  });

  it("changelog-0-71-0-lists-export-blocks", () => {
    // 書き出しの --blocks (#3606) と、線が箱の上を通る崩れと見本帳の崩れの直し (#3607) と、配管の図の速さの直し (#3603) を 0.71.0 で出す (#3610)
    expect(version(), "package の版が 0.71.0 でない").toBe("0.71.0");
    for (const file of ["CHANGELOG.md", "CHANGELOG.ja.md"]) {
      const text = readFileSync(join(ROOT, file), "utf8");
      const released = section(text.replace(/^## \[0\.71\.0\] - \d{4}-\d{2}-\d{2}$/mu, "## 0.71.0"), "0.71.0");
      expect(released, `${file} に日付付きの ## [0.71.0] の節が無い`).not.toBe("");
      for (const issue of ["(#3606)", "(#3607)", "(#3603)"]) expect(released, `${file} の 0.71.0 の節に ${issue} の項が無い`).toContain(issue);
      const entry = released.split("\n- ").find((item) => item.includes("--blocks")) ?? "";
      expect(entry, `${file} の 0.71.0 の節に書き出しの --blocks の項が無い`).toContain("`dragon export");
      // 次の版の項は Unreleased に積まれるので、0.71.0 で出した項が残っていないことだけを見る
      for (const issue of ["(#3606)", "(#3607)", "(#3603)"]) expect(section(text, "[Unreleased]"), `${file} の Unreleased に出した項 ${issue} が残る`).not.toContain(issue);
    }
  });

  it("changelog-0-70-0-lists-pipe-words", () => {
    // 配管の図の語を呼ぶ側が渡せるようにした変更 (#3584) を 0.70.0 で出す (#3596)
    const [major = 0, minor = 0] = version().split(".").map(Number);
    expect(major > 0 || minor >= 70, `package の版 ${version()} が 0.70.0 より前`).toBe(true);
    for (const file of ["CHANGELOG.md", "CHANGELOG.ja.md"]) {
      const text = readFileSync(join(ROOT, file), "utf8");
      const released = section(text.replace(/^## \[0\.70\.0\] - \d{4}-\d{2}-\d{2}$/mu, "## 0.70.0"), "0.70.0");
      expect(released, `${file} に日付付きの ## [0.70.0] の節が無い`).not.toBe("");
      const entry = released.split("\n- ").find((item) => item.includes("(#3584)")) ?? "";
      expect(entry, `${file} の 0.70.0 の節に #3584 の項が無い`).not.toBe("");
      expect(entry, `${file} の 0.70.0 の節の #3584 の項が words.pipe を名指さない`).toContain("`words.pipe`");
      expect(section(text, "[Unreleased]"), `${file} の Unreleased に出した項が残る`).not.toContain("(#3584)");
    }
  });

  it("changelog-0-69-0-lists-fork-and-glow", () => {
    // 判断の両方の答えへ同時に走る形 (#3579) と状態図の光の直し (#3575) を 0.69.0 で出す (#3583)
    const [major = 0, minor = 0] = version().split(".").map(Number);
    expect(major > 0 || minor >= 69, `package の版 ${version()} が 0.69.0 より前`).toBe(true);
    for (const file of ["CHANGELOG.md", "CHANGELOG.ja.md"]) {
      const text = readFileSync(join(ROOT, file), "utf8");
      const released = section(text.replace(/^## \[0\.69\.0\] - \d{4}-\d{2}-\d{2}$/mu, "## 0.69.0"), "0.69.0");
      expect(released, `${file} に日付付きの ## [0.69.0] の節が無い`).not.toBe("");
      for (const entry of ["(#3579)", "(#3575)"]) {
        expect(released, `${file} の 0.69.0 の節に ${entry} の項が無い`).toContain(entry);
        expect(section(text, "[Unreleased]"), `${file} の Unreleased に出した ${entry} の項が残る`).not.toContain(entry);
      }
    }
  });

  it("changelog-0-68-1-aligns-task-axis", () => {
    // 工程表の軸の字を棒の字と同じ番号にした直し (#3574) を 0.68.1 で出す (#3577)
    const [major = 0, minor = 0] = version().split(".").map(Number);
    expect(major > 0 || minor >= 68, `package の版 ${version()} が 0.68.1 より前`).toBe(true);
    for (const [file, word] of [
      ["CHANGELOG.md", /\baxis\b/iu],
      ["CHANGELOG.ja.md", /軸の字/u],
    ] as const) {
      const text = readFileSync(join(ROOT, file), "utf8");
      const released = section(text.replace(/^## \[0\.68\.1\] - \d{4}-\d{2}-\d{2}$/mu, "## 0.68.1"), "0.68.1");
      expect(released, `${file} に日付付きの ## [0.68.1] の節が無い`).not.toBe("");
      const entry = released.split("\n- ").find((item) => item.includes("(#3574)")) ?? "";
      expect(entry, `${file} の 0.68.1 の節の #3574 の項が軸の字 (${word.source}) を名指さない`).toMatch(word);
      expect(section(text, "[Unreleased]"), `${file} の Unreleased に出した #3574 の項が残る`).not.toContain("(#3574)");
    }
  });

  it("changelog-0-68-0-adds-player-speed", () => {
    // 再生の部品に流す速さの倍率を渡せるようにした機能 (#3568) を 0.68.0 で出す
    const [major = 0, minor = 0] = version().split(".").map(Number);
    expect(major > 0 || minor >= 68, `package の版 ${version()} が 0.68.0 より前`).toBe(true);
    for (const [file, word] of [
      ["CHANGELOG.md", /\bspeed\b/iu],
      ["CHANGELOG.ja.md", /速さ/u],
    ] as const) {
      const text = readFileSync(join(ROOT, file), "utf8");
      const released = section(text.replace(/^## \[0\.68\.0\] - \d{4}-\d{2}-\d{2}$/mu, "## 0.68.0"), "0.68.0");
      expect(released, `${file} に日付付きの ## [0.68.0] の節が無い`).not.toBe("");
      expect(released, `${file} の 0.68.0 の節に #3568 の項が無い`).toContain("(#3568)");
      expect(section(text, "[Unreleased]"), `${file} の Unreleased に出した #3568 の項が残る`).not.toContain("(#3568)");
      const entry = released.split("\n- ").find((item) => item.includes("(#3568)")) ?? "";
      expect(entry, `${file} の 0.68.0 の節の #3568 の項が再生の速さ (${word.source}) を名指さない`).toMatch(word);
    }
  });

  it("changelog-0-67-0-side-log", () => {
    // 試す図の side の行で記録の列も横に並べる直し (#3506) と、main に入っていたブロックの定義の絵柄 (#3489) も 0.67.0 で出す
    for (const [file, word] of [
      ["CHANGELOG.md", /\blog\b/iu],
      ["CHANGELOG.ja.md", /記録の列/u],
    ] as const) {
      const text = readFileSync(join(ROOT, file), "utf8");
      const released = section(text.replace(/^## \[0\.67\.0\] - \d{4}-\d{2}-\d{2}$/mu, "## 0.67.0"), "0.67.0");
      expect(released, `${file} に日付付きの ## [0.67.0] の節が無い`).not.toBe("");
      for (const issue of ["#3506", "#3489"]) {
        expect(released, `${file} の 0.67.0 の節に ${issue} の項が無い`).toContain(`(${issue})`);
        expect(section(text, "[Unreleased]"), `${file} の Unreleased に出した ${issue} の項が残る`).not.toContain(`(${issue})`);
      }
      const entry = released.split("\n- ").find((item) => item.includes("(#3506)")) ?? "";
      expect(entry, `${file} の 0.67.0 の節の #3506 の項が記録の列 (${word.source}) を名指さない`).toMatch(word);
    }
  });

  it("changelog-0-67-0-ja-space", () => {
    // 試す図の日本語の自動の文から英字の前後の空白を外す直し (#3509) も 0.67.0 で出す
    for (const [file, word] of [
      ["CHANGELOG.md", /\bspaces?\b/iu],
      ["CHANGELOG.ja.md", /空白/u],
    ] as const) {
      const text = readFileSync(join(ROOT, file), "utf8");
      const released = section(text.replace(/^## \[0\.67\.0\] - \d{4}-\d{2}-\d{2}$/mu, "## 0.67.0"), "0.67.0");
      expect(released, `${file} の 0.67.0 の節に #3509 の項が無い`).toContain("(#3509)");
      expect(section(text, "[Unreleased]"), `${file} の Unreleased に出した #3509 の項が残る`).not.toContain("(#3509)");
      const entry = released.split("\n- ").find((item) => item.includes("(#3509)")) ?? "";
      expect(entry, `${file} の 0.67.0 の節の #3509 の項が空白 (${word.source}) を名指さない`).toMatch(word);
    }
  });

  it("changelog-0-67-0-figure-ja-space", () => {
    // 試す図以外の図の日本語の字から和文と英数字の間の空白を外す直し (#3517) も 0.67.0 で出す
    for (const [file, word] of [
      ["CHANGELOG.md", /\bspaces?\b/iu],
      ["CHANGELOG.ja.md", /空白/u],
    ] as const) {
      const text = readFileSync(join(ROOT, file), "utf8");
      const released = section(text.replace(/^## \[0\.67\.0\] - \d{4}-\d{2}-\d{2}$/mu, "## 0.67.0"), "0.67.0");
      expect(released, `${file} の 0.67.0 の節に #3517 の項が無い`).toContain("(#3517)");
      expect(section(text, "[Unreleased]"), `${file} の Unreleased に出した #3517 の項が残る`).not.toContain("(#3517)");
      const entry = released.split("\n- ").find((item) => item.includes("(#3517)")) ?? "";
      expect(entry, `${file} の 0.67.0 の節の #3517 の項が空白 (${word.source}) を名指さない`).toMatch(word);
    }
  });

  it("changelog-0-67-0-try-line-name", () => {
    // 試す図の網の線がノードの名前を横切らないようにし、横切る線を `dragon check --layout` が知らせる直し (#3524) も 0.67.0 で出す
    for (const [file, word] of [
      ["CHANGELOG.md", /\bnode names?\b/iu],
      ["CHANGELOG.ja.md", /ノードの名前/u],
    ] as const) {
      const text = readFileSync(join(ROOT, file), "utf8");
      const released = section(text.replace(/^## \[0\.67\.0\] - \d{4}-\d{2}-\d{2}$/mu, "## 0.67.0"), "0.67.0");
      expect(released, `${file} の 0.67.0 の節に #3524 の項が無い`).toContain("(#3524)");
      expect(section(text, "[Unreleased]"), `${file} の Unreleased に出した #3524 の項が残る`).not.toContain("(#3524)");
      const entry = released.split("\n- ").find((item) => item.includes("(#3524)")) ?? "";
      expect(entry, `${file} の 0.67.0 の節の #3524 の項がノードの名前 (${word.source}) を名指さない`).toMatch(word);
    }
  });

  it("changelog-0-67-0-caret-without-svg", () => {
    // 選ぶ欄の矢印を svg を使わずに描き、図を置いた頁の CSS で膨らまないようにする直し (#3499) は、main に入っていた絵柄集の機能 (#3493) と一緒に 0.67.0 で出す
    const [major = 0, minor = 0] = version().split(".").map(Number);
    expect(major > 0 || minor >= 67, `package の版 ${version()} が 0.67.0 より前`).toBe(true);
    for (const [file, word] of [
      ["CHANGELOG.md", /arrow/iu],
      ["CHANGELOG.ja.md", /矢印/u],
    ] as const) {
      const text = readFileSync(join(ROOT, file), "utf8");
      const released = section(text.replace(/^## \[0\.67\.0\] - \d{4}-\d{2}-\d{2}$/mu, "## 0.67.0"), "0.67.0");
      expect(released, `${file} に日付付きの ## [0.67.0] の節が無い`).not.toBe("");
      for (const issue of ["#3499", "#3493"])
        expect(released, `${file} の 0.67.0 の節に ${issue} の項が無い`).toContain(`(${issue})`);
      const entry = released.split("\n- ").find((item) => item.includes("(#3499)")) ?? "";
      expect(entry, `${file} の 0.67.0 の節の #3499 の項が選ぶ欄の矢印 (${word.source}) を名指さない`).toMatch(word);
      for (const issue of ["#3499", "#3493"])
        expect(section(text, "[Unreleased]"), `${file} の Unreleased に出した ${issue} の項が残る`).not.toContain(`(${issue})`);
    }
  });

  it("changelog-0-66-1-draws-ask-arrow", () => {
    // 試す図の選ぶ欄の矢印を dragon が描いて左右の余白を揃え、次の行へ送った選ぶ欄を伸ばさない直し (#3492) は、別の会話が出す 0.66.0 (#3490) の後に 0.66.1 で出す
    const [major = 0, minor = 0, patch = 0] = version().split(".").map(Number);
    expect(major > 0 || minor > 66 || (minor === 66 && patch >= 1), `package の版 ${version()} が 0.66.1 より前`).toBe(true);
    for (const [file, word] of [
      ["CHANGELOG.md", /arrow/iu],
      ["CHANGELOG.ja.md", /矢印/u],
    ] as const) {
      const text = readFileSync(join(ROOT, file), "utf8");
      const released = section(text.replace(/^## \[0\.66\.1\] - \d{4}-\d{2}-\d{2}$/mu, "## 0.66.1"), "0.66.1");
      expect(released, `${file} に日付付きの ## [0.66.1] の節が無い`).not.toBe("");
      const entry = released.split("\n- ").find((item) => item.includes("(#3492)")) ?? "";
      expect(entry, `${file} の 0.66.1 の節に #3492 の項が無い`).not.toBe("");
      expect(entry, `${file} の 0.66.1 の節の #3492 の項が選ぶ欄の矢印 (${word.source}) を名指さない`).toMatch(word);
      expect(section(text, "[Unreleased]"), `${file} の Unreleased に出した項が残る`).not.toContain("(#3492)");
    }
  });

  it("changelog-0-65-3-fits-ask-choices", () => {
    // 試す図の入力の帯で、選ぶ欄を一番長い候補が収まる幅より縮めず、1 行に入らない欄を次の行へ送る直し (#3485) は 0.65.3 で出す
    const [major = 0, minor = 0, patch = 0] = version().split(".").map(Number);
    expect(major > 0 || minor > 65 || (minor === 65 && patch >= 3), `package の版 ${version()} が 0.65.3 より前`).toBe(true);
    for (const [file, word] of [
      ["CHANGELOG.md", /input strip|ask strip/iu],
      ["CHANGELOG.ja.md", /入力の帯/u],
    ] as const) {
      const text = readFileSync(join(ROOT, file), "utf8");
      const released = section(text.replace(/^## \[0\.65\.3\] - \d{4}-\d{2}-\d{2}$/mu, "## 0.65.3"), "0.65.3");
      expect(released, `${file} に日付付きの ## [0.65.3] の節が無い`).not.toBe("");
      const entry = released.split("\n- ").find((item) => item.includes("(#3485)")) ?? "";
      expect(entry, `${file} の 0.65.3 の節に #3485 の項が無い`).not.toBe("");
      expect(entry, `${file} の 0.65.3 の節の #3485 の項が入力の帯 (${word.source}) を名指さない`).toMatch(word);
      expect(section(text, "[Unreleased]"), `${file} の Unreleased に出した項が残る`).not.toContain("(#3485)");
    }
  });

  it("changelog-0-66-0-adds-readable-zoom", () => {
    // 狭い枠で配管の図を箱の名前が読める大きさから始める設定 (#3483) と、描いた図の崩れの確かめ (#3484) は 0.66.0 で出す (#3490)
    const [major = 0, minor = 0] = version().split(".").map(Number);
    expect(major > 0 || minor >= 66, `package の版 ${version()} が 0.66.0 より前`).toBe(true);
    for (const file of ["CHANGELOG.md", "CHANGELOG.ja.md"]) {
      const text = readFileSync(join(ROOT, file), "utf8");
      const released = section(text.replace(/^## \[0\.66\.0\] - \d{4}-\d{2}-\d{2}$/mu, "## 0.66.0"), "0.66.0");
      expect(released, `${file} に日付付きの ## [0.66.0] の節が無い`).not.toBe("");
      const zoom = released.split("\n- ").find((item) => item.includes("(#3483)")) ?? "";
      expect(zoom, `${file} の 0.66.0 の節の #3483 の項が zoom: "readable" を名指さない`).toContain('`zoom: "readable"`');
      expect(released, `${file} の 0.66.0 の節に #3484 の項が無い`).toContain("(#3484)");
      const unreleased = section(text, "[Unreleased]");
      for (const issue of ["(#3483)", "(#3484)"]) expect(unreleased, `${file} の Unreleased に出した項 ${issue} が残る`).not.toContain(issue);
      // 取り込みで残った衝突の印の行が、変更の一覧に残らない
      expect(text, `${file} に衝突の印の行が残る`).not.toMatch(/^(?:<{7}|\|{7}|>{7})(?: |$)/mu);
    }
  });

  it("changelog-0-65-2-splits-gate-records", () => {
    // 試す図の関門の記録で止まった節の行とエラーの名前の行を分け、記録が増えても図の幅を 740 と 324 に収める直し (#3478) は、別の会話が先に 0.65.2 を出したので 0.65.2 で出す
    const [major = 0, minor = 0, patch = 0] = version().split(".").map(Number);
    expect(major > 0 || minor > 65 || (minor === 65 && patch >= 2), `package の版 ${version()} が 0.65.2 より前`).toBe(true);
    for (const [file, word] of [
      ["CHANGELOG.md", /\bgate/iu],
      ["CHANGELOG.ja.md", /関門/u],
    ] as const) {
      const text = readFileSync(join(ROOT, file), "utf8");
      const released = section(text.replace(/^## \[0\.65\.2\] - \d{4}-\d{2}-\d{2}$/mu, "## 0.65.2"), "0.65.2");
      expect(released, `${file} に日付付きの ## [0.65.2] の節が無い`).not.toBe("");
      const entry = released.split("\n- ").find((item) => item.includes("(#3478)")) ?? "";
      expect(entry, `${file} の 0.65.2 の節に #3478 の項が無い`).not.toBe("");
      expect(entry, `${file} の 0.65.2 の節の #3478 の項が関門の記録 (${word.source}) を名指さない`).toMatch(word);
      expect(section(text, "[Unreleased]"), `${file} の Unreleased に出した項が残る`).not.toContain("(#3478)");
    }
  });

  it("changelog-0-65-1-draws-opened-pipes-faster", () => {
    // 開いた箱を持つ配管の図を、どの管の道も変えずに速く描く直し (#3472) は 0.65.1 で出す (#3480)
    const [major = 0, minor = 0, patch = 0] = version().split(".").map(Number);
    expect(major > 0 || minor > 65 || (minor === 65 && patch >= 1), `package の版 ${version()} が 0.65.1 より前`).toBe(true);
    for (const file of ["CHANGELOG.md", "CHANGELOG.ja.md"]) {
      const text = readFileSync(join(ROOT, file), "utf8");
      const released = section(text.replace(/^## \[0\.65\.1\] - \d{4}-\d{2}-\d{2}$/mu, "## 0.65.1"), "0.65.1");
      expect(released, `${file} に日付付きの ## [0.65.1] の節が無い`).not.toBe("");
      const entry = released.split("\n- ").find((item) => item.includes("(#3472)")) ?? "";
      expect(entry, `${file} の 0.65.1 の節に #3472 の項が無い`).not.toBe("");
      expect(entry, `${file} の 0.65.1 の節の #3472 の項が aggregator を名指さない`).toContain("`aggregator`");
      expect(section(text, "[Unreleased]"), `${file} の Unreleased に出した項が残る`).not.toContain("(#3472)");
    }
  });

  it("changelog-0-63-2-fixes-missing-arrow-target", () => {
    // 矢印の先を書き忘れた線の行に dragon check が線の行の形の文を返す直し (#3468) は 0.63.2 で出す (#3470)
    const [major = 0, minor = 0, patch = 0] = version().split(".").map(Number);
    expect(major > 0 || minor > 63 || (minor === 63 && patch >= 2), `package の版 ${version()} が 0.63.2 より前`).toBe(true);
    for (const file of ["CHANGELOG.md", "CHANGELOG.ja.md"]) {
      const text = readFileSync(join(ROOT, file), "utf8");
      const released = section(text.replace(/^## \[0\.63\.2\] - \d{4}-\d{2}-\d{2}$/mu, "## 0.63.2"), "0.63.2");
      expect(released, `${file} に日付付きの ## [0.63.2] の節が無い`).not.toBe("");
      const entry = released.split("\n- ").find((item) => item.includes("(#3468)")) ?? "";
      expect(entry, `${file} の 0.63.2 の節に #3468 の項が無い`).not.toBe("");
      expect(entry, `${file} の 0.63.2 の節の #3468 の項が dragon check を名指さない`).toContain("`dragon check`");
      expect(section(text, "[Unreleased]"), `${file} の Unreleased に出した項が残る`).not.toContain("(#3468)");
    }
  });

  it("changelog-0-63-1-keeps-try-chip-names", () => {
    // 試す図のチップの名前を切らずに出し、入力の帯の打つ欄を 12 字までにした直し (#3458) は 0.63.1 で出す
    const [major = 0, minor = 0, patch = 0] = version().split(".").map(Number);
    expect(major > 0 || minor > 63 || (minor === 63 && patch >= 1), `package の版 ${version()} が 0.63.1 より前`).toBe(true);
    const words = { "CHANGELOG.md": "12 characters", "CHANGELOG.ja.md": "12 字" };
    for (const [file, word] of Object.entries(words)) {
      const text = readFileSync(join(ROOT, file), "utf8");
      const released = section(text.replace(/^## \[0\.63\.1\] - \d{4}-\d{2}-\d{2}$/mu, "## 0.63.1"), "0.63.1");
      expect(released, `${file} に日付付きの ## [0.63.1] の節が無い`).not.toBe("");
      const entry = released.split("\n- ").find((item) => item.includes("(#3458)")) ?? "";
      expect(entry, `${file} の 0.63.1 の節に #3458 の項が無い`).not.toBe("");
      expect(entry, `${file} の 0.63.1 の節の #3458 の項が打つ欄の上限 (${word}) を名指さない`).toContain(word);
      expect(section(text, "[Unreleased]"), `${file} の Unreleased に出した項が残る`).not.toContain("(#3458)");
    }
  });

  it("changelog-0-63-0-adds-check-and-shared-blocks", () => {
    // 記法を確かめる命令 dragon check と共有のブロック集と Markdown の囲みの描画 (#3455) は 0.63.0 で npm に出す (#3461)
    const [major = 0, minor = 0] = version().split(".").map(Number);
    expect(major > 0 || minor >= 63, `package の版 ${version()} が 0.63.0 より前`).toBe(true);
    for (const file of ["CHANGELOG.md", "CHANGELOG.ja.md"]) {
      const text = readFileSync(join(ROOT, file), "utf8");
      const released = section(text.replace(/^## \[0\.63\.0\] - \d{4}-\d{2}-\d{2}$/mu, "## 0.63.0"), "0.63.0");
      expect(released, `${file} に日付付きの ## [0.63.0] の節が無い`).not.toBe("");
      // 版上げの後に入った配管の図の直し (#3450) も 0.63.0 で出す (#3466)
      for (const issue of ["(#3455)", "(#3450)"]) expect(released, `${file} の 0.63.0 の節に ${issue} の項が無い`).toContain(issue);
      for (const name of ["`dragon check`", "`dragon --version`", "`+bridge`", "`<pre><code class=\"language-dragon\">`"]) {
        expect(released, `${file} の 0.63.0 の節が ${name} を名指さない`).toContain(name);
      }
      for (const issue of ["(#3455)", "(#3450)"]) expect(section(text, "[Unreleased]"), `${file} の Unreleased に出した項が残る`).not.toContain(issue);
    }
  });

  it("changelog-0-62-0-adds-accept-gather", () => {
    // 試す図の待ち行列に入れてよい名前を書く accept と、釦の from に 2 つ以上の待ち行列を書いて集める形 (#3453) は 0.62.0 で npm に出す
    const [major = 0, minor = 0] = version().split(".").map(Number);
    expect(major > 0 || minor >= 62, `package の版 ${version()} が 0.62.0 より前`).toBe(true);
    for (const file of ["CHANGELOG.md", "CHANGELOG.ja.md"]) {
      const text = readFileSync(join(ROOT, file), "utf8");
      const released = section(text.replace(/^## \[0\.62\.0\] - \d{4}-\d{2}-\d{2}$/mu, "## 0.62.0"), "0.62.0");
      expect(released, `${file} に日付付きの ## [0.62.0] の節が無い`).not.toBe("");
      expect(released, `${file} の 0.62.0 の節に #3453 の項が無い`).toContain("(#3453)");
      const entry = released.split("\n- ").find((item) => item.includes("(#3453)")) ?? "";
      expect(entry, `${file} の 0.62.0 の節の #3453 の項が accept を名指さない`).toContain("`accept`");
      expect(entry, `${file} の 0.62.0 の節の #3453 の項が from を名指さない`).toContain("`from`");
      expect(section(text, "[Unreleased]"), `${file} の Unreleased に出した項が残る`).not.toContain("(#3453)");
    }
  });

  it("changelog-0-61-0-releases-pipe-and-player", () => {
    // 配管の図の重なりの直し (#3418) と段を送る時に図を写し直さない変更 (#3445) は、変更の一覧に項を書かずに取り込まれたので、0.61.0 の節で書いて npm に出す (#3452)
    const [major = 0, minor = 0] = version().split(".").map(Number);
    expect(major > 0 || minor >= 61, `package の版 ${version()} が 0.61.0 より前`).toBe(true);
    for (const file of ["CHANGELOG.md", "CHANGELOG.ja.md"]) {
      const text = readFileSync(join(ROOT, file), "utf8");
      const released = section(text.replace(/^## \[0\.61\.0\] - \d{4}-\d{2}-\d{2}$/mu, "## 0.61.0"), "0.61.0");
      expect(released, `${file} に日付付きの ## [0.61.0] の節が無い`).not.toBe("");
      for (const issue of ["(#3418)", "(#3445)"]) expect(released, `${file} の 0.61.0 の節に ${issue} の項が無い`).toContain(issue);
      // 公開する型を外したことを、使う人が変更の一覧で知れるようにする
      for (const name of ["`pipeViolations`", "`PIPE_RULES`", "`PipeCallout`", "`PipeTone`"]) expect(released, `${file} の 0.61.0 の節が ${name} を名指さない`).toContain(name);
      // 0.60.0 と 0.59.0 の検査と同じく、出した項が Unreleased に残らないことだけを見る。後の課題の項は Unreleased に足す (#3455)
      for (const issue of ["(#3418)", "(#3445)"]) expect(section(text, "[Unreleased]"), `${file} の Unreleased に出した項が残る`).not.toContain(issue);
    }
  });

  it("changelog-0-60-0-adds-try-log", () => {
    // 試す図の into に欄を書いて行き先を選ぶ形と、鎖でない記録の列 log (#3441) は 0.60.0 で npm に出す
    const [major = 0, minor = 0] = version().split(".").map(Number);
    expect(major > 0 || minor >= 60, `package の版 ${version()} が 0.60.0 より前`).toBe(true);
    for (const file of ["CHANGELOG.md", "CHANGELOG.ja.md"]) {
      const text = readFileSync(join(ROOT, file), "utf8");
      const released = section(text.replace(/^## \[0\.60\.0\] - \d{4}-\d{2}-\d{2}$/mu, "## 0.60.0"), "0.60.0");
      expect(released, `${file} に日付付きの ## [0.60.0] の節が無い`).not.toBe("");
      expect(released, `${file} の 0.60.0 の節に #3441 の項が無い`).toContain("(#3441)");
      expect(released, `${file} の 0.60.0 の節が log を名指さない`).toContain("`log`");
      expect(released, `${file} の 0.60.0 の節が into を名指さない`).toContain("`into`");
      expect(section(text, "[Unreleased]"), `${file} の Unreleased に出した項が残る`).not.toContain("(#3441)");
    }
  });

  it("changelog-0-59-0-releases-short-notation", () => {
    // 宣言と段を省いた短い記法 (#3438) は 0.59.0 で npm に出す
    const [major = 0, minor = 0] = version().split(".").map(Number);
    expect(major > 0 || minor >= 59, `package の版 ${version()} が 0.59.0 より前`).toBe(true);
    const words = { "CHANGELOG.md": "short form", "CHANGELOG.ja.md": "短い記法" };
    for (const [file, word] of Object.entries(words)) {
      const text = readFileSync(join(ROOT, file), "utf8");
      const released = section(text.replace(/^## \[0\.59\.0\] - \d{4}-\d{2}-\d{2}$/mu, "## 0.59.0"), "0.59.0");
      expect(released, `${file} に日付付きの ## [0.59.0] の節が無い`).not.toBe("");
      expect(released, `${file} の 0.59.0 の節に #3438 の項が無い`).toContain("(#3438)");
      expect(released, `${file} の 0.59.0 の節が短い記法を名指さない`).toContain(word);
      expect(section(text, "[Unreleased]"), `${file} の Unreleased に出した項が残る`).not.toContain("(#3438)");
    }
  });

  it("changelog-0-58-0-moves-try-caption", () => {
    // 試す図の段の説明とゲージの帯を図の枠のすぐ下、入力の帯の上へ移す変更 (#3437) は 0.58.0 で npm に出す
    const [major = 0, minor = 0] = version().split(".").map(Number);
    expect(major > 0 || minor >= 58, `package の版 ${version()} が 0.58.0 より前`).toBe(true);
    const words = { "CHANGELOG.md": "input strip", "CHANGELOG.ja.md": "入力の帯" };
    for (const [file, word] of Object.entries(words)) {
      const released = section(readFileSync(join(ROOT, file), "utf8").replace(/^## \[0\.58\.0\] - \d{4}-\d{2}-\d{2}$/mu, "## 0.58.0"), "0.58.0");
      expect(released, `${file} に日付付きの ## [0.58.0] の節が無い`).not.toBe("");
      expect(released, `${file} の 0.58.0 の節に #3437 の項が無い`).toContain("(#3437)");
      expect(released, `${file} の 0.58.0 の節が入力の帯を名指さない`).toContain(word);
    }
  });

  it("changelog-0-56-0-lists-pipe-redesign", () => {
    // 全ての図の再生の操作の並べ替えと配管の図の描き直し (#3398) も 0.56.0 で npm に出すため、2 つの変更履歴の 0.56.0 の節に項を置く (#3426)
    const controls = { "CHANGELOG.md": "player controls", "CHANGELOG.ja.md": "再生の操作" };
    for (const [file, words] of Object.entries(controls)) {
      const released = section(readFileSync(join(ROOT, file), "utf8").replace(/^## \[0\.56\.0\] - \d{4}-\d{2}-\d{2}$/mu, "## 0.56.0"), "0.56.0");
      expect(released, `${file} の 0.56.0 の節に #3398 の項が無い`).toContain("(#3398)");
      expect(released, `${file} の 0.56.0 の節が色味 sea を名指さない`).toContain("`sea`");
      expect(released, `${file} の 0.56.0 の節が再生の操作の並べ替えを名指さない`).toContain(words);
    }
  });

  it("changelog-0-55-1-releases-try-on-light-entry", () => {
    // 軽い入口で記法から読んだ試す図を置けるようにした直し (#3416) は 0.55.1 で npm に出す
    const [major = 0, minor = 0, patch = 0] = version().split(".").map(Number);
    expect(major > 0 || minor > 55 || (minor === 55 && patch >= 1), `package の版 ${version()} が 0.55.1 より前`).toBe(true);
    for (const file of ["CHANGELOG.md", "CHANGELOG.ja.md"]) {
      const released = section(readFileSync(join(ROOT, file), "utf8").replace(/^## \[0\.55\.1\] - \d{4}-\d{2}-\d{2}$/mu, "## 0.55.1"), "0.55.1");
      expect(released, `${file} に日付付きの ## [0.55.1] の節が無い`).not.toBe("");
      expect(released, `${file} の 0.55.1 の節に #3416 の項が無い`).toContain("(#3416)");
    }
  });

  it("changelog-0-55-0-releases-pool-grid-and-block-samples", () => {
    // 見本帳でブロックの足し方を見せる変更 (#3407) と、順番の無い置き場のチップを格子に並べる変更 (#3408) は 0.55.0 で npm に出す (#3412)
    const [major = 0, minor = 0] = version().split(".").map(Number);
    expect(major > 0 || minor >= 55, `package の版 ${version()} が 0.55.0 より前`).toBe(true);
    for (const file of ["CHANGELOG.md", "CHANGELOG.ja.md"]) {
      const released = section(readFileSync(join(ROOT, file), "utf8").replace(/^## \[0\.55\.0\] - \d{4}-\d{2}-\d{2}$/mu, "## 0.55.0"), "0.55.0");
      expect(released, `${file} に日付付きの ## [0.55.0] の節が無い`).not.toBe("");
      for (const issue of ["#3407", "#3408"]) expect(released, `${file} の 0.55.0 の節に ${issue} の項が無い`).toContain(`(${issue})`);
    }
  });

  it("changelog-0-54-0-releases-lighter-first-load", () => {
    // 記法から読んだ図は描く時に原本の形の検査を省き、頁が最初に読む script から検査を外した変更 (#3400) は 0.54.0 で npm に出す (#3405)
    const [major = 0, minor = 0] = version().split(".").map(Number);
    expect(major > 0 || minor >= 54, `package の版 ${version()} が 0.54.0 より前`).toBe(true);
    for (const file of ["CHANGELOG.md", "CHANGELOG.ja.md"]) {
      const released = section(readFileSync(join(ROOT, file), "utf8").replace(/^## \[0\.54\.0\] - \d{4}-\d{2}-\d{2}$/mu, "## 0.54.0"), "0.54.0");
      expect(released, `${file} に日付付きの ## [0.54.0] の節が無い`).not.toBe("");
      expect(released, `${file} の 0.54.0 の節に #3400 の項が無い`).toContain("(#3400)");
    }
  });

  it("changelog-0-53-0-releases-pipe-and-user-blocks", () => {
    // 配管の図 (#3389) と、使う人が手元でブロックを足す口 (#3399) は 0.53.0 で npm に出す (#3402)
    const [major = 0, minor = 0] = version().split(".").map(Number);
    expect(major > 0 || minor >= 53, `package の版 ${version()} が 0.53.0 より前`).toBe(true);
    for (const file of ["CHANGELOG.md", "CHANGELOG.ja.md"]) {
      const released = section(readFileSync(join(ROOT, file), "utf8").replace(/^## \[0\.53\.0\] - \d{4}-\d{2}-\d{2}$/mu, "## 0.53.0"), "0.53.0");
      expect(released, `${file} に日付付きの ## [0.53.0] の節が無い`).not.toBe("");
      for (const issue of ["#3389", "#3399"]) expect(released, `${file} の 0.53.0 の節に ${issue} の項が無い`).toContain(`(${issue})`);
    }
  });

  it("changelog-0-52-0-releases-square-bends-and-readme-idea", () => {
    // arcade の線の折れ目を直角にした変更 (#3358) と README の考え方の節 (#3391) は 0.52.0 で npm に出す (#3393)
    const [major = 0, minor = 0] = version().split(".").map(Number);
    expect(major > 0 || minor >= 52, `package の版 ${version()} が 0.52.0 より前`).toBe(true);
    for (const file of ["CHANGELOG.md", "CHANGELOG.ja.md"]) {
      const released = section(readFileSync(join(ROOT, file), "utf8").replace(/^## \[0\.52\.0\] - \d{4}-\d{2}-\d{2}$/mu, "## 0.52.0"), "0.52.0");
      expect(released, `${file} に日付付きの ## [0.52.0] の節が無い`).not.toBe("");
      for (const issue of ["#3358", "#3391"]) expect(released, `${file} の 0.52.0 の節に ${issue} の項が無い`).toContain(`(${issue})`);
    }
  });

  it("changelog-0-51-0-releases-pinned-chunks", () => {
    // 入口が自分の版の場所から本体と塊を読む直し (#3375) は 0.51.0 で npm に出す。0.50.1 にすると 0.50.0 の入口を残した browser が壊れる (#3377)
    const [major = 0, minor = 0] = version().split(".").map(Number);
    expect(major > 0 || minor >= 51, `package の版 ${version()} が 0.51.0 より前`).toBe(true);
    for (const file of ["CHANGELOG.md", "CHANGELOG.ja.md"]) {
      const released = section(readFileSync(join(ROOT, file), "utf8").replace(/^## \[0\.51\.0\] - \d{4}-\d{2}-\d{2}$/mu, "## 0.51.0"), "0.51.0");
      expect(released, `${file} に日付付きの ## [0.51.0] の節が無い`).not.toBe("");
      expect(released, `${file} の 0.51.0 の節に #3375 の項が無い`).toContain("(#3375)");
    }
  });

  it("changelog-0-50-0-releases-script-entry", () => {
    // script の 1 行の入口と dragon embed の命令 (#3343) は 0.50.0 で npm に出す (#3373)
    const [major = 0, minor = 0] = version().split(".").map(Number);
    expect(major > 0 || minor >= 50, `package の版 ${version()} が 0.50.0 より前`).toBe(true);
    for (const file of ["CHANGELOG.md", "CHANGELOG.ja.md"]) {
      const released = section(readFileSync(join(ROOT, file), "utf8").replace(/^## \[0\.50\.0\] - \d{4}-\d{2}-\d{2}$/mu, "## 0.50.0"), "0.50.0");
      expect(released, `${file} に日付付きの ## [0.50.0] の節が無い`).not.toBe("");
      expect(released, `${file} の 0.50.0 の節に #3343 の項が無い`).toContain("(#3343)");
    }
  });

  it("changelog-0-49-0-releases-narrow-frames", () => {
    // 軽い入口の読み方 (#3349)、縦に組んだ列の図の窓 (#3365)、狭い枠の試す図 (#3366) は 0.49.0 で npm に出す (#3370)
    const [major = 0, minor = 0] = version().split(".").map(Number);
    expect(major > 0 || minor >= 49, `package の版 ${version()} が 0.49.0 より前`).toBe(true);
    for (const file of ["CHANGELOG.md", "CHANGELOG.ja.md"]) {
      const released = section(readFileSync(join(ROOT, file), "utf8").replace(/^## \[0\.49\.0\] - \d{4}-\d{2}-\d{2}$/mu, "## 0.49.0"), "0.49.0");
      expect(released, `${file} に日付付きの ## [0.49.0] の節が無い`).not.toBe("");
      for (const issue of ["#3349", "#3365", "#3366"]) expect(released, `${file} の 0.49.0 の節に ${issue} の項が無い`).toContain(`(${issue})`);
    }
  });

  it("changelog-0-48-0-releases-try-and-arcade", () => {
    // 試す図 (#3337)、色味 arcade (#3341) と角の形 (#3344)、原本の版 2 (#3346) は 0.48.0 で npm に出す (#3362)
    const [major = 0, minor = 0] = version().split(".").map(Number);
    expect(major > 0 || minor >= 48, `package の版 ${version()} が 0.48.0 より前`).toBe(true);
    for (const file of ["CHANGELOG.md", "CHANGELOG.ja.md"]) {
      const released = section(readFileSync(join(ROOT, file), "utf8").replace(/^## \[0\.48\.0\] - \d{4}-\d{2}-\d{2}$/mu, "## 0.48.0"), "0.48.0");
      expect(released, `${file} に日付付きの ## [0.48.0] の節が無い`).not.toBe("");
      for (const issue of ["#3337", "#3341", "#3344", "#3346"]) expect(released, `${file} の 0.48.0 の節に ${issue} の項が無い`).toContain(`(${issue})`);
    }
  });

  it("changelog-0-47-0-releases-english-default", () => {
    // lang を渡さない時の文を英語にした変更 (#3338) は 0.47.0 で出し、日本語を保つ書き方を変更履歴に載せる
    const [major = 0, minor = 0] = version().split(".").map(Number);
    expect(major > 0 || minor >= 47, `package の版 ${version()} が 0.47.0 より前`).toBe(true);
    for (const file of ["CHANGELOG.md", "CHANGELOG.ja.md"]) {
      const released = section(readFileSync(join(ROOT, file), "utf8").replace(/^## \[0\.47\.0\] - \d{4}-\d{2}-\d{2}$/mu, "## 0.47.0"), "0.47.0");
      expect(released, `${file} に日付付きの ## [0.47.0] の節が無い`).not.toBe("");
      expect(released, `${file} の 0.47.0 の節に #3338 の項が無い`).toContain("(#3338)");
      expect(released, `${file} の 0.47.0 の節に日本語を保つ書き方が無い`).toContain('lang: "ja"');
      expect(released, `${file} の 0.47.0 の節に命令で日本語を保つ書き方が無い`).toContain("--lang ja");
    }
  });

  it("changelog-0-46-4-releases-readable-linked-figures", () => {
    // 飛び先を持つ図を流す時に SVG を読み上げから隠さない直し (#3329) は 0.46.4 で npm と見本帳に出す (#3329)
    const [major = 0, minor = 0, patch = 0] = version().split(".").map(Number);
    expect(major > 0 || minor > 46 || (minor === 46 && patch >= 4), `package の版 ${version()} が 0.46.4 より前`).toBe(true);
    for (const file of ["CHANGELOG.md", "CHANGELOG.ja.md"]) {
      const released = section(readFileSync(join(ROOT, file), "utf8").replace(/^## \[0\.46\.4\] - \d{4}-\d{2}-\d{2}$/mu, "## 0.46.4"), "0.46.4");
      expect(released, `${file} に日付付きの ## [0.46.4] の節が無い`).not.toBe("");
      expect(released, `${file} の 0.46.4 の節に #3329 の項が無い`).toContain("(#3329)");
    }
  });

  it("changelog-0-46-3-releases-english-npm-description", () => {
    // npm の頁の説明文を英語に直した変更は 0.46.3 で npm にだけ出す (#3327)
    const [major = 0, minor = 0, patch = 0] = version().split(".").map(Number);
    expect(major > 0 || minor > 46 || (minor === 46 && patch >= 3), `package の版 ${version()} が 0.46.3 より前`).toBe(true);
    for (const file of ["CHANGELOG.md", "CHANGELOG.ja.md"]) {
      const released = section(readFileSync(join(ROOT, file), "utf8").replace(/^## \[0\.46\.3\] - \d{4}-\d{2}-\d{2}$/mu, "## 0.46.3"), "0.46.3");
      expect(released, `${file} に日付付きの ## [0.46.3] の節が無い`).not.toBe("");
      expect(released, `${file} の 0.46.3 の節に #3327 の項が無い`).toContain("(#3327)");
    }
  });

  it("changelog-0-46-2-releases-changelog-per-language", () => {
    // 変更履歴を英語と日本語に分けた変更 (#3321) は 0.46.2 で見本帳だけに出す (#3323)
    const [major = 0, minor = 0, patch = 0] = version().split(".").map(Number);
    expect(major > 0 || minor > 46 || (minor === 46 && patch >= 2), `package の版 ${version()} が 0.46.2 より前`).toBe(true);
    for (const file of ["CHANGELOG.md", "CHANGELOG.ja.md"]) {
      const released = section(readFileSync(join(ROOT, file), "utf8").replace(/^## \[0\.46\.2\] - \d{4}-\d{2}-\d{2}$/mu, "## 0.46.2"), "0.46.2");
      expect(released, `${file} に日付付きの ## [0.46.2] の節が無い`).not.toBe("");
      expect(released, `${file} の 0.46.2 の節に #3321 の項が無い`).toContain("(#3321)");
    }
  });

  it("changelog-0-46-1-releases-english-readme-and-near-icon", () => {
    // 近いアイコン名を示す直し (#3315) と英語の README (#3317) は 0.46.1 で npm と見本帳に出す (#3319)
    const [major = 0, minor = 0, patch = 0] = version().split(".").map(Number);
    expect(major > 0 || minor > 46 || (minor === 46 && patch >= 1), `package の版 ${version()} が 0.46.1 より前`).toBe(true);
    const released = section(readFileSync(join(ROOT, "CHANGELOG.md"), "utf8").replace(/^## \[0\.46\.1\] - \d{4}-\d{2}-\d{2}$/mu, "## 0.46.1"), "0.46.1");
    expect(released, "CHANGELOG.md に日付付きの ## [0.46.1] の節が無い").not.toBe("");
    for (const issue of ["#3315", "#3317"]) expect(released, `CHANGELOG.md の 0.46.1 の節に ${issue} の項が無い`).toContain(`(${issue})`);
  });

  it("changelog-0-46-0-releases-box-text-and-icon-names", () => {
    // 箱の名前の高さ (#3307) と下の字の高さ (#3309) の直しと、知らないアイコン名を断る直し (#3311) は 0.46.0 で npm と見本帳に出す (#3313)
    const [major = 0, minor = 0] = version().split(".").map(Number);
    expect(major > 0 || minor >= 46, `package の版 ${version()} が 0.46.0 より前`).toBe(true);
    const released = section(readFileSync(join(ROOT, "CHANGELOG.md"), "utf8").replace(/^## \[0\.46\.0\] - \d{4}-\d{2}-\d{2}$/mu, "## 0.46.0"), "0.46.0");
    expect(released, "CHANGELOG.md に日付付きの ## [0.46.0] の節が無い").not.toBe("");
    for (const issue of ["#3307", "#3309", "#3311"]) expect(released, `CHANGELOG.md の 0.46.0 の節に ${issue} の項が無い`).toContain(`(${issue})`);
  });

  it("changelog-0-45-8-releases-site-font", () => {
    // 見本帳で使う字を 1 つの file にまとめる直し (#3296) は 0.45.8 で見本帳に出す (#3298)
    const [major = 0, minor = 0, patch = 0] = version().split(".").map(Number);
    expect(major > 0 || minor > 45 || (minor === 45 && patch >= 8), `package の版 ${version()} が 0.45.8 より前`).toBe(true);
    const released = section(readFileSync(join(ROOT, "CHANGELOG.md"), "utf8").replace(/^## \[0\.45\.8\] - \d{4}-\d{2}-\d{2}$/mu, "## 0.45.8"), "0.45.8");
    expect(released, "CHANGELOG.md に日付付きの ## [0.45.8] の節が無い").not.toBe("");
    expect(released, "CHANGELOG.md の 0.45.8 の節に #3296 の項が無い").toContain("(#3296)");
  });

  it("changelog-0-45-7-releases-font-css-later", () => {
    // 字の `@font-face` を最初の CSS から外す直し (#3292) は 0.45.7 で見本帳に出す (#3294)
    const [major = 0, minor = 0, patch = 0] = version().split(".").map(Number);
    expect(major > 0 || minor > 45 || (minor === 45 && patch >= 7), `package の版 ${version()} が 0.45.7 より前`).toBe(true);
    const released = section(readFileSync(join(ROOT, "CHANGELOG.md"), "utf8").replace(/^## \[0\.45\.7\] - \d{4}-\d{2}-\d{2}$/mu, "## 0.45.7"), "0.45.7");
    expect(released, "CHANGELOG.md に日付付きの ## [0.45.7] の節が無い").not.toBe("");
    expect(released, "CHANGELOG.md の 0.45.7 の節に #3292 の項が無い").toContain("(#3292)");
  });

  it("changelog-0-45-6-releases-page-chunk-reload", () => {
    // 通信が切れて頁の塊を読めなかった時に 1 度だけ読み直す直し (#3288) は 0.45.6 で見本帳に出す (#3290)
    const [major = 0, minor = 0, patch = 0] = version().split(".").map(Number);
    expect(major > 0 || minor > 45 || (minor === 45 && patch >= 6), `package の版 ${version()} が 0.45.6 より前`).toBe(true);
    const released = section(readFileSync(join(ROOT, "CHANGELOG.md"), "utf8").replace(/^## \[0\.45\.6\] - \d{4}-\d{2}-\d{2}$/mu, "## 0.45.6"), "0.45.6");
    expect(released, "CHANGELOG.md に日付付きの ## [0.45.6] の節が無い").not.toBe("");
    expect(released, "CHANGELOG.md の 0.45.6 の節に #3288 の項が無い").toContain("(#3288)");
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

describe("Release の本文 (#3335)", () => {
  // GitHub Release の本文は scripts/release-notes.mjs が CHANGELOG.md の版の節から作る
  const SCRIPT = join(ROOT, "scripts/release-notes.mjs");
  const notes = (version: string, file?: string): string =>
    execFileSync("node", [SCRIPT, version, ...(file ? [file] : [])], { encoding: "utf8" });
  /**
   * 全ての版の本文。版ごとに命令を起こすので、順に起こすと版が増えるほど遅くなり、1 件の上限 (10 秒) に近づいていた (#3381)。
   * 一度に起こすのは 8 つまでにする
   */
  const allNotes = async (versions: string[]): Promise<Map<string, string>> => {
    const run = promisify(execFile);
    const out = new Map<string, string>();
    for (let i = 0; i < versions.length; i += 8) {
      const batch = versions.slice(i, i + 8);
      const texts = await Promise.all(batch.map(async (version) => (await run("node", [SCRIPT, `v${version}`], { encoding: "utf8" })).stdout));
      batch.forEach((version, k) => out.set(version, texts[k] ?? ""));
    }
    return out;
  };
  const LINK = "Every version is listed in [CHANGELOG.md](https://github.com/cardene777/dragon/blob/main/CHANGELOG.md).";

  it("release-notes-for-every-section", async () => {
    const changelog = readFileSync(join(ROOT, "CHANGELOG.md"), "utf8");
    const versions = [...changelog.matchAll(/^## \[(\d+\.\d+\.\d+)\] - \d{4}-\d{2}-\d{2}$/gmu)].map((m) => m[1] ?? "");
    expect(versions.length, "CHANGELOG.md に版の節が無い").toBeGreaterThan(0);
    const all = await allNotes(versions);
    for (const version of versions) {
      const text = all.get(version) ?? "";
      const body = section(changelog.replace(new RegExp(`^## \\[${escaped(version)}\\] - .*$`, "mu"), `## ${version}`), version).trim();
      expect(text.startsWith(body), `${version} の本文が CHANGELOG.md の節で始まらない`).toBe(true);
      expect(body, `${version} の節が空`).not.toBe("");
      expect(text, `${version} の本文が次の版の見出しまで含む`).not.toMatch(/^## /mu);
      expect(text.trimEnd().endsWith(LINK), `${version} の本文が変更履歴の全体へ link しない`).toBe(true);
    }
  });

  it("maintainer-notes-name-release-step", () => {
    // 版を出す手順に Release を作る段が無いと、作った Release が次の版から欠ける
    const text = readFileSync(join(ROOT, "docs/maintaining.md"), "utf8");
    expect(text, "docs/maintaining.md が本文を script で作る命令を書かない").toContain("node scripts/release-notes.mjs");
    expect(text, "docs/maintaining.md が印の在る時だけ Release を作る命令を書かない").toMatch(/gh release create .*--verify-tag/u);
  });

  it("maintainer-notes-check-version-unpublished", () => {
    // 並行する会話が同じ版を先に出していても、印を付ける段まで気付けなかった (#3442、#3446)
    const text = readFileSync(join(ROOT, "docs/maintaining.md"), "utf8");
    const steps = section(text, "版を出す前に同じ版が出ていないか確かめる");
    expect(steps, "docs/maintaining.md に版を出す前の確かめの節が無い").not.toBe("");
    expect(steps, "npm に出た版を引く命令を書かない").toContain("npm view @cardenelabs/dragon versions --json");
    expect(steps, "GitHub の印を引く命令を書かない").toContain("git ls-remote --tags origin");
    expect(steps, "既に出ていた時に打たない物を名指さない").toMatch(/印と Release と npm への公開を打たない/u);
    expect(steps, "既に出ていた時に中身を突き合わせると書かない").toContain("取り込んだ commit");
    expect(text.indexOf("## 版を出す前に同じ版が出ていないか確かめる"), "確かめの節が Release を作る節より後に在る").toBeLessThan(text.indexOf("## 版を出す時に GitHub Release を作る"));
  });

  it("release-notes-missing-version-fails", () => {
    const run = spawnSync("node", [SCRIPT, "9.9.9"], { encoding: "utf8" });
    expect(run.status, "節の無い版で 1 以外を返した").toBe(1);
    expect(run.stdout, "節の無い版で本文を出した").toBe("");
  });

  it("release-notes-absolute-links", () => {
    // 節の中の相対 link は Release の頁では切れるので、repo の main を指す link に直す
    const dir = mkdtempSync(join(tmpdir(), "release-notes-"));
    try {
      const file = join(dir, "CHANGELOG.md");
      writeFileSync(
        file,
        [
          "# Changelog",
          "",
          "## [1.2.3] - 2026-11-03",
          "",
          "- See [the guide](docs/guide.md), [the readme](./README.md), [the site](https://example.invalid/x), and [below](#notes).",
          "",
          "## [1.2.2] - 2026-11-02",
          "",
          "- Older",
          "",
        ].join("\n"),
      );
      const text = notes("1.2.3", file);
      expect(text).toContain("[the guide](https://github.com/cardene777/dragon/blob/main/docs/guide.md)");
      expect(text).toContain("[the readme](https://github.com/cardene777/dragon/blob/main/README.md)");
      expect(text, "絶対 URL を書き換えた").toContain("[the site](https://example.invalid/x)");
      expect(text, "頁の中の link を書き換えた").toContain("[below](#notes)");
      expect(text, "次の版の節まで出した").not.toContain("Older");
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});
