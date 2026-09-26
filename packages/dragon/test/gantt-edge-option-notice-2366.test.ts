/*
 * ガントチャートで、矢印に書いた飾りが黙って消えないことを見る (#2366)。
 *
 * ガントチャートの矢印は前後の関係 (どちらが先か) だけを使い、飾りを載せる先が無い。
 * 効かないことを伝える仕組みは元からあったが **伝える欄を手で並べていた** ため、
 * 後から足した項目がどこにも入っていなかった
 * (実測 = 矢印に書ける 21 項目のうち 17 件が、図も変わらず知らせも出ない)。
 *
 * 板の図 (#2356) と木と思考の地図 (#2364) は同じ形で直してある。
 *
 * ## 項目を手で並べない
 *
 * 走査は `FLOW_INLINE_KEYS` を回す。 項目を足した日に、検査だけが古い一覧のまま通ることを防ぐ。
 * 値だけはこちらで持ち、覆えていない項目を別の検査が落とす。
 */
import { isDeepStrictEqual } from "node:util";
import { describe, expect, it } from "vitest";
import { compileToCdl } from "../src/compile";
import { FLOW_INLINE_KEYS, parseTextDslV05 } from "../src/v05/parser";

/** 項目ごとに書く値。 一覧は `FLOW_INLINE_KEYS` (実装が SSOT) から導き、値だけここで持つ */
const 値: Record<string, string> = {
  sub: "1",
  tailSub: "1",
  guard: "ok",
  cardinality: "1..*",
  role: "main",
  labelPlate: "false",
  side: "top",
  head: "open",
  tailHead: "diamond",
  headFill: "hollow",
  tailHeadFill: "hollow",
  relation: "aggregates",
  kind: "return",
  widthBind: "{あたい}",
  strokeBind: "{あたい}",
  dashOffsetBind: "{あたい}",
  fromPartNode: "x",
  toPartNode: "x",
  labelOffsetX: "30",
  labelOffsetY: "30",
  overlay: "true",
};

/**
 * 既に別の知らせが受け持つ項目と、その知らせ (実測)。
 *
 * 多重度 (`cardinality`) は入れない = 同じ行に 2 件並べない決まりがあり、
 * ガントチャートでは自分の知らせが先に出るため、多重度もそちらに含める。
 */
const 別の知らせ: Record<string, string> = {
  fromPartNode: "part-node-ignored",
  toPartNode: "part-node-ignored",
};

function 本文(書く: string): string {
  return `title: "工程の並び"
type: gantt

actors:
  - 設計: "Q1"
  - 実装: "Q2"
  - 検証: "Q3"

flow:
  - 設計 -> 実装: ""${書く === "" ? "" : ` { ${書く} }`}
  - 実装 -> 検証: ""
`;
}

type 結果 = { 図: unknown; 知: { kind: string; message: string }[] };

function 組む(src: string): 結果 {
  const p = parseTextDslV05(src);
  if (!p.ok) throw new Error(`読めない本文: ${p.errors.map((e) => e.message).join(" / ")}`);
  const 知: { kind: string; message: string }[] = [];
  const d = compileToCdl(p.doc, { onNotice: (n) => 知.push({ kind: n.kind, message: n.message }) });
  return { 図: d, 知 };
}

/** 書いた飾りが図を変えるか、効かないと伝えるか、黙って消えるか */
function 区分(書く: string): "効く" | "知らせる" | "黙って消える" {
  const 素 = 組む(本文(""));
  const 付き = 組む(本文(書く));
  if (!isDeepStrictEqual(素.図, 付き.図)) return "効く";
  return 付き.知.length > 素.知.length ? "知らせる" : "黙って消える";
}

