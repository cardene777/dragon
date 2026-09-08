import { describe, it, expect } from "vitest";
import type { CdlDiagram } from "@cardenelabs/cdl";
import {
  図ごとの既定の描き方,
  描き方の切替を出すか,
  図の描き方を変える,
  記法の描き方を変える,
  描き方を選べる,
  既定の描き方,
} from "./redraw-mode";
import { 図の速さを変える, 記法の速さを変える, 速さの選択肢 } from "./playback-speed";
import { CATALOG_ITEMS } from "./catalog-items";

/**
 * 2 段目以降の描き方の切替 (#1359)。
 *
 * 1 段目の `draw` を 2 段目以降へ写すことで「引き直す」 になる。 図とコードタブの両方に
 * 同じ変換を掛けるので、見ている図と写せるコードが常に一致する。
 */

const 見本 = (): { id: string; diagram: CdlDiagram; yaml?: string; json?: string }[] => {
  const out: { id: string; diagram: CdlDiagram; yaml?: string; json?: string }[] = [];
  for (const items of Object.values(CATALOG_ITEMS)) {
    for (const item of items) {
      out.push({
        id: item.id,
        diagram: item.diagram,
        ...(item.sourceYaml === undefined ? {} : { yaml: item.sourceYaml }),
        ...(item.sourceJson === undefined ? {} : { json: item.sourceJson }),
      });
    }
  }
  return out;
};

/** 段ごとの `draw` の有無を並べる */
const 描く段 = (d: CdlDiagram): boolean[] => d.phases.map((p) => (p.draw ?? []).length > 0);

/** YAML の段ごとの `draw` の語を並べる (無い段は空文字) */
const yamlの描く語 = (src: string): string[] => {
  const 位置 = [...src.matchAll(/^[ \t]*-[ \t]*step:[ \t]*"[^"]*"[ \t]+\d+(?:\.\d+)?s[ \t]*$/gm)].map(
    (m) => m.index ?? 0,
  );
  return 位置.map((始, i) => {
    const 本体 = src.slice(始, i + 1 < 位置.length ? 位置[i + 1] : src.length);
    return /^[ \t]*draw:[ \t]*(\S+)[ \t]*$/m.exec(本体)?.[1] ?? "";
  });
};

/** JSON の段ごとの `draw` の語を並べる (無い段は空文字) */
const jsonの描く語 = (src: string): string[] => {
  const 見出し = [...src.matchAll(/"step"\s*:\s*"[^"]*"\s*,/g)];
  const 位置 = 見出し.map((m) => m.index ?? 0);
  return 位置.map((始, i) => {
    const 本体 = src.slice(始, i + 1 < 位置.length ? 位置[i + 1] : src.length);
    return /"draw"\s*:\s*"([^"]+)"/.exec(本体)?.[1] ?? "";
  });
};

const 折れ線 = () => {
  const x = 見本().find((y) => y.id === "chart-line-demo");
  expect(x, "折れ線の見本 (chart-line-demo) が見つからない").toBeDefined();
  return x!;
};

describe("切替えられる図の判定 (#1359)", () => {
  it("1 段目が起点から描く図では選べる", () => {
    expect(描き方を選べる(折れ線().diagram)).toBe(true);
  });

  it("起点から描けない図では選べない", () => {
    const 描けない = 見本().filter((x) => (x.diagram.phases[0]?.draw ?? []).length === 0);
    expect(描けない.length, "描けない見本が 1 件も無い (検査が空振りしている)").toBeGreaterThan(0);
    for (const x of 描けない) {
      expect(描き方を選べる(x.diagram), `${x.id} で選べる判定になっている`).toBe(false);
    }
  });

  it("段が 1 つしかない図では選べない (写す先が無い)", () => {
    const d = 折れ線().diagram;
    const 一段目 = d.phases[0];
    expect(一段目, "折れ線の見本に段が 1 つも無い").toBeDefined();
    if (一段目 === undefined) return;
    expect(描き方を選べる({ ...d, phases: [一段目] })).toBe(false);
  });
});

describe("図の 2 段目以降に描く指定が写る (#1359)", () => {
  it("描き直すと 2 段目以降にも付く", () => {
    const 元 = 折れ線().diagram;
    expect(描く段(元), "元は 1 段目だけが描く").toEqual([true, false]);
    expect(描く段(図の描き方を変える(元, "描き直す"))).toEqual([true, true]);
  });

  it("写した相手は 1 段目と同じ箱", () => {
    const 元 = 折れ線().diagram;
    const 後 = 図の描き方を変える(元, "描き直す");
    const 一段目 = 元.phases[0];
    expect(一段目, "元の見本に段が 1 つも無い").toBeDefined();
    if (一段目 === undefined) return;
    for (const p of 後.phases) expect(p.draw).toEqual(一段目.draw);
  });

  it("既定では元の object をそのまま返す", () => {
    const 元 = 折れ線().diagram;
    expect(図の描き方を変える(元, 既定の描き方)).toBe(元);
  });

  it("起点から描けない図は描き直しても変わらない", () => {
    const 描けない = 見本().find((x) => (x.diagram.phases[0]?.draw ?? []).length === 0);
    expect(描けない, "描けない見本が見つからない").toBeDefined();
    expect(図の描き方を変える(描けない!.diagram, "描き直す")).toBe(描けない!.diagram);
  });
});

