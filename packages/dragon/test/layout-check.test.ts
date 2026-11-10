/**
 * 描いた図の崩れを数えて知らせる `dragon check --layout` (#3484)。
 *
 * skill を入れた Claude が描いた図は、記法が正しく `dragon check` も通るのに、書き出すと番号の丸や線が詰まり、
 * 形を持つブロック (`+bridge` のアーチ) から硬貨の枠や字がはみ出していた。
 * `--layout` を付けた時だけ図を描き、全部の段を既定の幅と幅 390 で見て、崩れを段の番号と関わる 2 つの物で 1 件 1 行ずつ出す。
 * 崩れは描ける図の知らせなので、終わり方は 0 のまま (字の重なり #3178 と同じ扱い)。
 * 線とその両端の箱、グループとその中の箱、箱の角と線の始まりの番号の丸のように、重なって当然の組は数えない。
 * 見本に今ある崩れは数えた一覧 (`fixtures/layout-breaks.json`) に残し、一覧に無い崩れが出たら落とす。
 */
import { existsSync, mkdtempSync, readdirSync, readFileSync, statSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, relative } from "node:path";
import * as dragon from "@cardenelabs/dragon";
import { describe, expect, it, vi } from "vitest";
import { runCli } from "./export-support";

// 書き出しの撮る所だけを差し替え、撮った止め絵の時刻を PNG の中身にする。段の選び方を Chromium を起こさずに確かめる。
// Chromium を起こす書き出しは 1 回で 8 秒かかり、3 回撮って比べると 1 件の上限 (10 秒) を超える
vi.mock("../src/export/capture", async (importOriginal) => {
  const real = await importOriginal<typeof import("../src/export/capture")>();
  return {
    ...real,
    launch: () => Promise.resolve({ close: () => Promise.resolve() }),
    stage: () => Promise.resolve({}),
    still: (_stage: unknown, t: number) => Promise.resolve(Buffer.from(`still at ${t}`)),
  };
});

/*
 * 描く部品と書き出す部品の元の code を、検査の外 (この file を読む段) で先に読む。
 * 元の code は 500 を超える file を読み、検査の中で初めて読むと混んだ機械で変換だけで 9 秒かかる (#3410)
 */
const [{ checkLayout, describeBreak }, { exportDiagram, NoSuchStep }, { renderDiagram }, { parseNotation }, { findBreaks }, { flattenPath }] = await Promise.all([
  import("../src/render/layout-check"),
  import("../src/export/index"),
  import("../src/render/draw"),
  import("../src/parser"),
  import("../src/render/breaks"),
  import("../src/render/outline"),
]);

const ROOT = process.cwd();
const FIXTURES = join(ROOT, "packages/dragon/test/fixtures/layout");
/**
 * 図の頭にアーチの形の `+arch` を定義した背景のブリッジの図。#3520 の前は段 3 の丸と硬貨の枠と下の字がアーチからはみ出した。
 * 共有の `+bridge` は #3489 で角丸の箱になったので、アーチの形を図の頭に残す
 */
const BRIDGE = join(FIXTURES, "bridge.dragon");
/** 自分で定義した `+oracle` (六角形) と `+price` (点線) を使う支払いの図。段3の丸は六角形の上の辺に1pxの間で付く */
const PAYMENT = join(FIXTURES, "payment.dragon");
/** 点線の箱へ入る通らない道が段1から並んで近すぎる状態遷移図 (#3521)。並んで近すぎる線を見つける見本 */
const CROWDED = join(FIXTURES, "crowded-lines.dragon");
/** アーチの形の金庫が硬貨を送り出すだけで、金庫の置き場に運ぶ物が一度も座らない図 (#3518) */
const SEND_ONLY = join(FIXTURES, "send-only.dragon");
/** 重なって当然の組だけを持つ図 */
const INTENDED = join(FIXTURES, "intended.dragon");
/** 評価でAIが書いた橋の図 (#3528)。段6の線の名前「100 USDC を発行して渡す」が隣の列の箱の間より長い */
const EVAL_BRIDGE = join(FIXTURES, "eval-bridge.dragon");
/** 同じ段の 2 本の線の名前をどちらも上に寄せ、2 つ目の名前「送る」が 1 つ目の名前を避けて線から離れる図 (#3528) */
const LABEL_OFF_LINE = join(FIXTURES, "label-off-line.dragon");
/** 段4で、Router から Pool1 への流れの札「100 USDC」を置く管の際が、値の札と束ねた管で塞がる配管の図 (#3528) */
const SWAP_RETRY = join(ROOT, "packages/dragon/examples/swap-retry.dragon");
/** 送る人から作る人へ列を飛ばす網の線が、中継1と中継2の名前を横切る試す図 (#3524) */
const TRY_SKIP = join(FIXTURES, "try-skip.dragon");
/** 見本に今ある崩れの一覧。見本の file ごとに崩れを並べる */
const RECORDED = join(ROOT, "packages/dragon/test/fixtures/layout-breaks.json");
/** 崩れを数える見本の置き場 */
const EXAMPLE_DIRS = ["packages/dragon/examples", "packages/dragon/blocks/examples"].map((dir) => join(ROOT, dir));

type Part =
  | { kind: "badge"; step: number }
  | { kind: "box"; name: string }
  | { kind: "slot"; box: string }
  | { kind: "text"; text: string; box?: string }
  | { kind: "line"; from: string; to: string; step: number };

interface LayoutBreak {
  kind: string;
  step: number;
  width?: number;
  parts: Part[];
}

interface Problem {
  file: string;
  line: number;
  column: number;
  severity: string;
  message: string;
  layout?: LayoutBreak;
}

/** `dragon check --layout --json` を打ち、終わり方と崩れの知らせを返す */
async function layoutOf(file: string, lang: "ja" | "en" = "ja"): Promise<{ code: number; found: LayoutBreak[]; problems: Problem[]; stderr: string }> {
  const ran = await runCli(["check", file, "--layout", "--json", "--lang", lang]);
  let problems: Problem[] = [];
  try {
    problems = JSON.parse(ran.stdout) as Problem[];
  } catch {
    problems = [];
  }
  return { code: ran.code, found: problems.flatMap((p) => (p.layout ? [p.layout] : [])), problems, stderr: ran.stderr };
}

const hasBadge = (b: LayoutBreak, step: number): boolean => b.parts.some((p) => p.kind === "badge" && p.step === step);
const hasBox = (b: LayoutBreak, name: string): boolean => b.parts.some((p) => (p.kind === "box" && p.name === name) || (p.kind === "slot" && p.box === name) || (p.kind === "text" && p.box === name));
const hasLine = (b: LayoutBreak, from: string, to: string, step: number): boolean =>
  b.parts.some((p) => p.kind === "line" && p.from === from && p.to === to && p.step === step);

/** 番号の丸の半径。描く処理の値 (`LOOK.badge.r`) と同じ */
const BADGE_R = 9.5;
/** 描いた物の見え始めの時刻から最後まで見える */
const fromTime = (t: number): [number, number][] => [[t, Number.POSITIVE_INFINITY]];

