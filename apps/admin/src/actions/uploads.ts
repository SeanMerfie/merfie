import { defineAction, ActionError } from 'astro:actions';
import { z } from 'astro:schema';
import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';
import { slugify } from './utils';

export const uploads = {
    uploadImage: defineAction({
        accept: 'form',
        input: z.object({
            image: z.instanceof(File),
            folder: z.string().optional(),
        }),
        handler: async ({ image, folder }) => {
            return await SaveOptimizedImage(image, folder);
        },
    }),
};

const processAndSave = async (
    buffer: Buffer,
    width: number,
    filename: string,
    baseDir: string
): Promise<void> => {
    const optimized = await sharp(buffer)
        .resize({ width, withoutEnlargement: true })
        .webp({ quality: 80 })
        .toBuffer();

    await fs.writeFile(path.join(baseDir, filename), optimized);
};

export const SaveOptimizedImage = async (image: File, folder?: string) => {
    if (folder && (folder.includes('..') || path.isAbsolute(folder))) {
        throw new ActionError({ code: 'BAD_REQUEST', message: 'Invalid folder path' });
    }
    const safeFolder = folder?.replace(/^\/+/, '');

    const inputBuffer = Buffer.from(await image.arrayBuffer());
    const nameOnly = slugify(path.parse(image.name).name);
    const timestamp = Date.now();
    const baseName = `${timestamp}-${nameOnly}`;

    const baseDir = safeFolder
        ? path.join(process.cwd(), 'src', 'assets', 'images', safeFolder)
        : path.join(process.cwd(), 'src', 'assets', 'images');

    await fs.mkdir(baseDir, { recursive: true });

    const sizes = {
        full: { width: 2000, filename: `${baseName}-full.webp` },
        content: { width: 1200, filename: `${baseName}-content.webp` },
        thumbnail: { width: 400, filename: `${baseName}-thumb.webp` },
    };

    await Promise.all([
        processAndSave(inputBuffer, sizes.full.width, sizes.full.filename, baseDir),
        processAndSave(inputBuffer, sizes.content.width, sizes.content.filename, baseDir),
        processAndSave(inputBuffer, sizes.thumbnail.width, sizes.thumbnail.filename, baseDir),
    ]);

    const urlBase = safeFolder ? `/src/assets/images/${safeFolder}` : '/src/assets/images';

    return {
        thumbnail: `${urlBase}/${sizes.thumbnail.filename}`,
        content: `${urlBase}/${sizes.content.filename}`,
        full: `${urlBase}/${sizes.full.filename}`,
    };
}