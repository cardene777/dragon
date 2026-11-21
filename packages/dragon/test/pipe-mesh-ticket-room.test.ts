/**
 * 網型で券を人に結ぶ図の、箱と人の間の空き (#3819)。
 *
 * 0.79.3 (#3813) で箱の下で折る管が無い図は箱と人の間を詰めたため、`erc20-transferfrom`の図で券 (`allowance`の札) が
 * Bobの上に収まらず右上へ逃げ、券とBobを結ぶ線が消えた。券を人に結ぶ図は、券の高さと上下の間を残す。
 */
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import * as dragon from "../src/core";
import { describe, expect, it } from "vitest";
import "../src/kind-use/pipe";
import "./built-globals";

interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}
interface Party extends Rect {
  id: string;
  shape?: string;
}
interface Link {
  to: string;
  step: number;
  label: Rect & { ticket?: unknown };
  tie?: [number, number, number, number];
}
interface Layout {
  parties: Party[];
  links?: Link[];
}
interface Api {
  parseNotation: (text: string, opts: { lang: "ja" }) => { ok: true; diagram: unknown } | { ok: false; errors: { line: number; message: string }[] };
  renderDiagram: (diagram: unknown, opts: { lang: "ja" }) => { svg: string; layout: Layout };
}
const api = dragon as unknown as Api;

const FIXTURES = join(process.cwd(), "packages/dragon/test/fixtures");
const read = (name: string): string => readFileSync(join(FIXTURES, name), "utf8");

function drawn(text: string): { svg: string; layout: Layout } {
  const parsed = api.parseNotation(text, { lang: "ja" });
  if (!parsed.ok) throw new Error(parsed.errors.map((e) => `${e.line}行目 ${e.message}`).join("\n"));
  return api.renderDiagram(parsed.diagram, { lang: "ja" });
}
const partyOf = (l: Layout, id: string): Party => {
  const p = l.parties.find((x) => x.id === id);
  if (!p) throw new Error(`${id} の名札が無い`);
  return p;
};
/** 人に結ぶ券。網型の人は箱 (`token`) でない名札 */
const personTickets = (l: Layout): Link[] => (l.links ?? []).filter((k) => k.label.ticket && l.parties.some((p) => p.id === k.to && p.shape !== "token"));

describe("網型で券を人に結ぶ図の空き (#3819)", () => {
  it("pipe-mesh-ticket-sits-above-spender", () => {
    const { svg, layout } = drawn(read("side-port-erc20-transferfrom-0.dragon"));
    const box = partyOf(layout, "usdc");
    const bob = partyOf(layout, "bob");
    const tickets = personTickets(layout).filter((k) => k.to === "bob");
    expect(tickets.length, "Bobに結ぶ券が無い").toBeGreaterThan(0);
    expect(svg, "券とBobを結ぶ線を描いていない").toContain('class="dg-pp-tkl"');
    for (const t of tickets) {
      const r = t.label;
      expect(r.y, `ステップ ${t.step} の券が箱の下の縁より上に在る`).toBeGreaterThanOrEqual(box.y + box.h);
      expect(r.y + r.h, `ステップ ${t.step} の券がBobの上の縁より下に在る`).toBeLessThanOrEqual(bob.y);
      expect(Math.min(r.x + r.w, bob.x + bob.w) - Math.max(r.x, bob.x), `ステップ ${t.step} の券がBobの真上に掛かっていない`).toBeGreaterThan(8);
      expect(t.tie, `ステップ ${t.step} の券とBobを結ぶ線が無い`).toBeDefined();
    }
  });

  it("pipe-mesh-ticket-tied-in-all-fixtures", () => {
    // 見本の全ての網型の図で、人に結ぶ券は人と結ぶ線を持つ
    const untied: string[] = [];
    let seen = 0;
    for (const name of readdirSync(FIXTURES).filter((f) => f.endsWith(".dragon"))) {
      const text = read(name);
      if (!/^layout mesh$/mu.test(text)) continue;
      const { layout } = drawn(text);
      for (const t of personTickets(layout)) {
        seen++;
        if (!t.tie) untied.push(`${name} ステップ ${t.step} の ${t.to} の券`);
      }
    }
    expect(seen, "人に結ぶ券を持つ網型の見本が無い").toBeGreaterThan(0);
    expect(untied, "人と結ぶ線の無い券").toEqual([]);
  });
});
