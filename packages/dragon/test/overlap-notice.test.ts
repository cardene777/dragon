// @vitest-environment jsdom
/**
 * 書いた図で字が重なる時に知らせる (#3178)。
 *
 * 重なりの一覧は、重なる字ごとに四角と段の番号かどうか (`spots`) を持つ。知らせる文は package が 1 つの関数 (`describeOverlap`) で作り、
 * 編集画面と書き出しの命令が同じ文を出す。書き出しの命令は file を書き出したうえで、標準エラーに重なりを 1 件 1 行で出して終わり方 0 で終える。
 * 頁の側では SVG を組まないので、図の上の囲みと段へ移る動きは再生の部品が持つ (`mark` と `goTo`)。
 *
 * 知らせる文は、2 段目に書き込みだけを持つ状態遷移図 (`fixtures/corner-note.dragon`) を描いた後、2 段目の番号を状態の左上の角から 4px 内側
 * (#3187 より前の置き場所) へ動かして絵柄に重ね、置き場所を書き換えて描く所 (`renderLayout`) へ直に渡して確かめる。
 * 重なる図を読ませて書き出しの命令と編集画面の知らせを確かめる検査は置かない。線の無い段の番号を箱の角に置くと (#3187)、
 * 記法と JSON で組んだ 6000 図以上で字の重なる図が 1 つも出ず、読ませる図を作れないため。
 * 段を移る検査と四角を描く検査は、重なりと関わらないので 5 段の構成図 (`fixtures/repeat-line.dragon`) で見る。
 *
 * 箱の絵柄と運ぶ物 (硬貨と封筒) は、知らせる文の言葉で呼ぶ (#3184)。日本語は「<箱の名前> の絵柄」「硬貨」「封筒」、英語は `the icon of "<箱の名前>"`、`the coin`、`the envelope`。
 */
