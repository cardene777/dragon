/**
 * 編集画面 (#2995、#3030、#3031)。前の編集画面と同じ 3 列で、左に棚、中に書く欄、右に動く図を置く。
 *
 * 図は `@cardenelabs/dragon` の再生の部品 (`mountDiagram`) で描き、頁の側では SVG を組まない (`editor/Stage.tsx`)。
 * 言葉と明暗と色味はサイトの上の帯が持ち、ここは受け取って図に当てる (#3033)。
 * 図の側の色味の釦はこの図だけの色味を選び、帯の色味が替わると帯の色味に戻る。
 * 記法と JSON のどちらの側でも書け、書いた側から図ともう一方へ反映する。
 * 誤りがあるあいだは、誤りを行番号付きで欄の下の知らせの欄に並べ、図は最後に描けた物を残す。
 * 行番号を押すと、書く欄がその行を選ぶ。
 * 描けた図に字の重なりがある時は、知らせの欄に「読めています」と並べて重なりの欄を出し、重なりを段の札と文で 1 件 1 行で並べる。
 * 段の札を押すと図がその段へ移って止まり、図の側が今の段で重なる字を囲む (#3178)。
 *
 * 記法は行の頭の英語の語で書く dragon記法で (#3137)、記法から言葉は決まらない。
 * 記法の誤りは頁の言葉で出し、JSON の側から書き戻す時はどの頁でも同じ dragon記法を書く。
 */
