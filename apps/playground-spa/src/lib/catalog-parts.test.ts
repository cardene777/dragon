/**
 * カタログの部品の 3 段 (#3166)。
 *
 * カタログは今、見本を図の種類 (時系列図と構成図) だけで束ねている。描く部品 (`packages/dragon/src/render/parts.ts`) は
 * 図の種類の間で共通で、図の種類ごとに違うのは並べ方 (`packages/dragon/src/layout/`) だけなので、カタログを
 * 「どの図でも使える部品」「図の種類だけの部品」「図 (部品を組み合わせた物と見本)」の 3 段に並べ直す。
 *
 * 部品の表は `catalog/parts.ts` の `PARTS` が持ち、1 行が部品の名札と、その部品を描ける図の種類と、
 * その部品が受け持つ記法の語を持つ。図の種類を全部持つ部品が、どの図でも使える部品になる。
 * 語は `kind:<図の種類>`、`head:<行の頭の語>`、`attr:<行>.<鍵>`、線の行の `edge:->` の形で書き、
 * 記法の語の表 (`packages/dragon/src/words.ts`) の語を、どれかの部品が必ず受け持つ。
 * 部品の図は `catalog/parts/<名札>.<図の種類>.dragon` と英語の `.en.dragon` の記法の file で、部品の頁はそれを描く。
 *
 * 頁の部品は `data-catalog` の札で探す。一覧の 3 段は `section` の札と `data-section`、部品の札は `part-card`、
 * 部品の頁は `part` の画面で、図ごとの塊は `part-figure` の札と `data-kind` を持つ。
 * 部品の表と file が無い間も、file を読み込んだ所で落とさず、表が無いと断って落とす。
 * 同じ file の他の検査と、`site.test.ts` の経路と編集画面の検査を巻き込まないため。
 *
 * 部品の頁は、その部品の語を使う見本の札も並べる (#3167)。どの見本が使うかは、見本の記法の file
 * (`packages/dragon/examples/<見本>.dragon`) をこの file の語の数え方 (`usesWord`) で読んで導き、頁の側の判定とは別に数える。
 */
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { parseNotation, validateDiagram } from "@cardenelabs/dragon";
import type { Page } from "playwright";
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";

import * as WORDS from "../../../../packages/dragon/src/words";
import { KINDS, type Kind } from "../catalog/catalog";
import { fromHash, toHash } from "../share";
import { type Lang, TEXT } from "../text";
import { app, BASE, root, screenOf, type Site, startSite, stepLabel } from "./playground-support";

const { ATTRS, HEADS, KINDS: WORD_KINDS } = WORDS;

/** 頁を build して Chromium を起こすまでに許す時間 */
const SETUP = 300_000;
/** 画面を 1 つずつ開いて確かめるのに許す時間 */
const SLOW = 120_000;
/** 部品の頁を全部開くのに許す時間 */
const SWEEP = 300_000;
/** Chromium を閉じて配る場所を止めるまでに許す時間 (`playground.test.ts` と同じ理由) */
const TEARDOWN = 90_000;
/** 頁が書き換わるのを待つ長さ */
const WAIT = { timeout: 8_000, interval: 100 } as const;

const catalogSel = (name: string): string => `[data-catalog="${name}"]`;
const siteSel = (name: string): string => `[data-site="${name}"]`;

/** 部品の表の 1 行。`kinds` が図の種類を全部持つ部品が、どの図でも使える部品 */
interface PartRow {
  readonly id: string;
  readonly kinds: readonly Kind[];
  readonly words: readonly string[];
}

/** 部品の表の置き場。無い間も file を読み込めるよう、名前を値にして読む */
const PARTS_MODULE = "../catalog/parts";

/** 部品の表。表の module が無いか `PARTS` を出さなければ `undefined` */
const loadParts = async (): Promise<readonly PartRow[] | undefined> => {
  try {
    const mod = (await import(/* @vite-ignore */ PARTS_MODULE)) as { PARTS?: readonly PartRow[] };
    return mod.PARTS;
  } catch {
    return undefined;
  }
};

/** 部品の表を読み、無いか空なら落とす */
async function partsTable(): Promise<readonly PartRow[]> {
  const parts = await loadParts();
  expect(parts, "部品の表 (`catalog/parts.ts` の `PARTS`) が無い").toBeDefined();
  expect(parts?.length ?? 0, "部品の表が空").toBeGreaterThan(0);
  return parts ?? [];
}

