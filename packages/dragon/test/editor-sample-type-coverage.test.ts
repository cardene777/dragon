import { describe, expect, it, vi } from "vitest";

import { PRESET_TYPES } from "../src/v05/parser";
import { textDslToDiagram } from "../src";
import { EDITOR_SAMPLES } from "../../../apps/playground-spa/src/data/editor-samples";

/**
 * 記法が受ける型すべてに、 エディタの見本がある (#1154)。
 *
 * エディタは記法を編集する画面なので、 **catalog に何を足してもここには増えない**。 型を足した
 * のに見本を置き忘れると、 書けるのに誰も気付かない状態になる。
 *
 * 実際 `solidity` は型がありながら見本が無く、 12 種のうち 1 種だけ触れない状態が続いていた。
 */

/** 記法の `type:` を 1 行目から取り出す。 */
function 型を読む(code: string): string | null {
  const m = code.match(/^type:\s*([a-z0-9-]+)\s*$/mu);
  return m ? m[1]! : null;
}

describe("記法の型に見本がある (#1154)", () => {
  it("見本の無い型が無い", () => {
    const 使用 = new Set(EDITOR_SAMPLES.map((s) => 型を読む(s.code)).filter(Boolean));
    const 無い = [...PRESET_TYPES].filter((t) => !使用.has(t)).sort();
    expect(無い, `見本の無い型がある (editor-samples.ts に足す): ${無い.join(", ")}`).toEqual([]);
  });

  it("見本の型はすべて記法が受ける", () => {
    // 綴りを間違えた見本は画面で初めて落ちる。 ここで捕まえる
    const 未知 = EDITOR_SAMPLES.map((s) => 型を読む(s.code))
      .filter((t): t is string => t !== null)
      .filter((t) => !(PRESET_TYPES as ReadonlySet<string>).has(t));
    expect(未知, `記法が受けない型の見本がある: ${未知.join(", ")}`).toEqual([]);
  });
});

/**
 * 値で描く 3 型 (`pie` / `bar` / `line`) の反例。
 *
 * 3 型は入力の形が同じで組立ても 1 つにまとめてあるので、 反例も揃えて見る。
 */
describe("値で描く型の反例 (#1154)", () => {
  const 値の型 = ["pie", "bar", "line"] as const;
  const 記法 = (t: string, actors: string, flow = "") =>
    `title: "確認"\ntype: ${t}\n\nactors:\n${actors}\n${flow}`;

  it.each(値の型)("%s = 読めない値は載せず、 読めた分だけ描く", (t) => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const d = textDslToDiagram(記法(t, `  - A: "10"\n  - B: "四割"\n`));
    // **黙って 0 にしない**。 0 にすると、 その項目だけ欠けた図が「正しい図」 として出る
    expect(d.nodes[0]?.chartData).toEqual([{ label: "A", value: 10 }]);
    expect(warn, "読めなかったことを伝えていない").toHaveBeenCalled();
    warn.mockRestore();
  });

  it.each(値の型)("%s = 項目が 1 つでも描ける", (t) => {
    const d = textDslToDiagram(記法(t, `  - A: "10"\n`));
    expect(d.nodes[0]?.chartData).toEqual([{ label: "A", value: 10 }]);
  });

  it.each(値の型)("%s = 矢印は描けないので捨てて伝える", (t) => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const d = textDslToDiagram(記法(t, `  - A: "10"\n  - B: "20"\n`, `\nflow:\n  - A -> B: "x"\n`));
    expect(d.edges ?? [], "矢印を描いている").toEqual([]);
    expect(warn, "捨てたことを伝えていない").toHaveBeenCalled();
    warn.mockRestore();
  });

  it("型ごとに描画側の種別が変わる", () => {
    const 種別 = (t: string) => textDslToDiagram(記法(t, `  - A: "10"\n`)).nodes[0]?.kind;
    expect(種別("pie")).toBe("chart-pie");
    expect(種別("bar")).toBe("chart-bar");
    expect(種別("line")).toBe("chart-line");
  });
});

/**
 * 値で描く型の直し (#1154 review)。
 *
 * review が 5 件出した。 うち 4 件は「気付けない壊れ方」 = 型は通るのに実行時に弾かれる /
 * 項目が消えた理由が誰にも見えない / 有効な値が消える / 高さだけ違う。
 */
