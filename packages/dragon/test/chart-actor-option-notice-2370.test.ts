/*
 * 工程表と体験の地図と四象限で、箱に書いた指定が黙って消えないことを見る (#2370)。
 *
 * この 3 図種は値の図と同じく箱を **名前と値の組** として読み、1 枚の図にまとめて描く。
 * 値の図とじょうごは #2368 で直したが、読む欄が違うのでこの 3 図種は対象外にしてあった。
 *
 * 実測 = 箱に書ける 30 項目と組で書く 5 種のうち、22-23 件が図も変わらず知らせも出なかった。
 *
 * ## 項目を手で並べない
 *
 * 走査は `INLINE_ACTOR_KEYS` を回す。 項目を足した日に、検査だけが古い一覧のまま通ることを防ぐ。
 *
 * ## 読む欄で鳴らさない
 *
 * 図種ごとに読む欄が違う (工程表は色味と担当と終わる時期、体験の地図は接点と伸びしろ)。
 * 読む欄に知らせが出ると、正しく効いている指定に毎回鳴る。
 */
import { isDeepStrictEqual } from "node:util";
import { describe, expect, it } from "vitest";
import { compileToCdl } from "../src/compile";
import { INLINE_ACTOR_KEYS, parseTextDslV05 } from "../src/v05/parser";

/** 図種ごとの見本。 値の語は図種で違う (時期 / 気持ち / 区画) */
const 図種: readonly { 名: string; 値: string; 読む欄: readonly string[] }[] = [
  { 名: "gantt", 値: '"1月"', 読む欄: ["tone", "owner", "end"] },
  { 名: "journey", 値: '"満足"', 読む欄: ["touchpoint", "opportunity"] },
  { 名: "quadrant", 値: '"左上"', 読む欄: [] },
];

/** 読む欄に書く値。 図種が実際に読める形で書く */
const 読む欄の値: Record<string, string> = {
  tone: "info",
  owner: '"だれか"',
  // 工程表の終わる時期は目盛りの語でないと帯が伸びない = 見本に並ぶ月を書く
  end: '"4月"',
  touchpoint: '"まど"',
  opportunity: '"のびしろ"',
};

/** 項目ごとに書く値。 一覧は `INLINE_ACTOR_KEYS` (実装が SSOT) から導き、値だけここで持つ */
const 値: Record<string, string> = {
  title: '"だい"',
  subtitle: '"そえ"',
  eyebrow: '"みだし"',
  value: "3",
  kind: "actor",
  tone: "info",
  color: '"#123456"',
  shape: "{ kind: rect, source: 10, fillMax: 100 }",
  rows: "[あ]",
  marks: "[ok]",
  stack: "1",
  lane: "main",
  initial: "true",
  final: "true",
  previous: "2",
  visibleIf: '"{あたい}"',
  opacity: "0.5",
  posX: "100",
  posY: "100",
  posW: "200",
  posH: "80",
  wBind: '"{あたい}"',
  hBind: '"{あたい}"',
  renderOffsetX: '"{あたい}"',
  renderOffsetY: '"{あたい}"',
  offsetX: "10",
  offsetY: "10",
  owner: '"だれか"',
  end: '"20"',
  touchpoint: '"まど"',
  opportunity: '"のびしろ"',
};

/**
 * 走査から外す項目と、その理由。
 *
 * 理由を別 file に分けると片方だけ直って食い違うので、項目と同じ場所に置く。
 */
const 走査から外す: Record<string, string> = {
  scale: "見本 (parts) の中でだけ読める欄で、箱に書いても記法が拾わない (#2358 で測った)",
  subtitle: "値を書いていない箱では値として読まれる欄で、効かない指定ではない",
};

const 項目 = [...INLINE_ACTOR_KEYS]
  .filter((k) => /^[a-zA-Z]/.test(k) && !Object.hasOwn(走査から外す, k))
  .sort();

/** 1 項目ずつの走査では見えない、組にして書く欄 */
const 組 = [
  ["位置", "posX: 100, posY: 100"],
  ["大きさ", "posW: 200, posH: 80"],
  ["値への追随 (大きさ)", 'wBind: "{あたい}", hBind: "{あたい}"'],
  ["値への追随 (ずらし)", 'renderOffsetX: "{あたい}", renderOffsetY: "{あたい}"'],
  ["ずらし", "offsetX: 10, offsetY: 10"],
] as const;

/** 既に別の知らせが受け持つ項目と、その知らせ (実測) */
const 別の知らせ: Record<string, string> = {
  lane: "lane-not-honored",
  offsetX: "position-offset-ignored",
  offsetY: "position-offset-ignored",
};

function 本文(図: (typeof 図種)[number], 書く: string): string {
  const 値の語 = 図.名 === "gantt" ? ['"1月"', '"2月"', '"4月"'] : [図.値, 図.値, 図.値];
  return `title: "値の図"
type: ${図.名}

actors:
  - あ: { value: ${値の語[0]}${書く === "" ? "" : `, ${書く}`} }
  - い: { value: ${値の語[1]} }
  - う: { value: ${値の語[2]} }
`;
}

type 結果 = { 図: unknown; 知: { kind: string; line: number }[] };

function 組む(src: string): 結果 {
  const p = parseTextDslV05(src);
  if (!p.ok) throw new Error(`読めない本文: ${p.errors.map((e) => e.message).join(" / ")}`);
  const 知: { kind: string; line: number }[] = [];
  const d = compileToCdl(p.doc, { onNotice: (n) => 知.push({ kind: n.kind, line: n.line }) });
  return { 図: d, 知 };
}

