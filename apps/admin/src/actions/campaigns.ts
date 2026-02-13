import { ActionError, defineAction } from 'astro:actions';
import { z } from 'astro/zod';
import { db, content, campaignDetails, systems as systemTable, images, tags, contentTags, eq, or, and, like, exists, inArray, sql, count } from '@repo/db';
import { SaveOptimizedImage } from './uploads.ts';
import { slugify, addContentAlias, getContentImages, saveContentImages, replaceContentImages, checkContentAlias } from './utils';
import { upsertContentTags, getContentTags } from './tags.ts';

const formInputSchema = z.object({
    id: z.number().optional(),
    title: z.string().min(1, "Title is required"),
    subtitle: z.string().optional(),
    systemId: z.number().min(0, "System is required"),
    coverImage: z.instanceof(File).optional(),
    coverImageAlt: z.string().optional(),
    coverImageFocalX: z.number().min(0).max(100).optional(),
    coverImageFocalY: z.number().min(0).max(100).optional(),
    artistName: z.string().optional(),
    artistURL: z.string().optional(),
    content: z.string().min(1, "Content is required"),
    hiddenContent: z.string().optional(),
    status: z.string().optional(),
    tags: z.preprocess(
        (val) => typeof val === 'string' ? JSON.parse(val) : val,
        z.array(z.string()).optional()
    ),
})

export interface FormInputType extends z.infer<typeof formInputSchema> {}

const hasFile = (file: File | undefined): file is File => {
    return file !== undefined && file.size > 0;
};

const buildImageMetadata = (formData: FormInputType) => {
    return {
        alt: formData.coverImageAlt,
        focalX: formData.coverImageFocalX,
        focalY: formData.coverImageFocalY,
        artist: formData.artistName,
        artistUrl: formData.artistURL
    };
};

const buildContentFields = (formData: z.infer<typeof formInputSchema>, slug: string) => {
    return {
        slug: slug,
        contentType: 'campaign' as const,
        title: formData.title,
        subtitle: formData.subtitle,
        content: formData.content,
        hiddenContent: formData.hiddenContent,
    };
};

const buildCampaignDetailsFields = (formData: z.infer<typeof formInputSchema>) => {
    return {
        systemId: formData.systemId,
        status: formData.status || 'active',
    };
};

const handleCoverImageUpload = async (
    formData: z.infer<typeof formInputSchema>,
    contentId: number,
    slug: string,
    isUpdate: boolean
): Promise<void> => {
    if (!hasFile(formData.coverImage)) {
        return;
    }

    const imagePaths = await SaveOptimizedImage(
        formData.coverImage,
        `campaigns/${slug}`
    );
    const metadata = buildImageMetadata(formData);

    if (isUpdate) {
        await replaceContentImages(imagePaths, contentId, metadata);
    } else {
        await saveContentImages(imagePaths, contentId, metadata);
    }
};

const insertCampaign = async (formData: z.infer<typeof formInputSchema>) => {
    const slug = slugify(formData.title);

    const existingContent = await db.select().from(content).where(eq(content.slug, slug)).limit(1).then(rows => rows[0]);
    if(existingContent) {
        throw new ActionError({code: 'CONFLICT', message: 'A campaign with this title already exists. Please choose a different title.'});
    }

    // Insert into content table
    const contentResult = await db.insert(content).values(
        buildContentFields(formData, slug)
    ).returning({ id: content.id, slug: content.slug });

    const contentId = contentResult[0].id;

    // Insert campaign-specific details
    await db.insert(campaignDetails).values({
        contentId: contentId,
        ...buildCampaignDetailsFields(formData),
    });

    await handleCoverImageUpload(formData, contentId, slug, false);

    if(formData.tags) {
        await upsertContentTags(contentId, formData.tags);
    }
    return contentResult[0];
};

