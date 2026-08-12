/**
 * 名札に載せる種類を「絵が箱に収まる時だけ」 に絞る検証 (#1061 / #1067)。
 *
 * `#975` が「書いた種類を名札に載せる」 を入れ、 `#1058` が「書かなかった時は載せない」 を
 * 直した。 残っていたのは **書いた時にはみ出す** 側で、 名札は小型の箱 (`h: 72`) なのに
 * `shape-` は絵を自分の大きさで描くため、 絵が箱の外に出ていた。
 *
 * `actor` / `function` / `storage` / `event` は `#1066` まで落とす対象だった。 描画側
 * (`cardene777/cdl#416`) が小さい箱で名前を中央に置くようになったので外し、 いまは
 * **書いたとおりの種類のまま載る** ことを見る (§ 名札で書いたとおりの種類が残る)。
 *
 * ここでは組み立ての結果 (どの種類が名札に残るか) を見る。 **表の値が実際の描画と合っているか**
 * は `apps/playground-spa/tests/node-label-fit.spec.ts` が実 render で両側 (その高さで収まる /
 * 2 低いとはみ出す) を測る。 組み立てだけを見ると、 表の値が実装から乖離しても気付けない。
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
 * 名札の高さ (72) では絵が箱からはみ出すが、 **高さを上げれば収まる** `shape-` 4 種 (#1067)。
 *
 * `actor` / `function` / `storage` / `event` は `#1066` までここに載っていた。 名前がはみ出す
 * 側だったが、 `cardene777/cdl#416` が小型用の配置を足して名札の高さでも収まるようになった
 * (§ 名札で書いたとおりの種類が残る)。
 *
 * 値は `compile.ts` の `LABEL_MIN_H` と揃える。 絵を変えたら実装側を測り直してここも動かす。
 */
const 収まらない種別 = [
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
  "shape-wallet", // 上 12.1 だが絵が潰れて名前と重なる (#1106、 user 実機確認)
] as const;

/**
 * 名札に載ったままにする `shape-` (#1067 / #1106)。
 *
 * 上だけにはみ出す種別は何ともぶつからず、 図の外にも出ない (実測 = `shape-robot-arm` は
 * 上へ 129 だが viewBox に 23 の余裕がある)。 完全に収まる 5 種も当然残る。
 *
 * **ただし上だけの 10 種のうち `shape-wallet` は落とす** (#1106)。 上へ 12.1 しか出ないのに
 * 絵が潰れて名前と重なるため = 分ける基準ははみ出し量ではなく「名前が読めるか」。
 */
