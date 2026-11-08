// @vitest-environment jsdom
/**
 * 試す図の部品を横に並べる行 (`side`、#3429)。
 *
 * 最初の段より前に `side <部品>, <部品>` を書くと、枠が広い時はその部品を書いた順に左から並べ、縦に積んだ時より図が低くなる。
 * 同じ行の待ち行列はチップと題が入る幅だけを取り、残りの幅を網と機械の列に渡す。
 * 横に並べると字が読める大きさ (`READABLE_PX`) より小さくなる狭い枠では、`side` の行を持たない時と同じく縦に積む。
 * 誤りの文を英語でも確かめるので、名札と値は英字にする。
 */
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { textWidth } from "../src/layout/measure";
import { TYPE } from "../src/look/values";
import { api, type Json, type LineError } from "./diagram-support";
import { overflow, place, releasePlaced } from "./follow-support";
import { draw, type Rect } from "./render-support";
import { KANA, parsedTry } from "./try-support";

afterEach(releasePlaced);

/** 部品の行。網 net が送り、待ち行列 pool が並べ、機械の列 blocks が鎖につなぐ */
const PARTS = [
  "route net: you - n1 - maker, you - n2 - maker [from: you, to: maker]",
  "queue pool [order: fee]",
  "chain blocks [edit: amount]",
  "ask sender, amount, fee [into: pool, via: net]",
  "press build [from: pool, into: blocks, take: 2]",
] as const;
const SIDE = "side net, pool";
const ITEMS = ["item o1 [amount: 3, fee: 7]", "item o2 [amount: 5, fee: 2]"] as const;
/** 最初の段。機械の列にブロック 1 (o1) を置き、待ち行列に o2 を並べる */
const FIRST = ["step start", "  say 始める。", "  line blocks: o1", "  line pool: o2"] as const;
/** 書き手が例として送る段。チップ me が網 net を通って待ち行列 pool へ入る */
const SEND = ["step send", "  say 送る。", "  ask me, 2, 6"] as const;

/** 携帯の幅の頁で図を置く枠の幅 (#3366 の検査と同じ) */
const PHONE = 324;
/** 横に並べても字が読める広い枠の幅 */
const WIDE = 1000;

/** 横に並べる試す図の記法。`side` で `side` の行を差し替え (空の並びで持たない)、`send` で送る段を足す */
function sideTry(options: { side?: readonly string[]; send?: boolean } = {}): string {
  return ["try side", ...PARTS, ...(options.side ?? [SIDE]), ...ITEMS, ...FIRST, ...(options.send ? SEND : [])].join("\n");
}

interface Title {
  text: string;
  x: number;
  baseline: number;
}

interface SideLayout {
  arrangement: "row" | "stack";
  width: number;
  height: number;
  parts: { id: string; type: string; rect: Rect }[];
  routes: { id: string; title: Title; nodes: { id: string; x: number; y: number }[] }[];
  queues: { id: string; title: Title; box: Rect; slots: Rect[] }[];
  chains: { id: string; title: Title }[];
  chip: { w: number; h: number };
  moments: {
    step: number;
    chips: Record<string, [number, number] | null>;
    trip?: { item: string; route: string; points: [number, number][] };
  }[];
}

/** 枠の幅 `width` で描いた試す図の置き場所 */
const layoutOf = (diagram: unknown, width?: number): SideLayout =>
  draw("renderDiagram")(diagram, { lang: "ja", ...(width === undefined ? {} : { width }) }).layout as unknown as SideLayout;

/** 部品の四角 */
function partOf(layout: SideLayout, id: string): Rect {
  const part = layout.parts.find((p) => p.id === id);
  expect(part, `部品 ${id} の置き場所が無い`).toBeDefined();
  return part?.rect ?? { x: 0, y: 0, w: 0, h: 0 };
}