/** その種別の節を持つ見本を集める */
const 種別で集める = (kind: string): { id: string; diagram: CdlDiagram }[] =>
  見本().filter((x) => x.diagram.nodes.some((n) => n.kind === kind));

describe("図ごとの描き方の初期値 (#1690)", () => {
  it("弧の見本を 1 件以上走査できている", () => {
    // 空振り検知。 0 件だと下の 2 件は何も見ずに通る
    expect(種別で集める("chart-radial").length, "弧の見本が 1 件も無い").toBeGreaterThan(0);
  });

  it("弧の見本は描き直すから始まる", () => {
    let 測れた = 0;
    for (const x of 種別で集める("chart-radial")) {
      expect(図ごとの既定の描き方(x.diagram), `${x.id} が描き直すにならない`).toBe("描き直す");
      測れた += 1;
    }
    expect(測れた, "1 件も測れていない (検査が空振りしている)").toBeGreaterThan(0);
  });

  it("棒と折れ線は動かすだけから始まる", () => {
    // 弧だけを見ているかの確認。 種別を見ずに図表全部を拾っていれば、ここで落ちる
    const 対象 = [...種別で集める("chart-bar"), ...種別で集める("chart-line")];
    expect(対象.length, "棒と折れ線の見本が 1 件も無い").toBeGreaterThan(0);
    for (const x of 対象)
      expect(図ごとの既定の描き方(x.diagram), `${x.id} が動かすだけにならない`).toBe("動かすだけ");
  });

  it("段が 1 つしかない弧は動かすだけのまま", () => {
    // 切替が出ない図。 押しても効かない値を図ごとに変えると、画面に出ない状態が増える
    const 元 = 種別で集める("chart-radial")[0];
    expect(元, "弧の見本が見つからない").toBeDefined();
    if (元 === undefined) return;
    const 一段だけ: CdlDiagram = { ...元.diagram, phases: 元.diagram.phases.slice(0, 1) };
    expect(描き方を選べる(一段だけ), "段を削っても切替が出せてしまう").toBe(false);
    expect(図ごとの既定の描き方(一段だけ)).toBe("動かすだけ");
  });

  it("弧を持たない見本は 1 件も描き直すにならない", () => {
    // 陰性対照。 判定が種別を見ずに何でも拾っていれば、ここで落ちる
    const 弧でない = 見本().filter((x) => !x.diagram.nodes.some((n) => n.kind === "chart-radial"));
    expect(弧でない.length, "弧を持たない見本が 1 件も無い").toBeGreaterThan(0);
    for (const x of 弧でない)
      expect(図ごとの既定の描き方(x.diagram), `${x.id} が描き直すになった`).toBe("動かすだけ");
  });
});

describe("描き方の切替を画面に出すか (#1692)", () => {
  it("弧の見本では切替を出さない", () => {
    let 測れた = 0;
    for (const x of 種別で集める("chart-radial")) {
      expect(描き方の切替を出すか(x.diagram), `${x.id} で切替が出てしまう`).toBe(false);
      測れた += 1;
    }
    expect(測れた, "1 件も測れていない (検査が空振りしている)").toBeGreaterThan(0);
  });

  it("弧でも描き直すは写り続ける", () => {
    // 切替を消すために `描き方を選べる` を false へ倒すと、初期値ごと効かなくなる
    const 弧 = 種別で集める("chart-radial")[0];
    expect(弧, "弧の見本が見つからない").toBeDefined();
    if (弧 === undefined) return;
    expect(描き方を選べる(弧.diagram), "写せる判定まで false になっている").toBe(true);
    expect(描く段(図の描き方を変える(弧.diagram, "描き直す")).every(Boolean)).toBe(true);
  });

  it("棒と折れ線では切替を出す", () => {
    const 対象 = [...種別で集める("chart-bar"), ...種別で集める("chart-line")];
    expect(対象.length, "棒と折れ線の見本が 1 件も無い").toBeGreaterThan(0);
    for (const x of 対象)
      expect(描き方の切替を出すか(x.diagram), `${x.id} で切替が消えている`).toBe(true);
  });

  it("起点から描けない図では弧でなくても出さない", () => {
    const 描けない = 見本().find((x) => (x.diagram.phases[0]?.draw ?? []).length === 0);
    expect(描けない, "描けない見本が見つからない").toBeDefined();
    expect(描き方の切替を出すか(描けない!.diagram)).toBe(false);
  });

  it("弧を持たない見本では従来の判定と 1 件残らず一致する", () => {
    // 陰性対照。 判定が種別を見ずに何でも閉じていれば、ここで落ちる
    const 弧でない = 見本().filter((x) => !x.diagram.nodes.some((n) => n.kind === "chart-radial"));
    expect(弧でない.length, "弧を持たない見本が 1 件も無い").toBeGreaterThan(0);
    for (const x of 弧でない)
      expect(描き方の切替を出すか(x.diagram), `${x.id} で判定がずれた`).toBe(描き方を選べる(x.diagram));
  });
});

