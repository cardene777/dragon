/**
 * 図の配色と行の縞の検証 (#1553)。
 *
 * ER 図は小さい字が密に並ぶので、行を横に追う目印が無かった。 色を増やさず、表の箱の中を
 * 1 行おきに薄く敷いて面で分ける。
 * クラス図も箱の作りが同じで、名前と型を離して並べるため、同じ理由で行の縞を持つ。
 *
 * 配色は **名前だけを図に載せる**。 描き手 (cdl) は色を持たないので、名前が
 * `data-cdl-palette` として舞台に出て、色の値は画面側 (`cdl-theme.css`) が決める。
 * 値を描き手に持たせると、色を変えるたびに描き手を出し直すことになる。
 *
 * ## 何を見るか
 *
 * 組み立てた図が持つ `palette` と、表の箱の `rowStripe`。 色そのものは見ない = ここに色が
 * 無いことが設計で、色を確かめるのは画面側の検査 (`rendered-contrast.spec.ts`) の役目。
 */
import { describe, it, expect } from "vitest";
import { textDslToDiagram, jsonToDiagram } from "../src/index";
import { parseTextDslV05 } from "../src/v05/parser";
import { PALETTES, resolvePalette } from "../src/keywords";

/** 表の箱を 2 つ持つ最小の ER 図。 配色の行だけを差し替えて比べる。 */
const ER = (配色?: string): string =>
  [
    'title: "確かめ"',
    "type: er",
    ...(配色 === undefined ? [] : [`palette: ${配色}`]),
    "",
    "actors:",
    '  - users: { kind: storage, rows: ["id: bigint", "email: text"], marks: ["pk", ""] }',
    '  - orders: { kind: storage, rows: ["id: bigint", "user_id: bigint"], marks: ["pk", "fk"] }',
    "",
    "flow:",
    '  - users -> orders: "注文する"',
    "",
  ].join("\n");

/** 表の箱を持たない最小の図。 既定を持つ 2 図種の外で配色が付かないことを見る。 */
const 流れ = (配色?: string): string =>
  [
    'title: "確かめ"',
    "type: flow",
    ...(配色 === undefined ? [] : [`palette: ${配色}`]),
    "",
    "actors:",
    "  - A",
    "  - B",
    "",
    "flow:",
    '  - A -> B: "x"',
    "",
  ].join("\n");

describe("図の配色 (#1553)", () => {
  it("ER 図は書かなくても生成りに茶になる", () => {
    // 「作れば必ずその色みになる」 のが決めた形。 書き忘れた図だけ別の色みになると、
    // 同じ種類の図が 2 通りの見た目で並ぶ
    expect(textDslToDiagram(ER()).palette).toBe("kinari");
  });

  it("書いた名前が勝つ", () => {
    expect(textDslToDiagram(ER("celadon")).palette).toBe("celadon");
  });

  it("日本語でも書ける", () => {
    expect(textDslToDiagram(ER("青磁")).palette).toBe("celadon");
    expect(textDslToDiagram(ER("生成り")).palette).toBe("kinari");
  });

  it("既定を持つ 2 図種の外では書かなければ持たない", () => {
    // 既定は行の縞を必要とする 2 図種だけ。 それ以外まで配ると、配色を前提にしない図にも
    // 画面の色みと図の色みが二重に載る
    expect(textDslToDiagram(流れ()).palette).toBeUndefined();
  });

  it("ER 以外でも書けば載る", () => {
    expect(textDslToDiagram(流れ("celadon")).palette).toBe("celadon");
  });

  it("読めない語は誤りとして返る", () => {
    // 黙って既定に落とすと、書き手には「書いたのに効かない」 としか見えず、
    // 書き間違いか未対応かを分けられない
    const r = parseTextDslV05(ER("mizuiro"));
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(r.errors.some((e) => e.message.includes("palette が読めません"))).toBe(true);
  });

  it("JSON でも同じ名前で書ける", () => {
    const d = jsonToDiagram({
      title: "確かめ",
      type: "er",
      palette: "celadon",
      actors: [{ name: "users", kind: "storage", rows: ["id: bigint"], marks: ["pk"] }],
      flow: [],
    });
    expect(d.palette).toBe("celadon");
  });

  it("名前の解決は記法と JSON で同じ", () => {
    // 別々に解くと、片方だけ別名を受けるようになる
    for (const 名 of PALETTES) {
      expect(resolvePalette(名)).toBe(名);
    }
    expect(resolvePalette("mizuiro")).toBeNull();
  });
});

