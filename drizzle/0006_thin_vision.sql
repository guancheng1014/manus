CREATE TABLE `email_pool` (
	`id` int AUTO_INCREMENT NOT NULL,
	`email` varchar(320) NOT NULL,
	`password` varchar(255) NOT NULL,
	`status` enum('available','assigned','invalid','registered') NOT NULL DEFAULT 'available',
	`assignedTo` int,
	`registeredAt` timestamp,
	`source` varchar(64) DEFAULT 'outlook_creator',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `email_pool_id` PRIMARY KEY(`id`),
	CONSTRAINT `email_pool_email_unique` UNIQUE(`email`)
);