const bottom = (r: Rect): number => r.y + r.h;
const right = (r: Rect): number => r.x + r.w;
const overlaps = (a: Rect, b: Rect): boolean => a.x < right(b) && b.x < right(a) && a.y < bottom(b) && b.y < bottom(a);

/** 部品の題の字が占める四角 */
const titleRect = (t: Title): Rect => ({
  x: t.x,
  y: t.baseline - TYPE.tryTitle.size,
  w: textWidth(t.text, TYPE.tryTitle),
  h: TYPE.tryTitle.size * 1.2,
});

const readRepo = (path: string): string => {
  const full = join(process.cwd(), path);
  return existsSync(full) ? readFileSync(full, "utf8") : "";
};

describe("試す図の部品を横に並べる記法 (#3429)", () => {
  it("interactive-side-parses-row", () => {
    const diagram = parsedTry(sideTry());
    const side = (diagram as { blocks?: { side?: unknown } }).blocks?.side;
    expect(side, "原本の試す図が同じ行に置く部品 (blocks.side) を書いた順で持たない").toEqual([["net", "pool"]]);
    const reversed = parsedTry(sideTry({ side: ["side pool, net"] }));
    expect((reversed as { blocks?: { side?: unknown } }).blocks?.side, "逆に書いた side の行の順が保たれない").toEqual([["pool", "net"]]);
    const checked = api("validateDiagram")(diagram);
    expect(checked.ok, `side を持つ原本が原本の形の検査を通らない: ${checked.ok ? "" : JSON.stringify(checked.errors)}`).toBe(true);
  });

  it("interactive-side-round-trip-keeps-notation", () => {
    const parse = api("parseNotation");
    const print = api("printNotation");
    const first = parse(sideTry({ send: true }));
    expect(first.ok, `side の行を書いた記法が読めない: ${first.ok ? "" : JSON.stringify(first.errors)}`).toBe(true);
    if (!first.ok) return;
    const printed = print(first.diagram);
    const lines = printed.split("\n");
    const at = lines.indexOf(SIDE);
    expect(at, `書き戻した記法に side の行が元の記法のまま無い\n${printed}`).toBeGreaterThanOrEqual(0);
    expect(at, `書き戻した side の行が最初の step より後にある\n${printed}`).toBeLessThan(lines.findIndex((line) => line.startsWith("step ")));
    const second = parse(printed);
    expect(second.ok, `書き戻した記法が読めない: ${second.ok ? "" : JSON.stringify(second.errors)}\n${printed}`).toBe(true);
    expect(second.ok ? second.diagram : undefined, `往復した JSON が最初と違う\n${printed}`).toEqual(first.diagram);
  });

  it("interactive-side-refuses-bad-lines", () => {
    const parse = api("parseNotation");
    const good = parse(sideTry());
    expect(good.ok, `正しい side の行を持つ記法が読めない: ${good.ok ? "" : JSON.stringify(good.errors)}`).toBe(true);
    const cases: [string, string[], string, string][] = [
      ["試す図に無い部品の名前", sideTry({ side: ["side net, nothing"] }).split("\n"), "side net, nothing", "nothing"],
      ["釦の名前", sideTry({ side: ["side net, build"] }).split("\n"), "side net, build", "build"],
      ["部品が 1 つの side", sideTry({ side: ["side net"] }).split("\n"), "side net", "side"],
      ["別の side の行に書いた部品", sideTry({ side: [SIDE, "side pool, blocks"] }).split("\n"), "side pool, blocks", "pool"],
      ["最初の step より後の side", [...sideTry({ side: [] }).split("\n"), "step later", "  say 後。", "  side net, pool"], "  side net, pool", "side"],
    ];
    for (const [name, lines, marker, word] of cases) {
      const row = lines.findIndex((line) => line === marker);
      expect(row, `${name} の行が記法に無い`).toBeGreaterThanOrEqual(0);
      for (const lang of ["ja", "en"] as const) {
        const parsed = parse(lines.join("\n"), { lang });
        expect(parsed.ok, `${name} を読めてしまう (${lang})`).toBe(false);
        const first: LineError | undefined = parsed.ok ? undefined : parsed.errors[0];
        expect(first?.line, `${name} の誤りの行 (${lang}): ${first?.message ?? ""}`).toBe(row + 1);
        expect(first?.column ?? 0, `${name} の誤りが列を名指さない (${lang})`).toBeGreaterThanOrEqual(1);
        expect(first?.message ?? "", `${name} の誤りの文が ${word} を名指さない (${lang})`).toContain(word);
        if (lang === "en") expect(KANA.test(first?.message ?? ""), `${name} の英語の誤りの文に仮名か漢字がある: ${first?.message}`).toBe(false);
      }
    }
  });
});

