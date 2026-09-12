// @vitest-environment node
/**
 * 画面の字の英語を見る判定が 1 つであることの検証 (#1817)。
 *
 * 以前は検査ごとに別の実装を持っていた。 日本語の字の範囲、語の切り出し、file 名と
 * 斜線でつないだ名の扱い、残してよい語の一覧の 4 つがそれぞれ別で、**同じ字に別の答え**
 * が返っていた (走査 4181 件のうち 80 件が割れ、`API` は画面で通り枠で咎められていた)。
 *
 * ここが見るのは 3 つ。
 *
 * | 見るもの | なぜ |
 * |---|---|
 * | 判定の振る舞い | 切り出しと外す規則が実物の字に当たるか |
 * | 一覧の死蔵 | 使わない語を並べると、一覧がそのまま英語を通す抜け道になる |
 * | 判定を 2 度書いていない | 片方だけ直すと食い違いが戻る |
 *
 * **拾い方 (どの字を集めるか) は寄せない**。 画面は差し込みを文の一部として読み、枠は
 * 見た目の札を外し、材料は引用符の中身だけを見る。 組み立ての形が違うので検査ごとに持つ。
 */
import { describe, it, expect } from "vitest";
import { mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { tmpdir } from "node:os";
import { fileURLToPath } from "node:url";
import { file一覧 } from "./walk-files";
import { 記法が知る名前, 綴りの照合, 経路ごとの専有 } from "./notation-names";
import {
  残してよい語,
  残る英単語,
  番号を落とす,
  日本語の字,
  外す材料,
  揃える呼び名,
  二通りの呼び名,
  記法の名前,
  記法が一覧を配らない綴り,
} from "./screen-words";
import { ITEM_NAME_JA, ITEM_NAME_EN } from "./i18n";
import { TONE_ALIAS } from "@cardenelabs/dragon";

const src根 = fileURLToPath(new URL("../", import.meta.url));

/**
 * 設計の仕様書。 画面の字と同じ呼び名で書く相手なので、呼び名の母集団に入れる (#1819)。
 *
 * 入れないと、実装だけ直して仕様書が古い呼び名のまま残る形を誰も見ない
 * (実測で同じ 1 文を仕様書が `局面`、実装が `シーン` と書いていた)。
 */
const 設計の仕様書 = fileURLToPath(
  new URL("../../../../docs/design/specs/screens.md", import.meta.url),
);

/**
 * 意匠 file。 画面の字をそのまま描いた相手なので、呼び名の母集団に入れる (#1840)。
 *
 * 入れないと、画面と仕様書だけ直して意匠が古い呼び名のまま残る形を誰も見ない
 * (実測で `シーン` 56 箇所 / `パーツ` 4 箇所 が 3 つの改名に追い付いていなかった)。
 *
 * 意匠と実装の照合 (`design-structure-matches.spec.ts`) は **節の見出し (24px 以上) しか
 * 見ない**。 残っていたのは説明文と札で 13〜15.5px なので、その閾値の下にあった。
 * 閾値の下は名指しの一覧で 1 件ずつ見る形になっているが、**改名は名指しでは追えない**
 * (改名するたびに 60 行足すことになる)。 呼び名の表で見るのが正しい経路。
 */
const 意匠 = fileURLToPath(new URL("../../../../docs/design/app.pen", import.meta.url));

/** 意匠 file の node。 字は `content` と、部品を使い回した時の差し替えの 2 箇所に入る */
type 意匠のnode = {
  content?: string;
  descendants?: Record<string, { content?: string } | undefined>;
  children?: 意匠のnode[];
};

/**
 * 意匠 file が持つ字を全部集める。 **2 通りに分けて返す**。
 *
 * 部品を使い回した node は自分の `content` を持たず、差し替え (`descendants`) の側にしか
 * 字が無い。 片方だけだと使い回しの字が丸ごと母集団から落ちる。
 *
 * 分けて返すのは、合計だけでは落ちたことに気付けないため = 実測で `content` が 2127 件、
 * 差し替えが 39 件で、差し替えを落としても合計はほとんど動かない。
 * 出どころを分ければ「片方が 0 件」 として検査に出る (画面を 2 通りで読むのと同じ形)。
 *
 * **読む先を引数で受ける** = 植え込み対照が同じ探し方を仮の意匠へ当てるため。
 * 対照側に探し方を書き直すと、片方だけ直して食い違う。
 */
function 意匠の字(path: string): { 直接: string[]; 使い回し: string[] } {
  const 直接: string[] = [];
  const 使い回し: string[] = [];
  const 降りる = (n: 意匠のnode | undefined): void => {
    if (n === undefined || n === null || typeof n !== "object") return;
    if (typeof n.content === "string" && n.content !== "") 直接.push(n.content);
    for (const d of Object.values(n.descendants ?? {})) {
      if (typeof d?.content === "string" && d.content !== "") 使い回し.push(d.content);
    }
    for (const c of n.children ?? []) 降りる(c);
  };
  降りる(JSON.parse(readFileSync(path, "utf8")) as 意匠のnode);
  return { 直接, 使い回し };
}


/**
 * コメントと記法の見本を外す。
 *
 * **外すのは行をまたぐ `` ` `` の字だけ** = 記法の見本は複数行で書かれている。
 * 1 行に収まる `` ` `` の字は画面に出す文言 (`記法の labelOffsetX / …` のような差し込み
 * つきの文) なので残す。 全部外すと、その形で書いた字が母集団から丸ごと消える。
 */
function コメントと見本を外す(src: string): string {
  return src
    .replace(/\/\*[\s\S]*?\*\//g, " ")
    .replace(/(^|[^:])\/\/[^\n]*/gm, "$1")
    .replace(/`[^`]*`/g, (m) => (m.includes("\n") ? " " : m));
}

const 差し込み = /\{(?:[^{}]|\{[^{}]*\})*\}/;
const 要素の中身 = />((?:[^<>{}]|\{(?:[^{}]|\{[^{}]*\})*\})+)</g;

/**
 * 決まりそのものを書いた file。 母集団から外す。
 *
 * 入れると **表に書いた「直す前の語」 をその表が咎める** = 検査が自分を見て落ちる
 * (実測で `シーン` 2 件と `局面` 1 件が表の行から拾われた)。
 * この file は画面へ字を渡さないので、外しても守る範囲は変わらない。
 */
const 決まりのfile = /^screen-words(\.test)?\.tsx?$/;

/**
 * 記法が持つ、色の日本語の別名 (#1823)。 色 → 別名 の向きで返す。
 *
 * `TONE_ALIAS` は **別名 → 色** の向きで、1 つの色に別名が複数付く
 * (`accent` には `中立` / `neutral` / `accent` の 3 つ)。 逆に引く時は
 * **日本語を含む別名だけを採る** = 英字の別名を採ると `accent` が返り、
 * 「英語が残っている名前」 を正しいと判定してしまう。
 */
function 色の別名(): Map<string, string> {
  const out = new Map<string, string>();
  for (const [別名, 色] of Object.entries(TONE_ALIAS) as [string, string][]) {
    if (日本語の字.test(別名)) out.set(色, 別名);
  }
  return out;
}

/**
 * 色調の見本の鍵から、記法の色を導く (`toneAccent` → `accent`)。
 *
 * 鍵の形が違うものは `null` を返して対象から外す。 外れた件数は検査が出す =
 * 鍵の形が変わった日に「対象 0 件」 で黙って通るのを防ぐ。
 */
function 鍵から色(鍵: string): string | null {
  const m = 鍵.match(/^tone([A-Z]\w*)$/);
  return m === null ? null : m[1]!.charAt(0).toLowerCase() + m[1]!.slice(1);
}

/**
 * 色調の見本の名前が、記法の別名で始まっているか (#1823)。
 *
 * **値そのものは生成しない**。 名前は「別名 + 何の色か」 の組 (`中立の主張色`) で、
 * 後半を `TONE_ALIAS` は持たない。 生成すると後半を別の表に持つことになり、
 * 二重管理が場所を移るだけになる。 先頭の照合に留める。
 */
export function 色調の照合(表: Record<string, string>): {
  対象: { 鍵: string; 値: string; 色: string; 別名: string }[];
  対象外: { 鍵: string; 色: string; 理由: string }[];
  外れる: string[];
} {
  const 別名表 = 色の別名();
  const 対象: { 鍵: string; 値: string; 色: string; 別名: string }[] = [];
  const 対象外: { 鍵: string; 色: string; 理由: string }[] = [];
  for (const [鍵, 値] of Object.entries(表)) {
    const 色 = 鍵から色(鍵);
    if (色 === null) continue;
    const 別名 = 別名表.get(色);
    if (別名 === undefined) {
      対象外.push({ 鍵, 色, 理由: "記法が日本語の別名を持たない色" });
      continue;
    }
    対象.push({ 鍵, 値, 色, 別名 });
  }
  return {
    対象,
    対象外,
    外れる: 対象.filter((r) => !r.値.startsWith(r.別名)).map((r) => `${r.鍵}: ${r.値} (期待 ${r.別名}…)`),
  };
}

/** `記法の名前` の表を、照合に渡す形へ開く (#1825) */
function 表の綴り(表: typeof 記法の名前): { 元: string; 綴り: string }[] {
  return Object.entries(表).flatMap(([語, { 綴り }]) => 綴り.map((s) => ({ 元: 語, 綴り: s })));
}

/**
 * 記法の説明文 (`lib/syntax-forms.ts` の `note:` / `title:`) と、そこに出る英単語 (#1827)。
 *
 * **`code:` の行は見ない** = 記法そのものを写した行で、英語なのが当たり前。
 * 見るのは読み手へ向けた日本語の説明で、その中に綴りのまま混ざる記法の名前。
 *
 * 走査した件数と、日本語を含む件数を分けて返す = 0 件が「英語が無い」 か
 * 「1 件も拾えていない」 かを読み手が分けられるようにする。
 */
function 記法の説明文(): { 文: string[]; 語: string[]; 走査: number } {
  const src = readFileSync(src根 + "lib/syntax-forms.ts", "utf8");
  const 素 = コメントと見本を外す(src);
  const 全部 = [
    ...[...素.matchAll(/note:\s*"([^"\\\n]*)"/g)].map((m) => m[1]!),
    ...[...素.matchAll(/title:\s*"([^"\\\n]*)"/g)].map((m) => m[1]!),
  ];
  const 文 = 全部.filter((t) => 日本語の字.test(t));
  const 語 = new Set<string>();
  for (const t of 文) {
    for (const w of 残る英単語(t)) 語.add(w);
  }
  return { 文, 語: [...語], 走査: 全部.length };
}

/**
 * 見本の一覧に出る名前 432 件 (#1821)。
 *
 * **日本語を含むかで絞らない**。 下の粗い収集は「コードの切れ端に混ざる英語で
 * 『使っている』 と読まない」 ために日本語を含む字だけを見るが、この表は値が全部
 * 画面の字なので歯止めが要らない。 絞ると `NFT` / `ATM` のように日本語を 1 文字も
 * 含まない名前が丸ごと落ちる (実測で `ATM` が死蔵と判定された)。
 */
function 見本の名前(): string[] {
  return Object.values(ITEM_NAME_JA);
}

/**
 * 画面に出る字を **粗く** 集める。 一覧の死蔵を見るためだけに使う。
 *
 * 検査ごとの拾い方より粗いのは、ここが見るのが「その語をどこかで使っているか」 だけだから。
 * 粗い側へ倒すと死蔵を見逃す向きに働くので、日本語を含む字に絞って歯止めをかける
 * (コードの切れ端に混ざる英語で「使っている」 と読まないため)。
 *
 * 歯止めの外に置くのは見本の名前だけ (`見本の名前()`、 理由は上)。
 */
function 画面のfile(): string[] {
  return [
    ...file一覧(src根 + "pages/", /\.tsx?$/, false),
    ...file一覧(src根 + "components/", /\.tsx?$/, false),
    ...file一覧(src根 + "lib/", /\.ts$/, false).filter((f) => {
      const 名 = f.slice(f.lastIndexOf("/") + 1);
      return !(名 in 外す材料) && !決まりのfile.test(名);
    }),
  ];
}

function 画面に出る字たち(): { 字: string[]; 走査: number; 除外: string[] } {
  const files = 画面のfile();
  const 字: string[] = [];
  for (const f of files) {
    const s = コメントと見本を外す(readFileSync(f, "utf8"));
    for (const m of s.matchAll(/"([^"\\\n]*)"|`([^`\\\n]*)`/g)) 字.push((m[1] ?? m[2]!).trim());
    for (const m of s.matchAll(要素の中身)) {
      for (const 片 of m[1]!.split(差し込み)) 字.push(片.trim());
    }
  }
  return {
    字: [...字.filter((t) => t !== "" && 日本語の字.test(t)), ...見本の名前()],
    走査: files.length,
    除外: Object.keys(外す材料),
  };
}

/**
 * 札をまたいで書かれた 1 つの語を、つないだ形で拾う (#1832)。
 *
 * `画面に出る字たち()` は `>` と `<` の間を 1 件として数えるので、
 * **1 つの語を札で 2 つに割った形が母集団から丸ごと消える**。
 *
 * ```tsx
 * 更新<span className="nm-gradient-accent">履歴</span>
 * ```
 *
 * 上は `更新` と `履歴` の 2 件になり、`更新履歴` という語はどこにも現れない。
 * 実測 = 直す前の `リリース<span …>ノート</span>` を戻す変異が 0 件 FAIL だった。
 *
 * 札と差し込みを外してから **行ごと** に読む。 札の外にある改行と空白は残るので、
 * 隣り合う別の要素の字までつながることはない (`</h1>` と `<p>` の間には改行がある)。
 *
 * **差し込みは行ごとに外す**。 file 全体に当てると `{` が行をまたいで対応先を探し、
 * 関数の本体の `{` が中の画面の字を丸ごと飲む (実測 = `リリースノート` が消えた)。
 */
function 札をまたぐ字(src: string): string[] {
  return コメントと見本を外す(src)
    .replace(/<[^<>]*>/g, "")
    .split("\n")
    .map((l) => l.replace(new RegExp(差し込み.source, "g"), "").trim());
}

/**
 * 呼び名を見る母集団。 画面 / 枠 / 材料 に **設計の仕様書** を足した 4 つ (#1819)。
 *
 * 仕様書は行ごとに読む。 表と箇条書きが混ざるので段落にまとめず、
 * 日本語を含む行をそのまま 1 件として数える。
 *
 * 画面は 2 通りで読む (#1832)。 `>` と `<` の間を 1 件とする粗い収集に加えて、
 * 札を外してつないだ行も足す。 内訳を分けて出すのは、どちらが何件を持ち込んだかが
 * 見えないと「つないだ側が 0 件でも通る」 形に気付けないため。
 */
const 母集団の出どころ = [
  "画面",
  "画面(札をまたぐ)",
  "設計",
  "意匠",
  "意匠(使い回し)",
] as const;

function 呼び名の母集団(): { 字: { 出どころ: string; 文: string }[]; 内訳: string[] } {
  const out: { 出どころ: string; 文: string }[] = [];
  for (const 文 of 画面に出る字たち().字) out.push({ 出どころ: "画面", 文 });
  for (const f of 画面のfile()) {
    for (const t of 札をまたぐ字(readFileSync(f, "utf8"))) {
      if (t !== "" && 日本語の字.test(t)) out.push({ 出どころ: "画面(札をまたぐ)", 文: t });
    }
  }
  for (const ln of readFileSync(設計の仕様書, "utf8").split("\n")) {
    const t = ln.trim();
    if (t !== "" && 日本語の字.test(t)) out.push({ 出どころ: "設計", 文: t });
  }
  const 意匠から = 意匠の字(意匠);
  for (const t of 意匠から.直接) {
    if (日本語の字.test(t)) out.push({ 出どころ: "意匠", 文: t });
  }
  for (const t of 意匠から.使い回し) {
    if (日本語の字.test(t)) out.push({ 出どころ: "意匠(使い回し)", 文: t });
  }
  const 内訳 = 母集団の出どころ.map(
    (k) => `${k}=${out.filter((r) => r.出どころ === k).length}`,
  );
  return { 字: out, 内訳 };
}

/**
 * 判定を自前で持っている形を探す。 見つかった中身を返す。
 *
 * 探すのは「ASCII の鍵 → 日本語の値」 が並ぶ一覧で、名前ではなく形で見る
 * (名前を変えただけで逃げられないようにするため)。
 *
 * **逃げ道は残る** = 判定ごと別名の関数に書き直して引くのをやめた file は、下の母集団から
 * 外れるので見えない。 そこまで塞ぐには検査 file の呼び出し木を追う必要があり、静的には
 * 収束しない。 ここで止めるのは「引きながら自前の一覧も持つ」 食い違いの形。
 */
export function 自前の許す語(src: string): number {
  return [...src.matchAll(/^[ \t]{2,}[A-Za-z][A-Za-z0-9_-]*:[ \t]*"[^"]*"/gm)].filter((m) =>
    日本語の字.test(m[0]),
  ).length;
}

/**
 * 画面の字の英語を見ている検査 file。 判定を呼んでいることで導く。
 *
 * **走査は `src/` の全域で、外す方を書く** (#1830)。 以前は置き場を
 * (`pages/` / `components/` / `lib/`) と並べており、`topics/` に検査を足した日に
 * その検査だけが母集団から外れていた = 並べる形は **書き手が思い付いた置き場が上限** になる
 * (`rules/quality.md § 全件走査は除外を書く` と同じ性質)。
 *
 * 外すのは自分自身だけ。 判定の持ち主なので、自前の一覧を持っているのが正しい。
 */
function 判定を使う検査(): { files: string[]; 走査: number } {
  const 全部 = file一覧(src根, /\.test\.tsx?$/, true);
  return {
    files: 全部.filter((f) => {
      if (f.endsWith("screen-words.test.ts")) return false;
      return /残る英単語\s*\(/.test(readFileSync(f, "utf8"));
    }),
    走査: 全部.length,
  };
}

describe("画面の字の英語を見る判定 (#1817)", () => {
  it("英語が混じる字を咎める (植え込み対照)", () => {
    expect(残る英単語("動くことを示せていないコードは取り込まない。"), "土台に英語が混ざっている").toEqual([]);
    expect(残る英単語("動作証明のないコードは merge の対象外。")).toEqual(["merge"]);
    expect(残る英単語("同一 node fan の out edge Y を記法で揃える")).toEqual(["node", "fan", "out", "edge"]);
    // 1 字の語は咎めない (`Y` は図の軸の名前で、訳す先が無い)
    expect(残る英単語("同一 node fan の out edge Y を記法で揃える")).not.toContain("Y");
  });

  it("残してよい語を咎めない (対象外の対照)", () => {
    expect(残る英単語("図は SVG として書き出せる。")).toEqual([]);
    expect(残る英単語("1 PR = 1 つの主題")).toEqual([]);
    expect(残る英単語("実線 / 点線流れ / 6 つの色調 (中立 / teal / 成功)")).toEqual([]);
    expect(残る英単語("変えたい時は記法に posX / posY を書きます。")).toEqual([]);
  });

  it("file 名と斜線でつないだ名と版の番号を語に割らない (対象外の対照)", () => {
    expect(残る英単語("くわしくは CONTRIBUTING.md を読んでほしい。")).toEqual([]);
    expect(残る英単語("ブラウザで /editor にアクセスする。")).toEqual([]);
    expect(残る英単語("枝の名前は feature/<番号>-<短い説明> で揃える。")).toEqual([]);
    expect(残る英単語("使い方の案内 · v0.5")).toEqual([]);
    expect(残る英単語("いまの最新は v0.5 (テキスト記法と動く SVG)。")).toEqual([]);
    // 語の区切りに使う斜線 (前後に空白) は「打ち込む名前」 とみなさない
    expect(残る英単語("不具合の報告 / feature の提案")).toEqual(["feature"]);
  });

  it("繋ぎの横棒を語に含める (境界)", () => {
    // `alarm-clock` は記法の項目の値で 1 語。 横棒で割ると実物に無い語を咎める
    expect(残る英単語("時計の部品は alarm-clock と書く。")).toEqual(["alarm-clock"]);
    expect(残る英単語("他の種類は double-click / long-press。")).toEqual(["double-click", "long-press"]);
  });

  it("規格の名前は番号を落として一覧を引く (境界)", () => {
    expect(番号を落とす("ERC-20")).toBe("ERC");
    expect(番号を落とす("EIP-1559")).toBe("EIP");
    expect(番号を落とす("alarm-clock"), "数で終わらない語を削っている").toBe("alarm-clock");
    expect(残る英単語("ERC-20 の送金")).toEqual([]);
    expect(残る英単語("EIP-1559 の手数料")).toEqual([]);
    expect(残る英単語("ERC-4337 の代理支払い")).toEqual([]);
    // 番号を落としても一覧に無い語は咎める
    expect(残る英単語("規格 FOO-20 の話")).toEqual(["FOO-20"]);
  });

  it("残してよい語が理由を持っている", () => {
    const 語 = Object.entries(残してよい語);
    expect(語.length, "残してよい語が 1 つも無い (検査が空振りしている)").toBeGreaterThan(20);
    const 理由なし = 語.filter(([, 理由]) => 理由.trim().length < 5).map(([w]) => w);
    expect(理由なし, `理由を書いていない語: ${理由なし.join(", ")}`).toEqual([]);
  });

  it("残してよい語が 3 つの置き場の字で実際に使われている", () => {
    // 使わない語を並べておくと、一覧がそのまま英語を通す抜け道になる
    const { 字, 走査, 除外 } = 画面に出る字たち();
    console.log(
      `[死蔵] 走査した file=${走査} 日本語を含む字=${字.length} 除外=${除外.join(",")}` +
        ` 一覧=${Object.keys(残してよい語).length} 語`,
    );
    expect(走査, "file を 1 つも見ていない (検査が空振りしている)").toBeGreaterThan(20);
    expect(字.length, "字を 1 件も拾えていない (検査が空振りしている)").toBeGreaterThan(200);
    const 使った = new Set(字.flatMap((s) => [...(s.match(/[A-Za-z][A-Za-z0-9_-]*/g) ?? [])]));
    const 使わない = Object.keys(残してよい語).filter(
      (w) => !使った.has(w) && ![...使った].some((u) => 番号を落とす(u) === w),
    );
    expect(使わない, `残してよい語に挙げたが画面で使っていない: ${使わない.join(", ")}`).toEqual([]);
  });

  it("外した材料が実在し、理由を持っている", () => {
    const 実在 = readdirSync(src根 + "lib/");
    for (const [f, 理由] of Object.entries(外す材料)) {
      expect(実在, `外した材料が無い: ${f}`).toContain(f);
      expect(理由.length, `外した理由が短すぎる: ${f}`).toBeGreaterThan(30);
    }
  });

  it("英語の側は日本語を 1 文字も持たない (#1821)", () => {
    // **母集団から英語の側を外している仕掛けはこれ 1 つ** = 材料の字を拾う側が
    // 日本語を含む字しか残さないので、`ITEM_NAME_EN` の 432 件は最初から入らない。
    //
    // #1815 はこれを見落として `i18n.ts` を file ごと外し、日本語の側 432 件を道連れにした。
    // 前提が崩れた日に「英語の側 432 件が英語だ」 と大量に落ちるのではなく、
    // ここが「英語の側に日本語が混ざった」 と 1 件で知らせる
    const 英語 = Object.entries(ITEM_NAME_EN);
    const 混ざる = 英語.filter(([, v]) => 日本語の字.test(v)).map(([k, v]) => `${k}: ${v}`);
    // **母数を出す** = 0 件が「混ざっていない」 か「1 件も見ていない」 かを読み手が分ける (#1823)
    console.log(`[英語の側] 走査=${英語.length} 日本語が混ざる=${混ざる.length}`);
    expect(英語.length, "英語の側を 1 件も見ていない (検査が空振りしている)").toBeGreaterThan(400);
    expect(混ざる, `英語の側に日本語が混ざる:\n${混ざる.join("\n")}`).toEqual([]);
  });

  it("日本語を含む字だけを残す絞りが効いている (植え込み対照 + 対象外の対照、#1821)", () => {
    // 上の前提を支えているのは `日本語の字` の絞りそのもの。 壊れていないことを直に見る
    expect(日本語の字.test("Swimlane"), "英語だけの字を日本語と読んでいる").toBe(false);
    expect(日本語の字.test("ER Diagram")).toBe(false);
    expect(日本語の字.test("スイムレーン"), "カタカナを日本語と読めていない").toBe(true);
    expect(日本語の字.test("ER図"), "漢字を日本語と読めていない").toBe(true);
  });

  it("見本の名前に英語が残っていない (#1821)", () => {
    // 材料の字を拾う側は日本語を含む字だけを見るので、`NFT` のような名前が落ちる。
    // ここは表を直に引いて **全件** に判定を当てる。 判定は同じ `残る英単語()`
    const 名前 = Object.entries(ITEM_NAME_JA);
    const 日本語なし = 名前.filter(([, v]) => !日本語の字.test(v));
    console.log(
      `[見本の名前] 走査=${名前.length} 日本語を 1 文字も含まない=${日本語なし.length}` +
        ` (${日本語なし.map(([, v]) => v).join(",")})`,
    );
    expect(名前.length, "見本の名前を 1 件も見ていない (検査が空振りしている)").toBeGreaterThan(400);
    expect(
      日本語なし.length,
      "日本語を含まない名前が 1 件も無い = 材料の側との差が消えており、この検査の存在理由が無い",
    ).toBeGreaterThan(0);
    const 残る = 名前
      .map(([k, v]) => ({ k, v, w: 残る英単語(v) }))
      .filter((r) => r.w.length > 0)
      .map((r) => `${r.k}: ${r.v} → ${r.w.join(", ")}`);
    expect(残る, `見本の名前に英語が残る:\n${残る.join("\n")}`).toEqual([]);
  });

  it("色調の見本の名前が記法の別名で始まる (#1823)", () => {
    // 英語が残っていないことを見るだけでは、`中立の主張色` を `目立つ色` に書き換えても通る。
    // **出どころ (`TONE_ALIAS`) との結び付き** はこの検査だけが守る
    const { 対象, 対象外, 外れる } = 色調の照合(ITEM_NAME_JA);
    console.log(
      `[色調] 対象=${対象.length} 対象外=${対象外.length}` +
        ` (${対象外.map((r) => `${r.色}=${r.理由}`).join(",") || "なし"})` +
        ` 外れる=${外れる.length}`,
    );
    expect(対象.length, "色調の名前を 1 件も見ていない (検査が空振りしている)").toBeGreaterThan(3);
    expect(
      対象外.length,
      "対象外が 1 件も無い = 別名を持たない色が消えており、下の対象外の対照が空振りする",
    ).toBeGreaterThan(0);
    expect(外れる, `記法の別名で始まらない色調の名前:\n${外れる.join("\n")}`).toEqual([]);
  });

  it("色調の照合が別名でない字を見つける (植え込み対照 + 対象外の対照、#1823)", () => {
    // 探し方を本番と 2 度書かない = 同じ関数に別の表を渡す
    const 元 = { toneAccent: "中立の主張色", toneSuccess: "成功の緑" };
    expect(色調の照合(元).外れる, "土台が外れている").toEqual([]);
    expect(色調の照合(元).対象, "土台を 1 件も見ていない").toHaveLength(2);

    // 別名でない日本語に書き換えると見つかる (英語は 1 文字も混ざっていない形)
    const 植え = { toneAccent: "目立つ色", toneSuccess: "成功の緑" };
    expect(色調の照合(植え).外れる).toEqual(["toneAccent: 目立つ色 (期待 中立…)"]);

    // 別名を持たない色は対象外に落ちる (落とさないと `teal青緑` が毎回外れる)
    const 別名なし = { toneTeal: "teal青緑" };
    expect(色調の照合(別名なし).外れる, "別名を持たない色を咎めている").toEqual([]);
    expect(色調の照合(別名なし).対象外.map((r) => r.色)).toEqual(["teal"]);

    // 鍵の形が違うものは対象にしない
    expect(色調の照合({ presetFlow: "フロー" }).対象).toEqual([]);
    expect(色調の照合({ presetFlow: "フロー" }).対象外).toEqual([]);
  });

  it("色の別名を逆に引く時、英字の別名を採らない (境界、#1823)", () => {
    // `TONE_ALIAS` は 1 つの色に別名を複数持つ (`accent` = 中立 / neutral / accent)。
    // 英字の別名を採ると `accent主張色` が「別名で始まる」 と判定され、
    // #1821 で直した英語がそのまま通る
    const { 対象 } = 色調の照合({ toneAccent: "中立の主張色" });
    expect(対象).toHaveLength(1);
    expect(対象[0]!.別名, "英字の別名を採っている").toBe("中立");
    expect(色調の照合({ toneAccent: "accent主張色" }).外れる).toHaveLength(1);
  });

  it("出どころが決まっている名前の内訳を出す (#1823)", () => {
    // 色調 5 件のほかに、記法の機能の名前を含む名前がある。 一覧は `記法の名前` が持つ (#1825)
    const 機能 = Object.entries(記法の名前)
      .filter(([, r]) => r.分け === "機能")
      .map(([w]) => w);
    const 含む = Object.entries(ITEM_NAME_JA)
      .map(([k, v]) => ({ k, v, w: 機能.filter((f) => v.includes(f)) }))
      .filter((r) => r.w.length > 0);
    console.log(
      `[出どころ] 色調=${色調の照合(ITEM_NAME_JA).対象.length} 件 (記法の別名から導いた)` +
        ` / 記法の機能=${含む.length} 件 (${機能.length} 語)`,
    );
    expect(機能.length, "記法の機能の名前が 1 語も無い (検査が空振りしている)").toBeGreaterThan(5);
    expect(含む.length, "機能の名前を含む見本が 1 件も無い (検査が空振りしている)").toBeGreaterThan(5);
  });

  it("記法の名前が記法に実在する (#1825)", () => {
    // 一覧に語を並べるだけでは、記法が機能を消しても名前を変えても古いまま残り、
    // 検査は通り続ける。 **記法との結び付き** はこの検査だけが守る
    const { 経路, 型file } = 記法が知る名前();
    const { 対象, 無い } = 綴りの照合(表の綴り(記法の名前), 経路);
    const 分け = (k: "項目" | "機能"): number =>
      Object.values(記法の名前).filter((r) => r.分け === k).length;
    console.log(
      `[記法の名前] 語=${Object.keys(記法の名前).length} (項目=${分け("項目")} 機能=${分け("機能")})` +
        ` 綴り=${対象.length + 無い.length} 実在=${対象.length}` +
        ` / 経路=${[...経路].map(([n, s]) => `${n}:${s.size}`).join(" ")} (型 ${型file} file)`,
    );
    expect(型file, "記法の型を 1 file も読めていない (検査が空振りしている)").toBeGreaterThan(0);
    for (const [名, 集合] of 経路) {
      expect(集合.size, `${名} から 1 件も拾えていない (検査が空振りしている)`).toBeGreaterThan(20);
    }
    expect(対象.length, "照合できた綴りが 1 件も無い (検査が空振りしている)").toBeGreaterThan(10);
    expect(無い, `記法に無い綴りを一覧に書いている:\n${無い.join("\n")}`).toEqual([]);
  });

  it("記法に無い綴りを見つける (植え込み対照 + 経路の対照、#1825)", () => {
    const { 経路 } = 記法が知る名前();
    // 植え込み対照 = 記法に無い綴りを 1 件置いて、照合が見つけること
    const 植える = { ...記法の名前, 架空の口: { 綴り: ["radialBoxes"], 分け: "機能" as const, 説明: "実在しない" } };
    expect(綴りの照合(表の綴り(植える), 経路).無い, "記法に無い綴りを見逃している").toEqual([
      "架空の口: radialBoxes",
    ]);

    // 経路の対照 = 各経路を 1 つずつ抜いて、そこでしか覆えない綴りを数える。
    // **専有 0 件の経路があってよい** = 専有は照合する相手ごとに変わるため。
    // 4 経路とも要ることは、この表と説明文 (#1827) の 2 つを合わせて示す
    const 専有 = 経路ごとの専有(表の綴り(記法の名前), 経路);
    console.log(`[経路の専有 (記法の名前)] ${[...専有].map(([n, v]) => `${n}=${v.length}`).join(" ")}`);
    // `cdl が配る名前` だけが `signal` を持つ = 実行時にしか現れない綴りの代表
    expect(専有.get("cdl が配る名前"), "実行時にしか現れない綴りを覆えていない").toEqual(["signal"]);
    expect(専有.get("cdl の型の項目")?.length, "型の項目の経路が守りを 1 つも足していない").toBeGreaterThan(0);
  });

  it("4 経路がすべて、どちらかの相手で守りを足している (#1827)", () => {
    // 経路ごとの専有は **照合する相手で変わる**。 片方だけを見て 0 件の経路を落とすと、
    // もう片方の守りが消える。 2 つの相手を並べて、どの経路も要ることを示す
    const { 経路 } = 記法が知る名前();
    const { 語 } = 記法の説明文();
    const 配らない = new Set(Object.keys(記法が一覧を配らない綴り));
    const 相手 = new Map([
      ["記法の名前", 表の綴り(記法の名前)],
      ["説明文", 語.filter((w) => !配らない.has(w)).map((w) => ({ 元: w, 綴り: w }))],
    ]);
    const 表: string[] = [];
    const 使われない: string[] = [];
    for (const [名] of 経路) {
      const 件 = [...相手].map(([n, xs]) => `${n}=${経路ごとの専有(xs, 経路).get(名)!.length}`);
      表.push(`${名} (${件.join(" ")})`);
      if ([...相手].every(([, xs]) => 経路ごとの専有(xs, 経路).get(名)!.length === 0)) 使われない.push(名);
    }
    console.log(`[経路の要否] ${表.join(" / ")}`);
    expect(経路.size, "経路が 1 つも無い (検査が空振りしている)").toBeGreaterThan(3);
    expect(相手.size, "照合する相手が 1 つも無い (検査が空振りしている)").toBeGreaterThan(1);
    expect(使われない, `どちらの相手でも守りを足していない経路: ${使われない.join(", ")}`).toEqual([]);
  });

  it("綴りの照合が前置き一致になっていない (境界、#1825)", () => {
    // `renderOffset` が `renderOffsetX` の前置きなので、緩めたくなる形。 緩めると
    // 2 文字の語を足した日に記法の適当な名前に当たって素通りする
    const { 経路 } = 記法が知る名前();
    expect(
      経路.get("cdl が配る名前")?.has("signal"),
      "土台が外れている (記法が `signal` を配っていない)",
    ).toBe(true);
    expect(綴りの照合([{ 元: "si", 綴り: "si" }], 経路).無い, "前置き一致で素通りしている").toEqual(["si"]);
    // 逆向き = 記法の名前を前置きに持つ綴りも通さない
    expect(綴りの照合([{ 元: "x", 綴り: "signalXyz" }], 経路).無い).toEqual(["x: signalXyz"]);
  });

  it("記法の説明文の綴りが記法に実在する (#1827)", () => {
    // `syntax-forms.ts` は母集団から外れている唯一の file。 外した先が無防備にならないよう、
    // この検査が説明文の英語を 1 語ずつ記法と照合する。
    // **`残してよい語` には足さない** = `start` / `text` のような一般語が混ざっており、
    // 一覧に足すと画面のどこでもその語が通る
    const { 経路 } = 記法が知る名前();
    const { 文, 語, 走査 } = 記法の説明文();
    const 配らない = new Set(Object.keys(記法が一覧を配らない綴り));
    const { 対象, 無い } = 綴りの照合(
      語.filter((w) => !配らない.has(w)).map((w) => ({ 元: w, 綴り: w })),
      経路,
    );
    console.log(
      `[記法の説明文] 走査=${走査} 日本語を含む=${文.length} 英単語=${語.length} 種` +
        ` / 記法が知る=${対象.length} 一覧を配らない=${配らない.size}`,
    );
    expect(走査, "説明文を 1 件も拾えていない (検査が空振りしている)").toBeGreaterThan(100);
    expect(文.length, "日本語を含む説明文が 1 件も無い (検査が空振りしている)").toBeGreaterThan(100);
    expect(語.length, "英単語を 1 種も拾えていない (検査が空振りしている)").toBeGreaterThan(50);
    expect(無い, `記法に無い綴りが説明文に出る:\n${無い.join("\n")}`).toEqual([]);
  });

  it("説明文の照合が記法に無い綴りを見つける (植え込み対照 + 経路の対照、#1827)", () => {
    const { 経路 } = 記法が知る名前();
    const { 語 } = 記法の説明文();
    const 配らない = new Set(Object.keys(記法が一覧を配らない綴り));
    const 見る = 語.filter((w) => !配らない.has(w)).map((w) => ({ 元: w, 綴り: w }));

    // 植え込み対照 = 記法に無い綴りを 1 件混ぜて、照合が見つけること
    expect(
      綴りの照合([...見る, { 元: "heatCube", 綴り: "heatCube" }], 経路).無い,
      "記法に無い綴りを見逃している",
    ).toEqual(["heatCube"]);

    // 経路の対照 = 各経路を 1 つずつ抜いて、そこでしか覆えない語を数える
    const 専有 = 経路ごとの専有(見る, 経路);
    console.log(
      `[経路の専有 (説明文)] ${[...専有].map(([n, v]) => `${n}=${v.length}`).join(" ")}`,
    );
    // **この相手では `cdl が配る名前` が専有 0 件** = 落とさないのは #1825 の 16 語で
    // `signal` を専有するため。 相手ごとに専有が変わることを、この差が示している
    expect(専有.get("cdl が配る名前"), "この相手では実行時の名前の専有が無いはず").toEqual([]);
    for (const 名 of ["cdl の型の項目", "cdl の型の値", "記法が配る一覧"]) {
      expect(専有.get(名)?.length, `${名} が守りを 1 つも足していない`).toBeGreaterThan(0);
    }
    expect(専有.get("cdl の型の値"), "型の値の経路が `heat-cell` を覆えていない").toContain("heat-cell");
    expect(専有.get("記法が配る一覧"), "記法が配る一覧の経路が `reveal` を覆えていない").toContain("reveal");
  });

  it("記法が一覧を配らない綴りが、理由を持ち実際に説明文で使われている (#1827)", () => {
    // 理由を書けない綴りは、記法から引ける綴り。 一覧に足すこと自体が「照合しない」 の
    // 言い換えになる。 使っていない綴りが混ざっていないことも見る (死蔵)
    const { 語 } = 記法の説明文();
    const 表 = Object.entries(記法が一覧を配らない綴り);
    expect(表.length, "表が空 (検査が空振りしている)").toBeGreaterThan(3);
    const 理由なし = 表.filter(([, 理由]) => 理由.trim().length < 10).map(([w]) => w);
    expect(理由なし, `理由を書いていない綴り: ${理由なし.join(", ")}`).toEqual([]);
    const 使わない = 表.map(([w]) => w).filter((w) => !語.includes(w));
    expect(使わない, `表に挙げたが説明文で使っていない: ${使わない.join(", ")}`).toEqual([]);
    // 収容対照 = 記法から引ける綴りが表に紛れ込んでいないこと
    const { 経路 } = 記法が知る名前();
    const 引ける = 綴りの照合(表.map(([w]) => ({ 元: w, 綴り: w })), 経路).対象.map((r) => r.綴り);
    expect(引ける, `記法から引ける綴りを表に置いている: ${引ける.join(", ")}`).toEqual([]);
  });

  it("残してよい語が記法の名前の表から組み立てられている (#1825)", () => {
    // 語を 2 箇所に書くと片方だけ直って食い違う。 **`残してよい語` に literal で
    // 書き戻されていないこと** を字で見る
    const src = readFileSync(src根 + "lib/screen-words.ts", "utf8");
    const 頭 = src.indexOf("export const 残してよい語");
    expect(頭, "残してよい語が見つからない (検査が空振りしている)").toBeGreaterThan(0);
    const 中身 = src.slice(頭);
    const 語 = Object.keys(記法の名前);
    expect(語.length, "記法の名前が 1 語も無い (検査が空振りしている)").toBeGreaterThan(10);
    const 二重 = 語.filter((w) => new RegExp(`^\\s+${w}:`, "m").test(中身));
    expect(二重, `残してよい語に literal で書き戻している: ${二重.join(", ")}`).toEqual([]);
    // 収容対照 = 表から組み立てた 16 語が、実際に一覧へ入っていること
    const 入っていない = 語.filter((w) => !(w in 残してよい語));
    expect(入っていない, `表にあるが一覧に入っていない: ${入っていない.join(", ")}`).toEqual([]);
  });

  it("判定を使う検査が、自前の許す語の一覧を持っていない", () => {
    const { files, 走査 } = 判定を使う検査();
    console.log(
      `[判定の引き手] 走査した検査 file=${走査} 引き手=${files.length}` +
        ` (${files.map((f) => f.slice(src根.length)).join(" / ")})`,
    );
    // **走査の母数を見る** = 置き場を絞ると引き手が減るだけで、引き手の下限だけでは
    // 「2 件残れば通る」 形になる (#1830 の変異で実測)
    expect(走査, "検査 file を 1 つも見ていない (検査が空振りしている)").toBeGreaterThan(50);
    expect(files.length, "判定を引く検査が 1 つも無い (検査が空振りしている)").toBeGreaterThan(1);
    const 自前 = files
      .map((f) => ({ f: f.slice(src根.length), n: 自前の許す語(readFileSync(f, "utf8")) }))
      .filter((r) => r.n >= 5);
    expect(自前.map((r) => `${r.f} (${r.n} 行)`), "判定を引きながら自前の一覧も持っている").toEqual([]);
  });

  it("同じものを 2 通りに呼んでいない (#1811 / #1819)", () => {
    const { 字, 内訳 } = 呼び名の母集団();
    const 残る = 字
      .flatMap(({ 出どころ, 文 }) => 二通りの呼び名(文).map((印) => `${出どころ}: ${文.slice(0, 50)} [${印}]`));
    console.log(`[呼び名] 走査した字=${字.length} (${内訳.join(" ")}) 対=${揃える呼び名.length} 残る=${残る.length}`);
    expect(字.length, "字を 1 つも読めていない (検査が空振りしている)").toBeGreaterThan(200);
    for (const k of 母集団の出どころ) {
      expect(
        字.some((r) => r.出どころ === k),
        `${k} の字を 1 件も読めていない (母集団が片側に寄っている)`,
      ).toBe(true);
    }
    expect(残る, `同じものを 2 通りに呼んでいる:\n${残る.join("\n")}`).toEqual([]);
  });

  it("揃える先が実際に使われている (#1811)", () => {
    // 揃え終わった語を一覧に残すと、行だけが増えて何も守らなくなる
    const { 字 } = 呼び名の母集団();
    const 出ない = 揃える呼び名
      .filter((対) => !字.some((r) => r.文.includes(対.揃える先)))
      .map((対) => `${対.直す} → ${対.揃える先}`);
    expect(出ない, `揃える先が 1 度も出ていない: ${出ない.join(", ")}`).toEqual([]);
  });

  it("札で 2 つに割れた語をつないで拾える (植え込み対照 + 対象外の対照、#1832)", () => {
    // 直す前に実物が出していた形。 `>` と `<` の間だけを見ると `リリース` と `ノート` に
    // 割れ、`リリースノート` という語がどこにも現れない
    const 割れた見出し = [
      '        <h1 className="nm-hero-title">',
      '          リリース<span className="nm-gradient-accent">ノート</span>',
      "        </h1>",
      '        <p className="nm-hero-subtitle">',
      "          dragon の版ごとの主な変更を要約して並べる。",
      "        </p>",
    ].join("\n");
    expect(札をまたぐ字(割れた見出し)).toContain("リリースノート");

    // 隣り合う別の要素の字はつながらない = 札の外の改行が残る
    expect(
      札をまたぐ字(割れた見出し).filter((l) => l.includes("ノートdragon")),
      "別の要素の字までつないでいる",
    ).toEqual([]);

    // 差し込みは **行ごと** に外す。 file 全体に当てると関数の本体の `{` が
    // 対応先を行をまたいで探し、中の画面の字を丸ごと飲む
    const 関数の中 = [
      "export function P(): React.ReactElement {",
      "  return (",
      "    <h1>更新<span>履歴</span></h1>",
      "  );",
      "}",
    ].join("\n");
    expect(札をまたぐ字(関数の中)).toContain("更新履歴");
  });

  it("2 通りの呼び名を拾える (植え込み対照 + 対象外の対照、#1811)", () => {
    // **植え込む字を表から作らない**。 表から作ると表を壊しても落ちない = 恒真になる
    // (実測 = `パーツ` を `ぱーつ` に書き換える変異が 0 件 FAIL だった)。
    // ここに書く字は、直す前に実物が出していた字そのもの
    expect(二通りの呼び名("見本を読み込めませんでした。 パーツ一覧を開き直すと再試行します。")).toEqual([
      "パーツ → 部品",
    ]);
    expect(二通りの呼び名("既定のサンプル (…) で開きます。")).toEqual(["サンプル → 見本"]);
    expect(二通りの呼び名("形を選び置き場所を決めシーンごとに動かす。")).toEqual(["シーン → 段"]);
    expect(二通りの呼び名("説明文は「形を選び置き場所を決め局面ごとに動かす。")).toEqual(["局面 → 段"]);
    expect(二通りの呼び名("道筋は `概要 › リリースノート`。")).toEqual(["リリースノート → 更新履歴"]);
    expect(二通りの呼び名("dragon にコントリビュートする")).toEqual(["コントリビュート → 参加"]);
    // 揃えた後の字は拾わない
    expect(二通りの呼び名("見本を読み込めませんでした。 部品の一覧を開き直すと再試行します。")).toEqual([]);
    expect(二通りの呼び名("既定の見本 (…) で開きます。")).toEqual([]);
    expect(二通りの呼び名("形を選び置き場所を決め段ごとに動かす。")).toEqual([]);
    expect(二通りの呼び名("道筋は `概要 › 更新履歴`。")).toEqual([]);
    expect(二通りの呼び名("dragon に参加する")).toEqual([]);
  });

  it("意匠 file の字を 2 通りとも集める (植え込み対照 + 収容対照、#1840)", () => {
    // **本番と同じ探し方**を、仮の意匠へ当てる。 探し方を書き直すと片方だけ直って食い違う
    const 仮の意匠 = join(mkdtempSync(join(tmpdir(), "pen-words-")), "app.pen");
    writeFileSync(
      仮の意匠,
      JSON.stringify({
        children: [
          {
            // 直接の字。 古い呼び名を 1 件置く (植え込み対照)
            content: "シーンでの推移",
            children: [
              // 直した形。 母集団に残ることを見る (収容対照)
              { content: "段での推移" },
              {
                // 部品の使い回し = 自分の字を持たず、差し替えの側にしか無い形
                ref: "card",
                descendants: { "0:1": { content: "パーツ分類" } },
              },
            ],
          },
        ],
      }),
      "utf8",
    );

    const 集めた = 意匠の字(仮の意匠);
    // 植え込み対照 = 古い呼び名を見つける
    expect(集めた.直接).toContain("シーンでの推移");
    expect(集めた.使い回し, "差し替えの側の字を集めていない").toContain("パーツ分類");
    // 収容対照 = 直した形も母集団に残る (直すと候補から消える形になっていない)
    expect(集めた.直接, "直した字が母集団から消えている").toContain("段での推移");
    // 2 通りを混ぜない = 混ぜると片方が 0 件でも合計で隠れる
    expect(集めた.使い回し).not.toContain("シーンでの推移");

    rmSync(dirname(仮の意匠), { recursive: true, force: true });
  });

  it("揃える呼び名が理由を持っている (#1811)", () => {
    expect(揃える呼び名.length, "対が 1 つも無い (検査が空振りしている)").toBeGreaterThan(2);
    const 理由なし = 揃える呼び名.filter((対) => 対.理由.trim().length < 5).map((対) => 対.直す);
    expect(理由なし, `理由を書いていない対: ${理由なし.join(", ")}`).toEqual([]);
  });

  it("自前の一覧を見つけられる (植え込み対照 + 対象外の対照)", () => {
    const 自前あり = [
      "const 許す語 = {",
      '  SVG: "画像の形式の名前",',
      '  PNG: "画像の形式の名前",',
      '  PDF: "書類の形式の名前",',
      '  YAML: "記法の形式の名前",',
      '  JSON: "記法の形式の名前",',
      "};",
    ].join("\n");
    expect(自前の許す語(自前あり), "自前の一覧を見つけられない").toBe(5);
    // 日本語を持たない対応表と、鍵が日本語の表は一覧とみなさない
    const 対象外 = [
      "const 印 = {",
      '  solid: "solid",',
      '  dotted: "dotted",',
      "};",
      "const 呼び名 = {",
      '  パーツ: "部品",',
      "};",
    ].join("\n");
    expect(自前の許す語(対象外)).toBe(0);
  });
});
