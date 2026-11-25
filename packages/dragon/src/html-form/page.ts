/**
 * dragonのMarkdownの頁 (`dragon export`が頁に書き出すmd) とHTMLの頁 (`<dragon-page>`) を相互に変換する (#3908)。
 *
 * 頭の`---`の間の行は`<dragon-page>`の属性になり、`#`は`<h1>`、`##`から`######`は`<section>`とその深さの見出しになる。
 * 引用は`<blockquote>`、`<details>`と`<summary>`はそのまま、表は`<table>`、並びは`<ul>`と`<ol>`、囲みは`<pre><code>`になる。
 * 用語へのリンク (`[語](glossary.md#語)`) は`<a>`、読み込むfileの行 (`![名前](path.md)`) は`<img>`になる。
 * dragonの囲みはHTMLの形の図 (`<dg-<種類>>`) になり、HTMLの頁の`<pre class="dragon">`の塊とHTMLの形の図はdragonの囲みに戻る。
 * 戻した頁は整えた形で、囲みの中の記法と空行は元と同じにならない。
 */
import { attrOf, elementsOf, escapeAttr, escapeText, type HtmlElement, type HtmlNode, parseHtml, serialize, textOf } from "./html";
import { FORM_MESSAGES } from "./messages";
import { type ConvertOptions, type FormError, notationToHtml, readFigureElement } from "./convert";
import { isFigureTag } from "./figure";
import { PAGE_TAG } from "./shape";
import { dedent } from "../embed/dedent";
import { fenceCloses, fenceOpen, headingOf } from "../page/markdown";
import { printNotation } from "../printer";
import { DEFAULT_LANG } from "../words";

/** mdの行と、元のfileの行の番号 */
interface Row {
  text: string;
  line: number;
}

type Block =
  | { t: "heading"; level: number; text: string }
  | { t: "fence"; lang: string; text: string; line: number }
  | { t: "quote"; blocks: Block[] }
  | { t: "details"; summary: string; blocks: Block[] }
  | { t: "table"; rows: string[][] }
  | { t: "list"; ordered: boolean; items: Block[][] }
  | { t: "html"; text: string }
  | { t: "hr" }
  | { t: "para"; text: string };

const LIST = /^(\s*)([-*+]|\d+[.)])\s+(.*)$/u;
const RULE = /^\s*([-*_])(?:\s*\1){2,}\s*$/u;
const TABLE_RULE = /^\s*\|?\s*:?-{3,}:?\s*(?:\|\s*:?-{3,}:?\s*)*\|?\s*$/u;

/** 表の行の升の字 */
const cells = (text: string): string[] =>
  text
    .trim()
    .replace(/^\|/u, "")
    .replace(/\|$/u, "")
    .split(/(?<!\\)\|/u)
    .map((cell) => cell.trim());

/** 塊の始まりの行か。段落の行を続けない */
const opensBlock = (rows: readonly Row[], i: number): boolean => {
  const text = rows[i]?.text ?? "";
  return fenceOpen(text) !== undefined || headingOf(text) !== undefined || /^\s*>/u.test(text) || /^\s*<\/?[a-zA-Z]/u.test(text) || LIST.test(text) || RULE.test(text) || (text.includes("|") && TABLE_RULE.test(rows[i + 1]?.text ?? ""));
};

