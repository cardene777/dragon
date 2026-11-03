/**
 * 外の人が開く file (#3331)。
 *
 * Issue と PR の雛形と行動規範は、外の人が不具合を知らせたり直しを送ったりする時に最初に読む。
 * 雛形は日本語だけで書かれ、再現手順の例は前の記法のまま、版の例は 0.29.0 のまま止まっていた。
 * ここでは雛形が英語であること、例の記法を今の dragon が読めること、挙げた命令が在ることを確かめる。
 */
import { readdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { api } from "./diagram-support";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "../../..");

const read = (file: string): string => readFileSync(join(ROOT, file), "utf8");

/** Issue の雛形の全てと PR の雛形 */
const templates = (): string[] => [
  ...readdirSync(join(ROOT, ".github/ISSUE_TEMPLATE"))
    .filter((file) => file.endsWith(".yml"))
    .map((file) => `.github/ISSUE_TEMPLATE/${file}`),
  ".github/PULL_REQUEST_TEMPLATE.md",
];

/** 雛形の `id: <id>` の項が持つ `placeholder: |` の塊を、字下げを外して返す */
function placeholderBlock(text: string, id: string): string {
  const lines = text.split("\n");
  const start = lines.findIndex((line) => line.trim() === `id: ${id}`);
  const next = lines.findIndex((line, i) => i > start && /^\s*- type:/u.test(line));
  const head = lines.findIndex((line, i) => i > start && (next < 0 || i < next) && /^\s*placeholder: \|$/u.test(line));
  if (start < 0 || head < 0) return "";
  const indent = lines[head]?.search(/\S/u) ?? 0;
  const body: string[] = [];
  for (const line of lines.slice(head + 1)) {
    if (line.trim() !== "" && line.search(/\S/u) <= indent) break;
    body.push(line);
  }
  const cut = Math.min(...body.filter((line) => line.trim() !== "").map((line) => line.search(/\S/u)));
  return body
    .map((line) => line.slice(cut))
    .join("\n")
    .trim();
}

