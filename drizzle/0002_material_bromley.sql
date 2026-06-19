CREATE TABLE `conditions_cache` (
	`id` text PRIMARY KEY NOT NULL,
	`weather_json` text NOT NULL,
	`fetched_at` integer NOT NULL
);
