/**
 * サイトの帯と経路と頁 (#3030)。
 *
 * 頁は build して GitHub Pages と同じ形で配り、画面なしの Chromium で開く (`playground-support.ts`)。
 * 2 つ以上の file が使う道具は `site-support.ts` に在る (#3381)
 */
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { DEFAULT_PALETTE, type Diagram, PALETTES, parseNotation, readDiagram, renderDiagram } from "@cardenelabs/dragon";
import type { Page } from "playwright";
import { EXAMPLE_KEYS, type ExampleKey, HOME_USES, TEMPLATE } from "../examples";
import { toHash } from "../share";
import { type Lang, TEXT } from "../text";
import { app, BASE, rgb, root } from "./playground-support";
import { afterAll, describe, expect, it, type TestContext } from "vitest";
import { countOpens, expectOneOpenPerSetting, pageGroups, site, useSite, exampleText, WAIT, siteSel, SCREENS, REPO, DESTINATIONS, PALETTE_IDS, type Scheme, figureLook, figureLooks, sampleOf, catalogSel, KINDS, samplesOf, type Category, categoryOf, onScreen, navOf } from "./site-support";

/** 色味ごとにサイトの差し色にする字の色の欄 (#3033)。紙と墨は朱、澄んだ色と夜の計器と紺と生成りは青 (#3398)、アーケードの画面は緑 (#3341) */
const ACCENT: Record<string, string> = { paper: "t-rose", clear: "t-blue", night: "t-blue", arcade: "t-green", sea: "t-blue" };

/** 色味と明暗のサイトの地、帯の面、字、釦の差し色。図の色味の表 (`PALETTES`) から引く */
const siteLook = (id: string, scheme: Scheme): { bg: string; surface: string; text: string; accent: string } => {
  const v: Record<string, string> = PALETTES[id]?.[scheme] ?? {};
  return { bg: v.page ?? "", surface: v.surf ?? "", text: v.ink ?? "", accent: v[ACCENT[id] ?? ""] ?? "" };
};

/**
 * 見えている字のうち仮名と漢字を、それを含む字の並びごとに最大 5 つ返す。
 *
 * 書く欄の中身は書き手の記法なので数えない。読み上げの名前 (`aria-label`) は字として見えないので数えない。
 */
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

/** 書く欄を確かめる記法 (`playground.test.ts` の `EDITED` と同じ形) */
const EDITED = ["sequence 書き換えた図", "", "box 甲 as 甲のサービス", "box 乙 as 乙のサービス", "", "step 呼ぶ", "  say 甲が乙を呼ぶ。", "  甲 -> 乙: 呼ぶ"].join("\n");

/** 概要の頁の部品 (#3032) */
const homeSel = (name: string): string => `[data-home="${name}"]`;

/** 概要の 6 区画の並び */
const HOME_SECTIONS = ["hero", "demo", "features", "steps", "uses", "closing"] as const;

/** 実物の窓に出す記法の file。無ければ `undefined` */
const demoText = (lang: Lang): string | undefined => {
  const path = join(app, "src/home", lang === "ja" ? "demo.dragon" : "demo.en.dragon");
  return existsSync(path) ? readFileSync(path, "utf8").trimEnd() : undefined;
};

/** 記法の段ごとの行の範囲 (1 から数える)。段の `step` の行から、次の段の前の空でない行まで */
const stepLines = (text: string): number[][] => {
  const lines = text.split("\n");
  const heads = lines.flatMap((line, i) => (/^step(\s|$)/u.test(line) ? [i] : []));
  return heads.map((head, k) => {
    let end = (heads[k + 1] ?? lines.length) - 1;
    while (end > head && (lines[end] ?? "").trim() === "") end--;
    return Array.from({ length: end - head + 1 }, (_, i) => head + i + 1);
  });
};

/** 見本の file の最初の注釈 (`// ` の後ろ) */
const aboutOf = (text: string): string => (text.split("\n")[0] ?? "").replace(/^\/\/\s*/u, "");

/** 実物の窓の書類名と段の札と、記法の行と光っている行の番号 */
const demoOf = (page: Page): Promise<{ file: string; phase: string; code: string; current: number[]; names: string[] } | null> =>
  page.evaluate(() => {
    const demo = document.querySelector('[data-home="demo"]');
    if (!demo) return null;
    const lines = [...demo.querySelectorAll<HTMLElement>('[data-home="demo-code"] [data-line]')];
    const svg = demo.querySelector('svg[data-dragon="figure"]');
    return {
      file: demo.querySelector('[data-home="demo-file"]')?.textContent?.trim() ?? "",
      phase: demo.querySelector('[data-home="demo-phase"]')?.textContent?.trim() ?? "",
      code: lines.map((l) => l.querySelector('[data-home="code-text"]')?.textContent ?? "").join("\n"),
      current: lines.filter((l) => l.dataset.current === "true").map((l) => Number(l.dataset.line)),
      names: svg ? [...new Set([...svg.querySelectorAll(".dg-sn")].map((n) => n.textContent ?? ""))].sort() : [],
    };
  });

/** 用例の札の題と名札と説明と行き先と、縮小版の図の箱の名前と見せ方と動き */
const usesOf = (
  page: Page,
): Promise<{ title: string; kind: string; about: string; href: string; names: string[]; view: string | null; motion: string | null }[]> =>
  page.evaluate(() =>
    [...document.querySelectorAll<HTMLAnchorElement>('[data-home="use"]')].map((card) => {
      const svg = card.querySelector('svg[data-dragon="figure"]');
      return {
        title: card.querySelector("h3")?.textContent?.trim() ?? "",
        kind: card.querySelector('[data-home="use-kind"]')?.textContent?.trim() ?? "",
        about: card.querySelector('[data-home="use-about"]')?.textContent?.trim() ?? "",
        href: card.href ? new URL(card.href).pathname : "",
        names: svg ? [...new Set([...svg.querySelectorAll(".dg-sn")].map((n) => n.textContent ?? ""))].sort() : [],
        view: svg?.getAttribute("data-view") ?? null,
        motion: svg?.getAttribute("data-motion") ?? null,
      };
    }),
  );

/** 区画の中の link の行き先。頁の中は path、外は URL */
const linksIn = (page: Page, name: string): Promise<{ text: string; href: string }[]> =>
  page.evaluate(
    (s) =>
      [...document.querySelectorAll<HTMLAnchorElement>(`${s} a`)].map((a) => ({
        text: (a.textContent ?? "").trim(),
        href: new URL(a.href).origin === location.origin ? new URL(a.href).pathname : a.href.replace(/\/$/u, ""),
      })),
    homeSel(name),
  );

/** 概要の図の色 (図の地と字) を、置いた図ごとに */
const homeLooks = (page: Page): Promise<string[]> =>
  page.evaluate(() =>
    [...document.querySelectorAll('[data-site-screen="home"] .dg-player')].map((p) => {
      const v = (name: string): string => getComputedStyle(p).getPropertyValue(name).trim().toLowerCase();
      return `${v("--bg")} ${v("--ink")}`;
    }),
  );

/** カタログの一覧の札 */
const cardsOf = (page: Page): Promise<{ no: string; count: string; title: string; desc: string; open: string; href: string }[]> =>
  page.evaluate(() =>
    [...document.querySelectorAll<HTMLAnchorElement>('[data-catalog="card"]')].map((card) => {
      const text = (name: string): string => card.querySelector(`[data-catalog="${name}"]`)?.textContent?.trim() ?? "";
      return {
        no: text("card-no"),
        count: text("card-count"),
        title: card.querySelector("h2")?.textContent?.trim() ?? "",
        desc: text("card-desc"),
        open: text("card-open"),
        href: card.href ? new URL(card.href).pathname : "",
      };
    }),
  );

/** 右に出る見本の、段に関わらない中身 */
const shownOf = (c: Category): Pick<Category, "title" | "about" | "names" | "segs" | "editor"> => ({
  title: c.title,
  about: c.about,
  names: c.names,
  segs: c.segs,
  editor: c.editor,
});

/** 見本を右に出した時に期待する、段に関わらない中身 */
const expectedShown = (key: ExampleKey, lang: Lang): ReturnType<typeof shownOf> => {
  const text = exampleText(key, lang);
  const s = sampleOf(text);
  const parsed = parseNotation(text);
  const steps = parsed.ok ? parsed.diagram.steps.length : 0;
  return { title: s?.title ?? "", about: aboutOf(text), names: s?.names ?? [], segs: steps > 1 ? steps : 0, editor: `${BASE}editor${toHash(text)}` };
};

/**
 * 段の札と段の本文と進み具合の帯が、同じ段を指しているか。図は自分で段を進めるので、どの段かは決めずに見る。
 * 食い違えば何が食い違ったかを返し、揃っていれば空を返す。
 */
const stepMismatch = (c: Category, key: ExampleKey, lang: Lang): string => {
  const parsed = parseNotation(exampleText(key, lang));
  const steps = parsed.ok ? parsed.diagram.steps : [];
  if (steps.length < 2) return c.phase === "" ? "" : `段が 1 つの見本に段の札「${c.phase}」が出た`;
  const at = steps.findIndex((s, i) => TEXT[lang].stage.phase(i + 1, steps.length, s.title) === c.phase);
  if (at < 0) return `段の札「${c.phase}」がどの段の札でもない`;
  if (c.note !== (steps[at]?.body ?? "").trim()) return `段 ${at + 1} の本文が出ない (出た本文「${c.note}」)`;
  if (c.done !== at + 1) return `段 ${at + 1} なのに進み具合の帯が ${c.done} 区切り進んでいる`;
  return "";
};

/** 使い方の部品 (#3034) */
const docsSel = (name: string): string => `[data-docs="${name}"]`;

/** 使い方の節の並び。節の番号はこの並びから付く */
const DOC_SECTIONS = ["start", "short", "rules", "boxes", "edges", "regions", "state", "git", "time", "tree", "try", "chart", "flow", "pipe", "extend", "steps", "strip", "carry", "json", "place", "export", "migrate"] as const;

/** 記法の例を持たない節。頁に置く節は README と同じ code を、書き出しは命令を、前の形から書き直す節は対応表を出す */
const WITHOUT_EXAMPLE: readonly string[] = ["place", "export", "migrate"];

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

/**
 * 図に描く箱の名前。配管の図は、`[fold]` の呼び出しの内側の段 (開いた段の次の段から閉じた段の前の段まで) にしか出ない関係者を、箱を開くまで描かない (#3389)
 */
const drawnNames = (d: Diagram): string[] => {
  // 手順の図の判断は、問いを名前にしたひし形の箱で描く (#3561)
  if (d.kind === "flow") return [...boxesOf(d), ...(d.blocks.choice ?? [])].map((b) => b.name);
  if (d.kind !== "pipe") return boxesOf(d).map((b) => b.name);
  const partiesOf = (e: Diagram["steps"][number]["events"][number]): string[] =>
    e.type === "call" ? [e.from, e.to] : !("box" in e) ? [] : e.type === "move" ? [e.box, e.from, e.to] : [e.box];
  const inner = new Set<number>();
  const open: { step: number; fold: boolean }[] = [];
  d.steps.forEach((step, s) => {
    for (const e of step.events) {
      if (e.type === "call") open.push({ step: s, fold: e.fold === true });
      if (e.type !== "return" && e.type !== "revert") continue;
      const call = open.pop();
      if (call?.fold) for (let k = call.step + 1; k < s; k++) inner.add(k);
    }
  });
  const outside = new Set(d.steps.flatMap((step, s) => (inner.has(s) ? [] : step.events.flatMap(partiesOf))));
  const insideOnly = new Set(d.steps.flatMap((step, s) => (inner.has(s) ? step.events.flatMap(partiesOf) : [])).filter((id) => !outside.has(id)));
  return boxesOf(d)
    .filter((b) => !insideOnly.has(b.id))
    .map((b) => b.name);
};

/** dragon記法の行の種類。行の頭の語と、箱の名札から始まる線の `->` */
const LINE_KINDS = ["sequence", "architecture", "state", "git", "time", "tree", "try", "group", "end", "box", "branch", "scale", "period", "row", "point", "zoom", "leaf", "node", "route", "queue", "chain", "ask", "press", "chart", "pipe", "hold", "move", "write", "check", "return", "revert", "emit", "calc", "gist", "flow", "choice", "strip", "step", "say", "code", "commit", "mark", "span", "act", "note", "set", "->"] as const;

