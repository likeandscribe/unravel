import "server-only";
import { parse, transform, Tag } from "@markdoc/markdoc";
import type {
  RenderableTreeNodes,
  RenderableTreeNode,
  Scalar,
  Schema,
  Config,
} from "@markdoc/markdoc";
import slugify from "slugify";

import type { ComponentType, ReactNode } from "react";
import { createElement, memo } from "react";

type Component = ComponentType<any>;

export default memo(function Markdown({
  components = {},
  content,
}: {
  components?: Record<string, Component>;
  content: string;
}) {
  const ast = parse(content);
  const tree = transform(ast, {
    nodes: { heading: createHeadingSchema() },
  });
  return render(tree) as any;

  function deepRender(value: any): any {
    if (value == null || typeof value !== "object") return value;

    if (Array.isArray(value)) return value.map((item) => deepRender(item));

    if (value.$$mdtype === "Tag") return render(value);

    if (typeof value !== "object") return value;

    const output: Record<string, Scalar> = {};
    for (const [k, v] of Object.entries(value)) output[k] = deepRender(v);
    return output;
  }

  function render(node: RenderableTreeNodes): ReactNode {
    if (Array.isArray(node)) return <>{node.map(render)}</>;

    if (node === null || typeof node !== "object" || !Tag.isTag(node))
      return node as any;

    const {
      name,
      attributes: { class: className, ...attrs } = {},
      children = [],
    } = node;

    if (className) attrs.className = className;

    return createElement(
      components[name] ?? name,
      Object.keys(attrs).length == 0 ? null : deepRender(attrs),
      ...children.map(render),
    );
  }
});

function getTextContent(childNodes: RenderableTreeNode[]): string {
  let text = "";
  for (const node of childNodes) {
    if (typeof node === "string" || typeof node === "number") {
      text += node;
    } else if (typeof node === "object" && Tag.isTag(node)) {
      text += getTextContent(node.children);
    }
  }
  return text;
}

function createHeadingSchema() {
  const headingIds = new Set<string>();

  return {
    children: ["inline"],
    attributes: {
      id: { type: String },
      level: { type: Number, required: true, default: 1 },
    },
    transform(node, config: Config) {
      const { level, ...attributes } = node.transformAttributes(config);
      const children = node.transformChildren(config);

      const textContent = attributes.content ?? getTextContent(children);
      let slug = slugify(textContent, { lower: true });
      if (slug.endsWith("-")) slug = slug.slice(0, -1);
      let id = slug;
      if (headingIds.has(slug)) {
        let i = 1;
        while (headingIds.has(`${slug}-${i}`)) i++;
        id = `${slug}-${i}`;
      }
      headingIds.add(id);

      const render = config.nodes?.heading?.render ?? `h${level}`;

      const tagProps =
        // For components, pass down `level` as a prop,
        // alongside `__collectHeading` for our `headings` collector.
        // Avoid accidentally rendering `level` as an HTML attribute otherwise!
        typeof render === "string"
          ? { ...attributes, id }
          : { ...attributes, id, __collectHeading: true, level };

      return new Tag(render, tagProps, children);
    },
  } satisfies Schema;
}
