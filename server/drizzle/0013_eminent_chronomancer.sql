ALTER TABLE "items" ADD COLUMN "item_hash" text;--> statement-breakpoint
CREATE INDEX "items_item_hash_idx" ON "items" USING btree ("item_hash");