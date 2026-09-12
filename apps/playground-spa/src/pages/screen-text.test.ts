/**
 * 画面に出る字に英語が残っていないことの検証 (#1785 / #1787)。
 *
 * 3 つの役を見る。
 *
 * | 役 | 中身 | 直した Issue |
 * |---|---|---|
 * | 分類名と札 | 見出しの上の前置き、札、通し番号 | #1785 |
 * | 日本語の文 | 説明文、釦の字、読み上げの字、知らせの字 | #1787 |
 * | 材料の字 | 画面が差し込みで出す字の実物 (`lib/` の一覧) | #1815 |
 *
 * **英語かどうかの判定はここに持たない** (#1817)。 残してよい語の一覧と語の切り出しは
 * `lib/screen-words.ts` が 1 つだけ持ち、画面の枠の検査も同じものを引く。
 * 検査ごとに持っていた間、同じ字に別の答えが返っていた (実測 80 件)。
 *
 * **言語の切り替えを足した札を候補から外さない**。 直す時に `{isJa ? "…" : "…"}` の形にすると、
 * 字を直に書いた札しか見ない検査からは候補ごと消える。 消えた分だけ検査は素通りするので、
 * 切り替えの形も拾って日本語の側を見る。
 *
 * 式で書かれていて読めない札は未解決として数え、件数と中身を検査が出す。 **件数をここに書かない** =
 * 札が増減するたびにずれる (#1806 で 1 件増えた時、ここは 1 件のままだった)。
 * 読めない札はそれぞれ別の検査が値を見ており、分類名は `presets.test.ts`、
 * 見本の数は `release-notes-count.test.tsx` が持つ。
 *
 * 文の側は差し込み (`{件数}`) を **文の一部** として読む (#1809)。 切れ目として扱うと、
 * 差し込みの後ろに続く字が候補から丸ごと外れる。
 *
 * 母集団は画面 file だけでなく **画面へ字を渡す材料 file** も見る (#1815)。 画面 file の側が
 * 差し込み (`{c.desc}`) しか持たない字は、材料を見ないと 1 文字も読まないまま通る。
 */
import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { 残る英単語, 日本語の字, 外す材料 } from "@/lib/screen-words";

/** 画面 file の置き場所。 file の一覧は手で並べず、ここから導く */
const 画面の置き場 = fileURLToPath(new URL(".", import.meta.url));

// ─── 役 1 = 分類名と札 (#1785) ───

/** 分類名・札・通し番号を表す class。 この 3 つが画面で「見出しの添え字」 の役 */
const 添え字の印 = /eyebrow|-tag|nm-preset-id/;

/** 言語を切り替える書き方。 日本語の側を取り出す */
const 切り替え = /^\{(?:isJa|locale === "ja") \? "([^"]*)" : "[^"]*"\}$/;

interface 添え字 {
  file: string;
  class名: string;
  /** 日本語として読む字。 式で書かれていて読めない時は `null` */
  字: string | null;
  生: string;
}

/** 画面の本文から添え字を拾う。 本番と植え込み対照が同じ関数を使う */
export function 添え字を拾う(src: string, file: string): 添え字[] {
  const out: 添え字[] = [];
  for (const m of src.matchAll(/<(span|div)\s+className="([^"]*)"\s*>([^<]*)<\/\1>/g)) {
    const class名 = m[2]!;
    if (!添え字の印.test(class名)) continue;
    const 生 = m[3]!.trim();
    if (生 === "") continue;
    const 切 = 生.match(切り替え);
    out.push({ file, class名, 字: 切 ? 切[1]! : 生.includes("{") ? null : 生, 生 });
  }
  return out;
}

/** 添え字のうち、英語の語が残っているもの */
export function 英語の残る添え字(list: 添え字[]): string[] {
  const out: string[] = [];
  for (const a of list) {
    if (a.字 === null) continue;
    const 残り = 残る英単語(a.字);
    if (残り.length > 0) out.push(`${a.file} (${a.class名}): ${a.字} → ${残り.join(", ")}`);
  }
  return out;
}

// ─── 役 2 = 日本語の文 (#1787) ───

