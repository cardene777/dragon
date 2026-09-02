import { describe, expect, it } from "vitest";

// @ts-expect-error -- 検査対象は .mjs で型宣言を持たない
import { SPEC_ROLES, SPEC_ROWS, buildSpec, describe as 値の文, gaps, mergeMeasured } from "../scripts/design-spec.mjs";

/** 測れた値。 測れなかった項目は実物で `null` が来るので、型でもそれを認める */
type 値 = number | null;
type Item = Partial<{ w: 値; h: 値; rx: 値; sw: 値; r: 値; fs: 値; x: 値 }>;
type Measured = Record<string, { found: number; items: Item[] }>;
type Row = [string, string, string];

const 役割 = (items: Item[]) => ({ found: items.length, items });

/** 役割を引く。 引けなかったことを undefined のまま読み進めると、比較が黙って通る */
function 引く(m: Measured, role: string) {
  const got = m[role];
  expect(got, `${role} が結果に無い`).toBeDefined();
  return got as { found: number; items: Item[] };
}

/**
 * 実際に吸い出した 4 図の作り。
 *
 * 役割の集合を実物から取っている = 手で並べた役割だけを検査すると、engine が使う役割を
 * 1 つ取りこぼしても検査は緑のまま通る。
 */
const 図の作り: Record<string, Measured> = {
  // 関係 (箱 + 繋がりの線)
  "er-demo": {
    "node-body": 役割([
      { w: 400, h: 386, rx: 16, sw: 1.75 },
      { w: 412, h: 442, rx: 16, sw: 2.5 },
    ]),
    "edge-line": 役割([{ sw: 2.25 }, { sw: 2.25 }]),
  },
  // 時系列 (縦線 + 帯 + やり取り)
  "seq-demo": {
    "sequence-thread": 役割([{ x: 396, sw: 3 }, { x: 620, sw: 3 }, { x: 844, sw: 3 }]),
    "sequence-rule": 役割([{ sw: 2 }]),
    "sequence-band": 役割([{ w: 52, rx: 4 }, { w: 52, rx: 4 }]),
    "sequence-line": 役割([{ sw: 2.5 }]),
    "sequence-source": 役割([{ r: 7 }]),
    "sequence-actor": 役割([{ fs: 24 }]),
    "sequence-label": 役割([{ fs: 26 }]),
  },
  // 構成 (箱の一部が角を持たない形)
  "infra-demo": {
    "node-body": 役割([
      { w: 280, h: 172, rx: 18, sw: 1.75 },
      { w: 320, h: 116, rx: null, sw: 2.5 },
    ]),
    "edge-line": 役割([{ sw: 2.25 }]),
  },
  // 図表 (外枠の箱 + 折れ線)
  "chart-line-demo": {
    "node-body": 役割([{ w: 640, h: 368, rx: 16, sw: 2.5 }]),
    "chart-line": 役割([{ sw: 2.5 }]),
    "chart-line-value": 役割([{ fs: 11 }]),
  },
};

const 枠 = { viewBox: [0, 0, 100, 200], phaseCount: 3 };
/**
 * 役割から導いた行だけを数える。
 *
 * 「数で始まる行」 で数えると `図の枠` と `段の数` が混ざり、役割の行が 1 つも出ていなくても
 * 通る (実際に、時系列の行を全て外す変異でこの検査だけが落ちなかった)
 */
const 役割ラベル = new Set((SPEC_ROWS as { label: string }[]).map((r) => r.label));
const 寸法行 = (rows: Row[]) => rows.filter(([k]) => 役割ラベル.has(k));
const ラベル = (rows: Row[]) => rows.map(([k]) => k);

