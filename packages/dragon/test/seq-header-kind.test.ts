/**
 * 順序図の名札に載せる種類の検証 (#1058)。
 *
 * 名札は小型の箱 (`h: 72`) で作られる。 描画側は `card` に小型用の分岐を持つが `actor` には無く、
 * `actor` を載せると名前の文字が箱の下端をはみ出す。
 *
 * `kind` は書かなくても既定の `actor` が入るため、 値だけを見ると「書かなかった」 が
 * 「`actor` と書いた」 に化ける。 書いた時だけ載せることを機械で守る。
 *
 * **記法は 5 経路ある**。 実装中に 2 度、 1 経路だけ直して他が漏れた (括弧記法を直した時に
 * inline mapping と継続行が残り、 書いた種類が `card` に落ちた)。 表で全経路を通す。
 *
 * 書いた種類の probe には `database` を使う。 `actor` / `function` / `storage` / `event` は
 * 名札の高さ (72) では名前が箱からはみ出すため `card` に落ちる (#1061) = これらで測ると、
 * 載せる経路を消しても結果が同じ `card` になり、 配線漏れを検知できない。
 * 落とす側の挙動は `seq-header-kind-fit.test.ts` が見る。
 */
import { describe, it, expect } from "vitest";
import { textDslToDiagram, jsonToDiagram, compileToCdl, parseTextDsl, parseTextDslV05 } from "../src/index";
// `jsonToDoc` は公開していないので実装から直接読む (JSON も他の記法と同じ規約を守るかを見る)
import { jsonToDoc } from "../src/json-parser";
import type { CdlDiagram, DslActor } from "../src/types";

/** 上端の名札の種類を id 別に返す。 */
function headerKinds(diagram: CdlDiagram): Record<string, string> {
  const out: Record<string, string> = {};
  for (const n of diagram.nodes) {
    if (String(n.id).endsWith("-header")) out[String(n.id)] = String(n.kind);
  }
  return out;
}

const V04 = `title: "t"
type: sequence

actors:
  - Client
  - API (database)

flow:
  1. Client → API: 呼ぶ
`;

const 略記 = `title: "t"
type: sequence

actors:
  - Client
  - API: database

flow:
  - Client -> API: "呼ぶ"
`;

const INLINE = `title: "t"
type: sequence

actors:
  - Client
  - API: { kind: database }

flow:
  - Client -> API: "呼ぶ"
`;

const 継続行 = `title: "t"
type: sequence

actors:
  - Client
  - API:
      kind: database

flow:
  - Client -> API: "呼ぶ"
`;

const JSON_DOC = {
  title: "t",
  type: "sequence" as const,
  actors: ["Client", { name: "API", kind: "database" }],
  flow: [{ from: "Client", to: "API", label: "呼ぶ" }],
};

/** `Client` は種類を書かない、 `API` は `database` を書く。 記法ごとに書き方が違う。 */
const 記法 = [
  { name: "v0.4 括弧", diagram: () => textDslToDiagram(V04), actors: () => parseTextDsl(V04).doc?.actors },
  { name: "v0.5 略記", diagram: () => textDslToDiagram(略記), actors: () => parseTextDslV05(略記).doc?.actors },
  { name: "v0.5 inline mapping", diagram: () => textDslToDiagram(INLINE), actors: () => parseTextDslV05(INLINE).doc?.actors },
  { name: "v0.5 継続行", diagram: () => textDslToDiagram(継続行), actors: () => parseTextDslV05(継続行).doc?.actors },
  { name: "JSON", diagram: () => jsonToDiagram(JSON_DOC), actors: () => jsonToDoc(JSON_DOC).actors },
];

const 探す = (list: DslActor[] | undefined, name: string) => list?.find((a) => a.name === name);

describe("順序図の名札の種類 (#1058)", () => {
  describe.each(記法)("$name", ({ diagram, actors }) => {
    it("書いた種類は名札に載る", () => {
      // #975 の意図 = 書いたのに効かない項目を残さない。 本 fix で失わせない
      const kinds = headerKinds(diagram());
      expect(kinds["api-header"], `書いた database が名札に載らない (id 一覧: ${Object.keys(kinds).join(", ")})`).toBe("database");
    });

    it("書かない登場人物の名札は card のまま", () => {
      // `actor` に化けると、 描画側の小型分岐 (h < 100 で中央揃え) が外れて
      // 名前の文字が箱の下端をはみ出す
      expect(headerKinds(diagram())["client-header"], "書いていない側まで巻き込んでいる").toBe("card");
    });

    it("書いたかを true / false で明示する", () => {
      // **省略では守れない**。 `kindWritten` を書き忘れると `undefined` になり、
      // 後方互換のために「書いた」 へ倒れる (記法を通さない直接組み立てを壊さないため)。
      // その結果 `undefined` は配線漏れを隠す = 漏れても名札が `actor` に戻るだけで、
      // 上の 2 件からは見えない。 parse が **明示的に値を置く** ことを直接見る。
      const list = actors();
      expect(探す(list, "Client"), "Client が読めていない").toBeDefined();
      expect(探す(list, "API"), "API が読めていない").toBeDefined();
      expect(探す(list, "Client")?.kindWritten, "書かなかったのに false が明示されていない").toBe(false);
      expect(探す(list, "API")?.kindWritten, "書いたのに true が明示されていない").toBe(true);
    });
  });

  it("下端の名札も上端と同じ種類になる", () => {
    // 上下で形が違うと、 同じ登場人物が別物に見える
    const diagram = textDslToDiagram(略記);
    const find = (id: string) => diagram.nodes.find((n) => n.id === id);
    expect(find("api-header")?.kind).toBe(find("api-footer")?.kind);
    expect(find("client-header")?.kind).toBe(find("client-footer")?.kind);
  });

  it("記法を通さず組み立てた場合は従来どおり書いた扱いになる", () => {
    // 公開 API (`compileToCdl`) を外から呼ぶ利用者は `kindWritten` を知らない。
    // `undefined` を「書かなかった」 に倒すと、 その経路で #975 の挙動が壊れる
    const diagram = compileToCdl({
      title: "t",
      type: "sequence",
      actors: [
        { name: "Client", kind: "service", pos: { line: 1 } },
        { name: "DB", kind: "database", pos: { line: 2 } },
      ],
      flow: [{ no: 1, from: "Client", to: "DB", label: "呼ぶ", pos: { line: 3 } }],
      pos: { line: 1 },
    });
    const kinds = headerKinds(diagram);
    expect(kinds["db-header"], "直接組み立てた database が card に落ちている").toBe("database");
    expect(kinds["client-header"], "直接組み立てた service が card に落ちている").toBe("service");
  });
});
