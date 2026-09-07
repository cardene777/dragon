/**
 * 吸い出した寸法から、意匠帳に写す表を組む。
 *
 * 画面から測る側 (`design-export.mjs`) と分けてあるのは、こちらが DOM を持たない純関数で
 * 単体で確かめられるから。 測る側は役割ごとに数を控えて渡すだけにする。
 *
 * 表の行は **図に在る役割から組む**。 役割を決め打ちすると、作りが違う図で値が取れず、
 * 行だけが `—` で残る。 `—` は「該当なし」 と読めるが実体は「測れなかった」 で、
 * 2 つが混ざると意匠帳の記録が「決めなかった」 のか「測れなかった」 のか後から引けない。
 */

/** 並びから隣どうしの隔たりを出す。 縦線の間隔のように、位置そのものではなく差が意匠になる値に使う */
export function gaps(xs) {
  const sorted = [...xs].filter((n) => Number.isFinite(n)).sort((a, b) => a - b);
  const out = [];
  for (let i = 1; i < sorted.length; i += 1) out.push(Math.round((sorted[i] - sorted[i - 1]) * 100) / 100);
  return out;
}

/**
 * 役割ごとの行。
 *
 * `role` はその図に 1 件でも在れば行を出し、0 件なら行ごと出さない。
 * `pick` は測った item の並びから、その行に出す数の並びを取る。
 */
