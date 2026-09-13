import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router";
import { Link2, Moon, Sun } from "lucide-react";
import { useLocale } from "@/lib/useLocale";
import { useToast } from "@/components/Toast";

/**
 * 全 page 共通の header。 見た目の SSOT = docs/design/app.pen の C / TopBar、
 * class の中身は src/styles/header.css。
 * 明暗は html 要素の dark class 1 本で切替わり、 その値は localStorage に残る。
 */
const LINKS: Array<{ to: string; ja: string; en: string }> = [
  { to: "/", ja: "概要", en: "home" },
  { to: "/catalog", ja: "見本帳", en: "catalog" },
  { to: "/editor", ja: "編集画面", en: "editor" },
  { to: "/docs", ja: "使い方", en: "docs" },
  { to: "/release-notes", ja: "更新履歴", en: "releases" },
];

const REPO_URL = "https://github.com/cardene777/dragon";

export function SiteHeader(): React.ReactElement {
  const location = useLocation();
  const pathname = location.pathname;
  const [isDark, setIsDark] = useState<boolean>(false);
  const [locale, setLocale] = useLocale();
  const { toast } = useToast();

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

  // 写した結果を必ず画面に出す (#1082)。 写すだけだと、 押した人には成功も失敗も見えず
  // 「押しても何も起きない壊れたボタン」 になる。 失敗も黙って捨てない = 写せなかったことが
  // 分かれば URL を選んで自分で写す道に切り替えられる
  const onShare = async (): Promise<void> => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      toast({
        type: "success",
        title: locale === "ja" ? "URL をコピーしました" : "Copied the URL",
        description: window.location.pathname,
      });
    } catch {
      toast({
        type: "error",
        title: locale === "ja" ? "コピーできませんでした" : "Could not copy the URL",
        description:
          locale === "ja"
            ? "この画面では写し取れない"
            : "This page cannot reach the clipboard",
      });
    }
  };

  const openEditorLabel = locale === "ja" ? "編集画面を開く →" : "open editor →";
  const shareLabel = locale === "ja" ? "この画面を共有" : "Share this page";
  const themeLabel =
    locale === "ja"
      ? isDark
        ? "明るい配色に切り替える"
        : "暗い配色に切り替える"
      : isDark
        ? "Switch to light mode"
        : "Switch to dark mode";
  const langLabel = locale === "ja" ? "Switch to English" : "日本語に切替";

  return (
    <header className="v4-nav">
      <Link to="/" className="v4-nav-brand">
        <div className="v4-nav-mark">
          <svg viewBox="0 0 22 16" aria-hidden="true">
            <path d="M2 15l9-14 9 14-9-4.5z" />
          </svg>
        </div>
        <div>
          <span className="v4-nav-name">dragon</span>
          <span className="v4-nav-sub">— animated diagram dsl</span>
        </div>
      </Link>
      <nav className="v4-nav-links" aria-label={locale === "ja" ? "行き先" : "Main navigation"}>
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
      <div className="v4-nav-actions">
        <button
          type="button"
          className="v4-nav-lang-toggle"
          onClick={toggleLocale}
          aria-label={langLabel}
          title={langLabel}
        >
          <span className={`v4-nav-lang-seg${locale === "ja" ? " is-on" : ""}`}>JA</span>
          <span className={`v4-nav-lang-seg${locale === "en" ? " is-on" : ""}`}>EN</span>
        </button>
        <button
          type="button"
          className="v4-nav-icon-btn v4-nav-theme-toggle"
          onClick={toggleTheme}
          aria-label={themeLabel}
          title={themeLabel}
        >
          {isDark ? <Moon size={15} /> : <Sun size={15} />}
        </button>
        <button
          type="button"
          className="v4-nav-icon-btn v4-nav-share-btn"
          onClick={() => {
            void onShare();
          }}
          aria-label={shareLabel}
          title={shareLabel}
        >
          <Link2 size={15} />
        </button>
        <Link className="v4-nav-cta" to="/editor">
          {openEditorLabel}
        </Link>
      </div>
    </header>
  );
}
