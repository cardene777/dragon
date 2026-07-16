/**
 * SVG defs SSOT (旧 dragon apps/playground の CdlFilterDefs.astro を React 化)。
 * cdl の CdlDiagramThumbnail が theme 別 filter / pattern / gradient / marker を参照する。
 *
 * 6 theme × 各 filter:
 *   - Neumorphism : dragon-nm-raised / -sm / -dark / -soft / inset-soft (+ dark)
 *   - Isometric   : dragon-iso-top-gradient (+ dark) / dragon-iso-cast-shadow (+ dark)
 *   - Circuit     : dragon-cir-board-pattern / dragon-cir-trace-glow
 *   - Pinboard    : dragon-pin-board-pattern / dragon-pin-sticky-shadow
 *   - Blueprint   : dragon-bp-graticule (+ dark) / dragon-bp-arrow-ortho marker
 *   - Handdrawn   : dragon-hd-wobble (turbulence displacement)
 *
 * SVG は position:absolute + width/height 0 + aria-hidden で完全に不可視、
 * pointer-events none で下位要素の click を吸わない。
 */
export function SvgDefs(): React.ReactElement {
  return (
    <svg
      width="0"
      height="0"
      style={{ position: "absolute", pointerEvents: "none" }}
      aria-hidden="true"
    >
      <defs>
        {/* ═════════════════ Neumorphism ═════════════════ */}
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

        <filter id="dragon-nm-raised-sm" x="-40%" y="-40%" width="180%" height="180%">
          <feGaussianBlur stdDeviation="1.5" result="blur" />
          <feOffset in="blur" dx="2" dy="2" result="darkShadow" />
          <feFlood floodColor="rgba(163, 177, 198, 0.55)" result="darkColor" />
          <feComposite in="darkColor" in2="darkShadow" operator="in" result="darkShadowColored" />
          <feOffset in="blur" dx="-2" dy="-2" result="lightShadow" />
          <feFlood floodColor="rgba(255, 255, 255, 0.95)" result="lightColor" />
          <feComposite in="lightColor" in2="lightShadow" operator="in" result="lightShadowColored" />
          <feMerge>
            <feMergeNode in="darkShadowColored" />
            <feMergeNode in="lightShadowColored" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>

        <filter id="dragon-nm-raised-dark" x="-40%" y="-40%" width="180%" height="180%">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feOffset in="blur" dx="4" dy="4" result="darkShadow" />
          <feFlood floodColor="rgba(0, 0, 0, 0.9)" result="darkColor" />
          <feComposite in="darkColor" in2="darkShadow" operator="in" result="darkShadowColored" />
          <feOffset in="blur" dx="-4" dy="-4" result="lightShadow" />
          <feFlood floodColor="rgba(255, 255, 255, 0.18)" result="lightColor" />
          <feComposite in="lightColor" in2="lightShadow" operator="in" result="lightShadowColored" />
          <feMerge>
            <feMergeNode in="darkShadowColored" />
            <feMergeNode in="lightShadowColored" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>

        <filter id="dragon-nm-raised-sm-dark" x="-40%" y="-40%" width="180%" height="180%">
          <feGaussianBlur stdDeviation="1.5" result="blur" />
          <feOffset in="blur" dx="2" dy="2" result="darkShadow" />
          <feFlood floodColor="rgba(0, 0, 0, 0.9)" result="darkColor" />
          <feComposite in="darkColor" in2="darkShadow" operator="in" result="darkShadowColored" />
          <feOffset in="blur" dx="-2" dy="-2" result="lightShadow" />
          <feFlood floodColor="rgba(255, 255, 255, 0.18)" result="lightColor" />
          <feComposite in="lightColor" in2="lightShadow" operator="in" result="lightShadowColored" />
          <feMerge>
            <feMergeNode in="darkShadowColored" />
            <feMergeNode in="lightShadowColored" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>

        <filter id="dragon-nm-raised-soft" x="-40%" y="-40%" width="180%" height="180%">
          <feGaussianBlur stdDeviation="5" result="blur" />
          <feOffset in="blur" dx="6" dy="6" result="darkShadow" />
          <feFlood floodColor="rgba(163, 177, 198, 0.75)" result="darkColor" />
          <feComposite in="darkColor" in2="darkShadow" operator="in" result="darkShadowColored" />
          <feOffset in="blur" dx="-6" dy="-6" result="lightShadow" />
          <feFlood floodColor="rgba(255, 255, 255, 1.0)" result="lightColor" />
          <feComposite in="lightColor" in2="lightShadow" operator="in" result="lightShadowColored" />
          <feMerge>
            <feMergeNode in="darkShadowColored" />
            <feMergeNode in="lightShadowColored" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>

        <filter id="dragon-nm-inset-soft" x="-15%" y="-15%" width="130%" height="130%">
          <feGaussianBlur stdDeviation="1.2" />
          <feOffset dx="3" dy="3" result="offset-dark" />
          <feComposite in="SourceAlpha" in2="offset-dark" operator="out" result="composite-dark" />
          <feFlood floodColor="rgba(163, 177, 198, 0.5)" />
          <feComposite in2="composite-dark" operator="in" />
          <feComposite in="SourceGraphic" />
        </filter>

        <filter id="dragon-nm-raised-soft-dark" x="-40%" y="-40%" width="180%" height="180%">
          <feGaussianBlur stdDeviation="5" result="blur" />
          <feOffset in="blur" dx="6" dy="6" result="darkShadow" />
          <feFlood floodColor="rgba(0, 0, 0, 0.9)" result="darkColor" />
          <feComposite in="darkColor" in2="darkShadow" operator="in" result="darkShadowColored" />
          <feOffset in="blur" dx="-6" dy="-6" result="lightShadow" />
          <feFlood floodColor="rgba(255, 255, 255, 0.18)" result="lightColor" />
          <feComposite in="lightColor" in2="lightShadow" operator="in" result="lightShadowColored" />
          <feMerge>
            <feMergeNode in="darkShadowColored" />
            <feMergeNode in="lightShadowColored" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>

        <filter id="dragon-nm-inset-soft-dark" x="-15%" y="-15%" width="130%" height="130%">
          <feGaussianBlur stdDeviation="1.2" />
          <feOffset dx="3" dy="3" result="offset-dark" />
          <feComposite in="SourceAlpha" in2="offset-dark" operator="out" result="composite-dark" />
          <feFlood floodColor="rgba(0, 0, 0, 0.7)" />
          <feComposite in2="composite-dark" operator="in" />
          <feComposite in="SourceGraphic" />
        </filter>

        {/* ═════════════════ Isometric ═════════════════ */}
        <linearGradient id="dragon-iso-top-gradient" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset="0.35" stopColor="#f5e8c8" />
          <stop offset="1" stopColor="#b89c68" />
        </linearGradient>

        <linearGradient id="dragon-iso-top-gradient-dark" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#5a4830" />
          <stop offset="0.35" stopColor="#3d2f1c" />
          <stop offset="1" stopColor="#1a1408" />
        </linearGradient>

        <filter id="dragon-iso-cast-shadow" x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="8" />
          <feOffset dx="10" dy="14" result="offset" />
          <feFlood floodColor="rgba(74, 56, 32, 0.55)" />
          <feComposite in2="offset" operator="in" />
          <feComposite in="SourceGraphic" />
        </filter>

        <filter id="dragon-iso-cast-shadow-dark" x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="8" />
          <feOffset dx="10" dy="14" result="offset" />
          <feFlood floodColor="rgba(0, 0, 0, 0.75)" />
          <feComposite in2="offset" operator="in" />
          <feComposite in="SourceGraphic" />
        </filter>

        {/* ═════════════════ Circuit ═════════════════ */}
        <pattern
          id="dragon-cir-board-pattern"
          x="0"
          y="0"
          width="24"
          height="24"
          patternUnits="userSpaceOnUse"
        >
          <rect x="0" y="0" width="24" height="24" fill="#0a1a12" />
          <circle cx="4" cy="4" r="0.6" fill="#1a2f22" />
          <circle cx="20" cy="20" r="0.6" fill="#1a2f22" />
        </pattern>

        <filter id="dragon-cir-trace-glow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="2" result="glow" />
          <feFlood floodColor="rgba(72, 224, 176, 0.55)" />
          <feComposite in2="glow" operator="in" result="glowColored" />
          <feMerge>
            <feMergeNode in="glowColored" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>

        {/* ═════════════════ Pinboard ═════════════════ */}
        <pattern
          id="dragon-pin-board-pattern"
          x="0"
          y="0"
          width="36"
          height="36"
          patternUnits="userSpaceOnUse"
        >
          <rect x="0" y="0" width="36" height="36" fill="#c8a475" />
          <circle cx="12" cy="12" r="0.5" fill="rgba(90, 60, 30, 0.35)" />
          <circle cx="28" cy="24" r="0.5" fill="rgba(90, 60, 30, 0.35)" />
          <circle cx="20" cy="30" r="0.4" fill="rgba(90, 60, 30, 0.28)" />
        </pattern>

        <filter id="dragon-pin-sticky-shadow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="2.5" />
          <feOffset dx="3" dy="5" result="offset" />
          <feFlood floodColor="rgba(60, 40, 20, 0.4)" />
          <feComposite in2="offset" operator="in" />
          <feComposite in="SourceGraphic" />
        </filter>

        {/* ═════════════════ Blueprint ═════════════════ */}
        <pattern
          id="dragon-bp-graticule"
          x="0"
          y="0"
          width="24"
          height="24"
          patternUnits="userSpaceOnUse"
        >
          <path
            d="M 24 0 L 0 0 0 24"
            fill="none"
            stroke="rgba(109, 63, 24, 0.18)"
            strokeWidth="1.5"
          />
        </pattern>

        <pattern
          id="dragon-bp-graticule-dark"
          x="0"
          y="0"
          width="24"
          height="24"
          patternUnits="userSpaceOnUse"
        >
          <path
            d="M 24 0 L 0 0 0 24"
            fill="none"
            stroke="rgba(240, 184, 64, 0.22)"
            strokeWidth="1.5"
          />
        </pattern>

        <marker
          id="dragon-bp-arrow-ortho"
          viewBox="0 0 10 10"
          refX="9"
          refY="5"
          markerWidth="12"
          markerHeight="12"
          markerUnits="userSpaceOnUse"
          orient="auto-start-reverse"
        >
          <path
            d="M 0 0 L 10 5 L 0 10 M 0 5 L 8 5"
            fill="none"
            stroke="#6d3f18"
            strokeWidth="2.5"
          />
        </marker>

        {/* ═════════════════ Handdrawn ═════════════════ */}
        <filter id="dragon-hd-wobble" x="-15%" y="-15%" width="130%" height="130%">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.025"
            numOctaves={2}
            seed={7}
            result="noise"
          />
          <feDisplacementMap
            in="SourceGraphic"
            in2="noise"
            scale="4.0"
            xChannelSelector="R"
            yChannelSelector="G"
          />
        </filter>
      </defs>
    </svg>
  );
}