/** 書いた指定が図を変えるか、効かないと伝えるか、黙って消えるか */
function 区分(図: (typeof 図種)[number], 書く: string): "効く" | "知らせる" | "黙って消える" {
  const 素 = 組む(本文(図, ""));
  const 付き = 組む(本文(図, 書く));
  if (!isDeepStrictEqual(素.図, 付き.図)) return "効く";
  return 付き.知.length > 素.知.length ? "知らせる" : "黙って消える";
}

/** 最初の箱の行に出た知らせ */
function 箱の行の知らせ(図: (typeof 図種)[number], 書く: string): string[] {
  const src = 本文(図, 書く);
  const p = parseTextDslV05(src);
  if (!p.ok) throw new Error("本文が読めない");
  const 行 = p.doc.actors[0]?.pos?.line ?? -1;
  return 組む(src)
    .知.filter((n) => n.line === 行)
    .map((n) => n.kind);
}

describe("工程表と体験の地図と四象限で、箱に書いた指定が黙って消えない (#2370)", () => {
  it("箱に書ける項目を走査できている (空振り防止)", () => {
    expect(項目.length, "箱の項目を 1 件も拾えていない").toBeGreaterThan(0);
  });

  it("走査する項目すべてに書く値を用意している", () => {
    const 無い = 項目.filter((k) => !(k in 値));
    expect(無い, `項目 ${項目.length} 件`).toEqual([]);
  });

  it("見本が読める (空振り防止)", () => {
    // 値の語を図種ごとに書き分けているので、読めない本文で全検査が素通りするのを防ぐ
    const 読めない = 図種.filter((t) => 組む(本文(t, "")).知.length > 0);
    expect(
      読めない.map((t) => t.名),
      `図種 ${図種.length} 件`,
    ).toEqual([]);
  });

  it("書いた指定が、黙って消えない", () => {
    const 消えた = 図種.flatMap((t) =>
      項目
        .filter((k) => !t.読む欄.includes(k))
        .filter((k) => 区分(t, `${k}: ${値[k]}`) === "黙って消える")
        .map((k) => `${t.名}: ${k}`),
    );
    expect(消えた, `図種 ${図種.length} 件 × 項目 ${項目.length} 件`).toEqual([]);
  });

  it("組にして書いた指定も、黙って消えない", () => {
    // 位置は片方だけだと別の知らせが出るため、1 項目ずつの走査では穴が隠れる
    const 消えた = 図種.flatMap((t) =>
      組.filter(([, 書く]) => 区分(t, 書く) === "黙って消える").map(([名]) => `${t.名}: ${名}`),
    );
    expect(消えた, `図種 ${図種.length} 件 × 組 ${組.length} 件`).toEqual([]);
  });

  it("図種が読む欄には、知らせを出さない", () => {
    // 読む欄に鳴らすと、正しく効いている指定に毎回鳴る
    const 鳴った = 図種.flatMap((t) =>
      t.読む欄
        .filter((k) => 箱の行の知らせ(t, `${k}: ${読む欄の値[k]}`).length > 0)
        .map((k) => `${t.名}: ${k}`),
    );
    expect(鳴った, `図種 ${図種.length} 件`).toEqual([]);
  });

  it("図種が読む欄は、実際に図を変えている (空振り防止)", () => {
    // 読む欄に鳴らさない検査は、その欄が効かなくなっても通る。 効くことを別に見る
    const 効かない = 図種.flatMap((t) =>
      t.読む欄
        .filter((k) => 区分(t, `${k}: ${読む欄の値[k]}`) !== "効く")
        .map((k) => `${t.名}: ${k}`),
    );
    expect(効かない, `図種 ${図種.length} 件`).toEqual([]);
  });

  it("1 つの箱の行に知らせが 2 件並ばない", () => {
    const 重なった = 図種.flatMap((t) =>
      項目
        .map((k) => ({ k, 知: 箱の行の知らせ(t, `${k}: ${値[k]}`) }))
        .filter(({ 知 }) => 知.length > 1)
        .map(({ k, 知 }) => `${t.名}: ${k} で ${知.join(" + ")}`),
    );
    expect(重なった, `図種 ${図種.length} 件 × 項目 ${項目.length} 件`).toEqual([]);
  });

  it("別の知らせが受け持つ項目で、その知らせが出ている", () => {
    const 出ない = 図種.flatMap((t) =>
      Object.entries(別の知らせ)
        .filter(([k, 種]) => !箱の行の知らせ(t, `${k}: ${値[k]}`).includes(種))
        .map(([k, 種]) => `${t.名}: ${k} に ${種} が出ない`),
    );
    expect(出ない, `図種 ${図種.length} 件 × 項目 ${Object.keys(別の知らせ).length} 件`).toEqual([]);
  });

  it("伝える欄を手で並べていない", () => {
    const p = parseTextDslV05(本文(図種[0]!, ""));
    if (!p.ok) throw new Error("素の本文が読めない");
    const actors = p.doc.actors.slice();
    actors[0] = { ...actors[0]!, ["未知の指定" as never]: "あたい" as never };
    const 知: string[] = [];
    compileToCdl({ ...p.doc, actors }, { onNotice: (n) => 知.push(n.kind) });
    expect(知.filter((k) => k === "actor-option-not-honored").length, "知らない欄が素通りした").toBe(
      1,
    );
  });

  it("箱を持つ図種では、同じ指定を伝えない (植え込み対照)", () => {
    const 出た = 項目.filter((k) =>
      組む(`title: "箱の図"
type: flow

actors:
  - あ: { ${k}: ${値[k]} }
  - い

flow:
  - あ -> い: "つぎ"
`).知.some((n) => n.kind === "actor-option-not-honored"),
    );
    expect(出た, `項目 ${項目.length} 件`).toEqual([]);
  });
});
