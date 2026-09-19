/**
 * 表示部品を 2 個以上持つ図が、手本の形になっていることの検証 (#1033)。
 *
 * 手本 (`exemplarPaymentFlow` 等) は「段を進めると状態が動き、表示部品がそれを見て変化する」。
 * 直す前は 25 件すべてが段 1 つで、表示部品は初期値を出したまま動かなかった。
 *
 * **25 件のうち 16 件は構造的に届かない**。 表示部品が見ている状態を **入力欄または計算式** が
 * 握っており、どちらも段の値を上書きするため (`interactive-panel.tsx` が signals / computeds /
 * scrollHandles を `stateOverrides` として返し、`render.tsx` がそれを段の値に重ねる)、
 * 段で動かしても効かない。 これらは #1034 と同じ「段ごとに注目する箱が変わる」 を基準にする。
 */
import { describe, it, expect } from "vitest";
import * as Interactive from "@/topics/catalog/interactive.cdl";
import { 段が動かす見本, 入力欄が握る見本 } from "./catalog-interactive-groups";


const DRIVEN = 段が動かす見本;

const INPUT_DRIVEN = 入力欄が握る見本;

type Diagram = {
  inputs?: Array<{ id?: string }>;
  formulas?: Array<{ id?: string }>;
  scrollTriggers?: Array<{ id?: string }>;
  readouts?: Array<{ id?: string; kind?: string; source?: string; sourceA?: string; sourceB?: string; min?: number; max?: number; xMin?: number; xMax?: number; yMin?: number; yMax?: number; rMin?: number; rMax?: number }>;
  nodes?: Array<{ id?: string; subtitle?: string }>;
  phases?: Array<{
    tweens?: Array<{ stateId?: string }>;
    sets?: Array<{ stateId?: string }>;
    activate?: string[];
    title?: string;
    body?: string;
  }>;
};

const mod = Interactive as unknown as Record<string, Diagram>;
const ALL = [...DRIVEN, ...INPUT_DRIVEN];

/**
 * 表示部品が状態を指す field の値。
 *
 * `source` 1 つとは限らない。 積み上げ棒は `sourceA` / `sourceB`、パンくずと工程表は
 * `currentSource` / `stepsSource` を持つ。 `source` だけを見ると、`source` の指す状態を
 * 段が動かさない図が「動いていない」 と誤判定される (実測 = `docsBreadcrumb` は
 * `path` を固定したまま `cur` を動かす)。
 */
function readoutSources(r: Record<string, unknown>): string[] {
  return Object.entries(r)
    .filter(([f, v]) => /(^source|Source$)/.test(f) && typeof v === "string")
    .map(([, v]) => v as string);
}

/** 段が動かす状態の集合。 */
function drivenStates(d: Diagram): Set<string> {
  const out = new Set<string>();
  for (const p of d.phases ?? []) {
    for (const t of p.tweens ?? []) if (t.stateId) out.add(t.stateId);
    for (const s of p.sets ?? []) if (s.stateId) out.add(s.stateId);
  }
  return out;
}