/**
 * #3520 の前に背景のブリッジの図を描いた時の、アーチの箱の段 3 までの姿。
 * 描く処理は今アーチを箱に収まるよう大きくするので、崩れを持つ姿は描いた座標を写して組む。
 * アーチは 100 四方の path を幅 200、高さ 72 の枠へ伸ばし、頂が枠の上から 25.2、底が 50.4 に来る。
 * 硬貨の枠はアーチの頂より上に、段 3 の下の字はアーチの底より下に、段 3 の番号は箱の四角の左上の角に在る。名前はアーチの内に在る。
 * 硬貨は段 2 にブリッジへ着いて枠に座る。`held` が偽の時は硬貨を持たず、枠に運ぶ物が一度も座らない姿にする (#3518)
 */
function brokenArch(held = true): Parameters<typeof findBreaks>[0] {
  const box = { id: "bridge", name: "ブリッジ", color: "violet" as const, x: 0, y: 0, w: 200, h: 72, cx: 100, cy: 36, slot: { x: 85, y: 8, w: 30, h: 24 } };
  const outline = flattenPath("M 0 70 Q 50 0 100 70 Z").map((ring) => ring.map(([x, y]): [number, number] => [x * 2, y * 0.72]));
  return {
    inks: [
      { text: "ブリッジ", rect: { x: 74, y: 37.6, w: 52, h: 13 }, shown: fromTime(0), box: "bridge" },
      { text: "100 USDC を預かり中", rect: { x: 50, y: 54.2, w: 100, h: 11 }, shown: fromTime(3), box: "bridge" },
      { text: "3", rect: { x: -BADGE_R, y: -BADGE_R, w: BADGE_R * 2, h: BADGE_R * 2 }, shown: fromTime(3), badge: true },
      // 運ぶ物は箱の名札と段の番号の印を持たない字として残る。真ん中が置き場の枠の中に在る間、枠が見える
      ...(held ? [{ text: "100 USDC", rect: { x: 92, y: 12, w: 16, h: 16 }, shown: fromTime(2) }] : []),
    ],
    traces: [],
    // 時間軸の囲みの崩れ (#3527) と図の枠の崩れ (#3515) はこの姿で確かめないので、囲みに収める部品を持たせず、枠は箱の大きさにする
    framed: [],
    frame: { w: box.w, h: box.h },
    stills: [1, 2, 3, 4],
    boxes: [box],
    edges: [],
    outlines: new Map([["bridge", outline]]),
  };
}

/**
 * 検査の見本`lane-overlap.dragon`の4つの箱と、段3の A → C と段4の B → D の線に、段4の名前「四」の札を `rect` に置いた姿の崩れ (#3552)。
 * 線の座標は #3552 の途中で見本を描いた時の形で、A → C が外側、B → D が内側の道を回る。
 * `redrawn` が真なら、段5で B → D を同じ道にもう一度引く。`acFrom` は A → C が見え始める時刻で、無ければ段3の線を引く時
 */
function labelShape(rect: { x: number; y: number; w: number; h: number }, redrawn = false, acFrom?: number): LayoutBreak[] {
  const ac: [number, number][] = [
    [78, 104],
    [78, 139.3],
    [384, 139.3],
    [384, 107],
  ];
  const bd: [number, number][] = [
    [231, 104],
    [231, 118],
    [532, 118],
    [532, 107],
  ];
  const box = (id: string, x: number) => ({ id, name: id.toUpperCase(), color: "blue" as const, x, y: 32, w: 92, h: 72, cx: x + 46, cy: 68 });
  const edge = (from: string, to: string, step: number, points: [number, number][]) => ({ step: step - 1, event: 0, from, to, points, color: "blue" as const, carry: { kind: "none" as const } });
  const boxes = [box("a", 32), box("b", 185), box("c", 338), box("d", 486)];
  // 札の字は、描く処理が記録した札の四角と同じ物を持つ。検査は線の名前とその札の字を、四角が同じ物かで結ぶ
  const label = { ...rect, step: 3, event: 0, text: "四", family: "sans" as const, color: "amber" as const };
  const edges = [edge("a", "c", 3, ac), edge("b", "d", 4, bd), ...(redrawn ? [edge("b", "d", 5, bd.map(([x, y]): [number, number] => [x, y]))] : [])];
  return findBreaks({
    // 名前は段4の間だけ見える
    inks: [{ text: "四", rect: label, shown: [[3.5, 4.5]], boxed: true }],
    traces: edges.map((e) => ({ from: e.from, to: e.to, points: e.points, shown: fromTime(e.from === "a" && acFrom !== undefined ? acFrom : e.step + 0.5) })),
    framed: [],
    stills: redrawn ? [1, 2, 3, 4, 5] : [1, 2, 3, 4],
    frame: { w: 610, h: 180 },
    boxes,
    edges,
    outlines: new Map(),
    layout: { kind: "architecture", width: 610, height: 180, regions: [], boxes, lifelines: [], edges, labels: [label], actions: [], badges: [], paths: [], ends: [] },
  } as never) as LayoutBreak[];
}

/**
 * 検査の見本`label-straddles-group.dragon`の囲み「自社サービス」と、段1の APIサーバー → 価格オラクル の線に、名前「為替レートを聞く」の札を
 * 上の端が `top` の所に置いた姿の崩れ (#3554)。座標は #3554 の前に見本を描いた時の形で、囲みの下の枠線は y = 121.5 を通る
 */
function frameShape(top: number): LayoutBreak[] {
  const region = { id: "ours", x: 14, y: 14, w: 280, h: 108 };
  const box = (id: string, name: string, x: number, y: number, w: number) => ({ id, name, color: "blue" as const, x, y, w, h: 72, cx: x + w / 2, cy: y + 36 });
  const boxes = [box("api", "APIサーバー", 119.3, 32, 97.3), box("oracle", "価格オラクル", 117, 150, 102)];
  const points: [number, number][] = [
    [168, 104],
    [168, 147],
  ];
  const edge = { step: 0, event: 0, from: "api", to: "oracle", points, color: "blue" as const, carry: { kind: "none" as const } };
  // 札の字は、描く処理が記録した札の四角と同じ物を持つ。検査は線の名前とその札の字を、四角が同じ物かで結ぶ
  const label = { x: 182, y: top, w: 106, h: 20, step: 0, event: 0, text: "為替レートを聞く", family: "sans" as const, color: "blue" as const };
  return findBreaks({
    inks: [{ text: label.text, rect: label, shown: fromTime(0.5), boxed: true }],
    traces: [{ from: "api", to: "oracle", points, shown: fromTime(0.5) }],
    framed: [],
    stills: [1],
    frame: { w: 308, h: 236 },
    boxes,
    edges: [edge],
    outlines: new Map(),
    layout: { kind: "architecture", width: 308, height: 236, regions: [region], boxes, lifelines: [], edges: [edge], labels: [label], actions: [], badges: [], paths: [], ends: [] },
    borders: [{ name: "自社サービス", rect: region }],
  } as never) as LayoutBreak[];
}

/**
 * 箱 A、M、B を縦に並べ、段1の A → B の線を `x` の所で真下へ引いた姿 (#3607)。M の名前の字は M の真ん中の幅 40 に在る。
 * `shaped` が真なら、M は四角の左右の端から 20 ずつ内に入った菱形で、四角の端の近くは見えている形の外になる
 */
