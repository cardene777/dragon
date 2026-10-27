/**
 * 値を 1 つずつ書き換えて、検査が落ちるかを確かめる道具 (`scripts/mutate-values.mjs`、#3107)。
 *
 * ## なぜ要るか
 *
 * 見本サイトと編集画面の検査は、build した頁を画面なしの Chromium で開く。
 * Stryker (`pnpm test:mutation`) は数の字を書き換えず、変異を切り替える印も頁の中へ届かないので、
 * 頁の中で動く値の穴を見つけられない。#3099 から #3105 では、この道具で 36 の変異を当てた。
 *
 * ## 何を見るか
 *
 * 道具は source を書き換えるので、戻し損ねると変異が残ったまま次の検査や commit へ進む。
 * 戻しは一時の場所に作った本物の git の repo で確かめ、検査と build の命令だけを差し替える。
 * 差し替えた命令は、呼ばれた時の file の中身を残す (書き換えてから回したか、戻してから build したかを見る)。
 */
import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { afterEach, describe, expect, it } from "vitest";

interface Mutant {
  id: string;
  file: string;
  old: string;
  new: string;
  tests: string[];
  names?: string | null;
  what?: string;
}
interface Row {
  id: string;
  wide?: boolean;
  summary?: string;
  failed?: string[];
  messages?: string[];
  skipped?: string;
  unfinished?: string;
}
interface Result {
  status: number;
  stdout: string;
  stderr: string;
}
type Exec = (cmd: string, args: string[], cwd: string) => Result;

const require_ = createRequire(import.meta.url);
const { runMutants, readMutants, mutationTable } = require_("../../../scripts/mutate-values.mjs") as {
  runMutants: (o: { root: string; mutants: Mutant[]; out: string; wide?: boolean; exec?: Exec; log?: (line: string) => void }) => Row[];
  readMutants: (text: string) => Mutant[];
  mutationTable: (o: { mutants: Mutant[]; rows: Row[]; step: number }) => string;
};
const REPO = join(dirname(fileURLToPath(import.meta.url)), "../../..");

/** 一時の repo が HEAD に持つ中身 */
const FILES: Record<string, string> = {
  "apps/a.ts": "export const STEP = 1.2;\n",
  "apps/twice.ts": "const A = 1;\nconst B = 1;\n",
  "packages/dragon/src/b.ts": "export const SIZE = 10;\n",
};
const PASS = [" ✓ apps/x.test.ts > 群 > kept-test 12ms", "      Tests  1 passed (1)"].join("\n");
const FAIL = [
  " × apps/x.test.ts > 群 > caught-test 15ms",
  " ✓ apps/x.test.ts > 群 > kept-test 12ms",
  "AssertionError: 拡大の上限が違う: expected 8 to be 4",
  "      Tests  1 failed | 1 passed (2)",
].join("\n");

const made: string[] = [];
afterEach(() => {
  for (const dir of made.splice(0)) rmSync(dir, { recursive: true, force: true });
});

function git(root: string, ...args: string[]): string {
  const r = spawnSync("git", ["-C", root, "-c", "core.hooksPath=/dev/null", "-c", "commit.gpgsign=false", ...args], { encoding: "utf8" });
  if (r.status !== 0) throw new Error(`git ${args.join(" ")}: ${r.stderr}`);
  return r.stdout;
}

/** `FILES` を commit した一時の repo と、結果を書く file (repo の外) */
function repo(): { root: string; out: string } {
  const root = mkdtempSync(join(tmpdir(), "mutate-values-"));
  const outDir = mkdtempSync(join(tmpdir(), "mutate-values-out-"));
  made.push(root, outDir);
  for (const [path, text] of Object.entries(FILES)) {
    mkdirSync(dirname(join(root, path)), { recursive: true });
    writeFileSync(join(root, path), text);
  }
  git(root, "init", "-q");
  git(root, "add", ".");
  git(root, "-c", "user.name=t", "-c", "user.email=t@example.invalid", "commit", "-q", "-m", "init");
  return { root, out: join(outDir, "result.jsonl") };
}

interface Call {
  /** 検査なら `vitest`、それ以外は引数を空白でつないだ物 */
  what: string;
  args: string[];
  /** 呼ばれた時の `FILES` の中身 */
  seen: Record<string, string>;
}

