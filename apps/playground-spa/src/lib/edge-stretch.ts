/**
 * cdl の edge (矢印) を drag 中に追従させる helper (CAR-2160)。
 *
 * actor を動かしている間、 その actor に繋がる矢印が動かないと線が actor から離れて浮く。
 * mouseup 後の再 compile で正しい位置に戻るが、 drag 中ずっと繋がって見えない = 手触りが悪い。
 *
 * edge 全体を translate すると、 繋がっていない側の端まで動いて相手の actor から離れる。
 * そのため「動かす actor に接している端点だけ」 を動かす = 線が伸縮する。
 */

/** path の `d` を token 列に分解する (command 文字と数値)。 */
type PathToken = { cmd: string; nums: number[] };

/**
 * SVG path の `d` を command 単位に分解する。
 *
 * cdl が出す `d` は `M` / `L` / `C` / `Q` / `A` / `Z` の絶対座標のみ (相対 command は使わない)。
 * 解釈できない command が混ざったら null を返して呼び出し側で諦める = 壊れた path を書かない。
 */
export function parsePathD(d: string): PathToken[] | null {
  const tokens: PathToken[] = [];
  const re = /([MLCQATZmlcqatz])([^MLCQATZmlcqatz]*)/g;
  let m: RegExpExecArray | null;
  // 先頭の空白は許す。 拒否すると `" M 0 0 L 10 0"` のような正常な path で
  // 矢印が追従しなくなる (SVG 仕様上、 command の前後の空白は有効)。
  let matchedLen = d.length - d.trimStart().length;
  while ((m = re.exec(d)) !== null) {
    matchedLen += m[0]!.length;
    const cmd = m[1]!;
    // 相対 command は端点の意味が変わるので扱わない
    if (cmd !== cmd.toUpperCase()) return null;
    const body = m[2]!;
    // 数値と区切り (空白 / カンマ) 以外が混ざっていたら解釈しない。
    // 数値だけ抽出する実装だと `M 10 20 ??? 5` の `???` を黙って捨てて別の path を作る。
    if (!/^[\s,\-+.0-9eE]*$/.test(body)) return null;
    const nums = (body.match(/-?\d+(?:\.\d+)?(?:[eE][-+]?\d+)?/g) ?? []).map(Number);
    if (nums.some((n) => !Number.isFinite(n))) return null;
    tokens.push({ cmd, nums });
  }
  if (tokens.length === 0) return null;
  // 未 match の残りがあれば解釈漏れ (空白のみは許容)
  if (d.slice(matchedLen).trim().length > 0) return null;
  return tokens;
}

/** token 列を `d` 文字列に戻す。 */
export function serializePathD(tokens: readonly PathToken[]): string {
  return tokens
    .map((t) => (t.nums.length === 0 ? t.cmd : `${t.cmd} ${t.nums.map((n) => round3(n)).join(" ")}`))
    .join(" ");
}

function round3(n: number): number {
  return Math.round(n * 1000) / 1000;
}

/** command が持つ座標対の個数 (x,y の組)。 A は末尾 2 つだけが座標。 */
function coordPairCount(cmd: string): number {
  switch (cmd) {
    case "M":
    case "L":
    case "T":
      return 1;
    case "Q":
      return 2;
    case "C":
      return 3;
    case "A":
      return 1; // 末尾 (x, y) のみ
    default:
      return 0;
  }
}

/**
 * path の始点側 / 終点側だけを平行移動する。
 *
 * `side = "start"` は最初の座標対、 `"end"` は最後の座標対を動かす。
 * 中間の制御点は動かさない = 直線なら素直に伸び、 曲線なら端だけが寄る。
 * `"both"` は全座標を動かす (自己ループ等、 両端が同じ actor に付く場合)。
 */
