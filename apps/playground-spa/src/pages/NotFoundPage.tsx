import { Link } from "react-router";
import { Rocket, ArrowLeft } from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";

export function NotFoundPage(): React.ReactElement {
  return (
    <div>
      <SiteHeader />
      <div className="flex min-h-[calc(100vh-80px)] flex-col items-center justify-center gap-6 p-8 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[var(--v4-brand,#2d6a8f)] text-white">
        <Rocket size={32} />
      </div>
      <div>
        <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--v4-brand,#2d6a8f)] font-mono">
          Error 404
        </div>
        <h1 className="mt-2 text-4xl font-bold tracking-tight text-[var(--v4-ink,#1a1f2a)]">
          Page not found
        </h1>
        <p className="mt-3 max-w-md text-[15px] leading-relaxed text-[var(--v4-ink-dim,#5a6270)]">
          この URL に対応する page はありません。 catalog に戻って preset を選んでください。
        </p>
      </div>
      <Link
        to="/"
        className="inline-flex items-center gap-2 rounded-xl bg-[var(--v4-brand,#2d6a8f)] px-5 py-2.5 text-[14px] font-semibold text-white shadow-sm hover:shadow-md transition-shadow"
      >
        <ArrowLeft size={14} /> Back to catalog
      </Link>
      </div>
    </div>
  );
}
