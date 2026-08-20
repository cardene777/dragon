import { describe, it, expect } from "vitest";
import { parseTextDslV05 } from "../src/v05";
import { compileToCdl, type CompileNotice } from "../src/compile";

/**
 * 箱に書いた縦列が効かないことを伝える検証 (#1246)。
 *
 * 記法は箱の中括弧で `lane` を受け取るが、 組み立て側は **その値を 1 度も読まない**。
 * 縦列は図種が決める (`compileGenericWithAnimate` が図種から縦列 id を作る)。
 *
 * 黙って捨てると、 書いた縦列は消え、 `lanes:` で宣言した縦列だけが中身のないまま残る。
 * 実測 = `type: flow` で `lane: ui` / `lane: api` を書くと箱は両方 `flow` に入り、
 * 宣言した `ui` / `api` は空のまま増えた。 知らせは 1 件も出なかった。
 */

/** 記法を組み立て、 出た知らせを全て集める。 */
function 知らせを集める(src: string): CompileNotice[] {
  const r = parseTextDslV05(src);
  if (!r.ok) throw new Error(r.errors.map((e) => `L${e.line}: ${e.message}`).join("\n"));
  const out: CompileNotice[] = [];
  compileToCdl(r.doc, { onNotice: (n) => out.push(n) });
  return out;
}

/** 縦列が効かない知らせだけを取り出す。 */
const 縦列の知らせ = (src: string): CompileNotice[] =>
  知らせを集める(src).filter((n) => n.kind === "lane-not-honored");

/**
 * 既定を `sequence` にする (#1263)。
 *
 * `flow` / `topology` / `swimlane` は **縦列を選べるようになった** = 縦列を箱を並べる
 * ための入れ物として使う図種だから。 これらで知らせを期待すると、効く形を「効かない」 と
 * 書いた検査になる。
 *
 * 順序図は縦列がそのまま生命線として描かれる骨格なので、従来どおり選べない。
 */
const 記法 = (actors: string, type = "sequence") =>
  `title: "t"\ntype: ${type}\n\nactors:\n${actors}\nflow:\n  - A -> A2: "x"\n`;

const 二人 = (opts: string) => `  - A: { ${opts} }\n  - A2`;

describe("箱に書いた縦列が効かないことを伝える (#1246)", () => {
  it("中括弧に lane を書くと知らせが出る", () => {
    expect(縦列の知らせ(記法(二人("lane: ui"))).map((n) => n.actor)).toEqual(["A"]);
  });

  it("縦に並べた形でも知らせが出る", () => {
    // 書き方によって知らされたりされなかったりする状態を作らない (#1090 と同じ理由)
    expect(縦列の知らせ(記法(`  - A:\n      kind: actor\n      lane: ui\n  - A2`))).toHaveLength(1);
  });

  it("知らせに行番号が入る", () => {
    expect(縦列の知らせ(記法(二人("lane: ui")))[0]?.line, "行番号が違う").toBe(5);
  });

  it("知らせに図種の名前が入る", () => {
    // どの図種が縦列を決めているかが分からないと、 図種を変える判断ができない
    expect(縦列の知らせ(記法(二人("lane: ui"), "solidity"))[0]?.message).toContain(
      "type: solidity",
    );
  });

  it("知らせに直し方が入る", () => {
    const hint = 縦列の知らせ(記法(二人("lane: ui")))[0]?.hint ?? "";
    expect(hint, "縦列を選べない旨が無い").toContain("縦列は図種が決める");
    expect(hint, "直し方が無い").toContain("lane を消して");
  });

  it("箱が複数あれば全部知らせる", () => {
    // 1 件だけ知らせると、 直した後に次の 1 件が出る形になり手戻りが増える (#1090 と同じ)
    const src = 記法(`  - A: { lane: ui }\n  - A2: { lane: api }`);
    expect(縦列の知らせ(src).map((n) => n.actor)).toEqual(["A", "A2"]);
  });

  // 縦列を選べない図種すべてで伝える。 1 図種だけ知らせて他が黙る状態を作らない。
  // `mind` は自分でまとめて伝えるため別扱い (下の describe)。
  // `flow` / `topology` / `swimlane` は #1263 で選べるようになったため別扱い (下の describe)
  for (const type of [
    "sequence", "er", "state", "solidity", "class", "c4",
    "gantt", "pie", "bar", "line", "funnel", "tree", "journey", "quadrant",
  ]) {
    it(`${type} でも知らせが出る`, () => {
      const 出た = 縦列の知らせ(記法(二人("lane: ui"), type));
      expect(出た).toHaveLength(1);
      expect(出た[0]?.message, "効かない旨ではない知らせが出ている").toContain("効きません");
    });
  }
});

