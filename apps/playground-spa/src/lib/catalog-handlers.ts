/**
 * catalog の見本が `on.click` / `on.hover` で名指しする受け取り手の実装 (#1038)。
 *
 * `cdl` は受け取り手の **名前だけ** を図に持ち、実装は使う側が渡す
 * (`interactive-panel.tsx` は指定が無いと結び付けを中止する)。 catalog は
 * 「押すとこう動く」 を見せる場なので、名指しされた受け取り手をここで実装する。
 *
 * **図が名指しする受け取り手を全て持つ**。 1 つでも欠けると、その図は押しても
 * 動かない見本として並び続ける。 欠けを機械で見る検査は
 * `catalog-handlers.test.ts` にある。
 */
import type { InteractiveHandlerMap } from "@cardenelabs/cdl";

/**
 * 押すたびに入りと切りを入れ替える。
 *
 * `active` は `toggle` の入力欄なので、真偽として読み書きする
 * (`getBool` / `setBool` は種別が合わない時に警告して何もしない)。
 */
const toggleActive: InteractiveHandlerMap[string] = (_event, signals) => {
  const current = signals.getBool?.("active");
  signals.setBool?.("active", !current);
};

/**
 * 状態を書き換えない受け取り手。
 *
 * 受け取り方そのものを見せる図 (`eventVariety` / `clickToggle` の触れる経路) は、
 * 結び付けを宣言するだけで状態を持たない。 **それでも実装は要る**。
 * 渡さないと `attachEventHandlers` が「受け取り手が無い」 と警告を出し、
 * 図を開くたびに console が汚れる (実測 = `eventVariety` で 5 件出た)。
 */
const noop: InteractiveHandlerMap[string] = () => {
  // 受け取ったことを状態に残さない (これらの見本は受け取り方の種類を見せるもの)
};

/**
 * catalog の図が名指しする受け取り手。 名前は図の `on.*` 第 2 引数と一致する。
 *
 * ここに無い名前を図が使うと、その図は押しても動かない見本として並ぶ。
 * 対応は `catalog-handlers.test.ts` が機械で見る。
 */
export const CATALOG_HANDLERS: InteractiveHandlerMap = {
  // 押すと状態が入れ替わる (`clickToggle`)
  "toggle-active": toggleActive,
  "hover-state": noop,
  // 受け取り方の種類を見せる (`eventVariety`)
  "on-dbl": noop,
  "on-focus": noop,
  "on-blur": noop,
  "on-key": noop,
  "on-long": noop,
};
