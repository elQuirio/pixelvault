CREATE TABLE "photos" (
	"id" serial PRIMARY KEY NOT NULL,
	"file_uuid" uuid DEFAULT gen_random_uuid() NOT NULL,
	"filename" text NOT NULL,
	"original_name" text,
	"size" integer,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "photos_file_uuid_unique" UNIQUE("file_uuid")
);
