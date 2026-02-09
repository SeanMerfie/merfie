import { ActionError, defineAction } from 'astro:actions';
import { z } from 'astro/zod';
import { db, content, campaignDetails, system as systemTable, images, tags, contentTags, eq, or, and, like, exists, inArray, sql } from '@repo/db';
import { SaveOptimizedImage } from './uploads.ts';
import { slugify, addContentAlias, getContentImages, saveContentImages, replaceContentImages } from './utils';
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

export interface FormInputType extends z.ZodType<z.infer<typeof formInputSchema>> {}

const hasFile = (file: File | undefined): file is File => {
    return file !== undefined && file.size > 0;
};

const insertCampaign = async (formData: z.infer<typeof formInputSchema>) => {
    let imagePaths: { full: string; content: string; thumbnail: string } | null = null;
    let slug = slugify(formData.title);

    const existingContent = await db.select().from(content).where(eq(content.slug, slug)).limit(1).then(rows => rows[0]);
    if(existingContent) {
        throw new ActionError({code: 'CONFLICT', message: 'A campaign with this title already exists. Please choose a different title.'});
    }

    if(hasFile(formData.coverImage)) {
       const imageResult = await SaveOptimizedImage(formData.coverImage, `campaigns/${slug}`);
       imagePaths = imageResult;
    }

    // Insert into content table
    const contentResult = await db.insert(content).values({
        slug: slug,
        contentType: 'campaign',
        title: formData.title,
        subtitle: formData.subtitle,
        content: formData.content,
        hiddenContent: formData.hiddenContent,
    }).returning({ id: content.id, slug: content.slug });

    const contentId = contentResult[0].id;

    // Insert campaign-specific details
    await db.insert(campaignDetails).values({
        contentId: contentId,
        systemId: formData.systemId,
        status: formData.status || 'active',
    });

    if(imagePaths) {
        await saveContentImages(imagePaths, contentId, {
            alt: formData.coverImageAlt,
            focalX: formData.coverImageFocalX,
            focalY: formData.coverImageFocalY,
            artist: formData.artistName,
            artistUrl: formData.artistURL
        });
    }
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

    // Update content table
    await db.update(content).set({
        title: formData.title,
        slug: newSlug,
        subtitle: formData.subtitle,
        content: formData.content,
        hiddenContent: formData.hiddenContent,
    }).where(eq(content.id, formData.id));

    // Update campaign details
    await db.update(campaignDetails).set({
        systemId: formData.systemId,
        status: formData.status || 'active',
    }).where(eq(campaignDetails.contentId, formData.id));

    if(hasFile(formData.coverImage)) {
        const imagePaths = await SaveOptimizedImage(formData.coverImage);
        await replaceContentImages(imagePaths, formData.id, {
            alt: formData.coverImageAlt,
            focalX: formData.coverImageFocalX,
            focalY: formData.coverImageFocalY,
            artist: formData.artistName,
            artistUrl: formData.artistURL
        });
    }

    if(formData.tags) {
        await upsertContentTags(formData.id, formData.tags);
    }

    return [{ id: formData.id, slug: newSlug }];
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
              .innerJoin(campaignDetails, eq(content.id, campaignDetails.contentId))
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
};
