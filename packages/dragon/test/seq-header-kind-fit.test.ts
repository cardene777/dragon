/**
 * 名札に載せる種類を「名前が箱に収まる時だけ」 に絞る検証 (#1061)。
 *
 * `#975` が「書いた種類を名札に載せる」 を入れ、 `#1058` が「書かなかった時は載せない」 を
 * 直した。 残っていたのは **書いた時にはみ出す** 側で、 名札は小型の箱 (`h: 72`) なのに
 * 描画側は `actor` / `function` / `storage` / `event` の名前を固定位置に置くため、 名前が箱の
 * 下端をまたいでいた (実測 = actor 21.6 / function 21.6 / storage 13.6 / event 24.2 world px)。
 *
 * ここでは組み立ての結果 (どの種類が名札に残るか) を見る。 **表の値が実際の描画と合っているか**
 * は `apps/playground-spa/tests/node-label-fit.spec.ts` が実 render で両側 (その高さで収まる /
 * 1 低いとはみ出す) を測る。 組み立てだけを見ると、 表の値が実装から乖離しても気付けない。
 */
import { describe, it, expect } from "vitest";
import { textDslToDiagram } from "@cardenelabs/dragon";
import type { CdlDiagram } from "@cardenelabs/cdl";

const 図 = (actors: string, type = "sequence"): CdlDiagram =>
  textDslToDiagram(`
title: "t"
type: ${type}

actors:
${actors}

flow:
  - A -> B: "x"
`);

const kindOf = (d: CdlDiagram, id: string): string | undefined =>
  d.nodes.find((n) => n.id === id)?.kind;
const hOf = (d: CdlDiagram, id: string): number | undefined => d.nodes.find((n) => n.id === id)?.h;

/**
 * 名札の高さ (72) では箱からはみ出すが、 **高さを上げれば収まる** 種別と、 要る高さ。
 *
 * 前半 4 種は名前がはみ出す (#1061)。 後半 4 種は絵が下へはみ出す `shape-` (#1067) で、
 * 高さを上げると下のはみ出しが消えることを実測した (1 低いと 0.9-1 はみ出す)。
 */
const 収まらない種別 = [
  { kind: "actor", 要る高さ: 95 },
  { kind: "function", 要る高さ: 94 },
  { kind: "storage", 要る高さ: 86 },
  { kind: "event", 要る高さ: 96 },
  { kind: "shape-person", 要る高さ: 228 },
  { kind: "shape-server-rack", 要る高さ: 166 },
  { kind: "shape-website", 要る高さ: 98 },
  { kind: "shape-warehouse", 要る高さ: 79 },
] as const;

/**
 * 高さを上げても収まらない `shape-` (#1067)。 名札では常に `card` に落ちる。
 *
 * 左右は高さで変わらず (実測 = `shape-smart-contract` は h=72 でも h=430 でも右へ 15.2)、
 * 下のはみ出しが高さに依らない種別もある (実測 = `shape-stack` は h=72 から 600 まで常に 36)。
 */
const 高さで直らない種別 = [
  "shape-smart-contract", // 右 15.1 (Solidity の `contract` / `proxy`)
  "shape-code-block", // 右 132 (`library` / `interface`)
  "shape-stack", // 下 36 が高さに依らない
  "shape-cylinder", // 下 3.6 が高さに依らない
] as const;

/**
 * 名札に載ったままにする `shape-` (#1067)。
 *
 * 上だけにはみ出す種別は何ともぶつからず、 図の外にも出ない (実測 = `shape-robot-arm` は
 * 上へ 129 だが viewBox に 23 の余裕がある)。 完全に収まる 5 種も当然残る。
 */
const 残す種別 = [
  "shape-wallet", // 上 12.1 (Solidity の `eoa` / `wallet`)
  "shape-robot-arm", // 上 129
  "shape-cloud", // 完全に収まる
  "shape-token", // 完全に収まる
] as const;

