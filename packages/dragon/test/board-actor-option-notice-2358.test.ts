/*
 * 板の図で、箱に書いた指定が黙って消えないことを見る (#2358)。
 *
 * 順序図と Solidity の図は登場人物を **板の中の行** として描くため、箱に付く指定を載せる先が無い。
 * 効かないことを伝える仕組みはあったが、**伝える欄を手で並べていた** ため後から足した項目が
 * 入っていなかった (実測 = 箱に書ける 32 項目のうち 11 件が、図も変わらず知らせも出ない)。
 *
 * 矢印の側は同じ形で直してある (#2356)。
 *
 * ## 項目を手で並べない
 *
 * 走査は `INLINE_ACTOR_KEYS` を回す。 項目を足した日に、検査だけが古い一覧のまま通ることを防ぐ。
 * 値だけはこちらで持ち、覆えていない項目を別の検査が落とす。
 */
import { isDeepStrictEqual } from "node:util";
import { describe, expect, it } from "vitest";
import { compileToCdl } from "../src/compile";
import { INLINE_ACTOR_KEYS, parseTextDslV05 } from "../src/v05/parser";

/** 登場人物を板で描く図種 */
const 板の図種 = ["sequence", "solidity"] as const;

/**
 * 走査から外す項目と、その理由。
 *
 * **理由を同じ場所に書く**。 別 file に分けると片方だけ直って食い違う。
 */
const 走査から外す: Record<string, string> = {
  倍率: "部品の箱でだけ読める。 部品でない箱では書き方を問わず「項目名が読めません」 で落ちる (#1026)",
  scale: "`倍率` の英語名。 同じ理由",
};

/** 項目ごとに書く値。 一覧は `INLINE_ACTOR_KEYS` (実装が SSOT) から導き、値だけここで持つ */
const 値: Record<string, string> = {
  kind: "service",
  title: '"だい"',
  subtitle: '"ほそく"',
  eyebrow: '"めじるし"',
  tone: "error",
  color: "error",
  rows: "[いち, に]",
  marks: "start",
  value: "10",
  previous: "5",
  lane: "l1",
  stack: "0",
  initial: "true",
  final: "true",
  shape: "{ kind: rect, source: 10, fillMax: 100 }",
  visibleIf: "x > 1",
  opacity: "0.5",
  owner: '"わたし"',
  end: '"5月"',
  touchpoint: '"まどぐち"',
  opportunity: '"のびしろ"',
  posX: "100",
  posY: "100",
  posW: "900",
  posH: "400",
  offsetX: "10",
  offsetY: "10",
  wBind: '"{v}"',
  hBind: '"{v}"',
  renderOffsetX: '"{v}"',
  renderOffsetY: '"{v}"',
};

/**
 * 走査する項目。
 *
 * 日本語の別名は英語名と同じ欄に入るので、英字の名前だけを回す
 * (同じ欄を 2 度測っても新しいことは分からない)。
 */
const 項目 = [...INLINE_ACTOR_KEYS]
  .filter((k) => /^[a-zA-Z]/.test(k) && !Object.hasOwn(走査から外す, k))
  .sort();

