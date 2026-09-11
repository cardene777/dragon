/**
 * 見本帳のプリセットの図に、英語の仮置きの字が残っていないこと (#1778)。
 *
 * 見本の図は `User` `handler(...)` `Sign up` のような英語の仮置きのまま描かれていた。
 * 詳細画面の説明文 (#1777) と組み立て関数が書き足す字 (cdl#835) を日本語にしても、
 * 図そのものの字が英語のままでは見本として読めない。
 *
 * ## 何を見るか
 *
 * **描いた結果の字**。 組み立てた図を `CdlDiagramView` で描き、 要素の中身として表に出る字を
 * 集める (属性の値は読む人に見えないので見ない)。 図の data の欄を拾う形にすると、
 * 描く側が足す字 (札の既定値など) と描かない欄の区別が付かない。
 *
 * 描いた図は最初の段しか説明を出さないため、 段の題と説明は data から全段ぶん足す。
 *
 * ## 残してよい英字
 *
 * 製品名 / 規格名 / 略語 (`CloudFront` `HTTPS` `API` など) は日本語に置き換える語を持たない。
 * 1 語ずつ理由を付けて `残してよい語` に載せる。
 *
 * 表と型の名前を見せる図 (ER 図とクラス図) は、 箱の題と行が SQL やコードに書く識別子そのもの。
 * `users` `bigint` `Money` を訳すと図の意味が変わるため、 箱の字は見ずに段の字だけを見る。
 */
