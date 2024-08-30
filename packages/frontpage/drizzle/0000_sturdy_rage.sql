CREATE TABLE `beta_users` (
	`id` integer PRIMARY KEY NOT NULL,
	`created_at` text DEFAULT (CURRENT_DATE) NOT NULL,
	`did` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `comments` (
	`id` integer PRIMARY KEY NOT NULL,
	`rkey` text NOT NULL,
	`cid` text NOT NULL,
	`post_id` integer NOT NULL,
	`body` text(10000) NOT NULL,
	`created_at` text DEFAULT (CURRENT_DATE) NOT NULL,
	`author_did` text NOT NULL,
	`status` text DEFAULT 'live',
	`parent_comment_id` integer,
	FOREIGN KEY (`post_id`) REFERENCES `posts`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`parent_comment_id`) REFERENCES `comments`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `comment_votes` (
	`id` integer PRIMARY KEY NOT NULL,
	`comment_id` integer NOT NULL,
	`created_at` text DEFAULT (CURRENT_DATE) NOT NULL,
	`author_did` text NOT NULL,
	`cid` text NOT NULL,
	`rkey` text NOT NULL,
	FOREIGN KEY (`comment_id`) REFERENCES `comments`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `consumed_offsets` (
	`offset` integer PRIMARY KEY NOT NULL
);
--> statement-breakpoint
CREATE TABLE `posts` (
	`id` integer PRIMARY KEY NOT NULL,
	`rkey` text NOT NULL,
	`cid` text NOT NULL,
	`title` text(300) NOT NULL,
	`url` text(255) NOT NULL,
	`created_at` text DEFAULT (CURRENT_DATE) NOT NULL,
	`author_did` text NOT NULL,
	`status` text DEFAULT 'live'
);
--> statement-breakpoint
CREATE TABLE `post_votes` (
	`id` integer PRIMARY KEY NOT NULL,
	`post_id` integer NOT NULL,
	`created_at` text DEFAULT (CURRENT_DATE) NOT NULL,
	`author_did` text NOT NULL,
	`cid` text NOT NULL,
	`rkey` text NOT NULL,
	FOREIGN KEY (`post_id`) REFERENCES `posts`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `beta_users_did_unique` ON `beta_users` (`did`);--> statement-breakpoint
CREATE UNIQUE INDEX `comments_cid_unique` ON `comments` (`cid`);--> statement-breakpoint
CREATE UNIQUE INDEX `comments_author_did_rkey_unique` ON `comments` (`author_did`,`rkey`);--> statement-breakpoint
CREATE UNIQUE INDEX `comment_votes_cid_unique` ON `comment_votes` (`cid`);--> statement-breakpoint
CREATE UNIQUE INDEX `comment_votes_author_did_rkey_unique` ON `comment_votes` (`author_did`,`rkey`);--> statement-breakpoint
CREATE UNIQUE INDEX `comment_votes_author_did_comment_id_unique` ON `comment_votes` (`author_did`,`comment_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `posts_cid_unique` ON `posts` (`cid`);--> statement-breakpoint
CREATE UNIQUE INDEX `posts_author_did_rkey_unique` ON `posts` (`author_did`,`rkey`);--> statement-breakpoint
CREATE UNIQUE INDEX `post_votes_cid_unique` ON `post_votes` (`cid`);--> statement-breakpoint
CREATE UNIQUE INDEX `post_votes_author_did_rkey_unique` ON `post_votes` (`author_did`,`rkey`);--> statement-breakpoint
CREATE UNIQUE INDEX `post_votes_author_did_post_id_unique` ON `post_votes` (`author_did`,`post_id`);