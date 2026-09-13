import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { CdlDiagramView, diagram, type CdlDiagram } from "@cardenelabs/cdl";
import { 図に画面の言語を当てる } from "./diagram-lang";
import { shapeWarehouse } from "@/topics/catalog/primitives.cdl";

/**
 * 図を画面の言語で描く (#1910)。
 *
 * 関数の約束 3 つ (書いた言語を残す / 当てる / 同じ object を返す) と、描画エンジンが当てた言語で
 * 形の絵の中の字を引き替えること、画面が図を描く入口がすべて関数を通ることを確かめる。
 */

function 小さな図(lang?: "en" | "ja"): CdlDiagram {
  return diagram("小さな図", { topic: "小さな図", ...(lang ? { lang } : {}) })
    .lane("左", { width: 300 })
    .node("a", { lane: "左", stack: 0, kind: "card", title: "箱" })
    .phase("p1", { duration: 1000, title: "段", body: "段" }, (p) => p.activate("a"))
    .build();
}

function 描いた字(d: CdlDiagram): string {
  return renderToStaticMarkup(<CdlDiagramView hideMiniPhaseIndicator hideHeader diagram={d} />);
}

describe("図に画面の言語を当てる", () => {
  it("図が言語を書いていれば、画面の言語に依らず元の図をそのまま返す", () => {
    const 英語の図 = 小さな図("en");
    expect(図に画面の言語を当てる(英語の図, "ja")).toBe(英語の図);
    const 日本語の図 = 小さな図("ja");
    expect(図に画面の言語を当てる(日本語の図, "en")).toBe(日本語の図);
  });

  it("図が言語を書いていなければ、画面の言語を当て、元の図は変えない", () => {
    const 元 = 小さな図();
    expect(図に画面の言語を当てる(元, "ja").lang).toBe("ja");
    expect(図に画面の言語を当てる(元, "en").lang).toBe("en");
    expect(元.lang, "元の図を書き換えている").toBeUndefined();
  });

  it("同じ図と同じ言語には同じ object を返し、言語が違えば別の object を返す", () => {
    const 元 = 小さな図();
    const 日本語 = 図に画面の言語を当てる(元, "ja");
    expect(図に画面の言語を当てる(元, "ja")).toBe(日本語);
    const 英語 = 図に画面の言語を当てる(元, "en");
    expect(図に画面の言語を当てる(元, "en")).toBe(英語);
    expect(英語).not.toBe(日本語);
  });

  it("見本帳の倉庫の形は、日本語の画面で `倉庫` と描き、英語の画面で `WAREHOUSE` と描く", () => {
    // 描画エンジンの版が古い (言語を持ち越さない) と、日本語の画面でも英語のまま描かれて落ちる
    const 日本語 = 描いた字(図に画面の言語を当てる(shapeWarehouse, "ja"));
    expect(日本語).toContain(">倉庫<");
    expect(日本語).not.toContain("WAREHOUSE");
    const 英語 = 描いた字(図に画面の言語を当てる(shapeWarehouse, "en"));
    expect(英語).toContain(">WAREHOUSE<");
    expect(英語).not.toContain(">倉庫<");
  });
});

/**
 * 画面が図を描く入口の走査。
 *
 * **対象は source を走査して導く**。 入口の一覧を手で書くと、新しく足した入口が一覧に載らないまま
 * 英語で描かれ、検査は緑のまま残る。
 */
const 画面の記述 = import.meta.glob<string>(["../**/*.tsx", "!../**/*.test.tsx"], {
  query: "?raw",
  import: "default",
  eager: true,
});

/** 図を描く入口を持つが、見本帳の図を描かない入口。 理由を書く */
const 見本帳の図を描かない入口: Record<string, string> = {
  "../pages/RenderProbePage.tsx": "開発用の描画の調べ (`/__render`)。 自前で組んだ図を描き、見本帳の図を描かない",
  "../pages/DocsPage.tsx": "使い方の説明に載せるコードの文字列で、画面で図を描かない",
};

/**
 * `diagram={...}` に関数の呼び出しを直接書かず、関数を通した値を変数で渡す入口。
 *
 * **変数を作る所に関数を通した回数も確かめる**。 渡す所だけ見ると、変数を作る所で当て忘れても通る。
 */
