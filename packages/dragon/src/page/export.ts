/**
 * mdから1つのHTMLの頁を書き出す (#3755)。`dragon export notes.md` とNodeの入口の `exportPage` が呼ぶ。
 *
 * 見出しで頁を組み立て (`read.ts`)、中身をHTMLにし (`markdown.ts`)、組み立て (`layout`) の形に並べて (`html.ts`)、mdの隣か `outDir` に `<名前>.html` を書く。
 * 1行だけに書いた `![名前](path)` は、`.md` をmdとして、`.dragon` を帯つきの図として、ほかの文字のfileを名前を付けたcodeの囲みとして載せる。
 * 画像のfileとURLは画像のまま出し、相対の path は書き出す先から見た path に直す。
 * 載せるfileは、mdの在るフォルダとその下だけを読む。symbolic link は指す先で確かめる。
 *
 * 書き出す前に全ての図の記法を読み、箱の飛び先の頁の中の場所 (`#order`) が頁に在るかを確かめる。
 * 誤りが1つでもあれば頁を書かず、fileと行と文の並びを返す。
 * 誤りの文と頁に足す字は `lang` の言葉で書き、渡さない時はmdの本文に仮名か漢字があれば日本語、無ければ英語にする。
 */
import { readFileSync, realpathSync } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { basename, dirname, extname, isAbsolute, join, relative, resolve, sep } from "node:path";
import { parseNotation } from "../parser";
import { DEFAULT_LANG, hasKanaKanji } from "../words";
import { pageHtml, type RenderedGroup, type RenderedItem, type RenderedPart, type RenderedTab, withoutLinks } from "./html";
import { codeHtml, escapeHtml, figureHtml, headingOf, joinLines, type Line, linesOf, type RenderHooks, renderBlocks, renderInline } from "./markdown";
import { type Part, placeExists, readOutline, type Tab } from "./read";
import { MESSAGES, type PageLang, WORDS } from "./text";

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

/** 読んでいるfile。`name` は誤りの文に書く名前、`path` は実の path */
interface Source {
  name: string;
  path: string;
}

const detail = (error: unknown): string => (error instanceof Error ? error.message : String(error));

/** `path` が `root` の中か */
const inside = (root: string, path: string): boolean => path === root || path.startsWith(root.endsWith(sep) ? root : `${root}${sep}`);

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

/** 書き出す。誤りがあれば頁を書かない */
export async function exportPage(file: string, options: PageExportOptions = {}): Promise<PageExport> {
  const path = resolve(file);
  let text: string;
  try {
    text = await readFile(path, "utf8");
  } catch (error) {
    return { ok: false, errors: [{ file, line: 1, message: MESSAGES[options.lang ?? DEFAULT_LANG].unreadable(detail(error)) }] };
  }
  const lang: PageLang = options.lang ?? (hasKanaKanji(text) ? "ja" : "en");
  const m = MESSAGES[lang];
  const read = readOutline(linesOf(text), m);
  if (!read.ok) return { ok: false, errors: read.errors.map((error) => ({ file, ...error })) };
  const outline = read.outline;
  const root = realpathSync(dirname(path));
  const outDir = resolve(options.outDir ?? dirname(path));
  const errors: PageError[] = [];

  /** 図の記法を読み、誤りと頁に無い場所を指す飛び先を残す */
  const checkDiagram = (source: Source, notation: string, first: number): void => {
    const parsed = parseNotation(notation, { lang });
    if (!parsed.ok) {
      for (const error of parsed.errors) errors.push({ file: source.name, line: first + error.line - 1, message: error.message });
      return;
    }
    const rows = notation.split("\n");
    for (const box of parsed.diagram.blocks.box ?? []) {
      const link = box.link;
      if (link === undefined || !link.startsWith("#") || placeExists(outline, link.slice(1).split("/"))) continue;
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

  /** 1行だけの `![名前](path)` の中身。画像として出す時は `undefined` */
  const include = (source: Source, stack: readonly string[], name: string, target: string, line: number): string | undefined => {
    if (SCHEME.test(target) || target.startsWith("#") || isAbsolute(target)) return undefined;
    const ext = extname(target).toLowerCase();
    if (IMAGES.has(ext)) return undefined;
    const shown = { name: join(dirname(source.name), target), path: resolve(dirname(source.path), target) };
    const refuse = (message: string): string => {
      errors.push({ file: source.name, line, message });
      return "";
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
    const body = bytes.toString("utf8");
    const label = `<p class="pg-include-name">${escapeHtml(name || basename(target))}</p>`;
    if (ext === ".md") {
      if (stack.includes(real) || stack.length >= DEPTH) return refuse(m.loop(target));
      const inner = renderBlocks(linesOf(body), hooksFor({ name: shown.name, path: real }, [...stack, real]));
      return `<div class="pg-include">${label}<div class="pg-doc">${inner}</div></div>`;
    }
    if (ext === ".dragon") {
      checkDiagram(shown, body.replace(/\r\n?/gu, "\n"), 1);
      return figureHtml(body.replace(/\r\n?/gu, "\n").replace(/\n+$/u, ""));
    }
    return `<div class="pg-include">${label}${codeHtml(body.replace(/\r\n?/gu, "\n").trimEnd(), ext.slice(1))}</div>`;
  };

  const hooksFor = (source: Source, stack: readonly string[]): RenderHooks => ({
    alerts: WORDS[lang].alerts,
    image: (src) => imageOf(source, src),
    diagram: (notation, first) => checkDiagram(source, notation, first),
    include: (name, target, line) => include(source, stack, name, target, line),
  });
  const main = hooksFor({ name: file, path }, [realpathSync(path)]);
  const blocks = (lines: readonly Line[]): string => renderBlocks(lines, main);
  const tab = (t: Tab): RenderedTab => ({ id: t.id, name: renderInline(t.name, main), body: blocks(t.body), tabs: t.tabs.map(tab) });
  const part = (p: Part): RenderedPart => ({ lead: blocks(p.lead), tabs: p.tabs.map(tab) });
  const groups: RenderedGroup[] = outline.groups.map((group) => ({
    name: renderInline(group.name, main),
    lead: blocks(group.lead),
    summary: summaryOf(group.lead, main),
    items: group.items.map((item): RenderedItem => ({ ...part(item), id: item.id, name: renderInline(item.name, main), summary: summaryOf(item.lead, main), group: item.group })),
  }));
  const entry = part(outline.entry);
  if (errors.length > 0) return { ok: false, errors };

  const title = outline.title ?? basename(path, extname(path));
  const html = pageHtml({ title: renderInline(title, main), titleText: titleText(title), layout: outline.layout, lang, entry, groups });
  const out = join(outDir, `${basename(path, extname(path))}.html`);
  await mkdir(outDir, { recursive: true });
  await writeFile(out, html);
  return { ok: true, path: out };
}

/** `<title>` に書く字。字の中の書き方の印を外す */
const titleText = (title: string): string => title.replace(/[`*_~]/gu, "").replace(/\[([^\]]*)\]\([^)]*\)/gu, "$1");