describe("行の縞 (#1553)", () => {
  it("ER 図の表の箱は縞を持つ", () => {
    const d = textDslToDiagram(ER());
    const 表 = d.nodes.filter((n) => n.kind === "storage");
    // 0 件だと下の照合が「対象なし」 で素通りする
    expect(表.length, "表の箱が 1 つも無い (検査が空振りしている)").toBeGreaterThan(0);
    for (const n of 表) expect(n.rowStripe).toBe(true);
  });

  it("動きを書いた ER 図でも縞を持つ", () => {
    // 動きのある ER 図は `er()` 組み立て器を通らず、箱を直に組む別経路になる。
    // 出口で揃えないと、同じ図が動きの有無で縞を持ったり持たなかったりする
    const src = [
      ER().trimEnd(),
      "",
      "animation:",
      '  - step: "1" 0.9s',
      "    focus: [users]",
      "",
    ].join("\n");
    const d = textDslToDiagram(src);
    const 表 = d.nodes.filter((n) => n.kind === "storage");
    expect(表.length, "表の箱が 1 つも無い (検査が空振りしている)").toBeGreaterThan(0);
    for (const n of 表) expect(n.rowStripe).toBe(true);
  });

  it("ER 図とクラス図以外の表の箱には敷かない", () => {
    // 縞は「行を横に追う」 ための目印。 行を持たない図種の箱に付けても描き手が読まないので、
    // 書いたのに出ない欄を残さない
    const src = [
      'title: "確かめ"',
      "type: topology",
      "",
      "actors:",
      '  - DB: { kind: storage, rows: ["id: bigint", "name: text"] }',
      "  - App",
      "",
      "flow:",
      '  - App -> DB: "読む"',
      "",
    ].join("\n");
    const d = textDslToDiagram(src);
    const 表 = d.nodes.filter((n) => n.kind === "storage");
    expect(表.length, "表の箱が 1 つも無い (検査が空振りしている)").toBeGreaterThan(0);
    for (const n of 表) expect(n.rowStripe).toBeUndefined();
  });
});

/**
 * クラス図の既定の配色と行の縞の検証。
 *
 * ## 何を見るか
 *
 * クラス図が既定の `palette` を持つこと、明示した配色が既定より優先されること、表の箱の
 * `rowStripe` が動きの有無によらず保たれること。 記法と JSON の入口で同じ配色になることも見る。
 */

/** 表の箱を 2 つ持つ最小のクラス図。 配色と動きの節だけを差し替えて比べる。 */
const クラス = (配色?: string, 動きを書く = false): string =>
  [
    'title: "確かめ"',
    "type: class",
    ...(配色 === undefined ? [] : [`palette: ${配色}`]),
    "",
    "actors:",
    '  - User: { lane: c0, stack: 0, rows: ["+name: string", "+login(): Session"] }',
    '  - Admin: { lane: c0, stack: 1, rows: ["+permissions: string[]", "+banUser(): void"] }',
    "",
    "flow:",
    '  - Admin -> User: "継ぐ" (info) { relation: extends }',
    ...(動きを書く
      ? ["", "animation:", '  - step: "1" 0.9s', "    focus: [User]"]
      : []),
    "",
  ].join("\n");

/** JSON の入口で使う最小のクラス図。 */
const JSONのクラス = (配色?: string) => ({
  title: "確かめ",
  type: "class" as const,
  ...(配色 === undefined ? {} : { palette: 配色 }),
  actors: [
    { name: "User", lane: "c0", stack: 0, rows: ["+name: string", "+login(): Session"] },
    { name: "Admin", lane: "c0", stack: 1, rows: ["+permissions: string[]", "+banUser(): void"] },
  ],
  flow: [{ from: "Admin", to: "User", label: "継ぐ", tone: "info", relation: "extends" }],
});

describe("クラス図の配色と行の縞", () => {
  it("配色を書かないクラス図は記法と JSON のどちらでも生成りになる", () => {
    expect([textDslToDiagram(クラス()).palette, jsonToDiagram(JSONのクラス()).palette]).toEqual([
      "kinari",
      "kinari",
    ]);
  });

  it("クラス図に書いた配色は記法と JSON のどちらでも既定より優先される", () => {
    expect(textDslToDiagram(クラス("celadon")).palette).toBe("celadon");
    expect(jsonToDiagram(JSONのクラス("celadon")).palette).toBe("celadon");
  });

  it("クラス図の表の箱は縞を持つ", () => {
    const 表 = textDslToDiagram(クラス()).nodes.filter((n) => n.kind === "storage");
    expect(表.length, "表の箱が 1 つも無い (検査が空振りしている)").toBeGreaterThan(0);
    for (const n of 表) expect(n.rowStripe).toBe(true);
  });

  it("動きを書いたクラス図の表の箱も縞を持つ", () => {
    const 表 = textDslToDiagram(クラス(undefined, true)).nodes.filter((n) => n.kind === "storage");
    expect(表.length, "表の箱が 1 つも無い (検査が空振りしている)").toBeGreaterThan(0);
    for (const n of 表) expect(n.rowStripe).toBe(true);
  });
});
