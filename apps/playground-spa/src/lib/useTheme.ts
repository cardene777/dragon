import { useEffect, useState } from "react";
import { THEMES, type ThemeName } from "./theme";

/**
 * html[data-cdl-theme] を制御する hook。
 * URL query `?theme=<name>` > localStorage > default (neumorphism) の順で reconcile。
 */
export function useTheme(): [ThemeName, (v: ThemeName) => void] {
  const [theme, setTheme] = useState<ThemeName>("neumorphism");

  useEffect(() => {
    const url = new URL(window.location.href);
    const qTheme = url.searchParams.get("theme") as ThemeName | null;
    const lsTheme = localStorage.getItem("dragon-theme") as ThemeName | null;
    const initial: ThemeName =
      qTheme && THEMES.includes(qTheme)
        ? qTheme
        : lsTheme && THEMES.includes(lsTheme)
          ? lsTheme
          : "neumorphism";
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
    if (v === "neumorphism") {
      url.searchParams.delete("theme");
    } else {
      url.searchParams.set("theme", v);
    }
    window.history.replaceState({}, "", url.toString());
  };

  return [theme, update];
}
