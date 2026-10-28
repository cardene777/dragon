/**
 * カタログの分類の頁 (#3033)。0.35.0 より前のサイトの分類の頁 (`pages/CategoryPage.tsx`) と同じ形にする。
 *
 * 左に検索と見本の一覧、右に選んだ見本 1 つを置く。右の見本は名前と説明、図とコードの見出し、色味の切替、
 * 縮小と拡大と全体に合わせる、拡大の釦、段の札、動く図、進み具合の帯、段の本文、編集画面で開くを持つ。
 * 携帯の幅では部品を指で押せる大きさ (44px) にし、編集画面と同じく全体に合わせるの釦を出さず、
 * 倍率を縮小と拡大の間の釦にして、押すと全体に合わせる (#3067)。
 * 図とコードはどちらも残したまま表示だけを入れ替え、切り替えるたびに図を描き直さない。
 * コードの見出しは記法と JSON の切替と写す釦と本文を持ち、拡大の釦は画面を覆う重ね窓に同じ図を大きく出す。
 * 色味の切替は「サイトと同じ」と 3 つの色味で、この頁の図だけを替える。帯の色味が替わると「サイトと同じ」に戻る。
 * 前の頁にあった cdl だけの道具 (パターン、描き方、速さ) は、今の記法に無いので置かない。
 * 2 面の下には、この図の種類で使える部品の札を部品の表の並びで置き、部品の頁へ飛べるようにする (#3166)。
 */
import { type Diagram, PALETTES, parseNotation, readDiagram, type Theme } from "@cardenelabs/dragon";
import { type CSSProperties, type ReactElement, useEffect, useMemo, useRef, useState } from "react";

import { ZOOM_RANGE, ZOOM_STEP, zoomed } from "../editor/fit";
import { useFittedFigure } from "../editor/useFittedFigure";
import { type ExampleKey, exampleInfo, exampleText } from "../examples";
import { toHash } from "../share";
import { follow, PATHS } from "../site/routes";
import { usePhone } from "../site/usePhone";
import { type Lang, TEXT } from "../text";
import { type Kind, samplesOf } from "./catalog";
import { PartCard } from "./CatalogIndex";
import { partsOf } from "./parts";

type View = "figure" | "code";
type Source = "notation" | "json";

/** 色味の切替で「サイトと同じ」を表す値 */
const SAME = "site";

/** 見本の記法を読み、検査を通した図。読めない見本は `null` */
function diagramOf(text: string): Diagram | null {
  const parsed = parseNotation(text);
  if (!parsed.ok) return null;
  const read = readDiagram(parsed.diagram);
  return read.ok ? read.diagram : null;
}

/** 見本の名前か説明か鍵に、検索の語が含まれるか。大文字と小文字を見分けない */
function matches(key: ExampleKey, lang: Lang, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (q === "") return true;
  const info = exampleInfo(key, lang);
  return [info?.title ?? "", info?.about ?? "", key].some((s) => s.toLowerCase().includes(q));
}

interface Props {
  kind: Kind;
  lang: Lang;
  theme: Theme;
  /** 上の帯で選んだ色味 */
  palette: string;
}