const 残す種別 = [
  "shape-robot-arm", // 上 129。 絵の質が良いため残す (#1106 で user 判断)
  "shape-iot-sensor", // 上 48
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
    // 汎用の種別は名札の高さでも名前が箱に収まる (実測 = `database` / `service` とも下端との差 0)。
    const d =図(`  - A: database\n  - B: service`);
    expect(kindOf(d, "a-header")).toBe("database");
    expect(kindOf(d, "b-header")).toBe("service");
  });

  /**
   * `#1066` = 描画側 (`cardene777/cdl#416`) が小型用の配置を足したので、 名前がはみ出す理由で
   * 落とす必要が無くなった。 落とすと種類ごとの枠線の色と動きが失われる。
   */
  describe.each(["actor", "function", "storage", "event"])(
    "%s (名札で書いたとおりの種類が残る)",
    (kind) => {
      it("既定の高さ (72) でも落ちない", () => {
        const d =図(`  - A\n  - B: ${kind}`);
        expect(hOf(d, "b-header"), "名札の高さが 72 から動いている").toBe(72);
        expect(kindOf(d, "b-header")).toBe(kind);
        expect(kindOf(d, "b-footer")).toBe(kind);
      });

      it("説明を書いても落ちない", () => {
        // `#1061` は説明を書いた名札を落とさない扱いにしていた (落とすと文字が消えるため)。
        // 落とす理由自体が無くなったので、 書いた種類のまま載る
        const d =図(`  - A\n  - B:\n      kind: ${kind}\n      subtitle: "説明"`);
        expect(kindOf(d, "b-header")).toBe(kind);
      });
    },
  );

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

  it("Solidity の読み替えは名札では形を残さない", () => {
    // `#975` の読み替えは 4 組ある。 `#1106` の後、 名札で形が残るのは
    // `multisig` → `signer` だけになった。
    //
    // `contract` / `proxy` → `shape-smart-contract` (右 15.1) と
    // `library` / `interface` → `shape-code-block` (右 132) は絵が箱の外に出るため `card`。
    // `eoa` / `wallet` → `shape-wallet` は上へ 12.1 だけだが絵が潰れて名前と重なる (#1106)。
    //
    // 読み替えそのものは残っている = 読み替えないと描画側に無い語のまま渡って落ちる
    const d =図(`  - A: contract\n  - B: eoa`);
    expect(kindOf(d, "a-header")).toBe("card");
    expect(kindOf(d, "b-header")).toBe("card");

    const d2 =図(`  - A: library\n  - B: multisig`);
    expect(kindOf(d2, "a-header")).toBe("card");
    expect(kindOf(d2, "b-header")).toBe("signer");
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

  // `describe.each` の入れ子にすると外側の `$名` が展開されず、 3 件が同じ名前で並ぶ
  // (review 指摘)。 外側は平の loop にして title を自分で組む
  for (const { 名, 記法, field } of [
    { 名: "説明", 記法: `subtitle: "サブ"`, field: "subtitle" },
    { 名: "肩書", 記法: `eyebrow: "Role"`, field: "eyebrow" },
    { 名: "値", 記法: `value: "42"`, field: "value" },
  ]) {
    describe(`著者が ${名} を書いた名札`, () => {
    /**
     * **落ちる候補の種類で見る**。
     *
     * `#1066` まではここで `actor` を使っていたが、 4 種が落ちる候補から外れたため、
     * `hasAuthoredText` が常に `false` を返すよう壊れても検査が通る空振りになっていた
     * (review 指摘)。 今も落ちる候補である `shape-` で見る。
     *
     * `shape-person` は高さで落ちる側 (`LABEL_MIN_H`)、 `shape-smart-contract` は高さで
     * 直らない側 (`LABEL_NEVER_FITS`)。 分岐の両方を通す。
     */
    describe.each(["shape-person", "shape-smart-contract"])("%s", (kind) => {
      it("種類を落とさない", () => {
        // 小型の `card` が描くのは名前だけ。 `subtitle` と `eyebrow` は `h < 100` の分岐で
        // 外れ、 `value` は `card` が元から描かない。 落とすと書いた文字が画面から消える =
        // 絵がはみ出すより悪い。
        const d =図(`  - A\n  - B: { kind: ${kind}, ${記法} }`);
        expect(kindOf(d, "b-header"), `${field} を書いた名札が card に落ちている`).toBe(kind);
        expect(kindOf(d, "b-footer")).toBe(kind);
      });

      it("書いた文字が名札に残る", () => {
        // 落とさないことと、 文字が消えないことは別。 組み立て結果に値が載っているかを直接見る。
        const d =図(`  - A\n  - B: { kind: ${kind}, ${記法} }`);
        const header = d.nodes.find((n) => n.id === "b-header") as Record<string, unknown>;
        expect(header[field], `${field} が名札に載っていない`).toBeDefined();
      });
    });
    });
  }

  it("揃えで届く種別だけが残る", () => {
    // `rows` 1 件で名札は 206 になる。 表の値が 206 以下なら収まり、 超える種別は落ちる。
    // 説明が「揃えれば `shape-` も収まる」 と読める書き方だったので、 境界を検査で固定する
    // (review 指摘 = `shape-person` は 228 なので届かない)。
    const 届く =図(`  - A: { kind: storage, rows: ["count: 1"] }\n  - B: shape-server-rack`);
    expect(hOf(届く, "b-header"), "揃えで名札が 206 になっていない").toBe(206);
    expect(kindOf(届く, "b-header"), "166 は 206 に収まるのに落ちている").toBe("shape-server-rack");

    const 届かない =図(`  - A: { kind: storage, rows: ["count: 1"] }\n  - B: shape-person`);
    expect(hOf(届かない, "b-header")).toBe(206);
    expect(kindOf(届かない, "b-header"), "228 は 206 に収まらないのに残っている").toBe("card");
  });

  it("上端だけ高さを書いても上下で形を揃える", () => {
    // `nodes` override は「その名札だけを指定の大きさにする」 指定なので、 上端 (120) と
    // 下端 (72) で高さが違う。 1 つずつ判定すると同じ登場人物が上下で別の形になりうる。
    //
    // `#1066` で `actor` は高さを見ずに残るようになったため、 ここでは **上下で同じ形** で
    // あることを見る (どちらも `card` に落ちない)。 高さで分かれる種別は `shape-` 側の
    // `収まらない種別` が同じ形を見ている。
    const d =図(
      `  - A\n  - B: { kind: actor, nodes: { header: { posX: 10, posY: 20, posW: 200, posH: 120 } } }`,
    );
    expect(d.nodes.find((n) => n.id === "b-header")?.posH).toBe(120);
    expect(kindOf(d, "b-header")).toBe("actor");
    expect(kindOf(d, "b-footer")).toBe(kindOf(d, "b-header"));
  });

  it("高さで分かれる種別は上端だけ高さを書いても上下で揃う", () => {
    // 高さを見て落とす経路 (`shape-` 4 種) が残っているので、 そちらで同じことを見る
    const d =図(
      `  - A\n  - B: { kind: shape-person, nodes: { header: { posX: 10, posY: 20, posW: 200, posH: 240 } } }`,
    );
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
    const d =図(`  - A\n  - B: shape-person`, "solidity");
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
