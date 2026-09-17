/**
 * 順序図の板が、段の `focus:` から今どの言づてを強調するかを導く (#2133)。
 *
 * 板は番号の言づてを強調し、それより前を描き済みとして残し、後ろを隠す。 番号は段が
 * 状態 (`sequenceStepId()`) に書く。
 *
 * ## 何が壊れていたか
 *
 * 番号は「元 -> 先」 の組から引く表だけで導いていた。
 *
 * | 書き方 | 起きたこと |
 * |---|---|
 * | 箱の名前 (`[A, B]`) | 表に無いので全ての段が 0。 板が最初の言づて 1 行のまま進まない |
 * | 同じ 2 者の矢印を複数 | 表が最後の番号で上書きされ、最初の段で最後の言づてまで飛ぶ |
 *
 * 既存の検査は段が状態を **書いているか** だけを見ており、書いた値を見ていなかった。
 *
 * ## 何を見るか
 *
 * 見本の形ごとの期待値に加えて、**無作為に作った図を総当たりの切り分けと突き合わせる**。
 * 見本の形だけを並べると、並べた形でしか正しさを確かめられない (#2131 で踏んだ形)。
 */
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { sequenceStepId } from "@cardenelabs/cdl";
import { jsonToDiagram } from "../src/index";

type 段 = { step: string; duration: number; focus?: string[] };
type 図 = {
  title: string;
  type: "sequence";
  actors: string[];
  flow: { from: string; to: string; label: string }[];
  animation: 段[];
};

/** 段ごとに板へ書いた番号を並べる */
function 番号(json: 図): number[] {
  const d = jsonToDiagram(json);
  expect(d.phases, "段が組み立てられていない (検査が空振りしている)").toHaveLength(
    json.animation.length,
  );
  return d.phases.map((p) => {
    const s = p.sets.find((x) => x.stateId === sequenceStepId());
    if (s === undefined) throw new Error(`段 ${p.title} が板の番号を書いていない`);
    return Number(s.value);
  });
}

/** 言づてを `元>先` の短い形で並べ、段は focus だけで書く */
function 図にする(actors: string[], flow: string[], focus: (string[] | undefined)[]): 図 {
  return {
    title: "t",
    type: "sequence",
    actors,
    flow: flow.map((f, i) => {
      const [from, to] = f.split(">");
      return { from: from!, to: to!, label: `m${i}` };
    }),
    animation: focus.map((f, i) => ({ step: `p${i}`, duration: 1, ...(f ? { focus: f } : {}) })),
  };
}

