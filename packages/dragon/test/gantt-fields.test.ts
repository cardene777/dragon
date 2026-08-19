import { describe, it, expect } from "vitest";
import { parseTextDslV05 } from "../src/v05";
import { compileToCdl, type CompileNotice } from "../src/compile";

/**
 * 工程の並びに担当と終わる時期を書けることの検証 (#1251)。
 *
 * 組み立て API の帯は担当を持ち、終わりを状態から取って段で伸び縮みさせられるが、
 * 記法には書く場所が無かった。 記法で書き直すと担当が消え、帯は常に 1 コマになる。
 *
 * 他の図種には相手が無いため、書かれていたら伝える (#1026 / #1090 / #1246 / #1247 と同じ)。
 */

function 組み立てる(src: string) {
  const r = parseTextDslV05(src);
  if (!r.ok) throw new Error(r.errors.map((e) => `L${e.line}: ${e.message}`).join("\n"));
  const 知らせ: CompileNotice[] = [];
  return { 図: compileToCdl(r.doc, { onNotice: (n) => 知らせ.push(n) }), 知らせ };
}

type 帯 = { id: string; startIdx: number | string; endIdx: number | string; startLabel: string; endLabel: string; owner?: string };

const 帯一覧 = (src: string) =>
  (組み立てる(src).図.nodes[0] as { ganttData?: 帯[] }).ganttData;

const 効かない知らせ = (src: string) =>
  組み立てる(src).知らせ.filter((n) => n.message.includes("工程の並びの欄がありません"));

const 工程 = (欄 = "") =>
  `title: "T"\ntype: gantt\n\nactors:\n  - 設計: { value: "Q1" }\n  - 実装: { value: "Q2"${欄} }\n  - 検証: { value: "Q3" }\n`;

describe("工程の並びに担当と終わる時期を書ける (#1251)", () => {
  it("担当が帯に届く", () => {
    expect(帯一覧(工程(', owner: "Eng"'))?.[1]?.owner).toBe("Eng");
  });

  it("終わる時期を書くと帯が伸びる", () => {
    const t = 帯一覧(工程(', end: "Q3"'))?.[1];
    expect(t?.startIdx, "始まりが動いている").toBe(1);
    expect(t?.endIdx, "終わりが伸びていない").toBe(2);
    expect(t?.endLabel, "終わりの字が変わっていない").toBe("Q3");
  });

  it("終わる時期を状態から取れる", () => {
    // 描画側が状態を解いて位置に直すため、段で帯が伸び縮みする
    const t = 帯一覧(工程(', end: "{build_end}"'))?.[1];
    expect(t?.endIdx).toBe("{build_end}");
    // 状態が指すのは位置であって時期の名前ではないので、字は始まりのものを使う
    expect(t?.endLabel, "字まで状態にしている").toBe("Q2");
  });

  it("書かなければ始まりと同じ (陰性対照)", () => {
    const t = 帯一覧(工程())?.[1];
    expect(t?.endIdx, "帯が勝手に伸びている").toBe(1);
    expect(t?.endLabel).toBe("Q2");
    expect(t && "owner" in t, "書いていないのに担当がある").toBe(false);
  });

  it("目盛りに無い時期を書いたら始まりと同じに倒す", () => {
    // 目盛りは書かれた順に作るため、載っていない名前は位置を持たない
    expect(帯一覧(工程(', end: "Q9"'))?.[1]?.endIdx).toBe(1);
  });

  it("知らせは出ない", () => {
    expect(効かない知らせ(工程(', owner: "Eng", end: "Q3"'))).toEqual([]);
  });
});

describe("工程の並びでない図種では伝える", () => {
  const 他図種 = (type: string, 欄: string) =>
    `title: "T"\ntype: ${type}\n\nactors:\n  - A: { ${欄} }\n  - B\nflow:\n  - A -> B: "x"\n`;

  for (const type of ["sequence", "flow", "swimlane", "er", "state", "topology", "pie", "bar", "funnel", "tree", "journey", "quadrant"]) {
    it(`${type} で知らせが出る`, () => {
      expect(効かない知らせ(他図種(type, 'owner: "Eng"'))).toHaveLength(1);
    });
  }

  it("2 つ書いたら両方を並べて伝える", () => {
    expect(効かない知らせ(他図種("flow", 'owner: "Eng", end: "Q3"'))[0]?.message).toContain("owner / end");
  });

  it("知らせに行番号と直し方が入る", () => {
    const n = 効かない知らせ(他図種("flow", 'owner: "Eng"'))[0];
    expect(n?.line, "行番号が違う").toBe(5);
    expect(n?.hint).toContain("type: gantt");
  });

  it("書かなければ知らせない (陰性対照)", () => {
    expect(効かない知らせ(他図種("flow", 'kind: storage'))).toEqual([]);
  });

  it("体験の道筋の欄とは別に伝える", () => {
    // 2 種類の欄を同時に書いたら、それぞれの直し方で 2 件出る = 片方だけ直しても残りが分かる
    const { 知らせ } = 組み立てる(他図種("flow", 'owner: "Eng", touchpoint: "x"'));
    expect(知らせ.filter((n) => n.message.includes("工程の並びの欄がありません"))).toHaveLength(1);
    expect(知らせ.filter((n) => n.message.includes("体験の道筋の欄がありません"))).toHaveLength(1);
  });

  it("放射の図では二重に知らせない", () => {
    const src = `title: "T"\ntype: mind\n\nactors:\n  - 中心\n  - A: { owner: "Eng" }\n`;
    const { 知らせ } = 組み立てる(src);
    expect(知らせ.filter((n) => n.message.includes("工程の並びの欄がありません"))).toEqual([]);
    expect(知らせ.some((n) => n.message.includes("担当 (工程の並びの欄)")), "放射の図の知らせから落ちている").toBe(true);
  });
});

