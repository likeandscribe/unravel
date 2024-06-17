ALTER TABLE "comment_votes" ADD COLUMN "cid" text NOT NULL;--> statement-breakpoint
ALTER TABLE "comment_votes" ADD COLUMN "rkey" text NOT NULL;--> statement-breakpoint
ALTER TABLE "post_votes" ADD COLUMN "cid" text NOT NULL;--> statement-breakpoint
ALTER TABLE "post_votes" ADD COLUMN "rkey" text NOT NULL;--> statement-breakpoint
ALTER TABLE "comment_votes" ADD CONSTRAINT "comment_votes_cid_unique" UNIQUE("cid");--> statement-breakpoint
ALTER TABLE "comment_votes" ADD CONSTRAINT "comment_votes_rkey_unique" UNIQUE("rkey");--> statement-breakpoint
ALTER TABLE "post_votes" ADD CONSTRAINT "post_votes_cid_unique" UNIQUE("cid");--> statement-breakpoint
ALTER TABLE "post_votes" ADD CONSTRAINT "post_votes_rkey_unique" UNIQUE("rkey");