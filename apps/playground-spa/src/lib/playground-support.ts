/**
 * 公開する頁を build し、GitHub Pages と同じ形で配る (#2995)。
 *
 * 頁の CSP と字の読み込みと幅による並びは jsdom では確かめられないため、build した頁を画面なしの Chromium で開く。
 * GitHub Pages は頁を `/dragon/` の下で配り、無い path には `404.html` を返す。ここの配り手も同じ動きをする。
 */
import { execFile } from "node:child_process";
import { existsSync, mkdtempSync, readdirSync, readFileSync, statSync } from "node:fs";
import { createServer } from "node:http";
import type { AddressInfo } from "node:net";
import { tmpdir } from "node:os";
import { extname, join, resolve, sep } from "node:path";
import { promisify } from "node:util";
import { gzipSync } from "node:zlib";

const run = promisify(execFile);

export const root = resolve(__dirname, "../../../..");
export const app = join(root, "apps/playground-spa");
/** 頁を配る場所。`vite.config.ts` が build の時に使う前置きと同じ */
export const BASE = "/dragon/";

export interface Built {
  dir: string;
  /** 配る前に `404.html` を作る script の結果 */
  notFound: { ok: boolean; stderr: string };
}

/** 頁を一時の場所へ build し、配る時と同じ script で `404.html` を作る */
export async function buildPage(): Promise<Built> {
  const dir = mkdtempSync(join(tmpdir(), "dragon-page-"));
  const vite = join(app, "node_modules/vite/bin/vite.js");
  await run(process.execPath, [vite, "build", "--outDir", dir, "--emptyOutDir", "--logLevel", "error"], { cwd: app });
  try {
    await run(process.execPath, [join(app, "scripts/copy-404.mjs"), dir], { cwd: app });
    return { dir, notFound: { ok: true, stderr: "" } };
  } catch (error) {
    return { dir, notFound: { ok: false, stderr: String((error as { stderr?: unknown }).stderr ?? error) } };
  }
}

const TYPES: Readonly<Record<string, string>> = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript",
  ".css": "text/css",
  ".woff2": "font/woff2",
  ".woff": "font/woff",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".json": "application/json",
};

const isFile = (path: string): boolean => existsSync(path) && statSync(path).isFile();

/** build した頁を `/dragon/` の下で配る。無い path には、在れば `404.html` を 404 で返す */
export async function servePage(dir: string): Promise<{ origin: string; close: () => Promise<void> }> {
  const server = createServer((req, res) => {
    const path = decodeURIComponent(new URL(req.url ?? "/", "http://localhost").pathname);
    const inBase = path.startsWith(BASE) || `${path}/` === BASE;
    const wanted = inBase ? resolve(dir, `.${path.slice(BASE.length - 1)}`) : "";
    const inside = wanted === dir || wanted.startsWith(`${dir}${sep}`);
    const file = inside && existsSync(wanted) && statSync(wanted).isDirectory() ? join(wanted, "index.html") : wanted;
    if (inside && isFile(file)) {
      res.writeHead(200, { "content-type": TYPES[extname(file)] ?? "application/octet-stream" });
      res.end(readFileSync(file));
      return;
    }
    const notFound = join(dir, "404.html");
    if (isFile(notFound)) {
      res.writeHead(404, { "content-type": TYPES[".html"] });
      res.end(readFileSync(notFound));
      return;
    }
    res.writeHead(404, { "content-type": "text/plain" });
    res.end("Not Found");
  });
  await new Promise<void>((done) => server.listen(0, "127.0.0.1", done));
  const { port } = server.address() as AddressInfo;
  return {
    origin: `http://127.0.0.1:${port}`,
    close: () => new Promise<void>((done) => server.close(() => done())),
  };
}

/** build した script と CSS の file ごとの gzip の大きさ (byte) */
export function bundleSizes(dir: string): Record<string, number> {
  const assets = join(dir, "assets");
  if (!existsSync(assets)) return {};
  return Object.fromEntries(
    readdirSync(assets)
      .filter((name) => /\.(js|css)$/u.test(name))
      .map((name) => [name, gzipSync(readFileSync(join(assets, name))).length]),
  );
}

/** 頁の source (検査と検査の助けを除く) を path と中身の組で返す */
export function pageSources(): [string, string][] {
  const out: [string, string][] = [];
  const walk = (dir: string): void => {
    for (const name of readdirSync(dir)) {
      const path = join(dir, name);
      if (statSync(path).isDirectory()) walk(path);
      else if (/\.tsx?$/u.test(name) && !/\.test\.tsx?$/u.test(name) && !/-support\.ts$/u.test(name)) {
        out.push([path.slice(root.length + 1), readFileSync(path, "utf8")]);
      }
    }
  };
  walk(join(app, "src"));
  return out;
}

/** 見本の記法の file。無ければ `undefined` */
export function example(name: string): string | undefined {
  const path = join(root, "packages/dragon/examples", name);
  return isFile(path) ? readFileSync(path, "utf8").trimEnd() : undefined;
}

/** `#rrggbb` を `getComputedStyle` が返す `rgb(r, g, b)` の形にする */
export function rgb(hex: string): string {
  const n = Number.parseInt(hex.slice(1, 7), 16);
  return `rgb(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255})`;
}
