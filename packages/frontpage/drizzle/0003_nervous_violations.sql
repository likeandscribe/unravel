ALTER TABLE "comments" ADD COLUMN "rkey" text NOT NULL;--> statement-breakpoint
ALTER TABLE "posts" ADD COLUMN "rkey" text NOT NULL;--> statement-breakpoint
ALTER TABLE "comments" DROP COLUMN IF EXISTS "cid";--> statement-breakpoint
ALTER TABLE "comments" ADD CONSTRAINT "comments_rkey_unique" UNIQUE("rkey");--> statement-breakpoint
ALTER TABLE "posts" ADD CONSTRAINT "posts_rkey_unique" UNIQUE("rkey");--> statement-breakpoint
ALTER TABLE "posts" ADD CONSTRAINT "posts_cid_unique" UNIQUE("cid");