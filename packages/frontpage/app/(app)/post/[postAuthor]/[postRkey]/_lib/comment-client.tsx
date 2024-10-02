"use client";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/lib/components/ui/alert-dialog";
import { Button } from "@/lib/components/ui/button";
import { Textarea } from "@/lib/components/ui/textarea";
import { SimpleTooltip } from "@/lib/components/ui/tooltip";
import { useToast } from "@/lib/components/ui/use-toast";
import {
  commentUnvoteAction,
  commentVoteAction,
  createCommentAction,
  deleteCommentAction,
  reportCommentAction,
} from "./actions";
import { ChatBubbleIcon, TrashIcon } from "@radix-ui/react-icons";
import {
  useActionState,
  useRef,
  useState,
  useId,
  startTransition,
} from "react";
import {
  VoteButton,
  VoteButtonState,
} from "../../../../_components/vote-button";
import { Spinner } from "@/lib/components/ui/spinner";
import { DID } from "@/lib/data/atproto/did";
import { InputLengthIndicator } from "@/lib/components/input-length-indicator";
import { MAX_COMMENT_LENGTH } from "@/lib/data/db/constants";
import type { CommentModel } from "@/lib/data/db/comment";
import { EllipsisDropdown } from "@/app/(app)/_components/ellipsis-dropdown";
import { ReportButton } from "@/app/(app)/_components/report-button";
import { DeleteButton } from "@/app/(app)/_components/delete-button";

export type CommentClientProps = Pick<
  CommentModel,
  "rkey" | "cid" | "id" | "authorDid"
> & {
  postRkey: string;
  postAuthorDid: DID;
  initialVoteState: VoteButtonState;
  hasAuthored: boolean;
  children: React.ReactNode;
};

export function CommentClientWrapperWithToolbar({
  id,
  rkey,
  cid,
  postRkey,
  authorDid,
  postAuthorDid,
  initialVoteState,
  hasAuthored,
  children,
}: CommentClientProps) {
  const [showNewComment, setShowNewComment] = useState(false);
  const commentRef = useRef<HTMLDivElement>(null);
  const newCommentTextAreaRef = useRef<HTMLTextAreaElement>(null);
  const { toast } = useToast();
  return (
    <>
      {/* eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex */}
      <div className="flex flex-col gap-2 p-1" tabIndex={0} ref={commentRef}>
        {children}
        <div className="flex items-center gap-4">
          <SimpleTooltip content="Vote" side="bottom">
            <VoteButton
              initialState={initialVoteState}
              voteAction={commentVoteAction.bind(null, {
                authorDid,
                cid,
                rkey,
              })}
              unvoteAction={commentUnvoteAction.bind(null, id)}
            />
          </SimpleTooltip>
          <SimpleTooltip content="Comment" side="bottom">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => !hasAuthored && setShowNewComment(true)}
              disabled={hasAuthored}
            >
              <ChatBubbleIcon className="w-4 h-4" />
              <span className="sr-only">Reply</span>
            </Button>
          </SimpleTooltip>
          <SimpleTooltip content="action-menu" side="bottom">
            <EllipsisDropdown>
              <ReportButton
                reportAction={reportCommentAction.bind(null, {
                  authorDid: authorDid,
                  cid: cid,
                  rkey: rkey,
                })}
              />
              {hasAuthored ? (
                <DeleteButton
                  deleteAction={deleteCommentAction.bind(null, rkey)}
                />
              ) : null}
            </EllipsisDropdown>
          </SimpleTooltip>
        </div>
      </div>
      {showNewComment ? (
        <NewComment
          textAreaRef={newCommentTextAreaRef}
          parentRkey={rkey}
          postRkey={postRkey}
          postAuthorDid={postAuthorDid}
          // eslint-disable-next-line jsx-a11y/no-autofocus
          autoFocus
          onActionDone={() => {
            startTransition(() => {
              setShowNewComment(false);
            });
          }}
          extraButton={
            <AlertDialog>
              <SimpleTooltip content="Discard comment">
                <AlertDialogTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={(event) => {
                      if (newCommentTextAreaRef.current?.value.trim() === "") {
                        event.preventDefault();
                        commentRef.current?.focus();
                        setShowNewComment(false);
                      }
                    }}
                  >
                    <TrashIcon className="w-4 h-4" />
                  </Button>
                </AlertDialogTrigger>
              </SimpleTooltip>
              <AlertDialogContent
                onCloseAutoFocus={() => {
                  commentRef.current?.focus();
                }}
              >
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will discard your comment.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => {
                      setShowNewComment(false);
                      toast({
                        title: "Comment discarded",
                        type: "foreground",
                      });
                    }}
                  >
                    Discard
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          }
        />
      ) : null}
    </>
  );
}

export function NewComment({
  autoFocus = false,
  parentRkey,
  postRkey,
  postAuthorDid,
  extraButton,
  textAreaRef,
  onActionDone,
}: {
  parentRkey?: string;
  postRkey: string;
  postAuthorDid: DID;
  autoFocus?: boolean;
  onActionDone?: () => void;
  extraButton?: React.ReactNode;
  textAreaRef?: React.RefObject<HTMLTextAreaElement>;
}) {
  const [input, setInput] = useState("");
  const [_, action, isPending] = useActionState(
    createCommentAction.bind(null, { parentRkey, postRkey, postAuthorDid }),
    undefined,
  );
  const id = useId();
  const textAreaId = `${id}-comment`;

  return (
    <form
      action={action}
      onSubmit={(event) => {
        event.preventDefault();
        startTransition(() => {
          action(new FormData(event.currentTarget));
          onActionDone?.();
          setInput("");
        });
      }}
      aria-busy={isPending}
      onKeyDown={(event) => {
        const isCommentTextArea =
          "id" in event.target && event.target.id === textAreaId;

        const isCmdEnter =
          event.key === "Enter" && (event.metaKey || event.ctrlKey);

        if (isCommentTextArea && isCmdEnter) {
          event.preventDefault();
          event.currentTarget.requestSubmit();
        }
      }}
    >
      <div className="flex items-end gap-2">
        <Textarea
          value={input}
          onChange={(event) => {
            setInput(event.target.value);
          }}
          id={textAreaId}
          // eslint-disable-next-line jsx-a11y/no-autofocus
          autoFocus={autoFocus}
          name="comment"
          ref={textAreaRef}
          placeholder="Write a comment..."
          disabled={isPending}
          className="resize-y flex-1"
        />
        <Button
          className="flex flex-row gap-2"
          disabled={isPending || input.length > MAX_COMMENT_LENGTH}
        >
          {isPending ? <Spinner /> : <ChatBubbleIcon className="w-4 h-4" />}{" "}
          Post
        </Button>
        {extraButton}
      </div>
      <InputLengthIndicator
        length={input.length}
        maxLength={MAX_COMMENT_LENGTH}
      />
    </form>
  );
}
