/**
 * 編集画面 (#2995、#3030)。左の書く欄に記法を書くと、右に動く図が描かれる。
 *
 * 図は `@cardenelabs/dragon` の再生の部品 (`mountDiagram`) で描き、頁の側では SVG を組まない。
 * 言葉と明暗はサイトの上の帯が持ち、ここは受け取って図に当てる。色味はここで選び、図だけに当てる。
 * 記法と JSON のどちらの側でも書け、書いた側から図ともう一方へ反映する。
 * 記法に誤りがあるあいだは、誤りの行と理由を欄の下に出し、図は最後に描けた物を残す。
 *
 * 記法は日本語の語でも英語の語でも書ける (#2997)。JSON の側から書き戻す時と、記法の誤りを出す時は、
 * 書いている記法の言葉 (最初の行の図の種類の語) に従い、最初の行が読めない時だけ頁の言葉に従う。
 */
import {
  DEFAULT_PALETTE,
  type Diagram,
  mountDiagram,
  notationLanguage,
  PALETTES,
  parseNotation,
  printNotation,
  readDiagram,
  renderDiagram,
  type Theme,
} from "@cardenelabs/dragon";
import { type ReactElement, useEffect, useLayoutEffect, useRef, useState } from "react";

import { EXAMPLE_KEYS, type ExampleKey, exampleText, FIRST_EXAMPLE, whichExample } from "./examples";
import { fromHash, toHash } from "./share";
import { type Lang, TEXT } from "./text";

type Tab = "notation" | "json";

type Problem =
  /** `lang` は誤りを出す言葉。記法の言葉で、決まらない時は頁の言葉 */
  | { kind: "line"; lang: Lang; line: number; message: string }
  | { kind: "field"; pointer: string; message: string }
  | { kind: "json"; message: string }
  | { kind: "draw"; message: string };

type Outcome = { ok: true; diagram: Diagram } | { ok: false; problem: Problem };

const messageOf = (error: unknown): string => (error instanceof Error ? error.message : String(error));

/** 原本の形を検査し、描けるかまで確かめる。描けない図を受け取ると、最後に描けた図を失う。`lang` は形の誤りを出す言葉 */
function check(input: unknown, lang: Lang): Outcome {
  const read = readDiagram(input, { lang });
  if (!read.ok) {
    const first = read.errors[0];
    return { ok: false, problem: { kind: "field", pointer: first?.pointer ?? "", message: first?.message ?? "" } };
  }
  try {
    renderDiagram(read.diagram);
  } catch (error) {
    return { ok: false, problem: { kind: "draw", message: messageOf(error) } };
  }
  return { ok: true, diagram: read.diagram };
}

/** 記法を読む。`pageLang` は記法の言葉が決まらない時に誤りを出す言葉 */
function fromNotation(text: string, pageLang: Lang): Outcome {
  const parsed = parseNotation(text, { lang: pageLang });
  const lang = notationLanguage(text) ?? pageLang;
  if (!parsed.ok) {
    const first = parsed.errors[0];
    return { ok: false, problem: { kind: "line", lang, line: first?.line ?? 0, message: first?.message ?? "" } };
  }
  return check(parsed.diagram, lang);
}

