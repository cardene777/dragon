/**
 * 検査をどう回し、何を外したかの記録が、検査の実物と食い違わない (#3381)。
 *
 * 外した検査は `docs/removed-tests.md` に、理由と、同じ守りを担う残りの検査の名前を残す。
 * 受入条件を残す `.ikkan/specs/` の行が名指す検査は、全て検査の file に在る。
 * 課題ごとには関係する検査だけを回し、一式は版を出す前の 1 回だけ回す。
 */
import { execFileSync } from "node:child_process";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "../../..");

/** 検査の file の字を全てつないだ物。検査の名前は `"名前"` の形で書かれる */
function testSources(): string {
  const files = execFileSync("git", ["-C", ROOT, "ls-files", "--cached", "--others", "--exclude-standard", "*.test.ts", "*.test.tsx"], { encoding: "utf8" })
    .split("\n")
    .filter((path) => path !== "" && existsSync(join(ROOT, path)));
  return files.map((path) => readFileSync(join(ROOT, path), "utf8")).join("\n");
}

/** 検査の名前が検査の file に書かれているか。名前は引用符で囲んで書く */
const named = (sources: string, name: string): boolean => [`"${name}"`, `'${name}'`, `\`${name}\``].some((quoted) => sources.includes(quoted));

/** markdown の表の本文の行を、欄ごとに分けて返す。見出しの行と区切りの行は外す */
function tableRows(text: string): string[][] {
  const rows: string[][] = [];
  for (const line of text.split("\n")) {
    if (!line.startsWith("|") || /^\|\s*-/u.test(line)) continue;
    rows.push(line.split("|").slice(1, -1).map((cell) => cell.trim()));
  }
  return rows;
}

