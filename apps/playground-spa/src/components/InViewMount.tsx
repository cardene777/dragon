import { useEffect, useRef, useState } from "react";

/**
 * Viewport 内でのみ children を mount する wrapper。
 * out of view で children を unmount → cdl 内 useTimeline が止まる → 20 preset
 * 同時 timeline loop によるちらつき / CPU 過負荷を防ぐ。
 *
 * rootMargin = 300px 先読みで scroll 時の突然の appear/disappear を緩和。
 */
export function InViewMount({
  children,
  placeholder,
  className,
}: {
  children: React.ReactNode;
  placeholder?: React.ReactNode;
  className?: string;
}): React.ReactElement {
  const ref = useRef<HTMLDivElement | null>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    if (!ref.current) return;
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => setInView(entry.isIntersecting));
      },
      { rootMargin: "300px 0px 300px 0px", threshold: 0.01 },
    );
    io.observe(ref.current);
    return () => io.disconnect();
  }, []);

  return (
    <div ref={ref} className={className}>
      {inView ? children : placeholder ?? null}
    </div>
  );
}