export const SPEC_ROWS = [
  // 箱で組む図 (関係 / 構成 / 状態 / 階層 / 図表の外枠)
  { role: "node-body", label: "箱の幅", why: "種類と中身で決まる。 今光っている箱は枠のぶん膨らむ", pick: (a) => a.map((i) => i.w) },
  { role: "node-body", label: "箱の高さ", why: "中の行数で決まる", pick: (a) => a.map((i) => i.h) },
  { role: "node-body", label: "角の丸み", why: "箱の角を落とす量。 角を持たない形は測れない", pick: (a) => a.map((i) => i.rx) },
  { role: "node-body", label: "枠の太さ", why: "太い方が今光っている箱。 画面で測った値", pick: (a) => a.map((i) => i.sw) },
  { role: "edge-line", label: "繋がりの線の太さ", why: "箱と箱を結ぶ線", pick: (a) => a.map((i) => i.sw) },

  // 時系列の図 (縦の時間軸に役者を並べる)
  { role: "sequence-thread", label: "縦線の間隔", why: "役者と役者の隔たり", pick: (a) => gaps(a.map((i) => i.x)) },
  { role: "sequence-thread", label: "縦線の太さ", why: "役者の下へ伸びる線", pick: (a) => a.map((i) => i.sw) },
  { role: "sequence-rule", label: "区切り線の太さ", why: "役者の下を横に走る線", pick: (a) => a.map((i) => i.sw) },
  { role: "sequence-band", label: "帯の幅", why: "処理している間を示す", pick: (a) => a.map((i) => i.w) },
  { role: "sequence-band", label: "帯の角の丸み", why: "箱より小さい値を当てる", pick: (a) => a.map((i) => i.rx) },
  { role: "sequence-line", label: "やり取りの線の太さ", why: "役者から役者へ渡る線", pick: (a) => a.map((i) => i.sw) },
  { role: "sequence-source", label: "起点の丸の半径", why: "線が出る側に置く点", pick: (a) => a.map((i) => i.r) },
  { role: "sequence-actor", label: "役者の名前の字", why: "縦線の頭に置く名前", pick: (a) => a.map((i) => i.fs) },
  { role: "sequence-label", label: "やり取りの字", why: "線の上に置く名前", pick: (a) => a.map((i) => i.fs) },

  // 図表
  { role: "chart-line", label: "折れ線の太さ", why: "値を結ぶ線", pick: (a) => a.map((i) => i.sw) },
  { role: "chart-line-value", label: "値の字", why: "節に添える数", pick: (a) => a.map((i) => i.fs) },
  { role: "chart-pie-slice", label: "扇の間隔", why: "扇と扇の間に入る隙間。 台と同じ色で抜く", pick: (a) => a.map((i) => i.sw) },
  { role: "chart-bar", label: "棒の幅", why: "値の大小は高さで見せ、 幅は揃える", pick: (a) => a.map((i) => i.w) },
  { role: "chart-bar", label: "棒の角の丸み", why: "棒の上端を落とす量", pick: (a) => a.map((i) => i.rx) },
  { role: "chart-gauge-arc", label: "弧の太さ", why: "半円の帯", pick: (a) => a.map((i) => i.sw) },
  { role: "chart-stat-track", label: "輪の半径", why: "進みを載せる下地の輪", pick: (a) => a.map((i) => i.r) },
  { role: "chart-stat-track", label: "輪の太さ", why: "下地の輪の帯", pick: (a) => a.map((i) => i.sw) },
  { role: "chart-stat-arc", label: "進みの弧の太さ", why: "下地の輪に重ねる帯", pick: (a) => a.map((i) => i.sw) },
  { role: "chart-stat-value", label: "大きな数字の字", why: "主役の数", pick: (a) => a.map((i) => i.fs) },
  { role: "chart-stat-label", label: "名前の字", why: "数に添える名前", pick: (a) => a.map((i) => i.fs) },
  { role: "chart-stat-share", label: "割合の字", why: "全体に占める割合", pick: (a) => a.map((i) => i.fs) },
  { role: "chart-waffle-cell", label: "印の大きさ", why: "100 個並べる 1 つの辺", pick: (a) => a.map((i) => i.w) },
  { role: "chart-waffle-cell", label: "印の角の丸み", why: "印の角を落とす量", pick: (a) => a.map((i) => i.rx) },
  { role: "chart-waffle-count", label: "数の字", why: "印の数を書く字", pick: (a) => a.map((i) => i.fs) },
  { role: "chart-stacked-bar-slice", label: "区画の高さ", why: "帯を横に割った 1 区画", pick: (a) => a.map((i) => i.h) },
  { role: "chart-stacked-bar-slice-text", label: "区画の名前の字", why: "区画に載せる名前", pick: (a) => a.map((i) => i.fs) },
  { role: "chart-stacked-bar-slice-value", label: "区画の値の字", why: "区画に載せる値", pick: (a) => a.map((i) => i.fs) },
  { role: "chart-stacked-bar-period", label: "期間の字", why: "帯の左に置く期間", pick: (a) => a.map((i) => i.fs) },
  { role: "chart-slope-line", label: "傾きの線の太さ", why: "2 時点の値を結ぶ線。 傾きが動いた量", pick: (a) => a.map((i) => i.sw) },
  { role: "chart-slope-dot", label: "節の丸の半径", why: "線の両端に置く点", pick: (a) => a.map((i) => i.r) },
  { role: "chart-slope-axis", label: "軸の線の太さ", why: "時点ごとに立てる縦軸", pick: (a) => a.map((i) => i.sw) },
  { role: "chart-slope-period", label: "時点の字", why: "軸の頭に置く 前 と 今", pick: (a) => a.map((i) => i.fs) },
  { role: "chart-slope-value", label: "軸の脇の値の字", why: "軸のすぐ横に置く数", pick: (a) => a.map((i) => i.fs) },
  { role: "chart-slope-name", label: "系列の名前の字", why: "値のさらに外に置く系列の名前", pick: (a) => a.map((i) => i.fs) },
  { role: "funnel-stage", label: "段の枠の太さ", why: "絞り込みの 1 段", pick: (a) => a.map((i) => i.sw) },
  { role: "gantt-bar", label: "帯の高さ", why: "工程の長さを示す帯", pick: (a) => a.map((i) => i.h) },
  { role: "gantt-bar", label: "帯の角の丸み", why: "帯の角を落とす量", pick: (a) => a.map((i) => i.rx) },
  { role: "gantt-grid", label: "目盛線の太さ", why: "日付の区切り", pick: (a) => a.map((i) => i.sw) },
  { role: "gantt-tick", label: "日付の字", why: "横軸に置く日付", pick: (a) => a.map((i) => i.fs) },
  { role: "journey-band", label: "感情の帯の高さ", why: "道筋の背に敷く帯", pick: (a) => a.map((i) => i.h) },
  { role: "journey-chip", label: "札の高さ", why: "各段に置く札", pick: (a) => a.map((i) => i.h) },
  { role: "journey-chip", label: "札の角の丸み", why: "札の角を落とす量", pick: (a) => a.map((i) => i.rx) },
  { role: "journey-line", label: "道筋の線の太さ", why: "段をつなぐ線", pick: (a) => a.map((i) => i.sw) },
  { role: "mind-edge", label: "枝の線の太さ", why: "中心から伸びる枝", pick: (a) => a.map((i) => i.sw) },
];

