#!/usr/bin/env node
/**
 * 包んだ物を空の dir に入れ、使う人と同じ形で入口と型と命令を確かめる (#3023)。
 *
 * ## 使い方
 *
 * ```
 * pnpm --filter @cardenelabs/dragon check:pack
 * ```
 *
 * `prepublishOnly` が build の後に回すので、`npm publish` を打つと必ず回る。
 * 包んだ物を入れる時に依存を取りに行くため、**日常の検査 (`pnpm test`) には入れない**。
 *
 * ## 確かめること
 *
 * | 何を | 通す条件 |
 * |---|---|
 * | 入口 | `exports` の全ての入口を `import` と `require` で名前から解決できる。型を持つ入口は読み込めて中身を持つ |
 * | 型 | 型を持つ入口を `.mts` と `.cts` から import し、`tsc --module node16` の誤りが 0 件 |
 * | 命令 | 入れた `dragon` で見本を HTML に書き出し、file が出来る (HTML は Chromium を使わない) |
 *
 * 組の決め方と 0 件の扱いは `lib/pack-check.mjs` が持つ。
 */
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { 入口を導く, 型の確かめの中身, 型を持つ入口, 結果をまとめる } from "./lib/pack-check.mjs";

const pkgDir = join(dirname(fileURLToPath(import.meta.url)), "..");
const manifest = JSON.parse(readFileSync(join(pkgDir, "package.json"), "utf8"));
const sample = join(pkgDir, "examples/intro.dragon");
const tsc = createRequire(import.meta.url).resolve("typescript/bin/tsc");

// `npm publish` の中から回ると npm が `npm_config_dry_run` などを渡し、包む命令と入れる命令の動きが変わる。
// 手で打った時と同じに回すため、npm が渡す値を外す
const env = Object.fromEntries(Object.entries(process.env).filter(([name]) => !name.toLowerCase().startsWith("npm_")));

/** 命令を回し、落ちた時は stderr の最初の誤りの行を理由にする */
function run(command, args, cwd) {
  try {
    return { ok: true, out: execFileSync(command, args, { cwd, env, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }) };
  } catch (error) {
    const text = `${error.stdout ?? ""}\n${error.stderr ?? ""}`;
    const line = text.split("\n").find((l) => /error|Error|ERR_/.test(l)) ?? text.trim().split("\n").at(-1) ?? String(error);
    return { ok: false, out: text, reason: line.trim().slice(0, 200) };
  }
}

const work = mkdtempSync(join(tmpdir(), "dragon-check-pack-"));
let passed = false;
try {
  // 1. 包む
  const packed = run("npm", ["pack", "--json", "--dry-run=false", "--pack-destination", work, pkgDir], pkgDir);
  if (!packed.ok) throw new Error(`包めない: ${packed.reason}`);
  const [info] = JSON.parse(packed.out.slice(packed.out.indexOf("[")));
  console.log(`check:pack ${info.name}@${info.version} (${info.entryCount} files)`);

  // 2. 空の dir に入れる (任意の peer の playwright-core は入れない = 書き出しで撮らない人と同じ)
  const app = join(work, "app");
  mkdirSync(app);
  writeFileSync(join(app, "package.json"), `${JSON.stringify({ name: "check-pack", private: true }, null, 2)}\n`);
  const added = run("pnpm", ["add", "--ignore-workspace", "--dir", app, join(work, info.filename)], app);
  if (!added.ok) throw new Error(`入れられない: ${added.reason}`);

  // 3. 入口
  const typed = new Set(型を持つ入口(manifest));
  const results = 入口を導く(manifest).map(({ 名前, 入れ方 }) => {
    const spec = JSON.stringify(名前);
    const load = typed.has(名前);
    const args =
      入れ方 === "import"
        ? ["--input-type=module", "-e", load ? `const m = await import(${spec}); if (Object.keys(m).length === 0) throw new Error("中身が空");` : `import.meta.resolve(${spec});`]
        : ["-e", load ? `const m = require(${spec}); if (Object.keys(m).length === 0) throw new Error("中身が空");` : `require.resolve(${spec});`];
    const r = run(process.execPath, args, app);
    return { 何を: `${入れ方.padEnd(7)} ${名前}${load ? "" : " (解決だけ)"}`, 通った: r.ok, 理由: r.reason };
  });

  // 4. 型
  const names = [...typed];
  const sources = 型の確かめの中身(names);
  writeFileSync(join(app, "check.mts"), sources.mts);
  writeFileSync(join(app, "check.cts"), sources.cts);
  const typeRun = run(
    process.execPath,
    [tsc, "--noEmit", "--strict", "--skipLibCheck", "--module", "node16", "--moduleResolution", "node16", "check.mts", "check.cts"],
    app,
  );
  const typeErrors = (typeRun.out.match(/error TS\d+/g) ?? []).length;
  results.push({
    何を: `types   .mts / .cts (${names.length} 入口、誤り ${typeErrors} 件)`,
    通った: typeRun.ok && names.length > 0,
    理由: typeRun.ok ? (names.length === 0 ? "型を持つ入口が 0 件" : undefined) : typeRun.reason,
  });

  // 5. 命令
  const out = join(app, "out");
  const bin = join(app, "node_modules/.bin/dragon");
  const exported = run(bin, ["export", sample, "--format", "html", "--out", out], app);
  const html = join(out, "intro.html");
  results.push({
    何を: "command dragon export intro.dragon --format html",
    通った: exported.ok && existsSync(html),
    理由: exported.ok ? (existsSync(html) ? undefined : "intro.html が出来ていない") : exported.reason,
  });

  const summary = 結果をまとめる(results);
  for (const line of summary.文) console.log(line);
  passed = summary.通った;
} catch (error) {
  console.error(`check:pack: ${error instanceof Error ? error.message : String(error)}`);
} finally {
  rmSync(work, { recursive: true, force: true });
}
process.exitCode = passed ? 0 : 1;
