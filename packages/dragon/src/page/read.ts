/**
 * 頁に書き出すmdの見出しを読み、頁の組み立てに分ける (#3755)。
 *
 * 見出しの深さは固定し、`#` は頁の題、最初の `##` より前は入口、`##` は段、`###` は項目、
 * `####` は入口と項目の頁の中のタブ、`#####` はタブの中のタブにする。`######` は中身の見出しのまま残す。
 * 囲み (```` ``` ````) の中の `#` は見出しに数えない。
 * 頭の `---` の間には `title` (頁の題) と `layout` (頁の組み立て) を書ける。
 * 帯のボタンの並び (`header-buttons`、名前を `,` で区切る) と帯の色 (`header-<色の欄>`) も 1 行ずつ書け、頁の帯の設定の塊になる (#3789)。
 * `note: pop` は 1 行目に `note` を書かない頁の全ての図を、箱の説明を押すと出る札で見せ、`pop` と `under` の外の値は行の番号つきで断る (#3877)。
 * 知らないボタンの名前と、2 度書いたボタンと、`;` `<` `>` `{` `}` `"` `\` を含む色の値と、知らない `header-` の行は、行の番号つきで断る。ほかの行は読まない。
 *
 * 場所の名前は見出しの字から作る。項目は頁の中で、タブは同じ所に並ぶタブの中で重ならないよう分ける。
 *
 * 説明の頁 (`layout: guide`、#3876) は、`##` を話題、`###` を話題の中に縦に積む問いの節にし、`####` から下は中身の見出しのまま残す。
 * 節の題の直後の引用 (`>`、GitHub の注意書きを除く) は節の答えにし、ほかの引用は中身に残す。
 * 節の題の終わりの `[menu: 短い名前]` は左の目次に出す名前にして題から外し、名前の空の `[menu: ]` は行の番号つきで断る (#3961)。
 * 最初の `##` より前の最初の ```` ```dragon ```` の囲みは、頁の頭の全体像の図にする (#3961)。
 * 最初の `##` より前に 1 行だけ書いた `![名前](path.md)` は用語の file を読み込む行にし、`名前` の話題にする。
 * 場所の名前は、話題と節と用語の話題で頁の中で重ならないよう分ける。
 */
import { NOTE_MODES } from "../blocks/pop/block";
import { BUILTIN_BUTTONS, HEADER_COLOR_KEYS } from "../frame/names";
import { fenceCloses, fenceOpen, headingOf, includeOf, isAlert, type Line, quoteOf } from "./markdown";
import { slugger } from "./slug";
import type { PageMessages } from "./text";

/**
 * 頁の組み立て。`entry` は全体の図を入口にし、`sidebar` は左の目次と右の頁、`tabs` は上の段のタブと段の中の項目のタブ。
 * `guide` は左の目次と、話題と問いの節。話題が1つの頁は1つの頁に続けて積み、2つ以上の頁は頭の頁と問いごとの頁に分ける (#3876、#3961、#3983)
 */
export type Layout = "entry" | "sidebar" | "tabs" | "guide";
export const LAYOUTS: readonly Layout[] = ["entry", "sidebar", "tabs", "guide"];

/** 説明の頁の節。`answer` は題の直後の引用の行 (`>` を外した字)、`menu` は題の終わりの `[menu: 短い名前]` の名前 (#3961) */
export interface Section {
  id: string;
  name: string;
  menu?: string;
  line: number;
  answer?: Line[];
  body: Line[];
}

/** 説明の頁の話題。`lead` は最初の節より前の中身 */
export interface Topic {
  id: string;
  name: string;
  line: number;
  lead: Line[];
  sections: Section[];
}

/** 頁の頭で読み込む用語の file。`name` は用語の話題の名前、`id` はその話題の場所の名前 */
export interface GlossaryInclude {
  id: string;
  name: string;
  target: string;
  line: number;
}

/**
 * 説明の頁の組み立て。`overview` は頭の中身の最初の図の囲みの行、`overviewId` はその全体像の場所の名前で、図の無い頁は空の字 (#3961)。
 * `overviewText` は頭の中身のうち図の後に書いた行で、全体像の中の図の下に出す (#3969)。`lead` は図の前に書いた行。
 * `ids` は頁の中で配った場所の名前
 */
export interface Guide {
  lead: Line[];
  overview: Line[];
  overviewText: Line[];
  overviewId: string;
  topics: Topic[];
  glossaries: GlossaryInclude[];
  ids: string[];
}

/** 見出しで分けた所。`body` はその見出しの下の中身の行 */
export interface Tab {
  /** 場所の名前。頁のURLの `#` の後ろに書く */
  id: string;
  /** 見出しの字 */
  name: string;
  line: number;
  body: Line[];
  /** 中のタブ。`#####` の見出し */
  tabs: Tab[];
}