/** 測る側に渡す役割の一覧。 表に出す役割だけを測れば足りる */
export const SPEC_ROLES = [...new Set(SPEC_ROWS.map((r) => r.role))];

/** 線を持つ図かどうかの判定に使う役割。 1 件でも在れば線の動きの行を出す */
const LINE_ROLES = ["edge-line", "sequence-line", "chart-line"];

const uniq = (a) => [...new Set(a.filter((n) => Number.isFinite(n)))].sort((x, y) => x - y);

/**
 * 1 行ぶんの値を文にする。
 *
 * 取れた数が 0 件でも `—` にしない。 対象が在るのに測れなかったことは、対象が無いことと別。
 *
 * 一部しか取れなかった時は母数を併記する = 値だけを出すと、その行が全ての対象を見たのか
 * 一部だけを見たのかが読み手に分からない。 取れなかった理由 (その形が持たない値なのか、
 * 測り方が届かないのか) はここでは判じない。 判じられないことを言い切らない
 */
export function describe(values) {
  const finite = values.filter((n) => Number.isFinite(n));
  const ok = uniq(finite);
  if (ok.length === 0) return `測れなかった (${values.length} 件)`;
  if (finite.length < values.length) return `${ok.join(" / ")} (${values.length} 件中 ${finite.length} 件で測れた)`;
  return ok.join(" / ");
}

/**
 * 段ごとに測った結果を 1 つにまとめる。
 *
 * 役割ごとに **最も多く見つかった段** を採る。 段が進むと要素が増えるので最初の段だけでは
 * 足りず、かといって全段を足し上げると同じ箱を段の数だけ重複して数える。
 *
 * 図の枠は最後の段のものを採る = 意匠帳に残す `look.svg` が最後の段だから。
 */
export function mergeMeasured(entries) {
  const measured = {};
  for (const e of entries) {
    for (const [role, got] of Object.entries(e?.measured ?? {})) {
      if ((got?.found ?? 0) > (measured[role]?.found ?? 0)) measured[role] = got;
    }
  }
  const withVb = entries.filter((e) => (e?.vb?.length ?? 0) === 4);
  const vb = withVb.length > 0 ? withVb[withVb.length - 1].vb : (entries[entries.length - 1]?.vb ?? []);
  return { measured, vb };
}

/**
 * 表を組む。
 *
 * `measured` は役割名から `{ found, items }` を引く形。 `found` は画面に在った件数で、
 * `items` はそのうち測れたものの並び。 `found` が 0 の役割は行を出さない。
 */
export function buildSpec(measured, { viewBox = [], phaseCount = 0 } = {}) {
  const rows = [];
  const at = (role) => measured?.[role];
  const present = (role) => (at(role)?.found ?? 0) > 0;

  for (const row of SPEC_ROWS) {
    if (!present(row.role)) continue;
    const raw = row.pick(at(row.role).items ?? []);
    // 対象は在るが、その行に出す値が 1 つも導けない形 (縦線 1 本から間隔は出ない)。 行ごと出さない
    if (raw.length === 0) continue;
    rows.push([row.label, describe(raw), row.why]);
  }

  rows.push([
    "図の枠",
    viewBox.length === 4 ? `${viewBox[2]} × ${viewBox[3]}` : `測れなかった (${viewBox.length} 値)`,
    viewBox.length === 4 ? `原点 ${viewBox[0]} , ${viewBox[1]}` : "viewBox が 4 値で取れていない",
  ]);
  rows.push(["段の数", String(phaseCount), "段ごとに光る要素が増える"]);

  // 動きの時間は測った値ではなく engine が要素に付けている宣言。 その要素が在る図にだけ出す
  if (present("node-body")) {
    rows.push(["箱の動き", "opacity 120ms / transform 200ms", "engine が箱に付けている時間"]);
  }
  if (LINE_ROLES.some(present)) {
    rows.push(["線の動き", "stroke 280ms / stroke-width 280ms", "engine が線に付けている時間"]);
  }
  return rows;
}
