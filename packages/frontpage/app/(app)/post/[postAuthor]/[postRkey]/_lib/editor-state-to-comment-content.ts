import { invariant } from "@/lib/utils";
import { $isLinkNode } from "@lexical/link";
import {
  $getRoot,
  $isElementNode,
  $isParagraphNode,
  $isRootNode,
  $isTextNode,
  EditorState,
  ElementNode,
  LexicalNode,
} from "lexical";

export function editorStateToCommentContent(editorState: EditorState) {
  return editorState.read(() => {
    const root = $getRoot();
    const content = $nodeToCommentContent(root);
    return content;
  });
}

const FORMATS = ["bold", "italic", "strikethrough"] as const;

type CommentFacet =
  | {
      $type: "fyi.frontpage.richtext.facet#format";
      format: (typeof FORMATS)[number];
    }
  | {
      $type: "fyi.frontpage.richtext.facet#link";
      uri: string;
    };

type CommentContent =
  | string
  | { content: CommentContent; facets: CommentFacet[] }
  | CommentContent[];

function $nodeToCommentContent(
  node: LexicalNode,
  parent?: ElementNode,
): CommentContent {
  invariant(
    !$isRootNode(parent) || !node.isInline(),
    "Expected root children to not be inline.",
  );

  if ($isTextNode(node)) {
    const formats = FORMATS.filter((format) => node.hasFormat(format));
    if (formats.length === 0) {
      return node.getTextContent();
    }

    return {
      content: node.getTextContent(),
      facets: formats.map((format) => ({
        $type: "fyi.frontpage.richtext.facet#format",
        format,
      })),
    };
  }

  invariant($isElementNode(node), "Expected element node");

  const children = node
    .getChildren()
    .map((child) => $nodeToCommentContent(child, node));

  if ($isRootNode(node)) {
    return children;
  }

  if ($isParagraphNode(node)) {
    invariant(
      $isRootNode(parent),
      "Paragraph node must be a child of root node",
    );
    return children.flat();
  }

  if ($isLinkNode(node)) {
    return {
      content: children,
      facets: [
        {
          $type: "fyi.frontpage.richtext.facet#link",
          uri: node.getURL(),
        },
      ],
    };
  }

  throw new Error(`Unknown node type: ${node.__type}`);
}
