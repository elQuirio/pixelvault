import {
  pgTable,
  uuid,
  text,
  integer,
  bigint,
  serial,
  timestamp,
  jsonb,
  AnyPgColumn,
  index,
  uniqueIndex,
  vector
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
  size: bigint("size", { mode: "number" }),
  userId: integer('user_id').notNull().references(() => users.id),
  metadata: jsonb('metadata'),
  viewCount: integer('view_count').notNull().default(0),
  lastViewedAt: timestamp('last_viewed_at'),
  itemHash: text("item_hash"),
  itemVector: vector("item_vector", { dimensions: 768 }),
  createdAt: timestamp("created_at").defaultNow(),
  deletedAt: timestamp('deleted_at'),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => new Date()),
}, (table) => [
  index("items_item_hash_idx").on(table.itemHash),
]);


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

export const tags = pgTable('tags', {
  id: serial('id').primaryKey(),
  tagUuid: uuid('tag_uuid').defaultRandom().notNull().unique(),
  userId: integer('user_id').notNull().references((): AnyPgColumn => users.id, {onDelete: 'cascade'}),
  tagName: text('tag_name').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
}, (table) => [
  uniqueIndex("idx_unique_user_tag").on(table.userId, table.tagName),
])


export const itemTags = pgTable('item_tags', {
  id: serial('id').primaryKey(),
  tagId: integer('tag_id').notNull().references((): AnyPgColumn => tags.id, {onDelete: 'cascade'}),
  itemId: integer('item_id').notNull().references((): AnyPgColumn => items.id, {onDelete: 'cascade'}),
  source: text('source').notNull().default('manual'),
  createdAt: timestamp('created_at').defaultNow(),
}, (table) => [
  uniqueIndex("idx_unique_tag_item").on(table.itemId, table.tagId),
  index('item_tags_tag').on(table.tagId),
])


