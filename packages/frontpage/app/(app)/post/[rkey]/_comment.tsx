"use client";
import { TimeAgo } from "@/lib/components/time-ago";
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
import { createCommentAction } from "./_actions";
import { ChatBubbleIcon, TrashIcon } from "@radix-ui/react-icons";
import { VariantProps, cva } from "class-variance-authority";
import React, { useRef, useState } from "react";
import { VoteButton, VoteButtonState } from "../../_components/vote-button";

const commentVariants = cva(undefined, {
  variants: {
    level: {
      0: "",
      1: "pl-8",
      2: "pl-16",
    },
  },
  defaultVariants: {
    level: 0,
  },
});

export type CommentProps = VariantProps<typeof commentVariants> & {
  rkey: string;
  author: string;
  comment: string;
  createdAt: Date;
  voteAction: () => Promise<void>;
  unvoteAction: () => Promise<void>;
  initialVoteState: VoteButtonState;
  newCommentDisabled?: boolean;
};

export function CommentClient({
  rkey,
  author,
  comment,
  level,
  createdAt,
  voteAction,
  unvoteAction,
  initialVoteState,
  newCommentDisabled,
}: CommentProps) {
  const [showNewComment, setShowNewComment] = useState(false);
  const commentRef = useRef<HTMLDivElement>(null);
  const newCommentTextAreaRef = useRef<HTMLTextAreaElement>(null);
  const { toast } = useToast();
  return (
    <article className={commentVariants({ level })}>
      <div className="grid gap-2 flex-1 p-1" tabIndex={0} ref={commentRef}>
        <div className="flex items-center gap-2">
          <div className="font-medium">{author}</div>
          <div className="text-gray-500 text-xs dark:text-gray-400">
            <TimeAgo createdAt={createdAt} side="bottom" />
          </div>
        </div>
        <div className="prose prose-stone">
          <p>{comment}</p>
        </div>
        <div className="flex items-center gap-4">
          <SimpleTooltip content="Vote" side="bottom">
            <VoteButton
              initialState={initialVoteState}
              voteAction={voteAction}
              unvoteAction={unvoteAction}
            />
          </SimpleTooltip>
          <SimpleTooltip content="Comment" side="bottom">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => showNewComment && setShowNewComment(true)}
              disabled={newCommentDisabled}
            >
              <ChatBubbleIcon className="w-4 h-4" />
              <span className="sr-only">Reply</span>
            </Button>
          </SimpleTooltip>
        </div>
      </div>
      {showNewComment && (
        <NewComment
          textAreaRef={newCommentTextAreaRef}
          parentRkey={rkey}
          autoFocus
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
                    Continue
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          }
        />
      )}
    </article>
  );
}

export function NewComment({
  autoFocus = false,
  parentRkey,
  extraButton,
  textAreaRef,
}: {
  parentRkey: string;
  autoFocus?: boolean;
  extraButton?: React.ReactNode;
  textAreaRef?: React.RefObject<HTMLTextAreaElement>;
}) {
  return (
    <form action={createCommentAction} className="flex items-center gap-2">
      <div className="flex-1">
        <Textarea
          autoFocus={autoFocus}
          name="comment"
          ref={textAreaRef}
          placeholder="Write a comment..."
          className="resize-none rounded-2xl border border-gray-200 p-3 shadow-sm focus:border-primary focus:ring-primary dark:border-gray-800 dark:bg-gray-950 dark:focus:border-primary"
        />
        <input type="hidden" name="subjectRkey" value={parentRkey} />
      </div>
      <Button className="flex flex-row gap-2">
        <ChatBubbleIcon className="w-4 h-4" /> Post
      </Button>
      {extraButton}
    </form>
  );
}
