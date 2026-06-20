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
  ext: text("ext").notNull(),
  originalName: text("original_name"),
  size: integer("size"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => new Date()),
});
