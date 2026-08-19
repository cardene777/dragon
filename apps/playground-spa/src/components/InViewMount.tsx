import { useEffect, useRef, useState } from "react";

/**
 * Viewport 内でのみ children を mount する wrapper。
 * out of view で children を unmount → cdl 内 useTimeline が止まる → 20 preset
 * 同時 timeline loop によるちらつき / CPU 過負荷を防ぐ。
 *
 * rootMargin = 300px 先読みで scroll 時の突然の appear/disappear を緩和。
 *
 * `keepMounted` は **一度でも見えたら以降は外さない** 形へ切り替える (#1236)。
 *
 * 既定の「見えなくなったら外す」 は、図がいくつも並ぶ画面で timeline を止めるためのもの。
 * 対して図を 1 つだけ出す画面で `hidden` と併せて使うと、隠した瞬間に box が消えて
 * 「見えない」 と判定され、children が外れる。 切り替えて戻すたびに図を描き直すことになり、
 * **どちらも DOM に残す** という呼出側の意図が黙って破れる (catalog の図とコードの切替で実際に踏んだ)。
 */
export function InViewMount({
  children,
  placeholder,
  className,
  keepMounted = false,
}: {
  children: React.ReactNode;
  placeholder?: React.ReactNode;
  className?: string;
  keepMounted?: boolean;
}): React.ReactElement {
  const ref = useRef<HTMLDivElement | null>(null);
  // 環境が観測手段を持たない時は **出す側に倒す** (#1236)。 jsdom には `IntersectionObserver`
  // が無く、 隠したままにすると図を出す画面の検査が中身を 1 つも見られない。
  // 隠す判断ができないなら隠さない方が、 表示が消える事故より軽い。
  const [inView, setInView] = useState(() => typeof IntersectionObserver === "undefined");

  useEffect(() => {
    if (!ref.current) return;
    if (typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setInView(true);
            // 一度見えたら以降は観測しない = 隠された時に外れなくなる
            if (keepMounted) io.disconnect();
            return;
          }
          if (!keepMounted) setInView(false);
        });
      },
      { rootMargin: "300px 0px 300px 0px", threshold: 0.01 },
    );
    io.observe(ref.current);
    return () => io.disconnect();
  }, [keepMounted]);

  return (
    <div ref={ref} className={className}>
      {inView ? children : placeholder ?? null}
    </div>
  );
}
