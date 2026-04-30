CREATE TABLE `card_keys` (
	`id` int AUTO_INCREMENT NOT NULL,
	`keyCode` varchar(64) NOT NULL,
	`maxUses` int NOT NULL DEFAULT 1,
	`usedCount` int NOT NULL DEFAULT 0,
	`expiresAt` timestamp,
	`status` enum('active','used','expired','disabled') NOT NULL DEFAULT 'active',
	`createdBy` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `card_keys_id` PRIMARY KEY(`id`),
	CONSTRAINT `card_keys_keyCode_unique` UNIQUE(`keyCode`)
);
--> statement-breakpoint
CREATE TABLE `proxy_configs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`proxyApiUrl` text NOT NULL,
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `proxy_configs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `registration_results` (
	`id` int AUTO_INCREMENT NOT NULL,
	`taskId` varchar(32) NOT NULL,
	`email` varchar(320) NOT NULL,
	`phone` varchar(20),
	`password` varchar(255) NOT NULL,
	`token` text,
	`success` boolean NOT NULL DEFAULT false,
	`errorMessage` text,
	`logs` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `registration_results_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `registration_tasks` (
	`id` varchar(32) NOT NULL,
	`userId` int NOT NULL,
	`taskName` varchar(255),
	`status` enum('pending','running','completed','cancelled','failed') NOT NULL DEFAULT 'pending',
	`totalAccounts` int NOT NULL,
	`successCount` int NOT NULL DEFAULT 0,
	`failCount` int NOT NULL DEFAULT 0,
	`concurrency` int NOT NULL DEFAULT 5,
	`taskType` enum('single','batch') NOT NULL,
	`proxyApiUrl` text,
	`yesCaptchaKey` varchar(255),
	`inviteCode` varchar(255),
	`utmSource` varchar(255) DEFAULT 'invitation',
	`utmMedium` varchar(255) DEFAULT 'social',
	`utmCampaign` varchar(255) DEFAULT 'copy_link',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`completedAt` timestamp,
	CONSTRAINT `registration_tasks_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `usage_records` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`action` varchar(64) NOT NULL,
	`taskId` varchar(32),
	`details` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `usage_records_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `user_card_bindings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`cardKeyId` int NOT NULL,
	`activatedAt` timestamp NOT NULL DEFAULT (now()),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `user_card_bindings_id` PRIMARY KEY(`id`)
);
