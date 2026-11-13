#!/usr/bin/env node
/**
 * 変えた file に関係する検査だけを回す命令 (`pnpm test:related`、#3381)。
 *
 * 課題ごとに一式を回すと、関係しない検査を待つ時間が課題ごとに繰り返す。
 * 変えた file から、それを確かめる検査の file だけを選んで回す。
 *
 * 選ぶ規則は 4 つで、どれかに当たった検査の file を全て選ぶ。
 *
 * 1. 変えた file が検査の file なら、それ自身を選ぶ
 * 2. 検査の file から import でたどれる file を変えた時は、たどれる検査の file を選ぶ。
 *    package の名前 (`@cardenelabs/dragon`) で読む import は、表の `packages` が package の src の入口へ結ぶ
 * 3. 検査の file か、それが import でたどる file が、変えた file の path か名前を字で書いている時は、その検査の file を選ぶ。
 *    見本の原本を読む検査、命令を起こす検査、書き出しが読む字の file がこれに当たる
 * 4. 表の `runtime` は、字の形 (`pattern`) に当たる file から、build した物の元の src へ結ぶ (build した命令や頁を起こす検査)。
 *    表の `materials` は、どの file も字で書かない材料 (build の設定、頁の build が読む file) を、検査の file へ結ぶ
 *
 * どの規則にも当たらない file を変えた時は、検査を回さずにその file の名前を出して終わり方 1 で止まる。
 * 黙って回さずに通すと、確かめていない変更を確かめたと読めてしまう。
 * 検査が要らない file は、表の `materials` に `"tests": []` と理由を書いて名指す。
 *
 * 1 回の実行が上限 (5 分、`test-support/run-limit.ts`) で止まった時は、終わっていない file だけを次の実行で回し、全部が回るまで続ける (#3386)。
 * 機械が混むと、頁を開く検査の file を多く選んだ回が上限で止まり、残った file を人が回し直すことになったため。
 * 続きの実行で終わっていない file が減らなかった時は、そこで止める。止まらない検査を回し続けないため。
 *
 * 使い方
 *   node scripts/test-related.mjs [file ...]        file を渡さない時は、既定の枝から分かれた後の変更 (commit していない変更と、まだ追っていない file を含む)
 *   --list                                          選んだ検査の file を出すだけで、回さない
 *   --base <ref>                                    分かれた元の枝 (既定は origin/main、無ければ main)
 *   --root <dir>                                    repo の根 (既定はこの file の 1 つ上)
 *   --unmapped                                      repo の全ての file のうち、どの規則にも当たらない物を出す (表を直す時に使う)
 *   -- <vitest の引数>                               検査の命令に渡す
 */
import { execFileSync, spawnSync } from "node:child_process";
import { existsSync, mkdtempSync, readdirSync, readFileSync, rmSync, statSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, posix, relative } from "node:path";
import { fileURLToPath } from "node:url";

/** 読み飛ばす dir。組み立てた物と、写しと、作業の記録 */
const SKIP = new Set(["node_modules", "dist", "coverage", ".git", ".context", ".turbo", ".vite"]);
/** 読み飛ばす path の頭。Claude Code が作る作業場所の写し */
const SKIP_PREFIX = [".claude/worktrees/"];
const CODE = /\.(?:[cm]?[jt]sx?)$/u;
const RESOLVE_EXT = [".ts", ".tsx", ".mts", ".js", ".mjs", ".cjs", ".jsx", ".json", ".css"];

/** vitest の設定の `include` と `exclude` と同じ規則で、検査の file か */
export const isTest = (path) =>
  /\.test\.(?:tsx?|mjs)$/u.test(path) && !path.endsWith("/bench.test.ts") && (/^packages\/[^/]+\/(?:.+\/)?test\//u.test(path) || /^apps\/[^/]+\/src\//u.test(path));

function parseArgs(argv) {
  const o = { list: false, unmapped: false, base: undefined, root: join(dirname(fileURLToPath(import.meta.url)), ".."), files: [], pass: [] };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--") {
      o.pass = argv.slice(i + 1);
      break;
    }
    if (a === "--list") o.list = true;
    else if (a === "--unmapped") o.unmapped = true;
    else if (a === "--base") o.base = argv[++i];
    else if (a === "--root") o.root = argv[++i];
    else if (a.startsWith("--")) throw new Error(`知らない引数 ${a}`);
    else o.files.push(a);
  }
  return o;
}

/** repo の全ての file を、根からの path で返す */
function walk(root) {
  const out = [];
  const visit = (dir) => {
    for (const name of readdirSync(join(root, dir))) {
      if (SKIP.has(name)) continue;
      const path = dir === "" ? name : `${dir}/${name}`;
      if (SKIP_PREFIX.some((prefix) => `${path}/`.startsWith(prefix))) continue;
      const stat = statSync(join(root, path), { throwIfNoEntry: false });
      if (stat?.isDirectory()) visit(path);
      else if (stat?.isFile()) out.push(path);
    }
  };
  visit("");
  return out;
}