/** どの図でも使える部品か。図の種類を 2 つ以上持つ。列の図は線を持たないので、線の部品は列の図を除いた図の種類を持つ (#3239) */
const isCommon = (part: PartRow): boolean => part.kinds.length > 1;

/** 部品の図の記法の file の置き場 */
const PARTS_DIR = join(app, "src/catalog/parts");

/** 部品の図の記法の file の名前 */
const snippetName = (id: string, kind: Kind, lang: Lang): string => `${id}.${kind}${lang === "en" ? ".en" : ""}.dragon`;

/** 部品の図の記法。file が無ければ `undefined` */
const snippetOf = (id: string, kind: Kind, lang: Lang): string | undefined => {
  const path = join(PARTS_DIR, snippetName(id, kind, lang));
  return existsSync(path) ? readFileSync(path, "utf8").trimEnd() : undefined;
};

/** 部品の頁の経路 */
const partPath = (id: string): string => `${BASE}catalog/part/${id}`;

/** 部品の頁の、図の種類ごとの塊 */
const figureSel = (kind: Kind): string => `${catalogSel("part-figure")}[data-kind="${kind}"]`;

/** 部品の文 (名前と説明)。`TEXT.<言葉>.site.catalog.parts` が無いか、その部品が無ければ `undefined` */
const partText = (lang: Lang, id: string): { name: string; desc: string } | undefined =>
  ((TEXT[lang].site.catalog as Record<string, unknown>).parts as Record<string, { name: string; desc: string }> | undefined)?.[id];

/** 状態遷移図の線の、始まりと終わりの予約の名前 (#3163)。語の表が持たない間は空 */
const STATE_ENDS: readonly string[] = (WORDS as { STATE_ENDS?: readonly string[] }).STATE_ENDS ?? [];
/** 枝分かれの図の行の中の語 (#3164)。枝を切る `from`、当て直しの `copy`、merge commit の `merge`。語の表が持たない間は空 */
const GIT_WORDS: readonly string[] = (WORDS as { GIT_WORDS?: readonly string[] }).GIT_WORDS ?? [];

/**
 * 記法の語の表 (`words.ts`) の語を、部品が受け持つ語の形にした物。
 * 線の行は頭の語を持たず、表には属性の鍵の行 (`ATTRS.edge`) としてだけ現れるので、行の形 `<名札> -> <名札>` の `->` を語として足す。
 * 状態遷移図の線の形も頭の語を持たないので、始まりと終わりの予約の名前 (`edge:start` `edge:finish`) と、
 * 最初の段より前に書く通らない道 (`edge:before-step`) を語として足す。段より前の線は状態遷移図だけが書ける (#3163)。
 * 枝分かれの図の行の中の語 (`from` と `copy` と `merge`) も頭の語でも属性でもないので、`git:<語>` として足す (#3164)
 */
const NOTATION_WORDS: readonly string[] = [
  ...WORD_KINDS.map((kind) => `kind:${kind}`),
  ...HEADS.map((head) => `head:${head}`),
  ...Object.entries(ATTRS).flatMap(([line, keys]) => keys.map((key) => `attr:${line}.${key}`)),
  "edge:->",
  ...STATE_ENDS.map((name) => `edge:${name}`),
  ...((WORD_KINDS as readonly string[]).includes("state") ? ["edge:before-step"] : []),
  ...GIT_WORDS.map((word) => `git:${word}`),
];

/** 記法の、空でなく注釈でもない行 */
const contentLines = (text: string): string[] => text.split("\n").filter((line) => line.trim() !== "" && !line.trim().startsWith("//"));
/** 行の頭の語 */
const headOf = (line: string): string => line.trim().split(/\s+/u)[0] ?? "";
/** 線の行か */
const isEdge = (line: string): boolean => line.includes(" -> ");
/** 行の種類。最初の行は図 (`diagram`)、`->` を持つ行は線 (`edge`)、それ以外は行の頭の語 */
const lineKind = (line: string, index: number): string => (index === 0 ? "diagram" : isEdge(line) ? "edge" : headOf(line));
/** 行の終わりの `[ ]` の中に書いた属性の鍵 */
const attrKeys = (line: string): string[] =>
  [...(/\[([^\]]*)\]\s*$/u.exec(line)?.[1] ?? "").matchAll(/(?:^|,\s*)([a-z]+):/gu)].map((m) => m[1] ?? "");

