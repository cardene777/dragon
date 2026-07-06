/**
 * dragon SVG defs SSOT (theme filter / pattern / gradient / marker)。
 *
 * DiagramView が inline defs として mount する。 Astro 版と違って
 * client-side hydrate 不要、 Next.js SSR で server-render される。
 *
 * theme filter 一覧:
 *   - dragon-nm-raised      ... Neumorphism dual shadow (soft raised bumps)
 *   - dragon-nm-raised-sm   ... small variant (icon badge 用)
 *   - dragon-cir-trace-glow ... Circuit mint trace glow
 *   - dragon-cir-board-pattern ... Circuit PCB dark green pattern
 *   - dragon-pin-sticky-shadow ... Pinboard sticky note shadow
 *   - dragon-iso-cast-shadow ... Isometric cast shadow
 *
 * 全 filter の region = x=-40% y=-40% w=180% h=180% で bbox 拡張、
 * thumbnail 縮小時も clip されない。
 */
export function SvgDefs(): React.ReactElement {
  return (
    <svg width="0" height="0" style={{ position: "absolute", pointerEvents: "none" }} aria-hidden="true">
      <defs>
        {/* Neumorphism dual shadow (raised bumps) */}
        <filter id="dragon-nm-raised" x="-40%" y="-40%" width="180%" height="180%">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feOffset in="blur" dx="4" dy="4" result="darkShadow" />
          <feFlood floodColor="rgba(163, 177, 198, 0.55)" result="darkColor" />
          <feComposite in="darkColor" in2="darkShadow" operator="in" result="darkShadowColored" />
          <feOffset in="blur" dx="-4" dy="-4" result="lightShadow" />
          <feFlood floodColor="rgba(255, 255, 255, 0.95)" result="lightColor" />
          <feComposite in="lightColor" in2="lightShadow" operator="in" result="lightShadowColored" />
          <feMerge>
            <feMergeNode in="darkShadowColored" />
            <feMergeNode in="lightShadowColored" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>

        {/* Neumorphism raised small (icon badge) */}
        <filter id="dragon-nm-raised-sm" x="-40%" y="-40%" width="180%" height="180%">
          <feGaussianBlur stdDeviation="1.5" result="blur" />
          <feOffset in="blur" dx="2" dy="2" result="darkShadow" />
          <feFlood floodColor="rgba(163, 177, 198, 0.5)" result="darkColor" />
          <feComposite in="darkColor" in2="darkShadow" operator="in" result="darkShadowColored" />
          <feOffset in="blur" dx="-2" dy="-2" result="lightShadow" />
          <feFlood floodColor="rgba(255, 255, 255, 0.9)" result="lightColor" />
          <feComposite in="lightColor" in2="lightShadow" operator="in" result="lightShadowColored" />
          <feMerge>
            <feMergeNode in="darkShadowColored" />
            <feMergeNode in="lightShadowColored" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>

        {/* Circuit trace glow (mint neon) */}
        <filter id="dragon-cir-trace-glow" x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="1.4" result="blur" />
          <feFlood floodColor="rgba(72, 224, 176, 0.6)" result="glowColor" />
          <feComposite in="glowColor" in2="blur" operator="in" result="glowColored" />
          <feMerge>
            <feMergeNode in="glowColored" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>

        {/* Pinboard sticky shadow (drop shadow slightly rotated) */}
        <filter id="dragon-pin-sticky-shadow" x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="4" result="blur" />
          <feOffset in="blur" dx="3" dy="6" result="shadow" />
          <feFlood floodColor="rgba(30, 20, 12, 0.35)" result="shadowColor" />
          <feComposite in="shadowColor" in2="shadow" operator="in" result="shadowColored" />
          <feMerge>
            <feMergeNode in="shadowColored" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>

        {/* Isometric cast shadow (bottom-right + subtle top-left highlight) */}
        <filter id="dragon-iso-cast-shadow" x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="5" result="blur" />
          <feOffset in="blur" dx="6" dy="8" result="shadow" />
          <feFlood floodColor="rgba(50, 40, 30, 0.35)" result="shadowColor" />
          <feComposite in="shadowColor" in2="shadow" operator="in" result="shadowColored" />
          <feMerge>
            <feMergeNode in="shadowColored" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>

        {/* Circuit PCB board pattern */}
        <pattern id="dragon-cir-board-pattern" width="40" height="40" patternUnits="userSpaceOnUse">
          <rect width="40" height="40" fill="#0a1a12" />
          <circle cx="20" cy="20" r="1.5" fill="rgba(200, 160, 56, 0.15)" />
        </pattern>
      </defs>
    </svg>
  );
}
