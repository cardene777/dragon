import type { CdlDiagram, CdlNode } from "@cardenelabs/cdl";
import {
  THEMES,
  type DslTheme,
  棒を描く節か,
  意匠の棒の角,
} from "@cardenelabs/dragon";
import { 字を引く, type 二言語 } from "./bilingual";
import type { Locale } from "./i18n";

/**
 * 図の色味の切替 (#1569)。
 *
 * 15 種のどの図でも意匠を当てて見比べられるよう、図に意匠が書かれていない時も切替を出す (#2790)。
 *
 * 色は図に載せる名前を差し替え、画面側 (`cdl-theme.css`) が当てる。見本帳の字幅は
 * 配色へ依存せず、比例・等幅の広い方で先に組むため、ここでは載せ替えない (#2908)。
 *
 * 速さ (`playback-speed.ts`) / 描き方 (`redraw-mode.ts`) と同じ形にしてある。
 */

/**
 * 図に載せる名前と、画面に出す札 (#2460)。
 *
 * **値の側を key にする**。 札の字をそのまま値にしていた間、英語で開いても札だけ日本語で
 * 出ていた = 字を訳すと型と状態の値が同時に変わるため、訳す側だけを動かせなかった。
 */
const 値と札 = {
  kinari: { ja: "生成りに茶", en: "Ecru and brown" },
  celadon: { ja: "青磁に墨", en: "Celadon and ink" },
  blueprint: { ja: "図面", en: "Blueprint" },
  letterpress: { ja: "活版", en: "Letterpress" },
  catalog: { ja: "図録", en: "Catalog" },
  terminal: { ja: "端末", en: "Terminal" },
  sketch: { ja: "手描き", en: "Sketch" },
  neon: { ja: "電飾", en: "Neon" },
  relief: { ja: "浮彫", en: "Relief" },
} as const satisfies Record<DslTheme, 二言語>;

/** 画面に出す意匠は記法が受ける正の名前から導く (#2790)。 */
export const 配色の選択肢: readonly DslTheme[] = THEMES;

/** 図の `palette` を外し、site の色で描く選択。 意匠の一覧には含めない。 */
export const 画面の色 = "site-colours" as const;

export type 配色 = DslTheme | typeof 画面の色;
/** `null` は選んでいない状態で、図に書かれた意匠をそのまま使う。 */
export type 配色の選択 = 配色 | null;

function 棒の角を当てる(node: CdlNode, theme: DslTheme | undefined): CdlNode {
  if (!棒を描く節か(node)) return node;

  const target = theme === undefined ? undefined : 意匠の棒の角(theme, node);
  const same = target === undefined
    ? !Object.hasOwn(node, "barCornerRadii")
    : node.barCornerRadii?.topLeft === target.topLeft &&
      node.barCornerRadii.topRight === target.topRight &&
      node.barCornerRadii.bottomRight === target.bottomRight &&
      node.barCornerRadii.bottomLeft === target.bottomLeft;
  if (same) return node;

  const next = { ...node };
  if (target === undefined) delete next.barCornerRadii;
  else next.barCornerRadii = target;
  return next;
}

/** 宅配の表は骨組みを変えず、元の意匠に縞が無かった浮彫・電飾だけ模様を外す。 */
function 宅配表の縞を当てる<T extends CdlDiagram>(diagram: T, theme: DslTheme | undefined): T["nodes"] {
  if (diagram.id !== "delivery-relations-demo" && diagram.id !== "delivery-classes-demo") {
    return diagram.nodes;
  }

  const rowStripe = theme !== "relief" && theme !== "neon";
  return diagram.nodes.map((node) =>
    node.kind === "storage" && node.rowStripe !== rowStripe
      ? { ...node, rowStripe }
      : node,
  );
}

/** 画面に出す札を引く */
export function 配色の札(配色: DslTheme, locale: Locale): string {
  return 字を引く(値と札[配色], locale);
}

/** 意匠を図から外す選択の札。 */
export function 画面の色の札(locale: Locale): string {
  return locale === "ja" ? "画面の色" : "Site colours";
}

/**
 * 押されている札。 未選択なら図に書かれた意匠、それも無ければ画面の色を返す。
 */
export function 押される配色(diagram: CdlDiagram, 選択: 配色の選択): 配色 {
  if (選択 !== null) return 選択;
  return (THEMES as readonly string[]).includes(diagram.palette ?? "")
    ? (diagram.palette as DslTheme)
    : 画面の色;
}

/**
 * 図の配色を差し替える。
 *
 * **未選択では元の object をそのまま返す**。 新しい object を返すと `CdlDiagramView` が
 * 別の図を渡されたとみなして描き直し、切替を触っていない図が最初へ戻る
 * (`playback-speed.ts` と同じ理由)。
 *
 * `textMetrics` は触らない。dragon の組み立てと見本帳の直接記述は配置前に `"widest"` を
 * 当てており、切替はその値を保つ。
 */
export function 図の配色を変える<T extends CdlDiagram>(diagram: T, 選択: 配色の選択): T {
  if (選択 === null) return diagram;

  const 次の配色 = 選択 === 画面の色 ? undefined : 選択;
  const 配色が同じ = 次の配色 === undefined
    ? !Object.hasOwn(diagram, "palette")
    : diagram.palette === 次の配色;
  const 次の棒角の節 = diagram.nodes.map((node) => 棒の角を当てる(node, 次の配色));
  const 次の縞の節 = 宅配表の縞を当てる({ ...diagram, nodes: 次の棒角の節 }, 次の配色);
  const 棒の角が同じ = diagram.nodes.every((node, index) => 次の棒角の節[index] === node);
  const 縞が同じ = 次の棒角の節.every((node, index) => 次の縞の節[index] === node);
  if (
    配色が同じ &&
    棒の角が同じ &&
    縞が同じ
  ) return diagram;

  const 次: T = { ...diagram };
  if (次の配色 === undefined) delete 次.palette;
  else 次.palette = 次の配色;
  if (!棒の角が同じ || !縞が同じ) {
    次.nodes = 次の縞の節;
  }
  return 次;
}
