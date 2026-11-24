/**
 * 頁に書き出すmdの中身をHTMLにする (#3755)。
 *
 * 読むのは GitHub が描く mdの形のうち、段落、見出し、箇条書き、表、囲み、引用、GitHub の注意書き (`> [!NOTE]`)、区切りの線と、
 * 字の中の code、太字、斜体、打ち消し、link、画像、URL。
 * ```` ```dragon ```` の囲みは帯つきの図の塊 (`<pre class="dragon" data-header>`) にし、頁の script の1行の入口が描く。
 * 1行だけに書いた `![名前](path)` は、呼ぶ側 (`include`) が文字のfileの中身を返せばそれを載せ、返さなければ画像にする。
 *
 * mdに書いたHTMLのタグは字のまま出し、頁の要素にしない。書いた人の外から渡ったmdが頁で script を動かさないため。
 * link と画像の行き先は、`http:` と `https:` と `mailto:` と頁の中の場所と相対の path だけを受け、ほかの形 (`javascript:` など) は字にする。
 */

/** mdの1行と、その行がfileの何行目か */
export interface Line {
  text: string;
  line: number;
}

/** 注意書きの種類 */
export type AlertKind = "note" | "tip" | "important" | "warning" | "caution";

/** HTMLにする時に呼ぶ側が決める物 */
export interface RenderHooks {
  /** 1行だけの `![名前](path)` の中身のHTML。画像として出す時は `undefined` */
  include?(name: string, target: string, line: number): string | undefined;
  /** 画像の行き先を書き直す。書き出す先がmdと違うフォルダの時に、相対の path を書き出す先から見た path にする */
  image?(src: string): string;
  /** ```` ```dragon ```` の囲みの記法を受ける。`first` は記法の1行目がfileの何行目か */
  diagram?(source: string, first: number): void;
  /** 注意書きに題を書かない時の題 */
  alerts: Readonly<Record<AlertKind, string>>;
  /** 頭に `note: pop` を書いた頁 (#3877)。図の塊に `data-note="pop"` を付け、1 行目に `note` を書かない図を札で見せる */
  note?: "pop";
}

/** HTMLの字と属性の値として書けるよう逃がす */
export const escapeHtml = (text: string): string =>
  text.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#39;");

/** 行き先が頁を移る形か。scheme を持たない相対の path と頁の中の場所、`http:`、`https:`、`mailto:` だけを受ける */
const safeUrl = (url: string): boolean => !/^[a-z][a-z0-9+.-]*:/iu.test(url) || /^(?:https?|mailto):/iu.test(url);

const FENCE = /^ {0,3}(`{3,}|~{3,})\s*([^\s`]*)[^`]*$/u;
const HEADING = /^ {0,3}(#{1,6})(?:\s+(.*?))?\s*$/u;
const RULE = /^ {0,3}([-*_])(?:[ \t]*\1){2,}[ \t]*$/u;
const QUOTE = /^ {0,3}> ?(.*)$/u;
const LIST = /^( *)([-*+]|\d{1,9}[.)])( +|$)(.*)$/u;
const ALERT = /^\[!(note|tip|important|warning|caution)\][ \t]*(.*)$/iu;
const INCLUDE = /^ {0,3}!\[([^\]]*)\]\(\s*<?([^\s<>()]+)>?\s*\)\s*$/u;
const DELIMITER = /^\s*\|?\s*:?-+:?\s*(?:\|\s*:?-+:?\s*)*\|?\s*$/u;
/** 仮名と漢字と全角の約物。段落の改行をこれらの字の間では詰め、ほかの字の間では空白にする */
const WIDE = /[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}\u30fc\u3000-\u303f\uff00-\uffef]/u;

const blank = (text: string): boolean => text.trim() === "";
const indentOf = (text: string): number => text.length - text.trimStart().length;

/** 囲みの開きの行なら、囲みの字と言葉 */
export function fenceOpen(text: string): { mark: string; lang: string } | undefined {
  const found = FENCE.exec(text);
  return found ? { mark: found[1] ?? "", lang: found[2] ?? "" } : undefined;
}

/** `mark` で開いた囲みを閉じる行か */
export const fenceCloses = (text: string, mark: string): boolean => {
  const close = /^ {0,3}(`{3,}|~{3,})\s*$/u.exec(text)?.[1];
  return close !== undefined && close[0] === mark[0] && close.length >= mark.length;
};

