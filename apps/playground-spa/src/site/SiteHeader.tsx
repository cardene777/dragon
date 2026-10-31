/**
 * 全画面に共通する上の帯 (#3030)。0.35.0 より前のサイトの帯 (`SiteHeader.tsx`、`header.css`) と同じ並びにする。
 *
 * 左に印と名前と添え書き、中に行き先 6 つ、右に言語と色味と明暗の切替と `編集画面を開く →` の釦を置く。
 * 今いる画面の行き先に現在地の印を付け、行き先は頁を読み直さずに移る (`routes.ts`)。
 * 色味の切替はサイトの色と全部の図の色味を替える (#3033)。色味は図の色味の表 (`PALETTES`) の順に並べる。
 * 幅 720 以下 (指で触る時は 900 以下、#3075) では行き先と色味の切替を畳み、開く釦から出す面に置く。
 */
import { type Palette, PALETTES, type Theme } from "@cardenelabs/dragon/light";
import { type CSSProperties, type ReactElement, useEffect, useState } from "react";

import { type Lang, TEXT } from "../text";
import { follow, PATHS, REPO, type Route } from "./routes";
import { accentOf } from "./site-colors";

/** 色味の見本の丸。明るい側と暗い側の地を斜めに分け、縁を差し色で塗る */
const swatchStyle = (p: Palette): CSSProperties =>
  ({ "--sw-light": p.light.page, "--sw-dark": p.dark.page, "--sw-accent": accentOf(p.id, "light") }) as CSSProperties;

/** 帯に並べる画面。名前は `TEXT` の `site.nav` から引く */
const DESTINATIONS = ["home", "catalog", "editor", "docs", "release-notes"] as const;
type Destination = (typeof DESTINATIONS)[number];

/** 今いる画面に印を付ける行き先。カタログの分類の頁と部品の頁ではカタログに付ける */
const currentOf = (route: Route): Destination | undefined =>
  route.screen === "category" || route.screen === "part" ? "catalog" : DESTINATIONS.find((d) => d === route.screen);

interface Props {
  /** 今の path。畳んだ行き先を開いた画面を覚えるのに使う */
  path: string;
  route: Route;
  lang: Lang;
  theme: Theme;
  /** サイトと図の色味 */
  palette: string;
  onLang: (next: Lang) => void;
  onTheme: () => void;
  onPalette: (id: string) => void;
}

export function SiteHeader({ path, route, lang, theme, palette, onLang, onTheme, onPalette }: Props): ReactElement {
  const t = TEXT[lang].site;
  const names = TEXT[lang].paletteNames;
  const current = currentOf(route);
  /*
   * 開いているかを直に持たず、開いた時の画面を持つ。
   * 画面を移ると今の画面と食い違うので、移った後に閉じる処理を別に書かずに済む。
   */
  const [openedOn, setOpenedOn] = useState<string | null>(null);
  const open = openedOn === path;

  useEffect(() => {
    if (!open) return;
    const close = (e: KeyboardEvent): void => {
      if (e.key === "Escape") setOpenedOn(null);
    };
    addEventListener("keydown", close);
    return () => removeEventListener("keydown", close);
  }, [open]);

  const links = (className: string, after?: () => void): ReactElement[] => [
    ...DESTINATIONS.map((d) => (
      <a
        key={d}
        className={className}
        href={PATHS[d]}
        aria-current={d === current ? "page" : undefined}
        onClick={(e) => follow(e, after)}
      >
        {t.nav[d]}
      </a>
    )),
    <a key="github" className={className} href={REPO} target="_blank" rel="noopener noreferrer">
      GitHub ↗
    </a>,
  ];

  return (
    <header className="site-head" data-site="header">
      <a className="site-brand" href={PATHS.home} onClick={(e) => follow(e)}>
        <span className="site-mark" data-site="mark" aria-hidden="true" />
        <span className="site-name" data-site="name">
          dragon
        </span>
        <span className="site-tagline" data-site="tagline">
          — {TEXT[lang].tagline}
        </span>
      </a>
      <nav className="site-nav" data-site="nav" aria-label={t.navLabel}>
        {links("site-nav-link")}
      </nav>
      <div className="site-actions">
        <div className="site-lang" role="group" aria-label={TEXT[lang].language}>
          {(["ja", "en"] as const).map((l) => (
            <button key={l} type="button" data-site={`lang-${l}`} aria-pressed={lang === l} onClick={() => onLang(l)}>
              {l.toUpperCase()}
            </button>
          ))}
        </div>
        <div className="site-palette" data-site="palette" role="group" aria-label={TEXT[lang].palette}>
          {Object.values(PALETTES).map((p) => (
            <button
              key={p.id}
              type="button"
              className="site-palette-btn"
              data-site={`palette-${p.id}`}
              aria-pressed={palette === p.id}
              aria-label={names[p.id] ?? p.name}
              title={names[p.id] ?? p.name}
              onClick={() => onPalette(p.id)}
            >
              <span className="site-swatch" style={swatchStyle(p)} aria-hidden="true" />
            </button>
          ))}
        </div>
        <button
          type="button"
          className="site-icon-btn"
          data-site="theme"
          aria-label={theme === "dark" ? t.toLight : t.toDark}
          title={theme === "dark" ? t.toLight : t.toDark}
          onClick={onTheme}
        >
          {theme === "dark" ? "☀" : "☾"}
        </button>
        <button
          type="button"
          className="site-icon-btn site-menu-btn"
          data-site="menu"
          aria-label={open ? t.closeMenu : t.openMenu}
          aria-expanded={open}
          aria-controls="site-sheet"
          onClick={() => setOpenedOn(open ? null : path)}
        >
          {open ? "×" : "≡"}
        </button>
        <a className="site-cta" data-site="open-editor" href={PATHS.editor} onClick={(e) => follow(e)}>
          {t.openEditor}
        </a>
      </div>
      {open && (
        <>
          <div className="site-scrim" aria-hidden="true" onClick={() => setOpenedOn(null)} />
          <div className="site-sheet" id="site-sheet">
            <nav data-site="sheet" aria-label={t.navLabel}>
              {links("site-sheet-link", () => setOpenedOn(null))}
            </nav>
            <div className="site-sheet-palette" data-site="sheet-palette" role="group" aria-label={TEXT[lang].palette}>
              <span className="site-sheet-label" aria-hidden="true">
                {TEXT[lang].palette}
              </span>
              {Object.values(PALETTES).map((p) => (
                <button
                  key={p.id}
                  type="button"
                  className="site-sheet-swatch"
                  data-site={`palette-${p.id}`}
                  aria-pressed={palette === p.id}
                  onClick={() => onPalette(p.id)}
                >
                  <span className="site-swatch" style={swatchStyle(p)} aria-hidden="true" />
                  {names[p.id] ?? p.name}
                </button>
              ))}
            </div>
            <a className="site-sheet-cta" href={PATHS.editor} onClick={(e) => follow(e, () => setOpenedOn(null))}>
              {t.openEditor}
            </a>
          </div>
        </>
      )}
    </header>
  );
}
