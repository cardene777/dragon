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
import { readdirSync, readFileSync, statSync } from "node:fs";
import { fileURLToPath } from "node:url";
import {
  残してよい語,
  残る英単語,
  番号を落とす,
  日本語の字,
  外す材料,
  揃える呼び名,
  二通りの呼び名,
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

function file一覧(dir: string, 拡張子: RegExp, 検査を含む: boolean): string[] {
  const out: string[] = [];
  const 降りる = (d: string): void => {
    for (const e of readdirSync(d)) {
      const p = d + e;
      if (statSync(p).isDirectory()) 降りる(p + "/");
      else if (拡張子.test(e) && (検査を含む || !e.includes(".test."))) out.push(p);
    }
  };
  降りる(dir);
  return out;
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
function 画面に出る字たち(): { 字: string[]; 走査: number; 除外: string[] } {
  const files = [
    ...file一覧(src根 + "pages/", /\.tsx?$/, false),
    ...file一覧(src根 + "components/", /\.tsx?$/, false),
    ...file一覧(src根 + "lib/", /\.ts$/, false).filter((f) => {
      const 名 = f.slice(f.lastIndexOf("/") + 1);
      return !(名 in 外す材料) && !決まりのfile.test(名);
    }),
  ];
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
 * 呼び名を見る母集団。 画面 / 枠 / 材料 に **設計の仕様書** を足した 4 つ (#1819)。
 *
 * 仕様書は行ごとに読む。 表と箇条書きが混ざるので段落にまとめず、
 * 日本語を含む行をそのまま 1 件として数える。
 */
function 呼び名の母集団(): { 字: { 出どころ: string; 文: string }[]; 内訳: string[] } {
  const out: { 出どころ: string; 文: string }[] = [];
  for (const 文 of 画面に出る字たち().字) out.push({ 出どころ: "画面", 文 });
  for (const ln of readFileSync(設計の仕様書, "utf8").split("\n")) {
    const t = ln.trim();
    if (t !== "" && 日本語の字.test(t)) out.push({ 出どころ: "設計", 文: t });
  }
  const 内訳 = ["画面", "設計"].map(
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

/** 画面の字の英語を見ている検査 file。 判定を呼んでいることで導く */
function 判定を使う検査(): string[] {
  const out: string[] = [];
  for (const 置き場 of ["pages/", "components/", "lib/"]) {
    for (const f of file一覧(src根 + 置き場, /\.test\.tsx?$/, true)) {
      const src = readFileSync(f, "utf8");
      if (/残る英単語\s*\(/.test(src) && !f.endsWith("screen-words.test.ts")) out.push(f);
    }
  }
  return out;
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
    // 色調 5 件のほかに、記法の機能の名前を含む名前がある。 **導く形にするのは範囲外** で、
    // ここは次に何が残っているかを見える形にするだけ
    const 機能 = Object.entries(残してよい語)
      .filter(([, 理由]) => 理由.startsWith("記法の機能の名前"))
      .map(([w]) => w);
    const 含む = Object.entries(ITEM_NAME_JA)
      .map(([k, v]) => ({ k, v, w: 機能.filter((f) => v.includes(f)) }))
      .filter((r) => r.w.length > 0);
    console.log(
      `[出どころ] 色調=${色調の照合(ITEM_NAME_JA).対象.length} 件 (導く形にした)` +
        ` / 記法の機能=${含む.length} 件 (${機能.length} 語、まだ導いていない)`,
    );
    expect(機能.length, "記法の機能の名前が 1 語も無い (検査が空振りしている)").toBeGreaterThan(5);
    expect(含む.length, "機能の名前を含む見本が 1 件も無い (検査が空振りしている)").toBeGreaterThan(5);
  });

  it("判定を使う検査が、自前の許す語の一覧を持っていない", () => {
    const files = 判定を使う検査();
    console.log(`[判定の引き手] ${files.map((f) => f.slice(src根.length)).join(" / ")}`);
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
    for (const k of ["画面", "設計"]) {
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
    // 揃えた後の字は拾わない
    expect(二通りの呼び名("見本を読み込めませんでした。 部品の一覧を開き直すと再試行します。")).toEqual([]);
    expect(二通りの呼び名("既定の見本 (…) で開きます。")).toEqual([]);
    expect(二通りの呼び名("形を選び置き場所を決め段ごとに動かす。")).toEqual([]);
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