export function shiftPathEnd(d: string, side: "start" | "end" | "both", dx: number, dy: number): string | null {
  // 有限でない delta を足すと `M 0 0 L NaN 0` のような壊れた path を出力し、
  // それを `setAttribute("d", ...)` すると線が消える。 呼び出し側は client 座標を
  // 変換して渡すので、 変換に失敗した場合 (getScreenCTM が null 等) に NaN が来うる。
  // 扱えない入力は null を返して呼び出し側に判断を委ねる。
  if (!Number.isFinite(dx) || !Number.isFinite(dy)) return null;
  const tokens = parsePathD(d);
  if (!tokens) return null;
  if (side === "both") {
    for (const t of tokens) {
      const pairs = coordPairCount(t.cmd);
      if (pairs === 0) continue;
      if (t.cmd === "A") {
        if (t.nums.length < 7) return null;
        t.nums[t.nums.length - 2] = t.nums[t.nums.length - 2]! + dx;
        t.nums[t.nums.length - 1] = t.nums[t.nums.length - 1]! + dy;
        continue;
      }
      for (let i = 0; i + 1 < t.nums.length; i += 2) {
        t.nums[i] = t.nums[i]! + dx;
        t.nums[i + 1] = t.nums[i + 1]! + dy;
      }
    }
    return serializePathD(tokens);
  }
  const target = side === "start" ? tokens[0] : tokens[tokens.length - 1];
  if (!target) return null;
  if (coordPairCount(target.cmd) === 0) return null;
  // A は末尾 2 つが座標で、 その前に 5 引数 (rx ry rot large sweep) を要する。
  // 個数を確認しないと `"M 0 0 A 5 5"` (引数不足) の rx を座標と誤認して
  // `"M 0 0 A 10 5"` を返す = 半径が書き換わった別の弧になる (実測)。
  if (target.cmd === "A" && target.nums.length < 7) return null;
  if (side === "start") {
    if (target.nums.length < 2) return null;
    target.nums[0] = target.nums[0]! + dx;
    target.nums[1] = target.nums[1]! + dy;
  } else {
    if (target.nums.length < 2) return null;
    target.nums[target.nums.length - 2] = target.nums[target.nums.length - 2]! + dx;
    target.nums[target.nums.length - 1] = target.nums[target.nums.length - 1]! + dy;
  }
  return serializePathD(tokens);
}

/**
 * edge の from / to が対象 actor に属するかを判定する。
 *
 * `data-cdl-from` は actor 名そのものではなく node id が入る (sequence では
 * `s0-client` のような step box id)。 実測で `from="s0-client"` を確認済で、
 * 素の名前比較では一度も一致しない。 node id の命名 3 形式を全て見る。
 */
export function edgeSideFor(
  from: string,
  to: string,
  actorName: string,
  actorSlug: string,
): "start" | "end" | "both" | null {
  const hit = (v: string): boolean => {
    for (const base of [actorSlug, actorName]) {
      if (!base) continue;
      if (v === base) return true;
      if (v.startsWith(`${base}-`) || v.startsWith(`${base}__`)) return true;
      if (/^s\d+-/.test(v) && v.endsWith(`-${base}`)) return true;
    }
    return false;
  };
  const f = hit(from);
  const t = hit(to);
  if (f && t) return "both";
  if (f) return "start";
  if (t) return "end";
  return null;
}

/**
 * drag 中の actor に繋がる全 edge の path を伸縮させる。
 *
 * 元の `d` は `data-cdl-path-d` 属性に残っているのでそれを基準にする
 * (毎 frame 現在値から足すと誤差が累積する)。 label も同じ量だけ寄せる。
 */
export function stretchEdgesFor(
  svg: SVGSVGElement,
  actorName: string,
  dx: number,
  dy: number,
  actorSlug: string,
): void {
  svg.querySelectorAll("[data-cdl-edge]").forEach((g) => {
    const from = g.getAttribute("data-cdl-from") ?? "";
    const to = g.getAttribute("data-cdl-to") ?? "";
    const side = edgeSideFor(from, to, actorName, actorSlug);
    if (!side) return;
    const baseD = g.getAttribute("data-cdl-path-d");
    if (!baseD) return;
    const nextD = shiftPathEnd(baseD, side, dx, dy);
    if (!nextD) return;
    g.querySelectorAll("path").forEach((p) => {
      // 元の d を退避しておき、 clear 時に戻せるようにする
      if (!p.hasAttribute("data-cdl-live-base")) p.setAttribute("data-cdl-live-base", p.getAttribute("d") ?? "");
      const own = p.getAttribute("data-cdl-live-base") ?? "";
      const shifted = shiftPathEnd(own, side, dx, dy);
      if (shifted) p.setAttribute("d", shifted);
    });
    // label は線の中点に付いているので、 動かす端に近い分だけ寄せる
    // (both は全体、 片側なら半分) = 線の伸びに追従して見える。
    //
    // label は edge の `<g>` の **外側** に別 group として描かれる (cdl の
    // `render/edges.tsx` が `data-cdl-edge-label-for` を持つ独立 group を出す)。
    // edge group の中を探しても 1 つも見つからないので、 SVG 全体から id で引く。
    const ratio = side === "both" ? 1 : 0.5;
    const edgeId = g.getAttribute("data-cdl-edge");
    if (!edgeId) return;
    svg.querySelectorAll(`[data-cdl-edge-label-for="${cssEscape(edgeId)}"]`).forEach((el) => {
      shiftLabelGroup(el as SVGGElement, dx * ratio, dy * ratio);
    });
  });
}