/** mdの行を塊に分ける */
function blocksOf(rows: readonly Row[]): Block[] {
  const blocks: Block[] = [];
  let i = 0;
  while (i < rows.length) {
    const { text, line } = rows[i] as Row;
    if (text.trim() === "") {
      i++;
      continue;
    }
    const fence = fenceOpen(text);
    if (fence) {
      let end = i + 1;
      while (end < rows.length && !fenceCloses(rows[end]?.text ?? "", fence.mark)) end++;
      blocks.push({ t: "fence", lang: fence.lang, text: rows.slice(i + 1, end).map((row) => row.text).join("\n"), line: line + 1 });
      i = end + 1;
      continue;
    }
    const heading = headingOf(text);
    if (heading) {
      blocks.push({ t: "heading", level: heading.level, text: heading.text });
      i++;
      continue;
    }
    if (/^\s*<details\b/iu.test(text)) {
      let depth = 0;
      let end = i;
      for (; end < rows.length; end++) {
        const row = rows[end]?.text ?? "";
        depth += (row.match(/<details\b/giu) ?? []).length - (row.match(/<\/details>/giu) ?? []).length;
        if (depth <= 0) break;
      }
      const inner = rows.slice(i, Math.min(end + 1, rows.length));
      const summary = /<summary>([\s\S]*?)<\/summary>/iu.exec(inner.map((row) => row.text).join("\n"))?.[1]?.trim() ?? "";
      const summaryEnd = inner.findIndex((row) => /<\/summary>/iu.test(row.text));
      const start = summaryEnd >= 0 ? summaryEnd + 1 : 1;
      const body = inner.slice(start, Math.max(start, inner.length - 1));
      const closing = inner[inner.length - 1];
      if (closing && inner.length - 1 >= start) {
        const before = closing.text.replace(/<\/details>\s*$/iu, "");
        if (before.trim() !== "") body.push({ text: before, line: closing.line });
      }
      blocks.push({ t: "details", summary, blocks: blocksOf(body) });
      i = end + 1;
      continue;
    }
    if (/^\s*<\/?[a-zA-Z]/u.test(text)) {
      let end = i;
      while (end < rows.length && rows[end]?.text.trim() !== "") end++;
      blocks.push({ t: "html", text: rows.slice(i, end).map((row) => row.text).join("\n") });
      i = end;
      continue;
    }
    if (/^\s*>/u.test(text)) {
      let end = i;
      while (end < rows.length && /^\s*>/u.test(rows[end]?.text ?? "")) end++;
      blocks.push({ t: "quote", blocks: blocksOf(rows.slice(i, end).map((row) => ({ text: row.text.replace(/^\s*>\s?/u, ""), line: row.line }))) });
      i = end;
      continue;
    }
    if (text.includes("|") && TABLE_RULE.test(rows[i + 1]?.text ?? "")) {
      let end = i + 2;
      while (end < rows.length && rows[end]?.text.includes("|") && rows[end]?.text.trim() !== "") end++;
      blocks.push({ t: "table", rows: [cells(text), ...rows.slice(i + 2, end).map((row) => cells(row.text))] });
      i = end;
      continue;
    }
    const item = LIST.exec(text);
    if (item) {
      const indent = (item[1] as string).length;
      const ordered = /\d/u.test(item[2] ?? "");
      const items: Row[][] = [];
      let end = i;
      while (end < rows.length) {
        const row = rows[end] as Row;
        const found = LIST.exec(row.text);
        if (found && (found[1] as string).length === indent) items.push([{ text: found[3] ?? "", line: row.line }]);
        else if (row.text.trim() !== "" && (row.text.length - row.text.trimStart().length > indent || !opensBlock(rows, end)) && items.length > 0) items[items.length - 1]?.push({ text: row.text.slice(Math.min(indent + 2, row.text.length - row.text.trimStart().length)), line: row.line });
        else break;
        end++;
      }
      blocks.push({ t: "list", ordered, items: items.map(blocksOf) });
      i = end;
      continue;
    }
    if (RULE.test(text)) {
      blocks.push({ t: "hr" });
      i++;
      continue;
    }
    let end = i + 1;
    while (end < rows.length && rows[end]?.text.trim() !== "" && !opensBlock(rows, end)) end++;
    blocks.push({ t: "para", text: rows.slice(i, end).map((row) => row.text.trim()).join("\n") });
    i = end;
  }
  return blocks;
}

