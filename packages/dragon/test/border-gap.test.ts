/**
 * 線と箱か囲みの枠の間、字とその枠の間 (#3526)。
 *
 * 見本`ccip`の段13の線は、箱の底と囲みの下の枠から 9px の隙間を通り、段の番号13が箱の枠に重なっていた。
 * 見本`vault-proxy`の段9の札の名前は字の間を空けて描くのに、札の幅を字の間の無い幅で測り、札の枠に接していた。
 * 見本`finality`の段10の区間の札は、囲みの上の枠に札の真ん中を置き、札の下の端が棒の上の端に接していた。
 * 描き方を直し、線が枠に余白 (`LOOK.margin`) より近く沿って走る時と、字が自分の枠に接する時に、
 * `dragon check --layout` が段と部品を名指して知らせる。
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import * as dragon from "@cardenelabs/dragon";
import { describe, expect, it } from "vitest";

/*
 * 崩れを数える処理と見た目の値の元の code を、検査の外 (この file を読む段) で先に読む。
 * 検査の中で初めて読むと、混んだ機械で変換だけで上限の 10 秒に近づく (#3410)
 */
const [{ findBreaks }, { LOOK }, { textWidth }, { PIPE_LOOK, PIPE_TYPE }, { ALWAYS }] = await Promise.all([
  import("../src/render/breaks"),
  import("../src/look/values"),
  import("../src/layout/measure"),
  import("../src/look/pipe"),
  import("../src/render/ink"),
]);

const EXAMPLES = join(process.cwd(), "packages/dragon/examples");
/** 崩れの確かめが、字が枠に触れているとみなす間 (px) */
const TOUCH = 2;
/** 足し引きの丸めの誤差 */
const EPSILON = 1e-6;

interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}
type Point = [number, number];

interface Part {
  kind: string;
  name?: string;
  text?: string;
  box?: string;
  from?: string;
  to?: string;
  step?: number;
}
interface Break {
  kind: string;
  step: number;
  parts: Part[];
}

/** 見本 `name` を読んで描く。描いた後の材料 (字と線と箱) も受け取る */
function draw(name: string, lang: "ja" | "en") {
  const text = readFileSync(join(EXAMPLES, name), "utf8");
  const parsed = dragon.parseNotation(text, { lang });
  if (!parsed.ok) throw new Error(`${name} を読めない: ${JSON.stringify(parsed.errors)}`);
  let drawn: { inks: { text: string; rect: Rect; frame?: { name: string; rect: Rect } }[] } | undefined;
  // 描く処理は描いた後に `findBreaks` を呼び、崩れを数える材料を渡す。公開の型は持たないので、変数に入れて渡す
  const options = {
    lang,
    findBreaks: (figure: unknown) => {
      drawn = figure as typeof drawn;
      return [];
    },
  };
  const rendered = dragon.renderDiagram(parsed.diagram, options);
  const breaks = dragon.checkLayoutText(text, { lang }) as unknown as Break[];
  return { rendered, layout: rendered.layout as unknown as Record<string, unknown>, breaks, inks: drawn?.inks ?? [] };
}

const rectDistance = ([px, py]: Point, r: Rect): number => Math.hypot(Math.max(r.x - px, 0, px - (r.x + r.w)), Math.max(r.y - py, 0, py - (r.y + r.h)));