/**
 * label group を平行移動する。
 *
 * `style.transform` は使えない。 label group は `transform="translate(x y)"` を **属性**で
 * 持っており、 CSS の `transform` は presentation attribute より優先されるので、 style を
 * 当てると元の位置指定ごと置き換わって label が原点付近へ飛ぶ。
 *
 * 元の値を退避してから属性を書き換える (path の `data-cdl-live-base` と同じ形)。
 */
function shiftLabelGroup(el: SVGGElement, dx: number, dy: number): void {
  if (!el.hasAttribute("data-cdl-live-base")) {
    el.setAttribute("data-cdl-live-base", el.getAttribute("transform") ?? "");
  }
  const base = el.getAttribute("data-cdl-live-base") ?? "";
  const m = base.match(/translate\(\s*(-?[\d.eE+-]+)[\s,]+(-?[\d.eE+-]+)\s*\)/);
  if (!m) return;
  const x = Number(m[1]);
  const y = Number(m[2]);
  if (!Number.isFinite(x) || !Number.isFinite(y)) return;
  el.setAttribute("transform", base.replace(m[0], `translate(${x + dx} ${y + dy})`));
}

/**
 * 属性値を selector に埋めるための escape。
 *
 * `CSS.escape` があればそれを使う。 無い環境 (jsdom 等) では、 edge id に現れうる文字
 * (英数字 / `-` / `_`) 以外を落として selector を壊さないようにする。
 */
function cssEscape(v: string): string {
  const g = globalThis as { CSS?: { escape?: (s: string) => string } };
  if (typeof g.CSS?.escape === "function") return g.CSS.escape(v);
  return v.replace(/[^\w-]/g, "\\$&");
}

/** 伸縮を元に戻す。 DSL 反映後の再 render が正になるため、 mouseup 時に呼ぶ。 */
export function clearStretchedEdges(svg: SVGSVGElement): void {
  svg.querySelectorAll("[data-cdl-edge]").forEach((g) => {
    g.querySelectorAll("path").forEach((p) => {
      const base = p.getAttribute("data-cdl-live-base");
      if (base !== null) {
        p.setAttribute("d", base);
        p.removeAttribute("data-cdl-live-base");
      }
    });
    g.querySelectorAll("text, tspan, rect").forEach((el) => {
      (el as SVGGraphicsElement).style.transform = "";
    });
  });
  // label は edge group の外側にあるので別途 clear する (set 側と同じ理由)。
  // 属性を書き換えているので、 退避した元の値に戻す。
  svg.querySelectorAll("[data-cdl-edge-label-for]").forEach((el) => {
    const base = el.getAttribute("data-cdl-live-base");
    if (base === null) return;
    if (base === "") el.removeAttribute("transform");
    else el.setAttribute("transform", base);
    el.removeAttribute("data-cdl-live-base");
  });
}

/**
 * client px 1 に対する SVG user unit の比。
 *
 * `getScreenCTM` は viewBox と CSS transform の両方を含むので、 これで割れば
 * client px の delta を path が使う座標系に直せる。 取得できなければ 1 を返す。
 */
export function svgUnitPerClientPx(svg: SVGSVGElement): number {
  const ctm = svg.getScreenCTM?.();
  if (!ctm || !ctm.a) return 1;
  return 1 / ctm.a;
}