/** mdの行の中の書き方をHTMLにする。コード、画像、リンク、太字、斜体と、行の中のHTMLの要素を読む */
function inline(text: string): string {
  let out = "";
  let i = 0;
  while (i < text.length) {
    const rest = text.slice(i);
    const code = /^(`+)([\s\S]*?[^`])\1(?!`)/u.exec(rest);
    if (code) {
      out += `<code>${escapeText((code[2] ?? "").trim())}</code>`;
      i += code[0].length;
      continue;
    }
    const image = /^!\[([^\]]*)\]\(([^)\s]*)\)/u.exec(rest);
    if (image) {
      out += `<img alt="${escapeAttr(image[1] ?? "")}" src="${escapeAttr(image[2] ?? "")}">`;
      i += image[0].length;
      continue;
    }
    const link = /^\[((?:[^\]\\]|\\.)*)\]\(([^)\s]*)\)/u.exec(rest);
    if (link) {
      out += `<a href="${escapeAttr(link[2] ?? "")}">${inline(link[1] ?? "")}</a>`;
      i += link[0].length;
      continue;
    }
    const strong = /^\*\*([\s\S]+?)\*\*/u.exec(rest);
    if (strong) {
      out += `<strong>${inline(strong[1] ?? "")}</strong>`;
      i += strong[0].length;
      continue;
    }
    const em = /^\*([^*\s][^*]*?)\*/u.exec(rest);
    if (em) {
      out += `<em>${inline(em[1] ?? "")}</em>`;
      i += em[0].length;
      continue;
    }
    const tag = /^<\/?[a-zA-Z][^<>]*>/u.exec(rest);
    if (tag) {
      out += tag[0];
      i += tag[0].length;
      continue;
    }
    if (rest.startsWith("\\") && rest.length > 1) {
      out += escapeText(rest[1] ?? "");
      i += 2;
      continue;
    }
    out += escapeText(rest[0] ?? "");
    i++;
  }
  return out;
}

/** 字の各行を字下げする。空の行は字下げしない */
const indent = (text: string, pad: string): string =>
  text
    .split("\n")
    .map((row) => (row === "" ? row : `${pad}${row}`))
    .join("\n");

/** mdの頭の`---`の間の行。値を囲む引用符は外す */
function frontMatter(rows: readonly Row[]): { values: [string, string][]; next: number } {
  if (rows[0]?.text.trim() !== "---") return { values: [], next: 0 };
  const end = rows.findIndex((row, i) => i > 0 && row.text.trim() === "---");
  if (end < 0) return { values: [], next: 0 };
  const values: [string, string][] = [];
  for (const row of rows.slice(1, end)) {
    const found = /^([A-Za-z][\w-]*):\s*(.*?)\s*$/u.exec(row.text);
    if (found) values.push([found[1] ?? "", (found[2] ?? "").replace(/^(["'])(.*)\1$/u, "$2")]);
  }
  return { values, next: end + 1 };
}

/** dragonのMarkdownの頁をHTMLの頁 (`<dragon-page>`) に変換する。dragonの囲みの記法を読めない時は、mdの行を添えた誤りを返す */
export function markdownToHtml(markdown: string, options: ConvertOptions = {}): { ok: true; html: string } | { ok: false; errors: FormError[] } {
  const rows = markdown.replace(/\r\n?/gu, "\n").split("\n").map((text, i): Row => ({ text, line: i + 1 }));
  const head = frontMatter(rows);
  const errors: FormError[] = [];
  // 頭に `note: pop` を書いた頁の図は、1行目にnoteを書かなくても箱の説明を札で見せる。HTMLの形の図は頁の外でも同じに描けるようnoteを持つ
  const figureOptions: ConvertOptions = head.values.some(([name, value]) => name === "note" && value === "pop") ? { ...options, note: "pop" } : options;
  const render = (blocks: readonly Block[], pad: string): string[] =>
    blocks.flatMap((block): string[] => {
      switch (block.t) {
        case "heading":
          return [`${pad}<h${block.level}>${inline(block.text)}</h${block.level}>`];
        case "fence": {
          if (block.lang === "dragon") {
            const figure = notationToHtml(block.text, figureOptions);
            if (figure.ok) return [indent(figure.html.trimEnd(), pad)];
            errors.push(...figure.errors.map((error) => ({ line: block.line + error.line - 1, column: error.column, element: "", message: error.message })));
            return [];
          }
          const lang = block.lang === "" ? "" : ` class="language-${escapeAttr(block.lang)}"`;
          return [`${pad}<pre><code${lang}>${escapeText(block.text)}</code></pre>`];
        }
        case "quote":
          return [`${pad}<blockquote>`, ...render(block.blocks, `${pad}  `), `${pad}</blockquote>`];
        case "details":
          return [`${pad}<details>`, `${pad}  <summary>${inline(block.summary)}</summary>`, ...render(block.blocks, `${pad}  `), `${pad}</details>`];
        case "table": {
          const [header = [], ...body] = block.rows;
          return [
            `${pad}<table>`,
            `${pad}  <thead>`,
            `${pad}    <tr>${header.map((cell) => `<th>${inline(cell)}</th>`).join("")}</tr>`,
            `${pad}  </thead>`,
            `${pad}  <tbody>`,
            ...body.map((row) => `${pad}    <tr>${row.map((cell) => `<td>${inline(cell)}</td>`).join("")}</tr>`),
            `${pad}  </tbody>`,
            `${pad}</table>`,
          ];
        }
        case "list": {
          const tag = block.ordered ? "ol" : "ul";
          return [
            `${pad}<${tag}>`,
            ...block.items.map((item) => {
              const [first, ...more] = item;
              if (first?.t === "para" && more.length === 0) return `${pad}  <li>${inline(first.text)}</li>`;
              return [`${pad}  <li>`, ...render(item, `${pad}    `), `${pad}  </li>`].join("\n");
            }),
            `${pad}</${tag}>`,
          ];
        }
        case "html":
          return [indent(block.text, pad)];
        case "hr":
          return [`${pad}<hr>`];
        case "para":
          return [`${pad}<p>${inline(block.text).split("\n").join(`\n${pad}`)}</p>`];
      }
      return [];
    });
  // 見出しの深さで節を入れ子にする。同じか浅い見出しが来ると、開いている節を閉じる
  const out: string[] = [];
  const open: number[] = [];
  let group: Block[] = [];
  const pad = (): string => "  ".repeat(open.length + 1);
  const flush = (): void => {
    out.push(...render(group, pad()));
    group = [];
  };
  for (const block of blocksOf(rows.slice(head.next))) {
    if (block.t !== "heading" || block.level === 1) {
      group.push(block);
      continue;
    }
    flush();
    while (open.length > 0 && (open[open.length - 1] as number) >= block.level) {
      open.pop();
      out.push(`${pad()}</section>`);
    }
    out.push(`${pad()}<section>`);
    open.push(block.level);
    out.push(`${pad()}<h${block.level}>${inline(block.text)}</h${block.level}>`);
  }
  flush();
  while (open.length > 0) {
    open.pop();
    out.push(`${pad()}</section>`);
  }
  if (errors.length > 0) return { ok: false, errors };
  const attrs = head.values.map(([name, value]) => ` ${name.toLowerCase()}="${escapeAttr(value)}"`).join("");
  return { ok: true, html: `<${PAGE_TAG}${attrs}>\n${out.join("\n")}\n</${PAGE_TAG}>\n` };
}

/** 行の中の要素をmdの書き方にする */
function inlineMarkdown(nodes: readonly HtmlNode[]): string {
  return nodes
    .map((node): string => {
      if (node.type === "text") return node.text;
      const inner = inlineMarkdown(node.children);
      switch (node.name) {
        case "a":
          return `[${inner}](${attrOf(node, "href") ?? ""})`;
        case "code":
          return `\`${textOf(node)}\``;
        case "strong":
        case "b":
          return `**${inner}**`;
        case "em":
        case "i":
          return `*${inner}*`;
        case "img":
          return `![${attrOf(node, "alt") ?? ""}](${attrOf(node, "src") ?? ""})`;
        case "br":
          return "\n";
        default:
          return serialize(node);
      }
    })
    .join("");
}

