CREATE TABLE `account_stats` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`totalTasks` int NOT NULL DEFAULT 0,
	`successCount` int NOT NULL DEFAULT 0,
	`failCount` int NOT NULL DEFAULT 0,
	`totalAccounts` int NOT NULL DEFAULT 0,
	`cardKeysUsed` int NOT NULL DEFAULT 0,
	`creditsRemaining` decimal(10,2) NOT NULL DEFAULT '0',
	`lastUpdatedAt` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `account_stats_id` PRIMARY KEY(`id`),
	CONSTRAINT `account_stats_userId_unique` UNIQUE(`userId`)
);
--> statement-breakpoint
CREATE TABLE `activity_logs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`action` varchar(64) NOT NULL,
	`description` text,
	`ipAddress` varchar(45),
	`userAgent` text,
	`details` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `activity_logs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `api_keys` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`keyHash` varchar(255) NOT NULL,
	`keyPrefix` varchar(20) NOT NULL,
	`status` enum('active','revoked') NOT NULL DEFAULT 'active',
	`lastUsedAt` timestamp,
	`expiresAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `api_keys_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `login_history` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`ipAddress` varchar(45) NOT NULL,
	`userAgent` text,
	`deviceName` varchar(255),
	`location` varchar(255),
	`status` enum('success','failed') NOT NULL,
	`failureReason` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `login_history_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `notification_settings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`emailTaskCompleted` boolean NOT NULL DEFAULT true,
	`emailTaskFailed` boolean NOT NULL DEFAULT true,
	`emailCardKeyExpiring` boolean NOT NULL DEFAULT true,
	`emailSystemAnnouncements` boolean NOT NULL DEFAULT true,
	`emailWeeklyReport` boolean NOT NULL DEFAULT false,
	`inAppTaskCompleted` boolean NOT NULL DEFAULT true,
	`inAppTaskFailed` boolean NOT NULL DEFAULT true,
	`inAppCardKeyExpiring` boolean NOT NULL DEFAULT true,
	`inAppSystemAnnouncements` boolean NOT NULL DEFAULT true,
	`smsTaskFailed` boolean NOT NULL DEFAULT false,
	`smsCardKeyExpiring` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `notification_settings_id` PRIMARY KEY(`id`),
	CONSTRAINT `notification_settings_userId_unique` UNIQUE(`userId`)
);
--> statement-breakpoint
CREATE TABLE `security_settings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`twoFactorEnabled` boolean NOT NULL DEFAULT false,
	`twoFactorSecret` varchar(255),
	`lastPasswordChangeAt` timestamp,
	`passwordHash` varchar(255),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `security_settings_id` PRIMARY KEY(`id`),
	CONSTRAINT `security_settings_userId_unique` UNIQUE(`userId`)
);
--> statement-breakpoint
ALTER TABLE `registration_orders` MODIFY COLUMN `amount` decimal(10,2) NOT NULL DEFAULT '0';