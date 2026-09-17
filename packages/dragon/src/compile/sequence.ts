import { sequence, sequenceStepId } from "@cardenelabs/cdl";
import type { CdlDiagram } from "@cardenelabs/cdl";
import type { DslDocument } from "../types";

import { parseFocusEntry } from "../focus";
import { 箱の題 } from "./node-title";

import { slugify } from "./slug";

export function compileSequence(doc: DslDocument): CdlDiagram {
  // v0.3 ... アニメーション 有無で経路を分岐。
  // 有り = builder 直接経路で state / 複数 phase を注入。
  /*
   * **段があっても組み立て器へ渡す** (#1466)。
   *
   * 順序図は 1 つの箱が図を丸ごと描く形になり、言づては箱の中の行になった。 段ごとに
   * 別経路で箱と縦線を組む形 (`compileSequenceWithAnimate`) では、その骨格が出ない。
   */
  const seqBuilder = sequence({
    id: slugify(doc.title),
    topic: doc.title,
    /*
     * 見出しに出すのは **書いた題** (#1466)。 名前は矢印の端として指すためのもので、
     * `title:` を書いたらそちらを出す (`箱の題`)。 板でも他の図種と同じ規約にする。
     */
    actors: doc.actors.map((a) =>
      a.subtitle ? { name: 箱の題(a), subtitle: a.subtitle } : 箱の題(a),
    ),
    ...(doc.bands && doc.bands.length > 0 ? { bands: doc.bands } : {}),
  });
  for (const s of doc.flow) {
    seqBuilder.step({
      from: s.from,
      to: s.to,
      label: s.label,
      ...(s.sub ? { sub: s.sub } : {}),
      ...(s.side ? { side: s.side } : {}),
      ...(s.tone ? { tone: s.tone } : {}),
      ...(s.style ? { style: s.style } : {}),
      ...(s.msgKind ? { kind: s.msgKind } : {}),
    });
  }
  const built = seqBuilder.build();
  const 段 = doc.animate?.phases ?? [];
  if (段.length === 0) return built;
  /*
   * 書いた段を「今どの言づてか」 に読み替える (#1466)。
   *
   * 記法は段ごとに光らせる矢印を並べる (`focus: [A -> B, ...]`) が、言づては矢印ではなく
   * 箱の中の行になった = 光らせる先が無い。 代わりに **その段までに出た言づての番号** を
   * 状態へ書き、箱がそこまでを描く。 番号の導き方は `段の番号` が持つ。
   */
  const 番号 = 段の番号(doc);
  const 状態名 = sequenceStepId();
  return {
    ...built,
    states: [...built.states, { id: 状態名, initial: "0" }],
    phases: 段.map((p, i) => {
      const 番 = 番号[i]!;
      return {
        id: `p${i}`,
        duration: p.durationMs,
        title: p.name,
        body: p.body ?? "",
        activate: [slugify(doc.title)],
        ...(p.badge ? { badge: p.badge } : {}),
        /*
         * **書いた状態の動きも一緒に運ぶ** (#1466)。 板の段は「今どの言づてか」 を状態に
         * 書くが、記法は同じ段に `遷移:` / `切替:` も書ける。 板の分だけを載せると、
         * 書いた動きが黙って落ちる (実測で `tweens` が 0 件になっていた)。
         */
        sets: [
          ...(p.sets ?? []).map((x) => ({ stateId: x.state, value: x.value })),
          { stateId: 状態名, value: 番 },
        ],
        tweens: (p.tweens ?? []).map((t) => ({ stateId: t.state, from: t.from, to: t.to })),
      };
    }),
  };
}

/** 名前が同じ箱を指すか。 書いた名前のほか、 id の形 (`api-gateway`) で書いた指定も受ける */
function 同じ箱(a: string, b: string): boolean {
  return a === b || slugify(a) === slugify(b);
}

type 言づて = { from: string; to: string };

/**
 * 段の `focus:` を、 言づてが合うかを返す関数にする。 何も書いていない段は `undefined`。
 *
 * | 書いたもの | 合う言づて |
 * |---|---|
 * | 矢印 `A -> B` | 元が A で先が B |
 * | 箱の名前 2 つ以上 | 元と先の両方が書いた箱に含まれる |
 * | 箱の名前 1 つ | 元か先がその箱 |
 *
 * 矢印は 1 本ずつ、 箱の名前はまとめて 1 件として扱い、 どれか 1 つに合えば合うとする。
 *
 * **矢印を 1 本でも書いた段は、 矢印だけで言づてを選ぶ**。 同じ段に並べた箱の名前は縦線を
 * 光らせるための指定で、 言づてを選ぶには広すぎる。 `["利用者側 -> 処理側", 利用者側]` の
 * 箱の名前まで数えると、 利用者側が関わる全ての言づてに合い、 矢印で指した言づてが決まらない
 * (見本 `websocket` / `retryBackoff` で実測)。
 */
function 合い方(
  focus: readonly string[],
  箱の名前: ReadonlySet<string>,
): ((f: 言づて) => boolean) | undefined {
  const 合う: ((f: 言づて) => boolean)[] = [];
  const 名前: string[] = [];
  for (const raw of focus) {
    const e = parseFocusEntry(raw, 箱の名前);
    if (e.kind === "edge") 合う.push((f) => 同じ箱(f.from, e.from) && 同じ箱(f.to, e.to));
    else 名前.push(e.name);
  }
  const 矢印がある = 合う.length > 0;
  if (!矢印がある && 名前.length === 1) {
    const n = 名前[0]!;
    合う.push((f) => 同じ箱(f.from, n) || 同じ箱(f.to, n));
  } else if (!矢印がある && 名前.length >= 2) {
    const 含む = (x: string) => 名前.some((n) => 同じ箱(x, n));
    合う.push((f) => 含む(f.from) && 含む(f.to));
  }
  return 合う.length === 0 ? undefined : (f) => 合う.some((c) => c(f));
}