describe("順序図の板が段の focus から言づてを選ぶ (#2133)", () => {
  describe("書き方ごとの合い方", () => {
    it("矢印は元と先が一致する言づてに合う", () => {
      const d = 図にする(["A", "B", "C"], ["A>B", "B>C", "C>A"], [["A -> B"], ["B -> C"], ["C -> A"]]);
      expect(番号(d)).toEqual([0, 1, 2]);
    });

    it("同じ 2 者の矢印が続いても 1 通ずつ進む (最後の言づてへ飛ばない)", () => {
      // 見本 `sseStream` の形。 以前は 2 段目で最後の言づてまで飛んでいた
      const d = 図にする(
        ["閲覧ソフト", "処理側"],
        ["閲覧ソフト>処理側", "処理側>閲覧ソフト", "処理側>閲覧ソフト", "処理側>閲覧ソフト"],
        [["閲覧ソフト -> 処理側"], ["処理側 -> 閲覧ソフト"], ["処理側 -> 閲覧ソフト"], ["処理側 -> 閲覧ソフト"]],
      );
      expect(番号(d)).toEqual([0, 1, 2, 3]);
    });

    it("箱の名前 2 つは、元と先の両方がその箱の言づてに合う", () => {
      // 以前は全ての段が 0 だった形
      const d = 図にする(
        ["利用者", "API", "DB"],
        ["利用者>API", "API>DB", "DB>API", "API>利用者"],
        [["利用者", "API"], ["API", "DB"], ["DB", "API"], ["API", "利用者"]],
      );
      expect(番号(d)).toEqual([0, 1, 2, 3]);
    });

    it("箱の名前 1 つは、元か先がその箱の言づてに合う", () => {
      // C は 2 通目と 3 通目の両方に関わる。 区間の最後に合う 3 通目を強調する
      const d = 図にする(["A", "B", "C"], ["A>B", "B>C", "C>B"], [["A"], ["C"]]);
      expect(番号(d)).toEqual([0, 2]);
    });

    it("箱の名前 2 つは自分宛ての言づてにも合う", () => {
      // 2 段目 [API, DB] に合うのは API -> API だけ。 合わなければ 2 段目が進まない
      const d = 図にする(
        ["利用者", "API", "DB"],
        ["利用者>API", "API>API", "API>利用者"],
        [["利用者 -> API"], ["API", "DB"], ["API -> 利用者"]],
      );
      expect(番号(d)).toEqual([0, 1, 2]);
    });

    it("矢印を書いた段は、同じ段の箱の名前で言づてを選ばない", () => {
      /*
       * 見本 `websocket` の形。 箱の名前 `利用者側` は全ての言づてに合うため、数えると 2 段目が
       * 2 通目 (101 切り替え) を取り、矢印で指した 3 通目 (文面を送る) を強調しない
       */
      const d = 図にする(
        ["利用者側", "処理側"],
        ["利用者側>処理側", "処理側>利用者側", "利用者側>処理側", "処理側>利用者側"],
        [["利用者側 -> 処理側"], ["利用者側 -> 処理側", "利用者側"], ["処理側 -> 利用者側", "利用者側", "処理側"]],
      );
      expect(番号(d)).toEqual([0, 2, 3]);
    });

    it("箱の名前は id の形で書いても合う", () => {
      const d = 図にする(["API Gateway", "DB"], ["API Gateway>DB", "DB>API Gateway"], [
        ["api-gateway -> DB"],
        ["DB -> api-gateway"],
      ]);
      expect(番号(d)).toEqual([0, 1]);
    });
  });

  describe("段が束ねる言づて", () => {
    it("箱の名前で束ねた段は、束の最後の言づてを強調する", () => {
      // 見本 `jwtAuth` の形。 1 段目の題「照合」 は 2 通目、 3 段目の題は 5 通目の応答
      const d = 図にする(
        ["利用者", "認証窓口", "API", "DB"],
        ["利用者>認証窓口", "認証窓口>DB", "認証窓口>利用者", "利用者>API", "API>利用者"],
        [["利用者", "認証窓口", "DB"], ["認証窓口", "利用者"], ["利用者", "API"]],
      );
      expect(番号(d)).toEqual([1, 2, 4]);
    });

    it("両方の段に合う言づては、狭く指した段が受け持つ (後ろの段が狭い時)", () => {
      /*
       * 見本 `rateLimit` の形。 5 通目 (6 回目の要求) は 1 段目の [利用者側, 流量制限, API] (5 通に
       * 合う) にも 2 段目の [利用者側, 流量制限] (3 通に合う) にも合う。 1 段目が取ると、 2 段目の
       * 題「超過」 の前の要求が 1 段目で出てしまう
       */
      const d = 図にする(
        ["利用者側", "流量制限", "API", "残り枠"],
        ["利用者側>流量制限", "流量制限>残り枠", "流量制限>API", "API>利用者側", "利用者側>流量制限", "流量制限>利用者側"],
        [["利用者側", "流量制限", "API"], ["利用者側", "流量制限"]],
      );
      expect(番号(d)).toEqual([3, 5]);
    });

    it("前の段が長く束ねる時は、次の段が途中の言づてを先に取らない", () => {
      /*
       * 1 段目は 4 箱全てを指し 1-5 通目を束ねる。 2 段目の [API, 一時置き場] は 2 通目にも
       * 合うが、そこから受け持つと 4 通目と 5 通目 (DB とのやり取り) がどちらの段にも合わない
       */
      const d = 図にする(
        ["利用者側", "API", "一時置き場", "DB"],
        ["利用者側>API", "API>一時置き場", "一時置き場>API", "API>DB", "DB>API", "API>一時置き場", "API>利用者側"],
        [["利用者側", "API", "一時置き場", "DB"], ["API", "一時置き場"], ["API", "利用者側"]],
      );
      expect(番号(d)).toEqual([4, 5, 6]);
    });
  });

  describe("合う言づてが無い段", () => {
    it("前の段の番号を保つ (0 へ巻き戻さない)", () => {
      const d = 図にする(["A", "B", "C"], ["A>B", "B>C"], [["A -> B"], ["X -> Y"], ["B -> C"]]);
      expect(番号(d)).toEqual([0, 0, 1]);
    });

    it("描いた矢印を最後にまとめて並べる段は、直前の段の言づてを取らず最後の番号を保つ", () => {
      // 3 通目は `C -> A` の段にもまとめの段にも合う。 まとめの段 (3 通に合う) が取ると、
      // 狭く指した `C -> A` の段 (1 通に合う) が進まない
      const d = 図にする(["A", "B", "C"], ["A>B", "B>C", "C>A"], [
        ["A -> B"],
        ["B -> C"],
        ["C -> A"],
        ["A -> B", "B -> C", "C -> A"],
      ]);
      expect(番号(d)).toEqual([0, 1, 2, 2]);
    });

    it("focus を書かない段は前の段の番号を保ち、先頭なら 0", () => {
      const d = 図にする(["A", "B", "C"], ["A>B", "B>C", "C>A"], [undefined, ["B -> C"], undefined, ["C -> A"]]);
      expect(番号(d)).toEqual([0, 1, 1, 2]);
    });
  });

  it("README の最小の例で板が 1 通ずつ進む", () => {
    // LLM に書かせる例として載せている形。 写した図が進まなければ README が誤りを配る
    const md = readFileSync(join(dirname(fileURLToPath(import.meta.url)), "..", "README.md"), "utf8");
    const 節 = md.slice(md.indexOf("### 最小 example"));
    const 引数 = /jsonToDiagram\((\{[\s\S]*?\n\})\);/.exec(節)?.[1];
    if (引数 === undefined) throw new Error("README の最小の例から jsonToDiagram の引数を読めない");
    // 例は JS の書き方 (鍵に引用符が無い / 末尾の `,`) なので、JSON に直してから読む
    const json = JSON.parse(
      引数.replace(/([{,]\s*)([A-Za-z_]\w*)\s*:/g, '$1"$2":').replace(/,(\s*[\]}])/g, "$1"),
    ) as 図;
    expect(json.type, "最小の例が順序図ではない (検査の前提が変わった)").toBe("sequence");
    expect(番号(json)).toEqual([0, 1, 2, 3]);
  });
});

