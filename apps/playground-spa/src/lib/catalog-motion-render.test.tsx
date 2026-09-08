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
import * as Presets from "@/topics/catalog/presets.cdl";
import * as Charts from "@/topics/catalog/charts.cdl";
import { motionOf } from "./catalog-motion";

/**
 * 動かすと決めた見本 (#1172 の対象、 `primitives-extra`)。 件数は下の `it` の題が SSOT。
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

/**
 * 描いた結果のうち、**図の中の見える部分だけ** (#1194)。
 *
 * 描いた markup を丸ごと比べると、図の中身が 1 画素も変わらない 2 段でも差が出る。
 * 段の状態が図の外に 2 箇所出るため。
 *
 * | 出どころ | 中身 |
 * |---|---|
 * | 外側の属性 | `data-cdl-phase-id` に段の id がそのまま出る |
 * | 画面下部のしるし | 今どの段かを表す点の並び (幅と色が変わる) |
 *
 * 図の中にも見た目に出ない欄がある。 `data-cdl-title` / `data-cdl-subtitle` /
 * `data-cdl-eyebrow` は文字を写した控えで、種別が文字を自前で固定している場合
 * (`shape-blockchain-block`) は控えだけが変わり、見える文字は 1 つも変わらない。
 *
 * **段の題と説明も落とす**。 これは読み上げ用の説明として SVG の `aria-label` に入るため、
 * 段ごとに違う題を付けた図は中身が 1 つも変わらなくても差が出る (実測)。 段の題は図の
 * 見た目ではないので、比べる対象から外す。
 *
 * そこで SVG の外を落とし、控えの欄と読み上げ用の説明も落として比べる。 文字が本当に変わる
 * 図では `<text>` の中身が変わるので、落としても取りこぼさない。 これらを落とさない物差しが
 * 何を通してしまうかは、末尾の「図の外の差を『動いた』 と数えない」 が材料付きで固定する。
 */
function 見える部分(d: CdlDiagram, phaseId?: string): string {
  const s = renderToStaticMarkup(<CdlDiagramView diagram={d} hideHeader focusPhaseId={phaseId} />);
  const 始 = s.indexOf("<svg");
  const 終 = s.lastIndexOf("</svg>");
  if (始 < 0 || 終 <= 始) throw new Error("図が描かれていない");
  return s
    .slice(始, 終 + 6)
    .replace(/ data-cdl-(title|subtitle|eyebrow)="[^"]*"/g, "")
    .replace(/ aria-label="[^"]*"/g, "");
}

