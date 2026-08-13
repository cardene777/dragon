/**
 * 設計 (`docs/design/app.pen`) と実装の構成が揃っていることの検証 (#1128)。
 *
 * 配色は `palette-matches-pen.spec.ts` が見る (#1124)。 こちらは **節の有無** を見る。
 *
 * 突き合わせを手でやった時、 節の欠け 15 件のうち 14 件が設計の見本データ由来の雑音だった
 * (#1126 の調査)。 選別を手でやると次に比べる人が同じ選別をやり直すので、 機械化して
 * **除外を 1 件ずつ理由つきで宣言する**。
 *
 * ## 除外は宣言に無いと通らない
 *
 * 宣言に無い欠けが出たら落ちる = 設計に節を足して実装し忘れた形を検知する。
 *
 * 逆に **除外した節が実装に現れても落ちる**。 宣言が古くなったまま残ると、 本当に実装された
 * 節をいつまでも「雑音」 として無視し続けることになる。
 *
 * ## 見本データを実データに寄せない
 *
 * 設計が満杯の状態を描くのは意図的で、 実装が今そう見えないのは中身の量の違い。
 * 寄せると設計の役目 (どう見えるかを先に決める) が減り、 見本が増減するたびに設計が古くなる。
 * 雑音は消えず遅れて戻る。 だから寄せずに、 除外として宣言する。
 *
 * ## 対応表そのものも検査する (#1132)
 *
 * 下の `画面` は手で書いた対応表で、 **載せ忘れた frame は黙って無視される**。 実際に
 * `03b` と `06b` が漏れ、 `/ Dark` の 11 枚は最初から対象外だった。
 *
 * 設計の frame が対応表に全件載っていることを別の検査で見る。 明暗で構成が食い違う形も落とす。
 *
 * **「載っている」 を数える前に、 数える母集合そのものを固定する** (review 指摘)。 母集合が
 * 揺れると網羅の検査は成立しない = 4 つの抜け道がある。
 *
 * | 抜け道 | 塞ぎ方 |
 * |---|---|
 * | 明暗以外の尾 (`/ Sepia`) や尾なしで画面を足す | 尾を持たない frame は `共通部品` に宣言が要る |
 * | 同名 frame を 2 枚置く | `Map` の後勝ちを名前の重複検査で先に落とす |
 * | 画面 frame を入れ子に置く | 番号の前置か明暗の尾を持つ frame は top-level に限る |
 * | 状態違いの `元` を自分自身や別の状態違いにする | `元` は `画面` の行に限る |
 *
 * **母集合は名前で決めているので、 名前を捨てれば外れる**。 番号の前置も明暗の尾も持たない
 * 名前 (`新画面` 等) で画面を入れ子に置くと、 入れ子 4225 node のどれとも名前で区別できず
 * 検出できない。 したがって本 file が保証するのは「**名前の規約に従った frame** が対応表に
 * 全件載っている」 までで、 規約そのものは人が守る。
 *
 * 名前での推測をやめて `.pen` 側に画面の目印を持たせる案は #1134 に分けた。 名前の条件を
 * 足す形で 3 round 追ったが、 足すたびに次の抜け道が出て収束しなかったため。
 */
import { test, expect, type Page } from "@playwright/test";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const 読む = (rel: string): string => readFileSync(fileURLToPath(new URL(rel, import.meta.url)), "utf8");

/** 節の見出しとみなす字の大きさ。 */
const 節の大きさ = 24;

/**
 * 大きい字でも節ではないもの = **数字だけの字**。
 *
 * 設計は装飾の数字にも大きい字を使う (`01/02/03` の段の番号、 `404` の桁、 版の番号、
 * 統計の値)。 これらは節の見出しではなく、 隣に本当の見出しがある。
 *
 * 節かどうかを大きさだけで決めると装飾を節と誤認するので、 数字だけの字は先に外す。
 * 判定を 1 件ずつの除外に書くと、 装飾が増えるたびに宣言が伸びて中身が薄まる。
 */
const 数字だけ = (s: string): boolean => /^v?[\d.]+x?$/u.test(s);

