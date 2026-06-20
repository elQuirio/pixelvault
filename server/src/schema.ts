import {
  pgTable,
  uuid,
  text,
  integer,
  serial,
  timestamp,
} from "drizzle-orm/pg-core";

export const photos = pgTable("photos", {
  id: serial("id").primaryKey(),
  fileUuid: uuid("file_uuid").defaultRandom().notNull().unique(),
  filename: text("filename").notNull(),
  originalName: text("original_name"),
  size: integer("size"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => new Date()),
});
