CREATE TABLE `registration_orders` (
	`id` int AUTO_INCREMENT NOT NULL,
	`orderId` varchar(64) NOT NULL,
	`userId` int NOT NULL,
	`cardKeyId` int NOT NULL,
	`amount` decimal(10,2) NOT NULL,
	`paymentMethod` enum('alipay','wechat') NOT NULL,
	`status` enum('pending','paid','failed','refunded') NOT NULL DEFAULT 'pending',
	`transactionId` varchar(128),
	`quantity` int NOT NULL DEFAULT 1,
	`paidAt` timestamp,
	`refundedAt` timestamp,
	`refundReason` text,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `registration_orders_id` PRIMARY KEY(`id`),
	CONSTRAINT `registration_orders_orderId_unique` UNIQUE(`orderId`)
);