/** 画面ごとの対応。 `設計` は `.pen` の frame 名から `/ Light` を除いたもの。 */
const 画面 = [
  { 設計: "01 トップ", path: "/" },
  { 設計: "02 カタログ一覧", path: "/catalog" },
  // 設計が描いているのは「アニメーション」 の分類。 `#1128` はここを `/catalog/presets` に
  // 向けたまま「実装は既定のプリセットだから違う」 と読み、 分類名を除外に宣言していた。
  // 実装は分類ごとに経路を持つ (`/catalog/:slug`) ので、 描かれている分類に向ける (#1132)。
  { 設計: "03 カタログの分類", path: "/catalog/animation" },
  { 設計: "04 エディタ", path: "/editor" },
  { 設計: "05 ドキュメント", path: "/docs" },
  { 設計: "06 見本の詳細", path: "/preset/sequence" },
  { 設計: "07 更新履歴", path: "/release-notes" },
  { 設計: "08 参加方法", path: "/contribute" },
  { 設計: "09 見つからない頁", path: "/no-such-page" },
] as const;

/**
 * 実装に無くてよい節。 1 件ずつ画面と理由を書く。 ここに無い欠けが出たら落ちる。
 *
 * **理由は観測に基づいて書く**。 `#1128` は 5 件のうち 4 件を「実装は別の状態を開くから」 と
 * 読んでいたが、 実物 (`.pen` の階層と実装の見出し) を見ると別の理由だった (#1132)。
 * 理由が違うと、 次に読む人が「もう解消できる」 か「まだ解消できない」 かを判断できない。
 */
const 除外 = [
  // 設計は分類の項目を **縦積みで並べる**。 実装は左に一覧 + 右に選んだ 1 件で、 一覧の項目は
  // 見出しではない (`div`)。 作りが違うので、 設計の項目名はどの見出しとも当たらない。
  //
  // 項目名の出どころも違う。 設計は `docs/design/specs/screens.md`、 実装は `src/lib/i18n.ts`。
  // 語を揃えても作りは揃わないので、 描き直すか据え置くかの判断は別で行う。
  { 画面: "03 カタログの分類", 節: "局面での推移" },
  { 画面: "03 カタログの分類", 節: "数値の補間" },
  { 画面: "03 カタログの分類", 節: "名札での局面表示" },

  // 設計の見本「送金と手数料」 は実装のどの見本にも無い (`src/lib/presets.ts` の 20 件、
  // 設計が描く前後の見本「3 層構成」 「受注データ」 も同じく無い)。 図そのものの描き直しが
  // 要るので、 文言合わせでは消せない。
  { 画面: "06 見本の詳細", 節: "送金と手数料" },

] as const;

/**
 * 状態違いの frame。 元の frame に操作を 1 つ加えた姿を描いたもの。
 *
 * 節は元と同じなので、 実装との突き合わせは元の frame が担う。 **元と食い違ったら落ちる** =
 * 重ね窓にだけ節を足したなら、 その frame は対応表 (`画面`) に自分の行を持つ必要がある。
 */
const 状態違い = [
  // 図を拡大した重ね窓。 元の画面の上に載るだけで、 節は増えない
  { 設計: "03b カタログの分類 重ね窓", 元: "03 カタログの分類" },
  // コピーに失敗した時の報せ。 元の画面の上に載るだけで、 節は増えない
  { 設計: "06b 見本の詳細 コピー失敗", 元: "06 見本の詳細" },
] as const;

/**
 * 画面ではない frame。 複数の画面が参照する共通部品で、 明暗の対を持たない。
 *
 * **宣言しないと落ちる**。 明暗の尾を持たず、 ここにも無い frame は「画面なのか部品なのか」
 * を決められない = 新しい命名で足した画面が黙って検査の外に落ちる (review 指摘)。
 */
const 共通部品: readonly string[] = ["C / TopBar", "C / Buttons"];

/** 画面 frame の名前が持つ尾。 明暗は対で描くので、 どちらか片方だけの frame は落とす。 */
const 明暗 = ["Light", "Dark"] as const;
type 明暗 = (typeof 明暗)[number];

type Node = {
  type?: string;
  id?: string;
  name?: string;
  content?: string;
  fontSize?: number;
  reusable?: boolean;
  ref?: string;
  descendants?: Record<string, { content?: string }>;
  children?: Node[];
};

const 設計を読む = (): { children?: Node[] } =>
  JSON.parse(読む("../../../docs/design/app.pen")) as { children?: Node[] };

/**
 * frame の並びそのものを見る。 節の中身ではなく **どんな frame があるか** を返す。
 *
 * 節を集める側 (`設計の節`) は `Map` に詰めるため、 同名 frame の 2 枚目が 1 枚目を
 * 黙って上書きする。 上書きされた側の節差は誰にも見えなくなるので、 名前の重複はここで見る。
 */
