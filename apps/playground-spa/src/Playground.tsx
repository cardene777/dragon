/**
 * 公開する頁 (#2995)。左の書く欄に記法を書くと、右に動く図が描かれる。
 *
 * 図は `@cardenelabs/dragon` の再生の部品 (`mountDiagram`) で描き、頁の側では SVG を組まない。
 * 頁の色と字も図と同じ値の表 (`PALETTES` と `FONTS`) から読み、色味と明暗を替えると頁と図が揃って替わる。
 * 記法と JSON のどちらの側でも書け、書いた側から図ともう一方へ反映する。
 * 記法に誤りがあるあいだは、誤りの行と理由を欄の下に出し、図は最後に描けた物を残す。
 *
 * 記法は日本語の語でも英語の語でも書ける (#2997)。JSON の側から書き戻す時と、記法の誤りを出す時は、
 * 書いている記法の言葉 (最初の行の図の種類の語) に従い、最初の行が読めない時だけ頁の言葉に従う。
 */
import "@cardenelabs/dragon/fonts";
import {
  DEFAULT_PALETTE,
  type Diagram,
  FONTS,
  mountDiagram,
  notationLanguage,
  PALETTES,
  parseNotation,
  printNotation,
  readDiagram,
  renderDiagram,
  resolvePalette,
  type Theme,
} from "@cardenelabs/dragon";
import { type ReactElement, useEffect, useRef, useState } from "react";

import { EXAMPLE_KEYS, type ExampleKey, exampleText, FIRST_EXAMPLE, whichExample } from "./examples";
import { fromHash, toHash } from "./share";
import { deviceLang, type Lang, TEXT } from "./text";

type Tab = "notation" | "json";
type ThemeChoice = "auto" | Theme;

type Problem =
  /** `lang` は誤りを出す言葉。記法の言葉で、決まらない時は頁の言葉 */
  | { kind: "line"; lang: Lang; line: number; message: string }
  | { kind: "field"; pointer: string; message: string }
  | { kind: "json"; message: string }
  | { kind: "draw"; message: string };

type Outcome = { ok: true; diagram: Diagram } | { ok: false; problem: Problem };

const messageOf = (error: unknown): string => (error instanceof Error ? error.message : String(error));

/** 原本の形を検査し、描けるかまで確かめる。描けない図を受け取ると、最後に描けた図を失う */
function check(input: unknown): Outcome {
  const read = readDiagram(input);
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
  if (!parsed.ok) {
    const first = parsed.errors[0];
    const lang = notationLanguage(text) ?? pageLang;
    return { ok: false, problem: { kind: "line", lang, line: first?.line ?? 0, message: first?.message ?? "" } };
  }
  return check(parsed.diagram);
}

function fromJson(text: string): Outcome {
  let value: unknown;
  try {
    value = JSON.parse(text);
  } catch (error) {
    return { ok: false, problem: { kind: "json", message: messageOf(error) } };
  }
  return check(value);
}

const asJson = (diagram: Diagram | null): string => (diagram ? JSON.stringify(diagram, null, 2) : "");

const share = (text: string | undefined): void => {
  history.replaceState(null, "", `${location.pathname}${location.search}${text === undefined ? "" : toHash(text)}`);
};

interface Start {
  lang: Lang;
  text: string;
  example: ExampleKey | null;
  outcome: Outcome;
}

/** URL の `#` の後ろに書いた中身があればそれを、無ければ端末の言葉の最初の見本を開く */
function start(): Start {
  const lang = deviceLang(navigator.languages.length > 0 ? navigator.languages : [navigator.language]);
  const shared = fromHash(location.hash);
  const text = shared ?? exampleText(FIRST_EXAMPLE, lang);
  return { lang, text, example: shared === undefined ? FIRST_EXAMPLE : (whichExample(text)?.key ?? null), outcome: fromNotation(text, lang) };
}

export function Playground(): ReactElement {
  const [first] = useState(start);
  const [lang, setLang] = useState<Lang>(first.lang);
  const [tab, setTab] = useState<Tab>("notation");
  const [text, setText] = useState(first.text);
  const [json, setJson] = useState("");
  const [example, setExample] = useState<ExampleKey | null>(first.example);
  const [drawn, setDrawn] = useState<Diagram | null>(first.outcome.ok ? first.outcome.diagram : null);
  const [problem, setProblem] = useState<Problem | null>(first.outcome.ok ? null : first.outcome.problem);
  const [palette, setPalette] = useState(DEFAULT_PALETTE);
  const [choice, setChoice] = useState<ThemeChoice>("auto");
  const [device, setDevice] = useState<Theme>(() => (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"));
  const [folded, setFolded] = useState(false);
  const [lookOpen, setLookOpen] = useState(false);
  const host = useRef<HTMLDivElement>(null);
  const gutter = useRef<HTMLDivElement>(null);

  const t = TEXT[lang];
  const theme: Theme = choice === "auto" ? device : choice;

  // 端末の明暗が替わったら、明暗を選んでいない時の頁と図も替える
  useEffect(() => {
    const media = matchMedia("(prefers-color-scheme: dark)");
    const follow = (): void => setDevice(media.matches ? "dark" : "light");
    media.addEventListener("change", follow);
    return () => media.removeEventListener("change", follow);
  }, []);

  // 頁の色と字は図と同じ値の表から読む
  useEffect(() => {
    const root = document.documentElement;
    for (const [key, value] of Object.entries(resolvePalette(palette)[theme])) root.style.setProperty(`--${key}`, value);
    root.style.setProperty("--sans", `"${FONTS.sans}"`);
    root.style.setProperty("--mono", `"${FONTS.mono}"`);
    root.style.colorScheme = theme;
  }, [palette, theme]);

  useEffect(() => {
    document.documentElement.lang = lang;
    document.title = t.title;
  }, [lang, t]);

  useEffect(() => {
    if (!host.current || !drawn) return;
    const player = mountDiagram(host.current, drawn, { palette, theme });
    return () => player.destroy();
  }, [drawn, palette, theme]);

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
    const outcome = fromJson(next);
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

  const switchLang = (next: Lang): void => {
    setLang(next);
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
      <header className="pg-head">
        <div className="pg-name">
          <span className="pg-mark" aria-hidden="true" />
          <strong>dragon</strong>
        </div>
        <span className="pg-tag">{t.tagline}</span>
        <span className="pg-gap" />
        <div className="pg-seg" role="group" aria-label={t.language}>
          {(["ja", "en"] as const).map((l) => (
            <button key={l} type="button" data-playground={`lang-${l}`} aria-pressed={lang === l} onClick={() => switchLang(l)}>
              {l === "ja" ? "日本語" : "EN"}
            </button>
          ))}
        </div>
        <button type="button" className="pg-look-open" aria-expanded={lookOpen} aria-label={t.look} onClick={() => setLookOpen(!lookOpen)}>
          ◐
        </button>
        <div className="pg-look" data-open={lookOpen}>
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
          <div className="pg-seg" role="group" aria-label={t.theme}>
            {(["auto", "light", "dark"] as const).map((c) => (
              <button key={c} type="button" data-playground={`theme-${c}`} aria-pressed={choice === c} onClick={() => setChoice(c)}>
                {t.themes[c]}
              </button>
            ))}
          </div>
        </div>
        <a className="pg-gh" href="https://github.com/cardene777/dragon">
          GitHub ↗
        </a>
      </header>

      <main className="pg-body">
        <section className="pg-stage" data-playground="stage">
          {problem && drawn && <p className="pg-kept">↺ {t.kept}</p>}
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
      </main>
    </div>
  );
}
