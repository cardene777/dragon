import { useEffect, useRef, useState } from "react";

/**
 * Pagefind 統合検索 UI
 *
 * 設計。
 *   - build 後 `/_pagefind/pagefind.js` を dynamic import (dev では 404 → no-op)
 *   - Cmd/Ctrl + K で overlay open + input focus、 `Escape` で close
 *   - keyword 入力で debounce 150ms → `pagefind.search()` → 上位 10 件表示
 *   - 各 hit は `title` / `excerpt` (highlight 済 HTML) / `URL` の 3 column
 *   - キーボード操作 (↑↓ で hit 移動、 Enter で遷移) と クリック の両対応
 *
 * 既存 DocsLayout.astro の カスタム input (#docs-search-input) は legacy 維持、
 * 当面は header 内に Pagefind UI ボタンとして並置する (CSS class は docs-site.css 既存)。
 */
type PagefindResult = {
  url: string;
  excerpt: string;
  meta?: Record<string, string>;
};

type PagefindModule = {
  search: (query: string) => Promise<{
    results: Array<{ data: () => Promise<PagefindResult> }>;
  }>;
};

export function SearchBar() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<PagefindResult[]>([]);
  const [activeIdx, setActiveIdx] = useState(-1);
  const [pagefind, setPagefind] = useState<PagefindModule | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const isEn = typeof document !== "undefined" &&
    document.documentElement.getAttribute("lang") === "en";

  // dynamic import pagefind.js (build 後 のみ存在、 dev は no-op)
  useEffect(() => {
    if (typeof window === "undefined") return;
    let cancelled = false;
    const url = "/_pagefind/pagefind.js";
    // vite-ignore で bundle 対象外、 runtime fetch 経由
    import(/* @vite-ignore */ url)
      .then((mod) => {
        if (cancelled) return;
        const lib = (mod.default ?? mod) as PagefindModule;
        setPagefind(lib);
      })
      .catch((e) => {
        if (cancelled) return;
        setLoadError(e instanceof Error ? e.message : "load failed");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // keyboard shortcut: Cmd/Ctrl+K open, Escape close
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen(true);
        setTimeout(() => inputRef.current?.focus(), 50);
      } else if (e.key === "Escape" && open) {
        setOpen(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  // debounce search
  useEffect(() => {
    if (!query.trim() || !pagefind) {
      // query / pagefind 変化に derived state (results / activeIdx) を同期する legitimate
      // pattern。 空 query 時の即時 reset で cascading render なし。
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setResults([]);
      setActiveIdx(-1);
      return;
    }
    const handle = window.setTimeout(() => {
      void (async () => {
      try {
        const search = await pagefind.search(query);
        const hits = await Promise.all(
          search.results.slice(0, 10).map((r) => r.data()),
        );
        setResults(hits);
        setActiveIdx(-1);
      } catch {
        setResults([]);
      }
      })();
    }, 150);
    return () => window.clearTimeout(handle);
  }, [query, pagefind]);

  // keyboard navigation inside overlay
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (results.length === 0) return;
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setActiveIdx((i) => Math.min(results.length - 1, i + 1));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setActiveIdx((i) => Math.max(-1, i - 1));
      } else if (e.key === "Enter") {
        if (activeIdx >= 0 && results[activeIdx]) {
          e.preventDefault();
          window.location.href = results[activeIdx].url;
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, results, activeIdx]);

  if (!open) {
    return (
      <button
        type="button"
        className="docs-pagefind-trigger"
        onClick={() => {
          setOpen(true);
          setTimeout(() => inputRef.current?.focus(), 50);
        }}
        aria-label={isEn ? "Open search" : "検索を開く"}
        title={isEn ? "Search (Cmd+K)" : "検索 (Cmd+K)"}
      >
        <span aria-hidden="true">🔍</span>
        <span className="docs-pagefind-trigger-label">
          {isEn ? "Search" : "検索"}
        </span>
        <kbd className="docs-pagefind-kbd">⌘K</kbd>
      </button>
    );
  }

  return (
    <div
      className="docs-pagefind-overlay"
      role="dialog"
      aria-modal="true"
      aria-label={isEn ? "Search" : "検索"}
      onClick={(e) => {
        if (e.target === e.currentTarget) setOpen(false);
      }}
    >
      <div className="docs-pagefind-panel">
        <div className="docs-pagefind-header">
          <input
            ref={inputRef}
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={isEn ? "Search docs..." : "docs を検索..."}
            className="docs-pagefind-input"
            aria-label={isEn ? "Search keyword" : "検索キーワード"}
            autoComplete="off"
          />
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="docs-pagefind-close"
            aria-label={isEn ? "Close" : "閉じる"}
          >
            ×
          </button>
        </div>

        <div className="docs-pagefind-body">
          {loadError && !pagefind && (
            <div className="docs-pagefind-empty">
              {isEn
                ? `Search index not built yet (run "pnpm build" first): ${loadError}`
                : `検索 index が未生成 (まず "pnpm build" を実行): ${loadError}`}
            </div>
          )}
          {!loadError && !pagefind && (
            <div className="docs-pagefind-empty">
              {isEn ? "Loading search index..." : "検索 index を読込中..."}
            </div>
          )}
          {pagefind && query.trim() && results.length === 0 && (
            <div className="docs-pagefind-empty">
              {isEn ? "No matching pages" : "該当ページなし"}
            </div>
          )}
          {pagefind && !query.trim() && (
            <div className="docs-pagefind-hint">
              {isEn
                ? "Type to search. Use ↑↓ to navigate, Enter to open."
                : "キーワード入力で検索。 ↑↓ で移動、 Enter で開く。"}
            </div>
          )}
          <ul className="docs-pagefind-list" role="listbox">
            {results.map((r, i) => (
              <li
                key={`${r.url}-${i}`}
                className={`docs-pagefind-hit ${i === activeIdx ? "active" : ""}`}
                role="option"
                aria-selected={i === activeIdx}
              >
                <a href={r.url} className="docs-pagefind-hit-link">
                  <div className="docs-pagefind-hit-title">
                    {r.meta?.title ?? r.url}
                  </div>
                  <div
                    className="docs-pagefind-hit-excerpt"
                    // pagefind が <mark> highlight 済 HTML を返す
                    dangerouslySetInnerHTML={{ __html: r.excerpt }}
                  />
                  <div className="docs-pagefind-hit-url">{r.url}</div>
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