function 設計のframe構成(): {
  /** top-level frame 名 (出現順、 重複もそのまま) */
  一覧: string[];
  /** 2 枚以上ある frame 名 */
  重複: string[];
  /** 画面のはずなのに置き場所か名前が規約から外れているもの */
  置き場所違反: string[];
} {
  const doc = 設計を読む();
  const 一覧 = (doc.children ?? []).map((f) => f.name ?? "");
  const 見た = new Set<string>();
  const 重複 = new Set<string>();
  for (const n of 一覧) {
    if (見た.has(n)) 重複.add(n);
    見た.add(n);
  }

  /**
   * 画面 frame は **top-level に置き、 明暗の尾を持つ**。 どちらかを外すと `設計の節` の
   * 走査 (top-level + 尾) から抜け、 対応表に載せなくても検査されない。
   *
   * 「画面のはず」 の判定は 2 つ。 **番号の前置** (`01 ` / `03b ` = 全 22 画面が持ち、
   * 入れ子 4225 node は 1 つも持たない) か、 **明暗の尾**。 どちらかに当たる frame が
   * 規約の位置に無ければ落とす。
   *
   * 入れ子の frame すべてに分類を求めることはしない = 入れ子は画面の部位 (`Page Head` /
   * `Item List` 等) で、 名前だけでは画面と区別できない。 番号か尾のどちらかを持つ形に
   * 絞ることで、 「画面を書いたのに置き場所を間違えた」 だけを拾う。
   */
  const 番号前置 = /^\d{2}[a-z]? /u;
  const 尾あり = (nm: string): boolean => 明暗.some((t) => nm.endsWith(` / ${t}`));
  const 置き場所違反: string[] = [];
  const 潜る = (n: Node, 深さ: number): void => {
    const nm = n.name ?? "";
    const 画面のはず = 番号前置.test(nm) || 尾あり(nm);
    if (画面のはず && !(深さ === 0 && 尾あり(nm))) {
      置き場所違反.push(深さ === 0 ? `${nm} (明暗の尾が無い)` : `${nm} (入れ子に置かれている)`);
    }
    for (const c of n.children ?? []) 潜る(c, 深さ + 1);
  };
  for (const c of doc.children ?? []) 潜る(c, 0);

  return { 一覧, 重複: [...重複], 置き場所違反 };
}

/**
 * 設計の節の見出しを画面ごとに集める。
 *
 * `見る明暗` で見る frame を選ぶ。 返る key は frame 名から ` / Light` ` / Dark` を除いたもので、
 * 明暗どちらを読んでも同じ key になる = そのまま突き合わせられる。
 *
 * **値は重複を落とさない**。 落とすと片側にだけ同じ節が 2 つある差が消え、 明暗の比較が
 * 一致してしまう (review 指摘)。 実装との突き合わせ側で必要なら呼出側が一意化する。
 */