/** 入口か項目の頁。`lead` は最初のタブより前の中身 */
export interface Part {
  lead: Line[];
  tabs: Tab[];
}

export interface Item extends Part {
  id: string;
  name: string;
  line: number;
  /** 段の番号。0 から数える */
  group: number;
}

export interface Group {
  name: string;
  line: number;
  lead: Line[];
  items: Item[];
}

/** 頭の `header-` の行から作る、頁の帯の設定 (#3789)。jsDelivr の頁の帯の設定の塊 (`#dragon-header`) と同じ形 */
export interface PageHeader {
  buttons?: string[];
  look?: { colors: Record<string, string> };
}

export interface Outline {
  /** 頁の題。`#` の見出しか、頭の `title` */
  title: string | undefined;
  layout: Layout;
  /** 頭に `note: pop` を書いた時だけ持つ。1 行目に `note` を書かない頁の全ての図を、箱の説明を押すと出る札で見せる (#3877) */
  note?: "pop";
  /** 頭に `header-` の行を書いた時だけ持つ */
  header?: PageHeader;
  entry: Part;
  groups: Group[];
  /** `layout: guide` の頁だけが持つ。`entry` と `groups` は空 */
  guide?: Guide;
}

export interface OutlineError {
  line: number;
  message: string;
}

const isLayout = (value: string): value is Layout => LAYOUTS.some((layout) => layout === value);