/** 見出しの行なら、深さと字 */
export function headingOf(text: string): { level: number; text: string } | undefined {
  const found = HEADING.exec(text);
  if (!found) return undefined;
  return { level: (found[1] ?? "").length, text: (found[2] ?? "").replace(/\s+#+$/u, "").trim() };
}

/** 段落と箇条書きの続きにならない、別の塊を始める行か */
const startsBlock = (text: string): boolean => fenceOpen(text) !== undefined || headingOf(text) !== undefined || RULE.test(text) || QUOTE.test(text) || LIST.test(text);

/** 表の行を欄に分ける。`\|` と code の中の `|` では分けない */
function cells(row: string): string[] {
  const text = row.trim().replace(/^\|/u, "").replace(/\|$/u, "");
  const out: string[] = [];
  let cell = "";
  let code = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i] as string;
    if (ch === "\\" && text[i + 1] === "|") {
      cell += "|";
      i++;
    } else if (ch === "`") {
      code = !code;
      cell += ch;
    } else if (ch === "|" && !code) {
      out.push(cell.trim());
      cell = "";
    } else cell += ch;
  }
  out.push(cell.trim());
  return out;
}

/**
 * 帯つきの図の塊。頁の script の1行の入口が図にする。
 * 図の種類を class (`pg-kind-flow` など) に書き、縦に流れる図を頁の幅いっぱいに描いて字が大きくなりすぎないよう、頁が読める幅に収める
 */
export function figureHtml(source: string, note?: "pop"): string {
  const kind = /^\s*([a-z][a-z-]*)/u.exec(source.split("\n").find((text) => !blank(text)) ?? "")?.[1];
  return `<div class="pg-figure${kind ? ` pg-kind-${kind}` : ""}"><pre class="dragon" data-header${note ? ` data-note="${note}"` : ""}>${escapeHtml(source)}</pre></div>`;
}

/** code の囲み。`lang` は囲みに書いた言葉か載せた file の拡張子 */
export const codeHtml = (source: string, lang: string): string => `<pre class="pg-code"><code${lang ? ` class="language-${escapeHtml(lang)}"` : ""}>${escapeHtml(source)}</code></pre>`;

/** 段落の行をつなぐ。仮名と漢字の間の改行は詰め、行の終わりの 2 つの空白か `\` は改行にする */
export function joinLines(lines: readonly string[]): string {
  let out = "";
  lines.forEach((raw, i) => {
    const hard = / {2,}$/u.test(raw) || /\\$/u.test(raw);
    const text = raw.trim().replace(/\\$/u, "");
    if (i > 0) {
      const before = out.at(-1) ?? "";
      out += out.endsWith("\uE001") || (WIDE.test(before) && WIDE.test(text[0] ?? "")) ? "" : "\n";
    }
    out += text;
    if (hard && i < lines.length - 1) out += "\uE001";
  });
  return out;
}

/**
 * 字の中の書き方をHTMLにする。code の中は書き方を読まない。
 * 置き換えた所は印 (`\uE000<番号>\uE000`) にして並びに預け、ほかの置き換えが中を読まないようにし、最後に戻す
 */
