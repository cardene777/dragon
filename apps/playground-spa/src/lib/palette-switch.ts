import type { CdlDiagram } from "@cardenelabs/cdl";
import { THEMES, type DslTheme, 意匠の字の測り方 } from "@cardenelabs/dragon";
import { 字を引く, type 二言語 } from "./bilingual";
import type { Locale } from "./i18n";

/**
 * 図の色味の切替 (#1569)。
 *
 * 15 種のどの図でも意匠を当てて見比べられるよう、図に意匠が書かれていない時も切替を出す (#2790)。
 *
 * 色は図に載せる名前を差し替え、画面側 (`cdl-theme.css`) が当てる。端末は字の測り方も
 * 等幅へ変わるため、配色と測り方を載せ替えた図を描き手へ渡す。`CdlDiagramView` は新しい
 * 図を受け取ると `layout()` をやり直し、箱・札・縦列の隙間を組み立て直す (#2818)。
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
 * 図の配色と字の測り方を差し替える (#2818)。
 *
 * **未選択では元の object をそのまま返す**。 新しい object を返すと `CdlDiagramView` が
 * 別の図を渡されたとみなして描き直し、切替を触っていない図が最初へ戻る
 * (`playback-speed.ts` と同じ理由)。
 *
 * 端末では `textMetrics` を等幅へ替えて配置を測り直す。端末から外す時は key ごと消し、
 * 描き手の既定である比例の測り方へ戻す。
 */
export function 図の配色を変える(diagram: CdlDiagram, 選択: 配色の選択): CdlDiagram {
  if (選択 === null) return diagram;

  const 次の配色 = 選択 === 画面の色 ? undefined : 選択;
  const 次の測り方 = 選択 === 画面の色 ? undefined : 意匠の字の測り方(選択);
  const 配色が同じ = 次の配色 === undefined
    ? !Object.hasOwn(diagram, "palette")
    : diagram.palette === 次の配色;
  const 測り方が同じ = 次の測り方 === undefined
    ? !Object.hasOwn(diagram, "textMetrics")
    : diagram.textMetrics === 次の測り方;
  type 段の見出し = NonNullable<NonNullable<CdlDiagram["lanes"]>[number]["stage"]>["header"];
  type 見出しを持つ図 = CdlDiagram & {
    stageHeaders?: Partial<Record<DslTheme, 段の見出し>>;
  };
  const 見出しの表 = (diagram as 見出しを持つ図).stageHeaders;
  const 次の見出し = 次の配色 === undefined ? undefined : 見出しの表?.[次の配色];
  const 見出しが同じ = diagram.lanes.every((lane) =>
    lane.stage === undefined || lane.stage.header === 次の見出し,
  );
  if (配色が同じ && 測り方が同じ && 見出しが同じ) return diagram;

  const 次 = { ...diagram };
  if (次の配色 === undefined) delete 次.palette;
  else 次.palette = 次の配色;
  if (次の測り方 === undefined) delete 次.textMetrics;
  else 次.textMetrics = 次の測り方;
  if (見出しの表 !== undefined) {
    次.lanes = diagram.lanes.map((lane) => {
      if (lane.stage === undefined) return lane;
      const stage = { ...lane.stage };
      if (次の見出し === undefined) delete stage.header;
      else stage.header = 次の見出し;
      return { ...lane, stage };
    });
  }
  return 次;
}
