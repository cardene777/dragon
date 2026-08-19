/**
 * catalog の検索欄の見た目の検査 (#1236)。
 *
 * 角丸 3px (`--d-r-1`) + 濃い実線枠 + 高さ 34px の組み合わせが、画面の中でここだけ古い
 * 見た目になっていた。 focus した時も枠の色が変わるだけで、変化が分かりにくかった。
 *
 * **見た目そのものは検査できない**。 ここで固定するのは、古い見た目に戻る形を検出できる
 * 数値と規則の 2 つに絞る = 角丸が最小値のままか、focus の変化が色 1 つだけか。
 *
 * CSS を文字列として読むため、値を変えるだけの改修では落ちない。 落ちるのは「元の古い形へ
 * 戻した時」 で、それがこの検査の目的になる。
 */
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";

const CSS = readFileSync(new URL("../styles/catalog-new.css", import.meta.url), "utf8");

/** `.catalog-search-wrap` の規則本体 (最初の 1 つ = 通常状態) */
function 検索欄の規則(): string {
  const m = CSS.match(/\.catalog-search-wrap\s*\{([^}]*)\}/);
  return m?.[1] ?? "";
}

/** `:focus-within` の規則本体 */
function focus時の規則(): string {
  const m = CSS.match(/\.catalog-search-wrap:focus-within\s*\{([^}]*)\}/);
  return m?.[1] ?? "";
}

describe("検索欄が古い見た目に戻らない (#1236)", () => {
  it("規則そのものが見つかる", () => {
    // 見つからなければ以下の検査が全て空文字を見て通ってしまう
    expect(検索欄の規則(), "通常状態の規則が無い").not.toBe("");
    expect(focus時の規則(), "focus 時の規則が無い").not.toBe("");
  });

  it("角丸が最小の token より大きい", () => {
    // `--d-r-1` は 3px。 34px の高さに 3px はほぼ直角で、今の画面から浮く
    const 規則 = 検索欄の規則();
    expect(規則, "角丸の指定が無い").toMatch(/border-radius:/);
    expect(規則, "最小の token に戻っている").not.toMatch(/border-radius:\s*var\(--d-r-1\)/);
    const px = 規則.match(/border-radius:\s*(\d+)px/)?.[1];
    expect(Number(px ?? 0), "角丸が 3px 以下").toBeGreaterThan(3);
  });

  it("focus の変化が枠の色だけではない", () => {
    // 色 1 つだけだと、輝度差が小さく focus したことが分かりにくい
    const 規則 = focus時の規則();
    const 色以外 = 規則.replace(/border-color:[^;]*;/g, "").trim();
    expect(色以外, "focus 時に枠の色以外が変わらない").not.toBe("");
    expect(規則, "輪郭の広がりが無い").toMatch(/box-shadow:/);
  });

  it("枠は濃い方の token を既定にしない (陰性対照)", () => {
    // 濃い枠を常時出すと面ではなく線で見える。 hover でだけ濃くする
    const 規則 = 検索欄の規則();
    expect(規則, "既定の枠が濃いままになっている").not.toMatch(
      /border:\s*1px solid var\(--d-border-strong\)/,
    );
  });

  it("消す button に押せる面がある", () => {
    // 2px の padding だけでは的が小さく、外すと消えない
    const m = CSS.match(/\.catalog-search-clear\s*\{([^}]*)\}/);
    const 規則 = m?.[1] ?? "";
    expect(規則, "消す button の規則が無い").not.toBe("");
    expect(規則, "大きさの指定が無い").toMatch(/width:\s*\d+px/);
  });
});
