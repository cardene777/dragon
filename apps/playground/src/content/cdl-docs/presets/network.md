# network preset

`network` preset は NW topology (router / switch / firewall / server / client) を `col` (列) + `row` (行) grid で配置し、 link で protocol / VLAN 等を表示する高位 API です。
on-prem / hybrid NW 構成の説明に向いています。

各 device は `kind` (router / switch / firewall / server / client) と segment (DMZ / LAN / WAN 等) を持ち、 link で protocol を edge label に明示できます。

## いつ使うか

`network` は IT infrastructure / SRE のネットワーク図に最適です。

- office NW (Firewall → Switch → Server) を視覚化
- DMZ / LAN segment の区分を eyebrow で示す
- TCP 22 / TCP 5432 / VLAN 10 等の protocol を明示する

cloud architecture (AWS / GCP) を描きたい場合は [infrastructure preset](/docs/cdl/presets/infrastructure) のほうが kind 表現が豊富です。

## device kind → NodeKind 対応

| device kind | NodeKind | 視覚 |
|---|---|---|
| `router` | service | 青、 routing |
| `switch` | service | 青、 switching |
| `firewall` | service | 赤、 security |
| `server` | backend | 灰、 server |
| `client` | actor | 緑、 client |

## Signature

```ts
network({ id: string, topic: string, laneWidth?: number, defaultTone?: Tone })
  .device({ id, title, kind: "router" | "switch" | "firewall" | "server" | "client",
            col: number, row: number, segment? })
  .link({ from, to, protocol?, tone? })
  .build()
```

[preview:presets/network-demo]

## 完全な例

```ts
import { network } from "@cardenelabs/cdl";

export const officeNw = network({ id: "office", topic: "Office NW" })
  .device({ id: "fw", title: "Firewall", kind: "firewall", col: 0, row: 0, segment: "DMZ" })
  .device({ id: "sw1", title: "Switch A", kind: "switch", col: 1, row: 0, segment: "LAN" })
  .device({ id: "srv", title: "App Server", kind: "server", col: 2, row: 0 })
  .device({ id: "db", title: "DB Server", kind: "server", col: 2, row: 1 })
  .link({ from: "fw", to: "sw1", protocol: "VLAN 10" })
  .link({ from: "sw1", to: "srv", protocol: "TCP 22" })
  .link({ from: "sw1", to: "db", protocol: "TCP 5432" })
  .build();
```

[preview:presets/network-demo]

## 関連

- [infrastructure preset](/docs/cdl/presets/infrastructure) — cloud architecture (AWS / GCP / Azure)
- [topology preset](/docs/cdl/presets/topology) — group + container を使う構成図
