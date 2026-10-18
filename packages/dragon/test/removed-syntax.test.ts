/**
 * 外した書き方を書いた人に置き換え先を返す (#2947)。
 *
 * dragon はどの分野にも寄らずに図を描く道具なので、特定の技術や会社に向けた書き方
 * (`type: solidity`、Solidity の図の種類、AWS の名前、cdl から外した挿絵) を外した。
 *
 * 外しただけだと、箱の種類は見本 (parts) の名前として「そんな部品は無い」 になり、図種は
 * 「図種が読めません」 になる。 どちらも何に書き換えればよいかが読めないため、表
 * (`src/v05/removed-syntax.ts`) から置き換え先を返す。 ここではそれを記法と JSON の
 * 両方の入口で、箱の種類を書ける 3 つの形すべてについて確かめる。
 */
import { NODE_KINDS } from "@cardenelabs/cdl";
import { describe, expect, it } from "vitest";

import { textDslToDiagram } from "../src";
import { validateDragonJson } from "../src/json-parser";
import { DSL_ONLY_KINDS, NODE_KIND_VALID, TYPE_ALIASES, parseTextDslV05 } from "../src/v05/parser";
import { 外した図種, 外した挿絵の種類, 外した種類 } from "../src/v05/removed-syntax";
import { diagramJsonSchema } from "../src/schema";

/** 箱の種類を書ける 3 つの形。 読む関数がそれぞれ別なので、1 つずつ確かめる */
const 書き方 = {
  短い形: (kind: string) => `  - A: ${kind}`,
  中括弧: (kind: string) => `  - A: { kind: ${kind} }`,
  縦に並べる: (kind: string) => `  - A:\n      kind: ${kind}`,
} as const;

const 記法 = (type: string, actor: string): string =>
  `title: "t"\ntype: ${type}\n\nactors:\n${actor}\n  - B\n\nflow:\n  - A -> B: "x"\n`;

/**
 * 外すと決めた書き方 (#2947 の表)。
 *
 * **実装の表とは別に書く**。 下の検査は実装の表を回すので、表から行が消えると
 * その行を見る検査も一緒に消えて通る (実測 = `eoa` の行を消しても 15 件すべて通った)。
 * 決めた一覧と表が一致することを先に見て、行が抜けた時に落とす。
 */
const 外すと決めた図種 = ["solidity"];
const 外すと決めた種類: Record<string, string> = {
  contract: "card",
  proxy: "card",
  library: "card",
  interface: "card",
  eoa: "person",
  multisig: "signer",
  alb: "api",
  ecs: "microservice",
  iam: "admin",
  kms: "admin",
  lambda: "function",
  rds: "database",
  s3: "storage",
};
/** cdl 0.140.0 で外れた挿絵 (cardene777/cdl#1256 の表) */
const 外すと決めた挿絵 = [
  "shape-kanban-card", "shape-message-bubble", "shape-gear",
  "shape-network-node", "shape-iot-sensor", "shape-robot-arm", "shape-satellite",
  "shape-website", "shape-cdn-edge", "shape-api-gateway", "shape-storefront", "shape-warehouse", "shape-online-shop",
  "shape-customer-service", "shape-lawyer", "shape-auditor", "shape-regulator", "shape-notary", "shape-trader",
  "shape-smart-contract", "shape-blockchain-block", "shape-blockchain", "shape-bitcoin-chain", "shape-ethereum-chain",
  "shape-blockchain-node", "shape-rpc-node", "shape-wallet", "shape-nft", "shape-token",
  "shape-bank", "shape-trust-bank", "shape-payment-provider", "shape-credit-card", "shape-brokerage", "shape-exchange", "shape-atm",
];

describe("外した書き方の表が決めた一覧と一致する (#2947)", () => {
  it("図種", () => {
    expect([...外した図種.keys()].sort()).toEqual([...外すと決めた図種].sort());
  });

  it("箱の種類と置き換え先", () => {
    const 挿絵以外 = [...外した種類].filter(([k]) => !外した挿絵の種類.includes(k));
    expect(Object.fromEntries(挿絵以外.map(([k, v]) => [k, 置き換え先(v)]))).toEqual(外すと決めた種類);
  });

  it("挿絵", () => {
    expect([...外した挿絵の種類].sort()).toEqual([...外すと決めた挿絵].sort());
    for (const k of 外すと決めた挿絵) expect(外した種類.has(k), `${k} が表に無い`).toBe(true);
  });
});

