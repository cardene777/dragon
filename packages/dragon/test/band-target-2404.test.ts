/*
 * 順序図の帯 (`bands:`) に書いた面の名前と言づての番号を突き合わせて知らせる (#2404)。
 *
 * 読む側は行の形 (`- DB: 1..2`) しか見ておらず、その名前の面が居るかも、言づてがその番号まで
 * あるかも見ていなかった。 描く側 (外部の部品) は見つからない名前を先頭の面 (番号 0) に倒すため、
 * **綴りを間違えた帯は、正しく書いた帯と 1 byte も違わない図になる**。
 * 書いた人から見ると帯は出ているので、書き間違いに気付く手掛かりが 1 つも無い。
 *
 * ## 誤りにせず知らせにする
 *
 * 「別の所に書いた名前を指す」 欄は、既に 4 つとも知らせ (`CompileNotice`) で扱っている
 * (箱の `lane` / 組の `lanes` / 出来事の `box` / 矢印の端)。 帯も同じ扱いにする。
 *
 * ## 番号が指すのは言づての行
 *
 * 記法も型も「段の番号」 と書いていたが、描く側は `rowY(i)` で **i 通目の言づての高さ** を
 * 返しており、番号は段ではなく言づての行を 0 から数えたものだった (この回に実測)。
 * 見本も その読み方で書かれている (言づて 7 通の図に `ブラウザ: 0..5` / `DB: 6..6`)。
 * 段で数える検査を書くと、正しく書いた見本を範囲外として弾いてしまう。
 *
 * ## 組み上がる図は変えない
 *
 * 知らせを足すだけで、描く側へ渡す値は変えない。 綴り違いの図がこれまでと同じであることを
 * 併せて見る = 直した日に図が変わると、既にある図の見え方が黙って変わる。
 */
import { describe, expect, it } from "vitest";
import { compileToCdl } from "../src/compile";
import type { CompileNotice } from "../src/compile/notice";
import { validateDragonJson } from "../src/json-parser";
import { parseTextDslV05 } from "../src/v05/parser";

/** 面 3 つ ・ 言づて 3 通 ・ 段 2 つ。 帯の行だけを差し替えて使う */
function 本文(帯の行: string[]): string {
  return `title: "しらべ"
type: sequence

actors:
  - Client
  - API
  - DB

flow:
  - Client -> API: "頼む"
  - API -> DB: "引く"
  - DB -> API: "返す"

bands:
${帯の行.map((x) => `  - ${x}\n`).join("")}
animation:
  - step: "s1" 1s
    focus: ["Client -> API"]
  - step: "s2" 1s
    focus: ["API -> DB"]
`;
}

type 測った結果 = { 知らせ: CompileNotice[]; 図: string };

function 測る(帯の行: string[]): 測った結果 {
  const p = parseTextDslV05(本文(帯の行));
  if (!p.ok) throw new Error(`読めません: ${p.errors.map((e) => e.message).join(" / ")}`);
  const 知らせ: CompileNotice[] = [];
  const d = compileToCdl(p.doc, { onNotice: (n) => 知らせ.push(n) });
  return { 知らせ, 図: JSON.stringify(d) };
}

/** 帯についての知らせだけを取り出す (段の注目先など別の知らせを混ぜない) */
const 帯の知らせ = (r: 測った結果): CompileNotice[] =>
  r.知らせ.filter((n) => n.kind.startsWith("band-"));

/** 知らせの文と直し方を繋いだもの。 中身まで見るのに使う */
const 帯の文 = (r: 測った結果): string =>
  帯の知らせ(r)
    .map((n) => `${n.message} ${n.hint ?? ""}`)
    .join("\n");

describe("帯に書いた面の名前を突き合わせる (#2404)", () => {
  it("書いた面 3 通りは、どれも知らせ 0 件で通る", () => {
    const 弾いた = ["Client: 0..2", "API: 0..1", "DB: 1..2"].filter(
      (行) => 帯の知らせ(測る([行])).length > 0,
    );
    expect(弾いた, "正しく書いたのに知らせが出た帯").toEqual([]);
  });

  it("居ない面を指した 3 通りは、どれも知らせが 1 件出る", () => {
    const 黙った = ["Clinet: 0..2", "APII: 0..2", "ZZZ: 0..2"].filter(
      (行) => 帯の知らせ(測る([行])).length === 0,
    );
    expect(黙った, "知らせが 1 件も出なかった帯").toEqual([]);
  });

  it("知らせに書いた名前と、書ける面の一覧が入る", () => {
    const s = 帯の文(測る(["Clinet: 0..2"]));
    expect(s).toContain("Clinet");
    expect(s).toContain("Client");
    expect(s).toContain("DB");
  });

  it("知らせは書いた行を指す", () => {
    // 帯を 2 行書き、2 行目だけを間違える。 行を持たないと、直す場所が本文から読めない
    const n = 帯の知らせ(測る(["Client: 0..2", "Clinet: 0..2"]));
    expect(n).toHaveLength(1);
    // 本文の `bands:` は 14 行目、その下 2 行が帯の行
    expect(n[0]?.line).toBe(16);
  });

  it("面の名前を id の形で書いても通る", () => {
    // 矢印の端は `actorRefTable` で id の形 (`api-gateway`) の指定も受ける。 帯だけが別の
    // 突き合わせ方をすると、同じ名前が矢印では通り帯では弾かれる
    const p = parseTextDslV05(`title: "しらべ"
type: sequence

actors:
  - API Gateway
  - DB

flow:
  - API Gateway -> DB: "引く"

bands:
  - api-gateway: 0..0

animation:
  - step: "s1" 1s
    focus: ["API Gateway -> DB"]
`);
    if (!p.ok) throw new Error(p.errors.map((e) => e.message).join(" / "));
    const 知らせ: CompileNotice[] = [];
    compileToCdl(p.doc, { onNotice: (n) => 知らせ.push(n) });
    expect(知らせ.filter((n) => n.kind.startsWith("band-"))).toEqual([]);
  });
});

