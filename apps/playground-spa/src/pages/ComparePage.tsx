import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router";
import { CdlDiagramView } from "@cardenelabs/cdl";
import * as Select from "@radix-ui/react-select";
import { Check, ChevronDown, ChevronLeft, Rocket } from "lucide-react";
import { PRESETS } from "@/lib/presets";
import { THEMES, THEME_CONFIGS } from "@/lib/theme";
import { InViewMount } from "@/components/InViewMount";

export function ComparePage(): React.ReactElement {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialId = searchParams.get("preset") ?? "swimlane";
  const [presetId, setPresetId] = useState<string>(initialId);

  const preset = useMemo(
    () => PRESETS.find((p) => p.id === presetId) ?? PRESETS[0]!,
    [presetId],
  );

  useEffect(() => {
    setSearchParams(
      (params) => {
        params.set("preset", presetId);
        return params;
      },
      { replace: true },
    );
  }, [presetId, setSearchParams]);

  return (
    <div className="min-h-dvh">
      <header className="sticky top-0 z-40 border-b border-[var(--v4-line,#e2e8f0)] bg-white/85 backdrop-blur-xl">
        <div className="mx-auto flex max-w-[1400px] flex-wrap items-center gap-3 px-4 py-3 sm:gap-6 sm:px-8 sm:py-4">
          <Link to="/" className="flex items-center gap-3 font-bold text-[var(--v4-ink,#1a1f2a)]">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--v4-brand,#2d6a8f)] text-white">
              <Rocket size={17} />
            </div>
            <span className="text-[15px]">dragon</span>
          </Link>
          <Link
            to="/"
            className="flex items-center gap-1 text-[13px] font-medium text-[var(--v4-ink-dim,#5a6270)] hover:text-[var(--v4-ink,#1a1f2a)]"
          >
            <ChevronLeft size={14} /> Back
          </Link>
          <div className="flex-1" />
          <Select.Root value={presetId} onValueChange={setPresetId}>
            <Select.Trigger className="inline-flex items-center gap-2 rounded-xl bg-white px-3 py-2 text-sm font-medium text-[var(--v4-ink,#1a1f2a)] shadow-sm min-w-[200px] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--v4-brand,#2d6a8f)]">
              <Select.Value>{preset.title}</Select.Value>
              <Select.Icon>
                <ChevronDown size={14} className="text-[var(--v4-ink-dim,#5a6270)]" />
              </Select.Icon>
            </Select.Trigger>
            <Select.Portal>
              <Select.Content
                position="popper"
                sideOffset={6}
                className="z-50 min-w-[240px] overflow-hidden rounded-xl bg-white p-1.5 shadow-2xl"
              >
                <Select.Viewport>
                  {PRESETS.map((p) => (
                    <Select.Item
                      key={p.id}
                      value={p.id}
                      className="relative flex cursor-pointer items-start rounded-lg px-3 py-2 pr-9 text-sm outline-none data-[highlighted]:bg-[var(--v4-canvas,#f8fafc)]"
                    >
                      <div className="flex-1">
                        <div className="font-medium">{p.title}</div>
                        <div className="text-[11.5px] text-[var(--v4-ink-dim,#5a6270)]">
                          {p.eyebrow}
                        </div>
                      </div>
                      <Select.ItemIndicator className="absolute right-2 top-2.5">
                        <Check size={14} className="text-[var(--v4-brand,#2d6a8f)]" />
                      </Select.ItemIndicator>
                    </Select.Item>
                  ))}
                </Select.Viewport>
              </Select.Content>
            </Select.Portal>
          </Select.Root>
        </div>
      </header>

      <main className="mx-auto max-w-[1400px] px-4 py-8 sm:px-8 sm:py-12">
        <div className="mb-6">
          <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--v4-brand,#2d6a8f)] font-mono">
            Theme comparison
          </div>
          <h1 className="mt-2 text-3xl sm:text-4xl font-bold tracking-tight text-[var(--v4-ink,#1a1f2a)]">
            {preset.title} across 6 themes
          </h1>
          <p className="mt-3 max-w-2xl text-[14px] leading-relaxed text-[var(--v4-ink-dim,#5a6270)]">
            {preset.subtitle}
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {THEMES.map((t) => (
            <div
              key={t}
              data-cdl-theme={t}
              className="rounded-2xl bg-white p-4 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md"
            >
              <div className="mb-3 flex items-center justify-between">
                <div>
                  <div className="text-[10px] font-mono font-semibold uppercase tracking-[0.14em] text-[var(--v4-brand,#2d6a8f)]">
                    {THEME_CONFIGS[t].label}
                  </div>
                  <div className="text-[11.5px] text-[var(--v4-ink-dim,#5a6270)] mt-0.5">
                    {THEME_CONFIGS[t].description}
                  </div>
                </div>
              </div>
              <div
                className="rounded-xl bg-[var(--v4-canvas,#f8fafc)] p-3"
                style={{ aspectRatio: "16 / 10" }}
              >
                <InViewMount
                  className="w-full h-full"
                  placeholder={
                    <div className="w-full h-full flex items-center justify-center text-[11px] text-[var(--v4-ink-mute,#8a8678)] font-mono">
                      loading…
                    </div>
                  }
                >
                  <CdlDiagramView diagram={preset.diagram as never} hideHeader />
                </InViewMount>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
