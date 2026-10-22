/**
 * 概要の頁 (#3032)。0.35.0 より前のサイトの概要 (`pages/HomePage.tsx`) と同じ 6 区画を、今の記法と再生の部品で作る。
 *
 * 呼びかけ、記法と図の実物、特長 3 つ、3 手順、用例 3 つ、最後の呼びかけの順に縦に積む。
 * 実物の窓の図と用例の縮小版は、今の記法で書いた見本を再生の部品で動かす (`LiveFigure`)。
 * 実物の窓は、図の今の段に合わせて段の札を替え、その段の行 (段の `#` の行から次の段の前まで) を光らせる。
 * 用例の札は見本 3 つから作り、題と図の種類と説明は見本の file から読む (`exampleInfo`)。
 * 見た目は前の `styles/home.css` を `home.css` に写した。
 */
import { parseNotation, type Theme } from "@cardenelabs/dragon";
import { type ReactElement, useMemo, useState } from "react";

import { EXAMPLE_KEYS, exampleInfo, exampleText, TEMPLATE } from "../examples";
import { LiveFigure } from "../site/LiveFigure";
import { follow, PATHS, REPO } from "../site/routes";
import { type Lang, TEXT } from "../text";
import demoJa from "./demo.dragon?raw";
import demoEn from "./demo.en.dragon?raw";
import "./home.css";

const DEMO: Record<Lang, string> = { ja: demoJa.trimEnd(), en: demoEn.trimEnd() };
/** 実物の窓の書類名 */
const DEMO_FILE = "login.dragon";
/** 特長の線の絵 (`home/icons/<名前>.svg`)。並びは `TEXT` の特長と同じ */
const FEATURE_ICONS = ["write", "play", "share"] as const;

/** 記法の段ごとの行の範囲 (1 から数える)。段の `#` の行から、次の段の前の空でない行まで */
function stepLines(text: string): number[][] {
  const lines = text.split("\n");
  const heads = lines.flatMap((line, i) => (line.startsWith("#") ? [i] : []));
  return heads.map((head, k) => {
    let end = (heads[k + 1] ?? lines.length) - 1;
    while (end > head && (lines[end] ?? "").trim() === "") end--;
    return Array.from({ length: end - head + 1 }, (_, i) => head + i + 1);
  });
}

/** 行の役目。色分けにだけ使う */
function lineKind(line: string, index: number): string | undefined {
  if (line.startsWith("//")) return "comment";
  if (line.startsWith("#")) return "step";
  if (line.startsWith(">")) return "say";
  if (line.startsWith("`")) return "code";
  return index === 0 ? "head" : undefined;
}

function Demo({ lang, theme }: { lang: Lang; theme: Theme }): ReactElement {
  const t = TEXT[lang];
  const text = DEMO[lang];
  const [step, setStep] = useState(0);
  const steps = useMemo(() => {
    const parsed = parseNotation(text);
    return parsed.ok ? parsed.diagram.steps : [];
  }, [text]);
  const current = new Set(stepLines(text)[step] ?? []);
  const shown = steps[Math.min(step, steps.length - 1)];
  return (
    <section className="home-demo" data-home="demo">
      <div className="home-canvas">
        <div className="home-canvas-bar">
          <div className="home-canvas-file">
            <span className="home-dots" aria-hidden="true">
              <span />
              <span />
              <span />
            </span>
            <span className="home-file" data-home="demo-file">
              {DEMO_FILE}
            </span>
          </div>
          {shown !== undefined && (
            <span className="home-phase" data-home="demo-phase">
              <span className="home-live-dot" aria-hidden="true" />
              {t.stage.phase(Math.min(step, steps.length - 1) + 1, steps.length, shown.title)}
            </span>
          )}
        </div>
        <div className="home-canvas-body">
          <div className="home-code" data-home="demo-code">
            {text.split("\n").map((line, i) => (
              // 行は番号で並びが決まり、入れ替わらない
              <div key={i} className="home-code-line" data-line={i + 1} data-current={current.has(i + 1)} data-kind={lineKind(line, i)}>
                <span className="home-ln" aria-hidden="true">
                  {i + 1}
                </span>
                <span className="home-code-text" data-home="code-text">
                  {line}
                </span>
              </div>
            ))}
          </div>
          {/* 箱 3 つの小さな図なので、幅 390 でも全体を止めて見せる (箱の名前の字は 10px ほどに留まる) */}
          <LiveFigure className="home-canvas-stage" notation={text} lang={lang} theme={theme} onStep={setStep} whole />
        </div>
      </div>
    </section>
  );
}

