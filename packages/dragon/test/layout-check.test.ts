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
import { dirname, join, relative } from "node:path";
import { pathToFileURL } from "node:url";
import * as dragon from "./all-kinds";
import { describe, expect, it, vi } from "vitest";
import { atLoad } from "./at-load";
import { casesNamed, runCli, runCliInProcess } from "./export-support";
import { hasWide } from "../src/layout/measure";
import type { TextStyle } from "../src/look/values";
import { ALWAYS } from "../src/render/ink";

/** 描き方が字を折る処理 (`wrap`) に渡した字と字の大きさと幅、折った行 (#4009) */
interface WrapCall {
  text: string;
  size: number;
  width: number;
  lines: string[];
}

/** 字を折る処理の記録。記録する間 (`on`) だけ足す */
const wrapLog = vi.hoisted(() => ({ on: false, calls: [] as WrapCall[] }));

// 字を折る処理を包み、描き方が渡した幅と折った行を記録する (#4009)。折り方そのものは元の処理のまま
vi.mock("../src/layout/wrap", async (importOriginal) => {
  const real = await importOriginal<typeof import("../src/layout/wrap")>();
  return {
    ...real,
    wrap: (text: string, style: TextStyle, width: number): string[] => {
      const lines = real.wrap(text, style, width);
      if (wrapLog.on) wrapLog.calls.push({ text, size: style.size, width, lines });
      return lines;
    },
  };
});

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
const [{ checkLayout, describeBreak, diagramBreaks }, { exportDiagram, NoSuchStep }, { renderDiagram }, { parseNotation }, { findBreaks }, { flattenPath }] = await Promise.all([
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
/** 使い方の頁の見本の置き場。記法の`.dragon`と、図の原本の`.json`を持つ (#3790) */
const DOCS_EXAMPLES = join(ROOT, "apps/playground-spa/src/docs/examples");
/** 見本の一覧を1か所で持つ file。見本の崩れの検査と、記録を書き直す script の両方が読む (#3790) */
const SHARED_EXAMPLES = join(ROOT, "scripts/layout-examples.mjs");
/** 見本の崩れの記録を書き直す script */
const RECORD_SCRIPT = join(ROOT, "scripts/layout-breaks-record.mjs");

/** 崩れを記録と突き合わせる見本。名前と記法と読む言葉 */
interface Example {
  name: string;
  source: string;
  lang: "ja" | "en";
}
const { layoutExamples } = (await import(/* @vite-ignore */ pathToFileURL(SHARED_EXAMPLES).href)) as {
  layoutExamples: (root: string, extractDiagrams: (markdown: string) => { source: string; line: number }[]) => Example[];
};
/** 崩れを数える見本。置き場は一覧を持つ file が決め、md の中の図は元の code の取り出す関数で取り出す */
const EXAMPLES = layoutExamples(ROOT, dragon.extractDiagrams);

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

// 命令は子の Node を起こし、混んだ機械で 1 件の上限 (10 秒) を超えた (#3738)。1 回分の命令と描画を file を読み込む段で済ませ、件はその結果を読む

const INTENDED_CHECKED = await atLoad("重なって当然の図と決済の図を命令で調べる", async () => ({ intended: await layoutOf(INTENDED), payment: await layoutOf(PAYMENT) }));

const LABEL_OFF_CHECKED = await atLoad("線から離れる名前の図を命令で調べる", async () => ({
  json: await layoutOf(LABEL_OFF_LINE),
  ja: await runCli(["check", LABEL_OFF_LINE, "--layout", "--lang", "ja"]),
  en: await runCli(["check", LABEL_OFF_LINE, "--layout", "--lang", "en"]),
}));

// 命令を件の中で起こすほかの件も、#3800 の関門で混んだ機械の 1 件の上限 (10 秒) を超えた (#3815)。同じく命令を file を読み込む段で打つ

const CROWDED_CHECKED = await atLoad("並んで近すぎる道の状態遷移図を命令で調べる", async () => ({
  json: await layoutOf(CROWDED),
  ja: await runCli(["check", CROWDED, "--layout", "--lang", "ja"]),
  en: await runCli(["check", CROWDED, "--layout", "--lang", "en"]),
}));

const SEND_ONLY_CHECKED = await atLoad("運ぶ物が置き場に座らない金庫の図を命令で調べる", () => layoutOf(SEND_ONLY));

/** 決済の図の崩れを、言葉を渡さずに JSON で調べた結果 */
const PAYMENT_WIDTHS = await atLoad("決済の図を言葉を渡さずに命令で調べる", () => runCli(["check", PAYMENT, "--layout", "--json"]));

const TRY_SKIP_CHECKED = await atLoad("網の線が節の名前を横切る試す図を命令で調べる", async () => ({
  json: await layoutOf(TRY_SKIP),
  ja: await runCli(["check", TRY_SKIP, "--layout", "--lang", "ja"]),
}));

/** 決済の図と、描いた段の止め絵の時刻 */
const PAYMENT_DRAWN = await atLoad("決済の図を読んで段の時刻を測る", () => {
  const parsed = parseNotation(readFileSync(PAYMENT, "utf8"), { lang: "ja" });
  if (!parsed.ok) throw new Error(`決済の図を読めない: ${JSON.stringify(parsed.errors)}`);
  return { diagram: parsed.diagram, stills: renderDiagram(parsed.diagram, { lang: "ja" }).timeline.stills };
});

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

  it("layout-check-finds-crowded-lines", () => {
    const { found } = CROWDED_CHECKED.get().json;
    const hits = found.filter((b) => b.kind === "lines-close" && hasLine(b, "受付", "取消", 1) && hasLine(b, "確認", "取消", 1));
    expect(hits, "受付と確認から取消へ入る道が並んで近すぎることを1件で出さない").toHaveLength(1);
  });

  it("layout-check-line-names-step-and-parts", () => {
    // 段の番号を名指す文は、近すぎる番号を持つ姿を組んで確かめる (`layout-check-finds-close-badges` と `badge-spots.test.ts`)。
    // 見本の図に近すぎる番号が無くなったので (#3547)、命令の行の形は並んで近すぎる道を持つ状態遷移図で確かめる
    const { ja, en } = CROWDED_CHECKED.get();
    expect(ja.code, ja.stderr).toBe(0);
    const lines = ja.stdout.trimEnd().split("\n");
    const crowded = lines.find((line) => line.includes("線 受付 → 取消 (段 1)") && line.includes("線 確認 → 取消 (段 1)"));
    expect(crowded, `受付と確認から取消への道を名指す行が無い\n${ja.stdout}`).toBeDefined();
    // 行は `<file>:<段の step の行>:1 warning 段 <N>: <文>` の形で、崩れが見え始める段の行を名指す
    expect(crowded, "線の崩れの行の頭").toMatch(new RegExp(`^${CROWDED.replace(/[.*+?^${}()|[\]\\]/gu, "\\$&")}:${stepLine(CROWDED, 1)}:1 warning 段 1: `, "u"));
    const crowdedEn = en.stdout.trimEnd().split("\n").find((line) => line.includes("受付 → 取消"));
    expect(crowdedEn, `英語の行が段と線を名指さない\n${en.stdout}`).toMatch(/warning Step 1: The line 受付 → 取消 \(step 1\) and the line 確認 → 取消 \(step 1\) /u);
    // はみ出した字の文は、字と箱の名前を名指す。形を持つ箱は中身が収まるまで大きくなるので (#3520)、崩れを持つ前のアーチの姿で確かめる
    const text = (findBreaks(brokenArch()) as LayoutBreak[]).find((b) => b.kind === "text-outside-shape");
    expect(text && describeBreak(text as never, "en"), "英語の文がはみ出した字と箱を名指さない").toBe('"100 USDC を預かり中" sticks out of the shape of "ブリッジ"');
  });

  it("layout-check-prints-json", () => {
    // 決済の図は行きと帰りの線を離し (#3521)、六角形の箱が中身に合わせて大きくなって (#3520) 崩れを持たず、
    // 近すぎる丸を持っていたgit図も線を離して崩れが消えたので (#3547)、並んで近すぎる道を持つ図で確かめる
    const { code, problems } = CROWDED_CHECKED.get().json;
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

  it("layout-check-skips-slot-never-held", () => {
    // アーチの形の金庫は硬貨を送り出すだけで、硬貨は金庫の置き場で待たない。見えない枠のはみ出しは知らせない (#3518)
    const { found } = SEND_ONLY_CHECKED.get();
    expect(found.filter((b) => b.kind === "slot-outside-shape"), "運ぶ物が一度も座らない枠のはみ出しを知らせる").toEqual([]);
    // 形を持つ箱は中身が収まるまで大きくなり、描いた図には形の崩れが無い (#3520)。崩れを持つ #3520 の前のアーチの姿で、座らない枠を数えないことも確かめる
    const empty = findBreaks(brokenArch(false)) as LayoutBreak[];
    expect(empty.filter((b) => b.kind === "slot-outside-shape"), "運ぶ物が一度も座らないアーチの枠のはみ出しを知らせる").toEqual([]);
    expect(empty.filter((b) => b.kind === "text-outside-shape" && hasBox(b, "ブリッジ")).length, "アーチの形の崩れを測っていない").toBeGreaterThan(0);
  });

  it("layout-check-names-narrow-width", () => {
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
    const lines = PAYMENT_WIDTHS.get();
    const widths = (JSON.parse(lines.stdout || "[]") as Problem[]).flatMap((p) => (p.layout?.width === undefined ? [] : [p.layout.width]));
    expect(widths, "幅で変わらない図で幅を名指す").toEqual([]);
  });

  it("layout-check-finds-line-across-node-name", () => {
    // 試す図の網の線も、ほかの線と同じく札を持たない字を横切れば崩れとして出す
    const { json, ja } = TRY_SKIP_CHECKED.get();
    const { code, found, problems, stderr } = json;
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
    const said = ja.stdout.trimEnd().split("\n").find((line) => line.includes("中継1"));
    expect(said, `名前「中継1」を名指す行が無い\n${ja.stdout}`).toMatch(new RegExp(`^${TRY_SKIP.replace(/[.*+?^${}()|[\]\\]/gu, "\\$&")}:${stepLine(TRY_SKIP, 1)}:1 warning 段 1: `, "u"));
    expect(said, "行が線の両端の節を名指さない").toMatch(/送る人.*作る人/u);
  });

  it("layout-check-line-over-text-reported-once", () => {
    // 線が札を持たない字を横切る所は、描いた結果の重なり (`overlaps`) にも入る。崩れは線が字を横切る種類の1件だけで知らせ、字どうしの重なりと重ねない (#3790)
    const text = readFileSync(TRY_SKIP, "utf8");
    const parsed = parseNotation(text, { lang: "ja" });
    expect(parsed.ok, "網の線が節の名前を横切る試す図を読めない").toBe(true);
    if (!parsed.ok) return;
    const crossed = renderDiagram(parsed.diagram, { lang: "ja" }).overlaps.filter((o) => o.kind === "line" && o.text === "中継1");
    expect(crossed.length, "描いた結果の重なりに、線が名前「中継1」を横切る所が無い").toBeGreaterThan(0);
    const named = dragon.checkLayoutText(text, { lang: "ja" }).filter((b) => b.parts.some((p) => p.kind === "text" && p.text === "中継1"));
    expect(named.map((b) => b.kind), `名前「中継1」に関わる崩れ ${JSON.stringify(named)}`).toEqual(["line-crosses-text"]);
  });

  it("layout-check-skips-intended-overlaps", () => {
    const { intended, payment } = INTENDED_CHECKED.get();
    expect(intended.code, intended.stderr).toBe(0);
    expect(intended.problems, "重なって当然の組だけの図で崩れを出す").toEqual([]);
    // 決済の図の段 3 の丸は、線の始まりに置く丸で、六角形の上の辺との 1px の間は崩れでない。
    // 行きと帰りの線を離し (#3521)、六角形の箱が中身に合わせて大きくなった (#3520) ので、決済の図はほかに崩れを持たず、丸を数えれば 1 件になる
    const { found } = payment;
    const oracleBadge = found.filter((b) => hasBadge(b, 3) && hasBox(b, "価格オラクル"));
    expect(oracleBadge, "線の始まりの丸と、その線を出す箱を崩れに数える").toEqual([]);
    expect(found, "決済の図に崩れを出す").toEqual([]);
  });
});

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

  // 2 つの言葉で描くと、混んだ機械で 1 件の上限 (10 秒) を超えた (#3738)。言葉ごとの件に分ける
  describe.for(["ja", "en"] as const)("%s", (lang) => {
    it("amount-chip-near-flow-in-swap-retry", () => {
      // 移す額の札は、線の傍でなく箱の下の札入れに入れる (Tracelyth #168、#3720)。札入れの札は流れを名指さず、崩れの確かめは線との離れを測らない
      const layout = drawnLayout(SWAP_RETRY, lang) as {
        chips: (Box & { kind: string; text: string; step: number; flow?: number })[];
        wallets?: Box[];
      };
      const amounts = layout.chips.filter((c) => c.kind === "amount");
      // 段4 (0 から数えて 3) の、Router から Pool1 へ移す額の札
      expect(amounts.find((c) => c.step === 3 && c.text === "100 USDC"), `${lang} の字で、段4の 100 USDC の札が無い`).toBeDefined();
      expect(amounts.filter((c) => c.flow !== undefined).map((c) => `段${c.step + 1} ${c.text}`), `${lang} の字で、札入れに入れた額の札が流れを名指す`).toEqual([]);
      expect(layout.wallets?.length ?? 0, `${lang} の字で、札を入れる札入れが無い`).toBeGreaterThan(0);
    });
  });

  it("layout-check-finds-label-off-line", () => {
    const { json, ja, en } = LABEL_OFF_CHECKED.get();
    const { code, found, problems, stderr } = json;
    expect(code, stderr).toBe(0);
    const off = found.filter((b) => b.kind === "label-off-line");
    // 1 つ目の名前「残高を見る」は線の上の最初の置き場に在るので数えない
    expect(off, "2 つ目の名前が線から離れることを 1 件で出さない").toEqual([
      { kind: "label-off-line", step: 1, parts: [{ kind: "text", text: "送る" }, { kind: "line", from: "アプリ", to: "API", step: 1 }] },
    ]);
    const problem = problems.find((p) => p.layout?.kind === "label-off-line");
    expect(problem?.line, "知らせの行が段1の step の行を名指さない").toBe(stepLine(LABEL_OFF_LINE, 1));
    expect(ja.stdout, "日本語の行が段と名前と線を名指さない").toContain("warning 段 1: 「送る」が線 アプリ → API (段 1)から離れて描かれる");
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
  /** 崩れの記録の一覧。最初の件で 1 度だけ読み、ほかの件で使い回す */
  let recorded: Record<string, LayoutBreak[]> | undefined;
  const recordedBreaks = (): Record<string, LayoutBreak[]> => (recorded ??= existsSync(RECORDED) ? (JSON.parse(readFileSync(RECORDED, "utf8")) as Record<string, LayoutBreak[]>) : {});

  // 件の名前は `%s` で付ける。`$name` は 40 字を超える名前を切り詰める
  describe.for(EXAMPLES.map((example) => [example.name, example] as const))("%s", ([name, example]) => {
    it("layout-check-examples-match-recorded", () => {
      const checkLayoutText = (dragon as unknown as { checkLayoutText?: (text: string, options: { lang: "ja" | "en" }) => LayoutBreak[] }).checkLayoutText;
      expect(checkLayoutText, "checkLayoutText が @cardenelabs/dragon から出ていない").toBeDefined();
      if (checkLayoutText === undefined) return;
      expect(existsSync(RECORDED), `${relative(ROOT, RECORDED)} が無い`).toBe(true);
      const key = (b: LayoutBreak): string => JSON.stringify(b);
      const known = new Set((recordedBreaks()[name] ?? []).map(key));
      const grown = checkLayoutText(example.source, { lang: example.lang })
        .filter((b) => !known.has(key(b)))
        .map((b) => `${name}: ${key(b)}`);
      expect(grown, "一覧に無い崩れが見本に出た").toEqual([]);
    });
  });

  // 全ての見本の崩れを 1 件で数えると、混んだ機械で 1 件の上限 (10 秒) を超えた (#3738)。見本ごとの件に分ける
  it("layout-check-cases-follow-examples", ({ task }) => {
    const names = EXAMPLES.map((example) => example.name);
    expect(names.length, "見本を数えられない").toBeGreaterThan(1);
    expect(casesNamed(task.file, "layout-check-examples-match-recorded").sort(), "見本ごとの件").toEqual(names);
  });
});

describe("見本の崩れの検査が全ての置き場の見本を読む (#3790)", () => {
  it("layout-check-examples-cover-all-places", ({ task }) => {
    const cases = new Set(casesNamed(task.file, "layout-check-examples-match-recorded"));
    const examples = join(ROOT, "packages/dragon/examples");
    const below = filesUnder(examples);
    // 一覧を持つ file を使わずに、3つの置き場の見本の名前を置き場から数える。mdの中の図は、図の中身の1行目の行の番号で呼ぶ
    const places: [string, string[]][] = [
      ["使い方の頁の .dragon", readdirSync(DOCS_EXAMPLES).filter((name) => name.endsWith(".dragon")).map((name) => relative(ROOT, join(DOCS_EXAMPLES, name)))],
      ["packages/dragon/examples の下のフォルダの .dragon", below.filter((file) => file.endsWith(".dragon") && dirname(file) !== examples).map((file) => relative(ROOT, file))],
      [
        "packages/dragon/examples の md の中の図",
        below
          .filter((file) => file.endsWith(".md"))
          .flatMap((file) => dragon.extractDiagrams(readFileSync(file, "utf8")).map((fence) => `${relative(ROOT, file)}:${fence.line}`)),
      ],
    ];
    for (const [place, names] of places) {
      expect(names.length, `${place}を数えられない`).toBeGreaterThan(0);
      expect(names.filter((name) => !cases.has(name)), `見本の崩れの検査が${place}を件として持たない`).toEqual([]);
    }
  });

  it("layout-check-record-reads-same-examples", ({ task }) => {
    // 記録を書き直す script は、見本の一覧を検査と同じ file から読み、自分で置き場を読まない
    const script = readFileSync(RECORD_SCRIPT, "utf8");
    expect(script, "記録の script が見本の一覧を scripts/layout-examples.mjs から読まない").toMatch(/from "\.\/layout-examples\.mjs"/u);
    expect(script, "記録の script が自分で置き場の file を並べる").not.toMatch(/readdirSync/u);
    // 見本の崩れの検査の件は、同じ file が返す見本と1件ずつ揃う
    expect(casesNamed(task.file, "layout-check-examples-match-recorded").sort(), "見本の崩れの検査の件と、一覧を持つ file の見本").toEqual(EXAMPLES.map((e) => e.name).sort());
  });
});

describe("使い方の頁の図の原本は崩れを出さない (#3790)", () => {
  // 図の原本 (`.json`) は記法の崩れの検査 (`checkLayoutText`、`dragon check`) に渡せないので、原本から描いて崩れを数える
  describe.for(
    readdirSync(DOCS_EXAMPLES)
      .filter((name) => name.endsWith(".json"))
      .sort()
      .map((name) => [relative(ROOT, join(DOCS_EXAMPLES, name)), join(DOCS_EXAMPLES, name)] as const),
  )("%s", ([name, file]) => {
    it("layout-check-json-examples-have-no-breaks", () => {
      const lang = file.includes(".en.") ? "en" : "ja";
      const read = dragon.readDiagram(JSON.parse(readFileSync(file, "utf8")) as unknown, { lang });
      expect(read.ok, `${name} を図の原本として読めない`).toBe(true);
      if (!read.ok) return;
      expect(diagramBreaks(read.diagram, lang).map((b) => `${name}: ${JSON.stringify(b)}`), "使い方の頁の図の原本に崩れが残る").toEqual([]);
    });
  });
});

/** dir の下の file を、下のフォルダも含めて全て */
function filesUnder(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => (entry.isDirectory() ? filesUnder(join(dir, entry.name)) : [join(dir, entry.name)]));
}

describe("見本帳の図は崩れを出さない (#3607)", () => {
  // 件の名前は `%s` で付ける。`$name` は 40 字を超える名前を切り詰める
  describe.for(galleryFiles().map((file) => [relative(ROOT, file), file] as const))("%s", ([name, file]) => {
    it("gallery-warns-nothing", () => {
      const checkLayoutText = (
        dragon as unknown as {
          checkLayoutText?: (text: string, options: { lang: "ja" | "en" }) => LayoutBreak[];
        }
      ).checkLayoutText;
      expect(checkLayoutText, "checkLayoutText が @cardenelabs/dragon から出ていない").toBeDefined();
      if (checkLayoutText === undefined) return;
      const broken = checkLayoutText(readFileSync(file, "utf8"), {
        lang: file.includes(".en.") ? "en" : "ja",
      }).map((b) => `${name}: ${JSON.stringify(b)}`);
      expect(broken, "見本帳の図に崩れが残る").toEqual([]);
    });
  });

  // 見本帳の全ての図の崩れを 1 件で数えると、混んだ機械で 1 件の上限 (10 秒) を超えた (#3738)。図ごとの件に分ける
  it("gallery-warn-cases-follow-gallery", ({ task }) => {
    const names = galleryFiles().map((file) => relative(ROOT, file));
    expect(names.length, "見本帳の図を数えられない").toBeGreaterThan(1);
    expect(casesNamed(task.file, "gallery-warns-nothing").sort(), "見本帳の図ごとの件").toEqual(names);
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

/** 決済の図を段 `step` で PNG に書き出し、撮った止め絵の字を返す。撮る所は上で、撮った時刻の字を書く形に差し替えてある */
async function paymentPng(diagram: Parameters<typeof exportDiagram>[0], out: string, step?: number): Promise<string> {
  await exportDiagram(diagram, { outDir: out, name: "payment", formats: ["png"], lang: "ja", ...(step === undefined ? {} : { step }) });
  return readFileSync(join(out, "payment.png"), "utf8");
}

describe("dragon export --step (#3484)", () => {
  // 4 つの段を 1 件で書き出すと、混んだ機械で 1 件の上限 (10 秒) を超えた (#3738)。選ぶ段ごとの件に分ける。
  // 段 1 の止め絵は最後の段の止め絵と違う時刻に撮る。段 1 には段 2 から先の線と丸が無い
  describe.for([
    ["段 1", 1, 0, "段 1 を選んでも段 1 の止め絵を撮らない"],
    ["既定", undefined, 3, "既定で最後の段の止め絵を撮らない"],
    ["段 4", 4, 3, "最後の段を選んだ PNG が既定の PNG と違う"],
  ] as const)("%s", ([, step, still, why]) => {
    it("export-png-at-step", async () => {
      const { diagram, stills } = PAYMENT_DRAWN.get();
      expect(stills, "決済の図の段").toHaveLength(4);
      expect(await paymentPng(diagram, mkdtempSync(join(tmpdir(), "dragon-step-")), step), why).toBe(`still at ${stills[still]}`);
    });
  });

  describe("図に無い段", () => {
    it("export-png-at-step", async () => {
      const { diagram } = PAYMENT_DRAWN.get();
      const out = join(mkdtempSync(join(tmpdir(), "dragon-step-")), "bad");
      await expect(paymentPng(diagram, out, 9), "図に無い段を選んでも断らない").rejects.toBeInstanceOf(NoSuchStep);
      expect(existsSync(out), "図に無い段を選んだ時に書き出し先を作る").toBe(false);
    });
  });

  // 命令は段を数えずに書き出しへ渡し、書き出しが撮る前に断る。図に無い段で終わり方 2 になれば、命令が段を書き出しへ渡している。
  // 子の Node で 2 度起こすと、混んだ機械で 1 件の上限 (10 秒) を超えた (#3738)。同じ process で呼び、段ごとの件に分ける
  describe.for([
    ["図に無い段", "9", "--step 9 (the diagram has steps 1 to 4)"],
    ["0 の段", "0", undefined],
  ] as const)("%s", ([what, step, said]) => {
    it("export-step-cli-rejects-missing-step", async () => {
      const out = join(mkdtempSync(join(tmpdir(), "dragon-step-cli-")), "out");
      const ran = await runCliInProcess(["export", PAYMENT, "--format", "png", "--step", step, "--out", out]);
      expect(ran.code, `${what}を選んでも断らない ${ran.stderr}`).toBe(2);
      if (said !== undefined) expect(ran.stderr, "断りの文が段と図の段の数を名指さない").toContain(said);
    });
  });
});

/*
 * 字を折る幅の決まり (#4009、`docs/adr/0017-wrapped-text-keeps-16-chars.md`)。
 * 並べ方で幅を測って折る SVG の字は、1 行に 16 字 (字の大きさの 16 倍) 入らない幅で折らず、折った最後の行に 4 字以上を残す。
 * 字数は全角に直した数で、半角は 2 字で全角 1 字に数える。描き方が字を折る所を広げたかは、描き方が字を折る処理に渡した幅で確かめる。
 * 字を折る処理そのものの件は `wrap.test.ts` が持つ
 */
const WRAP_LEAST = 16;
const WRAP_LAST = 4;
const { checkLayoutText } = await import("../src/render/layout-check");

/** 全角に直した字数。和文の字は 1 字、ほかの字 (欧文と空白) は半字に数える */
const wrapChars = (line: string): number => [...line].reduce((n, ch) => n + (hasWide(ch) ? 1 : 0.5), 0);
/** 16 字より狭い幅で 2 行以上に折った記録か */
const wrapNarrow = (call: WrapCall): boolean => call.lines.length > 1 && call.width < WRAP_LEAST * call.size - 1e-9;

/** `work` の間に字を折る処理へ渡された記録 */
function wrapsDuring<T>(work: () => T): { value: T; calls: WrapCall[] } {
  wrapLog.calls.length = 0;
  wrapLog.on = true;
  try {
    return { value: work(), calls: wrapLog.calls.splice(0) };
  } finally {
    wrapLog.on = false;
  }
}

/** 記法を読んだ原本。読めなければ断りを挙げて投げる */
function wrapDiagramOf(text: string, lang: "ja" | "en"): unknown {
  const parsed = parseNotation(text, { lang });
  if (!parsed.ok) throw new Error(`記法を読めない: ${JSON.stringify(parsed.errors)}`);
  return parsed.diagram;
}

/** 列の図で字を折る所ごとに、長い字を書いた記法。`long` は折れる長い字 (一言は描き方が作る文に含まれる字)、`width` は描く枠の幅 */
const WRAP_PLACES: { place: string; long: string; text: string; width?: number }[] = [
  {
    place: "段の題",
    long: "列に並んだチップを1枚ずつ送って中身を確かめる",
    text: [
      "lineup 長い段の題",
      "",
      "box 待ち",
      "",
      "item 甲",
      "",
      "step 列に並んだチップを1枚ずつ送って中身を確かめる",
      "  say 段の題が長い時も、図を広げて題を折る。",
      "  line 待ち: 甲",
    ].join("\n"),
  },
  {
    place: "列の名前 (携帯の幅)",
    long: "受付の窓口で書類を受け取って中身を確かめる係",
    width: 390,
    text: [
      "lineup 長い列の名前",
      "",
      "box desk as 受付の窓口で書類を受け取って中身を確かめる係",
      "box check as 審査",
      "",
      "item 甲, 乙",
      "",
      "step 並べる",
      "  say 列の名前が長い時も、列を広げて名前を折る。",
      "  line desk: 甲",
      "  line check: 乙",
    ].join("\n"),
  },
  {
    place: "駅の名前 (携帯の幅)",
    long: "受付の窓口で書類を受け取って中身を確かめる係",
    width: 390,
    text: [
      "lineup 長い駅の名前 [shape: stations]",
      "",
      "box desk as 受付の窓口で書類を受け取って中身を確かめる係",
      "box check as 審査",
      "",
      "item 甲, 乙",
      "",
      "step 並べる",
      "  say 駅の名前が長い時も、駅の間を広げて名前を折る。",
      "  line desk: 甲",
      "  line check: 乙",
    ].join("\n"),
  },
  {
    place: "凡例",
    long: "窓口に届いた書類のうち、まだ誰も中身を確かめていない物",
    text: [
      "lineup 長い凡例",
      "",
      "box 窓口",
      "",
      "item 申請 [note: 窓口に届いた書類のうち、まだ誰も中身を確かめていない物]",
      "",
      "step 並べる",
      "  say 凡例の説明が長い時も、図を広げて説明を折る。",
      "  line 窓口: 申請",
    ].join("\n"),
  },
  {
    place: "帯の一言",
    long: "甲、乙、丙、丁、戊、己、庚、辛",
    text: [
      "lineup 長い一言",
      "",
      "box pool as 置き場 [order: none]",
      "box lane as 列",
      "",
      "item 書類",
      "item 甲, 乙, 丙, 丁, 戊, 己, 庚, 辛",
      "",
      "step 置く",
      "  say 書類を置き場に置く。",
      "  line pool: 書類",
      "",
      "step 並べる",
      "  say 置き場に無かった書類を列に足すと、列の下に一言が出る。",
      "  line lane: 書類, 甲, 乙, 丙, 丁, 戊, 己, 庚, 辛",
    ].join("\n"),
  },
  {
    place: "層の説明 (携帯の幅)",
    long: "画面で交換を頼み、送った取引がL1で戻せなくなるまで待ってから結果を見せる",
    width: 390,
    text: [
      "lineup 長い層の説明 [shape: layers]",
      "",
      "box app as アプリ [note: 画面で交換を頼み、送った取引がL1で戻せなくなるまで待ってから結果を見せる]",
      "box l1 as L1 [note: 戻せなくなるまで待つ]",
      "",
      "item 取引",
      "",
      "step 頼む",
      "  say 層の説明が長い時も、帯を広げて説明を折る。",
      "  line app: 取引",
    ].join("\n"),
  },
];
const WRAP_PLACES_DRAWN = await atLoad("列の図で字を折る所に長い字を書いた記法を描いて崩れを数える", () =>
  WRAP_PLACES.map((one) => {
    const diagram = wrapDiagramOf(one.text, "ja");
    const { calls } = wrapsDuring(() => renderDiagram(diagram, { lang: "ja", ...(one.width === undefined ? {} : { width: one.width }) }));
    return { ...one, wraps: calls, breaks: checkLayoutText(one.text, { lang: "ja" }) };
  }),
);

describe("列の図は字を折る所を広げて 16 字以上の幅で折る (#4009)", () => {
  describe.for(WRAP_PLACES.map((one) => [one.place] as const))("%s", ([place]) => {
    it("lineup-wrapped-texts-widen-their-area", () => {
      const one = WRAP_PLACES_DRAWN.get().find((p) => p.place === place);
      expect(one, `${place} を描けない`).toBeDefined();
      if (one === undefined) return;
      const mine = one.wraps.filter((call) => call.text.includes(one.long) && call.lines.length > 1);
      expect(mine.length, `${place} の長い字を 2 行以上に折らない`).toBeGreaterThan(0);
      const narrow = one.wraps.filter(wrapNarrow).map((call) => `「${call.text}」を ${(call.width / call.size).toFixed(1)} 字の幅で折った`);
      expect(narrow, `${place} で 16 字より狭く折った字`).toEqual([]);
      expect(
        one.breaks.map((b) => describeBreak(b, "ja")),
        `${place} の崩れ`,
      ).toEqual([]);
    });
  });
});

/** 崩れを数える材料。字だけを持ち、線と箱を持たない */
const wrapBreakInput = (inks: unknown[]): Parameters<typeof findBreaks>[0] => ({ inks, traces: [], framed: [], stills: [0, 1], frame: { w: 800, h: 600 }, boxes: [], edges: [], outlines: new Map() }) as never;
/** 描き方が 2 行に折った字の 1 行目の記録。`wrap` は描き方が折る処理に渡した幅と字の大きさと全文 */
const wrappedFirstLine = (whole: string, width: number): unknown => ({ text: whole.slice(0, 10), rect: { x: 20, y: 40, w: 160, h: 12.5 }, shown: ALWAYS, wrap: { width, size: 12.5, text: whole } });

describe("dragon check --layout は 16 字より狭く折った字を知らせる (#4009)", () => {
  const whole = "step で段を区切り、say で段の本文を書く。";

  it("layout-check-finds-narrow-wrap", () => {
    const breaks = findBreaks(wrapBreakInput([wrappedFirstLine(whole, 166)])).filter((b) => (b.kind as string) === "text-wrapped-narrow");
    expect(breaks, "16 字より狭く折った字を崩れにしない").toHaveLength(1);
    const [found] = breaks;
    if (found === undefined) return;
    expect(found.step, "崩れが見え始める段").toBe(1);
    expect(found.parts[0], "崩れの 1 つ目の部品は折った字の全文").toEqual({ kind: "text", text: whole });
    for (const lang of ["ja", "en"] as const) {
      const sentence = describeBreak(found, lang);
      expect(sentence, `${lang} の文が字を名指す`).toContain(whole);
      expect(sentence, `${lang} の文が 16 字の決まりを言う`).toContain("16");
    }
  });

  it("layout-check-skips-wraps-at-16-chars", () => {
    const one = { text: "段は1つずつ送って見る。", rect: { x: 20, y: 40, w: 145, h: 12.5 }, shown: ALWAYS };
    const breaks = findBreaks(wrapBreakInput([wrappedFirstLine(whole, 16 * 12.5), one]));
    expect(
      breaks.map((b) => b.kind),
      "16 字の幅で折った字と 1 行の字の崩れ",
    ).toEqual([]);
  });
});

/** 見本と検査の記法と部品の図の file の名前と原本と言葉。指紋を取る script (`scripts/snapshot-examples.mjs`) と同じ範囲 */
function wrapSources(): { file: string; diagram: unknown; lang: "ja" | "en" }[] {
  const pkg = join(ROOT, "packages/dragon");
  const listed = (dir: string, keep: (file: string) => boolean): string[] => (existsSync(dir) ? readdirSync(dir).filter(keep) : []);
  const blocks = join(pkg, "src/blocks");
  const files = [
    ...listed(join(pkg, "examples"), (f) => f.endsWith(".json") || f.endsWith(".dragon")).map((f) => ({ file: `examples/${f}`, path: join(pkg, "examples", f) })),
    ...listed(join(pkg, "test/fixtures"), (f) => f.endsWith(".dragon")).map((f) => ({ file: `test/fixtures/${f}`, path: join(pkg, "test/fixtures", f) })),
    ...readdirSync(blocks).flatMap((name) => listed(join(blocks, name, "gallery"), (f) => f.endsWith(".dragon")).map((f) => ({ file: `parts/${f}`, path: join(blocks, name, "gallery", f) }))),
  ];
  return files.map(({ file, path }) => {
    const text = readFileSync(path, "utf8");
    const lang = file.endsWith(".en.dragon") ? "en" : "ja";
    return { file, lang, diagram: file.endsWith(".json") ? (JSON.parse(text) as unknown) : wrapDiagramOf(text, lang) };
  });
}

/** 全ての見本を既定の幅と携帯の幅 (390) で描き、字を折る処理に渡された記録を見本と描いた枠の幅と共に集める */
const WRAP_SWEEP = await atLoad("見本と検査の記法と部品の図を全て描いて字を折った記録を集める", () =>
  wrapSources().flatMap(({ file, diagram, lang }) =>
    [undefined, 390].flatMap((frame) => wrapsDuring(() => renderDiagram(diagram, { lang, ...(frame === undefined ? {} : { width: frame }) })).calls.map((call) => ({ file, frame, ...call }))),
  ),
);
/** 記録の見本と描いた枠の幅と字 */
const wrapWhere = (call: WrapCall & { file: string; frame: number | undefined }): string => `${call.file} (${call.frame === undefined ? "既定の幅" : `幅 ${call.frame}`}) の「${call.text}」`;

describe("見本と部品の図は 16 字以上の幅で折り、最後の行に 4 字以上を残す (#4009)", () => {
  it("examples-wrap-at-16-chars-or-more", () => {
    const all = WRAP_SWEEP.get();
    expect(all.filter((call) => call.lines.length > 1).length, "2 行以上に折った字が見本に無い").toBeGreaterThan(0);
    const offenders = all.filter(wrapNarrow).map((call) => `${wrapWhere(call)} を ${(call.width / call.size).toFixed(1)} 字の幅で折った`);
    expect(offenders, "16 字より狭い幅で折った字").toEqual([]);
  });

  it("examples-last-wrapped-line-has-4-chars", () => {
    const offenders = WRAP_SWEEP.get()
      .filter((call) => call.lines.length > 1 && wrapChars(call.lines.at(-1) ?? "") < WRAP_LAST)
      .map((call) => `${wrapWhere(call)} の最後の行「${call.lines.at(-1)}」`);
    expect(offenders, "最後の行が 4 字に満たない字").toEqual([]);
  });
});
