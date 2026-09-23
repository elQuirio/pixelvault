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

import { ITEM_TYPES } from './types/types.js';


export const items = pgTable("items", {
  id: serial("id").primaryKey(),
  fileUuid: uuid("file_uuid").defaultRandom().notNull().unique(),
  parentId: integer('parent_id').references((): AnyPgColumn => items.id, {onDelete: 'set null'}),
  itemType: text('item_type', {enum: ITEM_TYPES}).notNull().default('image'),
  ext: text("ext"),
  originalName: text("original_name"),
  visibleName: text('visible_name').notNull(),
  size: integer("size"),
  userId: integer('user_id').notNull().references(() => users.id),
  metadata: jsonb('metadata'),
  viewCount: integer('view_count').notNull().default(0),
  lastViewedAt: timestamp('last_viewed_at'),
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