describe("見本 (parts) の状態を横取りしない", () => {
  it("状態として残る", () => {
    const r = parseTextDslV05(`title: "T"\ntype: flow\n\nactors:\n  - g: { kind: arc-gauge, owner: 5, end: 9 }\n`);
    expect(r.ok, "解析に失敗した").toBe(true);
    expect(r.ok ? r.doc.actors[0]?.stateOverride : undefined).toEqual({ owner: 5, end: 9 });
  });

  it("見本では工程の欄にしない", () => {
    // 状態に残ることだけを見ると、欄にも同時に入れる実装を通してしまう (変異試験で判明)。
    // 見本の箱が工程の欄を持つと、帯を描かない図種で知らせが出る側にも回る
    const r = parseTextDslV05(`title: "T"\ntype: flow\n\nactors:\n  - g: { kind: arc-gauge, owner: 5, end: 9 }\n`);
    const a = r.ok ? r.doc.actors[0] : undefined;
    expect(a?.owner, "工程の欄に入れている").toBeUndefined();
    expect(a?.end, "工程の欄に入れている").toBeUndefined();
  });

  it("見本に書いても知らせない", () => {
    // 欄に入れてしまうと、ここで知らせが出る = 正しい見本が警告だらけになる
    expect(効かない知らせ(`title: "T"\ntype: flow\n\nactors:\n  - g: { kind: arc-gauge, owner: 5 }\n`)).toEqual([]);
  });

  it("縦に並べた形でも状態として残る", () => {
    const r = parseTextDslV05(
      `title: "T"\ntype: flow\n\nactors:\n  - g:\n      owner: 5\n      kind: arc-gauge\n`,
    );
    expect(r.ok, "解析に失敗した").toBe(true);
    expect(r.ok ? r.doc.actors[0]?.stateOverride : undefined).toEqual({ owner: 5 });
  });
});

describe("始まりより前に終わる帯 (Round 1 の指摘)", () => {
  // そのまま渡すと横幅が負になり、帯が始まりの位置から左へはみ出す
  const 逆向き = `title: "T"\ntype: gantt\n\nactors:\n  - 設計: { value: "Q1" }\n  - 実装: { value: "Q3", end: "Q1" }\n`;

  it("始まりと同じに倒す", () => {
    const t = 帯一覧(逆向き)?.[1];
    expect(t?.startIdx, "始まりが動いている").toBe(1);
    expect(t?.endIdx, "終わりが始まりより前のまま").toBe(1);
  });

  it("倒したことを伝える", () => {
    // 黙って倒すと「書いたのに 1 コマのまま」 が手掛かりなしで起きる
    const 出た: string[] = [];
    const もとの = console.warn;
    console.warn = (m: unknown) => 出た.push(String(m));
    try {
      組み立てる(逆向き);
    } finally {
      console.warn = もとの;
    }
    expect(出た.some((m) => m.includes("始まりより前です")), 出た.join(" / ")).toBe(true);
  });

  it("同じ時期に終わる形は伝えない (陰性対照)", () => {
    // 1 コマの帯は正しい書き方。 境目で誤って伝えると正しい記法が警告だらけになる
    const 出た: string[] = [];
    const もとの = console.warn;
    console.warn = (m: unknown) => 出た.push(String(m));
    try {
      組み立てる(`title: "T"\ntype: gantt\n\nactors:\n  - 設計: { value: "Q1", end: "Q1" }\n`);
    } finally {
      console.warn = もとの;
    }
    expect(出た.filter((m) => m.includes("始まりより前です"))).toEqual([]);
  });

  it("後の時期に終わる形は伝えない (陰性対照)", () => {
    const t = 帯一覧(工程(', end: "Q3"'))?.[1];
    expect(t?.endIdx).toBe(2);
  });
});

