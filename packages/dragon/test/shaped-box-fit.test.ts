// @vitest-environment jsdom
/**
 * 形を変えた箱に、名前と下の字と運ぶ物の枠を収める (#3520)。
 *
 * skill の評価で Claude が書いた図は、形を変えた箱 (ひし形、六角形、丸、円柱、`shape path` の形) から名前や下の字や硬貨の枠がはみ出し、
 * 線の無い段の番号が形から離れて浮いていた。形を持つ箱は、名前と下の字と絵柄の行を形の内側に置き、収まらない時は箱を大きくする。
 * 線の無い段の番号は、箱の四角の左上の角でなく、形の縁で角に一番近い所に置く。
 * `shape path` の形は、形を囲む最も小さい四角を箱の枠いっぱいに伸ばして描く。100 四方の中の空きが箱の枠に残ると、線と番号が形から離れるため。
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import * as dragon from "@cardenelabs/dragon";
import { describe, expect, it } from "vitest";

const ROOT = process.cwd();
const FIXTURES = join(ROOT, "packages/dragon/test/fixtures/layout");
/** 評価で Claude が書いた、六角形の `+oracle` の箱を持つ支払いの図 */
const EVAL_PAYMENT = join(FIXTURES, "eval-payment.dragon");
/** 評価で Claude が書いた、アーチの `shape path` の `+bridge` の箱を持つ橋の図 */
const EVAL_BRIDGE = join(FIXTURES, "eval-bridge.dragon");
/** 評価で Claude が書いた、扇形の `shape path` の箱を 3 つ並べた図 */
const EVAL_PIE = join(FIXTURES, "eval-pie.dragon");
/** ひし形と六角形と丸と円柱の箱に、長い名前と下の字と運ぶ物を付けた構成図 */
const SHAPES = join(FIXTURES, "shapes.dragon");
/** 見本に今ある崩れの一覧 */
const RECORDED = join(ROOT, "packages/dragon/test/fixtures/layout-breaks.json");

/** 形の崩れの種類。字と枠のはみ出しと、番号の浮き */
const SHAPE_KINDS = ["text-outside-shape", "slot-outside-shape", "badge-off-shape"];

interface LayoutBreak {
  kind: string;
  step: number;
  parts: unknown[];
}
interface Box {
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
  cx: number;
  cy: number;
  slot?: { x: number; y: number; w: number; h: number };
}
interface Badge {
  step: number;
  x: number;
  y: number;
}
interface Rendered {
  svg: string;
  layout: { boxes: Box[]; badges: Badge[] };
}
type Parsed = { ok: true; diagram: unknown } | { ok: false; errors: unknown[] };

const api = dragon as unknown as {
  checkLayoutText: (text: string, options: { lang: "ja" | "en" }) => LayoutBreak[];
  parseNotation: (text: string, options: { lang: "ja" | "en" }) => Parsed;
  renderDiagram: (diagram: unknown, options?: { lang: "ja" | "en" }) => Rendered;
};

const read = (path: string): string => readFileSync(path, "utf8");

/** 記法 `text` の形の崩れ。崩れを 1 行の字にして、落ちた時に何が崩れたかを読めるようにする */
const shapeBreaks = (text: string): string[] =>
  api
    .checkLayoutText(text, { lang: "ja" })
    .filter((b) => SHAPE_KINDS.includes(b.kind))
    .map((b) => `${b.kind} 段 ${b.step} ${JSON.stringify(b.parts)}`);

function render(text: string): Rendered {
  const parsed = api.parseNotation(text, { lang: "ja" });
  if (!parsed.ok) throw new Error(`記法を読めない: ${JSON.stringify(parsed.errors)}`);
  return api.renderDiagram(parsed.diagram, { lang: "ja" });
}

/** 形を持つ 4 つの箱のブロックの定義。ひし形、六角形、丸、円柱 */
const DEFS = [
  "blocks 1",
  ...[
    ["+gate", "diamond", "amber"],
    ["+oracle", "hexagon", "violet"],
    ["+pool", "circle", "green"],
    ["+store", "cylinder", "blue"],
  ].flatMap(([name, shape, color]) => [`block ${name}`, "  base box", `  shape ${shape}`, `  color ${color}`, "end"]),
].join("\n");

/** 4 つの形の箱。下の字を名前より長くし、下の字の行が形の細い所に掛かるようにする */
const SHAPED = [
  "+gate gate as 関所 [note: 署名と残高と期限を確かめる, icon: key]",
  "+oracle oracle as 価格オラクル [note: 外部から為替レートを返す, icon: chain]",
  "+pool pool as プール [note: 預け入れと引き出しを受ける, icon: server]",
  "+store store as 記録の倉庫 [note: 全ての取引を順に書き残す, icon: db]",
].join("\n");