export function renderInline(text: string, hooks?: Pick<RenderHooks, "image">): string {
  const slots: string[] = [];
  const hold = (html: string): string => `\uE000${slots.push(html) - 1}\uE000`;
  const pass = (source: string, links: boolean): string => {
    let s = source.replace(/(`+)([^`]|[^`][\s\S]*?[^`])\1(?!`)/gu, (_, _ticks: string, code: string) => hold(`<code>${escapeHtml(code.replace(/^ ([\s\S]*) $/u, "$1"))}</code>`));
    s = s.replace(/\\([!-/:-@[-`{-~])/gu, (_, ch: string) => hold(escapeHtml(ch)));
    s = s.replace(/!\[([^\]]*)\]\(\s*<?([^\s<>()]+)>?(?:\s+"([^"]*)")?\s*\)/gu, (whole: string, alt: string, src: string, title?: string) => {
      if (!safeUrl(src)) return hold(escapeHtml(whole));
      const shown = hooks?.image ? hooks.image(src) : src;
      return hold(`<img src="${escapeHtml(shown)}" alt="${escapeHtml(alt)}"${title ? ` title="${escapeHtml(title)}"` : ""} loading="lazy">`);
    });
    if (links) {
      s = s.replace(/\[([^\]]+)\]\(\s*<?([^\s<>()]+)>?(?:\s+"([^"]*)")?\s*\)/gu, (whole: string, label: string, href: string, title?: string) => {
        if (!safeUrl(href)) return hold(escapeHtml(whole));
        const outside = /^https?:/iu.test(href) ? ' target="_blank" rel="noopener"' : "";
        return hold(`<a href="${escapeHtml(href)}"${title ? ` title="${escapeHtml(title)}"` : ""}${outside}>${pass(label, false)}</a>`);
      });
      s = s.replace(/<(https?:\/\/[^\s<>]+)>/gu, (_, url: string) => hold(`<a href="${escapeHtml(url)}" target="_blank" rel="noopener">${escapeHtml(url)}</a>`));
    }
    s = escapeHtml(s);
    if (links) {
      s = s.replace(/(^|[^\w/"'=])(https?:\/\/[^\s<\uE000]*[^\s<\uE000.,;:!?)\]'"。、）」])/gu, (_, before: string, url: string) => `${before}${hold(`<a href="${url}" target="_blank" rel="noopener">${url}</a>`)}`);
    }
    s = s.replace(/\*\*(?=\S)([\s\S]*?\S)\*\*/gu, "<strong>$1</strong>");
    s = s.replace(/(^|[^\p{L}\p{N}])__(?=\S)([\s\S]*?\S)__(?![\p{L}\p{N}])/gu, "$1<strong>$2</strong>");
    s = s.replace(/\*(?=[^\s*])([^*]*?[^\s*])\*/gu, "<em>$1</em>");
    s = s.replace(/(^|[^\p{L}\p{N}])_(?=[^\s_])([^_]*?[^\s_])_(?![\p{L}\p{N}])/gu, "$1<em>$2</em>");
    s = s.replace(/~~(?=\S)([\s\S]*?\S)~~/gu, "<del>$1</del>");
    return s.replaceAll("\uE001", "<br>");
  };
  let html = pass(text, true);
  // 預けた所の中に預けた所が在るので、印が無くなるまで戻す
  while (/\uE000\d+\uE000/u.test(html)) html = html.replace(/\uE000(\d+)\uE000/gu, (_, n: string) => slots[Number(n)] ?? "");
  return html;
}

/** 箇条書きの 1 つ。中身の行は字下げを外してある */
interface Item {
  lines: Line[];
  /** 中身の間に空の行を持つか */
  loose: boolean;
  /** 済んだかの印 (`[ ]` か `[x]`) */
  task?: boolean;
}

