import { createHeadlessEditor } from "@lexical/headless";
import { $createParagraphNode, $createTextNode, $getRoot } from "lexical";
import { expect, test } from "vitest";
import { editorStateToCommentContent } from "./editor-state-to-comment-content";

test("simple string", () => {
  const editor = createHeadlessEditor();
  editor.update(() =>
    $getRoot().append(
      $createParagraphNode().append($createTextNode("Hello, world!")),
    ),
  );

  expect(editorStateToCommentContent(editor.getEditorState())).toEqual(
    "Hello, world!",
  );
});