describe("試す図の部品を横に並べる形 (#3429)", () => {
  it("interactive-side-places-parts-in-a-row", () => {
    const layout = layoutOf(parsedTry(sideTry()), WIDE);
    const net = partOf(layout, "net");
    const pool = partOf(layout, "pool");
    const blocks = partOf(layout, "blocks");
    expect(right(net), "網の右の端が待ち行列の左の端より右にある").toBeLessThanOrEqual(pool.x);
    expect(Math.abs(net.y - pool.y), "同じ行の網と待ち行列の上の端のずれ").toBeLessThan(1);
    expect(overlaps(net, pool), "同じ行の網と待ち行列が重なる").toBe(false);
    expect(blocks.y, "機械の列が同じ行の部品の下の端より上にある").toBeGreaterThanOrEqual(Math.max(bottom(net), bottom(pool)));
    const reversed = layoutOf(parsedTry(sideTry({ side: ["side pool, net"] })), WIDE);
    expect(right(partOf(reversed, "pool")), "side pool, net で待ち行列が網の左に並ばない").toBeLessThanOrEqual(partOf(reversed, "net").x);
  });

  it("interactive-side-queue-takes-chip-width", () => {
    const side = layoutOf(parsedTry(sideTry()), WIDE);
    const stacked = layoutOf(parsedTry(sideTry({ side: [] })), WIDE);
    const net = partOf(side, "net");
    const pool = partOf(side, "pool");
    const blocks = partOf(side, "blocks");
    expect(pool.w, "同じ行の待ち行列の幅が、チップと題が入る幅 (縦に積んだ時の待ち行列の幅) と違う").toBeCloseTo(partOf(stacked, "pool").w, 1);
    expect(net.x, "網の左の端が機械の列の左の端と違う").toBeCloseTo(blocks.x, 1);
    expect(right(pool), "待ち行列の右の端が機械の列の右の端と違う (網が残りの幅を持たない)").toBeCloseTo(right(blocks), 1);
    expect(net.w, "網が待ち行列より広い幅を持たない").toBeGreaterThan(pool.w);
  });

  it("interactive-side-is-lower-than-stack", () => {
    const side = layoutOf(parsedTry(sideTry()), WIDE);
    const stacked = layoutOf(parsedTry(sideTry({ side: [] })), WIDE);
    expect(side.height, `side の行を持つ図の高さ ${side.height} が縦に積んだ図の高さ ${stacked.height} より低くない`).toBeLessThan(stacked.height);
  });

  it("interactive-side-stacks-when-narrow", () => {
    const side = layoutOf(parsedTry(sideTry()), PHONE);
    const stacked = layoutOf(parsedTry(sideTry({ side: [] })), PHONE);
    expect(side.arrangement, `枠 ${PHONE}px で縦に組まない`).toBe("stack");
    expect(side.parts, `枠 ${PHONE}px の side の行を持つ図の部品の四角が、side の行を持たない図と違う`).toEqual(stacked.parts);
    expect(side.height, `枠 ${PHONE}px の図の高さ`).toBe(stacked.height);
  });

  it("interactive-side-trip-reaches-queue", () => {
    const layout = layoutOf(parsedTry(sideTry({ send: true })), WIDE);
    const sent = layout.moments.find((m) => m.trip?.item === "me");
    expect(sent, "送ったチップ me が網を運ばれる時点が無い").toBeDefined();
    const net = layout.routes.find((r) => r.id === "net");
    const maker = net?.nodes.find((n) => n.id === "maker");
    const last = sent?.trip?.points.at(-1);
    expect(last && maker ? [last[0] + layout.chip.w / 2, last[1] + layout.chip.h / 2] : undefined, "チップの道が網の作る人 (maker) で終わらない").toEqual(
      maker ? [maker.x, maker.y] : undefined,
    );
    const pool = layout.queues.find((q) => q.id === "pool");
    const at = sent?.chips.me;
    const slot = pool?.slots.find((s) => at && Math.abs(s.x - at[0]) < 0.5 && Math.abs(s.y - at[1]) < 0.5);
    expect(slot, `チップ me が送り先の待ち行列 pool の席に着かない (${JSON.stringify(at)})`).toBeDefined();
    if (slot) expect(overlaps(slot, partOf(layout, "pool")) && slot.x >= partOf(layout, "pool").x, "待ち行列の席が待ち行列の四角の外にある").toBe(true);
    const titles = [...layout.routes, ...layout.queues, ...layout.chains].map((p) => ({ id: p.id, rect: titleRect(p.title) }));
    for (const moment of layout.moments)
      for (const [item, point] of Object.entries(moment.chips)) {
        if (!point) continue;
        const chip = { x: point[0], y: point[1], w: layout.chip.w, h: layout.chip.h };
        for (const title of titles) expect(overlaps(chip, title.rect), `段 ${moment.step + 1} のチップ ${item} が部品 ${title.id} の題と重なる`).toBe(false);
      }
  });

  it("interactive-side-follow-holds-queue", () => {
    const diagram = parsedTry(sideTry({ send: true }));
    const placed = place("side", diagram as { [key: string]: Json }, 600);
    const layout = placed.layout as unknown as SideLayout;
    const pool = partOf(layout, "pool");
    const win = placed.windowAt(1);
    expect(overflow(pool, win), `送る段の窓 ${JSON.stringify(win)} が待ち行列 pool ${JSON.stringify(pool)} からはみ出す`).toBeLessThanOrEqual(0.5);
  });
});

