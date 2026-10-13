// @vitest-environment node
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import {
  noteの値を読む,
  一覧を判定する,
  一覧の誤り,
  一覧を検証する,
  接続の許容距離,
  矢じりの接触距離,
  矢じりの最大距離,
} from "../../../../.claude/skills/dragon-match/scripts/checklist.mjs";
import {
  印の最遠点,
  type 印の測定値,
} from "../../../../.claude/skills/dragon-match/scripts/marker.mjs";
import { 比較一覧 } from "../../../../.claude/skills/dragon-match/scripts/source.mjs";

type Box = {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  fill: string;
  borderColor: string;
};

const notes = fileURLToPath(
  new URL("../../tests/fixtures/figure-match/notes/", import.meta.url),
);

function box(id: string, x: number, fill = "#e3e9ea", borderColor = "#143a52"): Box {
  return { id, x, y: 20, width: 80, height: 50, fill, borderColor };
}

function text(value: string, target: Box) {
  return {
    text: value,
    x: target.x + 10,
    y: target.y + 12,
    width: 40,
    height: 18,
    color: "#143a52",
    box: target,
  };
}

function measurement(options: {
  boxes?: Box[];
  lines?: { from: { x: number; y: number }; to: { x: number; y: number } }[];
  texts?: ReturnType<typeof text>[];
} = {}) {
  const boxes = options.boxes ?? [box("受付", 0), box("仕分け", 110), box("配達", 220)];
  const texts = options.texts ?? boxes.map((entry) => text(entry.id, entry));
  const lines = options.lines ?? [
    { from: { x: 80, y: 45 }, to: { x: 110, y: 45 } },
    { from: { x: 190, y: 45 }, to: { x: 220, y: 45 } },
  ];
  return {
    bounds: { x: 0, y: 0, width: 320, height: 100 },
    boxes,
    texts,
    lines,
    elements: [
      ...boxes.map((entry) => ({ kind: "box", ...entry })),
      ...texts.map((entry, index) => ({
        kind: "text",
        id: `text-${index}`,
        x: entry.x,
        y: entry.y,
        width: entry.width,
        height: entry.height,
      })),
    ],
  };
}

function checklist(item: Record<string, unknown>) {
  return { version: 1, items: [item] };
}

function marker(overrides: Partial<印の測定値> = {}): 印の測定値 {
  return {
    position: "end",
    endpoint: { x: 100, y: 141 },
    oppositeEndpoint: { x: 100, y: 80 },
    tangentAngle: 90,
    points: [{ x: 19, y: 0 }],
    viewBox: { x: 0, y: -5, width: 19, height: 10 },
    refX: 0,
    refY: 0,
    markerWidth: 9.5,
    markerHeight: 5,
    markerUnits: "strokeWidth",
    strokeWidth: 2,
    preserveAspectRatio: "xMidYMid meet",
    orient: "angle",
    angle: 90,
    matrix: { a: 1, b: 0, c: 0, d: 1, e: 0, f: 0 },
    ...overrides,
  };
}

function judged(item: Record<string, unknown>, value = measurement(), note: Map<string, string> | null = null) {
  const result = 一覧を判定する(checklist(item), value, note).items[0];
  if (result === undefined) throw new Error("一覧の項目が判定されていません");
  return result;
}