describe("意匠帳に写す表", () => {
  it("図に在る役割の行だけを出す", () => {
    const rows = buildSpec(図の作り["seq-demo"], 枠) as Row[];

    expect(rows.length, "行を 1 つも組めていない (検査が空振りしている)").toBeGreaterThan(0);
    expect(ラベル(rows)).toContain("縦線の間隔");
    expect(ラベル(rows)).toContain("帯の幅");
    // 箱を持たない図に箱の行を出すと、意匠帳に「決めていない値」 が並ぶ
    expect(ラベル(rows)).not.toContain("箱の幅");
    expect(ラベル(rows)).not.toContain("箱の動き");
  });

  it("4 図すべてで寸法の行が 1 件以上出る", () => {
    const 図 = Object.entries(図の作り);
    expect(図.length, "図を 1 件も見ていない (検査が空振りしている)").toBeGreaterThan(0);

    for (const [id, m] of 図) {
      const rows = buildSpec(m, 枠) as Row[];
      expect(寸法行(rows).length, `${id} の寸法が 1 件も出ていない`).toBeGreaterThan(0);
      // `—` は「該当なし」 と「測れなかった」 を潰す。 どの図でも出してはいけない
      expect(rows.filter(([, v]) => v === "—" || v === ""), `${id} に値の無い行が残っている`).toEqual([]);
    }
  });

  it("一部しか測れない時は母数を併記する", () => {
    const rows = buildSpec(図の作り["infra-demo"], 枠) as Row[];
    const 丸み = rows.find(([k]) => k === "角の丸み");

    expect(丸み, "角の丸みの行が出ていない").toBeDefined();
    expect(丸み?.[1]).toBe("18 (2 件中 1 件で測れた)");
  });

  it("1 件も測れなかった時は 0 でも空でもなく「測れなかった」 と出す", () => {
    const rows = buildSpec({ "node-body": 役割([{}, {}]) }, 枠) as Row[];
    const 幅 = rows.find(([k]) => k === "箱の幅");

    expect(幅?.[1]).toBe("測れなかった (2 件)");
  });

  it("対象は在るが値を導けない行は出さない", () => {
    // 縦線が 1 本なら間隔は無い。 0 や「測れなかった」 ではなく行ごと出さない
    const rows = buildSpec({ "sequence-thread": 役割([{ x: 396, sw: 3 }]) }, 枠) as Row[];

    expect(ラベル(rows)).not.toContain("縦線の間隔");
    expect(ラベル(rows)).toContain("縦線の太さ");
  });

  it("図の枠が 4 値で取れなければ、その旨を出す", () => {
    const rows = buildSpec(図の作り["er-demo"], { viewBox: [0, 0], phaseCount: 1 }) as Row[];
    const 枠行 = rows.find(([k]) => k === "図の枠");

    expect(枠行?.[1]).toBe("測れなかった (2 値)");
  });
});

describe("隣どうしの隔たり", () => {
  it("並びから差を出す", () => {
    expect(gaps([844, 396, 620])).toEqual([224, 224]);
  });

  it("測れなかった値を 0 として数えない", () => {
    expect(gaps([396, null, 620])).toEqual([224]);
  });
});

describe("値の文", () => {
  it("同じ値は 1 つにまとめて小さい順に並べる", () => {
    expect(値の文([2.5, 1.75, 2.5])).toBe("1.75 / 2.5");
  });
});

describe("段ごとの測り直し", () => {
  it("役割ごとに最も多く見つかった段を採る", () => {
    const merged = mergeMeasured([
      { measured: { "edge-line": 役割([]) , "node-body": 役割([{ w: 400 }, { w: 400 }, { w: 400 }]) }, vb: [0, 0, 10, 10] },
      { measured: { "edge-line": 役割([{ sw: 2.25 }, { sw: 2.25 }]), "node-body": 役割([{ w: 400 }]) }, vb: [0, 0, 20, 20] },
    ]) as { measured: Measured; vb: number[] };

    // 段が進むと線が増える。 最初の段だけ見ると 1 本も測れない
    expect(引く(merged.measured, "edge-line").found).toBe(2);
    // 足し上げると同じ箱を段の数だけ重複して数える
    expect(引く(merged.measured, "node-body").found).toBe(3);
  });

  it("図の枠は最後の段のものを採る", () => {
    const merged = mergeMeasured([
      { measured: {}, vb: [0, 0, 10, 10] },
      { measured: {}, vb: [0, 0, 20, 20] },
    ]) as { vb: number[] };

    expect(merged.vb).toEqual([0, 0, 20, 20]);
  });
});

describe("役割の一覧", () => {
  it("表に出す役割を重複なく渡す", () => {
    expect(SPEC_ROWS.length, "行の定義が空 (検査が空振りしている)").toBeGreaterThan(0);
    expect(SPEC_ROLES.length, "測る役割が空 (検査が空振りしている)").toBeGreaterThan(0);
    expect(SPEC_ROLES.length).toBe(new Set(SPEC_ROLES).size);
  });

  it("4 図が使う役割を 1 つも取りこぼさない", () => {
    const 使う役割 = new Set(Object.values(図の作り).flatMap((m) => Object.keys(m)));

    expect(使う役割.size, "役割を 1 つも集めていない (検査が空振りしている)").toBeGreaterThan(0);
    for (const role of 使う役割) {
      expect(SPEC_ROLES, `${role} を測る行が無い`).toContain(role);
    }
  });
});
