
/**
 * 分類の日本語の呼び名の出どころが 1 つであることの検証 (#1788)。
 *
 * 直す前は `CATEGORY_JA_LABEL` という同じ表が 2 つの画面 file に丸ごと置かれ、
 * `CATEGORIES[].label` を上書きしていた (片方には `SSOT` と書いてあったが唯一の出どころではない)。
 * #1787 で `テキスト DSL` を `テキスト記法` に直した時、同じ 1 語を 2 箇所で直している。
 *
 * 上書きの表は 9 件しか持たず、分類は 11 件ある。 足した分類は上書きから漏れて別の呼び名が出る。
 *
 * 呼び名は `CATEGORIES[].label` だけが持ち、2 つの画面はそこから引く。
 */
import React from "react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { readFileSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { renderToStaticMarkup } from "react-dom/server";
import { MemoryRouter, Routes, Route } from "react-router";
import { CATEGORIES } from "@/lib/catalog";
import { カタカナの連なり } from "@/lib/screen-words";
import { PRESETS } from "@/lib/presets";
import { ToastProvider } from "@/components/Toast";
import { CatalogIndexPage } from "./CatalogIndexPage";
import { CategoryPage } from "./CategoryPage";
import { EditorPage } from "./EditorPage";
import { PresetDetailPage } from "./PresetDetailPage";
import {
  installIntersectionObserverStub,
  restoreIntersectionObserver,
} from "../../../../test-support/intersection-observer-stub";

vi.mock("@cardenelabs/cdl", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@cardenelabs/cdl")>();
  return {
    ...actual,
    CdlDiagramView: (): React.ReactElement => <div data-testid="catalog-diagram" />,
  };
});

beforeEach(() => installIntersectionObserverStub());
afterEach(() => restoreIntersectionObserver());

const 画面の置き場 = fileURLToPath(new URL(".", import.meta.url));

/**
 * 画面 file のうち、分類の鍵を object の鍵として持つもの。 本番と植え込み対照が同じ関数を使う。
 *
 * 探す形は `"presets":` のような object の鍵。 呼び名の表を画面側に持つとこの形になる。
 */
export function 呼び名の表を持つ所(src: string, file: string, 鍵: string[]): string[] {
  return 鍵
    .filter((k) => new RegExp(`["']${k.replace(/-/g, "\\-")}["']\\s*:`).test(src))
    .map((k) => `${file}: "${k}": を鍵に持っている`);
}

/** 描いた画面から、その class を持つ要素の中身を順に取り出す */
function 見出しの字(html: string, cls: string): string[] {
  return [...html.matchAll(new RegExp(`class="${cls}"[^>]*>([^<]*)<`, "g"))].map((m) => m[1]!);
}

/**
 * 描いた画面から、その行き先へ送るリンクの字を取り出す。
 *
 * 中に別の要素を持つリンク (札の形をしたもの) は拾わない。
 * 拾うのは字だけを持つリンクで、そこに出る字が分類の呼び名にあたる。
 */
export function リンクの字(html: string, 行き先: string): string[] {
  return [...html.matchAll(new RegExp(`<a[^>]*href="${行き先}"[^>]*>([^<]*)</a>`, "g"))].map(
    (m) => m[1]!,
  );
}

/**
 * 呼び名に残してよいカタカナの語と、その理由 (#1805)。
 *
 * 表に無いカタカナの語を呼び名に使うと落ちる。 理由を書けないなら日本語に開く。
 */
const 呼び名に残してよい語: Record<string, string> = {
  テキスト: "定着した語。 この分類の呼び名は #1788 から 7 層に渡って揃えた直後で、また変えると層が増える",
  イーサリアム: "製品の名前",
};

/**
 * 呼び名の中の、残してよい語を外したカタカナの連なり。 本番と植え込み対照が同じ関数を使う。
 *
 * **何をカタカナ語と読むかは `lib/screen-words.ts` が持つ** (#1855)。 画面の字の天井を
 * 見る検査も同じ形を引く = 2 度書くと片方だけ直って食い違う。 許す語の一覧だけが
 * こちら側の持ち物で、見る相手が違うので寄せない。
 */
export function 開いていないカタカナ(呼び名: string): string[] {
  let 残り = 呼び名;
  for (const 語 of Object.keys(呼び名に残してよい語)) 残り = 残り.split(語).join(" ");
  return カタカナの連なり(残り);
}

