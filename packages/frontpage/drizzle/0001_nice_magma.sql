CREATE TABLE IF NOT EXISTS "beta_users" (
	"id" serial PRIMARY KEY NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"did" text NOT NULL,
	CONSTRAINT "beta_users_did_unique" UNIQUE("did")
);