/** 構成図のほかに、形を持つ箱を描く図の種類の記法。どれも同じ定義と同じ 4 つの箱を持つ */
const KINDS: Record<string, string> = {
  state: [
    "state 形を変えた状態",
    "",
    DEFS,
    "",
    SHAPED,
    "",
    "step 聞く",
    "  say 関所が価格オラクルにレートを聞く。",
    "  gate -> oracle: レートを聞く [carry: coin]",
    "",
    "step 預ける",
    "  say 価格オラクルの後にプールへ預ける。",
    "  oracle -> pool: 預ける [tag: 100 USDC]",
    "",
    "step 残す",
    "  say プールが記録の倉庫に書き残す。",
    "  pool -> store: 書き残す",
    "",
  ].join("\n"),
  tree: [
    "tree 形を変えた箱の木",
    "",
    DEFS,
    "",
    SHAPED,
    "",
    "step 葉を出す",
    "  say 取引ごとに葉を出す。",
    "  leaf 取引1 [hash: 3fa0]",
    "  leaf 取引2 [hash: 8b04]",
    "  note gate: 葉が2つ出て署名を待つ",
    "",
    "step 組む",
    "  say 2つの葉から根を組む。",
    "  node 根 of 取引1, 取引2 [hash: 7a21]",
    "  act oracle: 根の値を外部から確かめる",
    "",
  ].join("\n"),
  sequence: [
    "sequence 形を変えた箱の時系列",
    "",
    DEFS,
    "",
    SHAPED,
    "",
    "step 聞く",
    "  say 関所が価格オラクルにレートを聞く。",
    "  gate -> oracle: レートを聞く [carry: coin]",
    "",
    "step 預ける",
    "  say 価格オラクルの後にプールへ預ける。",
    "  oracle -> pool: 預ける [tag: 100 USDC]",
    "",
    "step 残す",
    "  say 記録の倉庫が取引を書き残す。",
    "  act store: 全ての取引を順に書き残す",
    "",
  ].join("\n"),
  git: [
    "git 形を変えた箱とgit",
    "",
    DEFS,
    "",
    "branch main",
    "",
    SHAPED,
    "",
    "step 積む",
    "  say commit A を積む。",
    "  commit A on main [hash: 3fa0c19]",
    "  note gate: Aの中身を署名で確かめる",
    "",
    "step 進める",
    "  say commit B へ進める。",
    "  commit B on main [hash: 8b04f71]",
    "  act oracle: 外部から最新の値を届ける",
    "",
  ].join("\n"),
};

/** 形を持つ箱の行を、同じ名前と下の字と絵柄を持つ形の無い箱の行に替えた記法 */
const plain = (text: string): string => text.replace(/^\+(gate|oracle|pool|store) /gmu, "box ");

