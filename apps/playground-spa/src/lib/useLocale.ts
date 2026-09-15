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
 * 開いた時の言語 (#2018)。 URL の `?lang=` を先に見て、無ければ保存した言語、どちらも無ければ `ja`。
 *
 * `useState` の初期値として最初の描画で読む。 描いた後の効果で読むと、英語を選んだ人にも
 * 最初の 1 回は日本語の画面が出る。 画面は `createRoot` で描くので、サーバー側の HTML と
 * 食い違う心配は無い。
 */
function 開いた時の言語(): Locale {
  try {
    const qLang = new URL(window.location.href).searchParams.get("lang");
    if (qLang === "en" || qLang === "ja") return qLang;
    const lsLang = localStorage.getItem("dragon-locale");
    if (lsLang === "en" || lsLang === "ja") return lsLang;
  } catch {
    // localStorage / URL 解析失敗時は default (ja) を使う
  }
  return "ja";
}

/**
 * app root に配置する Provider。 全 child component が useLocale() で共通 state を受け取る。
 */
export function LocaleProvider({ children }: { children: ReactNode }): React.ReactElement {
  const [locale, setLocaleState] = useState<Locale>(開いた時の言語);

  // html[lang] は言語が決まるたびにここで合わせる (切替ボタンからも同じ経路を通る)
  useEffect(() => {
    document.documentElement.setAttribute("lang", locale);
  }, [locale]);

  const setLocale = (v: Locale): void => {
    setLocaleState(v);
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
