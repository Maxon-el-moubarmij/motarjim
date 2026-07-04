export interface BorderValues {
  width?: number;
  color?: string;
  style?: string;
  radius?: number;
  radiusTopLeft?: number;
  radiusTopRight?: number;
  radiusBottomLeft?: number;
  radiusBottomRight?: number;
}

export function parseBorderWidth(value: string | undefined): number | undefined {
  if (!value) return undefined;
  const t = value.trim();
  const px = t.match(/^(\d+(?:\.\d+)?)px$/);
  if (px) return parseFloat(px[1]);
  const num = t.match(/^(\d+(?:\.\d+)?)$/);
  if (num) return parseFloat(num[1]);
  return undefined;
}

export function parseBorderRadius(value: string | undefined): number | undefined {
  if (!value) return undefined;
  const t = value.trim();
  const px = t.match(/^(\d+(?:\.\d+)?)px$/);
  if (px) return parseFloat(px[1]);
  const percent = t.match(/^(\d+(?:\.\d+)?)%$/);
  if (percent) return undefined;
  const num = t.match(/^(\d+(?:\.\d+)?)$/);
  if (num) return parseFloat(num[1]);
  return undefined;
}

export function parseBorderRadiusShorthand(value: string | undefined): {
  topLeft?: number;
  topRight?: number;
  bottomRight?: number;
  bottomLeft?: number;
} | undefined {
  if (!value) return undefined;
  const t = value.trim();
  const parts = t.split(/\s+/).map(s => {
    const px = s.match(/^(\d+(?:\.\d+)?)px$/);
    return px ? parseFloat(px[1]) : (s.match(/^(\d+(?:\.\d+)?)$/) ? parseFloat(s) : undefined);
  }).filter((p): p is number => p !== undefined);

  if (parts.length === 0) return undefined;
  if (parts.length === 1) return { topLeft: parts[0], topRight: parts[0], bottomRight: parts[0], bottomLeft: parts[0] };
  if (parts.length === 2) return { topLeft: parts[0], topRight: parts[1], bottomRight: parts[0], bottomLeft: parts[1] };
  if (parts.length === 3) return { topLeft: parts[0], topRight: parts[1], bottomRight: parts[2], bottomLeft: parts[1] };
  return { topLeft: parts[0], topRight: parts[1], bottomRight: parts[2], bottomLeft: parts[3] };
}
