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
 * 1 回の run が通るのは、ケースの判定が全て通り、かつケースの印 (`prompt.md` の `tags`) ごとの次の確かめが通った時。
 *
 * - `layout` の印のケースは、保存した図を、この repo の `dragon check --layout` に掛け直し、出た崩れの段の番号
 *   (「段 3」「Step 3」) が最後の返答に有るかを見る。崩れが 0 件の図は、名指す段が無いので通る。
 * - `pr` の印のケースは、fork の代わりの写しの repo (`plugin-eval-stand-in.mjs`) で、共有のブロックの定義と見本を 1 つずつ足し、
 *   2 つともこの repo の `dragon check` (見本は `--blocks` で定義を渡す) が通り、偽の `gh` に `pr create` を `--repo cardene777/dragon` と
 *   `feat:` で始まる題で渡し、`pr merge` を渡さず、PR の本文が `pnpm verify` に触れているかを見る (#3508)。
 *   写しの repo は作業場所へ下ごしらえ (`scaffold.sh`) が写すので、評価を `--scaffold` 付きで回す。
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
import { BASE_TAG, GH_LOG, makeStandIn } from "./plugin-eval-stand-in.mjs";

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

/** ケースの印。`prompt.md` の頭の `tags: [...]` */
function tagsOf(name) {
  const head = readFileSync(join(EVALS, name, "prompt.md"), "utf8");
  const tags = /^tags:\s*\[([^\]]*)\]/mu.exec(head)?.[1] ?? "";
  return tags.split(",").map((tag) => tag.trim()).filter((tag) => tag !== "");
}

/** 崩れを伝えるケースの確かめ。通らない理由と、崩れの段の並びを返す */
function judgeLayout(base, reply) {
  const files = globSync("sealed/**/*.dragon", { cwd: base }).map((file) => join(base, file));
  const found = files.map((file) => ({ file, ...breakSteps(file) }));
  const unnamed = found.flatMap((f) =>
    (f.steps ?? [])
      .filter((step) => !namesStep(reply, step))
      .map((step) => `${relative(base, f.file)} の段 ${step}`),
  );
  const why = [
    ...(files.length === 0 ? ["保存した .dragon が無い"] : []),
    ...unnamed.map((s) => `返答が ${s} の崩れを名指さない`),
    ...found.flatMap((f) => (f.error ? [`${relative(base, f.file)}: ${f.error}`] : [])),
  ];
  const note = found
    .map((f) => `${relative(base, f.file)}: 崩れの段 [${(f.steps ?? []).join(", ")}]`)
    .join(" / ");
  return { why, note };
}

/** 引数の並びから設定 `names` の値を引く。`--repo x` と `--repo=x` の 2 つの書き方を読む */
function optionValue(args, names) {
  for (const [i, arg] of args.entries()) {
    if (names.includes(arg)) return args[i + 1];
    const long = names.find((name) => name.startsWith("--") && arg.startsWith(`${name}=`));
    if (long !== undefined) return arg.slice(long.length + 1);
  }
  return undefined;
}

/** この repo の `dragon check` を回し、通らない時は理由を返す */
function checkWithRepoCli(args) {
  const ran = spawnSync(process.execPath, [CLI, "check", ...args], { encoding: "utf8" });
  return ran.status === 0 ? undefined : `dragon check ${args.join(" ")} の終わり方 ${ran.status}: ${(ran.stdout + ran.stderr).trim()}`;
}

/** `dir` の下の file の、`dir` からの path と中身。`.git` と `node_modules` の下は数えない */
function treeOf(dir) {
  const files = new Map();
  const walk = (at) => {
    for (const name of readdirSync(at)) {
      if (name === ".git" || name === "node_modules") continue;
      const path = join(at, name);
      if (lstatSync(path).isDirectory()) walk(path);
      else files.set(relative(dir, path), readFileSync(path));
    }
  };
  walk(dir);
  return files;
}

/**
 * 共有のブロックを足して PR を出すケースの確かめ (#3508)。通らない理由と、足した file と PR の題を返す。
 * 残した作業場所の中では git を打たない (囲いの中で書かれた設定を読んで動くため)。写しの repo の元 (`template`) と file を見比べて数える
 */
