CREATE TABLE `fit_measurement_records` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`version` int NOT NULL,
	`source` enum('customer_manual','assisted','future_3d_scan','future_lidar_scan','imported_verified') NOT NULL DEFAULT 'customer_manual',
	`registryVersion` int NOT NULL,
	`measurements` json NOT NULL,
	`verification` json,
	`confirmedAt` timestamp NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `fit_measurement_records_id` PRIMARY KEY(`id`),
	CONSTRAINT `fit_measurement_records_user_version_unique` UNIQUE(`userId`,`version`)
);
--> statement-breakpoint
CREATE TABLE `fit_preferences` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`jacketFit` varchar(16),
	`trouserFit` varchar(16),
	`notes` varchar(500),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `fit_preferences_id` PRIMARY KEY(`id`),
	CONSTRAINT `fit_preferences_user_id_unique` UNIQUE(`userId`)
);
--> statement-breakpoint
ALTER TABLE `fit_measurement_records` ADD CONSTRAINT `fit_measurement_records_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `fit_preferences` ADD CONSTRAINT `fit_preferences_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;