/**
 * Preset metadata SSOT (server-safe、 diagram import しない)。
 *
 * cdl の CdlDiagramThumbnail は client component、 diagram を含む `presets.ts` は
 * client bundle 専用。 sitemap / robots / metadata 等 server route では本 file を使う。
 */

export interface PresetMeta {
  id: string;
  slug: string;
  eyebrow: string;
  title: string;
  subtitle: string;
  tags: string[];
}

export const PRESET_METAS: PresetMeta[] = [
  { id: "swimlane", slug: "swimlane", eyebrow: "SWIMLANE / LAYOUT", title: "swimlane", subtitle: "3 lane 自動配置。", tags: ["3 lane", "auto layout"] },
  { id: "flow", slug: "flow", eyebrow: "FLOW / SEQUENCE", title: "flow", subtitle: "1 lane sequence。", tags: ["1 lane", "sequential"] },
  { id: "sequence", slug: "sequence", eyebrow: "SEQUENCE / UML", title: "sequence", subtitle: "actor 列 × 時系列 row。", tags: ["actor", "UML"] },
  { id: "topology", slug: "topology", eyebrow: "TOPOLOGY / DEPLOY", title: "topology", subtitle: "group + container 配置。", tags: ["group", "container"] },
  { id: "er", slug: "er", eyebrow: "ER / DB SCHEMA", title: "er", subtitle: "entity + cardinality。", tags: ["entity", "relation"] },
  { id: "stateMachine", slug: "state-machine", eyebrow: "STATE / FSM", title: "stateMachine", subtitle: "state + transition trigger。", tags: ["state", "transition"] },
  { id: "infrastructure", slug: "infrastructure", eyebrow: "INFRA / ARCHITECTURE", title: "infrastructure", subtitle: "SaaS architecture。", tags: ["saas", "arch"] },
  { id: "classDiagram", slug: "class", eyebrow: "CLASS / UML", title: "classDiagram", subtitle: "class + attribute + relation。", tags: ["class", "UML"] },
  { id: "tree", slug: "tree", eyebrow: "TREE / ORG CHART", title: "tree", subtitle: "組織図 / hierarchy tree。", tags: ["hierarchy", "org"] },
  { id: "userJourney", slug: "user-journey", eyebrow: "USER JOURNEY", title: "userJourney", subtitle: "Signup / Onboarding。", tags: ["ux", "journey"] },
  { id: "mindMap", slug: "mind", eyebrow: "MIND MAP / IDEA", title: "mindMap", subtitle: "root + branch 放射。", tags: ["mind map", "brain storm"] },
  { id: "mindMapRadial", slug: "mindmap-radial", eyebrow: "MIND MAP / RADIAL", title: "mindMapRadial", subtitle: "center → 8 方向。", tags: ["radial", "8-way"] },
  { id: "funnel", slug: "funnel", eyebrow: "FUNNEL / CONVERSION", title: "funnel", subtitle: "conversion funnel。", tags: ["metric", "conversion"] },
  { id: "quadrant", slug: "quadrant", eyebrow: "QUADRANT / MATRIX", title: "quadrant", subtitle: "2x2 マトリクス。", tags: ["matrix", "2x2"] },
  { id: "chartPie", slug: "chart-pie", eyebrow: "CHART / PIE", title: "chart (pie)", subtitle: "pie chart。", tags: ["chart", "pie"] },
  { id: "chartLine", slug: "chart-line", eyebrow: "CHART / LINE", title: "chart (line)", subtitle: "line chart。", tags: ["chart", "line"] },
  { id: "gantt", slug: "gantt", eyebrow: "GANTT / TIMELINE", title: "gantt", subtitle: "Release timeline。", tags: ["timeline", "gantt"] },
  { id: "flowchart", slug: "flowchart", eyebrow: "FLOWCHART / DECISION", title: "flowchart", subtitle: "2 lane 承認フロー。", tags: ["approval", "decision"] },
  { id: "network", slug: "network", eyebrow: "NETWORK / TOPOLOGY", title: "network", subtitle: "Office NW topology。", tags: ["network", "nw"] },
  { id: "stateMachine2", slug: "state-machine-2", eyebrow: "STATE / FSM 拡張", title: "stateMachine2", subtitle: "拡張 FSM。", tags: ["fsm", "nested"] },
];
