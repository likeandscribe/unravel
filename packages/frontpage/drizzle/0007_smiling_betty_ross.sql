DO $$
BEGIN
  CREATE TYPE "public"."submission_status" AS ENUM(
    'live',
    'deleted',
    'moderator_hidden'
);
EXCEPTION
  WHEN duplicate_object THEN
    NULL;
END
$$;

--> statement-breakpoint
ALTER TABLE "comments"
  ADD COLUMN "status" "submission_status" DEFAULT 'live';

--> statement-breakpoint
ALTER TABLE "posts"
  ADD COLUMN "status" "submission_status" DEFAULT 'live';