describe("ガントチャートで、矢印の飾りが黙って消えない (#2366)", () => {
  it("矢印に書ける項目を走査できている (空振り防止)", () => {
    expect(FLOW_INLINE_KEYS.length, "矢印の項目を 1 件も拾えていない").toBeGreaterThan(0);
  });

  it("走査する項目すべてに書く値を用意している", () => {
    const 無い = FLOW_INLINE_KEYS.filter((k) => !(k in 値));
    expect(無い, `項目 ${FLOW_INLINE_KEYS.length} 件`).toEqual([]);
  });

  it("書いた飾りが、黙って消えない", () => {
    const 消えた = FLOW_INLINE_KEYS.filter((k) => 区分(`${k}: ${値[k]}`) === "黙って消える");
    expect(消えた, `項目 ${FLOW_INLINE_KEYS.length} 件`).toEqual([]);
  });

  it("矢印に書いた文字も、黙って消えない", () => {
    // 文字は中括弧ではなく矢印の行に書くため `FLOW_INLINE_KEYS` に現れない (#2364 で踏んだ形)
    const 素 = 組む(本文(""));
    const 付き = 組む(本文("").replace(/-> 実装: ""/, '-> 実装: "つぎ"'));
    const 消えた = isDeepStrictEqual(素.図, 付き.図) && 付き.知.length === 素.知.length;
    expect(消えた, "矢印の文字が黙って消えた").toBe(false);
  });

  it("空の文字は、書いていない扱いにする", () => {
    // 記法は矢印の行に必ず文字の欄を作る。 空でも「書いた」 とみなすと全ての矢印に知らせが出る
    expect(組む(本文("")).知.filter((n) => n.kind === "edge-option-not-honored")).toEqual([]);
  });

  it("1 本の矢印に知らせが 2 件並ばない", () => {
    const 重なった = FLOW_INLINE_KEYS.map((k) => ({ k, 知: 組む(本文(`${k}: ${値[k]}`)).知 }))
      .filter(({ 知 }) => 知.length > 1)
      .map(({ k, 知 }) => `${k} で ${知.map((n) => n.kind).join(" + ")}`);
    expect(重なった, `項目 ${FLOW_INLINE_KEYS.length} 件`).toEqual([]);
  });

  it("別の知らせが受け持つ項目で、その知らせが出ている", () => {
    // 受け持つ側が消えたら、除外だけが残って黙って落ちる状態に戻る
    const 出ない = Object.entries(別の知らせ)
      .filter(([k, 種]) => !組む(本文(`${k}: ${値[k]}`)).知.some((n) => n.kind === 種))
      .map(([k, 種]) => `${k} に ${種} が出ない`);
    expect(出ない, `項目 ${Object.keys(別の知らせ).length} 件`).toEqual([]);
  });

  it("伝える欄を手で並べていない", () => {
    /*
     * 矢印が描く欄を **除いた残り全部** を伝える形なら、知らない欄を 1 つ足しても伝わる。
     * 項目を並べた形だと、ここで足した欄が一覧に無いので素通りする。
     */
    const p = parseTextDslV05(本文(""));
    if (!p.ok) throw new Error("素の本文が読めない");
    const flow = p.doc.flow.slice();
    flow[0] = { ...flow[0]!, ["未知の飾り" as never]: "あたい" as never };
    const 知: string[] = [];
    compileToCdl({ ...p.doc, flow }, { onNotice: (n) => 知.push(n.kind) });
    expect(知.filter((k) => k === "edge-option-not-honored").length, "知らない欄が素通りした").toBe(
      1,
    );
  });

  it("時期を読めない帯を結ぶ矢印では、飾りの知らせを重ねない (植え込み対照)", () => {
    /*
     * 時期の無い名前を指す矢印は、組み立てが別の知らせ (`chart-edge-dropped`) で伝えている。
     * そこへ飾りの知らせを足すと同じ行に 2 件並ぶ。
     */
    const src = `title: "工程の並び"
type: gantt

actors:
  - 設計: "Q1"
  - 予備

flow:
  - 設計 -> 予備: "" { head: open }
`;
    const 知 = 組む(src).知.filter((n) => n.message.includes("設計 -> 予備"));
    expect(知.map((n) => n.kind)).toEqual(["chart-edge-dropped"]);
  });
});
