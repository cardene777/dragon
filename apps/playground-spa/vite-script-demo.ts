import { copyFileSync, existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

import type { Plugin } from "vite";

/**
 * 組み込みの見本の頁のscriptの1行の置き方が開く頁 (#3701)。
 *
 * 見本の頁 (`/embedding`) は、scriptの1行の置き方を本物の入口で見せる。
 * 入口はjsDelivrから読む物だが、まだ公開していない版の入口は読めないので、buildした入口を見本帳の`script/`に写して読む。
 *
 * | 置き場 | 中身 |
 * |---|---|
 * | `script/cdn/*.js` | scriptの1行の入口 (`packages/dragon/dist/cdn/`) |
 * | `script/player.global.js` | 入口の書き出す部品が1つ上から読む再生の部品 |
 * | `script/demo.html` | 見本の記法を`<pre class="dragon" data-header>`に置いて入口を読む頁 |
 *
 * 頁は`?lang=en`で英語の記法と帯にし、無い時は日本語にする。見本の頁はこの頁をiframeで開く。
 * 頁は見本帳のCSPの外に置き、読む外の物は入口が足す図の字のCSSだけにする。
 * buildでは`closeBundle`で写し、開発のserverでは同じ置き場を`packages/dragon/dist`から返す。
 */
const APP = __dirname;
const DIST = path.resolve(APP, "../../packages/dragon/dist");
const SAMPLE = { ja: path.join(APP, "src/embed/sample.dragon"), en: path.join(APP, "src/embed/sample.en.dragon") } as const;

/** 頁の本文に置く字。`<`と`&`を字として出す */
const escapeHtml = (text: string): string => text.replace(/&/gu, "&amp;").replace(/</gu, "&lt;").replace(/>/gu, "&gt;");

/** script の中に置くJSON。`</script>`で script が閉じないようにする */
const scriptJson = (value: unknown): string => JSON.stringify(value).replace(/</gu, "\\u003c");

/** 見本の記法を置いて入口を読む頁 */
export function scriptDemoPage(): string {
  const ja = readFileSync(SAMPLE.ja, "utf8").trimEnd();
  const en = readFileSync(SAMPLE.en, "utf8").trimEnd();
  return `<!doctype html>
<html lang="ja">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="referrer" content="strict-origin-when-cross-origin" />
    <title>dragon script demo</title>
    <style>
      html, body { margin: 0; background: transparent; }
    </style>
  </head>
  <body>
    <pre class="dragon" data-header>
${escapeHtml(ja)}
</pre>
    <script>
      // ?lang=en なら英語の記法と帯にする。入口は module なので、この行の後で塊を読む
      if (new URLSearchParams(location.search).get("lang") === "en") {
        document.documentElement.lang = "en";
        document.querySelector("pre.dragon").textContent = ${scriptJson(en)};
      }
    </script>
    <script type="module" src="cdn/dragon.js"></script>
  </body>
</html>
`;
}

/** 写す入口の file。`script/`からの相対の置き場と、写す元 */
function scriptFiles(): { at: string; from: string }[] {
  const cdn = path.join(DIST, "cdn");
  if (!existsSync(cdn)) throw new Error(`scriptの1行の入口が無い (${cdn})。先に pnpm build:packages を回す`);
  return [
    ...readdirSync(cdn)
      .filter((name) => name.endsWith(".js"))
      .map((name) => ({ at: `cdn/${name}`, from: path.join(cdn, name) })),
    { at: "player.global.js", from: path.join(DIST, "player.global.js") },
  ];
}

export function createScriptDemoPlugin(): Plugin {
  let outDir = "";
  let building = false;
  return {
    name: "dragon-script-demo",
    configResolved(config) {
      outDir = path.resolve(config.root, config.build.outDir);
      building = config.command === "build";
    },
    configureServer(server) {
      const base = server.config.base;
      server.middlewares.use((req, res, next) => {
        const url = (req.url ?? "").split("?")[0] ?? "";
        if (!url.startsWith(`${base}script/`)) return next();
        const rel = url.slice(`${base}script/`.length);
        if (rel === "demo.html") {
          res.setHeader("Content-Type", "text/html; charset=utf-8");
          res.end(scriptDemoPage());
          return;
        }
        const file = scriptFiles().find((entry) => entry.at === rel);
        if (!file || !existsSync(file.from)) return next();
        res.setHeader("Content-Type", "text/javascript; charset=utf-8");
        res.end(readFileSync(file.from));
      });
    },
    closeBundle() {
      if (!building) return;
      const dir = path.join(outDir, "script");
      mkdirSync(path.join(dir, "cdn"), { recursive: true });
      for (const { at, from } of scriptFiles()) copyFileSync(from, path.join(dir, at));
      writeFileSync(path.join(dir, "demo.html"), scriptDemoPage());
    },
  };
}
