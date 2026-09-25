/**
 * 図の型ごとの描画の形の検査 (層 3) の軸の表 (#1952)。
 *
 * 本番の検査 (`kind-geometry-check.spec.ts`) と実証の検査 (`kind-geometry-check.proof.spec.ts`) は
 * どちらもこの表を回す。 判定をここにだけ置くのは、実証が本番と同じ判定を試すため。
 *
 * ## 判定を 2 か所に書くと、実証は本番を守らない
 *
 * 以前は実証が判定を自前で書き写していた。 本番の工程表の矢じりの判定を「常に通る」 形に
 * 壊しても、実証は自分の写しを試すので 5 件とも通った (#1952 で実測)。 写しは既に食い違っても
 * いた (着地する帯が見つからない矢じりを、本番は落とし、写しは黙って飛ばす)。
 *
 * ## 画面では生の値だけを測り、判定は Node 側で行う
 *
 * `page.evaluate` に渡す関数は外の変数を持ち込めない。 判定を画面側に書くと、同じ式を
 * 2 か所に置くことになる。
 *
 * ## 壊し方は型で必須にする
 *
 * 表の 1 行は壊し方 (`壊す`) を持たないと組めない。 実証の無い軸を作れなくするため
 * (以前は 8 軸のうち 3 軸が実証を持たなかった)。
 *
 * ## 開いた図が軸の見本かを確かめてから測る
 *
 * 見本の一覧の画面は、開いた直後に折れ線グラフを出している。 見本を開き損ねると、軸は
 * 折れ線グラフを測る。 箱の字のはみ出しの軸は、見本を開かない変異で折れ線グラフの箱を測って
 * 通った (#1952 で実測)。 見本は書き出しの名前で持ち、画面に出す名前と図の `id` をそこから導く。
 *
 * ## 位置と大きさは図の枠の座標で比べる
 *
 * `getBBox` と `d` 属性は、要素自身や祖先に付いた `transform` を含まない局所の値を返す。
 * 局所の値で比べると、`transform` で画面の上の位置が崩れても値は変わらず、判定は通る
 * (#1958 で実測。 状態遷移図の字に `translate(400 0)` を付けると、画面の右端は 91 から 491 へ
 * 動くのに `getBBox` の右端は 66 のまま)。 画面では変換行列と局所の値だけを測り
 * (`要素を測る`)、枠の座標へ直すのは Node 側の `枠の点へ` と `枠の外枠へ` の 1 か所に置く。
 */
import type { Page } from "@playwright/test";
import { ITEM_NAME_JA } from "../../src/lib/i18n";
import * as 見本の図たち from "../../src/topics/catalog/presets.cdl";
import { 折れ線の印, 折れ線の札の下限, 見本の根の名前, 見本の折れ線の値の数 } from "./figure-marks";

/** 1 回測った結果。 母数は測った対象の数で、下限を下回ったら空振り */
export type 測った結果 = { 母数: number; 違反: string[] };

/** 表の 1 行。 本番の検査と実証の検査はこの形だけを見る */
export type 層3の軸 = {
  /** 本番と実証で同じ軸を指す名前 */
  readonly 名前: string;
  /** カタログの見本の一覧に出る名前 */
  readonly 見本: string;
  /** 見本の図の `id`。 開いた図がこれと一致することを確かめてから測る */
  readonly 図のid: string;
  /** 測る対象の数の下限 */
  readonly 下限: number;
  /** 見本を開いた後、図が出揃うまで待つ */
  readonly 待つ: (page: Page) => Promise<void>;
  /** 画面を測って判定する */
  readonly 確かめる: (page: Page) => Promise<測った結果>;
  /** 実証用。 この軸が防ぎたい崩れを画面に作る */
  readonly 壊す: (page: Page) => Promise<void>;
};

type 軸の定義<T> = {
  readonly 名前: string;
  /** 見本の書き出しの名前 (`presets.cdl.ts` の `export const` の名前) */
  readonly 見本: string;
  readonly 下限: number;
  readonly 待つ: (page: Page) => Promise<void>;
  /** 画面から生の値を測る */
  readonly 測る: (page: Page) => Promise<T>;
  /** 測った対象の数 */
  readonly 母数: (値: T) => number;
  /** 違反を返す。 空なら通る */
  readonly 判定: (値: T) => string[];
  readonly 壊す: (page: Page) => Promise<void>;
};

