// @vitest-environment jsdom
/**
 * 表どうしの関係の図 (#3618)。
 *
 * 表と項目と、表どうしの結び (1件と何件も) を描き、1つの値がどの表のどの行を辿るかを段ごとに光らせる図。原本の JSON の `kind` は `er`。
 * 表は最初の段より前の `table <名札> as <名前>` で宣言し、次の `table` までの `field <名前>: <値>` がその表の項目になる。
 * 項目の `[key]` は鍵、`[ref: <表>.<項目>]` は結び (多い側から1件の側) になる。表は1つから6つで、書いた順に左から右へ横1列に並ぶ。
 * 段の中の `pick <表>.<項目>` は行と表の枠を光らせ、`<表>.<項目> -> <表>.<項目> [tag: <値>]` は結びの線に沿って値の札を走らせ、
 * `set <表>.<項目>: <値>` は項目の値を書き換え、`note <表>.<項目>: <文>` は項目に式の札を添える。
 * 見た目の元は step 2 で本人が選んだ動く試作の案A (表を横1列に並べ、結びの線で行どうしを繋ぎ、値の札が線を渡る)。
 *
 * 置き場所 (`layout`) と時刻の表 (`timeline`) は描く部品が返す値で確かめ、光り方と値の出方は SVG の keyframes を jsdom で読んで確かめる。
 * 見本の file と表どうしの関係の図の入口がまだ無い間も、この file を読み込んだ所で落とさず、無い物を名指して落とす。
 */
import { execFileSync } from "node:child_process";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { api, type Json, type LineError } from "./diagram-support";
import { motionFrom } from "./motion-support";
import { draw, type Layout, type Rect, type Rendered, type Span } from "./render-support";

const ROOT = process.cwd();
const PACKAGE = join(ROOT, "packages/dragon");
const EXAMPLES = join(PACKAGE, "examples");

/** 表どうしの関係の図の見本 4 枚 (#3618 の「決まっていること」) */
const ER_EXAMPLES = ["order-total", "library-loan", "nft-sale", "token-transfer"] as const;

/** 仮名と漢字 */
const KANA = /[\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Han}]/u;

type Point = [number, number];

/** 表の中の項目の行。`field` は項目の名前 */
interface ErRow extends Rect {
  field: string;
  cy: number;
}

interface ErTable extends Rect {
  id: string;
  name: string;
  rows: ErRow[];
}

/** 結びの線。`from` は結びを書いた項目 (多い側)、`to` は指した項目 (1件の側)。`many` と `one` は線の端の印の所 */
interface ErLink {
  from: string;
  to: string;
  points: Point[];
  many: Point;
  one: Point;
}

interface ErLayout extends Omit<Layout, "boxes"> {
  kind: string;
  tables?: ErTable[];
  links?: ErLink[];
}

interface ErRendered extends Omit<Rendered, "layout"> {
  layout: ErLayout;
}

interface SourceField {
  name: string;
  value: string;
  key?: boolean;
  ref?: string;
}

interface SourceEvent {
  type: string;
  from?: string;
  to?: string;
  field?: string;
  value?: string;
  text?: string;
  carry?: { kind: string; text?: string };
}

interface Source {
  kind: string;
  title: string;
  blocks: { table?: { id: string; name: string; fields: SourceField[] }[] };
  steps: { title: string; events: SourceEvent[] }[];
}

/** 見本の file の中身。無ければ `undefined` */
const fileText = (name: string): string | undefined => {
  const path = join(EXAMPLES, name);
  return existsSync(path) ? readFileSync(path, "utf8") : undefined;
};

/** repo の file の中身。無ければ空 */
const repoText = (path: string): string => (existsSync(join(ROOT, path)) ? readFileSync(join(ROOT, path), "utf8") : "");

/** 見本の file から、最初の注釈の行と、その後ろの空の行を外した記法 */
const withoutComments = (text: string): string => text.replace(/^(?:\/\/[^\n]*\n)+\n*/u, "");

/** 記法を読んだ原本。読めなければ誤りを名指して落とす */
function parsed(text: string, lang: "ja" | "en" = "ja"): Json {
  const read = api("parseNotation")(text, { lang });
  expect(read.ok, `表どうしの関係の図の記法が読めない: ${read.ok ? "" : JSON.stringify(read.errors)}`).toBe(true);
  return read.ok ? read.diagram : {};
}

/** 描いた図。描けなければ断りの文を名指して落とす */
function render(diagram: Json, lang?: "ja" | "en"): ErRendered {
  let rendered: Rendered | undefined;
  let refusal = "";
  try {
    rendered = draw("renderDiagram")(diagram, lang ? { lang } : {});
  } catch (error) {
    refusal = String(error);
  }
  expect(refusal, "表どうしの関係の図を描けない").toBe("");
  const layout = (rendered as unknown as ErRendered | undefined)?.layout;
  expect(layout?.kind, "描いた図が表どうしの関係の図 (er) でない").toBe("er");
  expect(layout?.tables, "並べた表どうしの関係の図に表 (layout.tables) が無い").toBeDefined();
  expect(layout?.links, "並べた表どうしの関係の図に結びの線 (layout.links) が無い").toBeDefined();
  return rendered as unknown as ErRendered;
}