/** 記法がその語を使っているか */
const usesWord = (text: string, word: string): boolean => {
  const lines = contentLines(text);
  const [type, rest = ""] = word.split(":") as [string, string?];
  if (type === "kind") return headOf(lines[0] ?? "") === rest;
  if (type === "head") return lines.some((line, i) => i > 0 && !isEdge(line) && headOf(line) === rest);
  if (type === "edge") {
    if (rest === "->") return lines.some(isEdge);
    const firstStep = lines.findIndex((line) => headOf(line) === "step");
    if (rest === "before-step") return lines.some((line, i) => i > 0 && (firstStep < 0 || i < firstStep) && isEdge(line));
    // 始まりは線の送る側、終わりは受ける側にだけ書ける
    return lines.some((line) => isEdge(line) && line.split(" -> ")[rest === "start" ? 0 : 1]?.trim().split(/[\s:[]/u)[0] === rest);
  }
  if (type === "attr") {
    const [line, key] = rest.split(".");
    return lines.some((l, i) => lineKind(l, i) === line && attrKeys(l).includes(key ?? ""));
  }
  // 枝を切る `from` は `<枝> from <commit>` の行の 2 語目に、`copy` と `merge` は commit の行に書く。
  // 説明の文と命令の行と線の名前に書いた同じ語 (`git merge` など) は数えない
  if (type === "git")
    return lines.some((line, i) => {
      const parts = line.trim().split(/\s+/u);
      if (i === 0 || isEdge(line)) return false;
      return rest === "from" ? parts.length === 3 && parts[1] === rest && !["say", "code"].includes(headOf(line)) : headOf(line) === "commit" && parts.includes(rest);
    });
  return false;
};

/** 見本の記法の file の置き場 */
const EXAMPLES_DIR = join(root, "packages/dragon/examples");

/** 見本ごとの名札と記法と図の種類と題。日本語の記法の file (`<見本>.dragon`) から読む */
const examplesOnDisk = (): { name: string; text: string; kind: string; title: string }[] =>
  readdirSync(EXAMPLES_DIR)
    .filter((file) => /^[a-z0-9-]+\.dragon$/u.test(file))
    .map((file) => {
      const text = readFileSync(join(EXAMPLES_DIR, file), "utf8");
      const parsed = parseNotation(text);
      return { name: file.replace(/\.dragon$/u, ""), text, kind: parsed.ok ? parsed.diagram.kind : "", title: parsed.ok ? parsed.diagram.title : "" };
    });

let site: Site;

async function onScreen(page: Page, screen: string, message: string): Promise<void> {
  await expect.poll(() => screenOf(page), { ...WAIT, message }).toBe(screen);
}

/** 書く欄の中身。書く欄が無ければ `null` */
const editorValue = (page: Page): Promise<string | null> =>
  page.evaluate(() => document.querySelector<HTMLTextAreaElement>('[data-playground="editor"]')?.value.trimEnd() ?? null);

/** 見えている字のうち仮名と漢字を、それを含む字の並びごとに最大 5 つ返す (`site.test.ts` の同じ名前の物と同じ数え方) */
const leftover = (page: Page): Promise<string> =>
  page.evaluate(() => {
    const kana = /[\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Han}]/u;
    const found: string[] = [];
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    for (let node = walker.nextNode(); node && found.length < 5; node = walker.nextNode()) {
      const parent = node.parentElement;
      if (!parent || parent.closest("textarea, script, style") || !parent.checkVisibility()) continue;
      const text = node.textContent ?? "";
      if (kana.test(text)) found.push(text.trim());
    }
    return found.join(" | ");
  });

/** 部品の頁の図の塊ごとの、図の種類と、描いた図の数と箱の名前と、記法の本文と、編集画面で開くの行き先 */
const figuresOf = (page: Page): Promise<{ kind: string; svgs: number; names: string[]; source: string; editor: string }[]> =>
  page.evaluate(() =>
    [...document.querySelectorAll<HTMLElement>('[data-catalog="part"] [data-catalog="part-figure"]')].map((block) => {
      const svg = block.querySelector('svg[data-dragon="figure"]');
      const link = block.querySelector<HTMLAnchorElement>('[data-catalog="part-open-editor"]');
      return {
        kind: block.dataset.kind ?? "",
        svgs: block.querySelectorAll('svg[data-dragon="figure"]').length,
        names: svg ? [...new Set([...svg.querySelectorAll(".dg-sn")].map((n) => n.textContent ?? ""))].sort() : [],
        source: block.querySelector('[data-catalog="part-source"]')?.textContent?.trimEnd() ?? "",
        editor: link ? `${new URL(link.href).pathname}${new URL(link.href).hash}` : "",
      };
    }),
  );

