/**
 * プラグインの skill を入れた Claude を実際に動かした評価の記録 (#3484)。
 *
 * 評価 (`claude plugin eval plugins/dragon`) は Claude を動かすたびに費用がかかるので、検査の中では回さない。
 * 回した結果は評価のケースの指紋と一緒に `plugins/dragon/evals/record.json` に残し、この検査は記録を読む。
 * ケースの文や判定を書き換えると指紋が変わり、記録が古いと分かる。その時は評価を回し直して記録を書き直す
 * (`node scripts/plugin-eval-record.mjs`)。
 */
import { createHash } from "node:crypto";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
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
