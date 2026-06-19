import { UiNode } from '@html-native/shared';

export interface OptimizationPass {
  name: string;
  run: (node: UiNode) => UiNode;
}

// Merge adjacent text nodes
function mergeTextNodes(node: UiNode): UiNode {
  const merged: UiNode[] = [];
  for (const child of node.children) {
    const optimized = mergeTextNodes(child);
    if (optimized.type === 'Text' && merged.length > 0 && merged[merged.length - 1].type === 'Text') {
      const prev = merged[merged.length - 1];
      prev.value = ((prev.value || '') + ' ' + (optimized.value || '')).trim();
      prev.properties.value = prev.value;
    } else {
      merged.push(optimized);
    }
  }
  return { ...node, children: merged };
}

// Remove redundant containers (single child containers)
function flattenContainers(node: UiNode): UiNode {
  const children = node.children.map(flattenContainers);

  if (
    (node.type === 'Container' || node.type === 'Unknown') &&
    children.length === 1 &&
    Object.keys(node.properties).length === 0
  ) {
    return children[0];
  }

  return { ...node, children };
}

// Remove empty text nodes
function removeEmptyText(node: UiNode): UiNode {
  const children = node.children
    .map(removeEmptyText)
    .filter(child => {
      if (child.type === 'Text' && (!child.value || child.value.trim() === '')) {
        return false;
      }
      return true;
    });

  return { ...node, children };
}

export const defaultPasses: OptimizationPass[] = [
  { name: 'removeEmptyText', run: removeEmptyText },
  { name: 'mergeTextNodes', run: mergeTextNodes },
  { name: 'flattenContainers', run: flattenContainers },
];

export function optimize(ir: UiNode, passes: OptimizationPass[] = defaultPasses): UiNode {
  let node = { ...ir };
  for (const pass of passes) {
    node = pass.run(node);
  }
  return node;
}
