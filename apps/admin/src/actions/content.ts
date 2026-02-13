import { defineAction } from 'astro:actions';
import { z } from 'astro/zod';
import { db, content, tags, contentTags, images, eq, and, inArray, sql } from '@repo/db';
import { slugify } from './utils';

const contentTypes = ['campaign', 'session', 'note', 'miniature'] as const;

export const contentActions = {
    search: defineAction({
        accept: 'json',
        input: z.object({
            contentType: z.enum(contentTypes).optional().nullable(),
            searchTerm: z.string().optional().nullable(),
            pageSize: z.number().optional().default(18),
            page: z.number().optional().default(1),
        }),
        handler: async ({ contentType, searchTerm, pageSize, page }) => {
            const limit = pageSize;
            const offset = (page - 1) * limit;

            let results: {
                id: number;
                contentType: string;
                slug: string;
                title: string;
                subtitle: string | null;
                published: boolean;
                createdAt: string;
                updatedAt: string | null;
                totalCount: number;
            }[];

            if (searchTerm) {
                // Use FTS5 MATCH for full-text search
                const ftsQuery = searchTerm.split(/\s+/).map(term => `"${term}"*`).join(' OR ');

                const contentTypeFilter = contentType
                    ? sql`AND c.content_type = ${contentType}`
                    : sql``;

                results = await db.all(sql`
                    SELECT
                        c.id,
                        c.content_type as contentType,
                        c.slug,
                        c.title,
                        c.subtitle,
                        c.published,
                        c.created_at as createdAt,
                        c.updated_at as updatedAt,
                        COUNT(*) OVER() as totalCount
                    FROM content_fts
                    JOIN content c ON c.id = content_fts.rowid
                    WHERE content_fts MATCH ${ftsQuery}
                    ${contentTypeFilter}
                    ORDER BY content_fts.rank
                    LIMIT ${limit}
                    OFFSET ${offset}
                `);
            } else {
                // No search term - return all content with optional type filter
                const contentTypeFilter = contentType
                    ? sql`WHERE c.content_type = ${contentType}`
                    : sql``;

                results = await db.all(sql`
                    SELECT
                        c.id,
                        c.content_type as contentType,
                        c.slug,
                        c.title,
                        c.subtitle,
                        c.published,
                        c.created_at as createdAt,
                        c.updated_at as updatedAt,
                        COUNT(*) OVER() as totalCount
                    FROM content c
                    ${contentTypeFilter}
                    ORDER BY c.created_at DESC
                    LIMIT ${limit}
                    OFFSET ${offset}
                `);
            }

            const totalCount = results[0]?.totalCount ?? 0;
            const totalPages = Math.ceil(totalCount / limit);

            if (results.length === 0) {
                return { results: [], totalPages: 0, totalCount: 0, page };
            }

            const contentIds = results.map(r => r.id);

            // Fetch tags and images in parallel
            const [allTags, allImages] = await Promise.all([
                db.select({
                    contentId: contentTags.contentId,
                    tag: tags.tag
                })
                .from(contentTags)
                .innerJoin(tags, eq(tags.id, contentTags.tagId))
                .where(inArray(contentTags.contentId, contentIds)),

                db.select({
                    contentId: images.contentId,
                    imagePath: images.imagePath,
                    imageAlt: images.imageAlt,
                    imageFocalX: images.imageFocalX,
                    imageFocalY: images.imageFocalY,
                    imageArtist: images.imageArtist,
                    imageArtistUrl: images.imageArtistUrl,
                })
                .from(images)
                .where(and(
                    inArray(images.contentId, contentIds),
                    eq(images.imageSize, 'thumbnail')
                ))
            ]);

            // Group tags by content
            const tagsByContent: Record<number, string[]> = {};
            for (const t of allTags) {
                if (!tagsByContent[t.contentId]) {
                    tagsByContent[t.contentId] = [];
                }
                tagsByContent[t.contentId].push(t.tag);
            }

            // Map images by content (first/only thumbnail per content)
            const imageByContent: Record<number, typeof allImages[0]> = {};
            for (const img of allImages) {
                if (!imageByContent[img.contentId]) {
                    imageByContent[img.contentId] = img;
                }
            }

            const resultsWithMeta = results.map(({ totalCount: _, ...item }) => ({
                ...item,
                tags: tagsByContent[item.id] || [],
                image: imageByContent[item.id] || null,
            }));

            return { results: resultsWithMeta, totalPages, totalCount, page };
        }
    }),
    createContent: defineAction({
        accept: 'form',
        input: z.object({
            title: z.string().min(1),
            contentType: z.enum(contentTypes),
        }), 
        handler: async ({ title, contentType }) => {
            console.log('Creating content with title:', title, 'and type:', contentType);
            const slug = slugify(title);
            const newContentId = await db.insert(content).values({
                title,
                slug,
                contentType,
            }).then(result => result.lastInsertRowid as number);

            return {
                id: newContentId,
                slug,
                contentType
            };
        }
    }),
    getTags: defineAction({
        accept: 'json',
        input: z.object({ contentType: z.enum(contentTypes).optional() }),
        handler: async ({ contentType }) => {
            if (contentType) {
                return (await db.select({ id: tags.id, tag: tags.tag })
                .from(content)
                .innerJoin(contentTags, eq(contentTags.contentId, content.id))
                .innerJoin(tags, eq(tags.id, contentTags.tagId))
                .where(eq(content.contentType, contentType))
                .orderBy(tags.tag)
                .groupBy(tags.id)).map(t => ({ id: t.id, tag: t.tag }))
            }
            return db.select({ id: tags.id, tag: tags.tag }).from(tags);
        }
    }),
};
