/**
 * 評価でAIが描いた図を、ケースごと・実行ごとに1枚のHTMLの頁に並べる (#3519)。
 *
 * 評価 (`plugin-eval-record.mjs`) はAIが手順を踏んだかを確かめるが、描いた図の見た目は確かめない。
 * 本人が見た目の良し悪しを自分の目で決められるよう、各実行で保存した`.dragon`ごとに、最後の段と、
 * `dragon check --layout`が崩れを知らせた段をPNGに書き出して並べる。崩れの無い途中の段は並べない (頁が長くなり、実行どうしを見比べにくい)。
 * 頁はPNGをdata URIで埋め込んだ1つのfileで、ほかのfileも外の通信も読まないので、そのままArtifactとして公開できる。
 * 書き出したPNGは、頁の隣の`<頁の名前>-png/`にも残る。
 *
 * 評価の囲いの中ではChromiumが起きないので、書き出しは評価が終わった後に囲いの外で回す。
 * 残した実行のdir (`sealed`を持つ) から頁を作り直す時は、次のように呼ぶ。
 *
 *   import { cliTools, writeGallery } from "./scripts/plugin-eval-gallery.mjs";
 *   const page = await writeGallery({
 *     cases: [{ name: "new-kind-issue", runs: [{ dir: "/private/tmp/e-jIzsm7" }] }],
 *     page: ".context/scratch/gallery.html",
 *     tools: cliTools("packages/dragon/dist/cli.cjs"),
 *   });
 */
