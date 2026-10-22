import "@cardenelabs/dragon/fonts";
import { FONTS, type Theme } from "@cardenelabs/dragon";
import { type ReactElement, StrictMode, useCallback, useLayoutEffect, useRef, useState, useSyncExternalStore } from "react";
import { createRoot } from "react-dom/client";

import { Playground } from "./Playground";
import { redirectSharedLink, routeOf, usePath } from "./site/routes";
import { Screen } from "./site/screens";
import { SiteHeader } from "./site/SiteHeader";
import { deviceLang, type Lang, TEXT } from "./text";
import "./site/site.css";
import "./playground.css";

/**
 * サイトの入口 (#3030)。
 *
 * 0.35.0 より前のサイトと同じ 7 画面を経路で出し分け、どの画面にも同じ上の帯を載せる。
 * 言葉と明暗はサイト全体で 1 つ持ち、帯の切替で替える。明暗は選ぶまで端末の設定に従う。
 * 頁の色は前のサイトの値の表 (`site/site.css`) から読み、html の `data-scheme` で明暗を選ぶ。
 */
const DARK = "(prefers-color-scheme: dark)";

function subscribeDevice(listener: () => void): () => void {
  const media = matchMedia(DARK);
  media.addEventListener("change", listener);
  return () => media.removeEventListener("change", listener);
}

const deviceTheme = (): Theme => (matchMedia(DARK).matches ? "dark" : "light");

function Site(): ReactElement {
  const path = usePath();
  const route = routeOf(path);
  const [lang, setLang] = useState<Lang>(() => deviceLang(navigator.languages.length > 0 ? navigator.languages : [navigator.language]));
  const [choice, setChoice] = useState<Theme | null>(null);
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
    root.dataset.scheme = theme;
    root.style.colorScheme = theme;
    root.style.setProperty("--sans", `"${FONTS.sans}"`);
    root.style.setProperty("--mono", `"${FONTS.mono}"`);
  }, [lang, theme]);

  useLayoutEffect(() => {
    const t = TEXT[lang];
    document.title = route.screen === "home" ? t.title : `${t.site.screens[route.screen].title} — dragon`;
  }, [lang, route.screen]);

  const changeLang = (next: Lang): void => {
    if (next === lang) return;
    beforeLang.current?.(next);
    setLang(next);
  };

  return (
    <div className="site">
      <SiteHeader
        path={path}
        route={route}
        lang={lang}
        theme={theme}
        onLang={changeLang}
        onTheme={() => setChoice(theme === "dark" ? "light" : "dark")}
      />
      <main className="site-main" data-site-screen={route.screen}>
        {route.screen === "editor" ? <Playground lang={lang} theme={theme} onBeforeLang={onBeforeLang} /> : <Screen route={route} lang={lang} />}
      </main>
    </div>
  );
}

redirectSharedLink();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Site />
  </StrictMode>,
);
