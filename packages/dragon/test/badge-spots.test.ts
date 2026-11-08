/**
 * 段の番号の丸の置き場所と、置き場所の崩れを知らせる `dragon check --layout` (#3525)。
 *
 * 同じ箱か点に `act` や `note` の段を 2 つ置くと、2 つの段の番号が同じ所に描かれ、後の段が始まると前の段の番号が消えていた (#3184 の入れ替え)。
 * 箱と点と帯の角の番号は、後の段の番号を前の段の番号の脇に並べ、どちらの数も読めるようにする。
 * 同じ線を何度も通る段の番号と、列の図の右上で段を数える番号は、#3184 のとおり同じ所で数字を入れ替える。
 * 段の番号の丸は、囲みと列と帯の枠線にも乗っていた。番号は枠線を避けて置く。
 *
 * 入れ替わる番号は同時には描かれないので、`dragon check --layout` は前の番号を隠す番号を数えていなかった。
 * 同じ所で入れ替わる番号のうち作りどおりでない物と、枠線に乗る番号を、段と番号と相手を名指して知らせる。
 * 描き方を直した後は見本の図も手で書いた図も枠線に番号を置かないので、枠線の知らせは、置き場所を決めた後の番号を枠線へ動かして確かめる。
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it, vi } from "vitest";

/** 構成図の置き場所を決めた後に、段 `step` の番号を最初の囲みの下の枠線へ動かすか。枠線の知らせを確かめる検査だけが立てる */
const onFrame = vi.hoisted(() => ({ step: undefined as number | undefined }));

vi.mock("../src/kinds/architecture/layout", async (importOriginal) => {
  const real = await importOriginal<typeof import("../src/kinds/architecture/layout")>();
  return {
    ...real,
    layoutArchitecture: (...args: Parameters<typeof real.layoutArchitecture>) => {
      const layout = real.layoutArchitecture(...args);
      const region = layout.regions[0];
      const badge = layout.badges.find((b) => b.step === onFrame.step);
      if (region && badge) badge.y = region.y + region.h - 0.5;
      return layout;
    },
  };
});

/*
 * 描く部品と崩れを数える部品の元の code を、検査の外 (この file を読む段) で先に読む。
 * 検査の中で初めて読むと、混んだ機械では変換だけで 1 件の上限 (10 秒) に近づく (#3410)
 */
const [{ renderDiagram }, { parseNotation }, { findBreaks }, { checkLayoutText, describeBreak }, { checkText, problemLine }, { LOOK }] = await Promise.all([
  import("../src/render/svg"),
  import("../src/parser"),
  import("../src/render/breaks"),
  import("../src/render/layout-check"),
  import("../src/check"),
  import("../src/look/values"),
]);

type Point = [number, number];
type Rect = { x: number; y: number; w: number; h: number };
type Badge = { step: number; x: number; y: number; until?: number };
type Laid = { regions: (Rect & { id: string })[]; strip?: Rect & { title: string }; badges: Badge[] };

const ROOT = process.cwd();
const EXAMPLES = join(ROOT, "packages/dragon/examples");
const FIXTURES = join(ROOT, "packages/dragon/test/fixtures");
const R = LOOK.badge.r;

/** 同じ箱に `act` の段を 2 つ置く構成図 */
const TWO_ACTS = [
  "architecture 注文を書く",
  "",
  "box api as APIサーバー [note: 注文を受ける, icon: server]",
  "box db as DB [note: 注文を保存する, icon: db]",
  "",
  "step 確かめる",
  "  say DB が注文の形を確かめる。",
  "  act db: 形を確かめる",
  "",
  "step 書き込む",
  "  say DB が注文を書き込む。",
  "  act db: 書き込む",
].join("\n");

/** 同じ節目に `note` の段を 2 つ置く時間軸の図 */
const TWO_NOTES = [
  "time checkpoint が正当化されるまで",
  "",
  "scale slot 12s 8",
  "row ブロック [color: blue]",
  "point C1 at 0",
  "",
  "step 提案する",
  "  say C1 が提案される。",
  "  note C1: 提案済み [color: blue]",
  "",
  "step 正当化する",
  "  say C1 が正当化される。",
  "  note C1: 正当化 [color: violet]",
].join("\n");

