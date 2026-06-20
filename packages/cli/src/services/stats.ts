import type { UiNode, PlatformTarget } from '@html-native/shared';
import type { ConversionStats } from '../types.js';

export function countNodes(node: UiNode): number {
  let count = 1;
  for (const child of node.children) {
    count += countNodes(child);
  }
  return count;
}

export function countComponentNodes(node: UiNode): number {
  const componentTypes = new Set([
    'Button', 'Card', 'NavigationBar', 'AppBar', 'Drawer',
    'HeroSection', 'Footer', 'Sidebar', 'Dialog', 'Modal',
    'Tabs', 'Form', 'TextField', 'TextArea', 'List',
  ]);
  let count = componentTypes.has(node.type) ? 1 : 0;
  for (const child of node.children) {
    count += countComponentNodes(child);
  }
  return count;
}

export function countLines(code: string): number {
  return code.split('\n').length;
}

export function computeOptimizationSavings(original: UiNode, optimized: UiNode): number {
  const originalCount = countNodes(original);
  const optimizedCount = countNodes(optimized);
  if (originalCount === 0) return 0;
  return Math.round(((originalCount - optimizedCount) / originalCount) * 100);
}

export function generateStatsTable(stats: ConversionStats): string {
  const lines = [
    '─'.repeat(24),
    `  HTML Nodes:              ${stats.htmlNodes}`,
    `  Styled Nodes:            ${stats.styledNodes}`,
    `  Components Detected:     ${stats.componentsDetected}`,
    `  Optimization Savings:    ${stats.optimizationSavings}%`,
    `  Generated Lines:         ${stats.generatedLines}`,
    `  Target:                  ${stats.target.charAt(0).toUpperCase() + stats.target.slice(1)}`,
    `  Duration:                ${stats.duration.toFixed(2)}s`,
    '─'.repeat(24),
  ];
  return `\n${lines.join('\n')}\n`;
}
