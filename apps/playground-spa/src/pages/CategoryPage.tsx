import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import { CdlDiagramView } from "@cardenelabs/cdl";
import * as Dialog from "@radix-ui/react-dialog";
import { ChevronLeft, ExternalLink, Github, Maximize2, Rocket, Search, X } from "lucide-react";
import { CATEGORIES } from "@/lib/catalog";
import { CATALOG_ITEMS, type CatalogItem } from "@/lib/catalog-items";
import { ThemePicker } from "@/components/ThemePicker";
import { InViewMount } from "@/components/InViewMount";
import { useTheme } from "@/lib/useTheme";
import { cn } from "@/lib/cn";

/**
 * /catalog/:slug — 各 category の item grid。
 * 拡大 button で Radix Dialog modal 展開 (card 側 unmount + modal 側 single mount)。
 */
export function CategoryPage(): React.ReactElement {
  const params = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [theme, setTheme] = useTheme();
  const [query, setQuery] = useState("");

  const category = CATEGORIES.find((c) => c.slug === params.slug);
  const items = params.slug ? CATALOG_ITEMS[params.slug] ?? [] : [];

  if (!category) {
    return (
      <div className="flex min-h-dvh items-center justify-center">
        <p className="text-[15px] text-[var(--v4-ink-dim,#5a6270)]">Category not found</p>
      </div>
    );
  }

  const filtered = items.filter((item) => {
    if (!query.trim()) return true;
    const q = query.toLowerCase();
    return (
      item.title.toLowerCase().includes(q) ||
      item.subtitle.toLowerCase().includes(q) ||
      item.id.toLowerCase().includes(q)
    );
  });

  return (
    <div className="min-h-dvh">
      <header className="sticky top-0 z-40 border-b border-[var(--v4-line,#e2e8f0)] bg-white/85 backdrop-blur-xl">
        <div className="mx-auto flex max-w-[1280px] flex-wrap items-center gap-3 px-4 py-3 sm:gap-5 sm:px-8 sm:py-4 md:gap-8">
          <Link to="/" className="flex items-center gap-3 font-bold text-[var(--v4-ink,#1a1f2a)]">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--v4-brand,#2d6a8f)] text-white shadow-sm">
              <Rocket size={17} />
            </div>
            <span className="text-[15px]">dragon</span>
          </Link>
          <button
            type="button"
            onClick={() => navigate("/")}
            className="flex items-center gap-1 text-[13px] font-medium text-[var(--v4-ink-dim,#5a6270)] hover:text-[var(--v4-ink,#1a1f2a)]"
          >
            <ChevronLeft size={14} /> Back to catalog
          </button>
          <div className="flex-1" />
          <ThemePicker value={theme} onChange={setTheme} />
          <a
            href="https://github.com/cardene777/dragon"
            target="_blank"
            rel="noreferrer"
            className="rounded-lg p-2 text-[var(--v4-ink-dim,#5a6270)] hover:bg-[var(--v4-canvas,#f8fafc)] hover:text-[var(--v4-ink,#1a1f2a)]"
            aria-label="GitHub"
          >
            <Github size={17} />
          </a>
        </div>
      </header>

      <main className="mx-auto max-w-[1280px] px-4 py-8 sm:px-8 sm:py-12">
        <nav aria-label="パンくず" className="mb-2 text-[12px] text-[var(--v4-ink-dim,#5a6270)]">
          <Link to="/" className="hover:text-[var(--v4-ink,#1a1f2a)]">
            catalog
          </Link>{" "}
          / <span className="text-[var(--v4-ink,#1a1f2a)]">{category.label}</span>
        </nav>

        <div className="mb-6">
          <div className="text-[11px] font-mono font-semibold uppercase tracking-[0.14em] text-[var(--v4-brand,#2d6a8f)]">
            {category.eyebrow}
          </div>
          <h1 className="mt-2 text-4xl font-bold tracking-tight text-[var(--v4-ink,#1a1f2a)]">
            {category.label}
          </h1>
          <p className="mt-3 max-w-3xl text-[15px] leading-relaxed text-[var(--v4-ink-dim,#5a6270)]">
            {category.desc}
          </p>
        </div>

        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-[15px] font-bold text-[var(--v4-ink-dim,#5a6270)] font-mono uppercase tracking-wider">
            {filtered.length}
            {filtered.length !== items.length ? ` of ${items.length}` : ""} items
          </h2>
          <div className="relative flex items-center gap-2">
            <Search
              size={14}
              className="absolute left-3 text-[var(--v4-ink-mute,#8a8678)] pointer-events-none"
            />
            <input
              type="text"
              placeholder="Search…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="rounded-full bg-white pl-9 pr-9 py-1.5 text-[13px] text-[var(--v4-ink,#1a1f2a)] placeholder:text-[var(--v4-ink-mute,#8a8678)] shadow-sm min-w-[240px] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--v4-brand,#2d6a8f)]"
              aria-label="Search items"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery("")}
                className="absolute right-2 rounded-full p-1 text-[var(--v4-ink-mute,#8a8678)] hover:text-[var(--v4-ink,#1a1f2a)]"
                aria-label="Clear search"
              >
                <X size={12} />
              </button>
            )}
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="rounded-2xl bg-white p-12 text-center shadow-sm">
            <p className="text-[15px] font-medium text-[var(--v4-ink,#1a1f2a)]">
              No items match "{query}"
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-6">
            {filtered.map((item) => (
              <ItemCard key={item.id} item={item} categorySlug={category.slug} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

function ItemCard({
  item,
  categorySlug,
}: {
  item: CatalogItem;
  categorySlug: string;
}): React.ReactElement {
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <article
      className={cn(
        "group relative flex flex-col rounded-2xl bg-white shadow-sm p-6 transition-all duration-300",
        "hover:shadow-md hover:-translate-y-0.5",
        "focus-within:ring-2 focus-within:ring-[var(--v4-brand,#2d6a8f)] focus-within:ring-offset-2",
      )}
    >
      <header className="mb-4">
        <div className="text-[10.5px] font-mono text-[var(--v4-ink-mute,#8a8678)]">
          {item.id}
        </div>
        <h3 className="mt-0.5 text-[16px] font-bold tracking-tight text-[var(--v4-ink,#1a1f2a)]">
          {item.title}
        </h3>
        {item.subtitle && (
          <p className="mt-1 text-[13px] leading-relaxed text-[var(--v4-ink-dim,#5a6270)]">
            {item.subtitle}
          </p>
        )}
      </header>

      <div
        className="relative rounded-xl bg-[var(--v4-canvas,#f8fafc)] p-4 min-h-[220px]"
        style={{ aspectRatio: "16 / 10" }}
      >
        {!modalOpen && (
          <InViewMount
            className="w-full h-full"
            placeholder={
              <div className="w-full h-full flex items-center justify-center text-[11px] text-[var(--v4-ink-mute,#8a8678)] font-mono">
                loading…
              </div>
            }
          >
            <CdlDiagramView diagram={item.diagram as never} hideHeader />
          </InViewMount>
        )}
        {modalOpen && (
          <div className="w-full h-full flex items-center justify-center text-[11px] text-[var(--v4-ink-mute,#8a8678)] font-mono">
            modal 展開中
          </div>
        )}
        <button
          type="button"
          onClick={() => setModalOpen(true)}
          aria-label={`${item.title} を拡大表示`}
          className="absolute top-2 right-2 inline-flex items-center gap-1 rounded-full bg-white/95 shadow-sm px-2 py-1 text-[10px] font-semibold text-[var(--v4-ink-dim,#5a6270)] hover:text-[var(--v4-ink,#1a1f2a)] hover:shadow-md transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--v4-brand,#2d6a8f)]"
        >
          <Maximize2 size={11} />
          拡大
        </button>
      </div>

      <footer className="mt-4 flex items-center justify-end">
        <Link
          to={`/editor?category=${categorySlug}&id=${item.id}`}
          className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[11.5px] font-semibold text-[var(--v4-brand,#2d6a8f)] hover:bg-[var(--v4-canvas,#f8fafc)] transition-colors"
        >
          Editor で開く <ExternalLink size={11} />
        </Link>
      </footer>

      <Dialog.Root open={modalOpen} onOpenChange={setModalOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
          <Dialog.Content className="fixed left-1/2 top-1/2 z-50 max-h-[92vh] w-[94vw] max-w-[1400px] -translate-x-1/2 -translate-y-1/2 overflow-auto rounded-3xl bg-white p-6 sm:p-8 shadow-2xl focus:outline-none">
            <div className="mb-4 flex items-start justify-between gap-4">
              <div>
                <div className="text-[10.5px] font-mono text-[var(--v4-ink-mute,#8a8678)]">
                  {item.id}
                </div>
                <Dialog.Title className="mt-0.5 text-2xl font-bold text-[var(--v4-ink,#1a1f2a)]">
                  {item.title}
                </Dialog.Title>
                {item.subtitle && (
                  <Dialog.Description className="mt-1 text-[14px] text-[var(--v4-ink-dim,#5a6270)]">
                    {item.subtitle}
                  </Dialog.Description>
                )}
              </div>
              <Dialog.Close asChild>
                <button
                  type="button"
                  aria-label="閉じる"
                  className="rounded-full p-2 text-[var(--v4-ink-dim,#5a6270)] hover:bg-[var(--v4-canvas,#f8fafc)] hover:text-[var(--v4-ink,#1a1f2a)] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--v4-brand,#2d6a8f)]"
                >
                  <X size={20} />
                </button>
              </Dialog.Close>
            </div>
            <div className="rounded-2xl bg-[var(--v4-canvas,#f8fafc)] p-6">
              {modalOpen && <CdlDiagramView diagram={item.diagram as never} />}
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </article>
  );
}
