/**
 * `IntersectionObserver` の差し替え (#1236)。
 *
 * jsdom は `IntersectionObserver` を持たない。 持たないまま test を書くと、 実装側の
 * 「観測手段が無ければ出す側に倒す」 経路だけが走り、 **観測を使う経路が 1 度も動かない**。
 * 見えなくなった時の振る舞いを固定したいのに、 その分岐へ到達できない形になる。
 *
 * ここでは観測を人が動かせる形に置き換える。 `drive(false)` を呼んで初めて「見えなくなった」
 * が起き、 `disconnect()` を呼んだ observer には届かない = 実物と同じ意味論になる。
 */

type Cb = (entries: { isIntersecting: boolean }[]) => void;

/** 生きている observer の callback 一覧。 `disconnect()` した分は外れる */
const live = new Set<Cb>();

/** 差し替え前の実装 (元に戻すため) */
let saved: unknown;

/** `IntersectionObserver` を差し替える。 `restore` を呼ぶまで有効 */
export function installIntersectionObserverStub(): void {
  saved = (globalThis as Record<string, unknown>).IntersectionObserver;
  live.clear();
  class Stub {
    private readonly cb: Cb;
    constructor(cb: Cb) {
      this.cb = cb;
      live.add(cb);
    }
    observe(): void {
      // 実物は observe した時点で 1 度呼ぶ。 既定は「見えていない」 = placeholder から始まる
      this.cb([{ isIntersecting: false }]);
    }
    unobserve(): void {}
    disconnect(): void {
      live.delete(this.cb);
    }
    takeRecords(): [] {
      return [];
    }
  }
  (globalThis as Record<string, unknown>).IntersectionObserver = Stub;
}

/** 差し替えを元に戻す */
export function restoreIntersectionObserver(): void {
  (globalThis as Record<string, unknown>).IntersectionObserver = saved;
  live.clear();
}

/**
 * 生きている observer すべてに交差状態を届ける。
 *
 * `disconnect()` 済の observer には届かない。 これが `keepMounted` の検査を成立させる =
 * 一度見えたら観測を外す実装なら、 その後 `drive(false)` を呼んでも children は残る。
 */
export function drive(isIntersecting: boolean): void {
  for (const cb of [...live]) cb([{ isIntersecting }]);
}