const tableOf = (layout: ErLayout, id: string): ErTable => {
  const table = (layout.tables ?? []).find((t) => t.id === id);
  expect(table, `${id} の表が並べた図に無い`).toBeDefined();
  return table as ErTable;
};

/** `<表>.<項目>` の行 */
const rowOf = (layout: ErLayout, ref: string): { table: ErTable; row: ErRow } => {
  const [id = "", field = ""] = ref.split(".");
  const table = tableOf(layout, id);
  const row = table.rows.find((r) => r.field === field);
  expect(row, `${ref} の行が並べた図に無い`).toBeDefined();
  return { table, row: row as ErRow };
};

/** 点 `p` から線分 `a`-`b` までの距離と、線分の上の最も近い所の割合 */
function toSegment([px, py]: Point, [ax, ay]: Point, [bx, by]: Point): { d: number; t: number } {
  const dx = bx - ax;
  const dy = by - ay;
  const len = dx * dx + dy * dy;
  const t = len === 0 ? 0 : Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / len));
  return { d: Math.hypot(px - (ax + t * dx), py - (ay + t * dy)), t };
}

/** 点 `p` から折れ線 `points` までの距離と、折れ線の始まりから最も近い所までの長さ */
function onLine(p: Point, points: Point[]): { d: number; s: number } {
  let best = { d: Number.POSITIVE_INFINITY, s: 0 };
  let walked = 0;
  for (let k = 1; k < points.length; k++) {
    const a = points[k - 1] as Point;
    const b = points[k] as Point;
    const len = Math.hypot(b[0] - a[0], b[1] - a[1]);
    const hit = toSegment(p, a, b);
    if (hit.d < best.d - 1e-9) best = { d: hit.d, s: walked + hit.t * len };
    walked += len;
  }
  return best;
}

/** 線分 `a`-`b` が四角 `r` を 1px 縮めた内側を通るか */
function crossesInside([ax, ay]: Point, [bx, by]: Point, r: Rect): boolean {
  const left = r.x + 1;
  const right = r.x + r.w - 1;
  const top = r.y + 1;
  const bottom = r.y + r.h - 1;
  if (Math.abs(ay - by) < 0.5) return ay > top && ay < bottom && Math.max(ax, bx) > left && Math.min(ax, bx) < right;
  if (Math.abs(ax - bx) < 0.5) return ax > left && ax < right && Math.max(ay, by) > top && Math.min(ay, by) < bottom;
  return false;
}

const edgesOf = (d: Source): (SourceEvent & { step: number; event: number })[] =>
  d.steps.flatMap((step, s) => step.events.flatMap((e, i) => (e.type === "edge" ? [{ ...e, step: s, event: i }] : [])));

/** 部品のうち、時刻 `t` に最も濃く見える物の濃さ。部品が無ければ 0 */
const brightest = (motion: ReturnType<typeof motionFrom>, selector: string, t: number): number =>
  [...motion.doc.querySelectorAll(selector)].reduce((best, el) => Math.max(best, motion.opacity(el, t)), 0);

/** 2 つの表を結ぶ、書き戻した形の小さな記法 */
const SMALL = [
  "er 注文の合計",
  "",
  "table users as 利用者",
  "  field id: 7 [key]",
  "  field 名前: Alice",
  "",
  "table orders as 注文",
  "  field id: 1042 [key]",
  "  field 利用者id: 7 [ref: users.id]",
  "  field 合計: 未計算",
  "",
  "step 利用者を引く",
  "  say 利用者7を引く。",
  "  pick users.id",
  "",
  "step 注文を引く",
  "  say 利用者idが7の注文を引く。",
  "  users.id -> orders.利用者id [tag: 7]",
  "  pick orders.利用者id",
  "",
  "step 合計を書く",
  "  say 合計を出して注文に書く。",
  "  note orders.合計: 2 × 1,200 = 2,400",
  "  set orders.合計: 2,400",
  "",
].join("\n");

/** SMALL と同じ図の原本 (版2) */
function smallEr(): Json {
  return {
    version: 2,
    kind: "er",
    title: "注文の合計",
    blocks: {
      table: [
        {
          id: "users",
          name: "利用者",
          fields: [
            { name: "id", value: "7", key: true },
            { name: "名前", value: "Alice" },
          ],
        },
        {
          id: "orders",
          name: "注文",
          fields: [
            { name: "id", value: "1042", key: true },
            { name: "利用者id", value: "7", ref: "users.id" },
            { name: "合計", value: "未計算" },
          ],
        },
      ],
    },
    steps: [
      { title: "利用者を引く", body: "利用者7を引く。", events: [{ type: "lookup", field: "users.id" }] },
      {
        title: "注文を引く",
        body: "利用者idが7の注文を引く。",
        events: [
          { type: "edge", from: "users.id", to: "orders.利用者id", carry: { kind: "tag", text: "7" } },
          { type: "lookup", field: "orders.利用者id" },
        ],
      },
      {
        title: "合計を書く",
        body: "合計を出して注文に書く。",
        events: [
          { type: "formula", field: "orders.合計", text: "2 × 1,200 = 2,400" },
          { type: "cell", field: "orders.合計", value: "2,400" },
        ],
      },
    ],
  };
}