import { execFile } from "node:child_process";
import { createHash } from "node:crypto";
import {
  existsSync,
  globSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  renameSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { basename, dirname, extname, join, resolve } from "node:path";
import { pathToFileURL } from "node:url";

/** 一度に回す道具の数。書き出しは1枚ごとにChromiumを起こすので、並べすぎると混んだ機械が詰まる */
const JOBS = 3;

/** `node <args>` を回し、終わり方と出力を返す。終わり方0以外でも投げない */
function runNode(args) {
  return new Promise((done) => {
    execFile(
      process.execPath,
      args,
      { encoding: "utf8", maxBuffer: 64 * 1024 * 1024 },
      (error, stdout, stderr) => {
        done({
          code: error === null ? 0 : (error.code ?? "?"),
          stdout,
          stderr: stderr || (error?.message ?? ""),
        });
      },
    );
  });
}

/** 記法を読んで段の数を出す。読めない図は空の行を出す */
const COUNT_STEPS = [
  'import { readFileSync } from "node:fs";',
  "const [entry, file] = process.argv.slice(1);",
  "const { parseNotation } = await import(entry);",
  'const read = parseNotation(readFileSync(file, "utf8"));',
  'console.log(read.ok ? read.diagram.steps.length : "");',
].join("\n");

/**
 * このrepoで組み立てたCLI (`dist/cli.cjs`) を使う道具。
 * 崩れは評価の判定と同じ`dragon check --layout --json --lang ja`で数え、絵も同じ`--lang ja`で書き出す (崩れの段と絵の字を揃える)。
 * 段の数は、CLIの隣の入口 (`dist/index.js`) の`parseNotation`で記法を読んで数える。
 * 入口は別のprocessで読む。vitestの中で読むと大きな入口を変換するのに数秒かかり、1件10秒の上限に近づいたため
 */
export function cliTools(cli) {
  const entry = pathToFileURL(resolve(dirname(cli), "index.js")).href;
  return {
    async breaks(file) {
      const ran = await runNode([cli, "check", file, "--layout", "--json", "--lang", "ja"]);
      // 終わり方1は記法の誤りで、誤りもJSONで出る
      if (ran.code === 0 || ran.code === 1) {
        try {
          return { problems: JSON.parse(ran.stdout || "[]") };
        } catch {
          // JSONで読めない時は、下で理由を返す
        }
      }
      return {
        error: `dragon check --layout の終わり方 ${ran.code}: ${(ran.stderr || ran.stdout).trim()}`,
      };
    },
    async steps(file) {
      const ran = await runNode(["--input-type=module", "-e", COUNT_STEPS, entry, file]);
      const count = Number(ran.stdout.trim());
      return ran.code === 0 && ran.stdout.trim() !== "" && Number.isInteger(count)
        ? count
        : undefined;
    },
    async png(file, step, dest) {
      // 書き出しは段を選んでも`<図の名前>.png`を書くので、段ごとに別のdirへ書いてから移す
      const out = mkdtempSync(join(dirname(dest), ".export-"));
      try {
        const ran = await runNode([
          cli,
          "export",
          file,
          "--format",
          "png",
          "--lang",
          "ja",
          ...(step === undefined ? [] : ["--step", String(step)]),
          "--out",
          out,
        ]);
        const made = join(out, `${basename(file, extname(file))}.png`);
        if (ran.code !== 0 || !existsSync(made))
          return {
            error: `dragon export の終わり方 ${ran.code}: ${(ran.stderr || ran.stdout).trim()}`,
          };
        renameSync(made, dest);
        return {};
      } finally {
        rmSync(out, { recursive: true, force: true });
      }
    },
  };
}

/** `dir`の下の`.dragon`を、`dir`からのpathの順に */
const dragonFiles = (dir) => globSync("**/*.dragon", { cwd: dir }).sort();
const digest = (bytes) => createHash("sha256").update(bytes).digest("hex");

/** ブロックの定義だけのfileか。注釈と空の行の後の最初の行が`blocks <版>` (`dragon check`と同じ見分け方) */
function isDefinitions(text) {
  const first = text
    .split("\n")
    .map((line) => line.trim())
    .find((line) => line !== "" && !line.startsWith("//"));
  return first !== undefined && /^blocks\s+\d+$/u.test(first);
}

/** 道具の失敗を、投げずに理由の文で返す */
async function settle(call) {
  try {
    return await call();
  } catch (error) {
    return { error: error instanceof Error ? error.message : String(error) };
  }
}

/** `tasks`を`JOBS`個ずつ並べて回す */
async function runAll(tasks) {
  let next = 0;
  const worker = async () => {
    while (next < tasks.length) await tasks[next++]();
  };
  await Promise.all(Array.from({ length: Math.min(JOBS, tasks.length) }, worker));
}

/**
 * ケースごとに実行の図を並べた頁を`page`に書き、`page`を返す。
 *
 * - `cases` は `{ name, runs: [{ dir, passed?, why? }] }` の並び。`dir` は評価が残した実行のdirで、AIの作業場所を`sealed`の下に持つ
 * - `tools` は崩れを数える`breaks`、段の数を読む`steps`、1つの段をPNGに書く`png`の3つ (`cliTools`)
 * - `known` は実行の前から作業場所に在った`.dragon`の置き場 (写しのrepo)。同じ中身のfileはAIが保存した図に数えない
 *
 * ブロックの定義だけのfileも図でないので並べない。書き出しか検査が失敗した図は、その図の欄に理由を書く。
 */
export async function writeGallery({ cases, page, tools, known = [] }) {
  const pngDir = join(dirname(page), `${basename(page, extname(page))}-png`);
  rmSync(pngDir, { recursive: true, force: true });
  const laid = aiDiagrams(cases, known);
  const diagrams = laid.flatMap((evalCase) =>
    evalCase.runs.flatMap((run) =>
      run.diagrams.map((diagram, at) => ({ evalCase, run, diagram, at })),
    ),
  );
  return drawGallery({ laid, diagrams, page, pngDir, tools });
}

/**
 * ケースごとに、AI が保存した図の数と、崩れの残る図の数と、崩れを数えられなかった図の数を返す (#3546)。
 *
 * 数える図は頁に並べる図と同じで (`known` の写しの repo に前から在った図と、ブロックの定義だけの file は数えない)、PNG は書き出さない。
 * 崩れが何件あっても 1 枚と数える。検査が失敗した図と、記法の誤り (`error`) を持つ図は崩れを測れないので、
 * 崩れ 0 件の図ではなく `unchecked` に数える。
 */
export async function countBreaks({ cases, tools, known = [] }) {
  const laid = aiDiagrams(cases, known);
  const counts = Object.fromEntries(
    laid.map((evalCase) => [evalCase.name, { diagrams: 0, broken: 0, unchecked: 0 }]),
  );
  await runAll(
    laid.flatMap((evalCase) =>
      evalCase.runs.flatMap((run) =>
        run.diagrams.map((diagram) => async () => {
          const found = await settle(() => tools.breaks(diagram.path));
          const problems = found.problems ?? [];
          const count = counts[evalCase.name];
          count.diagrams += 1;
          const measured =
            found.error === undefined &&
            !problems.some(
              (problem) => problem.layout === undefined && problem.severity === "error",
            );
          if (!measured) count.unchecked += 1;
          else if (problems.some((problem) => problem.layout !== undefined)) count.broken += 1;
        }),
      ),
    ),
  );
  return counts;
}

/** ケースごとに、各実行で AI が保存した図を並べる。前から在った図とブロックの定義だけの file は外す */
function aiDiagrams(cases, known) {
  const prepared = new Set(
    known.flatMap((dir) => dragonFiles(dir).map((file) => digest(readFileSync(join(dir, file))))),
  );
  return cases.map((evalCase) => ({
    name: evalCase.name,
    runs: evalCase.runs.map((run, index) => {
      const sealed = join(run.dir, "sealed");
      const files = existsSync(sealed)
        ? dragonFiles(sealed).filter((file) => {
            const bytes = readFileSync(join(sealed, file));
            return !prepared.has(digest(bytes)) && !isDefinitions(bytes.toString("utf8"));
          })
        : [];
      return {
        ...run,
        number: index + 1,
        present: existsSync(run.dir),
        diagrams: files.map((file) => ({ file, path: join(sealed, file) })),
      };
    }),
  }));
}

/** 図ごとに崩れと段の数を読み、絵にする段を書き出して、頁を`page`に書く */
async function drawGallery({ laid, diagrams, page, pngDir, tools }) {
  // 崩れと段の数を読み、絵にする段を決める
  await runAll(
    diagrams.map(({ diagram }) => async () => {
      const found = await settle(() => tools.breaks(diagram.path));
      const steps = await settle(() => tools.steps(diagram.path));
      const problems = found.problems ?? [];
      diagram.checkError = found.error;
      diagram.breaks = problems.filter((problem) => problem.layout !== undefined);
      diagram.errors = problems.filter(
        (problem) => problem.layout === undefined && problem.severity === "error",
      );
      diagram.last = typeof steps === "number" ? steps : undefined;
      diagram.breakSteps = [...new Set(diagram.breaks.map((problem) => problem.layout.step))].sort(
        (a, b) => a - b,
      );
      diagram.shots = [
        { step: diagram.last, last: true },
        ...diagram.breakSteps
          .filter((step) => step !== diagram.last)
          .map((step) => ({ step, last: false })),
      ];
    }),
  );
  // 決めた段を書き出す
  const shots = diagrams.flatMap(({ evalCase, run, diagram, at }) =>
    diagram.shots.map((shot) => ({
      diagram,
      shot,
      dest: join(
        pngDir,
        evalCase.name,
        `run${run.number}`,
        `${at + 1}-step${shot.step ?? "last"}.png`,
      ),
    })),
  );
  await runAll(
    shots.map(({ diagram, shot, dest }) => async () => {
      mkdirSync(dirname(dest), { recursive: true });
      const made = await settle(() => tools.png(diagram.path, shot.step, dest));
      if (made.error === undefined && existsSync(dest))
        shot.src = `data:image/png;base64,${readFileSync(dest).toString("base64")}`;
      else shot.error = made.error ?? "PNGが書かれなかった";
    }),
  );
  mkdirSync(dirname(page), { recursive: true });
  writeFileSync(page, html(laid));
  return page;
}

const escape = (text) =>
  String(text).replace(
    /[&<>"']/gu,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c],
  );
const stepName = (step) => (step === undefined ? "最後の段" : `段${step}`);

/** 1つの段の絵。崩れの段は、その段の崩れの文を添える */
function shotHtml(diagram, shot) {
  const messages = diagram.breaks
    .filter((problem) => problem.layout.step === shot.step)
    .map((problem) => problem.message);
  const label = `${stepName(shot.step)}${shot.last && shot.step !== undefined ? " (最後の段)" : ""}${messages.length > 0 ? `・崩れ${messages.length}件` : ""}`;
  const picture = shot.src
    ? `<img src="${shot.src}" alt="${escape(`${basename(diagram.file)}の${stepName(shot.step)}`)}" loading="lazy">`
    : `<p class="fail">書き出せない: ${escape(shot.error)}</p>`;
  return [
    `<figure class="shot${shot.last ? " last" : ""}"${shot.step === undefined ? "" : ` data-step="${shot.step}"`}${shot.last ? " data-last" : ""}>`,
    picture,
    `<figcaption>${escape(label)}</figcaption>`,
    messages.length > 0
      ? `<ul class="msgs">${messages.map((message) => `<li>${escape(message)}</li>`).join("")}</ul>`
      : "",
    "</figure>",
  ].join("");
}

function diagramHtml(diagram) {
  const count = diagram.breaks.length;
  const where = diagram.breakSteps.map((step) => `段${step}`).join("、");
  const failures = [
    ...(diagram.checkError === undefined ? [] : [`崩れを数えられない: ${diagram.checkError}`]),
    ...diagram.errors.map((problem) => `記法の誤り: ${problem.message}`),
  ];
  const [first, ...rest] = diagram.shots;
  return [
    `<div class="diagram" data-file="${escape(diagram.file)}" data-breaks="${count}" data-break-steps="${diagram.breakSteps.join(",")}">`,
    `<p class="file"><code>${escape(diagram.file)}</code></p>`,
    `<p class="count ${count > 0 ? "warn" : "calm"}">崩れ${count}件${count > 0 ? ` (${where})` : ""}</p>`,
    failures.length > 0
      ? `<ul class="errors">${failures.map((text) => `<li>${escape(text)}</li>`).join("")}</ul>`
      : "",
    shotHtml(diagram, first),
    rest.length > 0
      ? `<div class="break-shots">${rest.map((shot) => shotHtml(diagram, shot)).join("")}</div>`
      : "",
    "</div>",
  ].join("");
}

function runHtml(run) {
  const verdict =
    run.passed === undefined
      ? ""
      : `<span class="badge ${run.passed ? "ok" : "ng"}">${run.passed ? "通った" : "落ちた"}</span>`;
  const why =
    (run.why ?? []).length > 0
      ? `<ul class="why">${run.why.map((text) => `<li>${escape(text)}</li>`).join("")}</ul>`
      : "";
  const body = !run.present
    ? `<p class="empty">実行のdirが無い</p>`
    : run.diagrams.length === 0
      ? `<p class="empty">保存した<code>.dragon</code>が無い</p>`
      : run.diagrams.map(diagramHtml).join("");
  return [
    `<article class="run" data-run="${run.number}"${run.passed === undefined ? "" : ` data-passed="${run.passed}"`}>`,
    `<header class="run-head"><h3>実行${run.number}</h3>${verdict}</header>`,
    `<p class="path"><code>${escape(run.dir)}</code></p>`,
    why,
    body,
    "</article>",
  ].join("");
}

/** 図の数と、崩れの残る図の数 */
function tally(runs) {
  const diagrams = runs.flatMap((run) => run.diagrams);
  return {
    runs: runs.length,
    passed: runs.filter((run) => run.passed === true).length,
    diagrams: diagrams.length,
    broken: diagrams.filter((d) => d.breaks.length > 0).length,
  };
}

function caseHtml(evalCase) {
  const t = tally(evalCase.runs);
  const passed = evalCase.runs.some((run) => run.passed !== undefined)
    ? ` (通った${t.passed}件)`
    : "";
  return [
    `<section class="case" data-case="${escape(evalCase.name)}" id="case-${escape(evalCase.name)}">`,
    `<h2>${escape(evalCase.name)}</h2>`,
    `<p class="summary">実行${t.runs}件${passed}、図${t.diagrams}件、崩れの残る図${t.broken}件</p>`,
    `<div class="runs">${evalCase.runs.map(runHtml).join("")}</div>`,
    "</section>",
  ].join("");
}

const LIGHT =
  "--bg: #f6f5f1; --panel: #ffffff; --ink: #1f1e1b; --muted: #66635b; --line: #e0ddd3; --code: #efede6; --ok: #1d6e40; --ok-bg: #e2f2e8; --ng: #a8261b; --ng-bg: #fbe8e5; --warn: #8a4f00; --warn-bg: #fcefdc;";
const DARK =
  "--bg: #151513; --panel: #1f1e1b; --ink: #ecebe6; --muted: #a5a299; --line: #36342e; --code: #2a2925; --ok: #7fd6a2; --ok-bg: #17352a; --ng: #f2a197; --ng-bg: #3d1d19; --warn: #f1b866; --warn-bg: #3a2a12;";

const CSS = `
:root { color-scheme: light; ${LIGHT} }
@media (prefers-color-scheme: dark) {
  :root:not([data-theme="light"]) { color-scheme: dark; ${DARK} }
}
:root[data-theme="dark"] { color-scheme: dark; ${DARK} }
*, *::before, *::after { box-sizing: border-box; }
body { margin: 0; background: var(--bg); color: var(--ink); font: 15px/1.6 system-ui, -apple-system, "Hiragino Sans", "Noto Sans JP", sans-serif; }
main { max-width: 1320px; margin: 0 auto; padding: 24px 16px 64px; }
h1 { font-size: 1.45rem; line-height: 1.3; margin: 0 0 8px; }
h2 { font-size: 1.2rem; margin: 0 0 4px; }
h3 { font-size: 1rem; margin: 0; }
p { margin: 0 0 8px; }
code { font: 0.85em/1.4 ui-monospace, SFMono-Regular, Menlo, monospace; background: var(--code); border-radius: 4px; padding: 1px 4px; }
img { display: block; max-width: 100%; height: auto; }
.lead, .summary { color: var(--muted); }
.toc { display: flex; flex-wrap: wrap; gap: 8px; margin: 16px 0 24px; padding: 0; list-style: none; }
.toc a { display: inline-block; padding: 4px 10px; border: 1px solid var(--line); border-radius: 999px; color: var(--ink); background: var(--panel); text-decoration: none; }
.case { margin: 0 0 40px; }
.runs { display: grid; grid-template-columns: repeat(auto-fill, minmax(min(100%, 380px), 1fr)); gap: 16px; align-items: start; margin-top: 12px; }
.run { min-width: 0; overflow-wrap: anywhere; background: var(--panel); border: 1px solid var(--line); border-radius: 10px; padding: 14px; }
.run-head { display: flex; align-items: center; justify-content: space-between; gap: 8px; margin-bottom: 4px; }
.path { font-size: 0.8rem; color: var(--muted); }
.badge { font-size: 0.8rem; font-weight: 600; padding: 2px 10px; border-radius: 999px; white-space: nowrap; }
.badge.ok { color: var(--ok); background: var(--ok-bg); }
.badge.ng { color: var(--ng); background: var(--ng-bg); }
.why, .errors, .msgs { margin: 0 0 8px; padding-left: 1.2em; font-size: 0.85rem; }
.why, .errors { color: var(--ng); }
.diagram { border-top: 1px solid var(--line); padding-top: 10px; margin-top: 10px; }
.count { display: inline-block; font-size: 0.85rem; font-weight: 600; padding: 1px 8px; border-radius: 6px; }
.count.warn { color: var(--warn); background: var(--warn-bg); }
.count.calm { color: var(--ok); background: var(--ok-bg); }
.shot { margin: 0 0 10px; min-width: 0; }
.shot img { width: 100%; background: #ffffff; border: 1px solid var(--line); border-radius: 6px; cursor: zoom-in; }
.shot figcaption { font-size: 0.8rem; color: var(--muted); margin-top: 4px; }
.shot .msgs { color: var(--warn); margin-top: 2px; }
.break-shots { display: grid; grid-template-columns: repeat(auto-fill, minmax(min(100%, 160px), 1fr)); gap: 10px; }
.fail, .empty { font-size: 0.9rem; padding: 12px; border: 1px dashed var(--line); border-radius: 6px; color: var(--muted); }
.fail { color: var(--ng); }
dialog { max-width: 96vw; max-height: 94vh; padding: 0; border: 0; background: transparent; }
dialog img { max-width: 96vw; max-height: 92vh; width: auto; background: #ffffff; border-radius: 6px; cursor: zoom-out; }
dialog::backdrop { background: rgb(0 0 0 / 0.78); }
`;

/** 絵を押すと大きく開き、もう一度押すと閉じる */
const SCRIPT = `
const zoom = document.getElementById("zoom");
const big = zoom.querySelector("img");
document.addEventListener("click", (event) => {
  const shot = event.target.closest(".shot img");
  if (shot) {
    big.src = shot.src;
    big.alt = shot.alt;
    zoom.showModal();
  } else if (event.target.closest("#zoom")) zoom.close();
});
`;

function html(laid) {
  const all = tally(laid.flatMap((evalCase) => evalCase.runs));
  const when = new Date().toLocaleString("ja-JP", { timeZone: "Asia/Tokyo", hour12: false });
  return [
    "<!doctype html>",
    '<html lang="ja">',
    "<head>",
    '<meta charset="utf-8">',
    '<meta name="viewport" content="width=device-width, initial-scale=1">',
    "<title>評価の図の見比べ</title>",
    `<style>${CSS}</style>`,
    "</head>",
    "<body>",
    "<main>",
    "<header>",
    "<h1>評価でAIが描いた図</h1>",
    `<p class="lead">ケース${laid.length}件、実行${all.runs}件、図${all.diagrams}件のうち、崩れの残る図${all.broken}件。${escape(when)}に書いた。</p>`,
    "<p>各実行で保存した<code>.dragon</code>ごとに、最後の段と、<code>dragon check --layout --lang ja</code>が崩れを知らせた段を、<code>dragon export --format png --lang ja</code>で書き出した。絵を押すと大きく開く。</p>",
    "</header>",
    `<ul class="toc">${laid.map((evalCase) => `<li><a href="#case-${escape(evalCase.name)}">${escape(evalCase.name)}</a></li>`).join("")}</ul>`,
    laid.map(caseHtml).join(""),
    "</main>",
    '<dialog id="zoom"><img alt=""></dialog>',
    `<script>${SCRIPT}</script>`,
    "</body>",
    "</html>",
    "",
  ].join("\n");
}
