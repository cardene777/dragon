import Link from "next/link";
import { Rocket, ArrowLeft } from "lucide-react";

/**
 * 404 page — global not found handler。
 * app router で file 名 `not-found.tsx` が SSOT、 route が match しない全 URL で表示。
 */
export default function NotFound(): React.ReactElement {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-6 p-8 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[var(--color-accent)] text-white">
        <Rocket size={32} />
      </div>
      <div>
        <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--color-accent)] font-mono">
          Error 404
        </div>
        <h1 className="mt-2 text-4xl font-bold tracking-tight text-[var(--color-ink)]">
          Page not found
        </h1>
        <p className="mt-3 max-w-md text-[15px] leading-relaxed text-[var(--color-ink-dim)]">
          この URL に対応する page はありません。 catalog に戻って preset を選んでください。
        </p>
      </div>
      <Link
        href="/"
        className="inline-flex items-center gap-2 rounded-xl bg-[var(--color-accent)] px-5 py-2.5 text-[14px] font-semibold text-white shadow-sm hover:shadow-md transition-shadow"
      >
        <ArrowLeft size={14} />
        Back to catalog
      </Link>
    </div>
  );
}
