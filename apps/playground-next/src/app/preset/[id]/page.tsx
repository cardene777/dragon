import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PRESET_METAS as PRESETS } from "@/lib/preset-meta";
import { PresetDetailClient } from "./client";

export async function generateStaticParams(): Promise<{ id: string }[]> {
  return PRESETS.map((p) => ({ id: p.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const preset = PRESETS.find((p) => p.slug === id);
  if (!preset) return { title: "Not found" };
  return {
    title: preset.title,
    description: `${preset.subtitle} — ${preset.tags.join(" / ")}`,
    openGraph: {
      title: `${preset.title} | dragon`,
      description: preset.subtitle,
      type: "website",
    },
  };
}

export default async function PresetPage({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<React.ReactElement> {
  const { id } = await params;
  const meta = PRESETS.find((p) => p.slug === id);
  if (!meta) notFound();

  return <PresetDetailClient slug={id} />;
}