/** 欄の字から、backtick で囲んだ検査の名前を読む。空白を含む名前は二重引用符で囲む。命令と path は外す */
function namesIn(cell: string): string[] {
  const names: string[] = [];
  for (const m of cell.matchAll(/`([^`]+)`/gu)) {
    const raw = m[1] ?? "";
    if (raw.startsWith('"') && raw.endsWith('"')) names.push(raw.slice(1, -1));
    else if (!/[\s/.]/u.test(raw)) names.push(raw);
  }
  return names;
}

describe("検査の回し方と外した検査の記録 (#3381)", () => {
  it("removed-tests-are-gone-and-covered", () => {
    const record = join(ROOT, "docs/removed-tests.md");
    expect(existsSync(record), "外した検査の記録 docs/removed-tests.md が無い").toBe(true);
    if (!existsSync(record)) return;
    const sources = testSources();
    // 欄は 外した検査 | 在った file | 理由 | 同じ守りを担う検査
    const rows = tableRows(readFileSync(record, "utf8")).filter((cells) => cells.length === 4 && cells[0] !== "外した検査");
    expect(rows.length, "外した検査が記録に 1 件も無い").toBeGreaterThan(0);
    const problems: string[] = [];
    for (const [removed = "", , why = "", kept = ""] of rows) {
      const name = namesIn(removed)[0];
      if (name === undefined) {
        problems.push(`外した検査の名前を読めない行: ${removed}`);
        continue;
      }
      if (named(sources, name)) problems.push(`${name} がまだ検査の file に在る`);
      if (why === "") problems.push(`${name} の理由が空`);
      const keepers = namesIn(kept);
      if (keepers.length === 0) problems.push(`${name} の守りを担う検査の名前が無い`);
      for (const keeper of keepers) if (!named(sources, keeper)) problems.push(`${name} の守りを担う ${keeper} が検査の file に無い`);
    }
    expect(problems, "外した検査の記録と検査の file の食い違い").toEqual([]);
  });

  it("spec-rows-name-existing-tests", () => {
    const sources = testSources();
    const dir = join(ROOT, ".ikkan/specs");
    let counted = 0;
    const missing: string[] = [];
    for (const file of readdirSync(dir).filter((name) => name.endsWith(".md"))) {
      for (const cells of tableRows(readFileSync(join(dir, file), "utf8"))) {
        for (const name of namesIn(cells[1] ?? "")) {
          counted += 1;
          if (!named(sources, name)) missing.push(`${file}: ${name}`);
        }
      }
    }
    // 1 件も数えられない時は、読み方が壊れていて確かめていない
    expect(counted, "`.ikkan/specs/` の行から検査の名前を 1 件も読めない").toBeGreaterThan(100);
    expect(missing, "`.ikkan/specs/` の行が名指すのに、検査の file に無い検査").toEqual([]);
  });

  it("typecheck-covers-test-code", () => {
    // 検査の code の型は `pnpm typecheck` が `tsconfig.test.json` で見る (#1413)。`tsc -b` はこの設定を読まない。
    // 型検査の命令に入れる前は、検査の 1 件 (16 秒) が同じ型検査を回していた (#3381)
    const pkg = JSON.parse(readFileSync(join(ROOT, "package.json"), "utf8")) as { scripts: Record<string, string> };
    expect(pkg.scripts.typecheck, "型検査の命令が検査の code の設定を見ていない").toContain("tsc -p packages/dragon/tsconfig.test.json --noEmit");
  });

  it("fixture-configs-typechecked-at-root", () => {
    // 見本の設定は repo の根の設定を読むので `test-support` の外を読む。`tsc -b` の `test-support` から外し、
    // repo の根の設定と同じ所で型を見る。登録が漏れると `pnpm typecheck` が TS6059 で落ちる (#3395)
    const configs = readdirSync(join(ROOT, "test-support/fixtures"), { recursive: true, encoding: "utf8" })
      .filter((path) => path.endsWith("vitest.config.ts"))
      .map((path) => `fixtures/${path}`);
    expect(configs.length, "見本の設定を 1 つも見つけられない").toBeGreaterThan(0);
    const text = (file: string) => readFileSync(join(ROOT, file), "utf8");
    for (const path of configs) {
      for (const file of ["tsconfig.config-files.json", "tsconfig.eslint.json"]) {
        expect(text(file), `${file} の include に test-support/${path} が無い`).toContain(`"test-support/${path}"`);
      }
      expect(text("test-support/tsconfig.json"), `test-support/tsconfig.json の exclude に ${path} が無い`).toContain(`"${path}"`);
    }
  });

  it("checks-declare-light-suite", () => {
    const rows = tableRows(readFileSync(join(ROOT, ".ikkan/checks.md"), "utf8"));
    const weight = rows.find((cells) => cells[0] === "一式の重さ");
    expect(weight?.[1], "`.ikkan/checks.md` が一式の重さを `軽い` と書いていない").toBe("軽い");
  });

  it("release-fields-all-written", () => {
    // ikkan の配る前の関門 (`deployable.sh`) と配った後の関門 (`deployed.sh`) が求める欄 (#3589)。欄が無い repo は終わり方 3 で断られる
    const fields = ["配る前のテスト", "配る前の動作", "配る前のセキュリティ", "配る先との整合", "壊す変更", "stagingの確かめ", "戻す確かめ", "配った後の確かめ"];
    const rows = tableRows(readFileSync(join(ROOT, ".ikkan/checks.md"), "utf8"));
    const cell = (field: string): string | undefined => rows.find((cells) => cells[0] === field)?.[1];
    expect(fields.filter((field) => cell(field) === undefined), "`.ikkan/checks.md` に無い欄").toEqual([]);
    // 中身は backtick で囲んだ命令か、`無し (理由)`。理由の無い `無し` は ikkan が断る
    const bad = fields.filter((field) => {
      const text = cell(field) ?? "";
      return !/^`[^`]+`$/u.test(text) && !/^無し\s*[(（][^)）]+[)）]$/u.test(text);
    });
    expect(bad, "命令でも理由つきの `無し` でもない欄").toEqual([]);
  });

  it("release-tests-skip-e2e", () => {
    const rows = tableRows(readFileSync(join(ROOT, ".ikkan/checks.md"), "utf8"));
    const command = (rows.find((cells) => cells[0] === "配る前のテスト")?.[1] ?? "").replace(/^`|`$/gu, "");
    expect(command, "`.ikkan/checks.md` に配る前のテストの命令が無い").not.toBe("");
    for (const part of ["pnpm typecheck", "pnpm build", "pnpm lint", "vitest run packages/", "vitest run apps/"]) {
      expect(command, `配る前のテストが ${part} を回さない`).toContain(part);
    }
    // e2e は配る前にも回さない (ikkan の flow/steps.md、#3585)
    expect(command, "配る前のテストが e2e を回す").not.toMatch(/e2e|playwright\s+test|test:e2e/iu);
  });

  it("maintainer-notes-name-related-runner", () => {
    const notes = readFileSync(join(ROOT, "docs/maintaining.md"), "utf8");
    expect(notes, "管理者向けの決まりが、関係する検査を回す命令を名指していない").toContain("pnpm test:related");
    expect(notes, "管理者向けの決まりが、一式を版を出す前の 1 回だけ回すと書いていない").toMatch(/一式は[^\n。]*版を出す前[^\n。]*1 回だけ回す/u);
    expect(notes, "絞り込んで回すことを禁じる前の決まりが残っている").not.toContain("## 絞り込んだ結果を提出の根拠にしない");
  });
});
