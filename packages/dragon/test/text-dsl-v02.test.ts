import { describe, it, expect } from "vitest";
import { textDslToDiagram } from "@cardenelabs/dragon";

describe("Text DSL v0.2 ... 残 5 preset 対応", () => {
  describe("flow preset", () => {
    it("compile: actors を縦 stack で配置、 流れ 内の edge label を反映", () => {
      const src = `
タイトル: Auth Flow
種類: flow

登場人物:
  - User
  - API (function)
  - DB (storage)

流れ:
  1. User → API: login
  2. API → DB: SELECT
`;
      const diag = textDslToDiagram(src);
      expect(diag.topic).toBe("Auth Flow");
      expect(diag.nodes.length).toBeGreaterThanOrEqual(3);
      expect(diag.edges.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe("swimlane preset", () => {
    it("compile: actors を lane 化、 流れ で node + edge 配置", () => {
      const src = `
タイトル: Tx Flow
種類: swimlane

登場人物:
  - Sender
  - Contract (function)
  - Receiver

流れ:
  1. Sender → Contract: call
  2. Contract → Receiver: emit (成功)
`;
      const diag = textDslToDiagram(src);
      expect(diag.topic).toBe("Tx Flow");
      // 3 lane + 3 node + 2 edge
      expect(diag.lanes.length).toBe(3);
      expect(diag.edges.length).toBe(2);
      expect(diag.edges[1]!.tone).toBe("success");
    });
  });

  describe("er preset", () => {
    it("compile: actors を entity 化、 流れ を relation 化、 cardinality auto", () => {
      const src = `
タイトル: User Order
種類: er

登場人物:
  - User
  - Order
  - Product

流れ:
  1. User → Order: places (1:N)
  2. Order → Product: contains (N:M)
`;
      const diag = textDslToDiagram(src);
      expect(diag.topic).toBe("User Order");
      // 3 entity = 3 lane
      expect(diag.lanes.length).toBe(3);
      // 2 relation = 2 edge
      expect(diag.edges.length).toBe(2);
    });

    it("cardinality 省略時は語を補わない (#2105、組み立て API と段を持つ図に揃える)", () => {
      const src = `
タイトル: T
種類: er
登場人物:
  - A
  - B
流れ:
  1. A → B: links
`;
      const diag = textDslToDiagram(src);
      // 書いていない語は名前の下の行にも端にも出さない
      expect(diag.edges[0]!.label).toBe("links");
      expect(diag.edges[0]!.sub).toBeUndefined();
      expect(diag.edges[0]!.head).toBeUndefined();
    });
  });

  describe("state preset", () => {
    it("compile: actors を state 化、 最初 = initial、 最後 = final", () => {
      const src = `
タイトル: Auth FSM
種類: state

登場人物:
  - Idle
  - Loading
  - Done
  - Error

流れ:
  1. Idle → Loading: submit
  2. Loading → Done: success (成功)
  3. Loading → Error: fail (失敗)
`;
      const diag = textDslToDiagram(src);
      expect(diag.topic).toBe("Auth FSM");
      // 4 state = 4 lane
      expect(diag.lanes.length).toBe(4);
      // 3 transition = 3 edge
      expect(diag.edges.length).toBe(3);
    });

    it("trigger と guard (sub) 両対応", () => {
      const src = `
タイトル: Retry FSM
種類: state
登場人物:
  - Error
  - Idle
流れ:
  1. Error → Idle: retry (条件)
`;
      const diag = textDslToDiagram(src);
      expect(diag.edges[0]!.label).toBe("retry");
      // sub label に「条件」 が入る
      expect(diag.edges[0]!.sub).toBeDefined();
    });
  });

  describe("topology preset", () => {
    it("compile: actors を 1 group 内 container 化、 流れ を connect 化", () => {
      const src = `
タイトル: System Architecture
種類: topology

登場人物:
  - Browser (frontend)
  - ALB (service)
  - ECS (service)
  - RDS (database)

流れ:
  1. Browser → ALB: HTTPS
  2. ALB → ECS: round-robin
  3. ECS → RDS: TCP 5432
`;
      const diag = textDslToDiagram(src);
      expect(diag.topic).toBe("System Architecture");
      // 1 group (lane) + 4 container (node)
      expect(diag.nodes.length).toBe(4);
      expect(diag.edges.length).toBe(3);
    });
  });

  describe("preset 共通 ... unknown type 時は throw", () => {
    it("unknown type で throw", () => {
      const src = `
タイトル: T
種類: hexagon
登場人物:
  - A
流れ:
  1. A → A: self
`;
      // parser で「未知の種類」 として error 返す
      expect(() => textDslToDiagram(src)).toThrow();
    });
  });
});