import { describe, it, expect, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { CdlDiagramView, diagram, layout } from "@cardenelabs/cdl";
import type { CdlDiagram } from "@cardenelabs/cdl";
import * as Presets from "@/topics/catalog/presets.cdl";

/** 日本語に置き換える語を持たない英字。 語ごとに何の名前かを書く */
const 残してよい語: Record<string, string> = {
  AWS: "クラウドの事業者名",
  CloudFront: "AWS の配信網の製品名",
  ALB: "AWS の負荷分散の製品名",
  RDS: "AWS のデータベースの製品名",
  ECS: "AWS のコンテナ実行の製品名",
  Redis: "一時保存の製品名",
  PostgreSQL: "データベースの製品名",
  PgBouncer: "PostgreSQL の接続を束ねる製品名",
  HTTPS: "通信の規格名",
  SQL: "問い合わせ言語の名前",
  TCP: "通信の規格名",
  VLAN: "ネットワークを論理的に分ける規格名",
  DMZ: "ネットワークの区画の略語",
  LAN: "ネットワークの区画の略語",
  API: "外部から呼ぶ口の略語",
  DB: "データベースの略語",
  POST: "HTTP の要求の種類",
  login: "`POST /login` の道筋の一部",
};

/**
 * 箱の字が識別子そのものの図。 段の題と説明だけを見る。
 * 鍵が実在することは下の検査が確かめる (消えた図の宣言を残さない)。
 */
const 識別子を見せる図: Record<string, string> = {
  presetEr: "表の名前と列の名前と型は SQL に書く識別子",
  presetErComplex: "表の名前と列の名前と型は SQL に書く識別子",
  presetClassDiagram: "クラスの名前と型はコードに書く識別子",
  presetClassComplex: "クラスの名前と型はコードに書く識別子",
};

const 描く時刻 = new Date("2026-01-01T00:00:00Z");

function 描いた字(d: CdlDiagram): string[] {
  vi.useFakeTimers();
  vi.setSystemTime(描く時刻);
  let s: string;
  try {
    // 詳細画面と同じ指定で描く (`PresetDetailPage`)。 見出しと段ごとの差分の表は画面が出さない
    s = renderToStaticMarkup(<CdlDiagramView hideMiniPhaseIndicator hideHeader diagram={layout(d)} />);
  } finally {
    vi.useRealTimers();
  }
  return s
    .replace(/<style[\s\S]*?<\/style>/g, "")
    .replace(/<script[\s\S]*?<\/script>/g, "")
    .split(/<[^>]*>/)
    .map((t) =>
      t
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .replace(/&quot;/g, '"')
        .replace(/&#x27;/g, "'")
        .replace(/&amp;/g, "&")
        .trim(),
    )
    .filter((t) => t !== "");
}

function 段の字(d: CdlDiagram): string[] {
  return d.phases.flatMap((p) => [p.title, p.body].filter((t): t is string => !!t));
}

/** 字に現れる英字の語。 1 文字の英字は語と見なさない (`スイッチ A` の区別や `Q1` の四半期) */
function 語の並び(t: string): string[] {
  return [...t.matchAll(/[A-Za-z][A-Za-z0-9]*/g)]
    .map((m) => m[0])
    .filter((語) => /[A-Za-z].*[A-Za-z]/.test(語));
}

/** 字の並びから、 残してよい語と `許す語` を除いた英語の語を拾う */
function 英語の語(字: readonly string[], 許す語: ReadonlySet<string> = new Set()): string[] {
  const 見つけた = new Set<string>();
  for (const t of 字) {
    for (const 語 of 語の並び(t)) {
      if (語 in 残してよい語 || 許す語.has(語)) continue;
      見つけた.add(`${語} (「${t}」)`);
    }
  }
  return [...見つけた];
}

/**
 * 識別子を見せる図は、 段の説明が図の中の識別子を呼ぶ (`manager_id は同じ表を指す`)。
 * **図に描いた識別子だけ** を許す = 図に無い英語の語は段の説明でも拾う。
 */
function 英語の残り(鍵: string, d: CdlDiagram): string[] {
  if (鍵 in 識別子を見せる図) {
    return 英語の語(段の字(d), new Set(描いた字(d).flatMap(語の並び)));
  }
  return 英語の語([...描いた字(d), ...段の字(d)]);
}

const 見本: [string, CdlDiagram][] = Object.entries(Presets).filter(
  (e): e is [string, CdlDiagram] =>
    /^preset[A-Z]/.test(e[0]) &&
    typeof e[1] === "object" &&
    e[1] !== null &&
    Array.isArray((e[1] as CdlDiagram).nodes),
);

/** 植え込み対照の土台。 見本帳の data に依らず、 日本語だけで組む */
function 土台(箱の題: string): CdlDiagram {
  return diagram("土台", { topic: "土台の図" })
    .lane("左", { width: 400, label: "受け付け" })
    .node("a", { lane: "左", stack: 0, kind: "function", title: 箱の題 })
    .phase("p1", { duration: 1000, title: "1. 受け付ける", body: "申請を受け付ける。" }, (p) =>
      p.activate("a"),
    )
    .build();
}

describe("見本帳のプリセットの図の字 (#1778)", () => {
  it("対象の見本を見つけている", () => {
    // 見本が 1 件も取れないと、 下の検査は何も見ずに通る
    expect(見本.length, "見本を 1 件も見つけていない (検査が空振りしている)").toBeGreaterThan(0);
    expect(見本.map(([k]) => k)).toEqual(expect.arrayContaining(Object.keys(識別子を見せる図)));
  });

  it.each(見本)("%s の図に英語の仮置きの字が残っていない", (鍵, d) => {
    const 字 = 鍵 in 識別子を見せる図 ? 段の字(d) : 描いた字(d);
    expect(字.length, `${鍵} の字を 1 つも拾えていない (検査が空振りしている)`).toBeGreaterThan(0);
    expect(英語の残り(鍵, d)).toEqual([]);
  });

  it("残してよい語は、 どれかの見本で実際に使われている", () => {
    // 使われない語が残ると、 同じ語が仮置きとして戻った時に黙って通る
    const 全部の字 = 見本.flatMap(([, d]) => [...描いた字(d), ...段の字(d)]).join("\n");
    const 使われない = Object.keys(残してよい語).filter(
      (語) => !new RegExp(`(^|[^A-Za-z])${語}([^A-Za-z]|$)`).test(全部の字),
    );
    expect(使われない).toEqual([]);
  });
});

describe("拾い方の対照", () => {
  it("日本語だけの図からは何も拾わない", () => {
    expect(英語の残り("土台", 土台("申請の受付"))).toEqual([]);
  });

  it("箱の題に置いた英語の語を拾う", () => {
    expect(英語の残り("土台", 土台("Submit request"))).toEqual([
      "Submit (「Submit request」)",
      "request (「Submit request」)",
    ]);
  });

  it("段の説明に置いた英語の語を拾う", () => {
    const d = 土台("申請の受付");
    const 植えた = { ...d, phases: d.phases.map((p) => ({ ...p, body: "申請を review する。" })) };
    expect(英語の残り("土台", 植えた)).toEqual(["review (「申請を review する。」)"]);
  });

  it("残してよい語は拾わない", () => {
    expect(英語の残り("土台", 土台("API の受付"))).toEqual([]);
  });
});