/** 同じ図から 2 段だけを取り出した図。 比べ方そのものを試すのに使う */
function 二段にする(d: CdlDiagram, a: Partial<CdlDiagram["phases"][number]>, b: Partial<CdlDiagram["phases"][number]>): CdlDiagram {
  const 元 = d.phases[0]!;
  return { ...d, phases: [{ ...元, id: "a", ...a }, { ...元, id: "b", ...b }] };
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
 * 場面の見本 (`scene-*`) は、箱を 1 つずつ光らせて流れとして読ませる (#1192)。
 *
 * ここには当初「値を持たせる形は採れない」 と書いていたが、**それは測り方の誤りだった**
 * (#1194)。 差し替えていたのは値の欄 (`node.value`) だけで、その欄を描くのは 2 種別しか無い。
 * `title` / `subtitle` / `eyebrow` は cdl の `render/nodes.tsx` が全種別で `{名前}` 置換するので、
 * `shape-*` 系にも値で動かす道はある。
 *
 * それでも注目先で動かすのは、場面が見せたいのが「どの順で通るか」 だから。 値を足すと
 * 数の変化に目が行き、順番が読み取りにくくなる。
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
    // 静止画と区別が付かない (#1173 で 79 件がこの形だった)。
    //
    // 比べるのは図の中の見える部分だけ。 描いた markup を丸ごと比べていた間、この検査は
    // 段の id と画面下部のしるしが必ず変わるため **落ちない検査** だった (#1194)
    const 変わらない: string[] = [];
    for (const [k, d] of 場面) {
      const 最初 = 見える部分(d, d.phases[0]!.id);
      const 最後 = 見える部分(d, d.phases[d.phases.length - 1]!.id);
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

/**
 * 図の型の見本 (`presets`) は段ごとに絵が変わる (#1194 / #1204)。
 *
 * 動かし方は箱の数で 2 通りに分かれる。 箱を複数持つ見本は `scene-*` と同じく 1 つずつ
 * 光らせ、図全体が箱 1 つの見本は中身 (割合 / 段階 / 期間 / 感情 / 象限 / 名前 / 言づて) を
 * 状態から取る。 **件数は下の `it` の題が SSOT** = ここに写すと片方だけ古くなる。
 * 見るのはどちらも同じで、図の中の見える部分が段で変わることだけ。
 *
 * `tree-demo` / `mind-demo` は cdl 0.7.0 で名前が状態を読むようになり、対象に入った。
 * 対象外の一覧 (`型の見本で残す`) は空になっている。
 */
describe("図の型の見本は段ごとに絵が変わる (#1194)", () => {
  /** 図全体が箱 1 つの型。 光らせ方では動かせないので、図表の中身を状態から取る */
  const 箱が1つ = new Set([
    "journey-demo", "funnel-demo", "quad-demo",
    "chart-pie-demo", "chart-line-demo", "gantt-demo",
    // cdl 0.7.0 で名前が状態を読むようになった 2 件 (#1194 では対象外だった)
    "tree-demo", "mind-demo",
    // #1466 で順序図は 1 枚の板になった。 段は「どこまで描くか」 を状態に書く
    "seq-demo",
  ]);
  // cdl 0.7.0 で木と放射も名前が状態を読むようになり、対象外は 0 件になった
  const 経路無し = new Set<string>();

  const 型 = Object.entries(Presets as unknown as Record<string, CdlDiagram>)
    .filter(([, d]) => {
      if (!d || typeof d !== "object") return false;
      return typeof d.id === "string" && Array.isArray(d.nodes) && Array.isArray(d.phases);
    })
    .filter(([, d]) => !経路無し.has(d.id))
    .map(([k, d]) => [k, d] as const);

  it("対象が 21 件ある", () => {
    // preset を足し引きすると以下が空振りする
    expect(型).toHaveLength(21);
  });

  it("21 件すべてが 2 段以上を持つ", () => {
    // preset の `build()` は段を 1 つだけ作り、全要素を光らせて終わる
    const 足りない = 型.filter(([, d]) => d.phases.length < 2).map(([k, d]) => `${k}: ${d.phases.length}`);
    expect(足りない, `段が 1 つのまま: ${足りない.join(", ")}`).toHaveLength(0);
  });

  it("21 件すべてで、最初の段と最後の段で図の中の見える部分が変わる", () => {
    // **本 describe の中核**。 段を足しても図が変わらなければ、開いた人には静止画と同じ
    const 変わらない: string[] = [];
    for (const [k, d] of 型) {
      const 最初 = 見える部分(d, d.phases[0]!.id);
      const 最後 = 見える部分(d, d.phases[d.phases.length - 1]!.id);
      if (最初 === 最後) 変わらない.push(k);
    }
    expect(変わらない, `段を進めても絵が変わらない: ${変わらない.join(", ")}`).toHaveLength(0);
  });

  it("箱を複数持つ 12 件は、段ごとに光る箱が増える", () => {
    const 対象 = 型.filter(([, d]) => !箱が1つ.has(d.id));
    expect(対象, "箱が 1 つの型の一覧が実物とずれている").toHaveLength(12);

    const 進まない: string[] = [];
    for (const [k, d] of 対象) {
      let 前 = new Set<string>();
      for (const [i, p] of d.phases.entries()) {
        const 今 = new Set(p.activate ?? []);
        const 消えた = [...前].filter((id) => !今.has(id));
        if (消えた.length > 0) 進まない.push(`${k}[${i}]: 前段の要素が消えた (${消えた.join(", ")})`);
        if (今.size <= 前.size) 進まない.push(`${k}[${i}]: 増えていない (${前.size} → ${今.size})`);
        前 = 今;
      }
    }
    expect(進まない, `光る箱が積み上がらない: ${進まない.join(", ")}`).toHaveLength(0);
  });

  it("箱が 1 つの 9 件は、段が図表の中身を動かす", () => {
    // 箱が 1 つしか無いので光らせ方では動かせない。 値を動かす宣言を持つことを見る
    const 対象 = 型.filter(([, d]) => 箱が1つ.has(d.id));
    expect(対象).toHaveLength(9);

    const 動かさない = 対象
      .filter(([, d]) => !d.phases.some((p) => (p.tweens?.length ?? 0) > 0 || (p.sets?.length ?? 0) > 0))
      .map(([k]) => k);
    expect(動かさない, `値を動かす宣言が無い: ${動かさない.join(", ")}`).toHaveLength(0);
  });

  it("図表の欄が全部解決する (既定値に落ちていない)", () => {
    // `{名前}` を解けなかった項目は落とさず既定値で描かれ、`data-cdl-unresolved` が付く。
    // 状態の名前を書き間違えても図は出るので、印を見ないと気付けない
    const 未解決: string[] = [];
    for (const [k, d] of 型) {
      for (const p of d.phases) {
        if (見える部分(d, p.id).includes("data-cdl-unresolved")) 未解決.push(`${k}[${p.id}]`);
      }
    }
    expect(未解決, `解決できない欄がある: ${未解決.join(", ")}`).toHaveLength(0);
  });
});

/**
 * 形の見本 (`shape-*` + `kind-*`) は数が段で動く (#1196)。
 *
 * 箱が 1 つしか無いので光らせ方では動かせない。 その形が表すものの数量を副題 (種別により
 * 値の欄 / 行) に置き、段の中で動かす。 **形そのものの見え方は変えない** = 題と目次は
 * 段をまたいで同じであることをここで固定する。
 *
 * 副題を描かない 4 種別は対象外 (理由と一覧は
 * `packages/dragon/test/catalog-motion-coverage.test.ts` の `形の見本で残す`)。 この 4 件は
 * 下の「動かす値が絵の文字に出る」 が落ちて見つかった = 副題に数を置いても絵が変わらなかった。
 */
describe("形の見本は数が段で動く (#1196)", () => {
  const 経路無し = new Set(["shape-blockchain-block", "shape-terminal", "shape-code-block", "shape-kanban-card"]);
  const 形 = Object.entries(Prim as unknown as Record<string, CdlDiagram>)
    .filter(([, d]) => {
      if (!d || typeof d !== "object") return false;
      if (typeof d.id !== "string") return false;
      return (d.id.startsWith("shape-") || d.id.startsWith("kind-")) && Array.isArray(d.phases);
    })
    .filter(([, d]) => !経路無し.has(d.id))
    .map(([k, d]) => [k, d] as const);

  it("対象が 50 件ある", () => {
    // 見本を足し引きすると以下が空振りする
    expect(形).toHaveLength(50);
  });

  it("50 件すべてが 2 段を持ち、段で動かす値を宣言している", () => {
    const 足りない = 形
      .filter(([, d]) => d.phases.length < 2 || !d.phases.some((p) => (p.tweens?.length ?? 0) > 0))
      .map(([k]) => k);
    expect(足りない, `段か動かす値が無い: ${足りない.join(", ")}`).toHaveLength(0);
  });

  it("50 件すべてで、最初の段と最後の段で図の中の見える部分が変わる", () => {
    // **本 describe の中核**。 宣言だけを見る検査は、値を描かない欄に置いた図を通してしまう
    const 変わらない: string[] = [];
    for (const [k, d] of 形) {
      const 最初 = 見える部分(d, d.phases[0]!.id);
      const 最後 = 見える部分(d, d.phases[d.phases.length - 1]!.id);
      if (最初 === 最後) 変わらない.push(k);
    }
    expect(変わらない, `段を進めても絵が変わらない: ${変わらない.join(", ")}`).toHaveLength(0);
  });

  it("50 件すべてで、題と目次が段をまたいで変わらない", () => {
    // 数を足す作業で形の見本としての説明を潰さない (#1172 が種別の見本で同じ形を固定している)
    const 違う: string[] = [];
    for (const [k, d] of 形) {
      const n = d.nodes[0] as { title?: string; eyebrow?: string } | undefined;
      if (!n) { 違う.push(`${k}: 箱が無い`); continue; }
      if ((n.title ?? "").includes("{")) 違う.push(`${k}.title に段の値が入っている`);
      if ((n.eyebrow ?? "").includes("{")) 違う.push(`${k}.eyebrow に段の値が入っている`);
    }
    expect(違う, `形の説明が段で動いている: ${違う.join(" / ")}`).toHaveLength(0);
  });

  it("50 件すべてで、動かす値が絵の文字に出る", () => {
    // 値を描かない欄 (`shape-*` の `value` 欄 等) に置くと、宣言はあるのに絵が変わらない。
    // 段の始点と終点をそれぞれ初期値に据えて描き、文字が変わることを見る
    const 出ない: string[] = [];
    for (const [k, d] of 形) {
      const tw = d.phases.flatMap((p) => p.tweens ?? [])[0] as
        | { stateId: string; from: number; to: number }
        | undefined;
      if (!tw) { 出ない.push(`${k}: 動かす値が無い`); continue; }
      const 文字 = (v: number) => {
        const c = structuredClone(d) as CdlDiagram;
        c.states = (c.states ?? []).map((st) => (st.id === tw.stateId ? { ...st, initial: v } : st));
        return 絵の文字(c).join("|");
      };
      if (文字(tw.from) === 文字(tw.to)) 出ない.push(k);
    }
    expect(出ない, `動かす値が絵の文字に出ない: ${出ない.join(", ")}`).toHaveLength(0);
  });
});

/**
 * 図表の見本 (`charts`) は段で動く (#1198 / #1201 / #1446)。
 *
 * 図表の見本は **記法で書く** (画面のコードのタブと「エディタで開く」 を成立させるため)。
 * そのため段も状態も記法に書いてあり、数の欄は `{名前}` で状態を読む。
 *
 * 数の欄で動く見本と、語の欄 (感情 / 象限 / 順番) で動く見本がある。 語の欄は位置と色が
 * 変わり文字は変わらないため、文字の検査は数を動かす側だけに掛ける。
 * **件数は下の `it` の題が SSOT**。
 *
 * 残る 2 件は期間の欄と階層の型で対象外
 * (理由と一覧は `packages/dragon/test/catalog-motion-coverage.test.ts` の `図表で残す`)。
 */
describe("図表の見本は数が段で動く (#1198)", () => {
  /**
   * 数を動かせない見本。 **鍵は図の id、除く理由は 2 通り**。
   *
   * | 図 | なぜ数が動かないか |
   * |---|---|
   * | 公開までの段取り / 四半期ごとの持ち場 | 期間の欄に `{名前}` を書ける経路が記法に無い |
   * | 配布物の構成 / 配布物の構成と役割 | 階層の型に数の欄が無い |
   * | 速くする手立てを並べる | 説明を書かない側の切替 (#1706)。 数は説明の欄に載るので、書くと切替の意味が消える |
   */
  const 数を動かせない = new Set([
    "公開までの段取り",
    "四半期ごとの持ち場",
    "配布物の構成",
    "配布物の構成と役割",
    "速くする手立てを並べる",
  ]);
  const 図表 = Object.entries(Charts as unknown as Record<string, CdlDiagram>)
    .filter(([, d]) => {
      if (!d || typeof d !== "object") return false;
      return typeof d.id === "string" && Array.isArray(d.nodes) && Array.isArray(d.phases);
    })
    .filter(([, d]) => !数を動かせない.has(d.id))
    .map(([k, d]) => [k, d] as const);

  it("対象が 21 件ある", () => {
    expect(図表).toHaveLength(21);
  });

  it("21 件すべてが 2 段を持ち、段で動かす値を宣言している", () => {
    // 数の欄は段の中で動かし (`tweens`)、語の欄は段に入った時点で切り替える (`sets`)。
    // 片方だけを見ると、もう片方で動かしている図を「動いていない」 と判定する
    const 足りない = 図表
      .filter(([, d]) =>
        d.phases.length < 2 ||
        !d.phases.some((p) => (p.tweens?.length ?? 0) > 0 || (p.sets?.length ?? 0) > 0),
      )
      .map(([k]) => k);
    expect(足りない, `段か動かす値が無い: ${足りない.join(", ")}`).toHaveLength(0);
  });

  it("21 件すべてで、最初の段と最後の段で図の中の見える部分が変わる", () => {
    const 変わらない: string[] = [];
    for (const [k, d] of 図表) {
      const 最初 = 見える部分(d, d.phases[0]!.id);
      const 最後 = 見える部分(d, d.phases[d.phases.length - 1]!.id);
      if (最初 === 最後) 変わらない.push(k);
    }
    expect(変わらない, `段を進めても絵が変わらない: ${変わらない.join(", ")}`).toHaveLength(0);
  });

  it("21 件のうち数を動かす 18 件で、動かす値が絵の文字に出る", () => {
    // 記法の入口が `{名前}` を数に潰すと、宣言はあるのに絵が変わらない (#1198 で塞いだ形)。
    // 段を指定して描き、`<text>` の中身が変わることを見る
    const 文字 = (d: CdlDiagram, phaseId: string) =>
      [...見える部分(d, phaseId).matchAll(/<text[^>]*>([^<]*)<\/text>/g)].map((m) => m[1]).join("|");
    // 語の欄で動く見本は位置と色が変わり、文字は変わらない。 数を動かす側だけを見る
    const 語で動く = new Set(["初めて使うまで", "初めて使うまでの接点", "着手の順番"]);
    const 数で動く = 図表.filter(([, d]) => !語で動く.has(d.id));
    expect(数で動く, "数を動かす図の数が変わっている").toHaveLength(18);
    const 出ない: string[] = [];
    for (const [k, d] of 数で動く) {
      const 最初 = 文字(d, d.phases[0]!.id);
      const 最後 = 文字(d, d.phases[d.phases.length - 1]!.id);
      if (最初 === 最後) 出ない.push(k);
    }
    expect(出ない, `動かす値が絵の文字に出ない: ${出ない.join(", ")}`).toHaveLength(0);
  });

  it("21 件すべてで、項目が 1 つも落ちていない", () => {
    // 記法が `{名前}` を読めないと項目ごと落ちる。 落ちた図は「正しい図」 に見えてしまう。
    //
    // **一覧に無い図を黙って飛ばさない**。 期待値の無い図を素通りさせると、対象が増えた時に
    // その図だけ誰も数えないまま通る。
    //
    // 対象はすべて「箱 1 つに配列を載せる型」 になった (#1177 / #1223 で `type: mind` を 1 箱の
    // 種別へ寄せたため)。 札を並べる型はこの一覧に残っていないので、数える場所は 1 つでよい。
    //
    // 放射は中心が箱そのもので、枝が配列に載る。 5 人書いた図の期待は枝 4 本になる
    // (中心の 1 人は `mindData.rootTitle`)。
    const 期待: Record<string, { 中身: number }> = {
      経路別の流入: { 中身: 4 },
      週ごとの応答時間: { 中身: 5 },
      費用の内訳: { 中身: 4 },
      申込みまでの絞り込み: { 中身: 4 },
      "図を速くする": { 中身: 4 },
      初めて使うまで: { 中身: 4 },
      初めて使うまでの接点: { 中身: 4 },
      着手の順番: { 中身: 4 },
      今期の売上進捗: { 中身: 3 },
      機能ごとの利用率: { 中身: 4 },
      今月の解約率: { 中身: 1 },
      前の月と比べた解約率: { 中身: 1 },
      先月と比べた経路別の流入: { 中身: 4 },
      前期と比べた売上進捗: { 中身: 3 },
      先月と比べた機能ごとの利用率: { 中身: 4 },
      "問い合わせの内訳": { 中身: 3 },
      対応済みの問い合わせ: { 中身: 3 },
      契約の内訳: { 中身: 3 },
      経路別の申込み: { 中身: 4 },
      前期と比べた費用の内訳: { 中身: 4 },
      今期の契約の内訳: { 中身: 3 },
    };
    expect(Object.keys(期待).sort(), "期待値の一覧が対象とずれている").toEqual(
      図表.map(([, d]) => d.id).sort(),
    );

    const 違う: string[] = [];
    for (const [, d] of 図表) {
      const e = 期待[d.id]!;
      const n = d.nodes[0] as unknown as {
        chartData?: unknown[]; funnelData?: unknown[];
        journeyData?: unknown[]; quadrantData?: { items?: unknown[] };
        mindData?: { branches?: unknown[] };
      };
      const 件数 = (
        n.chartData ?? n.funnelData ?? n.journeyData ?? n.quadrantData?.items ?? n.mindData?.branches
      )?.length;
      if (件数 !== e.中身) 違う.push(`${d.id}: 中身 ${件数} (期待 ${e.中身})`);
    }
    expect(違う, `項目が落ちている: ${違う.join(", ")}`).toHaveLength(0);
  });

  it("21 件すべてで、解決できない欄が無い", () => {
    const 未解決: string[] = [];
    for (const [k, d] of 図表) {
      for (const p of d.phases) if (見える部分(d, p.id).includes("data-cdl-unresolved")) 未解決.push(`${k}[${p.id}]`);
    }
    expect(未解決, `解決できない欄がある: ${未解決.join(", ")}`).toHaveLength(0);
  });
});

/**
 * 比べ方そのものが効いていることを見る (#1194)。
 *
 * 上の 2 つの describe は「絵が変わる」 を根拠にしている。 その物差しが図の外の差を拾うと、
 * 何も動かしていない図まで通る。 #1194 まで実際にそうなっていた = 描いた markup を丸ごと
 * 比べており、段の id と画面下部のしるしが必ず変わるため、**どんな図でも必ず通っていた**。
 *
 * 通ってはいけない材料を 2 つ、通らなければいけない材料を 1 つ置いて、物差しを固定する。
 */
describe("図の外の差を『動いた』 と数えない (#1194)", () => {
  const 見本 = (id: string): CdlDiagram => {
    const d = Object.values(Prim as unknown as Record<string, CdlDiagram>).find(
      (x) => x && typeof x === "object" && x.id === id,
    );
    if (!d) throw new Error(`見本が無い: ${id}`);
    return d;
  };

  it("値を 1 つも読まない 2 段の図は、同じと判定される", () => {
    // 段の id と画面下部のしるしだけが違う図。 これを「動いた」 と数えると検査が空になる
    const d = 二段にする(見本("shape-file"), {}, {});
    expect(見える部分(d, "a")).toBe(見える部分(d, "b"));
  });

  // 控えの欄は 3 つある。 **3 つとも守る** = 1 つずつ試さないと、落とす対象から
  // 1 つ外しても検査が通ってしまう (実測 = 正規表現を `subtitle` だけに縮めても 32 件すべて
  // 通った)。
  //
  // 守り方は欄によって分かれる。 `subtitle` と `eyebrow` は、その欄を文字として描かない
  // 種別があるので実際の図で見る。 `title` は **描かない種別がもう無い** ため
  // (cdl 0.9.0 で全ての種別が題を描くようになった、実測で 110 種すべて)、
  // 絞り込みそのものを直接見る。
  for (const [欄, 見本の名] of [
    ["subtitle", "shape-terminal"],
    ["eyebrow", "shape-kanban-card"],
  ] as const) {
    it(`見えない控えの欄 (${欄}) だけが変わる図は、同じと判定される`, () => {
      const 元 = 見本(見本の名);
      const d = 二段にする(
        { ...元, nodes: 元.nodes.map((n) => ({ ...n, [欄]: "{v}" })), states: [{ id: "v", initial: "11" }] },
        { sets: [{ stateId: "v", value: "11" }], tweens: [] },
        { sets: [{ stateId: "v", value: "999999" }], tweens: [] },
      );
      // 材料が成立していること = この種別はその欄を文字として描かない
      const 文字 = (id: string) =>
        [...見える部分(d, id).matchAll(/<text[^>]*>([^<]*)<\/text>/g)].map((m) => m[1]).join("|");
      expect(文字("a"), "この欄が見える文字に出ている = 材料として使えない").toBe(文字("b"));
      expect(見える部分(d, "a")).toBe(見える部分(d, "b"));
    });
  }

  it("控えの欄 (title) は絞り込みで落ちる", () => {
    // 題を描かない種別が無くなったため、実際の図では材料を作れない。
    // 絞り込みが `data-cdl-title` を落とすことを直接見る。
    //
    // **描く側が変わっても落とす対象は残す**。 いま全ての種別が題を描くのは cdl 側の
    // 都合で、描かない種別が戻れば控えだけが変わる図がまた作れる
    const 元 = 見本("shape-terminal");
    const 生 = 二段にする(
      { ...元, nodes: 元.nodes.map((n) => ({ ...n, title: "{v}" })), states: [{ id: "v", initial: "11" }] },
      { sets: [{ stateId: "v", value: "11" }], tweens: [] },
      { sets: [{ stateId: "v", value: "999999" }], tweens: [] },
    );
    for (const id of ["a", "b"]) {
      expect(見える部分(生, id), `${id} 段に data-cdl-title が残っている`).not.toContain("data-cdl-title");
    }
    // 空振り検査。 題は実際に図へ渡っている (渡っていなければ落とす意味が無い)
    expect(生.nodes.some((n) => n.title === "{v}"), "題が図に渡っていない (検査が空振りしている)").toBe(true);
  });

  it("段の題と説明だけが違う 2 段の図は、同じと判定される", () => {
    // 段の題は読み上げ用の説明として `aria-label` に入る。 図の見た目ではないので、
    // これを差として数えると「段ごとに題を変えただけの図」 が動いた扱いになる (実測)
    const 元 = 見本("shape-file");
    const d = 二段にする(元, { title: "題 A", body: "説明 A" }, { title: "題 B", body: "説明 B" });
    expect(見える部分(d, "a")).toBe(見える部分(d, "b"));
  });

  it("光らせ方を変えた 2 段の図は、違うと判定される", () => {
    // 落とす側に寄せすぎると、本物の動きまで見えなくなる
    const 元 = 見本("shape-file");
    const d = 二段にする(元, { activate: [] }, { activate: [元.nodes[0]!.id] });
    expect(見える部分(d, "a")).not.toBe(見える部分(d, "b"));
  });

  it("文字が変わる図は、違うと判定される", () => {
    // 控えの欄を落とすときに `<text>` まで落としていないことを見る
    const 元 = 見本("shape-file");
    const d = 二段にする(
      { ...元, nodes: 元.nodes.map((n) => ({ ...n, subtitle: "残り {v}" })), states: [{ id: "v", initial: "11" }] },
      { sets: [{ stateId: "v", value: "11" }], tweens: [] },
      { sets: [{ stateId: "v", value: "99" }], tweens: [] },
    );
    expect(見える部分(d, "a")).not.toBe(見える部分(d, "b"));
  });
});
