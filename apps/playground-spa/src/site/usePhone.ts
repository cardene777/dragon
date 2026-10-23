/**
 * 携帯の幅かどうか (#3065、#3067)。CSS の「幅 439 以下」の区画 (`playground.css`、`catalog/catalog.css`) と同じ境目にする。
 * CSS で並べ替えると読み上げと Tab で移る順が見た目と食い違う所 (倍率の釦) で、部品の出し分けに使う
 */
import { useSyncExternalStore } from "react";

const PHONE = "(max-width: 439px)";

function subscribe(listener: () => void): () => void {
  const media = matchMedia(PHONE);
  media.addEventListener("change", listener);
  return () => media.removeEventListener("change", listener);
}

const isPhone = (): boolean => matchMedia(PHONE).matches;

export function usePhone(): boolean {
  return useSyncExternalStore(subscribe, isPhone);
}