function 設計の節(見る明暗: 明暗 = "Light"): Map<string, string[]> {
  const doc = 設計を読む();
  const 部品 = new Map<string, Node>();
  const 探す = (n: Node): void => {
    if (n.reusable === true && n.id !== undefined) 部品.set(n.id, n);
    for (const c of n.children ?? []) 探す(c);
  };
  for (const c of doc.children ?? []) 探す(c);

  /**
   * 節の見出しを集める。 **隣り合う同じ大きさの字は 1 つに繋ぐ**。
   *
   * 設計は 1 つの見出しを色分けのために複数の字に割ることがある
   * (トップの `書くと、` / `動く` / `。` は 74px の 3 つで 1 つの見出し)。
   * 割れたまま比べると、 実装の 1 つの見出しと突き合わせられない。
   */
  const 集める = (
    n: Node,
    群: { 字: string; px: number }[][],
    差?: Record<string, { content?: string }>,
  ): void => {
    if (n.type === "ref" && n.ref !== undefined && 部品.has(n.ref)) {
      集める(部品.get(n.ref)!, 群, n.descendants);
      return;
    }
    // 直下の字だけを 1 つの群にまとめる。 子 frame は別の群として辿る
    const 直下: { 字: string; px: number }[] = [];
    for (const c of n.children ?? []) {
      if (c.type === "text") {
        const t = String(差?.[c.id ?? ""]?.content ?? c.content ?? "").trim();
        const px = typeof c.fontSize === "number" ? c.fontSize : 0;
        if (t !== "" && px >= 節の大きさ) 直下.push({ 字: t, px });
        continue;
      }
      集める(c, 群, 差);
    }
    if (直下.length > 0) 群.push(直下);
  };

  /**
   * 同じ親の直下で隣り合う同じ大きさの字を 1 つに繋ぎ、 数字だけの字を落とす。
   *
   * **親が違えば繋がない**。 同じ大きさの別々の節 (`5 分で動かす` と `9 実用例` 等) を
   * 繋いでしまい、 実装のどの見出しとも一致しなくなる。
   */
  const 繋ぐ = (群: { 字: string; px: number }[][]): string[] => {
    const out: string[] = [];
    for (const a of 群) {
      let 束: { 字: string; px: number } | null = null;
      for (const x of a) {
        if (束 !== null && 束.px === x.px) {
          束 = { 字: 束.字 + x.字, px: x.px };
          continue;
        }
        if (束 !== null) out.push(束.字);
        束 = x;
      }
      if (束 !== null) out.push(束.字);
    }
    return out.filter((t) => !数字だけ(t));
  };

  const 尾 = ` / ${見る明暗}`;
  const out = new Map<string, string[]>();
  for (const f of doc.children ?? []) {
    const nm = f.name ?? "";
    if (!nm.endsWith(尾)) continue;
    const 群: { 字: string; px: number }[][] = [];
    集める(f, 群);
    out.set(nm.slice(0, -尾.length), 繋ぐ(群));
  }
  return out;
}

/**
 * 実装の画面の **見出し** を集める。
 *
 * **画面全体の字と照合してはいけない**。 節の見出しが消えても、 上の帯や本文に同じ語が
 * 残っていれば通ってしまう (review 指摘)。 節が節として立っているかを見る。
 *
 * `h1`-`h3` に加えて、 見出しの役目を持つ要素 (`.step-num` の隣の見出し等) も拾えるよう
 * `role="heading"` も見る。
 */
async function 実装の見出し(page: Page, path: string): Promise<string[]> {
  await page.goto(path);
  await page.waitForLoadState("networkidle");
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(1200);
  return await page.evaluate(() => {
    const out: string[] = [];
    for (const e of document.querySelectorAll('h1, h2, h3, h4, [role="heading"]')) {
      const c = getComputedStyle(e);
      const r = e.getBoundingClientRect();
      if (c.display === "none" || c.visibility === "hidden") continue;
      if (r.width < 2 || r.height < 2) continue;
      const t = (e.textContent ?? "").trim();
      if (t !== "") out.push(t);
    }
    return out;
  });
}

const 正規化 = (s: string): string => s.normalize("NFKC").replace(/\s+/gu, "");

test("設計の frame が対応表に全件載っている", () => {
  const 構成 = 設計のframe構成();
  const 明 = 設計の節("Light");
  const 暗 = 設計の節("Dark");
  expect(明.size, "`.pen` から明るい側の frame を 1 つも読めていない").toBeGreaterThan(5);

  // 名前が重なると `設計の節` の `Map` が後勝ちで上書きし、 先の 1 枚の節差が消える
  expect(構成.重複, "同じ名前の frame が 2 枚以上ある").toEqual([]);

  // 画面のはず (番号の前置か明暗の尾を持つ) の frame が規約の位置に無ければ落とす
  expect(
    構成.置き場所違反,
    "画面は top-level に置き、 明暗の尾を持たせること",
  ).toEqual([]);

  // **明暗の尾で画面を判別している**。 尾を持たない frame は共通部品として宣言が要る =
  // 別の命名 (`/ Sepia` / 尾なし) で画面を足しても検査の外に落ちない
  const 未分類 = 構成.一覧.filter(
    (n) => !明暗.some((t) => n.endsWith(` / ${t}`)) && !共通部品.includes(n),
  );
  expect(
    未分類,
    "画面でも共通部品でもない frame (共通部品に宣言するか、 明暗の対で描くこと)",
  ).toEqual([]);

  const 消えた部品 = 共通部品.filter((n) => !構成.一覧.includes(n));
  expect(消えた部品, "共通部品に宣言されているが設計に無い frame").toEqual([]);

  const 載っている = new Set<string>([...画面.map((x) => x.設計), ...状態違い.map((x) => x.設計)]);

  const 漏れ = [...明.keys()].filter((n) => !載っている.has(n));
  expect(漏れ, "設計にあるのに対応表 (画面 / 状態違い) に無い frame").toEqual([]);

  const 幽霊 = [...載っている].filter((n) => !明.has(n));
  expect(幽霊, "対応表にあるのに設計に無い frame").toEqual([]);

  // 明暗は対で描く。 片側だけ足す / 消すと、 もう片方は誰も見ていない状態になる
  const 片側 = [
    ...[...明.keys()].filter((n) => !暗.has(n)).map((n) => `${n} (明るい側だけ)`),
    ...[...暗.keys()].filter((n) => !明.has(n)).map((n) => `${n} (暗い側だけ)`),
  ];
  expect(片側, "明暗の片側しか無い frame").toEqual([]);
});

