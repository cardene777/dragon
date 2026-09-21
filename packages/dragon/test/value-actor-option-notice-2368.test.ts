/*
 * 値の図とじょうごで、箱に書いた指定が黙って消えないことを見る (#2368)。
 *
 * この図種は箱を **名前と値の組** として読み、1 枚の図にまとめて描く。
 * 箱ごとの見た目を決める指定を載せる先が無いのは設計どおりだが、
 * **書いても知らせが出なかった** (実測 = 箱に書ける 31 項目のうち 17 件、じょうごは 19 件)。
 *
 * 順序図 (#2358) と木の図 (#2360) は同じ形で直してある。
 *
 * ## 項目を手で並べない
 *
 * 走査は `INLINE_ACTOR_KEYS` を回す。 項目を足した日に、検査だけが古い一覧のまま通ることを防ぐ。
 * 値だけはこちらで持ち、覆えていない項目を別の検査が落とす。
 *
 * ## 1 項目ずつでは見えない組がある
 *
 * `posX` と `posY` は片方だけだと別の知らせが出る (#2362) ため、1 項目ずつ足す走査では
 * 「知らせる」 に数えられる。 **両方書くと黙って消える**。 組で書く形を別に測る。
 */
import { isDeepStrictEqual } from "node:util";
import { describe, expect, it } from "vitest";
import { compileToCdl } from "../src/compile";
import { INLINE_ACTOR_KEYS, parseTextDslV05 } from "../src/v05/parser";

/** 箱を名前と値の組として読む図種 */
const 値の図種 = [
  "pie",
  "bar",
  "line",
  "gauge",
  "radial",
  "stat",
  "waffle",
  "stacked",
  "slope",
  "funnel",
] as const;

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
  // 呼び名 (`subtitle`) は外さない (#2390)。 値として読まれるのは値を書いていない箱だけで、
  // この土台は箱 `あ` に値を書くため読む先が無い = 外した間、13 図種で黙って消えていた
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
  owner: "chart-value-unreadable",
  end: "chart-value-unreadable",
  touchpoint: "chart-value-unreadable",
  opportunity: "chart-value-unreadable",
};