function 本文(図種: string, 項目: string): string {
  return `title: "板の箱"
type: ${図種}

actors:
  - 受け口${項目 === "" ? "" : `: { ${項目} }`}
  - 記録

flow:
  - 受け口 -> 記録: "書く"
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

/** 書いた指定が図を変えるか、効かないと伝えるか、黙って消えるか */
function 区分(図種: string, 書く: string): "効く" | "知らせる" | "黙って消える" {
  const 素 = 組む(本文(図種, ""));
  const 付き = 組む(本文(図種, 書く));
  if (!isDeepStrictEqual(素.図, 付き.図)) return "効く";
  return 付き.知.length > 素.知.length ? "知らせる" : "黙って消える";
}

describe("板の図で、箱に書いた指定が黙って消えない (#2358)", () => {
  it("箱に書ける項目を走査できている (空振り防止)", () => {
    expect(項目.length, "箱の項目を 1 件も拾えていない").toBeGreaterThan(0);
  });

  it("走査する項目すべてに書く値を用意している", () => {
    // 値が無い項目は測られないまま「黙って消える 0 件」 に数えられてしまう
    const 無い = 項目.filter((k) => !(k in 値));
    expect(無い, `項目 ${項目.length} 件`).toEqual([]);
  });

  it("走査から外した項目が、実際に書き方を問わず読めない", () => {
    // 外した理由が古くなったら落ちる。 読めるようになったら走査に戻す
    const 読めた = Object.keys(走査から外す).filter((k) => {
      const p = parseTextDslV05(本文("sequence", `${k}: 1.5`));
      return p.ok;
    });
    expect(読めた, "外した項目が読めるようになっている").toEqual([]);
  });

  it("外した項目が 1 件ずつ理由を持つ", () => {
    for (const [項目名, 理由] of Object.entries(走査から外す)) {
      expect(理由.length, `${項目名} の理由が空`).toBeGreaterThan(0);
      expect(INLINE_ACTOR_KEYS.has(項目名), `${項目名} は箱の項目ではない`).toBe(true);
    }
  });

  it("書いた指定が、黙って消えない", () => {
    const 消えた = 板の図種.flatMap((t) =>
      項目.filter((k) => 区分(t, `${k}: ${値[k]}`) === "黙って消える").map((k) => `${t}: ${k}`),
    );
    expect(消えた, `図種 ${板の図種.length} 件 × 項目 ${項目.length} 件`).toEqual([]);
  });

  it("図に効く項目には、効かないと伝えない", () => {
    // 全部に知らせを出せば上の検査は通る。 効く項目まで巻き込んでいないことを別に見る
    const 効くはず: Record<string, readonly string[]> = {
      // 種類は Solidity では面の並びを決めるので、絵にならなくても書いた意味が出ている (#1466)
      sequence: ["title", "subtitle"],
      solidity: ["title", "subtitle", "kind"],
    };
    const 違う = 板の図種.flatMap((t) =>
      効くはず[t]!
        .map((k) => ({ k, 区: 区分(t, `${k}: ${値[k]}`) }))
        .filter(({ 区 }) => 区 !== "効く")
        .map(({ k, 区 }) => `${t}: ${k} が ${区}`),
    );
    expect(違う, `図種 ${板の図種.length} 件`).toEqual([]);
  });

  it("種類を書かない箱には、効かないと伝えない", () => {
    /*
     * 種類は書かなくても既定 (`actor`) が入るため、欄の値だけを見ると全ての箱が
     * 「種類を書いた」 ことになる (#1058 が同じ理由で書いたかどうかの印を足した)。
     */
    const 出た = 板の図種.filter((t) =>
      組む(本文(t, "")).知.some((n) => n.kind === "actor-kind-not-honored"),
    );
    expect(出た, `図種 ${板の図種.length} 件`).toEqual([]);
  });

  it("1 つの箱に、効かないと伝える知らせを 2 件出さない", () => {
    const 重なった = 板の図種.flatMap((t) =>
      項目
        .map((k) => ({ k, 知: 組む(本文(t, `${k}: ${値[k]}`)).知 }))
        .filter(({ 知 }) => 知.filter((n) => n.kind === "actor-kind-not-honored").length > 1)
        .map(({ k, 知 }) => `${t}: ${k} で ${知.length} 件`),
    );
    expect(重なった, `図種 ${板の図種.length} 件 × 項目 ${項目.length} 件`).toEqual([]);
  });

  it("伝える欄を手で並べていない", () => {
    /*
     * 板が描く欄を **除いた残り全部** を伝える形なら、知らない欄を 1 つ足しても伝わる。
     * 項目を並べた形だと、ここで足した欄が一覧に無いので素通りする。
     */
    const p = parseTextDslV05(本文("sequence", ""));
    if (!p.ok) throw new Error("素の本文が読めない");
    const actors = p.doc.actors.slice();
    actors[0] = { ...actors[0]!, ["未知の飾り" as never]: "あたい" as never };
    const 知: string[] = [];
    compileToCdl({ ...p.doc, actors }, { onNotice: (n) => 知.push(n.kind) });
    expect(知.filter((k) => k === "actor-kind-not-honored").length, "知らない欄が素通りした").toBe(
      1,
    );
  });

  it("板でない図種では、同じ指定を伝えない (植え込み対照)", () => {
    // 図種を問わず伝える形に壊れていると、上の検査は何を書いても通る
    const 出た = 項目.filter((k) =>
      組む(本文("flow", `${k}: ${値[k]}`)).知.some((n) => n.kind === "actor-kind-not-honored"),
    );
    expect(出た, `項目 ${項目.length} 件`).toEqual([]);
  });
});
