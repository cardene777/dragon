import type { Metadata } from "next";
import "./globals.css";
import { SvgDefs } from "@/components/SvgDefs";

export const metadata: Metadata = {
  title: "dragon — animated diagram DSL",
  description:
    "dragon は Text DSL から animated SVG diagram を生成する OSS。書いただけで動く図が手に入る。",
  applicationName: "dragon",
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
        {children}
      </body>
    </html>
  );
}
