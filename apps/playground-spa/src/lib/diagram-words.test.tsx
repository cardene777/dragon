/**
 * 見本帳の図に、英語の仮置きの字が残っていないこと (#1778 / #1859)。
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
 * ## どこまで見るか (#1859)
 *
 * **見本帳の置き場にある `*.cdl.ts` を全部**。 #1778 では `presets.cdl.ts` だけを import して
 * おり、12 file 444 件のうち 21 件しか見ていなかった。 外した理由はどこにも書かれておらず、
 * 残り 423 件はどの検査からも読まれていなかった。
 *
 * file を手で並べる形は **書き手が思い付いた file が上限** になるので、置き場を走査して導く。
 *
 * 英語が残る file は `図の字の天井` に **いまの数** を置く。 外す / 入れるの 2 値にすると、
 * あと 3 語で 0 になる file も手付かずの file も同じ扱いになって、減った分が見えない。
 * 天井 0 の file は 1 語でも戻れば落ちる厳しい判定に回る。
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

/**
 * 見本帳の図の置き場にある file を全部読む (#1859)。
 *
 * `eager` で読むのは、走査の途中で待たないため。 444 件を描いて 555ms なので重くない。
 */
const 見本帳 = import.meta.glob<Record<string, unknown>>("../topics/catalog/*.cdl.ts", {
  eager: true,
});

/** 図とみなす export = 箱と段の並びを持つ object */
function 図か(v: unknown): v is CdlDiagram {
  return (
    typeof v === "object" &&
    v !== null &&
    Array.isArray((v as CdlDiagram).nodes) &&
    Array.isArray((v as CdlDiagram).phases)
  );
}

/**
 * 見本帳の図を file ごとに導く (#1859)。
 *
 * `file数` を返すのは、置き場を読めていない時に「図が 0 件」 と区別するため。
 */
function 見本帳の図(): { 件: { file: string; 鍵: string; 図: CdlDiagram }[]; file数: number } {
  const 件: { file: string; 鍵: string; 図: CdlDiagram }[] = [];
  for (const [path, mod] of Object.entries(見本帳)) {
    const file = path.slice(path.lastIndexOf("/") + 1);
    for (const [鍵, v] of Object.entries(mod)) if (図か(v)) 件.push({ file, 鍵, 図: v });
  }
  return { 件, file数: Object.keys(見本帳).length };
}

/**
 * file ごとの、英語が残る図と語の天井 (#1859)。
 *
 * **減った時も落とす** = 下回ったまま通すと、一度直した分がまた増えても気付けない。
 * 落ちた時の文で下げる先を出す。
 *
 * `presets.cdl.ts` が 0 なのは #1778 で全部日本語に直したから。 **0 の file は
 * 1 語でも戻れば落ちる厳しい判定に回る** (下の `it.each`)。
 *
 * `charts.cdl.ts` の 3 種のように 0 に近い file がある。 外す / 入れるの 2 値にすると
 * こういう file が手付かずの file と同じ扱いになるので、数で持つ。
 */
const 図の字の天井: Record<string, { 図: number; 語: number; 延べ: number }> = {
  "animation.cdl.ts": { 図: 7, 語: 26, 延べ: 50 },
  "charts.cdl.ts": { 図: 7, 語: 3, 延べ: 11 },
  "cookbook.cdl.ts": { 図: 26, 語: 172, 延べ: 304 },
  "ethereum.cdl.ts": { 図: 2, 語: 12, 延べ: 14 },
  "interactive.cdl.ts": { 図: 113, 語: 814, 延べ: 1788 },
  "parts.cdl.ts": { 図: 23, 語: 29, 延べ: 32 },
  "patterns.cdl.ts": { 図: 12, 語: 90, 延べ: 161 },
  "presets.cdl.ts": { 図: 0, 語: 0, 延べ: 0 },
  "primitives-extra.cdl.ts": { 図: 21, 語: 81, 延べ: 158 },
  "primitives.cdl.ts": { 図: 89, 語: 532, 延べ: 1226 },
  "styles.cdl.ts": { 図: 10, 語: 20, 延べ: 77 },
  "text-dsl.cdl.ts": { 図: 13, 語: 69, 延べ: 99 },
};

/** file ごとに、英語が残る図の数と語の種類と延べを数える */
function file別に数える(): Map<string, { 図: number; 語: Set<string>; 延べ: number }> {
  const 表 = new Map<string, { 図: number; 語: Set<string>; 延べ: number }>();
  for (const r of 見本帳の図().件) {
    const 行 = 表.get(r.file) ?? { 図: 0, 語: new Set<string>(), 延べ: 0 };
    const 残り = 英語の残り(r.鍵, r.図);
    if (残り.length > 0) {
      行.図 += 1;
      行.延べ += 残り.length;
      for (const w of 残り) 行.語.add(w.slice(0, w.indexOf(" (")));
    }
    表.set(r.file, 行);
  }
  return 表;
}

