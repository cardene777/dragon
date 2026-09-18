import { describe, expect, it } from "vitest";
import { textDslToDiagram, type CompileNotice } from "@cardenelabs/dragon";
import { layout, type CdlDiagram } from "@cardenelabs/cdl";

import { 部品の一覧を作る } from "@/lib/parts-catalog";
import * as 部品 from "@/topics/catalog/parts.cdl";
import * as 見本 from "@/topics/catalog/parts-motion.cdl";

/**
 * 「部品を繋いだまま動かす」 頁が教えていることを数える (#2125)。
 *
 * この頁が在るのは、繋ぎ方の頁 (`parts-in-box.cdl.ts`) が段を 1 つも持たず、部品の頁
 * (`parts.cdl.ts`) が矢印を 1 本も持たないため。 **どちらか片方に戻ったら落とす** のが本 file の役目で、
 * 見本の題や本文が変わっても落ちないように、数えるのは中身の性質だけにする。
 *
 * 数える性質は 7 つ。
 *
 * | 性質 | なぜ要るか |
 * |---|---|
 * | 矢印と段を両方持つ | 片方だけなら既存の 2 頁と同じで、この頁が在る意味が消える |
 * | 宿主の段が部品の中の値を動かす | 部品が自分の段で動くだけなら「繋いだ先へ渡る」 が見えない |
 * | 要素を名指しして繋ぐ | 要素を 2 つ以上持つ部品の繋ぎ方はこの書き方でしか見せられない |
 * | 要素を 2 つ以上持つ部品どうしを、両端とも要素で繋ぐ (#2149) | 繋ぎ方の部品 (振り分け器 / 合流点) を繋ぐ形。 片端だけの名指しでは部品の出口から次の部品の入口へ渡る絵にならない |
 * | 段で部品の中の要素を名指しして光らせ、その要素だけが光る (#2151) | 部品の名前で光らせると要素が全て光る。 入口だけ・出口だけを見せる書き方はこの頁でしか見せていない |
 * | 差し込んだ縦列が宿主のすぐ右に並ぶ (#2149) | 縦列を 2 本持つ部品を縦列に置くと 2 本目の縦列が足される。 隣の部品の縦列より右へ回ると、線が箱を貫く (#2147) |
 * | 知らせが 0 件 | 見本が書き方の手本になるため、警告が出る形を置かない |
 *
 * **知らせは呼び出しの合図で受け取る**。 組み立てた図に `notices` の欄は無く、
 * `onNotice` で渡ってくる (`packages/dragon/src/index.ts`)。 図の欄を読む形で書くと
 * 常に空になり、知らせが何件出ていても通る検査になる。
 */

const 一覧 = 部品の一覧を作る(Object.values(部品));

/** `sourceYaml__<key>` と、それに対応する図の export を組にする */
function 見本たち(): { key: string; yaml: string; 図: CdlDiagram }[] {
  const out: { key: string; yaml: string; 図: CdlDiagram }[] = [];
  for (const [k, v] of Object.entries(見本)) {
    if (!k.startsWith("sourceYaml__") || typeof v !== "string") continue;
    const key = k.slice("sourceYaml__".length);
    const 図 = (見本 as Record<string, unknown>)[key];
    if (!図 || typeof 図 !== "object") throw new Error(`${key} に対応する図の export が無い`);
    out.push({ key, yaml: v, 図: 図 as CdlDiagram });
  }
  return out;
}

/** 宿主の段が動かす、部品の中の値の名前 (`{部品の名前}__{値の名前}`) */
function 部品の値を動かす段(図: CdlDiagram): string[] {
  return 図.phases.flatMap((p) => (p.tweens ?? []).map((t) => t.stateId).filter((s) => s.includes("__")));
}

const 一覧の見本 = 見本たち();

