/*
 * 木の図で、箱に書いた指定が黙って消えないことを見る (#2360)。
 *
 * 木の図は箱を階層の節として描き、位置も大きさも親子関係から決める。 箱ごとの飾りを
 * 載せる先が無いのは設計どおりだが、**書いても知らせが出なかった** (実測 = 箱に書ける
 * 31 項目のうち 21 件が、図も変わらず知らせも出ない)。
 *
 * 板の図は同じ形で直してある (#2356 / #2358)。
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

/** 木の図で図に効く項目 (実測) */
const 効くはず = ["title", "subtitle", "value"] as const;

/** 既に別の知らせが受け持つ項目と、その知らせ (実測) */
const 別の知らせ: Record<string, string> = {
  lane: "lane-not-honored",
  offsetX: "position-offset-ignored",
  offsetY: "position-offset-ignored",
  owner: "chart-value-unreadable",
  end: "chart-value-unreadable",
  touchpoint: "chart-value-unreadable",
  opportunity: "chart-value-unreadable",
};

function 本文(書く: string, 図種 = "tree"): string {
  return `title: "木の図"
type: ${図種}

actors:
  - おや
  - こ${書く === "" ? "" : `: { ${書く} }`}
  - まご

flow:
  - おや -> こ: ""
  - こ -> まご: ""
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
function 区分(書く: string): "効く" | "知らせる" | "黙って消える" {
  const 素 = 組む(本文(""));
  const 付き = 組む(本文(書く));
  if (!isDeepStrictEqual(素.図, 付き.図)) return "効く";
  return 付き.知.length > 素.知.length ? "知らせる" : "黙って消える";
}

describe("木の図で、箱に書いた指定が黙って消えない (#2360)", () => {
  it("箱に書ける項目を走査できている (空振り防止)", () => {
    expect(項目.length, "箱の項目を 1 件も拾えていない").toBeGreaterThan(0);
  });

  it("走査する項目すべてに書く値を用意している", () => {
    const 無い = 項目.filter((k) => !(k in 値));
    expect(無い, `項目 ${項目.length} 件`).toEqual([]);
  });

  it("外した項目が 1 件ずつ理由を持つ", () => {
    for (const [項目名, 理由] of Object.entries(走査から外す)) {
      expect(理由.length, `${項目名} の理由が空`).toBeGreaterThan(0);
      expect(INLINE_ACTOR_KEYS.has(項目名), `${項目名} は箱の項目ではない`).toBe(true);
    }
  });

  it("書いた指定が、黙って消えない", () => {
    const 消えた = 項目.filter((k) => 区分(`${k}: ${値[k]}`) === "黙って消える");
    expect(消えた, `項目 ${項目.length} 件`).toEqual([]);
  });

  it("図に効く項目には、効かないと伝えない", () => {
    // 全部に知らせを出せば上の検査は通る。 効く項目まで巻き込んでいないことを別に見る
    const 違う = 効くはず
      .map((k) => ({ k, 区: 区分(`${k}: ${値[k]}`) }))
      .filter(({ 区 }) => 区 !== "効く")
      .map(({ k, 区 }) => `${k} が ${区}`);
    expect(違う, `効くはずの項目 ${効くはず.length} 件`).toEqual([]);
  });

  it("種類を書かない箱には、効かないと伝えない", () => {
    /*
     * 種類は書かなくても既定 (`actor`) が入るため、欄の値だけを見ると全ての箱が
     * 「種類を書いた」 ことになる (#1058 が同じ理由で書いたかどうかの印を足した)。
     */
    expect(組む(本文("")).知, "何も書かない図に知らせが出た").toEqual([]);
  });

  it("既に別の知らせが受け持つ項目で、知らせが 2 件にならない", () => {
    const 重なった = Object.entries(別の知らせ)
      .map(([k, 種]) => ({ k, 種, 知: 組む(本文(`${k}: ${値[k]}`)).知 }))
      .filter(({ 知 }) => 知.length > 1)
      .map(({ k, 知 }) => `${k}: ${知.map((n) => n.kind).join(" + ")}`);
    expect(重なった, `項目 ${Object.keys(別の知らせ).length} 件`).toEqual([]);
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
     * 木の図が描く欄を **除いた残り全部** を伝える形なら、知らない欄を 1 つ足しても伝わる。
     * 項目を並べた形だと、ここで足した欄が一覧に無いので素通りする。
     */
    const p = parseTextDslV05(本文(""));
    if (!p.ok) throw new Error("素の本文が読めない");
    const actors = p.doc.actors.slice();
    actors[1] = { ...actors[1]!, ["未知の飾り" as never]: "あたい" as never };
    const 知: string[] = [];
    compileToCdl({ ...p.doc, actors }, { onNotice: (n) => 知.push(n.kind) });
    expect(知.filter((k) => k === "actor-option-not-honored").length, "知らない欄が素通りした").toBe(
      1,
    );
  });

  it("木でない図種では、伝える欄がはっきり少ない (植え込み対照)", () => {
    /*
     * 図種を問わず伝える形に壊れていると、上の検査は何を書いても通る。
     *
     * **件数を検査に写さない** (#2376)。 流れ図も始まりの印などを伝えるようになったので
     * 「0 件」 では対照にならない。 木の図が伝える欄の数が流れ図より真に多いことを見る。
     * 集合の包含までは見ない = 読む欄は図種ごとに違うので、流れ図だけが伝える欄は在りうる。
     */
    const 伝える = (図種: string): string[] =>
      項目.filter((k) =>
        組む(本文(`${k}: ${値[k]}`, 図種)).知.some((n) => n.kind === "actor-option-not-honored"),
      );
    const 木 = 伝える("tree");
    const 流れ = 伝える("flow");
    expect(流れ.length, `流れ図が伝える欄 ${流れ.join(" ")}`).toBeLessThan(木.length);
  });
});
