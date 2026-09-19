import { useEffect, useLayoutEffect, useRef, useState } from "react";
import {
  収める,
  カーソルの下を残す差,
  ホイールで動かした倍率,
  type 倍率の指定,
  type 区間,
} from "@/lib/diagram-zoom";
import { readableScaleForWidth, smallestFontWorld } from "@/lib/readable-scale";

/**
 * 図の拡大縮小と移動を受け持つ部品 (#1961)。
 *
 * カタログの並べて見る側と拡大表示の両方で使う。 受け持つのは 3 つの操作。
 *
 * | 操作 | 何が起きるか |
 * |---|---|
 * | `⌘` / `Ctrl` + ホイール、つまみ | カーソルの下の点を残したまま倍率を変える |
 * | 修飾キー無しのホイール | `修飾キー無しで拡大` の場所だけ倍率を変える。 それ以外は画面を送る (奪わない) |
 * | 倍率を指定した図のドラッグ | ドラッグした向きと逆に巻き取る (掴んだ所が指に付いてくる) |
 *
 * **倍率の状態は呼出側が持つ**。 ＋ / − のボタンと「収める」 のボタンが同じ状態を動かすため、
 * 部品の中に持つとボタンとホイールで 2 つの倍率が食い違う。 部品は「次にこの倍率にしてほしい」
 * を `倍率を置く` で返すだけにする。
 *
 * 倍率の決まり (刻み・ホイールの効き・巻き取りの差) は `@/lib/diagram-zoom` にあり、画面を描かずに
 * 確かめられる。 ここは画面の値を測って決まりに渡し、結果を巻き取りへ当てるだけを持つ。
 */

/** ドラッグと見なすまでに動かす距離 (px)。 これより短い動きは、図の中の押す操作として残す */
const ドラッグの閾値 = 3;

/**
 * ドラッグを始めない要素。 図の中の切替や、図に重なる段の札のボタンを押す操作を奪わない。
 * 図の箱そのもの (押すと状態が変わる図) はここに入れない = 入れると拡げた図を掴めなくなる。
 * 箱を押す操作は、ドラッグの後に来る click を捨てることで守る。
 */
const 押す操作の要素 =
  "button, a, input, select, textarea, label, [role='button'], [role='radio'], [role='tab'], [role='slider']";

export type 拡大と移動の設定 = {
  /** 操作を受ける要素。 まだ描かれていなければ `null` */
  器: HTMLElement | null;
  /** 巻き取る要素を器から探す。 渡さないか見つからなければ器そのものを巻き取る */
  巻き取りを探す?: (器: HTMLElement) => HTMLElement | null;
  /** いまの倍率 (呼出側の状態) */
  倍率: 倍率の指定;
  /** ホイールで動かした倍率を呼出側の状態へ置く */
  倍率を置く: (値: number) => void;
  /** 図の viewBox の幅。 描けない図では `undefined` で、その時は何も受け持たない */
  viewBox幅: number | undefined;
  /** 修飾キー無しのホイールでも拡大するか。 画面を送る操作を奪ってよい場所だけ `true` */
  修飾キー無しで拡大: boolean;
  /**
   * 巻き取りが端に着いた残りを頁へ送るか。 並べて見る側は頁ごと縦に送らないと、拡げた図の下が見えない。
   * 拡大表示は背後の頁を動かさない (閉じた時に元の位置と違う所に居ることになる)。
   */
  頁も送る: boolean;
  /** 描く図が替わった時に測り直すための鍵。 図そのもの (同じ図なら同じ値) を渡す */
  図の鍵?: unknown;
  /**
   * 器に収めた結果が読める下限を割る時、下限まで拡げた倍率を返すか (#2269)。
   *
   * **場所ごとに決める**。 読ませる面 (ひな形の詳細) では下限まで拡げ、溢れた分はドラッグで辿る。
   * 札の中の見本のように読ませない面で課すと、器から出た図が切れたまま辿れなくなる。
   */
  読める下限を課す?: boolean;
};

export type 拡大と移動の状態 = {
  /** 器に収めている時に実際に描かれている倍率。 測れていなければ `undefined` */
  収めた倍率: number | undefined;
  /** ドラッグで巻き取れる状態か (掴める見た目を出すか) */
  動かせる: boolean;
  /** いまドラッグで巻き取っているか */
  移動中: boolean;
  /**
   * 器に収めると文字が読めなくなる図で、代わりに使う倍率 (#2269)。
   *
   * 収めた倍率で下限に届いている図と、`読める下限を課す` を渡していない場所では `undefined` =
   * 呼出側は今まで通り器に合わせる。 文字を測れない図でも `undefined` になる
   * (測れないことを理由に図の大きさを動かさない)。
   */
  読める下限の倍率: number | undefined;
};

