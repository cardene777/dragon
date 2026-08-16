/**
 * 動かすと決めた見本が、**絵として** 実際に変わることの検査 (#1172)。
 *
 * 宣言の層 (`motionOf`) は「段が値を動かすと書いてあるか」 しか見ない。 その値を描く経路が
 * 無くても `continuous` を返すため、SVG が 1 byte も変わらない図を「動いている」 と判定する。
 * 実際に #1173 では 110 件に値を足して 79 件が画面上動かず、宣言だけを見る検査がそれを
 * 通していた (値を描くのは `ActorNode` と `GenericNode` の 2 経路だけだった)。
 *
 * **ここでは描画結果を見る**。 段が動かす値の始点と終点をそれぞれ初期値に据えた 2 つの図を
 * 実際に描き、絵の文字が変わることを確かめる。 値を描かない種別ではこの 2 つが一致するので、
 * 同じ見落としが起きない。
 *
 * 段の途中の値 (`progress` が 0 と 1 の間) は静止した描画では作れない。 そこは
 * `packages/dragon/test/values-compile.test.ts` が `computeStateValues` を直接見る。
 */
import { describe, it, expect } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { CdlDiagramView } from "@cardenelabs/cdl";
import type { CdlDiagram } from "@cardenelabs/cdl";
import * as PrimExt from "@/topics/catalog/primitives-extra.cdl";
import * as Prim from "@/topics/catalog/primitives.cdl";
import { motionOf } from "./catalog-motion";

/**
 * 動かすと決めた見本 (#1172 の対象、 primitives-extra 21 件)。
 *
 * ここに載る図は「段で値が動き、それが絵に出る」 ことを本 file が保証する。 まだ動かして
 * いない図と、動かさないと決めた図の区別は
 * `packages/dragon/test/catalog-motion-coverage.test.ts` が持つ。
 */
const 対象 = [
  "kPerson", "kUserGroup", "kAdmin", "kDeveloper", "kExternalUser",
  "kDatabase", "kCache", "kQueue", "kMessageBus", "kCloud", "kCdn",
  "kService", "kApi", "kFrontend", "kBackend", "kWebhook", "kMicroservice",
  "kSigner", "kOracle", "kMerkleTree", "kDecision",
] as const;

/**
 * 種別の説明。 **値を足す前と同じであることを固定する** (#1172 の完了条件)。
 *
 * 値の欄を足す作業で説明を潰すと、種別の見本としての役割が失われる。 表にして固定すれば、
 * 書き換えた時にどれが変わったかが検査の出力に出る。
 */
const 説明: Record<string, [eyebrow: string, title: string, subtitle: string]> = {
  kPerson: ["個人", "User", "外部の 1 ユーザー"],
  kUserGroup: ["複数ユーザー", "Users", "team / コミュニティ"],
  kAdmin: ["管理者", "Admin", "権限保有者"],
  kDeveloper: ["開発者", "Developer", "コード書く人"],
  kExternalUser: ["外部ユーザー", "External", "別 system から来訪"],
  kDatabase: ["DB", "PostgreSQL", "primary database"],
  kCache: ["キャッシュ", "Redis", "in-memory store"],
  kQueue: ["キュー", "Job Queue", "Bull / SQS"],
  kMessageBus: ["メッセージバス", "Kafka", "topic / partition"],
  kCloud: ["クラウド", "AWS", "cloud service"],
  kCdn: ["CDN", "Cloudflare", "edge network"],
  kService: ["サービス", "AuthService", "business logic"],
  kApi: ["API", "POST /users", "REST endpoint"],
  kFrontend: ["フロント", "Next.js App", "browser UI"],
  kBackend: ["バックエンド", "Express", "server runtime"],
  kWebhook: ["Webhook", "POST callback", "incoming event"],
  kMicroservice: ["マイクロサービス", "Order Service", "1 機能 1 サービス"],
  kSigner: ["署名者", "Signer", "HMAC / 公開鍵署名"],
  kOracle: ["Oracle", "Feature flag service", "外部設定の取込"],
  kMerkleTree: ["Merkle Tree", "Hash tree", "ハッシュ二分木"],
  kDecision: ["判定分岐", "if/else", "条件分岐"],
};

