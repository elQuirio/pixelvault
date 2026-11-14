ALTER TABLE "tags" ADD COLUMN "tag_uuid" uuid DEFAULT gen_random_uuid() NOT NULL;--> statement-breakpoint
ALTER TABLE "tags" ADD CONSTRAINT "tags_tag_uuid_unique" UNIQUE("tag_uuid");