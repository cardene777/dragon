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

/** `path` の `d` (`M` / `L` のみ) から点の並びを読む */
export function 点を読む(d: string): 点[] {
  const 点たち: 点[] = [];
  const 字たち = d.trim().split(/[\s,]+/);
  for (let i = 0; i < 字たち.length; i++) {
    const 字 = 字たち[i];
    if (字 === "M" || 字 === "L") {
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
 * 流れ図の線が出るまで待つ (#1479)。
 *
 * 矢印は段に合わせて出るので、開いた直後は 1 本も描かれていない。
 * **見えているかは待たない** (`state: "attached"`)。 線は段の進みで長さが 0 になる瞬間があり、
 * 「見えるまで」 だとその瞬間に当たった回が時間切れになる。 読むのは塗りの指定なので DOM に在れば足りる。
 */
async function 線が出るまで待つ(page: Page): Promise<void> {
  await page.waitForSelector('[data-cdl-role="edge-line"]', { state: "attached", timeout: 15_000 });
}

/** 工程表の依存の矢印の線 (`Z` で閉じない `path`) */
const 工程表の矢印の向き = 軸を組む<string[]>({
  名前: "工程表の依存の矢印は右へ出て、着く先の帯の左辺へ水平に着く",
  見本: "presetGantt",
  下限: 1,
  待つ: 矢印が出るまで待つ,
  測る: (page) =>
    page.evaluate(() =>
      Array.from(document.querySelectorAll('[data-cdl-role="gantt-arrow"] path'))
        .map((p) => p.getAttribute("d") ?? "")
        .filter((d) => !d.includes("Z")),
    ),
  母数: (線たち) => 線たち.length,
  判定: (線たち) =>
    線たち.flatMap((d) => {
      const 点たち = 点を読む(d);
      // 経路は 2 通り (`kinds/gantt.tsx § dependsOn arrow`)。 間が空いていれば直接折れる 4 点、
      // 帯が近ければ回り込む 6 点。 共通して守るのは「1 段目は水平に右」 と「終端は水平に着く」
      if (点たち.length !== 4 && 点たち.length !== 6) {
        return [`点の数が 4 (直接折れる) でも 6 (回り込む) でもない (${点たち.length} 点): ${d}`];
      }
      const 始 = 点たち[0]!;
      const 次 = 点たち[1]!;
      const 先 = 点たち[点たち.length - 1]!;
      const 手前 = 点たち[点たち.length - 2]!;
      const 違反: string[] = [];
      if (次.x < 始.x) 違反.push(`1 段目が左へ出ている: ${d}`);
      if (Math.abs(次.y - 始.y) >= 1) 違反.push(`1 段目が水平でない: ${d}`);
      if (Math.abs(先.y - 手前.y) >= 1) 違反.push(`終端が水平に着いていない: ${d}`);
      if (Math.abs(先.x - 手前.x) >= 40) 違反.push(`終端が折れ目から 40px 以上離れている: ${d}`);
      return 違反;
    }),
  // 1 本目の線の 2 点目を 10 下げる = 1 段目が水平でなくなる
  壊す: (page) =>
    page.evaluate(() => {
      const 線 = Array.from(document.querySelectorAll('[data-cdl-role="gantt-arrow"] path')).find(
        (p) => !(p.getAttribute("d") ?? "").includes("Z"),
      );
      if (!線) return;
      const 字たち = (線.getAttribute("d") ?? "").trim().split(/[\s,]+/);
      const i = 字たち.indexOf("L");
      const y = 字たち[i + 2];
      if (i < 0 || y === undefined) return;
      字たち[i + 2] = String(parseFloat(y) + 10);
      線.setAttribute("d", 字たち.join(" "));
    }),
});

type 帯 = { 左: number; 上: number; 高さ: number };

/** 工程表の依存の矢じり (`Z` で閉じる 3 点の `path`) */
const 工程表の矢じりの隙間 = 軸を組む<{ 帯たち: 帯[]; 矢じりたち: string[] }>({
  名前: "工程表の矢じりの先が、着く先の帯の左辺から 4px 以上外にある",
  見本: "presetGantt",
  下限: 1,
  待つ: 矢印が出るまで待つ,
  測る: (page) =>
    page.evaluate(() => ({
      帯たち: Array.from(document.querySelectorAll('[data-cdl-role="gantt-bar"]')).map((b) => ({
        左: parseFloat(b.getAttribute("x") ?? "0"),
        上: parseFloat(b.getAttribute("y") ?? "0"),
        高さ: parseFloat(b.getAttribute("height") ?? "0"),
      })),
      矢じりたち: Array.from(document.querySelectorAll('[data-cdl-role="gantt-arrow"] path'))
        .map((p) => p.getAttribute("d") ?? "")
        .filter((d) => d.includes("Z")),
    })),
  母数: ({ 矢じりたち }) => 矢じりたち.filter((d) => 点を読む(d).length === 3).length,
  判定: ({ 帯たち, 矢じりたち }) =>
    矢じりたち.flatMap((d) => {
      const 点たち = 点を読む(d);
      if (点たち.length !== 3) return [];
      const 先の右端 = Math.max(...点たち.map((p) => p.x));
      const 先の高さ = 点たち.reduce((和, p) => 和 + p.y, 0) / 点たち.length;
      const 着く帯 = 帯たち.find((b) => 先の高さ >= b.上 && 先の高さ <= b.上 + b.高さ);
      if (!着く帯) return [`矢じりの高さ ${先の高さ} に着く帯が無い: ${d}`];
      const 隙間 = 着く帯.左 - 先の右端;
      return 隙間 < 4
        ? [
            `矢じりの先 (x=${先の右端}) と帯の左辺 (x=${着く帯.左}) の隙間が ${隙間}px (負は食い込み)`,
          ]
        : [];
    }),
  // 矢じりを右へ 20 動かす = 帯の中へ食い込む
  壊す: (page) =>
    page.evaluate(() => {
      document.querySelectorAll('[data-cdl-role="gantt-arrow"] path').forEach((p) => {
        const d = p.getAttribute("d") ?? "";
        if (!d.includes("Z")) return;
        p.setAttribute(
          "d",
          d.replace(
            /([ML])\s+([\d.]+)\s+([\d.]+)/g,
            (_, 命令, x, y) => `${命令} ${parseFloat(x) + 20} ${y}`,
          ),
        );
      });
    }),
});

const 絞り込み図の幅 = 軸を組む<number[]>({
  名前: "絞り込み図の段の幅が上から下へ減っていく",
  見本: "presetFunnel",
  下限: 2,
  待つ: 一拍待つ,
  測る: (page) =>
    page.evaluate(() =>
      Array.from(document.querySelectorAll('[data-cdl-role="funnel-stage"]')).map(
        (el) => (el as SVGGraphicsElement).getBBox().width,
      ),
    ),
  母数: (幅たち) => 幅たち.length,
  判定: (幅たち) =>
    幅たち.flatMap((今, i) => {
      const 前 = 幅たち[i - 1];
      return 前 !== undefined && 今 > 前 + 0.5
        ? [`段 ${i} の幅 (${今}) が段 ${i - 1} の幅 (${前}) より広い`]
        : [];
    }),
  // 最後の段を幅 800 に広げる
  壊す: (page) =>
    page.evaluate(() => {
      const 段たち = document.querySelectorAll('[data-cdl-role="funnel-stage"]');
      const 最後 = 段たち[段たち.length - 1];
      if (段たち.length < 2 || !最後) return;
      const ys = (最後.getAttribute("points") ?? "")
        .split(/\s+/)
        .map((p) => p.split(",")[1] ?? "0");
      最後.setAttribute(
        "points",
        [`0,${ys[0]}`, `800,${ys[1]}`, `800,${ys[2]}`, `0,${ys[3]}`].join(" "),
      );
    }),
});

/** 図の枠 (`viewBox`) と、根の字の中心を枠の座標で測った位置 */
export type 根の位置 = { 枠: { x: number; y: number; 幅: number; 高さ: number }; 根: 点 | null };

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
  測る: (page) =>
    page.evaluate((名) => {
      const svg = document.querySelector<SVGSVGElement>('svg[role="img"]');
      const [x = 0, y = 0, 幅 = 0, 高さ = 0] = (svg?.getAttribute("viewBox") ?? "")
        .split(/\s+/)
        .map(Number);
      const 枠 = { x, y, 幅, 高さ };
      const 根 = Array.from(svg?.querySelectorAll("text") ?? []).find((t) => t.textContent === 名);
      const 枠へ = svg?.getScreenCTM()?.inverse();
      const 字から画面へ = 根?.getScreenCTM();
      if (!根 || !枠へ || !字から画面へ) return { 枠, 根: null };
      const bb = 根.getBBox();
      const 中心 = new DOMPoint(bb.x + bb.width / 2, bb.y + bb.height / 2).matrixTransform(
        枠へ.multiply(字から画面へ),
      );
      return { 枠, 根: { x: 中心.x, y: 中心.y } };
    }, 見本の根の名前()),
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

type 札 = { x: number; y: number; w: number; h: number; 字: string };

/** 札は役割の印で選ぶ (#1838)。 字の形で探すと、見本を日本語に開いた日から 1 件も当たらない */
const 折れ線の札の重なり = 軸を組む<{ 値の札: 札[]; 軸の札: 札[] }>({
  名前: "折れ線グラフの値の札が横軸の札と重ならない",
  見本: "presetChartLine",
  下限: 折れ線の札の下限,
  待つ: 一拍待つ,
  測る: (page) =>
    page.evaluate((印) => {
      const svg = document.querySelector('svg[role="img"]');
      const 測る = (役割: string) =>
        Array.from(svg?.querySelectorAll(`[data-cdl-role="${役割}"]`) ?? []).map((e) => {
          const bb = (e as SVGGraphicsElement).getBBox();
          return { x: bb.x, y: bb.y, w: bb.width, h: bb.height, 字: e.textContent ?? "" };
        });
      return { 値の札: 測る(印.値の札), 軸の札: 測る(印.軸の札) };
    }, 折れ線の印),
  // 値の札と軸の札の少ない方。 重なり 0 件は片方が空でも成り立つので、両方を数える
  母数: ({ 値の札, 軸の札 }) => Math.min(値の札.length, 軸の札.length),
  判定: ({ 値の札, 軸の札 }) =>
    値の札.flatMap((v) =>
      軸の札
        .filter((a) => v.x < a.x + a.w && v.x + v.w > a.x && v.y < a.y + a.h && v.y + v.h > a.y)
        .map((a) => `値の札 "${v.字}" が軸の札 "${a.字}" と重なる`),
    ),
  // 値の札を全て 1 つ目の軸の札の位置へ動かす
  壊す: (page) =>
    page.evaluate((印) => {
      const svg = document.querySelector('svg[role="img"]');
      const 軸 = svg?.querySelector(`[data-cdl-role="${印.軸の札}"]`);
      if (!svg || !軸) return;
      svg.querySelectorAll(`[data-cdl-role="${印.値の札}"]`).forEach((t) => {
        t.setAttribute("x", 軸.getAttribute("x") ?? "0");
        t.setAttribute("y", 軸.getAttribute("y") ?? "0");
      });
    }, 折れ線の印),
});

type 箱の字 = { 字: string; 右端: number; 箱の幅: number };

const 状態遷移図の字のはみ出し = 軸を組む<箱の字[]>({
  名前: "入れ子の状態遷移図の箱の字が、箱の横幅をはみ出さない",
  見本: "presetStateMachine2",
  下限: 1,
  待つ: 一拍待つ,
  測る: (page) =>
    page.evaluate(() =>
      Array.from(document.querySelectorAll("[data-cdl-node]")).flatMap((g) => {
        const 箱 = g.querySelector('[data-cdl-role="node-body"]');
        if (!箱) return [];
        const 箱の幅 = parseFloat(箱.getAttribute("width") ?? "0");
        return Array.from(g.querySelectorAll("text")).map((t) => {
          const bb = (t as SVGGraphicsElement).getBBox();
          return { 字: t.textContent ?? "", 右端: bb.x + bb.width, 箱の幅 };
        });
      }),
    ),
  母数: (字たち) => 字たち.length,
  判定: (字たち) =>
    字たち
      .filter((t) => t.右端 > t.箱の幅 + 4)
      .map((t) => `"${t.字}" の右端 (${t.右端}) が箱の幅 (${t.箱の幅}) を超える`),
  // 1 つ目の箱の字を長い文に替える (SVG の字は折り返さないのではみ出す)
  壊す: (page) =>
    page.evaluate(() => {
      const 字 = document.querySelector("[data-cdl-node] text");
      if (字)
        字.textContent = "箱の幅を大きく超えるほど長い文を入れて、字が箱の外へはみ出す形を作る";
    }),
});

const 流れ図の線の塗り = 軸を組む<string[]>({
  名前: "流れ図の線は塗らない",
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
  流れ図の線の塗り,
];