function laid(text: string, lang: "ja" | "en" = "ja"): Laid {
  const parsed = parseNotation(text, { lang });
  if (!parsed.ok) throw new Error(`記法を読めない: ${parsed.errors.map((e) => e.message).join(" / ")}`);
  return renderDiagram(parsed.diagram, { lang }).layout;
}

/** 段 `step` (1 から数える) を描いた時に見えている段の番号。後の段が同じ所で入れ替えた番号 (`until`) は見えない */
const shownAt = (layout: Laid, step: number): Badge[] => layout.badges.filter((b) => b.step < step && (b.until === undefined || b.until >= step));

const apart = (a: Badge, b: Badge): number => Math.hypot(a.x - b.x, a.y - b.y);

/**
 * 点から囲みか帯の枠線までの距離 (内が負)。枠線は四角を 0.5px 内へ縮め、角を `LOOK.region.radius` で丸めて描く (`band` と `strip`)。
 * 番号の丸は、この距離の絶対値が丸の半径と線の太さの半分 (0.5px) の和より小さいと、枠線に乗る
 */
function outlineDistance([px, py]: Point, r: Rect): number {
  const radius = LOOK.region.radius;
  const qx = Math.abs(px - (r.x + r.w / 2)) - ((r.w - 1) / 2 - radius);
  const qy = Math.abs(py - (r.y + r.h / 2)) - ((r.h - 1) / 2 - radius);
  return Math.hypot(Math.max(qx, 0), Math.max(qy, 0)) + Math.min(Math.max(qx, qy), 0) - radius;
}

describe("同じ所に来た段の番号を脇に並べる (#3525)", () => {
  it("two-acts-on-one-box-keep-both-numbers", () => {
    const shown = shownAt(laid(TWO_ACTS), 2);
    expect(shown.map((b) => b.step + 1), "段 2 を描いた時に見えている段の番号").toEqual([1, 2]);
    const [first, second] = shown as [Badge, Badge];
    // 丸と丸の間を丸の半径より広く空ける (`dragon check --layout` が近すぎる番号に数える下限)
    expect(apart(first, second), "2 つの番号の丸の中心の間").toBeGreaterThanOrEqual(R * 3);
    expect(
      checkLayoutText(TWO_ACTS, { lang: "ja" }).filter((b) => b.kind === "badges-close"),
      "2 つの番号を近すぎる番号に数える",
    ).toEqual([]);
  });

  it("two-notes-on-one-point-keep-both-numbers", () => {
    const shown = shownAt(laid(TWO_NOTES), 2);
    expect(shown.map((b) => b.step + 1), "段 2 を描いた時に見えている段の番号").toEqual([1, 2]);
    const [first, second] = shown as [Badge, Badge];
    expect(apart(first, second), "2 つの番号の丸の中心の間").toBeGreaterThanOrEqual(R * 3);
    expect(
      checkLayoutText(TWO_NOTES, { lang: "ja" }).filter((b) => b.kind === "badges-close"),
      "2 つの番号を近すぎる番号に数える",
    ).toEqual([]);
  });
});

