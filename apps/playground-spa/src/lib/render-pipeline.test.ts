/**
 * 図を描くたびに配置を何回計算するか (#1006)。
 *
 * 組み立て・位置関係の検査・図枠の原点が、 それぞれ内部で配置を計算していた。 同じ入力から
 * 同じ配置を 3 度求めていたため、 辺 500 本の図で 1.46 秒、 1,000 本で 5.42 秒 画面が止まっていた。
 *
 * 「速くなったか」 を時間で測ると計測環境で揺れるので、 **配置を何回計算したか** を数える。
 */
import { describe, it, expect } from "vitest";
import { compile, visualValidateLaid, type CdlDiagram, type LaidDiagram } from "@cardenelabs/cdl";
import { textDslToDiagram } from "@cardenelabs/dragon";
import { buildAndValidate, type BuildDeps } from "./render-pipeline";

/** 辺を n 本持つ図。 規模を変えても回数が変わらないことを見るために使う */
function diagramWithEdges(n: number): CdlDiagram {
  const actors = Array.from({ length: n + 1 }, (_, i) => `  - A${i}`).join("\n");
  const flow = Array.from({ length: n }, (_, i) => `  - A${i} -> A${i + 1}: "e${i}"`).join("\n");
  return textDslToDiagram(`title: "size"\ntype: flow\n\nactors:\n${actors}\n\nflow:\n${flow}\n`);
}

/** 呼ばれた回数を数える差し替え */
function countingDeps(): { deps: BuildDeps; counts: { compile: number; validate: number } } {
  const counts = { compile: 0, validate: 0 };
  const deps: BuildDeps = {
    compile: (d) => {
      counts.compile++;
      return compile(d);
    },
    validateLaid: (laid: LaidDiagram, d: CdlDiagram) => {
      counts.validate++;
      return visualValidateLaid(laid, d);
    },
  };
  return { deps, counts };
}

const SMALL = diagramWithEdges(3);

describe("配置の計算は 1 回だけ (#1006)", () => {
  it("1 回描くのに組み立ては 1 回", () => {
    const { deps, counts } = countingDeps();
    buildAndValidate(SMALL, deps);
    expect(counts.compile).toBe(1);
  });

  it("検査は配置済みを受け取る版を使う", () => {
    // 受け取らない版 (`visualValidate`) は中でもう一度配置を計算する。
    // 呼ばれた回数ではなく「配置済みを渡す版が呼ばれたか」 を見る
    const { deps, counts } = countingDeps();
    buildAndValidate(SMALL, deps);
    expect(counts.validate).toBe(1);
  });

  it("検査に渡る配置は、 組み立てが返したものと同じ", () => {
    // 別に計算し直した配置を渡していると、 ここで参照が食い違う
    let fromCompile: LaidDiagram | null = null;
    let toValidate: LaidDiagram | null = null;
    const deps: BuildDeps = {
      compile: (d) => {
        fromCompile = compile(d);
        return fromCompile;
      },
      validateLaid: (laid, d) => {
        toValidate = laid;
        return visualValidateLaid(laid, d);
      },
    };
    buildAndValidate(SMALL, deps);
    expect(toValidate).toBe(fromCompile);
  });

  it("返す配置も組み立てが出したものと同じ (図枠の原点で使い回す)", () => {
    let fromCompile: LaidDiagram | null = null;
    const deps: BuildDeps = {
      compile: (d) => {
        fromCompile = compile(d);
        return fromCompile;
      },
      validateLaid: visualValidateLaid,
    };
    const built = buildAndValidate(SMALL, deps);
    expect(built.laid).toBe(fromCompile);
  });

  it("図が大きくなっても回数は変わらない", () => {
    const { deps, counts } = countingDeps();
    buildAndValidate(diagramWithEdges(60), deps);
    expect(counts.compile).toBe(1);
    expect(counts.validate).toBe(1);
  });
});

describe("組み立てと検査の失敗の扱いを分ける (#1006)", () => {
  it("組み立てに失敗したら投げる (図を載せる前に捕まえる)", () => {
    const deps: BuildDeps = {
      compile: () => {
        throw new Error("組み立て失敗");
      },
      validateLaid: visualValidateLaid,
    };
    expect(() => buildAndValidate(SMALL, deps)).toThrow("組み立て失敗");
  });

  it("検査だけ失敗したら警告なしで図を返す", () => {
    // 検査の不調で図が出なくなる方が困る
    const deps: BuildDeps = {
      compile,
      validateLaid: () => {
        throw new Error("検査失敗");
      },
    };
    const built = buildAndValidate(SMALL, deps);
    expect(built.warnings).toEqual([]);
    expect(built.laid.viewBox).toBeDefined();
  });
});

describe("図枠の原点が取れる (#1006)", () => {
  it("返した配置から図枠が読める", () => {
    const built = buildAndValidate(SMALL);
    expect(typeof built.laid.viewBox.x).toBe("number");
    expect(typeof built.laid.viewBox.y).toBe("number");
  });

  it("同じ図なら図枠も同じ (使い回しても値が変わらない)", () => {
    const a = buildAndValidate(SMALL);
    const b = buildAndValidate(SMALL);
    expect(a.laid.viewBox).toEqual(b.laid.viewBox);
  });
});
