// @vitest-environment jsdom
/**
 * 描いた箱と囲みが記法の id を `data-node` に持ち、頁の script が押した箱の id を読める (#3795)。
 *
 * 図を埋めた頁 (説明の資料など) は、箱を押した時にその箱の説明を出したい。
 * 箱の名前の字で探すと、同じ名前の箱が 2 つ在る図で別の箱を引くので、記法の `box <id>` と `group <id>` の id で引く。
 * dragon は関数も出来事も足さず、描いた要素に属性 `data-node` を付けるだけにし、頁は自分の押した時の処理で
 * `closest('[data-node]')` を読む。帯と経路の部品が既に同じ属性で箱の id を持つので、名前を揃える。
 * 線と札は `data-node` を持たない。押した所の外側を辿った時に、線の札から箱を引かないため。
 *
 * `dragon embed` で書き出した 1 枚の HTML は、埋めた script がこの検査と同じ描く処理で開いた頁の中で描く。
 * 0.79.7 の枝は書き出す時に図を描く処理 (#3801) を持たないので、書き出した字の検査を持たない。
 */
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { api, type Json } from "./diagram-support";
import { draw } from "./render-support";
import "../src/kind-use/architecture";
import "../src/kind-use/cycle";
import "../src/kind-use/flow";
import "../src/kind-use/git";
import "../src/kind-use/lineup";
import "../src/kind-use/matrix";
import "../src/kind-use/pipe";
import "../src/kind-use/sankey";
import "../src/kind-use/sequence";
import "../src/kind-use/state";
import "../src/kind-use/time";
import "../src/kind-use/tree";

// 検査は repo の上から回すので、repo の上を作業の場所から取る (`embed-docs.test.ts` と同じ)
const ROOT = process.cwd();
const PACKAGE = join(ROOT, "packages", "dragon");

/** 記法を読んで描いた SVG の字。読めなければ誤りを名指して落とす */
function svgOf(text: string): string {
  const read = api("parseNotation")(text, { lang: "ja" });
  expect(read.ok, `記法が読めない: ${read.ok ? "" : JSON.stringify(read.errors)}`).toBe(true);
  return draw("renderDiagram")(read.ok ? read.diagram : {}, {}).svg;
}

function docOf(svg: string): Document {
  return new DOMParser().parseFromString(svg, "image/svg+xml");
}

/** `data-node` を持つ要素と、その値 */
function nodes(root: ParentNode): Element[] {
  return [...root.querySelectorAll("[data-node]")];
}

function idOf(el: Element | null | undefined): string | undefined {
  return el?.getAttribute("data-node") ?? undefined;
}

/** 字がちょうど `text` の `text` 要素 */
function textsOf(root: ParentNode, text: string): Element[] {
  return [...root.querySelectorAll("text")].filter((t) => (t.textContent ?? "").trim() === text);
}

const FLOW = [
  "flow 受け付け",
  "",
  "box client as 利用者",
  "box api as API server",
  "",
  "step 送る",
  "  say 利用者がAPIを呼ぶ。",
  "  client -> api: 呼ぶ",
  "",
].join("\n");

const TWINS = [
  "flow 2つの入口",
  "",
  "box east as Router",
  "box west as Router",
  "",
  "step 渡す",
  "  say 東の入口が西の入口へ渡す。",
  "  east -> west: 渡す",
  "",
].join("\n");

const GROUPED = [
  "architecture 送る仕組み",
  "",
  "group src as 送る側",
  "  box app as アプリ",
  "end",
  "box db as 記録",
  "",
  "step 送る",
  "  say アプリが記録へ書く。",
  "  app -> db: 書く",
  "",
].join("\n");