/** 見本の記法を言葉ごとに読んだ原本。無い見本は名指して落とす */
function exampleOf(key: string, lang: "ja" | "en"): Json | undefined {
  const file = lang === "ja" ? `${key}.dragon` : `${key}.en.dragon`;
  const text = fileText(file);
  expect(text, `${file} が packages/dragon/examples に無い`).toBeDefined();
  return text === undefined ? undefined : parsed(text, lang);
}

describe("表どうしの関係の図の原本の JSON (#3618)", () => {
  it("schema-accepts-er-diagram", () => {
    const validate = api("validateDiagram");
    for (const lang of ["ja", "en"] as const) {
      const checked = validate(smallEr(), { lang });
      expect(checked.ok, `最小の表どうしの関係の図が検査で落ちる (${lang}): ${JSON.stringify(checked.ok ? [] : checked.errors)}`).toBe(true);
    }
    // 結びも段の中の出来事も持たない、表が 1 つの図も通る
    const bare = {
      version: 2,
      kind: "er",
      title: "1 つの表",
      blocks: { table: [{ id: "users", name: "users", fields: [{ name: "id", value: "1", key: true }] }] },
      steps: [{ title: "見る", body: "表を見る。", events: [] }],
    };
    const checked = validate(bare);
    expect(checked.ok, `表が 1 つの表どうしの関係の図が検査で落ちる: ${JSON.stringify(checked.ok ? [] : checked.errors)}`).toBe(true);
  });
});

