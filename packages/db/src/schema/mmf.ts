import { sqliteTable, text, integer, primaryKey } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

export const mmfCreator = sqliteTable('mmf_creator', {
  id: integer('id').primaryKey(),
  username: text('username').notNull(),
  name: text('name'),
  url: text('url'),
  createdAt: text('created_at')
    .default(sql`(CURRENT_TIMESTAMP)`)
    .notNull(),
});

export const mmfFiles = sqliteTable('mmf_files', {
  id: integer('id').primaryKey(),
  slug: text('slug').notNull(),
  name: text('name').notNull(),
  description: text('description'),
  creatorId: integer('creator_id').references(() => mmfCreator.id),
  dimensions: text('dimensions'),
  createdAt: text('created_at')
    .default(sql`(CURRENT_TIMESTAMP)`)
    .notNull(),
  updatedAt: text('updated_at')
    .$onUpdate(() => new Date().toISOString()),
});

export const mmfImages = sqliteTable('mmf_images', {
  id: text('id').primaryKey(),
  fileId: integer('file_id').references(() => mmfFiles.id).notNull(),
  thumbnailUrl: text('thumbnail_url'),
  standardUrl: text('standard_url'),
  isPrimary: integer('is_primary', { mode: 'boolean' }).default(false),
});

export const mmfTags = sqliteTable('mmf_tags', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull().unique(),
});

export const mmfFilesTags = sqliteTable('mmf_files_tags', {
  fileId: integer('file_id').references(() => mmfFiles.id).notNull(),
  tagId: integer('tag_id').references(() => mmfTags.id).notNull(),
}, (table) => [
  primaryKey({ columns: [table.fileId, table.tagId] }),
]);
