ALTER TABLE "comments" ADD COLUMN "cid" text NOT NULL;--> statement-breakpoint
ALTER TABLE "comments" ADD CONSTRAINT "comments_cid_unique" UNIQUE("cid");