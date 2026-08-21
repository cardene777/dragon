/**
 * 見本 (parts) の箱に書いた「見本に効かない欄」 を誤りとして返すことの検証 (#1308)。
 *
 * JSON 入口では、見本の箱に `tone` を書くと検査を通ったうえで **値が丸ごと捨てられて**
 * いた。 誤りも警告も出ないため、書いた人には「書いたのに図が変わらない」 としか見えない。
 * 同じことが 5 欄で起きていた。
 *
 * ```text
 * 記法  見本 tone : {"stateOverride":{"tone":"error"}}
 * JSON  見本 tone : {}                                   ← 消える
 * ```
 *
 * 記法が届くのは `tone` を特別扱いしているからではない。 見本の中括弧に書いた名前を
 * **すべて** 状態の上書きとして読むためで、JSON は欄ごとに型を宣言する形なので同じ設計を
 * 持ち込めない。 したがって誤りとして返し、`state` を使う道を案内する。
 *
 * ## 何を測るか
 *
 * 落とす欄を手で並べると、`jsonToDoc` に欄が増えた時に検査だけが古くなる。
 * **落ちる欄を実際に走らせて数え**、表と一致することを見る。
 */
import { describe, it, expect } from "vitest";
import {
  ACCEPTED_KEYS,
  jsonToDoc,
  validateDragonJson,
  見本に効かない欄,
  見本にしか効かない欄,
  type DragonJson,
} from "../src/json-parser";
import { 図 } from "./support/json-field-input";

/** 箱の欄すべてに置く、通る値 */
const 箱の値: Record<string, unknown> = {
  name: "g1",
  kind: "card",
  subtitle: "補足",
  eyebrow: "分類",
  value: "42",
  rows: ["ア"],
  lane: "L1",
  stack: 1,
  initial: true,
  final: true,
  tone: "success",
  color: "#f59e0b",
  owner: "私",
  end: "Q2",
  touchpoint: "店頭",
  opportunity: "改善",
  posX: 10,
  posY: 20,
  posW: 30,
  posH: 40,
  nodes: { header: { posX: 1 } },
  scale: 2,
  state: { v: 1 },
  pos: { x: 1, y: 2 },
};

/** 全欄を書いた箱を組み立てて、届いた欄の名前を集める */
function 届いた欄(kind: string): Set<string> {
  const actor: Record<string, unknown> = { ...箱の値, kind };
  // 検査を通さずに組み立てだけを見る = 検査が誤りにする欄も含めて「落ちるか」 を測るため
  const doc = jsonToDoc(
    図({ actors: [actor, { name: "Z" }] }) as unknown as DragonJson,
  );
  const a = doc.actors[0] as unknown as Record<string, unknown>;
  return new Set(Object.keys(a).filter((k) => a[k] !== undefined));
}

describe("落とす欄の表が実装と一致する (#1308)", () => {
  it("表が空でない", () => {
    // 空なら以下の走査は 1 件も回らずに通る
    expect(見本に効かない欄.length, "表が空 (検査が空振りしている)").toBeGreaterThan(0);
    expect(見本にしか効かない欄.length, "鏡の表が空 (検査が空振りしている)").toBeGreaterThan(0);
  });

  it("2 つの表は受ける項目の一覧に載っている", () => {
    const 受ける = ACCEPTED_KEYS.actor as readonly string[];
    for (const 欄 of [...見本に効かない欄, ...見本にしか効かない欄]) {
      expect(受ける, `${欄} が受ける項目に無い`).toContain(欄);
    }
  });

  it("2 つの表は重ならない", () => {
    // 重なると「どちらの箱でも誤り」 になり、書きようが無い欄ができる
    const 重複 = (見本に効かない欄 as readonly string[]).filter((k) =>
      (見本にしか効かない欄 as readonly string[]).includes(k),
    );
    expect(重複, "両方の表に載っている欄がある").toEqual([]);
  });

  it("箱の全欄に置く値を用意してある", () => {
    const 抜け = (ACCEPTED_KEYS.actor as readonly string[]).filter((k) => !(k in 箱の値));
    expect(抜け, "値を用意していない欄がある (その欄は 1 度も測られない)").toEqual([]);
  });

  it("見本の箱で落ちる欄が、表とちょうど一致する", () => {
    // **実際に組み立てて数える**。 表を手で信じると、`jsonToDoc` に欄が増えた時に
    // 検査だけが古くなる (#1304 / #1306 が踏んだ形)
    const 普通 = 届いた欄("card");
    const 見本 = 届いた欄("arc-gauge");
    expect(普通.size, "普通の箱で 1 欄も届いていない (検査が空振りしている)").toBeGreaterThan(0);
    const 落ちた = [...普通].filter((k) => !見本.has(k)).sort();
    expect(落ちた, "見本で落ちる欄が表と食い違う").toEqual([...見本に効かない欄].sort());
  });
});