export function Home({ lang, theme }: { lang: Lang; theme: Theme }): ReactElement {
  const t = TEXT[lang].site;
  const home = t.home;
  const [before, em, after] = home.title;
  const kinds = TEXT[lang].shelf.kinds;
  const uses = EXAMPLE_KEYS.flatMap((key) => {
    const info = exampleInfo(key, lang);
    return info ? [{ key, ...info }] : [];
  });
  return (
    <div className="home">
      <section className="home-hero" data-home="hero">
        <div className="home-eyebrow">
          <span className="home-chip">{home.chip(Object.values(kinds))}</span>
        </div>
        <h1>
          {before}
          <em>{em}</em>
          {after}
        </h1>
        <p className="home-lead">{home.lead}</p>
        <div className="home-cta">
          <a className="home-btn-primary" href={PATHS.editor} onClick={(e) => follow(e)}>
            {t.openEditor}
          </a>
          <a className="home-btn-secondary" href={PATHS.docs} onClick={(e) => follow(e)}>
            {home.readDocs}
          </a>
        </div>
      </section>

      <Demo lang={lang} theme={theme} />

      <section className="home-features" data-home="features">
        <div className="home-head">
          <span className="home-head-eyebrow">{home.features.eyebrow}</span>
          <h2>{home.features.title}</h2>
        </div>
        <div className="home-grid">
          {home.features.items.map((item, i) => (
            <div key={item.title} className="home-feature" data-home="feature">
              <span className="home-feature-icon" data-home="feature-icon" data-icon={FEATURE_ICONS[i]} aria-hidden="true" />
              <h3>{item.title}</h3>
              <p>{item.text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="home-steps" data-home="steps">
        <div className="home-head">
          <span className="home-head-eyebrow">{home.steps.eyebrow}</span>
          <h2>{home.steps.title}</h2>
        </div>
        <div className="home-grid">
          {home.steps.items.map((item, i) => (
            <div key={item.title} className="home-step" data-home="step">
              <div className="home-step-no" data-home="step-no">
                {String(i + 1).padStart(2, "0")}
              </div>
              <h3>{item.title}</h3>
              <p>{item.text}</p>
              {i === 1 && (
                <pre className="home-step-code" data-home="step-code">
                  {TEMPLATE[lang]}
                </pre>
              )}
            </div>
          ))}
        </div>
      </section>

      <section className="home-uses" data-home="uses">
        <div className="home-head">
          <span className="home-head-eyebrow">{home.uses.eyebrow}</span>
          <h2>{home.uses.title}</h2>
        </div>
        <div className="home-use-grid">
          {uses.map((use) => (
            <a key={use.key} className="home-use" data-home="use" href={`${PATHS.catalog}/${use.kind}`} onClick={(e) => follow(e)}>
              <LiveFigure className="home-use-thumb" notation={exampleText(use.key, lang)} lang={lang} theme={theme} whole />
              <div className="home-use-body">
                <span className="home-use-kind" data-home="use-kind">
                  {kinds[use.kind]}
                </span>
                <h3>{use.title}</h3>
                <p data-home="use-about">{use.about}</p>
              </div>
            </a>
          ))}
        </div>
        <div className="home-uses-more" data-home="uses-more">
          <a className="home-link" href={PATHS.catalog} onClick={(e) => follow(e)}>
            {home.uses.more}
          </a>
        </div>
      </section>

      <section className="home-closing" data-home="closing">
        <h2>{home.closing.title}</h2>
        <p>{home.closing.lead}</p>
        <div className="home-cta">
          <a className="home-btn-primary" href={PATHS.editor} onClick={(e) => follow(e)}>
            {t.openEditor}
          </a>
          <a className="home-btn-secondary" href={REPO} target="_blank" rel="noopener noreferrer">
            GitHub ↗
          </a>
        </div>
      </section>
    </div>
  );
}
