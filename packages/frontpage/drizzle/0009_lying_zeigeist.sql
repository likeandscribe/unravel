ALTER TABLE "comments"
  ADD CONSTRAINT "comments_author_did_rkey_unique" UNIQUE ("author_did", "rkey");
