import { readFileSync } from "node:fs";

import type { Plugin } from "vite";

import { pipeTextKey } from "./src/site/pipe-text-key";

/**
 * 見本帳の頁の配管の図の並べ方を、build の時に組んで収める (#3748)。
 *
 * 頁は配管の図を最初に描く時に並べ方を組み、道を探す処理 (`Router.route`) が描く本体の thread を止める。
 * build で頁が読む記法の file (`?raw` で読む `.dragon` と `.json`) のうち配管の図の物を集め、
 * 最初に見える形と畳んだ箱を 1 つだけ開いた形の並べ方を記法の字ごとの JSON にして `pipe-layouts/` に置く。
 * `LiveFigure` は配管の図を描く前にその file を読み、再生の部品へ渡す。
 *
 * 言葉は file の名前が `.en.` を持てば英語、ほかは日本語にする。見本帳は英語の頁で英語の file を描くため。
 * 見本帳の図は全体を止めて見せる (`whole`、`view: "fixed"`) ので、止めて見せる図で組む。
 * 組むのは build した package (`dist`) の部品で、頁が描く部品と同じ code の指紋の鍵になる。
 */
const RAW = /^(.*\.(?:dragon|json))\?raw$/u;

/** 配管の図の原本。記法は種類の行が `pipe`、JSON は `"kind": "pipe"` を持つ */
const PIPE = /^pipe( |$)|"kind": *"pipe"/mu;

/** 記法の字か原本の JSON の字 `text` を、言葉 `lang` で描く時に収める並べ方の file。配管の図でない字と読めない字は飛ばす */
export async function pipeLayoutAssets(files: readonly { text: string; lang: "ja" | "en" }[]): Promise<{ fileName: string; source: string }[]> {
  const { parseNotation, readDiagram } = await import("@cardenelabs/dragon");
  const { pipeLayouts } = await import("@cardenelabs/dragon/export");
  const assets = new Map<string, string>();
  for (const { text, lang } of files) {
    // 見本帳と同じく末尾の空白を外した字を、言葉を渡さずに読む (`LiveFigure.tsx`)
    const body = text.trimEnd();
    const read = body.trimStart().startsWith("{") ? readDiagram(JSON.parse(body)) : parseNotation(body);
    if (!read.ok || read.diagram.kind !== "pipe") continue;
    const layouts = pipeLayouts({ ...read.diagram, view: "fixed" }, { lang });
    if (layouts.length > 0) assets.set(`pipe-layouts/${pipeTextKey(body, lang)}.json`, JSON.stringify(layouts));
  }
  return [...assets].map(([fileName, source]) => ({ fileName, source }));
}

export function createPipeLayoutsPlugin(): Plugin {
  const files = new Map<string, { text: string; lang: "ja" | "en" }>();
  return {
    name: "dragon-pipe-layouts",
    apply: "build",
    transform(_code, id) {
      const file = RAW.exec(id)?.[1];
      if (file === undefined) return;
      const text = readFileSync(file, "utf8");
      if (PIPE.test(text)) files.set(file, { text, lang: /\.en\.(?:dragon|json)$/u.test(file) ? "en" : "ja" });
    },
    async generateBundle() {
      for (const { fileName, source } of await pipeLayoutAssets([...files.values()])) this.emitFile({ type: "asset", fileName, source });
    },
  };
}
