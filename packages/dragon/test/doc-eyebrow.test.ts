import { describe, it, expect } from "vitest";
import { parseTextDslV05 } from "../src/v05";
import { compileToCdl, type CompileNotice } from "../src/compile";
import { jsonToDiagram, validateDragonJson } from "../src/json-parser";
import DIAGRAM_SCHEMA from "../src/schemas/diagram.json";

/**
 * 図表の箱に上の小見出しを書けることの検証 (#1247)。
 *
 * 図全体を 1 箱にする図種 (`pie` / `bar` / `line` / `funnel` / `tree` / `journey` /
 * `quadrant` / `mind` / `gantt`) は箱を 1 つしか作らない。 その箱に上の小見出しを渡す経路が
 * 記法に無く、 組立て API で作った同じ図と見比べると小見出しだけが空になっていた。
 *
 * 実測 = catalog の図表 8 件はいずれも `tree` / `userJourney` / `mindMap` / `funnel` /
 * `quadrant` / `pie` / `line` / `gantt` の小見出しを持つが、 記法で書き直すと消えた。
 *
 * 箱ごとに分かれる図種では「どの箱の小見出しか」 が決まらないため、 書かれていたら伝える
 * (#1026 / #1090 / #1246 と同じ「書いたのに効かない状態を黙って作らない」)。
 */

/** 図全体を 1 箱にする図種。 上の小見出しの相手が決まる */
const 一箱の図種 = [
  "pie", "bar", "line", "funnel", "tree", "journey", "quadrant", "mind", "gantt",
] as const;

/** 箱ごとに分かれる図種。 相手が決まらない */
const 箱ごとの図種 = [
  "sequence", "flow", "swimlane", "er", "state", "topology", "solidity", "class", "c4",
] as const;

const 記法 = (type: string, 小見出し?: string) =>
  `title: "確認"\n${小見出し === undefined ? "" : `eyebrow: ${小見出し}\n`}type: ${type}\n\n` +
  `actors:\n  - A: "1"\n  - B: "2"\nflow:\n  - A -> B: "x"\n`;

function 組み立てる(src: string): { 図: ReturnType<typeof compileToCdl>; 知らせ: CompileNotice[] } {
  const r = parseTextDslV05(src);
  if (!r.ok) throw new Error(r.errors.map((e) => `L${e.line}: ${e.message}`).join("\n"));
  const 知らせ: CompileNotice[] = [];
  return { 図: compileToCdl(r.doc, { onNotice: (n) => 知らせ.push(n) }), 知らせ };
}

const 箱の小見出し = (src: string) =>
  (組み立てる(src).図.nodes[0] as { eyebrow?: string } | undefined)?.eyebrow;

const 小見出しの知らせ = (src: string) =>
  組み立てる(src).知らせ.filter((n) => n.kind === "eyebrow-not-honored");

describe("図全体を 1 箱にする図種で上の小見出しが付く (#1247)", () => {
  for (const type of 一箱の図種) {
    it(`${type} の箱に付く`, () => {
      expect(箱の小見出し(記法(type, '"見出し"'))).toBe("見出し");
    });
  }

  it("引用符なしでも読める", () => {
    expect(箱の小見出し(記法("bar", "棒グラフ"))).toBe("棒グラフ");
  });

  it("知らせは出ない", () => {
    expect(小見出しの知らせ(記法("bar", '"見出し"'))).toEqual([]);
  });
});

describe("書かなければ何も付かない (陰性対照)", () => {
  for (const type of ["bar", "funnel", "mind"] as const) {
    it(`${type} で書かなければ小見出しが無い`, () => {
      // 検査が恒真でないことを見る。 これが落ちれば「付いた」 を判定できていない
      expect(箱の小見出し(記法(type)), "書いていないのに付いている").toBeUndefined();
    });
  }

  it("空で書いた形は書かなかったのと同じ", () => {
    // 空文字を残すと描画側が中身のない帯を出す
    expect(箱の小見出し(記法("bar", ""))).toBeUndefined();
  });

  it("空で書いた形では知らせも出ない", () => {
    expect(小見出しの知らせ(記法("flow", ""))).toEqual([]);
  });
});

describe("箱ごとに分かれる図種では伝える", () => {
  for (const type of 箱ごとの図種) {
    it(`${type} で知らせが出る`, () => {
      expect(小見出しの知らせ(記法(type, '"見出し"'))).toHaveLength(1);
    });
  }

  it("知らせに図種の名前と直し方が入る", () => {
    const n = 小見出しの知らせ(記法("swimlane", '"見出し"'))[0];
    expect(n?.message, "図種の名前が無い").toContain("type: swimlane");
    expect(n?.hint, "直し方が無い").toContain("箱ごとに書いて");
  });

  it("書かなければ知らせない", () => {
    expect(小見出しの知らせ(記法("flow"))).toEqual([]);
  });

  it("箱ごとの小見出しは従来どおり効く", () => {
    // 案内した先が実際に効くことを見る。 効かないなら案内が誤り
    const src = `title: "確認"\ntype: flow\n\nactors:\n  - A: { eyebrow: "箱の見出し" }\n  - B\n` +
      `flow:\n  - A -> B: "x"\n`;
    expect((組み立てる(src).図.nodes[0] as { eyebrow?: string }).eyebrow).toBe("箱の見出し");
  });
});

