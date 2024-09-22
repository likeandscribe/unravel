CREATE TABLE `oauth_auth_requests`(
  `state` text NOT NULL,
  `iss` text NOT NULL,
  `did` text NOT NULL,
  `username` text NOT NULL,
  `nonce` text NOT NULL,
  `pkce_verifier` text NOT NULL,
  `dpop_private_jwk` text NOT NULL,
  `dpop_public_jwk` text NOT NULL,
  `expires_at` text NOT NULL,
  `created_at` text NOT NULL
);

--> statement-breakpoint
CREATE TABLE `oauth_sessions`(
  `id` integer PRIMARY KEY NOT NULL,
  `did` text NOT NULL,
  `username` text NOT NULL,
  `iss` text NOT NULL,
  `access_token` text NOT NULL,
  `refresh_token` text NOT NULL,
  `dpop_nonce` text NOT NULL,
  `dpop_private_jwk` text NOT NULL,
  `dpop_public_jwk` text NOT NULL,
  `expires_at` text NOT NULL,
  `created_at` text NOT NULL
);

--> statement-breakpoint
CREATE UNIQUE INDEX `oauth_auth_requests_state_unique` ON `oauth_auth_requests`(`state`);
