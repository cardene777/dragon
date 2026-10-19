import { createContext, createElement, useContext, useEffect, useState, type ReactNode } from "react";
import type { DslTheme } from "@cardenelabs/dragon";

import { 既定の意匠, 住所の意匠 } from "./site-theme";

/**
 * 画面の意匠を app 全体で共有する (#2962)。 形は `useLocale.ts` と同じ。
 *
 * 開いた時の意匠は住所の `?theme=` だけで決め、保存した値は読まない。
 * 決まった意匠は html の `data-site-theme` に出し、`site-theme.css` の表がそれを見て当たる。
 */

type SiteThemeContextValue = {
  意匠: DslTheme;
  意匠を置く: (意匠: DslTheme) => void;
};

const SiteThemeContext = createContext<SiteThemeContextValue | null>(null);

/**
 * app root に置く Provider。
 *
 * 意匠は `useState` の初期値として最初の描画で読む。 描いた後の効果で読むと、
 * 最初の 1 回だけ活版の図が描かれてから替わる。
 */
export function SiteThemeProvider({ children }: { children: ReactNode }): React.ReactElement {
  const [意匠, 意匠を置く] = useState<DslTheme>(() => 住所の意匠(window.location.href));

  // html は `public/site-theme.js` が描く前に付けている。 置き直した時もここで揃える
  useEffect(() => {
    document.documentElement.setAttribute("data-site-theme", 意匠);
  }, [意匠]);

  return createElement(SiteThemeContext.Provider, { value: { 意匠, 意匠を置く } }, children);
}

/** 画面の意匠と、置き直す関数。 Provider の外では活版を返す (単体の検査で描く部品向け) */
export function useSiteTheme(): [DslTheme, (意匠: DslTheme) => void] {
  const ctx = useContext(SiteThemeContext);
  if (ctx) return [ctx.意匠, ctx.意匠を置く];
  return [既定の意匠, () => {}];
}