/** 書き出しの名前から、画面に出す名前と図の `id` を導く。 どちらかが無ければ表を組む時点で止める */
function 見本を引く(書き出しの名前: string): { 名前: string; 図のid: string } {
  const 名前 = ITEM_NAME_JA[書き出しの名前];
  if (名前 === undefined) throw new Error(`見本 ${書き出しの名前} の表示名が ITEM_NAME_JA に無い`);
  const 図: unknown = (見本の図たち as Record<string, unknown>)[書き出しの名前];
  const 図のid = typeof 図 === "object" && 図 !== null ? (図 as { id?: unknown }).id : undefined;
  if (typeof 図のid !== "string")
    throw new Error(`見本 ${書き出しの名前} の図が presets.cdl.ts に無い`);
  return { 名前, 図のid };
}

/** 測った値の型を表の外へ出さないよう、測ると判定を 1 つにまとめる */
function 軸を組む<T>(定義: 軸の定義<T>): 層3の軸 {
  const 見本 = 見本を引く(定義.見本);
  return {
    名前: 定義.名前,
    見本: 見本.名前,
    図のid: 見本.図のid,
    下限: 定義.下限,
    待つ: 定義.待つ,
    async 確かめる(page) {
      const 値 = await 定義.測る(page);
      return { 母数: 定義.母数(値), 違反: 定義.判定(値) };
    },
    壊す: 定義.壊す,
  };
}

type 点 = { x: number; y: number };

/** 図の枠 (`viewBox`) の座標で表した外枠 */
export type 外枠 = { x: number; y: number; 幅: number; 高さ: number };

/** 要素の局所の座標から枠の座標への変換行列 `[a, b, c, d, e, f]` (`DOMMatrix` と同じ並び) */
export type 行列 = readonly [number, number, number, number, number, number];

/** 画面で 1 つの要素から測る生の値。 枠の座標へは Node 側で直す */
export type 測った要素 = {
  行列: 行列;
  /** `getBBox` の値 (要素自身と祖先の `transform` を含まない) */
  局所の外枠: 外枠;
  d: string;
  字: string;
  /** 要素を含む最も近い `[data-cdl-node]` の値。 無ければ空 */
  持ち主: string;
};

/** 局所の座標の点を枠の座標へ直す */
export function 枠の点へ([a, b, c, d, e, f]: 行列, p: 点): 点 {
  return { x: a * p.x + c * p.y + e, y: b * p.x + d * p.y + f };
}

/**
 * 局所の外枠を枠の座標へ直す。 4 つの角を直して最小と最大を取るので、反転や傾きがあっても
 * 外枠の向きは入れ替わらない。
 */
export function 枠の外枠へ(m: 行列, 枠: 外枠): 外枠 {
  const 角たち = [
    { x: 枠.x, y: 枠.y },
    { x: 枠.x + 枠.幅, y: 枠.y },
    { x: 枠.x, y: 枠.y + 枠.高さ },
    { x: 枠.x + 枠.幅, y: 枠.y + 枠.高さ },
  ].map((p) => 枠の点へ(m, p));
  const xs = 角たち.map((p) => p.x);
  const ys = 角たち.map((p) => p.y);
  const x = Math.min(...xs);
  const y = Math.min(...ys);
  return { x, y, 幅: Math.max(...xs) - x, 高さ: Math.max(...ys) - y };
}

/** 図の枠 (`viewBox`) を読む */
async function 枠を読む(page: Page): Promise<外枠> {
  const [x = 0, y = 0, 幅 = 0, 高さ = 0] = await page.evaluate(() =>
    (document.querySelector('svg[role="img"]')?.getAttribute("viewBox") ?? "")
      .split(/\s+/)
      .map(Number),
  );
  return { x, y, 幅, 高さ };
}

