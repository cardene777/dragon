import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router";
import { CdlDiagramView, layout } from "@cardenelabs/cdl";
import * as Dialog from "@radix-ui/react-dialog";
import { Check, Copy, Maximize2, Search, X } from "lucide-react";
import { CATEGORIES } from "@/lib/catalog";
import { loadPartsItems, 選んだ見本, type CatalogItem } from "@/lib/catalog-items";
import { useCategoryItems, 部品の読込を見せる, type 部品の読込結果 } from "./category-items";
import {
  今の見せ方,
  開いた時の見せ方,
  type 見せ方,
  type 見せ方の持ち主,
} from "./category-view-state";
import { CATALOG_HANDLERS } from "@/lib/catalog-handlers";
import { itemName, itemNameEn, itemNameJa } from "@/lib/i18n";
import { useLocale } from "@/lib/useLocale";
import { SiteHeader } from "@/components/SiteHeader";
import { InViewMount } from "@/components/InViewMount";
import { PhaseChrome } from "@/components/PhaseChrome";
import { DiagramZoomControls } from "@/components/DiagramZoomControls";
import { useDiagramPanZoom } from "@/components/useDiagramPanZoom";
import {
  図の速さを変える,
  記法の速さを変える,
  速さの選択肢,
  type 速さ,
} from "@/lib/playback-speed";
import {
  図ごとの既定の描き方,
  図の描き方を変える,
  描き方の切替を出すか,
  記法の描き方を変える,
  描き方の選択肢,
  既定の描き方,
  type 描き方,
} from "@/lib/redraw-mode";
import {
  図の配色を変える,
  配色を選べる,
  配色の選択肢,
} from "@/lib/palette-switch";
import { 図に画面の言語を当てる } from "@/lib/diagram-lang";
import {
  図の折れ線の見せ方を変える,
  折れ線を選べる,
  折れ線の見せ方の選択肢,
} from "@/lib/chart-line-options";
import {
  図の円の見せ方を変える,
  円の見せ方を選べる,
  円の見せ方の選択肢,
} from "@/lib/chart-pie-options";
import {
  図の傾きの見せ方を変える,
  傾きの見せ方を選べる,
  傾きの見せ方の選択肢,
} from "@/lib/chart-slope-options";

import {
  収める,
  次の倍率,
  svgの幅,
  type 倍率の指定,
} from "@/lib/diagram-zoom";

import { SyntaxCode } from "../components/SyntaxCode";
/**
 * 並べて見る側で巻き取る要素 (#1961)。 台 (`.catalog-preview-stage`) は段の札を置く基準なので巻き取らせず、
 * 内側に巻き取らせる (理由は `catalog-new.css` の #1749 の節)
 */
function 並びの巻き取りを探す(器: HTMLElement): HTMLElement | null {
  const 内側 = 器.querySelector(".catalog-preview-stage-inner");
  return 内側 instanceof HTMLElement ? 内側 : null;
}

/** source 記法 tab (人向け YAML / LLM 向け JSON、 dragon package 2 記法の dogfood 表示) */
type SourceTab = "yaml" | "json";

/** プレビューの表示切替 (図 / コード) */
type PreviewTab = "diagram" | "source";

/** copy-to-clipboard button (2 秒間 チェック表示) */
function CopyButton({ text }: { text: string }): React.ReactElement {
  const [copied, setCopied] = useState(false);
  const doCopy = async (): Promise<void> => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // silent fail (browser permission 拒否等、 clipboard API 不可時)
    }
  };
  return (
    <button
      type="button"
      onClick={() => {
        void doCopy();
      }}
      aria-label={copied ? "コピー完了" : "コードをコピー"}
      className="catalog-source-copy"
    >
      {copied ? <Check size={13} /> : <Copy size={13} />}
      <span>{copied ? "コピーしました" : "コードをコピー"}</span>
    </button>
  );
}

/**
 * その見本が記法を持つか (#1383)。
 *
 * **タブの有効と無効はこの 1 つの判定だけで決まる**。 呼出が 2 箇所 (`SourceTabs` の
 * 早期 return と「コード」 のタブの `disabled`) にあり、条件を書き写すと片方だけ変わる。
 *
 * 検査はここを出どころにして、記法を持たない見本を自分で組み立てる = 実在のページに
 * 依存しない。 実在のページを名指しする形は、そのページに記法を足すたびに成立しなくなり、
 * 3 度移した末に移し先が尽きた (#1378 / #1374 / #1381)。
 */
export function 記法を持つか(
  item: Pick<CatalogItem, "sourceYaml" | "sourceJson"> | null | undefined,
): boolean {
  // **無い見本も受ける**。 `parts` は一覧を後から読むため、選んでいる見本が `null` の
  // 時間がある。 呼出側で分けると片方だけ書き忘れて、その間だけ画面が落ちる (実測)
  return Boolean(item?.sourceYaml || item?.sourceJson);
}

/**
 * source 記法 tab section (YAML / JSON 切替、 source なしの場合は表示しない)。
 *
 * `hidden` は **外さずに隠す**。 外すと記法の選択 (yaml / json) が毎回 yaml へ戻り、
 * 図とコードを往復しながら比べる時に選び直すことになる。
 *
 * **検査から描けるように export する** (#1383)。 記法を持たない見本と、片方だけ持つ
 * 見本を検査側が組み立てて、押せる側が変わることを確かめる。
 */