const mod = PrimExt as unknown as Record<string, CdlDiagram>;

/** 段が動かす値を (状態, 始点, 終点) で取り出す。 動かす宣言が無ければ空 */
function 動かす値(d: CdlDiagram): Array<{ id: string; from: string; to: string }> {
  const out: Array<{ id: string; from: string; to: string }> = [];
  for (const p of d.phases ?? []) {
    for (const t of p.tweens ?? []) {
      const tw = t as unknown as { stateId: string; from: unknown; to: unknown };
      out.push({ id: tw.stateId, from: String(tw.from), to: String(tw.to) });
    }
  }
  return out;
}

/** 状態の初期値を差し替えた図。 元の図は触らない */
function 初期値を変えた図(d: CdlDiagram, id: string, value: string): CdlDiagram {
  const copy = structuredClone(d) as CdlDiagram;
  copy.states = (copy.states ?? []).map((s) => (s.id === id ? { ...s, initial: value } : s));
  return copy;
}

/** 図を描いた SVG の、文字として出ている部分 */
function 絵の文字(d: CdlDiagram): string[] {
  const svg = renderToStaticMarkup(<CdlDiagramView diagram={d} hideHeader />);
  return [...svg.matchAll(/<text[^>]*>([^<]*)<\/text>/g)].map((m) => m[1] ?? "");
}

describe("動かすと決めた見本は絵が変わる (#1172)", () => {
  it("対象 21 件が実在する", () => {
    // 名前を打ち間違えると以下の検査が空振りする
    const 無い = 対象.filter((k) => mod[k] === undefined);
    expect(無い, `図が無い: ${無い.join(", ")}`).toHaveLength(0);
    expect(対象).toHaveLength(21);
  });

  it("21 件すべてが、段で動かす値を 1 つ以上持つ", () => {
    const 無し = 対象.filter((k) => 動かす値(mod[k]!).length === 0);
    expect(無し, `動かす値が無い: ${無し.join(", ")}`).toHaveLength(0);
  });

  it("21 件すべてで、段が動かす値を変えると絵の文字が変わる", () => {
    // **本 file の中核**。 値を描く経路が無い種別ではここが一致し、検査が落ちる
    const 動かない: string[] = [];
    for (const k of 対象) {
      const d = mod[k]!;
      const 変わった = 動かす値(d).some(({ id, from, to }) => {
        const 始 = 絵の文字(初期値を変えた図(d, id, from)).join("|");
        const 終 = 絵の文字(初期値を変えた図(d, id, to)).join("|");
        return 始 !== 終;
      });
      if (!変わった) 動かない.push(k);
    }
    expect(動かない, `値を変えても絵が変わらない: ${動かない.join(", ")}`).toHaveLength(0);
  });

  it("動かす値は箱の値の欄に出る (説明を潰していない)", () => {
    // 絵が変わるだけなら、説明の文字を値で置き換えても通ってしまう。
    // 値の欄 (`node.value`) に置いたことをここで固定する
    const 欄が違う: string[] = [];
    for (const k of 対象) {
      const 値 = (mod[k]!.nodes ?? []).map((n) => (n as { value?: string }).value ?? "");
      if (!値.some((v) => v.includes("{v}"))) 欄が違う.push(k);
    }
    expect(欄が違う, `値の欄に段の値を置いていない: ${欄が違う.join(", ")}`).toHaveLength(0);
  });

  it("種別の説明を変えていない", () => {
    // 値を足す作業で種別の説明を潰すと、見本としての役割が失われる (#1172 の完了条件)
    const 違う: string[] = [];
    for (const k of 対象) {
      const n = (mod[k]!.nodes ?? [])[0] as
        | { eyebrow?: string; title?: string; subtitle?: string }
        | undefined;
      const [eyebrow, title, subtitle] = 説明[k]!;
      if (n?.eyebrow !== eyebrow) 違う.push(`${k}.eyebrow: ${n?.eyebrow}`);
      if (n?.title !== title) 違う.push(`${k}.title: ${n?.title}`);
      if (n?.subtitle !== subtitle) 違う.push(`${k}.subtitle: ${n?.subtitle}`);
    }
    expect(違う, `説明が変わっている: ${違う.join(" / ")}`).toHaveLength(0);
  });

  it("宣言の層でも連続して動く (画面の一文と揃う)", () => {
    // 一覧に出る一文は `motionOf` から導かれる。 描画では動くのに一文が
    // 「段を進めても値は変わらない」 のままだと、読み手に嘘を伝える
    const 違う = 対象.filter((k) => motionOf(mod[k]!) !== "continuous")
      .map((k) => `${k}: ${motionOf(mod[k]!)}`);
    expect(違う, `一文が実装と合わない: ${違う.join(", ")}`).toHaveLength(0);
  });
});