describe("記法の 2 段目以降に描く指定が写る (#1359)", () => {
  it("YAML の 2 段目にも語が入り、1 段目と同じ語になる", () => {
    const x = 折れ線();
    const 元 = yamlの描く語(x.yaml!);
    expect(元.length, "段を 1 つも読めていない (検査が空振りしている)").toBeGreaterThan(1);
    expect(元[1], "元は 2 段目に語が無い").toBe("");

    const 後 = yamlの描く語(記法の描き方を変える(x.yaml!, "描き直す", "yaml"));
    expect(後.length, "段の数が変わっている").toBe(元.length);
    expect(後.every((w) => w === 元[0])).toBe(true);
  });

  it("JSON の 2 段目にも語が入り、1 段目と同じ語になる", () => {
    const x = 折れ線();
    const 元 = jsonの描く語(x.json!);
    expect(元.length, "段を 1 つも読めていない (検査が空振りしている)").toBeGreaterThan(1);
    expect(元[1], "元は 2 段目に語が無い").toBe("");

    const 後 = jsonの描く語(記法の描き方を変える(x.json!, "描き直す", "json"));
    expect(後.length, "段の数が変わっている").toBe(元.length);
    expect(後.every((w) => w === 元[0])).toBe(true);
  });

  it("直した JSON が読める形のまま", () => {
    // 文字を差し込む形なので、壊れると読めなくなる
    const 直した = 記法の描き方を変える(折れ線().json!, "描き直す", "json");
    expect(() => JSON.parse(直した)).not.toThrow();
  });

  it("既定では元の文字列をそのまま返す", () => {
    const x = 折れ線();
    expect(記法の描き方を変える(x.yaml!, 既定の描き方, "yaml")).toBe(x.yaml);
    expect(記法の描き方を変える(x.json!, 既定の描き方, "json")).toBe(x.json);
  });

  const 秒を読む = (s: string): string[] =>
    // 必須の群。 取れない形は regex と噛み合っていないので捨てる
    [...s.matchAll(/^[ \t]*-[ \t]*step:[ \t]*"[^"]*"[ \t]+(\d+(?:\.\d+)?)s[ \t]*$/gm)].flatMap(
      (m) => (m[1] === undefined ? [] : [m[1]]),
    );

  it("本文は変わらない", () => {
    const x = 折れ線();
    const 後 = 記法の描き方を変える(x.yaml!, "描き直す", "yaml");
    expect(後.split("body:").length, "本文の数が変わっている").toBe(x.yaml!.split("body:").length);
  });

  it("段の秒数が 1 段目に揃う (#1444)", () => {
    // #1440 まで秒数は変わらない契約だった。 揃える処理を見本側から写す側へ移したので、
    // 記法の表示でも切替が入の時だけ揃う (`preset-draw-duration.test.ts` が全見本で見る)
    const x = 折れ線();
    const 前 = 秒を読む(x.yaml!);
    expect(前.length, "段が 2 つ以上ある").toBeGreaterThan(1);
    expect(new Set(前).size, "元から揃っていると揃えた効果が見えない").toBeGreaterThan(1);

    const 後 = 秒を読む(記法の描き方を変える(x.yaml!, "描き直す", "yaml"));
    expect(後.length, "段の数が変わっている").toBe(前.length);
    expect(new Set(後).size, `揃っていない: ${JSON.stringify(後)}`).toBe(1);
    expect(後[0], "1 段目の秒数と違う値に揃っている").toBe(前[0]);
  });
});

describe("描き方と速さを同時に掛けても図とコードが一致する (#1359)", () => {
  it.each(速さの選択肢)("%s 倍速 + 描き直しで、段の数と描く段が揃う", (速さ) => {
    let 見た = 0;
    for (const x of 見本()) {
      if (x.yaml === undefined || !描き方を選べる(x.diagram)) continue;
      見た += 1;

      const 図 = 図の速さを変える(図の描き方を変える(x.diagram, "描き直す"), 速さ);
      const 記法 = 記法の速さを変える(
        記法の描き方を変える(x.yaml, "描き直す", "yaml"),
        速さ,
        "yaml",
      );
      const 語 = yamlの描く語(記法);
      if (語.length !== 図.phases.length) continue;

      // 段ごとに「描くか」 が一致する
      expect(語.map((w) => w !== ""), `${x.id} で描く段がずれている`).toEqual(描く段(図));
      // 秒数と段の長さも一致したまま
      const 秒 = [...記法.matchAll(/^[ \t]*-[ \t]*step:[ \t]*"[^"]*"[ \t]+(\d+(?:\.\d+)?)s[ \t]*$/gm)].map(
        (m) => Number(m[1]),
      );
      expect(
        秒.map((v) => Math.round(v * 1000)),
        `${x.id} で秒数と段の長さがずれている`,
      ).toEqual(図.phases.map((p) => p.duration));
    }
    expect(見た, "切替えられる見本を 1 件も見ていない (検査が空振りしている)").toBeGreaterThan(0);
  });
});