/** 記法の箱の名前 */
const namesOf = (text: string): string[] => {
  const parsed = parseNotation(text);
  return parsed.ok ? [...new Set(parsed.diagram.boxes.map((b) => b.name))].sort() : [];
};

/**
 * 自動で送らずに `scope` の中の再生の部品の段を最後まで 1 つずつ送り、段の札が 1 段ずつ進むかを確かめる。
 * 呼ぶ前に動きを嫌う設定 (`reducedMotion: "reduce"`) にしておく
 */
async function expectStepsAdvance(page: Page, scope: string, label: string): Promise<void> {
  const items = page.locator(`${scope} [data-dragon="steps"] > li`);
  await expect.poll(() => items.count(), { ...WAIT, message: `${label} に送れる段 (2 つ以上) が無い` }).toBeGreaterThan(1);
  const count = await items.count();
  const no = (): Promise<string | null> => page.locator(`${scope} [data-dragon="step-no"]`).textContent();
  await expect.poll(no, { ...WAIT, message: `${label} が 1 段目から始まらない` }).toBe(stepLabel(0, count));
  for (let s = 1; s < count; s++) {
    await page.locator(`${scope} [data-dragon="next"]`).click();
    await expect.poll(no, { ...WAIT, message: `${label} の段を送っても ${s + 1} 段目にならない` }).toBe(stepLabel(s, count));
  }
}

describe("部品の表と記法の file (#3166)", () => {
  it("catalog-parts-cover-every-word", async () => {
    const parts = await partsTable();
    expect(NOTATION_WORDS.length, "記法の語の表から語を引けない").toBeGreaterThan(0);
    const owned = new Set(parts.flatMap((part) => part.words));
    const missing = NOTATION_WORDS.filter((word) => !owned.has(word));
    expect(missing, `どの部品も受け持たない記法の語が ${missing.length} 個ある`).toEqual([]);
    // 表に無い語を書いた部品は、綴りを誤ったまま語を受け持ったつもりになる
    const unknown = [...owned].filter((word) => !NOTATION_WORDS.includes(word));
    expect(unknown, "記法の語の表に無い語を受け持つ部品がある").toEqual([]);
  });

  it("catalog-part-snippets-use-their-words", async () => {
    const parts = await partsTable();
    const want = parts.flatMap((part) => part.kinds.flatMap((kind) => (["ja", "en"] as const).map((lang) => ({ part, kind, lang, name: snippetName(part.id, kind, lang) }))));
    const present = existsSync(PARTS_DIR) ? readdirSync(PARTS_DIR).filter((name) => name.endsWith(".dragon")) : [];
    expect(
      want.map((w) => w.name).filter((name) => !present.includes(name)),
      "部品の表の部品と図の種類と言葉に当たる記法の file が無い",
    ).toEqual([]);
    expect(
      present.filter((name) => !want.some((w) => w.name === name)),
      "部品の表に無い部品か、その部品が描けない図の種類の記法の file がある",
    ).toEqual([]);

    const errors: string[] = [];
    for (const { part, kind, lang, name } of want) {
      const text = snippetOf(part.id, kind, lang) ?? "";
      const parsed = parseNotation(text);
      if (!parsed.ok) {
        errors.push(`${name} が記法として読めない: ${parsed.errors.map((e) => `${e.line} 行目 ${e.message}`).join(" / ")}`);
        continue;
      }
      const checked = validateDiagram(parsed.diagram);
      if (!checked.ok) errors.push(`${name} が JSON Schema の検査で落ちる: ${checked.errors.map((e) => `${e.pointer} ${e.message}`).join(" / ")}`);
      if (parsed.diagram.kind !== kind) errors.push(`${name} の図の種類が ${parsed.diagram.kind} で、file の名前の ${kind} と違う`);
      const unused = part.words.filter((word) => !usesWord(text, word));
      if (unused.length > 0) errors.push(`${name} が部品の受け持つ語 ${unused.join("、")} を使わない`);
    }
    expect(errors, "部品の図の記法に、読めないか部品の語を使わない物がある").toEqual([]);
  });
});