/**
 * 1 語でも英語が戻れば落ちる file の図。 **天井 0 の file から導く** =
 * file 名を 2 箇所に書くと片方だけ直って食い違う。
 */
const 見本: [string, CdlDiagram][] = 見本帳の図()
  .件.filter((r) => 図の字の天井[r.file]?.図 === 0)
  .map((r) => [r.鍵, r.図]);

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

describe("英語が片付いた見本の図の字 (#1778)", () => {
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

  it("残してよい語は、 どれかの図で実際に使われている", () => {
    // 使われない語が残ると、 同じ語が仮置きとして戻った時に黙って通る。
    // **見本帳の図を全部見る** (#1859) = 一覧は 12 file すべてに効くので、
    // 1 file の中だけで死蔵を判定すると別の file で生きている語を死蔵と読む
    const 全部の字 = 見本帳の図()
      .件.flatMap((r) => [...描いた字(r.図), ...段の字(r.図)])
      .join("\n");
    const 使われない = Object.keys(残してよい語).filter(
      (語) => !new RegExp(`(^|[^A-Za-z])${語}([^A-Za-z]|$)`).test(全部の字),
    );
    expect(使われない).toEqual([]);
  });
});

describe("見本帳の図に残る英語の歯止め (#1859)", () => {
  it("いまの天井を超えていない、下回ってもいない", () => {
    const { 件, file数 } = 見本帳の図();
    const 表 = file別に数える();
    console.log(
      `[図の字] file=${file数} 図=${件.length} / ` +
        [...表.entries()]
          .sort()
          .map(([f, r]) => `${f} 図=${r.図} 語=${r.語.size} 延べ=${r.延べ}`)
          .join(" / "),
    );
    // 空振り防止 = 置き場を読めていないと 3 つの数がそろって 0 になり、天井の下回りで落ちる。
    // それでも下限を置くのは、**落ちた時に直す先が違う** ため
    // (天井の下回りは「直したので下げる」、下限は「置き場の走査が壊れた」)
    expect(file数, "見本帳の file を 1 つも読めていない (検査が空振りしている)").toBeGreaterThan(5);
    expect(件.length, "図を 1 件も見つけていない (検査が空振りしている)").toBeGreaterThan(100);
    for (const [f, r] of [...表.entries()].sort()) {
      const 上 = 図の字の天井[f];
      expect(上, `天井の表に無い file がある: ${f} (表に 1 行足す)`).toBeDefined();
      for (const [名, いま, 天井] of [
        ["図", r.図, 上!.図],
        ["語", r.語.size, 上!.語],
        ["延べ", r.延べ, 上!.延べ],
      ] as const) {
        expect(
          いま,
          `${f} の ${名} が天井を超えた。 直すか、直せない理由を書く (${天井} → ${いま})`,
        ).toBeLessThanOrEqual(天井);
        expect(
          いま,
          `${f} の英語が減ったので天井を下げる (${名}: ${天井} → ${いま})`,
        ).toBeGreaterThanOrEqual(天井);
      }
    }
  });

  it("天井の表と走査した file が一致している (母集団の完全性)", () => {
    // 表に 1 行足し忘れた file は、上の検査が拾うまで気付けない。 逆に、消えた file の
    // 行が残ると **その行は永久に何も守らない**。 両方向を見る
    const 走査 = [...file別に数える().keys()].sort();
    expect(走査.length, "file を 1 つも走査していない (検査が空振りしている)").toBeGreaterThan(5);
    expect(走査, "天井の表と走査した file が食い違っている").toEqual(
      Object.keys(図の字の天井).sort(),
    );
  });

  it("天井 0 の file が実在し、厳しい判定に回っている (収容対照)", () => {
    // 直し終えた file が候補から消える形だと、直した先を 1 件も見ていないことになる
    const 零 = Object.entries(図の字の天井)
      .filter(([, r]) => r.図 === 0)
      .map(([f]) => f);
    expect(零, "天井 0 の file が 1 つも無い (厳しい判定の相手が居ない)").not.toEqual([]);
    const 走査 = file別に数える();
    for (const f of 零) {
      expect(走査.has(f), `天井 0 の file を走査していない: ${f}`).toBe(true);
      expect(
        見本帳の図().件.filter((r) => r.file === f).length,
        `${f} の図を 1 件も見つけていない`,
      ).toBeGreaterThan(0);
    }
    // 厳しい判定の相手が、天井 0 の file の図と同じ数になっている
    expect(見本.length).toBe(
      見本帳の図().件.filter((r) => 零.includes(r.file)).length,
    );
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
