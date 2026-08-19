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
    // 非 ASCII をまとめて許すと、全角の句読点や絵文字まで通る (Round 2 の指摘、実測)
    ["全角の読点", "  lane-idle、: { width: 370 }"],
    ["全角の句点", "  lane-idle。: { width: 370 }"],
    ["全角の感嘆符", "  lane-idle！: { width: 370 }"],
    ["絵文字", "  lane-idle🙂: { width: 370 }"],
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

describe("どの箱も入らない縦列を伝える (Round 3 の指摘)", () => {
  // **字の集合では防げない**。 全角 (`lane-Ａ` に対し生成は `lane-a`) でも、ただの打ち間違い
  // (`lane-idl`) でも、結果は同じ = 新しい縦列が増えるだけで書いた幅は元の縦列に届かない。
  // 字で受け付けを絞るのではなく、**合わなかったこと自体を伝える**
  const 知らせ = (lanes: string): string[] => {
    const r = parseTextDslV05(記法(lanes));
    if (!r.ok) throw new Error(r.errors.map((e) => e.message).join(" / "));
    const out: string[] = [];
    compileToCdl(r.doc, { onNotice: (n) => out.push(n.message) });
    return out.filter((m) => m.includes("どの箱も入らない縦列"));
  };

  it.each([
    ["打ち間違い", "lanes:\n  lane-idl: { width: 999 }\n"],
    ["全角の字", "lanes:\n  lane-Ｉdle: { width: 999 }\n"],
    ["まったく別の名前", "lanes:\n  sidebar: { width: 999 }\n"],
  ])("%s を伝える", (_name, lanes) => {
    expect(知らせ(lanes), "黙って新しい縦列を作っている").toHaveLength(1);
  });

  it("知らせにこの図が持つ縦列を並べる", () => {
    // どう直せばよいかが分かる形にする
    expect(知らせ("lanes:\n  lane-idl: { width: 999 }\n")[0]).toBeDefined();
    const r = parseTextDslV05(記法("lanes:\n  lane-idl: { width: 999 }\n"));
    const out: { message: string; hint?: string }[] = [];
    if (r.ok) compileToCdl(r.doc, { onNotice: (n) => out.push(n) });
    const 該当 = out.find((n) => n.message.includes("どの箱も入らない縦列"));
    expect(該当?.hint).toContain("lane-idle");
  });

  it("箱の lane を無視した知らせとは別の種別で伝える", () => {
    // 同じ種別にすると、受け取る側 (画面 / lint) が「箱の lane が効かない」 と
    // 「宣言した縦列が空」 を区別できない。 直し方が違うので分ける
    const r = parseTextDslV05(記法("lanes:\n  lane-idl: { width: 999 }\n"));
    const out: { kind: string }[] = [];
    if (r.ok) compileToCdl(r.doc, { onNotice: (n) => out.push(n) });
    expect(out.map((n) => n.kind)).toContain("lane-declared-empty");
    expect(out.map((n) => n.kind), "箱の lane の知らせと混ざっている").not.toContain("lane-not-honored");
  });

  it("合う id では伝えない (陰性対照)", () => {
    // 正しい記法が警告だらけになると、知らせそのものが読まれなくなる
    expect(知らせ("lanes:\n  lane-idle: { width: 370 }\n")).toEqual([]);
  });

  it("lanes を書かなければ伝えない (陰性対照)", () => {
    expect(知らせ("")).toEqual([]);
  });
});

