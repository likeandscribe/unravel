CREATE TABLE `labelled_profiles` (
	`did` text NOT NULL,
	`labels` text
);

CREATE TABLE `moderation_events` (
	`subject_uri` text NOT NULL,
	`subject_did` text NOT NULL,
	`subject_collection` text,
	`subject_rkey` text,
	`subject_cid` text,
	`created_by` text NOT NULL,
	`created_at` text NOT NULL,
	`labels_added` text,
	`report_type` text
);

CREATE TABLE `reports` (
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
	`labels_added` text
);

CREATE UNIQUE INDEX `labelled_profiles_did_unique` ON `labelled_profiles` (`did`);
