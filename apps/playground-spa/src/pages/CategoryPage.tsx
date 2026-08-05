import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router";
import { CdlDiagramView } from "@cardenelabs/cdl";
import * as Dialog from "@radix-ui/react-dialog";
import { Check, Copy, Maximize2, Search, X } from "lucide-react";
import { CATEGORIES } from "@/lib/catalog";
import { CATALOG_ITEMS, loadPartsItems, type CatalogItem } from "@/lib/catalog-items";
import { CATALOG_HANDLERS } from "@/lib/catalog-handlers";
import { itemName, itemNameEn, itemNameJa } from "@/lib/i18n";
import { useLocale } from "@/lib/useLocale";
import { SiteHeader } from "@/components/SiteHeader";
import { InViewMount } from "@/components/InViewMount";

/** source 記法 tab (人向け YAML / LLM 向け JSON、 dragon package 2 記法の dogfood 表示) */
type SourceTab = "yaml" | "json";

/** copy-to-clipboard button (2 秒間 チェック表示) */
function CopyButton({ text }: { text: string }): React.ReactElement {
  const [copied, setCopied] = useState(false);
  const doCopy = async (): Promise<void> => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // silent fail (browser permission 拒否等、 clipboard API 不可時)
    }
  };
  return (
    <button
      type="button"
      onClick={() => {
        void doCopy();
      }}
      aria-label={copied ? "コピー完了" : "コードをコピー"}
      className="catalog-source-copy"
    >
      {copied ? <Check size={14} /> : <Copy size={14} />}
      <span>{copied ? "コピーしました" : "コピー"}</span>
    </button>
  );
}

/** source 記法 tab section (YAML / JSON 切替、 source なしの場合は表示しない) */
function SourceTabs({ item }: { item: CatalogItem }): React.ReactElement | null {
  const [tab, setTab] = useState<SourceTab>("yaml");
  if (!item.sourceYaml && !item.sourceJson) return null;
  const activeSource = tab === "yaml" ? item.sourceYaml : item.sourceJson;
  return (
    <section className="catalog-source-section" aria-label="この diagram の記法">
      <div className="catalog-source-tabs" role="tablist">
        <button
          role="tab"
          type="button"
          aria-selected={tab === "yaml"}
          className={`catalog-source-tab ${tab === "yaml" ? "is-active" : ""}`}
          onClick={() => setTab("yaml")}
          disabled={!item.sourceYaml}
        >
          YAML (人向け)
        </button>
        <button
          role="tab"
          type="button"
          aria-selected={tab === "json"}
          className={`catalog-source-tab ${tab === "json" ? "is-active" : ""}`}
          onClick={() => setTab("json")}
          disabled={!item.sourceJson}
        >
          JSON (LLM 向け)
        </button>
        {activeSource && <CopyButton text={activeSource} />}
      </div>
      <pre className="catalog-source-code" data-lang={tab}>
        <code>{activeSource ?? "(この記法の source は未登録です)"}</code>
      </pre>
    </section>
  );
}

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
  parts: "パーツ",
  styles: "スタイル",
  interactive: "インタラクティブ",
};