export function SourceTabs({
  item,
  hidden,
  速さ,
  描き方,
}: {
  /** 変種を選んでいる時はその記法を出す (#1696)。 元の見本の記法とは中身が違う */
  item: Pick<CatalogItem, "sourceYaml" | "sourceJson">;
  hidden?: boolean;
  /** 画面で選んだ再生速度 (#1355)。 出す秒数をこれに合わせる */
  速さ: 速さ;
  /** 画面で選んだ 2 段目以降の描き方 (#1359)。 出す描く指定をこれに合わせる */
  描き方: 描き方;
}): React.ReactElement | null {
  const [tab, setTab] = useState<SourceTab>("yaml");
  if (!記法を持つか(item)) return null;
  const 元 = tab === "yaml" ? item.sourceYaml : item.sourceJson;
  // 見ている図と同じ速さの秒数を出す (#1355)。 元のままだと、写したコードが画面と違う
  // 速さで動く
  // 見ている図と同じ形のコードを出す (#1355 / #1359)。 元のままだと、写したコードが画面と
  // 違う速さ / 違う描き方で動く。 **順序は図の側と同じ** = 描き方を先に反映してから速さを掛ける
  const activeSource =
    元 === undefined
      ? undefined
      : 記法の速さを変える(記法の描き方を変える(元, 描き方, tab), 速さ, tab);
  return (
    <section className="catalog-source-section" aria-label="この図の記法" hidden={hidden}>
      <div className="catalog-source-tabs" role="tablist">
        <button
          role="tab"
          type="button"
          aria-selected={tab === "yaml"}
          className={`catalog-source-tab ${tab === "yaml" ? "is-active" : ""}`}
          onClick={() => setTab("yaml")}
          disabled={!item.sourceYaml}
          title="YAML (人向け)"
        >
          yaml
        </button>
        <button
          role="tab"
          type="button"
          aria-selected={tab === "json"}
          className={`catalog-source-tab ${tab === "json" ? "is-active" : ""}`}
          onClick={() => setTab("json")}
          disabled={!item.sourceJson}
          title="JSON (LLM 向け)"
        >
          json
        </button>
        {activeSource && <CopyButton text={activeSource} />}
      </div>
      {activeSource === undefined ? (
        <pre className="catalog-source-code" data-lang={tab}>
          <code>(この図の記法はまだ登録されていません)</code>
        </pre>
      ) : (
        // 色は分解器と `styles/syntax.css` が持つ (#1310)。 ここでは種別だけを渡す
        <SyntaxCode
          src={activeSource}
          種別={tab === "json" ? "json" : "記法"}
          className="catalog-source-code"
          data-lang={tab}
        />
      )}
    </section>
  );
}

/**
 * catalog の図をエディタで開く時の hash。 記法が無ければ `null`。
 *
 * `#preset=<id>` は使わない。 あれはエディタの見本から slug を引く仕組みで、 catalog の図は
 * そこに無く、 押しても既定の見本が出るだけになる (実機で確認)。
 */
function catalogEditorHash(item: { sourceYaml?: string; sourceJson?: string }): string | null {
  // **記法だけを渡す**。 `#s=` はエディタの記法欄に入るので、 JSON を流すと読めずに落ちる
  // (review 指摘)。 記法を持たない図は開けない扱いにする
  const src = item.sourceYaml;
  if (!src) return null;
  try {
    return `#s=${btoa(unescape(encodeURIComponent(src)))}`;
  } catch {
    return null;
  }
}

/**
 * `/catalog/:slug` の画面。 2 列で並べる。
 *
 * 左 (`catalog-sidebar`) は検索と項目の一覧、右は選んだ項目の図と詳細。 図は拡大表示で開ける。
 * 見出しの上に、分類の名前と件数と、一覧へ戻る道筋を置く。
 */
