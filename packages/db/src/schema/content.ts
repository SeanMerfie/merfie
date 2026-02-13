import { sqliteTable, text, integer, primaryKey } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';
import { mmfFiles } from './mmf';

// Root content table with shared fields
export const content = sqliteTable('content', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  contentType: text('content_type').notNull(), // 'campaign' | 'session' | 'note' | 'miniature'
  slug: text('slug').notNull().unique(),
  title: text('title').notNull(),
  subtitle: text('subtitle'),
  content: text('content'),
  hiddenContent: text('hidden_content'),
  published: integer('published', { mode: 'boolean' }).default(false).notNull(),
  createdAt: text('created_at')
    .default(sql`(CURRENT_TIMESTAMP)`)
    .notNull(),
  updatedAt: text('updated_at')
    .$onUpdate(() => new Date().toISOString()),
  publishedAt: text('published_at'),
});

// Campaign-specific fields
export const campaignDetails = sqliteTable('content_campaign_details', {
  contentId: integer('content_id').primaryKey().references(() => content.id, { onDelete: 'cascade' }),
  systemId: integer('system_id').references(() => systems.id).notNull(),
  status: text('status').default('active').notNull(),
});

// Session-specific fields
export const sessionDetails = sqliteTable('content_session_details', {
  contentId: integer('content_id').primaryKey().references(() => content.id, { onDelete: 'cascade' }),
  campaignId: integer('campaign_id').references(() => content.id).notNull(),
  sessionDate: text('session_date'),
});

// Note-specific fields
export const noteDetails = sqliteTable('content_note_details', {
  contentId: integer('content_id').primaryKey().references(() => content.id, { onDelete: 'cascade' }),
  campaignId: integer('campaign_id').references(() => content.id),
});

// Miniature-specific fields
export const miniatureDetails = sqliteTable('content_miniature_details', {
  contentId: integer('content_id').primaryKey().references(() => content.id, { onDelete: 'cascade' }),
  mmfFileId: integer('mmf_file_id').references(() => mmfFiles.id),
  datePainted: text('date_painted'),
});

// System table (unchanged)
export const systems = sqliteTable('content_systems', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull().unique(),
  slug: text('slug').notNull().unique(),
});

// Content alias - no longer needs contentType
export const contentAlias = sqliteTable('content_alias', {
  slug: text('slug').notNull(),
  contentType: text('content_type').notNull(),
  contentId: integer('content_id').references(() => content.id, { onDelete: 'cascade' }).notNull(),
}, (table) => [
  primaryKey({ columns: [table.slug, table.contentType] }),
]);

export const contentFts = sqliteTable('content_fts', {
  rowid: integer('rowid').primaryKey(),
  title: text('title'),
  subtitle: text('subtitle'),
  content: text('content'),
  hiddenContent: text('hidden_content'),
  tags: text('tags'),
});

// FTS5 Full-Text Search setup SQL
// Run these statements in migrations or during database setup
export const contentFtsSetup = `
  CREATE VIRTUAL TABLE IF NOT EXISTS content_fts USING fts5(
    title,
    subtitle,
    content,
    hidden_content,
    tags,
    content='',
    contentless='delete'
  );
`;

export const contentFtsTriggers = `
  CREATE TRIGGER IF NOT EXISTS content_fts_insert AFTER INSERT ON content BEGIN
    INSERT INTO content_fts(rowid, title, subtitle, content, hidden_content, tags)
    VALUES (
      NEW.id,
      NEW.title,
      COALESCE(NEW.subtitle, ''),
      NEW.content,
      COALESCE(NEW.hidden_content, ''),
      ''
    );
  END;

  CREATE TRIGGER IF NOT EXISTS content_fts_update AFTER UPDATE ON content BEGIN
    UPDATE content_fts SET
      title = NEW.title,
      subtitle = COALESCE(NEW.subtitle, ''),
      content = NEW.content,
      hidden_content = COALESCE(NEW.hidden_content, '')
    WHERE rowid = NEW.id;
  END;

  CREATE TRIGGER IF NOT EXISTS content_fts_delete AFTER DELETE ON content BEGIN
    DELETE FROM content_fts WHERE rowid = OLD.id;
  END;

  CREATE TRIGGER IF NOT EXISTS content_tags_fts_insert AFTER INSERT ON content_tags BEGIN
    UPDATE content_fts SET tags = (
      SELECT GROUP_CONCAT(t.tag, ' ')
      FROM content_tags ct
      JOIN tags t ON t.id = ct.tag_id
      WHERE ct.content_id = NEW.content_id
    ) WHERE rowid = NEW.content_id;
  END;

  CREATE TRIGGER IF NOT EXISTS content_tags_fts_delete AFTER DELETE ON content_tags BEGIN
    UPDATE content_fts SET tags = (
      SELECT COALESCE(GROUP_CONCAT(t.tag, ' '), '')
      FROM content_tags ct
      JOIN tags t ON t.id = ct.tag_id
      WHERE ct.content_id = OLD.content_id
    ) WHERE rowid = OLD.content_id;
  END;
`;
