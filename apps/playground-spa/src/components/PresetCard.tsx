import { useState } from "react";
import { Link } from "react-router";
import { CdlDiagramView } from "@cardenelabs/cdl";
import * as Dialog from "@radix-ui/react-dialog";
import { Maximize2, X, ExternalLink } from "lucide-react";
import type { PresetMetadata } from "@/lib/presets";
import { InViewMount } from "./InViewMount";
import { cn } from "@/lib/cn";

/**
 * PresetCard — 1 preset を Neumorphism raised card で表示。
 *
 * - preview area = CdlDiagramView (InViewMount で viewport 内のみ mount / animate)
 * - 拡大 button (右上、 Maximize icon) = click で Radix Dialog modal
 * - modal 開閉時に card 側 view を unmount、 modal 側だけ mount で 1 diagram = 1 view instance 保証
 *   (これで cdl 内 useTimeline が duplicate せず ちらつきが根本解消)
 * - Detail link = /preset/:slug へ遷移
 */
export function PresetCard({ preset }: { preset: PresetMetadata }): React.ReactElement {
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
        <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--v4-brand,#2d6a8f)] font-mono">
          {preset.eyebrow}
        </div>
        <h3 className="mt-1 text-[17px] font-bold tracking-tight text-[var(--v4-ink,#1a1f2a)]">
          {preset.title}
        </h3>
        <p className="mt-1 text-[13.5px] leading-relaxed text-[var(--v4-ink-dim,#5a6270)]">
          {preset.subtitle}
        </p>
      </header>

      <div
        className="relative rounded-xl bg-[var(--v4-canvas,#f8fafc)] p-4 min-h-[240px]"
        style={{ aspectRatio: "16 / 10" }}
      >
        {/* card 内 preview = modal open 中は unmount して timeline を duplicate させない */}
        {!modalOpen && (
          <InViewMount
            className="w-full h-full"
            placeholder={
              <div className="w-full h-full flex items-center justify-center text-[11px] text-[var(--v4-ink-mute,#8a8678)] font-mono">
                loading…
              </div>
            }
          >
            <CdlDiagramView diagram={preset.diagram as never} hideHeader />
          </InViewMount>
        )}
        {modalOpen && (
          <div className="w-full h-full flex items-center justify-center text-[11px] text-[var(--v4-ink-mute,#8a8678)] font-mono">
            modal 展開中
          </div>
        )}
        {/* 拡大 button (常時表示) */}
        <button
          type="button"
          onClick={() => setModalOpen(true)}
          aria-label={`${preset.title} を拡大表示`}
          className={cn(
            "absolute top-2 right-2 inline-flex items-center gap-1 rounded-full",
            "bg-white/95 shadow-sm px-2 py-1 text-[10px] font-semibold text-[var(--v4-ink-dim,#5a6270)]",
            "hover:text-[var(--v4-ink,#1a1f2a)] hover:shadow-md transition-all",
            "focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--v4-brand,#2d6a8f)]",
          )}
        >
          <Maximize2 size={11} />
          拡大
        </button>
      </div>

      <footer className="mt-4 flex items-center justify-between gap-2">
        <div className="flex flex-wrap gap-1.5">
          {preset.tags.map((t) => (
            <span
              key={t}
              className="rounded-full bg-[var(--v4-canvas,#f8fafc)] px-2.5 py-0.5 text-[10.5px] font-medium text-[var(--v4-ink-dim,#5a6270)] font-mono"
            >
              {t}
            </span>
          ))}
        </div>
        <Link
          to={`/preset/${preset.slug}`}
          className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[11.5px] font-semibold text-[var(--v4-brand,#2d6a8f)] hover:bg-[var(--v4-canvas,#f8fafc)] transition-colors"
        >
          Detail
          <ExternalLink size={11} />
        </Link>
      </footer>

      <Dialog.Root open={modalOpen} onOpenChange={setModalOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
          <Dialog.Content className="fixed left-1/2 top-1/2 z-50 max-h-[92vh] w-[94vw] max-w-[1400px] -translate-x-1/2 -translate-y-1/2 overflow-auto rounded-3xl bg-white p-6 sm:p-8 shadow-2xl focus:outline-none">
            <div className="mb-4 flex items-start justify-between gap-4">
              <div>
                <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--v4-brand,#2d6a8f)] font-mono">
                  {preset.eyebrow}
                </div>
                <Dialog.Title className="mt-1 text-2xl font-bold text-[var(--v4-ink,#1a1f2a)]">
                  {preset.title}
                </Dialog.Title>
                <Dialog.Description className="mt-1 text-[14px] text-[var(--v4-ink-dim,#5a6270)]">
                  {preset.subtitle}
                </Dialog.Description>
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
              {/* modal 内 = 単一の live view、 card 側は unmount 済 */}
              {modalOpen && <CdlDiagramView diagram={preset.diagram as never} />}
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </article>
  );
}