function behindShape(x: number, shaped = false): LayoutBreak[] {
  const box = (id: string, y: number) => ({
    id,
    name: id.toUpperCase(),
    color: "blue" as const,
    x: 0,
    y,
    w: 200,
    h: 72,
    cx: 100,
    cy: y + 36,
  });
  const boxes = [box("a", 0), box("m", 120), box("b", 240)];
  const points: [number, number][] = [
    [x, 72],
    [x, 240],
  ];
  const edge = {
    step: 0,
    event: 0,
    from: "a",
    to: "b",
    points,
    color: "blue" as const,
    carry: { kind: "none" as const },
  };
  const diamond: [number, number][][] = [
    [
      [100, 120],
      [180, 156],
      [100, 192],
      [20, 156],
    ],
  ];
  return findBreaks({
    inks: [{ text: "M", rect: { x: 80, y: 149, w: 40, h: 14 }, shown: fromTime(0), box: "m" }],
    traces: [{ from: "a", to: "b", points, shown: fromTime(0.5) }],
    framed: [],
    stills: [1],
    frame: { w: 200, h: 312 },
    boxes,
    edges: [edge],
    outlines: shaped ? new Map([["m", diamond]]) : new Map(),
    layout: {
      kind: "architecture",
      width: 200,
      height: 312,
      regions: [],
      boxes,
      lifelines: [],
      edges: [edge],
      labels: [],
      actions: [],
      badges: [],
      paths: [],
      ends: [],
    },
  } as never) as LayoutBreak[];
}

describe("線が箱の裏を通る崩れ (#3607)", () => {
  const crossing = (breaks: LayoutBreak[]): string[] =>
    breaks
      .filter((b) => b.kind === "line-behind-box" || b.kind === "line-crosses-text")
      .map((b) => b.kind);

  it("layout-check-finds-line-behind-box", () => {
    const breaks = behindShape(30);
    expect(
      crossing(breaks),
      "箱の字に掛からずに箱の中を通る線を、箱の裏を通る線として1件で知らせない",
    ).toEqual(["line-behind-box"]);
    const hidden = breaks.find((b) => b.kind === "line-behind-box") as LayoutBreak;
    expect(hidden, "知らせる段と、線と箱の名指し").toEqual({
      kind: "line-behind-box",
      step: 1,
      parts: [
        { kind: "line", from: "A", to: "B", step: 1 },
        { kind: "box", name: "M" },
      ],
    });
    expect(describeBreak(hidden as never, "ja"), "日本語の文が線と箱を名指さない").toContain(
      "線 A → B (段 1)",
    );
    expect(describeBreak(hidden as never, "ja"), "日本語の文が箱の裏を通ると言わない").toContain(
      "「M」の裏を通る",
    );
    expect(describeBreak(hidden as never, "en"), "英語の文が箱の裏を通ると言わない").toContain(
      'runs behind "M"',
    );
  });

  it("layout-check-line-behind-box-skips-crossed-text-and-outside-shape", () => {
    expect(
      crossing(behindShape(100)),
      "箱の字を横切る線を、字を横切る線と箱の裏を通る線の2件で知らせる",
    ).toEqual(["line-crosses-text"]);
    expect(
      crossing(behindShape(10, true)),
      "形を持つ箱の、見えている形の外を通る線を知らせる",
    ).toEqual([]);
    expect(
      crossing(behindShape(60, true)),
      "形を持つ箱の、見えている形の中を通る線を知らせない",
    ).toEqual(["line-behind-box"]);
  });
});

/** file の中で、段 `step` (1 から数える) を始める `step` の行の番号 */
function stepLine(file: string, step: number): number {
  const lines = readFileSync(file, "utf8").split("\n");
  const at = lines.map((line, i) => ({ line, i })).filter(({ line }) => /^step\b/u.test(line))[step - 1];
  return (at?.i ?? -1) + 1;
}

