export interface BoxShadowValues {
  offsetX: number;
  offsetY: number;
  blurRadius: number;
  spreadRadius: number;
  color: string;
  inset: boolean;
}

export function parseBoxShadow(value: string | undefined): BoxShadowValues[] | undefined {
  if (!value) return undefined;
  const t = value.trim();
  if (t === 'none') return [];

  const shadows: BoxShadowValues[] = [];
  const parts = splitShadows(t);

  for (const part of parts) {
    const shadow = parseSingleShadow(part);
    if (shadow) shadows.push(shadow);
  }

  return shadows.length > 0 ? shadows : undefined;
}

function splitShadows(value: string): string[] {
  const shadows: string[] = [];
  let depth = 0;
  let current = '';

  for (const ch of value) {
    if (ch === '(') { depth++; current += ch; }
    else if (ch === ')') { depth--; current += ch; }
    else if (ch === ',' && depth === 0) {
      shadows.push(current.trim());
      current = '';
    } else {
      current += ch;
    }
  }
  if (current.trim()) shadows.push(current.trim());

  return shadows;
}

function parseSingleShadow(value: string): BoxShadowValues | null {
  const parts = value.trim().split(/\s+/);
  let inset = false;
  let offsetX = 0;
  let offsetY = 0;
  let blurRadius = 0;
  let spreadRadius = 0;
  let color = '#000000';

  const numericValues: number[] = [];
  const stringValues: string[] = [];

  for (const part of parts) {
    if (part === 'inset') {
      inset = true;
    } else if (/^\d/.test(part) || part.startsWith('-')) {
      const parsed = parseFloat(part);
      if (!isNaN(parsed)) numericValues.push(parsed);
      else stringValues.push(part);
    } else {
      stringValues.push(part);
    }
  }

  if (numericValues.length >= 2) {
    offsetX = numericValues[0];
    offsetY = numericValues[1];
  }
  if (numericValues.length >= 3) blurRadius = numericValues[2];
  if (numericValues.length >= 4) spreadRadius = numericValues[3];

  if (stringValues.length > 0) {
    color = stringValues.join(' ');
  }

  return { offsetX, offsetY, blurRadius, spreadRadius, color, inset };
}
