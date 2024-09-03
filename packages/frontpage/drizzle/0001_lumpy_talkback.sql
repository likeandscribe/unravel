CREATE TABLE `oauth_auth_requests` (
	`state` text NOT NULL,
	`iss` text NOT NULL,
	`did` text NOT NULL,
	`username` text NOT NULL,
	`nonce` text NOT NULL,
	`pkce_verifier` text NOT NULL,
	`dpop_private_jwk` text NOT NULL,
	`dpop_public_jwk` text NOT NULL,
	`created_at` text DEFAULT (CURRENT_DATE) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `oauth_sessions` (
	`did` text PRIMARY KEY NOT NULL,
	`username` text NOT NULL,
	`iss` text NOT NULL,
	`access_token` text NOT NULL,
	`refresh_token` text NOT NULL,
	`dpop_nonce` text NOT NULL,
	`dpop_private_jwk` text NOT NULL,
	`dpop_public_jwk` text NOT NULL
);
--> statement-breakpoint
/*
 SQLite does not support "Drop default from column" out of the box, we do not generate automatic migration for that, so it has to be done manually
 Please refer to: https://www.techonthenet.com/sqlite/tables/alter_table.php
                  https://www.sqlite.org/lang_altertable.html
                  https://stackoverflow.com/questions/2083543/modify-a-columns-type-in-sqlite3

 Due to that we don't generate migration automatically and it has to be done manually
*/--> statement-breakpoint
CREATE UNIQUE INDEX `oauth_auth_requests_state_unique` ON `oauth_auth_requests` (`state`);
