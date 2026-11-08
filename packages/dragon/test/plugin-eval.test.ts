/**
 * プラグインの skill を入れた Claude を実際に動かした評価の記録 (#3484)。
 *
 * 評価 (`claude plugin eval plugins/dragon`) は Claude を動かすたびに費用がかかるので、検査の中では回さない。
 * 回した結果は評価のケースの指紋と一緒に `plugins/dragon/evals/record.json` に残し、この検査は記録を読む。
 * ケースの文や判定を書き換えると指紋が変わり、記録が古いと分かる。その時は評価を回し直して記録を書き直す
 * (`node scripts/plugin-eval-record.mjs`)。
 */
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, mkdtempSync, readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, relative } from "node:path";
import { describe, expect, it } from "vitest";

const ROOT = process.cwd();
const EVALS = join(ROOT, "plugins/dragon/evals");
const RECORD = join(EVALS, "record.json");
/** 1 つのケースを回す回数の下限。1 回だけの合格は運でも出る */
const MIN_RUNS = 3;

interface Entry {
  fingerprint: string;
  runs: number;
  passed: number;
  claude: string;
  date: string;
}

/** ケースの dir の下の file を全て、ケースの dir からの path の順に */
function filesUnder(dir: string): string[] {
  return readdirSync(dir)
    .flatMap((name) => {
      const path = join(dir, name);
      return statSync(path).isDirectory() ? filesUnder(path) : [path];
    })
    .sort();
}

/** ケースの指紋。ケースの dir の下の file の path と中身から作る。記録を書く `scripts/plugin-eval-record.mjs` も同じ作り方をする */
function caseFingerprint(dir: string): string {
  const hash = createHash("sha256");
  for (const file of filesUnder(dir)) hash.update(`${relative(dir, file)}\0${readFileSync(file, "utf8")}\0`);
  return hash.digest("hex");
}

function checkRecorded(name: string): void {
  const dir = join(EVALS, name);
  expect(existsSync(join(dir, "prompt.md")), `評価のケース ${relative(ROOT, dir)} が無い`).toBe(true);
  expect(existsSync(RECORD), `${relative(ROOT, RECORD)} が無い`).toBe(true);
  if (!existsSync(join(dir, "prompt.md")) || !existsSync(RECORD)) return;
  const entry = (JSON.parse(readFileSync(RECORD, "utf8")) as Record<string, Entry>)[name];
  expect(entry, `${name} を回した記録が無い`).toBeDefined();
  expect(entry?.fingerprint, `${name} のケースを書き換えた後に回し直していない`).toBe(caseFingerprint(dir));
  expect(entry?.runs ?? 0, `${name} を回した回数が少ない`).toBeGreaterThanOrEqual(MIN_RUNS);
  expect(entry?.passed, `${name} の回のうち通らなかった回がある`).toBe(entry?.runs);
}

describe("skill を入れた Claude が崩れを伝える評価 (#3484)", () => {
  it("layout-bridge", () => checkRecorded("layout-bridge"));
  it("layout-payment", () => checkRecorded("layout-payment"));
});

/** 評価のために fork の代わりに作る写しの repo と、偽の `gh` を置いた dir */
interface StandIn {
  repo: string;
  bin: string;
  /** 偽の `gh` が受けた引数を 1 回 1 行の JSON の配列で書く file */
  ghLog: string;
}

/**
 * 足したブロックを共有のブロック集へ PR で出す評価 (#3508)。
 *
 * 評価の囲いは GitHub に届かず、本物へ PR を出すと試しの PR が積まれる。
 * 記録の script は fork の代わりに小さな写しの repo を作り、渡された引数を書き残す偽の `gh` を PATH の頭に置いて回す。
 */
describe("skill を入れた Claude がブロックを足して PR を出す評価 (#3508)", () => {
  it("plugin-eval-stand-in-records-gh", async () => {
    const script = join(ROOT, "scripts/plugin-eval-stand-in.mjs");
    expect(existsSync(script), `${relative(ROOT, script)} が無い`).toBe(true);
    if (!existsSync(script)) return;
    const { makeStandIn } = (await import(script)) as { makeStandIn: (options: { root: string; dir: string }) => StandIn };
    const dir = mkdtempSync(join(tmpdir(), "dragon-stand-in-"));
    const standIn = makeStandIn({ root: ROOT, dir });
    // 写しの repo は git の repo で、共有のブロック集と PR の雛形と決まりの文書を持つ
    for (const path of ["packages/dragon/blocks/bridge.dragon", "packages/dragon/blocks/examples/bridge.dragon", "CONTRIBUTING.md", ".github/PULL_REQUEST_TEMPLATE.md"]) {
      expect(existsSync(join(standIn.repo, path)), `写しの repo に ${path} が無い`).toBe(true);
    }
    const head = spawnSync("git", ["-C", standIn.repo, "rev-parse", "--verify", "HEAD"], { encoding: "utf8" });
    expect(head.status, `写しの repo に commit が無い ${head.stderr}`).toBe(0);
    // PATH の頭に置くと gh は偽の gh を指し、届かない proxy を渡しても通る
    const env = { ...process.env, PATH: `${standIn.bin}:${process.env.PATH ?? ""}`, HTTPS_PROXY: "http://127.0.0.1:9", HTTP_PROXY: "http://127.0.0.1:9" };
    const which = spawnSync("sh", ["-c", "command -v gh"], { encoding: "utf8", env });
    expect(which.stdout.trim(), "gh が偽の gh を指さない").toBe(join(standIn.bin, "gh"));
    const body = join(dir, "pr-body.md");
    writeFileSync(body, "## What the block shows\n");
    const calls = [
      ["pr", "create", "--repo", "cardene777/dragon", "--title", "feat: add the shared block +vault", "--body-file", body],
      ["pr", "merge", "1", "--repo", "cardene777/dragon"],
    ];
    for (const args of calls) {
      const ran = spawnSync("gh", args, { cwd: standIn.repo, encoding: "utf8", env, timeout: 10_000 });
      expect(ran.status, `偽の gh ${args.join(" ")} が終わり方 0 にならない ${ran.stderr}`).toBe(0);
    }
    const logged = readFileSync(standIn.ghLog, "utf8")
      .trimEnd()
      .split("\n")
      .map((line) => JSON.parse(line) as string[]);
    expect(logged, "偽の gh が受けた引数を順に残さない").toEqual(calls);
  });

  it("block-pr", () => checkRecorded("block-pr"));
});