/**
 * 切り分けの良さ。 前から順に比べ、 大きい方を良いとする。
 *
 * [合う言づてを 1 通以上持つ段の数, 段に合う言づての数, 合った言づてを置いた段の広さの合計に負号を付けたもの]
 */
type 得点 = readonly [number, number, number];

function 上回る(x: 得点, y: 得点): boolean {
  for (let i = 0; i < x.length; i++) if (x[i] !== y[i]) return x[i]! > y[i]!;
  return false;
}

/**
 * 段ごとに、 板が今どの言づてを強調するかを導く (#2133)。
 *
 * 板は番号の言づてを強調し、 それより前を描き済みとして残し、 後ろを隠す。
 *
 * **言づてを先頭から段の数に切り分ける**。 `focus:` を書いた段ごとに続きの言づてを 1 区間ずつ
 * 受け持たせ、 次の順で最も良い切り分けを選ぶ。
 *
 * 1. 合う言づてを 1 通以上持つ段が多い (どの段も板を進める)
 * 2. 段に合う言づての数が多い (段が束ねる言づてを、 束ねた段に置く)
 * 3. 両方の段に合う言づてを、 狭く指した段に置く。 段の広さは、 図の全ての言づてのうち
 *    その段に合う数
 * 4. それでも並んだら、 前の段の区間を短くする
 *
 * 段の番号は、 その区間で `focus:` に合う最後の言づてにする。 箱の名前で書いた段は複数の
 * 言づてを束ね、 見本の段の題は束の最後を指している (`[利用者, 認証窓口, DB]` の段の題は 2 通目の
 * 「照合」)。
 *
 * 前の段から順に「合う最初の言づて」 を取る形では、 次の 3 つを同時に解けない。
 *
 * | 形 | 段の `focus:` | 起きること | 決める順 |
 * |---|---|---|---|
 * | 見本 `cacheReadThrough` (直す前) | `[利用者側, API, 一時置き場, DB]` → `[API, 一時置き場]` | 次の段が 2 通目 (探す) を先に取り、 前の段が 1 通目で止まる | 2 |
 * | 見本 `rateLimit` | `[利用者側, 流量制限, API]` → `[利用者側, 流量制限]` | 5 通目は両方に合う。 前の段が取ると、 次の段の題「超過」 の前の要求が前の段で出る | 3 |
 * | まとめの段 | `[C -> A]` → `[A -> B, B -> C, C -> A]` | 3 通目は両方に合う。 まとめの段が取ると `C -> A` の段が進まない | 3 |
 *
 * **合う言づてが無い段は前の段の番号を保つ**。 見出しだけの段や、 描いた矢印をまとめて並べる
 * 段で板が 0 へ巻き戻らないようにする。
 *
 * 以前は「元 -> 先」 の組から番号を引く表だけを持っていた。 箱の名前は表に無いので全ての段が
 * 0 になり (カタログの見本 30 件のうち 26 件)、 同じ組の言づてが複数あると表が最後の番号で
 * 上書きされて、 最初の段で最後の言づてまで飛んでいた (3 件)。
 */
export function 段の番号(doc: DslDocument): number[] {
  const 段 = doc.animate?.phases ?? [];
  const 箱の名前 = new Set(doc.actors.map((a) => a.name));
  const 合う = 段.map((p) => 合い方(p.highlight ?? [], 箱の名前));
  const 対象 = 合う.flatMap((c, k) => (c ? [k] : []));
  const n = doc.flow.length;
  const m = 対象.length;

  // 累計[t][i] = 対象 t の段に、 先頭から i 通のうち何通が合うか。 累計[t][n] がその段の広さ
  const 累計 = 対象.map((k) => {
    const c = 合う[k]!;
    const a = [0];
    doc.flow.forEach((f, i) => a.push(a[i]! + (c(f) ? 1 : 0)));
    return a;
  });

  // 最良[t][a] = 対象 t 以降の段で a 通目以降を切り分けた時の最良。 切れ目[t][a] = 対象 t の区間の終わり
  const 最良: 得点[][] = Array.from({ length: m + 1 }, () => Array<得点>(n + 1).fill([0, 0, 0]));
  const 切れ目: number[][] = Array.from({ length: m }, () => Array<number>(n + 1).fill(n));
  for (let t = m - 1; t >= 0; t--) {
    const 広さ = 累計[t]![n]!;
    for (let a = 0; a <= n; a++) {
      // 最後の段は残りを全て受け持つ。 短い区間から試し、 上回った時だけ置き換える (並んだら短い方)
      for (let b = t === m - 1 ? n : a; b <= n; b++) {
        const 数 = 累計[t]![b]! - 累計[t]![a]!;
        const 次 = 最良[t + 1]![b]!;
        const s: 得点 = [(数 > 0 ? 1 : 0) + 次[0], 数 + 次[1], -数 * 広さ + 次[2]];
        if (b === (t === m - 1 ? n : a) || 上回る(s, 最良[t]![a]!)) {
          最良[t]![a] = s;
          切れ目[t]![a] = b;
        }
      }
    }
  }

  const 番号 = new Map<number, number>();
  let a = 0;
  for (let t = 0; t < m; t++) {
    const b = 切れ目[t]![a]!;
    const c = 合う[対象[t]!]!;
    for (let j = b - 1; j >= a; j--) {
      if (c(doc.flow[j]!)) {
        番号.set(対象[t]!, j);
        break;
      }
    }
    a = b;
  }

  let 今 = 0;
  return 段.map((_, k) => {
    今 = 番号.get(k) ?? 今;
    return 今;
  });
}