describe("箱と囲みの id", () => {
  it("box-carries-notation-id", () => {
    const doc = docOf(svgOf(FLOW));
    const api = nodes(doc).filter((el) => idOf(el) === "api");
    expect(api.length, "箱 api を描いた要素が data-node=\"api\" を持たない").toBeGreaterThan(0);
    expect(
      api.some((el) => textsOf(el, "API server").length > 0),
      "data-node=\"api\" の要素が箱の名前 API server を持たない",
    ).toBe(true);
  });

  it("same-name-boxes-carry-distinct-ids", () => {
    const doc = docOf(svgOf(TWINS));
    const east = nodes(doc).find((el) => idOf(el) === "east");
    const west = nodes(doc).find((el) => idOf(el) === "west");
    expect(east, "同じ名前の箱 east を描いた要素が data-node を持たない").toBeDefined();
    expect(west, "同じ名前の箱 west を描いた要素が data-node を持たない").toBeDefined();
    expect(east === west, "同じ名前の 2 つの箱が同じ要素を指す").toBe(false);
    expect(textsOf(east as Element, "Router").length, "east の要素が名前 Router を持たない").toBeGreaterThan(0);
    expect(textsOf(west as Element, "Router").length, "west の要素が名前 Router を持たない").toBeGreaterThan(0);
  });

  it("group-carries-notation-id", () => {
    const doc = docOf(svgOf(GROUPED));
    const src = nodes(doc).find((el) => idOf(el) === "src");
    expect(src, "囲み src を描いた要素が data-node=\"src\" を持たない").toBeDefined();
    expect(textsOf(src as Element, "送る側").length, "data-node=\"src\" の要素が囲みの名前 送る側 を持たない").toBeGreaterThan(0);
  });

  it("click-reads-innermost-node-id", () => {
    document.body.innerHTML = svgOf(GROUPED);
    let got: string | undefined;
    const read = (event: Event): void => {
      got = idOf((event.target as Element).closest("[data-node]"));
    };
    document.body.addEventListener("click", read);
    try {
      const press = (text: string): string | undefined => {
        got = undefined;
        const target = textsOf(document.body, text)[0];
        expect(target, `押す字 ${text} が描いた図に無い`).toBeDefined();
        target?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
        return got;
      };
      expect(press("アプリ"), "囲みの中の箱 アプリ を押した時に箱の id を読めない").toBe("app");
      expect(press("送る側"), "囲みの名前 送る側 を押した時に囲みの id を読めない").toBe("src");
      expect(press("記録"), "囲みの外の箱 記録 を押した時に箱の id を読めない").toBe("db");
    } finally {
      document.body.removeEventListener("click", read);
      document.body.innerHTML = "";
    }
  });

  it("lines-and-labels-carry-no-node-id", () => {
    const doc = docOf(svgOf(FLOW));
    const ids = new Set(["client", "api"]);
    const strange = nodes(doc).map(idOf).filter((id) => !ids.has(id ?? ""));
    expect(strange, "箱でない物の id を data-node に持つ要素が在る").toEqual([]);
    const label = textsOf(doc, "呼ぶ");
    expect(label.length, "線の札 呼ぶ が描いた図に無い").toBeGreaterThan(0);
    for (const t of label) expect(idOf(t.closest("[data-node]")), "線の札 呼ぶ が data-node を持つ要素の中に在る").toBeUndefined();
  });
});

/** 見本帳の見本のうち、記法に `box` を持つ図。種類ごとに分ける */
function galleryBoxes(): Map<string, { file: string; diagram: Json; ids: string[] }[]> {
  const dir = join(PACKAGE, "examples");
  const byKind = new Map<string, { file: string; diagram: Json; ids: string[] }[]>();
  for (const file of readdirSync(dir).filter((f: string) => f.endsWith(".json") && !f.endsWith(".en.json")).sort()) {
    const diagram = JSON.parse(readFileSync(join(dir, file), "utf8")) as Json & { kind: string; blocks?: { box?: { id: string }[] } };
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

describe.each([...GALLERY.keys()])("見本帳の %s の図", (kind) => {
  it("every-gallery-box-carries-its-id", () => {
    const missing: string[] = [];
    for (const { file, diagram, ids } of GALLERY.get(kind) ?? []) {
      const found = new Set(nodes(docOf(draw("renderDiagram")(diagram, { open: OPEN_ALL }).svg)).map(idOf));
      for (const id of ids) if (!found.has(id)) missing.push(`${file} の ${id}`);
    }
    expect(missing, "箱の id を data-node に持つ要素が描いた図に無い").toEqual([]);
  });
});

describe("組み込みの文書", () => {
  it("embed-docs-name-node-attribute", () => {
    const docs = ["plugins/dragon/skills/dragon/references/embed.md", "packages/dragon/README.md", "packages/dragon/README.ja.md"];
    const lacking: string[] = [];
    for (const path of docs) {
      const text = readFileSync(join(ROOT, path), "utf8");
      if (!text.includes("data-node")) lacking.push(`${path} が属性 data-node を書かない`);
      if (!/closest\((["'])\[data-node\]\1\)/u.test(text)) lacking.push(`${path} が closest('[data-node]') で押した箱の id を読む書き方を持たない`);
    }
    expect(lacking).toEqual([]);
  });
});