/** `start` から始まる箇条書きを読み、項目と、次に読む行の番号を返す */
function readList(lines: readonly Line[], start: number): { ordered: boolean; first: number; items: Item[]; next: number } {
  const head = LIST.exec(lines[start]?.text ?? "") as RegExpExecArray;
  const indent = (head[1] ?? "").length;
  const ordered = /\d/u.test(head[2] ?? "");
  const kind = (marker: string): string => (/\d/u.test(marker) ? marker.slice(-1) : marker);
  const items: Item[] = [];
  let i = start;
  let gapBetween = false;
  while (i < lines.length) {
    const found = LIST.exec(lines[i]?.text ?? "");
    if (!found || (found[1] ?? "").length !== indent || kind(found[2] ?? "") !== kind(head[2] ?? "")) break;
    const spaces = (found[3] ?? "").length;
    const content = indent + (found[2] ?? "").length + (spaces > 4 || spaces === 0 ? 1 : spaces);
    let first = found[4] ?? "";
    let task: boolean | undefined;
    const box = /^\[([ xX])\][ \t]+/u.exec(first);
    if (box) {
      task = box[1] !== " ";
      first = first.slice(box[0].length);
    }
    const body: Line[] = [{ text: first, line: lines[i]?.line ?? 0 }];
    let loose = false;
    i++;
    while (i < lines.length) {
      const text = lines[i]?.text ?? "";
      if (blank(text)) {
        // 空の行の後が字下げした続きなら項目の中、そうでなければ項目の終わり
        let j = i + 1;
        while (j < lines.length && blank(lines[j]?.text ?? "")) j++;
        if (j < lines.length && indentOf(lines[j]?.text ?? "") >= content) {
          loose = true;
          for (; i < j; i++) body.push({ text: "", line: lines[i]?.line ?? 0 });
          continue;
        }
        if (j < lines.length && LIST.test(lines[j]?.text ?? "") && indentOf(lines[j]?.text ?? "") === indent) gapBetween = true;
        break;
      }
      if (indentOf(text) >= content) {
        body.push({ text: text.slice(content), line: lines[i]?.line ?? 0 });
        i++;
        continue;
      }
      // 字下げしない続きの行は、前の行の段落の続きとして読む
      if (!startsBlock(text) && !blank(body.at(-1)?.text ?? "")) {
        body.push({ text: text.trim(), line: lines[i]?.line ?? 0 });
        i++;
        continue;
      }
      break;
    }
    items.push({ lines: body, loose, ...(task === undefined ? {} : { task }) });
    if (i < lines.length && blank(lines[i]?.text ?? "")) {
      let j = i;
      while (j < lines.length && blank(lines[j]?.text ?? "")) j++;
      const nextItem = LIST.exec(lines[j]?.text ?? "");
      if (!nextItem || (nextItem[1] ?? "").length !== indent) break;
      gapBetween = true;
      i = j;
    }
  }
  const first = ordered ? Number.parseInt(head[2] ?? "1", 10) : 1;
  if (gapBetween) for (const item of items) item.loose = true;
  return { ordered, first, items, next: i };
}