describe("値で描く型の直し (#1154)", () => {
  const 記法 = (t: string, actors: string, flow = "") =>
    `title: "確認"\ntype: ${t}\n\nactors:\n${actors}\n${flow}`;

  it("JSON 経路も同じ型を受ける", async () => {
    // 型を 3 箇所に写していたため、 記法に足しても JSON 経路が古い一覧で弾いた
    const { jsonToDiagram } = await import("../src/json-parser");
    for (const t of ["bar", "line"]) {
      // 型が弾かれると `type must be one of` で落ちる。 それ以外の理由で落ちないよう
      // 必須の項目は揃えておく
      expect(
        () => jsonToDiagram({ title: "確認", type: t, actors: [{ name: "A", subtitle: "10" }], flow: [] }),
        `JSON 経路が ${t} を弾いている`,
      ).not.toThrow();
    }
  });

  it("読めない項目を利用者に伝える", () => {
    // `console.warn` だけだと、 項目が消えた理由が画面に出ない
    const 届いた: string[] = [];
    textDslToDiagram(記法("bar", `  - A: "10"\n  - B: "四割"\n`), {
      onNotice: (n) => 届いた.push(n.kind),
    });
    expect(届いた, "利用者に届く経路へ出していない").toContain("chart-value-unreadable");
  });

  it("矢印を捨てたことも伝える", () => {
    const 届いた: string[] = [];
    textDslToDiagram(記法("line", `  - A: "10"\n  - B: "20"\n`, `\nflow:\n  - A -> B: "x"\n`), {
      onNotice: (n) => 届いた.push(n.kind),
    });
    expect(届いた).toContain("chart-edge-dropped");
  });

  it("折れ線は負の数も載せる", () => {
    // 増減を追う図なので、 気温や損益のように 0 を跨ぐ値が来る
    const d = textDslToDiagram(記法("line", `  - A: "-5"\n  - B: "10"\n`));
    expect(d.nodes[0]?.chartData).toEqual([
      { label: "A", value: -5 },
      { label: "B", value: 10 },
    ]);
  });

  it("高さが描画側の既定と揃う", () => {
    // 揃えないと、 同じ値を同じ図種で描いても catalog と記法で高さが変わる
    const 高さ = (t: string) => textDslToDiagram(記法(t, `  - A: "10"\n`)).nodes[0]?.h;
    expect(高さ("pie")).toBe(320);
    // 360 は 16 で割り切れないので 368 へ切り上げる (格子に載せる)
    expect(高さ("bar")).toBe(368);
    expect(高さ("line")).toBe(368);
  });
});

/**
 * 段 2 / 段 3 の 4 型 (#1154)。
 *
 * 値で描く 3 型と違い、 actor から読むものが型ごとに違う。 何を読むかを検査で固定する。
 */
