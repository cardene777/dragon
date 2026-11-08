#!/usr/bin/env node
/**
 * プラグインの評価を回し、結果をケースの指紋と一緒に `plugins/dragon/evals/record.json` へ書く (#3484)。
 *
 * 評価 (`claude plugin eval`) は Claude を動かすたびに費用がかかるので、検査 (`plugin-eval.test.ts`) は評価を回さずにこの記録を読む。
 * ケースの文や判定を書き換えたら、`pnpm build:packages` の後でこの script を回して記録を書き直す。
 *
 *   node scripts/plugin-eval-record.mjs                     # 全てのケース
 *   node scripts/plugin-eval-record.mjs layout-bridge       # 名前を挙げたケースだけ
 *
 * 評価の囲いは npm に届かず、プラグインの置き場の外の file も読めない。そこで、プラグインの写しを作り、
 * この repo で build した `dist/cli.cjs` を写しの中に置いて、それを呼ぶ `dragon` を PATH の頭に足して回す。
 *
 * 1 回の run が通るのは、ケースの判定が全て通り、かつ保存した図の崩れの段を全て返答が名指している時。
 * 保存した図を、この repo の `dragon check --layout` に掛け直し、出た崩れの段の番号 (「段 3」「Step 3」) が最後の返答に有るかを見る。
 * 崩れが 0 件の図は、名指す段が無いので通る。
 */
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import {
  chmodSync,
  cpSync,
  existsSync,
  globSync,
  lstatSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  rmSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { dirname, join, relative } from "node:path";

const ROOT = process.cwd();
const PLUGIN = join(ROOT, "plugins/dragon");
const EVALS = join(PLUGIN, "evals");
const RECORD = join(EVALS, "record.json");
const CLI = join(ROOT, "packages/dragon/dist/cli.cjs");

/** ケースの dir の下の file を全て、ケースの dir からの path の順に */
function filesUnder(dir) {
  return readdirSync(dir)
    .flatMap((name) => {
      const path = join(dir, name);
      return statSync(path).isDirectory() ? filesUnder(path) : [path];
    })
    .sort();
}

/** ケースの指紋。検査 (`plugin-eval.test.ts`) と同じ作り方をする */
function caseFingerprint(dir) {
  const hash = createHash("sha256");
  for (const file of filesUnder(dir))
    hash.update(`${relative(dir, file)}\0${readFileSync(file, "utf8")}\0`);
  return hash.digest("hex");
}

/** run の最後の返答の字。記録 (`trace.jsonl`) の最後の、字を持つ Claude の発言 */
function lastReply(tracePath) {
  const said = readFileSync(tracePath, "utf8")
    .split("\n")
    .filter((line) => line.trim() !== "")
    .map((line) => JSON.parse(line))
    .filter((entry) => entry.type === "assistant")
    .map((entry) =>
      (entry.message?.content ?? [])
        .filter((part) => part.type === "text")
        .map((part) => part.text)
        .join("\n"),
    )
    .filter((text) => text.trim() !== "");
  return said.at(-1) ?? "";
}

/** 保存した図 `file` の崩れの段の番号 (1 から数える) */
function breakSteps(file) {
  const ran = spawnSync(
    process.execPath,
    [CLI, "check", file, "--layout", "--json", "--lang", "ja"],
    { encoding: "utf8" },
  );
  if (ran.status !== 0)
    return { error: `dragon check --layout の終わり方 ${ran.status}: ${ran.stderr.trim()}` };
  const problems = JSON.parse(ran.stdout || "[]");
  return {
    steps: [...new Set(problems.flatMap((p) => (p.layout ? [p.layout.step] : [])))].sort(
      (a, b) => a - b,
    ),
  };
}

/** 返答が段 `step` を名指すか */
const namesStep = (reply, step) =>
  new RegExp(`(?:段|ステップ|Step|step)\\s*${step}(?!\\d)`, "u").test(reply);

if (!existsSync(CLI)) {
  console.error(`${relative(ROOT, CLI)} が無い。先に pnpm build:packages を回す`);
  process.exit(2);
}
const all = readdirSync(EVALS)
  .filter((name) => existsSync(join(EVALS, name, "prompt.md")))
  .sort();
const asked = process.argv.slice(2);
const unknown = asked.filter((name) => !all.includes(name));
if (unknown.length > 0) {
  console.error(`知らないケース: ${unknown.join(" ")} (在るケース: ${all.join(" ")})`);
  process.exit(2);
}
const chosen = asked.length > 0 ? asked : all;

// プラグインの写しに、選んだケースと、この repo の CLI を置く
mkdirSync(join(ROOT, ".context/scratch"), { recursive: true });
const work = mkdtempSync(join(ROOT, ".context/scratch/plugin-eval-"));
const copy = join(work, "dragon");
cpSync(PLUGIN, copy, { recursive: true, filter: (src) => !src.startsWith(join(EVALS, "results")) });
for (const name of all)
  if (!chosen.includes(name)) rmSync(join(copy, "evals", name), { recursive: true, force: true });
// CLI は依存の package (`mediabunny` など) を読むので、build した package を束ねて写しの中へ依存と一緒に入れる。
// repo の作業場所 (pnpm の workspace) に混ざらないよう、`--ignore-workspace` で写しの中だけに入れる。
// pnpm の既定の置き方は `node_modules/.pnpm` への symlink で、評価の囲いの中からはその先を読めない (CLI が見つからないと断られた)。
// そこで npm と同じ平らな置き方 (`hoisted`) で入れる
const cliDir = join(copy, "eval-cli");
mkdirSync(join(cliDir, "bin"), { recursive: true });
const packed = spawnSync("pnpm", ["pack", "--pack-destination", work], {
  cwd: join(ROOT, "packages/dragon"),
  encoding: "utf8",
});
const tarball = globSync("*.tgz", { cwd: work })[0];
if (packed.status !== 0 || tarball === undefined) {
  console.error(`package を束ねられない (終わり方 ${packed.status}): ${packed.stderr}`);
  process.exit(1);
}
writeFileSync(
  join(cliDir, "package.json"),
  `${JSON.stringify({ name: "dragon-eval-cli", private: true }, null, 2)}\n`,
);
const added = spawnSync(
  "pnpm",
  [
    "add",
    join(work, tarball),
    "--ignore-workspace",
    "--config.node-linker=hoisted",
    "--dir",
    cliDir,
  ],
  { stdio: "inherit" },
);
const installed = join(cliDir, "node_modules/@cardenelabs/dragon");
if (added.status !== 0 || !existsSync(installed) || lstatSync(installed).isSymbolicLink()) {
  console.error(`束ねた package を写しに平らに入れられない (終わり方 ${added.status})`);
  process.exit(1);
}
const wrapper = join(cliDir, "bin/dragon");
// 囲いの中では版を切り替える道具 (mise など) の shim が動かないので、node を直に指す
writeFileSync(
  wrapper,
  `#!/bin/sh\nexec "${process.execPath}" "${join(cliDir, "node_modules/@cardenelabs/dragon/dist/cli.cjs")}" "$@"\n`,
);
chmodSync(wrapper, 0o755);
// 囲いの外で 1 度動かし、写しの CLI が依存を読めることを確かめてから評価を回す
const tried = spawnSync(wrapper, ["--version"], { encoding: "utf8" });
if (tried.status !== 0) {
  console.error(`写しの dragon が動かない: ${tried.stderr}`);
  process.exit(1);
}

const out = join(work, "result.json");
const ran = spawnSync(
  "claude",
  [
    "plugin",
    "eval",
    copy,
    "--allow-tools",
    "Bash",
    "Write",
    "Edit",
    "--trust-plugin",
    "--no-publish",
    "--keep-temp",
    "--ablation",
    "none",
    "-j",
    "3",
    "--json",
    out,
  ],
  {
    stdio: "inherit",
    env: { ...process.env, PATH: `${dirname(wrapper)}:${process.env.PATH ?? ""}` },
  },
);
if (!existsSync(out)) {
  console.error(
    `評価が結果を書かなかった (終わり方 ${ran.status})。写しは ${relative(ROOT, work)} に残した`,
  );
  process.exit(1);
}
const result = JSON.parse(readFileSync(out, "utf8"));
const record = existsSync(RECORD) ? JSON.parse(readFileSync(RECORD, "utf8")) : {};
const date = new Date().toISOString().slice(0, 10);
for (const evalCase of result.cases) {
  const runs = evalCase.arms.with ?? [];
  let passed = 0;
  runs.forEach((run, index) => {
    const base = dirname(dirname(run.tracePath));
    // 残した囲いの dir は持ち主しか開けない形で封じてあるので、読む前に開ける
    for (const dir of [base, join(base, "sealed")]) if (existsSync(dir)) chmodSync(dir, 0o700);
    const reply = existsSync(run.tracePath) ? lastReply(run.tracePath) : "";
    const files = globSync("sealed/**/*.dragon", { cwd: base }).map((file) => join(base, file));
    const found = files.map((file) => ({ file, ...breakSteps(file) }));
    const unnamed = found.flatMap((f) =>
      (f.steps ?? [])
        .filter((step) => !namesStep(reply, step))
        .map((step) => `${relative(base, f.file)} の段 ${step}`),
    );
    const errors = found.flatMap((f) => (f.error ? [`${relative(base, f.file)}: ${f.error}`] : []));
    const failedGraders = (run.graders ?? [])
      .filter((g) => !g.passed)
      .map((g) => `${g.name} (${g.explanation})`);
    const ok = run.passed && files.length > 0 && unnamed.length === 0 && errors.length === 0;
    if (ok) passed++;
    const why = [
      ...failedGraders,
      ...(files.length === 0 ? ["保存した .dragon が無い"] : []),
      ...unnamed.map((s) => `返答が ${s} の崩れを名指さない`),
      ...errors,
    ];
    const steps = found
      .map((f) => `${relative(base, f.file)}: 崩れの段 [${(f.steps ?? []).join(", ")}]`)
      .join(" / ");
    console.log(
      `${evalCase.name} run${index + 1}: ${ok ? "通った" : "落ちた"} ${steps}${why.length > 0 ? ` 理由: ${why.join(" / ")}` : ""} 記録: ${run.tracePath}`,
    );
  });
  record[evalCase.name] = {
    fingerprint: caseFingerprint(join(EVALS, evalCase.name)),
    runs: runs.length,
    passed,
    claude: result.claudeVersion,
    date,
  };
}
writeFileSync(RECORD, `${JSON.stringify(record, null, 2)}\n`);
console.log(
  `${relative(ROOT, RECORD)} を書いた。費用 ${result.costUsd} USD。写しと結果は ${relative(ROOT, work)}`,
);