/*
 * ---- 無作為の図と総当たりの突き合わせ ----
 *
 * 組み立ては切り分けを動的計画法で選ぶ。 ここでは同じ決まりを **全ての切り分けを並べる形** で
 * 書き直し、結果が一致するかを見る。 書き方が違う 2 つが同じ答えを出せば、どちらかだけが
 * 決まりを取り違えている形を拾える。
 */

/** 決まった種から同じ並びを返す擬似乱数 (検査を毎回同じにする) */
function 乱数(種: number): () => number {
  let s = 種 >>> 0;
  return () => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    return s / 2 ** 32;
  };
}

/** 決まりの表をそのまま書いた合い方 */
function 合う(focus: string[] | undefined, f: { from: string; to: string }): boolean {
  if (!focus) return false;
  const 矢印 = focus.filter((x) => x.includes("->")).map((x) => x.split("->").map((y) => y.trim()));
  if (矢印.length > 0) return 矢印.some(([a, b]) => f.from === a && f.to === b);
  if (focus.length === 1) return f.from === focus[0] || f.to === focus[0];
  return focus.includes(f.from) && focus.includes(f.to);
}

/** 全ての切り分けを並べ、決まりの順に最も良いものから番号を導く */
function 総当たり(d: 図): number[] {
  const 対象 = d.animation.flatMap((p, k) => (p.focus ? [k] : []));
  const n = d.flow.length;
  const m = 対象.length;
  // 段の広さ = 図の全ての言づてのうち、その段に合う数
  const 広さ = 対象.map((k) => d.flow.filter((f) => 合う(d.animation[k]!.focus, f)).length);
  let 最良: { 段数: number; 通数: number; 広さの合計: number; 切れ目: number[] } | undefined;
  const 並べる = (切れ目: number[]): void => {
    if (切れ目.length === m - 1) {
      const 区間 = [0, ...切れ目, n];
      let 段数 = 0;
      let 通数 = 0;
      let 広さの合計 = 0;
      for (let t = 0; t < m; t++) {
        let c = 0;
        for (let j = 区間[t]!; j < 区間[t + 1]!; j++) if (合う(d.animation[対象[t]!]!.focus, d.flow[j]!)) c++;
        段数 += c > 0 ? 1 : 0;
        通数 += c;
        広さの合計 += c * 広さ[t]!;
      }
      // 辞書順に並べているので、上回った時だけ置き換えれば並んだ時は切れ目の早い方が残る
      const 上回る =
        !最良 ||
        段数 > 最良.段数 ||
        (段数 === 最良.段数 && 通数 > 最良.通数) ||
        (段数 === 最良.段数 && 通数 === 最良.通数 && 広さの合計 < 最良.広さの合計);
      if (上回る) 最良 = { 段数, 通数, 広さの合計, 切れ目: [...切れ目] };
      return;
    }
    const 前 = 切れ目.length === 0 ? 0 : 切れ目[切れ目.length - 1]!;
    for (let b = 前; b <= n; b++) 並べる([...切れ目, b]);
  };
  if (m > 0) 並べる([]);

  const 番 = new Map<number, number>();
  if (最良) {
    const 区間 = [0, ...最良.切れ目, n];
    for (let t = 0; t < m; t++) {
      for (let j = 区間[t + 1]! - 1; j >= 区間[t]!; j--) {
        if (合う(d.animation[対象[t]!]!.focus, d.flow[j]!)) {
          番.set(対象[t]!, j);
          break;
        }
      }
    }
  }
  let 今 = 0;
  return d.animation.map((_, k) => (今 = 番.get(k) ?? 今));
}

