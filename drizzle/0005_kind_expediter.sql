CREATE TABLE `payment_configs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`paymentMethod` enum('alipay','wechat') NOT NULL,
	`appId` varchar(256) NOT NULL,
	`appSecret` varchar(512) NOT NULL,
	`merchantId` varchar(256),
	`merchantKey` varchar(512),
	`publicKey` text,
	`privateKey` text,
	`notifyUrl` varchar(512),
	`returnUrl` varchar(512),
	`isEnabled` boolean NOT NULL DEFAULT false,
	`testMode` boolean NOT NULL DEFAULT true,
	`config` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `payment_configs_id` PRIMARY KEY(`id`),
	CONSTRAINT `payment_configs_paymentMethod_unique` UNIQUE(`paymentMethod`)
);