export function CategoryPage({ kind, lang, theme, palette: sitePalette }: Props): ReactElement {
  const t = TEXT[lang];
  const c = t.site.catalog;
  const keys = samplesOf(kind);
  const [query, setQuery] = useState("");
  const [picked, setPicked] = useState<ExampleKey | null>(null);
  const [view, setView] = useState<View>("figure");
  const [source, setSource] = useState<Source>("notation");
  /*
   * この頁で選んだ色味を、選んだ時の帯の色味と組で持つ。
   * 帯の色味が替わると組が食い違うので、戻す処理を別に書かずに「サイトと同じ」へ戻る。
   */
  const [chosen, setChosen] = useState<{ site: string; palette: string } | null>(null);
  const [expanded, setExpanded] = useState(false);
  const choice = chosen?.site === sitePalette ? chosen.palette : SAME;
  const palette = choice === SAME ? sitePalette : choice;
  const filtered = keys.filter((key) => matches(key, lang, query));
  // 検索で一覧から外れても、選んだ見本は右に残す
  const current = picked !== null && keys.includes(picked) ? picked : keys[0];
  const kindName = t.shelf.kinds[kind];

  return (
    <div className="catalog-page" data-catalog="category">
      <div className="catalog-hero">
        <nav className="catalog-crumb" data-catalog="crumb" aria-label={c.crumb}>
          <a href={PATHS.home} onClick={(e) => follow(e)}>
            {t.site.nav.home}
          </a>
          <span aria-hidden="true">›</span>
          <a href={PATHS.catalog} onClick={(e) => follow(e)}>
            {t.site.screens.catalog.title}
          </a>
          <span aria-hidden="true">›</span>
          <span className="catalog-crumb-here" aria-current="page">
            {kindName}
          </span>
        </nav>
        <h1 className="catalog-title">{kindName}</h1>
        <p className="catalog-desc" data-catalog="desc">
          {c.kinds[kind]}
        </p>
        <div className="catalog-meta">
          <span className="catalog-count" data-catalog="count">
            {c.total(keys.length)}
          </span>
          {filtered.length !== keys.length && <span className="catalog-count catalog-count-filter">{c.showing(filtered.length)}</span>}
        </div>
      </div>

      <div className="catalog-body">
        <aside className="catalog-sidebar" data-catalog="sidebar" aria-label={c.list}>
          <div className="catalog-search-wrap">
            <span className="catalog-search-icon" aria-hidden="true" />
            <input
              type="text"
              className="catalog-search"
              data-catalog="search"
              placeholder={c.search}
              aria-label={c.searchLabel}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            {query !== "" && (
              <button type="button" className="catalog-search-clear" data-catalog="search-clear" aria-label={c.clearSearch} onClick={() => setQuery("")}>
                ×
              </button>
            )}
          </div>
          <div className="catalog-list" role="list">
            {filtered.length === 0 ? (
              <p className="catalog-list-empty" data-catalog="empty">
                {c.nothing}
              </p>
            ) : (
              filtered.map((key) => (
                <button
                  key={key}
                  type="button"
                  role="listitem"
                  className="catalog-list-item"
                  data-catalog="item"
                  aria-current={key === current ? "true" : undefined}
                  onClick={() => setPicked(key)}
                >
                  {exampleInfo(key, lang)?.title ?? key}
                </button>
              ))
            )}
          </div>
        </aside>

        <section className="catalog-preview" data-catalog="preview" aria-label={c.preview}>
          {current !== undefined && (
            <Preview
              key={current}
              sample={current}
              lang={lang}
              theme={theme}
              palette={palette}
              choice={choice}
              onChoice={(id) => setChosen(id === SAME ? null : { site: sitePalette, palette: id })}
              view={view}
              onView={setView}
              source={source}
              onSource={setSource}
              onExpand={() => setExpanded(true)}
            />
          )}
        </section>
      </div>

      <section className="catalog-section catalog-uses" data-catalog="uses" aria-label={c.uses}>
        <header className="catalog-section-head">
          <h2 className="catalog-section-title">{c.uses}</h2>
          <p className="catalog-section-lead">{c.usesLead}</p>
        </header>
        <div className="catalog-part-grid">
          {partsOf(kind).map((part) => (
            <PartCard key={part.id} part={part} lang={lang} name="uses-part" />
          ))}
        </div>
      </section>

      {expanded && current !== undefined && (
        <Overlay sample={current} lang={lang} theme={theme} palette={palette} onClose={() => setExpanded(false)} />
      )}
    </div>
  );
}

interface PreviewProps {
  sample: ExampleKey;
  lang: Lang;
  theme: Theme;
  /** 図に当てる色味 */
  palette: string;
  /** 色味の切替の値。「サイトと同じ」か色味の名前 */
  choice: string;
  onChoice: (id: string) => void;
  view: View;
  onView: (next: View) => void;
  source: Source;
  onSource: (next: Source) => void;
  onExpand: () => void;
}