/** mdの行の並びをHTMLにする */
export function renderBlocks(lines: readonly Line[], hooks: RenderHooks): string {
  const out: string[] = [];
  let i = 0;
  while (i < lines.length) {
    const { text, line } = lines[i] as Line;
    if (blank(text)) {
      i++;
      continue;
    }
    const fence = fenceOpen(text);
    if (fence) {
      const body: string[] = [];
      i++;
      const first = lines[i]?.line ?? line + 1;
      while (i < lines.length && !fenceCloses(lines[i]?.text ?? "", fence.mark)) body.push(lines[i++]?.text ?? "");
      i++;
      const source = body.join("\n");
      if (fence.lang === "dragon") {
        hooks.diagram?.(source, first);
        out.push(figureHtml(source, hooks.note));
      } else out.push(codeHtml(source, fence.lang));
      continue;
    }
    const heading = headingOf(text);
    if (heading) {
      out.push(`<h${heading.level} class="pg-h">${renderInline(heading.text, hooks)}</h${heading.level}>`);
      i++;
      continue;
    }
    if (RULE.test(text)) {
      out.push("<hr>");
      i++;
      continue;
    }
    if (QUOTE.test(text)) {
      const inner: Line[] = [];
      while (i < lines.length && QUOTE.test(lines[i]?.text ?? "")) inner.push({ text: QUOTE.exec(lines[i]?.text ?? "")?.[1] ?? "", line: lines[i++]?.line ?? 0 });
      const alert = ALERT.exec(inner[0]?.text ?? "");
      if (alert) {
        const kind = (alert[1] ?? "note").toLowerCase() as AlertKind;
        const title = (alert[2] ?? "").trim();
        out.push(`<div class="pg-alert pg-alert-${kind}"><p class="pg-alert-title">${title ? renderInline(title, hooks) : escapeHtml(hooks.alerts[kind])}</p>${renderBlocks(inner.slice(1), hooks)}</div>`);
      } else out.push(`<blockquote>${renderBlocks(inner, hooks)}</blockquote>`);
      continue;
    }
    if (text.includes("|") && DELIMITER.test(lines[i + 1]?.text ?? "") && (lines[i + 1]?.text ?? "").includes("-")) {
      const head = cells(text);
      const align = cells(lines[i + 1]?.text ?? "").map((cell) => (cell.startsWith(":") && cell.endsWith(":") ? "center" : cell.endsWith(":") ? "right" : cell.startsWith(":") ? "left" : ""));
      const style = (n: number): string => (align[n] ? ` style="text-align:${align[n]}"` : "");
      i += 2;
      const rows: string[][] = [];
      while (i < lines.length && !blank(lines[i]?.text ?? "") && (lines[i]?.text ?? "").includes("|")) rows.push(cells(lines[i++]?.text ?? ""));
      const th = head.map((cell, n) => `<th${style(n)}>${renderInline(cell, hooks)}</th>`).join("");
      const tr = rows.map((row) => `<tr>${head.map((_, n) => `<td${style(n)}>${renderInline(row[n] ?? "", hooks)}</td>`).join("")}</tr>`).join("");
      out.push(`<div class="pg-table"><table><thead><tr>${th}</tr></thead><tbody>${tr}</tbody></table></div>`);
      continue;
    }
    if (LIST.test(text) && !blank(LIST.exec(text)?.[4] ?? "x")) {
      const list = readList(lines, i);
      const items = list.items.map((item) => {
        const mark = item.task === undefined ? "" : `<input type="checkbox" disabled${item.task ? " checked" : ""}> `;
        if (item.loose) return `<li>${mark}${renderBlocks(item.lines, hooks)}</li>`;
        // 詰めた項目は最初の段落を <p> で包まない
        let end = 0;
        while (end < item.lines.length && !blank(item.lines[end]?.text ?? "") && (end === 0 || !startsBlock(item.lines[end]?.text ?? ""))) end++;
        const lead = renderInline(joinLines(item.lines.slice(0, end).map((l) => l.text)), hooks);
        return `<li>${mark}${lead}${renderBlocks(item.lines.slice(end), hooks)}</li>`;
      });
      const tag = list.ordered ? "ol" : "ul";
      out.push(`<${tag}${list.ordered && list.first !== 1 ? ` start="${list.first}"` : ""}>${items.join("")}</${tag}>`);
      i = list.next;
      continue;
    }
    const paragraph: string[] = [];
    while (i < lines.length && !blank(lines[i]?.text ?? "") && (paragraph.length === 0 || !startsBlock(lines[i]?.text ?? ""))) paragraph.push(lines[i++]?.text ?? "");
    const include = paragraph.length === 1 ? INCLUDE.exec(paragraph[0] ?? "") : null;
    const included = include ? hooks.include?.(include[1] ?? "", include[2] ?? "", line) : undefined;
    out.push(included ?? `<p>${renderInline(joinLines(paragraph), hooks)}</p>`);
  }
  return out.join("\n");
}

/** mdの字を行の並びにする。`first` は1行目が file の何行目か */
export const linesOf = (text: string, first = 1): Line[] => {
  const all = text.replace(/\r\n?/gu, "\n").split("\n");
  if (all.at(-1) === "") all.pop();
  return all.map((t, n) => ({ text: t, line: first + n }));
};
