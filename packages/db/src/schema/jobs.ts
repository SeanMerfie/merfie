import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

export const jobRuns = sqliteTable('job_runs', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  jobType: text('job_type').notNull(), // e.g., 'mmf_pull_library'
  status: text('status').notNull().default('pending'), // pending, running, completed, failed, cancelled
  progress: text('progress'), // e.g., "50/200 items"
  progressCurrent: integer('progress_current'),
  progressTotal: integer('progress_total'),
  pid: integer('pid'), // process ID for cancellation
  error: text('error'),
  startedAt: text('started_at'),
  completedAt: text('completed_at'),
  createdAt: text('created_at')
    .default(sql`(CURRENT_TIMESTAMP)`)
    .notNull(),
});
