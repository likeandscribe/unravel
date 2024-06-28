ALTER TABLE "comments"
  ALTER COLUMN "body" SET DATA TYPE varchar(10000);

--> statement-breakpoint
ALTER TABLE "posts"
  ALTER COLUMN "title" SET DATA TYPE varchar(300);

--> statement-breakpoint
ALTER TABLE "posts"
  ALTER COLUMN "url" SET DATA TYPE varchar(255);
