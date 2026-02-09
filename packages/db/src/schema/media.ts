import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';
import { content } from './content';

export const images = sqliteTable('media_images', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  groupId: text('group_id').notNull(),
  contentId: integer('content_id').references(() => content.id, { onDelete: 'cascade' }).notNull(),
  imageSize: text('image_size').notNull(),
  imagePath: text('image_path').notNull(),
  imageAlt: text('image_alt'),
  imageFocalX: integer('image_focal_x'),
  imageFocalY: integer('image_focal_y'),
  imageArtist: text('image_artist'),
  imageArtistUrl: text('image_artist_url'),
});
