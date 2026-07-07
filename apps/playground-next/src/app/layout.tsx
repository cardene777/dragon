import type { Metadata } from "next";
import "./globals.css";
import "@/themes/cdl-theme.css";
import { SvgDefs } from "@/components/SvgDefs";
import { AnimatedEdgeStyle } from "@/components/AnimatedEdge";
import { ToastProvider } from "@/components/Toast";

export const metadata: Metadata = {
  metadataBase: new URL("https://dragon-playground.vercel.app"),
  title: {
    default: "dragon — animated diagram DSL",
    template: "%s | dragon",
  },
  description:
    "dragon は Text DSL から animated SVG diagram を生成する OSS。 6 theme × 10 preset × Excalidraw 風の手描き感 / PCB 基板 / 立体感 Neumorphism を live 切替できる。 mermaid.live 相当の interactive playground。",
  applicationName: "dragon",
  keywords: [
    "diagram",
    "SVG",
    "text DSL",
    "mermaid alternative",
    "excalidraw",
    "playground",
    "rough.js",
    "TypeScript",
    "React",
    "Next.js",
    "OSS",
  ],
  authors: [{ name: "cardenelabs", url: "https://github.com/cardene777" }],
  creator: "cardenelabs",
  publisher: "cardenelabs",
  category: "developer tools",
  openGraph: {
    type: "website",
    locale: "ja_JP",
    url: "https://dragon-playground.vercel.app",
    siteName: "dragon",
    title: "dragon — animated diagram DSL",
    description:
      "Text DSL から animated SVG diagram を生成する OSS。 6 theme × 10 preset × Excalidraw 風 hand-drawn / PCB / Neumorphism 立体感を live 切替。",
    images: [
      {
        url: "/og/default.svg",
        width: 1200,
        height: 630,
        alt: "dragon — animated diagram DSL",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "dragon — animated diagram DSL",
    description:
      "Text DSL から animated SVG diagram を生成する OSS。 6 theme × 10 preset × live 切替。",
    images: ["/og/default.svg"],
    creator: "@cardene777",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  alternates: {
    canonical: "https://dragon-playground.vercel.app",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}): React.ReactElement {
  return (
    <html lang="ja" data-theme="neumorphism">
      <body>
        <SvgDefs />
        <AnimatedEdgeStyle />
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}