import { mkdtempSync, readdirSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import * as dragon from "../src/index";
import { type Overlap, parseNotation, type Player, renderDiagram } from "../src/index";
import { LOOK } from "../src/look/values";
import { renderLayout } from "../src/render/svg";
import { runCli } from "./export-support";

type Rect = { x: number; y: number; w: number; h: number };

/** 書き出しの命令を待つ時間 */
const SLOW = 60_000;
const FIXTURE = join(process.cwd(), "packages/dragon/test/fixtures/repeat-line.dragon");
const CORNER_NOTE = join(process.cwd(), "packages/dragon/test/fixtures/corner-note.dragon");
const OAUTH = join(process.cwd(), "packages/dragon/examples/oauth.json");

function read(file: string, lang: "ja" | "en" = "ja"): dragon.Diagram {
  const parsed = parseNotation(readFileSync(file, "utf8"), { lang });
  if (!parsed.ok) throw new Error(parsed.errors.map((e) => e.message).join(" / "));
  return parsed.diagram;
}

const repeated = (): dragon.Diagram => read(FIXTURE);

/** 1 段目に封筒、2 段目に硬貨が決済へ着く構成図。決済は絵柄を持つ */
const CARRYING = ["architecture 運ぶ物と絵柄", "", "box 店 [icon: app]", "box 決済 [icon: card]", "", "step 頼む", "  say 店が決済に頼む。", "  店 -> 決済: 頼む", "", "step 払う", "  say 店が払う。", "  店 -> 決済: 払う [carry: coin]"].join("\n");

/**
 * 運ぶ物を決済の絵柄の上に留めた時と、1 段目の番号を絵柄に重ねた時の知らせる文を、段ごとに並べる。
 * 置き場所の計算は運ぶ物と番号を絵柄から離すので、置き場所を書き換えて描く所 (`renderLayout`) へ直に渡す
 */
function partMessages(lang: "ja" | "en"): string[] {
  const parsed = parseNotation(CARRYING, { lang });
  if (!parsed.ok) throw new Error(parsed.errors.map((e) => e.message).join(" / "));
  const rendered = renderDiagram(parsed.diagram, { lang });
  const out: string[] = [];
  const pay = rendered.layout.boxes.find((b) => b.id === "決済");
  if (!pay) throw new Error("決済の箱が無い");
  const icon: [number, number] = [(pay as { iconX?: number }).iconX ?? pay.cx, pay.cy + LOOK.box.iconY];
  for (const step of [0, 1]) {
    const layout = structuredClone(rendered.layout);
    const edge = layout.edges.find((e) => e.step === step);
    if (!edge) throw new Error(`${step + 1} 段目の線が無い`);
    edge.settle = icon;
    const moved = renderLayout(rendered.diagram, layout, rendered.timeline, { lang }).overlaps.filter((o) => o.step === step);
    out.push(...moved.map((o) => dragon.describeOverlap(o, lang)));
  }
  const layout = structuredClone(rendered.layout);
  const badge = layout.badges.find((b) => b.step === 0);
  if (!badge) throw new Error("1 段目の番号が無い");
  Object.assign(badge, { x: icon[0], y: icon[1] });
  out.push(...renderLayout(rendered.diagram, layout, rendered.timeline, { lang }).overlaps.filter((o) => o.step === 0).map((o) => dragon.describeOverlap(o, lang)));
  return out;
}

/**
 * 2 段目の番号を支払い待ちの左上の角から 4px 内側 (#3187 より前の置き場所) へ動かし、絵柄に重ねた時の重なり。
 * 置き場所の計算は番号を絵柄から離すので、置き場所を書き換えて描く所 (`renderLayout`) へ直に渡す
 */
function cornerOverlaps(): Overlap[] {
  const rendered = renderDiagram(read(CORNER_NOTE));
  const layout = structuredClone(rendered.layout);
  const badge = layout.badges.find((b) => b.step === 1);
  const box = layout.boxes.find((b) => b.id === "支払い待ち");
  if (!badge || !box) throw new Error("2 段目の番号か支払い待ちの箱が無い");
  Object.assign(badge, { x: box.x + LOOK.badge.inset, y: box.y + LOOK.badge.inset });
  return renderLayout(rendered.diagram, layout, rendered.timeline).overlaps;
}

/** 枠の幅を決めて図を置く。幅を渡さない時は図の幅になり、止めて見せる図になる */
function mount(diagram: unknown, width?: number): { host: HTMLElement; player: Player } {
  const host = document.createElement("div");
  if (width !== undefined) Object.defineProperty(host, "clientWidth", { value: width });
  document.body.append(host);
  return { host, player: dragon.mountDiagram(host, diagram) };
}

const marks = (host: HTMLElement): SVGRectElement[] => [...host.querySelectorAll<SVGRectElement>("rect.dg-spot")];
const rectOf = (el: Element): Rect => ({ x: Number(el.getAttribute("x")), y: Number(el.getAttribute("y")), w: Number(el.getAttribute("width")), h: Number(el.getAttribute("height")) });
const covers = (outer: Rect, inner: Rect): boolean => outer.x <= inner.x && outer.y <= inner.y && outer.x + outer.w >= inner.x + inner.w && outer.y + outer.h >= inner.y + inner.h;

describe("字の重なりを知らせる (#3178)", () => {
  it("overlap-message-in-both-languages", () => {
    expect(typeof dragon.describeOverlap, "知らせる文の関数 describeOverlap が package の入口から出ていない").toBe("function");
    const say = dragon.describeOverlap;
    expect(cornerOverlaps().map((o) => [o.step, say(o, "ja"), say(o, "en")])).toEqual([[1, "「支払い待ち の絵柄」と段の番号 2 が重なる", 'The icon of "支払い待ち" and step number 2 overlap']]);

    // 字どうしの重なりと、線が字を横切る所も、日本語と英語で書く。段の番号でない字は鉤括弧か引用符で囲む
    const rect = { x: 0, y: 0, w: 10, h: 10 };
    const texts = { kind: "texts", step: 1, texts: ["確かめる", "返す"], spots: [{ text: "確かめる", rect, badge: false }, { text: "返す", rect, badge: false }] } as unknown as Overlap;
    const mixed = { kind: "texts", step: 1, texts: ["確かめる", "2"], spots: [{ text: "確かめる", rect, badge: false }, { text: "2", rect, badge: true }] } as unknown as Overlap;
    const line = { kind: "line", step: 1, text: "受け付ける", line: { from: "受付", to: "発送" }, spots: [{ text: "受け付ける", rect, badge: false }] } as unknown as Overlap;
    const badges = { kind: "texts", step: 4, texts: ["1", "5"], spots: [{ text: "1", rect, badge: true }, { text: "5", rect, badge: true }] } as unknown as Overlap;
    expect([texts, mixed, line, badges].map((o) => say(o, "ja"))).toEqual(["「確かめる」と「返す」が重なる", "「確かめる」と段の番号 2 が重なる", "線 受付 → 発送 が「受け付ける」を横切る", "段の番号 1 と段の番号 5 が重なる"]);
    expect([texts, mixed, line, badges].map((o) => say(o, "en"))).toEqual(['"確かめる" and "返す" overlap', '"確かめる" and step number 2 overlap', 'The line 受付 → 発送 crosses "受け付ける"', "Step number 1 and step number 5 overlap"]);
  });

  it("overlap-names-parts-in-japanese", () => {
    expect(partMessages("ja")).toEqual(["「決済 の絵柄」と「封筒」が重なる", "「決済 の絵柄」と「硬貨」が重なる", "「決済 の絵柄」と段の番号 1 が重なる"]);
  });

  it("overlap-names-parts-in-english", () => {
    expect(partMessages("en")).toEqual(['The icon of "決済" and the envelope overlap', 'The icon of "決済" and the coin overlap', 'The icon of "決済" and step number 1 overlap']);
  });

  it("player-goes-to-step", () => {
    const { host, player } = mount(repeated());
    try {
      expect(typeof player.goTo, "再生の部品に段へ移る呼び出し goTo が無い").toBe("function");
      player.goTo(4);
      expect([player.step, player.playing], "5 段目で止まらない").toEqual([4, false]);
      expect(host.querySelector('[data-dragon="step-no"]')?.textContent, "段の番号の札が 5 段目にならない").toBe("05/05");
      player.goTo(99);
      expect(player.step, "段の数を超えた段へ移ろうとした時に最後の段で止まらない").toBe(4);
    } finally {
      player.destroy();
    }
  });

  it("player-marks-rects", () => {
    const given = { x: 120, y: 40, w: 30, h: 20 };
    const fixed = mount(repeated());
    try {
      expect(typeof fixed.player.mark, "再生の部品に四角を描く呼び出し mark が無い").toBe("function");
      fixed.player.mark([given]);
      expect(marks(fixed.host).map((m) => covers(rectOf(m), given)), "渡した四角を覆う点線の四角が 1 つ無い").toEqual([true]);
      // 段を移って図を置き直しても、四角は残る
      fixed.player.next();
      expect(marks(fixed.host), "段を移ると四角が消えた").toHaveLength(1);
      fixed.player.mark([]);
      expect(marks(fixed.host), "空を渡しても四角が消えない").toHaveLength(0);
    } finally {
      fixed.player.destroy();
    }

    // 寄って追う図では、四角は窓の中身と一緒に動く所に在る
    const follow = mount(JSON.parse(readFileSync(OAUTH, "utf8")), 360);
    try {
      expect(follow.host.querySelector('svg[data-dragon="figure"]')?.getAttribute("data-view"), "枠の幅 360px の OAuth が寄って追う図にならない").toBe("follow");
      follow.player.mark([given]);
      const [mark] = marks(follow.host);
      expect(mark, "寄って追う図に四角が無い").toBeDefined();
      expect(mark?.closest('g[clip-path^="url(#dg-vp-"] > g.dg-a'), "四角が窓の中身と一緒に動く所に無い").not.toBeNull();
      expect(covers(rectOf(mark as Element), given), "寄って追う図の四角が渡した四角を覆わない").toBe(true);
    } finally {
      follow.player.destroy();
    }
  });

  it(
    "export-quiet-without-overlaps",
    async () => {
      const out = mkdtempSync(join(tmpdir(), "dragon-overlap-"));
      const ran = await runCli(["export", OAUTH, "--format", "html", "--out", out]);
      expect(ran.code, ran.stderr).toBe(0);
      expect(readdirSync(out)).toContain("oauth.html");
      expect(ran.stderr, "重ならない図で標準エラーに何か出た").toBe("");
    },
    SLOW,
  );
});
