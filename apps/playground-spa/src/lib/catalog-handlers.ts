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
 * 触れる経路 (`clickToggle` の `hover-state`) は結び付けを宣言するだけで状態を持たない。
 * **それでも実装は要る**。 渡さないと `attachEventHandlers` が「受け取り手が無い」 と
 * 警告を出し、図を開くたびに console が汚れる (実測 = 渡す前は 5 件出た)。
 */
const noop: InteractiveHandlerMap[string] = () => {
  // 触れたことを状態に残さない (この見本は押す方の動きを見せるもの)
};

/**
 * 受け取った操作の名前を残し、累計を 1 増やす受け取り手を作る (`eventVariety`)。
 *
 * 5 種の操作がどれも同じ 2 つの状態に書くため、**どの操作を受け取っても画面が変わる**。
 * 名前は図の入力欄 (`lastEvent`) の選択肢と一致させる = 一致しないと種別が合わず
 * 書き込みが無視される (`setString` は種別違いを警告して何もしない)。
 */
function receiveAs(label: string): InteractiveHandlerMap[string] {
  return (_event, signals) => {
    signals.setString?.("lastEvent", label);
    const n = signals.getNumber?.("received") ?? 0;
    // 上限 (99) を超えると入力欄の値域から外れるため、超えたら 0 に戻す
    signals.setNumber?.("received", n >= 99 ? 0 : n + 1);
  };
}

/**
 * 押している時間を測って、一定時間を超えた時だけ受け取る (`eventVariety` の長押し)。
 *
 * **時間の判定は使う側の責務**。 `cdl` は `long-press` に対して `pointerdown` /
 * `pointerup` / `pointercancel` の 3 つをそのまま渡すだけで、時間を測らない
 * (`event-handler/index.ts` の注記が「handler 側で time diff を測る簡易実装」 と書いている)。
 *
 * 測らないと押した瞬間と離した瞬間の 2 回とも受け取ってしまい、
 * 「押したまま一定時間たつと」 の説明と食い違う (実測で短い押下でも届いた)。
 */
const LONG_PRESS_MS = 500;
function createLongPress(label: string): InteractiveHandlerMap[string] {
  let pressedAt: number | undefined;
  const receive = receiveAs(label);
  return (event, signals) => {
    if (event.type === "pointerdown") {
      pressedAt = event.timeStamp;
      return;
    }
    if (event.type === "pointercancel") {
      // 押下が取り消されたら測り直す (そのまま残すと次の離しで誤って受け取る)
      pressedAt = undefined;
      return;
    }
    if (event.type !== "pointerup") return;
    const started = pressedAt;
    pressedAt = undefined;
    if (started === undefined) return;
    if (event.timeStamp - started < LONG_PRESS_MS) return;
    receive(event, signals);
  };
}

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
  // 受け取った操作の名前と累計を残す (`eventVariety`)
  "on-dbl": receiveAs("2 回押し"),
  "on-focus": receiveAs("選ばれた"),
  "on-blur": receiveAs("外れた"),
  "on-key": receiveAs("キー入力"),
  "on-long": createLongPress("長押し"),
};