/** 帯の色の値に書けない字。頁の帯の設定の塊と CSS の値の外へ出させない */
const UNSAFE_COLOR = /[;<>{}"\\]/u;

/** 頭の `header-` の行を頁の帯の設定にする。行が無ければ undefined (#3789) */
function readHeader(values: ReadonlyMap<string, Line>, m: PageMessages, errors: OutlineError[]): PageHeader | undefined {
  const header: PageHeader = {};
  const colors: Record<string, string> = {};
  for (const [key, line] of values) {
    if (!key.startsWith("header-")) continue;
    const field = key.slice("header-".length);
    if (field === "buttons") {
      const names = line.text.split(",").map((name) => name.trim()).filter((name) => name !== "");
      const unknown = names.find((name) => !(BUILTIN_BUTTONS as readonly string[]).includes(name));
      const twice = names.find((name, i) => names.indexOf(name) !== i);
      if (unknown !== undefined) errors.push({ line: line.line, message: m.badHeaderButton(unknown, BUILTIN_BUTTONS.join(", ")) });
      else if (twice !== undefined) errors.push({ line: line.line, message: m.repeatedHeaderButton(twice) });
      else header.buttons = names;
    } else if ((HEADER_COLOR_KEYS as readonly string[]).includes(field)) {
      if (line.text === "" || UNSAFE_COLOR.test(line.text)) errors.push({ line: line.line, message: m.badHeaderColor(key, line.text) });
      else colors[field] = line.text;
    } else {
      errors.push({ line: line.line, message: m.unknownHeaderLine(key, ["header-buttons", ...HEADER_COLOR_KEYS.map((color) => `header-${color}`)].join(", ")) });
    }
  }
  if (Object.keys(colors).length > 0) header.look = { colors };
  return header.buttons === undefined && header.look === undefined ? undefined : header;
}

/** 頭の `---` の間の行。閉じない `---` は頭の行と読まない */
function frontMatter(lines: readonly Line[]): { values: Map<string, Line>; next: number } {
  const values = new Map<string, Line>();
  if (lines[0]?.text.trim() !== "---") return { values, next: 0 };
  const end = lines.findIndex((line, i) => i > 0 && line.text.trim() === "---");
  if (end < 0) return { values, next: 0 };
  for (const line of lines.slice(1, end)) {
    const found = /^([A-Za-z][\w-]*):\s*(.*?)\s*$/u.exec(line.text);
    if (!found) continue;
    const value = (found[2] ?? "").replace(/\s+#.*$/u, "").replace(/^(["'])(.*)\1$/u, "$2");
    values.set(found[1] ?? "", { text: value, line: line.line });
  }
  return { values, next: end + 1 };
}

/** 用語の file を読み込める行き先。scheme を持たず、頁の中の場所でも `/` で始まる path でもない `.md` */
const GLOSSARY_TARGET = /^(?![a-z][a-z0-9+.-]*:)(?![#/])[^#?]*\.md$/iu;

/** 節の題の終わりの `[menu: 短い名前]` (#3961)。名前は前後の空白を外した字 */
const MENU_NAME = /\s*\[menu:([^\]]*)\]$/u;

/**
 * 頭の中身から、最初の ```` ```dragon ```` の囲みの行 (`figure`) と、その後に書いた行 (`after`) を抜き出す (#3961)。
 * 図の後の行は頁の頭でなく全体像の中の図の下に出すので、頭の中身には図の前の行だけを残す (#3969)。囲みが無ければどちらも空
 */
function splitOverview(lead: Line[]): { figure: Line[]; after: Line[] } {
  let fence: string | undefined;
  let start = -1;
  // 閉じない囲みは頭の中身の終わりまでを図にする
  let end = lead.length;
  for (const [i, line] of lead.entries()) {
    if (fence !== undefined) {
      if (!fenceCloses(line.text, fence)) continue;
      fence = undefined;
      if (start < 0) continue;
      end = i + 1;
      break;
    }
    const open = fenceOpen(line.text);
    if (!open) continue;
    fence = open.mark;
    if (open.lang === "dragon") start = i;
  }
  if (start < 0) return { figure: [], after: [] };
  const rest = lead.splice(start);
  return { figure: rest.slice(0, end - start), after: rest.slice(end - start) };
}

/** 節の中身の頭の引用を答えに分ける。注意書きの引用と、頭が引用でない節は答えを持たない */
function splitAnswer(section: Section): void {
  const start = section.body.findIndex((line) => line.text.trim() !== "");
  const first = start < 0 ? undefined : quoteOf(section.body[start]?.text ?? "");
  if (first === undefined || isAlert(first)) return;
  let end = start;
  const answer: Line[] = [];
  for (; end < section.body.length; end++) {
    const row = section.body[end] as Line;
    const text = quoteOf(row.text);
    if (text === undefined) break;
    answer.push({ text, line: row.line });
  }
  section.answer = answer;
  section.body = section.body.slice(end);
}

/** 説明の頁の見出しを読む (#3876)。`title` は頭の `title` の値 */
function readGuide(lines: readonly Line[], m: PageMessages, errors: OutlineError[], title: string | undefined): { title: string | undefined; guide: Guide } {
  let titled = false;
  const lead: Line[] = [];
  const topics: Topic[] = [];
  const glossaries: GlossaryInclude[] = [];
  let topic: Topic | undefined;
  let section: Section | undefined;
  let fence: string | undefined;
  const sink = (): Line[] => section?.body ?? topic?.lead ?? lead;
  for (const line of lines) {
    if (fence !== undefined) {
      if (fenceCloses(line.text, fence)) fence = undefined;
      sink().push(line);
      continue;
    }
    const open = fenceOpen(line.text);
    if (open) {
      fence = open.mark;
      sink().push(line);
      continue;
    }
    const heading = headingOf(line.text);
    if (!heading || heading.level > 3) {
      const include = topic ? undefined : includeOf(line.text);
      if (include && GLOSSARY_TARGET.test(include.target)) glossaries.push({ id: "", name: include.name || include.target, target: include.target, line: line.line });
      else sink().push(line);
      continue;
    }
    if (heading.level === 1) {
      if (titled || topic) errors.push({ line: line.line, message: m.extraTitle });
      else {
        title = heading.text;
        titled = true;
      }
    } else if (heading.level === 2) {
      topic = { id: "", name: heading.text, line: line.line, lead: [], sections: [] };
      topics.push(topic);
      section = undefined;
    } else if (!topic) {
      errors.push({ line: line.line, message: m.sectionBeforeTopic });
    } else {
      const menu = MENU_NAME.exec(heading.text);
      const name = menu ? heading.text.slice(0, menu.index).trim() : heading.text;
      const short = menu?.[1]?.trim();
      if (short === "") errors.push({ line: line.line, message: m.emptyMenuName });
      section = { id: "", name, ...(short ? { menu: short } : {}), line: line.line, body: [] };
      topic.sections.push(section);
    }
  }
  // 場所の名前は、全体像を最初に、話題とその節を書いた順に配り、用語の話題を最後に配る
  const ids: string[] = [];
  const id = slugger();
  const named = (text: string): string => {
    const name = id(text);
    ids.push(name);
    return name;
  };
  const { figure: overview, after: overviewText } = splitOverview(lead);
  const overviewId = overview.length > 0 ? named("overview") : "";
  for (const t of topics) {
    t.id = named(t.name);
    for (const s of t.sections) {
      s.id = named(s.name);
      splitAnswer(s);
    }
  }
  for (const g of glossaries) g.id = named(g.name);
  return { title, guide: { lead, overview, overviewText, overviewId, topics, glossaries, ids } };
}

/** mdの行の並びを頁の組み立てに分ける。誤りがあれば全ての誤りを返す */
export function readOutline(lines: readonly Line[], m: PageMessages): { ok: true; outline: Outline } | { ok: false; errors: OutlineError[] } {
  const errors: OutlineError[] = [];
  const head = frontMatter(lines);
  const layoutLine = head.values.get("layout");
  let layout: Layout = "entry";
  if (layoutLine) {
    if (isLayout(layoutLine.text)) layout = layoutLine.text;
    else errors.push({ line: layoutLine.line, message: m.badLayout(layoutLine.text, LAYOUTS.join(" / ")) });
  }
  const header = readHeader(head.values, m, errors);
  // 頁の全ての図の箱の説明の見せ方 (#3877)。under は書かない頁と同じで、ほかの値は行を名指して断る
  const noteLine = head.values.get("note");
  if (noteLine && !(NOTE_MODES as readonly string[]).includes(noteLine.text)) errors.push({ line: noteLine.line, message: m.badNote(noteLine.text, NOTE_MODES.join(" / ")) });
  const note = noteLine?.text === "pop" ? "pop" : undefined;
  let title = head.values.get("title")?.text || undefined;
  const extra: Pick<Outline, "note" | "header"> = { ...(note ? { note } : {}), ...(header ? { header } : {}) };
  if (layout === "guide") {
    const read = readGuide(lines.slice(head.next), m, errors, title);
    if (errors.length > 0) return { ok: false, errors };
    return { ok: true, outline: { title: read.title, layout, ...extra, entry: { lead: [], tabs: [] }, groups: [], guide: read.guide } };
  }
  let titled = false;
  const entry: Part = { lead: [], tabs: [] };
  const groups: Group[] = [];
  const itemId = slugger([""]);
  let part: Part = entry;
  let group: Group | undefined;
  let tab: Tab | undefined;
  let sub: Tab | undefined;
  let tabId = slugger();
  let subId = slugger();
  let fence: string | undefined;
  /** 今の中身の行を受ける所 */
  const sink = (): Line[] => sub?.body ?? tab?.body ?? (group && part === entry ? group.lead : part.lead);
  for (const line of lines.slice(head.next)) {
    if (fence !== undefined) {
      if (fenceCloses(line.text, fence)) fence = undefined;
      sink().push(line);
      continue;
    }
    const open = fenceOpen(line.text);
    if (open) {
      fence = open.mark;
      sink().push(line);
      continue;
    }
    const heading = headingOf(line.text);
    if (!heading || heading.level === 6) {
      sink().push(line);
      continue;
    }
    const { level, text } = heading;
    if (level === 1) {
      if (titled || group) errors.push({ line: line.line, message: m.extraTitle });
      else {
        title = text;
        titled = true;
      }
    } else if (level === 2) {
      group = { name: text, line: line.line, lead: [], items: [] };
      groups.push(group);
      part = entry;
      tab = undefined;
      sub = undefined;
    } else if (level === 3) {
      if (!group) {
        errors.push({ line: line.line, message: m.itemBeforeGroup });
        continue;
      }
      const item: Item = { id: itemId(text), name: text, line: line.line, group: groups.length - 1, lead: [], tabs: [] };
      group.items.push(item);
      part = item;
      tab = undefined;
      sub = undefined;
      tabId = slugger();
    } else if (level === 4) {
      if (group && part === entry) {
        errors.push({ line: line.line, message: m.tabBeforeItem });
        continue;
      }
      tab = { id: tabId(text), name: text, line: line.line, body: [], tabs: [] };
      part.tabs.push(tab);
      sub = undefined;
      subId = slugger();
    } else {
      if (!tab) {
        errors.push({ line: line.line, message: m.subTabOutsideTab });
        continue;
      }
      sub = { id: subId(text), name: text, line: line.line, body: [], tabs: [] };
      tab.tabs.push(sub);
    }
  }
  if (errors.length > 0) return { ok: false, errors };
  return { ok: true, outline: { title, layout, ...extra, entry, groups } };
}

/**
 * 頁の中の場所の名前の並び (`項目/タブ/中のタブ`) が、頁に在る場所か。
 * 説明の頁では、話題か節か用語の話題の場所の名前 1 つか、`extra` に渡した場所の名前 (用語の説明) を受ける
 */
export function placeExists(outline: Outline, path: readonly string[], extra: readonly string[] = []): boolean {
  const [id, ...tabs] = path;
  if (outline.guide) return tabs.length === 0 && id !== undefined && (outline.guide.ids.includes(id) || extra.includes(id));
  const item = outline.groups.flatMap((g) => g.items).find((i) => i.id === id);
  if (!item) return false;
  let level: readonly Tab[] = item.tabs;
  for (const name of tabs) {
    const found = level.find((t) => t.id === name);
    if (!found) return false;
    level = found.tabs;
  }
  return true;
}
