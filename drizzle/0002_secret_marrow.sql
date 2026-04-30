ALTER TABLE `proxy_configs` MODIFY COLUMN `proxyApiUrl` text;--> statement-breakpoint
ALTER TABLE `proxy_configs` ADD `provider` enum('luminati','oxylabs','smartproxy','custom') NOT NULL;--> statement-breakpoint
ALTER TABLE `proxy_configs` ADD `apiKey` varchar(512);--> statement-breakpoint
ALTER TABLE `proxy_configs` ADD `apiSecret` varchar(512);--> statement-breakpoint
ALTER TABLE `proxy_configs` ADD `customProxyList` text;--> statement-breakpoint
ALTER TABLE `proxy_configs` ADD `rotationStrategy` enum('round_robin','random','weighted','adaptive') DEFAULT 'round_robin' NOT NULL;--> statement-breakpoint
ALTER TABLE `proxy_configs` ADD `rotationFrequency` int DEFAULT 10 NOT NULL;--> statement-breakpoint
ALTER TABLE `proxy_configs` ADD `healthCheckInterval` int DEFAULT 5 NOT NULL;--> statement-breakpoint
ALTER TABLE `proxy_configs` ADD `healthCheckTimeout` int DEFAULT 10 NOT NULL;--> statement-breakpoint
ALTER TABLE `proxy_configs` ADD `enableAutoRotation` boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE `proxy_configs` ADD `enableHealthCheck` boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE `proxy_configs` ADD `maxFailureThreshold` int DEFAULT 3 NOT NULL;