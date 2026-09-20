/*
 * 字下げして書いた 1 行が、形をわずかに外すと知らせも無く消えていた (#2400)。
 *
 * 行を集める側 (`collectIndentedList` / `collectActorEntries` / `collectAnimationSteps`) が、
 * 形の合わない行を読み手へ渡さずその場で捨てていた。 読み手 (`parseActor` /
 * `parseFlowStep` / `parseStateEntry`) は「読めません」 を報告できるのに、そこまで届かない。
 *
 * ## 「黙る」 を実測で決める
 *
 * 節ごとに **その行を書かなかった本文** と **その行を書き落とした本文** を組み立て、
 * 誤りが 0 件で、かつ図が 1 byte も変わらない組み合わせを黙ると数える。
 * 書かなかった本文と同じ図になるなら、書いた 1 行はどこにも届いていない。
 *
 * **正しく書いた本文とは比べない**。 書き落とした行がそのまま読まれた時 (`flow`) は
 * 正しい本文と同じ図になるため、正しい本文を基準にすると「効いている」 を黙ると数える。
 *
 * 伝え方は節で分かれる。 どちらでも、書いた人は何かが起きたことに気付ける。
 *
 * | 伝え方 | 節 | 書き落とした行がどうなるか |
 * |---|---|---|
 * | 誤りになる | `actors` `animation` `states` `lanes` `groups` | 「…の行が読めません」 が 1 件出る |
 * | 図になる | `flow` | 矢印として読まれる |
 *
 * **`flow` だけ図になるのは、その節の形の契約が元から 2 通りだから**。 `- ` を付けた形と
 * `key: value` の形の両方を受けており、この直しでは契約を変えていない。 変えたのは
 * 「どちらでもない行を捨てる」 ところだけ。
 */
import { describe, expect, it } from "vitest";
import { compileToCdl } from "../src/compile";
import { parseTextDslV05 } from "../src/v05/parser";

/** 節ごとの、正しい本文と 1 行だけ書き落とした本文 */
const 節: { 名: string; 落とし方: string; 正: string; 誤: string; 落ちた行: string }[] = [
  {
    名: "actors",
    落とし方: "先頭の `- ` を落とす",
    正: "actors:\n  - あ\n  - い",
    誤: "actors:\n  あ\n  - い",
    落ちた行: "  あ",
  },
  {
    名: "flow",
    落とし方: "先頭の `- ` を落とす",
    正: "flow:\n  - あ -> い\n  - い -> う",
    誤: "flow:\n  あ -> い\n  - い -> う",
    落ちた行: "  あ -> い",
  },
  {
    名: "states",
    落とし方: "コロンを落とす",
    正: "states:\n  progress: 0\n  done: 1",
    誤: "states:\n  progress 0\n  done: 1",
    落ちた行: "  progress 0",
  },
  {
    名: "lanes",
    落とし方: "コロンを落とす",
    正: "lanes:\n  l1: { width: 300 }\n  l2: { width: 300 }",
    誤: "lanes:\n  l1 300\n  l2: { width: 300 }",
    落ちた行: "  l1 300",
  },
  {
    名: "groups",
    落とし方: "コロンを落とす",
    正: "lanes:\n  l1: { width: 300 }\n\ngroups:\n  g1: { lanes: [l1] }",
    誤: "lanes:\n  l1: { width: 300 }\n\ngroups:\n  g1 l1",
    落ちた行: "  g1 l1",
  },
  {
    名: "animation",
    落とし方: "先頭の `- ` を落とす",
    正: 'animation:\n  - step: "s1" 1s\n  - step: "s2" 1s',
    誤: 'animation:\n  step: "s1" 1s\n  - step: "s2" 1s',
    落ちた行: '  step: "s1" 1s',
  },
];