export function CategoryPage(): React.ReactElement {
  const params = useParams<{ slug: string }>();
  const [locale] = useLocale();
  const [modalItem, setModalItem] = useState<CatalogItem | null>(null);
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const displayName = (item: CatalogItem): string => itemName(item.title, locale);

  const category = CATEGORIES.find((c) => c.slug === params.slug);
  // parts は CATALOG_ITEMS で empty placeholder、 useEffect で dynamic import 経由 populate (CAR-1613)
  // loadState = idle / loading / loaded / error の 4 状態、 chunk fetch 失敗を可視化する
  const [partsItems, setPartsItems] = useState<CatalogItem[]>([]);
  // lazy initializer で初回 render から "loading" にして empty state flash (1 frame) を排除
  const [partsLoadState, setPartsLoadState] = useState<"idle" | "loading" | "loaded" | "error">(
    () => (params.slug === "parts" ? "loading" : "idle"),
  );
  useEffect(() => {
    if (params.slug !== "parts") return;
    let cancelled = false;
    setPartsLoadState("loading");
    loadPartsItems()
      .then((loaded) => {
        if (!cancelled) {
          setPartsItems(loaded);
          setPartsLoadState("loaded");
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          // chunk fetch 失敗 (ネットワーク瞬断 / ad blocker / cache 古い tab 等) を可視化
          // console にも残す = user が devtools で原因把握できる
          // eslint-disable-next-line no-console
          console.error("[CAR-1613] parts.cdl chunk fetch failed", err);
          setPartsLoadState("error");
        }
      });
    return () => {
      cancelled = true;
    };
  }, [params.slug]);
  const items = params.slug === "parts"
    ? partsItems
    : (params.slug ? CATALOG_ITEMS[params.slug] ?? [] : []);

  const filtered = useMemo(() => {
    if (!query.trim()) return items;
    const q = query.toLowerCase();
    return items.filter((item) => {
      // **画面に出ている名前で引けること** が要る。 日本語名だけを見ていると、
      // 英語表示で見えている名前を打っても消える (実測 = `Medical triage` が引けなかった)
      const ja = itemNameJa(item.title).toLowerCase();
      const en = itemNameEn(item.title).toLowerCase();
      return (
        item.title.toLowerCase().includes(q) ||
        item.subtitle.toLowerCase().includes(q) ||
        item.id.toLowerCase().includes(q) ||
        ja.includes(q) ||
        en.includes(q)
      );
    });
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
          <nav aria-label={locale === "ja" ? "パンくずリスト" : "Breadcrumb"} className="catalog-crumb">
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
              {params.slug === "parts" && partsLoadState === "loading" ? (
                <div className="catalog-list-empty">読み込み中…</div>
              ) : params.slug === "parts" && partsLoadState === "error" ? (
                <div className="catalog-list-empty">
                  読み込みに失敗しました。 ページを再読込してください。
                </div>
              ) : filtered.length === 0 ? (
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
                      <div className="catalog-list-item-name">{displayName(item)}</div>
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
                    <h2 className="catalog-preview-title">{displayName(currentItem)}</h2>
                    {currentItem.subtitle && (
                      <p className="catalog-preview-sub">{currentItem.subtitle}</p>
                    )}
                    {/* 動きの種類は人が書かず図から導く (#1043)。 動かない図にも必ず出す
                        (出さないと説明が単独で出る、 #1053)。 SSOT = catalog-motion.ts */}
                    <p className="catalog-preview-motion">{currentItem.motionNote}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setModalItem(currentItem)}
                    aria-label={`${displayName(currentItem)} を拡大表示`}
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
                    <CdlDiagramView hideMiniPhaseIndicator diagram={currentItem.diagram} hideHeader interactiveHandlers={CATALOG_HANDLERS} />
                  </InViewMount>
                </div>
                <SourceTabs item={currentItem} />
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
                <Dialog.Title className="cdl-modal-title">
                  {modalItem ? displayName(modalItem) : ""}
                </Dialog.Title>
                {modalItem?.subtitle && (
                  <Dialog.Description className="cdl-modal-desc">
                    {modalItem.subtitle}
                  </Dialog.Description>
                )}
                {/* 動きの種類は人が書かず図から導く (#1043)。 動かない図にも必ず出す (#1053) */}
                {modalItem && <p className="cdl-modal-motion">{modalItem.motionNote}</p>}
              </div>
              <Dialog.Close asChild>
                <button type="button" aria-label="閉じる" className="cdl-modal-close">
                  <X size={20} />
                </button>
              </Dialog.Close>
            </div>
            <div className="cdl-modal-body">
              {modalItem && <CdlDiagramView hideMiniPhaseIndicator diagram={modalItem.diagram} hideHeader interactiveHandlers={CATALOG_HANDLERS} />}
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}
