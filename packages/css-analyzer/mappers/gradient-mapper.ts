export interface GradientStop {
  color: string;
  position?: number;
}

export interface LinearGradientValues {
  type: 'linear';
  angle: number;
  stops: GradientStop[];
}

export interface RadialGradientValues {
  type: 'radial';
  shape: 'circle' | 'ellipse';
  stops: GradientStop[];
}

export type GradientValues = LinearGradientValues | RadialGradientValues;

export function parseGradient(value: string | undefined): GradientValues | undefined {
  if (!value) return undefined;
  const t = value.trim();

  const linearMatch = t.match(/^linear-gradient\s*\((.*)\)$/s);
  if (linearMatch) return parseLinearGradient(linearMatch[1]);

  const radialMatch = t.match(/^radial-gradient\s*\((.*)\)$/s);
  if (radialMatch) return parseRadialGradient(radialMatch[1]);

  return undefined;
}

function parseLinearGradient(inner: string): LinearGradientValues {
  const parts = splitGradientParts(inner);
  let angle = 180;
  let stopStart = 0;

  const angleMatch = parts[0]?.trim().match(/^(\d+)\s*deg$/);
  if (angleMatch) {
    angle = parseInt(angleMatch[1], 10);
    stopStart = 1;
  } else if (parts[0]?.trim() === 'to top') {
    angle = 0; stopStart = 1;
  } else if (parts[0]?.trim() === 'to bottom') {
    angle = 180; stopStart = 1;
  } else if (parts[0]?.trim() === 'to left') {
    angle = 270; stopStart = 1;
  } else if (parts[0]?.trim() === 'to right') {
    angle = 90; stopStart = 1;
  } else if (parts[0]?.trim() === 'to top left') {
    angle = 315; stopStart = 1;
  } else if (parts[0]?.trim() === 'to top right') {
    angle = 45; stopStart = 1;
  } else if (parts[0]?.trim() === 'to bottom left') {
    angle = 225; stopStart = 1;
  } else if (parts[0]?.trim() === 'to bottom right') {
    angle = 135; stopStart = 1;
  }

  const stops: GradientStop[] = [];
  for (let i = stopStart; i < parts.length; i++) {
    const stop = parseGradientStop(parts[i]);
    if (stop) stops.push(stop);
  }

  return { type: 'linear', angle, stops };
}

function parseRadialGradient(inner: string): RadialGradientValues {
  const parts = splitGradientParts(inner);
  const shape: 'circle' | 'ellipse' = parts[0]?.includes('circle') ? 'circle' : 'ellipse';
  const stopStart = (parts[0]?.includes('circle') || parts[0]?.includes('ellipse')) ? 1 : 0;

  const stops: GradientStop[] = [];
  for (let i = stopStart; i < parts.length; i++) {
    const stop = parseGradientStop(parts[i]);
    if (stop) stops.push(stop);
  }

  return { type: 'radial', shape, stops };
}

function splitGradientParts(inner: string): string[] {
  const parts: string[] = [];
  let depth = 0;
  let current = '';
  for (const ch of inner) {
    if (ch === '(') { depth++; current += ch; }
    else if (ch === ')') { depth--; current += ch; }
    else if (ch === ',' && depth === 0) {
      parts.push(current.trim());
      current = '';
    } else {
      current += ch;
    }
  }
  if (current.trim()) parts.push(current.trim());
  return parts;
}

function parseGradientStop(part: string): GradientStop | null {
  const trimmed = part.trim();
  const match = trimmed.match(/^(.+?)\s+(\d+(?:\.\d+)?)%$/);
  if (match) {
    return { color: match[1].trim(), position: parseFloat(match[2]) };
  }
  return { color: trimmed };
}
