"use client";

import { Button } from "@/lib/components/ui/button";
import { cn } from "@/lib/utils";
import { ChevronUpIcon } from "@radix-ui/react-icons";
import { useState } from "react";

export type VoteButtonState = "voted" | "unvoted" | "authored";

type VoteButtonProps = {
  voteAction: () => Promise<void>;
  unvoteAction: () => Promise<void>;
  initialState: VoteButtonState;
  votes?: number;
};

export function VoteButton({
  voteAction,
  unvoteAction,
  initialState,
  votes,
}: VoteButtonProps) {
  // TODO: useOptimistic here to fix cached vote count bug
  const [hasVoted, setHasVoted] = useState(
    initialState === "voted" || initialState === "authored",
  );
  return (
    <form
      // Action or unSubmit won't be triggered if you're an author because the button is disabled in that case
      action={hasVoted ? unvoteAction : voteAction}
      onSubmit={(e) => {
        e.preventDefault();
        if (hasVoted) {
          unvoteAction();
          setHasVoted(false);
        } else {
          voteAction();
          setHasVoted(true);
        }
      }}
      className="contents"
    >
      <Button
        variant="ghost"
        size="icon"
        disabled={initialState === "authored"}
        name={hasVoted ? "unvote" : "vote"}
      >
        <ChevronUpIcon
          className={cn(
            "w-5 h-5",
            hasVoted && "text-yellow-500 group-disabled:text-yellow-500",
          )}
        />
      </Button>
      {votes !== undefined && (
        <span className="font-medium">
          {votes + Number(initialState !== "authored" && hasVoted)}
        </span>
      )}
    </form>
  );
}