describe("残り 4 型が記法から描ける (#1154)", () => {
  const 記法 = (t: string, body: string) => `title: "確認"\ntype: ${t}\n\nactors:\n${body}`;

  it("funnel = 数を読む", () => {
    const d = textDslToDiagram(記法("funnel", `  - 訪問: "12000"\n  - 申込み: "480"\n`));
    expect(d.nodes[0]?.kind).toBe("funnel-stages");
    expect(d.nodes[0]?.funnelData?.map((x) => x.count)).toEqual([12000, 480]);
  });

  it("tree = 矢印で親子を読む", () => {
    // 親子は 2 つの名前の関係なので、 1 行 1 値では書けない。 矢印を使う
    const d = textDslToDiagram(
      `title: "確認"\ntype: tree\n\nactors:\n  - 親\n  - 子\n\nflow:\n  - 親 -> 子: ""\n`,
    );
    expect(d.nodes[0]?.kind).toBe("tree-hierarchy");
    const t = d.nodes[0]?.treeData ?? [];
    expect(t.find((x) => x.title === "子")?.parent, "子の親が読めていない").toBeTruthy();
    expect(t.find((x) => x.title === "親")?.parent, "根に親が付いている").toBeUndefined();
  });

  it("journey = 気持ちを日本語で読む", () => {
    const d = textDslToDiagram(記法("journey", `  - 知る: "普通"\n  - 登録: "不満"\n`));
    expect(d.nodes[0]?.kind).toBe("journey-map");
    expect(d.nodes[0]?.journeyData?.map((x) => x.emotion)).toEqual(["neutral", "frustrated"]);
  });

  it("quadrant = 区画を縦横の言葉で読む", () => {
    const d = textDslToDiagram(記法("quadrant", `  - A: "左上"\n  - B: "右下"\n`));
    expect(d.nodes[0]?.kind).toBe("quadrant-matrix");
    expect(d.nodes[0]?.quadrantData?.items.map((x) => x.quadrant)).toEqual([
      "topLeft",
      "bottomRight",
    ]);
  });

  // 読める語は型で違うので、 型ごとに 1 つ正しい語を渡す
  it.each([
    ["journey", "普通"],
    ["quadrant", "左上"],
  ])("%s = 読めない語は載せずに伝える", (t, 正しい語) => {
    const 届いた: string[] = [];
    const d = textDslToDiagram(記法(t, `  - A: "${正しい語}"\n  - B: "よくわからない"\n`), {
      onNotice: (n) => 届いた.push(n.kind),
    });
    const 件数 =
      t === "journey" ? d.nodes[0]?.journeyData?.length : d.nodes[0]?.quadrantData?.items.length;
    expect(件数, "読めない語を載せている").toBe(1);
    expect(届いた, "利用者に届く経路へ出していない").toContain("chart-value-unreadable");
  });
});

/**
 * 書ける語の一覧を親から引かせない (#1154 review Round 3)。
 *
 * 日本語の語を plain object で持つと、 `__proto__` や `constructor` が親から引けてしまい、
 * **一覧に無い入力が値として通る**。 型は付いていても中身は object や function になり、
 * 描画側へそのまま流れる。
 */
describe("書ける語の一覧が親から引けない (#1154)", () => {
  const 記法 = (t: string, 語: string) =>
    `title: "確認"\ntype: ${t}\n\nactors:\n  - A: "${語}"\n`;

  it.each([
    ["journey", "__proto__"],
    ["journey", "constructor"],
    ["quadrant", "__proto__"],
    ["quadrant", "constructor"],
  ])("%s = %s は書ける語ではない", (t, 語) => {
    const d = textDslToDiagram(記法(t, 語));
    const 件数 =
      t === "journey" ? d.nodes[0]?.journeyData?.length : d.nodes[0]?.quadrantData?.items.length;
    expect(件数, `${語} が値として通っている`).toBe(0);
  });

  it("tree = 書いていない名前への矢印も伝える", () => {
    const 届いた: string[] = [];
    textDslToDiagram(
      `title: "確認"\ntype: tree\n\nactors:\n  - 親\n\nflow:\n  - 親 -> 居ない子: ""\n`,
      { onNotice: (n) => 届いた.push(n.kind) },
    );
    expect(届いた, "子の側を見ていない").toContain("chart-value-unreadable");
  });

  it.each(["pie", "bar", "funnel"])("%s = 負の数は受けない", (t) => {
    const d = textDslToDiagram(記法(t, "-5"));
    const 件数 =
      t === "funnel" ? d.nodes[0]?.funnelData?.length : d.nodes[0]?.chartData?.length;
    expect(件数, "負の数を載せている").toBe(0);
  });

  it("line = 負の数は受ける", () => {
    expect(textDslToDiagram(記法("line", "-5")).nodes[0]?.chartData).toEqual([
      { label: "A", value: -5 },
    ]);
  });
});

/**
 * JSON 経路でも知らせが届く (#1154 review Round 4)。
 *
 * `onNotice` を記法経路にしか通していなかった。 **エディタの YAML 欄は JSON 経路を通る**ので、
 * そこで読めない値を書いても理由が出なかった。
 */
describe("JSON 経路でも知らせが届く (#1154)", () => {
  it("読めない値を伝える", async () => {
    const { jsonToDiagram } = await import("../src/json-parser");
    const 届いた: string[] = [];
    jsonToDiagram(
      {
        title: "確認",
        type: "bar",
        actors: [{ name: "A", subtitle: "10" }, { name: "B", subtitle: "四割" }],
        flow: [],
      },
      { onNotice: (n) => 届いた.push(n.kind) },
    );
    expect(届いた, "JSON 経路で知らせが出ていない").toContain("chart-value-unreadable");
  });
});

