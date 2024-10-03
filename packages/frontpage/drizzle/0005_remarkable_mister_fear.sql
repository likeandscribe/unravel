DROP TABLE `labelled_profiles`;
--> statement-breakpoint

CREATE TABLE `labelled_profiles` (
	`id` integer PRIMARY KEY NOT NULL,
	`did` text NOT NULL,
	`is_hidden` integer DEFAULT false NOT NULL,
	`labels` text,
	`created_at` text DEFAULT (current_timestamp) NOT NULL,
	`updated_at` text DEFAULT (current_timestamp) NOT NULL
);
--> statement-breakpoint

CREATE UNIQUE INDEX `labelled_profiles_did_unique` ON `labelled_profiles` (`did`);
