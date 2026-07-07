import { Link, useLocation } from "react-router";
import { ThemePicker } from "@/components/ThemePicker";
import { useTheme } from "@/lib/useTheme";

/**
 * 全 page 共通の header (旧 Astro Header.astro 相当)。
 * dragon brand mark + nav links (overview / editor / catalog / compare / docs / github) + theme picker。
 */
const LINKS: Array<{ to: string; label: string }> = [
  { to: "/", label: "overview" },
  { to: "/editor", label: "editor" },
  { to: "/catalog", label: "catalog" },
  { to: "/compare", label: "compare" },
  { to: "/docs", label: "docs" },
];

export function SiteHeader(): React.ReactElement {
  const location = useLocation();
  const [theme, setTheme] = useTheme();
  const pathname = location.pathname;

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
          href="https://github.com/cardene777/dragon"
          target="_blank"
          rel="noopener noreferrer"
        >
          github ↗
        </a>
      </nav>
      <div className="v4-nav-search" />
      <div style={{ marginLeft: "auto" }}>
        <ThemePicker value={theme} onChange={setTheme} />
      </div>
    </header>
  );
}
