const 接続の許容距離 = 8;
const 矢じりの接触距離 = 1;
const 矢じりの最大距離 = 24;
const 判定値 = new Set(["合う", "合わない", "測れない", "cdl 待ち"]);
const 項目の種類 = new Set(["字", "並び", "つながり", "色"]);

function 丸める(value) {
  return Math.round(value * 1000) / 1000;
}

function 必須の字(value, name) {
  if (typeof value !== "string" || value.trim() === "") {
    throw new Error(`${name} を字で指定してください`);
  }
  return value;
}

function 字の一覧(value, name) {
  if (!Array.isArray(value) || value.length === 0 || !value.every((entry) => typeof entry === "string" && entry !== "")) {
    throw new Error(`${name} を空でない字の配列にしてください`);
  }
  return value;
}

function 役の一覧(value, name) {
  if (typeof value === "string") return [必須の字(value, name)];
  return 字の一覧(value, name);
}

export function 一覧を検証する(checklist) {
  if (checklist?.version !== 1) {
    throw new Error("合わせる一覧の version は数値の 1 にしてください");
  }
  if (!Array.isArray(checklist.items)) {
    throw new Error("合わせる一覧の items は配列にしてください");
  }
  checklist.items.forEach((item, index) => {
    const prefix = `items[${index}]`;
    必須の字(item?.名, `${prefix}.名`);
    if (!項目の種類.has(item?.種類)) {
      throw new Error(`${prefix}.種類は字・並び・つながり・色のいずれかにしてください`);
    }
    if (item.種類 === "字") 字の一覧(item.字, `${prefix}.字`);
    if (item.種類 === "並び") {
      字の一覧(item.字, `${prefix}.字`);
      if (item.向き !== "横" && item.向き !== "縦") {
        throw new Error(`${prefix}.向きは横または縦にしてください`);
      }
    }
    if (item.種類 === "つながり") {
      必須の字(item.から, `${prefix}.から`);
      必須の字(item.へ, `${prefix}.へ`);
    }
    if (item.種類 === "色") {
      必須の字(item.字, `${prefix}.字`);
      if (!new Set(["地", "枠", "字"]).has(item.部分)) {
        throw new Error(`${prefix}.部分は地・枠・字のいずれかにしてください`);
      }
      役の一覧(item.役, `${prefix}.役`);
    }
    if (item.cdl待ち !== undefined) {
      必須の字(item.cdl待ち?.理由, `${prefix}.cdl待ち.理由`);
      必須の字(item.cdl待ち?.["cdl の課題"], `${prefix}.cdl待ち.cdl の課題`);
    }
  });
  return checklist;
}

function 表のセル(line) {
  const trimmed = line.trim();
  if (!trimmed.startsWith("|") || !trimmed.endsWith("|")) return null;
  return trimmed.slice(1, -1).split("|").map((cell) => cell.trim());
}