describe("表どうしの関係の図の記法 (#3618)", () => {
  it("er-roundtrip-keeps-notation", () => {
    const print = api("printNotation");
    // 書き戻した形の記法は、読んで書き戻すと 1 字も変わらない
    expect(print(parsed(SMALL)), "小さな表どうしの関係の図を読んで書き戻した記法が元と違う").toBe(SMALL);
    // 記法から作った原本は、原本の JSON と同じ
    expect(parsed(SMALL), "小さな表どうしの関係の図の記法から作った原本").toEqual(smallEr());
    // 原本の JSON を書き戻すと記法に戻る
    expect(print(smallEr()), "小さな表どうしの関係の図の原本を書き戻した記法").toBe(SMALL);
    for (const key of ER_EXAMPLES) {
      for (const [file, lang] of [
        [`${key}.dragon`, "ja"],
        [`${key}.en.dragon`, "en"],
      ] as const) {
        const text = fileText(file);
        expect(text, `${file} が packages/dragon/examples に無い`).toBeDefined();
        if (text === undefined) continue;
        const diagram = parsed(text, lang);
        expect((diagram as unknown as Source).kind, `${file} の図の種類`).toBe("er");
        expect(print(diagram), `${file} を読んで書き戻した記法が元 (最初の注釈を除く) と違う`).toBe(withoutComments(text));
      }
    }
  });

  it("er-rejects-a-ref-to-a-missing-field", () => {
    const parse = api("parseNotation");
    const cases: [string, string, string][] = [
      ["無い表を指す結び", "  field user_id: 1 [ref: people.id]", "people.id"],
      ["無い項目を指す結び", "  field user_id: 1 [ref: users.email]", "users.email"],
      ["後ろの表の無い項目を指す結び", "  field user_id: 1 [ref: items.price]", "items.price"],
    ];
    for (const [name, line, target] of cases) {
      const text = ["er small", "table users", "  field id: 1 [key]", "table orders", "  field id: 1 [key]", line, "table items", "  field id: 1 [key]", "step go", "  say go."];
      const want = { line: 6, column: line.indexOf(target) + 1 };
      for (const lang of ["ja", "en"] as const) {
        const read = parse(text.join("\n"), { lang });
        expect(read.ok, `${name} を書いた表どうしの関係の図が読めてしまう (${lang})`).toBe(false);
        const first: LineError | undefined = read.ok ? undefined : read.errors[0];
        expect(first && { line: first.line, column: first.column }, `${name} の誤りの行と列 (${lang}): ${first?.message}`).toEqual(want);
        expect(first?.message ?? "", `${name} の誤りの文 (${lang})`).not.toBe("");
        if (lang === "en") expect(KANA.test(first?.message ?? ""), `${name} の英語の誤りの文に仮名か漢字がある: ${first?.message}`).toBe(false);
        else expect(KANA.test(first?.message ?? ""), `${name} の日本語の誤りの文が日本語でない: ${first?.message}`).toBe(true);
      }
    }
    // 前の表の項目も、後ろの表の項目も結べる
    for (const ref of ["users.id", "items.id"]) {
      const read = parse(["er small", "table users", "  field id: 1 [key]", "table orders", `  field user_id: 1 [ref: ${ref}]`, "table items", "  field id: 1 [key]", "step go", "  say go."].join("\n"));
      expect(read.ok, `在る項目 ${ref} を指す結びが読めない: ${read.ok ? "" : JSON.stringify(read.errors)}`).toBe(true);
    }
  });

  it("er-rejects-a-line-between-unlinked-fields", () => {
    const parse = api("parseNotation");
    const head = [
      "er small",
      "table users",
      "  field id: 1 [key]",
      "  field name: Alice",
      "table orders",
      "  field id: 1 [key]",
      "  field user_id: 1 [ref: users.id]",
      "  field status: sent",
      "step go",
      "  say go.",
    ];
    const n = head.length;
    // 結んでいない項目どうしの線は、受ける側の項目を指して止める
    const cases: [string, string][] = [
      ["どちらも結んでいない項目どうしの線", "  users.name -> orders.status [tag: x]"],
      ["結びの相手でない項目への線", "  users.id -> orders.status [tag: x]"],
      ["鍵どうしの線", "  orders.id -> users.id"],
    ];
    for (const [name, line] of cases) {
      const to = line.trim().split(/\s+/u)[2] as string;
      const want = { line: n + 1, column: line.indexOf(to, line.indexOf("->")) + 1 };
      for (const lang of ["ja", "en"] as const) {
        const read = parse([...head, line].join("\n"), { lang });
        expect(read.ok, `${name} を書いた表どうしの関係の図が読めてしまう (${lang})`).toBe(false);
        const first: LineError | undefined = read.ok ? undefined : read.errors[0];
        expect(first && { line: first.line, column: first.column }, `${name} の誤りの行と列 (${lang}): ${first?.message}`).toEqual(want);
        if (lang === "en") expect(KANA.test(first?.message ?? ""), `${name} の英語の誤りの文に仮名か漢字がある: ${first?.message}`).toBe(false);
        else expect(KANA.test(first?.message ?? ""), `${name} の日本語の誤りの文が日本語でない: ${first?.message}`).toBe(true);
      }
    }
    // 無い項目と、項目でない名札を端に書いた線も止める
    for (const line of ["  users.email -> orders.user_id", "  users -> orders"]) {
      const read = parse([...head, line].join("\n"));
      expect(read.ok, `${line.trim()} を書いた表どうしの関係の図が読めてしまう`).toBe(false);
    }
    // 結んだ項目どうしの線は、どちらの向きにも引ける
    for (const line of ["  users.id -> orders.user_id [tag: 1]", "  orders.user_id -> users.id [tag: 1]", "  users.id -> orders.user_id"]) {
      const read = parse([...head, line].join("\n"));
      expect(read.ok, `結んだ項目どうしの線 ${line.trim()} が読めない: ${read.ok ? "" : JSON.stringify(read.errors)}`).toBe(true);
    }
  });

  it("er-rejects-too-few-or-too-many-tables", () => {
    const parse = api("parseNotation");
    const text = (n: number): string => ["er small", ...Array.from({ length: n }, (_, i) => [`table t${i + 1}`, "  field id: 1 [key]"]).flat(), "step go", "  say go."].join("\n");
    for (const n of [0, 7, 9]) {
      for (const lang of ["ja", "en"] as const) {
        const read = parse(text(n), { lang });
        expect(read.ok, `表が ${n} つの表どうしの関係の図が読めてしまう (${lang})`).toBe(false);
        const first: LineError | undefined = read.ok ? undefined : read.errors[0];
        expect(first?.line, `表が ${n} つの表どうしの関係の図の誤りの行 (${lang}): ${first?.message}`).toBe(1);
        const message = first?.message ?? "";
        expect(message.includes("1") && message.includes("6"), `表が ${n} つの表どうしの関係の図の誤りの文が 1 から 6 の数を示さない (${lang}): ${message}`).toBe(true);
        if (lang === "en") expect(KANA.test(message), `表が ${n} つの英語の誤りの文に仮名か漢字がある: ${message}`).toBe(false);
        else expect(KANA.test(message), `表が ${n} つの日本語の誤りの文が日本語でない: ${message}`).toBe(true);
      }
    }
    for (const n of [1, 6]) {
      const read = parse(text(n));
      expect(read.ok, `表が ${n} つの表どうしの関係の図が読めない: ${read.ok ? "" : JSON.stringify(read.errors)}`).toBe(true);
    }
  });

  it("notation-keeps-er-words-plain-outside-er", () => {
    const parse = api("parseNotation");
    for (const kind of ["sequence", "architecture", "state"] as const) {
      const text = [`${kind} 表の語の名札`, "box table as 表", "box field as 項目", "box pick", "step 送る", "  say 送る。", "  table -> field: 送る", "  pick -> table: 戻す"].join("\n");
      const read = parse(text);
      expect(read.ok, `${kind} で table と field と pick を名札にした箱が読めない: ${read.ok ? "" : JSON.stringify(read.errors)}`).toBe(true);
      const diagram = (read.ok ? read.diagram : {}) as unknown as { blocks?: { box?: { id: string }[] }; steps?: { events: { type: string; from?: string; to?: string }[] }[] };
      expect(diagram.blocks?.box?.map((b) => b.id), `${kind} の箱の名札`).toEqual(["table", "field", "pick"]);
      expect(diagram.steps?.[0]?.events.map((e) => ({ type: e.type, from: e.from, to: e.to })), `${kind} の table と pick から出る線`).toEqual([
        { type: "edge", from: "table", to: "field" },
        { type: "edge", from: "pick", to: "table" },
      ]);
    }
  });
});

