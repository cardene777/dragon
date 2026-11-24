/**
 * 頁に書き出すmdの見出しを読み、頁の組み立てに分ける (#3755)。
 *
 * 見出しの深さは固定し、`#` は頁の題、最初の `##` より前は入口、`##` は段、`###` は項目、
 * `####` は入口と項目の頁の中のタブ、`#####` はタブの中のタブにする。`######` は中身の見出しのまま残す。
 * 囲み (```` ``` ````) の中の `#` は見出しに数えない。
 * 頭の `---` の間には `title` (頁の題) と `layout` (頁の組み立て) を書ける。
 * 帯のボタンの並び (`header-buttons`、名前を `,` で区切る) と帯の色 (`header-<色の欄>`) も 1 行ずつ書け、頁の帯の設定の塊になる (#3789)。
 * 知らないボタンの名前と、2 度書いたボタンと、`;` `<` `>` `{` `}` `"` `\` を含む色の値と、知らない `header-` の行は、行の番号つきで断る。ほかの行は読まない。
 *
 * 場所の名前は見出しの字から作る。項目は頁の中で、タブは同じ所に並ぶタブの中で重ならないよう分ける。
 */
import { BUILTIN_BUTTONS, HEADER_COLOR_KEYS } from "../frame/names";
import { fenceCloses, fenceOpen, headingOf, type Line } from "./markdown";
import { slugger } from "./slug";
import type { PageMessages } from "./text";

/** 頁の組み立て。`entry` は全体の図を入口にし、`sidebar` は左の目次と右の頁、`tabs` は上の段のタブと段の中の項目のタブ */
export type Layout = "entry" | "sidebar" | "tabs";
export const LAYOUTS: readonly Layout[] = ["entry", "sidebar", "tabs"];

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
  /** 頭に `header-` の行を書いた時だけ持つ */
  header?: PageHeader;
  entry: Part;
  groups: Group[];
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
  let title = head.values.get("title")?.text || undefined;
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
  return { ok: true, outline: { title, layout, ...(header ? { header } : {}), entry, groups } };
}

/** 頁の中の場所の名前の並び (`項目/タブ/中のタブ`) が、頁に在る場所か */
export function placeExists(outline: Outline, path: readonly string[]): boolean {
  const [id, ...tabs] = path;
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