/** repo の file。git の中なら追っている file と、まだ追っていない file (無視する file を除く)。git の外なら dir を歩く */
function listFiles(root) {
  const ran = spawnSync("git", ["-C", root, "ls-files", "--cached", "--others", "--exclude-standard"], { encoding: "utf8" });
  if (ran.status !== 0) return walk(root);
  return ran.stdout.split("\n").filter((path) => path !== "" && !SKIP_PREFIX.some((prefix) => path.startsWith(prefix)) && existsSync(join(root, path)));
}

/** 注釈を外す。字の中の `//` (URL) は、直前が `:` か引用符の時に残す */
const stripComments = (text) => text.replace(/\/\*[\s\S]*?\*\//gu, "").replace(/(^|[^:"'`\\])\/\/[^\n]*/gu, "$1");

const IMPORTS = [
  /\b(?:import|export)\b[^"'`;]*?\bfrom\s*["']([^"']+)["']/gu,
  /\bimport\s*["']([^"']+)["']/gu,
  /\bimport\s*\(\s*["']([^"']+)["']\s*\)/gu,
  /\bnew\s+URL\(\s*["']([^"']+)["']\s*,\s*import\.meta\.url\s*\)/gu,
];
const LITERAL = /["'`]([^"'`\n]{1,300})["'`]/gu;
/** dir を歩く file の印。こう書く file は、dir の字が指す dir の下の code も読む */
const SCANS = /\breaddir(?:Sync)?\b|\bls-files\b|\bglobSync\b|\bopendir(?:Sync)?\b/u;

/** 表を読む。無ければ空の表 */
function readTable(root) {
  const path = join(root, "test-support/related-table.json");
  if (!existsSync(path)) return { packages: [], runtime: [], materials: [] };
  const table = JSON.parse(readFileSync(path, "utf8"));
  return { packages: table.packages ?? [], runtime: table.runtime ?? [], materials: table.materials ?? [] };
}

/** `*` (path の区切りを跨がない) と `**` (跨ぐ) の glob を正規表現にする */
function globRe(glob) {
  let re = "";
  for (let i = 0; i < glob.length; i++) {
    const c = glob[i];
    if (c === "*" && glob[i + 1] === "*") {
      re += glob[i + 2] === "/" ? "(?:.*/)?" : ".*";
      i += glob[i + 2] === "/" ? 2 : 1;
    } else if (c === "*") re += "[^/]*";
    else re += c.replace(/[.+?^${}()|[\]\\]/gu, "\\$&");
  }
  return new RegExp(`^${re}$`, "u");
}

/**
 * repo を読み、変えた file から検査の file を選べる形にする。
 * `extra` は変えた file のうち消えた物。消えた file への import と字も、在る物として結ぶ
 */
export function indexRepo(root, extra = []) {
  const table = readTable(root);
  const files = [...new Set([...listFiles(root), ...extra])];
  const fileSet = new Set(files);
  const dirSet = new Set();
  for (const path of files) for (let d = posix.dirname(path); d !== "."; d = posix.dirname(d)) dirSet.add(d);
  const byBase = new Map();
  for (const path of files) {
    const base = posix.basename(path);
    if (!byBase.has(base)) byBase.set(base, []);
    byBase.get(base).push(path);
  }
  const under = (dir) => files.filter((path) => path.startsWith(`${dir}/`));

  const packageEntries = new Map();
  for (const pkg of table.packages) packageEntries.set(pkg.name, pkg);

  /** import の指定を、repo の中の file の path にする。外の package は空 */
  const resolveImport = (from, spec) => {
    const bare = spec.split("?")[0] ?? spec;
    let base;
    if (bare.startsWith(".")) base = posix.normalize(posix.join(posix.dirname(from), bare));
    else if (bare.startsWith("@/")) base = posix.join("apps/playground-spa/src", bare.slice(2));
    else {
      const pkg = [...packageEntries.values()].find((p) => bare === p.name || bare.startsWith(`${p.name}/`));
      if (!pkg) return [];
      const sub = bare === pkg.name ? "." : `.${bare.slice(pkg.name.length)}`;
      const entry = pkg.entries[sub];
      // 表に無い入口は、package の全ての入口へ結ぶ (少なく選ぶより多く選ぶ)
      return (entry === undefined ? Object.values(pkg.entries) : [entry]).map((e) => posix.join(pkg.dir, e));
    }
    const candidates = [base, ...RESOLVE_EXT.map((ext) => base + ext), ...RESOLVE_EXT.map((ext) => `${base}/index${ext}`)];
    if (/\.[cm]?jsx?$/u.test(base)) candidates.push(...[".ts", ".tsx", ".mts"].map((ext) => base.replace(/\.[cm]?jsx?$/u, ext)));
    const found = candidates.find((c) => fileSet.has(c));
    return found ? [found] : [];
  };

  /**
   * 字が指す repo の中の file。根からの path と、書いた file からの相対と、同じ file の中の dir の字からの相対と、名前の 4 通りで読む。
   * dir を指す字は、その下の材料 (code でない file) を指す。dir を歩く file (`readdir` や `ls-files` を書く file) では、その下の code も指す。
   * 検査の file は、dir の字からは指さない。検査の file を読むのは、名前を字で書いた file だけ
   */
  const resolveLiteral = (from, literal, bases, scans) => {
    const text = literal.trim();
    if (text === "" || text.includes("${") || /^[a-z]+:/iu.test(text) || text.startsWith("/")) return [];
    const out = [];
    const tries = [posix.normalize(text.replace(/^\.\//u, "")), posix.normalize(posix.join(posix.dirname(from), text)), ...bases.map((base) => posix.normalize(posix.join(base, text)))];
    for (const candidate of tries) {
      if (candidate.startsWith("..") || candidate === ".") continue;
      if (fileSet.has(candidate)) out.push(candidate);
      else if (dirSet.has(candidate) && candidate.includes("/")) out.push(...under(candidate).filter((path) => !isTest(path) && (scans || !CODE.test(path))));
    }
    if (/^[\w@.-]+\.[A-Za-z0-9]+$/u.test(text)) out.push(...(byBase.get(text) ?? []));
    return out;
  };

  /** file から、その file が読む file への辺 */
  const edges = new Map();
  const add = (from, to) => {
    if (from === to) return;
    if (!edges.has(from)) edges.set(from, new Set());
    edges.get(from).add(to);
  };
  const runtime = table.runtime.map((rule) => ({ ...rule, re: new RegExp(rule.pattern, "u") }));
  const code = files.filter((path) => CODE.test(path) && existsSync(join(root, path)));
  for (const path of code) {
    const raw = readFileSync(join(root, path), "utf8");
    const text = stripComments(raw);
    for (const re of IMPORTS) for (const m of text.matchAll(re)) for (const to of resolveImport(path, m[1])) add(path, to);
    const literals = [...text.matchAll(LITERAL)].map((m) => m[1]);
    // 同じ file の中で dir を指す字。`join(app, "scripts/copy-404.mjs")` の 2 つ目の字は、1 つ目の dir からの相対で読む
    const bases = literals.map((l) => posix.normalize(l.trim().replace(/^\.\//u, ""))).filter((l) => dirSet.has(l) && l.includes("/"));
    const scans = SCANS.test(text);
    for (const literal of literals) for (const to of resolveLiteral(path, literal, bases, scans)) add(path, to);
    for (const rule of runtime) if (rule.re.test(text)) for (const to of rule.to) add(path, to);
  }

  /** file を読む検査の file。検査の file から辺をたどって届く file ごとに数える */
  const readers = new Map();
  for (const test of code.filter(isTest)) {
    const seen = new Set([test]);
    const stack = [test];
    while (stack.length > 0) {
      const at = stack.pop();
      for (const to of edges.get(at) ?? []) {
        if (seen.has(to)) continue;
        seen.add(to);
        // 名前を書いた別の検査の file は読むだけで走らせないので、その先はたどらない
        if (!isTest(to)) stack.push(to);
      }
    }
    for (const path of seen) {
      if (!readers.has(path)) readers.set(path, new Set());
      readers.get(path).add(test);
    }
  }
  const tests = code.filter(isTest);
  const materials = table.materials.map((m) => ({ ...m, res: m.files.map(globRe) }));
  return { files, tests, readers, materials, table, edges };
}

/**
 * 変えた file から検査の file を選ぶ。
 * どの規則にも当たらない file は `unmapped` に入る
 */
export function choose(index, changed) {
  const chosen = new Set();
  const unmapped = [];
  for (const path of changed) {
    let hit = false;
    if (isTest(path)) {
      // 消した検査の file は回せないので選ばないが、当たったとは数える
      if (index.tests.includes(path)) chosen.add(path);
      hit = true;
    }
    for (const test of index.readers.get(path) ?? []) {
      chosen.add(test);
      hit = true;
    }
    for (const material of index.materials) {
      if (!material.res.some((re) => re.test(path))) continue;
      hit = true;
      const targets = material.tests === "all" ? index.tests : material.tests.flatMap((t) => (isTest(t) ? [t] : [...(index.readers.get(t) ?? [])]));
      for (const test of targets) if (index.tests.includes(test)) chosen.add(test);
    }
    if (!hit) unmapped.push(path);
  }
  return { chosen: [...chosen].sort(), unmapped };
}

const git = (root, ...args) => execFileSync("git", ["-C", root, ...args], { encoding: "utf8" });

/** 既定の枝から分かれた後に変えた file。commit していない変更と、まだ追っていない file を含む */
export function branchChanges(root, base) {
  const refs = base ? [base] : ["origin/main", "main"];
  const ref = refs.find((r) => spawnSync("git", ["-C", root, "rev-parse", "--verify", "--quiet", `${r}^{commit}`]).status === 0);
  if (!ref) throw new Error(`分かれた元の枝が無い (${refs.join("、")})`);
  const fork = git(root, "merge-base", "HEAD", ref).trim();
  const changed = git(root, "diff", "--name-only", fork).split("\n");
  const untracked = git(root, "ls-files", "--others", "--exclude-standard").split("\n");
  return [...new Set([...changed, ...untracked].filter(Boolean))];
}

/**
 * 検査の file を回し、1 回の実行が上限で止まった時は、終わっていない file だけを次の実行で回して全部が回るまで続ける。
 * `run(files, out)` は 1 回の実行を回して終わり方を返す。止める段は `out` に、終わっていない file (`unfinished`) と、終わった file で落ちた検査 (`failed`) を JSON で書く。
 * 止まった実行で落ちた検査は、続きが全部通っても終わり方 1 にして最後に名前を出す。`say` は人に見せる文を受ける
 */
export function runUntilFinished(files, run, say) {
  const failed = [];
  const finish = (status) => {
    if (failed.length === 0) return status;
    say(`上限で止まった実行の中で落ちた検査 ${failed.length} 件:\n${failed.map((name) => `  ${name}\n`).join("")}`);
    return 1;
  };
  let left = files;
  for (;;) {
    const dir = mkdtempSync(join(tmpdir(), "dragon-unfinished-"));
    const out = join(dir, "unfinished.json");
    let status;
    let leftover;
    try {
      status = run(left, out) ?? 1;
      leftover = existsSync(out) ? JSON.parse(readFileSync(out, "utf8")) : undefined;
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
    // 止める段が書かなかった実行は、上限で止まらずに終わった
    if (leftover === undefined) return finish(status);
    failed.push(...leftover.failed);
    if (leftover.unfinished.length === 0) return finish(0);
    if (leftover.unfinished.length >= left.length) {
      say(`続きの実行でも終わっていない file が減らなかったので止める (#3386)。終わっていない file ${leftover.unfinished.length} 件:\n${leftover.unfinished.map((path) => `  ${path}\n`).join("")}`);
      return finish(1);
    }
    say(`1回の実行の上限で止まったので、終わっていない ${leftover.unfinished.length} file を次の実行で回す (#3386)\n${leftover.unfinished.map((path) => `  ${path}\n`).join("")}`);
    left = leftover.unfinished;
  }
}

