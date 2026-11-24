/**
 * 公開する頁で選べる見本 3 つと、その英語版 (#2995)。
 *
 * 英語版は頁の言葉を EN にした時に出す。記法の語 (`時系列図` や `帯`) は日本語のまま、名前と本文だけを英語にする。
 * 訳す時に箱や線や段を落とすと、言葉を替えただけで図の形が変わるため、数を突き合わせる。
 *
 * 線の札の字を地の文とコードで分ける決まり (#3850) もここで確かめる。全ての種類を読むこの file は
 * どの種類を変えても選ばれるので、件を足しても種類ごとに選ぶ検査の数の上限 (`related-by-kind.test.ts`) を動かさない。
 */
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { JSDOM } from "jsdom";
import { describe, expect, it } from "vitest";
import { textWidth } from "../src/layout/measure";
import { LOOK, TYPE } from "../src/look/values";
import type { Diagram } from "../src/schema";
import { changelogEntry } from "./changelog-support";
import { api, exampleJson, exampleText, type Json } from "./diagram-support";
import { draw, type Rendered } from "./render-support";
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

describe("線の札の字を地の文とコードで分ける (#3850)", () => {
  const ROOT = process.cwd();
  /** 記法を読んで描く。読めない時は誤りを名指して落とす */
  const render = (text: string, lang: "ja" | "en" = "en"): Rendered => {
    const parsed = api("parseNotation")(text, { lang });
    if (!parsed.ok) throw new Error(`記法を読めない: ${JSON.stringify(parsed.errors)}`);
    return draw("renderDiagram")(parsed.diagram);
  };
  /** 描いた札の字と、地の文の字 (`TYPE.labelJa`) で描いたか。段の間だけ出す札と、済んだ段に残す薄い札の両方を読む */
  const labelFonts = (svg: string): { text: string; sans: boolean }[] =>
    [...svg.matchAll(/<g class="(dg-cap[^"]*)"[^>]*>(?:<rect[^>]*\/>)?<text[^>]*>([^<]*)<\/text>/gu)].map((m) => ({
      text: (m[2] ?? "").replace(/&amp;/gu, "&").replace(/&lt;/gu, "<").replace(/&gt;/gu, ">"),
      sans: /\bdg-cap(?:-past)?j\b/u.test(m[1] ?? ""),
    }));
  /** 流れ図と状態遷移図の、今回通らない道の札 */
  const sidePathFonts = (svg: string): { text: string; sans: boolean }[] =>
    [...svg.matchAll(/<text class="(dg-path-t[^"]*)"[^>]*>([^<]*)<\/text>/gu)].map((m) => ({ text: m[2] ?? "", sans: /\bdg-path-tj\b/u.test(m[1] ?? "") }));
  /** 札を 1 つずつ別の線に書いた時系列図 */
  const sequenceOf = (labels: string[]): string =>
    ["sequence Labels", "box a as A", "box b as B", "step Go", ...labels.map((label, i) => (i % 2 === 0 ? `  a -> b: ${label}` : `  b -> a: ${label}`))].join("\n");
  /** 札ごとに地の文の字で描いたか。同じ札を 2 つ描いた時 (段の札と済んだ段の札) は、どれか 1 つでも違えば違うと数える */
  const fontOf = (fonts: { text: string; sans: boolean }[], text: string): "sans" | "mono" | "missing" | "mixed" => {
    const found = fonts.filter((f) => f.text === text);
    if (found.length === 0) return "missing";
    if (found.every((f) => f.sans)) return "sans";
    return found.every((f) => !f.sans) ? "mono" : "mixed";
  };

  it("prose-label-drawn-in-sans", () => {
    const prose = ["Approve", "Re-run every transaction in the EVM", "Check out"];
    const fonts = labelFonts(render(sequenceOf(prose)).svg);
    expect(Object.fromEntries(prose.map((text) => [text, fontOf(fonts, text)])), "英語の地の文の札を描いた字").toEqual(Object.fromEntries(prose.map((text) => [text, "sans"])));
  });

  it("code-label-stays-mono", () => {
    const code = ["transfer(Bob, 100)", "eth_sendRawTransaction", "GET /me", "0x3f9a…c21e", "CCIPMessageSent"];
    const fonts = labelFonts(render(sequenceOf(code)).svg);
    expect(Object.fromEntries(code.map((text) => [text, fontOf(fonts, text)])), "コードの印を持つ札を描いた字").toEqual(Object.fromEntries(code.map((text) => [text, "mono"])));
  });

  it("number-label-stays-mono", () => {
    const numbers = ["200 OK", "15%"];
    const fonts = labelFonts(render(sequenceOf(numbers)).svg);
    expect(Object.fromEntries(numbers.map((text) => [text, fontOf(fonts, text)])), "数で始まる札を描いた字").toEqual(Object.fromEntries(numbers.map((text) => [text, "mono"])));
  });

  it("backticked-label-drawn-mono-without-backticks", () => {
    const fonts = labelFonts(render(sequenceOf(["`git rebase main`", "`Approve`"])).svg);
    expect(
      { rebase: fontOf(fonts, "git rebase main"), approve: fontOf(fonts, "Approve"), backticks: fonts.filter((f) => f.text.includes("`")).map((f) => f.text) },
      "backtick で囲んだ札は囲みを外して等幅で描く",
    ).toEqual({ rebase: "mono", approve: "mono", backticks: [] });
  });

  it("japanese-label-stays-sans", () => {
    const japanese = ["注文を確定", "transfer を呼ぶ"];
    const fonts = labelFonts(render(sequenceOf(japanese), "ja").svg);
    expect(Object.fromEntries(japanese.map((text) => [text, fontOf(fonts, text)])), "日本語を含む札を描いた字").toEqual(Object.fromEntries(japanese.map((text) => [text, "sans"])));
  });

  it("label-width-measured-in-chosen-font", () => {
    const { layout } = render(sequenceOf(["Re-run every transaction in the EVM", "`git rebase main`", "eth_sendRawTransaction"]));
    const width = (text: string): number | undefined => layout.labels.find((l) => l.text === text)?.w;
    const pad = LOOK.label.padX * 2;
    const near = (value: number | undefined): number | undefined => (value === undefined ? undefined : Math.round(value * 10) / 10);
    expect(
      {
        prose: near(width("Re-run every transaction in the EVM")),
        backticked: near(width("git rebase main")),
        code: near(width("eth_sendRawTransaction")),
      },
      "札の幅は、描く字の幅と左右の余白の和",
    ).toEqual({
      prose: near(textWidth("Re-run every transaction in the EVM", TYPE.labelJa) + pad),
      backticked: near(textWidth("git rebase main", TYPE.label) + pad),
      code: near(textWidth("eth_sendRawTransaction", TYPE.label) + pad),
    });
  });

  it("label-font-rule-in-every-kind", () => {
    // 種類ごとに、地の文の札 `Check out` とコードの札 `ccipSend()` を描く。流れ図と状態遷移図は、今回通らない道の札も描く
    const figures: Record<string, string[]> = {
      sequence: ["sequence Labels", "box a as A", "box b as B", "step Go", "  a -> b: Check out", "  b -> a: ccipSend()"],
      architecture: ["architecture Labels", "box a as A", "box b as B", "box c as C", "step Go", "  a -> b: Check out", "  b -> c: ccipSend()"],
      flow: ["flow Labels", "box a as A", "box b as B", "box c as C", "box d as D", "a -> d: Give up", "c -> d: retry()", "step Go", "  say Go.", "  start -> a", "  a -> b: Check out", "  b -> c: ccipSend()"],
      state: ["state Labels", "box a as A", "box b as B", "box c as C", "box x as X", "a -> x: Give up", "b -> x: cancel()", "step One", "  start -> a: Check out", "step Two", "  a -> b: ccipSend()", "step Three", "  b -> c"],
      tree: ["tree Labels", "step Leaves", "  say Leaves.", "  leaf l1 [hash: 3fa0]", "  leaf l2 [hash: 8b04]", "step Join", "  say Join.", "  node top of l1, l2 [hash: 7a21]", "  l1 -> top: Check out", "  l2 -> top: ccipSend()"],
      git: ["git Labels", "branch main", "branch feature", "step One", "  say One.", "  commit A on main", "  commit B on main", "step Two", "  say Two.", "  feature from B", "  commit C on feature", "step Three", "  say Three.", "  HEAD -> C: Check out", "step Four", "  say Four.", "  main -> C: ccipSend()"],
    };
    const drawn = Object.fromEntries(
      Object.entries(figures).map(([kind, lines]) => {
        const { svg } = render(lines.join("\n"));
        const fonts = labelFonts(svg);
        const side = sidePathFonts(svg);
        const row: Record<string, string> = { prose: fontOf(fonts, "Check out"), code: fontOf(fonts, "ccipSend()") };
        if (kind === "flow" || kind === "state") {
          row.sideProse = fontOf(side, "Give up");
          row.sideCode = fontOf(side, kind === "flow" ? "retry()" : "cancel()");
        }
        return [kind, row];
      }),
    );
    const wanted = Object.fromEntries(
      Object.keys(figures).map((kind) => [kind, kind === "flow" || kind === "state" ? { prose: "sans", code: "mono", sideProse: "sans", sideCode: "mono" } : { prose: "sans", code: "mono" }]),
    );
    expect(drawn, "種類ごとに描いた札の字").toEqual(wanted);
  });

  it("strip-values-stay-mono", () => {
    const { svg } = render(exampleText("order.en.dragon"));
    const values = [...svg.matchAll(/<text class="(dg-fvj?)\b[^"]*"[^>]*>([^<]*)<\/text>/gu)];
    const fontOfValue = (text: string): string[] => [...new Set(values.filter((m) => m[2] === text).map((m) => m[1] ?? ""))];
    expect({ refunded: fontOfValue("refunded"), shelf: fontOfValue("back on shelf") }, "strip の英語の普通の文の値を描いた字").toEqual({ refunded: ["dg-fv"], shelf: ["dg-fv"] });
  });

  it("examples-git-commands-stay-mono", () => {
    const wanted: [string, string][] = [
      ["rebase.dragon", "git rebase main"],
      ["rebase.en.dragon", "git rebase main"],
      ["rebase.json", "git rebase main"],
      ["rebase.en.json", "git rebase main"],
      ["squash.dragon", "git switch main"],
      ["squash.en.dragon", "git switch main"],
    ];
    const found = wanted.map(([file, command]) => {
      const lang = file.includes(".en.") ? "en" : "ja";
      let source: unknown;
      if (file.endsWith(".json")) source = exampleJson(file);
      else {
        const parsed = api("parseNotation")(exampleText(file), { lang });
        if (!parsed.ok) throw new Error(`${file} を読めない`);
        source = parsed.diagram;
      }
      const written = JSON.stringify(source).includes(JSON.stringify(`\`${command}\``));
      const fonts = labelFonts(draw("renderDiagram")(source).svg);
      return { file, written, font: fontOf(fonts, command) };
    });
    expect(found, "見本の git の命令の札は backtick で囲み、等幅で描く").toEqual(wanted.map(([file]) => ({ file, written: true, font: "mono" })));
  });

  it("docs-explain-label-font", () => {
    // 札の字の決まりを書いた行は、backtick と札の両方の語を持つ
    const docs: [string, RegExp][] = [
      ["plugins/dragon/skills/dragon/references/notation.md", /backtick.*label|label.*backtick/iu],
      ["packages/dragon/README.md", /backtick.*label|label.*backtick/iu],
      ["packages/dragon/README.ja.md", /backtick.*(?:札|線の名前)|(?:札|線の名前).*backtick/iu],
      ["docs/design/base/GRAMMAR.md", /backtick.*等幅|等幅.*backtick/iu],
    ];
    const missing = docs.filter(([path, line]) => !readFileSync(join(ROOT, path), "utf8").split("\n").some((text) => line.test(text))).map(([path]) => path);
    expect(missing, "札の字の決まりと backtick を書いていない記法の説明").toEqual([]);
  });

  it("changelog-lists-label-font", () => {
    for (const file of ["CHANGELOG.md", "CHANGELOG.ja.md"]) expect(changelogEntry(join(ROOT, file), 3850), `${file} に線の札の字の項 (#3850) が無い`).not.toBe("");
  });
});