/** 画面の測り結果。 変わった時だけ状態を置き換える */
type 測った値 = {
  描かれた倍率: number | undefined;
  溢れている: boolean;
  /** 図の中で最も小さい文字 (世界座標)。 測れなければ `undefined` */
  最小の文字: number | undefined;
  /** 巻き取る要素の内側の幅 (px)。 図に幅を与えても変わらない = 収めた時の倍率の土台になる */
  器の幅: number;
};

/** 器の中の図の svg。 図の外の印 (段の札の絵文字や矢印の定義) を拾わないよう、図の根の中だけを探す */
function 図のsvgを探す(器: HTMLElement): SVGSVGElement | null {
  let 最大: { svg: SVGSVGElement; 幅: number } | null = null;
  for (const svg of 器.querySelectorAll<SVGSVGElement>("[data-cdl-diagram] svg[viewBox]")) {
    const 幅 = svg.getBoundingClientRect().width;
    if (!最大 || 幅 > 最大.幅) 最大 = { svg, 幅 };
  }
  return 最大?.svg ?? null;
}

function 巻き取る要素(
  器: HTMLElement,
  巻き取りを探す: 拡大と移動の設定["巻き取りを探す"],
): HTMLElement {
  return 巻き取りを探す?.(器) ?? 器;
}

/** 器の中の図を測る。 `svg` が無ければ描かれた倍率は測れていない (`undefined`) */
function 画面を測る(
  器: HTMLElement,
  svg: SVGSVGElement | null,
  巻き取りを探す: 拡大と移動の設定["巻き取りを探す"],
): 測った値 {
  const 巻き取り = 巻き取る要素(器, 巻き取りを探す);
  // 0 は「文字が 1 つも無い」 と「値を読めない」 の両方を表す。 下限を課すかの判定に使うので、
  // 測れていない側へ倒して図の大きさを動かさない
  const 文字 = svg ? smallestFontWorld(svg) : 0;
  return {
    描かれた倍率: svg ? 描かれた外枠(svg).倍率 : undefined,
    溢れている:
      巻き取り.scrollWidth > 巻き取り.clientWidth || 巻き取り.scrollHeight > 巻き取り.clientHeight,
    最小の文字: 文字 > 0 ? 文字 : undefined,
    器の幅: 巻き取り.clientWidth,
  };
}

/** 測り直した値が前と同じなら前をそのまま返す = 状態を置き換えず、描き直しを起こさない */
function 変わった時だけ置き換える(前: 測った値, 次: 測った値): 測った値 {
  const 倍率が同じ =
    前.描かれた倍率 === 次.描かれた倍率 ||
    (前.描かれた倍率 !== undefined &&
      次.描かれた倍率 !== undefined &&
      Math.abs(前.描かれた倍率 - 次.描かれた倍率) < 1e-4);
  return 前.溢れている === 次.溢れている &&
    倍率が同じ &&
    前.最小の文字 === 次.最小の文字 &&
    前.器の幅 === 次.器の幅
    ? 前
    : 次;
}

/** 0.5px 未満の残りは巻き取りの丸めで消えるので、動かす量として数えない */
const 残っているか = (量: number): boolean => Math.abs(量) >= 0.5;

/**
 * 巻き取りの位置を足す。 始まりの要素が端に着いた残りは、巻き取れる祖先へ順に送る。
 *
 * 並べて見る側の巻き取りは横にしか溢れない (縦は頁が送る)。 横と縦を同じ要素に足すと、
 * 縦の残りが黙って捨てられ、拡げた図のカーソルの下の点が縦にずれる。
 *
 * 足しきれなかった量 (端に着いた分と、巻き取りの位置が整数に丸められた分) を返す。
 */
function 巻き取りを足す(
  始まり: HTMLElement,
  dx: number,
  dy: number,
  頁も送る: boolean,
): { 残りx: number; 残りy: number } {
  let 残りx = dx;
  let 残りy = dy;
  for (
    let el: HTMLElement | null = 始まり;
    el && el !== document.documentElement && (残っているか(残りx) || 残っているか(残りy));
    el = 頁も送る ? el.parentElement : null
  ) {
    const style = getComputedStyle(el);
    if (
      残っているか(残りx) &&
      /(auto|scroll)/.test(style.overflowX) &&
      el.scrollWidth > el.clientWidth
    ) {
      const 前 = el.scrollLeft;
      el.scrollLeft = 前 + 残りx;
      残りx -= el.scrollLeft - 前;
    }
    if (
      残っているか(残りy) &&
      /(auto|scroll)/.test(style.overflowY) &&
      el.scrollHeight > el.clientHeight
    ) {
      const 前 = el.scrollTop;
      el.scrollTop = 前 + 残りy;
      残りy -= el.scrollTop - 前;
    }
  }
  if (頁も送る && (残っているか(残りx) || 残っているか(残りy))) {
    const 前 = { x: window.scrollX, y: window.scrollY };
    window.scrollBy(残りx, 残りy);
    残りx -= window.scrollX - 前.x;
    残りy -= window.scrollY - 前.y;
  }
  return { 残りx, 残りy };
}

