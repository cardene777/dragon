export function prep(svg) {
  const aspectRatioCount = [...svg.matchAll(/\spreserveAspectRatio=/gu)].length;
  if (aspectRatioCount !== 1) {
    throw new Error(`SVG の preserveAspectRatio 属性は 1 個必要です (実際は ${aspectRatioCount} 個)`);
  }

  return svg.replace(/\swidth="[\d.]+"/, "").replace(/\sheight="[\d.]+"/, "");
}