/**
 * 節の本文を 1 枚の図の本文にする。
 *
 * **測る節を 2 度書かない**。 同じ節を 2 度書くと後の 1 つが前を置き換えるため、
 * 書き落とした行の影響が消える (実測で `actors` と `flow` の走査が空振りしていた)。
 *
 * 箱は縦列に入れる = 縦列を書いた図で箱がどこにも入らないと、この直しと関係のない
 * 知らせ (`lane-declared-empty`) が出て走査が読めなくなる。
 */
function 本文(節本文: string): string {
  const 節名 = 節本文.split(":")[0] ?? "";
  const 縦列を書く = 節名 === "lanes" || 節名 === "groups";
  const 箱 = 縦列を書く
    ? "actors:\n  - あ: { lane: l1 }\n  - い: { lane: l1, stack: 1 }\n  - う: { lane: l1, stack: 2 }"
    : "actors:\n  - あ\n  - い\n  - う";
  const 矢印 = 'flow:\n  - あ -> い: "1"';
  return `title: "しらべ"
type: flow

${節名 === "actors" ? "" : `${箱}\n\n`}${節名 === "flow" ? "" : `${矢印}\n\n`}${節本文}
`;
}

type 結果 = { 誤り: string[]; 図: string };

/** 読めない行の報告だけを見る。 組み立ての知らせは別の層の話なので混ぜない */
function 測る(節本文: string): 結果 {
  const src = 本文(節本文);
  const r = parseTextDslV05(src);
  if (!r.ok) return { 誤り: r.errors.map((e) => `L${e.line} ${e.message}`), 図: "" };
  return { 誤り: [], 図: JSON.stringify(compileToCdl(r.doc, { onNotice: () => {} })) };
}

/** その行を書かなかった本文 */
const 書かない = (s: (typeof 節)[number]): string =>
  s.誤
    .split("\n")
    .filter((x) => x !== s.落ちた行)
    .join("\n");

/** 生成した本文の中で、書き落とした行が何行目か (1 始まり) */
const 行番号 = (s: (typeof 節)[number]): number =>
  本文(s.誤)
    .split("\n")
    .findIndex((x) => x === s.落ちた行) + 1;

