/**
 * mdから1つのHTMLの頁を書き出す (#3755)。`dragon export notes.md` とNodeの入口の `exportPage` が呼ぶ。
 *
 * 見出しで頁を組み立て (`read.ts`)、中身をHTMLにし (`markdown.ts`)、組み立て (`layout`) の形に並べて (`html.ts`)、mdの隣か `outDir` に `<名前>.html` を書く。
 * 1行だけに書いた `![名前](path)` は、`.md` をmdとして、`.dragon` を帯つきの図として、ほかの文字のfileを名前を付けたcodeの囲みとして載せる。
 * 画像のfileとURLは画像のまま出し、相対の path は書き出す先から見た path に直す。
 * 載せるfileは、mdの在るフォルダとその下だけを読む。symbolic link は指す先で確かめる。
 *
 * 書き出す前に全ての図の記法を読み、箱の飛び先の頁の中の場所 (`#order`) が頁に在るかを確かめる。
 * 記法は全ての種類を読めるよう、全ての種類の登録 (`kinds/all.ts`) をここで読む。読む側の入口が別の経路で登録しているかに頼らない (#4026)。
 * 誤りが1つでもあれば頁を書かず、fileと行と文の並びを返す。
 * 誤りの文と頁に足す字は `lang` の言葉で書き、渡さない時はmdの本文に仮名か漢字があれば日本語、無ければ英語にする。
 *
 * 説明の頁 (`layout: guide`、#3876) は、頁の頭で読み込んだ用語の file の `###` の見出しを用語、続く段落を説明、引用を例として読む。
 * 本文の用語の file への link (`[用語](glossary.md#用語)`) は押すと札が開く下線にし、札は link を持つ節の終わりに置く。
 * 同じ用語を 2 度書いた用語の file と、用語の file に無い用語への link は、file と行を名指して断る。
 *
 * 日本語と英語の説明の頁のmdを1組で渡すと (#3899)、2つの言葉の中身を持つ頁を1つ書き、頁の名前は先に渡したmdから付ける。
 * 頁の言葉はmdごとに本文から決め、誤りの文は`lang`か先に渡したmdの言葉で書く。
 * 2つが説明の頁でない時、同じ言葉の時、話題、問いの節、`####`の見出し、用語、確かめる問いの数が違う時は、違う所を名指して書かない。
 */
import { readFileSync, realpathSync } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { basename, dirname, extname, isAbsolute, join, relative, resolve, sep } from "node:path";
// 後から読む種類 (判定の表と、手順の図の分かれ道) も読めるよう、全ての種類をここで登録する (#4026)
import "../kinds/all";
import { parseNotation } from "../parser";
import { DEFAULT_LANG, hasKanaKanji } from "../words";
import { pageHtml, pairPageHtml, type RenderedFigure, type RenderedGroup, type RenderedGuide, type RenderedHead, type RenderedItem, type RenderedPage, type RenderedPart, type RenderedTab, type RenderedTerm, withoutLinks } from "./html";
import { codeHtml, escapeHtml, fenceCloses, fenceOpen, figureHtml, headingOf, joinLines, type Line, linesOf, linksIn, quoteOf, type RenderHooks, renderBlocks, renderInline } from "./markdown";
import { type Guide, type Layout, type Part, placeExists, readOutline, type Tab } from "./read";
import { slugger, slugOf } from "./slug";
import { type SectionFigure, sceneLinkErrors } from "./scene-links";
import { LANG_NAMES, MESSAGES, type PageLang, type PageMessages, type PairPart, WORDS } from "./text";

/** 書き出せなかった訳。mdか載せたfileの名前と行と文 */
export interface PageError {
  file: string;
  line: number;
  message: string;
}

/** 書き出した結果。書けた時は書いたfileのpath、書けなかった時は訳の並び */
export type PageExport = { ok: true; path: string } | { ok: false; errors: PageError[] };