test("明暗 2 種の frame で節が同じ", () => {
  // 構成は明暗で変わらない。 変わるのは色だけ (色は `palette-matches-pen.spec.ts` が見る)。
  // 片側にだけ節を足すと、 実装との突き合わせは明るい側しか見ないため気付けない。
  const 明 = 設計の節("Light");
  const 暗 = 設計の節("Dark");
  const 食い違い: string[] = [];
  for (const [名, 節] of 明) {
    const d = 暗.get(名);
    // 片側の欠けは 1 つ上の検査が見る。 ここでは中身の差だけを見る
    if (d === undefined) continue;
    if (JSON.stringify(節) !== JSON.stringify(d)) {
      食い違い.push(`${名}: 明 ${JSON.stringify(節)} / 暗 ${JSON.stringify(d)}`);
    }
  }
  expect(食い違い, "明暗で節が違う frame").toEqual([]);
});

test("状態違いの frame は元と同じ節を持つ", () => {
  const 明 = 設計の節("Light");
  const 画面名 = new Set<string>(画面.map((x) => x.設計));
  const 宣言済 = new Set<string>();
  const 食い違い: string[] = [];
  for (const x of 状態違い) {
    // **元は対応表 (`画面`) の画面でなければならない**。 状態違い同士を繋ぐと、 実装と
    // 突き合わせる相手がどこにも無いまま「元と同じ」 だけが成り立つ (review 指摘)。
    // 自分自身を元にする形も、 下の 2 つ目と併せてここで落ちる (常に一致して空回りする)。
    expect(画面名.has(x.元), `状態違い「${x.設計}」 の元「${x.元}」 が対応表 (画面) に無い`).toBe(
      true,
    );
    expect(画面名.has(x.設計), `状態違い「${x.設計}」 が対応表 (画面) にも載っている`).toBe(false);
    expect(宣言済.has(x.設計), `状態違い「${x.設計}」 が 2 回宣言されている`).toBe(false);
    宣言済.add(x.設計);

    const a = 明.get(x.設計);
    const b = 明.get(x.元);
    expect(a, `設計に「${x.設計}」 が無い`).toBeDefined();
    expect(b, `状態違いの元「${x.元}」 が設計に無い`).toBeDefined();
    if (JSON.stringify(a) !== JSON.stringify(b)) {
      食い違い.push(`${x.設計} ${JSON.stringify(a)} / ${x.元} ${JSON.stringify(b)}`);
    }
  }
  expect(
    食い違い,
    "状態違いの frame が元と違う節を持つ (対応表 `画面` に自分の行を持たせること)",
  ).toEqual([]);
});

/**
 * 節ではないが、 **設計と実装で同じでなければならない字**。
 *
 * 節の突き合わせは 24px 以上しか見ない。 トップの説明文は 15.5px なので閾値の下にあり、
 * 見出しだけ直して説明文を旧いまま残す形がすり抜けた (#1139 の review 指摘、 実際に踏んだ)。
 *
 * 閾値を下げると全画面の小さい字が対象になり、 除外の宣言が膨らむ。 代わりに
 * **1 箇所ずつ名指しで** 突き合わせる。 増やす時はここに 1 行足す。
 */
const 節以外の照合 = [
  {
    名: "トップの説明文",
    path: "/",
    選ぶ: ".hero .lead",
    /** `.pen` の中の text node の id (明暗 2 枚)。 名前では引けないので id で指す */
    id: ["XI97C", "kt70p"],
  },
] as const;

