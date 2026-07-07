import { useEffect, useState } from "react";
import { THEMES, type ThemeName } from "./theme";

/**
 * html[data-cdl-theme] を制御する hook。
 * URL query `?theme=<name>` > localStorage > default (blueprint) の順で reconcile。
 * default は blueprint (青地 + white ink + graph paper grid、 元々の根本デザイン)。
 */
export function useTheme(): [ThemeName, (v: ThemeName) => void] {
  const [theme, setTheme] = useState<ThemeName>("blueprint");

  useEffect(() => {
    const url = new URL(window.location.href);
    const qTheme = url.searchParams.get("theme") as ThemeName | null;
    const lsTheme = localStorage.getItem("dragon-theme") as ThemeName | null;
    const initial: ThemeName =
      qTheme && THEMES.includes(qTheme)
        ? qTheme
        : lsTheme && THEMES.includes(lsTheme)
          ? lsTheme
          : "blueprint";
    setTheme(initial);
    document.documentElement.setAttribute("data-cdl-theme", initial);
  }, []);

  const update = (v: ThemeName): void => {
    setTheme(v);
    document.documentElement.setAttribute("data-cdl-theme", v);
    try {
      localStorage.setItem("dragon-theme", v);
    } catch {
      // ignore
    }
    const url = new URL(window.location.href);
    if (v === "blueprint") {
      url.searchParams.delete("theme");
    } else {
      url.searchParams.set("theme", v);
    }
    window.history.replaceState({}, "", url.toString());
  };

  return [theme, update];
}
