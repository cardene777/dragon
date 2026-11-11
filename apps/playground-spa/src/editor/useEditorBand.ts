/**
 * 編集画面の並べ方の区画 (#3612)。CSS の「幅 1100 以下」と「幅 760 以下」の区画 (`playground.css`) と同じ境目にする。
 * 区画ごとに出すつまみが違うので、CSS で隠さずに部品を出し分ける。隠すだけだと Tab で移れるつまみが残る
 */
import { useSyncExternalStore } from "react";

/** 棚と記法の欄と図の欄を横に並べる (wide)、棚を引き出しに畳む (middle)、図と記法の欄を縦に積む (stacked) */
export type EditorBand = "wide" | "middle" | "stacked";

const STACKED = "(max-width: 760px)";
const MIDDLE = "(max-width: 1100px)";

function subscribe(listener: () => void): () => void {
  const medias = [matchMedia(STACKED), matchMedia(MIDDLE)];
  for (const media of medias) media.addEventListener("change", listener);
  return () => {
    for (const media of medias) media.removeEventListener("change", listener);
  };
}

const bandNow = (): EditorBand => (matchMedia(STACKED).matches ? "stacked" : matchMedia(MIDDLE).matches ? "middle" : "wide");

export function useEditorBand(): EditorBand {
  return useSyncExternalStore(subscribe, bandNow);
}