describe("手本の形 (#1033)", () => {
  it("対象が全件 実在する", () => {
    const missing = ALL.filter((k) => mod[k] === undefined);
    expect(missing, `図が無い: ${missing.join(", ")}`).toHaveLength(0);
  });

  it("対象は表示部品を持つ (持たない図は別の基準で見る)", () => {
    // 表示部品 1 個 + 種別が唯一の図は「部品の見本」 で、別の基準で見る (#1032)。
    // 「0 個でない」 だけだと、1 個まで削る変異が通ってしまう
    const kindCount = new Map<string, number>();
    for (const [k, v] of Object.entries(mod)) {
      if (k.startsWith("subtitle__")) continue;
      for (const r of (v).readouts ?? []) {
        if (r.kind) kindCount.set(r.kind, (kindCount.get(r.kind) ?? 0) + 1);
      }
    }
    // 表示部品を 1 つも持たない図は、そもそもこの基準の対象外 (#1034 で別に見る)
    const none = ALL.filter((k) => (mod[k]?.readouts ?? []).length === 0);
    expect(none, `表示部品を持たない図が混ざっている: ${none.join(", ")}`).toHaveLength(0);
    // 種別の数え上げ自体が動いていることを確かめる (0 件だと以下が素通りする)
    expect(kindCount.size, "表示部品の種別が数えられていない").toBeGreaterThan(50);
  });

  it("段が 3 つ以上ある", () => {
    const few = ALL.filter((k) => (mod[k]?.phases ?? []).length < 3)
      .map((k) => `${k}: ${(mod[k]?.phases ?? []).length}`);
    expect(few, `段が足りない: ${few.join(", ")}`).toHaveLength(0);
  });

  it("表示部品が 1 つ残らず段で動く状態を見ている", () => {
    // 手本の核心。 「どれか 1 つ」 だと、2 つ目以降が止まったままでも通ってしまう
    const bad: string[] = [];
    for (const k of DRIVEN) {
      const d = mod[k]!;
      const driven = drivenStates(d);
      const owned = new Set([
        ...(d.inputs ?? []).map((i) => i.id),
        ...(d.formulas ?? []).map((f) => f.id),
        ...(d.scrollTriggers ?? []).map((t) => t.id),
      ]);
      for (const r of d.readouts ?? []) {
        const srcs = readoutSources(r);
        if (srcs.length === 0) continue;
        // 入力欄 / 計算式が握る表示部品は段では動かせない。 動かせるものだけを対象にする
        if (srcs.every((s) => owned.has(s))) continue;
        if (!srcs.some((s) => driven.has(s))) bad.push(`${k}/${r.id}`);
      }
    }
    expect(bad, `段で動かない表示部品がある: ${bad.join(", ")}`).toHaveLength(0);
  });

  it("表示部品ごとに、段を通して値が実際に変わる", () => {
    // 連動があるだけでは足りない。 `tween(x, 50, 50)` のように動かない指定でも
    // 「見ている」 は成立する。 また図の中の 1 つが動けば通る形だと、
    // 2 つ目以降が止まったままの変異を見逃す (実測で素通りした)
    const bad: string[] = [];
    for (const k of DRIVEN) {
      const d = mod[k]!;
      const owned = new Set([
        ...(d.inputs ?? []).map((i) => i.id),
        ...(d.formulas ?? []).map((f) => f.id),
        ...(d.scrollTriggers ?? []).map((t) => t.id),
      ]);
      for (const r of d.readouts ?? []) {
        const srcs = readoutSources(r as Record<string, unknown>).filter((x) => !owned.has(x));
        if (srcs.length === 0) continue;
        // その表示部品が見るどれか 1 つの状態が、段を通して 2 種類以上の値を取ればよい
        const moves = srcs.some((src) => {
          const seq: string[] = [];
          for (const p of d.phases ?? []) {
            for (const t of p.tweens ?? []) {
              if (t.stateId === src) seq.push(`${(t as { from?: number }).from}->${(t as { to?: number }).to}`);
            }
            for (const st of p.sets ?? []) {
              if (st.stateId === src) seq.push(String((st as { value?: string | number }).value));
            }
          }
          return new Set(seq).size >= 2;
        });
        if (!moves) bad.push(`${k}/${r.id}`);
      }
    }
    expect(bad, `段を通して値が変わらない表示部品: ${bad.join(", ")}`).toHaveLength(0);
  });

  // 「隣り合う段で表示が動くか」 は `catalog-box-binding.test.ts` §「隣り合う段で、表示部品の
  // 描画結果が変わる」 が見る。 生の値だけを比べる形はここに置いていたが、描画側が値を加工
  // する種別 (割合で伸びる帯 / 0 件を出さない札 / 件数上限) で違う値から同じ絵が出るため、
  // engine を通して描画結果で比べる側に一本化した。

  // 説明が語る動きと実装の突き合わせは `catalog-motion.test.ts` が見る。
  // 画面に出る説明は `CatalogItem.subtitle` が SSOT で、`subtitle__X` を持たない図は
  // `diagram.topic` が説明になる。 この module の export だけを見ると後者を見落とす。

  it("段は入力欄も計算式も握る状態を触らない", () => {
    // どちらも実行時に段の値を上書きする。 書いてあると「動くはず」 と誤読される
    const bad: string[] = [];
    for (const k of ALL) {
      const d = mod[k]!;
      const owned = new Set([
        ...(d.inputs ?? []).map((i) => i.id),
        ...(d.formulas ?? []).map((f) => f.id),
        ...(d.scrollTriggers ?? []).map((t) => t.id),
      ]);
      for (const st of drivenStates(d)) if (owned.has(st)) bad.push(`${k}: ${st}`);
    }
    expect(bad, `入力欄 / 計算式の状態を段が触っている: ${bad.join(", ")}`).toHaveLength(0);
  });

  it("段が渡す配列が表示部品の値域に収まる", () => {
    // 値域を外れると表示側で頭打ちになり、違う値が同じ見た目になる
    // (実測 = 上限 50 の棒に 52 / 60 / 72 を渡して 3 段とも満杯だった)
    const bad: string[] = [];
    for (const k of DRIVEN) {
      const d = mod[k]!;
      for (const r of d.readouts ?? []) {
        const lo = r.min;
        const hi = r.max;
        if (typeof lo !== "number" || typeof hi !== "number") continue;
        for (const src of [r.source, r.sourceA, r.sourceB].filter(Boolean) as string[]) {
          for (const p of d.phases ?? []) {
            for (const st of p.sets ?? []) {
              if (st.stateId !== src) continue;
              const raw = String((st as { value?: string | number }).value ?? "");
              if (!raw.startsWith("[")) continue;
              let parsed: unknown;
              try { parsed = JSON.parse(raw); } catch { bad.push(`${k}/${r.id}: 配列として読めない`); continue; }
              if (!Array.isArray(parsed)) continue;
              // 数値だけを取り出す (入れ子の配列にも降りる)
              const nums: number[] = [];
              const walk = (v: unknown): void => {
                if (typeof v === "number") nums.push(v);
                else if (Array.isArray(v)) v.forEach(walk);
              };
              walk(parsed);
              if (r.kind === "waterfall") {
                // 滝は増減を積み上げて描く。 各段の値ではなく **累積** が値域に収まる必要がある
                let acc = 0;
                for (const n of nums) {
                  acc += n;
                  if (acc < lo || acc > hi) bad.push(`${k}/${r.id}: 累積 ${acc} が [${lo}, ${hi}] の外`);
                }
                continue;
              }
              for (const n of nums) {
                if (n < lo || n > hi) bad.push(`${k}/${r.id}: ${n} が [${lo}, ${hi}] の外`);
              }
            }
          }
        }
      }
    }
    expect(bad, `値域を外れている: ${bad.slice(0, 6).join(", ")}`).toHaveLength(0);
  });

  it("3 軸を持つ表示部品は軸ごとの値域に収まる", () => {
    // `min` / `max` だけを見る検査では、円の大きさ (rMax) の超過を拾えない (実測)。
    //
    // 組の何番目が x / y かは **表示部品の種別で違う**。 描画側の実装がそれぞれ別の添字を読む。
    //
    // | 種別 | 読む添字 | 実装 |
    // |---|---|---|
    // | `bubble-chart` | `[x, y, r]` | `interactive-panel.tsx` が `el[0]` / `el[1]` / `el[2]` |
    // | `map-pin` | `[名前, x, y]` | 同 file が `el[1]` / `el[2]` を読み `el[0]` は名前 |
    //
    // 一律に 0/1/2 で見ると、地図では x を y の値域と突き合わせることになる。
    // 描画側はどちらも値域で **切り詰める** ため、外れた点は黙って枠の縁に貼り付く。
    //
    // 表に無い種別は **検査せず fail** させる (fail-closed)。 既定を `[x, y, r]` に倒すと、
    // 別の並びを持つ新種別が誤った添字で黙って検査され、対応表の欠落に気付けない。
    const axisIndex: Record<string, { x: number; y: number; r: number }> = {
      
      "bubble-chart": { x: 0, y: 1, r: 2 },
      "map-pin": { x: 1, y: 2, r: -1 },
    };
    const bad: string[] = [];
    for (const k of DRIVEN) {
      const d = mod[k]!;
      for (const r of d.readouts ?? []) {
        const hasAxisBounds = [r.xMin, r.xMax, r.yMin, r.yMax, r.rMin, r.rMax].some((v) => v !== undefined);
        const ix = axisIndex[r.kind ?? ""];
        if (!ix) {
          if (hasAxisBounds) bad.push(`${k}/${r.id}: 種別 "${r.kind}" が添字表に無い (描画実装を確認して表に足す)`);
          continue;
        }
        const axes: Array<[number, number | undefined, number | undefined]> = (
          [
            [ix.x, r.xMin, r.xMax], [ix.y, r.yMin, r.yMax], [ix.r, r.rMin, r.rMax],
          ] as Array<[number, number | undefined, number | undefined]>
        ).filter((a) => a[0] >= 0);
        if (axes.every(([, lo, hi]) => lo === undefined && hi === undefined)) continue;
        for (const p of d.phases ?? []) {
          for (const st of p.sets ?? []) {
            if (st.stateId !== r.source) continue;
            const raw = String((st as { value?: string | number }).value ?? "");
            let parsed: unknown;
            try { parsed = JSON.parse(raw); } catch { continue; }
            if (!Array.isArray(parsed)) continue;
            for (const tuple of parsed) {
              if (!Array.isArray(tuple)) continue;
              for (const [i, lo, hi] of axes) {
                const v = tuple[i];
                if (typeof v !== "number") continue;
                if (lo !== undefined && v < lo) bad.push(`${k}/${r.id}: 軸${i} の ${v} が下限 ${lo} 未満`);
                if (hi !== undefined && v > hi) bad.push(`${k}/${r.id}: 軸${i} の ${v} が上限 ${hi} 超過`);
              }
            }
          }
        }
      }
    }
    expect(bad, `軸の値域を外れている: ${bad.slice(0, 5).join(", ")}`).toHaveLength(0);
  });

  it("時間軸に渡す値が [[時刻, 名前], ...] の形になっている", () => {
    // 文字列だけの配列を渡すと、表示側は空になる (実測)
    const bad: string[] = [];
    for (const k of DRIVEN) {
      const d = mod[k]!;
      for (const r of d.readouts ?? []) {
        if (r.kind !== "sequence-timeline") continue;
        for (const p of d.phases ?? []) {
          for (const st of p.sets ?? []) {
            if (st.stateId !== r.source) continue;
            const raw = String((st as { value?: string | number }).value ?? "");
            let parsed: unknown;
            try { parsed = JSON.parse(raw); } catch { bad.push(`${k}: 読めない`); continue; }
            if (!Array.isArray(parsed) || parsed.length === 0) { bad.push(`${k}: 空`); continue; }
            for (const e of parsed) {
              const okPair =
                Array.isArray(e) && e.length >= 2 && typeof e[0] === "number" && typeof e[1] === "string";
              const okNum = typeof e === "number";
              if (!okPair && !okNum) bad.push(`${k}: ${JSON.stringify(e)} の形が違う`);
            }
          }
        }
      }
    }
    expect(bad, `時間軸の形が違う: ${bad.slice(0, 4).join(", ")}`).toHaveLength(0);

    // 最終段は図が持つやり取りの数だけ並ぶ。 少ないと「全体が並ぶ」 が成立しない
    const oauth = mod.interactiveOauthFlow!;
    const last = (oauth.phases ?? []).at(-1);
    const raw = String(((last?.sets ?? [])[0] as { value?: string | number })?.value ?? "[]");
    expect(JSON.parse(raw), "最終段のやり取りが 6 件でない").toHaveLength(6);
  });

  it("段が動かす状態を指す箱は、固定値でなく束ねで書く", () => {
    // 配列だけ差し替えて箱の説明を固定値のままにすると、同じ段で図と箱が違う値を出す
    // (実測 = 棒が [15,22,30,38,48] を描く段で、箱は 12 / 34 / 20 / 45 / 28 を出していた)
    const bad: string[] = [];
    for (const k of DRIVEN) {
      const d = mod[k]!;
      const driven = drivenStates(d);
      for (const n of d.nodes ?? []) {
        const sub = n.subtitle ?? "";
        if (sub.includes("{")) continue;
        for (const st of driven) {
          // 状態の名前を書いている / 段が渡す値をそのまま書いている、のどちらも固定値
          if (sub.includes(st)) { bad.push(`${k}/${n.id}: "${sub}"`); break; }
          const written = new Set<string>();
          for (const p of d.phases ?? []) {
            for (const x of p.sets ?? []) {
              if (x.stateId !== st) continue;
              const raw = String((x as { value?: string | number }).value ?? "");
              for (const m of raw.matchAll(/-?\d+(?:\.\d+)?/g)) written.add(m[0]);
            }
          }
          // 段が渡す数を固定で書いていたら、差し替えた時に食い違う
          const nums = [...sub.matchAll(/-?\d+(?:\.\d+)?/g)].map((m) => m[0]);
          if (nums.length >= 1 && nums.every((x) => written.has(x))) {
            bad.push(`${k}/${n.id}: "${sub}"`);
            break;
          }
        }
      }
    }
    expect(bad, `箱が固定値を出している: ${bad.join(", ")}`).toHaveLength(0);
  });

  it("段ごとに注目する箱の組合せが変わる", () => {
    const dup = ALL.filter((k) => {
      const sets = (mod[k]?.phases ?? []).map((p) => [...new Set(p.activate ?? [])].sort().join(","));
      return new Set(sets).size < sets.length;
    });
    expect(dup, `同じ組合せの段がある: ${dup.join(", ")}`).toHaveLength(0);
  });

  it("光らせる箱が実在する", () => {
    const bad: string[] = [];
    for (const k of ALL) {
      const ids = new Set((mod[k]?.nodes ?? []).map((n) => n.id));
      for (const p of mod[k]?.phases ?? []) {
        for (const a of p.activate ?? []) if (!ids.has(a)) bad.push(`${k}: ${a}`);
      }
    }
    expect(bad, `存在しない箱を指している: ${bad.join(", ")}`).toHaveLength(0);
  });

  it("段に題と説明がある", () => {
    const bad: string[] = [];
    for (const k of ALL) {
      for (const [i, p] of (mod[k]?.phases ?? []).entries()) {
        if (!p.title || p.title.length < 3) bad.push(`${k}[${i}]: 題が無い`);
        if (!p.body || p.body.length < 20) bad.push(`${k}[${i}]: 説明が短い`);
      }
    }
    expect(bad, `段の説明が足りない: ${bad.join(", ")}`).toHaveLength(0);
  });
});