describe("見本帳の最初に読む量と使い方の頁の組み込みの節の直し (#3868)", () => {
  // 検査は repo の上から回すので、repo の上を作業の場所から取る
  const ROOT = process.cwd();
  // 最初に読む script から部品の使い方の表を外した直しと、使い方の頁の組み込みの節に5つ目のコードを足した直しの2つの項
  it("changelog-lists-first-load-part-uses", () => {
    for (const file of ["CHANGELOG.md", "CHANGELOG.ja.md"]) {
      const items = changelogEntry(join(ROOT, file), 3868)
        .split("\n")
        .filter((line) => line.startsWith("- ") && line.includes("(#3868)"));
      expect(items.length, `${file} の #3868 の項の数 (最初に読む量と組み込みの節の2つ)`).toBe(2);
    }
  });
});

/**
 * 描いた箱と囲みが記法の id を `data-node` に持ち、頁の script が押した箱の id を読める (#3795)。
 *
 * 図を埋めた頁 (説明の資料など) は、箱を押した時にその箱の説明を出したい。
 * 箱の名前の字で探すと、同じ名前の箱が 2 つ在る図で別の箱を引くので、記法の `box <id>` と `group <id>` の id で引く。
 * dragon は関数も出来事も足さず、描いた要素に属性 `data-node` を付けるだけにし、頁は自分の押した時の処理で
 * `closest('[data-node]')` を読む。帯と経路の部品が既に同じ属性で箱の id を持つので、名前を揃える。
 * 線と札は `data-node` を持たない。押した所の外側を辿った時に、線の札から箱を引かないため。
 *
 * 見本帳の全ての種類の図を描くので、別の file に置くと図の種類の描く所を変えた時に選ぶ検査の数の上限
 * (`related-by-kind.test.ts`) を超える。全ての種類を読み、どの種類を変えても選ばれるこの file に置く (#3868)。
 * この file は node の環境で回るので、SVG を読む所と押す所は `jsdom` で作った窓を使う。
 * file の環境を jsdom に替えると、ほかの件の字の幅の見積もりが変わるため替えない。
 * `dragon embed` で書き出した 1 枚の HTML の件は、全ての種類を読む埋める処理を使うので `script-entry.test.ts` に置く。
 */
describe("描いた箱と囲みの id (#3795)", () => {
  const { window } = new JSDOM("");

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
    return new window.DOMParser().parseFromString(svg, "image/svg+xml");
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
      window.document.body.innerHTML = svgOf(GROUPED);
      let got: string | undefined;
      const read = (event: Event): void => {
        got = idOf((event.target as Element).closest("[data-node]"));
      };
      window.document.body.addEventListener("click", read);
      try {
        const press = (text: string): string | undefined => {
          got = undefined;
          const target = textsOf(window.document.body, text)[0];
          expect(target, `押す字 ${text} が描いた図に無い`).toBeDefined();
          target?.dispatchEvent(new window.MouseEvent("click", { bubbles: true }));
          return got;
        };
        expect(press("アプリ"), "囲みの中の箱 アプリ を押した時に箱の id を読めない").toBe("app");
        expect(press("送る側"), "囲みの名前 送る側 を押した時に囲みの id を読めない").toBe("src");
        expect(press("記録"), "囲みの外の箱 記録 を押した時に箱の id を読めない").toBe("db");
      } finally {
        window.document.body.removeEventListener("click", read);
        window.document.body.innerHTML = "";
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
});
