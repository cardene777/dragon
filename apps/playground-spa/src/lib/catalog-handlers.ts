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
const RECEIVED_MAX = 99;
function receiveAs(label: string): InteractiveHandlerMap[string] {
  return (_event, signals) => {
    signals.setString?.("lastEvent", label);
    const n = signals.getNumber?.("received") ?? 0;
    // 入力欄の値域 (0-99) で止める。 0 に戻すと 100 回目が「累計 0 回」 と読め、
    // 「受け取った」 のに数が減る = 受け取っていないように見える
    signals.setNumber?.("received", Math.min(n + 1, RECEIVED_MAX));
  };
}

/**
 * 押し続けた時間を数えて、一定時間に達した時点で受け取る (`eventVariety` の長押し)。
 *
 * **時間の判定は使う側の責務**。 `cdl` は `long-press` に対して `pointerdown` /
 * `pointerup` / `pointercancel` の 3 つをそのまま渡すだけで、時間を測らない
 * (`event-handler/index.ts` の注記が「handler 側で time diff を測る簡易実装」 と書いている)。
 * 何もしないと押した瞬間と離した瞬間の 2 回とも受け取り、短い押下でも届く (実測)。
 *
 * **離した時ではなく、達した時点で受け取る**。 段の説明は「押したまま一定時間たつと受け取る」
 * と書いており、離すまで画面が変わらないのでは説明と食い違う。
 *
 * 待ちは **押下ごと** に持つ。 受け取り手は 1 つを一覧と拡大表示が共有し、指も複数あり得るため、
 * 1 つの変数に持つと別の表示や別の指の離しが取り違えられる (先に押した方が取りこぼされる)。
 */
const LONG_PRESS_MS = 500;
function createLongPress(label: string): InteractiveHandlerMap[string] {
  // 押下の区別は「どの要素を」「どの指で」 の 2 つで決まる。 要素は表示ごとに別物なので、
  // 要素で分ければ一覧と拡大表示が混ざらない
  const waiting = new WeakMap<EventTarget, Map<number, ReturnType<typeof setTimeout>>>();
  const receive = receiveAs(label);

  const stop = (target: EventTarget | null, pointerId: number): void => {
    if (!target) return;
    const byPointer = waiting.get(target);
    const timer = byPointer?.get(pointerId);
    if (timer === undefined) return;
    clearTimeout(timer);
    byPointer?.delete(pointerId);
  };

  return (event, signals) => {
    // 結び付けた要素で分ける (`currentTarget` は配信中だけ有効なのでこの場で読む)
    const target = event.currentTarget ?? event.target;
    const pointerId = (event as PointerEvent).pointerId ?? 0;
    if (event.type !== "pointerdown") {
      // 離した / 取り消した = 時間に届かなかったので待ちをやめる
      stop(target, pointerId);
      return;
    }
    stop(target, pointerId);
    if (!target) return;
    const byPointer = waiting.get(target) ?? new Map<number, ReturnType<typeof setTimeout>>();
    waiting.set(target, byPointer);
    byPointer.set(
      pointerId,
      setTimeout(() => {
        byPointer.delete(pointerId);
        // 図が画面から外れた後に書くと、消えた図の状態を触ることになる
        // (`Element` を名前で見ると画面の無い環境で落ちるため、値の方を見る)
        if ((target as { isConnected?: boolean }).isConnected === false) return;
        receive(event, signals);
      }, LONG_PRESS_MS),
    );
  };
}

/**
 * 押したまま一定の距離を動かした時点で 1 回だけ受け取る (`eventTargets` のドラッグ)。
 *
 * `cdl` は `drag` に `pointerdown` / `pointermove` / `pointerup` の 3 つをそのまま渡すだけで、
 * 距離を測らない。 何もしないと押しただけ・動かすたびに受け取り、1 回のドラッグで累計が数十増える。
 *
 * **押下を図の移動へ渡さない**。 カタログの図は掴んで動かせる (`useDiagramPanZoom`)。 押下が
 * 器まで届くと、動かし始めた時点で器が指を捕まえ、以降の `pointermove` が箱へ届かなくなる。
 * 箱の側で指を捕まえ直すのは、箱の外まで動かしても動きを追うため。
 *
 * 押下は長押しと同じく **要素と指の組** で分ける (一覧と拡大表示が受け取り手を共有する)。
 */
const DRAG_THRESHOLD_PX = 6;
function createDrag(label: string): InteractiveHandlerMap[string] {
  const pressed = new WeakMap<
    EventTarget,
    Map<number, { x: number; y: number; received: boolean }>
  >();
  const receive = receiveAs(label);

  return (event, signals) => {
    const target = event.currentTarget ?? event.target;
    if (!target) return;
    const pointer = event as PointerEvent;
    const pointerId = pointer.pointerId ?? 0;
    const byPointer =
      pressed.get(target) ?? new Map<number, { x: number; y: number; received: boolean }>();
    pressed.set(target, byPointer);

    if (event.type === "pointerdown") {
      event.stopPropagation();
      (target as { setPointerCapture?: (id: number) => void }).setPointerCapture?.(pointerId);
      byPointer.set(pointerId, { x: pointer.clientX, y: pointer.clientY, received: false });
      return;
    }
    const start = byPointer.get(pointerId);
    if (!start) return;
    if (event.type !== "pointermove") {
      byPointer.delete(pointerId);
      return;
    }
    if (start.received) return;
    if (Math.hypot(pointer.clientX - start.x, pointer.clientY - start.y) < DRAG_THRESHOLD_PX)
      return;
    start.received = true;
    receive(event, signals);
  };
}

/**
 * 落とされた時に受け取る (`eventTargets` の落とす先)。
 *
 * `cdl` は `drop` に `dragover` と `drop` の 2 つを渡す。 **`dragover` を止めないと `drop` が
 * 来ない** (ブラウザは既定で落とすことを許さない)。 `drop` も止める = 止めないとファイルを
 * 落とした時にブラウザがそのファイルを開き、カタログの画面から離れる。
 */
function createDrop(label: string): InteractiveHandlerMap[string] {
  const receive = receiveAs(label);
  return (event, signals) => {
    event.preventDefault();
    if (event.type !== "drop") return;
    receive(event, signals);
  };
}

/**
 * 図に入った時と出た時で別の名前を残す (`eventTargets` の図全体)。
 *
 * `hover` は `mouseenter` と `mouseleave` の 2 つを渡す。 同じ名前を残すと、出たのか入ったのかが
 * 画面で区別できない。
 */
function createEnterLeave(enter: string, leave: string): InteractiveHandlerMap[string] {
  const onEnter = receiveAs(enter);
  const onLeave = receiveAs(leave);
  return (event, signals) => (event.type === "mouseleave" ? onLeave : onEnter)(event, signals);
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
  // 箱の外 (矢印 / 縦列 / 図全体) と、動かす・落とす操作を受け取る (`eventTargets`、#1969)
  "on-drag": createDrag("動かした"),
  "on-drop": createDrop("落とした"),
  "on-arrow": receiveAs("矢印を押した"),
  "on-lane": receiveAs("縦列を押した"),
  "on-diagram": createEnterLeave("図に入った", "図から出た"),
};
