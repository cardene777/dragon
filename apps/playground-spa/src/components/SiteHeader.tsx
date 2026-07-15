import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router";
import { useLocale } from "@/lib/useLocale";

/**
 * 全 page 共通の header (v4 design、 dark/light toggle + JA/EN toggle 両方対応)。
 * v4-nav-* CSS class SSOT = src/styles/header.css。
 */
const LINKS: Array<{ to: string; ja: string; en: string }> = [
  { to: "/", ja: "Home", en: "home" },
  { to: "/editor", ja: "エディタ", en: "editor" },
  { to: "/catalog", ja: "カタログ", en: "catalog" },
  { to: "/docs", ja: "ドキュメント", en: "docs" },
];

const REPO_URL = "https://github.com/cardene777/dragon";

export function SiteHeader(): React.ReactElement {
  const location = useLocation();
  const pathname = location.pathname;
  const [isDark, setIsDark] = useState<boolean>(false);
  const [locale, setLocale] = useLocale();

  useEffect(() => {
    try {
      const t = localStorage.getItem("v4-theme");
      const prefersDark =
        !t &&
        typeof window !== "undefined" &&
        window.matchMedia("(prefers-color-scheme: dark)").matches;
      const dark = t === "dark" || prefersDark;
      if (dark) document.documentElement.classList.add("dark");
      setIsDark(dark);
    } catch {
      // localStorage / matchMedia 非対応環境では default 値を維持
    }
  }, []);

  const toggleTheme = (): void => {
    const cur = document.documentElement.classList.contains("dark") ? "dark" : "light";
    const next = cur === "dark" ? "light" : "dark";
    if (next === "dark") document.documentElement.classList.add("dark");
    else document.documentElement.classList.remove("dark");
    try {
      localStorage.setItem("v4-theme", next);
    } catch {
      // localStorage / matchMedia 非対応環境では default 値を維持
    }
    setIsDark(next === "dark");
  };

  const toggleLocale = (): void => {
    setLocale(locale === "ja" ? "en" : "ja");
  };

  const onShare = async (): Promise<void> => {
    try {
      await navigator.clipboard.writeText(window.location.href);
    } catch {
      // localStorage / matchMedia 非対応環境では default 値を維持
    }
  };

  const openEditorLabel = locale === "ja" ? "エディタを開く →" : "open editor →";
  const shareLabel = locale === "ja" ? "この page を共有" : "Share this page";
  const themeLabel =
    locale === "ja"
      ? isDark
        ? "light mode に切替"
        : "dark mode に切替"
      : isDark
        ? "Switch to light mode"
        : "Switch to dark mode";
  const langLabel = locale === "ja" ? "Switch to English" : "日本語に切替";

  return (
    <header className="v4-nav">
      <Link to="/" className="v4-nav-brand">
        <div className="v4-nav-mark">
          <svg viewBox="0 0 28 28" fill="none">
            <path d="M4 24 L24 4 L24 24 Z" fill="var(--v4-brand-deep, #8a5a2a)" />
            <path d="M4 24 L14 14 L24 24 Z" fill="var(--v4-brand-glow, #b8862a)" opacity="0.85" />
          </svg>
        </div>
        <div>
          <span className="v4-nav-name">dragon</span>
          <span className="v4-nav-sub">— animated diagram dsl</span>
        </div>
      </Link>
      <nav className="v4-nav-links" aria-label={locale === "ja" ? "メインナビゲーション" : "Main navigation"}>
        {LINKS.map((link) => {
          const active =
            link.to === "/"
              ? pathname === "/"
              : pathname === link.to || pathname.startsWith(link.to + "/");
          const label = locale === "ja" ? link.ja : link.en;
          return (
            <Link
              key={link.to}
              to={link.to}
              aria-current={active ? "page" : undefined}
              className={`v4-nav-link${active ? " active" : ""}`}
            >
              {label}
            </Link>
          );
        })}
        <a
          className="v4-nav-link"
          href={REPO_URL}
          target="_blank"
          rel="noopener noreferrer"
        >
          GitHub ↗
        </a>
      </nav>
      <button
        type="button"
        className="v4-nav-lang-toggle"
        onClick={toggleLocale}
        aria-label={langLabel}
        title={langLabel}
      >
        <span className="v4-lang-current">{locale === "ja" ? "JA" : "EN"}</span>
      </button>
      <button
        type="button"
        className="v4-nav-theme-toggle"
        onClick={toggleTheme}
        aria-label={themeLabel}
        title={themeLabel}
      >
        <span className="v4-theme-icon">{isDark ? "☾" : "☀"}</span>
      </button>
      <button
        type="button"
        className="v4-nav-share-btn"
        onClick={() => {
          void onShare();
        }}
        aria-label={shareLabel}
        title={shareLabel}
      >
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="18" cy="5" r="3" />
          <circle cx="6" cy="12" r="3" />
          <circle cx="18" cy="19" r="3" />
          <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
          <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
        </svg>
      </button>
      <Link className="v4-nav-cta" to="/editor">
        {openEditorLabel}
      </Link>
    </header>
  );
}