describe("名札に載せる種類 (#1061)", () => {
  describe.each(収まらない種別)("$kind", ({ kind, 要る高さ }) => {
    it("既定の高さ (72) では card に落ちる", () => {
      const d =図(`  - A\n  - B: ${kind}`);
      expect(hOf(d, "b-header"), "名札の高さが 72 から動いている").toBe(72);
      expect(kindOf(d, "b-header")).toBe("card");
    });

    it("下端の名札も一緒に落ちる", () => {
      // 上下で形が違うと、 同じ登場人物が別物に見える。
      const d =図(`  - A\n  - B: ${kind}`);
      expect(kindOf(d, "b-footer")).toBe("card");
    });

    it("収まる高さを書けば載る", () => {
      const d =図(`  - A\n  - B:\n      kind: ${kind}\n      大きさ: 300,${要る高さ}`);
      expect(hOf(d, "b-header"), "書いた高さが名札に届いていない").toBe(要る高さ);
      expect(kindOf(d, "b-header")).toBe(kind);
      expect(kindOf(d, "b-footer")).toBe(kind);
    });

    it("1 低いと落ちる", () => {
      // 表の値そのものを見る。 「収まる高さを書けば載る」 だけだと、 表を小さくする方向の
      // 誤り (はみ出す高さで載せてしまう) が通り抜ける。
      const d =図(`  - A\n  - B:\n      kind: ${kind}\n      大きさ: 300,${要る高さ - 1}`);
      expect(hOf(d, "b-header")).toBe(要る高さ - 1);
      expect(kindOf(d, "b-header")).toBe("card");
    });
  });

  it("収まる種類は触らない", () => {
    // 落とす対象は「名前を箱の高さに関係なく固定の位置に置く」 4 種だけ。 汎用の種別は
    // 名札の高さでも名前が箱に収まる (実測 = `database` / `service` とも下端との差 0)。
    const d =図(`  - A: database\n  - B: service`);
    expect(kindOf(d, "a-header")).toBe("database");
    expect(kindOf(d, "b-header")).toBe("service");
  });

  describe.each(高さで直らない種別)("%s (高さで直らない)", (kind) => {
    it("既定の高さでは card に落ちる", () => {
      const d =図(`  - A\n  - B: ${kind}`);
      expect(kindOf(d, "b-header")).toBe("card");
      expect(kindOf(d, "b-footer")).toBe("card");
    });

    it("高さを大きく書いても落ちる", () => {
      // ここが `収まらない種別` との違い。 高さを上げても直らないので、 高さを見ずに落とす
      const d =図(`  - A\n  - B:\n      kind: ${kind}\n      大きさ: 300,600`);
      expect(hOf(d, "b-header"), "書いた高さが名札に届いていない").toBe(600);
      expect(kindOf(d, "b-header")).toBe("card");
    });
  });

  describe.each(残す種別)("%s (残す)", (kind) => {
    it("既定の高さでも書いたとおりの形になる", () => {
      // 上だけのはみ出しは何ともぶつからず図の外にも出ない。 落とすと形の区別を失うだけ
      const d =図(`  - A\n  - B: ${kind}`);
      expect(hOf(d, "b-header"), "名札の高さが 72 から動いている").toBe(72);
      expect(kindOf(d, "b-header")).toBe(kind);
      expect(kindOf(d, "b-footer")).toBe(kind);
    });
  });

  it("Solidity の読み替えのうち、 形が残るのは eoa / wallet だけになる", () => {
    // `#975` の読み替えは 3 組ある。 `#1067` の後に名札で形が残るのは
    // `eoa` / `wallet` → `shape-wallet` (上へ 12.1 だけ) のみ。
    //
    // `contract` / `proxy` → `shape-smart-contract` (右 15.1) と
    // `library` / `interface` → `shape-code-block` (右 132) は高さで直らないため `card` になる。
    // 読み替えそのものは残っている = 読み替えないと描画側に無い語のまま渡って落ちる
    const d =図(`  - A: contract\n  - B: eoa`);
    expect(kindOf(d, "a-header")).toBe("card");
    expect(kindOf(d, "b-header")).toBe("shape-wallet");

    const d2 =図(`  - A: library\n  - B: proxy`);
    expect(kindOf(d2, "a-header")).toBe("card");
    expect(kindOf(d2, "b-header")).toBe("card");
  });

  it("落とすのは順序図の名札だけ", () => {
    // 判定は `sequence` / `solidity` の `-header` / `-footer` にしか当たらない。
    // 別の図では書いた語がそのまま残る (読み替えも名札の経路でしか通らない)
    const d = textDslToDiagram(`
title: "t"
type: flow

actors:
  - A: contract
  - B: library

flow:
  - A -> B: "x"
`);
    expect(d.nodes.find((n) => n.id === "a")?.kind).toBe("contract");
    expect(d.nodes.find((n) => n.id === "b")?.kind).toBe("library");
  });

  it("行を書いた名札は種類が残る", () => {
    // 行を書くと `requiredRowsHeight` で高さが上がり、 名前が収まる。
    const d =図(`  - A\n  - B: { kind: storage, rows: ["count: 1"] }`);
    expect(hOf(d, "b-header")!, "行の分だけ高さが上がっていない").toBeGreaterThanOrEqual(206);
    expect(kindOf(d, "b-header")).toBe("storage");
  });

  it("高さが足りなくても行を書いた名札は落とさない", () => {
    // `card` は行を描かない。 落とすと書いた行が画面から消える (`#387` と同じ壊れ方)。
    // 行が枠からはみ出すことは cdl 側の軸が別に報告する。
    //
    // 高さは `nodes` override で書く。 `大きさ:` は下端に届かず、 揃えが下端の 72 に戻して
    // しまうため「高さが足りない」 状態を作れない。
    const d =図(
      `  - A\n  - B: { kind: storage, rows: ["count: 1"], nodes: { header: { posX: 10, posY: 20, posW: 200, posH: 50 } } }`,
    );
    const header = d.nodes.find((n) => n.id === "b-header");
    expect(header?.posH, "書いた高さが名札に届いていない").toBe(50);
    expect(kindOf(d, "b-header")).toBe("storage");
    expect(kindOf(d, "b-footer"), "行を持つ組の下端まで落ちている").toBe("storage");
  });

  describe.each([
    { 名: "説明", 記法: `subtitle: "サブ"`, field: "subtitle" },
    { 名: "肩書", 記法: `eyebrow: "Role"`, field: "eyebrow" },
    { 名: "値", 記法: `value: "42"`, field: "value" },
  ])("著者が $名 を書いた名札", ({ 記法, field }) => {
    it("種類を落とさない", () => {
      // 小型の `card` が描くのは名前だけ。 `subtitle` と `eyebrow` は `h < 100` の分岐で
      // 外れ、 `value` は `card` が元から描かない。 落とすと書いた文字が画面から消える =
      // 名前がはみ出すより悪い。
      const d =図(`  - A\n  - B: { kind: actor, ${記法} }`);
      expect(kindOf(d, "b-header"), `${field} を書いた名札が card に落ちている`).toBe("actor");
      expect(kindOf(d, "b-footer")).toBe("actor");
    });

    it("書いた文字が名札に残る", () => {
      // 落とさないことと、 文字が消えないことは別。 組み立て結果に値が載っているかを直接見る。
      const d =図(`  - A\n  - B: { kind: actor, ${記法} }`);
      const header = d.nodes.find((n) => n.id === "b-header") as Record<string, unknown>;
      expect(header[field], `${field} が名札に載っていない`).toBeDefined();
    });
  });

  it("上端だけ高さを書いても上下で形を揃える", () => {
    // `nodes` override は「その名札だけを指定の大きさにする」 指定なので、 上端 (120) は
    // 収まり下端 (72) は収まらない。 1 つずつ判定すると同じ登場人物が上下で別の形になる。
    const d =図(
      `  - A\n  - B: { kind: actor, nodes: { header: { posX: 10, posY: 20, posW: 200, posH: 120 } } }`,
    );
    expect(d.nodes.find((n) => n.id === "b-header")?.posH).toBe(120);
    expect(kindOf(d, "b-header")).toBe("card");
    expect(kindOf(d, "b-footer")).toBe("card");
  });

  it("揃えで高さが上がった図では他の名札の種類も残る", () => {
    // 名札の高さは全本で揃える。 1 本が行を持つと全体が上がるので、 同じ図の `event` も収まる。
    // 判定を揃えの後に置いていないと、 ここが `card` に落ちる。
    const d =図(`  - A: { kind: storage, rows: ["count: 1"] }\n  - B: event`);
    expect(hOf(d, "b-header")!).toBeGreaterThanOrEqual(206);
    expect(kindOf(d, "b-header")).toBe("event");
    expect(kindOf(d, "a-header")).toBe("storage");
  });

  it("solidity の図でも同じに落ちる", () => {
    const d =図(`  - A\n  - B: storage`, "solidity");
    expect(kindOf(d, "b-header")).toBe("card");
  });

  it("名札を持たない図には効かない", () => {
    // `type: flow` は 1 登場人物 = 1 箱で、 名札の対を持たない。 箱は種別の既定の大きさで
    // 描かれるので、 落とす理由が無い。
    const d =図(`  - A: actor\n  - B: event`, "flow");
    expect(kindOf(d, "a")).toBe("actor");
    expect(kindOf(d, "b")).toBe("event");
  });
});
