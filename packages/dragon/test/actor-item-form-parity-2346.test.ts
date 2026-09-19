/*
 * 箱の項目名が、2 つの書き方で読めたり読めなかったりしないことを見る (#2346)。
 *
 * 箱の項目は 1 行の中括弧にまとめる形 (`- A: { kind: card }`) と、名前の下に段を分けて
 * 並べる形の 2 通りで書ける。 実測 = `eyebrow` / `initial` / `final` の 3 つは中括弧でしか
 * 読まれず、段を分けて書くと「項目名が読めません」 で落ちていた。 そのとき並ぶ「使える項目」
 * にも 3 つとも載っていないので、読み手には **綴りを誤った名前** に見える。
 *
 * ## 食い違いは記法から導く
 *
 * どちらか片方でしか読めない項目名を、**同じ値を 2 通りに書いて実測する**。 残る食い違いは
 * 理由つきの表に載せ、実測と表を両方向で突き合わせる = 表が実物と離れたら落ちる。
 * 手で一覧を並べると、欄を足した日に片方だけが取り残される (#2344 が同じ形で起きた)。
 *
 * 見本の値を持たない項目名は 0 件に潰さず、件数と名前を出す。 値が読めないだけの時に
 * 「食い違い 0 件」 と読めてしまうため。
 */
import { describe, expect, it } from "vitest";
import { ACTOR_ITEM_KEYS, INLINE_ACTOR_KEYS, parseTextDslV05 } from "../src/v05/parser";
import { compileToCdl } from "../src/compile";
import { sourceYaml__pattern__stateStartEnd__段を分けて書く as 段の見本 } from "../../../apps/playground-spa/src/topics/catalog/primitives.cdl";

const 頭 = `title: "t"\ntype: flow\n`;

/**
 * 各項目に書く見本の値。
 *
 * **読める値を書く** = 読めない値だと項目名の前に値で落ち、どちらの形でも同じに見えてしまう。
 * 値の形が変わったらここも直す (落ちた時に名前が出る)。
 */