/** 図の中で `選び` に当たる要素ごとに、枠の座標への変換行列と局所の値を測る */
export function 要素を測る(page: Page, 選び: string): Promise<測った要素[]> {
  return page.evaluate((選び) => {
    const svg = document.querySelector<SVGSVGElement>('svg[role="img"]');
    const 画面から枠へ = svg?.getScreenCTM()?.inverse();
    if (!svg || !画面から枠へ) return [];
    return Array.from(svg.querySelectorAll<SVGGraphicsElement>(選び)).flatMap((el) => {
      const 要素から画面へ = el.getScreenCTM();
      if (!要素から画面へ) return [];
      const m = 画面から枠へ.multiply(要素から画面へ);
      const bb = el.getBBox();
      return [
        {
          行列: [m.a, m.b, m.c, m.d, m.e, m.f] as [number, number, number, number, number, number],
          局所の外枠: { x: bb.x, y: bb.y, 幅: bb.width, 高さ: bb.height },
          d: el.getAttribute("d") ?? "",
          字: el.textContent ?? "",
          持ち主: el.closest("[data-cdl-node]")?.getAttribute("data-cdl-node") ?? "",
        },
      ];
    });
  }, 選び);
}

/** 要素の `transform` の後ろに変換を足す。 局所の値を変えずに画面の上の位置だけを崩す */
function 変換を足す(
  page: Page,
  選び: string,
  変換: string,
  対象: "全て" | "最初" | "最後" = "全て",
): Promise<void> {
  return page.evaluate(
    ({ 選び, 変換, 対象 }) => {
      const 要素たち = Array.from(document.querySelectorAll(`svg[role="img"] ${選び}`));
      const 対象たち =
        対象 === "最初" ? 要素たち.slice(0, 1) : 対象 === "最後" ? 要素たち.slice(-1) : 要素たち;
      対象たち.forEach((el) =>
        el.setAttribute("transform", `${el.getAttribute("transform") ?? ""} ${変換}`.trim()),
      );
    },
    { 選び, 変換, 対象 },
  );
}

/** `path` の `d` (`M` / `L` のみ) から点の並びを読む */
export function 点を読む(d: string): 点[] {
  const 点たち: 点[] = [];
  const 字たち = d.trim().split(/[\s,]+/);
  for (let i = 0; i < 字たち.length; i++) {
    const 字 = 字たち[i];
    // `C` は制御点 2 つと終点の 3 組。 **制御点も点として返す** (#2549) = 曲線 1 本で
    // 引いた線では、両端の接線の向きが制御点との位置関係にしか現れない
    const 組数 = 字 === "M" || 字 === "L" ? 1 : 字 === "C" ? 3 : 0;
    if (組数 === 0) continue;
    for (let 組 = 0; 組 < 組数; 組++) {
      // 続く 2 つが無い = 並びの終わり
      const xs = 字たち[i + 1];
      const ys = 字たち[i + 2];
      if (xs === undefined || ys === undefined) break;
      const x = parseFloat(xs);
      const y = parseFloat(ys);
      if (Number.isFinite(x) && Number.isFinite(y)) 点たち.push({ x, y });
      i += 2;
    }
  }
  return 点たち;
}

/** 見本の一覧の画面を開く。 経路は base 相対で書く (先頭 `/` を付けると base が落ちる、 #1438) */
export async function 見本の一覧を開く(page: Page): Promise<void> {
  await page.goto("catalog/presets", { waitUntil: "networkidle" });
  await page.waitForTimeout(800);
}

/** 軸の見本を開き、図が出揃うまで待つ。 画面に出ている図の `id` を返す */
export async function 見本を開く(page: Page, 軸: 層3の軸): Promise<string[]> {
  await page.getByText(軸.見本, { exact: true }).first().click();
  await 軸.待つ(page);
  return page.evaluate(() =>
    Array.from(document.querySelectorAll("[data-cdl-diagram]")).map(
      (e) => e.getAttribute("data-cdl-diagram") ?? "",
    ),
  );
}

const 一拍待つ = (page: Page) => page.waitForTimeout(1000);

/**
 * 工程表の依存の矢印が出るまで待つ (#1357)。
 *
 * 帯を起点から描く段では、矢印は **帯が出揃ってから** 出る (`cdl` の `draw` の仕様)。
 * 固定の待ち時間だと、描いている途中を読んで 0 件になる。
 *
 * 上限を置いて待ち、出なければそのまま先へ進む = 下限の assert がそこで落ちるので、
 * 本当に出ない形は見逃さない。
 */
async function 矢印が出るまで待つ(page: Page): Promise<void> {
  await 一拍待つ(page);
  for (let i = 0; i < 60; i++) {
    const n = await page.evaluate(
      () => document.querySelectorAll('[data-cdl-role="gantt-arrow"] path').length,
    );
    if (n > 0) return;
    await page.waitForTimeout(100);
  }
}

