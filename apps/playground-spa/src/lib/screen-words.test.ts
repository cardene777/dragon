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
import { 残してよい語, 残る英単語, 番号を落とす, 日本語の字, 外す材料 } from "./screen-words";

const src根 = fileURLToPath(new URL("../", import.meta.url));

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
 * 画面に出る字を **粗く** 集める。 一覧の死蔵を見るためだけに使う。
 *
 * 検査ごとの拾い方より粗いのは、ここが見るのが「その語をどこかで使っているか」 だけだから。
 * 粗い側へ倒すと死蔵を見逃す向きに働くので、日本語を含む字に絞って歯止めをかける
 * (コードの切れ端に混ざる英語で「使っている」 と読まないため)。
 */
function 画面に出る字たち(): { 字: string[]; 走査: number; 除外: string[] } {
  const files = [
    ...file一覧(src根 + "pages/", /\.tsx?$/, false),
    ...file一覧(src根 + "components/", /\.tsx?$/, false),
    ...file一覧(src根 + "lib/", /\.ts$/, false).filter(
      (f) => !(f.slice(f.lastIndexOf("/") + 1) in 外す材料),
    ),
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
    字: 字.filter((t) => t !== "" && 日本語の字.test(t)),
    走査: files.length,
    除外: Object.keys(外す材料),
  };
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

  it("判定を使う検査が、自前の許す語の一覧を持っていない", () => {
    const files = 判定を使う検査();
    console.log(`[判定の引き手] ${files.map((f) => f.slice(src根.length)).join(" / ")}`);
    expect(files.length, "判定を引く検査が 1 つも無い (検査が空振りしている)").toBeGreaterThan(1);
    const 自前 = files
      .map((f) => ({ f: f.slice(src根.length), n: 自前の許す語(readFileSync(f, "utf8")) }))
      .filter((r) => r.n >= 5);
    expect(自前.map((r) => `${r.f} (${r.n} 行)`), "判定を引きながら自前の一覧も持っている").toEqual([]);
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