/** 命令を差し替え、呼ばれた順に残す。検査には `output` が返す出力を返し、Error なら投げる。build は `buildStatus` で終わる */
function fakeExec(root: string, output: (run: number) => string | Error = () => PASS, buildStatus = 0): { exec: Exec; calls: Call[] } {
  const calls: Call[] = [];
  const exec: Exec = (_cmd, args) => {
    const seen = Object.fromEntries(Object.keys(FILES).map((path) => [path, readFileSync(join(root, path), "utf8")]));
    const test = args.includes("vitest");
    calls.push({ what: test ? "vitest" : args.join(" "), args, seen });
    if (!test) return { status: buildStatus, stdout: "", stderr: "" };
    const o = output(calls.filter((c) => c.what === "vitest").length);
    if (o instanceof Error) throw o;
    return { status: o === PASS ? 0 : 1, stdout: o, stderr: "" };
  };
  return { exec, calls };
}

/** 結果の file の行。file が無ければ空 */
const rowsOf = (out: string): Row[] =>
  existsSync(out)
    ? readFileSync(out, "utf8")
        .split("\n")
        .filter((line) => line.trim() !== "")
        .map((line) => JSON.parse(line) as Row)
    : [];

const mutant = (id: string, file: string, old: string, next: string, names: string | null = null): Mutant => ({ id, file, old, new: next, tests: ["apps/x.test.ts"], names });
const quiet = (): void => undefined;

