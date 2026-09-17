/**
 * 順序図の板を持つ見本が、段を追って 1 通ずつ言づてを進めること (#2133)。
 *
 * 板は段が書いた番号の言づてを強調し、それより前を描き済みとして残し、後ろを隠す。
 * 番号を導く決まりは `packages/dragon/test/sequence-step-from-focus.test.ts` が見ている。
 * ここで見るのは **見本がその決まりの上で筋どおりに動くか**。
 *
 * 決まりが直っていても、見本の `focus:` が言づての並びと食い違えば板は題と違う言づてを
 * 強調する。 実測で、段の並びが言づてと逆の見本 (`csrfToken`) と、最後の言づてに届かない
 * 見本 (エディタの投票の見本) があった。
 *
 * ## 何を見るか
 *
 * | 見ること | 落ちる形 |
 * |---|---|
 * | 段ごとに番号が前の段より大きい | 板が進まない段 / 巻き戻る段がある |
 * | 最後の段が最後の言づてを強調する | 最後まで描かずに動きが終わる |
 * | 決まりが働く見本の強調する言づて | 段の題と違う言づてを強調する |
 */
import { describe, it, expect } from "vitest";
import { sequenceStepId } from "@cardenelabs/cdl";
import type { CdlDiagram } from "@cardenelabs/cdl";
import { textDslToDiagram } from "@cardenelabs/dragon";

import { CATALOG_ITEMS, loadPartsItems } from "./catalog-items";
import { EDITOR_SAMPLES } from "@/data/editor-samples";
import * as Cookbook from "@/topics/catalog/cookbook.cdl";
import * as Presets from "@/topics/catalog/presets.cdl";

type 板 = { kind?: string; sequenceData?: { messages: { label: string }[] }; sequenceStep?: string };

/** 図の板の言づてと、段ごとの番号を取り出す。 板を持たない図は `undefined` */
function 板の動き(図: CdlDiagram): { 言づて: string[]; 番号: number[] } | undefined {
  const b = (図.nodes as unknown as 板[]).find((n) => n.kind === "sequence-board");
  if (!b?.sequenceData || !b.sequenceStep) return undefined;
  return {
    言づて: b.sequenceData.messages.map((m) => m.label),
    番号: 図.phases.map((p) => {
      const s = p.sets.find((x) => x.stateId === sequenceStepId());
      if (s === undefined) throw new Error(`${図.id} の段 ${p.title} が板の番号を書いていない`);
      return Number(s.value);
    }),
  };
}

/** 段ごとに強調する言づての札 */
function 強調(図: CdlDiagram): string[] {
  const 動き = 板の動き(図);
  if (!動き) throw new Error(`${図.id} に順序図の板が無い (見本の図種が変わった)`);
  return 動き.番号.map((i) => 動き.言づて[i]!);
}

async function 全ての見本(): Promise<{ 名: string; 図: CdlDiagram }[]> {
  const 部品 = await loadPartsItems();
  const 頁 = [...Object.values(CATALOG_ITEMS).flat(), ...部品];
  return [
    ...頁.flatMap((item) => [
      { 名: `${item.id}`, 図: item.diagram },
      ...(item.patterns ?? []).map((p) => ({ 名: `${item.id} / ${p.名}`, 図: p.diagram })),
    ]),
    ...EDITOR_SAMPLES.map((s) => ({ 名: `編集画面 / ${s.label}`, 図: textDslToDiagram(s.code) })),
  ];
}

describe("順序図の板を持つ見本が段を追って進む (#2133)", () => {
  it("段ごとに番号が前の段より大きく、最後の段が最後の言づてを強調する", async () => {
    const 見本 = await 全ての見本();
    const 板あり = 見本.flatMap(({ 名, 図 }) => {
      const 動き = 板の動き(図);
      return 動き && 動き.番号.length >= 2 && 動き.言づて.length >= 2 ? [{ 名, ...動き }] : [];
    });
    // 板を持つ見本が拾えていなければ下の検査は空振りする
    expect(板あり.map((x) => x.名), "板を持つ見本を拾えていない").toEqual(
      expect.arrayContaining(["sse-stream", "編集画面 / 投票コントラクト (solidity)"]),
    );

    const 進まない = 板あり
      .filter(({ 番号 }) => 番号.some((x, i) => i > 0 && x <= 番号[i - 1]!))
      .map(({ 名, 番号 }) => `${名} ${JSON.stringify(番号)}`);
    expect(進まない, "前の段より進まない段を持つ見本").toEqual([]);

    const 届かない = 板あり
      .filter(({ 番号, 言づて }) => 番号[番号.length - 1] !== 言づて.length - 1)
      .map(({ 名, 番号, 言づて }) => `${名} ${JSON.stringify(番号)} / 言づて ${言づて.length} 通`);
    expect(届かない, "最後の言づてまで描かずに終わる見本").toEqual([]);
  });

  describe("段の題と強調する言づてが合う", () => {
    it("同じ 2 者の言づてが続いても 1 通ずつ進む (sseStream)", () => {
      expect(板の動き(Cookbook.sseStream)?.番号).toEqual([0, 1, 2, 3]);
    });

    it("箱の名前で書いた契約の図が 1 通ずつ進む (tokenTransferSolidity)", () => {
      expect(板の動き(Cookbook.tokenTransferSolidity)?.番号).toEqual([0, 1, 2, 3]);
    });

    it("矢印で書いた見本は変わらない (presetSequence)", () => {
      expect(板の動き(Presets.presetSequence)?.番号).toEqual([0, 1, 2, 3, 4, 5, 6]);
    });

    it("箱の名前で束ねた段は束の最後を強調する (jwtAuth / rateLimit)", () => {
      expect(強調(Cookbook.jwtAuth)).toEqual(["照合", "JWT を発行", "200 中身"]);
      expect(強調(Cookbook.rateLimit)).toEqual(["200", "429 待ってから再送"]);
    });

    it("矢印と箱の名前を併記した段は矢印の言づてを強調する (websocket / retryBackoff)", () => {
      expect(強調(Cookbook.websocket)).toEqual(["接続の確立", "文面を送る", "全員へ送る"]);
      expect(強調(Cookbook.retryBackoff)).toEqual(["1 回目", "2 回目 (1 秒待つ)", "200"]);
    });

    it("段を言づての並びに揃えた見本 (csrfToken / cacheReadThrough / formSubmit / oauthFlow)", () => {
      expect(強調(Cookbook.csrfToken)).toEqual([
        "鍵を保管",
        "入力欄 + 鍵",
        "POST 入力欄 + 鍵",
        "照合",
        "200",
      ]);
      expect(強調(Cookbook.cacheReadThrough)).toEqual(["探す", "無い", "行", "60 秒だけ置く", "200"]);
      expect(強調(Cookbook.formSubmit)).toEqual(["項目を埋める", "送信", "200", "成功の知らせ"]);
      expect(強調(Cookbook.oauthFlow)).toEqual([
        "転送",
        "同意の確認",
        "許可",
        "利用の鍵",
        "鍵を添えて呼ぶ",
      ]);
    });
  });
});
