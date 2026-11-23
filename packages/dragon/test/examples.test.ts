/**
 * 公開する頁で選べる見本 3 つと、その英語版 (#2995)。
 *
 * 英語版は頁の言葉を EN にした時に出す。記法の語 (`時系列図` や `帯`) は日本語のまま、名前と本文だけを英語にする。
 * 訳す時に箱や線や段を落とすと、言葉を替えただけで図の形が変わるため、数を突き合わせる。
 */
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import type { Diagram } from "../src/schema";
import { api, exampleText, type Json } from "./diagram-support";
import { draw } from "./render-support";
// 全ての種類の見本を描くので、全ての種類を読む (#3763)
import "./all-kinds";

const examples = join(process.cwd(), "packages/dragon/examples");

/** 図の形を数で表す。線は段ごとに数える */
const shape = (d: Diagram): Record<string, unknown> => ({
  kind: d.kind,
  regions: (d.blocks.group ?? []).length,
  boxes: (d.blocks.box ?? []).length,
  steps: d.steps.length,
  lines: d.steps.map((step) => step.events.filter((event) => event.type === "edge").length),
});

describe("見本の英語版 (#2995)", () => {
  it("english-examples-match-japanese", () => {
    const parse = api("parseNotation");
    for (const name of ["intro", "oauth", "ccip"]) {
      for (const file of [`${name}.dragon`, `${name}.en.dragon`]) {
        expect(existsSync(join(examples, file)), `${file} が無い`).toBe(true);
      }
      const ja = parse(exampleText(`${name}.dragon`));
      const en = parse(exampleText(`${name}.en.dragon`));
      expect(ja.ok, `${name}.dragon が読めない`).toBe(true);
      expect(en.ok, `${name}.en.dragon が読めない: ${en.ok ? "" : JSON.stringify(en.errors)}`).toBe(true);
      if (!ja.ok || !en.ok) continue;
      expect(shape(en.diagram as unknown as Diagram), `${name} の英語版の形が日本語版と違う`).toEqual(shape(ja.diagram as unknown as Diagram));
    }
  });
});

describe("見本の説明 (#3240)", () => {
  it("example-descriptions-carry-no-issue-number", () => {
    // 見本帳は見本の file の最初の注釈の行を説明に出す (#3032)。作業の番号は利用者に意味が無いので、最初の行に書かない
    const files = readdirSync(examples).filter((file) => file.endsWith(".dragon"));
    expect(files.length, "packages/dragon/examples の見本の file の数").toBeGreaterThan(0);
    const numbered = files.filter((file) => /\(#\d+\)/u.test(readFileSync(join(examples, file), "utf8").split("\n")[0] ?? ""));
    expect(numbered, "最初の注釈の行に作業の番号を持つ見本の file").toEqual([]);
  });
});

/** 見本帳の見本のうち、記法に `box` を持つ図。種類ごとに分ける */
function galleryBoxes(): Map<string, { file: string; diagram: Json; ids: string[] }[]> {
  const byKind = new Map<string, { file: string; diagram: Json; ids: string[] }[]>();
  for (const file of readdirSync(examples).filter((f) => f.endsWith(".json") && !f.endsWith(".en.json")).sort()) {
    const diagram = JSON.parse(readFileSync(join(examples, file), "utf8")) as Json & { kind: string; blocks?: { box?: { id: string }[] } };
    const ids = (diagram.blocks?.box ?? []).map((b) => b.id);
    if (ids.length === 0) continue;
    const list = byKind.get(diagram.kind) ?? [];
    list.push({ file, diagram, ids });
    byKind.set(diagram.kind, list);
  }
  return byKind;
}

const GALLERY = galleryBoxes();

/**
 * 配管の図は `[fold]` の呼び出しの内側にしか出ない関係者を、開くまで描かない (#3389)。
 * 畳んだままでは押せる箱が無いので、畳んだ呼び出しを全て開いて描き、全ての箱を確かめる。
 * 開く番号は出てきた順の 0 からで、見本の畳む呼び出しの数より多く並べても描く物は変わらない
 */
const OPEN_ALL = Array.from({ length: 32 }, (_, i) => i);

/**
 * 見本帳の全ての種類の図で、描いた箱が記法の id を `data-node` に持つ (#3795)。
 * 全ての種類を描くので、全ての種類を既に読むこの file に置く。押した箱の id の読み方は `node-ids.test.ts` が確かめる
 */
describe.each([...GALLERY.keys()])("見本帳の %s の図", (kind) => {
  it("every-gallery-box-carries-its-id", () => {
    const missing: string[] = [];
    for (const { file, diagram, ids } of GALLERY.get(kind) ?? []) {
      const svg = draw("renderDiagram")(diagram, { open: OPEN_ALL }).svg;
      const found = new Set([...svg.matchAll(/\sdata-node="([^"]*)"/gu)].map((m) => m[1]));
      for (const id of ids) if (!found.has(id)) missing.push(`${file} の ${id}`);
    }
    expect(missing, "箱の id を data-node に持つ要素が描いた図に無い").toEqual([]);
  });
});
