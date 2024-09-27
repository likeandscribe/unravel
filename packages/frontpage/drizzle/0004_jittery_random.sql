CREATE TABLE `admin_users` (
	`id` integer PRIMARY KEY NOT NULL,
	`created_at` text NOT NULL,
	`did` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `admin_users_did_unique` ON `admin_users` (`did`);