/**
 * Round 5 の指摘 (#1154)。
 */
describe("矢印を使わない型はすべて伝える (#1154)", () => {
  it.each(["funnel", "journey", "quadrant"])("%s = 矢印を捨てたら伝える", (t) => {
    const 値 = t === "journey" ? "普通" : t === "quadrant" ? "左上" : "10";
    const 届いた: string[] = [];
    textDslToDiagram(
      `title: "確認"\ntype: ${t}\n\nactors:\n  - A: "${値}"\n  - B: "${値}"\n\nflow:\n  - A -> B: "x"\n`,
      { onNotice: (n) => 届いた.push(n.kind) },
    );
    expect(届いた, "捨てたことを伝えていない").toContain("chart-edge-dropped");
  });
});

describe("高さが描画側の格子に載る (#1154)", () => {
  it("値で描かない 4 型も 16 の倍数", () => {
    // 前回は棒と折れ線だけ直し、 図表 4 型が 360 のまま残っていた (review Round 6)
    const 高さ = (t: string, body: string) =>
      textDslToDiagram(`title: "確認"\ntype: ${t}\n\nactors:\n${body}`).nodes[0]?.h ?? 0;
    expect(高さ("funnel", `  - A: "10"\n`) % 16, "funnel が格子に載っていない").toBe(0);
    expect(高さ("journey", `  - A: "普通"\n`) % 16, "journey が格子に載っていない").toBe(0);
    expect(高さ("quadrant", `  - A: "左上"\n`) % 16, "quadrant が格子に載っていない").toBe(0);
    expect(高さ("tree", `  - A\n`) % 16, "tree が格子に載っていない").toBe(0);
  });

  it("棒と折れ線は 16 の倍数", () => {
    // 360 は 16 で割り切れない。 切り上げないと下端が格子から外れ、 位置の警告が出る
    const 高さ = (t: string) =>
      textDslToDiagram(`title: "確認"\ntype: ${t}\n\nactors:\n  - A: "10"\n`).nodes[0]?.h ?? 0;
    expect(高さ("bar") % 16, "棒が格子に載っていない").toBe(0);
    expect(高さ("line") % 16, "折れ線が格子に載っていない").toBe(0);
    expect(高さ("pie") % 16, "円が格子に載っていない").toBe(0);
  });
});

describe("同じ id になる名前を伝える (#1154)", () => {
  it("tree = 違う名前が同じ id に潰れたら伝える", () => {
    // 記号だけが違う名前は同じ id になる。 黙って通すと自己参照や重複を生む
    const 届いた: string[] = [];
    textDslToDiagram(
      `title: "確認"\ntype: tree\n\nactors:\n  - "a b"\n  - "a-b"\n`,
      { onNotice: (n) => 届いた.push(n.kind) },
    );
    expect(届いた, "同じ id になることを伝えていない").toContain("chart-value-unreadable");
  });
});

/**
 * 知らせが行番号を持つ (#1154 review Round 7)。
 *
 * `DslActor` / `DslStep` は `pos.line` を持つので遡れる。 0 に潰すと、 画面が問題の行を
 * 案内できない。
 */
describe("知らせが行番号を持つ (#1154)", () => {
  it("読めない値の行を伝える", () => {
    const 届いた: { line: number }[] = [];
    // 5 行目に読めない値を置く
    textDslToDiagram(`title: "確認"\ntype: bar\n\nactors:\n  - A: "四割"\n`, {
      onNotice: (n) => 届いた.push({ line: n.line }),
    });
    expect(届いた[0]?.line, "行を 0 に潰している").toBeGreaterThan(0);
  });

  it("捨てた矢印の行を伝える", () => {
    const 届いた: { line: number }[] = [];
    textDslToDiagram(
      `title: "確認"\ntype: bar\n\nactors:\n  - A: "10"\n  - B: "20"\n\nflow:\n  - A -> B: "x"\n`,
      { onNotice: (n) => 届いた.push({ line: n.line }) },
    );
    expect(届いた[0]?.line, "行を 0 に潰している").toBeGreaterThan(0);
  });
});
