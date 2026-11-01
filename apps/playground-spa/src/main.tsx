import { FONTS, type Theme } from "@cardenelabs/dragon/light";
import { type ReactElement, StrictMode, useCallback, useEffect, useLayoutEffect, useRef, useState, useSyncExternalStore } from "react";
import { createRoot } from "react-dom/client";

import { isKind } from "./catalog/catalog";
import { LATER_SNIPPETS, partOf } from "./catalog/parts";
import { LATER_EXAMPLES } from "./examples";
import { Home } from "./home/Home";
import { NotFound } from "./not-found/NotFound";
import { Playground } from "./Playground";
import { ReleaseNotes } from "./release-notes/ReleaseNotes";
import { fontsSeen, loadFonts } from "./site/fonts";
import { KIND_CHUNKS } from "./site/kinds";
import { startWhenIdle } from "./site/later";
import { LATER_CATALOG, LATER_DOCS, LaterPage } from "./site/pages";
import { redirectSharedLink, type Route, routeOf, usePath } from "./site/routes";
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
 * 概要は `home/Home.tsx` (#3032)、カタログは `catalog/` (#3033)、使い方は `docs/Docs.tsx` (#3034)、
 * 更新履歴は `release-notes/ReleaseNotes.tsx`、見つからない頁は `not-found/NotFound.tsx` (#3035) が持つ。
 * カタログの部品の頁は `catalog/PartPage.tsx` (#3166) が持つ。知らない分類と部品の経路は見つからない頁にする。
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

/** 経路の画面。カタログに無い分類と部品は見つからない頁にする */
function screenRoute(path: string): Route {
  const route = routeOf(path);
  if (route.screen === "category" && !isKind(route.category)) return { screen: "not-found" };
  if (route.screen === "part" && partOf(route.part) === undefined) return { screen: "not-found" };
  return route;
}

/** 頁の題に出す画面の名前。概要は名前を付けず、分類の頁は図の種類の名前に、部品の頁は部品の名前にする */
function screenName(route: Route, lang: Lang): string | null {
  const t = TEXT[lang];
  if (route.screen === "home") return null;
  if (route.screen === "category") return isKind(route.category) ? t.shelf.kinds[route.category] : null;
  if (route.screen === "part") {
    const part = partOf(route.part);
    return part ? t.site.catalog.parts[part.id].name : null;
  }
  return t.site.screens[route.screen].title;
}

function Site(): ReactElement {
  const path = usePath();
  const route = screenRoute(path);
  const part = partOf(route.part);
  const category = isKind(route.category) ? route.category : undefined;
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

  // 初めて開く端末は最初の画面を描いた後に字の CSS を読む (#3292)
  useEffect(() => {
    void loadFonts();
  }, []);

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
          <LaterPage chunk={LATER_CATALOG} lang={lang}>
            {({ CatalogIndex }) => <CatalogIndex lang={lang} />}
          </LaterPage>
        ) : route.screen === "category" && category ? (
          <LaterPage chunk={LATER_CATALOG} lang={lang}>
            {/* 分類を移ると検索と選んだ見本を持ち越さないよう、分類ごとに置き直す */}
            {({ CategoryPage }) => <CategoryPage key={category} kind={category} lang={lang} theme={theme} palette={palette} />}
          </LaterPage>
        ) : route.screen === "part" && part ? (
          <LaterPage chunk={LATER_CATALOG} lang={lang}>
            {/* 部品を移ると段を持ち越さないよう、部品ごとに置き直す */}
            {({ PartPage }) => <PartPage key={part.id} part={part} lang={lang} theme={theme} palette={palette} />}
          </LaterPage>
        ) : route.screen === "docs" ? (
          <LaterPage chunk={LATER_DOCS} lang={lang}>
            {({ Docs }) => <Docs lang={lang} theme={theme} palette={palette} />}
          </LaterPage>
        ) : route.screen === "release-notes" ? (
          <ReleaseNotes lang={lang} />
        ) : (
          <NotFound lang={lang} path={path} />
        )}
      </main>
    </div>
  );
}

redirectSharedLink();
// React が最初に描く前に色を置き、最初の 1 回だけ色の無い地が出るのを避ける
paintSite(storedPalette(), deviceTheme());
// 2 度目からは字の CSS を読み終えてから描く。字の file が cache に在れば端末の字を挟まない (#3292)
if (fontsSeen()) await loadFonts();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Site />
  </StrictMode>,
);
// 見本と部品の図の記法は最初の画面を描いた後に裏で読み始め、見本帳を開く頃には届いているようにする (#3246)。
// 使い方の頁とカタログの頁も同じで、初めて頁を開く時に待たせない (#3280)
startWhenIdle([LATER_EXAMPLES, LATER_SNIPPETS, ...KIND_CHUNKS, LATER_DOCS, LATER_CATALOG]);
