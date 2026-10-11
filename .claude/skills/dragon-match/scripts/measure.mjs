#!/usr/bin/env node
/**
 * 正解と作った図を、字・箱・線の計算後の値で比べる。
 *
 * 使い方。
 *   node measure.mjs <設定.json> -o <出力 dir> [--cdl-wait <cdl-wait.json>]
 */
import { access, mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { pathToFileURL } from "node:url";

import { chromium } from "@playwright/test";

import { 図を測る, 図を開く, 比較一覧, sourceのpathを整える } from "./source.mjs";

const 位置と大きさで許す差 = 2;
const 字の大きさで許す差 = 0.25;
const 線と枠の太さで許す差 = 0.1;
const 字を持たない図形の最小面積 = 400;

function 丸める(value) {
  return Math.round(value * 1000) / 1000;
}

function 中央値(values) {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 1
    ? sorted[middle]
    : (sorted[middle - 1] + sorted[middle]) / 2;
}

function 字ごとに分ける(texts) {
  const groups = new Map();
  for (const text of texts) {
    const entries = groups.get(text.text) ?? [];
    entries.push(text);
    groups.set(text.text, entries);
  }
  for (const entries of groups.values()) entries.sort((a, b) => a.y - b.y || a.x - b.x);
  return groups;
}

function 距離(expected, actual, origin, scale) {
  const dx = (actual.x - origin.x) / scale - expected.x;
  const dy = (actual.y - origin.y) / scale - expected.y;
  return dx * dx + dy * dy;
}

function 箱の倍率(pairs) {
  const ratios = pairs
    .filter(
      (pair) =>
        pair.expected.box !== null &&
        pair.actual.box !== null &&
        pair.expected.box.width > 0 &&
        pair.actual.box.width > 0,
    )
    .map((pair) => pair.actual.box.width / pair.expected.box.width);
  return ratios.length === 0 ? 1 : 丸める(中央値(ratios));
}

function 原点の差(pairs, scale) {
  return {
    x: 丸める(中央値(pairs.map((pair) => pair.actual.x - pair.expected.x * scale))),
    y: 丸める(中央値(pairs.map((pair) => pair.actual.y - pair.expected.y * scale))),
  };
}

function 組にする(expectedTexts, actualTexts) {
  const expectedByText = 字ごとに分ける(expectedTexts);
  const actualByText = 字ごとに分ける(actualTexts);
  const labels = [...new Set([...expectedByText.keys(), ...actualByText.keys()])].sort();
  const unique = [];
  for (const label of labels) {
    const expected = expectedByText.get(label) ?? [];
    const actual = actualByText.get(label) ?? [];
    if (expected.length === 1 && actual.length === 1) {
      unique.push({ text: label, expected: expected[0], actual: actual[0] });
    }
  }
  const initialScale = 箱の倍率(unique);
  const initialOrigin = 原点の差(unique, initialScale);

  const pairs = [];
  const missing = [];
  for (const label of labels) {
    const expected = [...(expectedByText.get(label) ?? [])];
    const actual = [...(actualByText.get(label) ?? [])];
    if (expected.length === 1 && actual.length === 1) {
      pairs.push({ text: label, occurrence: 1, expected: expected[0], actual: actual[0] });
      continue;
    }
    let occurrence = 1;
    while (expected.length > 0 && actual.length > 0) {
      let best = { expectedIndex: 0, actualIndex: 0, distance: Number.POSITIVE_INFINITY };
      for (let i = 0; i < expected.length; i += 1) {
        for (let j = 0; j < actual.length; j += 1) {
          const candidate = 距離(expected[i], actual[j], initialOrigin, initialScale);
          if (candidate < best.distance) best = { expectedIndex: i, actualIndex: j, distance: candidate };
        }
      }
      pairs.push({
        text: label,
        occurrence,
        expected: expected.splice(best.expectedIndex, 1)[0],
        actual: actual.splice(best.actualIndex, 1)[0],
      });
      occurrence += 1;
    }
    for (const entry of expected) missing.push({ text: label, occurrence: occurrence++, side: "actual", entry });
    for (const entry of actual) missing.push({ text: label, occurrence: occurrence++, side: "expected", entry });
  }
  const overallScale = 箱の倍率(pairs);
  return { origin: 原点の差(pairs, overallScale), overallScale, pairs, missing };
}

function cdl待ちを探す(entries, label, text, item) {
  return entries.find((entry) => {
    const entryLabel = entry["意匠"] ?? entry.style;
    const entryText = entry["字"] ?? entry.text;
    const entryItem = entry["項目"] ?? entry.item;
    return (entryLabel === undefined || entryLabel === label) && entryText === text && entryItem === item;
  });
}

function 違いを足す(
  state,
  cdlWait,
  label,
  text,
  occurrence,
  item,
  expected,
  actual,
  details = {},
) {
  const waiting = cdl待ちを探す(cdlWait, label, text, item);
  const record = {
    style: label,
    text,
    occurrence,
    item,
    expected,
    actual,
    status: waiting === undefined ? "違い" : "cdl 待ち",
    ...details,
  };
  if (waiting !== undefined) {
    record.reason = waiting["理由"] ?? waiting.reason ?? "";
    record.cdlIssue = waiting["cdl の課題"] ?? waiting["cdlの課題"] ?? waiting.cdlIssue ?? "";
    state.cdlWait.push(record);
  } else {
    state.differences.push(record);
  }
}

function 測れないを足す(state, label, text, occurrence, item, expected, actual) {
  state.unmeasurable.push({
    style: label,
    text,
    occurrence,
    item,
    expected,
    actual,
    status: "測れない",
  });
}

function 数を比べる(state, wait, label, pair, item, expected, actual, offset, scale) {
  const adjusted = (actual - offset) / scale;
  if (Math.abs(adjusted - expected) > 位置と大きさで許す差) {
    違いを足す(
      state,
      wait,
      label,
      pair.text,
      pair.occurrence,
      item,
      expected,
      丸める(adjusted),
      { actualBeforeScale: actual },
    );
  }
}

function 大きさを比べる(state, wait, label, pair, item, expected, actual, scale) {
  数を比べる(state, wait, label, pair, item, expected, actual, 0, scale);
}

function 太さを比べる(state, wait, label, pair, item, expected, actual, scale, tolerance) {
  const adjusted = 丸める(actual / scale);
  if (Math.abs(adjusted - expected) > tolerance) {
    違いを足す(state, wait, label, pair.text, pair.occurrence, item, expected, adjusted, {
      actualBeforeScale: actual,
    });
  }
}

function 同じか比べる(state, wait, label, pair, item, expected, actual) {
  if (expected !== actual) {
    違いを足す(state, wait, label, pair.text, pair.occurrence, item, expected, actual);
  }
}

function 字と箱を比べる(state, wait, label, pair, origin, scale) {
  数を比べる(state, wait, label, pair, "字.x", pair.expected.x, pair.actual.x, origin.x, scale);
  数を比べる(state, wait, label, pair, "字.y", pair.expected.y, pair.actual.y, origin.y, scale);
  大きさを比べる(state, wait, label, pair, "字.幅", pair.expected.width, pair.actual.width, scale);
  大きさを比べる(state, wait, label, pair, "字.高さ", pair.expected.height, pair.actual.height, scale);
  太さを比べる(
    state,
    wait,
    label,
    pair,
    "字の大きさ",
    pair.expected.fontSize,
    pair.actual.fontSize,
    scale,
    字の大きさで許す差,
  );
  同じか比べる(state, wait, label, pair, "字の太さ", pair.expected.fontWeight, pair.actual.fontWeight);
  同じか比べる(state, wait, label, pair, "字の色", pair.expected.color, pair.actual.color);
  if (pair.expected.platformFont === null || pair.actual.platformFont === null) {
    測れないを足す(
      state,
      label,
      pair.text,
      pair.occurrence,
      "書体",
      pair.expected.platformFont,
      pair.actual.platformFont,
    );
  } else {
    同じか比べる(
      state,
      wait,
      label,
      pair,
      "書体",
      pair.expected.platformFont,
      pair.actual.platformFont,
    );
  }

  const expectedBox = pair.expected.box;
  const actualBox = pair.actual.box;
  if (expectedBox === null && actualBox === null) return;
  if (expectedBox === null || actualBox === null) {
    違いを足す(
      state,
      wait,
      label,
      pair.text,
      pair.occurrence,
      "箱の有無",
      expectedBox === null ? "無し" : "有り",
      actualBox === null ? "無し" : "有り",
    );
    return;
  }
  数を比べる(state, wait, label, pair, "箱.x", expectedBox.x, actualBox.x, origin.x, scale);
  数を比べる(state, wait, label, pair, "箱.y", expectedBox.y, actualBox.y, origin.y, scale);
  大きさを比べる(state, wait, label, pair, "箱.幅", expectedBox.width, actualBox.width, scale);
  大きさを比べる(state, wait, label, pair, "箱.高さ", expectedBox.height, actualBox.height, scale);
  地を比べる(state, wait, label, pair, expectedBox, actualBox);
  同じか比べる(
    state,
    wait,
    label,
    pair,
    "箱の枠の色",
    expectedBox.borderColor,
    actualBox.borderColor,
  );
  太さを比べる(
    state,
    wait,
    label,
    pair,
    "箱の枠の太さ",
    expectedBox.borderWidth,
    actualBox.borderWidth,
    scale,
    線と枠の太さで許す差,
  );
}

function 地を比べる(state, wait, label, pair, expectedBox, actualBox) {
  const expectedKind = expectedBox.fillKind;
  const actualKind = actualBox.fillKind;
  if (expectedKind === "一色" && actualKind === "一色") {
    同じか比べる(state, wait, label, pair, "箱の地の色", expectedBox.fill, actualBox.fill);
    return;
  }
  if (expectedKind === "線形の階調" && actualKind === "線形の階調") {
    同じか比べる(
      state,
      wait,
      label,
      pair,
      "地の始まりの色",
      expectedBox.fillStartColor,
      actualBox.fillStartColor,
    );
    同じか比べる(
      state,
      wait,
      label,
      pair,
      "地の終わりの色",
      expectedBox.fillEndColor,
      actualBox.fillEndColor,
    );
    return;
  }
  const onlyOneDecorated =
    (expectedKind === "一色" && ["線形の階調", "他の階調", "模様"].includes(actualKind)) ||
    (actualKind === "一色" && ["線形の階調", "他の階調", "模様"].includes(expectedKind));
  if (onlyOneDecorated) {
    同じか比べる(state, wait, label, pair, "地の塗り方", expectedKind, actualKind);
  } else {
    測れないを足す(
      state,
      label,
      pair.text,
      pair.occurrence,
      "箱の地の色",
      expectedBox.fill,
      actualBox.fill,
    );
  }
}

function 線を比べる(state, wait, label, expectedLines, actualLines, scale) {
  const expected = expectedLines.map((line) => ({ ...line, width: 丸める(line.width) }));
  const actual = actualLines.map((line) => ({ ...line, width: 丸める(line.width / scale) }));
  const usedActual = new Set();
  const pairs = expected.map((expectedLine) => {
    let match = -1;
    let distance = Number.POSITIVE_INFINITY;
    for (let index = 0; index < actual.length; index += 1) {
      const actualLine = actual[index];
      const candidate = Math.abs(expectedLine.width - actualLine.width);
      if (
        !usedActual.has(index) &&
        expectedLine.stroke === actualLine.stroke &&
        candidate <= 線と枠の太さで許す差 &&
        candidate < distance
      ) {
        match = index;
        distance = candidate;
      }
    }
    if (match >= 0) usedActual.add(match);
    return { expected: expectedLine, actual: match < 0 ? null : actual[match] };
  });
  for (let index = 0; index < actual.length; index += 1) {
    if (!usedActual.has(index)) pairs.push({ expected: null, actual: actual[index] });
  }
  for (const pair of pairs) {
    const expectedCount = pair.expected?.count ?? 0;
    const actualCount = pair.actual?.count ?? 0;
    if (expectedCount === actualCount) continue;
    const stroke = pair.expected?.stroke ?? pair.actual.stroke;
    const width = pair.expected?.width ?? pair.actual.width;
    違いを足す(
      state,
      wait,
      label,
      "線",
      1,
      `線の本数 (${stroke} / ${width})`,
      expectedCount,
      actualCount,
    );
  }
}

function 字なし図形を比べる(state, wait, label, expectedBoxes, actualBoxes, scale) {
  const measurableExpected = expectedBoxes.filter((box) => !box.fillUnmeasurable);
  const measurableActual = actualBoxes.filter((box) => !box.fillUnmeasurable);
  for (const [side, boxes] of [
    ["正解", expectedBoxes],
    ["今", actualBoxes],
  ]) {
    for (const box of boxes.filter((entry) => entry.fillUnmeasurable)) {
      測れないを足す(
        state,
        label,
        "字を持たない図形",
        1,
        `字を持たない図形の地 (${side})`,
        side === "正解" ? box.fill : "—",
        side === "今" ? box.fill : "—",
      );
    }
  }
  const fillKey = (box) =>
    box.fillKind === "線形の階調"
      ? `${box.fillKind}:${box.fillStartColor}:${box.fillEndColor}`
      : `${box.fillKind}:${box.fill}`;
  const group = (boxes, divisor) => {
    const groups = new Map();
    for (const box of boxes) {
      const borderWidth = 丸める(box.borderWidth / divisor);
      const key = `${fillKey(box)}|${box.borderColor}|${borderWidth}`;
      const entry = groups.get(key) ?? {
        fill: fillKey(box),
        borderColor: box.borderColor,
        borderWidth,
        count: 0,
      };
      entry.count += 1;
      groups.set(key, entry);
    }
    return [...groups.values()];
  };
  const expected = group(measurableExpected, 1);
  const actual = group(measurableActual, scale);
  const usedActual = new Set();
  const pairs = expected.map((expectedGroup) => {
    const match = actual.findIndex(
      (actualGroup, index) =>
        !usedActual.has(index) &&
        expectedGroup.fill === actualGroup.fill &&
        expectedGroup.borderColor === actualGroup.borderColor &&
        Math.abs(expectedGroup.borderWidth - actualGroup.borderWidth) <=
          線と枠の太さで許す差,
    );
    if (match >= 0) usedActual.add(match);
    return { expected: expectedGroup, actual: match < 0 ? null : actual[match] };
  });
  for (let index = 0; index < actual.length; index += 1) {
    if (!usedActual.has(index)) pairs.push({ expected: null, actual: actual[index] });
  }
  for (const pair of pairs) {
    const expectedCount = pair.expected?.count ?? 0;
    const actualCount = pair.actual?.count ?? 0;
    if (expectedCount === actualCount) continue;
    const fill = pair.expected?.fill ?? pair.actual.fill;
    const borderColor = pair.expected?.borderColor ?? pair.actual.borderColor;
    const borderWidth = pair.expected?.borderWidth ?? pair.actual.borderWidth;
    違いを足す(
      state,
      wait,
      label,
      "字を持たない図形",
      1,
      `字を持たない図形の数 (${fill} / ${borderColor} / ${borderWidth})`,
      expectedCount,
      actualCount,
    );
  }
}

function 小さい字なし図形を除く(measurement, scale) {
  const unlabeledBoxes = measurement.unlabeledBoxes.filter(
    (box) => (box.width / scale) * (box.height / scale) >= 字を持たない図形の最小面積,
  );
  const keptIds = new Set(unlabeledBoxes.map((box) => box.id));
  const removedIds = new Set(
    measurement.unlabeledBoxes.filter((box) => !keptIds.has(box.id)).map((box) => box.id),
  );
  return {
    ...measurement,
    boxes: measurement.boxes.filter((box) => !removedIds.has(box.id)),
    unlabeledBoxes,
    elements: measurement.elements.filter(
      (element) => element.kind !== "box" || !removedIds.has(element.id),
    ),
  };
}

function 含む(outer, inner) {
  return (
    outer.x <= inner.x &&
    outer.y <= inner.y &&
    outer.x + outer.width >= inner.x + inner.width &&
    outer.y + outer.height >= inner.y + inner.height
  );
}

function 交わる(a, b) {
  return (
    Math.min(a.x + a.width, b.x + b.width) > Math.max(a.x, b.x) &&
    Math.min(a.y + a.height, b.y + b.height) > Math.max(a.y, b.y)
  );
}

function 崩れを調べる(actual) {
  const overlaps = [];
  for (let i = 0; i < actual.boxes.length; i += 1) {
    for (let j = i + 1; j < actual.boxes.length; j += 1) {
      const a = actual.boxes[i];
      const b = actual.boxes[j];
      if (交わる(a, b) && !含む(a, b) && !含む(b, a)) {
        overlaps.push({ first: a.id, second: b.id });
      }
    }
  }

  const overflows = [];
  for (const text of actual.texts) {
    if (text.box === null) continue;
    const box = text.box;
    const amount = Math.max(
      box.x - text.x,
      box.y - text.y,
      text.x + text.width - (box.x + box.width),
      text.y + text.height - (box.y + box.height),
    );
    if (amount > 1) overflows.push({ text: text.text, box: box.id, amount: 丸める(amount) });
  }

  const outside = [];
  const bounds = actual.bounds;
  for (const element of actual.elements) {
    const amount = Math.max(
      bounds.x - element.x,
      bounds.y - element.y,
      element.x + element.width - (bounds.x + bounds.width),
      element.y + element.height - (bounds.y + bounds.height),
    );
    if (amount > 0) outside.push({ kind: element.kind, id: element.id, amount: 丸める(amount) });
  }

  return {
    count: overlaps.length + overflows.length + outside.length,
    overlaps,
    textOverflows: overflows,
    outside,
  };
}

function 一つを比べる(label, expected, actual, wait) {
  const matching = 組にする(expected.texts, actual.texts);
  const countedExpected = 小さい字なし図形を除く(expected, 1);
  const countedActual = 小さい字なし図形を除く(actual, matching.overallScale);
  const state = { differences: [], unmeasurable: [], cdlWait: [] };
  if (Math.abs(matching.overallScale - 1) > 0.01) {
    違いを足す(
      state,
      wait,
      label,
      "図全体",
      1,
      "全体の倍率",
      1,
      matching.overallScale,
    );
  }
  for (const pair of matching.pairs) {
    字と箱を比べる(
      state,
      wait,
      label,
      pair,
      matching.origin,
      matching.overallScale,
    );
  }
  for (const missing of matching.missing) {
    違いを足す(
      state,
      wait,
      label,
      missing.text,
      missing.occurrence,
      "字の有無",
      missing.side === "expected" ? "無し" : "有り",
      missing.side === "actual" ? "無し" : "有り",
    );
  }
  線を比べる(state, wait, label, expected.lines, actual.lines, matching.overallScale);
  字なし図形を比べる(
    state,
    wait,
    label,
    countedExpected.unlabeledBoxes,
    countedActual.unlabeledBoxes,
    matching.overallScale,
  );
  const layout = 崩れを調べる(countedActual);
  return {
    label,
    overallScale: matching.overallScale,
    originDelta: matching.origin,
    differenceCount: state.differences.length,
    unmeasurableCount: state.unmeasurable.length,
    cdlWaitCount: state.cdlWait.length,
    differences: state.differences,
    unmeasurable: state.unmeasurable,
    cdlWait: state.cdlWait,
    layout,
    measurements: { expected: countedExpected, actual: countedActual },
  };
}

function tableValue(value) {
  return String(value ?? "—").replaceAll("|", "\\|").replaceAll("\n", " ");
}

function 結果の表(result) {
  const lines = [
    "# 図の違い",
    "",
    "## 意匠ごとのまとめ",
    "",
    "| 意匠 | 違い | 測れない | cdl 待ち | 崩れ |",
    "|---|---:|---:|---:|---:|",
    ...result.comparisons.map(
      (comparison) =>
        `| ${tableValue(comparison.label)} | ${comparison.differenceCount} | ${comparison.unmeasurableCount} | ${comparison.cdlWaitCount} | ${comparison.layout.count} |`,
    ),
    `| 合計 | ${result.differenceCount} | ${result.unmeasurableCount} | ${result.cdlWaitCount} | ${result.layoutCount} |`,
    "",
    "## 項目ごとの違い",
    "",
  ];
  const labels = result.comparisons.map((comparison) => comparison.label);
  const items = [
    ...new Set(result.comparisons.flatMap((comparison) => comparison.differences.map((row) => row.item))),
  ].sort();
  lines.push(
    `| 項目 | ${labels.map(tableValue).join(" | ")} | 合計 |`,
    `|---|${labels.map(() => "---:").join("|")}|---:|`,
  );
  if (items.length === 0) {
    lines.push(`| — | ${labels.map(() => "0").join(" | ")} | 0 |`);
  } else {
    for (const item of items) {
      const counts = result.comparisons.map(
        (comparison) => comparison.differences.filter((row) => row.item === item).length,
      );
      lines.push(
        `| ${tableValue(item)} | ${counts.join(" | ")} | ${counts.reduce((sum, count) => sum + count, 0)} |`,
      );
    }
  }
  lines.push("");
  for (const comparison of result.comparisons) {
    lines.push(`## ${comparison.label}`, "");
    lines.push(
      `全体の倍率は ${comparison.overallScale}。`,
      `原点の差は x = ${comparison.originDelta.x}、y = ${comparison.originDelta.y}。`,
      "",
      "| 字 | 項目 | 正解の値 | 今の値 | 判定 | 理由 / cdl の課題 |",
      "|---|---|---:|---:|---|---|",
    );
    const rows = [
      ...comparison.differences,
      ...comparison.unmeasurable,
      ...comparison.cdlWait,
    ];
    if (rows.length === 0) {
      lines.push("| — | — | — | — | 一致 | — |");
    } else {
      for (const row of rows) {
        const note = [row.reason, row.cdlIssue].filter(Boolean).join(" / ");
        const occurrence = row.occurrence > 1 ? ` (${row.occurrence})` : "";
        lines.push(
          `| ${tableValue(row.text)}${occurrence} | ${tableValue(row.item)} | ${tableValue(row.expected)} | ${tableValue(row.actual)} | ${row.status} | ${tableValue(note)} |`,
        );
      }
    }
    lines.push(
      "",
      `崩れは ${comparison.layout.count} 件 (重なり ${comparison.layout.overlaps.length}、字のはみ出し ${comparison.layout.textOverflows.length}、枠の外 ${comparison.layout.outside.length})。`,
      "",
    );
  }
  return `${lines.join("\n")}\n`;
}

async function cdl待ちを読む(waitPath) {
  if (waitPath === undefined) return [];
  const parsed = JSON.parse(await readFile(waitPath, "utf8"));
  if (!Array.isArray(parsed)) throw new Error("cdl-wait.json は項目の配列にしてください");
  return parsed;
}

export async function measureConfig(config, options = {}) {
  const comparisons = 比較一覧(config);
  const wait = options.cdlWait ?? [];
  const browser = await chromium.launch();
  const results = [];
  try {
    for (const comparison of comparisons) {
      const expectedPage = await browser.newPage({ viewport: { width: 1800, height: 1400 }, deviceScaleFactor: 1 });
      const actualPage = await browser.newPage({ viewport: { width: 1800, height: 1400 }, deviceScaleFactor: 1 });
      try {
        const expectedSource = sourceのpathを整える(comparison.expected);
        const actualSource = sourceのpathを整える(comparison.actual);
        const expectedOpened = await 図を開く(expectedPage, expectedSource);
        const actualOpened = await 図を開く(actualPage, actualSource);
        const expected = await 図を測る(expectedPage, expectedOpened, expectedSource);
        const actual = await 図を測る(actualPage, actualOpened, actualSource);
        results.push(一つを比べる(comparison.label, expected, actual, wait));
      } finally {
        await expectedPage.close();
        await actualPage.close();
      }
    }
  } finally {
    await browser.close();
  }

  return {
    version: 2,
    differenceCount: results.reduce((sum, entry) => sum + entry.differenceCount, 0),
    unmeasurableCount: results.reduce((sum, entry) => sum + entry.unmeasurableCount, 0),
    cdlWaitCount: results.reduce((sum, entry) => sum + entry.cdlWaitCount, 0),
    layoutCount: results.reduce((sum, entry) => sum + entry.layout.count, 0),
    comparisons: results,
  };
}

function 引数を読む(argv) {
  const configPath = argv[0];
  let output;
  let waitPath;
  for (let index = 1; index < argv.length; index += 1) {
    if (argv[index] === "-o" || argv[index] === "--output") output = argv[++index];
    else if (argv[index] === "--cdl-wait") waitPath = argv[++index];
    else throw new Error(`不明な引数です: ${argv[index]}`);
  }
  if (configPath === undefined || output === undefined) {
    throw new Error("使い方: measure.mjs <設定.json> -o <出力 dir> [--cdl-wait <file>]");
  }
  return { configPath: path.resolve(configPath), output: path.resolve(output), waitPath };
}

async function main() {
  const args = 引数を読む(process.argv.slice(2));
  const config = JSON.parse(await readFile(args.configPath, "utf8"));
  const explicit = args.waitPath ?? config.cdlWait;
  let waitPath = explicit === undefined ? path.join(path.dirname(args.output), "cdl-wait.json") : path.resolve(explicit);
  try {
    await access(waitPath);
  } catch {
    if (explicit !== undefined) throw new Error(`cdl-wait.json がありません: ${waitPath}`);
    waitPath = undefined;
  }
  const result = await measureConfig(config, { cdlWait: await cdl待ちを読む(waitPath) });
  await mkdir(args.output, { recursive: true });
  await writeFile(path.join(args.output, "result.json"), `${JSON.stringify(result, null, 2)}\n`, "utf8");
  await writeFile(path.join(args.output, "diffs.md"), 結果の表(result), "utf8");
  console.log(
    `違い ${result.differenceCount} / 測れない ${result.unmeasurableCount} / cdl 待ち ${result.cdlWaitCount} / 崩れ ${result.layoutCount}`,
  );
}

if (process.argv[1] !== undefined && pathToFileURL(path.resolve(process.argv[1])).href === import.meta.url) {
  main().catch((error) => {
    console.error(`measure: ${error instanceof Error ? error.message : String(error)}`);
    process.exitCode = 1;
  });
}