describe("dragon check --layout が崩れを見つける (#3484)", () => {
  it("layout-check-finds-badge-off-shape", () => {
    const found = findBreaks(brokenArch()) as LayoutBreak[];
    const hits = found.filter((b) => b.kind === "badge-off-shape" && hasBadge(b, 3) && hasBox(b, "ブリッジ"));
    expect(hits, "段 3 の丸がアーチから浮くことを 1 件で出さない").toHaveLength(1);
    expect(hits[0]?.step, "浮いた丸の崩れの段").toBe(3);
  });

  it("layout-check-finds-slot-outside-shape", () => {
    const found = findBreaks(brokenArch()) as LayoutBreak[];
    const hits = found.filter((b) => b.kind === "slot-outside-shape" && hasBox(b, "ブリッジ"));
    expect(hits, "硬貨の枠がアーチからはみ出すことを 1 件で出さない").toHaveLength(1);
  });

  it("layout-check-finds-text-outside-shape", () => {
    const found = findBreaks(brokenArch()) as LayoutBreak[];
    const hits = found.filter((b) => b.kind === "text-outside-shape" && b.parts.some((p) => p.kind === "text" && p.text === "100 USDC を預かり中" && p.box === "ブリッジ"));
    expect(hits, "段 3 の下の字がアーチの外へはみ出すことを 1 件で出さない").toHaveLength(1);
    expect(hits[0]?.step, "はみ出した下の字の崩れの段").toBe(3);
    // アーチの内に在る名前は崩れに数えない
    expect(found.filter((b) => b.parts.some((p) => p.kind === "text" && p.text === "ブリッジ")), "アーチの内の名前を崩れに数える").toEqual([]);
  });

  it("layout-check-finds-close-badges", () => {
    // 見本の図も検査の図も、段の番号を崩れの下限より離して置くようになった (#3521、#3525、#3547)。
    // 近すぎる番号を持つ姿は、段 2 と段 3 の番号の丸を縁どうしの間 1px で並べて組む
    const ink = (step: number, x: number): Parameters<typeof findBreaks>[0]["inks"][number] => ({
      text: String(step),
      rect: { x, y: 100, w: BADGE_R * 2, h: BADGE_R * 2 },
      shown: fromTime(step - 1),
      boxed: true,
      badge: true,
    });
    const found = findBreaks({
      inks: [ink(2, 100), ink(3, 100 + BADGE_R * 2 + 1)],
      traces: [],
      framed: [],
      stills: [0.5, 1.5, 2.5],
      frame: { w: 400, h: 400 },
      boxes: [],
      edges: [],
      outlines: new Map(),
    }) as LayoutBreak[];
    const hits = found.filter((b) => b.kind === "badges-close" && hasBadge(b, 2) && hasBadge(b, 3));
    expect(hits, "段 2 と段 3 の丸が近すぎることを 1 件で出さない").toHaveLength(1);
    expect(hits[0]?.step, "2 つの丸が揃って見える最初の段").toBe(3);
  });

  it("layout-check-finds-lines-leaving-one-spot", () => {
    // 構成図も同じ箱の同じ所から出る線を離して描くようになり (#3549)、見本の図にも検査の図にも重なって走る線が無くなった。
    // 重なる線を持つ姿は、#3549 の前に検査の図`overlap-lines.dragon`を描いた時の座標を写して組む。
    // ウォレットの右の縁の同じ所から、段1のトークンへの線と段3のブリッジへの線が出て横に重なり、ブリッジへの線が列の間で下へ折れる
    const token: [number, number][] = [
      [280, 68],
      [371, 68],
    ];
    const bridge: [number, number][] = [
      [280, 68],
      [333, 68],
      [333, 304],
      [284, 304],
    ];
    const box = (id: string, name: string, x: number, y: number) => ({ id, name, color: "blue" as const, x, y, w: 120, h: 72, cx: x + 60, cy: y + 36 });
    const edge = (to: string, step: number, points: [number, number][]) => ({ step: step - 1, event: 0, from: "wallet", to, points, color: "blue" as const, carry: { kind: "none" as const } });
    // 線の段は、描いた線の点の並びを引いて取る。崩れの検査は線と同じ点の並びの持ち主を探すので、線と描いた線に同じ並びを渡す
    const found = findBreaks({
      inks: [],
      traces: [
        { from: "wallet", to: "token", points: token, shown: fromTime(0.5) },
        { from: "wallet", to: "bridge", points: bridge, shown: fromTime(2.5) },
      ],
      framed: [],
      stills: [1, 2, 3],
      frame: { w: 520, h: 360 },
      boxes: [box("wallet", "ウォレット", 160, 32), box("token", "トークン", 375, 32), box("bridge", "ブリッジ", 164, 268)],
      edges: [edge("token", 1, token), edge("bridge", 3, bridge)],
      outlines: new Map(),
    }) as LayoutBreak[];
    const hits = found.filter((b) => b.kind === "lines-close" && hasLine(b, "ウォレット", "トークン", 1) && hasLine(b, "ウォレット", "ブリッジ", 3));
    expect(hits, "ウォレットの同じ所から出て重なるトークンへの線とブリッジへの線を 1 件で出さない").toHaveLength(1);
    expect(hits[0]?.step, "2 本の線が揃って見える最初の段").toBe(3);
  });

  it("layout-check-finds-lines-overlapping-from-different-boxes", () => {
    // 構成図は別々の箱から出て同じ道を回る線も離して描くようになり (#3552)、検査の見本`lane-overlap.dragon`の線は重ならなくなった。
    // 重なる線を持つ姿は、#3552 の前に見本を描いた時の座標を写して組む。
    // 段3の A → C と段4の B → D が、行の下の同じ高さ (y=118) を B の真ん中から C の真ん中まで間0で重なって走る
    const ac: [number, number][] = [
      [78, 104],
      [78, 118],
      [384, 118],
      [384, 107],
    ];
    const bd: [number, number][] = [
      [231, 104],
      [231, 118],
      [532, 118],
      [532, 107],
    ];
    const box = (id: string, x: number) => ({ id, name: id.toUpperCase(), color: "blue" as const, x, y: 32, w: 92, h: 72, cx: x + 46, cy: 68 });
    const edge = (from: string, to: string, step: number, points: [number, number][]) => ({ step: step - 1, event: 0, from, to, points, color: "blue" as const, carry: { kind: "none" as const } });
    // 線の段は、描いた線の点の並びを引いて取る。崩れの検査は線と同じ点の並びの持ち主を探すので、線と描いた線に同じ並びを渡す
    const found = findBreaks({
      inks: [],
      traces: [
        { from: "a", to: "c", points: ac, shown: fromTime(2.5) },
        { from: "b", to: "d", points: bd, shown: fromTime(3.5) },
      ],
      framed: [],
      stills: [1, 2, 3, 4],
      frame: { w: 610, h: 160 },
      boxes: [box("a", 32), box("b", 185), box("c", 338), box("d", 486)],
      edges: [edge("a", "c", 3, ac), edge("b", "d", 4, bd)],
      outlines: new Map(),
    }) as LayoutBreak[];
    const hits = found.filter((b) => b.kind === "lines-close" && hasLine(b, "A", "C", 3) && hasLine(b, "B", "D", 4));
    expect(hits, "行の下の同じ道を間0で重なって走る A → C と B → D を 1 件で出さない").toHaveLength(1);
    expect(hits[0]?.step, "2 本目の線を引く段").toBe(4);
  });

  it("layout-check-skips-lines-merging-into-one-box", () => {
    // 別々の箱から同じ箱へ入る2本の線は、入る前に合わさって同じ道を走ってよい。どちらの線も同じ箱へ向かうと読めるため (#3552)。
    // 検査の図`crowd-side.dragon`の段1と段2の線の座標を写す。画面から通知への線が受け付けの下で折れ、受け付けから通知への線に合わさって通知の上へ入る
    const direct: [number, number][] = [
      [163, 104],
      [163, 157],
    ];
    const joining: [number, number][] = [
      [289.8, 104],
      [289.8, 118],
      [163, 118],
      [163, 157],
    ];
    const box = (id: string, x: number, y: number) => ({ id, name: id, color: "blue" as const, x, y, w: 92, h: 72, cx: x + 46, cy: y + 36 });
    const edge = (from: string, step: number, points: [number, number][]) => ({ step: step - 1, event: 0, from, to: "通知", points, color: "blue" as const, carry: { kind: "none" as const } });
    const found = findBreaks({
      inks: [],
      traces: [
        { from: "受け付け", to: "通知", points: direct, shown: fromTime(0.5) },
        { from: "画面", to: "通知", points: joining, shown: fromTime(1.5) },
      ],
      framed: [],
      stills: [1, 2],
      frame: { w: 400, h: 260 },
      boxes: [box("受け付け", 117, 32), box("画面", 265, 32), box("通知", 117, 160)],
      edges: [edge("受け付け", 1, direct), edge("画面", 2, joining)],
      outlines: new Map(),
    }) as LayoutBreak[];
    expect(found.filter((b) => b.kind === "lines-close"), "同じ箱へ入る前に合わさる2本の線を並んで近すぎる線に数える").toEqual([]);
  });

  it("layout-check-finds-label-on-another-line", () => {
    // 線の名前の札が別の線に乗ると、その線の名前に読める (#3552)。段4の B → D の名前「四」が、段3の A → C が C へ上る縦の区間と、その手前の横の区間に乗る
    const on = labelShape({ x: 370, y: 122, w: 29, h: 20 }).filter((b) => b.kind === "label-on-line");
    expect(on, "B → D の名前が A → C に乗ることを、段と名前と乗った線で 1 件にしない").toEqual([
      { kind: "label-on-line", step: 4, parts: [{ kind: "text", text: "四" }, { kind: "line", from: "A", to: "C", step: 3 }] },
    ]);
    expect(describeBreak(on[0] as Parameters<typeof describeBreak>[0], "ja"), "日本語の文が名前と乗った線を名指さない").toBe("「四」が線 A → C (段 3)に乗る");
    expect(describeBreak(on[0] as Parameters<typeof describeBreak>[0], "en"), "英語の文が名前と乗った線を名指さない").toBe('"四" sits on the line A → C (step 3)');
    // 描く処理が今置く所 (C と D の間の、B → D の上) は、どの線にも乗らない
    expect(labelShape({ x: 443, y: 86, w: 29, h: 20 }).filter((b) => b.kind === "label-on-line"), "別の線に乗らない名前を数える").toEqual([]);
    // 名前が乗る線が自分の線と同じ道を別の段でもう一度引いた線なら、自分の線なので数えない
    expect(
      labelShape({ x: 300, y: 108, w: 29, h: 20 }, true).filter((b) => b.kind === "label-on-line"),
      "自分の線と同じ道をもう一度引いた線に乗る名前を数える",
    ).toEqual([]);
  });

  it("layout-check-finds-label-nearer-another-line", () => {
    // 線の名前が、名指す線から描く処理の最初の離れ (12px) に在っても、別の線がそれより近いと、近い線の名前に読める (#3552)。
    // 段4の B → D の名前「四」が B → D の 12px 下で、A → C が C へ上る縦の区間の 3px 右に在る
    const near = labelShape({ x: 387, y: 130, w: 29, h: 20 });
    expect(near.filter((b) => b.kind === "label-off-line"), "B → D より A → C の近くに在る名前を、段と名前と名指す線で 1 件にしない").toEqual([
      { kind: "label-off-line", step: 4, parts: [{ kind: "text", text: "四" }, { kind: "line", from: "B", to: "D", step: 4 }] },
    ]);
    expect(near.filter((b) => b.kind === "label-on-line"), "別の線の近くに在るだけの名前を、別の線に乗る名前に数える").toEqual([]);
    // 名指す線が最も近い名前は数えない。描く処理が今置く所は、名指す線の 12px 上で、ほかの線はずっと遠い
    expect(labelShape({ x: 443, y: 86, w: 29, h: 20 }).filter((b) => b.kind === "label-off-line"), "名指す線が最も近い名前を離れた名前に数える").toEqual([]);
    // 別の線に乗る名前は`label-on-line`だけで知らせ、離れた名前に重ねて数えない
    expect(labelShape({ x: 370, y: 122, w: 29, h: 20 }).filter((b) => b.kind === "label-off-line"), "別の線に乗る名前を離れた名前にも数える").toEqual([]);
    // 比べるのは名前と同じ止め絵に見えている線で、名前が消えた後に見え始める線は比べない
    expect(
      labelShape({ x: 387, y: 130, w: 29, h: 20 }, false, 5).filter((b) => b.kind === "label-off-line"),
      "名前と同じ止め絵に見えない線との近さで、離れた名前に数える",
    ).toEqual([]);
  });

  it("layout-check-finds-label-on-frame", () => {
    // 線の名前の札に囲みの枠線が刺さると、枠線と字が重なって読みにくい (#3554)。
    // 段1の名前「為替レートを聞く」の札 (y = 115.5 から 135.5) を、囲み「自社サービス」の下の枠線 (y = 121.5) が横切る
    const on = frameShape(115.5).filter((b) => b.kind === "label-on-frame");
    expect(on, "名前の札が囲みの枠線をまたぐことを、段と名前と囲みで 1 件にしない").toEqual([
      { kind: "label-on-frame", step: 1, parts: [{ kind: "text", text: "為替レートを聞く" }, { kind: "border", name: "自社サービス" }] },
    ]);
    expect(describeBreak(on[0] as Parameters<typeof describeBreak>[0], "ja"), "日本語の文が名前と囲みの枠線を名指さない").toBe("「為替レートを聞く」が「自社サービス」の枠線に乗る");
    expect(describeBreak(on[0] as Parameters<typeof describeBreak>[0], "en"), "英語の文が名前と囲みの枠線を名指さない").toBe('"為替レートを聞く" sits on the border of "自社サービス"');
    // 札が囲みの内に在る姿と、枠線から離れて囲みの外に在る姿は数えない
    expect(frameShape(60).filter((b) => b.kind === "label-on-frame"), "囲みの内に在る名前を枠線に乗る名前に数える").toEqual([]);
    expect(frameShape(128).filter((b) => b.kind === "label-on-frame"), "囲みの外に在る名前を枠線に乗る名前に数える").toEqual([]);
  });

  it("layout-check-finds-crowded-lines", async () => {
    const { found } = await layoutOf(CROWDED);
    const hits = found.filter((b) => b.kind === "lines-close" && hasLine(b, "受付", "取消", 1) && hasLine(b, "確認", "取消", 1));
    expect(hits, "受付と確認から取消へ入る道が並んで近すぎることを1件で出さない").toHaveLength(1);
  });

  it("layout-check-line-names-step-and-parts", async () => {
    // 段の番号を名指す文は、近すぎる番号を持つ姿を組んで確かめる (`layout-check-finds-close-badges` と `badge-spots.test.ts`)。
    // 見本の図に近すぎる番号が無くなったので (#3547)、命令の行の形は並んで近すぎる道を持つ状態遷移図で確かめる
    const ja = await runCli(["check", CROWDED, "--layout", "--lang", "ja"]);
    expect(ja.code, ja.stderr).toBe(0);
    const lines = ja.stdout.trimEnd().split("\n");
    const crowded = lines.find((line) => line.includes("線 受付 → 取消 (段 1)") && line.includes("線 確認 → 取消 (段 1)"));
    expect(crowded, `受付と確認から取消への道を名指す行が無い\n${ja.stdout}`).toBeDefined();
    // 行は `<file>:<段の step の行>:1 warning 段 <N>: <文>` の形で、崩れが見え始める段の行を名指す
    expect(crowded, "線の崩れの行の頭").toMatch(new RegExp(`^${CROWDED.replace(/[.*+?^${}()|[\]\\]/gu, "\\$&")}:${stepLine(CROWDED, 1)}:1 warning 段 1: `, "u"));
    const en = await runCli(["check", CROWDED, "--layout", "--lang", "en"]);
    const crowdedEn = en.stdout.trimEnd().split("\n").find((line) => line.includes("受付 → 取消"));
    expect(crowdedEn, `英語の行が段と線を名指さない\n${en.stdout}`).toMatch(/warning Step 1: The line 受付 → 取消 \(step 1\) and the line 確認 → 取消 \(step 1\) /u);
    // はみ出した字の文は、字と箱の名前を名指す。形を持つ箱は中身が収まるまで大きくなるので (#3520)、崩れを持つ前のアーチの姿で確かめる
    const text = (findBreaks(brokenArch()) as LayoutBreak[]).find((b) => b.kind === "text-outside-shape");
    expect(text && describeBreak(text as never, "en"), "英語の文がはみ出した字と箱を名指さない").toBe('"100 USDC を預かり中" sticks out of the shape of "ブリッジ"');
  });

  it("layout-check-prints-json", async () => {
    // 決済の図は行きと帰りの線を離し (#3521)、六角形の箱が中身に合わせて大きくなって (#3520) 崩れを持たず、
    // 近すぎる丸を持っていたgit図も線を離して崩れが消えたので (#3547)、並んで近すぎる道を持つ図で確かめる
    const { code, problems } = await layoutOf(CROWDED);
    expect(code).toBe(0);
    const layout = problems.filter((p) => p.layout !== undefined);
    expect(layout.length, "JSON に崩れが無い").toBeGreaterThan(0);
    for (const p of layout) {
      expect(p.severity, "崩れの重さ").toBe("warning");
      expect(p.file).toBe(CROWDED);
      expect(p.line, "崩れの段の step の行").toBe(stepLine(CROWDED, p.layout?.step ?? 0));
      expect(p.layout?.parts, "崩れに関わる物").toHaveLength(2);
      expect(Number.isInteger(p.layout?.step), "崩れの段").toBe(true);
    }
  });

  it("layout-check-merges-repeated-steps", () => {
    const found = findBreaks(brokenArch()) as LayoutBreak[];
    // 置き場の枠は運ぶ物が座っている間だけ見える (#3518)。硬貨は段 2 にブリッジへ着き、それから後の段で枠はアーチからはみ出したまま見えている
    const slots = found.filter((b) => b.kind === "slot-outside-shape");
    expect(slots.map((b) => b.step), "続く段の同じ崩れを、硬貨が座り始める段 2 の 1 件にまとめない").toEqual([2]);
  });

  it("layout-check-skips-slot-never-held", async () => {
    // アーチの形の金庫は硬貨を送り出すだけで、硬貨は金庫の置き場で待たない。見えない枠のはみ出しは知らせない (#3518)
    const { found } = await layoutOf(SEND_ONLY);
    expect(found.filter((b) => b.kind === "slot-outside-shape"), "運ぶ物が一度も座らない枠のはみ出しを知らせる").toEqual([]);
    // 形を持つ箱は中身が収まるまで大きくなり、描いた図には形の崩れが無い (#3520)。崩れを持つ #3520 の前のアーチの姿で、座らない枠を数えないことも確かめる
    const empty = findBreaks(brokenArch(false)) as LayoutBreak[];
    expect(empty.filter((b) => b.kind === "slot-outside-shape"), "運ぶ物が一度も座らないアーチの枠のはみ出しを知らせる").toEqual([]);
    expect(empty.filter((b) => b.kind === "text-outside-shape" && hasBox(b, "ブリッジ")).length, "アーチの形の崩れを測っていない").toBeGreaterThan(0);
  });

  it("layout-check-names-narrow-width", async () => {
    const seen: (number | undefined)[] = [];
    const both = { kind: "badges-close", step: 2, parts: [{ kind: "badge", step: 1 }, { kind: "badge", step: 2 }] };
    const narrowOnly = { kind: "lines-close", step: 3, parts: [{ kind: "line", from: "a", to: "b", step: 2 }, { kind: "line", from: "b", to: "a", step: 3 }] };
    // 描く所を差し替え、幅 390 で描いた時だけ線の詰まりが出る図にする
    const render = (width: number | undefined) => {
      seen.push(width);
      return width === 390 ? [both, narrowOnly] : [both];
    };
    const merged = checkLayout(render as never);
    expect(seen, "既定の幅と幅 390 の両方で描かない").toEqual([undefined, 390]);
    expect(merged, "両方の幅で出る崩れは幅を持たず、幅 390 でだけ出る崩れは幅を持つ").toEqual([both, { ...narrowOnly, width: 390 }]);
    const lines = await runCli(["check", PAYMENT, "--layout", "--json"]);
    const widths = (JSON.parse(lines.stdout || "[]") as Problem[]).flatMap((p) => (p.layout?.width === undefined ? [] : [p.layout.width]));
    expect(widths, "幅で変わらない図で幅を名指す").toEqual([]);
  });

  it("layout-check-finds-line-across-node-name", async () => {
    // 試す図の網の線も、ほかの線と同じく札を持たない字を横切れば崩れとして出す
    const { code, found, problems, stderr } = await layoutOf(TRY_SKIP);
    expect(code, `崩れだけの図で終わり方 0 にならない ${stderr}`).toBe(0);
    const across = (name: string): LayoutBreak[] =>
      found.filter((b) => b.kind === "line-crosses-text" && hasLine(b, "送る人", "作る人", 1) && b.parts.some((p) => p.kind === "text" && p.text === name));
    for (const name of ["中継1", "中継2"]) {
      const hits = across(name);
      expect(hits, `線 送る人 → 作る人 が名前「${name}」を横切ることを 1 件で出さない ${JSON.stringify(found)}`).toHaveLength(1);
      expect(hits[0]?.step, `名前「${name}」を横切る崩れの段`).toBe(1);
      expect(hits[0]?.parts.map((p) => p.kind), "崩れに関わる 2 つの物").toEqual(["line", "text"]);
    }
    const lines = problems.filter((p) => p.layout?.kind === "line-crosses-text");
    for (const p of lines) {
      expect(p.severity, "線が字を横切る崩れの重さ").toBe("warning");
      expect(p.line, "線が字を横切る崩れの段の step の行").toBe(stepLine(TRY_SKIP, 1));
    }
    // 文の行は段を頭に書き、線の両端の節と横切られる名前を名指す
    const ja = await runCli(["check", TRY_SKIP, "--layout", "--lang", "ja"]);
    const said = ja.stdout.trimEnd().split("\n").find((line) => line.includes("中継1"));
    expect(said, `名前「中継1」を名指す行が無い\n${ja.stdout}`).toMatch(new RegExp(`^${TRY_SKIP.replace(/[.*+?^${}()|[\]\\]/gu, "\\$&")}:${stepLine(TRY_SKIP, 1)}:1 warning 段 1: `, "u"));
    expect(said, "行が線の両端の節を名指さない").toMatch(/送る人.*作る人/u);
  });

  it("layout-check-skips-intended-overlaps", async () => {
    const intended = await layoutOf(INTENDED);
    expect(intended.code, intended.stderr).toBe(0);
    expect(intended.problems, "重なって当然の組だけの図で崩れを出す").toEqual([]);
    // 決済の図の段 3 の丸は、線の始まりに置く丸で、六角形の上の辺との 1px の間は崩れでない。
    // 行きと帰りの線を離し (#3521)、六角形の箱が中身に合わせて大きくなった (#3520) ので、決済の図はほかに崩れを持たず、丸を数えれば 1 件になる
    const { found } = await layoutOf(PAYMENT);
    const oracleBadge = found.filter((b) => hasBadge(b, 3) && hasBox(b, "価格オラクル"));
    expect(oracleBadge, "線の始まりの丸と、その線を出す箱を崩れに数える").toEqual([]);
    expect(found, "決済の図に崩れを出す").toEqual([]);
  });
});