const 見本の値: Record<string, string> = {
  kind: "service",
  種類: "service",
  title: '"だい"',
  題: '"だい"',
  subtitle: '"ほそく"',
  補足: '"ほそく"',
  eyebrow: '"めじるし"',
  tone: "error",
  color: "error",
  色: "error",
  rows: "[いち, に]",
  行: "[いち, に]",
  marks: "start",
  印: "start",
  value: "10",
  値: "10",
  previous: "5",
  前の値: "5",
  lane: "l1",
  stack: "0",
  initial: "true",
  final: "true",
  size: "900,400",
  大きさ: "900,400",
  shape: "{ kind: rect, source: 10, fillMax: 100 }",
  図形: "{ kind: rect, source: 10, fillMax: 100 }",
  pos: "B の右 200",
  位置: "B の右 200",
  scale: "1.5",
  倍率: "1.5",
  visibleIf: "x > 1",
  出す条件: "x > 1",
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

const 段を分けた形 = (k: string, v: string): string =>
  `${頭}actors:\n  - A:\n      ${k}: ${v}\n  - B\nflow:\n  - A -> B: "r"\n`;
const 中括弧 = (k: string, v: string): string =>
  `${頭}actors:\n  - A: { ${k}: ${v} }\n  - B\nflow:\n  - A -> B: "r"\n`;

/** その本文が「項目名が読めません」 で落ちるか */
function 項目名で弾かれる(本文: string): boolean {
  const p = parseTextDslV05(本文);
  return !p.ok && p.errors.some((e) => e.message.includes("項目名が読めません"));
}

/** 出来上がった箱。 読めなければ `null` (行番号は書き方で変わるので外す) */
function 箱(本文: string): string | null {
  const p = parseTextDslV05(本文);
  if (!p.ok) return null;
  const a = p.doc.actors.find((x) => x.name === "A");
  if (a === undefined) return null;
  const { pos: _行番号, ...中身 } = a as unknown as Record<string, unknown>;
  // 欄の並び順は書き方で変わる。 名前で並べ直してから比べる
  return JSON.stringify(Object.fromEntries(Object.entries(中身).sort(([x], [y]) => (x < y ? -1 : 1))));
}

/** 記法が知っている箱の項目名すべて */
const 全項目 = [...new Set([...ACTOR_ITEM_KEYS, ...INLINE_ACTOR_KEYS])].sort();

/**
 * どちらか片方の書き方でしか読めない項目名と、その理由 (#2346)。
 *
 * **理由を同じ場所に書く**。 別 file に分けると片方だけ直って食い違う。
 */
const 片方でしか読めない: Record<string, { 形: "中括弧" | "段を分けた形"; 理由: string }> = {
  posW: {
    形: "中括弧",
    理由:
      "段を分けた形では `大きさ: 900,400` が幅と高さをまとめて受ける (#1306)。" +
      " 幅だけを別の行に書けるようにすると、片方だけ書いた形が生まれて図が決まらない",
  },
  posH: { 形: "中括弧", 理由: "`posW` と同じ。 `大きさ:` が高さも受ける" },
  pos: {
    形: "段を分けた形",
    理由:
      "`位置: B の右 200` の形は中括弧の区切り (`,`) と読み分けられない。" +
      " 座標で書く `posX` / `posY` はどちらの形でも読めるので、位置を書く手段は両方にある (#2344)",
  },
  位置: { 形: "段を分けた形", 理由: "`pos` の日本語名。 同じ理由" },
  size: {
    形: "段を分けた形",
    理由: "中括弧では `posW` / `posH` が幅と高さを別々に受ける。 大きさを書く手段は両方にある",
  },
  大きさ: { 形: "段を分けた形", 理由: "`size` の日本語名。 同じ理由" },
};

/** 実測。 項目名ごとに、どちらの形でだけ読めるか */
function 実測(): { 片方: Record<string, "中括弧" | "段を分けた形">; 見本欠け: string[] } {
  const 片方: Record<string, "中括弧" | "段を分けた形"> = {};
  const 見本欠け: string[] = [];
  for (const k of 全項目) {
    const v = 見本の値[k];
    if (v === undefined) {
      見本欠け.push(k);
      continue;
    }
    const 段だめ = 項目名で弾かれる(段を分けた形(k, v));
    const 括だめ = 項目名で弾かれる(中括弧(k, v));
    if (段だめ && !括だめ) 片方[k] = "中括弧";
    else if (!段だめ && 括だめ) 片方[k] = "段を分けた形";
  }
  return { 片方, 見本欠け };
}

describe("箱の項目名が、2 つの書き方で読めたり読めなかったりしない (#2346)", () => {
  const { 片方, 見本欠け } = 実測();

  it("箱の項目名を走査できている (空振り防止)", () => {
    expect(ACTOR_ITEM_KEYS.size, "段を分けた形の語彙が空").toBeGreaterThan(0);
    expect(INLINE_ACTOR_KEYS.size, "中括弧の語彙が空").toBeGreaterThan(0);
    expect(全項目.length, "項目名を 1 件も拾えていない").toBeGreaterThan(0);
  });

  it("見本の値を持たない項目名が無い", () => {
    // 0 件に潰さない。 値が無いと下の実測から外れ、食い違いを見逃したまま通る
    expect(見本欠け, `走査 ${全項目.length} 件`).toEqual([]);
  });

  it("片方でしか読めない項目名が、理由つきの表と一致する", () => {
    const 表から = Object.fromEntries(Object.entries(片方でしか読めない).map(([k, v]) => [k, v.形]));
    expect(片方, `走査 ${全項目.length} 件`).toEqual(表から);
  });

  it("表の各行が理由を持つ", () => {
    for (const [項目, { 理由 }] of Object.entries(片方でしか読めない)) {
      expect(理由.length, `${項目} の理由が空`).toBeGreaterThan(0);
    }
  });

  it("表から 1 件外すと食い違いとして出る (植え込み対照)", () => {
    // 表と実測が本当に突き合わさっていることを見る。 通っているだけでは保証にならない
    const 欠けた = Object.fromEntries(
      Object.entries(片方でしか読めない)
        .filter(([k]) => k !== "posW")
        .map(([k, v]) => [k, v.形]),
    );
    expect(片方, "表を 1 件減らしても一致してしまう (突き合わせが効いていない)").not.toEqual(欠けた);
  });

  it("両方の書き方で読める項目名は、同じ箱になる", () => {
    const 違う = 全項目
      .filter((k) => 見本の値[k] !== undefined && 片方[k] === undefined)
      .filter((k) => {
        const v = 見本の値[k]!;
        const 段 = 箱(段を分けた形(k, v));
        // どちらの形でも読めない名前 (部品だけに効く `倍率` / `scale`) はここに来ない
        return 段 !== null && 段 !== 箱(中括弧(k, v));
      });
    expect(違う, `走査 ${全項目.length} 件`).toEqual([]);
  });

  it("目次と始まり終わりの印が、段を分けた形で読める", () => {
    // 直した 3 件を名指しで見る。 上の突き合わせは表を書き換えれば通ってしまう
    for (const k of ["eyebrow", "initial", "final"]) {
      const v = 見本の値[k]!;
      const 段 = 箱(段を分けた形(k, v));
      expect(段, `${k} が段を分けた形で読めない`).not.toBeNull();
      expect(段, `${k} が書き方で違う箱になる`).toBe(箱(中括弧(k, v)));
    }
  });

  it("中括弧でしか読めない名前は、中括弧なら効くと知らせる", () => {
    // 「使える項目 = 」 に並べるだけだと、同じ名前が別の形で効くことが伝わらない
    const p = parseTextDslV05(段を分けた形("posW", 見本の値.posW!));
    expect(p.ok).toBe(false);
    if (p.ok) return;
    const e = p.errors.find((x) => x.message.includes("項目名が読めません"));
    expect(e, "知らせが出ていない").toBeDefined();
    expect(e?.hint ?? "", `補足: ${e?.hint ?? ""}`).toContain("中括弧");
  });

  it("段を分けた形の語彙に、中括弧でだけ読める名前が紛れていない", () => {
    // 逆向き。 語彙にだけ足して読み取りを足し忘れると、案内が実物と食い違う
    const 紛れ = [...ACTOR_ITEM_KEYS].filter((k) => 片方[k] === "中括弧");
    expect(紛れ, `語彙 ${ACTOR_ITEM_KEYS.size} 件`).toEqual([]);
  });
});

describe("段を分けて書いた見本がカタログにある (#2346)", () => {
  it("3 つの名前を段を分けた形で書いている (空振り防止)", () => {
    // 中括弧に書いてあると、この見本は直したことを 1 つも見せていない
    const 段の行 = 段の見本
      .split("\n")
      .filter((l) => /^ {6}\S/u.test(l))
      .map((l) => l.trim());
    const 書いた = ["eyebrow", "initial", "final"].filter((k) =>
      段の行.some((l) => l.startsWith(`${k}:`)),
    );
    expect(書いた.sort(), `段を分けた行 ${段の行.length} 行`).toEqual(["eyebrow", "final", "initial"]);
  });

  it("見本が知らせ 0 件で組み立てられ、3 つの札が出る", () => {
    const p = parseTextDslV05(段の見本);
    expect(p.ok, p.ok ? "" : p.errors.map((e) => e.message).join(" / ")).toBe(true);
    if (!p.ok) return;
    const 知らせ: string[] = [];
    const d = compileToCdl(p.doc, { onNotice: (n) => 知らせ.push(`${n.kind}: ${n.message}`) });
    expect(知らせ, "見本が知らせを出している").toEqual([]);
    // 始まりと終わりの印は目次の位置に札として出る。 途中の箱には書いた目次がそのまま出る
    const 札 = (d.nodes as Array<{ eyebrow?: string }>).map((n) => n.eyebrow);
    expect(札).toEqual(["初期", "途中", "最終"]);
  });
});
