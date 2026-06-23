ALTER TABLE "users" RENAME COLUMN "user_name" TO "name";--> statement-breakpoint
ALTER TABLE "users" RENAME COLUMN "user_email" TO "email";--> statement-breakpoint
ALTER TABLE "users" DROP CONSTRAINT "users_user_name_unique";--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_name_unique" UNIQUE("name");