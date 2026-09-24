/*
 * 出来事の相手が解けない時、 原因を 2 つに分けて知らせる (#2336)。
 *
 * 記法は押した時に動く仕掛けを `events:` で書ける。 相手が解けないと知らせが出るが、
 * **名前を間違えた時と、この図種が箱を作らない時が同じ 1 つの知らせだった**。
 * 後者では知らせが案内する「箱の名前で書く」 を既にやっているため、書き直しても直らない。
 *
 * 実測 = 24 図種のうち `box:` が付くのは 7 図種で、残る 17 図種は登場人物を箱にしない
 * (値を並べる図種は図全体で 1 つの箱、 `sequence` と `solidity` は 1 枚の板)。
 *
 * **付く図種の一覧は手で並べない**。 この検査が全図種を組み立てて実際に測り、
 * 測った結果と知らせの種類を突き合わせる。 手で並べると、図種を足した日に一覧だけが古くなる。
 */
import { describe, expect, it } from "vitest";
import { compileToCdl } from "../src/compile";
import type { CompileNotice } from "../src/compile/notice";
import { parseTextDslV05, PRESET_TYPES } from "../src/v05/parser";

const 全図種 = [...PRESET_TYPES];

type 測った結果 = {
  付いた: boolean;
  知らせ: CompileNotice[];
};

/**
 * 1 図種を組み立てて、出来事が図に載ったかと出た知らせを返す。
 *
 * `相手` は `events:` の中括弧にそのまま入る字 (`box: Client` 等)。
 */
function 測る(type: string, 相手: string): 測った結果 {
  const src = `type: ${type}
title: "測り"
states:
  Client: 40
  Server: 60
actors:
  - Client
  - Server
flow:
  - Client -> Server: "おくる"
events:
  - { on: click, ${相手}, handler: toggle }
`;
  const parsed = parseTextDslV05(src);
  if (!parsed.ok) throw new Error(`${type}: ${parsed.errors.map((x) => x.message).join(" / ")}`);
  const 知らせ: CompileNotice[] = [];
  const diagram = compileToCdl(parsed.doc, { onNotice: (n) => 知らせ.push(n) });
  return { 付いた: (diagram.eventBindings ?? []).length > 0, 知らせ };
}

const 出来事の知らせ = (r: 測った結果): CompileNotice[] =>
  r.知らせ.filter((n) => n.kind.startsWith("event-target-"));

/** 実際に組み立てて測った、相手が付く図種と付かない図種 */
function 測って分ける(相手: string): { 付く: string[]; 付かない: string[] } {
  const 付く: string[] = [];
  const 付かない: string[] = [];
  for (const t of 全図種) (測る(t, 相手).付いた ? 付く : 付かない).push(t);
  return { 付く, 付かない };
}

describe("書いた名前が正しいのに付かない時は、書き直しでは直らないと知らせる (#2336)", () => {
  it("全図種を走査できている (空振り防止)", () => {
    // 0 図種だと下の検査が全部「差が無い」 で通る
    expect(全図種.length, "図種を 1 つも走査できていない").toBeGreaterThan(0);
    const 分けた = 測って分ける("box: Client");
    expect(
      分けた.付く.length,
      `走査 ${全図種.length} 図種 / 付く ${分けた.付く.join(" ")}`,
    ).toBeGreaterThan(0);
    expect(
      分けた.付かない.length,
      `走査 ${全図種.length} 図種 / 付かない ${分けた.付かない.join(" ")}`,
    ).toBeGreaterThan(0);
  });

  it.each([
    ["箱", "box: Client"],
    ["矢印", "arrow: Client -> Server"],
  ])("%s を指して付かない図種は、全て『この図種では付かない』 と知らせる", (_名, 相手) => {
    const { 付かない } = 測って分ける(相手);
    const 種類 = Object.fromEntries(
      付かない.map((t) => [t, 出来事の知らせ(測る(t, 相手)).map((n) => n.kind).join("/")]),
    );
    const 期待 = Object.fromEntries(付かない.map((t) => [t, "event-target-not-honored"]));
    expect(種類, `付かない ${付かない.length} 図種`).toEqual(期待);
  });

  it.each([
    ["箱", "box: Client"],
    ["矢印", "arrow: Client -> Server"],
  ])("%s を指して付く図種では、知らせが 1 件も出ない (対照)", (_名, 相手) => {
    const { 付く } = 測って分ける(相手);
    const 出た = Object.fromEntries(
      付く.map((t) => [t, 出来事の知らせ(測る(t, 相手)).map((n) => n.kind)]),
    );
    expect(出た).toEqual(Object.fromEntries(付く.map((t) => [t, []])));
  });

  it("名前が登場人物に無い時は、これまでどおり『見つからない』 と知らせる", () => {
    // 箱を作る図種で綴りを間違えた形。 種類が入れ替わると、書き直せば直る件まで
    // 「この図種では付かない」 と案内してしまう
    const 出た = 出来事の知らせ(測る("flow", "box: 居ない箱"));
    expect(出た.map((n) => n.kind)).toEqual(["event-target-missing"]);
  });

  it("矢印の端が本文に無い時も『見つからない』 と知らせる", () => {
    const 出た = 出来事の知らせ(測る("flow", "arrow: Client -> 居ない箱"));
    expect(出た.map((n) => n.kind)).toEqual(["event-target-missing"]);
  });

  it("『この図種では付かない』 の知らせは、書き直しでは直らないことを書く", () => {
    const 出た
      = 出来事の知らせ(測る("pie", "box: Client"));
    expect(出た.length, "知らせが 1 件でない").toBe(1);
    const n = 出た[0]!;
    expect(n.kind).toBe("event-target-not-honored");
    // 図種の名前を出す = どの図種の話かが読み手に分かる
    expect(n.message, `本文: ${n.message}`).toContain("pie");
    // 「名前を書き直せ」 と読めない案内にする
    expect(n.hint ?? "", `補足: ${n.hint ?? ""}`).not.toContain("箱の名前");
    expect((n.hint ?? "").length, "補足が空").toBeGreaterThan(0);
  });

  it("知らせた出来事は図に載らない", () => {
    // 描画側は知らない識別子を黙って無視する。 残すと「押しても何も起きない」 だけが残る
    expect(測る("pie", "box: Client").付いた).toBe(false);
  });

  it("図そのものを指す形は、全図種で付く (この直しの対象外だと固定する)", () => {
    const 図 = 全図種.filter((t) => 測る(t, "diagram: true").付いた);
    expect(図, "図そのものを指す形が付かない図種がある").toEqual(全図種);
    // `lanes:` を書かない形では縦列が図種ごとに決まるため、図そのものだけを固定する。
    // 縦列の側は「0 以上」 を見ていたが、数え上げた値は常に 0 以上なので消した (#2500)。
    // その時に数え上げだけが残り、書き方の検査が「使っていない値」 として拾っていた (#2515)。
    // 題からも縦列を外す = 確かめていないものを題が約束したままになるため
  });
});
