import { useMemo, useState } from "react";
import { Link, useParams } from "react-router";
import { CdlDiagramView } from "@cardenelabs/cdl";
import * as Dialog from "@radix-ui/react-dialog";
import { Maximize2, Search, X } from "lucide-react";
import { CATEGORIES } from "@/lib/catalog";
import { CATALOG_ITEMS, type CatalogItem } from "@/lib/catalog-items";
import { SiteHeader } from "@/components/SiteHeader";
import { InViewMount } from "@/components/InViewMount";

/**
 * /catalog/:slug — React docs / Storybook 風 2 pane 構成の再設計版。
 * left = 検索 + item list (sidebar)、 right = 選択 item preview + 詳細。
 * 拡大 button = card / preview 右上絶対配置、 modal = SVG max 80vh center fit。
 * UI 全日本語化 (breadcrumb / stat / button / label)。
 */

/** category slug から日本語 label に変換 (SSOT) */
const CATEGORY_JA_LABEL: Record<string, string> = {
  presets: "プリセット",
  cookbook: "レシピ集",
  patterns: "パターン",
  primitives: "基本要素",
  "text-dsl": "テキスト DSL",
  animation: "アニメーション",
  styles: "スタイル",
};

export function CategoryPage(): React.ReactElement {
  const params = useParams<{ slug: string }>();
  const [modalItem, setModalItem] = useState<CatalogItem | null>(null);
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const category = CATEGORIES.find((c) => c.slug === params.slug);
  const items = params.slug ? CATALOG_ITEMS[params.slug] ?? [] : [];

  const filtered = useMemo(() => {
    if (!query.trim()) return items;
    const q = query.toLowerCase();
    return items.filter(
      (item) =>
        item.title.toLowerCase().includes(q) ||
        item.subtitle.toLowerCase().includes(q) ||
        item.id.toLowerCase().includes(q),
    );
  }, [items, query]);

  const currentItem = useMemo(() => {
    if (selectedId) return items.find((i) => i.id === selectedId) ?? filtered[0] ?? null;
    return filtered[0] ?? null;
  }, [filtered, items, selectedId]);

  if (!category) {
    return (
      <div>
        <SiteHeader />
        <div className="flex min-h-[calc(100vh-80px)] items-center justify-center">
          <p className="text-[15px] text-[var(--v4-ink-dim,#5a6270)]">カテゴリが見つかりません</p>
        </div>
      </div>
    );
  }

  const jaLabel = CATEGORY_JA_LABEL[category.slug] ?? category.label;

  return (
    <div>
      <SiteHeader />
      <div className="catalog-page">
        {/* breadcrumb + hero (簡潔) */}
        <div className="catalog-hero">
          <nav aria-label="パンくずリスト" className="catalog-crumb">
            <Link to="/">概要</Link>
            <span aria-hidden="true">/</span>
            <Link to="/catalog">カタログ</Link>
            <span aria-hidden="true">/</span>
            <span className="cur">{jaLabel}</span>
          </nav>
          <h1 className="catalog-title">{jaLabel}</h1>
          <p className="catalog-desc">{category.desc}</p>
          <div className="catalog-meta">
            <span className="catalog-count">全 {items.length} 件</span>
            {filtered.length !== items.length && (
              <span className="catalog-count catalog-count-filter">
                {filtered.length} 件 表示中
              </span>
            )}
          </div>
        </div>

        {/* 2 pane = sidebar (list) + preview */}
        <div className="catalog-body">
          <aside className="catalog-sidebar" aria-label="項目一覧">
            <div className="catalog-search-wrap">
              <Search size={14} className="catalog-search-icon" />
              <input
                type="text"
                className="catalog-search"
                placeholder="検索 (名前 / 説明 / ID)"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                aria-label="項目を検索"
              />
              {query && (
                <button
                  type="button"
                  className="catalog-search-clear"
                  onClick={() => setQuery("")}
                  aria-label="検索をクリア"
                >
                  <X size={12} />
                </button>
              )}
            </div>
            <div className="catalog-list" role="list">
              {filtered.length === 0 ? (
                <div className="catalog-list-empty">該当する項目がありません</div>
              ) : (
                filtered.map((item) => {
                  const isSelected = currentItem?.id === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setSelectedId(item.id)}
                      className={`catalog-list-item${isSelected ? " selected" : ""}`}
                      role="listitem"
                      aria-current={isSelected ? "true" : undefined}
                    >
                      <div className="catalog-list-item-name">{item.title}</div>
                      <div className="catalog-list-item-id">{item.id}</div>
                    </button>
                  );
                })
              )}
            </div>
          </aside>

          <main className="catalog-preview" aria-label="プレビュー">
            {currentItem ? (
              <article className="catalog-preview-card">
                <header className="catalog-preview-head">
                  <div>
                    <div className="catalog-preview-id">{currentItem.id}</div>
                    <h2 className="catalog-preview-title">{currentItem.title}</h2>
                    {currentItem.subtitle && (
                      <p className="catalog-preview-sub">{currentItem.subtitle}</p>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => setModalItem(currentItem)}
                    aria-label={`${currentItem.title} を拡大表示`}
                    className="catalog-expand-btn"
                  >
                    <Maximize2 size={14} />
                    <span>拡大</span>
                  </button>
                </header>
                <div className="catalog-preview-stage">
                  <InViewMount
                    className="catalog-preview-stage-inner"
                    placeholder={
                      <div className="catalog-preview-loading">読み込み中…</div>
                    }
                  >
                    <CdlDiagramView diagram={currentItem.diagram as never} hideHeader />
                  </InViewMount>
                </div>
                <footer className="catalog-preview-foot">
                  <Link
                    to={`/editor#preset=${currentItem.id}`}
                    className="catalog-preview-link"
                  >
                    エディタで開く →
                  </Link>
                </footer>
              </article>
            ) : (
              <div className="catalog-preview-empty">項目を選択してください</div>
            )}
          </main>
        </div>
      </div>

      {/* 拡大 modal = SVG max 80vh center fit */}
      <Dialog.Root open={modalItem !== null} onOpenChange={(open) => !open && setModalItem(null)}>
        <Dialog.Portal>
          <Dialog.Overlay className="cdl-modal-overlay" />
          <Dialog.Content className="cdl-modal-content">
            <div className="cdl-modal-header">
              <div>
                <div className="cdl-modal-id">{modalItem?.id}</div>
                <Dialog.Title className="cdl-modal-title">{modalItem?.title}</Dialog.Title>
                {modalItem?.subtitle && (
                  <Dialog.Description className="cdl-modal-desc">
                    {modalItem.subtitle}
                  </Dialog.Description>
                )}
              </div>
              <Dialog.Close asChild>
                <button type="button" aria-label="閉じる" className="cdl-modal-close">
                  <X size={20} />
                </button>
              </Dialog.Close>
            </div>
            <div className="cdl-modal-body">
              {modalItem && <CdlDiagramView diagram={modalItem.diagram as never} hideHeader />}
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}
