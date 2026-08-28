/**
 * 4 図の見本が設計どおりの見た目を使う (#1464)。
 *
 * #1462 で 3 つを記法から書けるようにしたが、**見本が 1 つも使っていなかった** ので
 * 画面は変わっていなかった。 書けることと画面に出ることは別の段。
 *
 * ## 何を見るか
 *
 * 1. クラス図の関係が端の形で分かれる
 * 2. 状態図に自分へ戻る輪がある
 * 3. **端の形が 1 種類だけになっていない** = 全部同じ形だと種類を区別できない
 *
 * 3 が要点。 1 だけだと「全部三角」 の見本でも通り、区別のためという目的が消える。
 *
 * 見本は組み立て API と記法 (YAML / JSON) の 3 つで書かれている。 3 つが同じ図になることは
 * 既存の検査 (`catalog-source-parity`) が見るので、ここでは **図の中身** を見る。
 */
import { describe, it, expect } from "vitest";
import type { CdlDiagram } from "@cardenelabs/cdl";

import * as Presets from "../../../apps/playground-spa/src/topics/catalog/presets.cdl";

const mod = Presets as unknown as Record<string, unknown>;

const 図 = (名: string): CdlDiagram => {
  const d = mod[名];
  if (d === undefined) throw new Error(`見本 ${名} が無い (検査が空振りしている)`);
  return d as CdlDiagram;
};

describe("クラス図が端の形で関係を分ける (#1464)", () => {
  const d = () => 図("presetClassDiagram");

  it("矢印を 1 本以上持つ (検査が空振りしていない)", () => {
    expect(d().edges.length, "矢印が 0 本").toBeGreaterThan(0);
  });

  it("全ての矢印に端の形が付く", () => {
    const 無い = d().edges.filter((e) => e.head === undefined).map((e) => e.label);
    expect(無い, "端の形が付かない矢印がある").toEqual([]);
  });

  it("端の形が 1 種類だけになっていない", () => {
    // 全部同じ形だと、種類を示すという目的が消える
    const 形 = new Set(d().edges.map((e) => e.head));
    expect(形.size, "端の形が 1 種類しかない").toBeGreaterThan(1);
  });

  it("継ぐは三角、持つは菱", () => {
    const 引く = (語: string) => d().edges.find((e) => e.label?.includes(語))?.head;
    expect(引く("extends")).toBe("triangle");
    expect(引く("aggregates")).toBe("diamond");
  });
});

describe("状態図が自分へ戻る輪を持つ (#1464)", () => {
  const d = () => 図("presetStateMachine");

  it("矢印を 1 本以上持つ (検査が空振りしていない)", () => {
    expect(d().edges.length, "矢印が 0 本").toBeGreaterThan(0);
  });

  it("自分へ戻る輪が 1 本以上ある", () => {
    // 設計は「同じ状態に留まる」 を自己遷移で表す
    expect(d().edges.filter((e) => e.from === e.to).length, "輪が無い").toBeGreaterThan(0);
  });

  it("輪に語が付く (何の再試行か読める)", () => {
    const 輪 = d().edges.find((e) => e.from === e.to);
    expect(輪?.label, "輪に語が無い").toBeTruthy();
  });

  it("自分へ戻らない矢印も残っている (全部が輪になっていない)", () => {
    // 陰性対照。 これが無いと「全部の矢印を自分へ向ける」 見本でも通る
    expect(d().edges.filter((e) => e.from !== e.to).length, "普通の矢印が無い").toBeGreaterThan(0);
  });
});