/**
 * フローの線が出るまで待つ (#1479)。
 *
 * 矢印は段に合わせて出るので、開いた直後は 1 本も描かれていない。
 * **見えているかは待たない** (`state: "attached"`)。 線は段の進みで長さが 0 になる瞬間があり、
 * 「見えるまで」 だとその瞬間に当たった回が時間切れになる。 読むのは塗りの指定なので DOM に在れば足りる。
 */
async function 線が出るまで待つ(page: Page): Promise<void> {
  await page.waitForSelector('[data-cdl-role="edge-line"]', { state: "attached", timeout: 15_000 });
}

/** 工程表の依存の矢印の線 (`Z` で閉じない `path`) と矢じり (`Z` で閉じる `path`) */
const 矢印の線 = '[data-cdl-role="gantt-arrow"] path:not([d*="Z"])';
const 矢じり = '[data-cdl-role="gantt-arrow"] path[d*="Z"]';

const 工程表の矢印の向き = 軸を組む<測った要素[]>({
  名前: "工程表の依存の線は帯の下から出て、次の帯の上へ縦に入る",
  見本: "presetGantt",
  下限: 1,
  待つ: 矢印が出るまで待つ,
  測る: (page) => 要素を測る(page, 矢印の線),
  母数: (線たち) => 線たち.length,
  判定: (線たち) =>
    線たち.flatMap(({ 行列, d }) => {
      const 点たち = 点を読む(d).map((p) => 枠の点へ(行列, p));
      // 経路は曲線 1 本 (`kinds/gantt.tsx` の依存の線、 `cdl#875`)。
      // 始点・制御点 2 つ・終点の 4 点で、守るのは「両端の接線が縦」 と「下へ向かう」
      if (点たち.length !== 4) {
        return [`点の数が 4 (曲線 1 本) でない (${点たち.length} 点): ${d}`];
      }
      const 始 = 点たち[0]!;
      const 手1 = 点たち[1]!;
      const 手2 = 点たち[2]!;
      const 先 = 点たち[3]!;
      const 違反: string[] = [];
      if (Math.abs(手1.x - 始.x) >= 1) 違反.push(`出る所の接線が縦でない: ${d}`);
      if (Math.abs(手2.x - 先.x) >= 1) 違反.push(`入る所の接線が縦でない: ${d}`);
      if (先.y <= 始.y) 違反.push(`下へ向かっていない: ${d}`);
      return 違反;
    }),
  // 1 本目の線を上下に反転する。 `d` は変わらず、画面の上で上へ向かう
  壊す: (page) => 変換を足す(page, 矢印の線, "scale(1 -1)", "最初"),
});

/** 工程表の依存の矢じり (`Z` で閉じる 3 点の `path`) */
const 工程表の矢じりの隙間 = 軸を組む<{ 帯たち: 外枠[]; 矢じりたち: 測った要素[] }>({
  名前: "工程表の矢じりの先が、着く先の帯の上辺に触れる",
  見本: "presetGantt",
  下限: 1,
  待つ: 矢印が出るまで待つ,
  測る: async (page) => ({
    帯たち: (await 要素を測る(page, '[data-cdl-role="gantt-bar"]')).map((帯) =>
      枠の外枠へ(帯.行列, 帯.局所の外枠),
    ),
    矢じりたち: await 要素を測る(page, 矢じり),
  }),
  母数: ({ 矢じりたち }) => 矢じりたち.filter(({ d }) => 点を読む(d).length === 3).length,
  判定: ({ 帯たち, 矢じりたち }) =>
    矢じりたち.flatMap(({ 行列, d }) => {
      const 点たち = 点を読む(d).map((p) => 枠の点へ(行列, p));
      if (点たち.length !== 3) return [];
      // 先は 3 点のうち一番下 (`M 着地X 着地Y` が帯の上辺、残り 2 点はその手前)
      const 先 = 点たち.reduce((下, p) => (p.y > 下.y ? p : 下));
      // 先の x を横幅に含む帯のうち、上辺が先に一番近いもの
      const 候補 = 帯たち.filter((b) => 先.x >= b.x - 1 && 先.x <= b.x + b.幅 + 1);
      if (候補.length === 0) return [`矢じりの先 (x=${先.x}) を横幅に含む帯が無い: ${d}`];
      const 着く帯 = 候補.reduce((近, b) =>
        Math.abs(b.y - 先.y) < Math.abs(近.y - 先.y) ? b : 近,
      );
      const 隔たり = Math.abs(着く帯.y - 先.y);
      return 隔たり >= 1.5
        ? [`矢じりの先 (y=${先.y}) が帯の上辺 (y=${着く帯.y}) から ${隔たり}px 離れている: ${d}`]
        : [];
    }),
  // 矢じりを下へ 20 動かす。 `d` は変わらず、画面の上で帯の中へ食い込む
  壊す: (page) => 変換を足す(page, 矢じり, "translate(0 20)"),
});