describe("部品を繋いだまま動かす頁 (#2125)", () => {
  it("部品の頁の最後に並び、16 の切替を持つ", async () => {
    const { loadPartsItems } = await import("@/lib/catalog-items");
    const items = await loadPartsItems();
    // 並びは「部品そのもの → 箱として置く → 繋いで動かす」。 置き方を読んでから動かし方を読む
    expect(items.at(-1)?.id).toBe(見本.partsMotion.id);
    expect(items.at(-1)?.patterns?.map((p) => p.名)).toEqual([
      "流れに沿って動かす",
      "要素ごとに繋ぐ",
      "分ける",
      "集める",
      "部品の段を残す",
      "振り分けて合流させる",
      "配ってから写す",
      "仕分けてから溜める",
      "やり直してから倒す",
      "重なりを消してから溜める",
      "写してから待ち合わせる",
      "そろってから遮断する",
      "割ってから溜める",
      "割ってから詰まらせる",
      "そろってから押し出す",
      "落ちた分が消える",
    ]);
  });

  it("見本が 16 件ある", () => {
    // 空振り防止。 0 件なら下の it.each が 1 件も走らず、全部通ったように見える
    expect(一覧の見本.map((x) => x.key)).toHaveLength(16);
  });

  it.each(一覧の見本)("$key は矢印と段を両方持つ", ({ 図 }) => {
    expect(図.edges.length, "矢印が 1 本も無い").toBeGreaterThan(0);
    expect(図.phases.length, "段が 2 つ以上無い").toBeGreaterThan(1);
  });

  it.each(一覧の見本)("$key は宿主の段が部品の中の値を動かす", ({ 図 }) => {
    expect(部品の値を動かす段(図), "宿主の段が部品の値を 1 つも動かしていない").not.toHaveLength(0);
  });

  it.each(一覧の見本)("$key は動かす値が実在する", ({ 図 }) => {
    const 実在 = new Set(図.states.map((s) => s.id));
    const 無い = 部品の値を動かす段(図).filter((s) => !実在.has(s));
    expect(無い, "段が指す値が図に無い (部品の名前か値の名前の綴り違い)").toEqual([]);
  });

  it.each(一覧の見本)("$key は組み立ての知らせが 0 件", ({ yaml }) => {
    const 知らせ: CompileNotice[] = [];
    textDslToDiagram(yaml, { partsCatalog: 一覧, onNotice: (n) => 知らせ.push(n) });
    expect(知らせ.map((n) => `${n.kind} ${n.message}`)).toEqual([]);
  });

  it("要素を名指しして繋ぐ見本がある", () => {
    const 名指し = 一覧の見本.filter(
      (x) => x.yaml.includes("toPartNode") && x.yaml.includes("fromPartNode"),
    );
    expect(名指し.map((x) => x.key), "toPartNode と fromPartNode を両方書いた見本が無い").not.toHaveLength(0);
  });

  it("名指しした矢印が部品の中の要素に繋がる", () => {
    const 名指し = 一覧の見本.find(
      (x) => x.yaml.includes("toPartNode") && x.yaml.includes("fromPartNode"),
    );
    if (!名指し) throw new Error("名指しの見本が無い (前の検査が落ちているはず)");
    // 仮の箱のままなら端は `stock` になる。 繋ぎ直されていれば `stock__topL` の形になる
    const 端 = 名指し.図.edges.flatMap((e) => [e.from, e.to]);
    expect(端.filter((n) => n.includes("__")), "部品の中の要素に繋がっていない").not.toHaveLength(0);
  });

  it("要素を 2 つ以上持つ部品どうしを、両端とも要素で繋ぐ見本がある (#2149)", () => {
    // 要素が 1 つの部品は名指ししなくても矢印がその要素に付き、端は `inflow__bar` の形になる。
    // 端の形だけを見ると、最初の見本 (棒 → 波 → 弧) でも通ってしまう。 部品の要素の数で分ける
    const 部品どうし = 一覧の見本.flatMap(({ key, 図 }) => {
      const 要素の数 = (頭: string) => 図.nodes.filter((n) => n.id.startsWith(`${頭}__`)).length;
      const 部品の名前 = (id: string) => (id.includes("__") ? id.slice(0, id.indexOf("__")) : undefined);
      return 図.edges
        .filter((e) => {
          const 元 = 部品の名前(e.from);
          const 先 = 部品の名前(e.to);
          return 元 !== undefined && 先 !== undefined && 元 !== 先 && 要素の数(元) > 1 && 要素の数(先) > 1;
        })
        .map((e) => `${key}: ${e.from} -> ${e.to}`);
    });
    expect(部品どうし, "要素を 2 つ以上持つ部品どうしを繋ぐ矢印が無い").not.toHaveLength(0);
  });

  it("部品どうしを繋ぐ見本では、部品の中の線の札が数字を持たない (#2149)", () => {
    // 振り分け器が「7 割」 を送った先で合流点が「6 割」 と書く絵になっていた。 値は箱の上の読み取りに
    // 出るので、繋いで使う部品の札は向きや働きの言葉にする
    const 数字の札 = 一覧の見本.flatMap(({ key, 図 }) => {
      const 部品の名前 = (id: string) => (id.includes("__") ? id.slice(0, id.indexOf("__")) : undefined);
      const 繋いだ部品 = new Set(
        図.edges
          .filter((e) => {
            const 元 = 部品の名前(e.from);
            const 先 = 部品の名前(e.to);
            return 元 !== undefined && 先 !== undefined && 元 !== 先;
          })
          .flatMap((e) => [部品の名前(e.from)!, 部品の名前(e.to)!]),
      );
      return 図.edges
        .filter((e) => {
          const 元 = 部品の名前(e.from);
          return 元 !== undefined && 繋いだ部品.has(元) && 元 === 部品の名前(e.to);
        })
        .filter((e) => /[0-9０-９]/.test(e.label ?? ""))
        .map((e) => `${key}: ${e.from} -> ${e.to} "${e.label}"`);
    });
    expect(数字の札).toEqual([]);
  });

  it("段で部品の中の要素を名指しした見本があり、その段では名指しした要素だけが光る (#2151)", () => {
    // 見本の本文から段ごとに `focus` を読む。 見本は全て 1 行 1 段の書き方で、`focus` を 1 行の `[...]` で書く
    const 段ごとのfocus = (yaml: string): string[][] =>
      yaml
        .split(/\n\s*- step:/)
        .slice(1)
        .map((段) => {
          const m = 段.match(/\n\s*focus:\s*\[(.*)\]/);
          return m ? m[1]!.split(",").map((s) => s.trim().replace(/^"|"$/g, "")) : [];
        });
    const 名指し: string[] = [];
    const 外れ: string[] = [];
    for (const { key, yaml, 図 } of 一覧の見本) {
      const 要素 = new Set([...図.nodes.map((n) => n.id), ...図.edges.map((e) => e.id)]);
      for (const [i, 書いた] of 段ごとのfocus(yaml).entries()) {
        const 段 = 図.phases[i]!;
        // 部品の中の 1 つを指す名前 = 図に入った部品の要素か線の id と同じ名前
        for (const id of 書いた.filter((x) => x.includes("__") && 要素.has(x))) {
          名指し.push(`${key} ${段.title}: ${id}`);
          const 部品 = id.slice(0, id.indexOf("__"));
          // 同じ段に部品の名前そのものを書いていれば全体が光るので、その段は数えない
          if (書いた.includes(部品)) continue;
          // 名指ししなかった同じ部品の要素と中の線は光らない (光ると部品の名前で書いた時と同じ絵になる)
          const 書かなかったのに光る = 段.activate.filter((x) => x.startsWith(`${部品}__`) && !書いた.includes(x));
          if (!段.activate.includes(id)) 外れ.push(`${key} ${段.title}: ${id} が光らない`);
          if (書かなかったのに光る.length > 0) 外れ.push(`${key} ${段.title}: 書いていない ${書かなかったのに光る.join(", ")} が光る`);
        }
      }
    }
    expect(名指し, "段で部品の中の要素を名指しした見本が無い").not.toHaveLength(0);
    expect(外れ).toEqual([]);
  });

  it("両端の要素を名指しして繋いだ矢印は折れない (#2159)", () => {
    // 名指しは「どの出口からどの入口へ渡したか」 を読ませる書き方なので、渡す側と受ける側が同じ段に
    // 並ぶ組を選ぶ。 端の出口へ繋ぎ替えると段がずれ、矢印が途中で折れて別の要素を指しているように見える。
    // 要素を名指ししていない矢印 (部品の要素が 1 つで自動で付く形) は、箱の高さの違いで折れてよい
    const 名指しの矢印 = /^\s*-\s*(\S+)\s*->\s*(\S+):.*fromPartNode:\s*(\w+).*toPartNode:\s*(\w+)/;
    const 折れ: string[] = [];
    const 見た: string[] = [];
    for (const { key, yaml, 図 } of 一覧の見本) {
      const laid = layout(図);
      for (const 行 of yaml.split("\n")) {
        const m = 行.match(名指しの矢印);
        if (!m) continue;
        const [元, 先] = [`${m[1]}__${m[3]}`, `${m[2]}__${m[4]}`];
        const e = laid.edges.find((x) => x.from === 元 && x.to === 先);
        expect(e, `${key}: ${元} -> ${先} の矢印が図に無い`).toBeDefined();
        見た.push(`${key}: ${元} -> ${先}`);
        const 縦 = [...e!.d.matchAll(/[ML]\s*-?\d+(?:\.\d+)?\s+(-?\d+(?:\.\d+)?)/g)].map((x) => Math.round(Number(x[1])));
        if (new Set(縦).size > 1) 折れ.push(`${key}: ${e!.id} ${e!.d.replace(/\s+/g, " ")}`);
      }
    }
    expect(見た, "両端を名指しした矢印が 1 本も無い (検査が空振りしている)").not.toHaveLength(0);
    expect(折れ).toEqual([]);
  });

  it.each(一覧の見本)("$key は差し込んだ縦列が宿主のすぐ右に並ぶ (#2149)", ({ 図 }) => {
    // 縦列を 2 本持つ部品を縦列に置くと `{宿主}__列2` が足される。 左隣が宿主 (か 1 つ前の
    // 差し込んだ縦列) でなければ、部品の要素の間に別の縦列が挟まり、線が箱を貫く (#2147)
    const 左から = [...layout(図).lanes].sort((p, q) => p.x - q.x).map((l) => l.id);
    for (const [i, id] of 左から.entries()) {
      const m = id.match(/^(.*)__列(\d+)$/);
      if (!m) continue;
      const 左隣として正しい = Number(m[2]) === 2 ? m[1] : `${m[1]}__列${Number(m[2]) - 1}`;
      expect(左から[i - 1], `${id} の左隣 (並び ${左から.join(" → ")})`).toBe(左隣として正しい);
    }
  });
});