/** 行ごとに前後の空白を外し、空の行を除く */
const tidy = (text: string): string =>
  text
    .split("\n")
    .map((row) => row.trim())
    .filter((row) => row !== "")
    .join("\n");

/** 子の要素をmdの塊の並びにする。頭に `note: pop` を持つ頁 (`options.note`) の図は、頁と同じnoteを書き戻さない */
function markdownBlocks(nodes: readonly HtmlNode[], options: ConvertOptions, errors: FormError[]): string[] {
  const blocks: string[] = [];
  for (const node of nodes) {
    if (node.type === "text") {
      if (node.text.trim() !== "") blocks.push(tidy(node.text));
      continue;
    }
    if (isFigureTag(node.name)) {
      const read = readFigureElement(node, options);
      if (!read.ok) {
        errors.push(...read.errors);
        continue;
      }
      const notation = options.note !== undefined && read.diagram.note === options.note ? printNotation({ ...read.diagram, note: undefined }) : read.notation;
      blocks.push(`\`\`\`dragon\n${notation.trimEnd()}\n\`\`\``);
      continue;
    }
    const heading = /^h([1-6])$/u.exec(node.name);
    if (heading) {
      blocks.push(`${"#".repeat(Number(heading[1]))} ${tidy(inlineMarkdown(node.children)).replaceAll("\n", " ")}`);
      continue;
    }
    switch (node.name) {
      case "section":
      case "div":
      case "main":
      case "article":
        blocks.push(...markdownBlocks(node.children, options, errors));
        break;
      case "p":
        blocks.push(tidy(inlineMarkdown(node.children)));
        break;
      case "blockquote":
        blocks.push(
          markdownBlocks(node.children, options, errors)
            .join("\n\n")
            .split("\n")
            .map((row) => (row === "" ? ">" : `> ${row}`))
            .join("\n"),
        );
        break;
      case "details": {
        const summary = elementsOf(node).find((child) => child.name === "summary");
        const body = markdownBlocks(
          node.children.filter((child) => child !== summary),
          options,
          errors,
        );
        blocks.push(["<details>", ...(summary ? [`<summary>${tidy(inlineMarkdown(summary.children))}</summary>`] : []), "", ...body.flatMap((block) => [block, ""]), "</details>"].join("\n"));
        break;
      }
      case "table": {
        const rows = rowsOf(node).map((row) => elementsOf(row).filter((cell) => cell.name === "th" || cell.name === "td").map((cell) => tidy(inlineMarkdown(cell.children)).replaceAll("\n", " ")));
        const [header = [], ...body] = rows;
        blocks.push([`| ${header.join(" | ")} |`, `|${header.map(() => "---").join("|")}|`, ...body.map((row) => `| ${row.join(" | ")} |`)].join("\n"));
        break;
      }
      case "ul":
      case "ol": {
        const items = elementsOf(node).filter((child) => child.name === "li");
        blocks.push(
          items
            .map((item, i) => {
              const marker = node.name === "ol" ? `${i + 1}. ` : "- ";
              const parts = elementsOf(item).some((child) => ["p", "ul", "ol", "pre", "blockquote", "table", "details"].includes(child.name) || isFigureTag(child.name))
                ? markdownBlocks(item.children, options, errors).join("\n\n")
                : tidy(inlineMarkdown(item.children));
              return `${marker}${parts.split("\n").join(`\n${" ".repeat(marker.length)}`)}`;
            })
            .join("\n"),
        );
        break;
      }
      case "pre": {
        const code = elementsOf(node).find((child) => child.name === "code");
        const dragonBlock = (attrOf(node, "class") ?? "").split(/\s+/u).includes("dragon");
        const lang = dragonBlock ? "dragon" : (/(?:^|\s)language-(\S+)/u.exec(attrOf(code ?? node, "class") ?? "")?.[1] ?? "");
        const text = dragonBlock ? dedent(textOf(node)) : textOf(code ?? node);
        blocks.push(`\`\`\`${lang}\n${text.replace(/\n+$/u, "")}\n\`\`\``);
        break;
      }
      case "hr":
        blocks.push("---");
        break;
      case "img":
        blocks.push(inlineMarkdown([node]));
        break;
      default:
        blocks.push(serialize(node));
    }
  }
  return blocks.filter((block) => block !== "");
}

