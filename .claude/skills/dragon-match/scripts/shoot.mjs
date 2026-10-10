#!/usr/bin/env node
/**
 * 正解と作った図を同じ意匠順・同じ物差しで縦に並べ、PNG を 1 枚ずつ作る。
 *
 * 使い方。
 *   node shoot.mjs <設定.json> -o <出力 dir>
 */
import { mkdir, readFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { pathToFileURL } from "node:url";

import { chromium } from "@playwright/test";

import { 図の撮影情報, 図を開く, 比較一覧, sourceのpathを整える } from "./source.mjs";

function 引数を読む(argv) {
  const configPath = argv[0];
  let output;
  for (let index = 1; index < argv.length; index += 1) {
    if (argv[index] === "-o" || argv[index] === "--output") output = argv[++index];
    else throw new Error(`不明な引数です: ${argv[index]}`);
  }
  if (configPath === undefined || output === undefined) {
    throw new Error("使い方: shoot.mjs <設定.json> -o <出力 dir>");
  }
  return { configPath: path.resolve(configPath), output: path.resolve(output) };
}

async function 撮る(browser, rawSource) {
  const page = await browser.newPage({
    viewport: { width: 2400, height: 1800 },
    deviceScaleFactor: 2,
  });
  try {
    const source = sourceのpathを整える(rawSource);
    const opened = await 図を開く(page, source);
    const info = await 図の撮影情報(page, opened, source);
    const image = await page.screenshot({ clip: info.clip, animations: "disabled" });
    return { image, bounds: info.bounds };
  } finally {
    await page.close();
  }
}

function esc(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

async function 組む(browser, entries, side, output, pixelsPerUnit) {
  const page = await browser.newPage({
    viewport: { width: 1280, height: 1000 },
    deviceScaleFactor: 2,
  });
  try {
    const rows = entries
      .map((entry) => {
        const capture = side === "expected" ? entry.expected : entry.actual;
        const width = Math.max(1, Math.round(capture.bounds.width * pixelsPerUnit));
        const height = Math.max(1, Math.round(capture.bounds.height * pixelsPerUnit));
        return `<section class="row" style="height:${entry.rowHeight}px">
          <div class="label">${esc(entry.label)}</div>
          <div class="picture"><img width="${width}" height="${height}" src="data:image/png;base64,${capture.image.toString("base64")}"></div>
        </section>`;
      })
      .join("\n");
    await page.setContent(`<!doctype html>
      <html lang="ja"><head><meta charset="utf-8"><style>
      *{box-sizing:border-box}html,body{margin:0;background:#f5f1e8;color:#302a22}
      #sheet{width:1280px;padding:20px;display:flex;flex-direction:column;gap:18px}
      .row{display:flex;flex-direction:column;gap:10px;background:#fff;border:1px solid #c9c1b4;border-radius:10px;padding:16px;overflow:hidden}
      .label{font:700 24px/1.3 system-ui,sans-serif;min-height:32px}
      .picture{display:flex;align-items:flex-start;justify-content:center;min-width:0;flex:1;overflow:hidden}
      img{display:block;object-fit:contain}
      </style></head><body><main id="sheet">${rows}</main></body></html>`);
    await page
      .locator("img")
      .evaluateAll((images) => Promise.all(images.map((image) => image.decode())));
    await page.locator("#sheet").screenshot({ path: output, animations: "disabled" });
    for (const [index, entry] of entries.entries()) {
      await page.locator(".row").nth(index).screenshot({
        path: path.join(path.dirname(output), "parts", `${side}-${entry.fileName}.png`),
        animations: "disabled",
      });
    }
  } finally {
    await page.close();
  }
}

export async function shootConfig(config, output) {
  const comparisons = 比較一覧(config);
  const browser = await chromium.launch();
  try {
    const entries = [];
    for (const comparison of comparisons) {
      const expected = await 撮る(browser, comparison.expected);
      const actual = await 撮る(browser, comparison.actual);
      entries.push({
        label: comparison.label,
        fileName:
          comparison.actual?.palette ?? comparison.expected?.palette ?? comparison.label,
        expected,
        actual,
      });
    }
    const widest = Math.max(
      ...entries.flatMap((entry) => [entry.expected.bounds.width, entry.actual.bounds.width]),
    );
    const pixelsPerUnit = Math.min(1, 1160 / widest);
    for (const entry of entries) {
      entry.rowHeight =
        Math.max(entry.expected.bounds.height, entry.actual.bounds.height) * pixelsPerUnit + 74;
    }
    await mkdir(path.join(output, "parts"), { recursive: true });
    await 組む(
      browser,
      entries,
      "expected",
      path.join(output, "expected.png"),
      pixelsPerUnit,
    );
    await 組む(
      browser,
      entries,
      "actual",
      path.join(output, "actual.png"),
      pixelsPerUnit,
    );
  } finally {
    await browser.close();
  }
}

async function main() {
  const args = 引数を読む(process.argv.slice(2));
  const config = JSON.parse(await readFile(args.configPath, "utf8"));
  await shootConfig(config, args.output);
  console.log(`${path.join(args.output, "expected.png")}\n${path.join(args.output, "actual.png")}`);
}

if (
  process.argv[1] !== undefined &&
  pathToFileURL(path.resolve(process.argv[1])).href === import.meta.url
) {
  main().catch((error) => {
    console.error(`shoot: ${error instanceof Error ? error.message : String(error)}`);
    process.exitCode = 1;
  });
}
