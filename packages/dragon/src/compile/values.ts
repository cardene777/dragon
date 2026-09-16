import { applyDerivedValues } from "@cardenelabs/cdl";
import type { CdlDiagram } from "@cardenelabs/cdl";
import type { DslActor, DslDocument, DslStep, DslValue } from "../types";
import type { CompileNotice } from "./notice";
/**
 * 値と式の扱い (#2036 で `compile.ts` から移した)。
 *
 * 書いた値を図に載せ、段ごとに値が動く区間を組み、解けなかった値を書いた人に伝える。
 *
 * 外へ出す口は 3 つ。 入口が呼ぶ `foldValueTriggers` と `attachDerivedValues`、
 * 矢印の内訳を読む側が呼ぶ `鎖のどの行から来たか`。
 */

/**
 * 鎖の N 本目の矢印が、本文のどの行から来たかを返す (#1267)。
 *
 * `compileFlow` は登場人物を書いた順に繋ぎ、説明文は **その箱を to に持つ行** から拾う。
 * 書いた側の端 (from) は使わない。 そのため `A -> C` と書いても矢印は `A -> B` になり、
 * (from, to) の一致では対応が取れない (実測 = 説明文だけが載り、指定が黙って落ちていた)。
 *
 * 説明文を決めた規則と同じ規則で指定も決める = 説明文と指定が必ず同じ行から来る。
 */
export function 鎖のどの行から来たか(
  doc: DslDocument,
  並び: readonly DslActor[],
  edgeIndex: number,
): DslStep | undefined {
  const to = 並び[edgeIndex + 1];
  if (to === undefined) return undefined;
  return doc.flow.find((s) => s.to === to.name);
}

/** 数を式に埋める。 指数表記 (`1e-7`) は engine の式が読めないため十進で書く */
function 式に書く数(n: number): string {
  if (!Number.isFinite(n)) return "0";
  const text = String(n);
  if (!/[eE]/.test(text)) return text;

  // Number の有効桁を丸めず、指数表記だけを通常の十進表記へ展開する。 `toFixed(6)` では
  // 1e-7 が 0 になり、正しく読める `to` の値が動かなくなる。
  const [coefficient = "0", exponentText = "0"] = text.toLowerCase().split("e");
  const negative = coefficient.startsWith("-");
  const unsigned = negative ? coefficient.slice(1) : coefficient;
  const [whole = "0", fraction = ""] = unsigned.split(".");
  const digits = `${whole}${fraction}`;
  const decimalAt = whole.length + Number(exponentText);
  let expanded: string;
  if (decimalAt <= 0) expanded = `0.${"0".repeat(-decimalAt)}${digits}`;
  else if (decimalAt >= digits.length)
    expanded = `${digits}${"0".repeat(decimalAt - digits.length)}`;
  else expanded = `${digits.slice(0, decimalAt)}.${digits.slice(decimalAt)}`;
  return negative ? `-${expanded}` : expanded;
}

/** 段の中で 1 本の値が動く区間。 `from` から `to` へ `[start, end]` の間で線形に動く */
type 動く区間 = { 段: number; start: number; end: number; dur: number; from: number; to: number };

/**
 * 相手の値が境目を通る時刻を求める。
 *
 * 相手は段の中で線形に動くので、 境目を通る時刻は逆算できる。 始めから成り立っているなら
 * 相手が動き始めた時刻、 終わりまで成り立たないなら「通らない」 とする。
 *
 * `>` と `!=` の厳密な瞬間は境目の直後だが、 1 frame 未満の差なので境目そのものを返す。
 */
