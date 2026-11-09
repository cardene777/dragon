/**
 * サイトの帯と経路と頁 (#3030)。
 *
 */
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { type Diagram, parseNotation, readDiagram } from "@cardenelabs/dragon";
import { type Lang } from "../text";
import { app, root } from "./playground-support";
import { describe, expect, it } from "vitest";

/** 節の例の file。JSON の節は原本の JSON。無ければ `undefined` */
const docsExample = (id: string, lang: Lang): string | undefined => {
  const name = `${id}${lang === "en" ? ".en" : ""}.${id === "json" ? "json" : "dragon"}`;
  const path = join(app, "src/docs/examples", name);
  return existsSync(path) ? readFileSync(path, "utf8").trimEnd() : undefined;
};

/** 節の例を読んで検査を通した図。JSON の節は原本の JSON として読む */
const docsDiagram = (id: string, text: string): Diagram | undefined => {
  let input: unknown;
  if (id === "json") {
    try {
      input = JSON.parse(text);
    } catch {
      return undefined;
    }
  } else {
    const parsed = parseNotation(text);
    if (!parsed.ok) return undefined;
    input = parsed.diagram;
  }
  const read = readDiagram(input);
  return read.ok ? read.diagram : undefined;
};

const eventsOf = (d: Diagram): Diagram["steps"][number]["events"] => d.steps.flatMap((s) => s.events);

/** 図の箱。版2の原本は箱の無い図で箱の欄を持たない */
const boxesOf = (d: Diagram): NonNullable<Diagram["blocks"]["box"]> => d.blocks.box ?? [];

