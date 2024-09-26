import {
  ComponentProps,
  MutableRefObject,
  ReactNode,
  useCallback,
  useEffect,
  useState,
} from "react";
import {
  InitialConfigType,
  LexicalComposer,
} from "@lexical/react/LexicalComposer";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { $findMatchingParent, mergeRegister } from "@lexical/utils";
import { $isAtNodeEnd } from "@lexical/selection";
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin";
import { TreeView } from "@lexical/react/LexicalTreeView";
import { EditorRefPlugin } from "@lexical/react/LexicalEditorRefPlugin";
import { ContentEditable } from "@lexical/react/LexicalContentEditable";
import { HistoryPlugin } from "@lexical/react/LexicalHistoryPlugin";
import { LexicalErrorBoundary } from "@lexical/react/LexicalErrorBoundary";
import {
  $isAutoLinkNode,
  $isLinkNode,
  AutoLinkNode,
  LinkNode,
  TOGGLE_LINK_COMMAND,
} from "@lexical/link";
import { LinkPlugin } from "@lexical/react/LexicalLinkPlugin";
import {
  AutoLinkPlugin,
  LinkMatcher,
} from "@lexical/react/LexicalAutoLinkPlugin";
import { cn } from "@/lib/utils";
import { ToggleGroup, ToggleGroupItem } from "./toggle-group";
import {
  FontBoldIcon,
  FontItalicIcon,
  Link2Icon,
  StrikethroughIcon,
} from "@radix-ui/react-icons";
import {
  $getSelection,
  $isRangeSelection,
  FORMAT_TEXT_COMMAND,
  KEY_DOWN_COMMAND,
  SELECTION_CHANGE_COMMAND,
  COMMAND_PRIORITY_LOW,
  COMMAND_PRIORITY_EDITOR,
  RangeSelection,
  TextNode,
  ElementNode,
  LexicalEditor,
} from "lexical";

export type TextareaProps = ComponentProps<"textarea">;

const textAreaStyles =
  "flex min-h-[60px] w-full rounded-md border border-input resize-none bg-transparent px-3 py-3 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 dark:bg-slate-900/30";

function Textarea({ className, ...props }: TextareaProps) {
  return <textarea className={cn(textAreaStyles, className)} {...props} />;
}

Textarea.displayName = "Textarea";

type EditableTextAreaProps = {
  className?: string;
  placeholder?: ReactNode;
  ref?: MutableRefObject<LexicalEditor | null | undefined>;
};

export const initialLexicalConfig: InitialConfigType = {
  namespace: "CommentEditor",
  onError: (error) => {
    console.error(error);
  },
  editable: true,
  theme: {
    paragraph: "mb-3",
    text: {
      bold: "font-bold",
      italic: "italic",
      strikethrough: "line-through",
    },
    link: "text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300",
  },
  nodes: [AutoLinkNode, LinkNode],
};

const AUTOLINK_MATCHES: LinkMatcher[] = [
  (text) => {
    let url;
    try {
      url = new URL(text);
    } catch (_) {
      return null;
    }

    return {
      index: 0,
      length: text.length,
      text,
      url: url.toString(),
    };
  },
];

function EditableTextArea({
  className,
  placeholder,
  ref,
}: EditableTextAreaProps) {
  return (
    <LexicalComposer initialConfig={initialLexicalConfig}>
      <div className="grow">
        <div className={cn(textAreaStyles, "relative p-0", className)}>
          <RichTextPlugin
            contentEditable={
              <ContentEditable className="w-full h-full p-3 min-h-[inherit]" />
            }
            placeholder={
              placeholder ? (
                <div className="absolute top-0 left-0 pointer-events-none p-3">
                  {placeholder}
                </div>
              ) : null
            }
            ErrorBoundary={LexicalErrorBoundary}
          />
          <HistoryPlugin />
          <LinkPlugin validateUrl={URL.canParse} />
          <AutoLinkPlugin matchers={AUTOLINK_MATCHES} />
        </div>
        <Toolbar />
        {/* <TreeViewPlugin /> */}
        <EditorRefPlugin
          editorRef={(e) => {
            if (ref) {
              ref.current = e;
            }
          }}
        />
      </div>
    </LexicalComposer>
  );
}

