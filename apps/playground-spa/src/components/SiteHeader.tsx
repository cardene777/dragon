import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router";

/**
 * 全 page 共通の header (旧 Astro Header.astro 忠実再現)。
 * dragon brand mark + nav links + theme toggle button (light/dark) + share + open editor CTA。
 * v4-nav-* CSS class SSOT = src/styles/header.css。
 */
const LINKS: Array<{ to: string; label: string }> = [
  { to: "/", label: "overview" },
  { to: "/editor", label: "editor" },
  { to: "/catalog", label: "catalog" },
  { to: "/compare", label: "compare" },
  { to: "/docs", label: "docs" },
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
              ? pathname === "/" && link.label === "overview"
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
          github ↗
        </a>
      </nav>
      <button
        type="button"
        className="v4-nav-theme-toggle"
        onClick={toggleTheme}
        aria-label="dark/light 切替"
        title="dark/light 切替"
      >
        <span className="v4-theme-icon-light">{isDark ? "☾" : "☀"}</span>
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
        open editor →
      </Link>
    </header>
  );
}