describe("表どうしの関係の図の並べ方と動き (#3618)", () => {
  /** 並べ方を確かめる図。小さな図と、見本の日本語と英語 */
  function laidOut(keys: readonly string[]): [string, Json, "ja" | "en"][] {
    const out: [string, Json, "ja" | "en"][] = [["小さな図", parsed(SMALL), "ja"]];
    for (const key of keys)
      for (const lang of ["ja", "en"] as const) {
        const diagram = exampleOf(key, lang);
        if (diagram !== undefined) out.push([`${key} (${lang})`, diagram, lang]);
      }
    return out;
  }

  it("er-tables-line-up-left-to-right", () => {
    for (const [name, diagram, lang] of laidOut(ER_EXAMPLES)) {
      const source = diagram as unknown as Source;
      const declared = source.blocks.table ?? [];
      const { layout } = render(diagram, lang);
      const tables = layout.tables ?? [];
      // 表は書いた順に左から右へ並び、離れていて、上の端が揃う
      expect(tables.map((t) => t.id), `${name} の表の並び`).toEqual(declared.map((t) => t.id));
      tables.forEach((table, i) => {
        const before = tables[i - 1];
        if (before) expect(table.x, `${name} の ${table.id} が ${before.id} の右に離れて並ばない`).toBeGreaterThan(before.x + before.w + 1);
        expect(Math.abs(table.y - (tables[0] as ErTable).y), `${name} の ${table.id} の上の端が最初の表と揃わない`).toBeLessThan(0.5);
        expect(table.x >= 0 && table.y >= 0 && table.x + table.w <= layout.width && table.y + table.h <= layout.height, `${name} の ${table.id} が図の枠からはみ出す`).toBe(true);
        // 項目の行は書いた順に上から並び、表の中に収まり、見出しより下にある
        const fields = declared[i]?.fields ?? [];
        expect(table.rows.map((r) => r.field), `${name} の ${table.id} の項目の行`).toEqual(fields.map((f) => f.name));
        table.rows.forEach((row, k) => {
          const what = `${name} の ${table.id}.${row.field} の行`;
          expect(row.x >= table.x - 0.5 && row.x + row.w <= table.x + table.w + 0.5 && row.y >= table.y && row.y + row.h <= table.y + table.h + 0.5, `${what} が表の中に無い`).toBe(true);
          expect(Math.abs(row.cy - (row.y + row.h / 2)), `${what} の真ん中が行の真ん中でない`).toBeLessThan(0.5);
          const above = table.rows[k - 1];
          if (above) expect(row.y, `${what} が上の行に重なる`).toBeGreaterThanOrEqual(above.y + above.h - 0.5);
          else expect(row.y, `${what} が表の見出しに重なる`).toBeGreaterThan(table.y + 16);
        });
      });
    }
  });

  it("er-ref-draws-one-to-many-link", () => {
    for (const [name, diagram, lang] of laidOut(["order-total", "nft-sale"])) {
      const source = diagram as unknown as Source;
      const rendered = render(diagram, lang);
      const { layout } = rendered;
      const doc = new DOMParser().parseFromString(rendered.svg, "image/svg+xml");
      const refs = (source.blocks.table ?? []).flatMap((t) => t.fields.flatMap((f) => (f.ref ? [{ from: `${t.id}.${f.name}`, to: f.ref }] : [])));
      expect(refs.length, `${name} に結び (ref) が無い`).toBeGreaterThan(0);
      // 結びごとに、結びを書いた項目から指した項目へ 1 本の線を引く
      expect((layout.links ?? []).map((l) => `${l.from}>${l.to}`), `${name} の結びの線`).toEqual(refs.map((r) => `${r.from}>${r.to}`));
      for (const link of layout.links ?? []) {
        const what = `${name} の ${link.from} から ${link.to} への線`;
        const many = rowOf(layout, link.from);
        const one = rowOf(layout, link.to);
        const first = link.points[0] as Point;
        const last = link.points[link.points.length - 1] as Point;
        const onEdge = (p: Point, t: ErTable): boolean => Math.abs(p[0] - t.x) < 1 || Math.abs(p[0] - (t.x + t.w)) < 1;
        expect(onEdge(first, many.table) && Math.abs(first[1] - many.row.cy) < 1, `${what} が結びを書いた項目の行の横の縁から出ない`).toBe(true);
        expect(onEdge(last, one.table) && Math.abs(last[1] - one.row.cy) < 1, `${what} が指した項目の行の横の縁に着かない`).toBe(true);
        // 線は縦と横の線分だけで引き、どの表の中も通らない
        link.points.slice(1).forEach((p, k) => {
          const q = link.points[k] as Point;
          expect(Math.abs(p[0] - q[0]) < 0.5 || Math.abs(p[1] - q[1]) < 0.5, `${what} に斜めの線分がある`).toBe(true);
          for (const table of layout.tables ?? []) expect(crossesInside(q, p, table), `${what} が ${table.id} の表の中を通る`).toBe(false);
        });
        // 多い側の端に三つ叉、1件の側の端に縦の棒を置く
        expect(Math.hypot(link.many[0] - first[0], link.many[1] - first[1]), `${what} の三つ叉の端が結びを書いた項目の側に無い`).toBeLessThan(24);
        expect(Math.hypot(link.one[0] - last[0], link.one[1] - last[1]), `${what} の縦の棒の端が指した項目の側に無い`).toBeLessThan(24);
        const drawn = doc.querySelector(`[data-link="${link.from}>${link.to}"]`);
        expect(drawn, `${what} の部品 ([data-link]) が描いた図に無い`).not.toBeNull();
        expect(drawn?.querySelector('[data-end="many"]'), `${what} に三つ叉の端 ([data-end="many"]) が無い`).not.toBeNull();
        expect(drawn?.querySelector('[data-end="one"]'), `${what} に縦の棒の端 ([data-end="one"]) が無い`).not.toBeNull();
      }
      // 鍵の項目に鍵の印、結びの項目に結びの印を付け、どちらでもない項目には印を付けない
      for (const table of source.blocks.table ?? [])
        for (const field of table.fields) {
          const row = doc.querySelector(`[data-row="${table.id}.${field.name}"]`);
          const what = `${name} の ${table.id}.${field.name} の行`;
          expect(row, `${what} の部品 ([data-row]) が描いた図に無い`).not.toBeNull();
          expect(Boolean(row?.querySelector('[data-mark="key"]')), `${what} の鍵の印`).toBe(field.key === true);
          expect(Boolean(row?.querySelector('[data-mark="ref"]')), `${what} の結びの印`).toBe(field.ref !== undefined);
        }
    }
  });

  it("er-pick-lights-the-row", () => {
    const diagram = parsed(SMALL);
    const source = diagram as unknown as Source;
    const rendered = render(diagram);
    const { timeline } = rendered;
    const motion = motionFrom(rendered as unknown as Rendered);
    const tables = source.blocks.table ?? [];
    const picksAt = (s: number): string[] => (source.steps[s]?.events ?? []).flatMap((e) => (e.type === "lookup" && e.field ? [e.field] : []));
    const firstPick = new Map<string, number>();
    source.steps.forEach((_, s) => {
      for (const field of picksAt(s)) {
        const table = field.split(".")[0] ?? "";
        if (!firstPick.has(table)) firstPick.set(table, s);
      }
    });
    source.steps.forEach((_, s) => {
      const span = timeline.steps[s] as Span;
      const t = span.end - 0.05;
      const picked = picksAt(s);
      for (const table of tables) {
        // 選んだ行はその段で光り、選ばない段では光らない
        for (const field of table.fields) {
          const ref = `${table.id}.${field.name}`;
          const lit = brightest(motion, `[data-row="${ref}"] .dg-er-pick`, t);
          if (picked.includes(ref)) expect(lit, `段 ${s + 1} で選んだ ${ref} の行が光らない`).toBeGreaterThan(0.9);
          else expect(lit, `段 ${s + 1} で選んでいない ${ref} の行が光る`).toBeLessThan(0.1);
        }
        // 行を選んだ段は表の枠を太く光らせ、その後の段も枠の色を残す。最初に選ぶ前の段は光らせない
        const now = brightest(motion, `[data-table="${table.id}"] .dg-er-now`, t);
        const kept = brightest(motion, `[data-table="${table.id}"] .dg-er-lit`, t);
        const own = picked.some((ref) => ref.startsWith(`${table.id}.`));
        if (own) expect(now, `段 ${s + 1} で行を選んだ ${table.id} の表の枠が光らない`).toBeGreaterThan(0.9);
        else expect(now, `段 ${s + 1} で行を選んでいない ${table.id} の表の枠が太く光る`).toBeLessThan(0.1);
        const since = firstPick.get(table.id);
        if (since !== undefined && s >= since) expect(Math.max(now, kept), `段 ${s + 1} で ${table.id} の表の枠の色が残らない`).toBeGreaterThan(0.9);
        else expect(Math.max(now, kept), `段 ${s + 1} で、まだ行を選んでいない ${table.id} の表の枠が光る`).toBeLessThan(0.1);
      }
    });
  });

  it("er-tag-runs-between-fields", () => {
    const sources: [string, Json, "ja" | "en"][] = [["小さな図", parsed(SMALL), "ja"]];
    const total = exampleOf("order-total", "ja");
    if (total !== undefined) sources.push(["order-total", total, "ja"]);
    const nft = exampleOf("nft-sale", "en");
    if (nft !== undefined) sources.push(["nft-sale (en)", nft, "en"]);
    for (const [name, diagram, lang] of sources) {
      const source = diagram as unknown as Source;
      const rendered = render(diagram, lang);
      const { layout, timeline, svg } = rendered;
      const edges = edgesOf(source);
      expect(edges.length, `${name} に段の中の線が無い`).toBeGreaterThan(0);
      for (const e of edges) {
        const span = timeline.steps[e.step] as Span;
        const what = `${name} の段 ${e.step + 1} の ${e.from} -> ${e.to}`;
        // 札はその段で走り出し、その段の中で走り終える
        const carrier = timeline.carriers.find((c) => c.step === e.step && c.event === e.event);
        expect(carrier, `${what} の札が走らない`).toBeDefined();
        if (!carrier) continue;
        expect(carrier.depart >= span.start - 1e-9 && carrier.arrive <= span.end + 1e-9 && carrier.arrive > carrier.depart, `${what} の札がその段の間に走らない`).toBe(true);
        expect(carrier.start, `${what} の札が前の段から見えている`).toBeGreaterThanOrEqual(span.start - 1e-9);
        // 札の道は結びの線の上にあり、線を書いた送る側の項目から受ける側の項目へ進む
        const link = (layout.links ?? []).find((l) => (l.from === e.from && l.to === e.to) || (l.from === e.to && l.to === e.from));
        expect(link, `${what} の結びの線が並べた図に無い`).toBeDefined();
        if (!link) continue;
        const laid = layout.edges.find((l) => l.step === e.step && l.event === e.event);
        const points = (laid?.points ?? []) as Point[];
        expect(points.length, `${what} の札の道が無い`).toBeGreaterThan(1);
        const forward = link.from === e.from;
        const length = onLine(link.points[link.points.length - 1] as Point, link.points).s;
        const along = points.map((p) => {
          const hit = onLine(p, link.points);
          expect(hit.d, `${what} の札の道が結びの線から離れる`).toBeLessThan(1.5);
          return forward ? hit.s : length - hit.s;
        });
        expect(along.every((s, k) => k === 0 || s >= (along[k - 1] as number) - 1e-6), `${what} の札の道が送る側から受ける側へ進まない`).toBe(true);
        expect((along[along.length - 1] as number) > (along[0] as number), `${what} の札の道が進まない`).toBe(true);
        expect(svg.includes(`>${e.carry?.text ?? ""}</text>`), `${what} の札の字 ${e.carry?.text} が描いた図に無い`).toBe(true);
      }
    }
  });

  it("er-set-rewrites-the-value", () => {
    const sources: [string, Json][] = [["小さな図", parsed(SMALL)]];
    const total = exampleOf("order-total", "ja");
    if (total !== undefined) sources.push(["order-total", total]);
    for (const [name, diagram] of sources) {
      const source = diagram as unknown as Source;
      const rendered = render(diagram);
      const { timeline } = rendered;
      const motion = motionFrom(rendered as unknown as Rendered);
      const written = new Set(source.steps.flatMap((step) => step.events.flatMap((e) => (e.type === "cell" && e.field ? [e.field] : []))));
      expect(written.size, `${name} に値を書き換える段 (set) が無い`).toBeGreaterThan(0);
      // 値を書き換える項目と、書き換えない項目の 1 つ
      const plain = (source.blocks.table ?? []).flatMap((t) => t.fields.map((f) => `${t.id}.${f.name}`)).find((ref) => !written.has(ref));
      const watched = [...written, ...(plain ? [plain] : [])];
      const current = new Map((source.blocks.table ?? []).flatMap((t) => t.fields.map((f): [string, typeof f.value] => [`${t.id}.${f.name}`, f.value])));
      source.steps.forEach((step, s) => {
        for (const e of step.events) if (e.type === "cell" && e.field && e.value !== undefined) current.set(e.field, e.value);
        const t = (timeline.steps[s] as Span).end - 0.05;
        for (const ref of watched) {
          const groups = [...motion.doc.querySelectorAll(`[data-value="${ref}"]`)];
          expect(groups.length, `${name} の ${ref} の値の部品 ([data-value]) が描いた図に無い`).toBeGreaterThan(0);
          const shown = groups.filter((g) => motion.opacity(g, t) > 0.9).map((g) => g.textContent);
          expect(shown, `${name} の段 ${s + 1} の終わりに出ている ${ref} の値`).toEqual([current.get(ref)]);
        }
      });
    }
  });

  it("er-note-shows-the-formula", () => {
    const diagram = parsed(SMALL);
    const source = diagram as unknown as Source;
    const rendered = render(diagram);
    const { timeline } = rendered;
    const motion = motionFrom(rendered as unknown as Rendered);
    const notes =source.steps.flatMap((step, s) => step.events.flatMap((e) => (e.type === "formula" && e.field && e.text ? [{ step: s, field: e.field, text: e.text }] : [])));
    expect(notes.length, "小さな図に式の札 (note) が無い").toBeGreaterThan(0);
    for (const note of notes) {
      const groups = [...motion.doc.querySelectorAll(`[data-note="${note.field}"]`)].filter((g) => (g.textContent ?? "").includes(note.text));
      expect(groups.length, `${note.field} の式の札 ([data-note]) に ${note.text} が無い`).toBeGreaterThan(0);
      source.steps.forEach((_, s) => {
        const t = (timeline.steps[s] as Span).end - 0.05;
        const seen = groups.reduce((best, g) => Math.max(best, motion.opacity(g, t)), 0);
        if (s === note.step) expect(seen, `段 ${s + 1} で ${note.field} の式の札が出ていない`).toBeGreaterThan(0.9);
        if (s < note.step) expect(seen, `段 ${s + 1} で、まだ書いていない ${note.field} の式の札が出ている`).toBeLessThan(0.1);
      });
    }
  });
});

