import { createHeadlessEditor } from "@lexical/headless";
import {
  $createParagraphNode,
  $createTextNode,
  $getRoot,
  LexicalEditor,
} from "lexical";
import { beforeEach, expect, test } from "vitest";
import { editorStateToCommentContent } from "./editor-state-to-comment-content";

let editor: LexicalEditor;
beforeEach(() => {
  editor = createHeadlessEditor({
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

test("simple string", async () => {
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
    "Hello, ",
    {
      content: "world",
      facets: [
        { $type: "fyi.frontpage.richtext.facet#format", format: "bold" },
      ],
    },
    "!",
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
    "Hello, ",
    {
      content: "world",
      facets: [
        { $type: "fyi.frontpage.richtext.facet#format", format: "bold" },
        { $type: "fyi.frontpage.richtext.facet#format", format: "italic" },
      ],
    },
    "!",
  ]);
});