/** 節の例が、その節で説明する記法の要素を使っているか */
const DOC_COVERS: Record<string, (d: Diagram) => boolean> = {
  // 箱と線と印を元にした足したブロックを 1 つずつ定義する (#3407)
  extend: (d) => [...new Set((d.define?.blocks ?? []).map((b) => b.base))].length === 3,
  start: (d) => boxesOf(d).length >= 2 && d.steps.length >= 1,
  // 箱の宣言と段を省いた短い書き方。線に出た名前を箱にし、線 1 本を 1 段にする (#3438)
  short: (d) => boxesOf(d).length >= 2 && d.steps.length >= 2 && d.steps.every((s) => s.events.length === 1 && s.events[0]?.type === "edge"),
  // 決まり 4 つを全部使う。区画の入れ子、引用符で囲んだ `,` を含む値、字下げして続けた本文
  rules: (d) =>
    (d.blocks.group?.length ?? 0) >= 1 &&
    d.steps.some((s) => s.body.includes("\n")) &&
    eventsOf(d).some((e) => e.type === "edge" && e.carry.kind === "tag" && e.carry.text.includes(",")),
  boxes: (d) => boxesOf(d).length >= 3 && boxesOf(d).every((b) => b.color !== undefined) && boxesOf(d).some((b) => b.icon !== undefined && b.sub !== undefined),
  edges: (d) => eventsOf(d).filter((e) => e.type === "edge" && e.label !== undefined).length >= 2 && eventsOf(d).some((e) => e.type === "action"),
  regions: (d) => d.kind === "architecture" && (d.blocks.group?.length ?? 0) >= 2 && boxesOf(d).some((b) => b.region !== undefined),
  // 始まりと終わりの線と、最初の段より前に書く通らない道 (#3172)
  state: (d) =>
    d.kind === "state" &&
    (d.blocks.path?.length ?? 0) >= 1 &&
    eventsOf(d).some((e) => e.type === "edge" && e.from === "start") &&
    eventsOf(d).some((e) => e.type === "edge" && e.to === "finish"),
  // 枝を 3 本宣言し、枝を切り、merge commit と当て直しを作り、札を動かす (#3202)
  git: (d) =>
    d.kind === "git" &&
    (d.blocks.branch?.length ?? 0) >= 3 &&
    eventsOf(d).some((e) => e.type === "branch") &&
    eventsOf(d).some((e) => e.type === "commit" && e.copy !== undefined) &&
    eventsOf(d).some((e) => e.type === "commit" && e.merge !== undefined) &&
    eventsOf(d).some((e) => e.type === "edge"),
  // 区切りと印の列と 2 つの節目と拡大の範囲を宣言し、針を進め、印の色を変え、範囲を出し、物差しを満たす (#3221)
  time: (d) =>
    d.kind === "time" &&
    d.blocks.period !== undefined &&
    (d.blocks.point?.length ?? 0) >= 2 &&
    d.blocks.zoom !== undefined &&
    ["now", "mark", "span"].every((type) => eventsOf(d).some((e) => e.type === type)) &&
    (d.blocks.strip?.meters?.length ?? 0) >= 1,
  // 値を持つ葉と親を書き、運ぶ物の線を通す (#3235)
  tree: (d) =>
    d.kind === "tree" &&
    eventsOf(d).some((e) => e.type === "leaf" && e.hash !== undefined) &&
    eventsOf(d).some((e) => e.type === "node" && e.hash !== undefined) &&
    eventsOf(d).some((e) => e.type === "edge" && e.carry.kind !== "none"),
  // 5 つの部品を全て書き、書き手の例として並べ、送り、釦を押す (#3337)
  try: (d) =>
    d.kind === "try" &&
    ["route", "queue", "chain", "ask", "press"].every((type) => (d.blocks.part ?? []).some((part) => part.type === type)) &&
    ["line", "ask", "press"].every((type) => eventsOf(d).some((e) => e.type === type)),
  // 判断を宣言し、判断から出る通らない道を最初の段より前に書き、始まりと終わりの線を通す (#3561)
  flow: (d) =>
    d.kind === "flow" &&
    (d.blocks.choice?.length ?? 0) >= 1 &&
    (d.blocks.path?.length ?? 0) >= 1 &&
    eventsOf(d).some((e) => e.type === "edge" && e.from === "start") &&
    eventsOf(d).some((e) => e.type === "edge" && e.to === "finish"),
  // 残高と残高でない値を宣言し、配管の図の段の中の行を全て書く (#3389)。ETH を添える呼び出しと処理の種類を付けた呼び出しと畳む呼び出しと落ちる確認も書く
  pipe: (d) =>
    d.kind === "pipe" &&
    (d.blocks.hold ?? []).some((h) => "token" in h) &&
    (d.blocks.hold ?? []).some((h) => "name" in h) &&
    ["move", "write", "check", "return", "revert", "emit", "calc"].every((type) => eventsOf(d).some((e) => e.type === type)) &&
    eventsOf(d).some((e) => e.type === "call" && e.value !== undefined) &&
    eventsOf(d).some((e) => e.type === "call" && e.call !== undefined) &&
    eventsOf(d).some((e) => e.type === "call" && e.fold === true) &&
    eventsOf(d).some((e) => e.type === "check" && e.fail === true),
  // 色を付けた項目を 2 つ以上宣言し、段を 2 つ以上置いて段の中で値を書く (#3560)
  chart: (d) =>
    d.kind === "chart" &&
    d.chart !== undefined &&
    d.chart.items.length >= 2 &&
    d.chart.items.every((item) => item.color !== undefined) &&
    d.steps.length >= 2 &&
    d.steps.every((s) => s.events.some((e) => e.type === "set")),
  steps: (d) => d.steps.length >= 2 && d.steps.some((s) => s.code !== undefined) && eventsOf(d).some((e) => e.type === "swap"),
  strip: (d) => d.blocks.strip !== undefined && eventsOf(d).some((e) => e.type === "strip"),
  carry: (d) => ["envelope", "tag", "coin", "none"].every((kind) => eventsOf(d).some((e) => e.type === "edge" && e.carry.kind === kind)),
  json: (d) => d.version >= 1 && d.steps.length >= 1,
};

/** package の日本語の README の `## 頁に置く` の節の `ts` の囲みの中身。頁に置く節はこれと同じ code を出す (#3155)。英語の README の例が同じ物かは package の検査が見る */
const readmePlaceExample = (): string => {
  const readme = readFileSync(join(root, "packages/dragon/README.ja.md"), "utf8");
  const start = readme.indexOf("\n## 頁に置く\n");
  const end = readme.indexOf("\n## ", start + 1);
  const section = start < 0 ? "" : readme.slice(start, end < 0 ? undefined : end);
  return /```ts\n([\s\S]*?)```/u.exec(section)?.[1]?.trimEnd() ?? "";
};

/** package の README の `sh` の囲みの行。書き出しの節の命令はこれと同じ物を出す */
const readmeCommands = (): string[] => {
  const readme = readFileSync(join(root, "packages/dragon/README.ja.md"), "utf8");
  return [...readme.matchAll(/```sh\n([\s\S]*?)```/gu)].flatMap((m) => (m[1] ?? "").split("\n").filter((line) => line.trim() !== ""));
};