describe("図の合わせる一覧", () => {
  it("字は全てあれば合い、足りなければ合わない", () => {
    const item = { 名: "工程が揃う", 種類: "字", 字: ["受付", "仕分け", "配達"] };
    expect(judged(item).status).toBe("合う");
    expect(judged(item, measurement({ texts: measurement().texts.slice(0, 2) }))).toMatchObject({
      status: "合わない",
      missing: ["配達"],
    });
  });

  it("並びは中心が指定方向へ順にあれば合い、逆なら合わない", () => {
    const item = {
      名: "工程が左から順",
      種類: "並び",
      向き: "横",
      字: ["受付", "仕分け", "配達"],
    };
    expect(judged(item).status).toBe("合う");
    const reversed = [box("受付", 220), box("仕分け", 110), box("配達", 0)];
    expect(judged(item, measurement({ boxes: reversed })).status).toBe("合わない");
  });

  it("つながりは両端が字の箱へ接すれば合い、離れていれば合わない", () => {
    const item = { 名: "受付から仕分け", 種類: "つながり", から: "受付", へ: "仕分け" };
    expect(judged(item).status).toBe("合う");
    expect(
      judged(item, measurement({ lines: [{ from: { x: 90, y: 90 }, to: { x: 210, y: 90 } }] })).status,
    ).toBe("合わない");
    expect(接続の許容距離).toBe(8);
  });

  it("箱の下に隠れる線でも端が箱の中ならつながる", () => {
    const item = { 名: "受付から配達", 種類: "つながり", から: "受付", へ: "配達" };
    const underBoxes = measurement({
      lines: [{ from: { x: 40, y: 45 }, to: { x: 260, y: 45 } }],
    });
    expect(judged(item, underBoxes).status).toBe("合う");
  });

  it("線端から 19 離れた矢じりの先を線端としてつながりを判定する", () => {
    const from = box("受付", 0);
    const to = box("仕分け", 300);
    const item = { 名: "受付から仕分け", 種類: "つながり", から: "受付", へ: "仕分け" };
    const texts = [text("受付", from), text("仕分け", to)];
    const before = measurement({
      boxes: [from, to],
      texts,
      lines: [{ from: { x: 80, y: 45 }, to: { x: 281, y: 45 } }],
    });
    const after = measurement({
      boxes: [from, to],
      texts,
      lines: [{ from: { x: 80, y: 45 }, to: { x: 300, y: 45 } }],
    });

    expect(judged(item, before).status).toBe("合わない");
    expect(judged(item, after).status).toBe("合う");
    expect(矢じりの接触距離).toBe(1);
    expect(矢じりの最大距離).toBe(24);
  });

  it("markerUnits と orient から印の最遠点を求める", () => {
    expect(印の最遠点(marker())).toEqual({ x: 100, y: 160 });
    expect(
      印の最遠点(
        marker({
          position: "start",
          endpoint: { x: 360, y: 99 },
          oppositeEndpoint: { x: 360, y: 160 },
          points: [{ x: -19, y: 0 }],
          viewBox: { x: -19, y: -5, width: 19, height: 10 },
          markerWidth: 19,
          markerHeight: 10,
          markerUnits: "userSpaceOnUse",
          orient: "auto",
        }),
      ),
    ).toEqual({ x: 360, y: 80 });
    expect(
      印の最遠点(
        marker({
          position: "start",
          endpoint: { x: 19, y: 0 },
          oppositeEndpoint: { x: 100, y: 0 },
          tangentAngle: 0,
          markerWidth: 19,
          markerHeight: 10,
          markerUnits: "userSpaceOnUse",
          orient: "auto-start-reverse",
        }),
      ),
    ).toEqual({ x: 0, y: 0 });
  });

  it("印の点のうち線端の外向きに最も出る先を線端にする", () => {
    const horizontalEnd = {
      ...marker({
        endpoint: { x: 437, y: 428 },
        tangentAngle: 0,
        points: [
          { x: 0, y: 0 },
          { x: 10, y: 5 },
          { x: 0, y: 10 },
          { x: 0, y: 0 },
        ],
        viewBox: { x: 0, y: 0, width: 10, height: 10 },
        refX: 9,
        refY: 5,
        markerWidth: 14,
        markerHeight: 14,
        markerUnits: "userSpaceOnUse",
        orient: "auto-start-reverse",
      }),
      oppositeEndpoint: { x: 145, y: 428 },
    };
    const scaledAroundReference = {
      ...horizontalEnd,
      points: [
        { x: -9, y: -5 },
        { x: 11, y: 5 },
        { x: -9, y: 15 },
        { x: -9, y: -5 },
      ],
    };
    const horizontalStart = {
      ...horizontalEnd,
      position: "start" as const,
      endpoint: { x: 161, y: 190 },
      oppositeEndpoint: { x: 300, y: 190 },
    };

    expect(印の最遠点(horizontalEnd)).toEqual({ x: 438.4, y: 428 });
    expect(印の最遠点(scaledAroundReference)).toEqual({ x: 439.8, y: 428 });
    expect(印の最遠点(horizontalStart)).toEqual({ x: 159.6, y: 190 });
    expect(印の最遠点({ ...horizontalEnd, points: [{ x: 0, y: 0 }] })).toEqual({
      x: 437,
      y: 428,
    });
  });

  it("曲がった線では反対端から遠い根元の角でなく終端方向へ出る印の先を選ぶ", () => {
    expect(
      印の最遠点(
        marker({
          endpoint: { x: 472, y: 268.977 },
          oppositeEndpoint: { x: 872, y: 219.946 },
          tangentAngle: 90,
          points: [
            { x: 0, y: 0 },
            { x: 5, y: 8.12 },
            { x: 10, y: 0 },
          ],
          viewBox: { x: 0, y: 0, width: 10, height: 10 },
          refX: 5,
          refY: 0,
          markerWidth: 10,
          markerHeight: 10,
          markerUnits: "userSpaceOnUse",
          orient: "angle",
          angle: 0,
        }),
      ),
    ).toEqual({ x: 472, y: 277.097 });
  });

  it("箱の上の外にある名前へ箱が結び付けばつながりと枠の色が合う", () => {
    const from = box("受付", 0);
    const to = box("仕分け", 110);
    const outsideTexts = [
      { ...text("受付", from), y: 1, box: from, boxRelation: "nearby" },
      { ...text("仕分け", to), y: 1, box: to, boxRelation: "nearby" },
    ];
    const value = measurement({ boxes: [from, to], texts: outsideTexts });
    const connection = {
      名: "受付から仕分け",
      種類: "つながり",
      から: "受付",
      へ: "仕分け",
    };
    const border = { 名: "受付の枠", 種類: "色", 字: "受付", 部分: "枠", 役: "枠" };
    const blueprint = noteの値を読む(readFileSync(`${notes}/blueprint/note.md`, "utf8"));

    expect(judged(connection, value).status).toBe("合う");
    expect(judged(border, value, blueprint).status).toBe("合う");
  });

  it("色は note.md の役の値と合えば合い、違えば合わない", () => {
    const item = { 名: "受付の地", 種類: "色", 字: "受付", 部分: "地", 役: "行の面" };
    const blueprint = noteの値を読む(readFileSync(`${notes}/blueprint/note.md`, "utf8"));
    const letterpress = noteの値を読む(readFileSync(`${notes}/letterpress/note.md`, "utf8"));
    expect(judged(item, measurement(), blueprint).status).toBe("合う");
    expect(judged(item, measurement(), letterpress).status).toBe("合わない");

    const letterpressBoxes = [
      box("受付", 0, "#f0eadc", "#1a1510"),
      box("仕分け", 110, "#f0eadc", "#1a1510"),
      box("配達", 220, "#f0eadc", "#1a1510"),
    ];
    expect(judged(item, measurement({ boxes: letterpressBoxes }), letterpress).status).toBe("合う");
  });

  it("両側が HTML で actual だけ palette を持つ時はその意匠の note.md で色を判定する", () => {
    const [comparison] = 比較一覧({
      comparisons: [
        {
          label: "図面",
          expected: { type: "html", path: "expected.html" },
          actual: { type: "html", path: "actual.html", palette: "blueprint" },
        },
      ],
    });
    expect(comparison).toMatchObject({ label: "図面", palette: "blueprint" });
    if (comparison === undefined || comparison.palette === null) {
      throw new Error("actual の palette が比較に渡っていません");
    }
    const note = noteの値を読む(
      readFileSync(`${notes}/${comparison.palette}/note.md`, "utf8"),
    );
    const result = 一覧を判定する(
      checklist({ 名: "受付の地", 種類: "色", 字: "受付", 部分: "地", 役: "行の面" }),
      measurement(),
      note,
    );

    expect(result.items[0]).toMatchObject({ name: "受付の地", status: "合う" });
  });

  it("色の役は配列の先頭から note.md にある役を使う", () => {
    const value = measurement({
      texts: measurement().texts.map((entry) =>
        entry.text === "受付" ? { ...entry, color: "#efe7d8" } : entry,
      ),
    });
    const note = new Map([
      ["地の字", "#efe7d8"],
      ["字", "#1d242e"],
    ]);

    expect(
      judged({ 名: "受付の字", 種類: "色", 字: "受付", 部分: "字", 役: ["地の字", "字"] }, value, note),
    ).toMatchObject({ status: "合う" });
    expect(
      judged({ 名: "受付の字", 種類: "色", 字: "受付", 部分: "字", 役: ["無い役", "字"] }, value, note),
    ).toMatchObject({ status: "合わない", expected: "#1d242e" });
    expect(
      judged({ 名: "受付の字", 種類: "色", 字: "受付", 部分: "字", 役: ["無い役", "別の役"] }, value, note),
    ).toMatchObject({ status: "測れない" });
  });

  it("色の役は空の配列を受け付けない", () => {
    expect(() =>
      一覧を検証する(checklist({ 名: "受付の字", 種類: "色", 字: "受付", 部分: "字", 役: [] })),
    ).toThrow("空でない字の配列");
  });

  it("note.md が無い意匠の色は測れない", () => {
    const item = { 名: "受付の地", 種類: "色", 字: "受付", 部分: "地", 役: "行の面" };
    expect(judged(item).status).toBe("測れない");
  });

  it("崩れは 0 件なら合い、箱が重なると合わない", () => {
    const item = { 名: "工程が揃う", 種類: "字", 字: ["受付"] };
    const clean = 一覧を判定する(checklist(item), measurement());
    expect(clean.items.at(-1)).toMatchObject({ name: "崩れ", status: "合う" });

    const overlapping = [box("受付", 0), box("仕分け", 60), box("配達", 220)];
    const broken = 一覧を判定する(checklist(item), measurement({ boxes: overlapping }));
    expect(broken.items.at(-1)).toMatchObject({ name: "崩れ", status: "合わない" });
    expect(broken.layout.overlaps).toHaveLength(1);
  });

  it("cdl待ちの項目は合わない時だけ cdl 待ちになる", () => {
    const item = {
      名: "受付から仕分け",
      種類: "つながり",
      から: "受付",
      へ: "仕分け",
      cdl待ち: { 理由: "線が箱の上に出ない", "cdl の課題": "cardene777/cdl#1226" },
    };
    expect(judged(item).status).toBe("合う");
    expect(judged(item, measurement({ lines: [] }))).toMatchObject({
      status: "cdl 待ち",
      cdl待ち: { "cdl の課題": "cardene777/cdl#1226" },
    });
  });

  it("正解の側で合わない項目を一覧の誤りにする", () => {
    const item = { 名: "工程が揃う", 種類: "字", 字: ["受付", "無い工程"] };
    const expected = 一覧を判定する(checklist(item), measurement());
    expect(一覧の誤り([{ label: "図面", items: expected.items }])).toEqual([
      expect.objectContaining({ label: "図面", name: "工程が揃う", status: "合わない" }),
    ]);
  });

  it("version が数値の 1 でなければ止まる", () => {
    expect(() => 一覧を検証する({ version: "1", items: [] })).toThrow(
      "version は数値の 1",
    );
  });

  it("note.md の同じ役の色が違う時は色と行番号を出して止まる", () => {
    expect(() =>
      noteの値を読む(`## 値

| 役 | 値 |
|---|---|
| 枠 | \`#111111\` |
| 枠 | \`#222222\` |`),
    ).toThrow(
      "note.md の役「枠」が ## 値で違う色です: #111111（5行目） / #222222（6行目）",
    );
  });

  it("note.md の同じ役が同じ色なら 2 行とも読む", () => {
    expect(
      noteの値を読む(`## 値

| 役 | 値 |
|---|---|
| 字 | \`#F3EEFE\` |

### 図表

| 役 | 値 |
|---|---|
| 字 | \`#f3eefe\`。中身の字、図表の系列 6 |`),
    ).toEqual(new Map([["字", "#f3eefe"]]));
  });

  it("note.md の色に「。」で始まる説明が続いても値として読む", () => {
    expect(
      noteの値を読む(`## 値

| 役 | 値 |
|---|---|
| 地の字 | \`#EFE7D8\`。台の上の字 |`),
    ).toEqual(new Map([["地の字", "#efe7d8"]]));
  });

  it("note.md の値に色が 2 つあれば読まない", () => {
    expect(
      noteの値を読む(`## 値

| 役 | 値 |
|---|---|
| 札 | \`#111111\`。通常はこの色、強調は \`#222222\` |`),
    ).toEqual(new Map());
  });

  it("note.md の説明付きの値で同じ役が 2 行あれば止まる", () => {
    expect(() =>
      noteの値を読む(`## 値

| 役 | 値 |
|---|---|
| 枠 | \`#111111\`。通常の枠 |
| 枠 | \`#222222\`。強調の枠 |`),
    ).toThrow("役「枠」");
  });
});
