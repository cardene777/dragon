/**
 * 順序図の名札に載せる種類の検証 (#1058)。
 *
 * 名札は小型の箱 (`h: 72`) で作られる。 描画側は `card` に小型用の分岐を持つが `actor` には無く、
 * `actor` を載せると名前の文字が箱の下端をはみ出す。
 *
 * `kind` は書かなくても既定の `actor` が入るため、 値だけを見ると「書かなかった」 が
 * 「`actor` と書いた」 に化ける。 書いた時だけ載せることを機械で守る。
 */
import { describe, it, expect } from "vitest";
import { textDslToDiagram } from "../src/index";
import { jsonToDiagram } from "../src/index";

/** 順序図を 1 つ組み立てて、 上端の名札の種類を返す。 */
function headerKinds(src: string): Record<string, string> {
  const diagram = textDslToDiagram(src);
  const out: Record<string, string> = {};
  for (const n of diagram.nodes) {
    if (String(n.id).endsWith("-header")) out[String(n.id)] = String(n.kind);
  }
  return out;
}

const 種類なし = `title: "t"
type: sequence

actors:
  - Client
  - API

flow:
  - Client -> API: "呼ぶ"
`;

// 種類は `名前: 種類` の形で書く (v0.5 記法)
const 種類あり = `title: "t"
type: sequence

actors:
  - Client
  - API: storage

flow:
  - Client -> API: "呼ぶ"
`;

describe("順序図の名札の種類 (#1058)", () => {
  it("種類を書かない登場人物の名札は card のまま", () => {
    // `actor` に化けると、 描画側の小型分岐 (h < 100 で中央揃え) が外れて
    // 名前の文字が箱の下端をはみ出す
    expect(headerKinds(種類なし)).toEqual({
      "client-header": "card",
      "api-header": "card",
    });
  });

  it("種類を書いた登場人物の名札には書いた種類が載る", () => {
    // #975 の意図 = 書いたのに効かない項目を残さない。 本 fix で失わせない
    const kinds = headerKinds(種類あり);
    expect(kinds["api-header"], "書いた storage が名札に載らない").toBe("storage");
    expect(kinds["client-header"], "書いていない側まで巻き込んでいる").toBe("card");
  });

  it("下端の名札も上端と同じ種類になる", () => {
    // 上下で形が違うと、 同じ登場人物が別物に見える
    const diagram = textDslToDiagram(種類あり);
    const find = (id: string) => diagram.nodes.find((n) => n.id === id);
    expect(find("api-header")?.kind).toBe(find("api-footer")?.kind);
    expect(find("client-header")?.kind).toBe(find("client-footer")?.kind);
  });

  it("JSON 経路でも書いた時だけ載る", () => {
    // 記法が 3 経路あるので、 1 つ直して他が残る形にしない
    const diagram = jsonToDiagram({
      title: "t",
      type: "sequence",
      actors: ["Client", { name: "API", kind: "storage" }],
      flow: [{ from: "Client", to: "API", label: "呼ぶ" }],
    });
    const kind = (id: string) => diagram.nodes.find((n) => n.id === id)?.kind;
    expect(kind("client-header"), "書いていないのに actor に化けている").toBe("card");
    expect(kind("api-header"), "書いた storage が載らない").toBe("storage");
  });
});
