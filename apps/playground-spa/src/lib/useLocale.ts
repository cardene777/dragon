import { useEffect, useState } from "react";
import type { Locale } from "./i18n";

/**
 * html[lang] を制御する hook。 localStorage `dragon-locale` を SSOT に、 URL query `?lang=en` でも切替可。
 * default = ja。
 */
export function useLocale(): [Locale, (v: Locale) => void] {
  const [locale, setLocale] = useState<Locale>("ja");

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
      setLocale(initial);
      document.documentElement.setAttribute("lang", initial);
    } catch {
      // localStorage / URL 解析失敗時は default (ja) を維持
    }
  }, []);

  const update = (v: Locale): void => {
    setLocale(v);
    document.documentElement.setAttribute("lang", v);
    try {
      localStorage.setItem("dragon-locale", v);
    } catch {
      // localStorage / URL 解析失敗時は default (ja) を維持
    }
  };

  return [locale, update];
}