/** JSON を読む。JSON は語を持たず言葉が決まらないので、誤りは頁の言葉で出す (#2999) */
function fromJson(text: string, pageLang: Lang): Outcome {
  let value: unknown;
  try {
    value = JSON.parse(text);
  } catch (error) {
    return { ok: false, problem: { kind: "json", message: messageOf(error) } };
  }
  return check(value, pageLang);
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

/** URL の `#` の後ろに書いた中身があればそれを、無ければ頁の言葉の最初の見本を開く */
function start(lang: Lang): Start {
  const shared = fromHash(location.hash);
  const text = shared ?? exampleText(FIRST_EXAMPLE, lang);
  return { text, example: shared === undefined ? FIRST_EXAMPLE : (whichExample(text)?.key ?? null), outcome: fromNotation(text, lang) };
}

interface Props {
  /** 頁の言葉。上の帯の切替で替わる */
  lang: Lang;
  /** 頁の明暗。図にも同じ明暗を当てる */
  theme: Theme;
  /**
   * 言葉を替える前に呼ぶ処理を帯の側へ渡す口。
   * 見本を英語版に替える処理は替える前の言葉と書く欄の中身を読むので、帯が言葉を替える前に呼ばせる。
   */
  onBeforeLang: (handler: ((next: Lang) => void) | null) => void;
}

export function Playground({ lang, theme, onBeforeLang }: Props): ReactElement {
  const [first] = useState(() => start(lang));
  const [tab, setTab] = useState<Tab>("notation");
  const [text, setText] = useState(first.text);
  const [json, setJson] = useState("");
  const [example, setExample] = useState<ExampleKey | null>(first.example);
  const [drawn, setDrawn] = useState<Diagram | null>(first.outcome.ok ? first.outcome.diagram : null);
  const [problem, setProblem] = useState<Problem | null>(first.outcome.ok ? null : first.outcome.problem);
  const [palette, setPalette] = useState(DEFAULT_PALETTE);
  const [folded, setFolded] = useState(false);
  const host = useRef<HTMLDivElement>(null);
  const gutter = useRef<HTMLDivElement>(null);

  const t = TEXT[lang];

  // 再生の釦の読み上げと全体図の札は頁の言葉で出し、言葉を切り替えたら置き直す (#3001)
  useEffect(() => {
    if (!host.current || !drawn) return;
    const player = mountDiagram(host.current, drawn, { palette, theme, lang });
    return () => player.destroy();
  }, [drawn, palette, theme, lang]);

  /** 描けた図を受け取る。中身が同じなら置き直さず、動きを最初から数え直さない */
  const accept = (diagram: Diagram): void => {
    setDrawn((before) => (before && JSON.stringify(before) === JSON.stringify(diagram) ? before : diagram));
    setProblem(null);
  };

  const writeNotation = (next: string): void => {
    setText(next);
    setExample(whichExample(next)?.key ?? null);
    share(next);
    const outcome = fromNotation(next, lang);
    if (outcome.ok) accept(outcome.diagram);
    else setProblem(outcome.problem);
  };

  const writeJson = (next: string): void => {
    setJson(next);
    const outcome = fromJson(next, lang);
    if (!outcome.ok) {
      setProblem(outcome.problem);
      return;
    }
    accept(outcome.diagram);
    // 書いていた記法の言葉で書き戻す。最初の行が読めない時は頁の言葉で書く
    const notation = printNotation(outcome.diagram, { lang: notationLanguage(text) ?? lang });
    setText(notation);
    setExample(whichExample(notation)?.key ?? null);
    share(notation);
  };

  /** 見本を書く欄に入れる。見本は URL に載せなくても開けるので、`#` の後ろを外す */
  const load = (key: ExampleKey, to: Lang): void => {
    const next = exampleText(key, to);
    const outcome = fromNotation(next, to);
    setText(next);
    setExample(key);
    share(undefined);
    if (outcome.ok) {
      accept(outcome.diagram);
      setJson(asJson(outcome.diagram));
    } else setProblem(outcome.problem);
  };

  const switchTab = (next: Tab): void => {
    setTab(next);
    if (next === "json") {
      // JSON の側には最後に描けた図を出す。記法の誤りはこの側の誤りではない
      setJson(asJson(drawn));
      setProblem(null);
      return;
    }
    const outcome = fromNotation(text, lang);
    setProblem(outcome.ok ? null : outcome.problem);
  };

  /** 帯が言葉を `next` に替える前に呼ぶ。言葉そのものは帯が替える */
  const switchLang = (next: Lang): void => {
    // JSON の側に誤りが出ている間は、書いた JSON を見本に替えずに残し、誤りを替えた頁の言葉で出し直す
    if (tab === "json" && problem) {
      const outcome = fromJson(json, next);
      if (!outcome.ok) setProblem(outcome.problem);
      return;
    }
    // 見本をそのまま開いている時だけ、見本も英語版に替える。書き換えた中身は替えない
    const opened = whichExample(text);
    if (opened && opened.lang !== next) {
      load(opened.key, next);
      return;
    }
    // 言葉の決まらない記法の誤りは頁の言葉で出すので、替えた頁の言葉で出し直す
    if (tab === "notation" && problem?.kind === "line") {
      const outcome = fromNotation(text, next);
      if (!outcome.ok) setProblem(outcome.problem);
    }
  };

  // 描くたびに今の書く欄の中身を読む処理を渡し直す。編集画面を離れたら外す
  useLayoutEffect(() => {
    onBeforeLang(switchLang);
    return () => onBeforeLang(null);
  });

  const value = tab === "notation" ? text : json;
  const lines = value.split("\n").length;
  const errorLine = tab === "notation" && problem?.kind === "line" ? problem.line : undefined;
  const status = (() => {
    if (!problem) return drawn ? t.readable(drawn.boxes.length, drawn.steps.length) : "";
    if (problem.kind === "line") return TEXT[problem.lang].lineError(problem.line, problem.message);
    if (problem.kind === "field") return `${problem.pointer || "/"} — ${problem.message}`;
    if (problem.kind === "json") return t.notJson(problem.message);
    return t.cannotDraw(problem.message);
  })();

  return (
    <div className="pg">
      <div className="pg-body">
        <section className="pg-stage" data-playground="stage">
          <div className="pg-stage-bar">
            <div className="pg-swatches" role="group" aria-label={t.palette}>
              <span className="pg-label">{t.palette}</span>
              {Object.values(PALETTES).map((p) => (
                <button
                  key={p.id}
                  type="button"
                  className="pg-swatch"
                  data-playground={`palette-${p.id}`}
                  aria-pressed={palette === p.id}
                  aria-label={t.paletteNames[p.id] ?? p.name}
                  title={t.paletteNames[p.id] ?? p.name}
                  style={{ background: `linear-gradient(135deg, ${p.light.page} 50%, ${p.dark.page} 50%)`, borderColor: p.light["c-blue"] }}
                  onClick={() => setPalette(p.id)}
                />
              ))}
            </div>
            {problem && drawn && <p className="pg-kept">↺ {t.kept}</p>}
          </div>
          <div className="pg-figure" ref={host} />
          <p className="pg-hint">
            {t.exportLead} <code>dragon export {example ?? "diagram"}.dragon</code> {t.exportTail}
          </p>
        </section>

        <section className="pg-editor" data-playground="editor-pane" data-folded={folded}>
          <div className="pg-bar">
            <div className="pg-tabs" role="tablist">
              {(["notation", "json"] as const).map((k) => (
                <button key={k} type="button" role="tab" data-playground={`tab-${k}`} aria-selected={tab === k} onClick={() => switchTab(k)}>
                  {k === "notation" ? t.notation : "JSON"}
                </button>
              ))}
            </div>
            <span className="pg-gap" />
            <select
              className="pg-pick"
              data-playground="example"
              aria-label={t.example}
              value={example ?? ""}
              onChange={(e) => load(e.target.value as ExampleKey, lang)}
            >
              {example === null && <option value="">{t.yours}</option>}
              {EXAMPLE_KEYS.map((key) => (
                <option key={key} value={key}>
                  {t.examples[key]}
                </option>
              ))}
            </select>
            <button type="button" className="pg-fold" data-playground="fold" aria-expanded={!folded} onClick={() => setFolded(!folded)}>
              {folded ? t.unfold : t.fold} {folded ? "▴" : "▾"}
            </button>
          </div>
          <div className="pg-code" hidden={folded}>
            <div className="pg-gutter" ref={gutter} aria-hidden="true">
              {Array.from({ length: lines }, (_, i) => (
                <div key={i} className={i + 1 === errorLine ? "is-error" : undefined}>
                  {i + 1}
                </div>
              ))}
            </div>
            <textarea
              className="pg-text"
              data-playground="editor"
              aria-label={t.editor}
              spellCheck={false}
              wrap="off"
              value={value}
              onChange={(e) => (tab === "notation" ? writeNotation(e.target.value) : writeJson(e.target.value))}
              onScroll={(e) => {
                if (gutter.current) gutter.current.scrollTop = e.currentTarget.scrollTop;
              }}
            />
          </div>
          <p className="pg-status" data-playground="status" data-state={problem ? "error" : "ok"} role="status">
            <span aria-hidden="true">{problem ? "!" : "✓"}</span> {status}
          </p>
        </section>
      </div>
    </div>
  );
}