/**
 * コメントと見本のコードを外す。
 *
 * どちらも画面に出ない字で、英語が入っていて当たり前。 外さないと検査が常に落ちる。
 * 逆引用符の塊を先にではなく後に外すのは、コメントの中に逆引用符が入っているため
 * (先に外すと対が崩れてコメントを外し損ねる)。
 */
export function コメントと見本を外す(src: string): string {
  return src
    .replace(/\/\*[\s\S]*?\*\//g, " ")
    .replace(/(^|[^:])\/\/[^\n]*/gm, "$1")
    .replace(/`[^`]*`/g, " ");
}

/**
 * 差し込み (`{件数}` / `{isJa ? "あ" : "い"}`)。 入れ子は 1 段まで取る。
 *
 * 逆引用符を含む差し込みは `コメントと見本を外す` が先に中身を空にするので、
 * ここでは中括弧の対だけを見れば足りる。
 */
const 差し込み = /\{(?:[^{}]|\{[^{}]*\})*\}/;

/**
 * `>` から `<` までの区間。 **差し込みを含む文も 1 つの区間として取る** (#1809)。
 *
 * 差し込みを区間の切れ目として扱うと、差し込みの後ろに続く字が候補から丸ごと外れる。
 * 実測で 11 件の文がこの形で外れており、その 1 つが英語を残したまま通っていた。
 */
const 要素の中身 = />((?:[^<>{}]|\{(?:[^{}]|\{[^{}]*\})*\})+)</g;

/**
 * 画面に出る日本語の文を拾う。
 *
 * **class の一覧を手で並べない**。 並べた時の数が上限になり、後から足した文が無防備に増える。
 * 中身から導く = 日本語を含む字はすべて画面に出る文とみなす。
 *
 * 差し込みそのものは値が入る所なので字としては読まず、前後の地の字に割る。
 */
export function 日本語の文を拾う(src: string): {
  文: string[];
  コード風: number;
  差し込み入り: number;
} {
  const s = コメントと見本を外す(src);
  const 素: string[] = [];
  let 差し込み入り = 0;
  for (const m of s.matchAll(要素の中身)) {
    const 中身 = m[1]!;
    if (差し込み.test(中身)) 差し込み入り += 1;
    for (const 片 of 中身.split(差し込み)) 素.push(片.trim());
  }
  for (const m of s.matchAll(/"([^"\\\n]*)"/g)) 素.push(m[1]!.trim());
  const 日本語を含む = 素.filter((t) => 日本語の字.test(t));
  // 型の指定 (`useState<string | null>(null)`) が `>` と `<` に挟まれて拾われる。
  // 打ち終わりを含む字はコードとみなして外し、外した件数を出す。
  //
  // **等号は外す理由にしない** (#1809)。 画面に出る字にも等号は出る
  // (`1 PR = 1 つの主題` / `hash に #d=<base64url> が無い` の 2 件が黙って落ちていた)。
  // 等号を条件から外してもコードは 1 件も漏れない (実測)
  const 文 = 日本語を含む.filter((t) => !/;/.test(t));
  return { 文, コード風: 日本語を含む.length - 文.length, 差し込み入り };
}

// ─── 走査 ───

/** 経路を並べている file。 どの画面が公開ビルドに出るかはここが決める */
const 経路のfile = fileURLToPath(new URL("../main.tsx", import.meta.url));

/**
 * 開発時だけ登録される画面の file 名を、経路の並びから導く (#1809)。
 *
 * **file 名を手で並べない**。 並べると、後から足した開発用の画面が候補に残って
 * 「画面の字に英語がある」 と読める形で落ちる。
 *
 * 探す形は `import.meta.env.DEV` と同じ行に書かれた経路で、その要素の名前を file 名にする。
 */
export function 開発時だけの画面(経路: string): string[] {
  return [...経路.matchAll(/import\.meta\.env\.DEV[^\n]*<Route[^\n]*element=\{<(\w+)\s*\/>\}/g)].map(
    (m) => `${m[1]!}.tsx`,
  );
}

interface 走査の内訳 {
  対象: number;
  走査: number;
  除外: string[];
}

function 画面のfile一覧(): { files: string[]; 内訳: 走査の内訳 } {
  const 全部 = readdirSync(画面の置き場).filter(
    (f) => f.endsWith(".tsx") && !f.includes(".test."),
  );
  const 外す = new Set(開発時だけの画面(readFileSync(経路のfile, "utf8")));
  const files = 全部.filter((f) => !外す.has(f));
  return {
    files,
    内訳: { 対象: 全部.length, 走査: files.length, 除外: 全部.filter((f) => 外す.has(f)) },
  };
}

function 全画面の添え字(): { list: 添え字[]; 内訳: 走査の内訳 } {
  const { files, 内訳 } = 画面のfile一覧();
  const list = files.flatMap((f) => 添え字を拾う(readFileSync(画面の置き場 + f, "utf8"), f));
  return { list, 内訳 };
}

function 全画面の文(): {
  文: { file: string; 字: string }[];
  内訳: 走査の内訳;
  コード風: number;
  差し込み入り: number;
} {
  const { files, 内訳 } = 画面のfile一覧();
  const 文: { file: string; 字: string }[] = [];
  let コード風 = 0;
  let 差し込み入り = 0;
  for (const f of files) {
    const r = 日本語の文を拾う(readFileSync(画面の置き場 + f, "utf8"));
    for (const 字 of r.文) 文.push({ file: f, 字 });
    コード風 += r.コード風;
    差し込み入り += r.差し込み入り;
  }
  return { 文, 内訳, コード風, 差し込み入り };
}

// ─── 役 3 = 画面へ字を渡す材料 (#1815) ───

/** 材料 file の置き場所。 画面に出る字の実物はここにある */
const 材料の置き場 = fileURLToPath(new URL("../lib/", import.meta.url));

/**
 * 材料 file から画面へ渡る字を拾う。 **引用符の中身だけを見る**。
 *
 * 画面 file と同じ探し方 (`>` から `<` までの区間) を当てると、型の指定 (`as Record<K, V>`)
 * や矢印の関数が区間として拾われ、コードが字に混ざる (実測 3 件)。
 * 材料 file は組み立てを持たないので、引用符の中身だけで足りる。
 *
 * **日本語を含む字だけを残す**。 この絞りが、言語切り替えの表の英語の側
 * (`i18n.ts` の `ITEM_NAME_EN`) を母集団から外している唯一の仕掛け (#1821)。
 * 絞りを外すなら、英語の側をどう扱うかを同時に決める必要がある。
 */
export function 材料の文を拾う(src: string): string[] {
  return [...コメントと見本を外す(src).matchAll(/"([^"\\\n]*)"/g)]
    .map((m) => m[1]!.trim())
    .filter((t) => 日本語の字.test(t) && !/;/.test(t));
}

/** 材料を引く側の置き場所。 どの材料が画面へ届くかはここから導く */
const 引く側の置き場 = [画面の置き場, fileURLToPath(new URL("../components/", import.meta.url))];

/**
 * 引く側が `@/lib/<名前>` の形で名指ししている材料の file 名を導く。
 *
 * **材料の file 名を手で並べない**。 並べた時の数が上限になり、後から足した材料が
 * 無防備なまま画面へ字を渡す。
 */
export function 引いている材料(src: string): string[] {
  return [...src.matchAll(/from\s+"@\/lib\/([\w.-]+)"/g)].map((m) => `${m[1]!}.ts`);
}

function 材料のfile一覧(): { files: string[]; 内訳: 走査の内訳 } {
  const 引かれた = new Set<string>();
  for (const 置き場 of 引く側の置き場) {
    for (const f of readdirSync(置き場).filter((f) => /\.tsx?$/.test(f) && !f.includes(".test."))) {
      for (const 名 of 引いている材料(readFileSync(置き場 + f, "utf8"))) 引かれた.add(名);
    }
  }
  const 実在 = new Set(
    readdirSync(材料の置き場).filter((f) => f.endsWith(".ts") && !f.includes(".test.")),
  );
  // 日本語の字を 1 つも持たない材料は画面へ字を渡していない。
  // 判定は引用符の中身で行う = 日本語の識別子 (`選んだ見本`) を持つだけの file を混ぜないため
  const 字を持つ = [...引かれた]
    .filter((f) => 実在.has(f))
    .filter((f) => 材料の文を拾う(readFileSync(材料の置き場 + f, "utf8")).length > 0)
    .sort();
  const files = 字を持つ.filter((f) => !(f in 外す材料));
  return {
    files,
    内訳: { 対象: 字を持つ.length, 走査: files.length, 除外: 字を持つ.filter((f) => f in 外す材料) },
  };
}

function 全材料の文(): { 文: { file: string; 字: string }[]; 内訳: 走査の内訳 } {
  const { files, 内訳 } = 材料のfile一覧();
  const 文: { file: string; 字: string }[] = [];
  for (const f of files) {
    for (const 字 of 材料の文を拾う(readFileSync(材料の置き場 + f, "utf8"))) {
      文.push({ file: `lib/${f}`, 字 });
    }
  }
  return { 文, 内訳 };
}

/** 画面 file と材料 file を合わせた、画面に出る字の全体 */
function 画面に出る文(): { file: string; 字: string }[] {
  return [...全画面の文().文, ...全材料の文().文];
}

describe("画面の分類名と札 (#1785)", () => {
  it("拾えた添え字の内訳を出す", () => {
    const { list, 内訳 } = 全画面の添え字();
    expect(内訳.走査, "画面 file を 1 つも見ていない (検査が空振りしている)").toBeGreaterThan(5);
    const 読めた = list.filter((a) => a.字 !== null);
    const 未解決 = list.filter((a) => a.字 === null);
    // 内訳を出さないと、候補から消えた札が「該当なし」 と同じに見える
    console.log(
      `[添え字] 対象=${内訳.対象} 走査=${内訳.走査} 除外=${内訳.除外.join(",") || "なし"}` +
        ` 拾えた=${list.length} 読めた=${読めた.length} 未解決=${未解決.length}` +
        (未解決.length > 0 ? `\n  未解決: ${未解決.map((a) => `${a.file}: ${a.生}`).join(" / ")}` : ""),
    );
    expect(list.length, "添え字を 1 件も拾えていない (検査が空振りしている)").toBeGreaterThan(20);
  });

  it("分類名と札に英語の語が残っていない", () => {
    const { list } = 全画面の添え字();
    const 残る = 英語の残る添え字(list);
    expect(残る, `英語の語が残る添え字:\n${残る.join("\n")}`).toEqual([]);
  });

  it("英語の添え字を拾える (植え込み対照)", () => {
    const 元 = `<span className="nm-eyebrow">参加のしかた</span>`;
    expect(英語の残る添え字(添え字を拾う(元, "元.tsx")), "土台に英語が混ざっている").toEqual([]);
    expect(添え字を拾う(元, "元.tsx"), "土台から添え字を拾えない").toHaveLength(1);
    const 英語 = `<span className="nm-eyebrow">BUG REPORT</span>`;
    expect(英語の残る添え字(添え字を拾う(英語, "植え.tsx"))).toHaveLength(1);
    // 残してよい語は拾わない
    const 残す = `<span className="nm-preset-tag">1 PR = 1 つの主題</span>`;
    expect(英語の残る添え字(添え字を拾う(残す, "残す.tsx"))).toEqual([]);
  });

  it("言語を切り替える形でも日本語の側を見る (植え込み対照)", () => {
    // ここが抜けると、切り替えを足した札が候補から消えて検査が素通りする
    const 直した = `<span className="eyebrow">{isJa ? "3 手順" : "3 steps"}</span>`;
    expect(添え字を拾う(直した, "切替.tsx")[0]?.字, "日本語の側を取り出せない").toBe("3 手順");
    expect(英語の残る添え字(添え字を拾う(直した, "切替.tsx"))).toEqual([]);
    const 直していない = `<span className="eyebrow">{isJa ? "use case" : "use case"}</span>`;
    expect(英語の残る添え字(添え字を拾う(直していない, "切替.tsx"))).toHaveLength(1);
    // 読めない式は英語の判定に混ぜず、未解決として数える
    const 式 = `<span className="nm-preset-tag">{TAG_NAME}</span>`;
    expect(添え字を拾う(式, "式.tsx")[0]?.字, "読めない式を字として読んでいる").toBeNull();
    expect(英語の残る添え字(添え字を拾う(式, "式.tsx"))).toEqual([]);
  });
});

describe("画面の日本語の文 (#1787)", () => {
  it("拾えた文の内訳を出す", () => {
    const { 文, 内訳, コード風, 差し込み入り } = 全画面の文();
    expect(内訳.走査, "画面 file を 1 つも見ていない (検査が空振りしている)").toBeGreaterThan(5);
    // 除外は「開発時だけ登録する画面」 で、公開ビルドに出ないため読み手が見る字を持たない。
    // 名前を手で並べず経路 (`main.tsx`) から導くので、足しても消しても内訳が追従する
    console.log(
      `[日本語の文] 対象=${内訳.対象} 走査=${内訳.走査} 除外=${内訳.除外.join(",") || "なし"}` +
        ` 拾えた=${文.length} 外した(コード風)=${コード風} 差し込み入りの区間=${差し込み入り}`,
    );
    // 下限は空振りを止めるための値で、今の件数ではない (実数は上の行に出す)。
    // 今の件数に合わせると、字を変数に替えただけの変更で「拾えていない」 と読める形で落ちる (#1805)
    expect(文.length, "日本語の文を 1 件も拾えていない (検査が空振りしている)").toBeGreaterThan(100);
    // 差し込みを含む区間を 1 つも拾えていないなら、#1809 で直した経路が死んでいる。
    // 件数ではなく「その形を見ているか」 を見るので、下限は 1 に置く
    expect(差し込み入り, "差し込みを含む区間を 1 つも拾えていない (#1809 の経路が死んでいる)").toBeGreaterThan(0);
  });

  it("日本語の文に英語の語が残っていない", () => {
    const 文 = 画面に出る文();
    const 残る = 文
      .map((t) => ({ ...t, 語: 残る英単語(t.字) }))
      .filter((t) => t.語.length > 0)
      .map((t) => `${t.file}: ${t.字.slice(0, 60)} → ${t.語.join(", ")}`);
    expect(残る, `日本語の文に英語の語が残る:\n${残る.join("\n")}`).toEqual([]);
  });

  it("コメントと見本のコードを外せている (対照)", () => {
    // 外し損ねると、画面に出ない字の英語で検査が常に落ちる。
    // 逆に外しすぎると、見つけるべき文を落とす。 両方向を実物で見る
    const src = readFileSync(画面の置き場 + "ContributePage.tsx", "utf8");
    const 外した = コメントと見本を外す(src);
    expect(src, "土台にコメントが無い (対照が空振りしている)").toContain("命令は実物に合わせる");
    expect(外した, "塊のコメントを外せていない").not.toContain("命令は実物に合わせる");
    const { 文 } = 日本語の文を拾う(src);
    expect(文, "画面に出る字まで外している").toContain("参加のしかた · みんなで作る");
  });

  it("除外する画面を経路から導けている (#1809)", () => {
    const { 内訳 } = 全画面の文();
    // 除外した名前が実在しなければ、導き方が何にも当たっていない
    const 実在 = readdirSync(画面の置き場);
    for (const f of 内訳.除外) expect(実在, `除外した画面が無い: ${f}`).toContain(f);
    expect(内訳.対象 - 内訳.走査, "除外の数と内訳が合わない").toBe(内訳.除外.length);

    // 植え込み対照 = 開発時の分岐を持つ経路から名前を取れる
    expect(
      開発時だけの画面(`{import.meta.env.DEV && <Route path="/__x" element={<XPage />} />}`),
    ).toEqual(["XPage.tsx"]);
    // 対象外の対照 = 分岐を持たない経路は外さない
    expect(開発時だけの画面(`<Route path="/docs" element={<DocsPage />} />`)).toEqual([]);
  });

  it("等号を含む画面の字を母集団に残す (収容対照、#1809)", () => {
    // 等号だけでコードとみなすと、画面に出る字が黙って候補から消える
    const { 文 } = 全画面の文();
    const 該当 = 文.filter((t) => t.字 === "1 PR = 1 つの主題");
    expect(該当, "等号を含む画面の字が母集団から消えている").toHaveLength(1);
    // 打ち終わりを持つコードは今までどおり外す
    expect(日本語の文を拾う(`const 件数 = 1;`).文).toEqual([]);
  });

  it("差し込みを含む文を拾える (植え込み対照、#1809)", () => {
    // 差し込みを切れ目として扱うと、後ろに続く字が丸ごと候補から消えて検査が素通りする
    const 元 = `<p className="d">dragon の記法を {N} 分類で整理。 各分類の頁で開ける。</p>`;
    expect(日本語の文を拾う(元).文, "差し込みの前後を拾えていない").toEqual([
      "dragon の記法を",
      "分類で整理。 各分類の頁で開ける。",
    ]);
    expect(日本語の文を拾う(元).差し込み入り, "差し込みを含む区間を数えていない").toBe(1);

    // 差し込みの後ろに英語が残っていれば拾える
    const 英語 = `<p className="d">dragon DSL を {N} 分類で整理。 各分類は merge できる。</p>`;
    const 残る = 日本語の文を拾う(英語).文.flatMap((t) => 残る英単語(t));
    expect(残る).toEqual(["DSL", "merge"]);
  });

  it("差し込みを含まない文の拾い方は変わらない (対象外の対照、#1809)", () => {
    const 元 = `<p className="d">差し込みを持たない文。</p>`;
    expect(日本語の文を拾う(元).文).toEqual(["差し込みを持たない文。"]);
    expect(日本語の文を拾う(元).差し込み入り).toBe(0);
    // 型の指定は `<` と `>` の向きが逆なので区間にならない。 打ち終わりを持つ字も外す
    const コード = `const [倍率, set倍率] = useState<string | null>(null);\nconst 件数 = 1;`;
    expect(日本語の文を拾う(コード).文, "コードを画面の文として拾っている").toEqual([]);
  });

  it("直した文が母集団に残る (収容対照、#1809)", () => {
    // 直すと候補から消える探し方だと、直した file を 1 件も見ていないのと同じになる
    const { 文 } = 全画面の文();
    const 該当 = 文.filter((t) => t.字.startsWith("dragon のテキスト記法の各要素を"));
    expect(該当, "英語を直した文が母集団から消えている").toHaveLength(1);
    expect(残る英単語(該当[0]!.字), "直した文に英語が残っている").toEqual([]);
  });

  it("英語の混ざる文を拾える (植え込み対照)", () => {
    expect(残る英単語("動くことを示せていないコードは取り込まない。"), "土台に英語が混ざっている").toEqual([]);
    expect(残る英単語("動作証明のないコードは merge の対象外。")).toEqual(["merge"]);
    // file 名と道と残してよい語は拾わない
    expect(残る英単語("くわしくは CONTRIBUTING.md を読んでほしい。")).toEqual([]);
    expect(残る英単語("ブラウザで /editor にアクセスする。")).toEqual([]);
    expect(残る英単語("枝の名前は feature/<番号>-<短い説明> で揃える。")).toEqual([]);
    expect(残る英単語("図は SVG として書き出せる。")).toEqual([]);
    // 語の区切りに使う斜線 (前後に空白) は「打ち込む名前」 とみなさない
    expect(残る英単語("不具合の報告 / feature の提案")).toEqual(["feature"]);
  });
});

describe("画面へ字を渡す材料 (#1815)", () => {
  it("拾えた材料の内訳を出す", () => {
    const { 文, 内訳 } = 全材料の文();
    console.log(
      `[材料] 対象=${内訳.対象} 走査=${内訳.走査} 除外=${内訳.除外.join(",") || "なし"}` +
        ` 拾えた=${文.length}`,
    );
    expect(内訳.走査, "材料 file を 1 つも見ていない (検査が空振りしている)").toBeGreaterThan(5);
    // 下限は空振りを止めるための値で、今の件数ではない (実数は上の行に出す)
    expect(文.length, "材料の字を 1 件も拾えていない (検査が空振りしている)").toBeGreaterThan(50);
  });

  it("材料を引き方から導けている (植え込み対照 + 対象外の対照)", () => {
    // 引き方を何にも当たらない形にすると母集団が空になり、検査が黙って素通りする
    expect(引いている材料(`import { CATEGORIES } from "@/lib/catalog";`)).toEqual(["catalog.ts"]);
    expect(引いている材料(`import { PRESETS } from "@/lib/presets";\nimport { FORMS } from "@/lib/syntax-forms";`)).toEqual([
      "presets.ts",
      "syntax-forms.ts",
    ]);
    // 材料でない引き先は拾わない
    expect(引いている材料(`import { CdlEditor } from "@/components/CdlEditor";`)).toEqual([]);
    expect(引いている材料(`import type { CdlDiagram } from "@cardenelabs/cdl";`)).toEqual([]);
  });

  it("外した材料が実在し、理由を持っている", () => {
    const { 内訳 } = 材料のfile一覧();
    const 実在 = readdirSync(材料の置き場);
    for (const f of Object.keys(外す材料)) {
      expect(実在, `外した材料が無い: ${f}`).toContain(f);
      expect((外す材料[f] ?? "").length, `外した理由が短すぎる: ${f}`).toBeGreaterThan(30);
    }
    // 外した名前を書いただけで母集団から消えるのでは、一覧が検査を黙らせる口になる。
    // 実際に引かれていて字を持つ file だけが除外に数えられることを見る
    expect(内訳.除外.slice().sort(), "外した材料が母集団に届いていない").toEqual(
      Object.keys(外す材料).slice().sort(),
    );
    expect(内訳.対象 - 内訳.走査, "除外の数と内訳が合わない").toBe(内訳.除外.length);
  });

  it("材料の字が母集団に入る (収容対照)", () => {
    // 画面 file の側は差し込み (`{c.desc}`) しか持たないので、材料を見ないと 1 文字も読まない
    const { 文 } = 全材料の文();
    const 該当 = 文.filter((t) => t.字.startsWith("「シーケンス図が欲しい」"));
    expect(該当, "見本帳の説明文が母集団から消えている").toHaveLength(1);
    expect(該当[0]!.file, "材料の出どころを file 名で示していない").toBe("lib/catalog.ts");
    expect(残る英単語(該当[0]!.字), "直した説明文に英語が残っている").toEqual([]);
  });

  it("見本の名前を持つ材料が母集団に入る (収容対照、#1821)", () => {
    // #1815 は `i18n.ts` を **file ごと** 外した。 外した理由は「英語の側も同じ file が持つ」
    // だったが、字を拾う側は日本語を含む字しか残さないので英語の側はもともと入らない。
    // 道連れになった日本語の側 432 件は、以後 1 件も読まれなかった (実測で 70 件に英語)。
    //
    // 名前そのものは `lib/screen-words.test.ts` が表を直に引いて全件見る。 **こちらは
    // file が母集団に居ることを見る** = 表の外に日本語の字が増えた日に、そちらは気付かない
    const { files, 内訳 } = 材料のfile一覧();
    expect(Object.keys(外す材料), "見本の名前を持つ file を file ごと外している").not.toContain(
      "i18n.ts",
    );
    expect(files, "見本の名前を持つ file が母集団に居ない").toContain("i18n.ts");
    expect(内訳.除外, "見本の名前を持つ file を除外に数えている").not.toContain("i18n.ts");
    const { 文 } = 全材料の文();
    const 名前から = 文.filter((t) => t.file === "lib/i18n.ts");
    expect(名前から.length, "見本の名前を 1 件も拾えていない").toBeGreaterThan(300);
    expect(名前から.flatMap((t) => 残る英単語(t.字)), "見本の名前に英語が残る").toEqual([]);
  });

  it("材料に混ざる英語を拾える (植え込み対照)", () => {
    // 探し方は本番と同じ関数を使う。 2 度書くと片方だけ直して食い違う
    const 元 = `export const M = [{ desc: "箱と矢印の最小の部品を確かめる場。" }]`;
    expect(材料の文を拾う(元), "土台から字を拾えない").toEqual(["箱と矢印の最小の部品を確かめる場。"]);
    expect(材料の文を拾う(元).flatMap(残る英単語), "土台に英語が混ざっている").toEqual([]);
    const 英語 = `export const M = [{ desc: "dragon DSL の最小構成要素 (lane / node) を確かめる場。" }]`;
    expect(材料の文を拾う(英語).flatMap(残る英単語)).toEqual(["DSL", "lane", "node"]);
  });

  it("材料の組み立てを字として拾わない (対象外の対照)", () => {
    // 画面 file の探し方を当てると、型の指定や矢印の関数が区間として拾われてコードが混ざる
    const 型 = `const 表 = Object.fromEntries(並び.map((値) => [表記, 値])) as Record<string, number>`;
    expect(材料の文を拾う(型), "型の指定を字として拾っている").toEqual([]);
    expect(日本語の文を拾う(型).文, "画面の探し方は同じ字を拾ってしまう").not.toEqual([]);
    // 英語だけの引用符も画面の字ではない
    expect(材料の文を拾う(`const 種別 = "sequence"`)).toEqual([]);
  });
});
