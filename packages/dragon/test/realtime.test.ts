/**
 * realtime / offline helper (Axis 65-68) の behavior test。
 */
import { describe, it, expect } from "vitest";
import {
  WatchController,
  SweepReportRepository,
  createMemoryKvStore,
  createOffer,
  createAnswer,
  createReportMessage,
  createAck,
  validateP2pMessage,
  fetchWithCache,
  visualValidateAll,
  type CdlDiagram,
  type SweepReport,
  type WatchEvent,
} from "@cardenelabs/cdl";

function makeDiag(id: string): CdlDiagram {
  return {
    id,
    topic: "realtime test",
    lanes: [{ id: "l", x: 0, width: 400 }],
    nodes: [
      { id: "a", lane: "l", stack: 0, kind: "actor", title: "A" },
      { id: "b", lane: "l", stack: 1, kind: "actor", title: "B" },
    ],
    edges: [{ id: "e", from: "a", to: "b", label: "ok", tone: "accent" }],
    states: [],
    phases: [],
  };
}

describe("realtime helpers (Axis 65-68)", () => {
  // Axis 65: Watch mode
  it("WatchController.add は add event を emit", () => {
    const wc = new WatchController(() => 1000);
    const events: WatchEvent[] = [];
    wc.subscribe((e) => events.push(e));
    wc.add(makeDiag("d1"));
    expect(events).toHaveLength(1);
    expect(events[0].type).toBe("add");
    expect(events[0].timestamp).toBe(1000);
    expect(events[0].report).toBeTruthy();
  });

  it("WatchController.add で既存 id は change に fallback", () => {
    const wc = new WatchController();
    const events: WatchEvent[] = [];
    wc.subscribe((e) => events.push(e));
    wc.add(makeDiag("d1"));
    wc.add(makeDiag("d1")); // 2 回目は change
    expect(events.map((e) => e.type)).toEqual(["add", "change"]);
  });

  it("WatchController.unlink は report=null で emit + list から削除", () => {
    const wc = new WatchController();
    const events: WatchEvent[] = [];
    wc.subscribe((e) => events.push(e));
    wc.add(makeDiag("d1"));
    wc.unlink("d1");
    expect(events[1].type).toBe("unlink");
    expect(events[1].report).toBeNull();
    expect(wc.list()).toEqual([]);
  });

  it("WatchController.subscribe 戻り値で解除可能", () => {
    const wc = new WatchController();
    const events: WatchEvent[] = [];
    const unsub = wc.subscribe((e) => events.push(e));
    wc.add(makeDiag("d1"));
    unsub();
    wc.add(makeDiag("d2"));
    expect(events).toHaveLength(1);
  });

  // Axis 66: IDB persistence
  it("SweepReportRepository は save/load/remove/listIds", async () => {
    const store = createMemoryKvStore();
    const repo = new SweepReportRepository(store);
    const report = visualValidateAll([makeDiag("d1")]);
    await repo.save("run-1", report);
    const loaded = await repo.load("run-1");
    expect(loaded).toBeDefined();
    expect((loaded as SweepReport).total).toBe(1);
    const ids = await repo.listIds();
    expect(ids).toContain("run-1");
    await repo.remove("run-1");
    expect(await repo.load("run-1")).toBeUndefined();
  });

  it("SweepReportRepository の prefix で他 keyspace と分離", async () => {
    const store = createMemoryKvStore();
    await store.put("other:foo", 42);
    const repo = new SweepReportRepository(store, "cdl:sweep:");
    const report = visualValidateAll([makeDiag("d1")]);
    await repo.save("run-1", report);
    const ids = await repo.listIds();
    expect(ids).toEqual(["run-1"]);
  });

  // Axis 67: P2P sharing
  it("createOffer/Answer/Report/Ack は 4 種 message type を返す", () => {
    const sid = "session-42";
    expect(createOffer("peerA", sid).type).toBe("offer");
    expect(createAnswer("peerB", sid).type).toBe("answer");
    const report = visualValidateAll([makeDiag("d1")]);
    const rmsg = createReportMessage("peerA", sid, report);
    expect(rmsg.type).toBe("report");
    expect(rmsg.payload).toBe(report);
    expect(createAck("peerB", sid).type).toBe("ack");
  });

  it("validateP2pMessage は sessionId + type 一致で valid", () => {
    const msg = createOffer("peerA", "s1");
    expect(validateP2pMessage(msg, "s1", ["offer"]).valid).toBe(true);
    expect(validateP2pMessage(msg, "s2", ["offer"]).valid).toBe(false);
    expect(validateP2pMessage(msg, "s1", ["answer"]).valid).toBe(false);
  });

  // Axis 68: Service worker offline cache
  it("fetchWithCache cache-first で cache 有 = cache 返却", async () => {
    const cache = new Map();
    let computeCount = 0;
    const compute = async (): Promise<SweepReport> => {
      computeCount++;
      return visualValidateAll([makeDiag("d1")]);
    };
    const first = await fetchWithCache("key", cache, compute);
    expect(first.source).toBe("network");
    const second = await fetchWithCache("key", cache, compute);
    expect(second.source).toBe("cache");
    expect(computeCount).toBe(1);
  });

  it("fetchWithCache TTL 超過は cache 破棄で network 再取得", async () => {
    const cache = new Map();
    let now = 0;
    const compute = async () => visualValidateAll([makeDiag("d1")]);
    await fetchWithCache("k", cache, compute, { ttlMs: 100 }, () => now);
    now = 200;
    const result = await fetchWithCache("k", cache, compute, { ttlMs: 100 }, () => now);
    expect(result.source).toBe("network");
  });

  it("fetchWithCache stale-while-revalidate で即 cache 返し + background 再計算", async () => {
    const cache = new Map();
    const compute = async () => visualValidateAll([makeDiag("d1")]);
    await fetchWithCache("k", cache, compute);
    const swr = await fetchWithCache("k", cache, compute, { strategy: "stale-while-revalidate" });
    expect(swr.source).toBe("cache");
  });
});