const 絞り込み図の段 = '[data-cdl-role="funnel-stage"]';

const 絞り込み図の幅 = 軸を組む<number[]>({
  名前: "絞り込み図の段の幅が上から下へ減っていく",
  見本: "presetFunnel",
  下限: 2,
  待つ: 一拍待つ,
  測る: async (page) =>
    (await 要素を測る(page, 絞り込み図の段)).map((段) => 枠の外枠へ(段.行列, 段.局所の外枠).幅),
  母数: (幅たち) => 幅たち.length,
  判定: (幅たち) =>
    幅たち.flatMap((今, i) => {
      const 前 = 幅たち[i - 1];
      return 前 !== undefined && 今 > 前 + 0.5
        ? [`段 ${i} の幅 (${今}) が段 ${i - 1} の幅 (${前}) より広い`]
        : [];
    }),
  // 最後の段を横に 3 倍へ伸ばす。 `getBBox` の幅は変わらず、画面の上で 1 段目より広くなる
  壊す: (page) => 変換を足す(page, 絞り込み図の段, "scale(3 1)", "最後"),
});

/** 図の枠 (`viewBox`) と、根の字の中心を枠の座標で測った位置 */
export type 根の位置 = { 枠: 外枠; 根: 点 | null };

/**
 * 根の字の中心が、枠の中央から縦横とも枠の 20% 以内にあるかを見る (#1954)。
 *
 * **中央は枠の始点を入れて求める**。 見本の枠は `-35 68 865 600` のように始点が 0 でなく、
 * 幅と高さの半分だけを中央にすると原点寄りの点と比べることになる。
 */
export function 根の位置の違反({ 枠, 根 }: 根の位置): string[] {
  if (!根) return [];
  const 中央 = { x: 枠.x + 枠.幅 / 2, y: 枠.y + 枠.高さ / 2 };
  const 違反: string[] = [];
  if (Math.abs(根.x - 中央.x) >= 枠.幅 * 0.2)
    違反.push(`根の横の中心 (${根.x}) が枠の中央 (${中央.x}) から枠の幅の 20% 以上ずれている`);
  if (Math.abs(根.y - 中央.y) >= 枠.高さ * 0.2)
    違反.push(`根の縦の中心 (${根.y}) が枠の中央 (${中央.y}) から枠の高さの 20% 以上ずれている`);
  return 違反;
}

const 枝分かれ図の根 = 軸を組む<根の位置>({
  名前: "枝分かれ図の根が図の中央から縦横とも 20% 以内にある",
  見本: "presetMindMap",
  下限: 1,
  待つ: 一拍待つ,
  /*
   * 根の名前は図の定義から導く (#1838)。 字で書くと、見本を開いた日から噛み合わなくなる。
   *
   * **字の位置は枠の座標に直してから比べる** (#1954)。 根の字の祖先には `translate(25 128)` を
   * 持つ `g` があり、字の `getBBox` はその移動を含まない局所の座標を返す。 局所の座標で比べていた
   * 間は、根を持つ箱ごと図の中で動いても字の値は変わらず、判定は気付けなかった。
   */
  // 外枠の中心は、局所の外枠の中心を直した点と一致する (向きを保つ変換で平行四辺形は中心に対して対称)
  測る: async (page) => {
    const 名 = 見本の根の名前();
    const 字 = (await 要素を測る(page, "text")).find((t) => t.字 === 名);
    if (!字) return { 枠: await 枠を読む(page), 根: null };
    const 外 = 枠の外枠へ(字.行列, 字.局所の外枠);
    return { 枠: await 枠を読む(page), 根: { x: 外.x + 外.幅 / 2, y: 外.y + 外.高さ / 2 } };
  },
  母数: ({ 根 }) => (根 ? 1 : 0),
  判定: 根の位置の違反,
  // 根の字の親の `g` を枠の幅の半分だけ右へ動かす。 字の局所の座標は変わらない崩れ
  壊す: (page) =>
    page.evaluate((名) => {
      const svg = document.querySelector('svg[role="img"]');
      const 幅 = Number(svg?.getAttribute("viewBox")?.split(/\s+/)[2] ?? 0);
      const 根 = Array.from(svg?.querySelectorAll("text") ?? []).find((t) => t.textContent === 名);
      const 親 = 根?.parentElement;
      if (!親) return;
      親.setAttribute(
        "transform",
        `${親.getAttribute("transform") ?? ""} translate(${幅 * 0.5} 0)`.trim(),
      );
    }, 見本の根の名前()),
});

