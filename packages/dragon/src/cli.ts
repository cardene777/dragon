#!/usr/bin/env node
/**
 * `dragon export <図の file>` の命令。原本の JSON (`.json`) か記法 (`.dragon`) を読み、mp4、GIF、HTML、PNG を書き出す。
 * 書き出した file の path を 1 行ずつ出す。
 *
 * 使い方の文と誤りの文は、図の中の字と同じ言葉で出す (#3003)。`--lang` を渡せばその言葉、無ければ記法の file の言葉、
 * JSON の原本と file を読む前の誤りは日本語。記法の行の誤りだけは、書き方の例が file の書き方に合うよう file の言葉で出す。
 */
import { readFileSync } from "node:fs";
import { basename, extname, resolve } from "node:path";
import { parseArgs } from "node:util";
import { type ExportFormat, exportDiagram } from "./export/index";
import type { Theme } from "./look/values";
import { parseNotation } from "./parser";
import { type NotationLang, notationLanguage } from "./words";

const OPTIONS = {
  out: { type: "string" },
  width: { type: "string" },
  palette: { type: "string" },
  theme: { type: "string" },
  lang: { type: "string" },
  fps: { type: "string" },
  "gif-fps": { type: "string" },
  format: { type: "string" },
} as const;

interface CliText {
  usage: string;
  unknownOption: (name: string) => string;
  missingValue: (name: string) => string;
  extraFiles: (extra: string[]) => string;
  noFile: (path: string) => string;
  unreadable: (path: string, detail: string) => string;
  badJson: (path: string, detail: string) => string;
  cannotWrite: (path: string, detail: string) => string;
}

/** 命令が出す文。英語は日本語の文をそのまま英語にする */
const CLI_TEXT: Record<NotationLang, CliText> = {
  ja: {
    usage: [
      "使い方: dragon export <図の file (.json か .dragon)> [設定]",
      "  --out <dir>        書き出す先 (既定は今の dir)",
      "  --width <px>       枠の幅。見せ方を選び、寄って見せる窓の幅になる",
      "  --palette <名前>   色味 (clear / paper / night)",
      "  --theme <明暗>     light か dark",
      "  --lang <言葉>      図の中の字と命令の文の言葉 (ja か en)。既定は記法の file の言葉で、JSON は ja",
      "  --fps <数>         mp4 の 1 秒のコマの数 (既定 30)",
      "  --gif-fps <数>     GIF の 1 秒のコマの数 (既定 10)",
      "  --format <形>      書き出す形を , で区切る (既定 mp4,gif,html,png)",
    ].join("\n"),
    unknownOption: (name) => `知らない設定: ${name}`,
    missingValue: (name) => `設定に値が無い: ${name}`,
    extraFiles: (extra) => `図の file は 1 つだけ渡す。余分な引数: ${extra.join(" ")}`,
    noFile: (path) => `図の file が無い: ${path}`,
    unreadable: (path, detail) => `図の file を読めない: ${path} (${detail})`,
    badJson: (path, detail) => `JSON として読めない: ${path} (${detail})`,
    cannotWrite: (path, detail) => `書き出せない: ${path} (${detail})`,
  },
  en: {
    usage: [
      "Usage: dragon export <diagram file (.json or .dragon)> [options]",
      "  --out <dir>        Where to write (default: the current dir)",
      "  --width <px>       Frame width. Picks the view and sets the window width when following",
      "  --palette <name>   Colors (clear / paper / night)",
      "  --theme <mode>     light or dark",
      "  --lang <lang>      Language of the diagram text and command messages (ja or en). Defaults to the notation file's language, and ja for JSON",
      "  --fps <n>          Frames per second of the mp4 (default 30)",
      "  --gif-fps <n>      Frames per second of the GIF (default 10)",
      "  --format <list>    Formats to write, separated by , (default mp4,gif,html,png)",
    ].join("\n"),
    unknownOption: (name) => `Unknown option: ${name}`,
    missingValue: (name) => `Option needs a value: ${name}`,
    extraFiles: (extra) => `Pass only one diagram file. Extra arguments: ${extra.join(" ")}`,
    noFile: (path) => `No such diagram file: ${path}`,
    unreadable: (path, detail) => `Cannot read the diagram file: ${path} (${detail})`,
    badJson: (path, detail) => `Cannot read as JSON: ${path} (${detail})`,
    cannotWrite: (path, detail) => `Cannot write: ${path} (${detail})`,
  },
};

const isLang = (value: string | undefined): value is NotationLang => value === "ja" || value === "en";

const number = (value: string | undefined): number | undefined => (value === undefined ? undefined : Number(value));

const detail = (error: unknown): string => (error instanceof Error ? error.message : String(error));

/** 設定を読む前に `--lang` の値を引く。設定の誤りの文も、選んだ言葉で出すため */
function langOf(args: string[]): string | undefined {
  for (const [i, arg] of args.entries()) {
    if (arg === "--lang") return args[i + 1];
    if (arg.startsWith("--lang=")) return arg.slice("--lang=".length);
  }
  return undefined;
}