/** 見本の置き場の `.dragon` を全て。見本の file の名前は repo の根からの path にする */
function exampleFiles(): string[] {
  return EXAMPLE_DIRS.flatMap((dir) =>
    existsSync(dir)
      ? readdirSync(dir)
          .filter((name) => name.endsWith(".dragon") && statSync(join(dir, name)).isFile())
          .map((name) => join(dir, name))
      : [],
  ).sort();
}

describe("共有の橋のブロックは形の崩れを出さない (#3489)", () => {
  it("layout-check-shared-bridge-has-no-shape-breaks", () => {
    const checkLayoutText = (dragon as unknown as { checkLayoutText?: (text: string, options: { lang: "ja" | "en" }) => LayoutBreak[] }).checkLayoutText;
    expect(checkLayoutText, "checkLayoutText が @cardenelabs/dragon から出ていない").toBeDefined();
    if (checkLayoutText === undefined) return;
    const text = readFileSync(BRIDGE, "utf8");
    // 図の頭のアーチの定義を外し、同じ箱を共有の橋のブロックで描く
    const shared = text.replace(/^blocks 1\n(?:.*\n)*?end\n\n?/mu, "").replaceAll("+arch ", "+bridge ");
    expect(shared, "背景のブリッジの図から図の頭の定義を外せない").not.toMatch(/^block \+arch/mu);
    expect(shared, "背景のブリッジの図に共有の橋の行が無い").toMatch(/^\+bridge /mu);
    // 形の崩れを見つけることは、#3520 の前のアーチの姿を写した検査 (layout-check-finds-*) が確かめる
    const shapeKinds = ["slot-outside-shape", "text-outside-shape", "badge-off-shape"];
    expect(checkLayoutText(shared, { lang: "ja" }).filter((b) => shapeKinds.includes(b.kind)), "共有の橋の図が出した形の崩れ").toEqual([]);
  });
});