/** 箱 2-4 個、言づて 1-7 通、段 1-5 個の図を作る。 focus は 4 通りの書き方から選ぶ */
function 無作為の図(r: () => number): 図 {
  const 箱 = ["A", "B", "C", "D"].slice(0, 2 + Math.floor(r() * 3));
  const 選ぶ = () => 箱[Math.floor(r() * 箱.length)]!;
  const 言づて = Array.from({ length: 1 + Math.floor(r() * 7) }, () => `${選ぶ()}>${選ぶ()}`);
  const focus = Array.from({ length: 1 + Math.floor(r() * 5) }, (): string[] | undefined => {
    const 種 = Math.floor(r() * 5);
    if (種 === 0) return undefined;
    if (種 === 1) return [`${選ぶ()} -> ${選ぶ()}`];
    if (種 === 2) return [選ぶ()];
    if (種 === 3) return [...new Set([選ぶ(), 選ぶ(), 選ぶ()])];
    return [`${選ぶ()} -> ${選ぶ()}`, 選ぶ()];
  });
  return 図にする(箱, 言づて, focus);
}

describe("無作為の図で決まりを確かめる (#2133)", () => {
  const 件数 = 400;
  const 図たち = Array.from({ length: 件数 }, (_, i) => 無作為の図(乱数(i + 1)));

  it("総当たりの切り分けと同じ番号になる", () => {
    const 違う = 図たち
      .map((d) => ({ d, 組み立て: 番号(d), 期待: 総当たり(d) }))
      .filter((x) => JSON.stringify(x.組み立て) !== JSON.stringify(x.期待));
    expect(
      違う.slice(0, 3).map((x) => ({ 言づて: x.d.flow.map((f) => `${f.from}>${f.to}`), focus: x.d.animation.map((p) => p.focus), 組み立て: x.組み立て, 期待: x.期待 })),
    ).toEqual([]);
  });

  it("番号は段を追って小さくならず、変わった段は自分の focus に合う言づてを指す", () => {
    let 進んだ段 = 0;
    for (const d of 図たち) {
      const 番 = 番号(d);
      番.forEach((x, k) => {
        expect(x, "言づての数を超えた").toBeLessThan(Math.max(1, d.flow.length));
        if (k === 0 ? x === 0 : x === 番[k - 1]) return;
        進んだ段++;
        expect(x, "前の段より小さい").toBeGreaterThan(k === 0 ? 0 : 番[k - 1]!);
        expect(合う(d.animation[k]!.focus, d.flow[x]!), `段 ${k} が focus に合わない言づてを指す`).toBe(true);
      });
    }
    // 全ての段が 0 のままでも上の検査は通る。 進んだ段があることを確かめる
    expect(進んだ段, "どの段も進んでいない (検査が空振りしている)").toBeGreaterThan(件数);
  });
});