describe("見本の箱に書いた欄は誤りになる (#1308)", () => {
  const 見本の箱 = (欄: string, v: unknown) =>
    図({ actors: [{ name: "g1", kind: "arc-gauge", [欄]: v }, { name: "Z" }] });
  const 普通の箱 = (欄: string, v: unknown) =>
    図({ actors: [{ name: "g1", kind: "card", [欄]: v }, { name: "Z" }] });

  it("表の全欄で、見本の箱に書くとその欄を指す誤りになる", () => {
    let 測れた = 0;
    const 素通り: string[] = [];
    for (const 欄 of 見本に効かない欄) {
      測れた += 1;
      const r = validateDragonJson(見本の箱(欄, 箱の値[欄]));
      if (r.ok) {
        素通り.push(`${欄} が通ってしまう`);
        continue;
      }
      if (!r.errors.some((e) => e.path === `$.actors[0].${欄}`)) {
        素通り.push(`${欄} の誤りが $.actors[0].${欄} を指さない`);
      }
    }
    expect(測れた, "欄を 1 つも測れていない (検査が空振りしている)").toBe(見本に効かない欄.length);
    expect(素通り, "見本の箱で素通りする欄がある").toEqual([]);
  });

  it("誤りは state を使う道を案内する", () => {
    // 「効かない」 だけを伝えると、書いた人は別の綴りを試し続けることになる
    for (const 欄 of 見本に効かない欄) {
      const r = validateDragonJson(見本の箱(欄, 箱の値[欄]));
      expect(r.ok).toBe(false);
      if (r.ok) continue;
      const e = r.errors.find((x) => x.path === `$.actors[0].${欄}`);
      expect(e?.hint, `${欄} の hint が state を案内していない`).toContain("state");
      expect(e?.hint, `${欄} の hint が書き方を示していない`).toContain(`"${欄}"`);
    }
  });

  it("表の全欄で、普通の箱に書くと通り値が届く (厳しくしすぎていない)", () => {
    let 測れた = 0;
    const 落ちた: string[] = [];
    for (const 欄 of 見本に効かない欄) {
      測れた += 1;
      const input = 普通の箱(欄, 箱の値[欄]);
      const r = validateDragonJson(input);
      if (!r.ok) {
        落ちた.push(`${欄}: ${r.errors.map((e) => `${e.path} ${e.message}`).join(" / ")}`);
        continue;
      }
      const a = jsonToDoc(r.data).actors[0] as unknown as Record<string, unknown>;
      if (a[欄] === undefined) 落ちた.push(`${欄}: 通るが値が届かない`);
    }
    expect(測れた, "欄を 1 つも測れていない (検査が空振りしている)").toBe(見本に効かない欄.length);
    expect(落ちた, "普通の箱で誤りになるか、値が届かない").toEqual([]);
  });

  it("見本の箱に state を書く経路は引き続き通る", () => {
    // 誤りにしたのは「効かない書き方」 だけで、効く書き方は残す
    const r = validateDragonJson(
      図({ actors: [{ name: "g1", kind: "arc-gauge", state: { tone: "error" } }, { name: "Z" }] }),
    );
    expect(r.ok, r.ok ? "" : r.errors.map((e) => `${e.path} ${e.message}`).join(" / ")).toBe(true);
    if (!r.ok) return;
    const a = jsonToDoc(r.data).actors[0];
    expect(a?.stateOverride).toEqual({ tone: "error" });
  });
});

describe("鏡の向き (#1294) は変わっていない", () => {
  it("見本にしか効かない欄を普通の箱に書くと誤りになる", () => {
    for (const 欄 of 見本にしか効かない欄) {
      const r = validateDragonJson(
        図({ actors: [{ name: "A", kind: "card", [欄]: 箱の値[欄] }, { name: "Z" }] }),
      );
      expect(r.ok, `${欄} が通ってしまう`).toBe(false);
      if (r.ok) continue;
      const e = r.errors.find((x) => x.path === `$.actors[0].${欄}`);
      expect(e?.message, 欄).toContain("only for parts");
    }
  });

  it("見本にしか効かない欄を見本の箱に書くと通る", () => {
    for (const 欄 of 見本にしか効かない欄) {
      const r = validateDragonJson(
        図({ actors: [{ name: "g1", kind: "arc-gauge", [欄]: 箱の値[欄] }, { name: "Z" }] }),
      );
      expect(r.ok, `${欄} が誤りになる`).toBe(true);
    }
  });
});
