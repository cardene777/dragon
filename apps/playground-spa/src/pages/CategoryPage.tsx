import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router";
import { CdlDiagramView } from "@cardenelabs/cdl";
import * as Dialog from "@radix-ui/react-dialog";
import { Check, Copy, Maximize2, Search, X } from "lucide-react";
import { CATEGORIES } from "@/lib/catalog";
import { CATALOG_ITEMS, loadPartsItems, type CatalogItem } from "@/lib/catalog-items";
import { CATALOG_HANDLERS } from "@/lib/catalog-handlers";
import { itemName, itemNameEn, itemNameJa } from "@/lib/i18n";
import { useLocale } from "@/lib/useLocale";
import { SiteHeader } from "@/components/SiteHeader";
import { InViewMount } from "@/components/InViewMount";
import { PhaseChrome } from "@/components/PhaseChrome";
import {
  図の速さを変える,
  記法の速さを変える,
  既定の速さ,
  速さの選択肢,
  type 速さ,
} from "@/lib/playback-speed";

import { SyntaxCode } from "../components/SyntaxCode";
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
 * source 記法 tab section (YAML / JSON 切替、 source なしの場合は表示しない)。
 *
 * `hidden` は **外さずに隠す**。 外すと記法の選択 (yaml / json) が毎回 yaml へ戻り、
 * 図とコードを往復しながら比べる時に選び直すことになる。
 */
