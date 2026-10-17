CREATE EXTENSION IF NOT EXISTS vector;
ALTER TABLE "items" ADD COLUMN "item_vector" vector(768);