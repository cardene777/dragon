function 丸める(value) {
  return Math.round(value * 1000) / 1000;
}

function 行列をかける(point, matrix) {
  return {
    x: point.x * matrix.a + point.y * matrix.c + matrix.e,
    y: point.x * matrix.b + point.y * matrix.d + matrix.f,
  };
}

function viewBoxから印の枠へ(point, marker) {
  const unit = marker.markerUnits === "strokeWidth" ? marker.strokeWidth : 1;
  const width = marker.markerWidth * unit;
  const height = marker.markerHeight * unit;
  const view = marker.viewBox;
  const preserve = marker.preserveAspectRatio.trim().split(/\s+/).filter(Boolean);
  const align = preserve.find((part) => part === "none" || /^x(?:Min|Mid|Max)Y(?:Min|Mid|Max)$/.test(part)) ?? "xMidYMid";

  if (align === "none") {
    return {
      x: ((point.x - view.x) / view.width) * width,
      y: ((point.y - view.y) / view.height) * height,
    };
  }

  const scaleX = width / view.width;
  const scaleY = height / view.height;
  const scale = preserve.includes("slice") ? Math.max(scaleX, scaleY) : Math.min(scaleX, scaleY);
  const spareX = width - view.width * scale;
  const spareY = height - view.height * scale;
  const offsetX = align.startsWith("xMid") ? spareX / 2 : align.startsWith("xMax") ? spareX : 0;
  const offsetY = align.includes("YMid") ? spareY / 2 : align.includes("YMax") ? spareY : 0;
  return {
    x: (point.x - view.x) * scale + offsetX,
    y: (point.y - view.y) * scale + offsetY,
  };
}

function 印の角度(marker) {
  if (marker.orient === "angle") return marker.angle;
  return marker.tangentAngle + (marker.orient === "auto-start-reverse" && marker.position === "start" ? 180 : 0);
}

function 線端の外向き(marker) {
  const radians =
    ((marker.tangentAngle + (marker.position === "start" ? 180 : 0)) * Math.PI) / 180;
  const x = Math.cos(radians);
  const y = Math.sin(radians);
  return {
    x: x * marker.matrix.a + y * marker.matrix.c,
    y: x * marker.matrix.b + y * marker.matrix.d,
  };
}

export function 印の最遠点(marker) {
  const endpoint = 行列をかける(marker.endpoint, marker.matrix);
  if (marker.points.length === 0 || marker.viewBox.width <= 0 || marker.viewBox.height <= 0) {
    return { x: 丸める(endpoint.x), y: 丸める(endpoint.y) };
  }

  const reference = viewBoxから印の枠へ({ x: marker.refX, y: marker.refY }, marker);
  const radians = (印の角度(marker) * Math.PI) / 180;
  const cosine = Math.cos(radians);
  const sine = Math.sin(radians);
  const outward = 線端の外向き(marker);
  let farthest = endpoint;
  let farthestProjection = 0;

  for (const point of marker.points) {
    const placed = viewBoxから印の枠へ(point, marker);
    const x = placed.x - reference.x;
    const y = placed.y - reference.y;
    const rootPoint = 行列をかける(
      {
        x: marker.endpoint.x + x * cosine - y * sine,
        y: marker.endpoint.y + x * sine + y * cosine,
      },
      marker.matrix,
    );
    const projection =
      (rootPoint.x - endpoint.x) * outward.x + (rootPoint.y - endpoint.y) * outward.y;
    if (projection > farthestProjection) {
      farthest = rootPoint;
      farthestProjection = projection;
    }
  }

  return { x: 丸める(farthest.x), y: 丸める(farthest.y) };
}
