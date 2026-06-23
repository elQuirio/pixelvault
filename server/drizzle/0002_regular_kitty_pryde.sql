CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_name" text NOT NULL,
	"user_email" text NOT NULL,
	"password_hash" text NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "users_user_name_unique" UNIQUE("user_name")
);
