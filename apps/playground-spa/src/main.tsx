import "@cardenelabs/dragon/fonts";
import { FONTS, type Theme } from "@cardenelabs/dragon";
import { type ReactElement, StrictMode, useCallback, useLayoutEffect, useRef, useState, useSyncExternalStore } from "react";
import { createRoot } from "react-dom/client";

import { isKind } from "./catalog/catalog";
import { CatalogIndex } from "./catalog/CatalogIndex";
import { CategoryPage } from "./catalog/CategoryPage";
import { Docs } from "./docs/Docs";
import { Home } from "./home/Home";
import { Playground } from "./Playground";
import { redirectSharedLink, type Route, routeOf, usePath } from "./site/routes";
import { Screen } from "./site/screens";
import { paintSite, storedPalette, storePalette } from "./site/site-colors";
import { SiteHeader } from "./site/SiteHeader";
import { deviceLang, type Lang, TEXT } from "./text";
import "./site/site.css";
import "./playground.css";
import "./catalog/catalog.css";

/**
 * サイトの入口 (#3030)。
 *
 * 0.35.0 より前のサイトと同じ 7 画面を経路で出し分け、どの画面にも同じ上の帯を載せる。
 * 概要は `home/Home.tsx` (#3032)、カタログは `catalog/` (#3033)、使い方は `docs/Docs.tsx` (#3034) が持つ。知らない分類の経路は見つからない頁にする。
 * 言葉と明暗と色味はサイト全体で 1 つ持ち、帯の切替で替える。明暗は選ぶまで端末の設定に従う。
 * 色味は選ぶまで紙と墨で、選んだ色味は次に開いた時にも残す (#3033)。
 * 頁の色は色味と明暗から `site/site-colors.ts` で引いて html に置き、図も同じ色味で描く。
 */
const DARK = "(prefers-color-scheme: dark)";

function subscribeDevice(listener: () => void): () => void {
  const media = matchMedia(DARK);
  media.addEventListener("change", listener);
  return () => media.removeEventListener("change", listener);
}

const deviceTheme = (): Theme => (matchMedia(DARK).matches ? "dark" : "light");

/** 経路の画面。カタログに無い分類は見つからない頁にする */
function screenRoute(path: string): Route {
  const route = routeOf(path);
  return route.screen === "category" && !isKind(route.category) ? { screen: "not-found" } : route;
}

/** 頁の題に出す画面の名前。概要は名前を付けず、分類の頁は図の種類の名前にする */
function screenName(route: Route, lang: Lang): string | null {
  const t = TEXT[lang];
  if (route.screen === "home") return null;
  if (route.screen === "category") return isKind(route.category) ? t.shelf.kinds[route.category] : null;
  return t.site.screens[route.screen].title;
}

function Site(): ReactElement {
  const path = usePath();
  const route = screenRoute(path);
  const [lang, setLang] = useState<Lang>(() => deviceLang(navigator.languages.length > 0 ? navigator.languages : [navigator.language]));
  const [choice, setChoice] = useState<Theme | null>(null);
  const [palette, setPalette] = useState(storedPalette);
  const device = useSyncExternalStore(subscribeDevice, deviceTheme);
  const theme = choice ?? device;
  /** 編集画面が言葉を替える前に済ませる処理 (見本を英語版に替えるなど)。編集画面が置く */
  const beforeLang = useRef<((next: Lang) => void) | null>(null);
  const onBeforeLang = useCallback((handler: ((next: Lang) => void) | null) => {
    beforeLang.current = handler;
  }, []);

  // 描く前に置き、最初の 1 回だけ違う色で描かれるのを避ける
  useLayoutEffect(() => {
    const root = document.documentElement;
    root.lang = lang;
    root.style.setProperty("--sans", `"${FONTS.sans}"`);
    root.style.setProperty("--mono", `"${FONTS.mono}"`);
  }, [lang]);

  useLayoutEffect(() => {
    paintSite(palette, theme);
  }, [palette, theme]);

  const name = screenName(route, lang);
  useLayoutEffect(() => {
    document.title = name === null ? TEXT[lang].title : `${name} — dragon`;
  }, [lang, name]);

  const changeLang = (next: Lang): void => {
    if (next === lang) return;
    beforeLang.current?.(next);
    setLang(next);
  };

  const changePalette = (next: string): void => {
    setPalette(next);
    storePalette(next);
  };

  return (
    <div className="site">
      <SiteHeader
        path={path}
        route={route}
        lang={lang}
        theme={theme}
        palette={palette}
        onLang={changeLang}
        onTheme={() => setChoice(theme === "dark" ? "light" : "dark")}
        onPalette={changePalette}
      />
      <main className="site-main" data-site-screen={route.screen}>
        {route.screen === "home" ? (
          <Home lang={lang} theme={theme} palette={palette} />
        ) : route.screen === "editor" ? (
          <Playground lang={lang} theme={theme} palette={palette} onBeforeLang={onBeforeLang} />
        ) : route.screen === "catalog" ? (
          <CatalogIndex lang={lang} />
        ) : route.screen === "category" && isKind(route.category) ? (
          // 分類を移ると検索と選んだ見本を持ち越さないよう、分類ごとに置き直す
          <CategoryPage key={route.category} kind={route.category} lang={lang} theme={theme} palette={palette} />
        ) : route.screen === "docs" ? (
          <Docs lang={lang} theme={theme} palette={palette} />
        ) : (
          <Screen screen={route.screen === "category" ? "not-found" : route.screen} lang={lang} />
        )}
      </main>
    </div>
  );
}

redirectSharedLink();
// React が最初に描く前に色を置き、最初の 1 回だけ色の無い地が出るのを避ける
paintSite(storedPalette(), deviceTheme());

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Site />
  </StrictMode>,
);