/** 右の見本。見本ごとに置き直し、段と倍率を見本の間で持ち越さない */
function Preview({ sample, lang, theme, palette, choice, onChoice, view, onView, source, onSource, onExpand }: PreviewProps): ReactElement {
  const t = TEXT[lang];
  const c = t.site.catalog;
  const text = exampleText(sample, lang);
  const info = exampleInfo(sample, lang);
  const title = info?.title ?? sample;
  // 言葉を替えると見本の記法も替わるので、記法が替わった時だけ読み直して描き直す
  const diagram = useMemo(() => diagramOf(text), [text]);
  const host = useRef<HTMLDivElement>(null);
  const [step, setStep] = useState(0);
  const [factor, setFactor] = useState(1);
  const [copied, setCopied] = useState(false);
  const phone = usePhone();
  const fit = useFittedFigure(host, diagram, { palette, theme, lang, onStep: setStep });

  useEffect(() => {
    if (!copied) return;
    const timer = window.setTimeout(() => setCopied(false), 1600);
    return () => window.clearTimeout(timer);
  }, [copied]);

  const count = diagram?.steps.length ?? 0;
  const now = diagram?.steps[Math.min(step, count - 1)];
  const phased = count > 1 && now !== undefined;
  const scale = fit ? zoomed(fit.scale, factor) : null;
  // 倍率の釦は図を見ている間だけ押せる。コードの見出しでは図が隠れていて、押しても変わって見えない
  const zoomable = fit !== null && view === "figure";
  const level = scale === null || !zoomable ? "—" : `${Math.round(scale * 100)}%`;
  const zoomBy = (by: number): void => {
    if (!fit) return;
    // 範囲の端で押しても戻りが遅れないよう、範囲に収めた倍率から係数を出し直す
    setFactor(zoomed(fit.scale, factor * by) / fit.scale);
  };
  const body = source === "notation" ? text : diagram ? JSON.stringify(diagram, null, 2) : "";
  const copy = (): void => {
    void navigator.clipboard?.writeText(body).then(
      () => setCopied(true),
      () => undefined,
    );
  };

  return (
    <article className="catalog-preview-card">
      <header className="catalog-preview-head">
        <h2 className="catalog-preview-title">{title}</h2>
        {info?.about && (
          <p className="catalog-preview-sub" data-catalog="about">
            {info.about}
          </p>
        )}
      </header>

      <div className="catalog-preview-tabs">
        <div className="catalog-tablist" role="tablist" aria-label={c.views}>
          {(["figure", "code"] as const).map((v) => (
            <button
              key={v}
              type="button"
              role="tab"
              className="catalog-preview-tab"
              data-catalog={`tab-${v}`}
              aria-selected={view === v}
              onClick={() => onView(v)}
            >
              {v === "figure" ? c.figure : c.code}
            </button>
          ))}
        </div>
        <div className="catalog-preview-actions">
          <label className="catalog-option">
            <span className="catalog-option-label">{t.palette}</span>
            <span className="catalog-select-field">
              <select className="catalog-select" data-catalog="palette" value={choice} onChange={(e) => onChoice(e.target.value)}>
                <option value={SAME}>{c.sameAsSite}</option>
                {Object.values(PALETTES).map((p) => (
                  <option key={p.id} value={p.id}>
                    {t.paletteNames[p.id] ?? p.name}
                  </option>
                ))}
              </select>
            </span>
          </label>
          <div className="catalog-zoom" role="group" aria-label={t.stage.zoom}>
            <ZoomButton name="zoom-out" icon="zoom-out" label={t.stage.zoomOut} disabled={!zoomable || scale === ZOOM_RANGE[0]} onClick={() => zoomBy(1 / ZOOM_STEP)} />
            {phone ? (
              <button
                type="button"
                className="catalog-zoom-btn catalog-zoom-fit"
                data-catalog="zoom-level"
                aria-label={`${t.stage.fit} (${level})`}
                title={t.stage.fit}
                disabled={!zoomable}
                onClick={() => setFactor(1)}
              >
                {level}
              </button>
            ) : (
              <span className="catalog-zoom-value" data-catalog="zoom-level">
                {level}
              </span>
            )}
            <ZoomButton name="zoom-in" icon="zoom-in" label={t.stage.zoomIn} disabled={!zoomable || scale === ZOOM_RANGE[1]} onClick={() => zoomBy(ZOOM_STEP)} />
            {!phone && <ZoomButton name="fit" icon="fit" label={t.stage.fit} disabled={!zoomable} onClick={() => setFactor(1)} />}
          </div>
          <button type="button" className="catalog-expand-btn" data-catalog="expand" aria-label={c.expandLabel(title)} onClick={onExpand}>
            <span className="pg-icon" data-icon="fullscreen" aria-hidden="true" />
            <span>{c.expand}</span>
          </button>
        </div>
      </div>

      <div
        className="catalog-preview-stage pg-figure"
        data-catalog="stage"
        data-phased={phased ? "on" : undefined}
        hidden={view !== "figure"}
        style={fit && scale !== null ? ({ "--fig-w": `${fit.width * scale}px` } as CSSProperties) : undefined}
      >
        {phased && (
          <p className="pg-phase" data-catalog="phase-badge">
            <span className="pg-phase-dot" aria-hidden="true" />
            {t.stage.phase(step + 1, count, now.title)}
          </p>
        )}
        <div className="pg-player" ref={host} />
      </div>
      {view === "figure" && (phased || now?.body) && (
        <div className="catalog-preview-note">
          {phased && (
            <div className="pg-progress" data-catalog="progress" aria-hidden="true">
              {diagram?.steps.map((s, i) => (
                <span key={`${i}-${s.title}`} className="pg-progress-seg" data-catalog="progress-seg" data-done={i <= step} />
              ))}
            </div>
          )}
          {now?.body && (
            <p className="catalog-step-note" data-catalog="step-note">
              {now.body}
            </p>
          )}
        </div>
      )}

      <div className="catalog-source" data-catalog="source" role="region" hidden={view !== "code"} aria-label={c.source}>
        <div className="catalog-source-bar">
          <div className="catalog-source-tabs" role="group">
            {(["notation", "json"] as const).map((s) => (
              <button
                key={s}
                type="button"
                className="catalog-source-tab"
                data-catalog={`source-${s}`}
                aria-pressed={source === s}
                onClick={() => onSource(s)}
              >
                {s === "notation" ? t.notation : "JSON"}
              </button>
            ))}
          </div>
          <button type="button" className="catalog-source-copy" data-catalog="copy" onClick={copy}>
            <span className="catalog-copy-icon" aria-hidden="true" />
            <span aria-live="polite">{copied ? c.copied : c.copy}</span>
          </button>
        </div>
        <pre className="catalog-source-code" data-catalog="source-code">
          <code>{body}</code>
        </pre>
      </div>

      <footer className="catalog-preview-foot">
        <a className="catalog-preview-link" data-catalog="open-editor" href={`${PATHS.editor}${toHash(text)}`} onClick={(e) => follow(e)}>
          {c.openEditor}
        </a>
      </footer>
    </article>
  );
}

