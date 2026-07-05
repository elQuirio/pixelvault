import {
  pgTable,
  uuid,
  text,
  integer,
  serial,
  timestamp,
  jsonb,
  AnyPgColumn
} from "drizzle-orm/pg-core";

export const items = pgTable("items", {
  id: serial("id").primaryKey(),
  fileUuid: uuid("file_uuid").defaultRandom().notNull().unique(),
  parentId: integer('parent_id').references((): AnyPgColumn => items.id),
  itemType: text('item_type').notNull().default('image'),
  ext: text("ext"),
  originalName: text("original_name"),
  visibleName: text('visible_name'),
  size: integer("size"),
  userId: integer('user_id').notNull().references(() => users.id),
  metadata: jsonb('metadata'),
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