describe("記法の読み取り", () => {
  it("eyebrow は最上位の項目として読める", () => {
    const r = parseTextDslV05(記法("bar", '"見出し"'));
    expect(r.ok, "解析に失敗した").toBe(true);
    expect(r.ok ? r.doc.eyebrow : undefined).toBe("見出し");
  });

  it("書かなければ持たない", () => {
    const r = parseTextDslV05(記法("bar"));
    expect(r.ok ? "eyebrow" in r.doc : true, "書いていないのに項目がある").toBe(false);
  });
});

describe("知らせの行番号 (Round 1 の指摘)", () => {
  // 図の pos は常に 1 行目を指す。 そこを使うと、 離れた行に書いた eyebrow が効かないことを
  // 1 行目として知らせることになり、 書いた場所に辿り着けない
  it("書いた行を指す", () => {
    const src = `title: "確認"\ntype: flow\n\n\n\neyebrow: "見出し"\n\n` +
      `actors:\n  - A\n  - B\nflow:\n  - A -> B: "x"\n`;
    expect(小見出しの知らせ(src)[0]?.line, "書いた行を指していない").toBe(6);
  });

  it("1 行目に書いた時も一致する", () => {
    // 上の検査だけだと「常に 1 を返す」 実装と区別できない位置に居るため、 両端を押さえる
    const src = `eyebrow: "見出し"\ntitle: "確認"\ntype: flow\n\n` +
      `actors:\n  - A\n  - B\nflow:\n  - A -> B: "x"\n`;
    expect(小見出しの知らせ(src)[0]?.line).toBe(1);
  });
});

describe("JSON の入口でも同じ図になる (Round 1 の指摘)", () => {
  // 記法と JSON は同じ図を作る 2 つの入口。 片方だけに項目を足すと、 同じ内容を書いても
  // 入口によって図が変わる
  const json = (extra: Record<string, unknown>) => ({
    title: "確認",
    type: "bar",
    actors: [{ name: "A", value: "1" }, { name: "B", value: "2" }],
    flow: [],
    ...extra,
  });

  it("schema が最上位の eyebrow を受ける", () => {
    // schema は additionalProperties: false のため、 載せないと JSON 側で必ず弾かれる
    const props = (DIAGRAM_SCHEMA as { properties: Record<string, unknown> }).properties;
    expect(Object.keys(props), "schema に載っていない").toContain("eyebrow");
  });

  it("検証を通る", () => {
    expect(validateDragonJson(json({ eyebrow: "棒グラフ" })).ok, "検証で弾かれた").toBe(true);
  });

  it("文字列でない値は弾く", () => {
    const r = validateDragonJson(json({ eyebrow: 1 }));
    expect(r.ok, "数を通している").toBe(false);
  });

  it("図表の箱に届く", () => {
    const d = jsonToDiagram(json({ eyebrow: "棒グラフ" }));
    expect((d.nodes[0] as { eyebrow?: string }).eyebrow, "箱に届いていない").toBe("棒グラフ");
  });

  it("書かなければ付かない", () => {
    const d = jsonToDiagram(json({}));
    expect((d.nodes[0] as { eyebrow?: string }).eyebrow).toBeUndefined();
  });

  it("空文字は書かなかったのと同じ", () => {
    // 記法側と揃える。 揃えないと同じ内容を書いても入口によって図が変わる
    const d = jsonToDiagram(json({ eyebrow: "" }));
    expect((d.nodes[0] as { eyebrow?: string }).eyebrow).toBeUndefined();
  });

  // Round 2 の指摘。 記法は値を trim() してから空かどうかを見るが、 JSON は長さだけを見て
  // いたため、 空白だけの値で入口ごとに図が変わっていた (記法は書かなかった扱い、
  // JSON は中身のない帯を描く)
  it.each([
    ["空白だけ", "   "],
    ["全角空白だけ", "　"],
    ["改行だけ", "\n"],
  ])("%s は書かなかったのと同じ", (_name, v) => {
    const d = jsonToDiagram(json({ eyebrow: v }));
    expect((d.nodes[0] as { eyebrow?: string }).eyebrow, "中身のない帯を描く").toBeUndefined();
  });

  it("前後の空白を落とす", () => {
    const d = jsonToDiagram(json({ eyebrow: "  棒グラフ  " }));
    expect((d.nodes[0] as { eyebrow?: string }).eyebrow).toBe("棒グラフ");
  });

  it.each([
    ["普通の値", '"棒グラフ"', "棒グラフ"],
    ["空白だけ", '"   "', "   "],
    ["前後に空白", '"  棒グラフ  "', "  棒グラフ  "],
  ])("%s で記法と JSON が一致する", (_name, 記法の値, JSONの値) => {
    // 1 つの値だけで見ると、 空白の扱いが割れていても気付けない (Round 2 で実測)
    const 記法の図 = 組み立てる(記法("bar", 記法の値)).図;
    const JSONの図 = jsonToDiagram(json({ eyebrow: JSONの値 }));
    expect(
      (JSONの図.nodes[0] as { eyebrow?: string }).eyebrow,
      "入口によって小見出しが変わる",
    ).toBe((記法の図.nodes[0] as { eyebrow?: string }).eyebrow);
  });

  it("記法と JSON が同じ小見出しになる", () => {
    const 記法の図 = 組み立てる(記法("bar", '"棒グラフ"')).図;
    const JSONの図 = jsonToDiagram(json({ eyebrow: "棒グラフ" }));
    expect(
      (JSONの図.nodes[0] as { eyebrow?: string }).eyebrow,
      "入口によって小見出しが変わる",
    ).toBe((記法の図.nodes[0] as { eyebrow?: string }).eyebrow);
  });
});
