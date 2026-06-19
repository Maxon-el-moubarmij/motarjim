import * as parse5 from 'parse5';
import { HtmlNode, HtmlAttribute } from '@html-native/shared';

let nodeCounter = 0;

function nextId(): string {
  return `node_${++nodeCounter}`;
}

function convertAttrs(attrs: any[] | undefined): HtmlAttribute[] {
  if (!attrs || !Array.isArray(attrs)) return [];
  return attrs.map((a: any) => ({ name: a.name, value: a.value ?? '' }));
}

function walkTree(node: any): HtmlNode {
  const tagName = node.tagName?.toLowerCase() || '';

  const htmlNode: HtmlNode = {
    nodeId: nextId(),
    tagName,
    attributes: convertAttrs(node.attrs),
    children: [],
  };

  if (node.childNodes) {
    for (const child of node.childNodes) {
      if (child.nodeName === '#text') {
        const text = (child.value || '').trim();
        if (text) {
          htmlNode.children.push({
            nodeId: nextId(),
            tagName: '#text',
            attributes: [],
            children: [],
          });
          htmlNode.children[htmlNode.children.length - 1].attributes.push({
            name: 'value',
            value: text,
          });
        }
      } else if (child.tagName) {
        htmlNode.children.push(walkTree(child));
      }
    }
  }

  return htmlNode;
}

export function parseHtml(html: string): HtmlNode {
  nodeCounter = 0;
  const document = parse5.parse(html);
  const htmlRoot = (document as any).childNodes?.find(
    (n: any) => n.tagName?.toLowerCase() === 'html'
  );
  const body = htmlRoot?.childNodes?.find(
    (n: any) => n.tagName?.toLowerCase() === 'body'
  );
  if (body) {
    return {
      nodeId: 'root',
      tagName: 'root',
      attributes: [],
      children: body.childNodes
        ?.filter((n: any) => n.tagName)
        .map((n: any) => walkTree(n)) || [],
    };
  }
  return {
    nodeId: 'root',
    tagName: 'root',
    attributes: [],
    children: [],
  };
}