describe("試す図の部品を横に並べる書き方の文書 (#3429)", () => {
  it("docs-describe-try-side", () => {
    /** 見出し `heading` から次の同じ深さの見出しまで */
    const sectionOf = (text: string, heading: string): string => {
      const start = text.indexOf(heading);
      if (start < 0) return "";
      const next = text.indexOf("\n### ", start + heading.length);
      return text.slice(start, next < 0 ? undefined : next);
    };
    for (const [path, heading] of [
      ["packages/dragon/README.ja.md", "### 試す図"],
      ["packages/dragon/README.md", "### Try diagram"],
    ] as const) {
      const section = sectionOf(readRepo(path), heading);
      expect(section, `${path} に試す図の小節 (${heading}) が無い`).not.toBe("");
      expect(section, `${path} の試す図の小節に side の行の書き方が無い`).toContain("side ");
    }
    expect(readRepo("apps/playground-spa/src/docs/content.ts"), "使い方の頁に side の行が無い").toContain("side ");
  });
});

/**
 * 待ち列 passed と記録の列 rejects を横に並べる試す図 (#3506)。関門 gate で止まったチップを rejects に残す。
 * 書き手の例の段で 3 件を止めるので、最後の段の記録の列は 3 件の記録を持つ。`side` で `side` の行を差し替える (空の並びで持たない)
 */
