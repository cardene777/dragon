/**
 * Auto layout — preset に lanes / edges 指定があれば、 hardcoded x/y を無視して
 * lane 幅と node 数から grid layout を計算する。
 *
 * lane.x + lane.w を base に、 各 lane 内の nodes を垂直 stack、 h の中央に配置。
 * 現状は simple layout algorithm、 将来 ELK / dagre 統合の橋渡し。
 *
 * 単一 lane preset (flow / state / mindmap) では row-major stack。
 */

import type { PresetDoc, PresetNode } from "./presets";

export interface LayoutOptions {
  autoLayout?: boolean;
  padding?: number;
}

/**
 * lanes 使用 preset で node を自動配置。 lane.x/w を尊重、
 * lane 内の node は垂直中央 stack で並べる。
 */
export function autoLayoutNodes(preset: PresetDoc, opts: LayoutOptions = {}): PresetNode[] {
  if (!opts.autoLayout) return preset.nodes;
  const pad = opts.padding ?? 20;
  const lanes = preset.lanes;
  if (!lanes || lanes.length === 0) return preset.nodes;

  // group nodes by lane (nodes.lane === lane.id の場合、 逆に position 見て決める)
  const nodesByLane = new Map<string, PresetNode[]>();
  const noLane: PresetNode[] = [];
  preset.nodes.forEach((n) => {
    const inLane = lanes.find(
      (l) => n.x >= l.x && n.x + n.w <= l.x + l.w && n.y >= l.y && n.y + n.h <= l.y + l.h,
    );
    if (inLane) {
      const arr = nodesByLane.get(inLane.id) ?? [];
      arr.push(n);
      nodesByLane.set(inLane.id, arr);
    } else {
      noLane.push(n);
    }
  });

  const laidOut: PresetNode[] = [];
  lanes.forEach((lane) => {
    const nodes = nodesByLane.get(lane.id) ?? [];
    if (nodes.length === 0) return;
    // vertical stack: node.h 総和 + gap で center
    const totalH = nodes.reduce((s, n) => s + n.h, 0) + (nodes.length - 1) * 20;
    let y = lane.y + (lane.h - totalH) / 2;
    nodes.forEach((n) => {
      laidOut.push({
        ...n,
        x: lane.x + (lane.w - n.w) / 2,
        y,
      });
      y += n.h + 20;
    });
  });
  return [...laidOut, ...noLane];
}