/**
 * 分類の表の欄のうち、描いた画面に値が出ない欄を `slug.欄` の形で返す (#1932)。
 * 本番と植え込み対照が同じ関数を使う。
 *
 * **欄は表の実物から導く** = 手で並べると、足した欄が黙って検査の外に落ちる。
 *
 * 「出る」 は 2 通りに限る。 字の中身 (要素の間の字) が値を含むか、行き先 (`href`) の
 * 区切り 1 つが値と同じか。 markup 全体に対する部分一致にすると、`basic` のような短い値が
 * class の名前に紛れて「出る」 と読まれる。
 */
export function 画面に出ない欄(分類たち: readonly object[], 画面: readonly string[]): string[] {
  const 戻す = (s: string): string =>
    s.replace(/&quot;/g, '"').replace(/&#x27;/g, "'").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&");
  const 字 = 画面.flatMap((html) => [...html.matchAll(/>([^<]+)</g)].map((m) => 戻す(m[1]!)));
  const 区切り = new Set(
    画面.flatMap((html) => [...html.matchAll(/href="([^"]*)"/g)].flatMap((m) => 戻す(m[1]!).split("/"))),
  );
  const 出る = (v: unknown): boolean =>
    typeof v === "string" && v !== "" && (区切り.has(v) || 字.some((s) => s.includes(v)));
  const 欄 = [...new Set(分類たち.flatMap((c) => Object.keys(c)))];
  return 分類たち.flatMap((c) => {
    const r = c as Record<string, unknown>;
    return 欄.filter((k) => !出る(r[k])).map((k) => `${String(r.slug)}.${k}`);
  });
}

function 画面のfile一覧(): string[] {
  return readdirSync(画面の置き場).filter((f) => f.endsWith(".tsx") && !f.includes(".test."));
}

function 一覧の画面(): string {
  return renderToStaticMarkup(
    <ToastProvider>
      <MemoryRouter initialEntries={["/catalog"]}>
        <Routes>
          <Route path="/catalog" element={<CatalogIndexPage />} />
        </Routes>
      </MemoryRouter>
    </ToastProvider>,
  );
}

function 見本の詳細の画面(slug: string): string {
  return renderToStaticMarkup(
    <ToastProvider>
      <MemoryRouter initialEntries={[`/preset/${slug}`]}>
        <Routes>
          <Route path="/preset/:id" element={<PresetDetailPage />} />
        </Routes>
      </MemoryRouter>
    </ToastProvider>,
  );
}

function 編集の画面(): string {
  return renderToStaticMarkup(
    <ToastProvider>
      <MemoryRouter initialEntries={["/editor"]}>
        <Routes>
          <Route path="/editor" element={<EditorPage />} />
        </Routes>
      </MemoryRouter>
    </ToastProvider>,
  );
}

/** 描いた画面から、一覧を切り替える見出しの字を順に取り出す */
export function 一覧の見出し(html: string): string[] {
  return [...html.matchAll(/<button[^>]*role="tab"[^>]*>([^<]*)<\/button>/g)].map((m) => m[1]!);
}

/** 描いた画面から、その目印を持つ要素の中身を取り出す */
export function 目印の字(html: string, 目印: string): string | null {
  const m = html.match(new RegExp(`<button[^>]*data-testid="${目印}"[^>]*>([^<]*)</button>`));
  return m ? m[1]! : null;
}

function 分類の画面(slug: string): string {
  return renderToStaticMarkup(
    <ToastProvider>
      <MemoryRouter initialEntries={[`/catalog/${slug}`]}>
        <Routes>
          <Route path="/catalog/:slug" element={<CategoryPage />} />
        </Routes>
      </MemoryRouter>
    </ToastProvider>,
  );
}

describe("分類の呼び名の出どころ (#1788)", () => {
  it("呼び名の表を画面 file が持っていない", () => {
    const 鍵 = CATEGORIES.map((c) => c.slug);
    expect(鍵.length, "分類を 1 件も見ていない (検査が空振りしている)").toBeGreaterThan(10);
    const files = 画面のfile一覧();
    expect(files.length, "画面 file を 1 つも見ていない (検査が空振りしている)").toBeGreaterThan(5);
    const 持つ所 = files.flatMap((f) =>
      呼び名の表を持つ所(readFileSync(画面の置き場 + f, "utf8"), f, 鍵),
    );
    expect(持つ所, `画面 file が分類の鍵を持っている:\n${持つ所.join("\n")}`).toEqual([]);
  });

  it("呼び名の表を拾える (植え込み対照)", () => {
    const 鍵 = CATEGORIES.map((c) => c.slug);
    const 元 = `const x = CATEGORIES.map((c) => c.label);`;
    expect(呼び名の表を持つ所(元, "元.tsx", 鍵), "土台に表が混ざっている").toEqual([]);
    const 植え = `const L = { "presets": "プリセット", "text-dsl": "テキスト記法" };`;
    expect(呼び名の表を持つ所(植え, "植え.tsx", 鍵)).toHaveLength(2);
  });

  it("一覧の画面が CATEGORIES の呼び名をそのまま出す", () => {
    // **含むかどうかでは見ない**。 見本の名前が呼び名を字として含む (`テキスト記法のシーケンス`) ため、
    // 画面全体に対する部分一致だと呼び名がずれていても通ってしまう。 見出しの中身と丸ごと突き合わせる
    const 出た = 見出しの字(一覧の画面(), "catalog-index-card-title");
    expect(出た.length, "見出しを 1 つも読めていない (検査が空振りしている)").toBe(CATEGORIES.length);
    expect(出た, "一覧の画面の呼び名が CATEGORIES と違う").toEqual(CATEGORIES.map((c) => c.label));
  });

  it("分類の画面が CATEGORIES の呼び名をそのまま出す", () => {
    // 11 件すべてを描く。 一部だけ見ると、見ていない分類の呼び名がずれても気付けない
    const 違う: string[] = [];
    let 読めた = 0;
    for (const c of CATEGORIES) {
      const 出た = 見出しの字(分類の画面(c.slug), "catalog-title");
      if (出た.length === 1) 読めた += 1;
      if (出た[0] !== c.label) 違う.push(`${c.slug}: ${出た[0] ?? "(見出しを読めない)"} ≠ ${c.label}`);
    }
    expect(読めた, "見出しを読めた分類の数が足りない (検査が空振りしている)").toBe(CATEGORIES.length);
    expect(違う, `分類の画面の呼び名が CATEGORIES と違う:\n${違う.join("\n")}`).toEqual([]);
  });

  it("分類の表の欄がどれも画面に出る (#1932)", () => {
    // 以前はここで前置き (`eyebrow`) が呼び名と同じ字でないことを見ていたが、前置きは #188 で
    // 画面から消えていた。 画面に出ない字を「出る」 前提で確かめる形を作らないよう、欄ごと外し、
    // 表の欄が描いた画面に出ることを見る
    const 画面 = [一覧の画面(), ...CATEGORIES.map((c) => 分類の画面(c.slug))];
    const 欄 = new Set(CATEGORIES.flatMap((c) => Object.keys(c)));
    console.log(`[分類の表の欄] 分類=${CATEGORIES.length} 欄=${[...欄].join(" / ")} 画面=${画面.length}`);
    expect(欄.size, "分類の表の欄を 1 つも見ていない (検査が空振りしている)").toBeGreaterThanOrEqual(3);
    expect(画面に出ない欄(CATEGORIES, 画面), "画面が読まない欄が分類の表に残っている").toEqual([]);
  });

  it("画面に出ない欄を見つけ、出る欄は咎めない (植え込み対照 + 対象外の対照、#1932)", () => {
    const 画面 = [一覧の画面(), ...CATEGORIES.map((c) => 分類の画面(c.slug))];
    // 対象外の対照 = 画面に出る 3 つの欄だけの表は咎めない
    expect(画面に出ない欄(CATEGORIES, 画面)).toEqual([]);
    // 植え込み対照 = 画面に描かれない字の欄を 1 つ足すと、全分類ぶん見つける
    const 前置きつき = CATEGORIES.map((c) => ({ ...c, eyebrow: `${c.label}の前置き` }));
    expect(画面に出ない欄(前置きつき, 画面)).toEqual(CATEGORIES.map((c) => `${c.slug}.eyebrow`));
    // 字が画面のどこか (class の名前) に紛れても、字の中身か行き先の区切りに出なければ見つける
    const 群れつき = CATEGORIES.map((c) => ({ ...c, cluster: "catalog-index-card" }));
    expect(画面に出ない欄(群れつき, 画面)).toHaveLength(CATEGORIES.length);
  });

  it("説明文が呼び名をなぞって始まっていない (#1805)", () => {
    // 呼び名のすぐ下に説明文が出る。 呼び名で始めると、1 行目が呼び名を読み直すだけになる。
    // 呼び名を日本語に開くと、説明文が既に使っていた語と重なりやすい (`動く図` で実際に起きた)
    expect(CATEGORIES.length, "分類を 1 件も見ていない (検査が空振りしている)").toBeGreaterThan(10);
    const なぞる = CATEGORIES.filter((c) => c.desc.startsWith(c.label)).map(
      (c) => `${c.slug}: ${c.desc.slice(0, 24)}…`,
    );
    expect(なぞる, `説明文が呼び名で始まっている:\n${なぞる.join("\n")}`).toEqual([]);
  });

  it("呼び名に日本語へ開いていないカタカナが無い (#1805)", () => {
    expect(CATEGORIES.length, "分類を 1 件も見ていない (検査が空振りしている)").toBeGreaterThan(10);
    const 残る = CATEGORIES.flatMap((c) =>
      開いていないカタカナ(c.label).map((w) => `${c.slug}: ${c.label} の「${w}」`),
    );
    console.log(
      `[呼び名] 分類=${CATEGORIES.length} 残してよい語=${Object.keys(呼び名に残してよい語).length} 開いていない=${残る.length}`,
    );
    expect(残る, `呼び名にカタカナが残っている:\n${残る.join("\n")}`).toEqual([]);
  });

  it("カタカナの呼び名を拾える (植え込み対照)", () => {
    // 探し方が何にも当たらない形に壊れていると、上は必ず通る
    expect(開いていないカタカナ("プリセット")).toEqual(["プリセット"]);
    expect(開いていないカタカナ("インタラクティブ")).toEqual(["インタラクティブ"]);
    expect(開いていないカタカナ("レシピ集")).toEqual(["レシピ"]);
    // 残してよい語を含んでいても、残りのカタカナは拾う
    expect(開いていないカタカナ("テキストパーツ")).toEqual(["パーツ"]);
  });

  it("残してよい語だけの呼び名は拾わない (対象外の対照)", () => {
    expect(開いていないカタカナ("テキスト記法"), "理由を書いた語を拾っている").toEqual([]);
    expect(開いていないカタカナ("イーサリアム"), "製品の名前を拾っている").toEqual([]);
    // 日本語だけの呼び名も当然拾わない
    expect(開いていないカタカナ("基本要素")).toEqual([]);
    expect(開いていないカタカナ("図表")).toEqual([]);
  });

  it("見本の詳細の画面が分類を CATEGORIES の呼び名で呼ぶ (#1805)", () => {
    const 分類 = CATEGORIES.find((c) => c.slug === "presets");
    expect(分類, "presets の分類が無い (検査が空振りしている)").toBeDefined();
    const 行き先 = `/catalog/${分類!.slug}`;

    // 見本がある時 (パンくず) と 無い時 (一覧へ戻す案内) の両方を見る
    const 字 = [
      ...リンクの字(見本の詳細の画面(PRESETS[0]!.slug), 行き先),
      ...リンクの字(見本の詳細の画面("この見本は無い"), 行き先),
    ];
    expect(字.length, "分類へ送るリンクを 1 つも読めていない (検査が空振りしている)").toBe(2);
    const 合わない = 字.filter((s) => !s.startsWith(分類!.label));
    expect(合わない, `見本の詳細が分類を別の呼び名で呼んでいる: ${合わない.join(" / ")}`).toEqual([]);
  });

  it("編集画面の一覧の見出しが CATEGORIES の呼び名から出る (#1811)", () => {
    const 分類 = CATEGORIES.find((c) => c.slug === "parts");
    expect(分類, "parts の分類が無い (検査が空振りしている)").toBeDefined();
    const html = 編集の画面();
    const 見出し = 一覧の見出し(html);
    // 見出しを 1 つも読めていないと、下の突き合わせは通って当然になる。
    // 下限は空振りを止めるための値で、今の件数ではない (実数は下の行に出す)
    expect(見出し.length, "一覧の見出しを 1 つも読めていない (検査が空振りしている)").toBeGreaterThan(2);
    console.log(`[編集画面の一覧] 見出し=${見出し.join(" / ")}`);
    const 部品の見出し = 目印の字(html, "editor-parts-tab");
    expect(部品の見出し, "部品の一覧の見出しを読めていない (検査が空振りしている)").not.toBeNull();
    expect(部品の見出し, "見出しが分類の呼び名と違う").toBe(分類!.label);
  });

  it("見本の詳細の見出しの添えが CATEGORIES の呼び名と一致する (#1805)", () => {
    const 分類 = CATEGORIES.find((c) => c.slug === "presets");
    const 出た = 見出しの字(見本の詳細の画面(PRESETS[0]!.slug), "nm-gradient-accent");
    expect(出た.length, "見出しの添えを読めていない (検査が空振りしている)").toBe(1);
    expect(出た[0], "見出しの添えが分類の呼び名と違う").toBe(分類!.label);
  });
});