function 境目を通る時刻(区間: 動く区間, op: string, 境目: number): number | null {
  const 満たす = (x: number): boolean => {
    switch (op) {
      case ">=":
        return x >= 境目;
      case ">":
        return x > 境目;
      case "<=":
        return x <= 境目;
      case "<":
        return x < 境目;
      case "==":
        return x === 境目;
      case "!=":
        return x !== 境目;
      default:
        return false;
    }
  };
  if (満たす(区間.from)) return 区間.start;
  // `==` は終点が一致しなくても、線形補間の途中で境目を通る。 終点だけを見ると
  // 0 → 100 に対する `== 50` を「満たさない」と誤判定する。
  if (op === "==") {
    const min = Math.min(区間.from, 区間.to);
    const max = Math.max(区間.from, 区間.to);
    if (境目 < min || 境目 > max) return null;
  } else if (!満たす(区間.to)) {
    return null;
  }
  if (区間.to === 区間.from) return null;
  const t = 区間.start + (区間.dur * (境目 - 区間.from)) / (区間.to - 区間.from);
  if (!Number.isFinite(t)) return null;
  return Math.min(Math.max(t, 区間.start), 区間.end);
}

/**
 * きっかけ形の値 (`trigger` / `to` / `dur`) を、段の時計を読む式へ畳む (#1161 段 2)。
 *
 * ## なぜ式へ畳むのか
 *
 * 描画側の動きの模型は段と、 段の中の線形補間しか持たない。 条件で動き出す仕組みも、 値ごとの
 * 長さも無い (実測)。 そのままでは `trigger` も `dur` も渡せない。
 *
 * 一方で描画側は `derived` の式を **毎 frame** 解く。 そこで段に時計を 1 本引き
 * (`0` から段の長さまでの補間)、 各値を「時計を読む傾斜」 として書けば、 段を割らずに
 * 値ごとの長さを守れる。
 *
 * ```
 * 値 = from + (to - from) * min(max((時計 - 開始) / 長さ, 0), 1)
 * ```
 *
 * `min` / `max` で挟むのは、 開始前は `from` のまま、 終了後は `to` のまま止めるため。
 *
 * ## 段を割らない
 *
 * 段は見出し / 本文 / 印を持つ表示物なので、 割ると段送りの見え方と件数が変わる。 時計を使えば
 * 段は 1 つのまま値だけが順に動く。 収まらない形 (開始 + 長さ > 段の長さ) は畳まずに知らせる。
 *
 * ## 連鎖の解き方
 *
 * `trigger: <相手> >= <境目>` は、 相手も段の中で線形に動くため境目を通る時刻を逆算できる。
 * 相手が動く値でない (式だけ、 または初期値のまま) 場合は時刻が決まらないので畳まない。
 *
 * 返すのは名前から式への表で、 `attachDerivedValues` がこれを `derived` に載せる。 畳めなかった
 * 値は表に入らないため図に載らない = 半端に止まった値を黙って置かない。
 */