describe("見本の線と字が枠から離れる (#3526)", () => {
  it("border-gap-ccip-line-clears-boxes", () => {
    for (const [file, lang, group] of [
      ["ccip.dragon", "ja", "送信先チェーン"],
      ["ccip.en.dragon", "en", "Destination chain"],
    ] as const) {
      const { layout, breaks } = draw(file, lang);
      const edges = layout.edges as { step: number; from: string; to: string; points: Point[] }[];
      const boxes = layout.boxes as (Rect & { id: string; name: string })[];
      const regions = layout.regions as (Rect & { lines: string[] })[];
      const badges = layout.badges as { step: number; x: number; y: number }[];
      // 段 13 は 0 から数えて 12。OffRamp から Router への線は、間の箱を避けて箱の下を回る
      const line = edges.find((e) => e.step === 12 && e.from === "OffRamp");
      expect(line, `${file} の段 13 に OffRamp から出る線が無い`).toBeDefined();
      if (!line) continue;
      const runs = line.points.slice(1).flatMap((q, k): [Point, Point][] => {
        const p = line.points[k] as Point;
        return p[1] === q[1] && p[0] !== q[0] ? [[p, q]] : [];
      });
      expect(runs.length, `${file} の段 13 の線に横に走る所が無い (走査の空振り)`).toBeGreaterThan(0);
      let measured = 0;
      for (const [p, q] of runs) {
        const [x0, x1] = [Math.min(p[0], q[0]), Math.max(p[0], q[0])];
        const y = p[1];
        for (const box of boxes) {
          if (box.x + box.w <= x0 || box.x >= x1 || box.y + box.h > y) continue;
          measured++;
          expect(y - (box.y + box.h), `${file} の段 13 の線と「${box.name}」の底の間`).toBeGreaterThanOrEqual(LOOK.margin - EPSILON);
        }
        const around = regions.find((r) => r.y <= y && y <= r.y + r.h);
        expect(around?.lines.join(" "), `${file} の段 13 の線が通る囲み`).toBe(group);
        if (around) expect(around.y + around.h - y, `${file} の段 13 の線と囲み「${group}」の下の枠の間`).toBeGreaterThanOrEqual(LOOK.margin - EPSILON);
      }
      // 比べる箱が無ければ、間の検査は当たり前に通る。線の上には OffRamp と間の 2 つの箱と Router が並ぶ
      expect(measured, `${file} の段 13 の線の上の箱を数えられない`).toBeGreaterThanOrEqual(4);
      const offRamp = boxes.find((b) => b.id === "OffRamp") as Rect;
      const badge = badges.find((b) => b.step === 12);
      expect(badge, `${file} の段 13 の番号が無い`).toBeDefined();
      if (badge) expect(rectDistance([badge.x, badge.y], offRamp) - LOOK.badge.r, `${file} の段の番号 13 と OffRamp の箱の枠の間`).toBeGreaterThan(0);
      const near = breaks.filter((b) => b.kind === "line-near-border" && b.parts.some((part) => part.kind === "line" && part.from === "OffRamp"));
      expect(near, `${file} の段 13 の線の崩れ`).toEqual([]);
    }
  });

  it("border-gap-plate-name-inside", () => {
    const style = PIPE_TYPE.tankTitle;
    for (const [file, lang] of [
      ["vault-proxy.dragon", "ja"],
      ["vault-proxy.en.dragon", "en"],
    ] as const) {
      const { layout, breaks } = draw(file, lang);
      const plates = (layout.plates as (Rect & { step: number; name: string; boxed: boolean; label: { x: number; text: string } })[]).filter((p) => p.name === "deposits[alice]" && !p.boxed);
      // 段 9 は 0 から数えて 8
      const at9 = plates.filter((p) => p.step === 8);
      expect(at9, `${file} の段 9 に deposits[alice] の札が無い`).toHaveLength(1);
      for (const p of at9) {
        // 札の名前は字の頭から、字の間 (字の大きさに対する割合) を 1 字ごとに足して描く
        const drawnW = textWidth(p.label.text, style) + [...p.label.text].length * style.size * PIPE_LOOK.tank.titleTrack;
        expect(p.label.x - p.x, `${file} の段 9 の札の名前の左と札の枠の間`).toBeGreaterThanOrEqual(TOUCH);
        expect(p.x + p.w - (p.label.x + drawnW), `${file} の段 9 の札の名前の右と札の枠の間`).toBeGreaterThanOrEqual(TOUCH);
      }
      const touching = breaks.filter((b) => b.kind === "text-touches-border");
      expect(touching, `${file} の字が枠に接する崩れ`).toEqual([]);
    }
  });

  it("border-gap-span-tag-clears-marks", () => {
    for (const [file, lang] of [
      ["finality.dragon", "ja"],
      ["finality.en.dragon", "en"],
    ] as const) {
      const { layout } = draw(file, lang);
      const spans = layout.spans as { step: number; kind: string; text: string; textRect: Rect }[];
      // 段 10 は 0 から数えて 9。区間の囲みの札は囲みの上の枠に乗る
      const tag = spans.find((s) => s.step === 9 && s.kind === "box");
      expect(tag, `${file} の段 10 に区間の囲みが無い`).toBeDefined();
      if (!tag) continue;
      const rows = layout.rows as Rect[];
      const marksTop = Math.min(...rows.map((r) => r.y));
      const axis = (layout.regions as (Rect & { id: string })[]).find((r) => r.id === "axis");
      expect(axis, `${file} に時間軸の帯が無い`).toBeDefined();
      expect(marksTop - (tag.textRect.y + tag.textRect.h), `${file} の段 10 の札「${tag.text}」の下の端と棒の上の端の間`).toBeGreaterThanOrEqual(TOUCH);
      if (axis) expect(tag.textRect.y - axis.y, `${file} の段 10 の札「${tag.text}」の上の端と時間軸の帯の枠の間`).toBeGreaterThanOrEqual(TOUCH);
    }
  });
});

