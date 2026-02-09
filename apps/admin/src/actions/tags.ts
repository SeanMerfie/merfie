import { defineAction, ActionError } from 'astro:actions';
import { z } from 'astro/zod';
import { db, tags, contentTags, content, eq, asc } from '@repo/db';
import { slugify } from './utils';

export const tagsActions = {
    getAllTags: defineAction({
        handler: async () => {
            return await getAllTags();
        },
    }),
    getTagsByContentType: defineAction({
        input: z.object({
            contentType: z.string(),
        }),
        handler: async ({ contentType }) => {
            return await getTagsByContentType(contentType);
        },
    }),
    addTag: defineAction({
        accept: 'form',
        input: z.object({
            tag: z.string().min(1).max(100),
        }),
        handler: async ({ tag }) => {
            try {
                return await createTag(tag);
            } catch (error) {
                throw new ActionError({ code: 'CONFLICT', message: 'Tag already exists' });
            }
        },
    }),
};

export const getAllTags = async (): Promise<Array<{ id: number; tag: string; slug: string }>> => {
    return await db.select().from(tags).orderBy(asc(tags.tag)).all();
};

export const getTagsByContentType = async (
    contentType: string
): Promise<Array<{ id: number; tag: string; slug: string }>> => {
    const result = await db
        .selectDistinct({
            id: tags.id,
            tag: tags.tag,
            slug: tags.slug,
        })
        .from(tags)
        .innerJoin(contentTags, eq(tags.id, contentTags.tagId))
        .innerJoin(content, eq(contentTags.contentId, content.id))
        .where(eq(content.contentType, contentType))
        .orderBy(asc(tags.tag));

    return result;
};

export const getTagByName = async (
    tag: string
): Promise<{ id: number; tag: string; slug: string } | undefined> => {
    return await db
        .select()
        .from(tags)
        .where(eq(tags.tag, tag))
        .limit(1)
        .then((rows) => rows[0]);
};

export const createTag = async (
    tag: string
): Promise<{ id: number; tag: string; slug: string }> => {
    const existingTag = await getTagByName(tag);
    if (existingTag) {
        return existingTag
    }
    const slug = slugify(tag);
    const result = await db
        .insert(tags)
        .values({ tag, slug })
        .returning({ id: tags.id, tag: tags.tag, slug: tags.slug });
    return result[0];
};

export const upsertContentTags = async (
    contentId: number,
    tagList: string[]
): Promise<void> => {
    // Delete existing tags for this content
    await db.delete(contentTags).where(eq(contentTags.contentId, contentId));

    if (tagList.length === 0) return;

    // Create or get each tag and collect their IDs
    const tagIds = await Promise.all(
        tagList.map(async (tagName) => {
            const tag = await createTag(tagName);
            return tag.id;
        })
    );

    // Insert content_tags relationships
    await db.insert(contentTags).values(
        tagIds.map(tagId => ({
            contentId,
            tagId,
        }))
    );
};

export const getContentTags = async (
    contentId: number
): Promise<string[]> => {
    const result = await db
        .select({ tag: tags.tag })
        .from(contentTags)
        .innerJoin(tags, eq(contentTags.tagId, tags.id))
        .where(eq(contentTags.contentId, contentId))
        .orderBy(asc(tags.tag));

    return result.map(r => r.tag);
};
