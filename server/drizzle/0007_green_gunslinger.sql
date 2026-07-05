ALTER TABLE "photos" ALTER COLUMN "ext" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "photos" ADD COLUMN "item_type" text DEFAULT 'image' NOT NULL;--> statement-breakpoint
ALTER TABLE "photos" ADD COLUMN "visible_name" text;