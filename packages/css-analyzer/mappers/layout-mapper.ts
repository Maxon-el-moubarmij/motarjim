export type DisplayType = 'block' | 'inline' | 'inline-block' | 'flex' | 'inline-flex' | 'grid' | 'inline-grid' | 'none' | 'contents';
export type PositionType = 'static' | 'relative' | 'absolute' | 'fixed' | 'sticky';
export type OverflowType = 'visible' | 'hidden' | 'scroll' | 'auto';
export type FlexDirection = 'row' | 'column' | 'row-reverse' | 'column-reverse';
export type FlexWrap = 'nowrap' | 'wrap' | 'wrap-reverse';
export type MainAxisAlignment = 'start' | 'center' | 'end' | 'space-between' | 'space-around' | 'space-evenly';
export type CrossAxisAlignment = 'start' | 'center' | 'end' | 'stretch' | 'baseline';

export interface LayoutValues {
  display?: DisplayType;
  position?: PositionType;
  overflowX?: OverflowType;
  overflowY?: OverflowType;
  flexDirection?: FlexDirection;
  flexWrap?: FlexWrap;
  justifyContent?: MainAxisAlignment;
  alignItems?: CrossAxisAlignment;
  alignContent?: CrossAxisAlignment;
  alignSelf?: string;
  gap?: number;
  flexGrow?: number;
  flexShrink?: number;
  flexBasis?: string;
  order?: number;
}

export function parseLayoutStyles(styles: Record<string, string | undefined>): LayoutValues {
  const r: LayoutValues = {};

  if (styles['display']) r.display = styles['display'] as DisplayType;
  if (styles['position']) r.position = styles['position'] as PositionType;
  if (styles['overflow-x']) r.overflowX = styles['overflow-x'] as OverflowType;
  if (styles['overflow-y']) r.overflowY = styles['overflow-y'] as OverflowType;
  if (styles['overflow']) {
    const o = styles['overflow'] as OverflowType;
    r.overflowX = o;
    r.overflowY = o;
  }
  if (styles['flex-direction']) r.flexDirection = styles['flex-direction'] as FlexDirection;
  if (styles['flex-wrap']) r.flexWrap = styles['flex-wrap'] as FlexWrap;
  if (styles['justify-content']) r.justifyContent = styles['justify-content'] as MainAxisAlignment;
  if (styles['align-items']) r.alignItems = styles['align-items'] as CrossAxisAlignment;
  if (styles['align-content']) r.alignContent = styles['align-content'] as CrossAxisAlignment;
  if (styles['align-self']) r.alignSelf = styles['align-self'];
  if (styles['gap']) r.gap = parseLayoutPx(styles['gap']);
  if (styles['flex-grow']) r.flexGrow = parseFloat(styles['flex-grow']) || undefined;
  if (styles['flex-shrink']) r.flexShrink = parseFloat(styles['flex-shrink']) || undefined;
  if (styles['flex-basis']) r.flexBasis = styles['flex-basis'];
  if (styles['order']) r.order = parseInt(styles['order'], 10) || undefined;

  return r;
}

function parseLayoutPx(value: string | undefined): number | undefined {
  if (!value) return undefined;
  const t = value.trim();
  const px = t.match(/^(\d+(?:\.\d+)?)px$/);
  if (px) return parseFloat(px[1]);
  const num = t.match(/^(\d+(?:\.\d+)?)$/);
  if (num) return parseFloat(num[1]);
  return undefined;
}

export function isFlexLayout(display?: string): boolean {
  return display === 'flex' || display === 'inline-flex';
}

export function isGridLayout(display?: string): boolean {
  return display === 'grid' || display === 'inline-grid';
}

export function isHidden(display?: string, visibility?: string): boolean {
  return display === 'none' || visibility === 'hidden';
}
