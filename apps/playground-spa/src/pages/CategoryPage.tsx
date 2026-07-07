import { useState } from "react";
import { Link, useParams } from "react-router";
import { CdlDiagramView } from "@cardenelabs/cdl";
import * as Dialog from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { CATEGORIES } from "@/lib/catalog";
import { CATALOG_ITEMS, type CatalogItem } from "@/lib/catalog-items";
import { SiteHeader } from "@/components/SiteHeader";
import { NmPresetCard } from "@/components/NmPresetCard";

/**
 * /catalog/:slug = 旧 apps/playground/src/pages/catalog/presets.astro 忠実復元。
 * hero (breadcrumb + eyebrow + gradient title + subtitle + CTA) + stats (4 個) + preset grid。
 * 拡大 button で Radix Dialog modal 展開、 SVG letterbox center fit。
 * CSS SSOT = catalog.css の .nm-hero / .nm-preset-card / .cdl-modal-* class。
 */
export function CategoryPage(): React.ReactElement {
  const params = useParams<{ slug: string }>();
  const [modalItem, setModalItem] = useState<CatalogItem | null>(null);

  const category = CATEGORIES.find((c) => c.slug === params.slug);
  const items = params.slug ? CATALOG_ITEMS[params.slug] ?? [] : [];

  if (!category) {
    return (
      <div>
        <SiteHeader />
        <div className="flex min-h-[calc(100vh-80px)] items-center justify-center">
          <p className="text-[15px] text-[var(--v4-ink-dim,#5a6270)]">Category not found</p>
        </div>
      </div>
    );
  }

  const capitalizedLabel = category.label.charAt(0).toUpperCase() + category.label.slice(1);

  return (
    <div>
      <SiteHeader />
      <main>
        <section className="nm-hero">
          <nav aria-label="パンくず" className="nm-crumb">
            <Link to="/">overview</Link>
            <span aria-hidden="true">/</span>
            <Link to="/catalog">catalog</Link>
            <span aria-hidden="true">/</span>
            <span className="cur">{category.label}</span>
          </nav>
          <span className="nm-eyebrow">{category.eyebrow}</span>
          <h1 className="nm-hero-title">
            {capitalizedLabel} <span className="nm-gradient-accent">{items.length} items</span>
          </h1>
          <p className="nm-hero-subtitle">{category.desc}</p>
          <div className="nm-hero-actions">
            <Link to="/editor" className="nm-hero-btn nm-hero-btn-primary">
              <span>Open editor</span>
              <span className="nm-hero-btn-arrow" aria-hidden="true">→</span>
            </Link>
            <Link to="/catalog" className="nm-hero-btn nm-hero-btn-secondary">
              <span>Back to catalog</span>
            </Link>
          </div>
        </section>

        <section className="nm-stats" aria-label={`${category.label} stats`}>
          <div className="nm-stat">
            <div className="nm-stat-num">{items.length}</div>
            <div className="nm-stat-label">items</div>
          </div>
          <div className="nm-stat">
            <div className="nm-stat-num">{category.items.length}</div>
            <div className="nm-stat-label">sub-categories</div>
          </div>
          <div className="nm-stat">
            <div className="nm-stat-num">6</div>
            <div className="nm-stat-label">themes</div>
          </div>
          <div className="nm-stat">
            <div className="nm-stat-num">{category.cluster === "basic" ? "basic" : "extended"}</div>
            <div className="nm-stat-label">cluster</div>
          </div>
        </section>

        <section className="nm-presets-section" aria-label={`${category.label} preset list`}>
          <div className="nm-section-head">
            <h2 className="nm-section-title">
              {capitalizedLabel} <span className="nm-section-count">({items.length})</span>
            </h2>
            <p className="nm-section-desc">
              各 item は 1 行の DSL / builder API 呼び出しで node / edge / lane を生成、 build() で PhaseDoc を得る。 拡大 button で phase animation 付きで確認できる。
            </p>
          </div>
          <div className="nm-preset-grid">
            {items.map((item) => (
              <NmPresetCard
                key={item.id}
                id={item.id}
                eyebrow={category.eyebrow}
                title={item.title}
                subtitle={item.subtitle}
                tags={category.items.slice(0, 2)}
                diagram={item.diagram}
                onOpen={() => setModalItem(item)}
              />
            ))}
          </div>
        </section>
      </main>

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