describe("見本が入った縦列には伝えない (変異試験で見つけた)", () => {
  // 見本 (parts) の箱は `lane` で行き先を選べるため、`lanes:` で作った縦列に後から入る。
  // **見本を重ねる前に判定すると、箱が入っている縦列にまで知らせが出る** (実測)
  const 見本 = {
    id: "trophy",
    topic: "t",
    lanes: [{ id: "l", x: 0, width: 400 }],
    nodes: [{ id: "n", lane: "l", stack: 0, kind: "actor", title: "N" }],
    edges: [],
    phases: [],
    states: [],
  } as never;

  const 組む = (lane: string) => {
    const r = parseTextDslV05(
      `title: "T"\ntype: flow\n\nlanes:\n  mylane: { x: 900, width: 400 }\n\n` +
        `actors:\n  - A\n  - g: { kind: trophy, lane: ${lane} }\n\nflow:\n  - A -> A: "x"\n`,
    );
    if (!r.ok) throw new Error(r.errors.map((e) => e.message).join(" / "));
    const out: string[] = [];
    const d = compileToCdl(r.doc, { partsCatalog: { trophy: 見本 }, onNotice: (n) => out.push(n.message) });
    return { 図: d, 知らせ: out.filter((m) => m.includes("どの箱も入らない縦列")) };
  };

  it("見本を入れた縦列には伝えない", () => {
    const { 図, 知らせ } = 組む("mylane");
    expect(図.nodes.some((n) => n.lane === "mylane"), "見本が入っていない").toBe(true);
    expect(知らせ, "箱が入っている縦列に知らせが出ている").toEqual([]);
  });

  it("見本が別の縦列へ行ったら伝える (陰性対照)", () => {
    // 「常に伝えない」 実装と区別できない状態にしない
    const { 知らせ } = 組む("flow");
    expect(知らせ, "空のままの縦列を見逃している").toHaveLength(1);
  });

  // Round 4 の指摘。 `lanes:` の中身を読むのは見本を重ねるより前で、その時点では見本の縦列が
  // まだ無い。 そのため同じ id を書くと **縦列が 2 つできて、書いた幅は箱の入っていない方に付く**
  const 見本の縦列を宣言する = (width?: number, x?: number, label?: string) => {
    const options = [
      ...(x === undefined ? [] : [`x: ${x}`]),
      ...(width === undefined ? [] : [`width: ${width}`]),
      ...(label === undefined ? [] : [`label: "${label}"`]),
    ].join(", ");
    const r = parseTextDslV05(
      `title: "T"\ntype: flow\n\nlanes:\n  g__l: { ${options} }\n\n` +
        `actors:\n  - A\n  - g: { kind: trophy }\n\nflow:\n  - A -> A: "x"\n`,
    );
    if (!r.ok) throw new Error(r.errors.map((e) => e.message).join(" / "));
    const out: string[] = [];
    const d = compileToCdl(r.doc, { partsCatalog: { trophy: 見本 }, onNotice: (n) => out.push(n.message) });
    return { 図: d, 縦列: (d.lanes ?? []).filter((l) => l.id === "g__l"), 知らせ: out };
  };

  it("見本が作る縦列と同じ id を書いても 2 本にならない", () => {
    expect(見本の縦列を宣言する(777).縦列, "縦列が 2 本できている").toHaveLength(1);
  });

  it("書いた幅が見本の縦列に効く", () => {
    // 2 本できていた時は、書いた幅が箱の入っていない方に付いていた (実測)
    expect(見本の縦列を宣言する(777).縦列[0]?.width).toBe(777);
  });

  it("書いた位置へ見本の箱も移す", () => {
    const 宣言した左端 = 900;
    const 宣言した幅 = 400;
    const { 図 } = 見本の縦列を宣言する(宣言した幅, 宣言した左端);
    expect(図.nodes.find((n) => n.id === "g__n")?.posX, "箱が縦列の外に残っている").toBe(
      宣言した左端 + 宣言した幅 / 2,
    );
  });

  it("書かなかった位置と幅は見本の値を保つ", () => {
    const { 縦列 } = 見本の縦列を宣言する(undefined, undefined, "表示名");
    expect(縦列[0]).toMatchObject({ width: 400, label: "表示名" });
  });

  it("重ねた縦列には知らせを出さない", () => {
    expect(
      見本の縦列を宣言する(777).知らせ.filter((m) => m.includes("どの箱も入らない縦列")),
      "効いている指定に知らせが出ている",
    ).toEqual([]);
  });
});
