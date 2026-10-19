/**
 * 地の明るい画面と暗い画面で見る検査が開く、サイトの意匠 (#2962)。
 *
 * 画面の明暗の切り替えは外した。 明暗で値が分かれるかを見てきた検査は、地の明るい既定の活版と
 * 地の暗い端末の 2 つで同じことを見る。 意匠を書いていない図もこの意匠で描かれる。
 */
export const 明るい画面の意匠 = "letterpress";
export const 暗い画面の意匠 = "terminal";

/** 頁の道にサイトの意匠 (`?theme=`) を足す。 `#` から後ろ (記法を載せた部分) は触らない */
export function 画面の意匠を付ける(道: string, 意匠: string): string {
  const 印 = 道.indexOf("#");
  const 前 = 印 < 0 ? 道 : 道.slice(0, 印);
  const 後 = 印 < 0 ? "" : 道.slice(印);
  return `${前}${前.includes("?") ? "&" : "?"}theme=${意匠}${後}`;
}