type Point = [number, number];
interface Box {
  x: number;
  y: number;
  w: number;
  h: number;
}

/**
 * 札の四角から折れ線までの離れ。縦か横の区間は幅か高さが 0 の四角とみなし、2 つの四角の間の離れの最小を取る。
 * 構成図と配管の図の線は縦と横の区間だけで引くので、この形で測れる
 */
function lineGap(points: Point[], r: Box): number {
  return Math.min(
    ...points.slice(1).map((b, k) => {
      const a = points[k] as Point;
      const dx = Math.max(0, Math.min(a[0], b[0]) - (r.x + r.w), r.x - Math.max(a[0], b[0]));
      const dy = Math.max(0, Math.min(a[1], b[1]) - (r.y + r.h), r.y - Math.max(a[1], b[1]));
      return Math.hypot(dx, dy);
    }),
  );
}

/**
 * 記法を dist の部品で読み、図の中の字を言葉 `lang` で描いた置き場所。配管の図の置き場所の欄も読めるよう、型を緩めて返す。
 * `dragon export` は `--lang` を渡さなければ英語の字で描くので、日本語の記法も英語の字で描いて確かめる
 */
function drawnLayout(file: string, lang: "ja" | "en" = "ja"): Record<string, unknown> {
  const parsed = dragon.parseNotation(readFileSync(file, "utf8"), { lang: "ja" });
  if (!parsed.ok) throw new Error(`${file} を読めない: ${JSON.stringify(parsed.errors)}`);
  return dragon.renderDiagram(parsed.diagram, { lang }).layout as unknown as Record<string, unknown>;
}

