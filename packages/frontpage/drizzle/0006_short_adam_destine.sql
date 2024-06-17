ALTER TABLE "comment_votes"
  ADD CONSTRAINT "comment_votes_author_did_rkey_unique" UNIQUE ("author_did", "rkey");

--> statement-breakpoint
ALTER TABLE "post_votes"
  ADD CONSTRAINT "post_votes_author_did_rkey_unique" UNIQUE ("author_did", "rkey");
