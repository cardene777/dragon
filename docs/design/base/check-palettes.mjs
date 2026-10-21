// palettes.json の 4 案それぞれの 6 色を、明暗の地の色に対して検査にかける。
// 隣り合う組と全ての組の両方を見る (図では離れた区画の色も並んで見えるため)
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
const DIR = dirname(fileURLToPath(import.meta.url));
import { VALIDATOR } from "./validator.mjs";
const P = JSON.parse(readFileSync(join(DIR, "palettes.json"), "utf8"));
// 灰 (slate) は分類の色ではなく中立の色として使うので外す
const SLOTS = ["blue", "amber", "green", "violet", "rose"];
const only = process.argv[2];
for (const [id, p] of Object.entries(P)) {
  if (only && id !== only) continue;
  for (const mode of ["light", "dark"]) {
    const m = p[mode], hex = SLOTS.map((s) => m[`c-${s}`]).join(",");
    for (const pairs of ["all"]) {
      const args = [VALIDATOR, hex, "--mode", mode, "--surface", m.surf];
      if (pairs === "all") args.push("--pairs", "all");
      let out;
      try { out = execFileSync("node", args, { encoding: "utf8" }); } catch (e) { out = (e.stdout ?? "") + (e.stderr ?? ""); }
      const lines = out.split("\n").filter((l) => /PASS|WARN|FAIL|worst|Worst/.test(l));
      console.log(`\n== ${id} ${mode} ${pairs}`);
      console.log(lines.join("\n"));
    }
  }
}