function main() {
  const o = parseArgs(process.argv.slice(2));
  const root = o.root;
  if (o.unmapped) {
    const index = indexRepo(root);
    const { unmapped } = choose(index, index.files);
    process.stdout.write(`どの規則にも当たらない file ${unmapped.length} 件 (repo の file ${index.files.length} 件のうち)\n${unmapped.map((p) => `  ${p}\n`).join("")}`);
    process.exit(unmapped.length === 0 ? 0 : 1);
  }
  const changed = (o.files.length > 0 ? o.files : branchChanges(root, o.base)).map((p) => posix.normalize(relative(root, join(root, p)).split("\\").join("/")));
  const index = indexRepo(root, changed);
  const { chosen, unmapped } = choose(index, changed);
  if (unmapped.length > 0) {
    process.stderr.write(
      `表にも import にも当たらない file が ${unmapped.length} 件ある。検査を回さずに止める。\n${unmapped.map((p) => `  ${p}\n`).join("")}` +
        "検査が読むなら検査の file から import するか path を書き、読まないなら test-support/related-table.json の materials に理由と共に足す。\n",
    );
    process.exit(1);
  }
  process.stdout.write(`関係する検査 ${chosen.length} file\n${chosen.map((p) => `  ${p}\n`).join("")}`);
  if (o.list || chosen.length === 0) process.exit(0);
  const status = runUntilFinished(
    chosen,
    (files, out) => spawnSync("pnpm", ["exec", "vitest", "run", ...o.pass, ...files], { cwd: root, stdio: "inherit", env: { ...process.env, DRAGON_UNFINISHED_OUT: out } }).status,
    (text) => process.stderr.write(text),
  );
  process.exit(status);
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) main();
