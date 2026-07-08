CREATE TABLE "catalog_sync" (
	"game" text PRIMARY KEY NOT NULL,
	"sets_synced_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "cards" ADD COLUMN "catalog_card_id" text;--> statement-breakpoint
ALTER TABLE "cards" ADD COLUMN "quantity" integer DEFAULT 1 NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "cards_user_catalog_card_idx" ON "cards" USING btree ("user_id","catalog_card_id");