export function foldValueTriggers(
  diagram: CdlDiagram,
  doc: DslDocument,
  onNotice?: (n: CompileNotice) => void,
): Map<string, string> {
  const 出力 = new Map<string, string>();
  const きっかけ付き = (doc.values ?? []).filter((v) => v.trigger !== undefined);
  if (きっかけ付き.length === 0) return 出力;

  // 同じ名前を 2 度書いた時は先に書いた方を使う (`values` の既存の扱いと揃える)
  const 宣言 = new Map<string, DslValue>();
  for (const v of きっかけ付き) if (!宣言.has(v.name)) 宣言.set(v.name, v);

  const 初期値 = new Map<string, number>();
  for (const s of diagram.states) {
    const n = Number(s.initial);
    if (Number.isFinite(n)) 初期値.set(s.id, n);
  }

  // 段は書いた名前でも slug でも指せる。 `focus:` が名前で指せるのと揃える
  const 段の番号 = new Map<string, number>();
  diagram.phases.forEach((p, i) => {
    if (!段の番号.has(p.title)) 段の番号.set(p.title, i);
    if (!段の番号.has(p.id)) 段の番号.set(p.id, i);
  });

  const 解けた = new Map<string, 動く区間>();
  const 解けない = new Set<string>();
  const 解決中 = new Set<string>();

  const 知らせる = (v: DslValue, message: string, hint: string): void => {
    onNotice?.({
      kind: "value-trigger-unresolved",
      actor: v.name,
      line: v.pos?.line ?? 0,
      message,
      hint,
    });
  };

  const 解く = (name: string): 動く区間 | null => {
    const 既出 = 解けた.get(name);
    if (既出) return 既出;
    if (解けない.has(name)) return null;
    const v = 宣言.get(name);
    if (!v || !v.trigger) return null;
    if (解決中.has(name)) {
      解けない.add(name);
      知らせる(
        v,
        `"${name}" のきっかけが一周しています`,
        "どれか 1 つを `trigger: step ...` に変える",
      );
      return null;
    }
    解決中.add(name);
    const 区間 = 組み立てる(v);
    解決中.delete(name);
    if (!区間) {
      解けない.add(name);
      return null;
    }
    解けた.set(name, 区間);
    return 区間;
  };

  const 組み立てる = (v: DslValue): 動く区間 | null => {
    const trigger = v.trigger!;
    const from = 初期値.get(v.name) ?? 0;
    const to = v.to ?? 0;
    const dur = v.durationMs ?? 0;
    let 段 = 0;
    let start = 0;
    if (trigger.kind === "step") {
      const idx = 段の番号.get(trigger.step);
      if (idx === undefined) {
        知らせる(
          v,
          `"${trigger.step}" という段がありません`,
          "`animation:` にその名前の段を書くか、 段の名前に合わせる",
        );
        return null;
      }
      段 = idx;
      start = 0;
    } else {
      const 相手 = 解く(trigger.source);
      if (!相手) {
        知らせる(
          v,
          `"${trigger.source}" が動く値でないため、 きっかけの時刻を決められません`,
          "見張る相手も `trigger:` を持つ値にする",
        );
        return null;
      }
      const at = 境目を通る時刻(相手, trigger.op, trigger.threshold);
      if (at === null) {
        知らせる(
          v,
          `"${trigger.source}" は ${trigger.op} ${trigger.threshold} を満たしません`,
          "相手が通る値を境目にするか、 相手の `to` を見直す",
        );
        return null;
      }
      段 = 相手.段;
      start = at;
    }
    const 段の長さ = diagram.phases[段]?.duration ?? 0;
    if (start + dur > 段の長さ) {
      知らせる(
        v,
        `段 "${diagram.phases[段]?.title ?? ""}" (${段の長さ}ms) に収まりません (${Math.round(start + dur)}ms 必要)`,
        "段を長くするか `dur` を短くする",
      );
      return null;
    }
    return { 段, start, end: start + dur, dur, from, to };
  };

  for (const v of 宣言.values()) 解く(v.name);
  if (解けた.size === 0) return 出力;

  // 時計は段ごとに 1 本。 名前が既にある時は末尾に数を足してずらす = 書いた値を上書きしない
  const 使用中 = new Set(diagram.states.map((s) => s.id));
  for (const v of doc.values ?? []) 使用中.add(v.name);
  const 段ごとの時計 = new Map<number, string>();
  const 時計を用意する = (段: number): string => {
    const 既出 = 段ごとの時計.get(段);
    if (既出) return 既出;
    let 名前 = `__step_clock_${段}`;
    let 連番 = 2;
    while (使用中.has(名前)) 名前 = `__step_clock_${段}_${連番++}`;
    使用中.add(名前);
    段ごとの時計.set(段, 名前);
    diagram.states.push({ id: 名前, initial: 0 });
    const 段の中身 = diagram.phases[段];
    if (段の中身)
      段の中身.tweens = [...段の中身.tweens, { stateId: 名前, from: 0, to: 段の中身.duration }];
    return 名前;
  };

  for (const [name, 区間] of 解けた) {
    const 時計 = 時計を用意する(区間.段);
    const 進み = `min(max(({${時計}} - ${式に書く数(区間.start)}) / ${式に書く数(区間.dur)}, 0), 1)`;
    出力.set(name, `((${進み} * ${式に書く数(区間.to - 区間.from)}) + ${式に書く数(区間.from)})`);
  }
  return 出力;
}