export function CategoryPage(): React.ReactElement {
  const params = useParams<{ slug: string }>();
  const [locale] = useLocale();
  const [modalItem, setModalItem] = useState<CatalogItem | null>(null);
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [previewTab, setPreviewTab] = useState<PreviewTab>("diagram");
  // 見せ方 7 つ (速さ / 描き方 / 配色 / 折れ線 / 円 / 傾き / パターン) は
  // 見ている項目が決まってから持つ (下の `見せ方の状態`、#2022)
  // シーンの表示は engine が入れ物へ書く属性を読むため、要素そのものが要る (#1239)
  const [stageEl, setStageEl] = useState<HTMLElement | null>(null);
  const [modalStageEl, setModalStageEl] = useState<HTMLElement | null>(null);

  const displayName = (item: CatalogItem): string => itemName(item.title, locale);

  const category = CATEGORIES.find((c) => c.slug === params.slug);
  // parts は CATALOG_ITEMS で empty placeholder、 useEffect で dynamic import 経由 populate (CAR-1613)
  // 持つのは読み込みの結果だけで、一覧の欄に出す状態 (idle / loading / loaded / error) は
  // 縦列と結果から導く (#2018、理由は `category-items.ts` が持つ)
  const [partsItems, setPartsItems] = useState<CatalogItem[]>([]);
  const [partsLoadResult, setPartsLoadResult] = useState<部品の読込結果>(null);
  useEffect(() => {
    if (params.slug !== "parts") return;
    let cancelled = false;
    loadPartsItems()
      .then((loaded) => {
        if (!cancelled) {
          setPartsItems(loaded);
          setPartsLoadResult("loaded");
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          // chunk fetch 失敗 (ネットワーク瞬断 / ad blocker / cache 古い tab 等) を可視化
          // console にも残す = user が devtools で原因把握できる
           
          console.error("[CAR-1613] parts.cdl chunk fetch failed", err);
          setPartsLoadResult("error");
        }
      });
    return () => {
      cancelled = true;
      // 部品の頁を離れる時に結果を空へ戻す。 戻った時に前回の失敗を出さず、読み込み中から始める
      setPartsLoadResult(null);
    };
  }, [params.slug]);
  const partsLoadState = 部品の読込を見せる(params.slug, partsLoadResult);
  // 同じ縦列と同じ部品の一覧なら同じ配列が返る (`category-items.ts` が理由を持つ)
  const items = useCategoryItems(params.slug, partsItems);

  const filtered = useMemo(() => {
    if (!query.trim()) return items;
    const q = query.toLowerCase();
    return items.filter((item) => {
      // **画面に出ている名前で引けること** が要る。 日本語名だけを見ていると、
      // 英語表示で見えている名前を打っても消える (実測 = `Medical triage` が引けなかった)
      const ja = itemNameJa(item.title).toLowerCase();
      const en = itemNameEn(item.title).toLowerCase();
      return (
        item.title.toLowerCase().includes(q) ||
        item.subtitle.toLowerCase().includes(q) ||
        item.id.toLowerCase().includes(q) ||
        ja.includes(q) ||
        en.includes(q)
      );
    });
  }, [items, query]);

  const currentItem = useMemo(() => {
    if (selectedId) return items.find((i) => i.id === selectedId) ?? filtered[0] ?? null;
    return filtered[0] ?? null;
  }, [filtered, items, selectedId]);

  const 見ている項目 = currentItem?.id ?? null;
  /**
   * 描き方の初期値だけは図ごとに違う (#1690)。 弧は継ぎ足すと起点を見失うので描き直しから始める。
   *
   * **元の見本から導く** (`見本` ではない)。 これは「その項目を開いた時の既定」 で、
   * 選んだパターンから導くと、パターンを押しただけで既定そのものが動く。
   */
  const この図の描き方 = currentItem ? 図ごとの既定の描き方(currentItem.diagram) : 既定の描き方;
  /**
   * 見ている 1 件だけに効く見せ方 7 つ (#1355 / #1359 / #1569 / #1624 / #1645 / #1659 / #1696)。
   *
   * **どの項目の見せ方かを一緒に持ち、描く時に読み替える** (#2022)。 項目を選び直したら既定へ
   * 戻す必要があるが、効果で戻すと選び直した最初の 1 コマが前の項目の見せ方で描かれる
   * (描き方の既定は図ごとに違うので、何も触っていない人にも出る)。 読み替えなら 1 コマ目から
   * 新しい既定になり、戻し忘れも起きない。
   *
   * 同じ画面の拡大表示の倍率 (#1745) と並びの倍率 (#1749) が既に同じ形。
   */
  const [見せ方の状態, set見せ方の状態] = useState<見せ方の持ち主>({
    項目: null,
    値: 開いた時の見せ方(既定の描き方),
  });
  const 見せ方 = useMemo(
    () => 今の見せ方(見せ方の状態, 見ている項目, この図の描き方),
    [見せ方の状態, 見ている項目, この図の描き方],
  );
  const { 速さ, 描き方, 配色, 折れ線, 円, 傾き, パターン } = 見せ方;
  /**
   * 見せ方を書き換える。
   *
   * **土台は読み替えた後の値**。 持っている値をそのまま土台にすると、別の項目で選んだ設定が
   * 選び直した先へ持ち越される。
   */
  const 見せ方を置く = (変更: Partial<見せ方>): void => {
    set見せ方の状態((前) => ({
      項目: 見ている項目,
      値: { ...今の見せ方(前, 見ている項目, この図の描き方), ...変更 },
    }));
  };
  /**
   * 一覧から項目を選ぶ。
   *
   * **見せ方も同じ操作で既定へ戻す** (#1624)。 読み替えだけだと、別の見本を挟んで同じ見本へ
   * 戻った時に持ち主が再び一致し、前に選んだ見せ方が復活する。 「見本を選び直すと切へ戻る」
   * 約束を保つには、選ぶ操作そのもので戻す必要がある。
   *
   * 押した時に戻すので、効果と違って選び直した最初の描画から既定になる (#2022)。
   * 押さずに見ている項目が変わる経路 (絞り込みで先頭が変わる / 部品の一覧を後から読む) は
   * 読み替えが受け持つ。
   */
  const 項目を選ぶ = (item: CatalogItem): void => {
    setSelectedId(item.id);
    set見せ方の状態({ 項目: item.id, 値: 開いた時の見せ方(図ごとの既定の描き方(item.diagram)) });
  };
  /**
   * 画面に出している見本 (#1696)。 パターンを選んでいればその中身、無ければ元の見本。
   * 図もコードも拡大もここから引く = 引く先が分かれると、選んだものと違う中身が出る。
   */
  const 見本 = 選んだ見本(currentItem, パターン);

  // 段の長さに倍率を掛けた図。 既定 (1 倍) では元の object がそのまま返るので、
  // 速さを触っていない図は描き直されない
  const 図 = useMemo(
    () =>
      見本
        ? 図の傾きの見せ方を変える(
            図の円の見せ方を変える(
              図の折れ線の見せ方を変える(
                図の配色を変える(
                  図の速さを変える(図の描き方を変える(図に画面の言語を当てる(見本.diagram, locale), 描き方), 速さ),
                  配色,
                ),
                折れ線,
              ),
              円,
            ),
            傾き,
          )
        : null,
    [見本, locale, 速さ, 描き方, 配色, 折れ線, 円, 傾き],
  );
  // 拡大表示も同じ速さで出す。 開く元が今見ている項目なので、別の速さになると混乱する
  // 拡大も選んだパターンの中身を出す (#1696)。 元に戻すと、押した図と違うものが開く
  const 拡大の図 = useMemo(
    () =>
      modalItem && 見本
        ? 図の傾きの見せ方を変える(
            図の円の見せ方を変える(
              図の折れ線の見せ方を変える(
                図の配色を変える(
                  図の速さを変える(図の描き方を変える(図に画面の言語を当てる(見本.diagram, locale), 描き方), 速さ),
                  配色,
                ),
                折れ線,
              ),
              円,
            ),
            傾き,
          )
        : null,
    [modalItem, 見本, locale, 速さ, 描き方, 配色, 折れ線, 円, 傾き],
  );
  // 拡大表示の倍率 (#1745)。 器に収めると大きい図ほど小さく描かれるため、実寸まで拡げられるようにする
  //
  // **どの図に対する倍率かを一緒に持つ**。 別の図を開いたら収める側へ戻す必要があり、
  // 効果で戻すと開くたびに描き直しが 1 回増える。 描くときに読み替えれば戻し忘れも起きない。
  const [倍率の状態, set倍率の状態] = useState<{ 図: string | null; 値: 倍率の指定 }>({
    図: null,
    値: 収める,
  });
  const 開いている図 = modalItem?.id ?? null;
  const 倍率 = 倍率の状態.図 === 開いている図 ? 倍率の状態.値 : 収める;
  // 実寸は画面の実測でなく viewBox から取る。 描けない図では倍率を指定できない
  const 拡大のviewBox幅 = useMemo(() => {
    const d = 拡大の図 ?? modalItem?.diagram;
    if (!d) return undefined;
    try {
      return layout(d).viewBox.w;
    } catch {
      return undefined;
    }
  }, [拡大の図, modalItem]);
  const 指定した幅 = svgの幅(倍率, 拡大のviewBox幅);
  // ホイール・つまみ・ドラッグ (#1961)。 拡大表示は図を見るための場所なので、修飾キー無しのホイールも拡大に使う
  const 拡大の操作 = useDiagramPanZoom({
    器: modalStageEl,
    倍率,
    倍率を置く(値) {
      set倍率の状態({ 図: 開いている図, 値 });
    },
    viewBox幅: 拡大のviewBox幅,
    修飾キー無しで拡大: true,
    頁も送る: false,
    図の鍵: 拡大の図 ?? modalItem?.diagram,
  });
  // ＋ / − は、器に収めている時は実際に描かれている倍率を起点にする (#1961)
  function 倍率を動かす(向き: "上げる" | "下げる"): void {
    set倍率の状態({ 図: 開いている図, 値: 次の倍率(倍率, 向き, 拡大の操作.収めた倍率) });
  }
  function 拡大を器に合わせる(): void {
    set倍率の状態({ 図: 開いている図, 値: 収める });
  }

  // 並べて見る側の倍率 (#1749)。 台は幅 874px で高さの上限が無く、図は幅いっぱいに描かれる =
  // 広い図は縮み (53 枚が 12px 未満)、細い図は伸びる (39 枚が高さ 1200px 超)。
  //
  // **拡大表示とは別の状態にする**。 器が違うので、片方で選んだ倍率がもう片方で同じ見え方に
  // ならない。 どの図に対する倍率かを一緒に持つのは拡大表示と同じ理由
  const [並びの倍率の状態, set並びの倍率の状態] = useState<{ 図: string | null; 値: 倍率の指定 }>({
    図: null,
    値: 収める,
  });
  const 見ている図 = currentItem?.id ?? null;
  const 並びの倍率 = 並びの倍率の状態.図 === 見ている図 ? 並びの倍率の状態.値 : 収める;
  const 並びのviewBox幅 = useMemo(() => {
    const d = 図 ?? 見本?.diagram ?? currentItem?.diagram;
    if (!d) return undefined;
    try {
      return layout(d).viewBox.w;
    } catch {
      return undefined;
    }
  }, [図, 見本, currentItem]);
  const 並びで指定した幅 = svgの幅(並びの倍率, 並びのviewBox幅);
  // ホイール・つまみ・ドラッグ (#1961)。 並べて見る側は一覧の画面を送る場所なので、
  // 修飾キー無しのホイールは奪わず、`⌘` / `Ctrl` を押した時 (つまみ操作も同じ形で届く) だけ拡大に使う。
  // 巻き取りは内側 (`.catalog-preview-stage-inner`) が持ち、縦に溢れた分は頁が送る
  const 並びの操作 = useDiagramPanZoom({
    器: stageEl,
    巻き取りを探す: 並びの巻き取りを探す,
    倍率: 並びの倍率,
    倍率を置く(値) {
      set並びの倍率の状態({ 図: 見ている図, 値 });
    },
    viewBox幅: 並びのviewBox幅,
    修飾キー無しで拡大: false,
    頁も送る: true,
    図の鍵: 図 ?? 見本?.diagram ?? currentItem?.diagram,
  });
  function 並びの倍率を動かす(向き: "上げる" | "下げる"): void {
    set並びの倍率の状態({ 図: 見ている図, 値: 次の倍率(並びの倍率, 向き, 並びの操作.収めた倍率) });
  }
  function 並びを器に合わせる(): void {
    set並びの倍率の状態({ 図: 見ている図, 値: 収める });
  }

  // 起点から描けない図では切替を出さない (押しても何も変わらない、 #1359)
  const 切替を出すか = 見本 ? 描き方の切替を出すか(見本.diagram) : false;
  // 配色を書かない図では切替を出さない (押すと着せ替えになる、 #1569)
  const 配色を選べるか = 見本 ? 配色を選べる(見本.diagram) : false;
  // 折れ線以外では 3 つの欄が効かないため、切替を出さない (#1624)
  const 折れ線を選べるか = 見本 ? 折れ線を選べる(見本.diagram) : false;
  // 円グラフ以外では見せ方の欄が効かないため、切替を出さない (#1645)
  const 円を選べるか = 見本 ? 円の見せ方を選べる(見本.diagram) : false;
  // 傾き図以外では見せ方の欄が効かないため、切替を出さない (#1659)
  const 傾きを選べるか = 見本 ? 傾きの見せ方を選べる(見本.diagram) : false;
  // 中身が違う見本を持つ図でだけ パターン の群を出す (#1696)
  const パターンの並び = currentItem?.patterns ?? [];
  const 選んでいるパターン = パターンの並び.find((p) => p.名 === パターン) ?? パターンの並び[0];

  const hasSource = 記法を持つか(見本);
  // 記法を持たない図では図の側へ倒す。 選んだままにすると、項目を選び直した先で
  // 空のコード欄が出て「壊れている」 ように見える
  const showSource = previewTab === "source" && hasSource;

  if (!category) {
    return (
      <div>
        <SiteHeader />
        <div className="flex min-h-[calc(100vh-60px)] items-center justify-center">
          <p className="text-[15px] text-[var(--d-text-secondary)]">分類が見つかりません</p>
        </div>
      </div>
    );
  }

  // 呼び名の出どころは `CATEGORIES[].label` 1 つ (#1788)。 画面側で上書きしない
  const jaLabel = category.label;

  return (
    <div>
      <SiteHeader />
      <div className="catalog-page">
        {/* breadcrumb + hero (簡潔) */}
        <div className="catalog-hero">
          <nav
            aria-label={locale === "ja" ? "道筋" : "Breadcrumb"}
            className="catalog-crumb"
          >
            <Link to="/">概要</Link>
            <span aria-hidden="true">›</span>
            <Link to="/catalog">カタログ</Link>
            <span aria-hidden="true">›</span>
            <span className="cur">{jaLabel}</span>
          </nav>
          <h1 className="catalog-title">{jaLabel}</h1>
          <p className="catalog-desc">{category.desc}</p>
          <div className="catalog-meta">
            <span className="catalog-count">全 {items.length} 件</span>
            {filtered.length !== items.length && (
              <span className="catalog-count catalog-count-filter">
                {filtered.length} 件 表示中
              </span>
            )}
          </div>
        </div>

        {/* 2 pane = sidebar (list) + preview */}
        <div className="catalog-body">
          <aside className="catalog-sidebar" aria-label="項目一覧">
            <div className="catalog-search-wrap">
              <Search size={14} className="catalog-search-icon" />
              <input
                type="text"
                className="catalog-search"
                placeholder="検索 (名前 / 説明 / ID)"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                aria-label="項目を検索"
              />
              {query && (
                <button
                  type="button"
                  className="catalog-search-clear"
                  onClick={() => setQuery("")}
                  aria-label="検索語を消す"
                >
                  <X size={12} />
                </button>
              )}
            </div>
            <div className="catalog-list" role="list">
              {params.slug === "parts" && partsLoadState === "loading" ? (
                <div className="catalog-list-empty">読み込み中…</div>
              ) : params.slug === "parts" && partsLoadState === "error" ? (
                <div className="catalog-list-empty">
                  読み込みに失敗しました。 ページを再読込してください。
                </div>
              ) : filtered.length === 0 ? (
                <div className="catalog-list-empty">該当する項目がありません</div>
              ) : (
                filtered.map((item) => {
                  const isSelected = currentItem?.id === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => 項目を選ぶ(item)}
                      className={`catalog-list-item${isSelected ? " selected" : ""}`}
                      role="listitem"
                      aria-current={isSelected ? "true" : undefined}
                    >
                      <div className="catalog-list-item-name">{displayName(item)}</div>
                      <div className="catalog-list-item-id">{item.id}</div>
                    </button>
                  );
                })
              )}
            </div>
          </aside>

          <main className="catalog-preview" aria-label="図の表示">
            {currentItem ? (
              <article className="catalog-preview-card">
                <header className="catalog-preview-head">
                  <div>
                    <div className="catalog-preview-id">{currentItem.id}</div>
                    <h2 className="catalog-preview-title">{displayName(currentItem)}</h2>
                    {currentItem.subtitle && (
                      <p className="catalog-preview-sub">{currentItem.subtitle}</p>
                    )}
                    {/* 動きの種類は人が書かず図から導く (#1043)。 動かない図にも必ず出す
                        (出さないと説明が単独で出る、 #1053)。 SSOT = catalog-motion.ts */}
                    <p className="catalog-preview-motion">{currentItem.motionNote}</p>
                  </div>
                  <div className="catalog-preview-actions">
                    {/* 倍率の操作 (#1749)。 台は幅に合わせるので、広い図は縮み細い図は伸びる */}
                    <DiagramZoomControls
                      場所="並び"
                      倍率={並びの倍率}
                      収めた倍率={並びの操作.収めた倍率}
                      使える={並びのviewBox幅 !== undefined}
                      倍率を動かす={並びの倍率を動かす}
                      器に合わせる={並びを器に合わせる}
                    />
                    <button
                      type="button"
                      onClick={() => setModalItem(currentItem)}
                      aria-label={`${displayName(currentItem)} を拡大表示`}
                      className="catalog-expand-btn"
                    >
                      <Maximize2 size={14} />
                      <span>拡大</span>
                    </button>
                  </div>
                </header>
                {/*
                  図とコードは **どちらも DOM に残したまま** 表示だけ入れ替える (#1236)。
                  外すと切り替えるたびに図を描き直すことになり、記法の選択も毎回戻る。
                */}
                <div className="catalog-preview-tabs" role="tablist" aria-label="表示の切替">
                  <button
                    role="tab"
                    type="button"
                    aria-selected={!showSource}
                    className={`catalog-preview-tab ${!showSource ? "is-active" : ""}`}
                    onClick={() => setPreviewTab("diagram")}
                  >
                    図
                  </button>
                  <button
                    role="tab"
                    type="button"
                    aria-selected={showSource}
                    className={`catalog-preview-tab ${showSource ? "is-active" : ""}`}
                    onClick={() => setPreviewTab("source")}
                    disabled={!hasSource}
                    title={hasSource ? undefined : "この図に記法は登録されていません"}
                  >
                    コード
                  </button>
                  {/*
                    再生速度の切替 (#1355)。 **コードのタブでも出したまま** にする =
                    出ている秒数がこの倍率で決まるため、隠すと数字が変わった理由が読めない。

                    `role="tablist"` の中に置くが、これは表示の切替ではないので `radiogroup`
                    として別に名前を付ける (支援技術に 4 つ目のタブとして読ませない)。
                  */}
                  {/*
                    切替は 2 群に分かれる (#1696)。

                    `オプション` は **1 つの記法を変換する** 操作で、押しても図に載る項目と
                    値は変わらない。 `パターン` は **複数の記法から選ぶ** 操作で、押すと中身が
                    入れ替わる。 混ぜて並べると、押す前に どちらが起きるか読めない。

                    群の名前は見出しではなく札にする = `role="tablist"` の中なので、
                    見出しにすると支援技術がタブの並びを見出しで割ることになる。
                  */}
                  <div className="catalog-toggle-groups">
                    <div className="catalog-toggle-group">
                      <span className="catalog-toggle-group-label" aria-hidden="true">
                        オプション
                      </span>
                      {/*
                        2 段目以降の描き方 (#1359)。 起点から描ける図でだけ出す = 描けない図では
                        押しても何も変わらないため、置くと「効かない操作」 になる。
                      */}
                      {切替を出すか && (
                        <div className="catalog-redraw" role="radiogroup" aria-label="2 段目以降">
                          {描き方の選択肢.map((v) => (
                            <button
                              key={v}
                              type="button"
                              role="radio"
                              aria-checked={描き方 === v}
                              className={`catalog-speed-btn ${描き方 === v ? "is-active" : ""}`}
                              onClick={() => 見せ方を置く({ 描き方: v })}
                              title={`2 段目以降を${v}`}
                            >
                              {v}
                            </button>
                          ))}
                        </div>
                      )}
                      {/*
                        図の色味 (#1569)。 配色を持つ図でだけ出す = 持たない図で名前を足すと、
                        site の色で描かれていた図が急に別の色みになり「見比べる」 ではなく
                        「着せ替える」 道具になる。
                      */}
                      {配色を選べるか && (
                        <div className="catalog-redraw" role="radiogroup" aria-label="図の色味">
                          {配色の選択肢.map((v) => (
                            <button
                              key={v}
                              type="button"
                              role="radio"
                              aria-checked={配色 === v}
                              className={`catalog-speed-btn ${配色 === v ? "is-active" : ""}`}
                              onClick={() => 見せ方を置く({ 配色: v })}
                              title={`図の色味を${v}にする`}
                            >
                              {v}
                            </button>
                          ))}
                        </div>
                      )}
                      {/*
                        折れ線の見せ方 (#1624)。 折れ線を持つ図でだけ出す = 他の図では 3 つの
                        指定が効かず「効かない操作」 になる。 互いに排他ではなく個別に入り切り
                        するため、 `radiogroup` ではなく押した状態を持つ 1 つの `group` にする。
                      */}
                      {折れ線を選べるか && (
                        <div className="catalog-redraw" role="group" aria-label="折れ線の見せ方">
                          {折れ線の見せ方の選択肢.map((v) => (
                            <button
                              key={v}
                              type="button"
                              aria-pressed={折れ線[v]}
                              className={`catalog-speed-btn ${折れ線[v] ? "is-active" : ""}`}
                              onClick={() => 見せ方を置く({ 折れ線: { ...折れ線, [v]: !折れ線[v] } })}
                              title={`折れ線の${v}を${折れ線[v] ? "切る" : "入れる"}`}
                            >
                              {v}
                            </button>
                          ))}
                        </div>
                      )}
                      {/*
                        円グラフの見せ方 (#1645)。 円グラフを持つ図でだけ出す = 他の図では欄が
                        効かず「効かない操作」 になる。 3 つは互いに排他なので `radiogroup` にする。
                      */}
                      {円を選べるか && (
                        <div className="catalog-redraw" role="radiogroup" aria-label="円グラフの見せ方">
                          {円の見せ方の選択肢.map((v) => (
                            <button
                              key={v}
                              type="button"
                              role="radio"
                              aria-checked={円 === v}
                              className={`catalog-speed-btn ${円 === v ? "is-active" : ""}`}
                              onClick={() => 見せ方を置く({ 円: v })}
                              title={`円グラフを${v}で描く`}
                            >
                              {v}
                            </button>
                          ))}
                        </div>
                      )}
                      {/*
                        傾き図の見せ方 (#1659)。 傾き図を持つ図でだけ出す = 他の図では欄が
                        効かず「効かない操作」 になる。 2 つは互いに排他なので `radiogroup` にする。
                      */}
                      {傾きを選べるか && (
                        <div className="catalog-redraw" role="radiogroup" aria-label="傾き図の見せ方">
                          {傾きの見せ方の選択肢.map((v) => (
                            <button
                              key={v}
                              type="button"
                              role="radio"
                              aria-checked={傾き === v}
                              className={`catalog-speed-btn ${傾き === v ? "is-active" : ""}`}
                              onClick={() => 見せ方を置く({ 傾き: v })}
                              title={`傾き図の右の列に${v}を出す`}
                            >
                              {v}
                            </button>
                          ))}
                        </div>
                      )}
                      <div className="catalog-speed" role="radiogroup" aria-label="再生速度">
                        {速さの選択肢.map((v) => (
                          <button
                            key={v}
                            type="button"
                            role="radio"
                            aria-checked={速さ === v}
                            className={`catalog-speed-btn ${速さ === v ? "is-active" : ""}`}
                            onClick={() => 見せ方を置く({ 速さ: v })}
                            title={`再生速度 ${v}x`}
                          >
                            {v}x
                          </button>
                        ))}
                      </div>
                    </div>
                    {/*
                      中身が違う見本を持つ図でだけ出す。 持たない図で空の群を出すと、
                      押す先が無い札だけが並ぶ。
                    */}
                    {パターンの並び.length > 0 && (
                      <div className="catalog-toggle-group">
                        <span className="catalog-toggle-group-label" aria-hidden="true">
                          パターン
                        </span>
                        <div className="catalog-redraw" role="radiogroup" aria-label="パターン">
                          {パターンの並び.map((p) => (
                            <button
                              key={p.名}
                              type="button"
                              role="radio"
                              aria-checked={選んでいるパターン?.名 === p.名}
                              className={`catalog-speed-btn ${
                                選んでいるパターン?.名 === p.名 ? "is-active" : ""
                              }`}
                              onClick={() => 見せ方を置く({ パターン: p.名 })}
                              title={`${p.名}の見本を出す`}
                            >
                              {p.名}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                <div
                  className="catalog-preview-stage"
                  hidden={showSource}
                  ref={setStageEl}
                  data-cdl-zoom={並びで指定した幅 === undefined ? undefined : "on"}
                  data-cdl-pannable={並びの操作.動かせる ? "" : undefined}
                  data-cdl-panning={並びの操作.移動中 ? "" : undefined}
                  style={
                    並びで指定した幅 === undefined
                      ? undefined
                      : ({ "--cdl-zoom-width": `${並びで指定した幅}px` } as React.CSSProperties)
                  }
                >
                  {/*
                    `keepMounted` を渡す (#1236)。 渡さないと `hidden` にした瞬間に box が消えて
                    「見えない」 と判定され、図が外れる = 上のコメントが言う「どちらも DOM に残す」
                    が破れて、切り替えるたびに描き直しになる。
                  */}
                  <InViewMount
                    keepMounted
                    className="catalog-preview-stage-inner"
                    placeholder={<div className="catalog-preview-loading">読み込み中…</div>}
                  >
                    {/*
                      項目とパターンの組が変わった時だけ作り直す (#1969)。 描画側の入力の部品は既定値
                      (時間の速さの番号など) を作った時にしか読まないので、使い回すと前の図の値が残る。
                      速さや配色の切替では作り直さない = 動いている段を巻き戻さない
                    */}
                    <CdlDiagramView
                      key={currentItem.id + "::" + (パターン ?? "")}
                      hideMiniPhaseIndicator
                      diagram={図 ?? 見本?.diagram ?? currentItem.diagram}
                      hideHeader
                      interactiveHandlers={CATALOG_HANDLERS}
                    />
                  </InViewMount>
                  {/* 設計 (`03 カタログの分類`) は札を右上に描いている (#1239) */}
                  <PhaseChrome
                    stage={stageEl}
                    phases={(図 ?? 見本?.diagram ?? currentItem.diagram).phases}
                    align="right"
                  />
                </div>
                <SourceTabs item={見本 ?? currentItem} hidden={!showSource} 速さ={速さ} 描き方={描き方} />
                <footer className="catalog-preview-foot">
                  {/*
                    **記法を持つ図だけ開ける**。 `#preset=<id>` はエディタの見本から slug を
                    引く仕組みで、 catalog の図はそこに無い = 押しても既定の見本が出るだけ
                    だった。 記法があれば中身をそのまま渡せる (`#s=`)。

                    無い図は押せる見た目にしない = 「押したのに何も起きない」 を残さない。
                  */}
                  {catalogEditorHash(見本 ?? currentItem) ? (
                    <Link
                      to={`/editor${catalogEditorHash(見本 ?? currentItem)}`}
                      className="catalog-preview-link"
                    >
                      編集画面で開く →
                    </Link>
                  ) : (
                    <span className="catalog-preview-note" aria-disabled="true">
                      記法が無いので開けません
                    </span>
                  )}
                </footer>
              </article>
            ) : (
              <div className="catalog-preview-empty">項目を選択してください</div>
            )}
          </main>
        </div>
      </div>

      {/* 拡大 modal = SVG max 80vh center fit */}
      <Dialog.Root open={modalItem !== null} onOpenChange={(open) => !open && setModalItem(null)}>
        <Dialog.Portal>
          <Dialog.Overlay className="cdl-modal-overlay" />
          <Dialog.Content className="cdl-modal-content">
            <div className="cdl-modal-header">
              <div>
                <div className="cdl-modal-id">{modalItem?.id}</div>
                <Dialog.Title className="cdl-modal-title">
                  {modalItem ? displayName(modalItem) : ""}
                </Dialog.Title>
                {modalItem?.subtitle && (
                  <Dialog.Description className="cdl-modal-desc">
                    {modalItem.subtitle}
                  </Dialog.Description>
                )}
                {/* 動きの種類は人が書かず図から導く (#1043)。 動かない図にも必ず出す (#1053) */}
                {modalItem && <p className="cdl-modal-motion">{modalItem.motionNote}</p>}
              </div>
              <div className="cdl-modal-actions">
                {/* 倍率の操作 (#1745)。 器に収めると 4.8px まで縮む図があるため、実寸まで拡げられるようにする */}
                <DiagramZoomControls
                  場所="拡大"
                  倍率={倍率}
                  収めた倍率={拡大の操作.収めた倍率}
                  使える={拡大のviewBox幅 !== undefined}
                  倍率を動かす={倍率を動かす}
                  器に合わせる={拡大を器に合わせる}
                />
                <Dialog.Close asChild>
                  <button type="button" aria-label="閉じる" className="cdl-modal-close">
                    <X size={20} />
                  </button>
                </Dialog.Close>
              </div>
            </div>
            <div
              className="cdl-modal-body"
              ref={setModalStageEl}
              data-cdl-zoom={指定した幅 === undefined ? undefined : "on"}
              data-cdl-pannable={拡大の操作.動かせる ? "" : undefined}
              data-cdl-panning={拡大の操作.移動中 ? "" : undefined}
              style={
                指定した幅 === undefined
                  ? undefined
                  : ({ "--cdl-zoom-width": `${指定した幅}px` } as React.CSSProperties)
              }
            >
              {modalItem && (
                <CdlDiagramView
                  key={modalItem.id + "::" + (パターン ?? "")}
                  hideMiniPhaseIndicator
                  diagram={拡大の図 ?? modalItem.diagram}
                  hideHeader
                  interactiveHandlers={CATALOG_HANDLERS}
                />
              )}
              <PhaseChrome
                stage={modalStageEl}
                phases={(拡大の図 ?? modalItem?.diagram)?.phases}
                align="right"
              />
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}