/**
 * 設定の誤りを、Node の文ではなく命令の言葉で返す。誤りが無ければ `undefined`。
 * 値の要る設定の後ろに `-` で始まる語が続く時は、その語を値と取り違えずに値が無いとみなす (Node も同じ形を断る)。
 */
function optionProblem(args: string[], text: CliText): string | undefined {
  const { tokens } = parseArgs({ args, options: OPTIONS, allowPositionals: true, strict: false, tokens: true });
  for (const token of tokens) {
    if (token.kind !== "option") continue;
    if (!Object.hasOwn(OPTIONS, token.name)) return text.unknownOption(token.rawName);
    if (token.value === undefined || (!token.inlineValue && token.value.startsWith("-"))) return text.missingValue(token.rawName);
  }
  return undefined;
}

/** Node が file か dir を扱えなかった誤りなら、扱えなかった path を返す。それ以外の誤りは `undefined` */
function failedPath(error: unknown): string | undefined {
  if (!(error instanceof Error) || !("syscall" in error) || !("path" in error)) return undefined;
  return typeof error.path === "string" ? error.path : undefined;
}

/** 図の file を読む。記法の file はその言葉も返し、JSON の原本は言葉を持たない */
function read(file: string, text: CliText): { diagram: unknown; lang?: NotationLang } {
  let source: string;
  try {
    source = readFileSync(file, "utf8");
  } catch (error) {
    const missing = error instanceof Error && "code" in error && error.code === "ENOENT";
    throw new Error(missing ? text.noFile(file) : text.unreadable(file, detail(error)));
  }
  if (extname(file) !== ".dragon") {
    try {
      return { diagram: JSON.parse(source) };
    } catch (error) {
      throw new Error(text.badJson(file, detail(error)));
    }
  }
  const parsed = parseNotation(source);
  if (!parsed.ok) throw new Error(parsed.errors.map((e) => `${file}:${e.line} ${e.message}`).join("\n"));
  const lang = notationLanguage(source);
  return lang === undefined ? { diagram: parsed.diagram } : { diagram: parsed.diagram, lang };
}

async function main(argv: string[]): Promise<number> {
  const [command, ...rest] = argv;
  const chosen = langOf(argv);
  // file を読む前の文は、渡した言葉か日本語で出す。知らない言葉は日本語の使い方で断る
  const early = CLI_TEXT[isLang(chosen) ? chosen : "ja"];
  if (command !== "export") {
    console.error(early.usage);
    return 2;
  }
  const problem = optionProblem(rest, early);
  if (problem !== undefined) {
    console.error(`${problem}\n${early.usage}`);
    return 2;
  }
  const { values, positionals } = parseArgs({ args: rest, options: OPTIONS, allowPositionals: true });
  const [file, ...extra] = positionals;
  if (!file || (chosen !== undefined && !isLang(chosen))) {
    console.error(early.usage);
    return 2;
  }
  // 2 つ目以降を黙って捨てると、`--out` を書き忘れた時に思った所と違う所へ書き出す (#3007)
  if (extra.length > 0) {
    console.error(`${early.extraFiles(extra)}\n${early.usage}`);
    return 2;
  }
  const width = number(values.width);
  const fps = number(values.fps);
  const gifFps = number(values["gif-fps"]);
  const { diagram, lang: fileLang } = read(file, early);
  // 渡した言葉を記法の file の言葉より先に使う。JSON の原本で渡さなければ、書き出しの既定 (日本語) になる
  const lang = isLang(chosen) ? chosen : fileLang;
  let result: Awaited<ReturnType<typeof exportDiagram>>;
  try {
    result = await exportDiagram(diagram, {
      outDir: resolve(values.out ?? "."),
      name: basename(file, extname(file)),
      ...(values.format ? { formats: values.format.split(",") as ExportFormat[] } : {}),
      ...(width === undefined ? {} : { width }),
      ...(values.palette ? { palette: values.palette } : {}),
      ...(values.theme ? { theme: values.theme as Theme } : {}),
      ...(lang ? { lang } : {}),
      ...(fps === undefined ? {} : { fps }),
      ...(gifFps === undefined ? {} : { gifFps }),
    });
  } catch (error) {
    // 書き出し先に書けない時だけ命令の言葉で書き直す。描けない時と道具が無い時の断りは、書き出しが言葉に合わせて出す (#3009)
    const path = failedPath(error);
    if (path !== undefined) throw new Error(CLI_TEXT[lang ?? "ja"].cannotWrite(path, detail(error)));
    throw error instanceof Error ? error : new Error(String(error));
  }
  for (const path of Object.values(result.files)) console.log(path);
  return 0;
}

main(process.argv.slice(2)).then(
  (code) => process.exit(code),
  (error: unknown) => {
    console.error(detail(error));
    process.exit(1);
  },
);
