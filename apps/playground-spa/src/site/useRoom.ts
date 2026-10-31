/**
 * 上の帯 (`[data-site="header"]`) を除いた画面の高さ (#3250)。
 * 帯は頁の上に留まるので、図の枠がこの高さを超えると、図の上端か下の釦のどちらかが必ず画面の外に出る。
 * カタログの見本で、枠を図の高さまで伸ばすか寄って追う図にするかの境目に使う
 */
import { useSyncExternalStore } from "react";

function subscribe(listener: () => void): () => void {
  addEventListener("resize", listener);
  return () => removeEventListener("resize", listener);
}

const roomOf = (): number => innerHeight - (document.querySelector<HTMLElement>('[data-site="header"]')?.offsetHeight ?? 0);

export function useRoom(): number {
  return useSyncExternalStore(subscribe, roomOf);
}
