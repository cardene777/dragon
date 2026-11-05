/**
 * 変えた file に関係する検査だけを選ぶ命令 `pnpm test:related` (`scripts/test-related.mjs`、#3381)。
 *
 * 選ぶ規則は 3 つ。
 * 変えた検査の file はそれ自身を選ぶ。
 * code の file は、検査の file から import (と、build した命令や頁を起こす経路) でたどれる時に、たどれる検査の file を選ぶ。
 * import でたどれない材料 (見本、README、変更履歴、build の設定) は、表がその材料に結ぶ検査の file を選ぶ。
 * どれにも当たらない file を変えた時は、検査を回さずに名前を出して止まる。
 *
 * 命令を子の process で起こし、`--list` で選んだ検査の file を出させて確かめる。
 * 規則は、この repo そのものと、検査の中で作る小さな repo の 2 つで確かめる。
 */
import { execFileSync, spawnSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "../../..");
const RUNNER = join(ROOT, "scripts/test-related.mjs");

interface Listed {
  code: number | null;
  stdout: string;
  stderr: string;
  /** 1 行目より後に並ぶ、選んだ検査の file */
  files: string[];
}

/** 命令に `--list` を付けて起こし、選んだ検査の file を読む */
function list(args: string[], root = ROOT): Listed {
  const ran = spawnSync(process.execPath, [RUNNER, "--list", "--root", root, ...args], { cwd: root, encoding: "utf8" });
  const lines = ran.stdout.split("\n").filter((line) => line.trim() !== "");
  return { code: ran.status, stdout: ran.stdout, stderr: ran.stderr, files: lines.slice(1).map((line) => line.trim()) };
}

/** 検査の中で使う小さな repo を作る。`files` は repo の根からの path と中身 */
function fixture(files: Record<string, string>): string {
  const root = mkdtempSync(join(tmpdir(), "dragon-related-"));
  for (const [path, body] of Object.entries(files)) {
    mkdirSync(dirname(join(root, path)), { recursive: true });
    writeFileSync(join(root, path), body);
  }
  return root;
}

/** src の 3 file と、それを読む検査の 3 file を持つ repo */
function smallRepo(extra: Record<string, string> = {}): string {
  return fixture({
    "packages/x/src/a.ts": 'import { c } from "./c.js";\nexport const a = c + 1;\n',
    "packages/x/src/b.ts": "export const b = 2;\n",
    "packages/x/src/c.ts": "export const c = 3;\n",
    "packages/x/test/support.ts": 'export { c } from "../src/c";\n',
    "packages/x/test/a.test.ts": 'import { a } from "../src/a";\nvoid a;\n',
    "packages/x/test/b.test.ts": 'import { b } from "../src/b";\nvoid b;\n',
    "packages/x/test/s.test.ts": 'import { c } from "./support";\nvoid c;\n',
    ...extra,
  });
}

const git = (root: string, ...args: string[]): string => execFileSync("git", ["-C", root, ...args], { encoding: "utf8" });