describe("前の番号を隠す番号を知らせる (#3525)", () => {
  it("layout-check-finds-badge-on-same-spot", () => {
    // 段 4 の番号を、段 6 が始まる時に同じ所の段 6 の番号が入れ替える。2 つは同時には見えない
    const rect = { x: 100, y: 100, w: R * 2, h: R * 2 };
    const input = {
      inks: [
        { text: "4", rect, shown: [[1, 3]], boxed: true, badge: true },
        { text: "6", rect: { ...rect }, shown: [[3, Number.POSITIVE_INFINITY]], boxed: true, badge: true },
      ],
      traces: [],
      framed: [],
      stills: [0.5, 1.5, 2.5, 3.5],
      frame: { w: 400, h: 400 },
      boxes: [],
      edges: [],
      outlines: new Map(),
      borders: [],
    } as unknown as Parameters<typeof findBreaks>[0];
    const found = findBreaks(input);
    const hit = { kind: "badges-close", step: 4, parts: [{ kind: "badge", step: 4 }, { kind: "badge", step: 6 }] };
    expect(found, "前の番号を隠す番号を、後の番号が見え始める段の近すぎる番号に数えない").toContainEqual(hit);
    const said = describeBreak(hit as Parameters<typeof describeBreak>[0], "ja");
    expect(said, "知らせる文が 2 つの段の番号を名指さない").toMatch(/段の番号 4.*段の番号 6.*近すぎる/u);
  });

  it("layout-check-skips-shared-line-badges", () => {
    // 同じ線を 4 段で通る図。線の番号は同じ所に置いて数字を入れ替える (#3184)
    const text = readFileSync(join(FIXTURES, "repeat-line.dragon"), "utf8");
    const { badges } = laid(text);
    const shared = badges.filter((a) => badges.some((b) => b !== a && apart(a, b) <= 0.5));
    expect(shared.length, "同じ所で入れ替わる線の番号が無い (確かめる相手が無い)").toBeGreaterThan(1);
    expect(checkLayoutText(text, { lang: "ja" }).filter((b) => b.kind === "badges-close"), "同じ線の番号の入れ替えを崩れに数える").toEqual([]);
  });

  it("layout-check-skips-lineup-counter", () => {
    // 列の図は右上の 1 か所で段を数え、段ごとに数字を入れ替える
    const text = readFileSync(join(EXAMPLES, "auction.dragon"), "utf8");
    const { badges } = laid(text);
    const [first] = badges;
    expect(badges.length, "競りの見本の段が足りない").toBeGreaterThan(2);
    expect(
      badges.every((b) => first !== undefined && apart(b, first) <= 0.5),
      "列の図の段の番号が同じ所に無い (確かめる相手が無い)",
    ).toBe(true);
    expect(checkLayoutText(text, { lang: "ja" }).filter((b) => b.kind === "badges-close"), "列の図の右上の番号を崩れに数える").toEqual([]);
  });
});

/** 番号が枠線に乗っていた見本と段 */
const FRAMED: [string, number][] = [
  ["merge", 7],
  ["rebase", 11],
  ["ccip", 7],
  ["ccip", 10],
  ["merkle", 8],
];

describe("段の番号は枠線を避ける (#3525)", () => {
  it("examples-keep-badges-off-frames", () => {
    const hits = FRAMED.flatMap(([name, step]) =>
      [`${name}.dragon`, `${name}.en.dragon`].flatMap((file) => {
        const layout = laid(readFileSync(join(EXAMPLES, file), "utf8"), file.includes(".en.") ? "en" : "ja");
        const frames = [...layout.regions.map((r) => ({ name: r.id, rect: r })), ...(layout.strip ? [{ name: layout.strip.title, rect: layout.strip }] : [])];
        expect(frames.length, `${file} に囲みも列も帯も無い (確かめる相手が無い)`).toBeGreaterThan(0);
        const shown = shownAt(layout, step);
        expect(shown.length, `${file} の段 ${step} に見えている番号が無い`).toBeGreaterThan(0);
        return shown.flatMap((b) =>
          frames.filter((f) => Math.abs(outlineDistance([b.x, b.y], f.rect)) < R + 0.5).map((f) => `${file} の段 ${step}: 段の番号 ${b.step + 1} が ${f.name} の枠線に乗る`),
        );
      }),
    );
    expect(hits, "枠線に乗る段の番号").toEqual([]);
  });

  it("layout-check-finds-badge-on-frame", () => {
    const file = join(EXAMPLES, "ccip.dragon");
    const text = readFileSync(file, "utf8");
    onFrame.step = 6;
    let lines: string[];
    try {
      lines = checkText(file, text, "notation", "ja", { layout: (step, said) => `段 ${step}: ${said}` }).map(problemLine);
    } finally {
      onFrame.step = undefined;
    }
    const hit = lines.find((line) => line.includes("段の番号 7") && line.includes("送信元チェーン"));
    expect(hit, `段 7 の番号と囲み「送信元チェーン」を名指す行が無い\n${lines.join("\n")}`).toBeDefined();
    expect(hit, "枠線の知らせの行の形").toMatch(/^.+:\d+:1 warning 段 7: 段の番号 7 が「送信元チェーン」の枠線に乗る/u);
    // 動かさない時は、同じ図に枠線の知らせが無い
    const plain = checkText(file, text, "notation", "ja", { layout: (step, said) => `段 ${step}: ${said}` }).map(problemLine);
    expect(plain.filter((line) => line.includes("枠線")), "動かしていない番号を枠線の知らせに出す").toEqual([]);
  });
});