const 変数で渡す入口: { file: string; 渡す値: string; 作る所: string; 回数: number; 理由: string }[] = [
  {
    file: "../pages/CategoryPage.tsx",
    渡す値: "図 ?? 見本?.diagram ?? currentItem.diagram",
    作る所: "図に画面の言語を当てる(見本.diagram, locale)",
    回数: 2,
    理由: "`図` と `拡大の図` を作る useMemo の 2 か所で当てる。 後ろの 2 つは `見本` が無い時の控えで、項目を表示している間は `見本` が必ずある",
  },
  {
    file: "../pages/CategoryPage.tsx",
    渡す値: "拡大の図 ?? modalItem.diagram",
    作る所: "図に画面の言語を当てる(見本.diagram, locale)",
    回数: 2,
    理由: "上と同じ useMemo で作る",
  },
  {
    file: "../components/CdlEditor.tsx",
    渡す値: "diagram",
    作る所: "図に画面の言語を当てる(",
    回数: 3,
    理由: "`diagram` は組み立てた図だけを持つ。 YAML と埋め込みの経路 (`applyDiagram`) と本文の経路 (`textDslToDiagram`) で当て、残る 1 か所は部品の一覧",
  },
];

/** `<CdlDiagramView` の `diagram={...}` の中身を、波括弧の対応を数えて取り出す */
function 渡す値の一覧(source: string): string[] {
  const 値: string[] = [];
  let 始め = source.indexOf("<CdlDiagramView");
  while (始め !== -1) {
    const 属性 = source.indexOf("diagram={", 始め);
    let 深さ = 1;
    let i = 属性 + "diagram={".length;
    for (; i < source.length && 深さ > 0; i++) {
      if (source[i] === "{") 深さ += 1;
      if (source[i] === "}") 深さ -= 1;
    }
    値.push(source.slice(属性 + "diagram={".length, i - 1).replace(/\s+/g, " ").trim());
    始め = source.indexOf("<CdlDiagramView", i);
  }
  return 値;
}

describe("画面が図を描く入口", () => {
  const 入口のfile = Object.entries(画面の記述).filter(([, s]) => s.includes("<CdlDiagramView"));

  it("図を描く入口を持つ file を走査できている", () => {
    expect(入口のfile.length, "図を描く入口を 1 つも見つけていない (検査が空振りしている)").toBeGreaterThan(0);
    // 除外の宣言が実物に残っているか。 消えた file の宣言は何も守らない
    for (const file of Object.keys(見本帳の図を描かない入口)) {
      expect(入口のfile.map(([f]) => f), `除外を宣言した ${file} に入口が無い`).toContain(file);
    }
  });

  it("見本帳の図を描く入口は、すべて画面の言語を当てた図を渡している", () => {
    let 見た数 = 0;
    for (const [file, source] of 入口のfile) {
      if (file in 見本帳の図を描かない入口) continue;
      for (const 値 of 渡す値の一覧(source)) {
        見た数 += 1;
        if (値.includes("図に画面の言語を当てる(")) continue;
        const 宣言 = 変数で渡す入口.find((e) => e.file === file && e.渡す値 === 値);
        expect(宣言, `${file} が言語を当てずに図を渡している: diagram={${値}}`).toBeDefined();
        expect(
          source.split(宣言!.作る所).length - 1,
          `${file} の ${値} を作る所で言語を当てていない (${宣言!.作る所} が ${宣言!.回数} か所に無い)`,
        ).toBe(宣言!.回数);
      }
    }
    // 見本帳の図を描く入口は 一覧と拡大 (2) / 編集画面の図と部品の一覧 (2) / トップ (3) / プリセット詳細 (1) の 8 か所
    expect(見た数, "入口の数が変わった。 足した入口が言語を当てているか見てから数を直す").toBe(8);
  });

  it("変数で渡す入口の宣言が実物に残っている", () => {
    for (const e of 変数で渡す入口) {
      const source = 画面の記述[e.file];
      expect(source, `宣言した ${e.file} が見つからない`).toBeDefined();
      expect(渡す値の一覧(source!), `${e.file} に diagram={${e.渡す値}} が無い`).toContain(e.渡す値);
    }
  });
});