export function attachDerivedValues(
  diagram: CdlDiagram,
  doc: DslDocument,
  onNotice?: (n: CompileNotice) => void,
  inheritedSourceLines?: ReadonlyMap<string, readonly number[]>,
  foldedTriggers?: ReadonlyMap<string, string>,
): void {
  const values = doc.values ?? [];
  // 本文に値を書いていなくても、重ねた見本が値を持つことがある (#1180)。 その場合も
  // 解けなかった分は伝える = 見本の中で止まった値も、画面には `{名前}` の生の形で出る
  if (values.length === 0) {
    if ((diagram.derived?.length ?? 0) > 0) {
      reportUnresolvedValues(diagram, doc, onNotice, inheritedSourceLines);
    }
    return;
  }

  // 名前が重なったかは **図に載った状態** で見る。 書いた `states:` だけを見ると、見本から
  // 引き継いだ状態 (`alias__id`) との重なりを見落とす
  const 状態の名前 = new Set(diagram.states.map((s) => s.id));
  for (const v of values) {
    if (!状態の名前.has(v.name)) continue;
    // きっかけ形は `states:` の値を **動き始めの値として使う**。 両方書くのが正しい形なので
    // 重なりとして知らせない (#1161)。 知らせると、 仕様どおりに書いた図が毎回警告を出す
    if (v.trigger !== undefined) continue;
    onNotice?.({
      kind: "value-shadows-state",
      actor: v.name,
      line: v.pos?.line ?? 0,
      message: `"${v.name}" を states と values の両方に書いています。 values を使います`,
      hint: "states から外すか、 values の名前を変える",
    });
  }

  // **見本から引き継いだ分に足す** (#1180)。 代入で書くと、重ねた見本が持つ値が消える。
  //
  // 本文に書いた分を先に置く = engine は同じ名前では先に書いた式を使うため、名前が重なった
  // 時に本文が勝つ。 重なったことは engine の知らせ (`duplicate-id`) がそのまま伝える
  // きっかけ形は `foldValueTriggers` が畳んだ式を使う。 畳めなかった値はここに現れないため
  // 図に載らない = 半端に止まった値を黙って置かない (知らせは畳む時点で出している)
  const 載せる: Array<{ id: string; expression: string }> = [];
  for (const v of values) {
    const expression = v.expression ?? foldedTriggers?.get(v.name);
    if (expression === undefined) continue;
    載せる.push({ id: v.name, expression });
  }
  diagram.derived = [...載せる, ...(diagram.derived ?? [])];
  reportUnresolvedValues(diagram, doc, onNotice, inheritedSourceLines);
}

/**
 * 解けなかった値を書いた人に伝える (#1162)。
 *
 * 描画側は解けない値を黙って飛ばす (`computeStateValues` が engine の知らせを捨てている)。
 * 書き間違えても図は描かれ、箱に `{waiting}` の生の形が出るだけになる。 綴りを疑う以外に
 * 手掛かりが無いので、組み立ての時点で分かる分をここで伝える。
 *
 * **判定は engine にさせる**。 解く順序と、止める条件 (輪 / 無い名前 / 読めない式 / 数として
 * 読めない値) は engine が持つ。 同じ判定を書き直すと、描画は動くのに知らせだけ出る
 * (またはその逆) 状態を作る。
 *
 * 見るのは初期値 1 組だけ。 輪 / 無い名前 / 読めない式 / 二重宣言は値に依らないのでこれで
 * 全て取れる。 段の途中でだけ起きる形 (割る数が段の途中で 0 になる等) は取れない =
 * 毎 frame の知らせは engine 側が返し口を持たないため、ここでは扱わない。
 */
