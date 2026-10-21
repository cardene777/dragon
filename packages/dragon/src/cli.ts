#!/usr/bin/env node
/**
 * `dragon export <図の file>` の命令。原本の JSON (`.json`) か記法 (`.dragon`) を読み、mp4、GIF、HTML、PNG を書き出す。
 * 書き出した file の path を 1 行ずつ出す。
 */
import { readFileSync } from "node:fs";
import { basename, extname, resolve } from "node:path";
import { parseArgs } from "node:util";
import { type ExportFormat, exportDiagram } from "./export/index";
import type { Theme } from "./look/values";
import { parseNotation } from "./parser";
import { type NotationLang, notationLanguage } from "./words";

const USAGE = [
  "使い方: dragon export <図の file (.json か .dragon)> [設定]",
  "  --out <dir>        書き出す先 (既定は今の dir)",
  "  --width <px>       枠の幅。見せ方を選び、寄って見せる窓の幅になる",
  "  --palette <名前>   色味 (clear / paper / night)",
  "  --theme <明暗>     light か dark",
  "  --lang <言葉>      図の中の字の言葉 (ja か en)。既定は記法の file の言葉で、JSON は ja",
  "  --fps <数>         mp4 の 1 秒のコマの数 (既定 30)",
  "  --gif-fps <数>     GIF の 1 秒のコマの数 (既定 10)",
  "  --format <形>      書き出す形を , で区切る (既定 mp4,gif,html,png)",
].join("\n");

const isLang = (value: string): value is NotationLang => value === "ja" || value === "en";

const number = (value: string | undefined): number | undefined => (value === undefined ? undefined : Number(value));

/** 図の file を読む。記法の file はその言葉も返し、JSON の原本は言葉を持たない */
function read(file: string): { diagram: unknown; lang?: NotationLang } {
  const text = readFileSync(file, "utf8");
  if (extname(file) !== ".dragon") return { diagram: JSON.parse(text) };
  const parsed = parseNotation(text);
  if (!parsed.ok) throw new Error(parsed.errors.map((e) => `${file}:${e.line} ${e.message}`).join("\n"));
  const lang = notationLanguage(text);
  return lang === undefined ? { diagram: parsed.diagram } : { diagram: parsed.diagram, lang };
}

async function main(argv: string[]): Promise<number> {
  const [command, ...rest] = argv;
  if (command !== "export") {
    console.error(USAGE);
    return 2;
  }
  const { values, positionals } = parseArgs({
    args: rest,
    allowPositionals: true,
    options: {
      out: { type: "string" },
      width: { type: "string" },
      palette: { type: "string" },
      theme: { type: "string" },
      lang: { type: "string" },
      fps: { type: "string" },
      "gif-fps": { type: "string" },
      format: { type: "string" },
    },
  });
  const file = positionals[0];
  const chosen = values.lang;
  if (!file || (chosen !== undefined && !isLang(chosen))) {
    console.error(USAGE);
    return 2;
  }
  const width = number(values.width);
  const fps = number(values.fps);
  const gifFps = number(values["gif-fps"]);
  const { diagram, lang: fileLang } = read(file);
  // 渡した言葉を記法の file の言葉より先に使う。JSON の原本で渡さなければ、書き出しの既定 (日本語) になる
  const lang = chosen ?? fileLang;
  const result = await exportDiagram(diagram, {
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
  for (const path of Object.values(result.files)) console.log(path);
  return 0;
}

main(process.argv.slice(2)).then(
  (code) => process.exit(code),
  (error: unknown) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exit(1);
  },
);
