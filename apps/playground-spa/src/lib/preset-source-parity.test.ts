/**
 * preset の記法と組み立て API の一致検査 (#1237)。
 *
 * catalog の図の多くは記法 (`sourceYaml`) を持たず、画面で「コード」 を見られず
 * 「エディタで開く」 も押せなかった。 記法を書き足すにあたり、**書いた記法が本当に同じ図に
 * なるか** を機械で確かめる。
 *
 * ## 何を一致とみなすか
 *
 * **骨格と中身**。 縦列 / 箱 / 矢印の数と、箱の題と、矢印の説明と、段の題。
 *
 * **id は見ない** (宣言した分を除く)。 記法は id を書けず、名前から導く規則を持つ
 * (`parser.ts`)。 一方 preset は組み立て API で明示 id を書いており (`{ id: "fn" }`)、
 * 名前と一致しないものが多い (`handler(...)` に対して `fn` 等)。 記法側で合わせる手段が無い。
 *
 * id が違っても、読む人が受け取るもの (同じ形と同じ字の図) は変わらない。 画面は組み立て済みの
 * 図を描き、エディタは記法から作った図を描く = 両者が id を突き合わせる場面が無い。
 *
 * それでも **偶然一致している分は固定する**。 `id が完全一致する` に宣言した preset は
 * id まで比べ、崩れたら落ちる。 宣言外で一致し始めたら宣言を足せる。
 *
 * ## 表せない中身は宣言する
 *
 * 宣言に無い差が出たら落ちる = 記法を書き換えて図がずれた時に気付ける。
 */
import { describe, it, expect } from "vitest";
import { textDslToDiagram } from "@cardenelabs/dragon";
import type { CdlDiagram } from "@cardenelabs/cdl";
import * as Presets from "@/topics/catalog/presets.cdl";

/**
 * id まで完全に一致する preset。
 *
 * 記法の id 生成規則 (名前の slug) と preset の明示 id がたまたま揃っているもの。
 * 実測で確かめた分だけを載せる。
 *
 * **`animation:` を書くと矢印の id が変わる図種がある** (実測 = `type: state` は
 * `t0-idle-loading` だが、`animation:` を足すと `e0-idle-loading` になる)。 段を合わせるには
 * `animation:` が要るため、その図種は id 一致を諦めて骨格の一致で見る。
 */
const id完全一致: readonly string[] = ["presetSequence"];

/**
 * 縦列の見出しが合わないと分かっている preset。 1 件ずつ理由を書く。
 *
 * 記法は縦列の見出しを箱の名前から自動で付ける (`er` なら `User` / `Order`)。 組み立て API は
 * 空のまま置く。 **ただしこの図種は縦列の見出しを描かない** ため、字が違っても画面に出ない
 * (実画面で確認 = エディタで開いた図と catalog の図に見出しの帯がどちらも無い)。
 *
 * 空文字の見出しは記法が受け付けない (`label: ""` は `invalid lane entry` で落ちる) ので、
 * 記法側で合わせる手段が無い。
 */
const 縦列の見出しの既知の差: Record<string, string> = {
  presetEr: "この図種は縦列の見出しを描かない",
  presetStateMachine: "この図種は縦列の見出しを描かない",
};

const 光らせる先の既知の差: Record<string, string> = {
  // 順序図の縦線 (`user-header` 等) は `focus:` が受け付けない (`focus.ts` が縦列の id を
  // 意図的に拒否する)。 組み立て API は最初の段から縦線を光らせて「誰の時間軸か」 を
  // 読ませているが、記法には書く手段が無い。 骨格と字は一致する。
  presetSequence: "縦線を光らせる指定が記法に無い",
};

type Diagram = CdlDiagram;

/** `sourceYaml__<key>` を持つ preset を集める */
function 記法つき(): { key: string; yaml: string; built: Diagram }[] {
  const mod = Presets as unknown as Record<string, unknown>;
  const out: { key: string; yaml: string; built: Diagram }[] = [];
  for (const [k, v] of Object.entries(mod)) {
    if (!k.startsWith("sourceYaml__") || typeof v !== "string") continue;
    const key = k.slice("sourceYaml__".length);
    const built = mod[key];
    // 記法だけあって図が無い形を落とす。 通すと「比べる相手が無いのに通った」 になる
    if (built === null || typeof built !== "object") {
      throw new Error(`sourceYaml__${key} に対応する preset export が無い`);
    }
    out.push({ key, yaml: v, built: built as Diagram });
  }
  return out;
}

const 対象 = 記法つき();
const ids = (a: readonly { id: string }[] | undefined): string[] => (a ?? []).map((x) => x.id);
const 題 = (a: readonly { title?: string }[] | undefined): string[] => (a ?? []).map((x) => x.title ?? "");
const 説明 = (a: readonly { label?: string }[] | undefined): string[] => (a ?? []).map((x) => x.label ?? "");

/**
 * 箱が読む人に見せる中身。 種類 / 小見出し / 上の小見出し / 行 / 値。
 *
 * 題だけを比べると、行や小見出しが落ちた記法を通してしまう (実測 = `er` の行を 1 つ削っても
 * 題は変わらず素通りした)。 読む人が見るのは中身なので、そこまで比べる。
 *
 * 座標と色は見ない = 組み立て API 側の既定に依存し、記法で書かない限り一致する保証が無い。
 */
const 中身 = (
  a: readonly { kind?: string; title?: string; subtitle?: string; eyebrow?: string; value?: string; rows?: string[] }[] | undefined,
): string[] =>
  (a ?? []).map((x) =>
    JSON.stringify({
      kind: x.kind ?? "",
      title: x.title ?? "",
      subtitle: x.subtitle ?? "",
      eyebrow: x.eyebrow ?? "",
      value: x.value ?? "",
      rows: x.rows ?? [],
    }),
  );

