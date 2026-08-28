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

  /**
   * 設計 (「箱と行と関係」) が決めた 6 種と、両端の形 / 塗り / 線の種類。
   *
   * **印が付く側が種類で違う**。 継ぐ / 満たす は着き先 (親) に三角、持つ / 抱える は
   * 出どころ (全体) に菱、使う / 結ぶ は着き先に開いた矢。 同じ形どうしは線の種類か塗りで
   * 分かれる = 6 種が 6 通りの見た目になる。
   */
  const 設計の6種: readonly [語: string, 端: string, 塗り: string, 線: string][] = [
    ["EXTENDS", "head:triangle", "hollow", "solid"],
    ["IMPLEMENTS", "head:triangle", "hollow", "dashed"],
    ["HAS", "tail:diamond", "hollow", "solid"],
    ["OWNS", "tail:diamond", "solid", "solid"],
    ["LINKS", "head:open", "solid", "solid"],
    ["USES", "head:open", "solid", "dashed"],
  ];

  it("設計の6種が全て図にあり、決めた見た目で出る", () => {
    // 語で引くのは、組み立て済みの図が種類 (`ClassRelationType`) を残さないため。
    // 説明の語だけが読み手に届く手掛かりになる
    const 引く = (語: string) => {
      const e = d().edges.find((x) => x.label === 語);
      if (e === undefined) return undefined;
      // 印が立つ側と、その側の塗りを組で返す = 片側だけ見ると、印が反対側に付いても通る
      const 端 = e.tailHead !== undefined && e.tailHead !== "none" ? `tail:${e.tailHead}` : `head:${e.head}`;
      const 塗り = 端.startsWith("tail:") ? (e.tailHeadFill ?? "solid") : (e.headFill ?? "solid");
      return [端, 塗り, e.style ?? "solid"];
    };
    const 実物 = 設計の6種.map(([語]) => [語, ...(引く(語) ?? [])]);
    expect(実物, "設計の6種と食い違う").toEqual(設計の6種.map(([語, 端, 塗り, 線]) => [語, 端, 塗り, 線]));
  });

  it("6 種が 6 通りの見た目になる (2 つが同じ絵にならない)", () => {
    // 形だけで分けると 3 通りに畳まる。 塗りと線の種類まで含めて初めて 6 種が分かれる
    const 見た目 = d()
      .edges.filter((e) => 設計の6種.some(([語]) => 語 === e.label))
      .map((e) => `${e.tailHead ?? "none"}/${e.tailHeadFill ?? "solid"}|${e.head}/${e.headFill ?? "solid"}|${e.style ?? "solid"}`);
    expect(見た目.length, "関係を 1 本も測れていない (検査が空振りしている)").toBe(6);
    expect(new Set(見た目).size, "同じ絵になる関係がある").toBe(6);
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