describe("形を変えた箱に字と運ぶ物の枠を収める (#3520)", () => {
  it("shaped-box-eval-payment-fits", () => {
    expect(shapeBreaks(read(EVAL_PAYMENT)), "評価の支払いの図の六角形の箱の崩れ").toEqual([]);
  });

  it("shaped-box-eval-bridge-fits", () => {
    expect(shapeBreaks(read(EVAL_BRIDGE)), "評価の橋の図のアーチの箱の崩れ").toEqual([]);
  });

  it("shaped-box-eval-pie-fits", () => {
    expect(shapeBreaks(read(EVAL_PIE)), "評価の扇形の箱を並べた図の崩れ").toEqual([]);
  });

  it("shaped-box-basic-shapes-fit", () => {
    const texts = { architecture: read(SHAPES), ...KINDS };
    for (const [kind, text] of Object.entries(texts)) {
      // 4 つの形の箱を描いていなければ、崩れが 0 件でも確かめたことにならない
      const ids = render(text).layout.boxes.map((b) => b.id);
      expect(ids, `${kind} の図が形の箱を描かない`).toEqual(expect.arrayContaining(["gate", "oracle", "pool", "store"]));
      expect(shapeBreaks(text), `${kind} の図の形の崩れ`).toEqual([]);
    }
  });

  it("shaped-box-grows-when-text-does-not-fit", () => {
    const text = read(SHAPES);
    const shaped = render(text).layout.boxes;
    const flat = render(plain(text)).layout.boxes;
    // ひし形と六角形と丸は、形の細い所に下の字の行が掛かるので、形を持たない箱の大きさでは収まらない
    for (const id of ["gate", "oracle", "pool"]) {
      const a = shaped.find((b) => b.id === id);
      const b = flat.find((box) => box.id === id);
      expect(a && b, `${id} の箱が無い`).toBeTruthy();
      if (!a || !b) continue;
      expect(a.w > b.w + 0.5 || a.h > b.h + 0.5, `${id} の箱が形を持たない箱 (${b.w} x ${b.h}) より大きくならない (${a.w} x ${a.h})`).toBe(true);
    }
  });

  it("shaped-box-keeps-size-when-text-fits", () => {
    // 円柱と角の丸い箱は縁の近くまで内側が広く、絵柄の行を持たない図の名前と下の字はそのまま収まる
    const text = [
      "architecture 収まる箱",
      "",
      "blocks 1",
      "block +store",
      "  base box",
      "  shape cylinder",
      "end",
      "block +pill",
      "  base box",
      "  shape round",
      "end",
      "",
      "box app as アプリ [note: 注文を送る]",
      "+store db as 注文を残す記録の倉庫 [note: 残す]",
      "+pill q as 待ち列 [note: 順に渡す]",
      "",
      "step 送る",
      "  say アプリが注文を記録へ送る。",
      "  app -> db: 注文を書く [carry: none]",
      "",
      "step 渡す",
      "  say 記録が待ち列へ渡す。",
      "  db -> q: 渡す [carry: none]",
      "",
    ].join("\n");
    const rect = (b: Box | undefined) => b && { x: b.x, y: b.y, w: b.w, h: b.h, slot: b.slot };
    const shaped = render(text).layout.boxes;
    const flat = render(text.replace("+store db", "box db").replace("+pill q", "box q")).layout.boxes;
    for (const id of ["db", "q"]) {
      expect(rect(shaped.find((b) => b.id === id)), `${id} の箱の大きさか置き場所か枠が形を持たない箱と違う`).toEqual(rect(flat.find((b) => b.id === id)));
    }
    expect(shapeBreaks(text), "収まる箱の形の崩れ").toEqual([]);
  });

  it("shaped-box-corner-badge-on-outline", () => {
    const text = read(SHAPES);
    const { layout } = render(text);
    // 段 2 は `act gate:` だけの段で、番号はひし形の関所の箱に付く
    const gate = layout.boxes.find((b) => b.id === "gate");
    const badge = layout.badges.find((b) => b.step === 1);
    expect(gate && badge, "関所の箱か段 2 の番号が無い").toBeTruthy();
    if (!gate || !badge) return;
    // ひし形の縁の上の点は、真ん中からの横と縦の離れを半分の幅と高さで割った和が 1 になる
    const onEdge = Math.abs(badge.x - gate.cx) / (gate.w / 2) + Math.abs(badge.y - gate.cy) / (gate.h / 2);
    expect(onEdge, `段 2 の番号 (${badge.x}, ${badge.y}) がひし形の縁の上に無い`).toBeCloseTo(1, 1);
    // 縁の左上の辺に置く。箱の四角の左上の角に近い側
    expect(badge.x, "段 2 の番号がひし形の左半分に無い").toBeLessThan(gate.cx);
    expect(badge.y, "段 2 の番号がひし形の上半分に無い").toBeLessThan(gate.cy);
  });

  it("shaped-box-path-fills-frame", () => {
    const text = read(EVAL_BRIDGE);
    const { svg, layout } = render(text);
    const arch = "M 0 70 Q 50 0 100 70 Z";
    const box = layout.boxes.find((b) => b.id === "br");
    expect(box, "ブリッジの箱が無い").toBeDefined();
    if (!box) return;
    const doc = new DOMParser().parseFromString(svg, "image/svg+xml");
    const card = [...doc.querySelectorAll("path")].find((p) => p.getAttribute("d") === arch && p.getAttribute("class") === "dg-st");
    expect(card, "アーチの path の字をそのまま SVG に出さない").toBeDefined();
    const m = /^translate\(([-\d.]+) ([-\d.]+)\) scale\(([-\d.]+) ([-\d.]+)\)$/u.exec(card?.getAttribute("transform") ?? "");
    expect(m, `アーチの path の伸ばし方を読めない: ${card?.getAttribute("transform")}`).not.toBeNull();
    if (!m) return;
    const [tx, ty, sx, sy] = m.slice(1).map(Number) as [number, number, number, number];
    // アーチを囲む最も小さい四角は、横が 0 から 100、縦が曲線の頂の 35 から底の 70
    const drawn = { x: tx + 0 * sx, y: ty + 35 * sy, w: 100 * sx, h: 35 * sy };
    for (const key of ["x", "y", "w", "h"] as const) expect(drawn[key], `アーチを囲む四角の ${key} が箱の枠と違う`).toBeCloseTo(box[key], 0);
  });

  it("layout-breaks-record-has-no-shape-rows", () => {
    const recorded = JSON.parse(read(RECORDED)) as Record<string, LayoutBreak[]>;
    const rows = Object.values(recorded).flat();
    // 一覧を読めていなければ 0 件は当たり前になる
    expect(rows.length, "崩れの一覧を 1 行も読めない").toBeGreaterThan(0);
    expect(
      Object.entries(recorded).flatMap(([file, breaks]) => breaks.filter((b) => SHAPE_KINDS.includes(b.kind)).map((b) => `${file}: ${JSON.stringify(b)}`)),
      "崩れの一覧に形の崩れの行が在る",
    ).toEqual([]);
  });
});
