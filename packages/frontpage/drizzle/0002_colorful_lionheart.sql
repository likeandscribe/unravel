/*
 SQLite does not support "Drop default from column" out of the box, we do not generate automatic migration for that, so it has to be done manually
 Please refer to: https://www.techonthenet.com/sqlite/tables/alter_table.php
                  https://www.sqlite.org/lang_altertable.html
                  https://stackoverflow.com/questions/2083543/modify-a-columns-type-in-sqlite3

 Due to that we don't generate migration automatically and it has to be done manually
*/--> statement-breakpoint
ALTER TABLE `oauth_auth_requests` ADD `expires_at` text NOT NULL;--> statement-breakpoint
ALTER TABLE `oauth_sessions` ADD `expires_at` text NOT NULL;--> statement-breakpoint
ALTER TABLE `oauth_sessions` ADD `created_at` text NOT NULL;