/** 書き出しの命令の使い方の表示に並ぶ設定の名前 (`--out` など) */
const cliOptions = (): string[] => {
  const cli = readFileSync(join(root, "packages/dragon/src/cli.ts"), "utf8");
  const usage = cli.slice(cli.indexOf("usage: ["), cli.indexOf("].join"));
  return [...usage.matchAll(/["`] {2}(--[a-z][a-z-]*) /gu)].map((m) => m[1] ?? "");
};

/** repo の README の記法の節の決まり。日本語は `README.ja.md` の `## dragon記法`、英語は `README.md` の `## Notation` の節。番号の後ろの字を、囲みの印を外して返す (#3138、#3317) */
const readmeRules = (lang: "ja" | "en"): string[] => {
  const readme = readFileSync(join(root, lang === "ja" ? "README.ja.md" : "README.md"), "utf8");
  const section = readme.split(lang === "ja" ? /^## dragon記法$/mu : /^## Notation$/mu)[1]?.split(/^## /mu)[0] ?? "";
  return [...section.matchAll(/^\d+\. (.+)$/gmu)].map((m) => (m[1] ?? "").replaceAll("`", ""));
};

/** 変更履歴の、前の形と新しい形の対応表の行。日本語は `CHANGELOG.ja.md` の `| 前の形 | 新しい形 |`、英語は `CHANGELOG.md` の `| Old form | New form |` の表 (#3138、#3321)。各欄は囲みの印を外した字 */
const changelogMigration = (lang: Lang): string[][] => {
  const lines = readFileSync(join(root, lang === "ja" ? "CHANGELOG.ja.md" : "CHANGELOG.md"), "utf8").split("\n");
  const head = lines.findIndex((line) => line.trim() === (lang === "ja" ? "| 前の形 | 新しい形 |" : "| Old form | New form |"));
  if (head < 0) return [];
  const rows: string[][] = [];
  for (const line of lines.slice(head + 2)) {
    if (!line.trim().startsWith("|")) break;
    rows.push(line.trim().slice(1, -1).split(" | ").map((cell) => cell.trim().replaceAll("`", "")));
  }
  return rows;
};

/**
 * 記法を読む部品が読む図の種類と行の頭の語と、行ごとに受け付ける属性の鍵 (#3138)。
 * 読む部品の英語の誤りの文から引き、検査に語の一覧を書き写さない。線の行は `->` の鍵に入れる
 */
const parserWords = (): { kinds: string[]; heads: string[]; attrs: Record<string, string[]> } => {
  const said = (text: string): string => {
    const parsed = parseNotation(text, { lang: "en" });
    return parsed.ok ? "" : (parsed.errors[0]?.message ?? "");
  };
  const listed = (message: string, pattern: RegExp, separator: string): string[] => pattern.exec(message)?.[1]?.split(separator) ?? [];
  const allowed = (text: string): string[] => listed(said(text), /^zzz cannot be written on this line\. Write (.+)$/u, " / ");
  const step = "step s\n  say x.";
  return {
    kinds: listed(said("zzz t"), /^Start the first line with (.+), followed by the title$/u, " or "),
    heads: listed(said("sequence t\nzzz"), /^A line cannot start with zzz\. Start a line with (.+), or <id> -> <id>$/u, " / "),
    attrs: {
      sequence: allowed(`sequence t [zzz: 1]\nbox a\n${step}`),
      architecture: allowed(`architecture t [zzz: 1]\nbox a\n${step}`),
      group: allowed(`architecture t\ngroup g [zzz: 1]\n  box a\nend\n${step}`),
      box: allowed(`sequence t\nbox a [zzz: 1]\n${step}`),
      "->": allowed(`sequence t\nbox a\nbox b\n${step}\n  a -> b [zzz: 1]`),
      set: allowed(`sequence t\nbox a\nstrip t: f\n${step}\n  set f [zzz: 1]`),
    },
  };
};

/** 線の行の形。箱の名札の後ろに `->` が来る */
const EDGE_FORM = /^\S+\s*->/u;

/**
 * 前の形と新しい形の対応表 (#3138) を作った後に足した記法の語。前の形が無いので対応表に行を持たない。
 * 対応表は出した版 (0.36.0) の変更履歴の表と同じで、後から行を足さない
 */
const ADDED_AFTER_MIGRATION = ["state", "git", "branch", "commit", "time", "scale", "period", "row", "task", "point", "zoom", "mark", "span", "source", "tree", "leaf", "node", "lineup", "item", "line", "seal", "open", "pick", "stamp", "role", "try", "route", "queue", "chain", "log", "ask", "choose", "press", "side", "pipe", "hold", "move", "write", "check", "return", "revert", "emit", "calc", "gist", "chart", "flow", "choice"];

/** 使い方の頁の前置きと札と節 */
const docsOf = (
  page: Page,
): Promise<{
  title: string;
  lead: string;
  ctas: string[];
  cards: { href: string; name: string; text: string }[];
  sections: {
    id: string;
    no: string;
    title: string;
    texts: number;
    prose: string;
    code: string | null;
    names: string[];
    commands: string[];
    cta: string | null;
    body: string;
    /** 決まりの並びの字 */
    rules: string[];
    /** 対応表の行。前の形の欄の字と、新しい形の欄の `<code>` の字 */
    migration: { old: string; forms: string[] }[];
  }[];
}> =>
  page.evaluate(() => {
    const where = (a: HTMLAnchorElement): string => {
      const url = new URL(a.href);
      return url.origin === location.origin ? `${url.pathname}${url.hash}` : a.href;
    };
    const hero = document.querySelector('[data-docs="hero"]');
    return {
      title: hero?.querySelector("h1")?.textContent?.trim() ?? "",
      lead: hero?.querySelector('[data-docs="lead"]')?.textContent?.trim() ?? "",
      ctas: [...document.querySelectorAll<HTMLAnchorElement>('[data-docs="cta"] a')].map(where),
      cards: [...document.querySelectorAll<HTMLAnchorElement>('a[data-docs="card"]')].map((a) => ({
        href: new URL(a.href).hash,
        name: a.querySelector('[data-docs="card-name"]')?.textContent?.trim() ?? "",
        text: a.querySelector("p")?.textContent?.trim() ?? "",
      })),
      sections: [...document.querySelectorAll<HTMLElement>('section[data-docs="section"]')].map((s) => {
        const example = s.querySelector('[data-docs="example"]');
        const svg = example?.querySelector('svg[data-dragon="figure"]');
        const cta = s.querySelector<HTMLAnchorElement>('a[data-docs="section-cta"]');
        return {
          id: s.id,
          no: s.querySelector('[data-docs="section-no"]')?.textContent?.trim() ?? "",
          title: s.querySelector("h2")?.textContent?.trim() ?? "",
          texts: [...s.querySelectorAll('[data-docs="text"]')].filter((p) => (p.textContent ?? "").trim() !== "").length,
          prose: [...s.querySelectorAll('[data-docs="text"]')].map((p) => p.textContent ?? "").join("\n"),
          code: example?.querySelector('[data-docs="example-code"]')?.textContent ?? null,
          names: svg ? [...new Set([...svg.querySelectorAll(".dg-sn")].map((n) => n.textContent ?? ""))].sort() : [],
          commands: [...s.querySelectorAll('[data-docs="command"]')].map((c) => c.textContent ?? ""),
          cta: cta ? where(cta) : null,
          body: s.textContent ?? "",
          rules: [...s.querySelectorAll('[data-docs="rule"]')].map((r) => r.textContent?.trim() ?? ""),
          migration: [...s.querySelectorAll('[data-docs="migration"] tbody tr')].map((tr) => {
            const [old, now] = [...tr.querySelectorAll("td")];
            return { old: old?.textContent?.trim() ?? "", forms: [...(now?.querySelectorAll("code") ?? [])].map((c) => c.textContent ?? "") };
          }),
        };
      }),
    };
  });

/** 版の札に出す版 (#3035)。`packages/dragon/package.json` の版の `v{major}.{minor}` */
const VERSION = ((): string => {
  const { version } = JSON.parse(readFileSync(join(root, "packages/dragon/package.json"), "utf8")) as { version: string };
  return `v${version.split(".").slice(0, 2).join(".")}`;
})();

/** 札の字を空白で区切った語。版は語として比べ、`v0.35.1` のような版の写し違いを `v0.35` に一致させない */
const wordsOf = (text: string): string[] => text.split(/\s+/u);

/** 更新履歴の頁の部品 (#3035) */
const releaseOf = (
  page: Page,
): Promise<{ crumb: string[]; eyebrow: string; title: string; lead: string; links: { text: string; href: string; target: string | null; rel: string }[] }> =>
  page.evaluate(() => {
    const at = (name: string): Element | null => document.querySelector(`[data-release="${name}"]`);
    return {
      crumb: [...(at("crumb")?.querySelectorAll("a") ?? [])].map((a) => new URL(a.href).pathname),
      eyebrow: at("eyebrow")?.textContent?.trim() ?? "",
      title: at("hero")?.querySelector("h1")?.textContent?.trim() ?? "",
      lead: at("lead")?.textContent?.trim() ?? "",
      links: [...document.querySelectorAll<HTMLAnchorElement>('[data-release="actions"] a')].map((a) => ({
        text: (a.textContent ?? "").replace("↗", "").trim(),
        href: a.href,
        target: a.getAttribute("target"),
        rel: a.getAttribute("rel") ?? "",
      })),
    };
  });

/** 見つからない頁の部品 (#3035) */
const notFoundOf = (page: Page): Promise<{ code: string; title: string; lead: string; links: string[]; path: string }> =>
  page.evaluate(() => {
    const at = (name: string): Element | null => document.querySelector(`[data-not-found="${name}"]`);
    return {
      code: (at("code")?.textContent ?? "").replace(/\s/gu, ""),
      title: document.querySelector('[data-site-screen="not-found"] h1')?.textContent?.trim() ?? "",
      lead: at("lead")?.textContent?.trim() ?? "",
      links: [...document.querySelectorAll<HTMLAnchorElement>('[data-not-found="cta"] a')].map((a) => new URL(a.href).pathname),
      path: at("path")?.textContent?.trim() ?? "",
    };
  });

/** 右の見本の道具のうち、頁に無い物 */
const PREVIEW_TOOLS = ["tab-figure", "tab-code", "palette", "zoom-out", "zoom-in", "fit", "zoom-level", "expand", "stage", "phase-badge", "progress", "step-note", "open-editor"] as const;

const missingTools = (page: Page): Promise<string[]> =>
  page.evaluate((names) => names.filter((n) => document.querySelector(`[data-catalog="preview"] [data-catalog="${n}"]`) === null), [...PREVIEW_TOOLS] as string[]);

/** 帯の印と名前と添え書きと切替と釦 */
const headerOf = (page: Page): Promise<Record<string, string | null>> =>
  page.evaluate(() => {
    const q = (name: string): Element | null => document.querySelector(`[data-site="header"] [data-site="${name}"]`);
    const text = (name: string): string | null => q(name)?.textContent?.trim() ?? null;
    const cta = q("open-editor");
    return {
      mark: q("mark") ? "yes" : null,
      name: text("name"),
      tagline: text("tagline"),
      langJa: q("lang-ja") ? "yes" : null,
      langEn: q("lang-en") ? "yes" : null,
      theme: q("theme") ? "yes" : null,
      cta: text("open-editor"),
      ctaHref: cta instanceof HTMLAnchorElement ? new URL(cta.href).pathname : null,
    };
  });

/** 頁の地、帯の面、字、釦の差し色 */
const colorsOf = (page: Page): Promise<{ bg: string; surface: string; text: string; accent: string }> =>
  page.evaluate(() => {
    const color = (s: string, prop: "backgroundColor" | "color"): string => {
      const e = document.querySelector(s);
      return e ? getComputedStyle(e)[prop] : "";
    };
    return {
      bg: getComputedStyle(document.body).backgroundColor,
      surface: color('[data-site="header"]', "backgroundColor"),
      text: getComputedStyle(document.body).color,
      accent: color('[data-site="header"] [data-site="open-editor"]', "backgroundColor"),
    };
  });

const rgbOf = (c: { bg: string; surface: string; text: string; accent: string }): Record<string, string> =>
  Object.fromEntries(Object.entries(c).map(([k, v]) => [k, rgb(v)]));

/**
 * 使い方の頁を読む件 (#3435)。頁の状態を変えないので、言語ごとに 1 度開いた使い方の頁を順に使える。
 * 箱の節の案内を押して部品「絵」の頁へ移る `docs-boxes-lead-to-every-icon` は最後に回す
 */
const DOCS_READERS = [
  "docs-state-section-follows-regions",
  "docs-git-section-follows-state",
  "docs-time-section-follows-git",
  "docs-tree-section-follows-time",
  "docs-extend-section-follows-pipe",
  "docs-extend-example-draws-user-blocks",
  "docs-extend-shows-shared-definitions",
  "docs-boxes-lead-to-every-icon",
] as const;

describe("サイトの帯と経路と頁 (#3030)", () => {
  useSite();
  // 使い方の頁を読む件が使い方の頁を開いた回数を、言語ごとに数える (#3435)
  const docsOpens = countOpens(DOCS_READERS, (o) => (o.path === `${BASE}docs` ? (o.locale ?? "ja-JP") : undefined));
  // 使い方の頁を読む件は、言語ごとに 1 度開いた使い方の頁を順に使う (#3435)。件が落ちるとその言語の頁を閉じ、次の件が開き直す
  const docsPages = { ja: pageGroups<Page>((page) => page.context().close()), en: pageGroups<Page>((page) => page.context().close()) };
  afterAll(async () => {
    await docsPages.ja.close();
    await docsPages.en.close();
  });
  const docsPage = (lang: Lang, onTestFailed: TestContext["onTestFailed"]): Promise<Page> =>
    docsPages[lang].get(
      "docs",
      async () => (await site.open({ path: `${BASE}docs`, locale: lang === "ja" ? "ja-JP" : "en-US", viewport: { width: 1440, height: 900 }, keep: true })).page,
      onTestFailed,
    );


  describe.for(SCREENS.map(([screen, path]) => ({ screen, path })))("$screen", ({ screen, path }) => {
    it("site-routes-render-each-screen", async () => {
      const { page } = await site.open({ path });
      await onScreen(page, screen, `${path} を開いても ${screen} の画面が出ない`);
      expect(await page.evaluate(() => location.pathname), `${path} のアドレスが替わった`).toBe(path);
    });
  });

  describe("末尾の / と表に無い深い経路", () => {
    it("site-routes-render-each-screen", async () => {
      expect(site.built.notFound.ok, `404.html を作る script が落ちた: ${site.built.notFound.stderr}`).toBe(true);
      // 末尾に `/` の付いた経路も同じ画面を出す
      const slash = await site.open({ path: `${BASE}editor/` });
      await onScreen(slash.page, "editor", "末尾に / の付いた編集画面の経路で編集画面が出ない");
      await expect
        .poll(() => slash.page.evaluate((s) => document.querySelectorAll(s).length, '[data-playground="editor"]'), {
          ...WAIT,
          message: "編集画面に書く欄が無い",
        })
        .toBe(1);
      // カタログの分類より深い経路は見つからない頁にする
      const deep = await site.open({ path: `${BASE}catalog/sequence/extra` });
      await onScreen(deep.page, "not-found", "表に無い深い経路で見つからない頁が出ない");
    });
  });


  describe.for(SCREENS.map(([screen, path]) => ({ screen, path })))("$screen", ({ screen, path }) => {
    it("site-header-on-every-screen", async () => {
      const { page } = await site.open({ path });
      await onScreen(page, screen, `${path} を開いても ${screen} の画面が出ない`);
      expect(await headerOf(page), `${screen} の帯の部品が足りない`).toEqual({
        mark: "yes",
        name: "dragon",
        tagline: expect.stringMatching(/\S/u),
        langJa: "yes",
        langEn: "yes",
        theme: "yes",
        cta: "編集画面を開く →",
        ctaHref: `${BASE}editor`,
      });
      const nav = await navOf(page);
      expect(
        nav.map(({ text, href }) => ({ text, href })),
        `${screen} の帯の行き先が 6 つ並ばない`,
      ).toEqual(DESTINATIONS.map(({ ja, href }) => ({ text: ja, href })));
    });
  });


  it(
    "site-header-marks-current-and-navigates",
    async () => {
      const marked = async (page: Page): Promise<string[]> => (await navOf(page)).filter((n) => n.current).map((n) => n.text);

      const { page } = await site.open({ path: `${BASE}catalog` });
      await onScreen(page, "catalog", "カタログの一覧が出ない");
      expect(await marked(page), "カタログに現在地の印が付かない").toEqual(["カタログ"]);
      // 頁を読み直すと消える印を置き、帯で移った後も残っているかで読み直していないことを見る
      await page.evaluate(() => {
        (window as unknown as { __stay: number }).__stay = 1;
      });
      const stayed = (): Promise<number | undefined> => page.evaluate(() => (window as unknown as { __stay?: number }).__stay);

      await page.locator(`${siteSel("nav")} a`, { hasText: "使い方" }).click();
      await onScreen(page, "docs", "帯の使い方を押しても使い方の頁が出ない");
      expect(await page.evaluate(() => location.pathname)).toBe(`${BASE}docs`);
      expect(await marked(page), "使い方に現在地の印が付かない").toEqual(["使い方"]);
      expect(await stayed(), "帯で移った時に頁を読み直した").toBe(1);

      await page.locator(siteSel("open-editor")).click();
      await onScreen(page, "editor", "編集画面を開く釦で編集画面が出ない");
      expect(await marked(page)).toEqual(["編集画面"]);
      expect(await stayed(), "編集画面を開く釦で頁を読み直した").toBe(1);

      // browser の戻る操作で前の画面へ戻る
      await page.goBack();
      await onScreen(page, "docs", "戻る操作で使い方の頁へ戻らない");
      expect(await marked(page)).toEqual(["使い方"]);
      expect(await stayed(), "戻る操作で頁を読み直した").toBe(1);

      // 分類の頁ではカタログに印を付ける
      const category = await site.open({ path: `${BASE}catalog/sequence` });
      await onScreen(category.page, "category", "カタログの分類の頁が出ない");
      expect(await marked(category.page), "分類の頁でカタログに印が付かない").toEqual(["カタログ"]);
    },
  );


  it(
    "site-colors-follow-palette",
    async () => {
      const light = await site.open({ path: BASE, colorScheme: "light" });
      await onScreen(light.page, "home", "概要の頁が出ない");
      await expect
        .poll(() => colorsOf(light.page), { ...WAIT, message: "色味を選ぶ前の明るい側の頁の色が紙と墨の値でない" })
        .toEqual(rgbOf(siteLook(DEFAULT_PALETTE, "light")));

      // 端末が暗い設定なら暗い側で開く
      const dark = await site.open({ path: BASE, colorScheme: "dark" });
      await onScreen(dark.page, "home", "概要の頁が出ない");
      await expect
        .poll(() => colorsOf(dark.page), { ...WAIT, message: "色味を選ぶ前の暗い側の頁の色が紙と墨の値でない" })
        .toEqual(rgbOf(siteLook(DEFAULT_PALETTE, "dark")));

      // 明暗の切替を押すと替わり、もう 1 度押すと戻る
      await light.page.locator(siteSel("theme")).click();
      await expect.poll(() => colorsOf(light.page), { ...WAIT, message: "明暗の切替で暗い側にならない" }).toEqual(rgbOf(siteLook(DEFAULT_PALETTE, "dark")));
      await light.page.locator(siteSel("theme")).click();
      await expect.poll(() => colorsOf(light.page), { ...WAIT, message: "明暗の切替で明るい側に戻らない" }).toEqual(rgbOf(siteLook(DEFAULT_PALETTE, "light")));
    },
  );


  describe.for([1440, 390].flatMap((width) => (["light", "dark"] as const).map((colorScheme) => ({ width, colorScheme }))))("$width $colorScheme", ({ width, colorScheme }) => {
    it("site-screens-no-overflow", async () => {
      const { page } = await site.open({ path: BASE, colorScheme, viewport: { width, height: 900 } });
      for (const [screen, path] of SCREENS) {
        await page.goto(`${site.origin}${path}`);
        await onScreen(page, screen, `${path} を開いても ${screen} の画面が出ない`);
        const over = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
        expect(over, `${screen} を幅 ${width}、${colorScheme} で開くと ${over}px 横にあふれる`).toBeLessThanOrEqual(0);
      }
    });
  });


  describe.for(SCREENS.map(([screen, path]) => ({ screen, path })))("$screen", ({ screen, path }) => {
    it("site-screens-switch-to-english", async () => {
      const { page } = await site.open({ path, locale: "ja-JP" });
      await onScreen(page, screen, `${path} を開いても ${screen} の画面が出ない`);
      await page.locator(siteSel("lang-en")).click();
      await expect.poll(() => page.evaluate(() => document.documentElement.lang), { ...WAIT, message: `${screen} で言語が EN にならない` }).toBe("en");
      await expect
        .poll(() => leftover(page), { ...WAIT, message: `${screen} を EN に切り替えても仮名か漢字が残る` })
        .toBe("");
      const nav = await navOf(page);
      expect(nav.map((n) => n.text), `${screen} の帯の行き先が英語にならない`).toEqual(DESTINATIONS.map((d) => d.en));
    });
  });


  it(
    "site-header-folds-at-narrow-width",
    async () => {
      const { page } = await site.open({ path: BASE, viewport: { width: 390, height: 844 } });
      await onScreen(page, "home", "概要の頁が出ない");
      expect((await navOf(page)).some((n) => n.visible), "幅 390 で帯の行き先が畳まれない").toBe(false);
      await page.locator(siteSel("menu")).click();
      await expect
        .poll(async () => (await navOf(page, "sheet")).filter((n) => n.visible).map((n) => n.text), { ...WAIT, message: "開く釦で行き先が出ない" })
        .toEqual(DESTINATIONS.map((d) => d.ja));
      await page.keyboard.press("Escape");
      await expect.poll(async () => (await navOf(page, "sheet")).length, { ...WAIT, message: "Escape で行き先が閉じない" }).toBe(0);

      await page.locator(siteSel("menu")).click();
      await page.locator(`${siteSel("sheet")} a`, { hasText: "使い方" }).click();
      await onScreen(page, "docs", "畳んだ行き先から使い方の頁へ移れない");
      await expect.poll(async () => (await navOf(page, "sheet")).length, { ...WAIT, message: "移った後も行き先が開いたまま" }).toBe(0);
    },
  );


  it(
    "old-share-link-opens-editor",
    async () => {
      const hash = toHash(EDITED);
      const { page } = await site.open({ path: `${BASE}${hash}` });
      await onScreen(page, "editor", "前に共有した URL を開いても編集画面が出ない");
      expect(await page.evaluate(() => location.pathname), "前に共有した URL のアドレスが編集画面にならない").toBe(`${BASE}editor`);
      expect(await page.evaluate(() => location.hash), "前に共有した URL の # の後ろが消えた").toBe(hash);
      await expect
        .poll(() => page.evaluate(() => document.querySelector<HTMLTextAreaElement>('[data-playground="editor"]')?.value.trimEnd() ?? null), {
          ...WAIT,
          message: "前に共有した URL の記法が書く欄に入らない",
        })
        .toBe(EDITED);
    },
  );


  it(
    "home-has-six-sections-with-live-diagrams",
    async () => {
      const { page } = await site.open({ path: BASE, viewport: { width: 1440, height: 900 } });
      await onScreen(page, "home", "概要の頁が出ない");

      // 6 区画がこの順で並ぶ
      const sections = (): Promise<(string | null)[]> =>
        page.evaluate(
          (names) => [...document.querySelectorAll("[data-home]")].map((e) => e.getAttribute("data-home")).filter((n) => names.includes(n ?? "")),
          [...HOME_SECTIONS] as string[],
        );
      await expect.poll(sections, { ...WAIT, message: "概要の 6 区画がこの順で並ばない" }).toEqual([...HOME_SECTIONS]);

      // 呼びかけ。見出しと、編集画面と使い方への釦
      expect(await page.locator(`${homeSel("hero")} h1`).count(), "呼びかけに見出しが無い").toBe(1);
      expect(await linksIn(page, "hero"), "呼びかけの釦が編集画面と使い方へ向かない").toEqual([
        { text: "編集画面を開く →", href: `${BASE}editor` },
        { text: "使い方を読む", href: `${BASE}docs` },
      ]);

      // 記法と図の実物。窓の記法が見本の記法で、図はその記法の箱を描き、今の段の行が光る
      const ja = demoText("ja");
      expect(ja, "実物の窓に出す記法の file (src/home/demo.dragon) が無い").toBeDefined();
      const demo = sampleOf(ja ?? "");
      expect(demo, "実物の窓の記法が読めない").toBeDefined();
      const parsed = parseNotation(ja ?? "");
      const steps = parsed.ok ? parsed.diagram.steps : [];
      expect(steps.length, "実物の窓の記法が段を 2 つ以上持たない").toBeGreaterThanOrEqual(2);
      const ranges = stepLines(ja ?? "");
      const phaseOf = (n: number): string => TEXT.ja.stage.phase(n + 1, steps.length, steps[n]?.title ?? "");
      await expect.poll(async () => (await demoOf(page))?.code ?? null, { ...WAIT, message: "実物の窓の記法が見本の記法でない" }).toBe(ja);
      await expect.poll(async () => (await demoOf(page))?.names ?? null, { ...WAIT, message: "実物の窓の図が記法の箱を描かない" }).toEqual(demo?.names);
      const first = await demoOf(page);
      expect(first?.file, "実物の窓に書類名が無い").toMatch(/\.dragon$/u);
      expect(first?.phase, "実物の窓の段の札が最初の段でない").toBe(phaseOf(0));
      expect(first?.current, "実物の窓で最初の段の行が光らない").toEqual(ranges[0]);
      // 図は自分で次の段へ進み、段の札と光る行が付いてくる
      await expect
        .poll(async () => (await demoOf(page))?.phase ?? null, { timeout: 20_000, interval: 200, message: "実物の窓の図が次の段へ進まない" })
        .toBe(phaseOf(1));
      expect((await demoOf(page))?.current, "段が進んでも光る行が替わらない").toEqual(ranges[1]);

      // 特長 3 つ。印と見出しと説明
      const features = await page.evaluate(() =>
        [...document.querySelectorAll('[data-home="feature"]')].map((f) => ({
          icon: f.querySelector('[data-home="feature-icon"]') !== null,
          title: f.querySelector("h3")?.textContent?.trim() ?? "",
          text: f.querySelector("p")?.textContent?.trim() ?? "",
        })),
      );
      expect(features.length, "特長が 3 つ並ばない").toBe(3);
      for (const f of features) expect(f.icon && f.title !== "" && f.text !== "", `特長「${f.title}」に印か見出しか説明が無い`).toBe(true);

      // 3 手順。番号と見出しと説明、2 つ目に新規作成の雛形の抜粋
      const quick = await page.evaluate(() =>
        [...document.querySelectorAll('[data-home="step"]')].map((s) => ({
          no: s.querySelector('[data-home="step-no"]')?.textContent?.trim() ?? "",
          title: s.querySelector("h3")?.textContent?.trim() ?? "",
          code: s.querySelector('[data-home="step-code"]')?.textContent ?? null,
        })),
      );
      expect(quick.map((s) => s.no), "3 手順の番号が 01 から 03 でない").toEqual(["01", "02", "03"]);
      expect(quick.every((s) => s.title !== ""), "3 手順に見出しの無い手順がある").toBe(true);
      expect(quick.map((s) => s.code?.trimEnd() ?? null), "3 手順の 2 つ目だけに新規作成の雛形が出ない").toEqual([null, TEMPLATE.ja, null]);

      // 用例 3 つ。見本ごとに、縮小版の動く図と、図の種類の名札と題と説明。押すとその図の種類の分類へ移る
      const expected = (lang: Lang): { title: string; kind: string; about: string; href: string; names: string[]; view: string; motion: string }[] =>
        HOME_USES.map((key) => {
          const text = exampleText(key, lang);
          const s = sampleOf(text);
          return {
            title: s?.title ?? "",
            kind: s ? TEXT[lang].shelf.kinds[s.kind] : "",
            about: aboutOf(text),
            href: `${BASE}catalog/${s?.kind ?? ""}`,
            names: s?.names ?? [],
            view: "fixed",
            motion: "play",
          };
        });
      await expect.poll(() => usesOf(page), { ...WAIT, message: "用例の札が見本 3 つの図と題と名札と説明を出さない" }).toEqual(expected("ja"));
      expect(await linksIn(page, "uses-more"), "用例の下にカタログへの行き先が無い").toEqual([{ text: "カタログで図を見る →", href: `${BASE}catalog` }]);

      // 最後の呼びかけ。編集画面と GitHub への釦
      expect(await page.locator(`${homeSel("closing")} h2`).count(), "最後の呼びかけに見出しが無い").toBe(1);
      expect(await linksIn(page, "closing"), "最後の呼びかけの釦が編集画面と GitHub へ向かない").toEqual([
        { text: "編集画面を開く →", href: `${BASE}editor` },
        { text: "GitHub ↗", href: REPO },
      ]);

      // 図は頁の明暗に合わせて描かれ、明暗を替えると描き直される
      const looks = (theme: "light" | "dark"): string => {
        const v = PALETTES[DEFAULT_PALETTE]?.[theme] ?? {};
        return `${(v.bg ?? "").toLowerCase()} ${(v.ink ?? "").toLowerCase()}`;
      };
      expect(await homeLooks(page), "概要の図が明るい側の色で描かれない").toEqual(Array(1 + HOME_USES.length).fill(looks("light")));
      await page.locator(siteSel("theme")).click();
      await expect
        .poll(() => homeLooks(page), { ...WAIT, message: "明暗を替えても概要の図が暗い側の色で描き直されない" })
        .toEqual(Array(1 + HOME_USES.length).fill(looks("dark")));

      // 英語に替えると、実物の窓の記法と用例の札が英語の見本になる
      await page.locator(siteSel("lang-en")).click();
      const en = demoText("en");
      expect(en, "実物の窓に出す英語の記法の file (src/home/demo.en.dragon) が無い").toBeDefined();
      await expect.poll(async () => (await demoOf(page))?.code ?? null, { ...WAIT, message: "英語に替えても実物の窓の記法が英語の見本にならない" }).toBe(en);
      await expect.poll(async () => (await demoOf(page))?.names ?? null, { ...WAIT, message: "英語の実物の窓の図が記法の箱を描かない" }).toEqual(sampleOf(en ?? "")?.names);
      await expect.poll(() => usesOf(page), { ...WAIT, message: "英語に替えても用例の札が英語の見本にならない" }).toEqual(expected("en"));

      // 用例の札を押すと、その図の種類の分類の頁へ移る
      const card = page.locator(homeSel("use")).last();
      const href = (await usesOf(page)).at(-1)?.href ?? "";
      await card.click();
      await onScreen(page, "category", "用例の札を押しても分類の頁へ移らない");
      expect(await page.evaluate(() => location.pathname), "用例の札が見本の図の種類の分類へ向かない").toBe(href);
    },
  );


  it(
    "catalog-cards-count-from-samples",
    async () => {
      const { page } = await site.open({ path: `${BASE}catalog`, viewport: { width: 1440, height: 900 } });
      await onScreen(page, "catalog", "カタログの一覧が出ない");

      // 分類ごとの札。番号、件数、見出し、説明、開く。件数は分類に載る見本を数えた数
      const expected = KINDS.map((kind, i) => ({
        no: String(i + 1).padStart(2, "0"),
        count: `${samplesOf(kind).length} 件`,
        title: TEXT.ja.shelf.kinds[kind],
        href: `${BASE}catalog/${kind}`,
        open: "開く →",
      }));
      await expect
        .poll(async () => (await cardsOf(page)).map(({ no, count, title, href, open }) => ({ no, count, title, href, open })), {
          ...WAIT,
          message: "カタログの一覧に分類の札が見本の数どおりに並ばない",
        })
        .toEqual(expected);
      const cards = await cardsOf(page);
      expect(cards.every((c) => c.desc !== ""), "説明の無い分類の札がある").toBe(true);
      expect(new Set(cards.map((c) => c.desc)).size, "分類の札の説明が分類ごとに違わない").toBe(cards.length);

      // 道筋と見出しと説明。説明は分類の数と見本の数を数えて出す
      expect(
        await page.evaluate(() => [...document.querySelectorAll<HTMLAnchorElement>('[data-catalog="crumb"] a')].map((a) => new URL(a.href).pathname)),
        "一覧の道筋が概要へ戻らない",
      ).toEqual([BASE]);
      expect(await page.locator(`${catalogSel("index")} h1`).textContent(), "一覧の見出しがカタログでない").toBe("カタログ");
      const desc = (await page.locator(catalogSel("desc")).textContent()) ?? "";
      expect(desc, "一覧の説明が分類の数を出さない").toContain(`${KINDS.length}`);
      expect(desc, "一覧の説明が見本の数を出さない").toContain(`${EXAMPLE_KEYS.length}`);

      // 英語に替えると、札の見出しと開くの字が英語になる
      await page.locator(siteSel("lang-en")).click();
      await expect
        .poll(async () => (await cardsOf(page)).map(({ title, open }) => ({ title, open })), { ...WAIT, message: "英語に替えても分類の札が英語にならない" })
        .toEqual(KINDS.map((kind) => ({ title: TEXT.en.shelf.kinds[kind], open: "Open →" })));

      // 札を押すと、その分類の頁へ移る
      await page.locator(catalogSel("card")).first().click();
      await onScreen(page, "category", "分類の札を押しても分類の頁が出ない");
      expect(await page.evaluate(() => location.pathname), "最初の分類の札が最初の分類へ向かない").toBe(`${BASE}catalog/${KINDS[0]}`);
    },
  );


  it(
    "category-page-lists-samples-and-previews-one",
    async () => {
      const { page } = await site.open({ path: `${BASE}catalog/sequence`, viewport: { width: 1440, height: 900 } });
      await onScreen(page, "category", "時系列図の分類の頁が出ない");
      const keys = samplesOf("sequence");
      const titleOf = (key: ExampleKey, lang: Lang = "ja"): string => sampleOf(exampleText(key, lang))?.title ?? "";

      // 左の一覧に分類の見本が並び、最初の見本を選んでいる
      await expect
        .poll(async () => (await categoryOf(page)).items, { ...WAIT, message: "分類の頁の一覧に見本が並ばない" })
        .toEqual(keys.map((key, i) => ({ title: titleOf(key), current: i === 0 })));
      const first = await categoryOf(page);
      expect(first.count, "分類の頁に見本の件数が出ない").toBe(`全 ${keys.length} 件`);
      // 一覧は 260px の幅で見本の左に並び、見本との間は 24px。間が広がると見本の面が細る (#3099)
      expect(first.side, "一覧が 260px の幅で見本の左に並ばないか、一覧と見本の間が 24px でない").toEqual({ width: 260, gap: 24 });
      expect(await page.locator(`${catalogSel("category")} h1`).textContent(), "分類の頁の見出しが図の種類の名前でない").toBe(TEXT.ja.shelf.kinds.sequence);
      expect(
        await page.evaluate(() => [...document.querySelectorAll<HTMLAnchorElement>('[data-catalog="crumb"] a')].map((a) => new URL(a.href).pathname)),
        "分類の頁の道筋が概要とカタログへ戻らない",
      ).toEqual([BASE, `${BASE}catalog`]);

      // 右に選んだ見本 1 つ。名前と説明、動く図、編集画面で開く
      const firstKey = keys[0] as ExampleKey;
      await expect.poll(async () => shownOf(await categoryOf(page)), { ...WAIT, message: "右に最初の見本が出ない" }).toEqual(expectedShown(firstKey, "ja"));
      expect(stepMismatch(await categoryOf(page), firstKey, "ja"), "最初の見本の段の札と本文と帯が揃わない").toBe("");

      // 一覧で別の見本を選ぶと、右がその見本に替わる
      const lastKey = keys.at(-1) as ExampleKey;
      await page.locator(catalogSel("item")).last().click();
      await expect.poll(async () => shownOf(await categoryOf(page)), { ...WAIT, message: "一覧で選んだ見本に右が替わらない" }).toEqual(expectedShown(lastKey, "ja"));
      expect((await categoryOf(page)).items.map((i) => i.current), "選んだ見本に印が移らない").toEqual(keys.map((_, i) => i === keys.length - 1));
      expect(stepMismatch(await categoryOf(page), lastKey, "ja"), "選んだ見本の段の札と本文と帯が揃わない").toBe("");
      // 段を 2 つ以上持つ見本には、図とコードの見出し、色味、縮小と拡大と幅に合わせる、拡大の釦、段の札、帯、段の本文が揃う
      expect(await missingTools(page), "右の見本に道具が欠けている").toEqual([]);

      // 検索で一覧が絞られる。当てはまる見本が無ければ、無いと出す
      await page.locator(catalogSel("search")).fill("OAuth");
      await expect
        .poll(async () => (await categoryOf(page)).items.map((i) => i.title), { ...WAIT, message: "検索で一覧が絞られない" })
        .toEqual(keys.filter((key) => titleOf(key).includes("OAuth")).map((key) => titleOf(key)));
      await page.locator(catalogSel("search")).fill("当てはまらない語");
      await expect
        .poll(async () => {
          const c = await categoryOf(page);
          return { items: c.items.length, empty: c.empty };
        }, { ...WAIT, message: "当てはまる見本が無い時に、無いと出ない" })
        .toEqual({ items: 0, empty: true });

      // 見本が 1 つしかない分類
      const one = samplesOf("architecture");
      const arch = await site.open({ path: `${BASE}catalog/architecture`, viewport: { width: 1440, height: 900 } });
      await onScreen(arch.page, "category", "構成図の分類の頁が出ない");
      await expect
        .poll(async () => (await categoryOf(arch.page)).items, { ...WAIT, message: "構成図の分類の一覧に見本が並ばない" })
        // 最初の見本に印が付く。構成図の見本は足したブロックの見本 (bridge) を加えて 2 つになった (#3407)
        .toEqual(one.map((key, i) => ({ title: titleOf(key), current: i === 0 })));
      expect((await categoryOf(arch.page)).count).toBe(`全 ${one.length} 件`);
      await expect
        .poll(async () => shownOf(await categoryOf(arch.page)), { ...WAIT, message: "構成図の分類で右に見本が出ない" })
        .toEqual(expectedShown(one[0] as ExampleKey, "ja"));

      // 知らない分類は見つからない頁にする
      const unknown = await site.open({ path: `${BASE}catalog/unknown` });
      await onScreen(unknown.page, "not-found", "知らない分類で見つからない頁が出ない");
    },
  );


  describe.for((["ja", "en"] as const).flatMap((lang) => KINDS.map((kind) => ({ lang, kind }))))("$lang $kind", ({ lang, kind }) => {
    it("catalog-samples-all-valid", async () => {
      const href = `${BASE}catalog/${kind}`;
      const { page } = await site.open({ path: href, locale: lang === "ja" ? "ja-JP" : "en-US" });
      await onScreen(page, "category", `${href} で分類の頁が出ない`);
      // 分類の頁に、その図の種類の見本が全て載る
      await expect.poll(async () => (await categoryOf(page)).items.length, { ...WAIT, message: `${lang} の ${href} に載る見本の数が、その図の種類の見本の数と合わない` }).toBe(samplesOf(kind).length);
      const items = (await categoryOf(page)).items;
      const errors: string[] = [];
      for (const [i, item] of items.entries()) {
        await page.locator(catalogSel("item")).nth(i).click();
        await expect.poll(async () => (await categoryOf(page)).title, { ...WAIT, message: `${href} の「${item.title}」が右に出ない` }).toBe(item.title);
        await page.locator(catalogSel("tab-code")).click();
        await page.locator(catalogSel("source-notation")).click();
        const text = (await page.locator(catalogSel("source-code")).textContent()) ?? "";
        const parsed = parseNotation(text);
        if (!parsed.ok) {
          errors.push(`${lang} ${href}「${item.title}」が記法として読めない: ${parsed.errors.map((e) => `${e.line} 行目 ${e.message}`).join(" / ")}`);
          continue;
        }
        const read = readDiagram(parsed.diagram);
        if (!read.ok) errors.push(`${lang} ${href}「${item.title}」が schema の検査で落ちる: ${read.errors.map((e) => `${e.pointer} ${e.message}`).join(" / ")}`);
        await page.locator(catalogSel("tab-figure")).click();
      }
      expect(errors, `${lang} の ${href} に読めない見本がある`).toEqual([]);
    });
  });

  describe("分類の札と見本の数", () => {
    it("catalog-samples-all-valid", async () => {
      // 分類ごとの件が全ての札を回し、分類ごとの見本の数を足すと見本の数になる
      for (const lang of ["ja", "en"] as const) {
        const { page } = await site.open({ path: `${BASE}catalog`, locale: lang === "ja" ? "ja-JP" : "en-US" });
        await onScreen(page, "catalog", "カタログの一覧が出ない");
        await expect.poll(async () => (await cardsOf(page)).map((c) => c.href), { ...WAIT, message: `${lang} のカタログの一覧の札が、図の種類の分類と合わない` }).toEqual(KINDS.map((kind) => `${BASE}catalog/${kind}`));
      }
      expect(KINDS.reduce((sum, kind) => sum + samplesOf(kind).length, 0), "カタログに載る見本の数が見本の数と合わない").toBe(EXAMPLE_KEYS.length);
    });
  });


  it(
    "category-palette-overrides-one-diagram",
    async () => {
      const { page } = await site.open({ path: `${BASE}catalog/sequence`, viewport: { width: 1440, height: 900 }, colorScheme: "light" });
      await onScreen(page, "category", "時系列図の分類の頁が出ない");
      const stageLook = (): Promise<string[]> => figureLooks(page, catalogSel("stage"));
      const pick = (value: string): Promise<string[]> => page.locator(catalogSel("palette")).selectOption(value);

      // 色味の切替は「サイトと同じ」と 3 つの色味。最初は「サイトと同じ」で、帯の色味で描く
      // 右の見本は後から読む見本が届いてから出るので、切替が出るまで待つ (#3246)
      await expect
        .poll(() => page.evaluate(() => [...document.querySelectorAll<HTMLOptionElement>('[data-catalog="palette"] option')].map((o) => o.value)), {
          ...WAIT,
          message: "見本の色味の切替が「サイトと同じ」と 3 つの色味でない",
        })
        .toEqual(["site", ...PALETTE_IDS]);
      expect(await page.locator(catalogSel("palette")).inputValue(), "見本の色味の切替が「サイトと同じ」で始まらない").toBe("site");
      await expect.poll(stageLook, { ...WAIT, message: "見本の図が帯の色味で描かれない" }).toEqual([figureLook(DEFAULT_PALETTE, "light")]);

      // 見本の色味を選ぶと、その図だけが替わり、サイトの色は替わらない
      await pick("night");
      await expect.poll(stageLook, { ...WAIT, message: "見本の色味を夜の計器にしても図が替わらない" }).toEqual([figureLook("night", "light")]);
      expect(await colorsOf(page), "見本の色味を選ぶとサイトの色まで替わった").toEqual(rgbOf(siteLook(DEFAULT_PALETTE, "light")));

      // 帯の色味を替えてから「サイトと同じ」に戻すと、帯の色味で描く
      await page.locator(`${siteSel("palette")} ${siteSel("palette-clear")}`).click();
      await pick("site");
      await expect.poll(stageLook, { ...WAIT, message: "「サイトと同じ」に戻しても帯の色味で描かれない" }).toEqual([figureLook("clear", "light")]);
    },
  );


  it(
    "site-palette-switch-recolors-site-and-diagrams",
    async () => {
      const { page } = await site.open({ path: BASE, viewport: { width: 1440, height: 900 }, colorScheme: "light" });
      await onScreen(page, "home", "概要の頁が出ない");
      const header = `${siteSel("header")} ${siteSel("palette")}`;
      const switchOf = (): Promise<{ id: string; pressed: boolean; label: string | null }[]> =>
        page.evaluate(
          (s) =>
            [...document.querySelectorAll<HTMLButtonElement>(`${s} button`)].map((b) => ({
              id: b.dataset.site ?? "",
              pressed: b.getAttribute("aria-pressed") === "true",
              label: b.getAttribute("aria-label"),
            })),
          header,
        );
      const pressedOnly = (id: string): { id: string; pressed: boolean; label: string | null }[] =>
        PALETTE_IDS.map((p) => ({ id: `palette-${p}`, pressed: p === id, label: TEXT.ja.paletteNames[p] ?? null }));

      // 帯に全ての色味が並び、紙と墨を選んでいる
      expect(await switchOf(), "帯の色味の切替が全ての色味でないか、紙と墨を選んでいない").toEqual(pressedOnly(DEFAULT_PALETTE));

      // 色味を選ぶと、サイトの色と頁の全部の図が替わる
      const figures = 1 + HOME_USES.length;
      for (const id of PALETTE_IDS) {
        await page.locator(`${header} ${siteSel(`palette-${id}`)}`).click();
        await expect.poll(() => colorsOf(page), { ...WAIT, message: `${id} を選んでもサイトの色が替わらない` }).toEqual(rgbOf(siteLook(id, "light")));
        await expect.poll(() => figureLooks(page), { ...WAIT, message: `${id} を選んでも概要の図が替わらない` }).toEqual(Array(figures).fill(figureLook(id, "light")));
        expect(await switchOf(), `${id} を選んだ印が付かない`).toEqual(pressedOnly(id));
      }

      // 色味を選んだ後に明暗を切り替えると、選んだ色味の暗い側になる
      await page.locator(`${header} ${siteSel("palette-clear")}`).click();
      await page.locator(siteSel("theme")).click();
      await expect.poll(() => colorsOf(page), { ...WAIT, message: "澄んだ色で明暗を替えても暗い側の値にならない" }).toEqual(rgbOf(siteLook("clear", "dark")));
      await expect.poll(() => figureLooks(page), { ...WAIT, message: "澄んだ色で明暗を替えても図が暗い側にならない" }).toEqual(Array(figures).fill(figureLook("clear", "dark")));

      // 頁を開き直しても選んだ色味が残る。明暗は端末の設定に戻る
      await page.reload();
      await onScreen(page, "home", "開き直した概要の頁が出ない");
      await expect.poll(() => colorsOf(page), { ...WAIT, message: "開き直すと選んだ色味が残らない" }).toEqual(rgbOf(siteLook("clear", "light")));
      expect(await switchOf(), "開き直すと選んだ色味の印が残らない").toEqual(pressedOnly("clear"));

      // 編集画面とカタログの図も帯の色味で描く
      await page.locator(`${siteSel("nav")} a`, { hasText: "編集画面" }).click();
      await onScreen(page, "editor", "帯から編集画面へ移れない");
      await expect.poll(() => figureLooks(page, '[data-playground="stage"]'), { ...WAIT, message: "編集画面の図が帯の色味で描かれない" }).toEqual([figureLook("clear", "light")]);
      await page.goto(`${site.origin}${BASE}catalog/sequence`);
      await onScreen(page, "category", "分類の頁が出ない");
      await expect.poll(() => figureLooks(page, catalogSel("stage")), { ...WAIT, message: "分類の頁の図が帯の色味で描かれない" }).toEqual([figureLook("clear", "light")]);

      // 幅 720 以下では、畳んだ行き先の面の中で色味を切り替える
      const narrow = await site.open({ path: BASE, viewport: { width: 390, height: 844 }, colorScheme: "light" });
      await onScreen(narrow.page, "home", "幅 390 で概要の頁が出ない");
      expect(await narrow.page.locator(header).isVisible(), "幅 390 で帯の色味の切替が畳まれない").toBe(false);
      await narrow.page.locator(siteSel("menu")).click();
      await narrow.page.locator(`${siteSel("sheet-palette")} ${siteSel("palette-night")}`).click();
      await expect.poll(() => colorsOf(narrow.page), { ...WAIT, message: "畳んだ面の色味の切替でサイトの色が替わらない" }).toEqual(rgbOf(siteLook("night", "light")));
    },
  );


  it(
    "site-palette-switch-draws-arcade",
    async () => {
      // bitsumi の頁と同じ色の色味 (#3341)。帯と編集画面と見本帳の切替に出て、選ぶとその色味で描き、サイトの差し色が緑になる
      expect(PALETTE_IDS, "色味の表に arcade が無い").toContain("arcade");
      const green = PALETTES.arcade?.light["t-green"] ?? "";
      const { page } = await site.open({ path: BASE, viewport: { width: 1440, height: 900 }, colorScheme: "light" });
      await onScreen(page, "home", "概要の頁が出ない");
      const button = page.locator(`${siteSel("header")} ${siteSel("palette")} ${siteSel("palette-arcade")}`);
      await expect.poll(() => button.count(), { ...WAIT, message: "帯の色味の切替にアーケードの画面が無い" }).toBe(1);
      expect(await button.getAttribute("aria-label"), "帯のアーケードの画面の釦の名前").toBe("アーケードの画面");
      await button.click();
      await expect.poll(() => colorsOf(page), { ...WAIT, message: "アーケードの画面を選んでもサイトの色が替わらない" }).toEqual(rgbOf(siteLook("arcade", "light")));
      expect((await colorsOf(page)).accent, "アーケードの画面のサイトの差し色が緑でない").toBe(rgb(green));
      await expect
        .poll(() => figureLooks(page), { ...WAIT, message: "アーケードの画面を選んでも概要の図が替わらない" })
        .toEqual(Array(1 + HOME_USES.length).fill(figureLook("arcade", "light")));
      await page.locator(siteSel("lang-en")).click();
      await expect.poll(() => button.getAttribute("aria-label"), { ...WAIT, message: "英語の頁のアーケードの画面の釦の名前" }).toBe("Arcade screen");

      // 編集画面の色味の丸
      const editor = await site.open({ path: `${BASE}editor`, viewport: { width: 1440, height: 900 }, colorScheme: "light" });
      await onScreen(editor.page, "editor", "編集画面が出ない");
      const stage = '[data-playground="stage"]';
      await expect.poll(() => figureLooks(editor.page, stage), { ...WAIT, message: "編集画面の図が出ない" }).toHaveLength(1);
      await editor.page.locator(`.pg-stage-bar [data-playground="palette-arcade"]`).click();
      await expect.poll(() => figureLooks(editor.page, stage), { ...WAIT, message: "編集画面の色味の丸でアーケードの画面にならない" }).toEqual([figureLook("arcade", "light")]);

      // 見本帳の見本の色味の切替
      const catalog = await site.open({ path: `${BASE}catalog/sequence`, viewport: { width: 1440, height: 900 }, colorScheme: "light" });
      await onScreen(catalog.page, "category", "時系列図の分類の頁が出ない");
      await expect
        .poll(() => catalog.page.evaluate(() => [...document.querySelectorAll<HTMLOptionElement>('[data-catalog="palette"] option')].map((o) => o.value)), {
          ...WAIT,
          message: "見本の色味の切替にアーケードの画面が無い",
        })
        .toContain("arcade");
      await catalog.page.locator(catalogSel("palette")).selectOption("arcade");
      await expect
        .poll(() => figureLooks(catalog.page, catalogSel("stage")), { ...WAIT, message: "見本の色味をアーケードの画面にしても図が替わらない" })
        .toEqual([figureLook("arcade", "light")]);
    },
  );


  it(
    "site-palette-switch-fits-four-at-390",
    async () => {
      // 色味を 4 つ (#3341)、5 つ (#3398) にしても、幅 390 の畳んだ行き先の面の色味の札は 1 行に収まり、指で押せる大きさを保つ
      const { page } = await site.open({ path: BASE, viewport: { width: 390, height: 844 }, colorScheme: "light" });
      await onScreen(page, "home", "幅 390 で概要の頁が出ない");
      await page.locator(siteSel("menu")).click();
      const swatches = (): Promise<{ id: string; top: number; width: number; height: number; right: number }[]> =>
        page.evaluate((s) => {
          return [...document.querySelectorAll<HTMLElement>(`${s} [data-site^="palette-"]`)].map((b) => {
            const r = b.getBoundingClientRect();
            return { id: b.dataset.site ?? "", top: Math.round(r.top), width: Math.round(r.width), height: Math.round(r.height), right: Math.round(r.right) };
          });
        }, siteSel("sheet-palette"));
      await expect.poll(async () => (await swatches()).length, { ...WAIT, message: "幅 390 の畳んだ面の色味の札が 5 つでない" }).toBe(5);
      const found = await swatches();
      expect(found.map((s) => s.id), "幅 390 の畳んだ面にアーケードの画面か紺と生成りの札が無い").toEqual(expect.arrayContaining(["palette-arcade", "palette-sea"]));
      expect(found.filter((s) => s.width < 44 || s.height < 44).map((s) => `${s.id} ${s.width}x${s.height}`), "幅 390 で 44px に届かない色味の札").toEqual([]);
      expect(new Set(found.map((s) => s.top)).size, `幅 390 で色味の札が 1 行に収まらない: ${found.map((s) => `${s.id} 上 ${s.top}`).join(", ")}`).toBe(1);
      expect(Math.max(...found.map((s) => s.right)), "幅 390 で色味の札が頁の右へはみ出す").toBeLessThanOrEqual(390);
    },
  );


  it(
    "docs-sections-cover-notation-and-examples-parse",
    async () => {
      const { page } = await site.open({ path: `${BASE}docs`, viewport: { width: 1440, height: 900 } });
      await onScreen(page, "docs", "使い方の頁が出ない");

      // 前置き。見出しと前置きの文と、編集画面とカタログへの釦
      await expect.poll(async () => (await docsOf(page)).title, { ...WAIT, message: "使い方の頁に見出しが無い" }).toBe(TEXT.ja.site.screens.docs.title);
      const head = await docsOf(page);
      expect(head.lead, "使い方の頁に前置きの文が無い").not.toBe("");
      expect(head.ctas, "前置きの釦が編集画面とカタログへ向かない").toEqual([`${BASE}editor`, `${BASE}catalog`]);

      const commands = readmeCommands();
      const options = cliOptions();
      expect(commands.length, "package の README から命令を読めない").toBeGreaterThan(0);
      expect(options.length, "書き出しの命令の使い方の表示から設定を読めない").toBeGreaterThan(0);
      const placeExample = readmePlaceExample();
      expect(placeExample, "package の README から頁に置く節の例を読めない").toContain("mountDiagram(");

      const expectDocs = async (lang: Lang): Promise<void> => {
        // 節の例は file に置き、どれも読めて検査を通り、その節で説明する要素を使う。記法の語はどちらの言葉の頁でも英語 (#3137)
        const words = ["sequence", "architecture", "state", "git", "time", "tree", "try", "chart", "pipe", "flow"];
        const want = DOC_SECTIONS.map((id, i) => {
          const text = WITHOUT_EXAMPLE.includes(id) ? undefined : docsExample(id, lang);
          const diagram = text === undefined ? undefined : docsDiagram(id, text);
          if (!WITHOUT_EXAMPLE.includes(id)) {
            expect(text, `${lang} の ${id} の節の例の file (src/docs/examples/) が無い`).toBeDefined();
            expect(diagram, `${lang} の ${id} の節の例が読めないか検査を通らない`).toBeDefined();
            expect(diagram !== undefined && DOC_COVERS[id]?.(diagram), `${lang} の ${id} の節の例がその節の記法の要素を使わない`).toBe(true);
          }
          if (text !== undefined && id !== "json") {
            const first = text.split("\n").find((line) => line.trim() !== "" && !line.startsWith("//")) ?? "";
            expect(words, `${lang} の ${id} の節の例が頁の言葉の語で書かれない`).toContain(first.split(" ")[0]);
          }
          return { id, no: String(i + 1).padStart(2, "0"), code: text ?? null, names: diagram ? [...new Set(drawnNames(diagram))].sort() : [] };
        });

        // 記法の全ての行の種類を、節の例のどれかが使い、節の本文のどれかが語で説明する
        // 線の行は箱の名札の後ろに `->` が来る行で、配管の図の `move` と `calc` の行のように中に `->` を書く行は頭の語で数える (#3389)
        const used = new Set(want.flatMap((s) => (s.code ?? "").split("\n").map((line) => (EDGE_FORM.test(line.trim()) ? "->" : (line.trim().split(/\s+/u)[0] ?? "")))));
        const missing = LINE_KINDS.filter((kind) => !used.has(kind));
        expect(missing, `${lang} の節の例が使わない行の種類`).toEqual([]);

        // 節は今の記法の要素の順に並び、番号は並びから付く。例の字は file のままで、隣の図はその例の箱を描く
        await expect
          .poll(async () => (await docsOf(page)).sections.map((s) => ({ id: s.id, no: s.no, code: s.code?.trimEnd() ?? null, names: s.names })), {
            ...WAIT,
            message: `${lang} の使い方の節が記法の要素の順に並ばないか、例の字と図が file の例と合わない`,
          })
          .toEqual(want);
        const { sections, cards } = await docsOf(page);
        // 決まりの節は決まり 4 つを番号付きで並べ、同じ言葉の repo の README の決まりと同じ文 (#3138、#3317)
        const rules = sections.find((s) => s.id === "rules")?.rules ?? [];
        expect(rules, `${lang} の決まりの節に決まりが 4 つ並ばない`).toHaveLength(4);
        expect(rules, `${lang} の使い方の頁の決まりが同じ言葉の README の決まりと違う`).toEqual(readmeRules(lang));
        const prose = sections.map((s) => s.prose).join("\n");
        const unexplained = LINE_KINDS.filter((kind) => !new RegExp(`(^|[^A-Za-z-])${kind}($|[^A-Za-z-])`, "u").test(prose));
        expect(unexplained, `${lang} の節の本文が語で説明しない行の種類`).toEqual([]);
        for (const s of sections) {
          expect(s.title !== "" && s.texts >= 1, `${lang} の ${s.id} の節に見出しか本文が無い`).toBe(true);
          const [path, hash] = (s.cta ?? "").split("#");
          expect(s.cta?.startsWith(BASE), `${lang} の ${s.id} の節にサイトの中への出口が無い`).toBe(true);
          if (hash !== undefined) expect(path === `${BASE}docs` && (DOC_SECTIONS as readonly string[]).includes(hash), `${lang} の ${s.id} の節の出口が使い方の節を指さない`).toBe(true);
        }

        // 書き出しの節は、README と同じ命令を図を描かない囲みに出し、命令の使い方の表示にある設定をすべて説明する
        const exporting = sections.find((s) => s.id === "export");
        const lines = (exporting?.commands ?? []).flatMap((c) => c.split("\n")).map((line) => line.trim()).filter((line) => line !== "");
        for (const line of commands.filter((l) => !l.startsWith("dragon "))) expect(lines, `${lang} の書き出しの節に README の命令「${line}」が無い`).toContain(line);
        expect(lines.some((line) => line.startsWith("dragon export ")), `${lang} の書き出しの節に dragon export の命令が無い`).toBe(true);
        for (const option of options) expect(exporting?.body ?? "", `${lang} の書き出しの節に設定 ${option} の説明が無い`).toContain(option);

        // 頁に置く節は、README の頁に置く節と同じ code を図を描かない囲みに 1 つだけ出す (#3155)
        const placing = sections.find((s) => s.id === "place");
        expect(placing?.commands.map((c) => c.trimEnd()), `${lang} の頁に置く節の code が README の頁に置く節の例と違う`).toEqual([placeExample]);

        // 特長の札 6 つ。名前は行き先の節の見出しで、説明を持つ
        expect(cards.length, `${lang} の特長の札が 6 つ並ばない`).toBe(6);
        expect(new Set(cards.map((c) => c.href)).size, `${lang} の特長の札の行き先が重なる`).toBe(cards.length);
        for (const c of cards) {
          const target = sections.find((s) => `#${s.id}` === c.href);
          expect(target, `${lang} の特長の札「${c.name}」の行き先 ${c.href} が節でない`).toBeDefined();
          expect(c.name, `${lang} の特長の札の名前が行き先の節の見出しでない`).toBe(target?.title);
          expect(c.text, `${lang} の特長の札「${c.name}」に説明が無い`).not.toBe("");
        }
      };
      await expectDocs("ja");

      // 特長の札を押すと、同じ頁のその節へ移る
      const card = page.locator(docsSel("card")).last();
      const href = (await docsOf(page)).cards.at(-1)?.href ?? "";
      await card.click();
      await expect.poll(() => page.evaluate(() => location.hash), { ...WAIT, message: "特長の札を押してもアドレスが節を指さない" }).toBe(href);
      expect(await page.evaluate(() => location.pathname), "特長の札を押すと使い方の頁から離れる").toBe(`${BASE}docs`);
      // 節の頭は上の帯 (60px) の 24px 下で止まる。下へずれると節の頭が画面の中ほどに来る (#3103)
      await expect
        .poll(
          () =>
            page.evaluate((id) => {
              const top = document.getElementById(id)?.getBoundingClientRect().top;
              return top === undefined ? null : Math.round(top);
            }, href.slice(1)),
          { ...WAIT, message: "特長の札を押しても行き先の節の上端が上の帯の 24px 下 (84px) に来ない" },
        )
        .toBe(84);

      // 英語に替えると、節の例が英語の語の記法になる
      await page.locator(siteSel("lang-en")).click();
      await expect.poll(async () => (await docsOf(page)).title, { ...WAIT, message: "英語に替えても使い方の見出しが英語にならない" }).toBe(TEXT.en.site.screens.docs.title);
      await expectDocs("en");
    },
  );


  it(
    "notation-old-to-new-table-matches-the-parser",
    async () => {
      // 前の形で書いていた人が書き直すための対応表 (#3138)。新しい形の欄の行の頭の語は、読む部品が読む語とちょうど一致し、
      // 属性の鍵はその行で読む部品が受け付ける鍵だけを使う。`CHANGELOG.ja.md` は日本語の頁と、`CHANGELOG.md` は英語の頁と同じ表を持つ (#3321)
      const words = parserWords();
      expect(words.kinds.length > 0 && words.heads.length > 0, "読む部品の誤りの文から図の種類と行の頭の語を引けない").toBe(true);
      // 後から足した語として外す語は、読む部品が今も読む語に限る
      const known = [...words.kinds, ...words.heads];
      expect(ADDED_AFTER_MIGRATION.filter((word) => !known.includes(word)), "対応表の後に足した語に、読む部品が読まない語がある").toEqual([]);
      for (const [line, keys] of Object.entries(words.attrs)) expect(keys.length, `読む部品の誤りの文から ${line} の行の属性の鍵を引けない`).toBeGreaterThan(0);

      const { page } = await site.open({ path: `${BASE}docs`, viewport: { width: 1440, height: 900 } });
      await onScreen(page, "docs", "使い方の頁が出ない");
      const tableOf = async (): Promise<{ old: string; forms: string[] }[]> => (await docsOf(page)).sections.find((s) => s.id === "migrate")?.migration ?? [];
      const expectTable = async (lang: Lang): Promise<void> => {
        await expect.poll(async () => (await tableOf()).length, { ...WAIT, message: `${lang} の使い方の頁に前の形と新しい形の対応表が無い` }).toBeGreaterThan(0);
        const rows = await tableOf();
        for (const row of rows) expect(row.old !== "" && row.forms.length > 0, `${lang} の対応表に、前の形か新しい形の欄が空の行がある: ${JSON.stringify(row)}`).toBe(true);
        const forms = rows.flatMap((row) => row.forms);
        const heads = [...new Set(forms.filter((form) => !EDGE_FORM.test(form)).map((form) => form.split(/\s+/u)[0] ?? ""))].sort();
        expect(heads, `${lang} の対応表の新しい形の行の頭の語が、読む部品の語と一致しない`).toEqual(known.filter((word) => !ADDED_AFTER_MIGRATION.includes(word)).sort());
        for (const form of forms) {
          const keys = [...(/\[([^\]]*)\]\s*$/u.exec(form)?.[1] ?? "").matchAll(/(?:^|,\s*)([a-z]+):/gu)].map((m) => m[1] ?? "");
          const line = EDGE_FORM.test(form) ? "->" : (form.split(/\s+/u)[0] ?? "");
          const unknown = keys.filter((key) => !(words.attrs[line] ?? []).includes(key));
          expect(unknown, `${lang} の対応表の ${form} に、読む部品がその行で受け付けない属性の鍵がある`).toEqual([]);
        }
      };
      const pageTable = (): Promise<string[][]> =>
        page.evaluate(() =>
          [...document.querySelectorAll('#migrate [data-docs="migration"] tbody tr')].map((tr) => [...tr.querySelectorAll("td")].map((td) => td.textContent?.trim() ?? "")),
        );
      await expectTable("ja");
      expect(changelogMigration("ja"), "CHANGELOG.ja.md の対応表が、使い方の頁の日本語の対応表と違う").toEqual(await pageTable());

      await page.locator(siteSel("lang-en")).click();
      await expect.poll(async () => (await docsOf(page)).title, { ...WAIT, message: "英語に替えても使い方の見出しが英語にならない" }).toBe(TEXT.en.site.screens.docs.title);
      await expectTable("en");
      expect(changelogMigration("en"), "CHANGELOG.md の対応表が、使い方の頁の英語の対応表と違う").toEqual(await pageTable());
    },
  );


  it(
    "version-badge-from-package",
    async () => {
      expect(VERSION, "packages/dragon/package.json から版を読めない").toMatch(/^v\d+\.\d+$/u);
      const eyebrowOf = (page: Page, sel: string): Promise<string> => page.evaluate((s) => document.querySelector(s)?.textContent?.trim() ?? "", sel);
      for (const lang of ["ja", "en"] as const) {
        const locale = lang === "ja" ? "ja-JP" : "en-US";
        // 概要の呼びかけの版の札
        const home = await site.open({ path: BASE, locale });
        await onScreen(home.page, "home", "概要の頁が出ない");
        await expect.poll(() => eyebrowOf(home.page, homeSel("version")), { ...WAIT, message: `${lang} の概要の版の札が package の版でない` }).toBe(VERSION);
        // 更新履歴の前置きの札
        const release = await site.open({ path: `${BASE}release-notes`, locale });
        await onScreen(release.page, "release-notes", "更新履歴の頁が出ない");
        await expect.poll(async () => wordsOf((await releaseOf(release.page)).eyebrow), { ...WAIT, message: `${lang} の更新履歴の札に package の版が無い` }).toContain(VERSION);
        // 使い方の前置きの札
        const docs = await site.open({ path: `${BASE}docs`, locale });
        await onScreen(docs.page, "docs", "使い方の頁が出ない");
        await expect.poll(async () => wordsOf(await eyebrowOf(docs.page, docsSel("eyebrow"))), { ...WAIT, message: `${lang} の使い方の札に package の版が無い` }).toContain(VERSION);
      }
    },
  );


  it(
    "release-notes-shows-version-and-changelog-link",
    async () => {
      // 釦は日本語の頁では日本語の変更履歴を、英語の頁では英語の変更履歴を開く (#3321)
      const files = { ja: "CHANGELOG.ja.md", en: "CHANGELOG.md" } as const;
      for (const file of Object.values(files)) expect(existsSync(join(root, file)), `釦が指す ${file} が repo に無い`).toBe(true);
      for (const lang of ["ja", "en"] as const) {
        const changelog = `${REPO}/blob/main/${files[lang]}`;
        const { page } = await site.open({ path: `${BASE}release-notes`, locale: lang === "ja" ? "ja-JP" : "en-US" });
        await onScreen(page, "release-notes", "更新履歴の頁が出ない");
        await expect.poll(async () => (await releaseOf(page)).title, { ...WAIT, message: `${lang} の更新履歴の見出しが出ない` }).toBe(TEXT[lang].site.screens["release-notes"].title);
        const release = await releaseOf(page);
        expect(release.crumb, `${lang} の更新履歴の道筋が概要へ戻らない`).toEqual([BASE]);
        expect(wordsOf(release.eyebrow), `${lang} の更新履歴の札に版が無い`).toContain(VERSION);
        expect(release.lead, `${lang} の更新履歴に説明が無い`).not.toBe("");
        // 釦は変更の記録を GitHub で見る 1 つだけで、新しいタブで開く
        expect(release.links.map((l) => l.href), `${lang} の更新履歴の釦が変更の記録 1 つでない`).toEqual([changelog]);
        expect(release.links[0]?.text, `${lang} の更新履歴の釦に名前が無い`).not.toBe("");
        expect(release.links[0]?.target, `${lang} の更新履歴の釦が新しいタブで開かない`).toBe("_blank");
        expect(release.links[0]?.rel, `${lang} の更新履歴の釦が開いた先に頁を渡す`).toContain("noopener");
      }
    },
  );


  it(
    "not-found-counts-destinations",
    async () => {
      const destinations = [`${BASE}editor`, `${BASE}catalog`, `${BASE}docs`];
      for (const lang of ["ja", "en"] as const) {
        const path = `${BASE}no-such-page`;
        const { page } = await site.open({ path, locale: lang === "ja" ? "ja-JP" : "en-US" });
        await onScreen(page, "not-found", "見つからない頁が出ない");
        await expect.poll(async () => (await notFoundOf(page)).code, { ...WAIT, message: `${lang} の見つからない頁に大きな 404 が無い` }).toBe("404");
        const nf = await notFoundOf(page);
        expect(nf.title, `${lang} の見つからない頁に見出しが無い`).not.toBe("");
        expect(nf.links, `${lang} の見つからない頁の釦が編集画面とカタログと使い方へ向かない`).toEqual(destinations);
        // 説明が言う入口の数は、並んだ釦の数
        const said = [...nf.lead.matchAll(/\d+/gu)].map((m) => Number(m[0]));
        expect(said, `${lang} の見つからない頁の説明の入口の数が釦の数 ${nf.links.length} と合わない (${nf.lead})`).toEqual([nf.links.length]);
        expect(nf.path, `${lang} の見つからない頁に開いた path が出ない`).toBe(path);
      }
    },
  );


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


  it(
    "docs-state-section-follows-regions",
    async ({ onTestFailed }) => {
      for (const lang of ["ja", "en"] as const) {
        const page = await docsPage(lang, onTestFailed);
        await onScreen(page, "docs", `${lang} の使い方の頁が出ない`);
        await expect.poll(async () => (await docsOf(page)).sections.length, { ...WAIT, message: `${lang} の使い方の頁に節が無い` }).toBeGreaterThan(0);
        const { sections } = await docsOf(page);
        const ids = sections.map((s) => s.id);
        expect(ids[ids.indexOf("regions") + 1], `${lang} の区画の節の次が状態遷移図の節でない`).toBe("state");
        const state = sections.find((s) => s.id === "state");
        // 本文は頭の行と始まりと終わりの線と、段より前に書く通らない道を語で説明する
        for (const word of ["state", "start", "finish", "step"]) {
          expect(new RegExp(`(^|[^A-Za-z-])${word}($|[^A-Za-z-])`, "u").test(state?.prose ?? ""), `${lang} の状態遷移図の節の本文が ${word} を説明しない`).toBe(true);
        }
        // 例の図は状態遷移図として、始まりの印 1 つと、始まりと終わりの印を持って描かれる
        await expect
          .poll(
            () =>
              page.evaluate(() => {
                const svg = document.querySelector('section#state [data-docs="example"] svg[data-dragon="figure"]');
                return (svg?.querySelectorAll(".dg-start").length ?? 0) === 1 && (svg?.querySelectorAll("[data-end]").length ?? 0) >= 2;
              }),
            { ...WAIT, message: `${lang} の状態遷移図の節の例が、始まりと終わりの印を持つ状態遷移図として描かれない` },
          )
          .toBe(true);
        expect(state?.cta, `${lang} の状態遷移図の節の出口がカタログの状態遷移図の頁へ向かない`).toBe(`${BASE}catalog/state`);
      }
    },
  );


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


  it(
    "docs-git-section-follows-state",
    async ({ onTestFailed }) => {
      for (const lang of ["ja", "en"] as const) {
        const page = await docsPage(lang, onTestFailed);
        await onScreen(page, "docs", `${lang} の使い方の頁が出ない`);
        await expect.poll(async () => (await docsOf(page)).sections.length, { ...WAIT, message: `${lang} の使い方の頁に節が無い` }).toBeGreaterThan(0);
        const { lead, sections } = await docsOf(page);
        // 前置きは記法の要素の並びに枝分かれの図を挙げる
        expect(lead, `${lang} の使い方の頁の前置きが枝分かれの図を挙げない`).toMatch(lang === "ja" ? /枝分かれの図/u : /git graph/iu);
        const ids = sections.map((s) => s.id);
        expect(ids[ids.indexOf("state") + 1], `${lang} の状態遷移図の節の次が枝分かれの図の節でない`).toBe("git");
        const git = sections.find((s) => s.id === "git");
        // 本文は頭の行と枝の宣言と commit の行の語と、枝を切る行と札を動かす線を語で説明する
        for (const word of ["git", "branch", "commit", "on", "copy", "merge", "from", "HEAD"]) {
          expect(new RegExp(`(^|[^A-Za-z-])${word}($|[^A-Za-z-])`, "u").test(git?.prose ?? ""), `${lang} の枝分かれの図の節の本文が ${word} を説明しない`).toBe(true);
        }
        // 例の図は、commit の丸と枝の札を持つ枝分かれの図として描かれる
        await expect
          .poll(
            () =>
              page.evaluate(() => {
                const svg = document.querySelector('section#git [data-docs="example"] svg[data-dragon="figure"]');
                return (svg?.querySelectorAll("[data-commit]").length ?? 0) >= 5 && (svg?.querySelectorAll("[data-ref]").length ?? 0) >= 3;
              }),
            { ...WAIT, message: `${lang} の枝分かれの図の節の例が、commit の丸と枝の札を持つ枝分かれの図として描かれない` },
          )
          .toBe(true);
        expect(git?.cta, `${lang} の枝分かれの図の節の出口がカタログの枝分かれの図の頁へ向かない`).toBe(`${BASE}catalog/git`);
      }
    },
  );


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


  it(
    "docs-time-section-follows-git",
    async ({ onTestFailed }) => {
      for (const lang of ["ja", "en"] as const) {
        const page = await docsPage(lang, onTestFailed);
        await onScreen(page, "docs", `${lang} の使い方の頁が出ない`);
        await expect.poll(async () => (await docsOf(page)).sections.length, { ...WAIT, message: `${lang} の使い方の頁に節が無い` }).toBeGreaterThan(0);
        const { lead, sections } = await docsOf(page);
        // 前置きは記法の要素の並びに時間軸の図を挙げる
        expect(lead, `${lang} の使い方の頁の前置きが時間軸の図を挙げない`).toMatch(lang === "ja" ? /時間軸の図/u : /time diagram/iu);
        const ids = sections.map((s) => s.id);
        expect(ids[ids.indexOf("git") + 1], `${lang} の枝分かれの図の節の次が時間軸の図の節でない`).toBe("time");
        const time = sections.find((s) => s.id === "time");
        // 本文は頭の行と 5 つの宣言と、段の中の 3 つの行と、物差しの欄を語で説明する
        for (const word of ["time", "scale", "period", "row", "point", "zoom", "now", "mark", "span", "meter"]) {
          expect(new RegExp(`(^|[^A-Za-z-])${word}($|[^A-Za-z-])`, "u").test(time?.prose ?? ""), `${lang} の時間軸の図の節の本文が ${word} を説明しない`).toBe(true);
        }
        // 例の図は、針と印の列と節目を持つ時間軸の図として描かれる
        await expect
          .poll(
            () =>
              page.evaluate(() => {
                const svg = document.querySelector('section#time [data-docs="example"] svg[data-dragon="figure"]');
                return (
                  (svg?.querySelectorAll("[data-needle]").length ?? 0) === 1 &&
                  (svg?.querySelectorAll("[data-row]").length ?? 0) >= 1 &&
                  (svg?.querySelectorAll("[data-point]").length ?? 0) >= 2
                );
              }),
            { ...WAIT, message: `${lang} の時間軸の図の節の例が、針と印の列と節目を持つ時間軸の図として描かれない` },
          )
          .toBe(true);
        expect(time?.cta, `${lang} の時間軸の図の節の出口がカタログの時間軸の図の頁へ向かない`).toBe(`${BASE}catalog/time`);
      }
    },
  );


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


  it(
    "docs-tree-section-follows-time",
    async ({ onTestFailed }) => {
      for (const lang of ["ja", "en"] as const) {
        const page = await docsPage(lang, onTestFailed);
        await onScreen(page, "docs", `${lang} の使い方の頁が出ない`);
        await expect.poll(async () => (await docsOf(page)).sections.length, { ...WAIT, message: `${lang} の使い方の頁に節が無い` }).toBeGreaterThan(0);
        const { lead, sections } = await docsOf(page);
        // 前置きは記法の要素の並びに木の図を挙げる
        expect(lead, `${lang} の使い方の頁の前置きが木の図を挙げない`).toMatch(lang === "ja" ? /木の図/u : /tree diagram/iu);
        const ids = sections.map((s) => s.id);
        expect(ids[ids.indexOf("time") + 1], `${lang} の時間軸の図の節の次が木の図の節でない`).toBe("tree");
        const tree = sections.find((s) => s.id === "tree");
        // 本文は頭の行と 2 つの宣言と、親と子をつなぐ語と、値の属性を語で説明する
        for (const word of ["tree", "leaf", "node", "of", "hash"]) {
          expect(new RegExp(`(^|[^A-Za-z-])${word}($|[^A-Za-z-])`, "u").test(tree?.prose ?? ""), `${lang} の木の図の節の本文が ${word} を説明しない`).toBe(true);
        }
        // 例の図は、葉 4 つと親 3 つの箱と、根の印と、親子を結ぶ 6 本の木の線を持つ木の図として描かれる
        await expect
          .poll(
            () =>
              page.evaluate(() => {
                const svg = document.querySelector('section#tree [data-docs="example"] svg[data-dragon="figure"]');
                return {
                  nodes: svg?.querySelectorAll("[data-tree-node]").length ?? 0,
                  roots: svg?.querySelectorAll("[data-tree-root]").length ?? 0,
                  links: svg?.querySelectorAll("[data-tree-link]").length ?? 0,
                };
              }),
            { ...WAIT, message: `${lang} の木の図の節の例が、木の箱と木の線を持つ木の図として描かれない` },
          )
          .toEqual({ nodes: 7, roots: 1, links: 6 });
        expect(tree?.cta, `${lang} の木の図の節の出口がカタログの木の図の頁へ向かない`).toBe(`${BASE}catalog/tree`);
      }
    },
  );


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

  it(
    "docs-extend-section-follows-pipe",
    async ({ onTestFailed }) => {
      for (const lang of ["ja", "en"] as const) {
        const page = await docsPage(lang, onTestFailed);
        await onScreen(page, "docs", `${lang} の使い方の頁が出ない`);
        await expect.poll(async () => (await docsOf(page)).sections.length, { ...WAIT, message: `${lang} の使い方の頁に節が無い` }).toBeGreaterThan(0);
        const { sections } = await docsOf(page);
        const ids = sections.map((s) => s.id);
        expect(ids[ids.indexOf("pipe") + 1], `${lang} の配管の図の節の次がブロックを足す節でない`).toBe("extend");
        const extend = sections.find((s) => s.id === "extend");
        // 本文は定義の版の行と、定義を囲む語と、元と形と色の役の語と、図で `+<名前>` と書くことを説明する
        for (const word of ["blocks 1", "block", "base", "shape", "color", "end"]) {
          expect(new RegExp(`(^|[^A-Za-z-])${word}($|[^A-Za-z-])`, "u").test(extend?.prose ?? ""), `${lang} のブロックを足す節の本文が ${word} を説明しない`).toBe(true);
        }
        expect(extend?.prose ?? "", `${lang} のブロックを足す節の本文が、図で + を付けて書くことを説明しない`).toMatch(/\+<[^>]+>|\+[a-z]+/u);
      }
    },
  );

  it(
    "docs-extend-example-draws-user-blocks",
    async ({ onTestFailed }) => {
      for (const lang of ["ja", "en"] as const) {
        const text = docsExample("extend", lang);
        const parsed = text === undefined ? undefined : parseNotation(text);
        // 足した箱は定義に書いた絵柄 (Tabler の石の橋) で描き、形の path は足した印のブロックが教える (#3489)
        const blocks = parsed?.ok ? (parsed.diagram.define?.blocks ?? []) : [];
        const icon = blocks.find((b) => b.base === "box")?.icon;
        const path = blocks.find((b) => b.base === "icon")?.path;
        expect(icon, `${lang} のブロックを足す節の例が、足した箱の絵柄を定義しない`).toBeDefined();
        expect(path, `${lang} のブロックを足す節の例が、足した印の path を定義しない`).toBeDefined();
        // 定義の絵柄の形は、同じ絵柄を箱の行に書いて既定の入口で描いた形と比べる
        const sample = parseNotation(["architecture 絵柄", "", "box a as A", `box b as B [icon: ${icon}]`, "", "step 見る", "  say 見る。", "  a -> b: 見る", ""].join("\n"));
        const glyph = sample.ok ? /class="dg-gl"[^>]* d="([^"]+)"/u.exec(renderDiagram(sample.diagram).svg)?.[1] : undefined;
        expect(glyph, `${lang} の箱の行に書いた ${icon} が既定の入口で描かれない`).toBeDefined();
        const page = await docsPage(lang, onTestFailed);
        await onScreen(page, "docs", `${lang} の使い方の頁が出ない`);
        // 節の例の図が描かれ、足した箱に定義の絵柄が、受け取る側の箱に足した印の path が描かれる
        await expect
          .poll(
            () =>
              page.evaluate(
                ([g, d]) => {
                  const svg = document.querySelector('section#extend [data-docs="example"] svg[data-dragon="figure"]');
                  if (svg === null) return "図が無い";
                  const ds = [...svg.querySelectorAll("path")].map((p) => p.getAttribute("d") ?? "");
                  return !ds.includes(g ?? "?") ? "定義の絵柄が無い" : !ds.some((x) => x.includes(d ?? "?")) ? "印の path が無い" : "描けた";
                },
                [glyph, path?.split(" ").slice(0, 3).join(" ")] as const,
              ),
            { ...WAIT, message: `${lang} のブロックを足す節の例の図が描かれないか、足した箱の絵柄と足した印の path が定義どおりに描かれない` },
          )
          .toBe("描けた");
      }
    },
  );

  it(
    "docs-extend-shows-shared-definitions",
    async ({ onTestFailed }) => {
      for (const lang of ["ja", "en"] as const) {
        const page = await docsPage(lang, onTestFailed);
        await onScreen(page, "docs", `${lang} の使い方の頁が出ない`);
        await expect.poll(async () => (await docsOf(page)).sections.length, { ...WAIT, message: `${lang} の使い方の頁に節が無い` }).toBeGreaterThan(0);
        const commands = (await docsOf(page)).sections.find((s) => s.id === "extend")?.commands ?? [];
        // 定義を 1 つの file に置いて使い回す 2 つの口を、code の枠で示す
        expect(commands.some((c) => c.includes('<link rel="dragon-blocks"')), `${lang} のブロックを足す節に、頁の link で定義の file を読む code の枠が無い`).toBe(true);
        expect(
          commands.some((c) => c.includes("readBlocks(") && /parseNotation\([^)]*blocks/u.test(c)),
          `${lang} のブロックを足す節に、readBlocks で読んだ定義を parseNotation の blocks に渡す code の枠が無い`,
        ).toBe(true);
      }
    },
  );

  it(
    "docs-boxes-lead-to-every-icon",
    async ({ onTestFailed }) => {
      // 使える絵柄の名前は package の絵柄の定義から引き、検査に一覧を書き写さない (#3172)
      const icons = Object.keys(((await import("@cardenelabs/dragon")) as { ICONS?: Readonly<Record<string, string>> }).ICONS ?? {}).sort();
      expect(icons.length, "package の入口から絵柄の定義 (ICONS) を読めない").toBeGreaterThan(0);
      for (const lang of ["ja", "en"] as const) {
        const page = await docsPage(lang, onTestFailed);
        await onScreen(page, "docs", `${lang} の使い方の頁が出ない`);
        // 箱の節から部品「絵」の頁へ移れる
        const link = page.locator(`section#boxes a[href$="${BASE}catalog/part/icon"]`).first();
        await expect.poll(() => link.count(), { ...WAIT, message: `${lang} の箱の節に部品「絵」の頁への案内が無い` }).toBe(1);
        await link.click();
        await expect.poll(() => page.evaluate(() => location.pathname), { ...WAIT, message: `${lang} の箱の節の案内を押しても部品「絵」の頁へ移らない` }).toBe(`${BASE}catalog/part/icon`);
        // 部品「絵」の頁に、全ての絵柄が形と名前で並ぶ
        await expect
          .poll(() => page.evaluate(() => [...document.querySelectorAll('[data-catalog="part-icons"] [data-icon]')].map((el) => el.getAttribute("data-icon") ?? "").sort()), {
            ...WAIT,
            message: `${lang} の部品「絵」の頁に並ぶ絵柄が package の絵柄の定義と合わない`,
          })
          .toEqual(icons);
        const items = await page.evaluate(() =>
          [...document.querySelectorAll('[data-catalog="part-icons"] [data-icon]')].map((el) => ({
            name: el.getAttribute("data-icon") ?? "",
            label: el.textContent?.trim() ?? "",
            drawn: (el.querySelector("svg path")?.getAttribute("d") ?? "") !== "",
          })),
        );
        for (const item of items) {
          expect(item.label, `${lang} の部品「絵」の頁の ${item.name} に名前が出ない`).toBe(item.name);
          expect(item.drawn, `${lang} の部品「絵」の頁の ${item.name} に形が描かれない`).toBe(true);
        }
        // 使い方の頁は言語ごとに使い回すので、使い方の頁へ戻して終わる (#3435)
        await page.goBack();
        await onScreen(page, "docs", `${lang} の部品「絵」の頁から使い方の頁へ戻れない`);
      }
    },
  );


  it("docs-readers-open-one-page-per-lang", () => {
    // 使い方の頁を読む件は、言語ごとに使い方の頁を 1 度だけ開いて順に使う (#3435)
    expectOneOpenPerSetting(docsOpens, DOCS_READERS, "使い方の頁を読む件");
    expect([...docsOpens.opens.keys()].sort(), "使い方の頁を読む件が開いた頁の言語が、日本語と英語の 2 つでない").toEqual(["en-US", "ja-JP"]);
  });
});
