import { renderToStaticMarkup } from "react-dom/server";
import { createElement } from "react";
import { writeFileSync } from "node:fs";
import * as cdl from "@cardenelabs/cdl";

const phase = process.argv[2] ?? "phase2b";
const all = {
  phase2b: [
    { id: "shape-window", jp: "ウィンドウ", title: "ダッシュボード", eyebrow: "window", subtitle: "GUI アプリ" },
    { id: "shape-terminal", jp: "端末", title: "zsh", eyebrow: "terminal", subtitle: "CLI shell" },
    { id: "shape-code-block", jp: "コード block", title: "utils.ts", eyebrow: "code", subtitle: "3 line snippet" },
    { id: "shape-kanban-card", jp: "kanban ticket", title: "CAR-1111", eyebrow: "in progress", subtitle: "shape-driven kind" },
    { id: "shape-message-bubble", jp: "吹き出し", title: "了解しました", eyebrow: "message", subtitle: null },
    { id: "shape-gear", jp: "歯車", title: "Settings", eyebrow: "config", subtitle: "設定 / process engine" },
  ],
  phase2c: [
    { id: "shape-server-rack", jp: "サーバラック", title: "web-01", eyebrow: "server", subtitle: "3 U rack mount" },
    { id: "shape-network-node", jp: "network hub", title: "core-router", eyebrow: "network", subtitle: "L3 gateway" },
    { id: "shape-mobile-device", jp: "スマホ", title: "iPhone", eyebrow: "mobile", subtitle: "iOS client" },
    { id: "shape-iot-sensor", jp: "IoT センサー", title: "温度センサー", eyebrow: "iot", subtitle: "BLE beacon" },
    { id: "shape-robot-arm", jp: "ロボアーム", title: "組立ライン", eyebrow: "robot", subtitle: "6-axis arm" },
    { id: "shape-satellite", jp: "人工衛星", title: "Starlink", eyebrow: "satellite", subtitle: "LEO 通信衛星" },
  ],
};
const shapes = all[phase];
const W = 440;

const results = [];
for (const s of shapes) {
  let b = cdl.diagram(s.id, { topic: `shape: ${s.id}` })
    .lane("l", { x: 0, width: W })
    .node("n", { lane: "l", stack: 0, kind: s.id, title: s.title, eyebrow: s.eyebrow, ...(s.subtitle ? { subtitle: s.subtitle } : {}) });
  const built = b.phase("p", { duration: 1500, title: s.id, body: "" }, (p) => p.activate("n")).build();
  const el = createElement(cdl.CdlDiagramView, { diagram: built, hideHeader: true });
  const html = renderToStaticMarkup(el);
  const m = html.match(/<svg[\s\S]*?<\/svg>/);
  if (!m) {
    console.error(`no svg for ${s.id}`);
    continue;
  }
  results.push({ ...s, svg: m[0] });
  console.log(`OK ${s.id} svg=${m[0].length} chars`);
}

const outResolved = `/private/tmp/claude-501/-Users-cardene-Desktop-projects-chainome/2c748073-8e3d-46e7-aac0-5101b076b471/scratchpad/shapes-ssr-${phase}.json`;
writeFileSync(outResolved, JSON.stringify(results, null, 2));
console.log(`wrote ${results.length} shapes to ${outResolved}`);