describe("外の人が開く file (#3331)", () => {
  it("contribution-templates-are-english", () => {
    const files = templates();
    expect(files.length, ".github/ISSUE_TEMPLATE に雛形が無い").toBeGreaterThan(1);
    for (const file of files) {
      const text = read(file);
      const japanese = text
        .split("\n")
        .map((line, i) => ({ line: i + 1, text: line }))
        .filter(({ text }) => /[぀-ヿ㐀-鿿]/u.test(text))
        .map(({ line, text }) => `${line}: ${text.trim()}`);
      expect(japanese, `${file} に日本語の字が残る行`).toEqual([]);
      // 版の例は書いた時の版のまま止まるので書かない。使っている版は npm ls の出力を貼ってもらう
      const versions = [...text.matchAll(/(?<![\w.])0\.\d+\.\d+(?![\w.])/gu)].map((m) => m[0]);
      expect(versions, `${file} が版を番号で書いている`).toEqual([]);
    }
  });

  it("bug-report-example-parses", () => {
    const example = placeholderBlock(read(".github/ISSUE_TEMPLATE/bug-report.yml"), "reproduction");
    expect(example, "不具合の雛形に再現手順の例が無い").not.toBe("");
    const parsed = api("parseNotation")(example);
    expect(parsed.ok ? [] : parsed.errors, "不具合の雛形の再現手順の例を今の記法で読めない").toEqual([]);
  });

  it("pull-request-template-names-real-scripts", () => {
    const scripts = Object.keys((JSON.parse(read("package.json")) as { scripts: Record<string, string> }).scripts);
    const named = [...read(".github/PULL_REQUEST_TEMPLATE.md").matchAll(/`pnpm (?:run )?([\w:-]+)[^`]*`/gu)].map((m) => m[1] ?? "");
    expect(named.length, "PR の雛形が確かめる命令を挙げない").toBeGreaterThan(0);
    expect(
      named.filter((name) => !scripts.includes(name)),
      "PR の雛形が root の package.json に無い命令を挙げる",
    ).toEqual([]);
  });

  it("code-of-conduct-names-private-report", () => {
    const text = read("CODE_OF_CONDUCT.md");
    const head = text.split("\n").slice(0, 10);
    expect(head, "CODE_OF_CONDUCT.md の先頭 10 行に転載の印 source_external が無い").toContain("source_external: true");
    expect(
      head.some((line) => /^source_url: https:\/\/\S+$/u.test(line)),
      "CODE_OF_CONDUCT.md の先頭 10 行に source_url の行が無い",
    ).toBe(true);
    expect(text, "CODE_OF_CONDUCT.md が Contributor Covenant の本文を持たない").toContain("# Contributor Covenant Code of Conduct");
    expect(text, "CODE_OF_CONDUCT.md が Contributor Covenant 2.1 ではない").toContain("version 2.1");
    expect(text, "報告の窓口が非公開の報告窓口でない").toContain("https://github.com/cardene777/dragon/security/advisories/new");
    expect(text, "報告の窓口の欄が埋まっていない").not.toContain("[INSERT CONTACT METHOD]");
  });
});

/** 囲みの印の中の `pnpm <命令>` の命令の名前 (`run` は外す) */
function pnpmCommands(text: string): string[] {
  const fenced = [...text.matchAll(/```[\s\S]*?```/gu)].map((m) => m[0]);
  const names = fenced.flatMap((block) => [...block.matchAll(/^\s*pnpm (?:run )?([\w:-]+)/gmu)].map((m) => m[1] ?? ""));
  return [...new Set(names)].sort();
}

describe("直しを送る手順 (#3333)", () => {
  // 英語の CONTRIBUTING.md と日本語の CONTRIBUTING.ja.md は同じ中身を持ち、
  // 管理者だけが使う決まりは docs/maintaining.md に置く
  const en = (): string => read("CONTRIBUTING.md");
  const ja = (): string => read("CONTRIBUTING.ja.md");

  it("contributing-english-has-no-japanese-prose", () => {
    // 囲みの印と backtick の中の字は書いたままの字なので見ない。日本語版への link の名前は日本語で書く
    const japanese = en()
      .replace(/```[\s\S]*?```/gu, "")
      .replace("[日本語](CONTRIBUTING.ja.md)", "")
      .split("\n")
      .map((line, i) => ({ line: i + 1, text: line.replace(/`[^`]*`/gu, "") }))
      .filter(({ text }) => /[぀-ヿ㐀-鿿]/u.test(text))
      .map(({ line, text }) => `${line}: ${text.trim()}`);
    expect(japanese, "CONTRIBUTING.md の地の文に日本語が残る行").toEqual([]);
  });

  it("contributing-languages-link-each-other", () => {
    expect(en(), "CONTRIBUTING.md が日本語版へ link しない").toContain("](CONTRIBUTING.ja.md)");
    expect(en(), "CONTRIBUTING.md が行動規範へ link しない").toContain("](CODE_OF_CONDUCT.md)");
    expect(ja(), "CONTRIBUTING.ja.md が英語版へ link しない").toContain("](CONTRIBUTING.md)");
  });

  it("contributing-languages-carry-the-same-sections", () => {
    const sections = (text: string): number => text.split("\n").filter((line) => line.startsWith("## ")).length;
    expect(sections(en()), "CONTRIBUTING.md に節が無い").toBeGreaterThan(0);
    expect(sections(ja()), "CONTRIBUTING.ja.md の節の数が CONTRIBUTING.md と違う").toBe(sections(en()));
    expect(pnpmCommands(ja()), "2 つの file の囲みの印が挙げる pnpm の命令が違う").toEqual(pnpmCommands(en()));
  });

  it("contributing-commands-exist", () => {
    const scripts = Object.keys((JSON.parse(read("package.json")) as { scripts: Record<string, string> }).scripts);
    for (const [file, text] of [["CONTRIBUTING.md", en()], ["CONTRIBUTING.ja.md", ja()]] as const) {
      const named = pnpmCommands(text).filter((name) => name !== "install" && name !== "exec");
      expect(named.length, `${file} が pnpm の命令を挙げない`).toBeGreaterThan(0);
      expect(
        named.filter((name) => !scripts.includes(name)),
        `${file} が root の package.json に無い命令を挙げる`,
      ).toEqual([]);
    }
  });

  it("maintainer-rules-live-apart", () => {
    const lines = read("docs/maintaining.md").split("\n");
    expect(lines, "docs/maintaining.md に残作業の数え方の節が無い").toContain("## 残作業の数え方");
    expect(lines, "docs/maintaining.md に依存の脆弱性の節が無い").toContain("### 依存の脆弱性を確かめる");
    expect(en(), "CONTRIBUTING.md に管理者向けの残作業の数え方が残る").not.toContain("gh issue list");
    expect(ja(), "CONTRIBUTING.ja.md に管理者向けの残作業の数え方が残る").not.toContain("gh issue list");
  });

  it("dependency-notes-point-at-real-heading", () => {
    // 依存の検査の注釈は「file の『見出し』を見る」の形で手順の置き場を名指す。移した後も指す先が在るか
    for (const file of ["osv-scanner.toml", "scripts/check-dependency-vulnerabilities.sh"]) {
      const pointers = [...read(file).matchAll(/`([\w./-]+\.md)` の「([^」]+)」/gu)];
      expect(pointers.length, `${file} の注釈が手順の置き場を名指さない`).toBeGreaterThan(0);
      for (const [, target = "", heading = ""] of pointers) {
        const headings = read(target)
          .split("\n")
          .filter((line) => /^#+ /u.test(line))
          .map((line) => line.replace(/^#+ /u, ""));
        expect(headings, `${file} が名指す ${target} に見出し「${heading}」が無い`).toContain(heading);
      }
    }
  });

  it("readme-points-at-contributing-per-language", () => {
    expect(read("README.md"), "README.md が CONTRIBUTING.md を日本語だと断る").not.toContain("mostly in Japanese");
    expect(read("README.ja.md"), "README.ja.md が CONTRIBUTING.ja.md へ link しない").toContain("](CONTRIBUTING.ja.md)");
  });
});