describe("値を 1 つずつ書き換えて検査が落ちるかを確かめる道具 (#3107)", () => {
  it("mutate-values-applies-before-running", () => {
    const { root, out } = repo();
    const { exec, calls } = fakeExec(root);
    runMutants({ root, mutants: [mutant("m1", "apps/a.ts", "1.2", "2")], out, exec, log: quiet });
    const run = calls.find((c) => c.what === "vitest");
    expect(run?.seen["apps/a.ts"], "書き換え後の字に替えてから検査を回していない").toBe("export const STEP = 2;\n");
    expect(run?.args, "変異が名指した検査の file を回していない").toContain("apps/x.test.ts");
  });

  it("mutate-values-records-failed-names", () => {
    const { root, out } = repo();
    const { exec } = fakeExec(root, (run) => (run === 1 ? FAIL : PASS));
    runMutants({ root, mutants: [mutant("m1", "apps/a.ts", "1.2", "2"), mutant("m2", "apps/a.ts", "1.2", "3")], out, exec, log: quiet });
    const rows = rowsOf(out).map(({ id, failed, summary, messages }) => ({ id, failed, summary, messages }));
    expect(rows, "変異ごとに落ちた検査の名前と集計を 1 行で残していない").toEqual([
      { id: "m1", failed: ["caught-test"], summary: "Tests  1 failed | 1 passed (2)", messages: ["拡大の上限が違う"] },
      { id: "m2", failed: [], summary: "Tests  1 passed (1)", messages: [] },
    ]);
  });

  it("mutate-values-restores-from-head", () => {
    for (const [label, output] of [
      ["検査が通った時", PASS],
      ["検査が落ちた時", FAIL],
      ["検査を起こせなかった時", new Error("vitest を起こせない")],
    ] as const) {
      const { root, out } = repo();
      const { exec, calls } = fakeExec(root, () => output);
      const run = (): Row[] => runMutants({ root, mutants: [mutant("m1", "apps/a.ts", "1.2", "2")], out, exec, log: quiet });
      if (output instanceof Error) expect(run, `${label}、止まった理由を投げ直していない`).toThrow("vitest を起こせない");
      else run();
      expect(calls.find((c) => c.what === "vitest")?.seen["apps/a.ts"], `${label}、検査の前に書き換えていない`).toBe("export const STEP = 2;\n");
      expect(readFileSync(join(root, "apps/a.ts"), "utf8"), `${label}、書き換えた file が HEAD の中身に戻らない`).toBe(FILES["apps/a.ts"]);
      expect(git(root, "status", "--porcelain"), `${label}、作業場所に差分が残る`).toBe("");
    }
  });

  it("mutate-values-stops-on-unfinished-run", () => {
    // 端末の Ctrl-C で止めた検査は集計の行を出さずに終わる。落ちた検査が無いと残すと、どの検査にも捕まらない変異と見分けられない。
    // 検査の前の build が止まると、書き換えを build しないまま検査が回り、変異が穴に見える
    const cases = [
      {
        label: "検査が集計の行を出さずに終わった時",
        first: mutant("m1", "apps/a.ts", "1.2", "2"),
        output: " ✓ apps/x.test.ts > 群 > kept-test 12ms",
        buildStatus: 0,
        unfinished: "検査が集計の行を出さずに終わった (終わり方 1)",
        commands: ["vitest"],
      },
      {
        label: "検査の前の build が落ちた時",
        first: mutant("pkg", "packages/dragon/src/b.ts", "10", "20"),
        output: PASS,
        buildStatus: 130,
        unfinished: "検査の前の build が終わらなかった (終わり方 130)",
        commands: ["build:packages", "build:packages"],
      },
    ];
    for (const c of cases) {
      const { root, out } = repo();
      const { exec, calls } = fakeExec(root, () => c.output, c.buildStatus);
      runMutants({ root, mutants: [c.first, mutant("next", "apps/a.ts", "1.2", "3")], out, exec, log: quiet });
      expect(rowsOf(out), `${c.label}、測れなかったと記録していないか、落ちた検査の名前を残した`).toEqual([{ id: c.first.id, wide: false, unfinished: c.unfinished }]);
      expect(calls.map((call) => call.what), `${c.label}、次の変異へ進んだか、build し直さなかった`).toEqual(c.commands);
      expect(git(root, "status", "--porcelain"), `${c.label}、作業場所に差分が残る`).toBe("");
    }
  });

  it("mutate-values-skips-ambiguous-target", () => {
    const { root, out } = repo();
    const { exec, calls } = fakeExec(root);
    runMutants({
      root,
      mutants: [mutant("none", "apps/a.ts", "9.9", "1"), mutant("twice", "apps/twice.ts", "= 1;", "= 2;"), mutant("ok", "apps/a.ts", "1.2", "2")],
      out,
      exec,
      log: quiet,
    });
    expect(rowsOf(out).map(({ id, skipped }) => ({ id, skipped })), "1 か所に決まらない変異を、理由を残して飛ばしていない").toEqual([
      { id: "none", skipped: "書き換える所が 1 か所に決まらない (0 か所)" },
      { id: "twice", skipped: "書き換える所が 1 か所に決まらない (2 か所)" },
      { id: "ok", skipped: undefined },
    ]);
    expect(calls.filter((c) => c.what === "vitest").map((c) => c.seen["apps/a.ts"]), "飛ばした変異で検査を回したか、次の変異へ進んでいない").toEqual(["export const STEP = 2;\n"]);
    expect(git(root, "status", "--porcelain"), "飛ばした変異の file に差分が残る").toBe("");
  });

  it("mutate-values-rebuilds-package-sources", () => {
    const { root, out } = repo();
    const { exec, calls } = fakeExec(root);
    runMutants({ root, mutants: [mutant("pkg", "packages/dragon/src/b.ts", "10", "20"), mutant("app", "apps/a.ts", "1.2", "2")], out, exec, log: quiet });
    expect(
      calls.map((c) => [c.what, c.seen["packages/dragon/src/b.ts"]]),
      "package の source の変異の前と戻した後に build し直していないか、それ以外の変異で build した",
    ).toEqual([
      ["build:packages", "export const SIZE = 20;\n"],
      ["vitest", "export const SIZE = 20;\n"],
      ["build:packages", "export const SIZE = 10;\n"],
      ["vitest", "export const SIZE = 10;\n"],
    ]);
  });

  it("mutate-values-narrows-by-names", () => {
    const { root, out } = repo();
    const { exec, calls } = fakeExec(root);
    const mutants = [mutant("named", "apps/a.ts", "1.2", "2", "a-test|b-test"), mutant("plain", "apps/a.ts", "1.2", "3")];
    runMutants({ root, mutants, out, exec, log: quiet });
    runMutants({ root, mutants: [mutants[0] as Mutant], out, wide: true, exec, log: quiet });
    const tail = (c: Call): string[] => c.args.slice(c.args.indexOf("apps/x.test.ts") + 1);
    expect(calls.filter((c) => c.what === "vitest").map(tail), "名前に絞らないか、--wide で絞った").toEqual([["-t", " (a-test|b-test)$"], [], []]);
    expect(rowsOf(out).map(({ id, wide }) => ({ id, wide })), "--wide で回したかを結果に残していない").toEqual([
      { id: "named", wide: false },
      { id: "plain", wide: false },
      { id: "named", wide: true },
    ]);
  });

  it("mutate-values-is-a-package-script", () => {
    const pkg = JSON.parse(readFileSync(join(REPO, "package.json"), "utf8")) as { scripts: Record<string, string> };
    expect(pkg.scripts["test:mutation:values"], "pnpm test:mutation:values が道具を起こさない").toBe("node scripts/mutate-values.mjs");
  });

  it("mutate-values-header-example-parses", () => {
    const text = readFileSync(join(REPO, "scripts/mutate-values.mjs"), "utf8");
    const header = (/^\/\*\*\n([\s\S]*?)\n \*\//.exec(text)?.[1] ?? "")
      .split("\n")
      .map((line) => line.replace(/^ \* ?/, ""))
      .join("\n");
    expect(header, "冒頭の説明に使い方が無い").toContain("pnpm test:mutation:values <変異の一覧> <結果の file>");
    expect(header, "冒頭の説明に Stryker では足りない理由が無い").toContain("Stryker");
    const example = /```json\n([\s\S]*?)\n```/.exec(header)?.[1];
    expect(example, "冒頭の説明に変異の一覧の書き方の例が無い").toBeDefined();
    expect(readMutants(example ?? "[]"), "例が道具の読める 1 件の変異になっていない").toEqual([
      { id: expect.any(String), file: expect.any(String), old: expect.any(String), new: expect.any(String), tests: [expect.any(String)], names: expect.any(String), what: expect.any(String) },
    ]);
    // 道具が書き換え前の字の無い変異を断らなければ、例が読めても形を確かめたことにならない
    expect(() => readMutants(JSON.stringify([{ id: "x", file: "a.ts", new: "2", tests: [] }])), "書き換え前の字が無い変異を読めてしまう").toThrow("old");
  });
});

/**
 * 変異の結果から、ikkan の関門が読む壊して測った結果の表を作る (#3130)。
 *
 * 表を手で写すと、1 行の写し間違いで検査が捕まえていない所を捕まえたと残す。
 * 落ちなかった変異と測れなかった変異は、関門が断れる形 (件数 0 か、数字で始まらない件数) で表に出す。
 */
describe("変異の結果から壊して測った結果の表を作る (#3130)", () => {
  const named = (id: string, what: string): Mutant => ({ ...mutant(id, "apps/a.ts", "1.2", "2"), what });
  const ran = (id: string, failed: string[], wide = false): Row => ({ id, wide, summary: "Tests  1 passed (1)", failed, messages: [] });
  const heading = (step: number): string[] => [`## 壊して測った結果 (step ${step})`, "", "| 壊した所 | 落ちた判定の件数 |", "|---|---|"];
  /** ikkan の関門と同じく、逃がしていない縦線で列を分ける */
  const cellsOf = (line: string): string[] => line.trim().slice(1, -1).split(/(?<!\\)\|/).map((cell) => cell.trim());

  it("mutation-table-lists-each-mutant", () => {
    const text = mutationTable({
      mutants: [named("r1", "拡大の上限 4 倍を 8 倍"), named("r2", "刻みを 3 に")],
      rows: [ran("r2", ["c-test"]), ran("r1", ["a-test", "b-test"])],
      step: 10,
    });
    expect(text, "見出しと 2 列の表が無いか、一覧の順に 1 変異 1 行で並ばないか、件数が落ちた検査の数でない").toBe(
      [...heading(10), "| `r1` 拡大の上限 4 倍を 8 倍 (落ちた検査 a-test、b-test、全部の検査で回した回) | 2 |", "| `r2` 刻みを 3 に (落ちた検査 c-test、全部の検査で回した回) | 1 |"].join("\n"),
    );
  });

  it("mutation-table-counts-a-survivor-as-zero", () => {
    const text = mutationTable({ mutants: [named("r1", "刻みを 3 に")], rows: [ran("r1", [])], step: 18 });
    expect(text, "どの検査も落ちなかった変異を件数 0 の行にしていない").toBe([...heading(18), "| `r1` 刻みを 3 に (全部の検査で回した回) | 0 |"].join("\n"));
  });

  it("mutation-table-names-skipped-and-unfinished", () => {
    const text = mutationTable({
      mutants: [named("none", "無い字を替える"), named("stop", "build が落ちる")],
      rows: [
        { id: "none", skipped: "書き換える所が 1 か所に決まらない (0 か所)" },
        { id: "stop", wide: false, unfinished: "検査の前の build が終わらなかった (終わり方 130)" },
      ],
      step: 10,
    });
    expect(text, "飛ばした変異と測れなかった変異の件数の欄が、理由の付いた数字で始まらない字になっていない").toBe(
      [...heading(10), "| `none` 無い字を替える | 飛ばした、書き換える所が 1 か所に決まらない (0 か所) |", "| `stop` build が落ちる (全部の検査で回した回) | 測れなかった、検査の前の build が終わらなかった (終わり方 130) |"].join("\n"),
    );
  });

  it("mutation-table-marks-mutants-not-run", () => {
    const text = mutationTable({
      mutants: [named("stop", "検査が止まる"), named("after", "止まった後の変異")],
      rows: [{ id: "stop", wide: false, unfinished: "検査が集計の行を出さずに終わった (終わり方 1)" }],
      step: 10,
    });
    expect(text, "結果に行の無い変異が表から消えたか、回していないと出していない").toBe(
      [...heading(10), "| `stop` 検査が止まる (全部の検査で回した回) | 測れなかった、検査が集計の行を出さずに終わった (終わり方 1) |", "| `after` 止まった後の変異 | 回していない |"].join("\n"),
    );
  });

  it("mutation-table-uses-the-last-row", () => {
    const text = mutationTable({
      mutants: [named("r1", "名前で絞ると落ちる"), named("r2", "一度止まった")],
      rows: [ran("r1", ["a-test"]), { id: "r2", wide: false, unfinished: "検査が集計の行を出さずに終わった (終わり方 1)" }, ran("r1", [], true), ran("r2", ["b-test"])],
      step: 10,
    });
    expect(text, "同じ変異の行が 2 つ以上在る時に、最後の行で表を作っていない").toBe(
      [...heading(10), "| `r1` 名前で絞ると落ちる (全部の検査で回した回) | 0 |", "| `r2` 一度止まった (落ちた検査 b-test、全部の検査で回した回) | 1 |"].join("\n"),
    );
  });

  it("mutation-table-escapes-pipes", () => {
    const text = mutationTable({ mutants: [named("r1", "名前を a|b に")], rows: [ran("r1", ["x|y"])], step: 10 });
    const line = text.split("\n").at(-1) ?? "";
    expect(line, "壊した所の字の縦線を逃がしていない").toBe("| `r1` 名前を a\\|b に (落ちた検査 x\\|y、全部の検査で回した回) | 1 |");
    expect(cellsOf(line), "縦線を含む行が 2 列のまま読めない").toHaveLength(2);
  });

  it("mutation-table-names-the-run", () => {
    const text = mutationTable({
      mutants: [
        { ...named("n1", "名前で絞って残る"), names: "a-test" },
        { ...named("n2", "名前で絞って落ちる"), names: "a-test" },
        { ...named("w1", "全部で回して残る"), names: "a-test" },
        named("z1", "名前の無い変異"),
        { ...named("u1", "名前で絞って止まる"), names: "a-test" },
      ],
      rows: [ran("n1", []), ran("n2", ["a-test"]), ran("w1", [], true), ran("z1", ["b-test"]), { id: "u1", wide: false, unfinished: "検査が集計の行を出さずに終わった (終わり方 1)" }],
      step: 10,
    });
    const lines = text.split("\n").slice(heading(10).length);
    expect(lines, "名前で絞った回と全部の検査で回した回を、壊した所の括弧の最後で書き分けていない").toEqual([
      "| `n1` 名前で絞って残る (名前で絞った回) | 0 |",
      "| `n2` 名前で絞って落ちる (落ちた検査 a-test、名前で絞った回) | 1 |",
      "| `w1` 全部で回して残る (全部の検査で回した回) | 0 |",
      "| `z1` 名前の無い変異 (落ちた検査 b-test、全部の検査で回した回) | 1 |",
      "| `u1` 名前で絞って止まる (名前で絞った回) | 測れなかった、検査が集計の行を出さずに終わった (終わり方 1) |",
    ]);
    expect(lines.map((line) => cellsOf(line)[1]), "回し方を書いた行の件数の欄が、数か理由のままでない").toEqual(["0", "1", "0", "1", "測れなかった、検査が集計の行を出さずに終わった (終わり方 1)"]);
    for (const line of lines) expect(cellsOf(line), `回し方を書いた行が 2 列のまま読めない (${line})`).toHaveLength(2);
  });

  it("mutation-table-leaves-unrun-rows-unmarked", () => {
    const text = mutationTable({
      mutants: [{ ...named("s1", "無い字を替える"), names: "a-test" }, { ...named("after", "止まった後の変異"), names: "a-test" }],
      rows: [{ id: "s1", skipped: "書き換える所が 1 か所に決まらない (0 か所)" }],
      step: 10,
    });
    expect(text, "飛ばした変異と回していない変異の行に、回し方を書いた").toBe(
      [...heading(10), "| `s1` 無い字を替える | 飛ばした、書き換える所が 1 か所に決まらない (0 か所) |", "| `after` 止まった後の変異 | 回していない |"].join("\n"),
    );
  });

  it("mutation-table-is-a-package-script", () => {
    const pkg = JSON.parse(readFileSync(join(REPO, "package.json"), "utf8")) as { scripts: Record<string, string> };
    expect(pkg.scripts["test:mutation:table"], "pnpm test:mutation:table が表を作る呼び方を起こさない").toBe("node scripts/mutate-values.mjs --table");
    const { list, out } = tableInput([named("r1", "刻みを 3 に")], [ran("r1", ["a-test"])]);
    const r = spawnSync(process.execPath, ["scripts/mutate-values.mjs", "--table", list, out, "--step", "10"], { cwd: REPO, encoding: "utf8" });
    expect(r.status, `表を作る呼び方が終わり方 0 で終わらない: ${r.stderr}`).toBe(0);
    expect(r.stdout, "表を作る呼び方が、変異の一覧と結果から作った表を出さない").toBe(`${[...heading(10), "| `r1` 刻みを 3 に (落ちた検査 a-test、全部の検査で回した回) | 1 |"].join("\n")}\n`);
  });

  it("mutation-table-refuses-bad-input", () => {
    const { list, out } = tableInput([named("r1", "刻みを 3 に")], [ran("r1", ["a-test"])]);
    const ghost = tableInput([named("r1", "刻みを 3 に")], [ran("r1", ["a-test"]), ran("ghost", [])]);
    const cases: [string, string[]][] = [
      ["file が 1 つの時", [list, "--step", "10"]],
      ["file が 3 つの時", [list, out, out, "--step", "10"]],
      ["--step が無い時", [list, out]],
      ["--step の後に数が無い時", [list, out, "--step"]],
      ["--step が数でない時", [list, out, "--step", "x"]],
      ["--step が 0 の時", [list, out, "--step", "0"]],
      ["知らない札が在る時", [list, out, "--step", "10", "--wide"]],
      ["結果に一覧に無い変異の行が在る時", [ghost.list, ghost.out, "--step", "10"]],
    ];
    for (const [label, args] of cases) {
      const r = spawnSync(process.execPath, ["scripts/mutate-values.mjs", "--table", ...args], { cwd: REPO, encoding: "utf8" });
      expect(r.status, `${label}、終わり方 2 で止まらない`).toBe(2);
      expect(r.stdout, `${label}、表を出した`).toBe("");
      expect(r.stderr, `${label}、止めた理由を出していない`).not.toBe("");
    }
  });
});

/** 表を作る呼び方へ渡す、変異の一覧と結果の file (repo の外) */
function tableInput(mutants: Mutant[], rows: Row[]): { list: string; out: string } {
  const dir = mkdtempSync(join(tmpdir(), "mutation-table-"));
  made.push(dir);
  const list = join(dir, "mutants.json");
  const out = join(dir, "result.jsonl");
  writeFileSync(list, JSON.stringify(mutants));
  writeFileSync(out, rows.map((row) => `${JSON.stringify(row)}\n`).join(""));
  return { list, out };
}
