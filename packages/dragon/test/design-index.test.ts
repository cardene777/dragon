import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

// @ts-expect-error -- 検査対象は .mjs で型宣言を持たない
import { buildIndexHtml, collectEntries, prefixIds, summaryOf, writeIndex } from "../scripts/design-index.mjs";

type Entry = { group: string; name: string; svg: string; summary: string; hasSource: boolean; hasNote: boolean };
type Problem = { path: string; why: string };

const SVG = (id: string) =>
  `<svg viewBox="0 0 10 10"><defs><marker id="${id}"><path d="M0 0"/></marker></defs><line marker-end="url(#${id})"/></svg>`;

let root: string;

/** 図 1 件を納める。 何を欠かすかを呼出側が選べる形にして、欠けを検知できるか確かめる */
function put(group: string, name: string, opts: { look?: boolean; source?: boolean; note?: string } = {}) {
  const dir = join(root, group, name);
  mkdirSync(dir, { recursive: true });
  if (opts.look !== false) writeFileSync(join(dir, "look.svg"), SVG("cdl-arrow"));
  if (opts.source !== false) writeFileSync(join(dir, "source.cdl.ts"), "// 記法\n");
  if (opts.note !== undefined) writeFileSync(join(dir, "note.md"), opts.note);
  return dir;
}

beforeEach(() => {
  root = mkdtempSync(join(tmpdir(), "design-index-"));
});
afterEach(() => {
  rmSync(root, { recursive: true, force: true });
});

describe("意匠帳の一覧", () => {
  it("納めた figure を全件拾う", () => {
    put("presets", "er-demo", { note: "# er-demo\n\n表と表の繋がりを示す図。\n" });
    put("presets", "flow-demo", { note: "流れを示す図。\n" });
    put("primitives", "shape-file", { note: "file の形。\n" });

    const { entries, problems } = collectEntries(root) as { entries: Entry[]; problems: Problem[] };

    expect(entries.length, "1 件も拾えていない (検査が空振りしている)").toBeGreaterThan(0);
    expect(entries.length).toBe(3);
    expect(entries.map((e) => `${e.group}/${e.name}`)).toEqual([
      "presets/er-demo",
      "presets/flow-demo",
      "primitives/shape-file",
    ]);
    expect(problems).toEqual([]);
  });

  it("look.svg を持たない dir は黙って落とさず、拾えなかったものとして返す", () => {
    put("presets", "er-demo", { note: "ある。\n" });
    put("presets", "broken-demo", { look: false, note: "見た目が無い。\n" });

    const { entries, problems } = collectEntries(root) as { entries: Entry[]; problems: Problem[] };

    expect(entries.map((e) => e.name)).toEqual(["er-demo"]);
    expect(problems).toEqual([{ path: "presets/broken-demo", why: "look.svg が無い" }]);
  });

  it("note.md と source.cdl.ts の欠けを entry ごとに持つ", () => {
    put("presets", "full-demo", { note: "決めたことがある。\n" });
    put("presets", "bare-demo", { source: false });

    const { entries } = collectEntries(root) as { entries: Entry[] };
    const bare = entries.find((e) => e.name === "bare-demo");

    expect(bare?.hasSource).toBe(false);
    expect(bare?.hasNote).toBe(false);
    expect(entries.find((e) => e.name === "full-demo")?.hasNote).toBe(true);
  });

  it("走査先が無い時は 0 件で済ませず、理由を返す", () => {
    const { entries, problems } = collectEntries(join(root, "no-such-dir")) as {
      entries: Entry[];
      problems: Problem[];
    };

    expect(entries).toEqual([]);
    expect(problems.length, "走査できなかったことが記録されていない").toBe(1);
    expect(problems[0]?.why).toBe("走査する dir が無い");
  });
});

describe("note.md の 1 行目", () => {
  it("見出しと frontmatter を飛ばして最初の本文を取る", () => {
    expect(summaryOf("---\ntitle: x\n---\n\n# er-demo\n\n表と表の繋がり。\n")).toBe("表と表の繋がり。");
  });

  it("箇条書きの記号を落とす", () => {
    expect(summaryOf("- 流れを示す図。\n")).toBe("流れを示す図。");
  });

  it("書かれていなければ空を返す", () => {
    expect(summaryOf("# 見出しだけ\n")).toBe("");
  });
});

describe("id の付け替え", () => {
  it("定義と参照の両方を書き換える", () => {
    const out = prefixIds(SVG("cdl-arrow"), "e0");

    expect(out).toContain('id="e0-cdl-arrow"');
    expect(out).toContain("url(#e0-cdl-arrow)");
    expect(out, "元の参照が残っている").not.toContain("url(#cdl-arrow)");
  });

  it("同じ id を持つ図を並べても衝突しない", () => {
    const a = prefixIds(SVG("cdl-arrow"), "e0");
    const b = prefixIds(SVG("cdl-arrow"), "e1");

    const ids = [...`${a}${b}`.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]);
    expect(ids.length, "id を 1 つも数えていない").toBeGreaterThan(0);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("id を持たない図はそのまま返す", () => {
    const plain = '<svg viewBox="0 0 10 10"><line/></svg>';
    expect(prefixIds(plain, "e0")).toBe(plain);
  });
});

describe("一覧の頁", () => {
  it("card の数が entry の数と一致する", () => {
    put("presets", "er-demo", { note: "表と表の繋がり。\n" });
    put("presets", "flow-demo", { note: "流れ。\n" });
    put("primitives", "shape-file", { note: "file の形。\n" });

    const { entries, problems } = collectEntries(root) as { entries: Entry[]; problems: Problem[] };
    const html = buildIndexHtml(entries, problems) as string;
    const cards = html.match(/class="card"/g) ?? [];

    expect(entries.length).toBeGreaterThan(0);
    expect(cards.length).toBe(entries.length);
    expect(html).toContain('data-entry="presets/er-demo"');
  });

  it("拾えなかった dir を頁に出す", () => {
    put("presets", "broken-demo", { look: false });

    const { entries, problems } = collectEntries(root) as { entries: Entry[]; problems: Problem[] };
    const html = buildIndexHtml(entries, problems) as string;

    expect(html).toContain("集められなかった dir");
    expect(html).toContain("presets/broken-demo");
  });

  it("決めたことが無い figure はそう書く", () => {
    put("presets", "er-demo");

    const { entries } = collectEntries(root) as { entries: Entry[] };
    const html = buildIndexHtml(entries) as string;

    expect(html).toContain("決めたことがまだ書かれていない");
  });
});

describe("書き出し", () => {
  it("渡した dir の直下にだけ書く", () => {
    put("presets", "er-demo", { note: "表と表の繋がり。\n" });

    const r = writeIndex(root) as { out: string; count: number; problems: Problem[] };

    expect(r.out).toBe(join(root, "index.html"));
    expect(r.count).toBe(1);
    expect(readFileSync(r.out, "utf8")).toContain('data-entry="presets/er-demo"');
  });
});