function reportUnresolvedValues(
  diagram: CdlDiagram,
  doc: DslDocument,
  onNotice?: (n: CompileNotice) => void,
  inheritedSourceLines?: ReadonlyMap<string, readonly number[]>,
): void {
  if (!onNotice) return;
  // 描画側 (`computeStateValues`) が段を進める前に組み立てるのと同じ形。 値を解く手順は
  // engine に渡すので、ここで組み立てるのは初期値の表だけにする
  //
  // **継承を持たない入れ物で作る**。 engine 側 (`computeStateValues` /
  // `applyDerivedValues`) が同じ形で組むため、ここを通常の object にすると
  // `__proto__` のような名前で **組み立てだけが「値が無い」 と知らせる** 状態ができる
  // (実測 = 描画は `a = 5` を出すのに、知らせは `value-unresolved` を出していた)。
  //
  // engine が `{}` で組んでいた頃はここも `{}` で揃えていた。 cdl 側が継承なしに
  // 揃えた (cdl#456 / cdl#490) ので、こちらも合わせる。 **揃っていることが要点**で、
  // どちらの形にするかは engine が決める
  const 初期値: Record<string, string> = Object.create(null) as Record<string, string>;
  for (const s of diagram.states) 初期値[s.id] = String(s.initial);

  // engine は同じ名前では先に書いた式を使う。 Map の一括生成で後ろから
  // 上書きすると、先の式の未解決を後の行の問題として伝えてしまう
  const 最初の行 = new Map<string, number>();
  const 重複した行 = new Map<string, number[]>();
  for (const v of doc.values ?? []) {
    if (!最初の行.has(v.name)) {
      最初の行.set(v.name, v.pos?.line ?? 0);
      continue;
    }
    const 同じ名前の行 = 重複した行.get(v.name) ?? [];
    同じ名前の行.push(v.pos?.line ?? 0);
    重複した行.set(v.name, 同じ名前の行);
  }
  // 本文の値は `attachDerivedValues` が先頭へ置き、見本から引き継いだ値はその後ろに残る。
  // 同じ順で行を足すことで、duplicate-id を「後から書かれた宣言」へ正確に戻す。
  for (const [id, lines] of inheritedSourceLines ?? []) {
    for (const line of lines) {
      if (!最初の行.has(id)) {
        最初の行.set(id, line);
        continue;
      }
      const 同じ名前の行 = 重複した行.get(id) ?? [];
      同じ名前の行.push(line);
      重複した行.set(id, 同じ名前の行);
    }
  }
  for (const n of applyDerivedValues(初期値, diagram.derived).notices) {
    onNotice({
      kind: n.kind === "duplicate-id" ? "value-duplicate" : "value-unresolved",
      actor: n.id,
      // 重複は後から書いた宣言そのものを、式の問題は engine が使う最初の宣言を指す
      line:
        n.kind === "duplicate-id"
          ? (重複した行.get(n.id)?.shift() ?? 最初の行.get(n.id) ?? 0)
          : (最初の行.get(n.id) ?? 0),
      message: n.message,
      hint: VALUE_NOTICE_HINT[n.kind],
    });
  }
}

/** 止まった理由ごとの直し方。 engine の知らせは何が起きたかまでで、直し方は記法側が持つ */
const VALUE_NOTICE_HINT: Readonly<Record<string, string>> = {
  cycle: "参照が一周しています。 どれか 1 つを states の初期値に変える",
  "unknown-reference": "その名前の states / values を足すか、綴りを直す",
  "parse-error": "式に書けるのは四則 (+ - * /) と括弧、比較、min / max だけ",
  "eval-error": "初期値で計算できない形です。 割る数や、数として読めない初期値を見直す",
  "duplicate-id": "同じ名前が 2 度あります。 片方を消すか名前を変える",
  "invalid-id": "名前に使えるのは英数字と _ だけ",
};