describe("表どうしの関係の図の軽い入口 (#3618)", () => {
  it("er-light-entry-draws-after-load-for", () => {
    const code = [
      `const text = ${JSON.stringify(SMALL)};`,
      "out.before = light.kindLoaded('er');",
      "await light.loadFor(text);",
      "out.after = light.kindLoaded('er');",
      "const read = light.parseNotation(text);",
      "out.ok = read.ok;",
      "out.errors = read.ok ? [] : read.errors;",
      "if (read.ok) {",
      "  const drawn = light.renderDiagram(read.diagram);",
      "  out.kind = drawn.layout.kind;",
      "  out.links = (drawn.svg.match(/data-link=/g) ?? []).length;",
      "  const full = await import('@cardenelabs/dragon');",
      "  const again = full.parseNotation(text);",
      "  out.same = again.ok && full.renderDiagram(again.diagram).svg === drawn.svg;",
      "}",
      "console.log(JSON.stringify(out));",
    ].join("\n");
    const script = `const light = await import("@cardenelabs/dragon/light");\nconst out = {};\n${code}`;
    let stdout = "";
    let failure = "";
    try {
      stdout = execFileSync(process.execPath, ["--input-type=module", "-e", script], { cwd: PACKAGE, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });
    } catch (error) {
      failure = String((error as { stderr?: string }).stderr ?? error);
    }
    expect(failure, "軽い入口で表どうしの関係の図を読んで描く node が落ちる").toBe("");
    const out = JSON.parse(stdout.trim().split("\n").at(-1) ?? "{}") as { before?: boolean; after?: boolean; ok?: boolean; errors?: unknown[]; kind?: string; links?: number; same?: boolean };
    expect(out.before, "軽い入口が loadFor の前から表どうしの関係の図の描く部品を持つ (最初に読む塊に入っている)").toBe(false);
    expect(out.after, "軽い入口で loadFor を待っても表どうしの関係の図の描く部品を読まない").toBe(true);
    expect(out.ok, `軽い入口で loadFor を待った後に表どうしの関係の図を読めない: ${JSON.stringify(out.errors)}`).toBe(true);
    expect(out.kind, "軽い入口で描いた図の種類").toBe("er");
    expect(out.links, "軽い入口で描いた表どうしの関係の図の結びの線の数").toBe(1);
    expect(out.same, "軽い入口と既定の入口で描いた表どうしの関係の図が違う").toBe(true);
  });
});

