import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router";

/**
 * 全 page 共通の header (Neumorphism 撤回後版 = v4 design cream + teal + serif 準拠)。
 * dragon brand mark + nav links + dark/light toggle button + share + open editor CTA。
 * light default (v4-theme=light or 未設定) → cream 背景 + navy ink、
 * dark toggle → navy 背景 + light ink cascade で切替。
 * v4-nav-* CSS class SSOT = src/styles/header.css。
 */
const LINKS: Array<{ to: string; label: string }> = [
  { to: "/", label: "概要" },
  { to: "/editor", label: "エディタ" },
  { to: "/catalog", label: "カタログ" },
  { to: "/compare", label: "テーマ比較" },
  { to: "/docs", label: "ドキュメント" },
];

const REPO_URL = "https://github.com/cardene777/dragon";

export function SiteHeader(): React.ReactElement {
  const location = useLocation();
  const pathname = location.pathname;
  const [isDark, setIsDark] = useState<boolean>(false);

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
    } catch {}
  }, []);

  const toggleTheme = (): void => {
    const cur = document.documentElement.classList.contains("dark") ? "dark" : "light";
    const next = cur === "dark" ? "light" : "dark";
    if (next === "dark") document.documentElement.classList.add("dark");
    else document.documentElement.classList.remove("dark");
    try {
      localStorage.setItem("v4-theme", next);
    } catch {}
    setIsDark(next === "dark");
  };

  const onShare = async (): Promise<void> => {
    try {
      await navigator.clipboard.writeText(window.location.href);
    } catch {}
  };

  return (
    <header className="v4-nav">
      <Link to="/" className="v4-nav-brand">
        <div className="v4-nav-mark">
          <svg viewBox="0 0 28 28" fill="none">
            <path d="M4 24 L24 4 L24 24 Z" fill="#1a1f2a" />
            <path d="M4 24 L14 14 L24 24 Z" fill="#2d6a8f" opacity="0.85" />
          </svg>
        </div>
        <div>
          <span className="v4-nav-name">dragon</span>
          <span className="v4-nav-sub">— animated diagram dsl</span>
        </div>
      </Link>
      <nav className="v4-nav-links" aria-label="Main navigation">
        {LINKS.map((link) => {
          const active =
            link.to === "/"
              ? pathname === "/" && link.label === "概要"
              : pathname === link.to || pathname.startsWith(link.to + "/");
          return (
            <Link
              key={link.label}
              to={link.to}
              aria-current={active ? "page" : undefined}
              className={`v4-nav-link${active ? " active" : ""}`}
            >
              {link.label}
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
        className="v4-nav-theme-toggle"
        onClick={toggleTheme}
        aria-label={isDark ? "light mode に切替" : "dark mode に切替"}
        title={isDark ? "light mode に切替" : "dark mode に切替"}
      >
        <span className="v4-theme-icon">{isDark ? "☾" : "☀"}</span>
      </button>
      <button
        type="button"
        className="v4-nav-share-btn"
        onClick={onShare}
        aria-label="共有"
        title="この page を共有"
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
        エディタを開く →
      </Link>
    </header>
  );
}