describe("状態から取る終わりも下限を見る (Round 2 の指摘)", () => {
  // 描画側 (別 package) は状態を解いてから位置に使うため、そこで下限を掛けることはできない。
  // ただし **状態が取る値は記法に全部書いてある** = 初期値と段が動かす先を集めれば見つかる
  const 集める = (src: string): string[] => {
    const 出た: string[] = [];
    const もとの = console.warn;
    console.warn = (m: unknown) => 出た.push(String(m));
    try {
      組み立てる(src);
    } finally {
      console.warn = もとの;
    }
    return 出た.filter((m) => m.includes("始まりより前になる値"));
  };

  const 状態つき = (初期: string, 段 = "") =>
    `title: "T"\ntype: gantt\n\nactors:\n  - 設計: { value: "Q1" }\n` +
    `  - 実装: { value: "Q2", end: "{done}" }\n\nstates:\n  done: ${初期}\n${段}`;

  it("初期値が始まりより前なら伝える", () => {
    // 始まりは 1 番目 (Q2)。 0 は Q1 の位置
    expect(集める(状態つき("0")), "初期値を見ていない").toHaveLength(1);
  });

  it("段が動かす先が始まりより前なら伝える", () => {
    // 初期値は正しくても、段で前へ動かせば同じことが起きる
    const 段 = `\nanimation:\n  - step: "s1" 1s\n    tween:\n      done: 1 -> 0\n`;
    expect(集める(状態つき("1", 段)), "段の行き先を見ていない").toHaveLength(1);
  });

  it("段が切り替える値が始まりより前なら伝える", () => {
    const 段 = `\nanimation:\n  - step: "s1" 1s\n    set:\n      done: 0\n`;
    expect(集める(状態つき("1", 段)), "切替の値を見ていない").toHaveLength(1);
  });

  it("知らせに始まりの位置が入る", () => {
    expect(集める(状態つき("0"))[0]).toContain("始まりは 1 番目です");
  });

  it("始まり以上の値だけなら伝えない (陰性対照)", () => {
    const 段 = `\nanimation:\n  - step: "s1" 1s\n    tween:\n      done: 1 -> 2\n`;
    expect(集める(状態つき("1", 段)), "正しい記法に知らせが出ている").toEqual([]);
  });

  it("始まりと同じ値では伝えない (陰性対照)", () => {
    // 境目。 1 コマの帯は正しい書き方
    expect(集める(状態つき("1"))).toEqual([]);
  });

  it("見つけても位置は状態の参照のまま渡す", () => {
    // 伝えるだけで倒さない = 段で正しい値に戻る書き方を潰さない
    const t = 帯一覧(状態つき("0"))?.[1];
    expect(t?.endIdx).toBe("{done}");
  });
});

describe("数として読めない状態では伝えない (Round 4 の指摘)", () => {
  // `Number("")` は 0 を返す。 そのまま数にすると位置 0 として扱われ、始まりが 1 以降の帯に
  // 誤った知らせが出る。 描画側はこの値を解けず始まりへ倒すので、警告する相手ではない
  const 集める = (初期: string): string[] => {
    const 出た: string[] = [];
    const もとの = console.warn;
    console.warn = (m: unknown) => 出た.push(String(m));
    try {
      組み立てる(
        `title: "T"\ntype: gantt\n\nactors:\n  - 設計: { value: "Q1" }\n` +
          `  - 実装: { value: "Q2", end: "{done}" }\n\nstates:\n  done: ${初期}\n`,
      );
    } finally {
      console.warn = もとの;
    }
    return 出た.filter((m) => m.includes("始まりより前になる値"));
  };

  it.each([
    ["空文字", '""'],
    ["数にならない語", '"まだ"'],
  ])("%s では伝えない", (_name, 初期) => {
    expect(集める(初期), "数として読めない値に知らせが出ている").toEqual([]);
  });

  it("空白だけの値は数の 0 として扱う (実測)", () => {
    // **これは組み立ての話ではない**。 解析が `"   "` を数の 0 に直してから渡すため
    // (実測 = initial が number の 0)、組み立てからは `done: 0` と区別が付かない。
    // 0 は始まりより前なので、`done: 0` と同じく伝えるのが一貫している。
    // 解析側の変換を変えるのは全ての状態に効く別の話
    expect(集める('"   "'), "0 として扱えていない").toHaveLength(1);
  });

  it("数として読める値では今までどおり伝える (陰性対照)", () => {
    // 上の検査だけだと「何も伝えない」 実装と区別できない
    expect(集める("0"), "本来の知らせまで消えている").toHaveLength(1);
  });
});
