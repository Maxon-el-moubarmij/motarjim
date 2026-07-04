export interface SpacingValues {
  top?: number;
  right?: number;
  bottom?: number;
  left?: number;
}

export function parsePx(value: string | undefined): number | undefined {
  if (!value) return undefined;
  const t = value.trim();
  const px = t.match(/^(-?\d+(?:\.\d+)?)px$/);
  if (px) return parseFloat(px[1]);
  const num = t.match(/^(-?\d+(?:\.\d+)?)$/);
  if (num) return parseFloat(num[1]);
  const rem = t.match(/^(-?\d+(?:\.\d+)?)rem$/);
  if (rem) return parseFloat(rem[1]) * 16;
  return undefined;
}

export function parseBoxShorthand(value: string | undefined): SpacingValues | undefined {
  if (!value) return undefined;
  const parts = value.split(/\s+/).map(s => parsePx(s)).filter((p): p is number => p !== undefined);
  if (parts.length === 0) return undefined;

  const p = (i: number) => parts[i];
  switch (parts.length) {
    case 1: return { top: p(0), right: p(0), bottom: p(0), left: p(0) };
    case 2: return { top: p(0), right: p(1), bottom: p(0), left: p(1) };
    case 3: return { top: p(0), right: p(1), bottom: p(2), left: p(1) };
    case 4: return { top: p(0), right: p(1), bottom: p(2), left: p(3) };
    default: return undefined;
  }
}

export function parseGap(value: string | undefined): number | undefined {
  return parsePx(value);
}