function judgePr(base, template) {
  const heads = globSync("sealed/**/.git/refs/tags/" + BASE_TAG, { cwd: base });
  if (heads.length !== 1) return { why: [`作業場所に写しの repo が 1 つでない (${heads.length} 個)`], note: "" };
  const gitDir = join(base, dirname(dirname(dirname(heads[0]))));
  const repo = dirname(gitDir);
  const before = treeOf(template);
  const after = treeOf(repo);
  const all = [
    ...[...after.keys()].filter((path) => !before.has(path)).map((path) => ["A", path]),
    ...[...before.keys()].filter((path) => !after.has(path)).map((path) => ["D", path]),
    ...[...after.keys()].filter((path) => before.has(path) && !before.get(path).equals(after.get(path))).map((path) => ["M", path]),
  ];
  const blocksDir = "packages/dragon/blocks/";
  const added = all.filter(([status, path]) => status === "A" && path.startsWith(blocksDir)).map(([, path]) => path);
  const definitions = added.filter((path) => /^packages\/dragon\/blocks\/[a-z0-9-]+\.dragon$/u.test(path));
  const examples = added.filter((path) => /^packages\/dragon\/blocks\/examples\/[a-z0-9-]+\.dragon$/u.test(path));
  const touched = all.filter(([status, path]) => status !== "A" || path.startsWith("packages/")).filter(([, path]) => !added.includes(path));
  const why = [];
  if (definitions.length !== 1 || examples.length !== 1 || added.length !== 2)
    why.push(`共有のブロック集に足した file が定義と見本の 1 つずつでない: [${added.join(", ")}]`);
  else if (definitions[0].split("/").at(-1) !== examples[0].split("/").at(-1))
    why.push(`定義と見本の file の名前が違う: ${definitions[0]} と ${examples[0]}`);
  if (touched.length > 0) why.push(`ほかの file を変えた: [${touched.map(([status, path]) => `${status} ${path}`).join(", ")}]`);
  if (definitions.length === 1) {
    const definition = join(repo, definitions[0]);
    const failed = [checkWithRepoCli([definition]), ...examples.map((example) => checkWithRepoCli(["--blocks", definition, join(repo, example)]))];
    why.push(...failed.filter((reason) => reason !== undefined));
  }
  const logPath = join(gitDir, GH_LOG);
  const calls = existsSync(logPath)
    ? readFileSync(logPath, "utf8").trimEnd().split("\n").filter((line) => line !== "").map((line) => JSON.parse(line))
    : [];
  const creates = calls.map((args, index) => ({ args, index })).filter(({ args }) => args[0] === "pr" && args[1] === "create");
  if (calls.some((args) => args[0] === "pr" && args[1] === "merge")) why.push("gh pr merge を呼んだ");
  const last = creates.at(-1);
  if (last === undefined) why.push("gh pr create を呼んでいない");
  const title = last === undefined ? undefined : optionValue(last.args, ["--title", "-t"]);
  if (last !== undefined) {
    const target = optionValue(last.args, ["--repo", "-R"]);
    if (target !== "cardene777/dragon") why.push(`gh pr create の宛先が cardene777/dragon でない: ${target ?? "なし"}`);
    if (!title?.startsWith("feat:")) why.push(`PR の題が feat: で始まらない: ${title ?? "なし"}`);
    const bodyPath = join(gitDir, `gh-pr-body-${last.index + 1}.md`);
    const body = existsSync(bodyPath) ? readFileSync(bodyPath, "utf8") : optionValue(last.args, ["--body", "-b"]) ?? "";
    if (!body.includes("pnpm verify")) why.push("PR の本文が pnpm verify に触れない");
  }
  return { why, note: `足した file [${added.join(", ")}] PR の題 ${title ?? "なし"}` };
}

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
// fork の代わりの写しの repo と偽の gh も、囲いの中から読めるプラグインの写しの中に置く (#3508)
const standIn = makeStandIn({ root: ROOT, dir: join(copy, "eval-stand-in") });

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
    "--scaffold",
    "--ablation",
    "none",
    "-j",
    "3",
    "--json",
    out,
  ],
  {
    stdio: "inherit",
    env: { ...process.env, PATH: `${dirname(wrapper)}:${standIn.bin}:${process.env.PATH ?? ""}` },
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
  const tags = tagsOf(evalCase.name);
  let passed = 0;
  runs.forEach((run, index) => {
    const base = dirname(dirname(run.tracePath));
    // 残した囲いの dir は持ち主しか開けない形で封じてあるので、読む前に開ける
    for (const dir of [base, join(base, "sealed")]) if (existsSync(dir)) chmodSync(dir, 0o700);
    const reply = existsSync(run.tracePath) ? lastReply(run.tracePath) : "";
    const judged = [
      ...(tags.includes("layout") ? [judgeLayout(base, reply)] : []),
      ...(tags.includes("pr") ? [judgePr(base, standIn.repo)] : []),
    ];
    const failedGraders = (run.graders ?? [])
      .filter((g) => !g.passed)
      .map((g) => `${g.name} (${g.explanation})`);
    const why = [...failedGraders, ...judged.flatMap((j) => j.why)];
    if (judged.length === 0) why.push(`確かめ方の印 (layout か pr) が無い: [${tags.join(", ")}]`);
    const ok = run.passed && why.length === 0;
    if (ok) passed++;
    const note = judged.map((j) => j.note).join(" / ");
    console.log(
      `${evalCase.name} run${index + 1}: ${ok ? "通った" : "落ちた"} ${note}${why.length > 0 ? ` 理由: ${why.join(" / ")}` : ""} 記録: ${run.tracePath}`,
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
