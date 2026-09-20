/*
 * 板の図で、言づてに書いた飾りが黙って消えないことを見る (#2356)。
 *
 * 順序図と Solidity の図は言づてを **板の中の行** として描くため、矢印に付く飾りを載せる先が無い。
 * 効かないことを伝える仕組みはあったが、**伝える欄を手で並べていた** ため後から足した項目が
 * 入っていなかった (実測 = 矢印に書ける 21 項目のうち 13 件が、図も変わらず知らせも出ない)。
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

/** 言づてを板で描く図種 */
const 板の図種 = ["sequence", "solidity"] as const;

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

function 本文(図種: string, 項目: string): string {
  return `title: "板の飾り"
type: ${図種}

actors:
  - ブラウザ
  - API

flow:
  - ブラウザ -> API: "注文を出す"${項目 === "" ? "" : ` { ${項目} }`}
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

/** 書いた項目が図を変えるか、効かないと伝えるか、黙って消えるか */
function 区分(図種: string, 項目: string): "効く" | "知らせる" | "黙って消える" {
  const 素 = 組む(本文(図種, ""));
  const 付き = 組む(本文(図種, 項目));
  if (!isDeepStrictEqual(素.図, 付き.図)) return "効く";
  return 付き.知.length > 素.知.length ? "知らせる" : "黙って消える";
}

describe("板の図で、言づてに書いた飾りが黙って消えない (#2356)", () => {
  it("矢印に書ける項目を走査できている (空振り防止)", () => {
    expect(FLOW_INLINE_KEYS.length, "矢印の項目を 1 件も拾えていない").toBeGreaterThan(0);
  });

  it("走査する項目すべてに書く値を用意している", () => {
    // 値が無い項目は測られないまま「黙って消える 0 件」 に数えられてしまう
    const 無い = FLOW_INLINE_KEYS.filter((k) => !(k in 値));
    expect(無い, `項目 ${FLOW_INLINE_KEYS.length} 件`).toEqual([]);
  });

  it("書いた飾りが、黙って消えない", () => {
    const 消えた = 板の図種.flatMap((t) =>
      FLOW_INLINE_KEYS.filter((k) => 区分(t, `${k}: ${値[k]}`) === "黙って消える").map(
        (k) => `${t}: ${k}`,
      ),
    );
    expect(消えた, `図種 ${板の図種.length} 件 × 項目 ${FLOW_INLINE_KEYS.length} 件`).toEqual([]);
  });

  it("図に効く項目には、効かないと伝えない", () => {
    // 全部に知らせを出せば上の検査は通る。 効く項目まで巻き込んでいないことを別に見る
    const 出た = 板の図種
      .map((t) => ({ t, 区: 区分(t, `kind: ${値.kind}`) }))
      .filter(({ 区 }) => 区 !== "効く")
      .map(({ t, 区 }) => `${t}: ${区}`);
    expect(出た, `図種 ${板の図種.length} 件`).toEqual([]);
  });

  it("1 本の矢印に、効かないと伝える知らせを 2 件出さない", () => {
    const 重なった = 板の図種.flatMap((t) =>
      FLOW_INLINE_KEYS.map((k) => ({ k, 知: 組む(本文(t, `${k}: ${値[k]}`)).知 }))
        .filter(({ 知 }) => 知.filter((n) => n.kind === "message-option-not-honored").length > 1)
        .map(({ k, 知 }) => `${t}: ${k} で ${知.length} 件`),
    );
    expect(重なった, `図種 ${板の図種.length} 件 × 項目 ${FLOW_INLINE_KEYS.length} 件`).toEqual([]);
  });

  it("伝える欄を手で並べていない", () => {
    /*
     * 板が描く欄を **除いた残り全部** を伝える形なら、知らない欄を 1 つ足しても伝わる。
     * 項目を並べた形だと、ここで足した欄が一覧に無いので素通りする。
     */
    const p = parseTextDslV05(本文("sequence", ""));
    if (!p.ok) throw new Error("素の本文が読めない");
    const flow = p.doc.flow.slice();
    flow[0] = { ...flow[0]!, ["未知の飾り" as never]: "あたい" as never };
    const 知: string[] = [];
    compileToCdl({ ...p.doc, flow }, { onNotice: (n) => 知.push(n.kind) });
    expect(知.filter((k) => k === "message-option-not-honored").length, "知らない欄が素通りした").toBe(1);
  });

  it("板でない図種では、同じ飾りを伝えない (植え込み対照)", () => {
    // 図種を問わず伝える形に壊れていると、上の検査は何を書いても通る
    const 出た = FLOW_INLINE_KEYS.filter((k) =>
      組む(本文("flow", `${k}: ${値[k]}`)).知.some((n) => n.kind === "message-option-not-honored"),
    );
    expect(出た, `項目 ${FLOW_INLINE_KEYS.length} 件`).toEqual([]);
  });
});