/** 矢印が読む人に見せる中身。 説明 / 補足 / 色 / 線種 */
const 矢印の中身 = (
  a: readonly { label?: string; sub?: string; tone?: string; style?: string }[] | undefined,
): string[] =>
  (a ?? []).map((x) =>
    JSON.stringify({ label: x.label ?? "", sub: x.sub ?? "", tone: x.tone ?? "", style: x.style ?? "" }),
  );

/** 段が読む人に見せる中身と動き。 光らせる先は id 差があるので別に比べる */
const 段の中身 = (a: Diagram["phases"]): string[] =>
  a.map((x) =>
    JSON.stringify({
      duration: x.duration,
      title: x.title,
      body: x.body,
      badge: x.badge ?? "",
      tweens: x.tweens,
      sets: x.sets,
    }),
  );

describe("記法が組み立て API と同じ図になる (#1237)", () => {
  it("対象を 1 件以上見つけている", () => {
    // 0 件だと以下の検査が空回りする = 記法を 1 つも書いていないのに全部通る
    expect(対象.length, "`sourceYaml__<key>` を持つ preset が 1 件も無い").toBeGreaterThan(0);
  });

  for (const t of 対象) {
    describe(t.key, () => {
      const 記法 = textDslToDiagram(t.yaml);

      it("箱の数と題が一致する", () => {
        expect(題(記法.nodes)).toEqual(題(t.built.nodes));
      });

      it("箱の中身が一致する", () => {
        // 題だけを見ていると、行や小見出しが落ちた記法を通してしまう (実測 = er の行を
        // 1 つ削っても題は変わらず素通りした)。 読む人が見るのは中身なので、そこまで比べる
        expect(中身(記法.nodes)).toEqual(中身(t.built.nodes));
      });

      it("矢印の数と説明が一致する", () => {
        expect(説明(記法.edges)).toEqual(説明(t.built.edges));
      });

      it("矢印の中身が一致する", () => {
        expect(矢印の中身(記法.edges)).toEqual(矢印の中身(t.built.edges));
      });

      it("縦列の数と見出しが一致する (既知の差は宣言したものだけ)", () => {
        // 数だけを見ていると、見出し (`Authentication Flow` 等) が落ちた記法を通してしまう。
        // 縦列の見出しは画面に出る字なので、そこまで比べる。 id は名前から導かれるため見ない
        const 見出し = (a: readonly { label?: string }[] | undefined): string[] =>
          (a ?? []).map((x) => x.label ?? "");
        if (t.key in 縦列の見出しの既知の差) {
          // 見出しは違っても **数は合わせる** = 縦列が増減したら画面の配置が変わる
          expect((記法.lanes ?? []).length).toBe((t.built.lanes ?? []).length);
          // 宣言した差が解消したら落とす = 宣言が古くなったまま残らない
          expect(見出し(記法.lanes), `${t.key} の差が解消している。 宣言から外すこと`).not.toEqual(
            見出し(t.built.lanes),
          );
          return;
        }
        expect(見出し(記法.lanes)).toEqual(見出し(t.built.lanes));
      });

      it("段の中身が並びごと一致する", () => {
        expect(段の中身(記法.phases)).toEqual(段の中身(t.built.phases));
      });

      it("段が光らせる先の数が一致する (既知の差は宣言したものだけ)", () => {
        // id は違いうるので数で見る。 0 と非 0 の取り違え (`focus:` が解決できていない形) は
        // これで落ちる
        const 記法側 = 記法.phases.map((p) => p.activate.length);
        const 組立側 = t.built.phases.map((p) => p.activate.length);
        if (t.key in 光らせる先の既知の差) {
          // 宣言した差が解消したら落とす = 宣言が古くなったまま残らない
          expect(記法側, `${t.key} の差が解消している。 宣言から外すこと`).not.toEqual(組立側);
          // 解決できていない形 (全段 0) は差ではなく壊れなので、別に落とす
          expect(記法側.some((n) => n > 0), `${t.key} で focus が 1 つも解決していない`).toBe(true);
          return;
        }
        expect(記法側).toEqual(組立側);
      });

      if (id完全一致.includes(t.key)) {
        it("id まで完全に一致する", () => {
          expect(ids(記法.nodes)).toEqual(ids(t.built.nodes));
          expect(ids(記法.edges)).toEqual(ids(t.built.edges));
          expect(ids(記法.lanes)).toEqual(ids(t.built.lanes));
        });
      }
    });
  }

  it("宣言が全て実在する preset を指す", () => {
    const 実在2 = new Set(対象.map((t) => t.key));
    const 幽霊2 = Object.keys(光らせる先の既知の差).filter((k) => !実在2.has(k));
    expect(幽霊2, "光らせる先の既知の差に宣言されているが記法を持たない preset").toEqual([]);
    const 幽霊4 = Object.keys(縦列の見出しの既知の差).filter((k) => !実在2.has(k));
    expect(幽霊4, "縦列の見出しの既知の差に宣言されているが記法を持たない preset").toEqual([]);
  });

  it("id 完全一致の宣言が全て実在する preset を指す", () => {
    // 宣言だけ残って対象が消えた形を落とす
    const 実在 = new Set(対象.map((t) => t.key));
    const 幽霊 = id完全一致.filter((k) => !実在.has(k));
    expect(幽霊, "id 完全一致に宣言されているが記法を持たない preset").toEqual([]);
  });
});
