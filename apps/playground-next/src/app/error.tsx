"use client";

import { useEffect } from "react";
import { AlertCircle, RefreshCw, Home } from "lucide-react";
import Link from "next/link";

/**
 * Global error boundary — client component、 unhandled error 発生時に表示。
 * app router で file 名 `error.tsx` が SSOT、 reset() で recovery attempt。
 */
export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}): React.ReactElement {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-6 p-8 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-red-500 text-white">
        <AlertCircle size={32} />
      </div>
      <div>
        <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-red-500 font-mono">
          Application Error
        </div>
        <h1 className="mt-2 text-4xl font-bold tracking-tight text-[var(--color-ink)]">
          Something went wrong
        </h1>
        <p className="mt-3 max-w-md text-[15px] leading-relaxed text-[var(--color-ink-dim)]">
          予期しないエラーが発生しました。 再試行、 または catalog に戻ってください。
        </p>
        {error.digest && (
          <code className="mt-3 inline-block rounded-lg bg-[var(--color-surface-2)] px-3 py-1 text-[11px] font-mono text-[var(--color-ink-mute)]">
            digest: {error.digest}
          </code>
        )}
      </div>
      <div className="flex gap-3">
        <button
          type="button"
          onClick={() => reset()}
          className="inline-flex items-center gap-2 rounded-xl bg-[var(--color-accent)] px-5 py-2.5 text-[14px] font-semibold text-white shadow-sm hover:shadow-md transition-shadow"
        >
          <RefreshCw size={14} />
          Try again
        </button>
        <Link
          href="/"
          className="inline-flex items-center gap-2 rounded-xl bg-[var(--color-surface)] px-5 py-2.5 text-[14px] font-semibold text-[var(--color-ink)] shadow-sm hover:shadow-md transition-shadow"
        >
          <Home size={14} />
          Home
        </Link>
      </div>
    </div>
  );
}
