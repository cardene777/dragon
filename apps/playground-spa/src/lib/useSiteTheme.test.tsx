// @vitest-environment jsdom

/**
 * サイトの意匠を住所の `?theme=` で決め、意匠を書いていない図にその意匠を当てる (#2962)。
 *
 * 見るのは 3 つ。
 *
 * 1. 開いた時の意匠 = `?theme=` に書いた `THEMES` の名前。 無い時と知らない名前は活版
 * 2. 意匠は html の `data-site-theme` に出る。 保存した値は読まない
 * 3. 図に当てる意匠 = 書いた意匠、無ければサイトの意匠 (表紙・見本帳・編集画面が同じ道を通る)
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, render, screen } from "@testing-library/react";
import { THEMES, textDslToDiagram, type DslTheme } from "@cardenelabs/dragon";
import type { CdlDiagram } from "@cardenelabs/cdl";

import { SiteThemeProvider, useSiteTheme } from "./useSiteTheme";
import { 既定の意匠, 住所の意匠, 図に意匠を当てる } from "./site-theme";

/** 行を持つ表の箱が 1 つの図。 意匠は書かず、要る時だけ後から載せる */
const 図 = (palette?: string): CdlDiagram => {
  const 組んだ = textDslToDiagram('title: "確かめ"\ntype: record\n\nactors:\n  - 表: storage ["id: PK"]\n');
  delete 組んだ.palette;
  return palette === undefined ? 組んだ : { ...組んだ, palette };
};

/** 描くたびに出た意匠を記録する部品 */
let 描いた意匠: DslTheme[] = [];
function SiteThemeRecorder(): React.ReactElement {
  const [意匠, 意匠を置く] = useSiteTheme();
  描いた意匠.push(意匠);
  return (
    <button type="button" onClick={() => 意匠を置く("terminal")}>
      {意匠}
    </button>
  );
}

function 開く(行き先: string): void {
  window.history.replaceState(null, "", 行き先);
  render(
    <SiteThemeProvider>
      <SiteThemeRecorder />
    </SiteThemeProvider>,
  );
}

beforeEach(() => {
  描いた意匠 = [];
  localStorage.clear();
  document.documentElement.removeAttribute("data-site-theme");
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  localStorage.clear();
  window.history.replaceState(null, "", "/");
});

describe("住所の `?theme=` で開く意匠を決める (#2962)", () => {
  it("`?theme=` を付けずに開くと活版になる", () => {
    expect(住所の意匠("https://example.test/catalog")).toBe("letterpress");
  });

  it("既定の意匠は記法の意匠の名前の 1 つ", () => {
    expect(THEMES).toContain(既定の意匠);
  });

  it.each(THEMES.map((意匠) => [意匠]))("`?theme=%s` で開くとその意匠になる", (意匠) => {
    expect(住所の意匠(`https://example.test/editor?theme=${意匠}`)).toBe(意匠);
  });

  it.each([["kinari"], ["celadon"], ["dark"], [""], ["LETTERPRESS"]])(
    "記法に無い名前 `%s` は活版へ戻す",
    (名前) => {
      expect(住所の意匠(`https://example.test/?theme=${名前}`)).toBe("letterpress");
    },
  );
});

describe("意匠を html に出し、保存した値は読まない (#2962)", () => {
  it("`?theme=neon` で開くと最初の描画から電飾になる", () => {
    開く("/?theme=neon");
    expect(描いた意匠[0], "最初の描画が電飾ではない").toBe("neon");
  });

  it("開いた意匠を html の `data-site-theme` に出す", () => {
    開く("/editor?theme=sketch");
    expect(document.documentElement.getAttribute("data-site-theme")).toBe("sketch");
  });

  it("`?theme=` が無い時は html に活版を出す", () => {
    開く("/");
    expect(document.documentElement.getAttribute("data-site-theme")).toBe("letterpress");
  });

  it("意匠を置き直すと html の `data-site-theme` も替わる", () => {
    開く("/?theme=letterpress");
    act(() => screen.getByRole("button").click());
    expect(document.documentElement.getAttribute("data-site-theme")).toBe("terminal");
  });

  it("開く時に保存した値を 1 つも読まない", () => {
    const 読んだ = vi.spyOn(Storage.prototype, "getItem");
    開く("/");
    expect(読んだ).not.toHaveBeenCalled();
  });
});

describe("図に当てる意匠は「書いた意匠、無ければサイトの意匠」 (#2962)", () => {
  it("意匠を書いていない図にはサイトの意匠を当てる", () => {
    expect(図に意匠を当てる(図(), "terminal").palette).toBe("terminal");
  });

  it("意匠を書いた図はサイトの意匠に関わらずそのまま返す", () => {
    const 書いた = 図("blueprint");
    expect(図に意匠を当てる(書いた, "terminal")).toBe(書いた);
  });

  it("記法に無い意匠が残った図はサイトの意匠で描く", () => {
    expect(図に意匠を当てる(図("kinari"), "relief").palette).toBe("relief");
  });

  it("当てた意匠で表の箱に行の縞を敷く (意匠を書いた図と同じ処理を通る)", () => {
    expect(図に意匠を当てる(図(), "catalog").nodes[0]?.rowStripe).toBe(true);
  });

  it("同じ図と同じ意匠には同じ object を返す (描き直しで段が最初へ戻らない)", () => {
    const 元 = 図();
    expect(図に意匠を当てる(元, "neon")).toBe(図に意匠を当てる(元, "neon"));
  });

  it("元の図は書き換えない", () => {
    const 元 = 図();
    図に意匠を当てる(元, "sketch");
    expect(元.palette).toBeUndefined();
  });
});