describe("表どうしの関係の図の書き方の文書 (#3618)", () => {
  it("er-docs-describe-the-notation", () => {
    const extract = api("extractDiagrams");
    const parse = api("parseNotation");
    /** 頭の語 `er` と、表の宣言と、結びを持つ項目の書き方 */
    const head = /(^|[\s`])er [^\s`]/mu;
    const table = /(^|[\s`])table (<[^>]+>|[^\s`]+) as (<[^>]+>|[^\s`]+)/mu;
    const field = /field (<[^>]+>|[^\s`:]+): (<[^>]+>|[^\s`[]+) \[ref: (<[^>]+>|[^\s`\]]+)\]/u;
    const erFences = (text: string): number =>
      extract(text).filter((fence) => {
        const read = parse(fence.source);
        return read.ok && (read.diagram as unknown as Source).kind === "er";
      }).length;
    for (const path of ["README.md", "packages/dragon/README.md", "packages/dragon/examples/quick-start.md", "packages/dragon/examples/quick-start.en.md"]) {
      const text = repoText(path);
      expect(text, `${path} が無い`).not.toBe("");
      expect(head.test(text), `${path} に er の行の書き方が無い`).toBe(true);
      expect(table.test(text), `${path} に表を宣言する行 (table <名札> as <名前>) の書き方が無い`).toBe(true);
      expect(field.test(text), `${path} に結びを持つ項目 (field <名前>: <値> [ref: <表>.<項目>]) の書き方が無い`).toBe(true);
      if (path !== "README.md") expect(erFences(text), `${path} に表どうしの関係の図として読める dragon の囲みが無い`).toBeGreaterThan(0);
    }
    // README の描ける図の欄に表どうしの関係の図が載る
    expect(/^\| Diagram kinds \|.*\btable relation diagram\b/imu.test(repoText("README.md")), "README.md の描ける図の欄に table relation diagram が無い").toBe(true);
    // 使い方の頁は節の本文 (content.ts)、節の記法の例 (docs/examples)、ブロックの段落 (gallery/docs.ts) から組む
    const content = repoText("apps/playground-spa/src/docs/content.ts");
    expect(/SECTIONS = \[[^\]]*"er"/u.test(content), "使い方の頁の節に表どうしの関係の図 (er) が無い").toBe(true);
    const sections = ["er.dragon", "er.en.dragon"].map((file) => repoText(`apps/playground-spa/src/docs/examples/${file}`));
    for (const [i, text] of sections.entries()) {
      const read = parse(text, { lang: i === 0 ? "ja" : "en" });
      expect(read.ok && (read.diagram as unknown as Source).kind, `使い方の頁の表どうしの関係の図の節の例 (${i === 0 ? "er.dragon" : "er.en.dragon"}) が表どうしの関係の図として読めない`).toBe("er");
    }
    const blocks = join(PACKAGE, "src/blocks");
    const paragraphs = readdirSync(blocks).map((name) => repoText(`packages/dragon/src/blocks/${name}/gallery/docs.ts`));
    const page = [content, ...sections, ...paragraphs].join("\n");
    expect(head.test(page), "使い方の頁に er の行の書き方が無い").toBe(true);
    expect(table.test(page), "使い方の頁に表を宣言する行の書き方が無い").toBe(true);
    expect(field.test(page), "使い方の頁に結びを持つ項目の書き方が無い").toBe(true);
  });
});
