import { sqliteTable, text, integer, primaryKey } from 'drizzle-orm/sqlite-core';
import { content } from './content';

export const tags = sqliteTable('tags', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  tag: text('tag').notNull().unique(),
  slug: text('slug').notNull().unique(),
});

export const contentTags = sqliteTable('content_tags', {
  contentId: integer('content_id').references(() => content.id, { onDelete: 'cascade' }).notNull(),
  tagId: integer('tag_id').references(() => tags.id).notNull(),
}, (table) => [
    primaryKey({ columns: [table.contentId, table.tagId] }),
]);