export function noteの値を読む(note) {
  const lines = String(note).split(/\r?\n/);
  const start = lines.findIndex((line) => /^##\s+値\s*$/.test(line.trim()));
  if (start < 0) return new Map();
  const endOffset = lines.slice(start + 1).findIndex((line) => /^##\s+/.test(line.trim()));
  const section = lines.slice(start + 1, endOffset < 0 ? undefined : start + 1 + endOffset);
  const values = new Map();
  const occurrences = new Map();
  for (let index = 0; index < section.length; index += 1) {
    const header = 表のセル(section[index]);
    const divider = 表のセル(section[index + 1] ?? "");
    if (header === null || divider === null) continue;
    const roleIndex = header.indexOf("役");
    const valueIndex = header.indexOf("値");
    if (roleIndex < 0 || valueIndex < 0 || !divider.every((cell) => /^:?-{3,}:?$/.test(cell))) {
      continue;
    }
    index += 2;
    while (index < section.length) {
      const row = 表のセル(section[index]);
      if (row === null) {
        index -= 1;
        break;
      }
      const role = row[roleIndex]?.trim() ?? "";
      const value = row[valueIndex] ?? "";
      const colors = value.match(/#[\da-fA-F]{6}/g) ?? [];
      const color = colors.length === 1
        ? value.match(/^`(#[\da-fA-F]{6})`(?:。.*)?$/)?.[1]?.toLowerCase()
        : undefined;
      if (role !== "" && color !== undefined) {
        const line = start + index + 2;
        const previous = occurrences.get(role);
        if (previous !== undefined && previous.color !== color) {
          const previousLines = previous.lines.map((entry) => `${entry}行目`).join("、");
          throw new Error(
            `note.md の役「${role}」が ## 値で違う色です: ${previous.color}（${previousLines}） / ${color}（${line}行目）`,
          );
        }
        if (previous === undefined) {
          values.set(role, color);
          occurrences.set(role, { color, lines: [line] });
        } else {
          previous.lines.push(line);
        }
      }
      index += 1;
    }
  }
  return values;
}

function 同じ字(measurement, text) {
  return measurement.texts.filter((entry) => entry.text === text);
}

function 無い字(measurement, texts) {
  return texts.filter((text) => 同じ字(measurement, text).length === 0);
}

function 中心(entry) {
  return { x: entry.x + entry.width / 2, y: entry.y + entry.height / 2 };
}

function 箱までの距離(point, box) {
  const dx = Math.max(box.x - point.x, 0, point.x - (box.x + box.width));
  const dy = Math.max(box.y - point.y, 0, point.y - (box.y + box.height));
  return Math.hypot(dx, dy);
}

function 色を整える(value) {
  if (typeof value !== "string") return null;
  const hex = value.trim().toLowerCase();
  if (/^#[\da-f]{6}$/.test(hex)) return hex;
  const rgb = hex.match(/^rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)(?:\s*,\s*([\d.]+))?\s*\)$/);
  if (rgb === null || (rgb[4] !== undefined && Number(rgb[4]) !== 1)) return hex;
  return `#${rgb.slice(1, 4).map((part) => Number(part).toString(16).padStart(2, "0")).join("")}`;
}

function 合わない(item, actual, extra = {}) {
  const wait = item.cdl待ち;
  if (wait !== undefined) {
    return {
      status: "cdl 待ち",
      actual,
      cdl待ち: { 理由: wait.理由, "cdl の課題": wait["cdl の課題"] },
      ...extra,
    };
  }
  return { status: "合わない", actual, ...extra };
}

function 字を判定する(item, measurement) {
  const missing = 無い字(measurement, item.字);
  return missing.length === 0
    ? { status: "合う" }
    : 合わない(item, `無い字: ${missing.join("、")}`, { missing });
}

function 並びを判定する(item, measurement) {
  const missing = 無い字(measurement, item.字);
  if (missing.length > 0) return 合わない(item, `無い字: ${missing.join("、")}`, { missing });
  const axis = item.向き === "横" ? "x" : "y";
  const centers = item.字.map((text) => ({ text, value: 丸める(中心(同じ字(measurement, text)[0])[axis]) }));
  const ordered = centers.every((entry, index) => index === 0 || centers[index - 1].value < entry.value);
  return ordered
    ? { status: "合う" }
    : 合わない(item, centers.map((entry) => `${entry.text}=${entry.value}`).join("、"));
}

function つながりを判定する(item, measurement) {
  const missing = 無い字(measurement, [item.から, item.へ]);
  if (missing.length > 0) return 合わない(item, `無い字: ${missing.join("、")}`, { missing });
  const fromBoxes = 同じ字(measurement, item.から).map((entry) => entry.box).filter(Boolean);
  const toBoxes = 同じ字(measurement, item.へ).map((entry) => entry.box).filter(Boolean);
  if (fromBoxes.length === 0 || toBoxes.length === 0) {
    const noBox = [fromBoxes.length === 0 ? item.から : null, toBoxes.length === 0 ? item.へ : null].filter(Boolean);
    return 合わない(item, `箱が無い字: ${noBox.join("、")}`);
  }
  const connected = measurement.lines.some((line) =>
    fromBoxes.some((from) => 箱までの距離(line.from, from) <= 接続の許容距離) &&
    toBoxes.some((to) => 箱までの距離(line.to, to) <= 接続の許容距離));
  return connected ? { status: "合う" } : 合わない(item, "接する線: 0");
}

function 色を判定する(item, measurement, noteValues) {
  const matches = 同じ字(measurement, item.字);
  if (matches.length === 0) return 合わない(item, `無い字: ${item.字}`, { missing: [item.字] });
  if (noteValues === null) return { status: "測れない", actual: "意匠の note.md が無い" };
  const roles = 役の一覧(item.役, "色の項目.役");
  const role = roles.find((entry) => noteValues.has(entry));
  if (role === undefined) {
    return { status: "測れない", actual: `役「${roles.join("、")}」の色が無い` };
  }
  const expected = noteValues.get(role);
  const text = matches[0];
  const raw = item.部分 === "字" ? text.color : item.部分 === "地" ? text.box?.fill : text.box?.borderColor;
  if (raw === undefined || raw === null) return 合わない(item, `${item.部分}の値が無い`);
  const actual = 色を整える(raw);
  return actual === expected ? { status: "合う" } : 合わない(item, actual ?? String(raw), { expected });
}

function 含む(outer, inner) {
  return outer.x <= inner.x && outer.y <= inner.y &&
    outer.x + outer.width >= inner.x + inner.width &&
    outer.y + outer.height >= inner.y + inner.height;
}

function 交わる(a, b) {
  return Math.min(a.x + a.width, b.x + b.width) > Math.max(a.x, b.x) &&
    Math.min(a.y + a.height, b.y + b.height) > Math.max(a.y, b.y);
}

export function 崩れを調べる(measurement) {
  const overlaps = [];
  for (let first = 0; first < measurement.boxes.length; first += 1) {
    for (let second = first + 1; second < measurement.boxes.length; second += 1) {
      const a = measurement.boxes[first];
      const b = measurement.boxes[second];
      if (交わる(a, b) && !含む(a, b) && !含む(b, a)) {
        overlaps.push({ first: a.id, second: b.id });
      }
    }
  }
  const textOverflows = [];
  for (const text of measurement.texts) {
    if (text.box === null || text.boxRelation === "nearby") continue;
    const box = text.box;
    const amount = Math.max(
      box.x - text.x,
      box.y - text.y,
      text.x + text.width - (box.x + box.width),
      text.y + text.height - (box.y + box.height),
    );
    if (amount > 1) textOverflows.push({ text: text.text, box: box.id, amount: 丸める(amount) });
  }
  const outside = [];
  for (const element of measurement.elements) {
    const bounds = measurement.bounds;
    const amount = Math.max(
      bounds.x - element.x,
      bounds.y - element.y,
      element.x + element.width - (bounds.x + bounds.width),
      element.y + element.height - (bounds.y + bounds.height),
    );
    if (amount > 0) outside.push({ kind: element.kind, id: element.id, amount: 丸める(amount) });
  }
  return { count: overlaps.length + textOverflows.length + outside.length, overlaps, textOverflows, outside };
}

function 一項目を判定する(item, measurement, noteValues) {
  if (item.種類 === "字") return 字を判定する(item, measurement);
  if (item.種類 === "並び") return 並びを判定する(item, measurement);
  if (item.種類 === "つながり") return つながりを判定する(item, measurement);
  return 色を判定する(item, measurement, noteValues);
}

export function 一覧を判定する(checklist, measurement, noteValues = null) {
  一覧を検証する(checklist);
  const items = checklist.items.map((item) => ({
    name: item.名,
    type: item.種類,
    ...一項目を判定する(item, measurement, noteValues),
  }));
  const layout = 崩れを調べる(measurement);
  items.push({
    name: "崩れ",
    type: "崩れ",
    status: layout.count === 0 ? "合う" : "合わない",
    ...(layout.count === 0 ? {} : { actual: `重なり ${layout.overlaps.length}・字のはみ出し ${layout.textOverflows.length}・枠の外 ${layout.outside.length}` }),
  });
  if (!items.every((item) => 判定値.has(item.status))) throw new Error("一覧の判定に不明な値があります");
  return { items, layout };
}

export function 一覧の誤り(expectedComparisons) {
  return expectedComparisons.flatMap((comparison) =>
    comparison.items
      .filter((item) => item.status === "合わない")
      .map((item) => ({
        label: comparison.label,
        name: item.name,
        status: item.status,
        actual: item.actual ?? "",
      })),
  );
}

export { 接続の許容距離, 矢じりの接触距離, 矢じりの最大距離 };
