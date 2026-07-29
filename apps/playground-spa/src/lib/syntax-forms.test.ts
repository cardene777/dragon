/**
 * 記法一覧に載せた書式が実際に動くことの検証。
 *
 * 一覧の行は「こう書けば動く」 と読まれる。 動かない行が混ざると、 一覧を見て書いた人が
 * まず躓く。 記法を足した時に一覧だけ古いまま、 という取り残しも同じ形で表に出る。
 *
 * 例文は一覧の行そのものから組む。 test 用に別の例文を書くと、 一覧の行が動かなくなっても
 * test は通ってしまう。
 */
import { describe, it, expect } from "vitest";
import { textDslToDiagram, parseTextDslV05, PRESET_TYPES } from "@cardenelabs/dragon";
import { loadPartsItems } from "@/lib/catalog-items";
import type { CdlDiagram } from "@cardenelabs/cdl";
import { FORMS, buildSample } from "./syntax-forms";

/** パーツを含む例文のために catalog を用意する。 */
async function partsCatalog(): Promise<Record<string, CdlDiagram>> {
  const items = await loadPartsItems();
  const map: Record<string, CdlDiagram> = {};
  for (const item of items) {
    map[item.id] = item.diagram;
    map[item.id.startsWith("parts-") ? item.id.slice(6) : item.id] = item.diagram;
  }
  return map;
}

describe("記法一覧の書式", () => {
  it("節が 1 つ以上ある (空振りしていない)", () => {
    expect(FORMS.length).toBeGreaterThan(0);
    for (const sec of FORMS) expect(sec.lines.length, sec.title).toBeGreaterThan(0);
  });

  for (const sec of FORMS) {
    it(`${sec.title}: 例文が記法として読める`, () => {
      const src = buildSample(sec);
      const r = parseTextDslV05(src);
      const detail = r.ok
        ? ""
        : `\n${src}\n--- 誤り ---\n${r.errors.map((e) => `L${e.line} ${e.message}`).join("\n")}`;
      expect(r.ok, `${sec.title} の例文が読めない${detail}`).toBe(true);
    });

    it(`${sec.title}: 例文が図になる`, async () => {
      const src = buildSample(sec);
      const catalog = await partsCatalog();
      // 解決できないパーツ名などは誤りにならず警告で流れる。 一覧に載せる以上、 警告も出さない。
      // 見るのは記法側 (`[dragon]`) の警告だけにする。 描画側の近接ヒントまで拾うと、
      // cdl の閾値を触っただけで一覧の test が落ちる
      const warned: string[] = [];
      const original = console.warn;
      console.warn = (...args: unknown[]): void => { warned.push(args.map(String).join(" ")); };
      // 「書いたのに効かなかった」 は誤りではなく知らせで返る。 一覧の例では 1 件も出ない
      const notices: string[] = [];
      let d;
      try {
        d = textDslToDiagram(src, { partsCatalog: catalog, onNotice: (n) => notices.push(n.message) });
      } finally {
        console.warn = original;
      }
      const fromDragon = warned.filter((w) => w.includes("[dragon]"));
      expect(fromDragon, `${sec.title} の例文が警告を出す\n${src}`).toEqual([]);
      expect(notices, `${sec.title} の例文に効かない指定がある\n${src}`).toEqual([]);
      // 箱が 1 つも無い図は「組み立てが通った」 だけで中身が空の可能性がある
      expect(d.nodes.length, `${sec.title} の図に箱が無い\n${src}`).toBeGreaterThan(0);
    });
  }

  it("例文に書いた図種は全て受け付ける値", () => {
    for (const sec of FORMS) {
      const type = sec.sample.type;
      if (type === undefined) continue;
      expect(PRESET_TYPES.has(type as never), `${sec.title} の図種 ${type}`).toBe(true);
    }
  });

  it("同じ節の中で行が重複しない (一覧の描画が行そのものを鍵にする)", () => {
    for (const sec of FORMS) {
      const codes = sec.lines.map((l) => l.code);
      expect(new Set(codes).size, `${sec.title} に重複した行がある`).toBe(codes.length);
    }
  });

  it("同じ行を 2 つの節に重複して載せない", () => {
    const seen = new Map<string, string>();
    for (const sec of FORMS) {
      for (const l of sec.lines) {
        const prev = seen.get(l.code);
        expect(prev, `"${l.code}" が ${prev} と ${sec.title} に重複`).toBeUndefined();
        seen.set(l.code, sec.title);
      }
    }
  });

  it("説明のない行は続きの行に限る (単独で意味が読めない行を出さない)", () => {
    for (const sec of FORMS) {
      for (const l of sec.lines) {
        if (l.note !== "") continue;
        // 説明を省けるのは、 直前の行の続きとして読める字下げ行だけ
        expect(/^\s{4,}/.test(l.code) || /^\s*-\s*\S+:\s*$/.test(l.code), `${sec.title} の "${l.code}"`).toBe(true);
      }
    }
  });
});

describe("記法一覧の例文の組み立て", () => {
  it("題名と図種を必ず持つ", () => {
    for (const sec of FORMS) {
      const src = buildSample(sec);
      expect(src, sec.title).toMatch(/^title\s*:/m);
      expect(src, sec.title).toMatch(/^type\s*:/m);
    }
  });

  it("一覧に出す行をそのまま含む (test 用に書き換えない)", () => {
    for (const sec of FORMS) {
      const src = buildSample(sec);
      for (const l of sec.lines) {
        expect(src.includes(l.code), `${sec.title} の "${l.code}" が例文に無い`).toBe(true);
      }
    }
  });

  it("題名と図種を一覧側で書いている節は重ねて書かない", () => {
    const sec = FORMS.find((s) => s.lines.some((l) => /^title\s*:/.test(l.code)));
    expect(sec, "題名を載せている節が無い").toBeDefined();
    const src = buildSample(sec!);
    expect(src.match(/^title\s*:/gm)).toHaveLength(1);
    expect(src.match(/^type\s*:/gm)).toHaveLength(1);
  });
});
