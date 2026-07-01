CREATE TABLE `catch_companions` (
	`catch_id` text NOT NULL,
	`user_id` text NOT NULL,
	PRIMARY KEY(`catch_id`, `user_id`),
	FOREIGN KEY (`catch_id`) REFERENCES `catches`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
ALTER TABLE `catches` ADD `place` text;--> statement-breakpoint
ALTER TABLE `catches` ADD `tide_trend` text;--> statement-breakpoint
ALTER TABLE `catches` ADD `coefficient` integer;--> statement-breakpoint
ALTER TABLE `catches` ADD `temp_c` real;--> statement-breakpoint
ALTER TABLE `catches` ADD `weather_note` text;--> statement-breakpoint
ALTER TABLE `catches` ADD `from_boat` integer DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `catches` ADD `companions_text` text;--> statement-breakpoint
ALTER TABLE `catches` ADD `lat` real;--> statement-breakpoint
ALTER TABLE `catches` ADD `lng` real;--> statement-breakpoint
ALTER TABLE `catches` ADD `photo` text;--> statement-breakpoint
ALTER TABLE `catches` ADD `notes` text;