/** 1px 未満の残り (丸めで捨てられた分) だけを次へ持ち越す。 端に着いた分まで持ち越すと、戻す向きに動かしても暫く巻き取らない */
const 丸めの残り = (量: number): number => (Math.abs(量) < 1 ? 量 : 0);

/** ホイールの量を画素に直す。 行単位 (Firefox) と頁単位の操作も、画素の操作と同じ効きにする */
function 画素に直す(e: WheelEvent): number {
  if (e.deltaMode === WheelEvent.DOM_DELTA_LINE) return e.deltaY * 16;
  if (e.deltaMode === WheelEvent.DOM_DELTA_PAGE) return e.deltaY * 800;
  return e.deltaY;
}

/**
 * svg の中に **実際に図が描かれている** 外枠と倍率。
 *
 * svg の箱と図の外枠は一致しない。 拡大表示で器に収めると箱は 1150 × 630 まで広がるが、図は縦横比を
 * 保って箱の中央に描かれる (`preserveAspectRatio` の既定) = 縦に長い図は幅 500px ほどしか無い。
 * 箱で測ると、倍率の欄に 50% と出るのに図は 22% で描かれ、カーソルの下の点も横にずれる。
 */
function 描かれた外枠(svg: SVGSVGElement): { x: 区間; y: 区間; 倍率: number | undefined } {
  const r = svg.getBoundingClientRect();
  const vb = svg.viewBox.baseVal;
  if (!vb || !(vb.width > 0) || !(vb.height > 0) || !(r.width > 0) || !(r.height > 0)) {
    return {
      x: { 位置: r.left, 長さ: r.width },
      y: { 位置: r.top, 長さ: r.height },
      倍率: undefined,
    };
  }
  const 倍率 = Math.min(r.width / vb.width, r.height / vb.height);
  const 幅 = vb.width * 倍率;
  const 高さ = vb.height * 倍率;
  return {
    x: { 位置: r.left + (r.width - 幅) / 2, 長さ: 幅 },
    y: { 位置: r.top + (r.height - 高さ) / 2, 長さ: 高さ },
    倍率,
  };
}