const updateCampaign = async (formData: z.infer<typeof formInputSchema>) => {
    if(!formData.id) {
        throw new ActionError({code: 'BAD_REQUEST', message: 'Campaign ID is required for update'});
    }

    const newSlug = slugify(formData.title);
    const existingCampaign = await db.select().from(content).where(eq(content.id, formData.id)).limit(1).then(rows => rows[0]);
    if(!existingCampaign) {
        throw new ActionError({code: 'NOT_FOUND', message: 'Campaign not found'});
    }
    if(existingCampaign.slug !== newSlug) {
        addContentAlias(formData.id, existingCampaign.slug);
    }

    console.log('Updating campaign with ID:', formData.id, 'New slug:', newSlug, 'Title:', formData.title, 'System ID:', formData.systemId, 'Status:', formData.status);

    // Update content table
    try {
        await db.update(content).set(
            buildContentFields(formData, newSlug)
        ).where(eq(content.id, formData.id));
    } catch (error) {
        console.error('Error updating content:', error);
        throw new ActionError({code: 'INTERNAL_SERVER_ERROR', message: 'Failed to update campaign content'});
    }

    console.log('Content updated, now updating campaign details and images if needed');

    // Update campaign details
    await db.update(campaignDetails).set(
        buildCampaignDetailsFields(formData)
    ).where(eq(campaignDetails.contentId, formData.id));

    await handleCoverImageUpload(formData, formData.id, newSlug, true);

    if(formData.tags) {
        await upsertContentTags(formData.id, formData.tags);
    }

    return [{ id: formData.id, slug: newSlug }];
};

const upsertCampaign = async (formData: z.infer<typeof formInputSchema>) => {
    const slug = slugify(formData.title);
    if (formData.id) {
        const existingCampaign = await db.select().from(content).where(eq(content.id, formData.id)).limit(1).then(rows => rows[0]);
        if (!existingCampaign) {
            throw new ActionError({ code: 'NOT_FOUND', message: 'Campaign not found for update' });
        }
        if (existingCampaign.slug !== slug) {
            if (!await checkContentAlias(formData.id, 'campaign', slug)) {
                throw new ActionError({ code: 'CONFLICT', message: 'A campaign with this slug already exists. Please choose a different title.' });
            }
            addContentAlias(formData.id, existingCampaign.slug, existingCampaign.contentType);
        }
    }

    const contentResult = await db.insert(content).values(
        buildContentFields(formData, slug)
    ).onConflictDoUpdate({
        target: content.id,
        set: buildContentFields(formData, slug),
    }).returning({ id: content.id, slug: content.slug }).then(rows => rows[0]);

    await db.insert(campaignDetails).values({
        contentId: contentResult.id,
        ...buildCampaignDetailsFields(formData),
    })
    .onConflictDoUpdate({
        target: campaignDetails.contentId,
        set: buildCampaignDetailsFields(formData),
    });
};

export const campaigns = {
    upsertCampaign: defineAction({
        accept: 'form',
        input: formInputSchema,
        handler: async (input) => {
            if (input.id) {
                return updateCampaign(input);
            } else {
                return insertCampaign(input);
            }
        }
    }),
    getCampaignById: defineAction({
        accept: 'json',
        input: z.object({
            id: z.number().min(1, "Campaign ID is required")
        }),
        handler: async (input) => {
            const campaign = await db.select({
                id: content.id,
                slug: content.slug,
                title: content.title,
                subtitle: content.subtitle,
                content: content.content,
                hiddenContent: content.hiddenContent,
                published: content.published,
                createdAt: content.createdAt,
                updatedAt: content.updatedAt,
                publishedAt: content.publishedAt,
                contentType: content.contentType,
                systemId: campaignDetails.systemId,
                status: campaignDetails.status,
            }).from(content)
              .leftJoin(campaignDetails, eq(content.id, campaignDetails.contentId))
              .where(eq(content.id, input.id))
              .limit(1)
              .then(rows => rows[0]);

            if (!campaign) return null;

            const [campaignImages, campaignTags] = await Promise.all([
                getContentImages(input.id),
                getContentTags(input.id)
            ]);
            return { ...campaign, images: campaignImages, tags: campaignTags };
        }
    }),
    getActiveCampaignsSelect: defineAction({
        accept: 'json',
        handler: async () => {
            const campaignsList = await db.select({
                id: content.id,
                name: content.title
            }).from(content)
              .innerJoin(campaignDetails, eq(content.id, campaignDetails.contentId))
              .where(and(
                  eq(content.contentType, 'campaign'),
                  or(eq(campaignDetails.status, 'active'), eq(campaignDetails.status, ""))
              ));
            console.log(campaignsList)
            return campaignsList;
        }
    }),
    getCampaignCountForSystem: defineAction({
        accept: 'json',
        input: z.object({ systemId: z.number().min(0) }),
        handler: async ({ systemId }) => {
            return getCampaignCountForSystem(systemId);
        }
    }),
};

export const getCampaignCountForSystem = async (systemId: number): Promise<number> => {
    const row = await db.select({ count: count().as('count') }).from(campaignDetails).where(eq(campaignDetails.systemId, systemId)).then(r => r[0]);
    return Number(row?.count ?? 0);
};
