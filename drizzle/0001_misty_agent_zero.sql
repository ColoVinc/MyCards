CREATE TABLE "catalog_cards" (
	"id" text PRIMARY KEY NOT NULL,
	"set_id" text NOT NULL,
	"game" text NOT NULL,
	"name" text NOT NULL,
	"number" text,
	"rarity" text,
	"image_url" text,
	"card_type" text,
	"color" text
);
--> statement-breakpoint
CREATE TABLE "catalog_sets" (
	"id" text PRIMARY KEY NOT NULL,
	"game" text NOT NULL,
	"external_id" text NOT NULL,
	"name" text NOT NULL,
	"logo_url" text,
	"symbol_url" text,
	"card_count" integer DEFAULT 0 NOT NULL,
	"position" integer DEFAULT 0 NOT NULL,
	"cards_synced_at" timestamp
);
--> statement-breakpoint
ALTER TABLE "cards" ALTER COLUMN "back_image_url" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "catalog_cards" ADD CONSTRAINT "catalog_cards_set_id_catalog_sets_id_fk" FOREIGN KEY ("set_id") REFERENCES "public"."catalog_sets"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "catalog_cards_set_idx" ON "catalog_cards" USING btree ("set_id");--> statement-breakpoint
CREATE INDEX "catalog_cards_game_name_idx" ON "catalog_cards" USING btree ("game","name");--> statement-breakpoint
CREATE INDEX "catalog_sets_game_idx" ON "catalog_sets" USING btree ("game");