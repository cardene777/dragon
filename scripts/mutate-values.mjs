/**
 * 値を 1 つずつ書き換えて、検査が落ちるかを確かめる (#3107)。
 *
 * ## 使い方
 *
 * ```
 * pnpm test:mutation:values <変異の一覧> <結果の file> [--wide]
 * ```
 *
 * 一覧の変異を 1 件ずつ、書き換える file の書き換え前の字を書き換え後の字に替えて、名指した検査を回す。
 * 回し終えたら file を HEAD の中身に戻し、落ちた検査の名前を結果の file へ 1 行ずつ足す (JSON Lines)。
 * どの検査も落ちなかった変異が、検査の穴になる。
 * `--wide` では変異の `names` を使わず、`tests` の file の検査を全部回す。
 * 名前で絞った回で落ちなかった変異が、本当にどの検査にも捕まらないかを見る時に使う。
 * 検査の前の build が落ちた変異と、検査が集計の行を出さずに終わった変異 (Ctrl-C で止めた時を含む) は、
 * 結果の `unfinished` に理由を残して止まり、終わり方は 1 になる。
 *
 * 変異の一覧は JSON の配列で書く。
 *
 * ```json
 * [
 *   {
 *     "id": "r1",
 *     "file": "apps/playground-spa/src/editor/fit.ts",
 *     "old": "export const ZOOM_RANGE = [0.25, 4] as const;",
 *     "new": "export const ZOOM_RANGE = [0.25, 8] as const;",
 *     "tests": ["apps/playground-spa/src/lib/playground.test.ts"],
 *     "names": "editor-zoom-stops-at-range|editor-stage-tools-change-view",
 *     "what": "拡大の上限 4 倍を 8 倍"
 *   }
 * ]
 * ```
 *
 * `old` は file の中で 1 か所に決まる字にする。無いか 2 か所以上ある変異は書き換えずに飛ばし、結果に理由を残す。
 * `names` は vitest の `-t` に渡す名前の正規表現で、`null` か省くと絞らない。
 * `what` は人が読む説明で、変異を回す時は読まず、表を作る時に壊した所へ写す。
 * `packages/dragon/src` の下を書き換える変異では、検査が `dist` を読むので、検査の前と戻した後に `pnpm build:packages` を回す。
 *
 * 戻す先は HEAD の中身なので、書き換える file に commit していない変更があると消える。
 * 変更を commit してから回す。
 *
 * ## 壊して測った結果の表を作る (#3130)
 *
 * ```
 * pnpm test:mutation:table <変異の一覧> <結果の file> --step <数>
 * ```
 *
 * 回し終えた結果の file から、ikkan の関門が読む `## 壊して測った結果 (step <数>)` の comment の本文を出す。
 * 一覧の順に 1 変異 1 行で、壊した所は変異の `id` と `what` と落ちた検査の名前、件数は落ちた検査の数になる。
 * 同じ変異を回し直した時は、結果の file の最後の行を使う。
 * どの検査も落ちなかった変異は件数 0 の行に、飛ばした変異と測れなかった変異と回していない変異は
 * 数字で始まらない件数の行になり、どちらも関門が断る。
 * 引数の形が違う時と、結果に一覧に無い変異の行が在る時は、表を出さず終わり方 2 で止まる。
 *
 * ## Stryker (`pnpm test:mutation`) では足りない理由
 *
 * Stryker は数の字を書き換える変異を持たない (`[0.25, 4]` を `[]` にはするが `[0.25, 8]` にはしない)。
 * また、変異を切り替える印を検査の process の中 (`globalThis.__stryker__` か `process.env`) にしか置かない。
 * 見本サイトと編集画面の検査は build した頁を画面なしの Chromium で開くので、頁の中の code は印を読めず、
 * 変異を当てても書き換える前の code のまま動く。
 * この道具は source そのものを書き換えるので、build した頁にも変異が入る。
 * #3099 から #3105 では、この道具で 36 の変異を当てた。
 */
