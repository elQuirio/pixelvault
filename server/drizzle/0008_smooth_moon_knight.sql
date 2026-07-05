ALTER TABLE "photos" RENAME TO "items";--> statement-breakpoint
ALTER TABLE "items" DROP CONSTRAINT "photos_file_uuid_unique";--> statement-breakpoint
ALTER TABLE "items" DROP CONSTRAINT "photos_user_id_users_id_fk";
--> statement-breakpoint
ALTER TABLE "items" ADD CONSTRAINT "items_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "items" ADD CONSTRAINT "items_file_uuid_unique" UNIQUE("file_uuid");