/**
 * 場面の見本 (`scene-*` 30 件) は、箱を 1 つずつ光らせて流れとして読ませる (#1192)。
 *
 * 値を持たせる形は採れない = 場面が使う種別 (`shape-*` 系) は値を描く経路を持たず、値を
 * 足しても絵が変わらない (実測 = 30 件すべてで SVG が 1 byte も変わらなかった)。 一方で
 * 注目先を変えると絵は変わるので、そちらで動かす。
 */
describe("場面の見本は段ごとに絵が変わる (#1192)", () => {
  const 場面 = Object.entries(Prim as unknown as Record<string, CdlDiagram>)
    .filter(([, d]) => {
      if (!d || typeof d !== "object") return false;
      return typeof d.id === "string" && d.id.startsWith("scene-") && Array.isArray(d.nodes);
    })
    .map(([k, d]) => [k, d] as const);

  it("対象が 30 件ある", () => {
    // 名前の付け方が変わると以下が空振りする
    expect(場面).toHaveLength(30);
  });

  it("30 件すべてが 3 段を持つ", () => {
    const 足りない = 場面.filter(([, d]) => d.phases.length !== 3).map(([k, d]) => `${k}: ${d.phases.length}`);
    expect(足りない, `段が 3 つでない: ${足りない.join(", ")}`).toHaveLength(0);
  });

  it("30 件すべてで、最初の段と最後の段の絵が違う", () => {
    // **宣言ではなく描画結果で見る**。 段を足しても絵が変わらなければ、開いた人には
    // 静止画と区別が付かない (#1173 で 79 件がこの形だった)
    const 変わらない: string[] = [];
    for (const [k, d] of 場面) {
      const 最初 = renderToStaticMarkup(
        <CdlDiagramView diagram={d} hideHeader focusPhaseId={d.phases[0]!.id} />,
      );
      const 最後 = renderToStaticMarkup(
        <CdlDiagramView diagram={d} hideHeader focusPhaseId={d.phases[d.phases.length - 1]!.id} />,
      );
      if (最初 === 最後) 変わらない.push(k);
    }
    expect(変わらない, `段を進めても絵が変わらない: ${変わらない.join(", ")}`).toHaveLength(0);
  });

  it("段ごとに光る箱が増える (流れとして読める)", () => {
    // 数だけ増えても、前段の箱を別の箱に入れ替えたら流れの積み上げにならない
    const 進まない: string[] = [];
    for (const [k, d] of 場面) {
      let 前 = new Set<string>();
      for (const [i, p] of d.phases.entries()) {
        const 生 = p.activate ?? [];
        const 今 = new Set(生);
        const 消えた = [...前].filter((id) => !今.has(id));
        if (生.length !== 今.size) 進まない.push(`${k}[${i}]: 同じ箱が重複`);
        if (消えた.length > 0) 進まない.push(`${k}[${i}]: 前段の箱が消えた (${消えた.join(", ")})`);
        if (今.size <= 前.size) 進まない.push(`${k}[${i}]: 箱が増えていない (${前.size} → ${今.size})`);
        前 = 今;
      }
    }
    expect(進まない, `光る箱が積み上がらない: ${進まない.join(", ")}`).toHaveLength(0);
  });
});