function SourceTabs({
  item,
  hidden,
  速さ,
}: {
  item: CatalogItem;
  hidden?: boolean;
  /** 画面で選んだ再生速度 (#1355)。 出す秒数をこれに合わせる */
  速さ: 速さ;
}): React.ReactElement | null {
  const [tab, setTab] = useState<SourceTab>("yaml");
  if (!item.sourceYaml && !item.sourceJson) return null;
  const 元 = tab === "yaml" ? item.sourceYaml : item.sourceJson;
  // 見ている図と同じ速さの秒数を出す (#1355)。 元のままだと、写したコードが画面と違う
  // 速さで動く
  const activeSource = 元 === undefined ? undefined : 記法の速さを変える(元, 速さ, tab);
  return (
    <section className="catalog-source-section" aria-label="この diagram の記法" hidden={hidden}>
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
          <code>(この記法の source は未登録です)</code>
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
 * /catalog/:slug — React docs / Storybook 風 2 pane 構成の再設計版。
 * left = 検索 + item list (sidebar)、 right = 選択 item preview + 詳細。
 * 拡大 button = card / preview 右上絶対配置、 modal = SVG max 80vh center fit。
 * UI 全日本語化 (breadcrumb / stat / button / label)。
 */

/** category slug から日本語 label に変換 (SSOT) */
const CATEGORY_JA_LABEL: Record<string, string> = {
  presets: "プリセット",
  cookbook: "レシピ集",
  patterns: "パターン",
  primitives: "基本要素",
  "text-dsl": "テキスト DSL",
  animation: "アニメーション",
  parts: "パーツ",
  styles: "スタイル",
  interactive: "インタラクティブ",
};

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

export function CategoryPage(): React.ReactElement {
  const params = useParams<{ slug: string }>();
  const [locale] = useLocale();
  const [modalItem, setModalItem] = useState<CatalogItem | null>(null);
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [previewTab, setPreviewTab] = useState<PreviewTab>("diagram");
  // 再生速度は **見ている 1 件だけ** に効く (#1355)。 項目を選び直すと既定に戻る
  const [速さ, set速さ] = useState<速さ>(既定の速さ);
  // 局面の表示は engine が入れ物へ書く属性を読むため、要素そのものが要る (#1239)
  const [stageEl, setStageEl] = useState<HTMLElement | null>(null);
  const [modalStageEl, setModalStageEl] = useState<HTMLElement | null>(null);

  const displayName = (item: CatalogItem): string => itemName(item.title, locale);

  const category = CATEGORIES.find((c) => c.slug === params.slug);
  // parts は CATALOG_ITEMS で empty placeholder、 useEffect で dynamic import 経由 populate (CAR-1613)
  // loadState = idle / loading / loaded / error の 4 状態、 chunk fetch 失敗を可視化する
  const [partsItems, setPartsItems] = useState<CatalogItem[]>([]);
  // lazy initializer で初回 render から "loading" にして empty state flash (1 frame) を排除
  const [partsLoadState, setPartsLoadState] = useState<"idle" | "loading" | "loaded" | "error">(
    () => (params.slug === "parts" ? "loading" : "idle"),
  );
  useEffect(() => {
    if (params.slug !== "parts") return;
    let cancelled = false;
    setPartsLoadState("loading");
    loadPartsItems()
      .then((loaded) => {
        if (!cancelled) {
          setPartsItems(loaded);
          setPartsLoadState("loaded");
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          // chunk fetch 失敗 (ネットワーク瞬断 / ad blocker / cache 古い tab 等) を可視化
          // console にも残す = user が devtools で原因把握できる
          // eslint-disable-next-line no-console
          console.error("[CAR-1613] parts.cdl chunk fetch failed", err);
          setPartsLoadState("error");
        }
      });
    return () => {
      cancelled = true;
    };
  }, [params.slug]);
  const items = params.slug === "parts"
    ? partsItems
    : (params.slug ? CATALOG_ITEMS[params.slug] ?? [] : []);

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

  // 項目を選び直したら速さを既定へ戻す (#1355)。 残すと、次の図が遅い理由を見失う
  const 見ている項目 = currentItem?.id ?? null;
  useEffect(() => {
    set速さ(既定の速さ);
  }, [見ている項目]);

  // 段の長さに倍率を掛けた図。 既定 (1 倍) では元の object がそのまま返るので、
  // 速さを触っていない図は描き直されない
  const 図 = useMemo(
    () => (currentItem ? 図の速さを変える(currentItem.diagram, 速さ) : null),
    [currentItem, 速さ],
  );
  // 拡大表示も同じ速さで出す。 開く元が今見ている項目なので、別の速さになると混乱する
  const 拡大の図 = useMemo(
    () => (modalItem ? 図の速さを変える(modalItem.diagram, 速さ) : null),
    [modalItem, 速さ],
  );

  const hasSource = Boolean(currentItem?.sourceYaml || currentItem?.sourceJson);
  // 記法を持たない図では図の側へ倒す。 選んだままにすると、項目を選び直した先で
  // 空のコード欄が出て「壊れている」 ように見える
  const showSource = previewTab === "source" && hasSource;

  if (!category) {
    return (
      <div>
        <SiteHeader />
        <div className="flex min-h-[calc(100vh-60px)] items-center justify-center">
          <p className="text-[15px] text-[var(--d-text-secondary)]">カテゴリが見つかりません</p>
        </div>
      </div>
    );
  }

  const jaLabel = CATEGORY_JA_LABEL[category.slug] ?? category.label;

  return (
    <div>
      <SiteHeader />
      <div className="catalog-page">
        {/* breadcrumb + hero (簡潔) */}
        <div className="catalog-hero">
          <nav aria-label={locale === "ja" ? "パンくずリスト" : "Breadcrumb"} className="catalog-crumb">
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
                  aria-label="検索をクリア"
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
                      onClick={() => setSelectedId(item.id)}
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

          <main className="catalog-preview" aria-label="プレビュー">
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
                  <button
                    type="button"
                    onClick={() => setModalItem(currentItem)}
                    aria-label={`${displayName(currentItem)} を拡大表示`}
                    className="catalog-expand-btn"
                  >
                    <Maximize2 size={14} />
                    <span>拡大</span>
                  </button>
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
                  <div className="catalog-speed" role="radiogroup" aria-label="再生速度">
                    {速さの選択肢.map((v) => (
                      <button
                        key={v}
                        type="button"
                        role="radio"
                        aria-checked={速さ === v}
                        className={`catalog-speed-btn ${速さ === v ? "is-active" : ""}`}
                        onClick={() => set速さ(v)}
                        title={`再生速度 ${v}x`}
                      >
                        {v}x
                      </button>
                    ))}
                  </div>
                </div>
                <div className="catalog-preview-stage" hidden={showSource} ref={setStageEl}>
                  {/*
                    `keepMounted` を渡す (#1236)。 渡さないと `hidden` にした瞬間に box が消えて
                    「見えない」 と判定され、図が外れる = 上のコメントが言う「どちらも DOM に残す」
                    が破れて、切り替えるたびに描き直しになる。
                  */}
                  <InViewMount
                    keepMounted
                    className="catalog-preview-stage-inner"
                    placeholder={
                      <div className="catalog-preview-loading">読み込み中…</div>
                    }
                  >
                    <CdlDiagramView hideMiniPhaseIndicator diagram={図 ?? currentItem.diagram} hideHeader interactiveHandlers={CATALOG_HANDLERS} />
                  </InViewMount>
                  {/* 設計 (`03 カタログの分類`) は札を右上に描いている (#1239) */}
                  <PhaseChrome stage={stageEl} phases={(図 ?? currentItem.diagram).phases} align="right" />
                </div>
                <SourceTabs item={currentItem} hidden={!showSource} 速さ={速さ} />
                <footer className="catalog-preview-foot">
                  {/*
                    **記法を持つ図だけ開ける**。 `#preset=<id>` はエディタの見本から slug を
                    引く仕組みで、 catalog の図はそこに無い = 押しても既定の見本が出るだけ
                    だった。 記法があれば中身をそのまま渡せる (`#s=`)。

                    無い図は押せる見た目にしない = 「押したのに何も起きない」 を残さない。
                  */}
                  {catalogEditorHash(currentItem) ? (
                    <Link
                      to={`/editor${catalogEditorHash(currentItem)}`}
                      className="catalog-preview-link"
                    >
                      エディタで開く →
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
              <Dialog.Close asChild>
                <button type="button" aria-label="閉じる" className="cdl-modal-close">
                  <X size={20} />
                </button>
              </Dialog.Close>
            </div>
            <div className="cdl-modal-body" ref={setModalStageEl}>
              {modalItem && <CdlDiagramView hideMiniPhaseIndicator diagram={拡大の図 ?? modalItem.diagram} hideHeader interactiveHandlers={CATALOG_HANDLERS} />}
              <PhaseChrome stage={modalStageEl} phases={(拡大の図 ?? modalItem?.diagram)?.phases} align="right" />
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}
