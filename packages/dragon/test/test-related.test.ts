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
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { casesNamed } from "./export-support";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "../../..");
const RUNNER = join(ROOT, "scripts/test-related.mjs");

interface Listed {
  code: number | null;
  stdout: string;
  stderr: string;
  /** 1 行目より後に並ぶ、選んだ検査の file */
  files: string[];
}

/** 命令を子のプロセスで起こした回数。入力ごとに分けた件が 1 回だけ起こすかを数える (#3602) */
let commands = 0;

/** 命令に `--list` を付けて起こし、選んだ検査の file を読む */
function list(args: string[], root = ROOT): Listed {
  commands++;
  const ran = spawnSync(process.execPath, [RUNNER, "--list", "--root", root, ...args], { cwd: root, encoding: "utf8" });
  return listed(ran.status, ran.stdout, ran.stderr);
}

/** 命令の出力から、選んだ検査の file を読む */
function listed(code: number | null, stdout: string, stderr: string): Listed {
  const lines = stdout.split("\n").filter((line) => line.trim() !== "");
  return { code, stdout, stderr, files: lines.slice(1).map((line) => line.trim()) };
}

/** repo の検査の file と中身。材料の名前を書く検査を数える時に、file で 1 度だけ読む */
let sources: Map<string, string> | undefined;
function testSources(): Map<string, string> {
  sources ??= new Map(
    execFileSync("git", ["-C", ROOT, "ls-files", "*.test.ts", "*.test.tsx"], { encoding: "utf8" })
      .split("\n")
      .filter(Boolean)
      .map((path) => [path, readFileSync(join(ROOT, path), "utf8")]),
  );
  return sources;
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

  // 入力ごとに 1 件。1 件で命令を順に 3 回起こすと、混んだ機械で 1 件の上限 (10 秒) を超えた (#3602)
  describe.for([
    // package の名前で読む検査は、package の入口の src をたどる
    { changed: "packages/dragon/src/index.ts", reader: "packages/dragon/test/notation.test.ts", says: "package の名前で読む検査 (notation.test.ts) を選んでいない" },
    // build した命令 (`dist/cli.js`) を起こす検査は、命令の src をたどる
    { changed: "packages/dragon/src/cli.ts", reader: "packages/dragon/test/cli-arguments.test.ts", says: "build した命令を起こす検査 (cli-arguments.test.ts) を選んでいない" },
    // build した頁の中身を読む検査は、頁の入口の src をたどる
    { changed: "apps/playground-spa/src/main.tsx", reader: "apps/playground-spa/src/lib/playground.test.ts", says: "build した頁の中身を読む検査 (playground.test.ts) を選んでいない" },
  ])("$changed", ({ changed, reader, says }) => {
    it("related-follows-package-and-built-entries", () => {
      const chosen = list([changed]);
      expect(chosen.code, chosen.stderr).toBe(0);
      expect(chosen.files, says).toContain(reader);
    });
  });

  // 材料ごとに 1 件 (#3602)
  describe.for([
    // dist の鮮度の検査は変更履歴を読まないので選ばれない
    { changed: "CHANGELOG.md", picks: [["packages/dragon/test/release-records.test.ts", "変更履歴を読む検査を選んでいない"]], skips: [["packages/dragon/test/dist-freshness.test.ts", "変更履歴を読まない検査 (dist-freshness.test.ts) を選んだ"]] },
    { changed: "packages/dragon/examples/auction.dragon", picks: [["packages/dragon/test/lineup-diagram.test.ts", "見本を読む検査 (lineup-diagram.test.ts) を選んでいない"]], skips: [] },
  ])("$changed", ({ changed, picks, skips }) => {
    it("related-maps-materials-by-table", () => {
      const chosen = list([changed]);
      expect(chosen.code, chosen.stderr).toBe(0);
      for (const [file, says] of picks) expect(chosen.files, says).toContain(file);
      for (const [file, says] of skips) expect(chosen.files, says).not.toContain(file);
    });
  });

  // 材料の file の名前を字で書く検査の file は、その材料を変えた時に全て選ばれる。
  // 命令の選び方とは別に、検査の file の字を数えて確かめる (命令の側の誤りを、命令の答えで確かめない)。
  // 材料ごとに 1 件。1 件で 5 つの材料の命令を同時に起こしても、混んだ機械で 1 件の上限 (10 秒) を超えた (#3463、#3602)
  describe.for(["CHANGELOG.md", "README.md", "docs/maintaining.md", "packages/dragon/examples/auction.dragon", ".ikkan/checks.md"])("%s", (material) => {
    it("related-table-covers-material-readers", () => {
      const tablePath = join(ROOT, "test-support/related-table.json");
      expect(existsSync(tablePath), "材料を検査へ結ぶ表 test-support/related-table.json が無い").toBe(true);
      if (!existsSync(tablePath)) return;
      const table = JSON.parse(readFileSync(tablePath, "utf8")) as { materials?: { files: string[] }[] };
      expect(table.materials?.length ?? 0, "表に材料が 1 つも無い").toBeGreaterThan(0);
      const base = material.split("/").pop() ?? material;
      const readers = [...testSources()].filter(([, body]) => body.includes(`"${material}"`) || body.includes(`"${base}"`)).map(([path]) => path);
      // 名前を書く検査の file を 1 件も数えられない時は、確かめていないので落とす
      expect(readers.length, `${material} の名前を書く検査の file を 1 件も数えていない`).toBeGreaterThan(0);
      const chosen = list([material]);
      expect(chosen.code, `${material} を変えた時に命令が止まった: ${chosen.stderr}`).toBe(0);
      expect(readers.filter((reader) => !chosen.files.includes(reader)), `${material} の名前を書く検査の file のうち、選ばれなかった物`).toEqual([]);
    });
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

/** 1 回の実行を回す関数。`out` は止める段が終わっていない file を書く先で、終わり方を返す */
type Run = (files: string[], out: string) => number | null;
type Until = (files: string[], run: Run, say: (text: string) => void) => number;

/** 止まった所から続きを回す関数。まだ無い時もこの file の他の検査を走らせるため、読めない時は undefined を返す */
const loadUntil = async (): Promise<Until | undefined> => ((await import(RUNNER)) as { runUntilFinished?: Until }).runUntilFinished;

/** 渡した結果を順に返す偽の 1 回の実行。止まった回は、止める段 (`test-support/run-limit.ts`) と同じ形で `out` に書く */
function fakeRuns(results: { status: number; unfinished?: string[]; failed?: string[] }[]): { calls: string[][]; run: Run } {
  const calls: string[][] = [];
  const run: Run = (files, out) => {
    const result = results[calls.length] ?? { status: 0 };
    calls.push(files);
    if (result.unfinished) writeFileSync(out, JSON.stringify({ unfinished: result.unfinished, failed: result.failed ?? [] }));
    return result.status;
  };
  return { calls, run };
}

describe("上限で止まった実行の続き (#3386)", () => {
  it("related-continues-unfinished-files", async () => {
    // 実行が上限で止まった時に終わっていない file だけを次の実行で回し、全部が回って落ちた検査が無ければ終わり方 0 で終わる
    const until = await loadUntil();
    expect(until, "止まった所から続きを回す関数 (scripts/test-related.mjs の runUntilFinished) が無い").toBeTypeOf("function");
    const said: string[] = [];
    const { calls, run } = fakeRuns([{ status: 1, unfinished: ["b.test.ts", "c.test.ts"] }, { status: 1, unfinished: ["c.test.ts"] }, { status: 0 }]);
    const status = (until as Until)(["a.test.ts", "b.test.ts", "c.test.ts"], run, (text) => said.push(text));
    expect(calls, "止まった実行で終わっていない file だけを次の実行で回していない").toEqual([["a.test.ts", "b.test.ts", "c.test.ts"], ["b.test.ts", "c.test.ts"], ["c.test.ts"]]);
    expect(status, `全部が回って落ちた検査が無いのに終わり方 0 でない:\n${said.join("")}`).toBe(0);
    // 上限で止まらずに落ちただけの実行は、続きを回さずにその終わり方で終わる
    const failed = fakeRuns([{ status: 1 }]);
    expect((until as Until)(["a.test.ts"], failed.run, () => undefined), "落ちただけの実行で終わり方 1 を返していない").toBe(1);
    expect(failed.calls, "上限で止まっていない実行の後に、続きを回した").toHaveLength(1);
  });

  it("related-stops-without-progress", async () => {
    // 続きの実行で終わっていない file が前の実行より減らなかった時は、そこで止まり、残った file の名前を出して終わり方 1 で終わる
    const until = await loadUntil();
    expect(until, "止まった所から続きを回す関数 (scripts/test-related.mjs の runUntilFinished) が無い").toBeTypeOf("function");
    const said: string[] = [];
    const { calls, run } = fakeRuns([{ status: 1, unfinished: ["b.test.ts", "c.test.ts"] }, { status: 1, unfinished: ["b.test.ts", "c.test.ts"] }, { status: 0 }]);
    const status = (until as Until)(["a.test.ts", "b.test.ts", "c.test.ts"], run, (text) => said.push(text));
    expect(calls, "前に進まなかった実行の後も続きを回した").toHaveLength(2);
    expect(status, "前に進まずに止まったのに終わり方 1 でない").toBe(1);
    expect(said.join(""), "前に進まずに残った file の名前を出していない").toMatch(/b\.test\.ts[\s\S]*c\.test\.ts/u);
  });

  it("related-keeps-failures-across-runs", async () => {
    // 上限で止まった実行の中で終わった file に落ちた検査が在った時は、続きが全部通っても終わり方 1 で終わり、落ちた検査の名前を出す
    const until = await loadUntil();
    expect(until, "止まった所から続きを回す関数 (scripts/test-related.mjs の runUntilFinished) が無い").toBeTypeOf("function");
    const said: string[] = [];
    const { calls, run } = fakeRuns([{ status: 1, unfinished: ["c.test.ts"], failed: ["a.test.ts > 組 > 落ちた検査"] }, { status: 0 }]);
    const status = (until as Until)(["a.test.ts", "b.test.ts", "c.test.ts"], run, (text) => said.push(text));
    expect(calls, "止まった実行の後に続きを回していない").toHaveLength(2);
    expect(status, "前の実行で落ちた検査が在るのに終わり方 1 でない").toBe(1);
    expect(said.join(""), "前の実行で落ちた検査の名前を出していない").toContain("a.test.ts > 組 > 落ちた検査");
  });
});

/** 1 件で入力を順に回していた 3 つの検査。入力ごとの件に分けた (#3602) */
const SPLIT = ["related-follows-package-and-built-entries", "related-maps-materials-by-table", "related-table-covers-material-readers"];
/** 分けた件ごとの、命令を起こした回数 */
const started = new Map<string, number>();
let commandsAtStart = 0;
beforeEach(() => {
  commandsAtStart = commands;
});
afterEach(({ task }) => {
  if (SPLIT.includes(task.name)) started.set(`${task.suite?.name ?? ""} > ${task.name}`, commands - commandsAtStart);
});

describe("入力ごとに分けた検査を選ぶ命令の件 (#3602)", () => {
  it("related-cases-follow-inputs", ({ task }) => {
    expect(casesNamed(task.file, "related-follows-package-and-built-entries"), "package と命令と頁の入口ごとの件").toHaveLength(3);
    expect(casesNamed(task.file, "related-maps-materials-by-table"), "表が結ぶ材料ごとの件").toHaveLength(2);
    expect(casesNamed(task.file, "related-table-covers-material-readers"), "名前を書く検査を数える材料ごとの件").toHaveLength(5);
  });

  // 1 件で命令を 3 回か 5 回起こすと、混んだ機械で 1 件の上限 (10 秒) を超えた
  it("related-split-cases-start-one-command", () => {
    expect([...new Set([...started.keys()].map((key) => key.split(" > ").pop()))].sort(), "命令を起こした回数を数えた検査").toEqual([...SPLIT].sort());
    expect(
      [...started].filter(([, count]) => count !== 1).map(([key, count]) => `${key}: ${count}`),
      "命令を 1 回でなく起こした件",
    ).toEqual([]);
  });
});
