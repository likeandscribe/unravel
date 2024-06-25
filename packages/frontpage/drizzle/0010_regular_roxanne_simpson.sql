ALTER TABLE "comments" DROP CONSTRAINT "comments_rkey_unique";--> statement-breakpoint
ALTER TABLE "comment_votes" DROP CONSTRAINT "comment_votes_rkey_unique";--> statement-breakpoint
ALTER TABLE "posts" DROP CONSTRAINT "posts_rkey_unique";--> statement-breakpoint
ALTER TABLE "post_votes" DROP CONSTRAINT "post_votes_rkey_unique";--> statement-breakpoint
ALTER TABLE "posts" ADD CONSTRAINT "posts_author_did_rkey_unique" UNIQUE("author_did","rkey");
