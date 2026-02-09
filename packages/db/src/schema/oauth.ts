import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

export const oauthTokens = sqliteTable('oauth_tokens', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  provider: text('provider').notNull(), // e.g., 'myminifactory'
  accessToken: text('access_token').notNull(),
  tokenType: text('token_type').default('Bearer'),
  expiresAt: text('expires_at'),
  createdAt: text('created_at')
    .default(sql`(CURRENT_TIMESTAMP)`)
    .notNull(),
});