/** hint の最初の backtick の中身 (置き換え先の種類) */
const 置き換え先 = (hint: string | undefined): string | undefined => /`([^`]+)`/.exec(hint ?? "")?.[1];

describe("外した図種は置き換え先を知らせる (#2947)", () => {
  it("表が空でない (下の検査が空振りしていない)", () => {
    expect(外した図種.size).toBeGreaterThan(0);
  });

  for (const type of 外した図種.keys()) {
    it(`記法で type: ${type} と書くと置き換え先が出る`, () => {
      const r = parseTextDslV05(記法(type, "  - A"));
      expect(r.ok, "外した図種を受け付けている").toBe(false);
      if (r.ok) return;
      expect(r.errors.map((e) => e.message)).toEqual([`図種 "${type}" は外しました`]);
      expect(r.errors[0]!.hint).toContain("`type: sequence`");
      expect(r.errors[0]!.hint).toContain("`order: 種類`");
      expect(r.errors[0]!.line, "書いた行を指していない").toBe(2);
    });

    it(`JSON で type: ${type} と書くと置き換え先が出る`, () => {
      const r = validateDragonJson({ title: "t", type, actors: ["A", "B"], flow: [{ from: "A", to: "B" }] });
      expect(r.ok, "外した図種を受け付けている").toBe(false);
      if (r.ok) return;
      const 図種の誤り = r.errors.filter((e) => e.path === "$.type");
      expect(図種の誤り).toHaveLength(1);
      expect(図種の誤り[0]!.hint).toContain("`type: sequence`");
    });
  }

  it("置き換え先の書き方で同じ図が描ける", () => {
    const d = textDslToDiagram(
      `title: "t"\ntype: sequence\norder: 種類\n\nactors:\n  - Ev: { kind: event }\n  - User: { kind: actor }\n\nflow:\n  - User -> Ev: "x"\n`,
    );
    const 面 = d.nodes.find((n) => n.kind === "sequence-board")?.sequenceData?.actors ?? [];
    expect(面.map((a) => a.name)).toEqual(["User", "Ev"]);
  });
});

describe("外した箱の種類は置き換え先を知らせる (#2947)", () => {
  it("表が空でない (下の検査が空振りしていない)", () => {
    expect(外した種類.size).toBeGreaterThan(0);
  });

  it("外した種類は記法が受ける種類と 1 つも重ならない", () => {
    // 重なると、描ける種類を書いた人まで「外しました」 と止められる
    expect([...外した種類.keys()].filter((k) => NODE_KIND_VALID.has(k))).toEqual([]);
    expect([...外した種類.keys()].filter((k) => (NODE_KINDS as readonly string[]).includes(k))).toEqual([]);
  });

  for (const [名, 行] of Object.entries(書き方)) {
    it(`記法の${名}で書くと、どの種類も置き換え先が出る`, () => {
      const 違う: string[] = [];
      for (const [kind, 代わり] of 外した種類) {
        const r = parseTextDslV05(記法("flow", 行(kind)));
        if (r.ok) {
          違う.push(`${kind}: 受け付けた`);
          continue;
        }
        const 知らせ = r.errors.filter((e) => e.message === `箱の種類 "${kind}" は外しました`);
        if (知らせ.length !== 1) 違う.push(`${kind}: 知らせが ${知らせ.length} 件`);
        else if (!知らせ[0]!.hint?.includes(代わり)) 違う.push(`${kind}: 置き換え先が無い (${知らせ[0]!.hint})`);
      }
      expect(違う).toEqual([]);
    });
  }

  it("外した種類の知らせに、ほかの誤りを重ねない", () => {
    // 見本 (parts) の名前として扱うと、見本にしか効かない欄の誤りなどが重なって出て、
    // 置き換え先の知らせが埋もれる。 書いた誤りは種類 1 つなので、誤りも 1 件だけのはず
    const 重なった: string[] = [];
    for (const kind of 外した種類.keys()) {
      for (const [名, 行] of Object.entries(書き方)) {
        const r = parseTextDslV05(記法("flow", 行(kind)));
        const 件数 = r.ok ? 0 : r.errors.length;
        if (件数 !== 1) 重なった.push(`${kind} (${名}): ${件数} 件`);
      }
    }
    expect(重なった).toEqual([]);
  });

  it("JSON で書いても、どの種類も置き換え先が出る", () => {
    const 違う: string[] = [];
    for (const [kind, 代わり] of 外した種類) {
      const r = validateDragonJson({
        title: "t",
        type: "flow",
        actors: [{ name: "A", kind }, "B"],
        flow: [{ from: "A", to: "B" }],
      });
      if (r.ok) {
        違う.push(`${kind}: 受け付けた`);
        continue;
      }
      const 知らせ = r.errors.filter((e) => e.path === "$.actors[0].kind");
      if (知らせ.length !== 1) 違う.push(`${kind}: 知らせが ${知らせ.length} 件`);
      else if (!知らせ[0]!.hint?.includes(代わり)) 違う.push(`${kind}: 置き換え先が無い`);
      // 見本の名前として扱うと、見本にしか効かない欄の誤りなどが重なる
      if (r.errors.some((e) => e.path.startsWith("$.actors[0]") && e.path !== "$.actors[0].kind")) {
        違う.push(`${kind}: 種類以外の誤りが重なった`);
      }
    }
    expect(違う).toEqual([]);
  });

  it("置き換え先を書けば描ける種類になる", () => {
    // 置き換え先が描けない種類なら、知らせに従っても図が出ない
    const 描けない: string[] = [];
    let 確かめた = 0;
    for (const [kind, 代わり] of 外した種類) {
      if (外した挿絵の種類.includes(kind)) continue;
      const 先 = 置き換え先(代わり);
      if (先 === undefined) {
        描けない.push(`${kind}: 置き換え先を読めない`);
        continue;
      }
      const d = textDslToDiagram(記法("flow", `  - A: ${先}`));
      const 箱 = d.nodes.find((n) => n.title === "A");
      確かめた += 1;
      if (箱?.kind !== 先) 描けない.push(`${kind} → ${先} が ${String(箱?.kind)} で描かれた`);
    }
    expect(確かめた, "置き換え先を 1 つも確かめていない").toBeGreaterThan(0);
    expect(描けない).toEqual([]);
  });

  it("外した挿絵の代わりに示す形と書き方は、どちらも書ける", () => {
    const hint = 外した種類.get(外した挿絵の種類[0]!)!;
    const 形 = [...hint.matchAll(/`(shape-[a-z-]+)`/g)].map((m) => m[1]!);
    expect(形.length, "代わりの形を 1 つも示していない").toBeGreaterThan(0);
    for (const k of 形) expect(NODE_KINDS as readonly string[], k).toContain(k);
    expect(hint).toContain("`kindForm: icon`");
    const d = textDslToDiagram(記法("flow", "  - A: { kind: service, kindForm: icon, icon: box }"));
    expect(d.nodes.find((n) => n.title === "A")?.kind).toBe("service");
  });
});

describe("外した名前が受理の表に残っていない (#2947)", () => {
  it("図種の別名と schema の図種に外した図種が無い", () => {
    const schema = diagramJsonSchema as { properties: { type: { enum: string[] } } };
    expect(外した図種.size, "外した図種が無い (検査が空振りしている)").toBeGreaterThan(0);
    for (const type of 外した図種.keys()) {
      expect(TYPE_ALIASES.has(type), `${type} が別名に残っている`).toBe(false);
      expect(schema.properties.type.enum, `${type} が schema に残っている`).not.toContain(type);
    }
  });

  it("記法だけの種類と受理集合に外した種類が無い", () => {
    expect(外した種類.size, "外した種類が無い (検査が空振りしている)").toBeGreaterThan(0);
    for (const kind of 外した種類.keys()) {
      expect(DSL_ONLY_KINDS as readonly string[], `${kind} が記法だけの種類に残っている`).not.toContain(kind);
      expect(NODE_KIND_VALID.has(kind), `${kind} が受理集合に残っている`).toBe(false);
    }
  });
});