const 折れ線の点の数 = 軸を組む<number[]>({
  名前: "折れ線グラフの線が、見本の値の数だけ点を持つ",
  見本: "presetChartLine",
  下限: 1,
  待つ: 一拍待つ,
  測る: (page) =>
    page.evaluate(() =>
      Array.from(document.querySelectorAll('[data-cdl-role="chart-line"]')).map(
        (p) => (p.getAttribute("points") ?? "").trim().split(/\s+/).filter(Boolean).length,
      ),
    ),
  母数: (線たち) => 線たち.length,
  判定: (線たち) => {
    const 値の数 = 見本の折れ線の値の数();
    return 線たち.flatMap((点の数, i) =>
      点の数 === 値の数
        ? []
        : [`線 ${i} の点が ${点の数} 個で、見本の値の数 (${値の数}) と合わない`],
    );
  },
  // 最後の点を落とす
  壊す: (page) =>
    page.evaluate(() => {
      const 線 = document.querySelector('[data-cdl-role="chart-line"]');
      if (!線) return;
      const 点たち = (線.getAttribute("points") ?? "").trim().split(/\s+/);
      線.setAttribute("points", 点たち.slice(0, -1).join(" "));
    }),
});

type 札 = 外枠 & { 字: string };

const 札を測る = async (page: Page, 役割: string): Promise<札[]> =>
  (await 要素を測る(page, `[data-cdl-role="${役割}"]`)).map((e) => ({
    ...枠の外枠へ(e.行列, e.局所の外枠),
    字: e.字,
  }));

/** 札は役割の印で選ぶ (#1838)。 字の形で探すと、見本を日本語に開いた日から 1 件も当たらない */
const 折れ線の札の重なり = 軸を組む<{ 値の札: 札[]; 軸の札: 札[] }>({
  名前: "折れ線グラフの値の札が横軸の札と重ならない",
  見本: "presetChartLine",
  下限: 折れ線の札の下限,
  待つ: 一拍待つ,
  測る: async (page) => ({
    値の札: await 札を測る(page, 折れ線の印.値の札),
    軸の札: await 札を測る(page, 折れ線の印.軸の札),
  }),
  // 値の札と軸の札の少ない方。 重なり 0 件は片方が空でも成り立つので、両方を数える
  母数: ({ 値の札, 軸の札 }) => Math.min(値の札.length, 軸の札.length),
  判定: ({ 値の札, 軸の札 }) =>
    値の札.flatMap((v) =>
      軸の札
        .filter(
          (a) => v.x < a.x + a.幅 && v.x + v.幅 > a.x && v.y < a.y + a.高さ && v.y + v.高さ > a.y,
        )
        .map((a) => `値の札 "${v.字}" が軸の札 "${a.字}" と重なる`),
    ),
  /*
   * 値の札を全て 1 つ目の軸の札の位置へ `translate` で動かす。 札の `x` と `y` は変わらない崩れ。
   * 動かす量は軸の札の外枠の角を札の局所の座標へ直して求める (札と軸の札が別の座標の系にいても重なる)
   */
  壊す: (page) =>
    page.evaluate((印) => {
      const svg = document.querySelector('svg[role="img"]');
      const 軸 = svg?.querySelector<SVGGraphicsElement>(`[data-cdl-role="${印.軸の札}"]`);
      const 軸から画面へ = 軸?.getScreenCTM();
      if (!svg || !軸 || !軸から画面へ) return;
      const 軸の外枠 = 軸.getBBox();
      svg.querySelectorAll<SVGGraphicsElement>(`[data-cdl-role="${印.値の札}"]`).forEach((札) => {
        const 画面から札へ = 札.getScreenCTM()?.inverse();
        if (!画面から札へ) return;
        const 角 = new DOMPoint(軸の外枠.x, 軸の外枠.y).matrixTransform(
          画面から札へ.multiply(軸から画面へ),
        );
        const 札の外枠 = 札.getBBox();
        札.setAttribute(
          "transform",
          `${札.getAttribute("transform") ?? ""} translate(${角.x - 札の外枠.x} ${角.y - 札の外枠.y})`.trim(),
        );
      });
    }, 折れ線の印),
});

