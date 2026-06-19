import { CssStylesheet, CssRule, HtmlNode, ResolvedStyles, StyledNode } from '@html-native/shared';

export function parseCss(css: string): CssStylesheet {
  const rules: CssRule[] = [];
  const blocks = css.match(/([^{]+)\{([^}]+)\}/g);
  if (!blocks) return { rules };

  for (const block of blocks) {
    const match = block.match(/([^{]+)\{([^}]+)\}/);
    if (!match) continue;
    const selectorStr = match[1].trim();
    const declStr = match[2].trim();
    const selectors = selectorStr.split(',').map(s => s.trim()).filter(Boolean);
    const declarations = declStr.split(';').map(d => d.trim()).filter(Boolean).map(decl => {
      const parts = decl.split(':');
      if (parts.length < 2) return null;
      const property = parts[0].trim();
      const value = parts.slice(1).join(':').trim().replace(/!important$/, '').trim();
      const important = decl.includes('!important');
      return { property, value, important };
    }).filter((d): d is CssRule['declarations'][number] => d !== null);

    rules.push({ selectors, declarations });
  }

  return { rules };
}

export function matchSelector(selector: string, node: HtmlNode): boolean {
  if (selector === '*') return true;
  if (selector.startsWith('.')) {
    const cls = selector.slice(1);
    const classAttr = node.attributes.find(a => a.name === 'class');
    return classAttr?.value.split(/\s+/).includes(cls) || false;
  }
  if (selector.startsWith('#')) {
    const id = selector.slice(1);
    const idAttr = node.attributes.find(a => a.name === 'id');
    return idAttr?.value === id || false;
  }
  return selector === node.tagName;
}

export function resolveStyles(node: HtmlNode, stylesheet: CssStylesheet): ResolvedStyles {
  const styles: ResolvedStyles = {};
  for (const rule of stylesheet.rules) {
    for (const selector of rule.selectors) {
      if (matchSelector(selector, node)) {
        for (const decl of rule.declarations) {
          styles[decl.property] = decl.value;
        }
      }
    }
  }
  return styles;
}

export function applyStyles(nodes: HtmlNode[], stylesheet: CssStylesheet): StyledNode[] {
  function apply(nodes: HtmlNode[]): StyledNode[] {
    return nodes.map(node => ({
      node,
      styles: resolveStyles(node, stylesheet),
      children: apply(node.children),
    }));
  }
  return apply(nodes);
}
