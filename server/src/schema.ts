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
  userId: integer('user_id').notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  deletedAt: timestamp('deleted_at'),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => new Date()),
});


export const users = pgTable('users', {
  id: serial("id").primaryKey(),
  name: text('name').notNull().unique(),
  email: text('email').notNull(),
  passwordHash: text('password_hash').notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => new Date()),
})