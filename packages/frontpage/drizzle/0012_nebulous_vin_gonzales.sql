ALTER TABLE "comment_votes"
  ADD CONSTRAINT "comment_votes_author_did_comment_id_unique" UNIQUE ("author_did", "comment_id");

--> statement-breakpoint
ALTER TABLE "post_votes"
  ADD CONSTRAINT "post_votes_author_did_post_id_unique" UNIQUE ("author_did", "post_id");