import { spawnSync } from "node:child_process";
import { appendFileSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

/** 書き換えた後に描画の package を build し直す source の置き場 (検査は `dist` を読む) */
const PACKAGE_SOURCE = "packages/dragon/src/";
const FAILED = /^\s*×\s+.*>\s+(\S+)\s+\d+ms$/gm;
const MESSAGE = /AssertionError: (.+?)(?:: expected|$)/gm;

/** 命令を回し、終わり方と出力を返す。起こせなかった時は投げる */
function spawn(cmd, args, cwd) {
  const r = spawnSync(cmd, args, { cwd, encoding: "utf8", maxBuffer: 256 * 1024 * 1024 });
  if (r.error) throw r.error;
  return { status: r.status ?? 1, stdout: r.stdout ?? "", stderr: r.stderr ?? "" };
}

/** 変異の一覧の JSON を読む。1 件でも形が違えば、何件目のどの欄かを名指して投げる */
export function readMutants(text) {
  const list = JSON.parse(text);
  if (!Array.isArray(list)) throw new Error("変異の一覧が配列でない");
  list.forEach((m, i) => {
    const where = `変異の一覧の ${i + 1} 件目${typeof m?.id === "string" ? ` (${m.id})` : ""}`;
    for (const key of ["id", "file", "old", "new"]) {
      if (typeof m?.[key] !== "string") throw new Error(`${where} に "${key}" の字が無い`);
    }
    if (!Array.isArray(m.tests) || m.tests.some((t) => typeof t !== "string"))
      throw new Error(`${where} の "tests" が file の配列でない`);
    if (m.names !== undefined && m.names !== null && typeof m.names !== "string")
      throw new Error(`${where} の "names" が字でも null でもない`);
  });
  return list;
}

/** 書き換えた file を HEAD の中身に戻す */
function restore(root, path) {
  const r = spawnSync("git", ["-C", root, "show", `HEAD:${path}`], {
    maxBuffer: 256 * 1024 * 1024,
  });
  if (r.status !== 0) throw new Error(`${path} を HEAD の中身に戻せない: ${String(r.stderr)}`);
  writeFileSync(join(root, path), r.stdout);
}

/** 検査の出力から、落ちた検査の名前と、失敗の文と、集計の行を読む */
function readOutput(text) {
  return {
    summary: text
      .split("\n")
      .map((line) => line.trim())
      .find((line) => line.startsWith("Tests ")),
    failed: [...new Set([...text.matchAll(FAILED)].map((x) => x[1]))].sort(),
    messages: [...text.matchAll(MESSAGE)].map((x) => x[1]).slice(0, 3),
  };
}

/**
 * 変異を 1 件ずつ当てて検査を回し、結果の file に 1 行ずつ足して、足した行を返す。
 * `exec` は検査と build の命令を回す所で、検査では差し替える。戻しは `exec` を通さず git で行う。
 *
 * 検査の前の build が落ちた変異と、検査が集計の行を出さずに終わった変異 (途中で止めた時を含む) は、
 * 測れなかったとして `unfinished` に理由を残し、落ちた検査の名前を残さずに止まる。
 * 落ちた検査が無いと残すと、どの検査にも捕まらない変異と見分けられない。
 */
export function runMutants({ root, mutants, out, wide = false, exec = spawn, log = console.log }) {
  const rows = [];
  const record = (row) => {
    rows.push(row);
    appendFileSync(out, `${JSON.stringify(row)}\n`);
  };
  for (const m of mutants) {
    const source = readFileSync(join(root, m.file), "utf8");
    const count = source.split(m.old).length - 1;
    if (count !== 1) {
      const skipped = `書き換える所が 1 か所に決まらない (${count} か所)`;
      record({ id: m.id, skipped });
      log(`${m.id} ${skipped}`);
      continue;
    }
    const pkg = m.file.startsWith(PACKAGE_SOURCE);
    writeFileSync(
      join(root, m.file),
      source.replace(m.old, () => m.new),
    );
    let unfinished;
    let seen;
    try {
      const built = pkg ? exec("pnpm", ["build:packages"], root) : { status: 0 };
      if (built.status !== 0) {
        unfinished = `検査の前の build が終わらなかった (終わり方 ${built.status})`;
      } else {
        const names = wide || !m.names ? [] : ["-t", ` (${m.names})$`];
        const result = exec(
          "pnpm",
          ["exec", "vitest", "run", "--reporter=verbose", ...m.tests, ...names],
          root,
        );
        seen = readOutput(result.stdout + result.stderr);
        if (seen.summary === undefined)
          unfinished = `検査が集計の行を出さずに終わった (終わり方 ${result.status})`;
      }
    } finally {
      restore(root, m.file);
      if (pkg) exec("pnpm", ["build:packages"], root);
    }
    if (unfinished !== undefined) {
      record({ id: m.id, wide, unfinished });
      log(`${m.id} ${unfinished}。ここで止める`);
      break;
    }
    record({ id: m.id, wide, summary: seen.summary, failed: seen.failed, messages: seen.messages });
    log(`${m.id} ${seen.summary} 落ちた ${seen.failed.join(", ") || "無し"}`);
  }
  return rows;
}

/** 表の欄の字。逃がしていない縦線は列の区切りに、改行は表の終わりに読まれる */
const cell = (text) => text.replace(/\r?\n/g, " ").replaceAll("|", "\\|");

/**
 * 変異の一覧と結果の行から、ikkan の関門が読む壊して測った結果の comment の本文を作る (#3130)。
 * 一覧の順に 1 変異 1 行で、同じ変異の行が 2 つ以上在る時は最後の行を使う。
 *
 * 件数は落ちた検査の数で、どの検査も落ちなかった変異は 0 になる。
 * 検査を回した変異は、壊した所の括弧の最後に、名前で絞った回か全部の検査で回した回かを書く。
 * 飛ばした変異と測れなかった変異と結果に行の無い変異は、数字で始まらない件数にして表に残す。
 * 表から消すと、関門は残った行だけを見て通してしまう。
 * 結果に一覧に無い変異の行が在る時は、別の一覧の結果を渡したとして投げる。
 */
export function mutationTable({ mutants, rows, step }) {
  const ids = new Set(mutants.map((m) => m.id));
  const last = new Map();
  for (const row of rows) {
    if (!ids.has(row.id)) throw new Error(`結果に一覧に無い変異の行が在る (${row.id})`);
    last.set(row.id, row);
  }
  const lines = mutants.map((m) => {
    const row = last.get(m.id);
    const failed = Array.isArray(row?.failed) ? row.failed : [];
    // 回した行だけが wide を持つ。名前で絞って 0 の変異はほかの検査が捕まえている見込みが残り、
    // 全部の検査で 0 の変異は検査の穴そのものなので、どちらの回の件数かを残す (#3134)
    const run =
      typeof row?.wide !== "boolean"
        ? undefined
        : row.wide || !m.names
          ? "全部の検査で回した回"
          : "名前で絞った回";
    const notes = [failed.length > 0 ? `落ちた検査 ${failed.join("、")}` : undefined, run].filter(
      (note) => note !== undefined,
    );
    const place = [`\`${m.id}\``, m.what, notes.length > 0 ? `(${notes.join("、")})` : undefined]
      .filter((part) => typeof part === "string" && part !== "")
      .join(" ");
    let count;
    if (row === undefined) count = "回していない";
    else if (row.skipped !== undefined) count = `飛ばした、${row.skipped}`;
    else if (row.unfinished !== undefined) count = `測れなかった、${row.unfinished}`;
    // 落ちた検査の名前を持たない行を 0 と書くと、どの検査にも捕まらない変異と見分けられない
    else if (!Array.isArray(row.failed)) count = "結果の行が読めない";
    else count = String(failed.length);
    return `| ${cell(place)} | ${cell(count)} |`;
  });
  return [
    `## 壊して測った結果 (step ${step})`,
    "",
    "| 壊した所 | 落ちた判定の件数 |",
    "|---|---|",
    ...lines,
  ].join("\n");
}

/** 表を作る呼び方の引数を読む。形が違えば理由を返す */
function readTableArgs(argv) {
  const files = [];
  let step;
  for (let i = 0; i < argv.length; i += 1) {
    if (argv[i] === "--step") {
      i += 1;
      step = argv[i];
    } else if (argv[i].startsWith("--")) return { error: `知らない札 ${argv[i]} が在る` };
    else files.push(argv[i]);
  }
  if (files.length !== 2) return { error: `file が 2 つでない (${files.length} 個)` };
  if (step === undefined || !/^[1-9][0-9]*$/.test(step))
    return { error: "--step の後に 1 以上の数が無い" };
  return { files, step: Number(step) };
}

function tableMain(argv) {
  const args = readTableArgs(argv);
  if (args.error !== undefined) {
    console.error(
      `${args.error}\n使い方: pnpm test:mutation:table <変異の一覧> <結果の file> --step <数>`,
    );
    process.exitCode = 2;
    return;
  }
  const from = process.env.INIT_CWD ?? process.cwd();
  const [list, out] = args.files.map((f) => resolve(from, f));
  let text;
  try {
    const rows = readFileSync(out, "utf8")
      .split("\n")
      .filter((line) => line.trim() !== "")
      .map((line) => JSON.parse(line));
    text = mutationTable({
      mutants: readMutants(readFileSync(list, "utf8")),
      rows,
      step: args.step,
    });
  } catch (e) {
    console.error(e instanceof Error ? e.message : String(e));
    process.exitCode = 2;
    return;
  }
  process.stdout.write(`${text}\n`);
}

function main(argv) {
  if (argv.includes("--table")) {
    tableMain(argv.filter((a) => a !== "--table"));
    return;
  }
  const files = argv.filter((a) => !a.startsWith("--"));
  if (files.length !== 2) {
    console.error("使い方: pnpm test:mutation:values <変異の一覧> <結果の file> [--wide]");
    process.exitCode = 2;
    return;
  }
  // pnpm は repo の root で回すので、渡された path は呼んだ場所 (`INIT_CWD`) から解く
  const from = process.env.INIT_CWD ?? process.cwd();
  const [list, out] = files.map((f) => resolve(from, f));
  const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
  // 止める合図 (Ctrl-C) を受け取る所を持たないと、Node は検査の命令の途中でそのまま落ち、書き換えた file が残る。
  // 受け取る所を持つと、合図で止まった検査の命令が返ってから file を戻し、測れなかった変異として止まる
  process.on("SIGINT", () => undefined);
  const rows = runMutants({
    root,
    mutants: readMutants(readFileSync(list, "utf8")),
    out,
    wide: argv.includes("--wide"),
  });
  if (rows.some((row) => row.unfinished !== undefined)) process.exitCode = 1;
  const dirty = spawn("git", ["status", "--porcelain"], root).stdout;
  console.log(`戻した後の差分: ${dirty || "なし"}`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href)
  main(process.argv.slice(2));
