#!/usr/bin/env node
/**
 * 正解と作った図を 1 回ずつ測り、合わせる一覧の判定を出す。
 *
 * 使い方。
 *   node measure.mjs <設定.json> -o <出力 dir>
 */
import { access, mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { pathToFileURL } from "node:url";

import { chromium } from "@playwright/test";

import {
  noteの値を読む,
  一覧を判定する,
  一覧の誤り,
  一覧を検証する,
} from "./checklist.mjs";
import { 図を測る, 図を開く, 比較一覧, sourceのpathを整える } from "./source.mjs";

function cdl待ちを外す(checklist) {
  return {
    ...checklist,
    items: checklist.items.map((item) => {
      const copy = { ...item };
      delete copy.cdl待ち;
      return copy;
    }),
  };
}

async function noteを読む(noteRoot, palette) {
  if (typeof palette !== "string" || palette === "") return null;
  const notePath = path.join(noteRoot, palette, "note.md");
  try {
    await access(notePath);
  } catch {
    return null;
  }
  return noteの値を読む(await readFile(notePath, "utf8"));
}

async function 測る(browser, rawSource) {
  const page = await browser.newPage({ viewport: { width: 2400, height: 1800 } });
  try {
    const source = sourceのpathを整える(rawSource);
    const opened = await 図を開く(page, source);
    return await 図を測る(page, opened, source);
  } finally {
    await page.close();
  }
}

function 件数を数える(comparisons) {
  const counts = { 合わない: 0, 測れない: 0, "cdl 待ち": 0 };
  for (const comparison of comparisons) {
    for (const item of comparison.items) {
      if (item.status in counts) counts[item.status] += 1;
    }
  }
  return counts;
}

export async function measureConfig(config, checklist, noteRoot) {
  一覧を検証する(checklist);
  const expectedChecklist = cdl待ちを外す(checklist);
  const browser = await chromium.launch();
  const comparisons = [];
  try {
    for (const entry of 比較一覧(config)) {
      const palette = entry.palette;
      const actualNote = await noteを読む(noteRoot, palette);
      const expectedNote = await noteを読む(noteRoot, entry.expected?.palette);
      const expectedMeasurement = await 測る(browser, entry.expected);
      const actualMeasurement = await 測る(browser, entry.actual);
      const expected = 一覧を判定する(
        expectedChecklist,
        expectedMeasurement,
        expectedNote,
      );
      const actual = 一覧を判定する(checklist, actualMeasurement, actualNote);
      comparisons.push({
        label: entry.label,
        palette,
        items: actual.items,
        layout: actual.layout,
        expected: {
          items: expected.items,
          layout: expected.layout,
        },
        measurements: {
          expected: expectedMeasurement,
          actual: actualMeasurement,
        },
      });
    }
  } finally {
    await browser.close();
  }
  const checklistErrors = 一覧の誤り(
    comparisons.map((comparison) => ({
      label: comparison.label,
      items: comparison.expected.items,
    })),
  );
  return {
    version: 1,
    comparisons,
    checklistErrors,
    counts: 件数を数える(comparisons),
  };
}

function 表の値(value) {
  return String(value).replaceAll("|", "\\|").replaceAll("\n", " ");
}

function 升(item) {
  if (item.status === "合う") return "合う";
  const actual =
    item.actual === undefined || item.actual === "" ? "" : `（${表の値(item.actual)}）`;
  if (item.status !== "cdl 待ち") return `${item.status}${actual}`;
  const wait = item.cdl待ち;
  return `cdl 待ち${actual} — ${表の値(wait.理由)} / ${表の値(wait["cdl の課題"])}`;
}

export function checklistMarkdown(result) {
  const lines = [];
  if (result.checklistErrors.length > 0) {
    lines.push(
      "# 一覧の誤り",
      "",
      "| 意匠 | 項目 | 判定 | 正解の頁の値 |",
      "|---|---|---|---|",
      ...result.checklistErrors.map(
        (error) =>
          `| ${表の値(error.label)} | ${表の値(error.name)} | ${error.status} | ${表の値(error.actual)} |`,
      ),
      "",
    );
  }
  lines.push(
    "# 合わせる一覧",
    "",
    `| 項目 | ${result.comparisons.map((entry) => 表の値(entry.label)).join(" | ")} |`,
    `|---|${result.comparisons.map(() => "---").join("|")}|`,
  );
  const names = result.comparisons[0]?.items.map((item) => item.name) ?? [];
  for (const name of names) {
    lines.push(
      `| ${表の値(name)} | ${result.comparisons
        .map((comparison) => {
          const item = comparison.items.find((entry) => entry.name === name);
          return item === undefined ? "測れない（項目が無い）" : 升(item);
        })
        .join(" | ")} |`,
    );
  }
  lines.push(
    "",
    `合わない: ${result.counts.合わない} 件。`,
    `測れない: ${result.counts.測れない} 件。`,
    `cdl 待ち: ${result.counts["cdl 待ち"]} 件。`,
    "",
  );
  return lines.join("\n");
}

function 引数を読む(argv) {
  if (argv.includes("--cdl-wait")) {
    throw new Error("cdl 待ちは合わせる一覧の項目の \u0060cdl待ち\u0060 に書く形へ移った");
  }
  const configPath = argv[0];
  let output;
  for (let index = 1; index < argv.length; index += 1) {
    if (argv[index] === "-o" || argv[index] === "--output") output = argv[++index];
    else throw new Error(`不明な引数です: ${argv[index]}`);
  }
  if (configPath === undefined || output === undefined) {
    throw new Error("使い方: measure.mjs <設定.json> -o <出力 dir>");
  }
  return { configPath: path.resolve(configPath), output: path.resolve(output) };
}

async function main() {
  const args = 引数を読む(process.argv.slice(2));
  const config = JSON.parse(await readFile(args.configPath, "utf8"));
  if (typeof config.checklist !== "string" || config.checklist === "") {
    throw new Error("match.json の最上位に checklist の path を書いてください");
  }
  const checklistPath = path.resolve(config.checklist);
  const noteRoot = path.resolve(config.noteRoot ?? "docs/design");
  const checklist = JSON.parse(await readFile(checklistPath, "utf8"));
  const result = await measureConfig(config, checklist, noteRoot);
  await mkdir(args.output, { recursive: true });
  await writeFile(
    path.join(args.output, "result.json"),
    `${JSON.stringify(result, null, 2)}\n`,
    "utf8",
  );
  await writeFile(path.join(args.output, "checklist.md"), checklistMarkdown(result), "utf8");
  console.log(
    `合わない ${result.counts.合わない} / 測れない ${result.counts.測れない} / cdl 待ち ${result.counts["cdl 待ち"]}`,
  );
}

if (
  process.argv[1] !== undefined &&
  pathToFileURL(path.resolve(process.argv[1])).href === import.meta.url
) {
  main().catch((error) => {
    console.error(`measure: ${error instanceof Error ? error.message : String(error)}`);
    process.exitCode = 1;
  });
}
