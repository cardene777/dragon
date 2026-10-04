/**
 * 図の配色と行の縞の検証 (#1553)。
 *
 * 表の箱は小さい字が密に並ぶので、行を横に追う目印が無かった。 色を増やさず、表の箱の中を
 * 1 行おきに薄く敷いて面で分ける。
 * クラス図も箱の作りが同じで、名前と型を離して並べるため、同じ理由で行の縞を持つ。
 *
 * ## 既定の配色を持つのはクラス図だけ (#2782)
 *
 * 表の図と移り変わりの図を `record` 1 つに畳んだため、**`record` は書かなければ配色を
 * 持たない**。 2 つの図は行の有無でも行の中身でも分かれず (どちらも `kind: storage` に
 * `督促を送る: 7 日ごと` の形の行を書く)、分けられない材料で推し量ると、どちらかの図が
 * 書いていない色みを名乗る。
 *
 * 縞も配色から色を取るので、配色が決まった図の行を書いた箱にだけ敷く。
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
import {
  textDslToDiagram,
  jsonToDiagram,
  validateDragonJson,
  type CompileNotice,
} from "../src/index";
import { parseTextDslV05 } from "../src/v05/parser";
import { THEMES, resolveTheme } from "../src/keywords";

/** 表の箱を 2 つ持つ最小の ER 図。 配色の行だけを差し替えて比べる。 */
const ER = (意匠?: string, 語: "theme" | "palette" = "theme"): string =>
  [
    'title: "確かめ"',
    "type: record",
    ...(意匠 === undefined ? [] : [`${語}: ${意匠}`]),
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
const 流れ = (意匠?: string, 語: "theme" | "palette" = "theme"): string =>
  [
    'title: "確かめ"',
    "type: flow",
    ...(意匠 === undefined ? [] : [`${語}: ${意匠}`]),
    "",
    "actors:",
    "  - A",
    "  - B",
    "",
    "flow:",
    '  - A -> B: "x"',
    "",
  ].join("\n");

/** 表の箱を 1 つ持つ最小のつながり図。 配色と行の縞が既定で付かないことを見る。 */
const つながり = (): string =>
  [
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

describe("図の意匠 (#1553 / #2790)", () => {
  it("`record` は書かなければ配色を持たない (#2782)", () => {
    // 畳む前は `type: er` が書かなくても生成りに茶になった。 畳んだ先には移り変わりの図も
    // 入り、2 つは行の形で分かれないので、推し量ると片方が書いていない色みを名乗る
    expect(textDslToDiagram(ER()).palette).toBeUndefined();
  });

  it("書いた名前が勝つ", () => {
    expect(textDslToDiagram(ER("celadon")).palette).toBe("celadon");
  });

  it("日本語でも書ける", () => {
    expect(textDslToDiagram(ER("青磁")).palette).toBe("celadon");
    expect(textDslToDiagram(ER("生成り")).palette).toBe("kinari");
  });

  it("`flow` 図と `topology` 図は書かなければ配色を持たない", () => {
    // 既定を持つのはクラス図だけ。 それ以外まで配ると、配色を前提にしない図にも
    // 画面の色みと図の色みが二重に載る
    expect([textDslToDiagram(流れ()).palette, textDslToDiagram(つながり()).palette]).toEqual([
      undefined,
      undefined,
    ]);
  });

  it("`record` 以外でも書けば載る", () => {
    expect(textDslToDiagram(流れ("celadon")).palette).toBe("celadon");
  });

  it("知らない名前は v05 の theme と palette、JSON の theme と palette の全てで正の名前を並べる", () => {
    // 黙って既定に落とすと、書き手には「書いたのに効かない」 としか見えず、
    // 書き間違いか未対応かを分けられない
    const v05 = [parseTextDslV05(ER("mizuiro", "theme")), parseTextDslV05(ER("mizuiro", "palette"))];
    const json = [
      validateDragonJson({
        title: "確かめ",
        type: "record",
        theme: "mizuiro",
        actors: ["A"],
        flow: [],
      }),
      validateDragonJson({
        title: "確かめ",
        type: "record",
        palette: "mizuiro",
        actors: ["A"],
        flow: [],
      }),
    ];
    const 文 = [
      ...v05.flatMap((r) => (r.ok ? [] : r.errors.map((e) => e.message))),
      ...json.flatMap((r) => (r.ok ? [] : r.errors.map((e) => e.message))),
    ];
    expect(文, "4 経路の誤りを集められていない").toHaveLength(4);
    expect(文.some((message) => message.includes("theme が読めません"))).toBe(true);
    expect(文.some((message) => message.includes("palette が読めません"))).toBe(true);
    for (const message of 文) {
      for (const theme of THEMES) expect(message).toContain(theme);
    }
  });

  it("v05 と JSON の theme で blueprint を読み、JSON の図面も同じ意匠に解く", () => {
    expect(textDslToDiagram(ER("blueprint", "theme")).palette).toBe("blueprint");
    const d = jsonToDiagram({
      title: "確かめ",
      type: "record",
      theme: "blueprint",
      actors: [{ name: "users", kind: "storage", rows: ["id: bigint"], marks: ["pk"] }],
      flow: [],
    });
    expect(d.palette).toBe("blueprint");
    expect(
      jsonToDiagram({
        title: "確かめ",
        type: "record",
        theme: "図面",
        actors: ["A"],
        flow: [],
      }).palette,
    ).toBe("blueprint");
  });

  it("正の名前の一覧は全て resolveTheme で自分自身に解ける", () => {
    // 別々に解くと、片方だけ別名を受けるようになる
    expect(THEMES.length, "意匠の一覧が空で検査が空振りしている").toBeGreaterThan(0);
    for (const 名 of THEMES) {
      expect(resolveTheme(名)).toBe(名);
    }
    expect(resolveTheme("mizuiro")).toBeNull();
  });

  it("theme: blueprint、theme: 図面、palette: blueprint の図は完全に一致し、知らせを出さない", () => {
    const 組み立てる = (本文: string): { diagram: ReturnType<typeof textDslToDiagram>; notices: CompileNotice[] } => {
      const notices: CompileNotice[] = [];
      const diagram = textDslToDiagram(本文, { onNotice: (notice) => notices.push(notice) });
      return { diagram, notices };
    };
    const 正 = 組み立てる(ER("blueprint", "theme"));
    const 和名 = 組み立てる(ER("図面", "theme"));
    const 別名 = 組み立てる(ER("blueprint", "palette"));
    expect([正.notices, 和名.notices, 別名.notices]).toEqual([[], [], []]);
    expect(正.diagram.palette).toBe("blueprint");
    expect(和名.diagram).toEqual(正.diagram);
    expect(別名.diagram).toEqual(正.diagram);
  });

  it("letterpress / 活版: theme と palette の組み立て結果が一致し、v05 と JSON で正の名前に解ける", () => {
    const 組み立てる = (本文: string): { diagram: ReturnType<typeof textDslToDiagram>; notices: CompileNotice[] } => {
      const notices: CompileNotice[] = [];
      const diagram = textDslToDiagram(本文, { onNotice: (notice) => notices.push(notice) });
      return { diagram, notices };
    };
    const 正 = 組み立てる(ER("letterpress", "theme"));
    const 和名 = 組み立てる(ER("活版", "theme"));
    const 別名 = 組み立てる(ER("letterpress", "palette"));

    expect([正.notices, 和名.notices, 別名.notices]).toEqual([[], [], []]);
    expect(正.diagram.palette).toBe("letterpress");
    expect(和名.diagram).toEqual(正.diagram);
    expect(別名.diagram).toEqual(正.diagram);
    const v05 = [parseTextDslV05(ER("letterpress", "theme")), parseTextDslV05(ER("活版", "theme"))];
    for (const result of v05) {
      expect(result).toMatchObject({ ok: true });
      if (result.ok) expect(result.doc.theme).toBe("letterpress");
    }
    expect(jsonToDiagram({ title: "確かめ", type: "record", theme: "letterpress", actors: ["A"], flow: [] }).palette).toBe("letterpress");
    expect(jsonToDiagram({ title: "確かめ", type: "record", theme: "活版", actors: ["A"], flow: [] }).palette).toBe("letterpress");
    expect(resolveTheme("letterpress")).toBe("letterpress");
    expect(resolveTheme("活版")).toBe("letterpress");
  });

  it("catalog / 図録: theme と palette の組み立て結果が一致し、v05 と JSON で正の名前に解ける", () => {
    const 組み立てる = (本文: string): { diagram: ReturnType<typeof textDslToDiagram>; notices: CompileNotice[] } => {
      const notices: CompileNotice[] = [];
      const diagram = textDslToDiagram(本文, { onNotice: (notice) => notices.push(notice) });
      return { diagram, notices };
    };
    const 正 = 組み立てる(ER("catalog", "theme"));
    const 和名 = 組み立てる(ER("図録", "theme"));
    const 別名 = 組み立てる(ER("catalog", "palette"));

    expect([正.notices, 和名.notices, 別名.notices]).toEqual([[], [], []]);
    expect(正.diagram.palette).toBe("catalog");
    expect(和名.diagram).toEqual(正.diagram);
    expect(別名.diagram).toEqual(正.diagram);
    const v05 = [parseTextDslV05(ER("catalog", "theme")), parseTextDslV05(ER("図録", "theme"))];
    for (const result of v05) {
      expect(result).toMatchObject({ ok: true });
      if (result.ok) expect(result.doc.theme).toBe("catalog");
    }
    expect(jsonToDiagram({ title: "確かめ", type: "record", theme: "catalog", actors: ["A"], flow: [] }).palette).toBe("catalog");
    expect(jsonToDiagram({ title: "確かめ", type: "record", theme: "図録", actors: ["A"], flow: [] }).palette).toBe("catalog");
    expect(resolveTheme("catalog")).toBe("catalog");
    expect(resolveTheme("図録")).toBe("catalog");
  });

  it("terminal / 端末: theme と palette の組み立て結果が一致し、v05 と JSON で正の名前に解ける", () => {
    const 組み立てる = (本文: string): { diagram: ReturnType<typeof textDslToDiagram>; notices: CompileNotice[] } => {
      const notices: CompileNotice[] = [];
      const diagram = textDslToDiagram(本文, { onNotice: (notice) => notices.push(notice) });
      return { diagram, notices };
    };
    const 正 = 組み立てる(ER("terminal", "theme"));
    const 和名 = 組み立てる(ER("端末", "theme"));
    const 別名 = 組み立てる(ER("terminal", "palette"));

    expect([正.notices, 和名.notices, 別名.notices]).toEqual([[], [], []]);
    expect(正.diagram.palette).toBe("terminal");
    expect(和名.diagram).toEqual(正.diagram);
    expect(別名.diagram).toEqual(正.diagram);
    const v05 = [parseTextDslV05(ER("terminal", "theme")), parseTextDslV05(ER("端末", "theme"))];
    for (const result of v05) {
      expect(result).toMatchObject({ ok: true });
      if (result.ok) expect(result.doc.theme).toBe("terminal");
    }
    expect(jsonToDiagram({ title: "確かめ", type: "record", theme: "terminal", actors: ["A"], flow: [] }).palette).toBe("terminal");
    expect(jsonToDiagram({ title: "確かめ", type: "record", theme: "端末", actors: ["A"], flow: [] }).palette).toBe("terminal");
    expect(resolveTheme("terminal")).toBe("terminal");
    expect(resolveTheme("端末")).toBe("terminal");
  });

  it("theme と palette を両方書くと順番に依らず theme が勝ち、v05 と JSON で知らせが 1 件になる", () => {
    const 本文たち = [
      ER("kinari", "theme").replace("theme: kinari", "theme: blueprint\npalette: celadon"),
      ER("kinari", "theme").replace("theme: kinari", "palette: celadon\ntheme: blueprint"),
    ];
    const JSONたち = [
      { theme: "blueprint", palette: "celadon" },
      { palette: "celadon", theme: "blueprint" },
    ];
    const 結果: Array<{ palette: string | undefined; notices: CompileNotice[] }> = [];
    for (const src of 本文たち) {
      const notices: CompileNotice[] = [];
      const diagram = textDslToDiagram(src, { onNotice: (notice) => notices.push(notice) });
      結果.push({ palette: diagram.palette, notices });
    }
    for (const fields of JSONたち) {
      const notices: CompileNotice[] = [];
      const diagram = jsonToDiagram(
        { title: "確かめ", type: "record", ...fields, actors: ["A"], flow: [] },
        { onNotice: (notice) => notices.push(notice) },
      );
      結果.push({ palette: diagram.palette, notices });
    }
    expect(結果, "v05 2 通りと JSON 2 通りを確かめていない").toHaveLength(4);
    for (const { palette, notices } of 結果) {
      expect(palette).toBe("blueprint");
      expect(notices).toHaveLength(1);
      expect(notices[0]?.kind).toBe("theme-palette-both");
      expect(notices[0]?.message).toContain("theme: の値 (blueprint)");
    }
    expect(結果[0]?.notices[0]?.line, "palette: の行を指していない").toBe(4);
    expect(結果[1]?.notices[0]?.line, "palette: の行を指していない").toBe(3);
  });

  it("palette: kinari と theme: kinari の組み立て結果が完全に一致する", () => {
    expect(textDslToDiagram(ER("kinari", "palette"))).toEqual(
      textDslToDiagram(ER("kinari", "theme")),
    );
  });
});

describe("行の縞 (#1553)", () => {
  it("配色を書いた表の図の箱は縞を持つ", () => {
    const d = textDslToDiagram(ER("kinari"));
    const 表 = d.nodes.filter((n) => n.kind === "storage");
    // 0 件だと下の照合が「対象なし」 で素通りする
    expect(表.length, "表の箱が 1 つも無い (検査が空振りしている)").toBeGreaterThan(0);
    for (const n of 表) expect(n.rowStripe).toBe(true);
  });

  it("動きを書いた表の図でも縞を持つ", () => {
    // 畳む前は組み立て器 `er()` が縞を敷く経路と箱を直に組む経路の 2 つがあり、同じ図が
    // 動きの有無で縞を持ったり持たなかったりしていた。 経路が 1 本になった後も出口で揃える
    const src = [
      ER("kinari").trimEnd(),
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

  it("配色を書かない図の箱には敷かない (#2782)", () => {
    // 縞の色は配色からしか来ない。 配色が無い図に敷くと箱の面と同じ色に落ちて 1 本も
    // 出ないので、書いたのに出ない欄を残さない
    const d = textDslToDiagram(ER());
    const 表 = d.nodes.filter((n) => n.kind === "storage");
    expect(表.length, "表の箱が 1 つも無い (検査が空振りしている)").toBeGreaterThan(0);
    for (const n of 表) expect(n.rowStripe).toBeUndefined();
  });

  it("行を書かない箱には敷かない (#2782)", () => {
    // 縞は行を横に追うための目印。 行が無い箱に敷いても追う対象が無い
    const src = [
      'title: "確かめ"',
      "type: record",
      "palette: kinari",
      "",
      "actors:",
      '  - 待機: { kind: storage }',
      '  - 完了: { kind: storage, rows: ["出荷を待つ"] }',
      "",
      "flow:",
      '  - 待機 -> 完了: "送る"',
      "",
    ].join("\n");
    const d = textDslToDiagram(src);
    const 札 = Object.fromEntries(d.nodes.map((n) => [n.id, n.rowStripe]));
    expect(札).toEqual({ 待機: undefined, 完了: true });
  });

  it("配色を書いても `topology` の表の箱には敷かない相手が無い", () => {
    // 行を持たない箱なので、図種を問わず敷く対象にならない
    const d = textDslToDiagram(つながり());
    const 表 = d.nodes.filter((n) => n.kind === "storage");
    expect(表.length, "表の箱が 1 つも無い (検査が空振りしている)").toBeGreaterThan(0);
    for (const n of 表) expect(n.rowStripe).toBeUndefined();
  });
});

/*
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
    '  - Admin -> User: "継承" (info) { relation: extends }',
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
  flow: [{ from: "Admin", to: "User", label: "継承", tone: "info", relation: "extends" }],
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
