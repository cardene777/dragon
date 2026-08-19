// @vitest-environment jsdom

/**
 * `InViewMount` の mount / unmount 判断の検査 (#1236)。
 *
 * この wrapper は既定で「見えなくなったら children を外す」。 図がいくつも並ぶ画面で
 * timeline を止めるための振る舞いで、そこは変えない。
 *
 * 足したのは `keepMounted` で、**一度でも見えたら以降は外さない**。 図を 1 つだけ出す画面が
 * `hidden` と併せて使うと、隠した瞬間に box が消えて「見えない」 と判定され、children が
 * 外れる。 切り替えて戻すたびに図を描き直すことになる。
 *
 * jsdom は `IntersectionObserver` を持たないため、観測を人が動かせる形に差し替えて検査する。
 * 差し替えないと実装側の fallback 経路しか走らず、**観測を使う分岐へ 1 度も到達しない**。
 */
import { afterEach, beforeEach, describe, it, expect } from "vitest";
import { act, cleanup, render, screen } from "@testing-library/react";
import { InViewMount } from "./InViewMount";
import {
  drive as driveRaw,
  installIntersectionObserverStub,
  restoreIntersectionObserver,
} from "../../../../test-support/intersection-observer-stub";

/**
 * 交差状態を届けて描き直しまで終わらせる。
 *
 * `act` で包まないと state の更新が反映される前に assert が走り、 実装が正しくても落ちる。
 */
function drive(isIntersecting: boolean): void {
  act(() => driveRaw(isIntersecting));
}

function 描く(keepMounted: boolean): void {
  act(() => {
    render(
      <InViewMount
        keepMounted={keepMounted}
        placeholder={<div data-testid="placeholder">読み込み中…</div>}
      >
        <div data-testid="children" />
      </InViewMount>,
    );
  });
}

describe("見えている間だけ出す (#1236)", () => {
  beforeEach(() => installIntersectionObserverStub());
  afterEach(() => {
    cleanup();
    restoreIntersectionObserver();
  });

  it("見えるまでは placeholder を出す", () => {
    // 設計 (`C / States` の「図 / 読み込み中」) が描いている状態。 出さなくすると
    // 設計にある姿が実装から消える
    描く(false);
    expect(screen.getByTestId("placeholder")).toBeTruthy();
    expect(screen.queryByTestId("children")).toBeNull();
  });

  it("見えたら children に替わる", () => {
    描く(false);
    drive(true);
    expect(screen.getByTestId("children")).toBeTruthy();
    expect(screen.queryByTestId("placeholder")).toBeNull();
  });

  it("keepMounted なしでは見えなくなると外れる (陰性対照)", () => {
    // 既定の振る舞い。 これが変わっていないことを見ないと、下の検査が
    // 「元から外れない」 だけで通ってしまう
    描く(false);
    drive(true);
    expect(screen.getByTestId("children")).toBeTruthy();
    drive(false);
    expect(screen.queryByTestId("children")).toBeNull();
    expect(screen.getByTestId("placeholder")).toBeTruthy();
  });

  it("keepMounted ありでは見えなくなっても残る", () => {
    描く(true);
    drive(true);
    expect(screen.getByTestId("children")).toBeTruthy();
    drive(false);
    expect(screen.getByTestId("children"), "隠した時に外れている").toBeTruthy();
    expect(screen.queryByTestId("placeholder")).toBeNull();
  });
});

describe("観測手段が無い環境 (#1236)", () => {
  afterEach(() => cleanup());

  it("最初から children を出す", () => {
    // jsdom 素の状態。 落とすと図を出す画面の test が組み立ての時点で全て失敗する。
    // 隠す判断ができないなら隠さない方が、表示が消える事故より軽い
    expect(typeof (globalThis as Record<string, unknown>).IntersectionObserver).toBe("undefined");
    描く(true);
    expect(screen.getByTestId("children")).toBeTruthy();
    expect(screen.queryByTestId("placeholder")).toBeNull();
  });
});
