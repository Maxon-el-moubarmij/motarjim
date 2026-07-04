import type { UiNode, SourceSpan } from '@motarjim/shared';
import type { IrNode, LayoutIR, SemanticIR, ComputedStyle } from '@motarjim/shared/ir-v2.js';

export {
  selectWidget,
  suggestWidgetsForTree,
} from './widget-engine.js';
export type { SelectionContext, TreeWidgetSuggestions } from './widget-engine.js';

// ============================================================
// Legacy UiNode utilities (kept for backward compatibility)
// ============================================================

export function countNodes(node: UiNode): number {
  let count = 1;
  for (const child of node.children) {
    count += countNodes(child);
  }
  return count;
}

export function escapeString(s: string): string {
  return s.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n/g, '\\n');
}

export function escapeStringExtra(s: string, extra: Record<string, string>): string {
  let result = s;
  for (const [char, replacement] of Object.entries(extra)) {
    result = result.split(char).join(replacement);
  }
  return result;
}

export function findTextLabel(node: UiNode): string {
  const textChild = node.children.find(c => c.type === 'Text');
  if (textChild) return textChild.value ?? '';
  if (node.value) return node.value;
  return String(node.properties?.label ?? '');
}

export function getNonTextChildren(node: UiNode): UiNode[] {
  return node.children.filter(c => c.type !== 'Text');
}

// ============================================================
// IR Node utilities
// ============================================================

export function countIrNodes(node: IrNode): number {
  let count = 1;
  for (const child of node.children) {
    count += countIrNodes(child);
  }
  return count;
}

export function findIrTextLabel(node: IrNode): string {
  if (node.semantics.role === 'text' || node.semantics.role === 'heading') {
    return (node.semantics as { content?: string }).content ?? '';
  }
  for (const child of node.children) {
    const label = findIrTextLabel(child);
    if (label) return label;
  }
  return '';
}

export function formatSourcePos(span: SourceSpan): string {
  return `${span.file}:${span.start.line}:${span.start.column}`;
}

// ============================================================
// Legacy NodeEmitter interface (UiNode-based)
// ============================================================

export interface NodeEmitter {
  indentUnit: string;
  emitText(node: UiNode, indent: string): string;
  emitButton(node: UiNode, indent: string, label: string, children: string[]): string;
  emitRow(indent: string, children: string[]): string;
  emitColumn(indent: string, children: string[]): string;
  emitContainer(node: UiNode, indent: string, children: string[]): string;
  emitCard(node: UiNode, indent: string, children: string[]): string;
  emitImage(node: UiNode, indent: string): string;
  emitTextField(node: UiNode, indent: string): string;
  emitAppBar(indent: string, title: string): string;
  emitScrollView(indent: string, children: string[]): string;
  emitForm(node: UiNode, indent: string, children: string[]): string;
  emitFooter(indent: string, children: string[]): string;
  emitDefault(node: UiNode, indent: string, children: string[]): string;
}

// ============================================================
// IR Emitter interface — dispatches on SemanticIR.role
// Layout is handled separately via emitLayout
// ============================================================

export interface IrEmitter {
  indentUnit: string;

  /** Emit the layout wrapper (Row/Column/Stack/ScrollView/etc.) around children */
  emitLayout(layout: LayoutIR, indent: string, children: string[], cs: ComputedStyle): string;

  /** Emit the semantic widget for a leaf node */
  emitText(sem: SemanticIR & { role: 'text' }, cs: ComputedStyle, indent: string): string;
  emitHeading(sem: SemanticIR & { role: 'heading' }, cs: ComputedStyle, indent: string): string;
  emitButton(sem: SemanticIR & { role: 'button' }, cs: ComputedStyle, indent: string): string;
  emitLink(sem: SemanticIR & { role: 'link' }, cs: ComputedStyle, indent: string): string;
  emitImage(sem: SemanticIR & { role: 'image' }, cs: ComputedStyle, indent: string): string;
  emitIcon(sem: SemanticIR & { role: 'icon' }, cs: ComputedStyle, indent: string): string;
  emitInput(sem: SemanticIR & { role: 'input' }, cs: ComputedStyle, indent: string): string;
  emitTextarea(sem: SemanticIR & { role: 'textarea' }, cs: ComputedStyle, indent: string): string;
  emitSelect(sem: SemanticIR & { role: 'select' }, cs: ComputedStyle, indent: string): string;
  emitForm(sem: SemanticIR & { role: 'form' }, cs: ComputedStyle, indent: string, children: string[]): string;
  emitList(sem: SemanticIR & { role: 'list' }, cs: ComputedStyle, indent: string, children: string[]): string;
  emitListItem(sem: SemanticIR & { role: 'list-item' }, cs: ComputedStyle, indent: string): string;
  emitDivider(sem: SemanticIR & { role: 'divider' }, cs: ComputedStyle, indent: string): string;
  emitGeneric(sem: SemanticIR & { role: 'generic' }, cs: ComputedStyle, indent: string, children: string[]): string;
  emitUnknown(sem: SemanticIR & { role: 'unknown' }, cs: ComputedStyle, indent: string, children: string[]): string;
}

