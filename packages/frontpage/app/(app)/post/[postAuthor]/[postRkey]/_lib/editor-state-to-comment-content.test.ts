import { createHeadlessEditor } from "@lexical/headless";
import {
  $createParagraphNode,
  $createTextNode,
  $getRoot,
  LexicalEditor,
} from "lexical";
import { beforeEach, expect, test } from "vitest";
import { editorStateToCommentContent } from "./editor-state-to-comment-content";
import { $createLinkNode, LinkNode } from "@lexical/link";
import { generateContent } from "@lexical/devtools-core";

let editor: LexicalEditor;
beforeEach(() => {
  editor = createHeadlessEditor({
    nodes: [LinkNode],
    namespace: "",
    onError: (error) => {
      throw error;
    },
  });
});

async function update(updateFn: () => void) {
  editor.update(updateFn);
  await Promise.resolve();
}

function debugEditorState() {
  console.log(generateContent(editor, [], false));
}

test.only("simple string", async () => {
  await update(() => {
    $getRoot().append(
      $createParagraphNode().append($createTextNode("Hello, world!")),
    );
  });

  expect(editorStateToCommentContent(editor.getEditorState())).toEqual([
    "Hello, world!",
  ]);
});

test("empty state", () => {
  expect(editorStateToCommentContent(editor.getEditorState())).toEqual([]);
});

test("bold", async () => {
  await update(() => {
    $getRoot().append(
      $createParagraphNode().append(
        $createTextNode("Hello, "),
        $createTextNode("world").toggleFormat("bold"),
        $createTextNode("!"),
      ),
    );
  });

  expect(editorStateToCommentContent(editor.getEditorState())).toEqual([
    [
      "Hello, ",
      {
        content: "world",
        facets: [
          { $type: "fyi.frontpage.richtext.facet#format", format: "bold" },
        ],
      },
      "!",
    ],
  ]);
});

test("bold and italic", async () => {
  await update(() => {
    $getRoot().append(
      $createParagraphNode().append(
        $createTextNode("Hello, "),
        $createTextNode("world").toggleFormat("bold").toggleFormat("italic"),
        $createTextNode("!"),
      ),
    );
  });

  expect(editorStateToCommentContent(editor.getEditorState())).toEqual([
    [
      "Hello, ",
      {
        content: "world",
        facets: [
          { $type: "fyi.frontpage.richtext.facet#format", format: "bold" },
          { $type: "fyi.frontpage.richtext.facet#format", format: "italic" },
        ],
      },
      "!",
    ],
  ]);
});

test("link", async () => {
  await update(() => {
    $getRoot().append(
      $createParagraphNode().append(
        $createTextNode("Hello, "),
        $createLinkNode("https://example.com").append(
          $createTextNode("w"),
          $createTextNode("or").toggleFormat("bold"),
          $createTextNode("ld").toggleFormat("italic"),
        ),
      ),
    );
  });

  expect(editorStateToCommentContent(editor.getEditorState())).toEqual([
    "Hello, ",
    {
      content: [
        "w",
        {
          content: "or",
          facets: [
            { $type: "fyi.frontpage.richtext.facet#format", format: "bold" },
          ],
        },
        {
          content: "ld",
          facets: [
            { $type: "fyi.frontpage.richtext.facet#format", format: "italic" },
          ],
        },
      ],
      facets: [
        {
          $type: "fyi.frontpage.richtext.facet#link",
          uri: "https://example.com",
        },
      ],
    },
    "!",
  ]);
});

test("empty nodes are removed", async () => {
  await update(() => {
    $getRoot().append(
      $createParagraphNode().append($createTextNode("A"), $createTextNode("")),
      $createParagraphNode(),
      $createParagraphNode().append($createLinkNode("https://example.com")),
    );
  });

  expect(editorStateToCommentContent(editor.getEditorState())).toEqual(["A"]);
});
