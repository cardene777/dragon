import { describe, it, expect } from "vitest";
import { parseTextDslV05 } from "../src/v05";
import { compileToCdl } from "../src/compile";

/**
 * `lanes:` / `groups:` の id が受ける形の検証 (#1241)。
 *
 * 組み立て側は登場人物の名前から縦列 id を作るため、hyphen と日本語が入る
 * (実測 = `type: state` で `lane-idle` / `lane-待機`、`type: swimlane` で `lane-sign-up`)。
 *
 * 英数字と下線だけを受けていた間、**自動で作られた縦列の幅や見出しを書き直す手段が無かった**。
 * 記法で書けない figure がそこで止まっていた (`presetStateMachine` の幅 370)。
 */

const 記法 = (lanes: string) =>
  `title: "T"\ntype: state\n${lanes}\nactors:\n  - Idle\n  - Loading\nflow:\n  - Idle -> Loading: "x"\n\n` +
  `animation:\n  - step: "s1" 1s\n    focus: [Idle]\n    body: "b"\n`;

function 縦列(src: string) {
  const r = parseTextDslV05(src);
  if (!r.ok) throw new Error(r.errors.map((e) => e.message).join(" / "));
  return (compileToCdl(r.doc).lanes ?? []).map((l) => ({ id: l.id, width: l.width }));
}

const 誤り = (src: string) => {
  const r = parseTextDslV05(src);
  return r.ok ? [] : r.errors.map((e) => e.message);
};

describe("自動で作られる縦列の id を書き直せる (#1241)", () => {
  it("hyphen を含む id が受かる", () => {
    // `type: state` は `lane-<名前>` の形で縦列を作る
    const 出た = 縦列(記法(`lanes:\n  lane-idle: { width: 370 }\n  lane-loading: { width: 370 }\n`));
    expect(出た).toEqual([
      { id: "lane-idle", width: 370 },
      { id: "lane-loading", width: 370 },
    ]);
  });

  it("hyphen を受けないと幅を書き直せない (根拠)", () => {
    // 書き直さない時の既定。 これが 370 と違うから書き直す必要がある
    expect(縦列(記法(""))[0]?.width).toBe(360);
  });

  it("日本語を含む id が受かる", () => {
    // 名前が日本語なら縦列 id も日本語になる (実測 = `lane-待機`)
    const src = `title: "T"\ntype: state\nlanes:\n  lane-待機: { width: 400 }\n\n` +
      `actors:\n  - 待機\n  - 読込み\nflow:\n  - 待機 -> 読込み: "x"\n\n` +
      `animation:\n  - step: "s1" 1s\n    focus: [待機]\n    body: "b"\n`;
    expect(縦列(src)[0]).toEqual({ id: "lane-待機", width: 400 });
  });

  it("囲みでも同じ id を書ける", () => {
    // `groups:` は同じ形で読む。 片方だけ受けると、縦列は指定できるのに囲めない状態になる
    const src = 記法(`lanes:\n  lane-idle: { width: 370 }\n` +
      `groups:\n  待ち-群: { label: "待ち", lanes: [lane-idle] }\n`);
    const r = parseTextDslV05(src);
    expect(r.ok, "囲みが読めない").toBe(true);
  });
});

describe("読み取りを壊す形は受けない (陰性対照)", () => {
  it.each([
    ["空白を含む", "  lane idle: { width: 370 }"],
    ["中括弧を含む", "  lane{idle}: { width: 370 }"],
    ["id が無い", "  : { width: 370 }"],
  ])("%s 形を伝える", (_name, 行) => {
    // 何でも受けると、書き間違えた行が別の縦列として通ってしまう
    const 出た = 誤り(記法(`lanes:\n${行}\n`));
    expect(出た.some((m) => m.startsWith("invalid lane entry")), 出た.join(" / ")).toBe(true);
  });

  it("正しい形では誤りが出ない", () => {
    expect(誤り(記法(`lanes:\n  lane-idle: { width: 370 }\n`))).toEqual([]);
  });
});

describe("書き間違いが別の縦列として通らない (Round 1 の指摘)", () => {
  // 「読み取りを壊す字以外は何でも」 にすると、句読点の混じった書き間違いが **別の縦列として
  // 通り**、書いた幅が黙って効かなくなる。 組み立て側が作りうる字だけに絞る
  it.each([
    ["末尾に読点", "  lane-idle,: { width: 370 }"],
    ["末尾に句点", "  lane-idle.: { width: 370 }"],
    ["引用符", '  "lane-idle": { width: 370 }'],
    ["角括弧", "  lane[0]: { width: 370 }"],
    ["丸括弧", "  lane(idle): { width: 370 }"],
  ])("%s は誤りとして伝える", (_name, 行) => {
    const 出た = 誤り(記法(`lanes:\n${行}\n`));
    expect(出た.some((m) => m.startsWith("invalid lane entry")), 出た.join(" / ")).toBe(true);
  });

  it("組み立て側が作る字は通る (陰性対照)", () => {
    // 絞りすぎると自動生成の縦列を指せなくなる = 本 PR の目的が消える
    for (const id of ["main", "chart", "lane-idle", "lane-sign-up", "lane_1", "lane-待機", "c4-l1"]) {
      const src = `title: "T"\ntype: state\nlanes:\n  ${id}: { width: 370 }\n\n` +
        `actors:\n  - Idle\n  - Loading\nflow:\n  - Idle -> Loading: "x"\n`;
      expect(誤り(src), `${id} が受からない`).toEqual([]);
    }
  });
});