// ============================================================
// Legacy tree walker (UiNode-based)
// ============================================================

function walkChildren(node: UiNode, emitter: NodeEmitter, level: number, sourceComments: boolean): string[] {
  return node.children.map(c => walkTree(c, emitter, level, sourceComments));
}

export function walkTree(node: UiNode, emitter: NodeEmitter, level: number = 0, sourceComments: boolean = false): string {
  const i = emitter.indentUnit.repeat(level);
  const nextLevel = level + 1;

  const sourcePrefix = sourceComments && node.sourceSpan
    ? `${i}// ${formatSourcePos(node.sourceSpan)}\n`
    : '';

  let result: string;

  switch (node.type) {
    case 'Text':
      result = emitter.emitText(node, i);
      break;

    case 'Button': {
      const label = findTextLabel(node) || 'Button';
      const nonTextChildren = getNonTextChildren(node);
      const rendered = nonTextChildren.map(c => walkTree(c, emitter, nextLevel, sourceComments));
      result = emitter.emitButton(node, i, label, rendered);
      break;
    }

    case 'Row':
      result = emitter.emitRow(i, walkChildren(node, emitter, nextLevel, sourceComments));
      break;

    case 'Column':
      result = emitter.emitColumn(i, walkChildren(node, emitter, nextLevel, sourceComments));
      break;

    case 'Container':
      result = emitter.emitContainer(node, i, walkChildren(node, emitter, nextLevel, sourceComments));
      break;

    case 'NavigationBar':
    case 'AppBar': {
      const title = findTextLabel(node) || 'Title';
      result = emitter.emitAppBar(i, title);
      break;
    }

    case 'Card':
      result = emitter.emitCard(node, i, walkChildren(node, emitter, nextLevel, sourceComments));
      break;

    case 'Image':
      result = emitter.emitImage(node, i);
      break;

    case 'TextField':
      result = emitter.emitTextField(node, i);
      break;

    case 'ListView':
    case 'LazyList':
    case 'ScrollView':
      result = emitter.emitScrollView(i, walkChildren(node, emitter, nextLevel, sourceComments));
      break;

    case 'Form':
      result = emitter.emitForm(node, i, walkChildren(node, emitter, nextLevel, sourceComments));
      break;

    case 'Footer':
      result = emitter.emitFooter(i, walkChildren(node, emitter, nextLevel, sourceComments));
      break;

    default:
      result = emitter.emitDefault(node, i, walkChildren(node, emitter, nextLevel, sourceComments));
      break;
  }

  return sourcePrefix + result;
}

// ============================================================
// IR tree walker — dispatches on SemanticIR.role
// Layout is handled by the emitter's emitLayout method
// ============================================================

function walkIrChildren(node: IrNode, emitter: IrEmitter, level: number): string[] {
  return node.children.map(c => walkIrTree(c, emitter, level));
}

export function walkIrTree(node: IrNode, emitter: IrEmitter, level: number = 0): string {
  const i = emitter.indentUnit.repeat(level);

  const children = walkIrChildren(node, emitter, level + 1);
  const cs = node.computedStyle;

  // Emit the semantic widget
  let widget: string;
  switch (node.semantics.role) {
    case 'text':
      widget = emitter.emitText(node.semantics, cs, i);
      break;
    case 'heading':
      widget = emitter.emitHeading(node.semantics, cs, i);
      break;
    case 'button':
      widget = emitter.emitButton(node.semantics, cs, i);
      break;
    case 'link':
      widget = emitter.emitLink(node.semantics, cs, i);
      break;
    case 'image':
      widget = emitter.emitImage(node.semantics, cs, i);
      break;
    case 'icon':
      widget = emitter.emitIcon(node.semantics, cs, i);
      break;
    case 'input':
      widget = emitter.emitInput(node.semantics, cs, i);
      break;
    case 'textarea':
      widget = emitter.emitTextarea(node.semantics, cs, i);
      break;
    case 'select':
      widget = emitter.emitSelect(node.semantics, cs, i);
      break;
    case 'form':
      widget = emitter.emitForm(node.semantics, cs, i, children);
      break;
    case 'list':
      widget = emitter.emitList(node.semantics, cs, i, children);
      break;
    case 'list-item':
      widget = emitter.emitListItem(node.semantics, cs, i);
      break;
    case 'divider':
      widget = emitter.emitDivider(node.semantics, cs, i);
      break;
    case 'generic':
      widget = emitter.emitGeneric(node.semantics, cs, i, children);
      break;
    case 'unknown':
      widget = emitter.emitUnknown(node.semantics, cs, i, children);
      break;
    default:
      widget = emitter.emitUnknown({ role: 'unknown' }, cs, i, children);
      break;
  }

  // Wrap in layout if there are children or if this is a container node
  if (children.length > 0 || node.layout.strategy !== 'none') {
    return emitter.emitLayout(node.layout, i, [widget], cs);
  }

  return widget;
}
