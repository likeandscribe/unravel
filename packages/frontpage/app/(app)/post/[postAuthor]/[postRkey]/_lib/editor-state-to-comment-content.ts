import {
  $getRoot,
  $isElementNode,
  $isTextNode,
  EditorState,
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

function $nodeToCommentContent(node: LexicalNode): CommentContent {
  if ($isTextNode(node)) {
    console.log("text node", node);
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
  } else if ($isElementNode(node)) {
    console.log("element node", node);
    return node.getChildren().map($nodeToCommentContent);
  } else {
    throw new Error("Unknown node type");
  }
}