function logSideTry(side: readonly string[] = ["side passed, rejects"]): string {
  return [
    "try 記録の列を横に並べる",
    "route net: you - gate - done [from: you, to: done]",
    "queue passed",
    "log rejects",
    "ask name, ok [into: passed, via: net]",
    "choose ok: yes, no",
    "check gate: ok == yes [no: BAD_SIGNATURE, into: rejects]",
    ...side,
    "step start",
    "  say 始める。",
    "step r1",
    "  say 1 件目が止まる。",
    "  ask a1, no",
    "step r2",
    "  say 2 件目が止まる。",
    "  ask a2, no",
    "step r3",
    "  say 3 件目が止まる。",
    "  ask a3, no",
  ].join("\n");
}

interface LogPlaced {
  id: string;
  w: number;
  slots: [number, number][];
}

describe("試す図の記録の列を横に並べる (#3506)", () => {
  it("interactive-side-accepts-log", () => {
    const parse = api("parseNotation");
    const parsed = parse(logSideTry());
    expect(parsed.ok, `記録の列を書いた side の行を読めない: ${parsed.ok ? "" : JSON.stringify(parsed.errors)}`).toBe(true);
    const printed = api("printNotation")(parsed.ok ? parsed.diagram : {});
    expect(printed.split("\n"), "書き戻した記法が記録の列を書いた side の行を持たない").toContain("side passed, rejects");
  });

  it("interactive-side-places-log-in-row", () => {
    const layout = layoutOf(parsedTry(logSideTry()), 740) as SideLayout & { logs?: LogPlaced[] };
    const passed = partOf(layout, "passed");
    const rejects = partOf(layout, "rejects");
    expect(layout.width, "記録の列を横に並べると図の幅が 740 から変わる").toBe(740);
    expect(Math.abs(passed.y - rejects.y), "同じ行の待ち列と記録の列の上の端のずれ").toBeLessThan(1);
    expect(overlaps(passed, rejects), "同じ行の待ち列と記録の列が重なる").toBe(false);
    const log = layout.logs?.find((l) => l.id === "rejects");
    expect(log, "記録の列の置き場所が無い").toBeDefined();
    const shown = log?.slots ?? [];
    expect(shown.length, "記録の列の記録の置き場所の数").toBeGreaterThanOrEqual(3);
    for (const [n, [x]] of shown.entries())
      expect(x + (log?.w ?? 0), `記録 ${n + 1} の右の端が記録の列の四角の右の端 ${right(rejects)} より右に出る`).toBeLessThanOrEqual(right(rejects) + 0.5);
  });

  it("interactive-side-log-stacks-when-narrow", () => {
    const side = layoutOf(parsedTry(logSideTry()), PHONE);
    const stacked = layoutOf(parsedTry(logSideTry([])), PHONE);
    expect(side.arrangement, `枠 ${PHONE}px で縦に組まない`).toBe("stack");
    expect(side.parts, `枠 ${PHONE}px の記録の列を横に並べた図の部品の四角が、side の行を持たない図と違う`).toEqual(stacked.parts);
    expect(side.height, `枠 ${PHONE}px の図の高さ`).toBe(stacked.height);
  });

  it("docs-side-gives-rest-to-log", () => {
    const line = (path: string, head: string): string => readRepo(path).split("\n").find((l) => l.startsWith(head)) ?? "";
    const en = line("packages/dragon/README.md", "- `side <part>, <part>, ...`");
    const ja = line("packages/dragon/README.ja.md", "- `side <部品>, <部品>, ...`");
    expect(en, "README.md に side の行の説明が無い").not.toBe("");
    expect(ja, "README.ja.md に side の行の説明が無い").not.toBe("");
    expect(en, "README.md の side の行の説明が、待ち列の残りの幅を記録の列 (log) にも渡すと書かない").toMatch(/rest goes to the route, chain, and log/u);
    expect(ja, "README.ja.md の side の行の説明が、待ち列の残りの幅を記録の列にも渡すと書かない").toContain("残りの幅を網と機械の列と記録の列に渡す");
  });
});

