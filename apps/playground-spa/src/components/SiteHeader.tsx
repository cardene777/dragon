import { useEffect, useState, useSyncExternalStore } from "react";
import { Link, useLocation } from "react-router";
import { Menu, Moon, Sun, X } from "lucide-react";
import { useLocale } from "@/lib/useLocale";
import { 画面の名前を引く } from "@/lib/site-destinations";

/**
 * 帯に出す行き先と、その並び。 名前は `site-destinations.ts` の表から引く (#2451)。
 *
 * 名前をここにも書くと、道筋と帯で同じ画面が別の名前になる。
 * 並びはここが持つ = 表に在る行き先が全部帯に出る訳ではない (参加方法は帯に出さない)。
 */
const 帯に出す行き先 = ["/", "/catalog", "/editor", "/docs", "/release-notes"] as const;

const LINKS: Array<{ to: string; ja: string; en: string }> = 帯に出す行き先.map((to) => ({
  to,
  ja: 画面の名前を引く(to, "ja"),
  en: 画面の名前を引く(to, "en"),
}));

const REPO_URL = "https://github.com/cardene777/dragon";

/** 折りたたみに切り替わる幅。 `header.css` の `max-width: 720px` と揃える。 */
const 折りたたむ幅 = 720;

const 広い幅の条件 = `(min-width: ${折りたたむ幅 + 1}px)`;

/**
 * 画面が広いかを外の仕組みから読む (#2539)。
 *
 * 幅を state に写して効果で同期すると、幅が変わった瞬間と描き直しの間に古い値が出る。
 * `useSyncExternalStore` なら React が描くたびに今の値を読むので、写す必要が無い。
 */
function 幅を見張る(通知: () => void): () => void {
  const 監視 = window.matchMedia(広い幅の条件);
  監視.addEventListener("change", 通知);
  return () => 監視.removeEventListener("change", 通知);
}

const 今広いか = (): boolean => window.matchMedia(広い幅の条件).matches;

// 画面が無い所で描く時は「広い」 = 折りたたみを閉じた側に倒す
const 描き出しは広い = (): boolean => true;

/**
 * 描き始める時の配色が暗いか (#2018)。 保存した配色を先に見て、無ければ端末の設定に従う。
 *
 * `useState` の初期値として最初の描画で読む。 header は頁ごとに作り直されるので、描いた後の
 * 効果で読むと、暗い配色の人は頁を移るたびに切替ボタンの印と読み上げの文言が 1 回逆になる。
 */
function 描き始めは暗いか(): boolean {
  try {
    const t = localStorage.getItem("v4-theme");
    const prefersDark =
      !t &&
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-color-scheme: dark)").matches;
    return t === "dark" || prefersDark;
  } catch {
    // localStorage / matchMedia 非対応環境では明るい配色を使う
    return false;
  }
}

/**
 * 全 page 共通の header。 見た目の SSOT = docs/design/app.pen の C / TopBar、
 * class の中身は src/styles/header.css。
 * 明暗は html 要素の dark class 1 本で切替わり、 その値は localStorage に残る。
 *
 * ## 狭い幅では行き先を折りたたむ (#2539)
 *
 * 帯は幅が足りない時に外側から順に落とす作りで、720px 以下で行き先の列ごと消えていた。
 * **代わりを置いていなかった** ため、携帯で開いた人はどこへも移れなかった
 * (幅 390px で数えると、行き先 6 件と「編集画面を開く」 の 7 つが全て見えない)。
 *
 * 落とす側の規則はそのままにして、開く仕掛けだけを足す = 広い画面の帯は 1 画素も変えない。
 */
export function SiteHeader(): React.ReactElement {
  const location = useLocation();
  const pathname = location.pathname;
  const [isDark, setIsDark] = useState<boolean>(描き始めは暗いか);
  const [locale, setLocale] = useLocale();
  /*
   * 開いているかを直に持たず、**どの画面で開いたか** を持つ (#2539)。
   *
   * 直に持つと、画面を移った時と幅が戻った時にそれぞれ効果で閉じることになり、
   * 描いた直後に state を書き換える形 (`react-hooks/set-state-in-effect`) になる。
   * 開いた時の道筋を持てば、今の道筋と違う = 閉じている、が計算で出る。
   */
  const [開いた道, set開いた道] = useState<string | null>(null);
  const 広いか = useSyncExternalStore(幅を見張る, 今広いか, 描き出しは広い);
  const 開いている = 開いた道 === pathname && !広いか;

  // `dark` class は足すだけで外さない。 外すのは切替ボタンだけ = 保存が読めない環境で暗くした後に
  // 頁を移っても、読み直した「明るい」 で上書きしない
  useEffect(() => {
    if (isDark) document.documentElement.classList.add("dark");
  }, [isDark]);

  // 逃げ道を 1 つ残す。 面の外を押す形だけだと、画面を読み上げて操作する人が閉じられない
  useEffect(() => {
    if (!開いている) return;
    const 押した = (e: KeyboardEvent): void => {
      if (e.key === "Escape") set開いた道(null);
    };
    document.addEventListener("keydown", 押した);
    return () => document.removeEventListener("keydown", 押した);
  }, [開いている]);

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

  const openEditorLabel = locale === "ja" ? "編集画面を開く →" : "open editor →";
  const themeLabel =
    locale === "ja"
      ? isDark
        ? "明るい配色に切り替える"
        : "暗い配色に切り替える"
      : isDark
        ? "Switch to light mode"
        : "Switch to dark mode";
  const langLabel = locale === "ja" ? "Switch to English" : "日本語に切替";
  const menuLabel = 開いている
    ? locale === "ja"
      ? "行き先を閉じる"
      : "Close navigation"
    : locale === "ja"
      ? "行き先を開く"
      : "Open navigation";

  const 行き先の印 = (to: string): boolean =>
    to === "/" ? pathname === "/" : pathname === to || pathname.startsWith(to + "/");

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
          const active = 行き先の印(link.to);
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
          className="v4-nav-icon-btn v4-nav-menu-btn"
          onClick={() => set開いた道((今) => (今 === pathname ? null : pathname))}
          aria-label={menuLabel}
          title={menuLabel}
          aria-expanded={開いている}
          aria-controls="v4-nav-sheet"
        >
          {開いている ? <X size={15} /> : <Menu size={15} />}
        </button>
        <Link className="v4-nav-cta" to="/editor">
          {openEditorLabel}
        </Link>
      </div>
      {開いている ? (
        <>
          {/* 面の外を押しても閉じる。 読み上げの対象にはしない (逃げ道は Escape と閉じるボタン) */}
          <div
            className="v4-nav-scrim"
            onClick={() => set開いた道(null)}
            aria-hidden="true"
          />
          <nav
            id="v4-nav-sheet"
            className="v4-nav-sheet"
            aria-label={locale === "ja" ? "行き先" : "Main navigation"}
          >
            {LINKS.map((link) => {
              const active = 行き先の印(link.to);
              return (
                <Link
                  key={link.to}
                  to={link.to}
                  aria-current={active ? "page" : undefined}
                  className={`v4-nav-sheet-link${active ? " active" : ""}`}
                  onClick={() => set開いた道(null)}
                >
                  {locale === "ja" ? link.ja : link.en}
                </Link>
              );
            })}
            <a
              className="v4-nav-sheet-link"
              href={REPO_URL}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => set開いた道(null)}
            >
              GitHub ↗
            </a>
            <Link
              className="v4-nav-sheet-cta"
              to="/editor"
              onClick={() => set開いた道(null)}
            >
              {openEditorLabel}
            </Link>
          </nav>
        </>
      ) : null}
    </header>
  );
}