describe("カタログの部品の頁 (#3166)", () => {
  beforeAll(async () => {
    site = await startSite();
  }, SETUP);

  afterEach(async () => {
    await site?.closeContexts();
  });

  afterAll(async () => {
    await site?.close();
  }, TEARDOWN);

  it(
    "catalog-index-three-sections",
    async () => {
      const { page } = await site.open({ path: `${BASE}catalog`, viewport: { width: 1440, height: 900 } });
      await onScreen(page, "catalog", "カタログの一覧が出ない");
      const sections = (): Promise<{ section: string; parts: string[]; hrefs: string[]; names: string[]; kinds: number }[]> =>
        page.evaluate(() =>
          [...document.querySelectorAll<HTMLElement>('[data-catalog="section"]')].map((s) => {
            const cards = [...s.querySelectorAll<HTMLAnchorElement>('a[data-catalog="part-card"]')];
            return {
              section: s.dataset.section ?? "",
              parts: cards.map((c) => c.dataset.part ?? ""),
              hrefs: cards.map((c) => new URL(c.href).pathname),
              names: cards.map((c) => c.textContent ?? ""),
              kinds: s.querySelectorAll('[data-catalog="card"]').length,
            };
          }),
        );
      // どの図でも使える部品、図の種類だけの部品、図の 3 段をこの順に並べ、どの段にも札が 1 枚以上ある
      await expect
        .poll(async () => (await sections()).map((s) => s.section), { ...WAIT, message: "カタログの一覧に部品、図の種類だけの部品、図の 3 段が並ばない" })
        .toEqual(["parts", "kind-parts", "kinds"]);
      const [common, kindOnly, kinds] = await sections();
      expect(common?.parts.length ?? 0, "どの図でも使える部品の段に札が無い").toBeGreaterThan(0);
      expect(kindOnly?.parts.length ?? 0, "図の種類だけの部品の段に札が無い").toBeGreaterThan(0);
      expect(kinds?.kinds ?? 0, "図の段に分類の札が図の種類の数だけ並ばない").toBe(KINDS.length);

      // 段の札は部品の表から並べる。札は部品の名前を出し、部品の頁へ向かう
      const parts = await partsTable();
      expect(common?.parts, "どの図でも使える部品の段の札が、部品の表の並びと違う").toEqual(parts.filter(isCommon).map((p) => p.id));
      expect(kindOnly?.parts, "図の種類だけの部品の段の札が、部品の表の並びと違う").toEqual(parts.filter((p) => !isCommon(p)).map((p) => p.id));
      for (const s of [common, kindOnly]) {
        expect(s?.hrefs, `${s?.section} の段の札が部品の頁へ向かない`).toEqual(s?.parts.map(partPath));
        for (const [i, id] of (s?.parts ?? []).entries()) {
          expect(s?.names[i], `${id} の札に部品の名前が出ない`).toContain(partText("ja", id)?.name ?? `(${id} の名前が TEXT.ja に無い)`);
        }
      }

      // 部品の札を押すと、その部品の頁へ移る
      await page.locator(`${catalogSel("section")}[data-section="parts"] ${catalogSel("part-card")}`).first().click();
      await onScreen(page, "part", "部品の札を押しても部品の頁が出ない");
      expect(await page.evaluate(() => location.pathname), "最初の部品の札が最初の部品の頁へ向かない").toBe(partPath(common?.parts[0] ?? ""));
    },
    SLOW,
  );

  it(
    "catalog-common-part-shows-both-kinds",
    async () => {
      const common = (await partsTable()).filter(isCommon);
      expect(common.length, "部品の表にどの図でも使える部品が無い").toBeGreaterThan(0);
      for (const part of common) {
        const { page } = await site.open({ path: partPath(part.id), viewport: { width: 1440, height: 900 }, reducedMotion: "reduce" });
        await onScreen(page, "part", `${partPath(part.id)} で部品の頁が出ない`);
        // 同じ部品を、図の種類ごとに 1 つずつ描いて並べる
        await expect
          .poll(async () => (await figuresOf(page)).map((f) => f.kind), { ...WAIT, message: `${part.id} の頁に、部品を使える図の種類ごとの図が並ばない` })
          .toEqual([...part.kinds]);
        await expect
          .poll(async () => (await figuresOf(page)).map((f) => ({ kind: f.kind, svgs: f.svgs, names: f.names, source: f.source })), {
            ...WAIT,
            message: `${part.id} の頁の図が、部品の記法の file の図と記法で描かれない`,
          })
          .toEqual(
            part.kinds.map((kind) => {
              const text = snippetOf(part.id, kind, "ja") ?? "";
              return { kind, svgs: 1, names: namesOf(text), source: text };
            }),
          );
        for (const kind of part.kinds) await expectStepsAdvance(page, `${catalogSel("part")} ${figureSel(kind)}`, `${part.id} の ${kind} の図`);
        await site.closeContexts();
      }
    },
    SWEEP,
  );

  it(
    "catalog-kind-part-names-its-kind",
    async () => {
      const kindOnly = (await partsTable()).filter((part) => !isCommon(part));
      expect(kindOnly.length, "部品の表に図の種類だけの部品が無い").toBeGreaterThan(0);
      for (const part of kindOnly) {
        expect(part.kinds.length, `${part.id} は図の種類だけの部品なのに図の種類を 1 つに絞らない`).toBe(1);
        const kind = part.kinds[0] as Kind;
        const { page } = await site.open({ path: partPath(part.id), viewport: { width: 1440, height: 900 } });
        await onScreen(page, "part", `${partPath(part.id)} で部品の頁が出ない`);
        // その図の種類の図を 1 つだけ描く
        await expect
          .poll(async () => (await figuresOf(page)).map((f) => ({ kind: f.kind, svgs: f.svgs, source: f.source })), {
            ...WAIT,
            message: `${part.id} の頁が ${kind} の図を 1 つだけ描かない`,
          })
          .toEqual([{ kind, svgs: 1, source: snippetOf(part.id, kind, "ja") ?? "" }]);
        // どの図の種類の部品かを名指し、その図の頁へ向かう
        const kindLinks = (): Promise<string[]> =>
          page.evaluate(() => [...document.querySelectorAll<HTMLAnchorElement>('[data-catalog="part-kinds"] a')].map((a) => new URL(a.href).pathname));
        expect(await kindLinks(), `${part.id} の頁が ${kind} の図の頁を名指さない`).toEqual([`${BASE}catalog/${kind}`]);
        await page.locator(`${catalogSel("part-kinds")} a`).first().click();
        await onScreen(page, "category", `${part.id} の頁から ${kind} の図の頁へ移れない`);
        expect(await page.evaluate(() => location.pathname)).toBe(`${BASE}catalog/${kind}`);
      }
    },
    SLOW,
  );

  it(
    "catalog-kind-page-links-parts",
    async () => {
      const usedOf = (page: Page): Promise<string[]> =>
        page.evaluate(() => [...document.querySelectorAll<HTMLAnchorElement>('[data-catalog="uses"] a[data-catalog="uses-part"]')].map((a) => new URL(a.href).pathname));
      for (const kind of KINDS) {
        const { page } = await site.open({ path: `${BASE}catalog/${kind}`, viewport: { width: 1440, height: 900 } });
        await onScreen(page, "category", `${kind} の図の頁が出ない`);
        await expect.poll(async () => (await usedOf(page)).length, { ...WAIT, message: `${kind} の図の頁に、使う部品の link が無い` }).toBeGreaterThan(0);
        // どの図でも使える部品と、その図の種類だけの部品を全部並べ、他の図の種類だけの部品は並べない
        const parts = await partsTable();
        const want = parts.filter((part) => part.kinds.includes(kind)).map((part) => partPath(part.id));
        expect([...(await usedOf(page))].sort(), `${kind} の図の頁の使う部品が、部品の表でその図の種類を持つ部品と違う`).toEqual([...want].sort());
        // 使う部品の link を押すと、その部品の頁へ移る
        const first = (await usedOf(page))[0] ?? "";
        await page.locator(`${catalogSel("uses")} ${catalogSel("uses-part")}`).first().click();
        await onScreen(page, "part", `${kind} の図の頁の使う部品を押しても部品の頁が出ない`);
        expect(await page.evaluate(() => location.pathname), `${kind} の図の頁の使う部品が、その部品の頁へ向かない`).toBe(first);
      }
    },
    SLOW,
  );

  it(
    "catalog-part-opens-in-editor",
    async () => {
      // 頁を開き直して押す回数が多いほど、PC が一時的に止まった回に押す操作が時間切れに当たる (#3208)。
      // 部品の頁は部品ごとに 1 回だけ開き、押して確かめるのは図の種類ごとに 1 つの図にする
      const parts = await partsTable();
      const kinds = [...new Set(parts.flatMap((part) => part.kinds))];
      let opened = 0;
      let clicked = 0;
      const pressed = new Set<Kind>();
      const { page } = await site.open({ path: `${BASE}catalog`, viewport: { width: 1440, height: 900 } });
      for (const part of parts) {
        await page.goto(`${site.origin}${partPath(part.id)}`);
        opened++;
        await onScreen(page, "part", `${partPath(part.id)} で部品の頁が出ない`);
        // 頁の全ての図の「編集画面で開く」は、行き先を編集画面と同じ読み方で戻すとその図の記法になる
        for (const kind of part.kinds) {
          const text = snippetOf(part.id, kind, "ja");
          expect(text, `${snippetName(part.id, kind, "ja")} が無い`).toBeDefined();
          const href = await page.locator(`${figureSel(kind)} ${catalogSel("part-open-editor")}`).getAttribute("href");
          const to = new URL(href ?? "", site.origin);
          expect(to.pathname, `${part.id} の ${kind} の図の編集画面で開くが編集画面へ向かない`).toBe(`${BASE}editor`);
          expect(fromHash(to.hash), `${part.id} の ${kind} の図の編集画面で開くの行き先に、その図の記法が載らない`).toBe(text);
        }
        // 押した後の処理はどの図も同じなので、押すのはまだ押していない図の種類の図を 1 つだけにする
        const kind = part.kinds.find((k) => !pressed.has(k));
        if (kind === undefined) continue;
        pressed.add(kind);
        const text = snippetOf(part.id, kind, "ja");
        // 頁を読み直すと消える印を置き、編集画面へ移った後も残っているかで読み直していないことを見る
        await page.evaluate(() => {
          (window as unknown as { __stay: number }).__stay = 1;
        });
        await page.locator(`${figureSel(kind)} ${catalogSel("part-open-editor")}`).click();
        clicked++;
        await onScreen(page, "editor", `${part.id} の ${kind} の図の編集画面で開くで編集画面が出ない`);
        await expect.poll(() => editorValue(page), { ...WAIT, message: `${part.id} の ${kind} の図を編集画面で開いても、その記法が書く欄に入らない` }).toBe(text);
        expect(await page.evaluate(() => location.hash), `${part.id} の ${kind} の図の編集画面のアドレスに記法が載らない`).toBe(toHash(text ?? ""));
        expect(await page.evaluate(() => (window as unknown as { __stay?: number }).__stay), "編集画面で開く時に頁を読み直した").toBe(1);
      }
      expect(opened, "部品の頁を開いた回数が部品の数と違う").toBe(parts.length);
      expect(clicked, "編集画面で開くを押した回数が図の種類の数と違う").toBe(kinds.length);
    },
    SWEEP,
  );

  it(
    "catalog-parts-in-english",
    async () => {
      const parts = await partsTable();
      for (const part of parts) {
        const { page } = await site.open({ path: partPath(part.id), locale: "ja-JP", viewport: { width: 1440, height: 900 } });
        await onScreen(page, "part", `${partPath(part.id)} で部品の頁が出ない`);
        const shown = (): Promise<{ name: string; desc: string; sources: string[] }> =>
          page.evaluate(() => {
            const root = document.querySelector('[data-catalog="part"]');
            return {
              name: root?.querySelector("h1")?.textContent?.trim() ?? "",
              desc: root?.querySelector('[data-catalog="desc"]')?.textContent?.trim() ?? "",
              sources: [...(root?.querySelectorAll('[data-catalog="part-source"]') ?? [])].map((s) => s.textContent?.trimEnd() ?? ""),
            };
          });
        const expected = (lang: Lang): { name: string; desc: string; sources: string[] } => ({
          name: partText(lang, part.id)?.name ?? `(${part.id} の名前が TEXT.${lang} に無い)`,
          desc: partText(lang, part.id)?.desc ?? `(${part.id} の説明が TEXT.${lang} に無い)`,
          sources: part.kinds.map((kind) => snippetOf(part.id, kind, lang) ?? `(${snippetName(part.id, kind, lang)} が無い)`),
        });
        await expect.poll(shown, { ...WAIT, message: `${part.id} の頁が日本語の名前と説明と記法を出さない` }).toEqual(expected("ja"));

        await page.locator(siteSel("lang-en")).click();
        await expect.poll(() => page.evaluate(() => document.documentElement.lang), { ...WAIT, message: `${part.id} の頁で言語が EN にならない` }).toBe("en");
        await expect.poll(shown, { ...WAIT, message: `${part.id} の頁を EN に替えても、英語の名前と説明と記法にならない` }).toEqual(expected("en"));
        await expect.poll(() => leftover(page), { ...WAIT, message: `${part.id} の頁を EN に替えても仮名か漢字が残る` }).toBe("");
        await site.closeContexts();
      }
    },
    SWEEP,
  );

  it(
    "part-page-links-examples",
    async () => {
      const parts = await partsTable();
      const examples = examplesOnDisk();
      expect(examples.length, "見本の記法の file が無い").toBeGreaterThan(0);
      const samplesOf = (page: Page): Promise<string[]> =>
        page.evaluate(() =>
          [...document.querySelectorAll<HTMLAnchorElement>('[data-catalog="part"] [data-catalog="part-samples"] a[data-catalog="part-sample"]')].map(
            (a) => `${new URL(a.href).pathname}${new URL(a.href).hash}`,
          ),
        );
      // その部品を描ける図の種類の見本のうち、部品の語を 1 つでも使う見本の札を並べ、図の頁のその見本へ向ける
      for (const part of parts) {
        const want = examples
          .filter((e) => (part.kinds as readonly string[]).includes(e.kind) && part.words.some((word) => usesWord(e.text, word)))
          .map((e) => `${BASE}catalog/${e.kind}#${e.name}`)
          .sort();
        const { page } = await site.open({ path: partPath(part.id), viewport: { width: 1440, height: 900 } });
        await onScreen(page, "part", `${partPath(part.id)} で部品の頁が出ない`);
        await expect
          .poll(async () => [...(await samplesOf(page))].sort(), { ...WAIT, message: `${part.id} の頁の見本の札が、その部品の語を使う見本と違う` })
          .toEqual(want);
        await site.closeContexts();
      }

      // 札を押すと図の頁へ移り、その見本が右に出る。運ぶ物の頁の支払いの見本で確かめる
      const payment = examples.find((e) => e.name === "payment");
      expect(payment, "支払いの見本 (payment.dragon) が無い").toBeDefined();
      const { page } = await site.open({ path: partPath("carry"), viewport: { width: 1440, height: 900 } });
      await onScreen(page, "part", "運ぶ物の部品の頁が出ない");
      await page.locator(`${catalogSel("part-sample")}[data-sample="payment"]`).click();
      await onScreen(page, "category", "運ぶ物の頁の支払いの札を押しても図の頁が出ない");
      expect(await page.evaluate(() => `${location.pathname}${location.hash}`), "支払いの札が時系列図の頁の支払いへ向かない").toBe(`${BASE}catalog/sequence#payment`);
      await expect
        .poll(() => page.evaluate(() => document.querySelector('[data-catalog="preview"] h2')?.textContent?.trim() ?? ""), {
          ...WAIT,
          message: "支払いの札で移った図の頁の右に、支払いの見本が出ない",
        })
        .toBe(payment?.title);
    },
    SWEEP,
  );

  it("catalog-part-routes-built", async () => {
    // Pages は無い path に 404 で答えるので、部品の頁の経路にも頁の写しを `.html` で置いて 200 で答えさせる (#3157)
    const parts = await partsTable();
    const dir = site.built.dir;
    const index = readFileSync(join(dir, "index.html"), "utf8");
    const copies = parts.map((part) => `catalog/part/${part.id}.html`);
    expect(copies.filter((copy) => !existsSync(join(dir, copy))), "build した頁に部品の頁の経路の写しが無い").toEqual([]);
    for (const copy of copies) expect(readFileSync(join(dir, copy), "utf8") === index, `${copy} が index.html の写しでない`).toBe(true);
    const statuses = await Promise.all(parts.map(async (part) => [part.id, (await fetch(`${site.origin}${partPath(part.id)}`)).status] as const));
    expect(Object.fromEntries(statuses), "部品の頁の経路が 200 で答えない").toEqual(Object.fromEntries(parts.map((part) => [part.id, 200])));
  });
});