test("節ではないが揃えると決めた字が一致する", async ({ page }) => {
  const doc = 設計を読む();
  const 拾う = (id: string): string | null => {
    let 見つけた: string | null = null;
    const 歩く = (n: Node): void => {
      for (const c of n.children ?? []) {
        if (c.type === "text" && c.id === id) 見つけた = String(c.content ?? "");
        歩く(c);
      }
    };
    歩く(doc as Node);
    return 見つけた;
  };

  for (const x of 節以外の照合) {
    const 設計側 = x.id.map((id) => {
      const t = 拾う(id);
      expect(t, `設計に id=${id} の字が無い (${x.名})`).not.toBeNull();
      return 正規化(t!);
    });
    // 明暗で同じ字であること
    expect(new Set(設計側).size, `${x.名} が明暗で違う`).toBe(1);

    await page.goto(x.path);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(600);
    const 実装側 = await page.$$eval(x.選ぶ, (els) =>
      els.map((e) => (e.textContent ?? "").trim()),
    );
    expect(実装側.length, `${x.path} に ${x.選ぶ} が無い`).toBe(1);
    expect(正規化(実装側[0]), `${x.名} が設計と実装で違う`).toBe(設計側[0]);
  }
});

test("設計の節が実装にある (除外は宣言したものだけ)", async ({ page }) => {
  const 設計 = 設計の節();
  expect(設計.size, "`.pen` から画面を 1 つも読めていない").toBeGreaterThan(5);

  const 宣言 = new Set(除外.map((x) => `${x.画面} / ${正規化(x.節)}`));
  const 未宣言: string[] = [];
  const 使われた = new Set<string>();

  for (const { 設計: 名, path } of 画面) {
    const 節 = 設計.get(名);
    expect(節, `設計に「${名}」 の frame が無い`).toBeDefined();
    // 設計が節を 1 つも持たない画面 (エディタは道具が並ぶだけで節が無い) は照合しない
    if (節!.length === 0) continue;

    const 見出し = (await 実装の見出し(page, path)).map(正規化);
    expect(
      見出し.length,
      `${path} から見出しを 1 つも読めていない (設計は節を ${節!.length} 件持つ)`,
    ).toBeGreaterThan(0);

    // 同じ節が 2 つあっても実装との照合は 1 回でよい (重複は明暗の比較側が見る)
    for (const s of new Set(節!)) {
      const key = `${名} / ${正規化(s)}`;
      // **完全一致で照合する**。 部分一致にすると、 設計の 1 節に実装の複数の見出しが
      // 当たり、 片方を消しても通る (review 指摘 = 「コントリビュート」 が
      // 「dragon にコントリビュートする」 と「コントリビュート方法」 の両方に当たった)。
      //
      // 言い回しが違う節は下の `除外` に宣言する。 許す差を宣言に集めることで、
      // 「なぜ揃っていないか」 が 1 箇所に残る。
      const n = 正規化(s);
      if (見出し.includes(n)) {
        // 実装に出ている。 除外に宣言されていたなら、 その宣言はもう古い
        if (宣言.has(key)) 使われた.add(key);
        continue;
      }
      if (宣言.has(key)) { 使われた.add(key); continue; }
      未宣言.push(`${名}: 「${s}」`);
    }
  }

  expect(未宣言, "設計にあって実装に無い節 (除外に宣言が無い)").toEqual([]);

  // 宣言したのに設計から消えた節。 宣言が実態とずれた合図
  const 余り = [...宣言].filter((k) => !使われた.has(k)).map((k) => k.replace(" / ", ": "));
  expect(余り, "除外に宣言されているが設計に無い節 (宣言が古い)").toEqual([]);
});

test("除外した節が実装に現れたら知らせる", async ({ page }) => {
  // 宣言が古くなったまま残ると、 本当に実装された節をいつまでも雑音として無視し続ける。
  const 現れた: string[] = [];
  const 見出しごと = new Map<string, string[]>();
  for (const x of 除外) {
    const 対応 = 画面.find((p) => p.設計 === x.画面);
    expect(対応, `除外の「${x.画面}」 に対応する画面が無い`).toBeDefined();
    if (!見出しごと.has(x.画面)) {
      見出しごと.set(x.画面, (await 実装の見出し(page, 対応!.path)).map(正規化));
    }
    // 短い節 (数字だけ等) が本文に出ることはあるので、 **見出しとして** 出ているかを見る
    if (見出しごと.get(x.画面)!.some((h) => h === 正規化(x.節))) 現れた.push(`${x.画面}: 「${x.節}」`);
  }
  expect(現れた, "除外に宣言した節が実装に現れている (宣言を消すこと)").toEqual([]);
});
