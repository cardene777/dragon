# network preset

`network` is a high-level API for NW topologies (router / switch / firewall / server / client) placed on a `col` × `row` grid, with `link` carrying protocol or VLAN labels.
It is suited for explaining on-prem / hybrid network architectures.

Each device has a `kind` (router / switch / firewall / server / client) and a `segment` (DMZ / LAN / WAN), and links can declare the protocol used.

## When to use

`network` works for IT infrastructure / SRE network diagrams.

- Office NW (Firewall → Switch → Server) visualisation
- Indicating DMZ / LAN segments via eyebrow
- Showing protocols like TCP 22 / TCP 5432 / VLAN 10

If you need cloud architecture (AWS / GCP), [infrastructure preset](/docs/en/cdl/presets/infrastructure) has richer NodeKind support.

## device kind → NodeKind

| device kind | NodeKind | visual |
|---|---|---|
| `router` | service | blue, routing |
| `switch` | service | blue, switching |
| `firewall` | service | red, security |
| `server` | backend | grey, server |
| `client` | actor | green, client |

## Signature

```ts
network({ id: string, topic: string, laneWidth?: number, defaultTone?: Tone })
  .device({ id, title, kind: "router" | "switch" | "firewall" | "server" | "client",
            col: number, row: number, segment? })
  .link({ from, to, protocol?, tone? })
  .build()
```

[preview:presets/network-demo]

## Complete example

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

## See also

- [infrastructure preset](/docs/en/cdl/presets/infrastructure) — cloud architecture (AWS / GCP / Azure)
- [topology preset](/docs/en/cdl/presets/topology) — when group + container nesting is needed
