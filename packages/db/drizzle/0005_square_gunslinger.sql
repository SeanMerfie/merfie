CREATE TABLE IF NOT EXISTS `content_fts` (
	`rowid` integer PRIMARY KEY NOT NULL,
	`title` text,
	`subtitle` text,
	`content` text,
	`hidden_content` text,
	`tags` text
);
--> statement-breakpoint
PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_content` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`content_type` text NOT NULL,
	`slug` text NOT NULL,
	`title` text NOT NULL,
	`subtitle` text,
	`content` text,
	`hidden_content` text,
	`published` integer DEFAULT false NOT NULL,
	`created_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	`updated_at` text,
	`published_at` text
);
--> statement-breakpoint
INSERT INTO `__new_content`("id", "content_type", "slug", "title", "subtitle", "content", "hidden_content", "published", "created_at", "updated_at", "published_at") SELECT "id", 'campaign', "slug", "title", "subtitle", "content", "hidden_content", "published", "created_at", "updated_at", "published_at" FROM `content`;--> statement-breakpoint
DROP TABLE `content`;--> statement-breakpoint
ALTER TABLE `__new_content` RENAME TO `content`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE UNIQUE INDEX `content_slug_unique` ON `content` (`slug`);--> statement-breakpoint
CREATE TABLE `__new_content_alias` (
	`slug` text NOT NULL,
	`content_type` text NOT NULL,
	`content_id` integer NOT NULL,
	PRIMARY KEY(`slug`, `content_type`),
	FOREIGN KEY (`content_id`) REFERENCES `content`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new_content_alias`("slug", "content_type", "content_id") SELECT "slug", 'campaign', "content_id" FROM `content_alias`;--> statement-breakpoint
DROP TABLE `content_alias`;--> statement-breakpoint
ALTER TABLE `__new_content_alias` RENAME TO `content_alias`;