describe("線の名前と札を線の近くに描く (#3528)", () => {
  it("label-near-line-in-eval-bridge", () => {
    const layout = drawnLayout(EVAL_BRIDGE) as { labels: (Box & { step: number; event: number; text: string })[]; edges: { step: number; event: number; points: Point[] }[] };
    const gaps = layout.labels.map((label) => {
      const edge = layout.edges.find((e) => e.step === label.step && e.event === label.event);
      if (!edge) throw new Error(`線の名前「${label.text}」の線が無い`);
      return { text: label.text, gap: lineGap(edge.points, label) };
    });
    const target = gaps.find((g) => g.text === "100 USDC を発行して渡す");
    expect(target, "段6の線の名前が無い").toBeDefined();
    const others = gaps.filter((g) => g !== target).map((g) => g.gap);
    // 比べる相手が無ければ最大は -Infinity になり、検査が空振りする
    expect(others.length, "比べるほかの線の名前が無い").toBeGreaterThan(0);
    expect(target?.gap, `段6の線の名前と線の間 (ほかの名前と線の間は ${others.join(", ")})`).toBeLessThanOrEqual(Math.max(...others));
  });

  it("amount-chip-near-flow-in-swap-retry", () => {
    // 英語の字では値の札の下の語 (Pending) が長く、管の際の空きが日本語の字より狭い
    for (const lang of ["ja", "en"] as const) {
      const layout = drawnLayout(SWAP_RETRY, lang) as {
        chips: (Box & { kind: string; text: string; step: number; flow?: number })[];
        flows: { id: number; step: number; from: string; to: string; points: Point[] }[];
        housings: (Box & { party: string })[];
      };
      const flowOf = (chip: { step: number; flow?: number }) => layout.flows.find((f) => f.id === chip.flow && f.step === chip.step);
      const amounts = layout.chips.filter((c) => c.kind === "amount" && flowOf(c) !== undefined);
      // 段4 (0 から数えて 3) の、Router から Pool1 への流れの札
      const target = amounts.find((c) => c.step === 3 && flowOf(c)?.from === "router" && flowOf(c)?.to === "pool1");
      expect(target, `${lang} の字で、段4の Router から Pool1 への流れの札が、その流れを名指さない`).toBeDefined();
      if (!target) return;
      expect(target.text).toBe("100 USDC");
      const gap = lineGap(flowOf(target)?.points ?? [], target);
      // 同じ流れの札は後の段にも残るので、ほかの流れの札と比べる
      const others = amounts.filter((c) => c.flow !== target.flow).map((c) => lineGap(flowOf(c)?.points ?? [], c));
      expect(others.length, "比べるほかの流れの札が無い").toBeGreaterThan(0);
      expect(gap, `${lang} の字で、札と流れの間 (ほかの流れの札と流れの間の最大は ${Math.max(...others)})`).toBeLessThanOrEqual(Math.max(...others));
      const inside = (r: Box, h: Box): boolean => r.x >= h.x && r.y >= h.y && r.x + r.w <= h.x + h.w && r.y + r.h <= h.y + h.h;
      expect(
        layout.housings.filter((h) => inside(target, h)).map((h) => h.party),
        `${lang} の字で、札 ${JSON.stringify([target.x, target.y, target.w, target.h])} が囲みの内側に無い`,
      ).not.toEqual([]);
    }
  });

  it("layout-check-finds-label-off-line", async () => {
    const { code, found, problems, stderr } = await layoutOf(LABEL_OFF_LINE);
    expect(code, stderr).toBe(0);
    const off = found.filter((b) => b.kind === "label-off-line");
    // 1 つ目の名前「残高を見る」は線の上の最初の置き場に在るので数えない
    expect(off, "2 つ目の名前が線から離れることを 1 件で出さない").toEqual([
      { kind: "label-off-line", step: 1, parts: [{ kind: "text", text: "送る" }, { kind: "line", from: "アプリ", to: "API", step: 1 }] },
    ]);
    const problem = problems.find((p) => p.layout?.kind === "label-off-line");
    expect(problem?.line, "知らせの行が段1の step の行を名指さない").toBe(stepLine(LABEL_OFF_LINE, 1));
    const ja = await runCli(["check", LABEL_OFF_LINE, "--layout", "--lang", "ja"]);
    expect(ja.stdout, "日本語の行が段と名前と線を名指さない").toContain("warning 段 1: 「送る」が線 アプリ → API (段 1)から離れて描かれる");
    const en = await runCli(["check", LABEL_OFF_LINE, "--layout", "--lang", "en"]);
    expect(en.stdout, "英語の行が段と名前と線を名指さない").toContain('warning Step 1: "送る" is drawn away from the line アプリ → API (step 1)');

    // 配管の図の流れた量の札も、名指す流れの管から離れていれば知らせる。札を出した段の 1 件にまとめる
    const pipe = {
      kind: "pipe",
      labels: [],
      edges: [],
      parties: [
        { id: "a", name: "Alice" },
        { id: "b", name: "Bob" },
      ],
      flows: [0, 1].map((step) => ({ id: 7, step, from: "a", to: "b", fresh: step === 0, points: [[0, 100], [300, 100]] })),
      chips: [
        // 管の際 (管の真ん中から 22) に置いた札と、管から 100 離れた札
        { kind: "amount", text: "5 ETH", step: 0, flow: 7, x: 100, y: 122, w: 60, h: 22 },
        { kind: "amount", text: "5 ETH", step: 1, flow: 7, x: 100, y: 200, w: 60, h: 22 },
        // 流れを名指さない札 (狭い枠の図の下の帯の札) は数えない
        { kind: "amount", text: "5 ETH", step: 1, x: 100, y: 400, w: 60, h: 22 },
      ],
    };
    const breaks = findBreaks({ inks: [], traces: [], framed: [], stills: [0, 1], frame: { w: 1280, h: 800 }, boxes: [], edges: [], outlines: new Map(), layout: pipe } as never);
    expect(breaks, "管から離れた流れた量の札を知らせない").toEqual([
      { kind: "label-off-line", step: 2, parts: [{ kind: "text", text: "5 ETH" }, { kind: "line", from: "Alice", to: "Bob", step: 1 }] },
    ]);
  });
});