/** 崩れを数える材料の箱。`id` を名札に、`name` を名前に持つ */
const box = (id: string, x: number, y: number, w = 100, h = 72) => ({ id, name: `${id} の箱`, color: "slate", x, y, w, h, cx: x + w / 2, cy: y + h / 2 });
/** 1 段だけの図の止め絵の時刻 */
const STILLS = [0.5];

/** 箱 A から箱 B へ、間の箱 C の下を、箱の底から `below` 離れて回る線と、下の枠が線から `groupGap` 離れた囲み G */
function underRoute(below: number, groupGap: number) {
  const a = box("A", 0, 0);
  const c = box("C", 150, 0);
  const b = box("B", 300, 0);
  // D の上を通る線は、D と番号の丸 2 つ分の長さしか並ばない。短く並ぶ所は崩れに数えない
  const d = box("D", 0, 400);
  const y = 72 + below;
  const points: Point[] = [
    [50, 72],
    [50, y],
    [350, y],
    [350, 72],
  ];
  const short: Point[] = [
    [100 - LOOK.badge.r * 2, 400 - below],
    [200, 400 - below],
  ];
  return {
    inks: [],
    traces: [
      { from: "A", to: "B", points, shown: ALWAYS },
      { from: "A", to: "B", points: short, shown: ALWAYS },
    ],
    stills: STILLS,
    boxes: [a, b, c, d],
    edges: [{ step: 0, event: 0, from: "A", to: "B", points, color: "slate", carry: { kind: "none" } }],
    outlines: new Map<string, Point[][]>(),
    groups: [{ name: "G", x: -20, y: -20, w: 500, h: 20 + y + groupGap }],
  };
}

