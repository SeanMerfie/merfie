import { db, contentAlias, images, eq } from '@repo/db';

export const slugify = (text: string): string => {
    return text
        .toString()
        .toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[^a-zA-Z0-9-]/g, '');
};

export const addContentAlias = async (contentId: number, alias: string) => {
    const existingAlias = await db.select().from(contentAlias).where(eq(contentAlias.slug, alias)).limit(1).then(rows => rows[0]);
    if(!existingAlias) {
        await db.insert(contentAlias).values({
            contentId: contentId,
            slug: alias
        });
    }
};

export const getContentImages = async (contentId: number) => {
    const contentImages = await db.select().from(images).where(eq(images.contentId, contentId));

    // Group by groupId, then key by imageSize
    const grouped = contentImages.reduce((acc, img) => {
        if (!acc[img.groupId]) acc[img.groupId] = {};
        acc[img.groupId][img.imageSize] = img;
        return acc;
    }, {} as Record<string, Record<string, typeof contentImages[0]>>);

    return Object.values(grouped);
};

export interface ImagePaths {
    full: string;
    content: string;
    thumbnail: string;
}

export interface ImageMetadata {
    alt?: string;
    focalX?: number;
    focalY?: number;
    artist?: string;
    artistUrl?: string;
}

export const saveContentImages = async (
    imagePaths: ImagePaths,
    contentId: number,
    metadata: ImageMetadata = {}
) => {
    const groupId = crypto.randomUUID();
    const sizes = ['full', 'content', 'thumbnail'] as const;

    await db.insert(images).values(
        sizes.map(size => ({
            groupId,
            contentId,
            imageSize: size,
            imagePath: imagePaths[size],
            imageAlt: metadata.alt,
            imageFocalX: metadata.focalX,
            imageFocalY: metadata.focalY,
            imageArtist: metadata.artist,
            imageArtistUrl: metadata.artistUrl,
        }))
    );

    return groupId;
};

export const replaceContentImages = async (
    imagePaths: ImagePaths,
    contentId: number,
    metadata: ImageMetadata = {}
) => {
    await db.delete(images).where(eq(images.contentId, contentId));
    return saveContentImages(imagePaths, contentId, metadata);
};
