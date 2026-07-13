import { createContext, createElement, useContext, useEffect, useState, type ReactNode } from "react";
import type { Locale } from "./i18n";

/**
 * Locale の app 全体共有 state (CAR-1498 fix)。 従来は各 component が独立 useState を持ち、
 * SiteHeader の toggle が CategoryPage 等の他 component に伝播しない bug があった。
 * React Context 経由で全 component が同じ state を参照する設計に変更。
 *
 * html[lang] を制御。 localStorage `dragon-locale` を SSOT、 URL query `?lang=en` でも切替可。
 * default = ja。
 */

type LocaleContextValue = {
  locale: Locale;
  setLocale: (v: Locale) => void;
};

const LocaleContext = createContext<LocaleContextValue | null>(null);

/**
 * app root に配置する Provider。 全 child component が useLocale() で共通 state を受け取る。
 */
export function LocaleProvider({ children }: { children: ReactNode }): React.ReactElement {
  const [locale, setLocaleState] = useState<Locale>("ja");

  useEffect(() => {
    try {
      const url = new URL(window.location.href);
      const qLang = url.searchParams.get("lang");
      const lsLang = localStorage.getItem("dragon-locale");
      const initial: Locale =
        qLang === "en" || qLang === "ja"
          ? (qLang)
          : lsLang === "en" || lsLang === "ja"
            ? (lsLang)
            : "ja";
      setLocaleState(initial);
      document.documentElement.setAttribute("lang", initial);
    } catch {
      // localStorage / URL 解析失敗時は default (ja) を維持
    }
  }, []);

  const setLocale = (v: Locale): void => {
    setLocaleState(v);
    document.documentElement.setAttribute("lang", v);
    try {
      localStorage.setItem("dragon-locale", v);
    } catch {
      // localStorage 非対応環境では状態のみ更新
    }
  };

  return createElement(LocaleContext.Provider, { value: { locale, setLocale } }, children);
}

/**
 * Locale state を取得する hook。 Provider 配下でのみ利用可、 未配置なら fallback (["ja", noop])。
 * 戻り値は既存 API 互換の [locale, setter] tuple。
 */
export function useLocale(): [Locale, (v: Locale) => void] {
  const ctx = useContext(LocaleContext);
  if (ctx) {
    return [ctx.locale, ctx.setLocale];
  }
  // Provider 未配置時の fallback (test / SSR safe)
  return ["ja", () => {}];
}