describe("見本に今ある崩れ (#3484)", () => {
  it("layout-check-examples-match-recorded", () => {
    const checkLayoutText = (dragon as unknown as { checkLayoutText?: (text: string, options: { lang: "ja" | "en" }) => LayoutBreak[] }).checkLayoutText;
    expect(checkLayoutText, "checkLayoutText が @cardenelabs/dragon から出ていない").toBeDefined();
    if (checkLayoutText === undefined) return;
    expect(existsSync(RECORDED), `${relative(ROOT, RECORDED)} が無い`).toBe(true);
    const recorded = existsSync(RECORDED) ? (JSON.parse(readFileSync(RECORDED, "utf8")) as Record<string, LayoutBreak[]>) : {};
    const files = exampleFiles();
    // 走査の空振りを避ける。見本は 2 つの置き場に 1 つ以上ずつある
    expect(files.length, "見本を数えられない").toBeGreaterThan(EXAMPLE_DIRS.length);
    const key = (b: LayoutBreak): string => JSON.stringify(b);
    const grown = files.flatMap((file) => {
      const name = relative(ROOT, file);
      const lang = file.includes(".en.") ? "en" : "ja";
      const known = new Set((recorded[name] ?? []).map(key));
      return checkLayoutText(readFileSync(file, "utf8"), { lang })
        .filter((b) => !known.has(key(b)))
        .map((b) => `${name}: ${key(b)}`);
    });
    expect(grown, "一覧に無い崩れが見本に出た").toEqual([]);
  });
});

describe("見本帳の図は崩れを出さない (#3607)", () => {
  it("gallery-warns-nothing", () => {
    const checkLayoutText = (
      dragon as unknown as {
        checkLayoutText?: (text: string, options: { lang: "ja" | "en" }) => LayoutBreak[];
      }
    ).checkLayoutText;
    expect(checkLayoutText, "checkLayoutText が @cardenelabs/dragon から出ていない").toBeDefined();
    if (checkLayoutText === undefined) return;
    const files = galleryFiles();
    // 走査の空振りを避ける。見本帳の図は、ブロックごとに日本語と英語の2枚ずつある
    expect(files.length, "見本帳の図を数えられない").toBeGreaterThan(1);
    const broken = files.flatMap((file) =>
      checkLayoutText(readFileSync(file, "utf8"), {
        lang: file.includes(".en.") ? "en" : "ja",
      }).map((b) => `${relative(ROOT, file)}: ${JSON.stringify(b)}`),
    );
    expect(broken, "見本帳の図に崩れが残る").toEqual([]);
  });
});

/** 見本帳の図。ブロックごとの`gallery`の置き場の`.dragon`を全て */
function galleryFiles(): string[] {
  const blocks = join(ROOT, "packages/dragon/src/blocks");
  return readdirSync(blocks)
    .map((name) => join(blocks, name, "gallery"))
    .filter((dir) => existsSync(dir) && statSync(dir).isDirectory())
    .flatMap((dir) =>
      readdirSync(dir)
        .filter((name) => name.endsWith(".dragon"))
        .map((name) => join(dir, name)),
    )
    .sort();
}

describe("dragon export --step (#3484)", () => {
  it("export-png-at-step", async () => {
    const parsed = parseNotation(readFileSync(PAYMENT, "utf8"), { lang: "ja" });
    if (!parsed.ok) throw new Error(`決済の図を読めない: ${JSON.stringify(parsed.errors)}`);
    const { stills } = renderDiagram(parsed.diagram, { lang: "ja" }).timeline;
    expect(stills, "決済の図の段").toHaveLength(4);
    const out = mkdtempSync(join(tmpdir(), "dragon-step-"));
    const png = async (dir: string, step?: number): Promise<string> => {
      await exportDiagram(parsed.diagram, { outDir: join(out, dir), name: "payment", formats: ["png"], lang: "ja", ...(step === undefined ? {} : { step }) });
      return readFileSync(join(out, dir, "payment.png"), "utf8");
    };
    // 段 1 の止め絵は最後の段の止め絵と違う時刻に撮る。段 1 には段 2 から先の線と丸が無い
    expect(await png("first", 1), "段 1 を選んでも段 1 の止め絵を撮らない").toBe(`still at ${stills[0]}`);
    expect(await png("last"), "既定で最後の段の止め絵を撮らない").toBe(`still at ${stills[3]}`);
    expect(await png("four", 4), "最後の段を選んだ PNG が既定の PNG と違う").toBe(`still at ${stills[3]}`);
    await expect(png("bad", 9), "図に無い段を選んでも断らない").rejects.toBeInstanceOf(NoSuchStep);
    expect(existsSync(join(out, "bad")), "図に無い段を選んだ時に書き出し先を作る").toBe(false);
  });

  it("export-step-cli-rejects-missing-step", async () => {
    // 命令は段を数えずに書き出しへ渡し、書き出しが撮る前に断る。図に無い段で終わり方 2 になれば、命令が段を書き出しへ渡している
    const out = mkdtempSync(join(tmpdir(), "dragon-step-cli-"));
    const missing = await runCli(["export", PAYMENT, "--format", "png", "--step", "9", "--out", join(out, "missing")]);
    expect(missing.code, `図に無い段を選んでも断らない ${missing.stderr}`).toBe(2);
    expect(missing.stderr, "断りの文が段と図の段の数を名指さない").toContain("--step 9 (the diagram has steps 1 to 4)");
    const zero = await runCli(["export", PAYMENT, "--format", "png", "--step", "0", "--out", join(out, "zero")]);
    expect(zero.code, `0 の段を断らない ${zero.stderr}`).toBe(2);
  });
});
