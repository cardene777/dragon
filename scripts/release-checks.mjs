#!/usr/bin/env node
/**
 * 版を出す前と出した後の確かめ (#3589)。
 *
 * ikkan の配る前の関門 (`deployable.sh --since v<前の版>`) と配った後の関門 (`deployed.sh`) は、
 * `.ikkan/checks.md` の欄に書いた命令を回す。この file はそのうち 4 つの欄の命令を持つ。
 *
 * | 欄 | 命令 | 落とす時 |
 * |---|---|---|
 * | 配る先との整合 | `node scripts/release-checks.mjs target` | 包む版が npm の版の一覧か GitHub の印に既に在る |
 * | 配る前のセキュリティ | `node scripts/release-checks.mjs security` | 依存の脆弱性、前の版からの差分の秘密の値 (`gitleaks`)、包む物の `.env` や `.npmrc` や鍵 |
 * | 戻す確かめ | `node scripts/release-checks.mjs rollback` | 前の版が npm に無いか取り下げられている |
 * | 配った後の確かめ | `node scripts/release-checks.mjs after` | npm の最新、npm から入れた `dragon --version`、GitHub Pages の頁の応答のどれかが違う |
 *
 * 前の版は、包む版より小さい `v` の印のうち最も大きい版とする。関門は命令へ `--since` の値を渡さないため。
 *
 * 終わり方は 0 が通った、1 が落ちた、2 が問い合わせに失敗して判定していない。
 * 問い合わせの失敗を「落ちた」に数えないのは、npm か GitHub が止まっているだけの時に、版の中身を直しに行かないため。
 */
import { spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { setTimeout as wait } from "node:timers/promises";
import { fileURLToPath, pathToFileURL } from "node:url";

export const PACKAGE = "@cardenelabs/dragon";
/** 見本帳を配る先。`apps/playground-spa/vite.config.ts` の `base` と同じ所 */
export const PAGES_URL = "https://cardene777.github.io/dragon/";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const PACKAGE_DIR = join(ROOT, "packages/dragon");

/** `1.2.3` を数の組にする。版の形でない時は undefined */
const parse = (version) => /^(\d+)\.(\d+)\.(\d+)$/u.exec(version)?.slice(1).map(Number);
const compare = (a, b) => a[0] - b[0] || a[1] - b[1] || a[2] - b[2];

/**
 * 包む版より小さい `v` の印のうち最も大きい版。字の並びでなく版の数で比べる (`0.10.0` は `0.9.0` より大きい)
 *
 * @param {string[]} tags
 * @param {string} version
 * @returns {string | undefined}
 */
export function previousVersion(tags, version) {
  const current = parse(version);
  if (!current) return undefined;
  let best;
  for (const tag of tags) {
    const found = /^v(\d+\.\d+\.\d+)$/u.exec(tag.trim())?.[1];
    const parsed = found && parse(found);
    if (!parsed || compare(parsed, current) >= 0) continue;
    if (!best || compare(parsed, parse(best)) > 0) best = found;
  }
  return best;
}

/**
 * 配る先との整合。いくつもの会話が並んで版を出すため、取り込んでから出すまでに別の会話が同じ版を出していることがある (#3442)
 *
 * @param {{ version: string, published: string[], tagged: boolean }} input
 * @returns {string[]} 落とした理由
 */
export function judgeTarget({ version, published, tagged }) {
  const problems = [];
  if (published.includes(version))
    problems.push(
      `npm に ${PACKAGE}@${version} が既に在る。印と Release と npm への公開を打たず、docs/maintaining.md の手順で中身を突き合わせる`,
    );
  if (tagged)
    problems.push(
      `GitHub に印 v${version} が既に在る。印が取り込んだ commit を指すかを git ls-remote で確かめる`,
    );
  return problems;
}

/** 秘密の値を持ちうる file の名前 */
const SECRET_FILES = [
  /(^|\/)\.env(\.[^/]*)?$/u,
  /(^|\/)\.npmrc$/u,
  /\.(pem|key|p12|pfx)$/u,
  /(^|\/)id_(rsa|dsa|ecdsa|ed25519)$/u,
];

/**
 * 包む物の file の一覧から、秘密の値を持ちうる file を返す
 *
 * @param {string[]} files
 * @returns {string[]}
 */
export function secretFiles(files) {
  return files.filter((file) => SECRET_FILES.some((pattern) => pattern.test(file)));
}

/**
 * 配る前のセキュリティ。依存の脆弱性と、前の版からの差分の秘密の値と、包む物の file を見る
 *
 * @param {{ vulnerabilityExit: number, leakExit: number, packedFiles: string[] }} input
 * @returns {string[]} 落とした理由
 */
export function judgeSecurity({ vulnerabilityExit, leakExit, packedFiles }) {
  const problems = [];
  if (vulnerabilityExit !== 0)
    problems.push(
      `依存の脆弱性の確かめ (scripts/check-dependency-vulnerabilities.sh) が終わり方 ${vulnerabilityExit} で終わった`,
    );
  if (leakExit !== 0)
    problems.push(
      `gitleaks が前の版からの差分に秘密の値を見つけたか、走れなかった (終わり方 ${leakExit})`,
    );
  const secrets = secretFiles(packedFiles);
  if (secrets.length > 0)
    problems.push(`包む物に秘密の値を持ちうる file が在る (${secrets.join(", ")})`);
  return problems;
}

/**
 * 戻す確かめ。npm は出した版を同じ番号で出し直せないため、戻す時は前の版へ latest を付け替える
 *
 * @param {{ previous: string | undefined, info: { version?: string, tarball?: string, deprecated?: string } | undefined }} input
 * @returns {string[]} 落とした理由
 */
export function judgeRollback({ previous, info }) {
  if (previous === undefined) return ["包む版より小さい v の印が無く、戻す先の版が判らない"];
  if (info === undefined) return [`戻す先の ${PACKAGE}@${previous} が npm に無い`];
  const problems = [];
  if (!info.tarball)
    problems.push(`戻す先の ${PACKAGE}@${previous} に入れる file (dist.tarball) が無い`);
  if (info.deprecated)
    problems.push(`戻す先の ${PACKAGE}@${previous} は取り下げられている (${info.deprecated})`);
  return problems;
}

/**
 * 配った後の確かめ
 *
 * @param {{ version: string, latest: string, installedVersion: string, pagesStatus: number }} input
 * @returns {string[]} 落とした理由
 */
export function judgeAfter({ version, latest, installedVersion, pagesStatus }) {
  const problems = [];
  if (latest !== version)
    problems.push(`npm の最新 (latest) が ${latest || "空"} で、出した ${version} でない`);
  const answered = installedVersion.trim();
  if (answered !== version)
    problems.push(
      `npm から入れた dragon --version の答えが ${answered || "空"} で、${version} でない`,
    );
  if (pagesStatus !== 200)
    problems.push(`GitHub Pages の頁 (${PAGES_URL}) が ${pagesStatus} を返した`);
  return problems;
}

/** 問い合わせに失敗し、判定していない */
class Unchecked extends Error {}

// `npm publish` の中から回ると npm が `npm_config_dry_run` などを渡し、npm の命令の動きが変わる。手で打った時と同じに回すため外す
const env = Object.fromEntries(
  Object.entries(process.env).filter(([name]) => !name.toLowerCase().startsWith("npm_")),
);

function run(command, args, cwd = ROOT) {
  const ran = spawnSync(command, args, { cwd, env, encoding: "utf8" });
  if (ran.error) throw new Unchecked(`${command} を起こせない (${ran.error.message})`);
  return ran;
}

/** 命令を回し、出力をそのまま流して終わり方を返す */
function stream(command, args) {
  const ran = spawnSync(command, args, { cwd: ROOT, env, stdio: "inherit" });
  if (ran.error) throw new Unchecked(`${command} を起こせない (${ran.error.message})`);
  return ran.status ?? 1;
}

/** `npm view <args> --json` の答え。版か package が無い時は undefined */
function npmView(args) {
  const ran = run("npm", ["view", ...args, "--json"]);
  if (ran.status !== 0) {
    if (/E404/u.test(ran.stderr)) return undefined;
    throw new Unchecked(
      `npm view ${args.join(" ")} が終わり方 ${ran.status} で終わった (${ran.stderr.trim().split("\n").at(-1) ?? ""})`,
    );
  }
  return ran.stdout.trim() === "" ? undefined : JSON.parse(ran.stdout);
}

const packageVersion = () =>
  JSON.parse(readFileSync(join(PACKAGE_DIR, "package.json"), "utf8")).version;

function previousTag(version) {
  const tags = run("git", ["tag", "--list", "v*"]);
  if (tags.status !== 0) throw new Unchecked(`git tag が終わり方 ${tags.status} で終わった`);
  return previousVersion(tags.stdout.split("\n"), version);
}

const MODES = {
  target() {
    const version = packageVersion();
    const published = [npmView([PACKAGE, "versions"]) ?? []].flat();
    const tag = run("git", ["ls-remote", "--tags", "origin", `refs/tags/v${version}`]);
    if (tag.status !== 0) throw new Unchecked(`git ls-remote が終わり方 ${tag.status} で終わった`);
    console.log(`配る先との整合 ${PACKAGE}@${version} (npm の版 ${published.length} 件)`);
    return judgeTarget({ version, published, tagged: tag.stdout.trim() !== "" });
  },

  security() {
    const version = packageVersion();
    const previous = previousTag(version);
    if (previous === undefined)
      throw new Unchecked("包む版より小さい v の印が無く、秘密の値を探す差分の始まりが判らない");
    console.log(`配る前のセキュリティ ${PACKAGE}@${version} (差分 v${previous}..HEAD)`);
    const vulnerabilityExit = stream("bash", ["scripts/check-dependency-vulnerabilities.sh"]);
    const leakExit = stream("gitleaks", [
      "git",
      "--log-opts",
      `v${previous}..HEAD`,
      "--redact",
      "--no-banner",
      ROOT,
    ]);
    const packed = run("npm", ["pack", "--dry-run", "--json"], PACKAGE_DIR);
    if (packed.status !== 0)
      throw new Unchecked(`npm pack --dry-run が終わり方 ${packed.status} で終わった`);
    const [info] = JSON.parse(packed.stdout.slice(packed.stdout.indexOf("[")));
    const packedFiles = (info?.files ?? []).map((file) => file.path);
    if (packedFiles.length === 0)
      throw new Unchecked("npm pack --dry-run が包む file を 1 つも挙げない");
    console.log(`包む file ${packedFiles.length} 件`);
    return judgeSecurity({ vulnerabilityExit, leakExit, packedFiles });
  },

  rollback() {
    const previous = previousTag(packageVersion());
    const found =
      previous === undefined
        ? undefined
        : npmView([`${PACKAGE}@${previous}`, "version", "dist.tarball", "deprecated"]);
    const info =
      found === undefined
        ? undefined
        : { version: found.version, tarball: found["dist.tarball"], deprecated: found.deprecated };
    if (previous !== undefined)
      console.log(
        `戻す先 ${PACKAGE}@${previous}。戻す命令は npm dist-tag add ${PACKAGE}@${previous} latest`,
      );
    return judgeRollback({ previous, info });
  },

  async after() {
    const version = packageVersion();
    // 出した直後は npm の最新の答えが前の版のままのことがあるので、少し待って引き直す
    let latest = "";
    for (let tried = 0; tried < 6; tried += 1) {
      latest = String(npmView([PACKAGE, "dist-tags.latest"]) ?? "");
      if (latest === version) break;
      await wait(10_000);
    }
    const work = mkdtempSync(join(tmpdir(), "dragon-release-after-"));
    let installedVersion = "";
    try {
      writeFileSync(
        join(work, "package.json"),
        `${JSON.stringify({ name: "release-after", private: true }, null, 2)}\n`,
      );
      // 任意の peer の playwright-core は入れない = 書き出しで撮らない人と同じ
      const added = run(
        "npm",
        ["install", "--omit=peer", "--no-audit", "--no-fund", `${PACKAGE}@${version}`],
        work,
      );
      if (added.status !== 0)
        throw new Unchecked(
          `npm から ${PACKAGE}@${version} を入れられない (${added.stderr.trim().split("\n").at(-1) ?? ""})`,
        );
      const answered = run(join(work, "node_modules/.bin/dragon"), ["--version"], work);
      installedVersion = answered.status === 0 ? answered.stdout : "";
    } finally {
      rmSync(work, { recursive: true, force: true });
    }
    let pagesStatus;
    try {
      pagesStatus = (await globalThis.fetch(PAGES_URL, { redirect: "follow" })).status;
    } catch (error) {
      throw new Unchecked(
        `GitHub Pages の頁 (${PAGES_URL}) に繋がらない (${error instanceof Error ? error.message : String(error)})`,
      );
    }
    console.log(`配った後の確かめ ${PACKAGE}@${version} (npm の最新 ${latest}、頁 ${pagesStatus})`);
    return judgeAfter({ version, latest, installedVersion, pagesStatus });
  },
};

async function main(mode) {
  const check = MODES[mode];
  if (!check) {
    console.error(`使い方 node scripts/release-checks.mjs <${Object.keys(MODES).join(" | ")}>`);
    return 2;
  }
  try {
    const problems = await check();
    for (const problem of problems) console.error(`  NG  ${problem}`);
    if (problems.length === 0) console.log("  ok");
    return problems.length === 0 ? 0 : 1;
  } catch (error) {
    if (!(error instanceof Unchecked)) throw error;
    console.error(`判定していない: ${error.message}`);
    return 2;
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  process.exitCode = await main(process.argv[2]);
}