describe("帯に書いた言づての番号を突き合わせる (#2404)", () => {
  it("言づての並び (0..2) に収まる番号は知らせ 0 件で通る", () => {
    const 弾いた = ["DB: 0..0", "DB: 1..2", "DB: 2..2"].filter(
      (行) => 帯の知らせ(測る([行])).length > 0,
    );
    expect(弾いた, "収まる番号なのに知らせが出た帯").toEqual([]);
  });

  it("範囲外と、始まりが終わりより後ろの 2 通りは、どちらも知らせが 1 件出る", () => {
    const 黙った = ["DB: 5..9", "DB: 2..1"].filter((行) => 帯の知らせ(測る([行])).length === 0);
    expect(黙った, "知らせが 1 件も出なかった帯").toEqual([]);
  });

  it("負の番号は 2 つの入口がどちらも先に断る", () => {
    // 断られる以上、知らせの側に枝を置いても 1 度も通らない。 入口が緩んだらここが落ちる
    const 記法 = parseTextDslV05(本文(["DB: -1..2"]));
    expect(記法.ok, "記法が負の番号を受けた").toBe(false);
    if (!記法.ok) expect(記法.errors.map((e) => e.message).join()).toContain("帯の書き方が読めません");

    const json = validateDragonJson({
      title: "しらべ",
      type: "sequence",
      actors: [{ name: "Client" }, { name: "DB" }],
      flow: [{ from: "Client", to: "DB", label: "引く" }],
      bands: [{ actor: "DB", from: -1, to: 0 }],
    });
    expect(json.ok, "JSON が負の番号を受けた").toBe(false);
    if (!json.ok) expect(json.errors.map((e) => e.message).join()).toContain("non-negative integer");
  });

  it("知らせに書いた区間と、最後の番号が入る", () => {
    const s = 帯の文(測る(["DB: 5..9"]));
    expect(s).toContain("5..9");
    // 言づては 3 通なので最後は 2 番。 「3 通」 だけだと 0 から数えることが読めない
    expect(s).toContain("2");
    expect(s).toContain("0..2");
  });

  it("直し方に、番号が段でないことを書く", () => {
    // 記法も型も長く「段の番号」 と書いていた。 段で数え直すと、また別の範囲外になる
    expect(帯の文(測る(["DB: 5..9"]))).toContain("段ではありません");
  });

  it("板に載らない言づてを数に入れない", () => {
    // `actors` に無い名前を指す言づては組み立ての前に落ちる。 書いた行数で数えると、
    // 落ちた分だけ上限が広がって範囲外を見逃す
    const p = parseTextDslV05(`title: "しらべ"
type: sequence

actors:
  - Client
  - DB

flow:
  - Client -> DB: "引く"
  - Client -> ZZZ: "落ちる"
  - DB -> Client: "返す"

bands:
  - DB: 0..2
`);
    if (!p.ok) throw new Error(p.errors.map((e) => e.message).join(" / "));
    const 知らせ: CompileNotice[] = [];
    compileToCdl(p.doc, { onNotice: (n) => 知らせ.push(n) });
    const 帯 = 知らせ.filter((n) => n.kind === "band-step-out-of-range");
    expect(帯, "落ちた言づてを数に入れている").toHaveLength(1);
    expect(帯[0]?.hint).toContain("0..1");
  });

  it("名前も番号も外れた帯には、2 件とも出る", () => {
    // 片方で打ち切ると、名前を直した次の回に番号の誤りが初めて出る
    const k = 帯の知らせ(測る(["ZZZ: 5..9"])).map((n) => n.kind);
    expect([...k].sort()).toEqual(["band-actor-missing", "band-step-out-of-range"]);
  });
});

describe("知らせを足しても組み上がる図は変わらない (#2404)", () => {
  it("綴り違いの帯は、これまでどおり先頭の面に出る", () => {
    // 描く側が既定へ倒す動きは外部の部品の判断で、ここでは変えない
    expect(測る(["Clinet: 0..2"]).図).toBe(測る(["Client: 0..2"]).図);
  });

  it("正しく書いた帯の図も変わらない", () => {
    // 面ごとに別の帯になる = 上の等しさが「全部同じ図」 で成立していない
    expect(測る(["API: 0..2"]).図).not.toBe(測る(["Client: 0..2"]).図);
  });
});
