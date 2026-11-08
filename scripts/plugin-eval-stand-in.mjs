/**
 * プラグインの評価で、dragon の repo の fork の代わりに使う写しの repo と偽の `gh` を作る (#3508)。
 *
 * 評価の囲いは GitHub にも npm にも届かず、本物へ PR を出すと試しの PR が repo に積まれる。
 * そこで、共有のブロックを足して PR を出す手順に要る file だけを持つ小さな git の repo を作る。
 * 持つのは共有のブロック集 (`packages/dragon/blocks/`)、決まりの文書 (`CONTRIBUTING.md`)、PR の雛形、根の `package.json` で、
 * push の先は repo の `.git` の中の裸の repo にする。写しの repo を別の場所へ写しても、`.git` ごと動く。
 *
 * 偽の `gh` は GitHub へ通信せず、受けた引数を 1 回 1 行の JSON の配列で、呼んだ場所の repo の `.git/gh-calls.jsonl` に書く。
 * 偽の `gh` の隣には、評価の囲いの中でも動く本物の git の入口も置く。
 * `--body-file` で渡された本文も、消されても読めるよう `.git/gh-pr-body-<回>.md` に写す。
 * `gh pr create` には PR の URL を返し、ほかの命令には何も返さずに終わり方 0 で終わる。
 *
 *   import { makeStandIn } from "./plugin-eval-stand-in.mjs";
 *   const { repo, bin, ghLog } = makeStandIn({ root: process.cwd(), dir });
 */
import { spawnSync } from "node:child_process";
import { chmodSync, cpSync, mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

/** 写しの repo へ写す、repo の根からの path */
const COPIED = [
  "packages/dragon/blocks",
  "CONTRIBUTING.md",
  ".github/PULL_REQUEST_TEMPLATE.md",
  "package.json",
];
/** 偽の `gh` が受けた引数を書く file。呼んだ場所の repo の `.git` からの path */
export const GH_LOG = "gh-calls.jsonl";
/** 写しの repo の最初の commit に付ける印。足した file をこの印からの差で数える */
export const BASE_TAG = "stand-in-base";
/** 偽の `gh pr create` が返す PR の URL */
const PR_URL = "https://github.com/cardene777/dragon/pull/1";

/**
 * 偽の `gh` の中身。node は版を切り替える道具の shim を通さずに直に指す。
 * 書く先は、今の dir から上へ辿って最初に在る写しの repo の `.git` で、git は呼ばない (評価の囲いの中では git が動かないことがある)
 */
function fakeGh(fallback) {
  const record = [
    "const { appendFileSync, copyFileSync, existsSync, readFileSync } = require('node:fs');",
    "const { dirname, join } = require('node:path');",
    "const [fallback, ...args] = process.argv.slice(1);",
    "let dir = fallback;",
    `for (let at = process.cwd(); ; at = dirname(at)) { if (existsSync(join(at, '.git/refs/tags/${BASE_TAG}'))) { dir = join(at, '.git'); break; } if (dirname(at) === at) break; }`,
    "const log = join(dir, process.env.DRAGON_EVAL_GH_LOG_NAME);",
    "appendFileSync(log, JSON.stringify(args) + '\\n');",
    "const at = args.findIndex((a) => a === '--body-file' || a === '-F');",
    "const body = at >= 0 ? args[at + 1] : args.find((a) => a.startsWith('--body-file='))?.slice('--body-file='.length);",
    "const count = readFileSync(log, 'utf8').trimEnd().split('\\n').length;",
    "if (body !== undefined && existsSync(body)) copyFileSync(body, join(dir, 'gh-pr-body-' + count + '.md'));",
    `if (args[0] === 'pr' && args[1] === 'create') console.log(${JSON.stringify(PR_URL)});`,
  ].join(" ");
  return [
    "#!/bin/sh",
    "# 評価のための偽の gh (#3508)。GitHub へ通信せず、受けた引数を書き残す",
    `DRAGON_EVAL_GH_LOG_NAME=${GH_LOG} exec ${JSON.stringify(process.execPath)} -e ${shellQuote(record)} -- ${JSON.stringify(fallback)} "$@"`,
    "",
  ].join("\n");
}

/**
 * 本物の git の置き場。macOS の `/usr/bin/git` は開発の道具を探して開く入口で、評価の囲いの中では動かない。
 * そこで `xcrun --find git` が返す本体を指す。macOS でない時と見つからない時は PATH の git を使う
 */
function realGit() {
  if (process.platform === "darwin") {
    const found = spawnSync("xcrun", ["--find", "git"], { encoding: "utf8" });
    if (found.status === 0 && found.stdout.trim() !== "") return found.stdout.trim();
  }
  const found = spawnSync("sh", ["-c", "command -v git"], { encoding: "utf8" });
  return found.stdout.trim() || "git";
}

/** sh の 1 つの語として渡す形 */
const shellQuote = (text) => `'${text.replaceAll("'", `'\\''`)}'`;

/** 写しの repo で git を打つ。落ちたら止める */
function git(repo, args) {
  const ran = spawnSync("git", ["-C", repo, ...args], { encoding: "utf8" });
  if (ran.status !== 0) throw new Error(`git ${args.join(" ")} が落ちた: ${ran.stderr.trim()}`);
  return ran.stdout.trim();
}

/**
 * `dir` の下に、写しの repo (`repo`) と偽の `gh` を置いた dir (`bin`) を作る。
 * `ghLog` は写しの repo の中で偽の `gh` を呼んだ時に引数が残る file
 */
export function makeStandIn({ root, dir }) {
  const repo = join(dir, "repo");
  const bin = join(dir, "bin");
  mkdirSync(repo, { recursive: true });
  mkdirSync(bin, { recursive: true });
  for (const path of COPIED) cpSync(join(root, path), join(repo, path), { recursive: true });
  git(repo, ["init", "--quiet", "--initial-branch=main"]);
  git(repo, ["config", "user.name", "dragon eval"]);
  git(repo, ["config", "user.email", "eval@example.invalid"]);
  git(repo, ["add", "--all"]);
  git(repo, ["commit", "--quiet", "--message", "stand-in of the dragon repo"]);
  git(repo, ["tag", BASE_TAG]);
  // push の先は .git の中の裸の repo。repo の根で打つ push は相対の path で届き、写した先の下ごしらえは絶対の path に直す
  git(repo, ["init", "--quiet", "--bare", ".git/fork.git"]);
  git(repo, ["remote", "add", "origin", ".git/fork.git"]);
  git(repo, ["push", "--quiet", "origin", "main"]);
  const gh = join(bin, "gh");
  writeFileSync(gh, fakeGh(dir));
  chmodSync(gh, 0o755);
  // 評価の囲いの中でも動く git の入口。PATH の頭に置くと、囲いの中の git は本体を直に呼ぶ
  const gitEntry = join(bin, "git");
  writeFileSync(gitEntry, `#!/bin/sh\nexec ${JSON.stringify(realGit())} "$@"\n`);
  chmodSync(gitEntry, 0o755);
  return { repo, bin, ghLog: join(repo, ".git", GH_LOG) };
}