/** 表の行。`thead`と`tbody`の中の行も並べる */
const rowsOf = (table: HtmlElement): HtmlElement[] => elementsOf(table).flatMap((child) => (child.name === "tr" ? [child] : ["thead", "tbody", "tfoot"].includes(child.name) ? elementsOf(child).filter((row) => row.name === "tr") : []));

/** HTMLの頁 (`<dragon-page>`) をdragonのMarkdownの頁に変換する。HTMLの形の図を読めない時は、要素の行と名前を添えた誤りを返す */
export function htmlToMarkdown(html: string, options: ConvertOptions = {}): { ok: true; markdown: string } | { ok: false; errors: FormError[] } {
  const find = (node: HtmlElement): HtmlElement | undefined => (node.name === PAGE_TAG ? node : elementsOf(node).map(find).find((found) => found !== undefined));
  const page = find(parseHtml(html));
  if (!page) return { ok: false, errors: [{ line: 1, column: 1, element: PAGE_TAG, message: FORM_MESSAGES[options.lang ?? DEFAULT_LANG].noPage }] };
  const errors: FormError[] = [];
  const note = attrOf(page, "note");
  const blocks = markdownBlocks(page.children, note === "pop" ? { ...options, note: "pop" } : options, errors);
  if (errors.length > 0) return { ok: false, errors };
  const head = page.attrs.length > 0 ? `---\n${page.attrs.map(([name, value]) => `${name}: ${value}`).join("\n")}\n---\n\n` : "";
  return { ok: true, markdown: `${head}${blocks.join("\n\n")}\n` };
}