describe("縦列を選べる図種では中身が違う (#1263)", () => {
  // **知らせが出るかどうかだけを見ると気付けない**。 一部の箱だけ縦列を書いた形でも
  // 知らせは出るが、中身は「効かない」 ではなく「全部に書け」 になる (変異試験で判明)
  for (const type of ["flow", "topology", "swimlane"]) {
    it(`${type} は全部に書けと伝える`, () => {
      const 出た = 縦列の知らせ(記法(二人("lane: ui"), type));
      expect(出た).toHaveLength(1);
      expect(出た[0]?.message, "効かない旨を伝えている").toContain("全ての箱に書きます");
      expect(出た[0]?.message, "書いていない箱を挙げていない").toContain("A2");
    });

    it(`${type} で全部に書けば知らせない`, () => {
      const src = 記法(`  - A: { lane: ui }\n  - A2: { lane: ui }`, type);
      expect(縦列の知らせ(src), "効く形に知らせが出ている").toEqual([]);
    });
  }
});

describe("知らせない側 (陰性対照)", () => {
  it("lane を書かなければ知らせない", () => {
    // 知らせが恒真でないことを見る。 これが落ちれば判定が入力を見ていない
    expect(縦列の知らせ(記法(二人('kind: storage, subtitle: "あ"')))).toEqual([]);
  });

  it("見本に lane を書いても知らせない", () => {
    // 見本の lane は張替え先の指定として実際に読まれる。 知らせると正しい記法が警告だらけになる
    expect(縦列の知らせ(記法(二人("kind: arc-gauge, v: 50, lane: ui")))).toEqual([]);
  });

  it("見本では lane の値が実際に残る", () => {
    // 知らせないだけでなく、 書いた値が残っていることを見る。 残らないなら知らせないのは誤り
    const r = parseTextDslV05(記法(二人("kind: arc-gauge, lane: ui")));
    expect(r.ok, "解析に失敗した").toBe(true);
    expect(r.ok ? r.doc.actors[0]?.lane : undefined, "張替え先が残っていない").toBe("ui");
  });

  it("type: mind では二重に知らせない", () => {
    // `compileMind` が「名前と副題 / 値、 枝の色しか描けません」 に `枠の指定` を含めて
    // まとめて伝えている。 ここでも出すと同じ 1 行について知らせが 2 件並ぶ
    const 全部 = 知らせを集める(記法(二人("lane: ui"), "mind"));
    expect(全部.filter((n) => n.kind === "lane-not-honored"), "二重に知らせている").toEqual([]);
    expect(
      全部.some((n) => n.message.includes("枠の指定")),
      "mind 側の知らせが消えている",
    ).toBe(true);
  });

  it("記法の解析は今までどおり通る", () => {
    // 解析で弾くと見本の張替え先まで巻き添えになる。 効くかどうかの判断は組み立て側の責務
    expect(parseTextDslV05(記法(二人("lane: ui"))).ok, "解析で弾いている").toBe(true);
  });
});

describe("知らせる根拠 (縦列が実際に効かないこと)", () => {
  // 知らせを足す前の挙動を固定する。 これが変わったら知らせではなく実装で直すべきなので、
  // その時に本 file ごと見直す手掛かりになる
  it("宣言した縦列は使われず、 箱は図種の縦列に入る", () => {
    const r = parseTextDslV05(
      `title: "t"\ntype: flow\nlanes:\n  ui: { x: 0, width: 300, label: "画面" }\n` +
        `actors:\n  - A: { lane: ui }\n  - B\nflow:\n  - A -> B: "押す"\n`,
    );
    expect(r.ok, "解析に失敗した").toBe(true);
    if (!r.ok) return;
    const d = compileToCdl(r.doc);
    expect(d.nodes.map((n) => n.lane), "箱が図種の縦列に入っていない").toEqual(["flow", "flow"]);
    expect(
      (d.lanes ?? []).map((l) => l.id),
      "宣言した縦列が中身のないまま残っていない",
    ).toEqual(["flow", "ui"]);
  });
});