interface ZoomButtonProps {
  name: string;
  icon: string;
  label: string;
  disabled: boolean;
  onClick: () => void;
}

/** 倍率の釦。字の代わりに線の絵を出し、名前は読み上げと押す前の説明に出す */
function ZoomButton({ name, icon, label, disabled, onClick }: ZoomButtonProps): ReactElement {
  return (
    <button type="button" className="catalog-zoom-btn" data-catalog={name} aria-label={label} title={label} disabled={disabled} onClick={onClick}>
      <span className="pg-icon" data-icon={icon} aria-hidden="true" />
    </button>
  );
}

interface OverlayProps {
  sample: ExampleKey;
  lang: Lang;
  theme: Theme;
  palette: string;
  onClose: () => void;
}

/**
 * 拡大の重ね窓。画面を覆い、同じ見本の図を枠に合わせて大きく描く。
 * 閉じる釦と Escape と、窓の外を押した時に閉じる。開いている間は頁を送らせず、閉じたら開いた釦へ戻る。
 */
function Overlay({ sample, lang, theme, palette, onClose }: OverlayProps): ReactElement {
  const t = TEXT[lang];
  const text = exampleText(sample, lang);
  const info = exampleInfo(sample, lang);
  const diagram = useMemo(() => diagramOf(text), [text]);
  const host = useRef<HTMLDivElement>(null);
  const close = useRef<HTMLButtonElement>(null);
  // 札を画面いっぱいに取り、図は送らずに全体が見えるよう枠の幅と高さに収める。高さに収めると字が読めない図は寄って追う図になる (#3047)
  const fit = useFittedFigure(host, diagram, { palette, theme, lang, onStep: () => undefined, fitHeight: true });
  // 閉じる処理は描くたびに替わりうるので、待ち受けを置き直さずに最新の物を呼ぶ
  const closeWith = useRef(onClose);
  useEffect(() => {
    closeWith.current = onClose;
  });

  useEffect(() => {
    const opener = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    close.current?.focus();
    const onKey = (e: KeyboardEvent): void => {
      if (e.key === "Escape") closeWith.current();
    };
    addEventListener("keydown", onKey);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      removeEventListener("keydown", onKey);
      document.body.style.overflow = overflow;
      opener?.focus();
    };
  }, []);

  return (
    <div
      className="catalog-overlay"
      data-catalog="overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="catalog-overlay-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="catalog-overlay-card">
        <div className="catalog-overlay-head">
          <div>
            <h2 className="catalog-overlay-title" id="catalog-overlay-title" data-catalog="overlay-title">
              {info?.title ?? sample}
            </h2>
            {info?.about && <p className="catalog-overlay-desc">{info.about}</p>}
          </div>
          <button ref={close} type="button" className="catalog-overlay-close" data-catalog="overlay-close" aria-label={t.site.catalog.close} onClick={onClose}>
            ×
          </button>
        </div>
        <div
          className="catalog-overlay-stage pg-figure"
          style={fit ? ({ "--fig-w": `${fit.width * fit.scale}px` } as CSSProperties) : undefined}
        >
          <div className="pg-player" ref={host} />
        </div>
      </div>
    </div>
  );
}