export function useDiagramPanZoom(設定: 拡大と移動の設定): 拡大と移動の状態 {
  const { 器, 倍率, viewBox幅, 図の鍵 } = 設定;
  const [測った, set測った] = useState<測った値>({
    描かれた倍率: undefined,
    溢れている: false,
    最小の文字: undefined,
    器の幅: 0,
  });
  const [移動中, set移動中] = useState(false);

  const 読める下限の倍率 =
    設定.読める下限を課す === true
      ? readableScaleForWidth({
          frameWidth: 測った.器の幅,
          viewBoxWidth: viewBox幅,
          minFontWorld: 測った.最小の文字,
        })
      : undefined;
  // **下限が効く時は下限そのものを返す** (#2269)。 下限で幅を与えると描かれた倍率も下限になるが、
  // それが測り直されるのは次の描画なので、欄が 1 フレーム前の倍率を出したまま図だけ替わる。
  // 下限は器の幅と図の文字から出るので、幅を与えるのと同じ描画で確定している
  const 収めた倍率 =
    viewBox幅 === undefined ? undefined : (読める下限の倍率 ?? 測った.描かれた倍率);
  // 下限で拡げた図は器から出るので、収めている間もドラッグで辿れるようにする。
  // 下限を課していない場所では今まで通り、倍率を指定した時だけ掴める
  const 動かせる =
    viewBox幅 !== undefined &&
    (倍率 !== 収める || 読める下限の倍率 !== undefined) &&
    (設定.頁も送る || 測った.溢れている);

  // 登録した操作の受け口は器が替わるまで作り直さない。 毎回の描画で変わる値はここから読む
  const 最新 = useRef({ 設定, 収めた倍率, 動かせる });
  useLayoutEffect(() => {
    最新.current = { 設定, 収めた倍率, 動かせる };
  });

  /** ホイールで倍率を置いてから描き直されるまでの、画面に出ている図の外枠とカーソル */
  const 巻き取りの保留 = useRef<{ x: 区間; y: 区間; カーソル: { x: number; y: number } } | null>(
    null,
  );
  /** ホイールで置いたがまだ描かれていない倍率。 描かれる前に続けて回した分を積み上げる */
  const 置いた倍率 = useRef<number | null>(null);

  // **図が替わった描画の中で 1 度測る** (#2044)。
  //
  // engine は同じ svg の中身を新しい図へ書き換える。 下の観測は大きさの変化を次のフレームで受け取るので、
  // それだけだと新しい図が 1 フレームの間、前の図の倍率を欄に出したまま画面に出る。 負荷が高いとこの間が
  // 伸び、実測では 60% の図の次に 200% の図を開いて 500ms 経っても欄が 60% のままだった。 その間に
  // 「上げる」 を押すと前の図の倍率を起点に刻みを選ぶため、200% で描かれた図が 75% へ縮む。
  //
  // 画面に出す前 (`useLayoutEffect`) に測れば、図と欄が同じフレームで替わる。 図がまだ無ければ
  // 測れていない値に置き換える = 前の図の倍率を別の図の欄に残さない。
  useLayoutEffect(() => {
    if (!器 || viewBox幅 === undefined) return;
    const 次 = 画面を測る(器, 図のsvgを探す(器), 最新.current.設定.巻き取りを探す);
    set測った((前) => 変わった時だけ置き換える(前, 次));
  }, [器, viewBox幅, 図の鍵]);

  // 描かれている倍率と、巻き取りが溢れているかを測る。
  //
  // **大きさが変わった時に測る** (`ResizeObserver`)。 図は見える所まで来てから描かれ (`InViewMount`)、
  // 描き直しで svg が差し替わることもあるため、器の中身の出入りも見て、測る svg を付け替える。
  useEffect(() => {
    if (!器 || viewBox幅 === undefined) return;
    // 観測の手段を持たない環境 (jsdom) では観測しない。 大きさが変わっても測り直さない
    if (typeof ResizeObserver === "undefined") return;
    let 見ているsvg: SVGSVGElement | null = null;
    let 予約 = 0;
    const 測る = (): void => {
      const 次 = 画面を測る(器, 見ているsvg, 最新.current.設定.巻き取りを探す);
      set測った((前) => 変わった時だけ置き換える(前, 次));
    };
    const ro = new ResizeObserver(測る);
    const svgを見直す = (): void => {
      予約 = 0;
      const svg = 図のsvgを探す(器);
      if (svg === 見ているsvg) return;
      if (見ているsvg) ro.unobserve(見ているsvg);
      見ているsvg = svg;
      // 観測を始めると最初の 1 回が必ず届く = 付け替えた直後に測られる
      if (svg) ro.observe(svg);
    };
    const mo = new MutationObserver(() => {
      if (予約 === 0) 予約 = requestAnimationFrame(svgを見直す);
    });
    svgを見直す();
    ro.observe(器);
    mo.observe(器, { childList: true, subtree: true });
    return () => {
      mo.disconnect();
      ro.disconnect();
      if (予約 !== 0) cancelAnimationFrame(予約);
    };
  }, [器, viewBox幅, 図の鍵]);

  // ホイールとつまみ。 **`passive: false` で登録する** = React の `onWheel` は受け身で登録され、
  // 既定の動き (頁の拡大や画面送り) を止められない
  useEffect(() => {
    if (!器) return;
    const 回した = (e: WheelEvent): void => {
      const { 設定: いまの設定, 収めた倍率: いまの収めた倍率 } = 最新.current;
      if (!(e.ctrlKey || e.metaKey || いまの設定.修飾キー無しで拡大)) return;
      if (いまの設定.viewBox幅 === undefined) return;
      // 図の上での拡大の操作は、倍率を測れていなくても頁の拡大へ流さない
      e.preventDefault();
      const 起点 =
        置いた倍率.current ?? (いまの設定.倍率 === 収める ? いまの収めた倍率 : いまの設定.倍率);
      if (起点 === undefined) return;
      const 次 = ホイールで動かした倍率(起点, 画素に直す(e));
      if (次 === 起点) return;
      const svg = 図のsvgを探す(器);
      if (!svg) return;
      // 描き直される前に続けて回した時は、画面に出ている外枠 (最初に測ったもの) のまま、カーソルだけ新しくする
      const 前 = 巻き取りの保留.current ?? 描かれた外枠(svg);
      巻き取りの保留.current = { x: 前.x, y: 前.y, カーソル: { x: e.clientX, y: e.clientY } };
      置いた倍率.current = 次;
      いまの設定.倍率を置く(次);
    };
    器.addEventListener("wheel", 回した, { passive: false });
    return () => 器.removeEventListener("wheel", 回した);
  }, [器]);

  // 倍率が描かれた直後 (描画の前) に、カーソルの下にあった点を同じ画面の位置へ巻き取る
  useLayoutEffect(() => {
    置いた倍率.current = null;
    const 保留 = 巻き取りの保留.current;
    巻き取りの保留.current = null;
    if (!保留 || !器) return;
    const svg = 図のsvgを探す(器);
    if (!svg) return;
    const 後 = 描かれた外枠(svg);
    巻き取りを足す(
      巻き取る要素(器, 最新.current.設定.巻き取りを探す),
      カーソルの下を残す差(保留.x, 後.x, 保留.カーソル.x),
      カーソルの下を残す差(保留.y, 後.y, 保留.カーソル.y),
      最新.current.設定.頁も送る,
    );
  }, [倍率, 器]);

  // ドラッグで巻き取る。 押しただけ (閾値未満) の操作は図の中の押す操作に残す
  useEffect(() => {
    if (!器) return;
    let 始まり: {
      id: number;
      x: number;
      y: number;
      動いた: boolean;
      持ち越しx: number;
      持ち越しy: number;
    } | null = null;
    const 押した = (e: PointerEvent): void => {
      if (e.button !== 0 || e.pointerType === "touch") return;
      if (!最新.current.動かせる) return;
      if (e.target instanceof Element && e.target.closest(押す操作の要素)) return;
      始まり = {
        id: e.pointerId,
        x: e.clientX,
        y: e.clientY,
        動いた: false,
        持ち越しx: 0,
        持ち越しy: 0,
      };
    };
    const 動いた = (e: PointerEvent): void => {
      if (!始まり || e.pointerId !== 始まり.id) return;
      const dx = e.clientX - 始まり.x;
      const dy = e.clientY - 始まり.y;
      if (!始まり.動いた) {
        if (Math.hypot(dx, dy) < ドラッグの閾値) return;
        始まり.動いた = true;
        器.setPointerCapture(e.pointerId);
        set移動中(true);
      }
      e.preventDefault();
      // 巻き取りの位置は整数に丸められる。 移動ごとに端数を捨てると、細かく動かすほど指から遅れる
      // (実測で 60px 動かして 4px 足りなかった)
      const { 残りx, 残りy } = 巻き取りを足す(
        巻き取る要素(器, 最新.current.設定.巻き取りを探す),
        -dx + 始まり.持ち越しx,
        -dy + 始まり.持ち越しy,
        最新.current.設定.頁も送る,
      );
      始まり.持ち越しx = 丸めの残り(残りx);
      始まり.持ち越しy = 丸めの残り(残りy);
      始まり.x = e.clientX;
      始まり.y = e.clientY;
    };
    const 離した = (e: PointerEvent): void => {
      if (!始まり || e.pointerId !== 始まり.id) return;
      const 動かした = 始まり.動いた;
      始まり = null;
      if (!動かした) return;
      set移動中(false);
      // 離した直後に来る click を 1 回だけ捨てる。 捨てないと、掴んだ所の箱が押されて図の状態が変わる
      const 捨てる = (c: MouseEvent): void => {
        c.stopPropagation();
        c.preventDefault();
      };
      器.addEventListener("click", 捨てる, { capture: true, once: true });
      // click が来ない離し方 (器の外で離した) では、次の本物の click を捨てないよう外す
      setTimeout(() => 器.removeEventListener("click", 捨てる, { capture: true }), 0);
    };
    // 図の中の絵を掴んだ時に、ブラウザの画像のドラッグが始まって巻き取りが止まるのを防ぐ
    const 掴んだ = (e: DragEvent): void => {
      if (最新.current.動かせる) e.preventDefault();
    };
    器.addEventListener("pointerdown", 押した);
    器.addEventListener("pointermove", 動いた);
    器.addEventListener("pointerup", 離した);
    器.addEventListener("pointercancel", 離した);
    器.addEventListener("dragstart", 掴んだ);
    return () => {
      器.removeEventListener("pointerdown", 押した);
      器.removeEventListener("pointermove", 動いた);
      器.removeEventListener("pointerup", 離した);
      器.removeEventListener("pointercancel", 離した);
      器.removeEventListener("dragstart", 掴んだ);
    };
  }, [器]);

  return { 収めた倍率, 動かせる, 移動中: 移動中 && 動かせる, 読める下限の倍率 };
}