function TreeViewPlugin() {
  const [editor] = useLexicalComposerContext();

  return (
    <TreeView
      editor={editor}
      viewClassName=""
      treeTypeButtonClassName=""
      timeTravelPanelClassName=""
      timeTravelButtonClassName=""
      timeTravelPanelSliderClassName=""
      timeTravelPanelButtonClassName=""
    />
  );
}

function Toolbar() {
  const [editor] = useLexicalComposerContext();
  const [bold, setBold] = useState(false);
  const [italic, setItalic] = useState(false);
  const [strikethrough, setStrikethrough] = useState(false);
  const [link, setLink] = useState(false);

  // Only using useCallback to appease the linter here, react compiler should optimise it for us without it...
  const $updateToolbar = useCallback(() => {
    const selection = $getSelection();
    if ($isRangeSelection(selection)) {
      setBold(selection.hasFormat("bold"));
      setItalic(selection.hasFormat("italic"));
      setStrikethrough(selection.hasFormat("strikethrough"));
      setLink(!!$getSelectedLinkNode());
    }
  }, []);

  useEffect(
    () =>
      editor.registerCommand(
        KEY_DOWN_COMMAND,
        (event) => {
          // Disable U to disable underline shortcut
          if (event.key === "u" && (event.ctrlKey || event.metaKey)) {
            event.preventDefault();
            return true;
          }

          return false;
        },
        COMMAND_PRIORITY_EDITOR,
      ),
    [editor],
  );

  useEffect(
    () =>
      mergeRegister(
        editor.registerUpdateListener(({ editorState }) => {
          editorState.read(() => {
            $updateToolbar();
          });
        }),
        editor.registerCommand(
          SELECTION_CHANGE_COMMAND,
          () => {
            $updateToolbar();
            return false;
          },
          COMMAND_PRIORITY_LOW,
        ),
      ),
    [editor, $updateToolbar],
  );

  return (
    <ToggleGroup
      type="multiple"
      value={[
        bold && "bold",
        italic && "italic",
        strikethrough && "strikethrough",
        link && "link",
      ].filter((v): v is string => !!v)}
    >
      {/* TODO: These should probably have tooltips but I can't find a good solution this this problem https://github.com/radix-ui/primitives/discussions/560 */}
      <ToggleGroupItem
        value="bold"
        aria-label="Toggle bold"
        onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, "bold")}
      >
        <FontBoldIcon className="h-4 w-4" />
      </ToggleGroupItem>

      <ToggleGroupItem
        value="italic"
        aria-label="Toggle italic"
        onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, "italic")}
      >
        <FontItalicIcon className="h-4 w-4" />
      </ToggleGroupItem>

      <ToggleGroupItem
        value="strikethrough"
        aria-label="Toggle strikethrough"
        onClick={() =>
          editor.dispatchCommand(FORMAT_TEXT_COMMAND, "strikethrough")
        }
      >
        <StrikethroughIcon className="h-4 w-4" />
      </ToggleGroupItem>

      <ToggleGroupItem
        value="link"
        aria-label="Toggle link"
        onClick={() => {
          editor.dispatchCommand(TOGGLE_LINK_COMMAND, null);
        }}
      >
        <Link2Icon className="h-4 w-4" />
      </ToggleGroupItem>
    </ToggleGroup>
  );
}

function getSelectedNode(selection: RangeSelection): TextNode | ElementNode {
  const anchor = selection.anchor;
  const focus = selection.focus;
  const anchorNode = selection.anchor.getNode();
  const focusNode = selection.focus.getNode();
  if (anchorNode === focusNode) {
    return anchorNode;
  }
  const isBackward = selection.isBackward();
  if (isBackward) {
    return $isAtNodeEnd(focus) ? anchorNode : focusNode;
  } else {
    return $isAtNodeEnd(anchor) ? anchorNode : focusNode;
  }
}

function $getSelectedLinkNode() {
  const selection = $getSelection();
  if (!$isRangeSelection(selection)) {
    return null;
  }
  const focusNode = getSelectedNode(selection);
  return (
    $findMatchingParent(focusNode, $isLinkNode) ||
    $findMatchingParent(focusNode, $isAutoLinkNode)
  );
}

export { Textarea, EditableTextArea };