import {
  type Diagram,
  describeOverlap,
  diagramKind,
  loadFor,
  loadValidator,
  NOTATION_WORDS,
  parseNotation,
  printNotation,
  readDiagram,
  renderDiagram,
  type Theme,
} from "@cardenelabs/dragon/light";
import { type CSSProperties, Fragment, type ReactElement, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";

import { paintJson, paintNotation, type Span } from "./editor/highlight";
import { fieldNotices, jsonErrorLine, lineNotices, type Notice } from "./editor/notices";
import { Shelf } from "./editor/Shelf";
import { LATER_SHELF } from "./editor/shelf-first";
import type { PartId } from "./editor/shelf-items";
import { MIN_WIDTHS, type Pane, readWidths, resizeTo, saveWidths, shownWidths, type Widths } from "./editor/split";
import { SplitHandle } from "./editor/SplitHandle";
import { Stage } from "./editor/Stage";
import { useEditorBand } from "./editor/useEditorBand";
import { type ExampleKey, exampleText, FIRST_EXAMPLE, firstScreenText, LATER_EXAMPLES, NEW_FILE_NAME, TEMPLATE, whichExample } from "./examples";
import { fromHash, fromPackedHash, hashKind, toHash } from "./share";
import { definitionsFailed, definitionsReady, kindFailed, kindReady, onDefinitionsSettled, onKindSettled, onValidatorSettled, validatorFailed, validatorReady } from "./site/kinds";
import { useLater } from "./site/later";
import { type CountedPart, type Lang, TEXT } from "./text";

type Tab = "notation" | "json";

interface Problem {
  /** 誤りを出す言葉。記法の誤りも JSON の誤りも頁の言葉 (#3137) */
  lang: Lang;
  notices: Notice[];
}

/** 図の種類の部品を待っている印。誤りとは別に持ち、図の側は前の図を残し、状態の欄は読み込み中を出す (#3248, #3259) */
const KIND_WAITING = "waiting";

type Outcome = { ok: true; diagram: Diagram } | { ok: false; problem: Problem | typeof KIND_WAITING };

/** 状態の欄で数える、図の種類の主な部品とその数。呼び名は部品の頁に揃える (#3261) */
function mainParts(diagram: Diagram): [CountedPart, number] {
  switch (diagram.kind) {
    case "git":
      return ["branch", diagram.blocks.branch?.length ?? 0];
    case "time":
      return ["row", diagram.blocks.row?.length ?? 0];
    case "tree":
      return ["box", diagram.steps.flatMap((step) => step.events).filter((event) => event.type === "leaf" || event.type === "node").length];
    case "lineup":
      return ["lane", diagram.blocks.box?.length ?? 0];
    case "try":
      return ["part", diagram.blocks.part?.length ?? 0];
    case "chart":
      return ["item", diagram.chart?.items.length ?? 0];
    default:
      return ["box", diagram.blocks.box?.length ?? 0];
  }
}

const messageOf = (error: unknown): string => (error instanceof Error ? error.message : String(error));

/**
 * 図の種類の塊 (描く部品と、その種類の個別ブロックの読み方、#3349) が届くまで、読まずに待つ。
 * 届いていれば `undefined`、届いていなければ待つ印、読めなかった時は誤り
 */
function waitKind(kind: string | undefined, lang: Lang): Outcome | undefined {
  if (kindReady(kind)) return undefined;
  return { ok: false, problem: kindFailed(kind) ? { lang, notices: [{ text: TEXT[lang].site.catalog.loadFailed }] } : KIND_WAITING };
}

/**
 * 記法が足したブロックの定義の行を持つ時、定義を読む処理の塊 (#3399) が届くまで読まずに待つ (#3407)。
 * 届いていれば `undefined`、届いていなければ待つ印、読めなかった時は誤り
 */
function waitDefinitions(text: string, lang: Lang): Outcome | undefined {
  if (definitionsReady(text)) return undefined;
  return { ok: false, problem: definitionsFailed(text) ? { lang, notices: [{ text: TEXT[lang].site.catalog.loadFailed }] } : KIND_WAITING };
}

/**
 * 原本の形の検査の塊 (#3400) が届くまで、原本の JSON を読まずに待つ。
 * 届いていれば `undefined`、届いていなければ待つ印、読めなかった時は誤り
 */
function waitValidator(lang: Lang): Outcome | undefined {
  if (validatorReady()) return undefined;
  return { ok: false, problem: validatorFailed() ? { lang, notices: [{ text: TEXT[lang].site.catalog.loadFailed }] } : KIND_WAITING };
}

/**
 * 原本の形を検査し、描けるかまで確かめる。描けない図を受け取ると、最後に描けた図を失う。
 * `lang` は誤りを出す言葉。`json` を渡した時は、形の誤りの場所を JSON の字の行へ写す。
 */
function check(input: unknown, lang: Lang, json?: string): Outcome {
  const read = readDiagram(input, { lang });
  if (!read.ok) return { ok: false, problem: { lang, notices: fieldNotices(read.errors, json) } };
  const waiting = waitKind(read.diagram.kind, lang);
  if (waiting) return waiting;
  try {
    // 描けない時の断りの文を頁に出すので、頁の言葉を渡す (既定は英語、#3338)
    renderDiagram(read.diagram, { lang });
  } catch (error) {
    return { ok: false, problem: { lang, notices: [{ text: TEXT[lang].cannotDraw(messageOf(error)) }] } };
  }
  return { ok: true, diagram: read.diagram };
}

/** 記法を読む。誤りは頁の言葉で出す。後から読む種類の記法は種類の塊が、足したブロックの定義を持つ記法は定義を読む処理の塊が届いてから読む */
function fromNotation(text: string, pageLang: Lang): Outcome {
  const waiting = waitKind(diagramKind(text), pageLang) ?? waitDefinitions(text, pageLang);
  if (waiting) return waiting;
  const parsed = parseNotation(text, { lang: pageLang });
  if (!parsed.ok) return { ok: false, problem: { lang: pageLang, notices: lineNotices(parsed.errors) } };
  return check(parsed.diagram, pageLang);
}

/** JSON を読む。JSON は語を持たず言葉が決まらないので、誤りは頁の言葉で出す (#2999) */
function fromJson(text: string, pageLang: Lang): Outcome {
  let value: unknown;
  try {
    value = JSON.parse(text);
  } catch (error) {
    const message = messageOf(error);
    const line = jsonErrorLine(message, text);
    return { ok: false, problem: { lang: pageLang, notices: [{ ...(line !== undefined ? { line } : {}), text: TEXT[pageLang].notJson(message) }] } };
  }
  // 定義 (`define`) を持つ原本は、記法に書き戻す処理が定義を読む処理と一緒に届くので、その塊も待つ (#3633)
  const defines = typeof value === "object" && value !== null && "define" in value;
  const waiting = waitValidator(pageLang) ?? (defines ? waitDefinitions("blocks 1", pageLang) : undefined);
  if (waiting) return waiting;
  return check(value, pageLang, text);
}

/** 書き出す file の名前。空なら新規の名前にし、`.dragon` で終わらなければ付ける */
const asFileName = (name: string): string => {
  const trimmed = name.trim();
  if (trimmed === "") return NEW_FILE_NAME;
  return trimmed.endsWith(".dragon") ? trimmed : `${trimmed}.dragon`;
};

/**
 * 書類名の欄に持つ名前。書き出す時に `.dragon` を付けるので、欄には拡張子を外して持つ。
 * 指で触るタブレットの英語では欄が 44px まで縮み、拡張子まで出すと見本の名前も切れた (#3087)
 */
const shownName = (name: string): string => name.replace(/\.dragon$/u, "");

/** 書く欄の `line` 行目 (1 から) を選び、見える所まで送る */
function selectLine(area: HTMLTextAreaElement, line: number): void {
  const lines = area.value.split("\n");
  const start = lines.slice(0, line - 1).reduce((n, l) => n + l.length + 1, 0);
  area.focus();
  area.setSelectionRange(start, start + (lines[line - 1]?.length ?? 0));
  revealLine(area, line);
}

/** 書く欄を送って `line` 行目を真ん中あたりに出す */
function revealLine(area: HTMLTextAreaElement, line: number): void {
  const height = Number.parseFloat(getComputedStyle(area).lineHeight) || 20;
  area.scrollTop = Math.max(0, (line - 1) * height - area.clientHeight / 2);
}

const asJson = (diagram: Diagram | null): string => (diagram ? JSON.stringify(diagram, null, 2) : "");

const share = (text: string | undefined): void => {
  history.replaceState(null, "", `${location.pathname}${location.search}${text === undefined ? "" : toHash(text)}`);
};

interface Start {
  text: string;
  example: ExampleKey | null;
  outcome: Outcome;
}

/**
 * URL の `#` の後ろに書いた中身があればそれを、無ければ頁の言葉の最初の見本を開く。
 * 縮めた記法 (`#z=`) は読み終えてから書く欄に入れ、記法を写して開いた URL (`#paste`) は書く欄を空にする (#3697)
 */
function start(lang: Lang): Start {
  const kind = hashKind(location.hash);
  if (kind === "packed" || kind === "paste") return { text: "", example: null, outcome: fromNotation("", lang) };
  const shared = fromHash(location.hash);
  const text = shared ?? firstScreenText(FIRST_EXAMPLE, lang);
  return { text, example: shared === undefined ? FIRST_EXAMPLE : (whichExample(text)?.key ?? null), outcome: fromNotation(text, lang) };
}

interface Props {
  /** 頁の言葉。上の帯の切替で替わる */
  lang: Lang;
  /** 頁の明暗。図にも同じ明暗を当てる */
  theme: Theme;
  /** 上の帯で選んだ色味。図の側で選ぶまで図に当てる */
  palette: string;
  /**
   * 言葉を替える前に呼ぶ処理を帯の側へ渡す口。
   * 見本を英語版に替える処理は替える前の言葉と書く欄の中身を読むので、帯が言葉を替える前に呼ばせる。
   */
  onBeforeLang: (handler: ((next: Lang) => void) | null) => void;
}

export function Playground({ lang, theme, palette: sitePalette, onBeforeLang }: Props): ReactElement {
  const [first] = useState(() => start(lang));
  const [tab, setTab] = useState<Tab>("notation");
  const [text, setText] = useState(first.text);
  const [json, setJson] = useState("");
  const [example, setExample] = useState<ExampleKey | null>(first.example);
  const [drawn, setDrawn] = useState<Diagram | null>(first.outcome.ok ? first.outcome.diagram : null);
  const [blocked, setBlocked] = useState<Problem | typeof KIND_WAITING | null>(first.outcome.ok ? null : first.outcome.problem);
  const waitingKind = blocked === KIND_WAITING;
  const problem = waitingKind ? null : blocked;
  /*
   * 図の側で選んだ色味を、選んだ時の帯の色味と組で持つ。
   * 帯の色味が替わると組が食い違うので、戻す処理を別に書かずに帯の色味へ戻る。
   */
  const [chosen, setChosen] = useState<{ site: string; palette: string } | null>(null);
  const palette = chosen?.site === sitePalette ? chosen.palette : sitePalette;
  const [folded, setFolded] = useState(false);
  const [fileName, setFileName] = useState(shownName(first.example === null ? NEW_FILE_NAME : `${first.example}.dragon`));
  const [shelfOpen, setShelfOpen] = useState(false);
  /** 重なりの段の札で頼んだ移り先。同じ段を 2 度押しても移るよう、押した回数も持つ */
  const [jump, setJump] = useState<{ step: number; count: number } | null>(null);
  const area = useRef<HTMLTextAreaElement>(null);
  const gutter = useRef<HTMLDivElement>(null);
  /** 書く欄の下に敷いた色の層 (#3613) */
  const paint = useRef<HTMLPreElement>(null);
  /** 日本語の入力で字を組んでいる間。組んでいる字は書く欄の字で見せ、色の層を隠す */
  const [composing, setComposing] = useState(false);
  const picker = useRef<HTMLInputElement>(null);
  /** 部品を足した後に見せる行。描き直した後に書く欄を送る */
  const reveal = useRef<number | null>(null);

  /*
   * 共有の link で開いた中身が後から読む見本そのままの時は、開いた時にはまだ見本と分からない (#3246)。
   * 見本が届いた時に 1 度だけ見本と照らし、見本ならその見本として扱い、書類名も見本の名前にする
   */
  const later = useLater(LATER_EXAMPLES);
  const [seenLater, setSeenLater] = useState(later);
  if (seenLater !== later) {
    setSeenLater(later);
    const found = later.status === "ready" && example === null ? whichExample(text) : undefined;
    if (found) {
      setExample(found.key);
      if (fileName === shownName(NEW_FILE_NAME)) setFileName(shownName(`${found.key}.dragon`));
    }
  }

  const t = TEXT[lang];
  /** 書く欄の記法を読んだ結果。部品を足す先の図と、図を描いたまま出す知らせが使う */
  const read = useMemo(() => parseNotation(text, { lang }), [text, lang]);
  /** 部品を足す先の図。書く欄の記法が読めない時は最後に描けた図 */
  const base = read.ok ? read.diagram : drawn;
  /**
   * 図を描いたまま出す知らせ (箱を宣言しない図の似た名前、#3438)。誤りの文と同じく読む処理が出すので、図を描くのを待たない。
   * 誤りと同じ欄に、行へ移る釦と文の組で出す
   */
  const hints = tab === "notation" && read.ok ? lineNotices(read.notices ?? []) : [];

  /*
   * 棚と記法の欄の幅 (#3612)。人が引いた幅を手元に残し、編集画面の幅に収まる幅で並べる。
   * 引いている間に何度も描き直すので、最新の幅は描き直しを待たずに読めるよう ref にも持つ
   */
  const editor = useRef<HTMLDivElement>(null);
  const band = useEditorBand();
  const withShelf = band === "wide";
  const [asked, setAsked] = useState<Widths>(readWidths);
  const askedNow = useRef(asked);
  const [total, setTotal] = useState(0);
  useLayoutEffect(() => {
    const el = editor.current;
    if (!el) return;
    setTotal(el.clientWidth);
    const watch = new ResizeObserver(() => setTotal(el.clientWidth));
    watch.observe(el);
    return () => watch.disconnect();
  }, []);
  const shown = shownWidths(asked, total, withShelf);
  const resizePane = (pane: Pane, next: number): void => {
    const widths = resizeTo(askedNow.current, pane, next, editor.current?.clientWidth ?? 0, withShelf);
    askedNow.current = widths;
    setAsked(widths);
  };
  const keepWidths = (): void => saveWidths(askedNow.current);
  /** つまみが読み上げに渡す、左の欄の最も広い幅 */
  const widest = (pane: Pane): number | undefined => {
    if (total <= 0) return undefined;
    const other = pane === "shelf" ? shown.code : withShelf ? shown.shelf : 0;
    return total - MIN_WIDTHS.stage - other;
  };
  const splitHandle = (pane: Pane): ReactElement => (
    <SplitHandle
      pane={pane}
      label={t.split[pane]}
      width={shown[pane]}
      min={MIN_WIDTHS[pane]}
      max={widest(pane)}
      onResize={(next) => resizePane(pane, next)}
      onDone={keepWidths}
    />
  );

  useLayoutEffect(() => {
    const line = reveal.current;
    if (line === null || !area.current) return;
    reveal.current = null;
    revealLine(area.current, line);
  });

  /** 描けた図を受け取る。中身が同じなら置き直さず、動きを最初から数え直さない */
  const accept = (diagram: Diagram): void => {
    setDrawn((before) => (before && JSON.stringify(before) === JSON.stringify(diagram) ? before : diagram));
    setBlocked(null);
  };

  const writeNotation = (next: string): void => {
    setText(next);
    setExample(whichExample(next)?.key ?? null);
    share(next);
    const outcome = fromNotation(next, lang);
    if (outcome.ok) accept(outcome.diagram);
    else setBlocked(outcome.problem);
  };

  const writeJson = (next: string): void => {
    setJson(next);
    const outcome = fromJson(next, lang);
    if (!outcome.ok) {
      setBlocked(outcome.problem);
      return;
    }
    accept(outcome.diagram);
    const notation = printNotation(outcome.diagram);
    setText(notation);
    setExample(whichExample(notation)?.key ?? null);
    share(notation);
  };

  /**
   * 見本か新規作成の雛形を書く欄に入れ、書類名を替える。
   * どちらも URL に載せなくても開けるので、`#` の後ろを外す。JSON の側にいる時は JSON の側も替える。
   */
  const replace = (next: string, key: ExampleKey | null, name: string, to: Lang): void => {
    const outcome = fromNotation(next, to);
    setText(next);
    setExample(key);
    setFileName(shownName(name));
    share(undefined);
    if (outcome.ok) {
      accept(outcome.diagram);
      setJson(asJson(outcome.diagram));
    } else setBlocked(outcome.problem);
  };

  /** 見本を開く。棚はまだ届いていない見本を出さないので、届いていない見本は開かない */
  const load = (key: ExampleKey, to: Lang): void => {
    const next = exampleText(key, to);
    if (next !== undefined) replace(next, key, `${key}.dragon`, to);
  };

  const newFile = (): void => replace(TEMPLATE[lang], null, NEW_FILE_NAME, lang);

  /** 取り込んだ file を記法の側に入れる。図の原本の JSON なら、記法に書き直して入れる */
  const importFile = async (file: File): Promise<void> => {
    const content = (await file.text()).replace(/\r\n?/gu, "\n").trimEnd();
    let next = content;
    if (/^\s*\{/u.test(content)) {
      try {
        const input: unknown = JSON.parse(content);
        // 原本の JSON は、読む前に原本の形の検査を読む (#3400)
        await loadValidator();
        const read = readDiagram(input, { lang });
        // 記法に書き戻す前に、原本が使うブロックの読み方を読む (#3349)
        if (read.ok) {
          await loadFor(read.diagram);
          next = printNotation(read.diagram);
        }
      } catch {
        // JSON として読めない時と、使うブロックを読めなかった時は、記法として入れて誤りを知らせの欄に出す
      }
    }
    setTab("notation");
    writeNotation(next);
    setFileName(shownName(file.name.replace(/\.json$/iu, ".dragon")));
  };

  /** 今の記法を書類名の `.dragon` の file として保存させる */
  const exportFile = (): void => {
    const url = URL.createObjectURL(new Blob([`${text.trimEnd()}\n`], { type: "text/plain;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = asFileName(fileName);
    link.click();
    // 保存が始まる前に消すと、保存が空になる browser がある
    window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
  };

  /** 部品の行を記法に足す。宣言は最初の段の前、段の中の行は最後の段に入る。棚は雛形の塊が届いてから部品を並べるので、押せる時は届いている */
  const addPart = (id: PartId): void => {
    const shelf = LATER_SHELF.state();
    if (!base || shelf.status !== "ready") return;
    const added = shelf.value.insertLines(text, shelf.value.partLines(id, base, lang));
    if (tab !== "notation") setTab("notation");
    writeNotation(added.text);
    reveal.current = added.line;
  };

  /** 知らせの欄の行番号を押した時。畳んだ書く欄は開いてから選ぶ */
  const goToLine = (line: number): void => {
    if (folded) setFolded(false);
    if (area.current) selectLine(area.current, line);
  };

  const switchTab = (next: Tab): void => {
    setTab(next);
    if (next === "json") {
      // JSON の側には最後に描けた図を出す。記法の誤りはこの側の誤りではない
      setJson(asJson(drawn));
      setBlocked(null);
      return;
    }
    const outcome = fromNotation(text, lang);
    setBlocked(outcome.ok ? null : outcome.problem);
  };

  /** 帯が言葉を `next` に替える前に呼ぶ。言葉そのものは帯が替える */
  const switchLang = (next: Lang): void => {
    // JSON の側に誤りが出ている間は、書いた JSON を見本に替えずに残し、誤りを替えた頁の言葉で出し直す
    if (tab === "json" && problem) {
      const outcome = fromJson(json, next);
      if (!outcome.ok) setBlocked(outcome.problem);
      return;
    }
    // 見本か新規作成の雛形をそのまま開いている時だけ、それも替えた言葉の版に替える。書き換えた中身は替えない
    const opened = whichExample(text);
    if (opened && opened.lang !== next) {
      load(opened.key, next);
      return;
    }
    if (text === TEMPLATE[lang] && lang !== next) {
      replace(TEMPLATE[next], null, fileName, next);
      return;
    }
    // 記法の誤りは頁の言葉で出すので、替えた頁の言葉で出し直す
    if (tab === "notation" && problem) {
      const outcome = fromNotation(text, next);
      if (!outcome.ok) setBlocked(outcome.problem);
    }
  };

  // 縮めた記法の URL で開いた時は、読み終えた記法を書く欄に入れる。読めない時は最初の見本を開く (#3697)
  const writeShared = useRef<(next: string | undefined) => void>(() => undefined);
  useLayoutEffect(() => {
    writeShared.current = (next) =>
      next === undefined ? replace(firstScreenText(FIRST_EXAMPLE, lang), FIRST_EXAMPLE, `${FIRST_EXAMPLE}.dragon`, lang) : writeNotation(next);
  });
  useEffect(() => {
    if (hashKind(location.hash) !== "packed") return undefined;
    let live = true;
    void fromPackedHash(location.hash).then((next) => {
      if (live) writeShared.current(next);
    });
    return () => {
      live = false;
    };
  }, []);
  const [pasteAsked] = useState(() => hashKind(location.hash) === "paste");

  // 図の種類の塊が届いたら、書いてある中身を読み直す。待っていた種類の図に替わり、読めなかった種類は誤りを出す (#3248)
  const reread = useRef<() => void>(() => undefined);
  useLayoutEffect(() => {
    reread.current = () => {
      const outcome = tab === "json" ? fromJson(json, lang) : fromNotation(text, lang);
      if (outcome.ok) accept(outcome.diagram);
      else setBlocked(outcome.problem);
    };
  });
  useEffect(() => onKindSettled(() => reread.current()), []);
  // 原本の形の検査の塊は、編集画面を開いた後に裏で読み、届いたら原本の JSON の欄を読み直す (#3400)
  useEffect(() => onValidatorSettled(() => reread.current()), []);
  // 足したブロックの定義を読む処理の塊も裏で読み、届いたら定義の行を持つ記法を読み直す (#3407)
  useEffect(() => onDefinitionsSettled(() => reread.current()), []);

  // 描くたびに今の書く欄の中身を読む処理を渡し直す。編集画面を離れたら外す
  useLayoutEffect(() => {
    onBeforeLang(switchLang);
    return () => onBeforeLang(null);
  });

  const value = tab === "notation" ? text : json;
  /** 書く欄の字を語の役ごとに分けた物。色の層が描く (#3613) */
  const painted = useMemo((): Span[][] => (tab === "notation" ? paintNotation(value, NOTATION_WORDS) : paintJson(value)), [tab, value]);
  // 字が替わって色の層の高さが変わった後も、書く欄と同じ所まで送っておく
  useLayoutEffect(() => {
    if (paint.current && area.current) {
      paint.current.scrollTop = area.current.scrollTop;
      paint.current.scrollLeft = area.current.scrollLeft;
    }
  }, [painted]);
  // 図の側と同じ言葉で描いた時の重なり。誤りの間は最後に描けた図の重なりになるが、欄は誤りを出すので見せない
  const overlaps = useMemo(() => (drawn ? renderDiagram(drawn, { lang }).overlaps : []), [drawn, lang]);
  const lines = value.split("\n").length;
  const errorLines = new Set(problem?.notices.flatMap((n) => (n.line === undefined ? [] : [n.line])));
  const said = problem ? TEXT[problem.lang].notices : undefined;
  /** 幅が狭い時の引き出しは、見本か新規作成を選んだら閉じる */
  const closing =
    <A extends unknown[]>(action: (...args: A) => void) =>
    (...args: A): void => {
      action(...args);
      setShelfOpen(false);
    };

  return (
    <div className="pg" ref={editor} style={{ "--pg-shelf": `${shown.shelf}px`, "--pg-code": `${shown.code}px` } as CSSProperties}>
      <Shelf
        lang={lang}
        base={base}
        active={example}
        open={shelfOpen}
        onClose={() => setShelfOpen(false)}
        onNew={closing(newFile)}
        onSample={closing((key: ExampleKey) => load(key, lang))}
        onPart={addPart}
      />
      {shelfOpen && <button type="button" className="pg-shelf-scrim" aria-label={t.shelf.close} onClick={() => setShelfOpen(false)} />}
      {band === "wide" && splitHandle("shelf")}

      <section className="pg-code" data-playground="editor-pane" data-folded={folded}>
        <div className="pg-bar">
          <button
            type="button"
            className="pg-tool pg-shelf-toggle"
            data-playground="shelf-toggle"
            aria-label={t.shelf.open}
            title={t.shelf.open}
            aria-expanded={shelfOpen}
            onClick={() => setShelfOpen(!shelfOpen)}
          >
            <span className="pg-icon" data-icon="list" aria-hidden="true" />
          </button>
          <div className="pg-tabs" role="tablist">
            {(["notation", "json"] as const).map((k) => (
              <button key={k} type="button" role="tab" data-playground={`tab-${k}`} aria-selected={tab === k} onClick={() => switchTab(k)}>
                {k === "notation" ? t.notation : "JSON"}
              </button>
            ))}
          </div>
          <input
            className="pg-file"
            data-playground="file-name"
            aria-label={t.code.file}
            title={t.code.file}
            spellCheck={false}
            value={fileName}
            onChange={(e) => setFileName(e.target.value)}
          />
          <button type="button" className="pg-tool" data-playground="import" aria-label={t.code.import} title={t.code.import} onClick={() => picker.current?.click()}>
            <span className="pg-icon" data-icon="import" aria-hidden="true" />
          </button>
          <input
            ref={picker}
            type="file"
            hidden
            data-playground="import-file"
            accept=".dragon,.json,.txt,text/plain,application/json"
            onChange={(e) => {
              const file = e.target.files?.[0];
              e.target.value = "";
              if (file) void importFile(file);
            }}
          />
          <button type="button" className="pg-tool pg-tool-primary" data-playground="export" aria-label={t.code.export} title={t.code.export} onClick={exportFile}>
            <span className="pg-icon" data-icon="export" aria-hidden="true" />
          </button>
          <button type="button" className="pg-fold" data-playground="fold" aria-expanded={!folded} onClick={() => setFolded(!folded)}>
            {folded ? t.unfold : t.fold} {folded ? "▴" : "▾"}
          </button>
        </div>
        <div className="pg-code-body" hidden={folded} data-composing={composing ? "true" : undefined}>
          <div className="pg-gutter" ref={gutter} aria-hidden="true">
            {Array.from({ length: lines }, (_, i) => (
              <div key={i} className={errorLines.has(i + 1) ? "is-error" : undefined}>
                {i + 1}
              </div>
            ))}
          </div>
          <div className="pg-field">
            <pre ref={paint} className="pg-paint" data-playground="paint" aria-hidden="true">
              {painted.map((spans, i) => (
                <Fragment key={i}>
                  {i > 0 && "\n"}
                  {spans.map((span, j) =>
                    span.role ? (
                      <span key={j} data-syn={span.role}>
                        {span.text}
                      </span>
                    ) : (
                      <Fragment key={j}>{span.text}</Fragment>
                    ),
                  )}
                </Fragment>
              ))}
            </pre>
            <textarea
              ref={area}
              className="pg-text"
              data-playground="editor"
              aria-label={t.editor}
              placeholder={pasteAsked && tab === "notation" ? t.pasteHere : undefined}
              spellCheck={false}
              wrap="off"
              value={value}
              onChange={(e) => (tab === "notation" ? writeNotation(e.target.value) : writeJson(e.target.value))}
              onScroll={(e) => {
                if (gutter.current) gutter.current.scrollTop = e.currentTarget.scrollTop;
                if (paint.current) {
                  paint.current.scrollTop = e.currentTarget.scrollTop;
                  paint.current.scrollLeft = e.currentTarget.scrollLeft;
                }
              }}
              onCompositionStart={() => setComposing(true)}
              onCompositionEnd={() => setComposing(false)}
            />
          </div>
        </div>
        <div className="pg-notices" data-playground="status" data-state={problem ? "error" : waitingKind ? "waiting" : "ok"} role="status">
          {problem && said ? (
            <>
              <p className="pg-notices-head">
                <span className="pg-notices-badge">{said.count(problem.notices.length)}</span>
              </p>
              <ul className="pg-notice-list">
                {problem.notices.map((n, i) => (
                  <li key={`${i}-${n.line ?? "-"}`} className="pg-notice" data-playground="notice">
                    {n.line !== undefined && (
                      <button
                        type="button"
                        className="pg-notice-line"
                        data-playground="notice-line"
                        aria-label={said.goTo(n.line)}
                        onClick={() => goToLine(n.line ?? 1)}
                      >
                        {said.line(n.line)}
                      </button>
                    )}
                    <span className="pg-notice-text">{n.text}</span>
                  </li>
                ))}
              </ul>
            </>
          ) : waitingKind ? (
            <p className="pg-waiting">{t.site.catalog.loading}</p>
          ) : (
            <>
              <p className="pg-ok">
                <span aria-hidden="true">✓</span> {drawn ? t.readable(...mainParts(drawn), drawn.steps.length) : ""}
              </p>
              {hints.length > 0 && (
                <div className="pg-hints" data-playground="hints">
                  <p className="pg-notices-head">
                    <span className="pg-hints-badge" data-playground="hints-count">
                      {t.notices.hints(hints.length)}
                    </span>
                  </p>
                  <ul className="pg-notice-list">
                    {hints.map((n, i) => (
                      <li key={`${i}-${n.line ?? "-"}`} className="pg-notice" data-playground="notice">
                        {n.line !== undefined && (
                          <button type="button" className="pg-hint-line" data-playground="notice-line" aria-label={t.notices.goTo(n.line)} onClick={() => goToLine(n.line ?? 1)}>
                            {t.notices.line(n.line)}
                          </button>
                        )}
                        <span className="pg-notice-text">{n.text}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {overlaps.length > 0 && (
                <div className="pg-overlaps" data-playground="overlaps">
                  <p className="pg-notices-head">
                    <span className="pg-overlaps-badge" data-playground="overlaps-count">
                      {t.overlaps.count(overlaps.length)}
                    </span>
                  </p>
                  <ul className="pg-notice-list">
                    {overlaps.map((o, i) => (
                      <li key={`${i}-${o.step}`} className="pg-notice" data-playground="overlap">
                        <button
                          type="button"
                          className="pg-overlap-step"
                          data-playground="overlap-step"
                          aria-label={t.overlaps.goTo(o.step + 1)}
                          onClick={() => setJump((before) => ({ step: o.step, count: (before?.count ?? 0) + 1 }))}
                        >
                          {t.overlaps.step(o.step + 1)}
                        </button>
                        <span className="pg-notice-text" data-playground="overlap-text">
                          {describeOverlap(o, lang)}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </>
          )}
        </div>
      </section>
      {band !== "stacked" && splitHandle("code")}

      <Stage
        diagram={drawn}
        palette={palette}
        onPalette={(id) => setChosen({ site: sitePalette, palette: id })}
        theme={theme}
        lang={lang}
        kept={problem !== null && drawn !== null}
        overlaps={overlaps}
        jump={jump}
        fileName={asFileName(fileName)}
        waiting={drawn === null && waitingKind}
      />
    </div>
  );
}
