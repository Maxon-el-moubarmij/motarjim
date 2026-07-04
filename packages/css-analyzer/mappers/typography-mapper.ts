export interface TypographyValues {
  fontFamily?: string;
  fontSize?: number;
  fontWeight?: number;
  fontStyle?: string;
  lineHeight?: number;
  textAlign?: string;
  textDecoration?: string;
  textTransform?: string;
  color?: string;
  letterSpacing?: number;
}

export function parseTypography(styles: Record<string, string | undefined>): TypographyValues {
  const r: TypographyValues = {};

  if (styles['font-family']) r.fontFamily = styles['font-family'];
  if (styles['font-size']) r.fontSize = parsePxOrRem(styles['font-size']);
  if (styles['font-weight']) r.fontWeight = parseFontWeight(styles['font-weight']);
  if (styles['font-style']) r.fontStyle = styles['font-style'];
  if (styles['line-height']) r.lineHeight = parseLineHeight(styles['line-height'], r.fontSize);
  if (styles['text-align']) r.textAlign = styles['text-align'];
  if (styles['text-decoration']) r.textDecoration = styles['text-decoration'];
  if (styles['text-transform']) r.textTransform = styles['text-transform'];
  if (styles['color']) r.color = styles['color'];
  if (styles['letter-spacing']) r.letterSpacing = parsePxOrRem(styles['letter-spacing']);

  return r;
}

export function parsePxOrRem(value: string | undefined): number | undefined {
  if (!value) return undefined;
  const t = value.trim();
  const px = t.match(/^(-?\d+(?:\.\d+)?)px$/);
  if (px) return parseFloat(px[1]);
  const rem = t.match(/^(-?\d+(?:\.\d+)?)rem$/);
  if (rem) return parseFloat(rem[1]) * 16;
  const num = t.match(/^(-?\d+(?:\.\d+)?)$/);
  if (num) return parseFloat(num[1]);
  return undefined;
}

export function parseFontWeight(value: string): number | undefined {
  if (!value) return undefined;
  const v = value.trim().toLowerCase();
  const WEIGHT_MAP: Record<string, number> = {
    thin: 100, hairline: 100, 'extra-light': 200, 'ultra-light': 200,
    light: 300, normal: 400, regular: 400, medium: 500,
    'semi-bold': 600, 'demi-bold': 600, bold: 700,
    'extra-bold': 800, 'ultra-bold': 800, black: 900, heavy: 900,
  };
  if (WEIGHT_MAP[v] !== undefined) return WEIGHT_MAP[v];
  const parsed = parseInt(v, 10);
  if (!isNaN(parsed) && parsed >= 1 && parsed <= 1000) return parsed;
  return undefined;
}

export function parseLineHeight(value: string | undefined, referenceFontSize?: number): number | undefined {
  if (!value) return undefined;
  const t = value.trim();
  const px = t.match(/^(\d+(?:\.\d+)?)px$/);
  if (px) return parseFloat(px[1]);
  const num = t.match(/^(\d+(?:\.\d+)?)$/);
  if (num) return parseFloat(num[1]);
  if (referenceFontSize) {
    const factor = parseFloat(t);
    if (!isNaN(factor)) return factor * referenceFontSize;
  }
  return undefined;
}

export function getHeadingFontSize(level: number): number {
  switch (level) {
    case 1: return 32;
    case 2: return 28;
    case 3: return 24;
    case 4: return 20;
    case 5: return 16;
    case 6: return 14;
    default: return 16;
  }
}

export function getHeadingFontWeight(level: number): number {
  return level <= 4 ? 700 : 600;
}