type 箱と字 = { 箱たち: 測った要素[]; 字たち: 測った要素[] };

/**
 * 字を、字を含む最も近い `[data-cdl-node]` の箱と組にする。 箱を持たない持ち主の字は組まない。
 * 入れ子の箱の字は、外側の箱ではなく自分の箱と比べる
 */
function 字を箱と組む({
  箱たち,
  字たち,
}: 箱と字): { 字: string; 右端: number; 箱の右端: number }[] {
  return 字たち.flatMap((字) => {
    const 箱 = 箱たち.find((b) => b.持ち主 !== "" && b.持ち主 === 字.持ち主);
    if (!箱) return [];
    const 字の外枠 = 枠の外枠へ(字.行列, 字.局所の外枠);
    const 箱の外枠 = 枠の外枠へ(箱.行列, 箱.局所の外枠);
    return [{ 字: 字.字, 右端: 字の外枠.x + 字の外枠.幅, 箱の右端: 箱の外枠.x + 箱の外枠.幅 }];
  });
}

const 状態遷移図の字のはみ出し = 軸を組む<箱と字>({
  名前: "入れ子の状態遷移図の箱の字が、箱の横幅をはみ出さない",
  見本: "presetStateMachine2",
  下限: 1,
  待つ: 一拍待つ,
  測る: async (page) => ({
    箱たち: await 要素を測る(page, '[data-cdl-node] [data-cdl-role="node-body"]'),
    字たち: await 要素を測る(page, "[data-cdl-node] text"),
  }),
  母数: (値) => 字を箱と組む(値).length,
  判定: (値) =>
    字を箱と組む(値)
      .filter((t) => t.右端 > t.箱の右端 + 4)
      .map((t) => `"${t.字}" の右端 (${t.右端}) が箱の右端 (${t.箱の右端}) を超える`),
  // 1 つ目の箱の字を右へ 400 動かす。 字の `getBBox` は変わらず、画面の上で箱の外へ出る
  壊す: (page) => 変換を足す(page, "[data-cdl-node] text", "translate(400 0)", "最初"),
});

const フローの線の塗り = 軸を組む<string[]>({
  名前: "フローの線は塗らない",
  見本: "presetFlowchart",
  下限: 1,
  待つ: 線が出るまで待つ,
  測る: (page) =>
    page.evaluate(() =>
      Array.from(document.querySelectorAll('[data-cdl-role="edge-line"]')).map(
        (el) => getComputedStyle(el).fill,
      ),
    ),
  母数: (塗りたち) => 塗りたち.length,
  判定: (塗りたち) =>
    塗りたち
      .filter((塗り) => !/none|rgba?\(\s*0,\s*0,\s*0,\s*0/.test(塗り))
      .map((塗り) => `線が塗られている (${塗り})。 線が面に見える崩れの再発`),
  // 線を青で塗る
  壊す: (page) =>
    page.evaluate(() => {
      document.querySelectorAll('[data-cdl-role="edge-line"]').forEach((el) => {
        (el as SVGElement).style.fill = "#6ab3d8";
      });
    }),
});

/** 層 3 の全ての軸。 本番の検査と実証の検査はこの並びを回す */
export const 層3の軸たち: readonly 層3の軸[] = [
  工程表の矢印の向き,
  工程表の矢じりの隙間,
  絞り込み図の幅,
  枝分かれ図の根,
  折れ線の点の数,
  折れ線の札の重なり,
  状態遷移図の字のはみ出し,
  フローの線の塗り,
];
