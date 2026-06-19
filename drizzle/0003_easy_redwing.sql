CREATE TABLE `catches` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`spot_id` text DEFAULT 'ile-dyeu' NOT NULL,
	`caught_at` integer NOT NULL,
	`length_cm` real NOT NULL,
	`weight_est_g` integer NOT NULL,
	`technique` text,
	`lure_bait` text,
	`released` integer DEFAULT false NOT NULL,
	`conditions_json` text,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
