export interface ParsedColor {
  hex?: string;
  rgb?: { r: number; g: number; b: number; a?: number };
  hsl?: { h: number; s: number; l: number; a?: number };
  name?: string;
}

export function parseColor(value: string): ParsedColor | null {
  if (!value) return null;
  const trimmed = value.trim().toLowerCase();

  // Hex
  const hexMatch = trimmed.match(/^#([0-9a-f]{3}|[0-9a-f]{4}|[0-9a-f]{6}|[0-9a-f]{8})$/);
  if (hexMatch) return { hex: trimmed };

  // rgb/rgba
  const rgbMatch = trimmed.match(/^rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*([\d.]+))?\s*\)$/);
  if (rgbMatch) {
    return {
      rgb: {
        r: parseInt(rgbMatch[1], 10),
        g: parseInt(rgbMatch[2], 10),
        b: parseInt(rgbMatch[3], 10),
        a: rgbMatch[4] ? parseFloat(rgbMatch[4]) : undefined,
      },
    };
  }

  // hsl/hsla
  const hslMatch = trimmed.match(/^hsla?\(\s*(\d+)\s*,\s*(\d+)%\s*,\s*(\d+)%\s*(?:,\s*([\d.]+))?\s*\)$/);
  if (hslMatch) {
    return {
      hsl: {
        h: parseInt(hslMatch[1], 10),
        s: parseInt(hslMatch[2], 10),
        l: parseInt(hslMatch[3], 10),
        a: hslMatch[4] ? parseFloat(hslMatch[4]) : undefined,
      },
    };
  }

  // Named colors (subset)
  const NAMED_COLORS: Record<string, string> = {
    black: '#000000', white: '#ffffff', red: '#ff0000', green: '#008000',
    blue: '#0000ff', gray: '#808080', grey: '#808080', transparent: '#00000000',
  };
  if (NAMED_COLORS[trimmed]) return { hex: NAMED_COLORS[trimmed], name: trimmed };

  return { name: trimmed };
}

export function colorToHex(value: string): string | undefined {
  const parsed = parseColor(value);
  if (!parsed) return undefined;
  if (parsed.hex) return parsed.hex;
  if (parsed.rgb) {
    const { r, g, b } = parsed.rgb;
    return `#${[r, g, b].map(c => c.toString(16).padStart(2, '0')).join('')}`;
  }
  return value;
}

export function colorToFlutter(value: string): string {
  const hex = colorToHex(value);
  if (!hex) return `Color(0xFF000000)`;
  const hexVal = hex.replace('#', '');
  if (hexVal.length === 3) {
    const expanded = hexVal.split('').map(c => c + c).join('');
    return `Color(0xFF${expanded})`;
  }
  if (hexVal.length === 6) return `Color(0xFF${hexVal})`;
  if (hexVal.length === 8) return `Color(0x${hexVal.toUpperCase()})`;
  return `Color(0xFF000000)`;
}

export function colorToSwiftUI(value: string): string {
  const hex = colorToHex(value);
  if (!hex) return '.black';
  const hexVal = hex.replace('#', '');
  if (hexVal.length === 3) {
    const expanded = hexVal.split('').map(c => c + c).join('');
    return hexToSwiftRGB(expanded);
  }
  if (hexVal.length === 6) return hexToSwiftRGB(hexVal);
  if (hexVal.length === 8) {
    const rgb = hexVal.slice(2);
    return hexToSwiftRGB(rgb);
  }
  return '.black';
}

function hexToSwiftRGB(hex: string): string {
  const r = parseInt(hex.slice(0, 2), 16) / 255;
  const g = parseInt(hex.slice(2, 4), 16) / 255;
  const b = parseInt(hex.slice(4, 6), 16) / 255;
  return `Color(red: ${r.toFixed(3)}, green: ${g.toFixed(3)}, blue: ${b.toFixed(3)})`;
}

export function colorToCompose(value: string): string {
  const hex = colorToHex(value);
  if (!hex) return 'Color.Black';
  const hexVal = hex.replace('#', '');
  if (hexVal.length === 3) {
    const expanded = hexVal.split('').map(c => c + c).join('');
    return `Color(0xFF${expanded})`;
  }
  if (hexVal.length === 6) return `Color(0xFF${hexVal})`;
  if (hexVal.length === 8) return `Color(0x${hexVal.toUpperCase()})`;
  return 'Color.Black';
}