export interface PageExportOptions {
  /** 書く先のフォルダ。既定はmdの在るフォルダ */
  outDir?: string;
  /** 頁に足す字と誤りの文の言葉。既定はmdの本文から決める */
  lang?: "ja" | "en";
}

/** 画像として出す拡張子 */
const IMAGES = new Set([".png", ".jpg", ".jpeg", ".gif", ".svg", ".webp", ".avif"]);
/** 載せたmdが載せるmdをたどる深さの上限 */
const DEPTH = 8;
/** scheme を持つ行き先 (`https:` など) */
const SCHEME = /^[a-z][a-z0-9+.-]*:/iu;

/** `escapeHtml` が逃がした字を元に戻す (#3998) */
const unescapeHtml = (text: string): string =>
  text.replaceAll("&lt;", "<").replaceAll("&gt;", ">").replaceAll("&quot;", '"').replaceAll("&#39;", "'").replaceAll("&amp;", "&");

/** 読んでいるfile。`name` は誤りの文に書く名前、`path` は実の path */
interface Source {
  name: string;
  path: string;
}

const detail = (error: unknown): string => (error instanceof Error ? error.message : String(error));

/** `path` が `root` の中か */
const inside = (root: string, path: string): boolean => path === root || path.startsWith(root.endsWith(sep) ? root : `${root}${sep}`);

/** 用語の file の 1 つの用語。`key` は link の `#` の後ろと突き合わせる名前、`entry` は「用語」の話題の中の場所の名前 */
interface Term {
  key: string;
  name: string;
  line: number;
  source: Source;
  text: Line[];
  example: Line[];
  entry: string;
}

/** 用語の file の行を用語に分ける。`###` の見出しが用語、続く中身のうち引用の行が例、ほかの行が説明。最初の `###` より前は読まない */
function glossaryTerms(lines: readonly Line[]): Pick<Term, "name" | "line" | "text" | "example">[] {
  const terms: Pick<Term, "name" | "line" | "text" | "example">[] = [];
  let term: (typeof terms)[number] | undefined;
  let fence: string | undefined;
  for (const line of lines) {
    if (fence !== undefined) {
      if (fenceCloses(line.text, fence)) fence = undefined;
      term?.text.push(line);
      continue;
    }
    const open = fenceOpen(line.text);
    if (open) {
      fence = open.mark;
      term?.text.push(line);
      continue;
    }
    const heading = headingOf(line.text);
    if (heading && heading.level <= 3) {
      term = heading.level === 3 ? { name: heading.text, line: line.line, text: [], example: [] } : undefined;
      if (term) terms.push(term);
      continue;
    }
    const quote = quoteOf(line.text);
    if (quote === undefined) term?.text.push(line);
    else term?.example.push({ text: quote, line: line.line });
  }
  return terms;
}

