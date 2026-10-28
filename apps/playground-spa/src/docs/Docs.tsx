/**
 * 使い方の頁 (#3034)。0.35.0 より前のサイトの使い方 (`pages/DocsPage.tsx`) と同じ並びを、今の記法で作る。
 *
 * 前置き (札、見出し、前置きの文、編集画面とカタログへの釦)、特長の札、番号付きの節の順に縦に積む。
 * 節は dragon記法の決まりと記法の要素 (箱、線、区画、状態遷移図、段、帯、運ぶ物、JSON、書き出し) を説明し、記法の例は字と動く図 (`LiveFigure`) を並べる。
 * 箱の節の本文の後には、使える絵柄を全て並べた部品「絵」の頁への案内を、節の終わりの札と同じ見た目で置く (#3172)。
 * 決まりの節は決まり 4 つを番号付きで並べ、最後の節は前の形と新しい形の対応表を書き出しの設定と同じ形の表で出す (#3138)。
 * 例の字は `examples/` の file から読み、図はその字をそのまま読んで描く。JSON の節は原本の JSON として読む。
 * 命令は図を描かない囲みに出す。特長の札は同じ頁の節へ移り、札の名前は行き先の節の見出しを使う。
 * 見た目は前の `styles/docs-site.css` を `docs.css` に写した。
 */
import { DEFAULT_PALETTE, PALETTES, type Theme } from "@cardenelabs/dragon";
import { Fragment, type ReactElement, type ReactNode, useEffect } from "react";

import { LiveFigure } from "../site/LiveFigure";
import { follow, PATHS } from "../site/routes";
import { VERSION } from "../site/version";
import { type Lang, TEXT } from "../text";
import { CARDS, COMMANDS, DOCS, type Exit, EXITS, type SectionId, SECTIONS } from "./content";
import "./docs.css";

/** 節の例の file の字。file の名前は `<節>[.en].dragon`、JSON の節は `json[.en].json` */
const FILES = import.meta.glob<string>("./examples/*", { query: "?raw", import: "default", eager: true });

/** 節の例の字。例を持たない節は `undefined` */
function exampleOf(id: SectionId, lang: Lang): string | undefined {
  return FILES[`./examples/${id}${lang === "en" ? ".en" : ""}.${id === "json" ? "json" : "dragon"}`]?.trimEnd();
}

/**
 * 本文の中の `` ` `` で囲んだ語を `<code>` にする。
 *
 * 本文は字として書くので、囲みの印をそのまま出すと画面に `` ` `` が見えてしまう。
 * 0 から数えて奇数番目が囲みの中身になる。
 */
function inline(text: string): ReactNode[] {
  return text.split("`").map((part, i) => <Fragment key={i}>{i % 2 === 1 ? <code>{part}</code> : part}</Fragment>);
}

/** 節の出口の行き先 */
function exitHref(exit: Exit): string {
  if ("section" in exit) return `#${exit.section}`;
  if ("kind" in exit) return `${PATHS.catalog}/${exit.kind}`;
  return PATHS[exit.screen];
}