describe("崩れの確かめが線と字の枠への近さを見る (#3526)", () => {
  it("layout-check-finds-line-near-border", () => {
    const close = findBreaks(underRoute(9, 9) as never) as unknown as Break[];
    const near = close.filter((b) => b.kind === "line-near-border");
    const line = { kind: "line", from: "A の箱", to: "B の箱", step: 1 };
    expect(near, "間の箱と囲みの枠に沿って近すぎる線を 1 件ずつ出さない").toEqual([
      { kind: "line-near-border", step: 1, parts: [line, { kind: "box", name: "C の箱" }] },
      { kind: "line-near-border", step: 1, parts: [line, { kind: "group", name: "G" }] },
    ]);
    // ちょうど余白だけ離れた線は崩れに数えない
    const clear = findBreaks(underRoute(LOOK.margin, LOOK.margin) as never) as unknown as Break[];
    expect(clear.filter((b) => b.kind === "line-near-border"), "余白だけ離れた線を崩れに数える").toEqual([]);
  });

  it("layout-check-finds-text-touching-border", () => {
    const plain = box("E", 0, 0);
    const shaped = box("S", 200, 0);
    const fine = box("F", 400, 0);
    const plate = { x: 0, y: 200, w: 111, h: 100 };
    const ink = (text: string, rect: Rect, extra: Record<string, unknown>) => ({ text, rect, shown: ALWAYS, ...extra });
    const found = findBreaks({
      inks: [
        // 箱の右の枠から 1px の名前
        ink("とても長い箱の名前", { x: 5, y: 30, w: 94, h: 12 }, { box: "E" }),
        // 形を持つ箱の字は形からのはみ出しで見るので、枠に接しても数えない
        ink("形の箱の名前", { x: 201, y: 30, w: 98, h: 12 }, { box: "S" }),
        // 枠から 12px 離れた名前
        ink("ふつうの名前", { x: 412, y: 30, w: 76, h: 12 }, { box: "F" }),
        // 札の右の枠から 1px の札の名前
        ink("deposits[alice]", { x: 10, y: 210, w: 100, h: 13 }, { frame: { name: "deposits[alice]", rect: plate } }),
      ],
      traces: [],
      stills: STILLS,
      boxes: [plain, shaped, fine],
      edges: [],
      outlines: new Map<string, Point[][]>([
        [
          "S",
          [
            [
              [200, 0],
              [300, 0],
              [300, 72],
              [200, 72],
            ],
          ],
        ],
      ]),
      groups: [],
    } as never) as unknown as Break[];
    expect(found.filter((b) => b.kind === "text-touches-border"), "枠に接する字を 1 件ずつ出さない").toEqual([
      { kind: "text-touches-border", step: 1, parts: [{ kind: "text", text: "とても長い箱の名前", box: "E の箱" }, { kind: "box", name: "E の箱" }] },
      { kind: "text-touches-border", step: 1, parts: [{ kind: "text", text: "deposits[alice]", box: "deposits[alice]" }, { kind: "box", name: "deposits[alice]" }] },
    ]);
  });

  it("layout-check-sees-plate-frame", () => {
    const style = PIPE_TYPE.tankTitle;
    const { layout, inks } = draw("vault-proxy.dragon", "ja");
    const plates = (layout.plates as (Rect & { name: string; boxed: boolean })[]).filter((p) => !p.boxed);
    const names = inks.filter((i) => i.text === "deposits[alice]" && i.frame !== undefined);
    expect(names.length, "札の名前の字を札の枠と一緒に記録しない").toBeGreaterThan(0);
    const tracked = textWidth("deposits[alice]", style) + [..."deposits[alice]"].length * style.size * PIPE_LOOK.tank.titleTrack;
    for (const name of names) {
      expect(name.frame?.name, "札の名前の字の枠の名前").toBe("deposits[alice]");
      expect(
        plates.some((p) => p.name === "deposits[alice]" && p.x === name.frame?.rect.x && p.y === name.frame.rect.y && p.w === name.frame.rect.w && p.h === name.frame.rect.h),
        "札の名前の字の枠が札と違う",
      ).toBe(true);
      expect(name.rect.w, "札の名前の字の幅が字の間を含まない").toBeCloseTo(tracked, 6);
    }
    // 札の値の字も札の枠と一緒に記録する
    expect(inks.some((i) => i.text === "1" && i.frame?.name === "deposits[alice]"), "札の値の字を札の枠と一緒に記録しない").toBe(true);
  });

  it("layout-check-names-border-breaks", () => {
    const describe_ = dragon.describeBreak as unknown as (b: Break, lang: "ja" | "en") => string;
    const line = { kind: "line", from: "OffRamp", to: "Router", step: 13 };
    const nearBox = { kind: "line-near-border", step: 13, parts: [line, { kind: "box", name: "Token Pool" }] };
    const nearGroup = { kind: "line-near-border", step: 13, parts: [line, { kind: "group", name: "送信先チェーン" }] };
    const touching = { kind: "text-touches-border", step: 9, parts: [{ kind: "text", text: "deposits[alice]", box: "deposits[alice]" }, { kind: "box", name: "deposits[alice]" }] };
    const jaBox = describe_(nearBox, "ja");
    expect(jaBox, "日本語の文が線と箱を名指さない").toContain("線 OffRamp → Router (段 13)");
    expect(jaBox).toContain("「Token Pool」の枠");
    expect(jaBox, "日本語の文が並んだ 2 本の線の文になる").not.toContain("並んで");
    expect(describe_(nearGroup, "ja"), "日本語の文が囲みを名指さない").toContain("囲み「送信先チェーン」の枠");
    const enBox = describe_(nearBox, "en");
    expect(enBox, "英語の文が線と箱を名指さない").toContain("line OffRamp → Router (step 13)");
    expect(enBox).toContain('border of "Token Pool"');
    expect(describe_(nearGroup, "en"), "英語の文が囲みを名指さない").toContain('border of the group "送信先チェーン"');
    expect(describe_(touching, "ja"), "日本語の文が字と枠を名指さない").toBe("「deposits[alice]」が「deposits[alice]」の枠に接する");
    expect(describe_(touching, "en"), "英語の文が字と枠を名指さない").toBe('"deposits[alice]" touches the border of "deposits[alice]"');
  });
});
