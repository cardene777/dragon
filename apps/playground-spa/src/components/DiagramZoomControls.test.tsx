// @vitest-environment jsdom

/**
 * 図の倍率の欄の検査 (#1964)。
 *
 * 部品は状態を持たず、渡された倍率と描かれた倍率から、欄の文字とボタンの押せる状態を決める。
 * 実際に図の幅が変わることは `tests/catalog-inline-zoom.spec.ts` / `tests/catalog-modal-zoom.spec.ts` /
 * `tests/preset-panzoom.spec.ts` が実ブラウザで見る。 こちらは **部品単体の判断** を固定する。
 */
import { afterEach, describe, it, expect, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { 収める, 収めるの呼び名 } from "@/lib/diagram-zoom";
import { DiagramZoomControls, type 倍率の欄の場所 } from "./DiagramZoomControls";

afterEach(() => cleanup());

const 全ての場所: 倍率の欄の場所[] = ["並び", "拡大", "詳細"];

function 置く(上書き: Partial<Parameters<typeof DiagramZoomControls>[0]> = {}): {
  動かす: ReturnType<typeof vi.fn>;
  合わせる: ReturnType<typeof vi.fn>;
} {
  const 動かす = vi.fn();
  const 合わせる = vi.fn();
  render(
    <DiagramZoomControls
      場所="詳細"
      倍率={収める}
      収めた倍率={0.62}
      使える
      倍率を動かす={動かす}
      器に合わせる={合わせる}
      {...上書き}
    />,
  );
  return { 動かす, 合わせる };
}

describe("図の倍率の欄 (#1964)", () => {
  it("場所ごとにボタンの名前が違い、1 つの画面に 2 つ並べても区別できる", () => {
    const 名前たち = 全ての場所.map((場所) => {
      置く({ 場所 });
      const 群 = screen.getByRole("group");
      const 名前 = [...群.querySelectorAll("button")].map(
        (b) => b.getAttribute("aria-label") ?? b.textContent ?? "",
      );
      const 群の名 = 群.getAttribute("aria-label") ?? "";
      cleanup();
      return { 群の名, 下げる: 名前[0]!, 上げる: 名前[1]! };
    });
    expect(名前たち, "場所を 1 つも回っていない (検査が空振りしている)").toHaveLength(
      全ての場所.length,
    );
    for (const 鍵 of ["群の名", "下げる", "上げる"] as const) {
      const 値 = 名前たち.map((n) => n[鍵]);
      expect(
        値.every((v) => v.trim() !== ""),
        `${鍵} に空の名前がある`,
      ).toBe(true);
      expect(new Set(値).size, `${鍵} が場所の間で重なっている: ${値.join(" / ")}`).toBe(値.length);
    }
  });

  it("器に合わせるボタンの呼び名は、縦横とも収める拡大表示だけ違う", () => {
    for (const 場所 of 全ての場所) {
      置く({ 場所, 倍率: 1 });
      const 期待 = 場所 === "拡大" ? 収めるの呼び名.両方.ja : 収めるの呼び名.幅だけ.ja;
      expect(screen.getByRole("button", { name: 期待 }), `${場所} の呼び名`).toBeTruthy();
      cleanup();
    }
  });

  it("器に収めている時は描かれた倍率を欄に出し、器に合わせるボタンは押せない", () => {
    置く({ 倍率: 収める, 収めた倍率: 0.62 });
    expect(document.querySelector(".cdl-zoom-value")?.textContent).toBe("62%");
    expect(screen.getByRole("button", { name: 収めるの呼び名.幅だけ.ja })).toHaveProperty(
      "disabled",
      true,
    );
  });

  it("倍率を指定している時はその倍率を出し、器に合わせるボタンを押すと呼出側へ知らせる", () => {
    const { 合わせる } = 置く({ 倍率: 1.5, 収めた倍率: undefined });
    expect(document.querySelector(".cdl-zoom-value")?.textContent).toBe("150%");
    const ボタン = screen.getByRole("button", { name: 収めるの呼び名.幅だけ.ja });
    expect(ボタン).toHaveProperty("disabled", false);
    fireEvent.click(ボタン);
    expect(合わせる).toHaveBeenCalledTimes(1);
  });

  it("上げる / 下げるを押すと、向きを呼出側へ知らせる", () => {
    const { 動かす } = 置く({ 倍率: 1 });
    fireEvent.click(screen.getByRole("button", { name: "図の倍率を上げる" }));
    fireEvent.click(screen.getByRole("button", { name: "図の倍率を下げる" }));
    expect(動かす.mock.calls).toEqual([["上げる"], ["下げる"]]);
  });

  it("描かれた倍率より小さい刻みが無ければ下げるを押せない (刻みの端へ跳ねない)", () => {
    置く({ 倍率: 収める, 収めた倍率: 0.22 });
    expect(screen.getByRole("button", { name: "図の倍率を下げる" })).toHaveProperty(
      "disabled",
      true,
    );
    expect(screen.getByRole("button", { name: "図の倍率を上げる" })).toHaveProperty(
      "disabled",
      false,
    );
  });

  it("倍率を指定できない図では上げる / 下げるを押せない", () => {
    置く({ 倍率: 1, 使える: false });
    expect(screen.getByRole("button", { name: "図の倍率を下げる" })).toHaveProperty(
      "disabled",
      true,
    );
    expect(screen.getByRole("button", { name: "図の倍率を上げる" })).toHaveProperty(
      "disabled",
      true,
    );
  });
});