/** 節の終わりに置く 2 列の表。書き出しの設定の表と、前の形と新しい形の対応表が同じ形を使う */
function Table({ head, rows, docs }: { head: readonly [string, string]; rows: readonly (readonly [ReactNode, ReactNode])[]; docs?: string }): ReactElement {
  return (
    <table className="docs-options" data-docs={docs}>
      <thead>
        <tr>
          {head.map((h) => (
            <th key={h}>{h}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map(([left, right], i) => (
          // 行は並びで決まり、入れ替わらない
          <tr key={i}>
            <td>{left}</td>
            <td>{right}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

/** 使い方の頁が受け取る言葉と明暗と、上の帯で選んだ色味 */
interface Look {
  lang: Lang;
  theme: Theme;
  palette: string;
}

function Section({ id, index, lang, theme, palette }: Look & { id: SectionId; index: number }): ReactElement {
  const text = DOCS[lang].sections[id];
  const example = exampleOf(id, lang);
  const commands = COMMANDS[id] ?? [];
  const exit = EXITS[id];
  const { options, rules, migration } = DOCS[lang];
  return (
    <section id={id} className="docs-sec" data-docs="section">
      <div className="docs-sec-head">
        <span className="docs-sec-no" data-docs="section-no">
          {String(index + 1).padStart(2, "0")}
        </span>
        <h2>{text.title}</h2>
      </div>
      {text.text.map((p, i) => (
        <Fragment key={p}>
          <p className="docs-sec-text" data-docs="text">
            {inline(p)}
          </p>
          {commands[i] != null && (
            <pre className="docs-command" data-docs="command">
              <code>{commands[i]}</code>
            </pre>
          )}
        </Fragment>
      ))}
      {id === "boxes" && (
        <a className="docs-sec-cta" data-docs="icon-link" href={`${PATHS.catalog}/part/icon`} onClick={(e) => follow(e)}>
          {DOCS[lang].iconLink}
        </a>
      )}
      {id === "rules" && (
        <ol className="docs-rules" data-docs="rules">
          {rules.map((rule) => (
            <li key={rule} data-docs="rule">
              {inline(rule)}
            </li>
          ))}
        </ol>
      )}
      {example !== undefined && (
        <div className="docs-example" data-docs="example">
          <pre className="docs-example-code" data-docs="example-code">
            <code>{example}</code>
          </pre>
          <LiveFigure className="docs-example-figure" notation={example} json={id === "json"} lang={lang} theme={theme} palette={palette} whole />
        </div>
      )}
      {id === "export" && (
        <Table
          head={options.head}
          rows={options
            .rows(Object.keys(PALETTES).map((name) => `\`${name}\``).join(" / "), DEFAULT_PALETTE)
            .map(([option, meaning]) => [<code key="option">{option}</code>, inline(meaning)] as const)}
        />
      )}
      {id === "migrate" && <Table head={migration.head} rows={migration.rows.map(([old, now]) => [inline(old), inline(now)] as const)} docs="migration" />}
      <a className="docs-sec-cta" data-docs="section-cta" href={exitHref(exit)} onClick={"section" in exit ? undefined : (e) => follow(e)}>
        {text.exit}
      </a>
    </section>
  );
}

export function Docs({ lang, theme, palette }: Look): ReactElement {
  const t = DOCS[lang];
  // 他の画面から節を指して開いた時は、図を置いた後にその節へ移る (頁を読み直さずに移ると browser は # の後ろへ寄らない)
  useEffect(() => {
    const id = decodeURIComponent(location.hash.slice(1));
    if (id !== "") document.getElementById(id)?.scrollIntoView();
  }, []);
  return (
    <div className="docs">
      <section className="docs-hero" data-docs="hero">
        <div className="docs-eyebrow" data-docs="eyebrow">
          {t.eyebrow(VERSION)}
        </div>
        <h1>{TEXT[lang].site.screens.docs.title}</h1>
        <p className="docs-lead" data-docs="lead">
          {t.lead}
        </p>
        <div className="docs-cta" data-docs="cta">
          <a className="docs-btn-primary" href={PATHS.editor} onClick={(e) => follow(e)}>
            {t.start}
          </a>
          <a className="docs-btn-secondary" href={PATHS.catalog} onClick={(e) => follow(e)}>
            {t.browse}
          </a>
        </div>
      </section>

      <nav className="docs-features" data-docs="features">
        {CARDS.map((id) => (
          <a key={id} className="docs-card" data-docs="card" href={`#${id}`}>
            <span className="docs-card-icon" data-icon={id} aria-hidden="true" />
            <span className="docs-card-name" data-docs="card-name">
              {t.sections[id].title}
            </span>
            <p>{t.cards[id]}</p>
          </a>
        ))}
      </nav>

      <div className="docs-sections">
        {SECTIONS.map((id, i) => (
          <Section key={id} id={id} index={i} lang={lang} theme={theme} palette={palette} />
        ))}
      </div>
    </div>
  );
}
