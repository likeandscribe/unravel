CREATE TABLE `labelled_profiles` (
	`id` integer PRIMARY KEY NOT NULL,
	`did` text NOT NULL,
	`is_hidden` integer DEFAULT false NOT NULL,
	`labels` text
);
--> statement-breakpoint
CREATE TABLE `moderation_events` (
	`id` integer PRIMARY KEY NOT NULL,
	`subject_uri` text NOT NULL,
	`subject_did` text NOT NULL,
	`subject_collection` text,
	`subject_rkey` text,
	`subject_cid` text,
	`created_by` text NOT NULL,
	`created_at` text NOT NULL,
	`labels_added` text,
	`labels_removed` text,
	`report_type` text
);
--> statement-breakpoint
CREATE TABLE `reports` (
	`id` integer PRIMARY KEY NOT NULL,
	`actioned_at` text,
	`actioned_by` text,
	`subject_uri` text NOT NULL,
	`subject_did` text NOT NULL,
	`subject_collection` text,
	`subject_rkey` text,
	`subject_cid` text,
	`created_by` text NOT NULL,
	`created_at` text NOT NULL,
	`creator_comment` text,
	`report_reason` text
);
--> statement-breakpoint
CREATE UNIQUE INDEX `labelled_profiles_did_unique` ON `labelled_profiles` (`did`);