describe("サイトの帯と経路と頁 (#3030)", () => {


  it("docs-state-example-parses", () => {
    // 状態遷移図の節の例は、始まりと終わりの線と、最初の段より前に書く通らない道を使う (#3172)
    for (const lang of ["ja", "en"] as const) {
      const text = docsExample("state", lang);
      expect(text, `${lang} の状態遷移図の節の例の file (src/docs/examples/state${lang === "en" ? ".en" : ""}.dragon) が無い`).toBeDefined();
      if (text === undefined) continue;
      const parsed = parseNotation(text);
      expect(parsed.ok ? [] : parsed.errors.map((e) => `${e.line}: ${e.message}`), `${lang} の状態遷移図の節の例が読めない`).toEqual([]);
      const diagram = docsDiagram("state", text);
      expect(diagram?.kind, `${lang} の状態遷移図の節の例が検査を通らないか、状態遷移図でない`).toBe("state");
      const edges = diagram ? eventsOf(diagram).flatMap((e) => (e.type === "edge" ? [e] : [])) : [];
      expect(edges.some((e) => e.from === "start"), `${lang} の状態遷移図の節の例に start から出る線が無い`).toBe(true);
      expect(edges.some((e) => e.to === "finish"), `${lang} の状態遷移図の節の例に finish へ入る線が無い`).toBe(true);
      expect(diagram?.blocks.path?.length ?? 0, `${lang} の状態遷移図の節の例に通らない道が無い`).toBeGreaterThan(0);
    }
  });


  it("docs-git-example-parses", () => {
    // 枝分かれの図の節の例は、枝を 3 本宣言し、枝を切り、merge commit と当て直しを作り、札を動かす (#3202)
    for (const lang of ["ja", "en"] as const) {
      const text = docsExample("git", lang);
      expect(text, `${lang} の枝分かれの図の節の例の file (src/docs/examples/git${lang === "en" ? ".en" : ""}.dragon) が無い`).toBeDefined();
      if (text === undefined) continue;
      const parsed = parseNotation(text);
      expect(parsed.ok ? [] : parsed.errors.map((e) => `${e.line}: ${e.message}`), `${lang} の枝分かれの図の節の例が読めない`).toEqual([]);
      const diagram = docsDiagram("git", text);
      expect(diagram?.kind, `${lang} の枝分かれの図の節の例が検査を通らないか、枝分かれの図でない`).toBe("git");
      expect(diagram?.blocks.branch?.length ?? 0, `${lang} の枝分かれの図の節の例が枝を 3 本宣言しない`).toBeGreaterThanOrEqual(3);
      const events = diagram ? eventsOf(diagram) : [];
      expect(events.some((e) => e.type === "branch"), `${lang} の枝分かれの図の節の例に枝を切る行が無い`).toBe(true);
      expect(events.some((e) => e.type === "commit" && e.copy !== undefined), `${lang} の枝分かれの図の節の例に当て直しの commit が無い`).toBe(true);
      expect(events.some((e) => e.type === "commit" && e.merge !== undefined), `${lang} の枝分かれの図の節の例に merge commit が無い`).toBe(true);
      expect(events.some((e) => e.type === "edge"), `${lang} の枝分かれの図の節の例に札を動かす線が無い`).toBe(true);
    }
  });


  it("docs-time-example-parses", () => {
    // 時間軸の図の節の例は 4 段で、区切りと印の列と 2 つの節目と拡大の範囲を宣言し、針を進め、印の色を変え、範囲を出し、物差しを満たす (#3221)
    for (const lang of ["ja", "en"] as const) {
      const text = docsExample("time", lang);
      expect(text, `${lang} の時間軸の図の節の例の file (src/docs/examples/time${lang === "en" ? ".en" : ""}.dragon) が無い`).toBeDefined();
      if (text === undefined) continue;
      const parsed = parseNotation(text);
      expect(parsed.ok ? [] : parsed.errors.map((e) => `${e.line}: ${e.message}`), `${lang} の時間軸の図の節の例が読めない`).toEqual([]);
      const diagram = docsDiagram("time", text);
      expect(diagram?.kind, `${lang} の時間軸の図の節の例が検査を通らないか、時間軸の図でない`).toBe("time");
      expect(diagram?.steps.length, `${lang} の時間軸の図の節の例が 4 段でない`).toBe(4);
      const time = diagram?.blocks;
      expect(time?.period, `${lang} の時間軸の図の節の例が区切りを宣言しない`).toBeDefined();
      expect(time?.row?.length ?? 0, `${lang} の時間軸の図の節の例が印の列を宣言しない`).toBeGreaterThanOrEqual(1);
      expect(time?.point?.length ?? 0, `${lang} の時間軸の図の節の例が節目を 2 つ宣言しない`).toBeGreaterThanOrEqual(2);
      expect(time?.zoom, `${lang} の時間軸の図の節の例が拡大の範囲を宣言しない`).toBeDefined();
      const events = diagram === undefined ? [] : eventsOf(diagram);
      expect(events.some((e) => e.type === "now"), `${lang} の時間軸の図の節の例に針を進める行が無い`).toBe(true);
      expect(events.some((e) => e.type === "mark"), `${lang} の時間軸の図の節の例に印の色を変える行が無い`).toBe(true);
      expect(events.some((e) => e.type === "span"), `${lang} の時間軸の図の節の例に範囲の行が無い`).toBe(true);
      expect(diagram?.blocks.strip?.meters?.length ?? 0, `${lang} の時間軸の図の節の例に物差しの欄が無い`).toBeGreaterThan(0);
    }
  });


  it("docs-tree-example-parses", () => {
    // 木の図の節の例は 4 段で、葉を 4 つと親を 3 つ持ち、葉と親の全てが値を持ち、親子の箱どうしの運ぶ物の線を通す (#3235)
    for (const lang of ["ja", "en"] as const) {
      const text = docsExample("tree", lang);
      expect(text, `${lang} の木の図の節の例の file (src/docs/examples/tree${lang === "en" ? ".en" : ""}.dragon) が無い`).toBeDefined();
      if (text === undefined) continue;
      const parsed = parseNotation(text);
      expect(parsed.ok ? [] : parsed.errors.map((e) => `${e.line}: ${e.message}`), `${lang} の木の図の節の例が読めない`).toEqual([]);
      const diagram = docsDiagram("tree", text);
      expect(diagram?.kind, `${lang} の木の図の節の例が検査を通らないか、木の図でない`).toBe("tree");
      expect(diagram?.steps.length, `${lang} の木の図の節の例が 4 段でない`).toBe(4);
      const events = diagram === undefined ? [] : eventsOf(diagram);
      const leaves = events.filter((e) => e.type === "leaf");
      const nodes = events.filter((e) => e.type === "node");
      expect(leaves.length, `${lang} の木の図の節の例の葉が 4 つでない`).toBe(4);
      expect(nodes.length, `${lang} の木の図の節の例の親が 3 つでない`).toBe(3);
      expect([...leaves, ...nodes].every((e) => e.hash !== undefined), `${lang} の木の図の節の例に値を持たない葉か親がある`).toBe(true);
      const parentOf = new Map(nodes.flatMap((n) => n.children.map((child) => [child, n.id] as const)));
      expect(events.some((e) => e.type === "edge" && e.carry.kind !== "none" && parentOf.get(e.from) === e.to), `${lang} の木の図の節の例に親子の箱どうしの運ぶ物の線が無い`).toBe(true);
    }
  });


  it("docs-extend-example-uses-three-bases", () => {
    // ブロックを足す節の例は、箱と線と印を元にした足したブロックを 1 つずつ定義し、3 つとも図の中で使う (#3407)
    for (const lang of ["ja", "en"] as const) {
      const text = docsExample("extend", lang);
      expect(text, `${lang} のブロックを足す節の例の file (src/docs/examples/extend${lang === "en" ? ".en" : ""}.dragon) が無い`).toBeDefined();
      if (text === undefined) continue;
      const parsed = parseNotation(text);
      expect(parsed.ok ? [] : parsed.errors.map((e) => `${e.line}: ${e.message}`), `${lang} のブロックを足す節の例が読めない`).toEqual([]);
      if (!parsed.ok) continue;
      const defined = parsed.diagram.define?.blocks ?? [];
      expect(defined.map((b) => b.base).sort(), `${lang} のブロックを足す節の例が、箱と線と印を元にした足したブロックを 1 つずつ定義しない`).toEqual(["box", "edge", "icon"]);
      const nameOf = (base: string): string | undefined => defined.find((b) => b.base === base)?.name;
      const boxes = boxesOf(parsed.diagram);
      expect(boxes.some((b) => b.block === nameOf("box")), `${lang} のブロックを足す節の例が、足した箱を図で使わない`).toBe(true);
      expect(eventsOf(parsed.diagram).some((e) => e.type === "edge" && e.block === nameOf("edge")), `${lang} のブロックを足す節の例が、足した線を図で使わない`).toBe(true);
      expect(boxes.some((b) => b.icon === nameOf("icon")), `${lang} のブロックを足す節の例が、足した印を図で使わない`).toBe(true);
      // 同じ見本を編集画面の見本の一覧にも置く。見本の file は頭に `//` の説明の行を持ち、それを除くと節の例と同じ字になる
      const sample = join(root, `packages/dragon/examples/bridge${lang === "en" ? ".en" : ""}.dragon`);
      expect(existsSync(sample), `${lang} の編集画面の見本の file (packages/dragon/examples/bridge${lang === "en" ? ".en" : ""}.dragon) が無い`).toBe(true);
      if (!existsSync(sample)) continue;
      const body = readFileSync(sample, "utf8")
        .split("\n")
        .filter((line) => !line.startsWith("//"))
        .join("\n")
        .trim();
      expect(body, `${lang} の編集画面の見本が、説明の行を除いてブロックを足す節の例と同じ字でない`).toBe(text.trim());
    }
  });
});