function 本文(図種: string, 書く: string): string {
  return `title: "値の図"
type: ${図種}

actors:
  - あ: { value: 10${書く === "" ? "" : `, ${書く}`} }
  - い: { value: 20 }
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
function 区分(図種: string, 書く: string): "効く" | "知らせる" | "黙って消える" {
  const 素 = 組む(本文(図種, ""));
  const 付き = 組む(本文(図種, 書く));
  if (!isDeepStrictEqual(素.図, 付き.図)) return "効く";
  return 付き.知.length > 素.知.length ? "知らせる" : "黙って消える";
}

/** 最初の箱の行に出た知らせ */
function 箱の行の知らせ(図種: string, 書く: string): string[] {
  const src = 本文(図種, 書く);
  const p = parseTextDslV05(src);
  if (!p.ok) throw new Error("本文が読めない");
  const 行 = p.doc.actors[0]?.pos?.line ?? -1;
  return 組む(src)
    .知.filter((n) => n.line === 行)
    .map((n) => n.kind);
}

describe("値の図で、箱に書いた指定が黙って消えない (#2368)", () => {
  it("箱に書ける項目を走査できている (空振り防止)", () => {
    expect(項目.length, "箱の項目を 1 件も拾えていない").toBeGreaterThan(0);
  });

  it("走査する項目すべてに書く値を用意している", () => {
    const 無い = 項目.filter((k) => !(k in 値));
    expect(無い, `項目 ${項目.length} 件`).toEqual([]);
  });

  it("書いた指定が、黙って消えない", () => {
    const 消えた = 値の図種.flatMap((t) =>
      項目.filter((k) => 区分(t, `${k}: ${値[k]}`) === "黙って消える").map((k) => `${t}: ${k}`),
    );
    expect(消えた, `図種 ${値の図種.length} 件 × 項目 ${項目.length} 件`).toEqual([]);
  });

  it("組にして書いた指定も、黙って消えない", () => {
    // 位置は片方だけだと別の知らせが出るため、1 項目ずつの走査では穴が隠れる
    const 消えた = 値の図種.flatMap((t) =>
      組.filter(([, 書く]) => 区分(t, 書く) === "黙って消える").map(([名]) => `${t}: ${名}`),
    );
    expect(消えた, `図種 ${値の図種.length} 件 × 組 ${組.length} 件`).toEqual([]);
  });

  it("1 つの箱の行に知らせが 2 件並ばない", () => {
    const 重なった = 値の図種.flatMap((t) =>
      項目
        .map((k) => ({ k, 知: 箱の行の知らせ(t, `${k}: ${値[k]}`) }))
        .filter(({ 知 }) => 知.length > 1)
        .map(({ k, 知 }) => `${t}: ${k} で ${知.join(" + ")}`),
    );
    expect(重なった, `図種 ${値の図種.length} 件 × 項目 ${項目.length} 件`).toEqual([]);
  });

  it("別の知らせが受け持つ項目で、その知らせが出ている", () => {
    // 受け持つ側が消えたら、除外だけが残って黙って落ちる状態に戻る
    const 出ない = 値の図種.flatMap((t) =>
      Object.entries(別の知らせ)
        .filter(([k, 種]) => !箱の行の知らせ(t, `${k}: ${値[k]}`).includes(種))
        .map(([k, 種]) => `${t}: ${k} に ${種} が出ない`),
    );
    expect(出ない, `図種 ${値の図種.length} 件 × 項目 ${Object.keys(別の知らせ).length} 件`).toEqual(
      [],
    );
  });

  it("伝える欄を手で並べていない", () => {
    /*
     * 図種が読む欄を **除いた残り全部** を伝える形なら、知らない欄を 1 つ足しても伝わる。
     * 項目を並べた形だと、ここで足した欄が一覧に無いので素通りする。
     */
    const p = parseTextDslV05(本文("pie", ""));
    if (!p.ok) throw new Error("素の本文が読めない");
    const actors = p.doc.actors.slice();
    actors[0] = { ...actors[0]!, ["未知の指定" as never]: "あたい" as never };
    const 知: string[] = [];
    compileToCdl({ ...p.doc, actors }, { onNotice: (n) => 知.push(n.kind) });
    expect(知.filter((k) => k === "actor-option-not-honored").length, "知らない欄が素通りした").toBe(
      1,
    );
  });

  it("位置が効く図種では、片方だけ書いた知らせが残る (植え込み対照)", () => {
    /*
     * 値の図では位置そのものが効かないので、この図種の知らせが受け持つ。
     * 位置が効く図種では #2362 の知らせが要るため、そちらを消していないことを見る。
     */
    const 出ない = ["c4", "class", "er", "state", "swimlane"].filter(
      (t) =>
        !組む(`title: "位置"
type: ${t}

actors:
  - あ: { posX: 100 }
  - い
`).知.some((n) => n.kind === "position-axis-missing"),
    );
    expect(出ない, "図種 5 件").toEqual([]);
  });

  it("箱を持つ図種では、伝える欄がはっきり少ない (植え込み対照)", () => {
    /*
     * 図種を問わず伝える形に壊れていると、上の検査は何を書いても通る。
     *
     * **件数を検査に写さない** (#2376)。 フローも始まりの印などを伝えるようになったので
     * 「0 件」 では対照にならない。 値の図が伝える欄の数がフローより真に多いことを見る。
     * 集合の包含までは見ない = 読む欄は図種ごとに違うので、フローだけが伝える欄は在りうる。
     */
    const フローで伝える = 項目.filter((k) =>
      組む(`title: "箱の図"
type: flow

actors:
  - あ: { ${k}: ${値[k]} }
  - い

flow:
  - あ -> い: "つぎ"
`).知.some((n) => n.kind === "actor-option-not-honored"),
    );
    const 値の図で伝える = 項目.filter((k) =>
      組む(本文("pie", `${k}: ${値[k]}`)).知.some((n) => n.kind === "actor-option-not-honored"),
    );
    expect(フローで伝える.length, `フローが伝える欄 ${フローで伝える.join(" ")}`).toBeLessThan(
      値の図で伝える.length,
    );
  });
});
