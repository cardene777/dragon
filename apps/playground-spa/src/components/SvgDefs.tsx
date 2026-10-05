/**
 * SVG defs SSOT (旧 dragon apps/playground の CdlFilterDefs.astro を React 化)。
 * cdl の CdlDiagramThumbnail が theme 別 filter / pattern / gradient / marker を参照する。
 *
 * theme ごとの filter / pattern:
 *   - Neumorphism : dragon-nm-raised / -sm / -dark / -soft / inset-soft (+ dark)
 *   - Isometric   : dragon-iso-top-gradient (+ dark) / dragon-iso-cast-shadow (+ dark)
 *   - Circuit     : dragon-cir-board-pattern / dragon-cir-trace-glow
 *   - Pinboard    : dragon-pin-board-pattern / dragon-pin-sticky-shadow
 *   - Blueprint   : dragon-bp-graticule (+ dark) / dragon-bp-arrow-ortho marker
 *   - Sketch      : dragon-sketch-wobble (turbulence displacement) / dragon-sketch-pen
 *   - Neon        : dragon-neon-tube (white core + colored glow)
 *   - Relief      : dragon-relief-raised / -dome / -well / -raised-sm (light and shadow)
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

        {/* ═════════════════ Sketch ═════════════════
            `[data-cdl-palette="sketch"]` の規則が揺れと斜線を参照する。
            模様の色は意匠帳の淡と同じで、sketch-theme.spec.ts が突き合わせる (#2794)。 */}
        <filter
          id="dragon-sketch-wobble"
          filterUnits="userSpaceOnUse"
          x="-10%"
          y="-10%"
          width="120%"
          height="120%"
        >
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.03"
            numOctaves={2}
            seed={7}
            result="noise"
          />
          <feDisplacementMap
            in="SourceGraphic"
            in2="noise"
            scale="3"
            xChannelSelector="R"
            yChannelSelector="G"
          />
        </filter>
        <pattern
          id="dragon-sketch-pen"
          width="10"
          height="10"
          patternUnits="userSpaceOnUse"
          patternTransform="rotate(32)"
        >
          <rect width="3" height="10" fill="#9a9080" />
        </pattern>

        {/* ═════════════════ Neon ═════════════════
            `[data-cdl-palette="neon"]` の規則が枠と線の管を参照する。
            芯の 35% と 65% は見本の `color-mix(in srgb, 管の色 35%, white)` と同じ混ぜ方で、
            neon-theme.spec.ts が意匠帳の「管」 と突き合わせる (#2795)。 */}
        <filter
          id="dragon-neon-tube"
          filterUnits="userSpaceOnUse"
          x="-10%"
          y="-10%"
          width="120%"
          height="120%"
          colorInterpolationFilters="sRGB"
        >
          {/* 明るい画素だけを残す。 面と台 (明るさ 0.1 未満) は落ち、管だけが残る */}
          <feColorMatrix
            in="SourceGraphic"
            type="matrix"
            values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0.6 0.6 0.6 0 -0.2"
            result="tube"
          />
          <feGaussianBlur in="tube" stdDeviation="5" result="haze" />
          <feGaussianBlur in="tube" stdDeviation="1.5" result="halo" />
          <feMorphology in="tube" operator="erode" radius="0.5" result="thin" />
          <feColorMatrix
            in="thin"
            type="matrix"
            values="0.35 0 0 0 0.65  0 0.35 0 0 0.65  0 0 0.35 0 0.65  0 0 0 1 0"
            result="core"
          />
          <feMerge>
            <feMergeNode in="haze" />
            <feMergeNode in="halo" />
            <feMergeNode in="SourceGraphic" />
            <feMergeNode in="core" />
          </feMerge>
        </filter>

        {/* ═════════════════ Relief ═════════════════
            全 filter を userSpaceOnUse にして、小さい箱で影を切らず、幅 0 の図形でも領域を残す。
            外の影は CSS box-shadow のぼかし値の半分を標準偏差にし、意匠帳と
            relief-theme.spec.ts が各 offset / blur / flood を突き合わせる (#2796)。
            raised は ±7 / 7.5 / 暗 .5・白 1、dome は ±12 / 12 / 暗 .55・白 .95、
            well は raised の外影と 14 内側の ±5 / 5.5 / 暗 .42・白 .88、
            raised-sm は ±4 / 4.5 / 暗 .45・白 .9 とする。 */}
        <filter
          id="dragon-relief-raised"
          filterUnits="userSpaceOnUse"
          x="-10%"
          y="-10%"
          width="120%"
          height="120%"
          colorInterpolationFilters="sRGB"
        >
          <feGaussianBlur in="SourceAlpha" stdDeviation="7.5" result="raised-dark-blur" />
          <feOffset in="raised-dark-blur" dx="7" dy="7" result="raised-dark-offset" />
          <feFlood floodColor="rgb(160,144,120)" floodOpacity=".5" result="raised-dark-color" />
          <feComposite in="raised-dark-color" in2="raised-dark-offset" operator="in" result="raised-dark" />
          <feGaussianBlur in="SourceAlpha" stdDeviation="7.5" result="raised-light-blur" />
          <feOffset in="raised-light-blur" dx="-7" dy="-7" result="raised-light-offset" />
          <feFlood floodColor="#ffffff" floodOpacity="1" result="raised-light-color" />
          <feComposite in="raised-light-color" in2="raised-light-offset" operator="in" result="raised-light" />
          <feMerge>
            <feMergeNode in="raised-dark" />
            <feMergeNode in="raised-light" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>

        <filter
          id="dragon-relief-dome"
          filterUnits="userSpaceOnUse"
          x="-10%"
          y="-10%"
          width="120%"
          height="120%"
          colorInterpolationFilters="sRGB"
        >
          <feGaussianBlur in="SourceAlpha" stdDeviation="12" result="dome-dark-blur" />
          <feOffset in="dome-dark-blur" dx="12" dy="12" result="dome-dark-offset" />
          <feFlood floodColor="rgb(160,144,120)" floodOpacity=".55" result="dome-dark-color" />
          <feComposite in="dome-dark-color" in2="dome-dark-offset" operator="in" result="dome-dark" />
          <feGaussianBlur in="SourceAlpha" stdDeviation="12" result="dome-light-blur" />
          <feOffset in="dome-light-blur" dx="-12" dy="-12" result="dome-light-offset" />
          <feFlood floodColor="#ffffff" floodOpacity=".95" result="dome-light-color" />
          <feComposite in="dome-light-color" in2="dome-light-offset" operator="in" result="dome-light" />
          {/* 3px / 4 は小さい主役でも題を覆わず、面の塗りを替えずに丸みを出す幅。 */}
          <feComponentTransfer in="SourceAlpha" result="dome-inverse">
            <feFuncA type="table" tableValues="1 0" />
          </feComponentTransfer>
          <feGaussianBlur in="dome-inverse" stdDeviation="4" result="dome-inner-blur" />
          <feOffset in="dome-inner-blur" dx="3" dy="3" result="dome-inner-light-offset" />
          <feComposite in="dome-inner-light-offset" in2="SourceAlpha" operator="in" result="dome-inner-light-mask" />
          <feFlood floodColor="#ffffff" floodOpacity=".75" result="dome-inner-light-color" />
          <feComposite in="dome-inner-light-color" in2="dome-inner-light-mask" operator="in" result="dome-inner-light" />
          <feOffset in="dome-inner-blur" dx="-3" dy="-3" result="dome-inner-dark-offset" />
          <feComposite in="dome-inner-dark-offset" in2="SourceAlpha" operator="in" result="dome-inner-dark-mask" />
          <feFlood floodColor="rgb(160,144,120)" floodOpacity=".32" result="dome-inner-dark-color" />
          <feComposite in="dome-inner-dark-color" in2="dome-inner-dark-mask" operator="in" result="dome-inner-dark" />
          <feMerge>
            <feMergeNode in="dome-dark" />
            <feMergeNode in="dome-light" />
            <feMergeNode in="SourceGraphic" />
            <feMergeNode in="dome-inner-light" />
            <feMergeNode in="dome-inner-dark" />
          </feMerge>
        </filter>

        <filter
          id="dragon-relief-well"
          filterUnits="userSpaceOnUse"
          x="-10%"
          y="-10%"
          width="120%"
          height="120%"
          colorInterpolationFilters="sRGB"
        >
          <feGaussianBlur in="SourceAlpha" stdDeviation="7.5" result="well-dark-blur" />
          <feOffset in="well-dark-blur" dx="7" dy="7" result="well-dark-offset" />
          <feFlood floodColor="rgb(160,144,120)" floodOpacity=".5" result="well-dark-color" />
          <feComposite in="well-dark-color" in2="well-dark-offset" operator="in" result="well-dark" />
          <feGaussianBlur in="SourceAlpha" stdDeviation="7.5" result="well-light-blur" />
          <feOffset in="well-light-blur" dx="-7" dy="-7" result="well-light-offset" />
          <feFlood floodColor="#ffffff" floodOpacity="1" result="well-light-color" />
          <feComposite in="well-light-color" in2="well-light-offset" operator="in" result="well-light" />
          {/* 14px は目盛りと棒へ窪みの縁を重ねず、内側を一段沈める余白。 */}
          <feMorphology in="SourceAlpha" operator="erode" radius="14" result="well-inner" />
          <feComponentTransfer in="well-inner" result="well-inner-inverse">
            <feFuncA type="table" tableValues="1 0" />
          </feComponentTransfer>
          <feGaussianBlur in="well-inner-inverse" stdDeviation="5.5" result="well-inner-blur" />
          <feOffset in="well-inner-blur" dx="5" dy="5" result="well-inner-dark-offset" />
          <feComposite in="well-inner-dark-offset" in2="well-inner" operator="in" result="well-inner-dark-mask" />
          <feFlood floodColor="rgb(160,144,120)" floodOpacity=".42" result="well-inner-dark-color" />
          <feComposite in="well-inner-dark-color" in2="well-inner-dark-mask" operator="in" result="well-inner-dark" />
          <feOffset in="well-inner-blur" dx="-5" dy="-5" result="well-inner-light-offset" />
          <feComposite in="well-inner-light-offset" in2="well-inner" operator="in" result="well-inner-light-mask" />
          <feFlood floodColor="#ffffff" floodOpacity=".88" result="well-inner-light-color" />
          <feComposite in="well-inner-light-color" in2="well-inner-light-mask" operator="in" result="well-inner-light" />
          <feMerge>
            <feMergeNode in="well-dark" />
            <feMergeNode in="well-light" />
            <feMergeNode in="SourceGraphic" />
            <feMergeNode in="well-inner-dark" />
            <feMergeNode in="well-inner-light" />
          </feMerge>
        </filter>

        <filter
          id="dragon-relief-raised-sm"
          filterUnits="userSpaceOnUse"
          x="-10%"
          y="-10%"
          width="120%"
          height="120%"
          colorInterpolationFilters="sRGB"
        >
          <feGaussianBlur in="SourceAlpha" stdDeviation="4.5" result="raised-sm-dark-blur" />
          <feOffset in="raised-sm-dark-blur" dx="4" dy="4" result="raised-sm-dark-offset" />
          <feFlood floodColor="rgb(160,144,120)" floodOpacity=".45" result="raised-sm-dark-color" />
          <feComposite in="raised-sm-dark-color" in2="raised-sm-dark-offset" operator="in" result="raised-sm-dark" />
          <feGaussianBlur in="SourceAlpha" stdDeviation="4.5" result="raised-sm-light-blur" />
          <feOffset in="raised-sm-light-blur" dx="-4" dy="-4" result="raised-sm-light-offset" />
          <feFlood floodColor="#ffffff" floodOpacity=".9" result="raised-sm-light-color" />
          <feComposite in="raised-sm-light-color" in2="raised-sm-light-offset" operator="in" result="raised-sm-light" />
          <feMerge>
            <feMergeNode in="raised-sm-dark" />
            <feMergeNode in="raised-sm-light" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
    </svg>
  );
}