/** 中身の最初の段落の字。札と目次に書く。段落でない塊 (表や図など) から始まる時は空 */
function summaryOf(lines: readonly Line[], hooks: Pick<RenderHooks, "image">): string {
  const start = lines.findIndex((line) => line.text.trim() !== "");
  if (start < 0) return "";
  const first = lines[start]?.text ?? "";
  if (/^\s*(?:[`~>|!#*+-]|\d+[.)]\s)/u.test(first) || headingOf(first)) return "";
  const paragraph: string[] = [];
  for (const line of lines.slice(start)) {
    if (line.text.trim() === "") break;
    paragraph.push(line.text);
  }
  return withoutLinks(renderInline(joinLines(paragraph), hooks));
}

/**
 * 1組で数を突き合わせる形 (#3899)。話題ごとの行、話題の中の問いの節ごとの行、節の中の`####`の見出しと確かめる問いの行、
 * 頭で読み込んだ用語の file ごとの読み込みの行と file の名前と用語の行
 */
interface Shape {
  topics: { line: number; sections: { line: number; heads: number[]; quizzes: number[] }[] }[];
  glossaries: { line: number; file: string; terms: number[] }[];
}

/** 1つのmdを描いた形。書く前の頁と、頁の言葉と組み立てと数の形。描けない時は訳と、誤りの文に使った言葉 */
type Rendered = { ok: true; page: RenderedPage; lang: PageLang; layout: Layout; shape: Shape } | { ok: false; errors: PageError[]; lang: PageLang };

/** `lines` のうち囲みの外で `test` に当たる行の番号 */
function linesWhere(lines: readonly Line[], test: (text: string) => boolean): number[] {
  const found: number[] = [];
  let fence: string | undefined;
  for (const line of lines) {
    if (fence !== undefined) {
      if (fenceCloses(line.text, fence)) fence = undefined;
      continue;
    }
    fence = fenceOpen(line.text)?.mark;
    if (fence === undefined && test(line.text)) found.push(line.line);
  }
  return found;
}

/** 確かめる問いの開きの行 (`markdown.ts` の `DETAILS` と同じ頭) */
const QUIZ_OPEN = /^ {0,3}<details>/iu;

/**
 * 1組の2つのmdで数が違う所 (#3899)。違う所ごとに、多い側の file と、少ない側に無い最初の物の行を名指し、文に少ない側の file と親の行を書く。
 * 話題が揃う所だけ節を、節が揃う所だけ見出しと確かめる問いを比べる
 */
function shapeErrors(a: { file: string; shape: Shape }, b: { file: string; shape: Shape }, m: PageMessages): PageError[] {
  const errors: PageError[] = [];
  const compare = (what: PairPart, xs: readonly number[], ys: readonly number[], x: { file: string; parent: number }, y: { file: string; parent: number }): boolean => {
    if (xs.length === ys.length) return true;
    const [long, short, longSide, shortSide] = xs.length > ys.length ? [xs, ys, x, y] : [ys, xs, y, x];
    errors.push({ file: longSide.file, line: long[short.length] ?? 1, message: m.pairCount(what, long.length, `${shortSide.file}:${shortSide.parent}`, short.length) });
    return false;
  };
  const top = (file: string) => ({ file, parent: 1 });
  compare("topics", a.shape.topics.map((t) => t.line), b.shape.topics.map((t) => t.line), top(a.file), top(b.file));
  a.shape.topics.forEach((ta, i) => {
    const tb = b.shape.topics[i];
    if (!tb) return;
    if (!compare("sections", ta.sections.map((s) => s.line), tb.sections.map((s) => s.line), { file: a.file, parent: ta.line }, { file: b.file, parent: tb.line })) return;
    ta.sections.forEach((sa, j) => {
      const sb = tb.sections[j];
      if (!sb) return;
      compare("heads", sa.heads, sb.heads, { file: a.file, parent: sa.line }, { file: b.file, parent: sb.line });
      compare("quizzes", sa.quizzes, sb.quizzes, { file: a.file, parent: sa.line }, { file: b.file, parent: sb.line });
    });
  });
  if (!compare("glossaries", a.shape.glossaries.map((g) => g.line), b.shape.glossaries.map((g) => g.line), top(a.file), top(b.file))) return errors;
  a.shape.glossaries.forEach((ga, i) => {
    const gb = b.shape.glossaries[i];
    if (gb) compare("terms", ga.terms, gb.terms, top(ga.file), top(gb.file));
  });
  return errors;
}

/**
 * 書き出す。誤りがあれば頁を書かない。
 * `files` に日本語と英語の説明の頁のmdを1組で渡すと、言葉を替えて読める頁を1つ書く (#3899)
 */
export async function exportPage(files: string | readonly string[], options: PageExportOptions = {}): Promise<PageExport> {
  const [file = "", second, ...extra] = typeof files === "string" ? [files] : files;
  const outDir = resolve(options.outDir ?? dirname(resolve(file)));
  if (extra.length > 0) {
    const m = MESSAGES[options.lang ?? DEFAULT_LANG];
    return { ok: false, errors: extra.map((name) => ({ file: name, line: 1, message: m.tooManyPages(name) })) };
  }
  let html: string;
  if (second === undefined) {
    const one = await renderPage(file, outDir, options.lang);
    if (!one.ok) return { ok: false, errors: one.errors };
    html = pageHtml(one.page);
  } else {
    // 頁の言葉はmdごとに本文から決め、誤りの文は渡した言葉か先に渡したmdの言葉で揃える
    const a = await renderPage(file, outDir, undefined, options.lang);
    const b = await renderPage(second, outDir, undefined, options.lang ?? a.lang);
    const m = MESSAGES[options.lang ?? a.lang];
    const errors = [...(a.ok ? [] : a.errors), ...(b.ok ? [] : b.errors)];
    if (!a.ok || !b.ok) return { ok: false, errors };
    for (const [one, name] of [[a, file], [b, second]] as const) if (one.layout !== "guide") errors.push({ file: name, line: 1, message: m.pairNotGuide });
    if (errors.length === 0 && a.lang === b.lang) errors.push({ file: second, line: 1, message: m.pairSameLang(file, LANG_NAMES[a.lang]) });
    if (errors.length === 0) errors.push(...shapeErrors({ file, shape: a.shape }, { file: second, shape: b.shape }, m));
    if (errors.length > 0) return { ok: false, errors };
    html = pairPageHtml(a.page, b.page);
  }
  const out = join(outDir, `${basename(file, extname(file))}.html`);
  await mkdir(outDir, { recursive: true });
  await writeFile(out, html);
  return { ok: true, path: out };
}

/**
 * 1つのmdを読んで頁の中身を描く。書く先は `outDir` で、画像の path をそこから見た path にする。
 * 頁の言葉は `lang` か本文から決め、誤りの文は `say` か頁の言葉で書く
 */
async function renderPage(file: string, outDir: string, lang?: PageLang, say?: PageLang): Promise<Rendered> {
  const path = resolve(file);
  let text: string;
  try {
    text = await readFile(path, "utf8");
  } catch (error) {
    const fallback = say ?? lang ?? DEFAULT_LANG;
    return { ok: false, lang: fallback, errors: [{ file, line: 1, message: MESSAGES[fallback].unreadable(detail(error)) }] };
  }
  const pageLang: PageLang = lang ?? (hasKanaKanji(text) ? "ja" : "en");
  const m = MESSAGES[say ?? pageLang];
  const read = readOutline(linesOf(text), m);
  if (!read.ok) return { ok: false, lang: pageLang, errors: read.errors.map((error) => ({ file, ...error })) };
  const outline = read.outline;
  const root = realpathSync(dirname(path));
  const errors: PageError[] = [];

  /** 頭の `note: pop` (#3877)。1 行目に `note` を書かない図を札で見せる既定として、図を読む時と頁の図の塊に渡す */
  const note = outline.note;
  /** 描いている問いの節の図 (#3892)。判定の表の例の行が名指す場面を、同じ節の場面の図から探す。問いの節の外では `undefined` */
  let sectionFigures: SectionFigure[] | undefined;
  /** 図の記法を読み、誤りと頁に無い場所を指す飛び先を残す */
  const checkDiagram = (source: Source, notation: string, first: number): void => {
    const parsed = parseNotation(notation, { lang: pageLang, ...(note ? { note } : {}) });
    if (!parsed.ok) {
      for (const error of parsed.errors) errors.push({ file: source.name, line: first + error.line - 1, message: error.message });
      return;
    }
    sectionFigures?.push({ file: source.name, first, notation, diagram: parsed.diagram });
    const rows = notation.split("\n");
    for (const box of parsed.diagram.blocks.box ?? []) {
      const link = box.link;
      // 説明の頁の図の箱は、話題と節と用語の話題のほかに、「用語」の話題の中の用語へも結べる
      const entries = [...terms.values()].map((term) => term.entry);
      if (link === undefined || !link.startsWith("#") || placeExists(outline, link.slice(1).split("/"), entries)) continue;
      const at = rows.findIndex((row) => new RegExp(`\\blink:\\s*"?${link.replace(/[.*+?^${}()|[\]\\]/gu, "\\$&")}(?=$|[\\s,\\]"])`, "u").test(row));
      errors.push({ file: source.name, line: first + Math.max(0, at), message: m.missingPlace(link) });
    }
  };

  /** 画像の行き先を、書き出す先から見た path にする */
  const imageOf = (source: Source, src: string): string => {
    if (SCHEME.test(src) || src.startsWith("#") || src.startsWith("/")) return src;
    const moved = relative(outDir, resolve(dirname(source.path), src));
    return moved.split(sep).join("/");
  };

  /** 載せる file を読む。mdの在るフォルダの外の file と、無い file と、文字でない file は行を名指して断り、`undefined` を返す */
  const readText = (source: Source, target: string, line: number): { shown: Source; real: string; body: string } | undefined => {
    const shown = { name: join(dirname(source.name), target), path: resolve(dirname(source.path), target) };
    const refuse = (message: string): undefined => {
      errors.push({ file: source.name, line, message });
      return undefined;
    };
    let real: string;
    try {
      real = realpathSync(shown.path);
    } catch {
      return refuse(m.noFile(target));
    }
    if (!inside(root, real)) return refuse(m.outside(target));
    const bytes = readFileSync(real);
    if (bytes.includes(0)) return refuse(m.notText(target));
    return { shown: { name: shown.name, path: real }, real, body: bytes.toString("utf8") };
  };

  // 説明の頁の用語 (#3876)。頁の頭で読み込んだ用語の file を全て読み、用語の名前ごとに 1 つだけ持つ
  const guide = outline.guide;
  const terms = new Map<string, Term>();
  /** 用語の file の実の path と、その用語の話題の場所の名前 */
  const glossaryTabs = new Map<string, string>();
  const glossaryLists: { name: string; id: string; terms: Term[]; line: number; file: string }[] = [];
  const entryId = slugger(guide?.ids ?? []);
  for (const g of guide?.glossaries ?? []) {
    const read = readText({ name: file, path }, g.target, g.line);
    if (!read) continue;
    glossaryTabs.set(read.real, g.id);
    const list: Term[] = [];
    for (const t of glossaryTerms(linesOf(read.body))) {
      const key = slugOf(t.name);
      const first = terms.get(key);
      if (first) {
        errors.push({ file: read.shown.name, line: t.line, message: m.termTwice(t.name, `${basename(first.source.name)}:${first.line}`) });
        continue;
      }
      const term: Term = { ...t, key, source: read.shown, entry: entryId(t.name) };
      terms.set(key, term);
      list.push(term);
    }
    glossaryLists.push({ name: g.name, id: g.id, terms: list, line: g.line, file: read.shown.name });
  }

  /** link の行き先が用語の file を指すなら、その用語の話題と、`#` の後ろの名前と、名前に当たる用語。用語の file でなければ `undefined` */
  const termOf = (source: Source, href: string): { tab: string; anchor?: string; term?: Term } | undefined => {
    if (glossaryTabs.size === 0 || SCHEME.test(href) || href.startsWith("#") || href.startsWith("/")) return undefined;
    const hash = href.indexOf("#");
    const target = hash < 0 ? href : href.slice(0, hash);
    let real: string;
    try {
      real = realpathSync(resolve(dirname(source.path), target));
    } catch {
      return undefined;
    }
    const tab = glossaryTabs.get(real);
    if (tab === undefined) return undefined;
    if (hash < 0) return { tab };
    let anchor = href.slice(hash + 1);
    try {
      anchor = decodeURIComponent(anchor);
    } catch {
      // 読めない `%` はそのままの字で突き合わせる
    }
    const term = terms.get(slugOf(anchor));
    return { tab, anchor, ...(term ? { term } : {}) };
  };

  /** `lines` の中の、用語の file に無い用語への link を行を名指して断る */
  const checkTermLinks = (source: Source, lines: readonly Line[]): void => {
    if (glossaryTabs.size === 0) return;
    let fence: string | undefined;
    for (const line of lines) {
      if (fence !== undefined) {
        if (fenceCloses(line.text, fence)) fence = undefined;
        continue;
      }
      fence = fenceOpen(line.text)?.mark;
      if (fence !== undefined) continue;
      for (const link of linksIn(line.text)) {
        const found = termOf(source, link.href);
        if (found?.anchor !== undefined && !found.term) errors.push({ file: source.name, line: line.line, message: m.missingTerm(found.anchor, link.href.split("#")[0] ?? link.href) });
      }
    }
  };

  /** 今描いている節が持つ用語の札。節の外 (題など) では `undefined` で、用語の link を字だけにする */
  let cards: Map<string, Term> | undefined;
  /** 本文の用語の link。押すと札が開く下線にし、札を今の節に預ける */
  const termLink =
    (source: Source) =>
    (href: string, label: string): string | undefined => {
      const found = termOf(source, href);
      if (!found) return undefined;
      if (found.anchor === undefined) return `<a href="#${escapeHtml(found.tab)}">${label}</a>`;
      if (!found.term || !cards) return label;
      cards.set(found.term.key, found.term);
      return `<button type="button" class="pg-term" data-term="${escapeHtml(found.term.key)}" aria-expanded="false">${label}</button>`;
    };
  /** 用語の説明の中の用語の link は、「用語」の話題の中のその用語の場所へ移る link にする */
  const entryLink =
    (source: Source) =>
    (href: string, label: string): string | undefined => {
      const found = termOf(source, href);
      if (!found) return undefined;
      const to = found.anchor === undefined ? found.tab : found.term?.entry;
      return to === undefined ? label : `<a href="#${escapeHtml(to)}">${label}</a>`;
    };
  /** 確かめる問いの答えの要素に配る番号 */
  let answers = 0;
  const words = WORDS[pageLang];
  const quiz = { heading: words.quiz, show: words.answer, hide: words.close, next: () => ++answers };

  /** 1行だけの `![名前](path)` の中身。画像として出す時は `undefined` */
  const include = (source: Source, stack: readonly string[], name: string, target: string, line: number): string | undefined => {
    if (SCHEME.test(target) || target.startsWith("#") || isAbsolute(target)) return undefined;
    const ext = extname(target).toLowerCase();
    if (IMAGES.has(ext)) return undefined;
    const read = readText(source, target, line);
    if (!read) return "";
    const { shown, real, body } = read;
    const label = `<p class="pg-include-name">${escapeHtml(name || basename(target))}</p>`;
    if (ext === ".md") {
      if (stack.includes(real) || stack.length >= DEPTH) {
        errors.push({ file: source.name, line, message: m.loop(target) });
        return "";
      }
      const lines = linesOf(body);
      checkTermLinks(shown, lines);
      const inner = renderBlocks(lines, hooksFor(shown, [...stack, real]));
      return `<div class="pg-include">${label}<div class="pg-doc">${inner}</div></div>`;
    }
    if (ext === ".dragon") {
      checkDiagram(shown, body.replace(/\r\n?/gu, "\n"), 1);
      return figureHtml(body.replace(/\r\n?/gu, "\n").replace(/\n+$/u, ""), note);
    }
    return `<div class="pg-include">${label}${codeHtml(body.replace(/\r\n?/gu, "\n").trimEnd(), ext.slice(1))}</div>`;
  };

  const hooksFor = (source: Source, stack: readonly string[]): RenderHooks => ({
    alerts: WORDS[pageLang].alerts,
    ...(note ? { note } : {}),
    ...(guide ? { link: termLink(source), quiz } : {}),
    image: (src) => imageOf(source, src),
    diagram: (notation, first) => checkDiagram(source, notation, first),
    include: (name, target, line) => include(source, stack, name, target, line),
  });
  const main = hooksFor({ name: file, path }, [realpathSync(path)]);
  const blocks = (lines: readonly Line[]): string => renderBlocks(lines, main);

  /** 用語の札の中身。用語ごとに 1 度だけ描く */
  const rendered = new Map<string, RenderedTerm>();
  const termHtml = (term: Term): RenderedTerm => {
    const done = rendered.get(term.key);
    if (done) return done;
    const hooks: RenderHooks = { ...hooksFor(term.source, [term.source.path]), link: entryLink(term.source) };
    const example = term.example.map((line) => line.text).filter((text) => text.trim() !== "");
    const html: RenderedTerm = {
      key: term.key,
      entry: term.entry,
      label: titleText(term.name),
      name: renderInline(term.name, hooks),
      text: renderBlocks(term.text, hooks),
      ...(example.length > 0 ? { example: renderInline(joinLines(example), hooks) } : {}),
    };
    rendered.set(term.key, html);
    return html;
  };
  /** `render` が描く間に用語の link が預けた札を集める */
  const withCards = (render: () => string): { html: string; terms: RenderedTerm[] } => {
    const outer = cards;
    cards = new Map();
    const html = render();
    const terms = [...cards.values()].map(termHtml);
    cards = outer;
    return { html, terms };
  };
  /**
   * 問いの節の図に場所の名前 (`<節の場所の名前>-fig-<番号>`) を付け、図の題を書いた順に返す (#3998)。左の目次が開いた問いの下に題を並べ、押すとその図へ移る。
   * 題は図の記法の頭の行の題で、図の帯が出す題と同じ。題の無い図と読めない図は目次に出さない
   */
  const figuresOf = (html: string, id: string): { html: string; figures: RenderedFigure[] } => {
    const figures: RenderedFigure[] = [];
    const named = html.replace(/<div class="pg-figure([^"]*)"><pre class="dragon"([^>]*)>([\s\S]*?)<\/pre>/gu, (whole, kind: string, attrs: string, escaped: string) => {
      const parsed = parseNotation(unescapeHtml(escaped), { lang: pageLang, ...(note ? { note } : {}) });
      const title = parsed.ok ? parsed.diagram.title.trim() : "";
      if (title === "") return whole;
      const place = `${id}-fig-${figures.length + 1}`;
      figures.push({ id: place, title });
      return `<div class="pg-figure${kind}" id="${escapeHtml(place)}"><pre class="dragon"${attrs}>${escaped}</pre>`;
    });
    return { html: named, figures };
  };
  /**
   * 問いの節の`####`の見出しに場所の名前 (`<節の場所の名前>-h-<番号>`) を付け、見出しを書いた順に返す (#4010)。
   * 左の目次が開いた問いの下に見出しを並べ、押すとその見出しへ移る。見出しを持たない節は図の題を並べる
   */
  const headsOf = (html: string, id: string): { html: string; heads: RenderedHead[] } => {
    const heads: RenderedHead[] = [];
    const named = html.replace(/<h4 class="pg-h">([\s\S]*?)<\/h4>/gu, (_whole, inner: string) => {
      const place = `${id}-h-${heads.length + 1}`;
      heads.push({ id: place, html: inner });
      return `<h4 class="pg-h" id="${escapeHtml(place)}">${inner}</h4>`;
    });
    return { html: named, heads };
  };
  const guideOf = (g: Guide): RenderedGuide => {
    checkTermLinks({ name: file, path }, linesOf(text));
    for (const term of terms.values()) checkTermLinks(term.source, [...term.text, ...term.example]);
    const lead = withCards(() => blocks(g.lead));
    // 頭の中身の最初の図は、頁の頭の全体像に描く (#3961)。図の後に書いた中身は全体像の中の図の下に描き、頭の中身と同じく用語の札を持つ (#3969)
    const overview = blocks(g.overview);
    const overviewText = withCards(() => blocks(g.overviewText));
    const topics: RenderedGuide["topics"] = g.topics.map((topic) => {
      const intro = withCards(() => blocks(topic.lead));
      return {
        id: topic.id,
        name: renderInline(topic.name, main),
        lead: intro.html,
        leadTerms: intro.terms,
        sections: topic.sections.map((section) => {
          let answer: string | undefined;
          sectionFigures = [];
          const body = withCards(() => {
            if (section.answer) answer = renderInline(joinLines(section.answer.map((line) => line.text).filter((t) => t.trim() !== "")), main);
            return blocks(section.body);
          });
          // 判定の表の例の行が名指す場面が、同じ問いの節の場面の図に 1 つだけ在るか (#3892)
          for (const error of sceneLinkErrors(sectionFigures, pageLang)) errors.push({ file: error.file, line: error.line, message: error.message });
          sectionFigures = undefined;
          const titled = headsOf(body.html, section.id);
          const named = figuresOf(titled.html, section.id);
          return {
            id: section.id,
            name: renderInline(section.name, main),
            ...(section.menu === undefined ? {} : { menu: renderInline(section.menu, main) }),
            ...(answer === undefined ? {} : { answer }),
            body: named.html,
            terms: body.terms,
            ...(named.figures.length === 0 ? {} : { figures: named.figures }),
            ...(titled.heads.length === 0 ? {} : { heads: titled.heads }),
          };
        }),
      };
    });
    for (const list of glossaryLists) topics.push({ id: list.id, name: escapeHtml(list.name), lead: "", leadTerms: [], sections: [], glossary: list.terms.map(termHtml) });
    return { lead: lead.html, leadTerms: lead.terms, overview, overviewText: overviewText.html, overviewTerms: overviewText.terms, overviewId: g.overviewId, topics };
  };
  const tab = (t: Tab): RenderedTab => ({ id: t.id, name: renderInline(t.name, main), body: blocks(t.body), tabs: t.tabs.map(tab) });
  const part = (p: Part): RenderedPart => ({ lead: blocks(p.lead), tabs: p.tabs.map(tab) });
  const groups: RenderedGroup[] = outline.groups.map((group) => ({
    name: renderInline(group.name, main),
    lead: blocks(group.lead),
    summary: summaryOf(group.lead, main),
    items: group.items.map((item): RenderedItem => ({ ...part(item), id: item.id, name: renderInline(item.name, main), summary: summaryOf(item.lead, main), group: item.group })),
  }));
  const entry = part(outline.entry);
  const guided = guide ? guideOf(guide) : undefined;
  if (errors.length > 0) return { ok: false, lang: pageLang, errors };

  const title = outline.title ?? basename(path, extname(path));
  const page: RenderedPage = { title: renderInline(title, main), titleText: titleText(title), layout: outline.layout, ...(outline.header ? { header: outline.header } : {}), lang: pageLang, entry, groups, ...(guided ? { guide: guided } : {}) };
  const shape: Shape = {
    topics: (guide?.topics ?? []).map((topic) => ({
      line: topic.line,
      sections: topic.sections.map((section) => ({
        line: section.line,
        heads: linesWhere(section.body, (t) => headingOf(t)?.level === 4),
        quizzes: linesWhere(section.body, (t) => QUIZ_OPEN.test(t)),
      })),
    })),
    glossaries: glossaryLists.map((list) => ({ line: list.line, file: list.file, terms: list.terms.map((term) => term.line) })),
  };
  return { ok: true, page, lang: pageLang, layout: outline.layout, shape };
}

/** `<title>` に書く字。字の中の書き方の印を外す */
const titleText = (title: string): string => title.replace(/[`*_~]/gu, "").replace(/\[([^\]]*)\]\([^)]*\)/gu, "$1");
