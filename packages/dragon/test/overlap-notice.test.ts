// @vitest-environment jsdom
/**
 * 書いた図で字が重なる時に知らせる (#3178)。
 *
 * 重なりの一覧は、重なる字ごとに四角と段の番号かどうか (`spots`) を持つ。知らせる文は package が 1 つの関数 (`describeOverlap`) で作り、
 * 編集画面と書き出しの命令が同じ文を出す。書き出しの命令は file を書き出したうえで、標準エラーに重なりを 1 件 1 行で出して終わり方 0 で終える。
 * 頁の側では SVG を組まないので、図の上の囲みと段へ移る動きは再生の部品が持つ (`mark` と `goTo`)。
 *
 * 字の重なる図の見本は、同じ線を 5 段で通る構成図 (`fixtures/repeat-line.dragon`)。段の番号が線に沿って積み重なり、5 段目で段の番号 5 が段の番号 1 に重なる。
 * 積み重なりを直す時 (#3184) は、この見本を別の重なる形に替える。
 */
import { mkdtempSync, readdirSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import * as dragon from "../src/index";
import { type Overlap, parseNotation, type Player, renderDiagram } from "../src/index";
import { runCli } from "./export-support";

type Rect = { x: number; y: number; w: number; h: number };

/** 書き出しの命令を待つ時間 */
const SLOW = 60_000;
const FIXTURE = join(process.cwd(), "packages/dragon/test/fixtures/repeat-line.dragon");
const OAUTH = join(process.cwd(), "packages/dragon/examples/oauth.json");

function repeated(): dragon.Diagram {
  const parsed = parseNotation(readFileSync(FIXTURE, "utf8"));
  if (!parsed.ok) throw new Error(parsed.errors.map((e) => e.message).join(" / "));
  return parsed.diagram;
}

const lines = (text: string): string[] => text.split("\n").filter((line) => line !== "");

/** 枠の幅を決めて図を置く。幅を渡さない時は図の幅になり、止めて見せる図になる */
function mount(diagram: unknown, width?: number): { host: HTMLElement; player: Player } {
  const host = document.createElement("div");
  if (width !== undefined) Object.defineProperty(host, "clientWidth", { value: width });
  document.body.append(host);
  return { host, player: dragon.mountDiagram(host, diagram) };
}

const marks = (host: HTMLElement): SVGRectElement[] => [...host.querySelectorAll<SVGRectElement>("rect.dg-mark")];
const rectOf = (el: Element): Rect => ({ x: Number(el.getAttribute("x")), y: Number(el.getAttribute("y")), w: Number(el.getAttribute("width")), h: Number(el.getAttribute("height")) });
const covers = (outer: Rect, inner: Rect): boolean => outer.x <= inner.x && outer.y <= inner.y && outer.x + outer.w >= inner.x + inner.w && outer.y + outer.h >= inner.y + inner.h;

describe("字の重なりを知らせる (#3178)", () => {
  it("overlap-message-in-both-languages", () => {
    expect(typeof dragon.describeOverlap, "知らせる文の関数 describeOverlap が package の入口から出ていない").toBe("function");
    const say = dragon.describeOverlap;
    const rendered = renderDiagram(repeated());
    expect(rendered.overlaps.map((o) => [o.step, say(o, "ja"), say(o, "en")])).toEqual([[4, "段の番号 1 と段の番号 5 が重なる", "Step number 1 and step number 5 overlap"]]);

    // 字どうしの重なりと、線が字を横切る所も、日本語と英語で書く。段の番号でない字は鉤括弧か引用符で囲む
    const rect = { x: 0, y: 0, w: 10, h: 10 };
    const texts = { kind: "texts", step: 1, texts: ["確かめる", "返す"], spots: [{ text: "確かめる", rect, badge: false }, { text: "返す", rect, badge: false }] } as unknown as Overlap;
    const mixed = { kind: "texts", step: 1, texts: ["確かめる", "2"], spots: [{ text: "確かめる", rect, badge: false }, { text: "2", rect, badge: true }] } as unknown as Overlap;
    const line = { kind: "line", step: 1, text: "受け付ける", line: { from: "受付", to: "発送" }, spots: [{ text: "受け付ける", rect, badge: false }] } as unknown as Overlap;
    expect([texts, mixed, line].map((o) => say(o, "ja"))).toEqual(["「確かめる」と「返す」が重なる", "「確かめる」と段の番号 2 が重なる", "線 受付 → 発送 が「受け付ける」を横切る"]);
    expect([texts, mixed, line].map((o) => say(o, "en"))).toEqual(['"確かめる" and "返す" overlap', '"確かめる" and step number 2 overlap', 'The line 受付 → 発送 crosses "受け付ける"']);
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
    "export-warns-overlaps",
    async () => {
      const out = mkdtempSync(join(tmpdir(), "dragon-overlap-"));
      const ja = await runCli(["export", FIXTURE, "--format", "html", "--out", out]);
      expect(ja.code, ja.stderr).toBe(0);
      expect(readdirSync(out), "重なる図を書き出さなかった").toContain("repeat-line.html");
      expect(lines(ja.stderr), "標準エラーに重なりが 1 件 1 行で出ない").toEqual(["段 5: 段の番号 1 と段の番号 5 が重なる"]);
      const en = await runCli(["export", FIXTURE, "--format", "html", "--out", out, "--lang", "en"]);
      expect(en.code, en.stderr).toBe(0);
      expect(lines(en.stderr), "英語の標準エラーに重なりが 1 件 1 行で出ない").toEqual(["Step 5: Step number 1 and step number 5 overlap"]);
    },
    SLOW,
  );

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