describe("関係する検査を選ぶ命令 (#3381)", () => {
  it("related-runs-changed-test-file", () => {
    const changed = "packages/dragon/test/release-records.test.ts";
    const listed = list([changed]);
    expect(listed.code, listed.stderr).toBe(0);
    expect(listed.files, "変えた検査の file を選んでいない").toContain(changed);
    // ほかに選ぶのは、変えた検査の file の名前を字で書く検査の file だけ (名前が変わると落ちる)
    const others = listed.files.filter((file) => file !== changed && !readFileSync(join(ROOT, file), "utf8").includes(changed));
    expect(others, "変えた検査の file の名前を書かない検査の file を選んだ").toEqual([]);
  });

  it("related-picks-importers", () => {
    const root = smallRepo();
    const listed = list(["packages/x/src/c.ts"], root);
    expect(listed.code, listed.stderr).toBe(0);
    // a.test.ts は a.ts (`./c.js` と書いて c.ts を読む) を、s.test.ts は検査の助け support.ts を通って c.ts をたどる
    expect(listed.files.sort(), "c.ts をたどれる検査の file を選んでいない").toEqual(["packages/x/test/a.test.ts", "packages/x/test/s.test.ts"]);
  });

  it("related-skips-non-importers", () => {
    const root = smallRepo();
    const fromC = list(["packages/x/src/c.ts"], root);
    expect(fromC.files, "c.ts をたどれない b.test.ts を選んだ").not.toContain("packages/x/test/b.test.ts");
    const fromB = list(["packages/x/src/b.ts"], root);
    expect(fromB.code, fromB.stderr).toBe(0);
    expect(fromB.files, "b.ts をたどれる検査の file だけを選んでいない").toEqual(["packages/x/test/b.test.ts"]);
  });

  it("related-follows-package-and-built-entries", () => {
    // package の名前で読む検査は、package の入口の src をたどる
    const fromEntry = list(["packages/dragon/src/index.ts"]);
    expect(fromEntry.code, fromEntry.stderr).toBe(0);
    expect(fromEntry.files, "package の名前で読む検査 (notation.test.ts) を選んでいない").toContain("packages/dragon/test/notation.test.ts");
    // build した命令 (`dist/cli.js`) を起こす検査は、命令の src をたどる
    const fromCli = list(["packages/dragon/src/cli.ts"]);
    expect(fromCli.code, fromCli.stderr).toBe(0);
    expect(fromCli.files, "build した命令を起こす検査 (cli-arguments.test.ts) を選んでいない").toContain("packages/dragon/test/cli-arguments.test.ts");
    // build した頁を開く検査は、頁の入口の src をたどる
    const fromPage = list(["apps/playground-spa/src/main.tsx"]);
    expect(fromPage.code, fromPage.stderr).toBe(0);
    expect(fromPage.files, "build した頁を開く検査 (site-pages.test.ts) を選んでいない").toContain("apps/playground-spa/src/lib/site-pages.test.ts");
  });

  it("related-maps-materials-by-table", () => {
    const fromChangelog = list(["CHANGELOG.md"]);
    expect(fromChangelog.code, fromChangelog.stderr).toBe(0);
    expect(fromChangelog.files, "変更履歴を読む検査を選んでいない").toContain("packages/dragon/test/release-records.test.ts");
    // 見本帳の頁の検査 (site-pages.test.ts) は変更履歴の対応表を頁と突き合わせるので選ばれ、dist の鮮度の検査は読まないので選ばれない
    expect(fromChangelog.files, "変更履歴を読む見本帳の検査 (site-pages.test.ts) を選んでいない").toContain("apps/playground-spa/src/lib/site-pages.test.ts");
    expect(fromChangelog.files, "変更履歴を読まない検査 (dist-freshness.test.ts) を選んだ").not.toContain("packages/dragon/test/dist-freshness.test.ts");
    const fromExample = list(["packages/dragon/examples/auction.dragon"]);
    expect(fromExample.code, fromExample.stderr).toBe(0);
    expect(fromExample.files, "見本を読む検査 (lineup-diagram.test.ts) を選んでいない").toContain("packages/dragon/test/lineup-diagram.test.ts");
  });

  it("related-table-covers-material-readers", () => {
    // 材料の file の名前を字で書く検査の file は、その材料を変えた時に全て選ばれる。
    // 命令の選び方とは別に、検査の file の字を数えて確かめる (命令の側の誤りを、命令の答えで確かめない)
    const tablePath = join(ROOT, "test-support/related-table.json");
    expect(existsSync(tablePath), "材料を検査へ結ぶ表 test-support/related-table.json が無い").toBe(true);
    if (!existsSync(tablePath)) return;
    const table = JSON.parse(readFileSync(tablePath, "utf8")) as { materials?: { files: string[] }[] };
    expect(table.materials?.length ?? 0, "表に材料が 1 つも無い").toBeGreaterThan(0);
    const tests = execFileSync("git", ["-C", ROOT, "ls-files", "*.test.ts", "*.test.tsx"], { encoding: "utf8" }).split("\n").filter(Boolean);
    const sources = new Map(tests.map((path) => [path, readFileSync(join(ROOT, path), "utf8")]));
    const checked: string[] = [];
    for (const material of ["CHANGELOG.md", "README.md", "docs/maintaining.md", "packages/dragon/examples/auction.dragon", ".ikkan/checks.md"]) {
      const base = material.split("/").pop() ?? material;
      const readers = [...sources].filter(([, body]) => body.includes(`"${material}"`) || body.includes(`"${base}"`)).map(([path]) => path);
      const chosen = list([material]);
      expect(chosen.code, `${material} を変えた時に命令が止まった: ${chosen.stderr}`).toBe(0);
      expect(readers.filter((reader) => !chosen.files.includes(reader)), `${material} の名前を書く検査の file のうち、選ばれなかった物`).toEqual([]);
      checked.push(...readers);
    }
    // 名前を書く検査の file を 1 件も数えられない時は、確かめていないので落とす
    expect(checked.length, "材料の名前を書く検査の file を 1 件も数えていない").toBeGreaterThan(0);
  });

  it("related-names-unmapped-material", () => {
    const root = smallRepo();
    const listed = list(["notes/todo.txt"], root);
    expect(listed.code, "表にも import にも当たらない file を受けて止まらなかった").toBe(1);
    expect(listed.stderr, "当たらない file の名前を出していない").toContain("notes/todo.txt");
    expect(listed.files, "止まる時に検査の file を選んだ").toEqual([]);
  });

  it("related-defaults-to-branch-changes", () => {
    const root = smallRepo();
    git(root, "init", "-q", "-b", "main");
    git(root, "-c", "user.email=t@example.invalid", "-c", "user.name=t", "add", "-A");
    git(root, "-c", "user.email=t@example.invalid", "-c", "user.name=t", "commit", "-q", "-m", "first");
    git(root, "switch", "-q", "-c", "work");
    writeFileSync(join(root, "packages/x/test/a.test.ts"), 'import { a } from "../src/a";\nvoid a;\nvoid 1;\n');
    git(root, "-c", "user.email=t@example.invalid", "-c", "user.name=t", "commit", "-q", "-am", "commit a");
    // commit していない変更と、まだ追っていない file
    writeFileSync(join(root, "packages/x/src/b.ts"), "export const b = 3;\n");
    writeFileSync(join(root, "packages/x/test/new.test.ts"), "void 0;\n");
    const listed = list([], root);
    expect(listed.code, listed.stderr).toBe(0);
    expect(listed.files.sort(), "既定の枝から分かれた後の変更を対象にしていない").toEqual(["packages/x/test/a.test.ts", "packages/x/test/b.test.ts", "packages/x/test/new.test.ts"]);
  });

  it("related-prints-chosen-files", () => {
    const root = smallRepo();
    const listed = list(["packages/x/src/c.ts"], root);
    expect(listed.code, listed.stderr).toBe(0);
    const first = listed.stdout.split("\n")[0] ?? "";
    expect(first, "1 行目に選んだ検査の file の数を出していない").toBe("関係する検査 2 file");
    expect(listed.files, "選んだ検査の file の名前を出していない").toHaveLength(2);
    expect(readFileSync(join(ROOT, "package.json"), "utf8"), "関係する検査を回す命令が package.json に無い").toContain('"test:related": "node scripts/test-related.mjs"');
  });
});