describe("字下げして書いた行が黙って消えない (#2400)", () => {
  it("書き落とした行が、誤りになるか図になる (黙る節が 0 件)", () => {
    const 黙った: string[] = [];
    for (const s of 節) {
      const 無 = 測る(書かない(s));
      const 誤 = 測る(s.誤);
      if (誤.誤り.length === 0 && 誤.図 === 無.図) 黙った.push(`${s.名} (${s.落とし方})`);
    }
    expect(黙った, `黙った節: ${黙った.join(" / ")}`).toEqual([]);
    // 空振り防止 = 6 節を全て測れていること
    expect(節.length, "節を 1 つも走査できていない").toBe(6);
  });

  it("走査が空振りしていない (書かない本文が 6 節とも読める)", () => {
    /*
     * 書かない本文が読めないと、上の検査は「図が違う」 を常に満たして通る。
     * 基準の側が読めることまで見る。
     */
    const 出た = Object.fromEntries(節.map((s) => [s.名, 測る(書かない(s)).誤り]));
    expect(出た).toEqual(Object.fromEntries(節.map((s) => [s.名, []])));
  });

  it("正しく書いた本文は 6 節とも誤りが 0 件 (対照)", () => {
    // 誤りが常に出る作りになっていたら、上の検査は書き落としを測っていない
    const 出た = Object.fromEntries(節.map((s) => [s.名, 測る(s.正).誤り]));
    expect(出た).toEqual(Object.fromEntries(節.map((s) => [s.名, []])));
  });

  it("誤りには、捨てられた行の中身と行番号が入る", () => {
    const 本文の一部: Record<string, string> = {
      actors: '登場人物の行が読めません: "あ"',
      states: '状態の行が読めません: "progress 0"',
      lanes: '縦列の行が読めません: "l1 300"',
      groups: '組の行が読めません: "g1 l1"',
      animation: '段の行が読めません: "step: "s1" 1s"',
    };
    for (const [名, 文] of Object.entries(本文の一部)) {
      const s = 節.find((x) => x.名 === 名)!;
      expect(測る(s.誤).誤り, `${名} の誤り`).toContain(`L${行番号(s)} ${文}`);
    }
  });

  it("誤りは、書き落とした 1 行だけを指す", () => {
    // 同じ節の正しい行まで巻き込むと、どこを直せばよいか読めない
    for (const s of 節) {
      const 誤り = 測る(s.誤).誤り;
      expect(誤り.length, `${s.名} の誤り ${誤り.length} 件`).toBeLessThanOrEqual(1);
    }
  });

  it("コメント行と空行は、どの節でも誤りにならない", () => {
    /*
     * 捨てるのをやめた分、コメントが読み手へ届く。 読み手はどれも「書いた指定」 として
     * 読むため、飛ばさないとコメントが誤りとして報告される
     * (直す前は、コロンを含むコメントが既に `状態の行が読めません` になっていた)。
     */
    const 例: [string, string][] = [
      ["states / コメント", "states:\n  # めも: あ\n  x: 0"],
      ["states / 空行", "states:\n\n  x: 0"],
      ["flow / コメント", 'flow:\n  # めも: あ\n  - あ -> い: "1"'],
      ["lanes / コメント", "lanes:\n  # めも: あ\n  l1: { width: 300 }"],
      ["actors / コメント", "actors:\n  # めも: あ\n  - あ\n  - い"],
      ["animation / コメント", 'animation:\n  # めも: あ\n  - step: "s1" 1s'],
    ];
    const 出た = Object.fromEntries(例.map(([名, 本文]) => [名, 測る(本文).誤り]));
    expect(出た).toEqual(Object.fromEntries(例.map(([名]) => [名, []])));
  });

  it("字下げが浅い行は、これまでどおり次の節として読まれる", () => {
    // 節の終わりを表す行まで「読めません」 にすると、正しい本文が読めなくなる
    const src = `title: "しらべ"
type: flow

actors:
  - あ
  - い

flow:
  - あ -> い: "1"
`;
    const r = parseTextDslV05(src);
    expect(r.ok, r.ok ? "" : r.errors.map((e) => e.message).join(" / ")).toBe(true);
    if (!r.ok) return;
    expect(r.doc.actors.map((a) => a.name)).toEqual(["あ", "い"]);
    expect(r.doc.flow.length).toBe(1);
  });

  it("登場人物の浅い行は、1 件の頭にならない", () => {
    /*
     * 捨てるのをやめる時、頭として扱うと `補足: "..."` が `補足` という名前の登場人物になる。
     * 書き間違いが黙って別の意味に化けるので、誤りにする側へ倒す。
     */
    const src = `title: "しらべ"
type: flow

actors:
  - Web:
      kind: service
  補足: "浅い字下げ"
  - B: database

flow:
  - Web -> B: "x"
`;
    const r = parseTextDslV05(src);
    expect(r.ok, "浅い行を知らせていない").toBe(false);
    if (r.ok) return;
    expect(r.errors.map((e) => e.message)).toEqual([
      `登場人物の行が読めません: "補足: "浅い字下げ""`,
    ]);
  });

  it("続きの行は、これまでどおり 1 件にまとまる", () => {
    // 頭より深い字下げは続き。 ここを誤りにすると、縦に並べて書く形が全て落ちる
    const src = `title: "しらべ"
type: flow

actors:
  - Web:
      kind: service
      subtitle: "つづき"
  - B: database

flow:
  - Web -> B: "x"
`;
    const r = parseTextDslV05(src);
    expect(r.ok, r.ok ? "" : r.errors.map((e) => e.message).join(" / ")).toBe(true);
    if (!r.ok) return;
    expect(r.doc.actors.map((a) => a.name)).toEqual(["Web", "B"]);
    expect(r.doc.actors[0]!.subtitle).toBe("つづき");
  });
});
