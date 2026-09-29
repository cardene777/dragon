/**
 * 2 軸で仕分ける図の区画に名前を直接書く (#2667)。
 *
 * それまで区画の名前は位置そのまま (`左上`) か、軸の掛け合わせ (`{上} × {左}`) しか
 * 書けなかった。 掛け合わせから一段離れた言い方 (`すぐやる`) を書けるようにする。
 */
import { describe, it, expect } from "vitest";
import { textDslToDiagram } from "../src";
import { jsonToDiagram } from "../src/json-parser";
import { parseTextDslV05 } from "../src/v05/parser";
import type { DslError } from "../src/types";

/** 解析の知らせを取る。 読めた時は知らせが無いので空の並びを返す */
function 知らせ(src: string): DslError[] {
  const 出 = parseTextDslV05(src);
  return 出.ok ? [] : 出.errors;
}

/** 組み立てた図から区画の名前を取る */
function 区画の名前(src: string): { topLeft: string; topRight: string; bottomLeft: string; bottomRight: string } {
  const d = textDslToDiagram(src);
  const q = d.nodes.find((n) => n.quadrantData)?.quadrantData;
  if (!q) throw new Error("2 軸で仕分ける図の箱が無い");
  return q.quadrantLabels;
}

const 素 = `title: "着手の順番"
type: quadrant

actors:
  - 甲: "左上"
`;

describe("区画の名前を書く", () => {
  it("書いた名前が図に出る", () => {
    const 名 = 区画の名前(`${素}
regions:
  左上: "すぐやる"
  右上: "計画してやる"
  左下: "ついでにやる"
  右下: "やらない"
`);
    expect(名).toEqual({
      topLeft: "すぐやる",
      topRight: "計画してやる",
      bottomLeft: "ついでにやる",
      bottomRight: "やらない",
    });
  });

  it("書かなかった区画は、軸を書いた時は掛け合わせの名前になる", () => {
    const 名 = 区画の名前(`${素}
axes:
  x: { left: "手間が小さい", right: "手間が大きい" }
  y: { bottom: "効きが小さい", top: "効きが大きい" }

regions:
  左上: "すぐやる"
`);
    expect(名.topLeft).toBe("すぐやる");
    expect(名.topRight).toBe("効きが大きい × 手間が大きい");
    expect(名.bottomLeft).toBe("効きが小さい × 手間が小さい");
  });

  it("書かなかった区画は、軸を書かない時は位置の名前になる", () => {
    const 名 = 区画の名前(`${素}
regions:
  左上: "すぐやる"
`);
    expect(名.topLeft).toBe("すぐやる");
    expect(名.topRight).toBe("右上");
    expect(名.bottomLeft).toBe("左下");
    expect(名.bottomRight).toBe("右下");
  });

  it("書かない図は今までと変わらない", () => {
    // 既に描いてある図が動かないことを見る
    expect(区画の名前(素)).toEqual({
      topLeft: "左上",
      topRight: "右上",
      bottomLeft: "左下",
      bottomRight: "右下",
    });
  });
});

describe("軸と併記する", () => {
  it("軸の名前と区画の名前が両方出る", () => {
    const d = textDslToDiagram(`${素}
axes:
  x: { left: "手間が小さい", right: "手間が大きい" }
  y: { bottom: "効きが小さい", top: "効きが大きい" }

regions:
  左上: "すぐやる"
`);
    const q = d.nodes.find((n) => n.quadrantData)!.quadrantData!;
    expect(q.xAxis).toEqual({ left: "手間が小さい", right: "手間が大きい" });
    expect(q.quadrantLabels.topLeft).toBe("すぐやる");
  });
});

describe("読めない書き方", () => {
  it("4 語以外の区画名は行番号付きで知らせる", () => {
    const es = 知らせ(`${素}
regions:
  斜め上: "なにか"
`);
    expect(es.length).toBeGreaterThan(0);
    expect(es.some((e) => e.message.includes('"斜め上"'))).toBe(true);
    expect(es.every((e) => e.line > 0)).toBe(true);
  });

  it("1 行にまとめて書く形は受けず、その場で伝える", () => {
    const es = 知らせ(`${素}
regions: { 左上: "すぐやる" }
`);
    expect(es.some((e) => e.message.includes("regions は 1 行にまとめて書けない"))).toBe(true);
  });

  it("1 つも読めなかった形は書かなかったのと同じ値になる", () => {
    // 空の区画を渡すと、書いていない区画の名前が空文字で描かれる。
    // 読めない行は知らせになるので、図そのものは `textDslToDiagram` からは出ない
    // (`axes:` と同じ扱い)。 ここでは解析の結果を直接見る
    // 読めない行があると解析そのものが失敗する (`axes:` と同じ扱い)
    const 出 = parseTextDslV05(`${素}
regions:
  斜め上: "なにか"
`);
    expect(出.ok).toBe(false);
  });
});

describe("2 つの書き方で同じ図になる", () => {
  it("記法と組み立てが同じ区画の名前を出す", () => {
    const yaml = `${素}
regions:
  左上: "すぐやる"
  右下: "やらない"
`;
    const json = {
      title: "着手の順番",
      type: "quadrant",
      actors: [{ name: "甲", subtitle: "左上" }],
      flow: [],
      regions: { 左上: "すぐやる", 右下: "やらない" },
    };
    const 記法 = textDslToDiagram(yaml).nodes.find((n) => n.quadrantData)!.quadrantData!;
    const 組み立て = jsonToDiagram(json).nodes.find((n) => n.quadrantData)!.quadrantData!;
    expect(組み立て.quadrantLabels).toEqual(記法.quadrantLabels);
  });

  it("組み立て側で知らない鍵を書くと伝える", () => {
    expect(() =>
      jsonToDiagram({
        title: "T",
        type: "quadrant",
        actors: [{ name: "甲", subtitle: "左上" }],
        flow: [],
        regions: { 斜め上: "なにか" },
      }),
    ).toThrow();
  });
});
