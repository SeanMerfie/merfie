import { defineAction, ActionError } from 'astro:actions';
import { z } from 'astro/zod';
import { db, system, campaignDetails, eq, count, sql, asc } from '@repo/db';

type System = { id: number; name: string; slug: string };

export const systems = {
    getSystemById: defineAction({
        accept: 'json',
        input: z.object({
            id: z.number()
        }),
        handler: async ({ id }) => {
            const result = await getSystemById(id);
            if (!result) {
                throw new ActionError({ code: 'NOT_FOUND', message: `System with id ${id} not found` });
            }
            return result;
        }
    }),
    getOrCreateSystem: defineAction({
        accept: 'form',
        input: z.object({
            name: z.string().min(2).max(100),
            createIfNotExists: z.boolean().optional()
        }),
        handler: async ({ name, createIfNotExists }) => {
            const existingSystem = await getSystemByName(name);
            if (existingSystem) {
                return { system: existingSystem, created: false };
            }
            if (createIfNotExists) {
                const newSystem = await createSystem(name);
                return { system: newSystem, created: true };
            }
            throw new ActionError({ code: 'NOT_FOUND', message: `System with name ${name} not found` });
        },
    }),
    getAllSystems: defineAction({
        handler: async () => {
            return getAllSystems();
        },
    }),
    getSystemsWithCampaignCount: defineAction({
        handler: async () => {
            return getSystemsWithCampaignCount();
        },
    }),
    createSystem: defineAction({
        accept: 'form',
        input: z.object({
            name: z.string().min(2).max(100),
        }),
        handler: async ({ name }) => {
            return createSystem(name);
        }
    }),
    deleteSystem: defineAction({
        accept: 'form',
        input: z.object({
            id: z.number(),
        }),
        handler: async ({ id }) => {
            return deleteSystem(id);
        }
    }),
};

export const getSystemById = async (id: number): Promise<System | undefined> => {
    const rows = await db.select().from(system).where(eq(system.id, id)).limit(1);
    return rows[0];
};

export const getSystemByName = async (name: string): Promise<System | undefined> => {
    const rows = await db.select().from(system).where(eq(system.name, name)).limit(1);
    return rows[0];
};

export const createSystem = async (name: string): Promise<System> => {
    const existingSystem = await getSystemByName(name);
    if (existingSystem) {
        throw new ActionError({ code: 'CONFLICT', message: `System with name ${name} already exists` });
    }
    const slug = name.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '');
    const result = await db.insert(system).values({ name, slug }).returning({ id: system.id, name: system.name, slug: system.slug });
    return result[0];
};

export const getAllSystems = async (): Promise<System[]> => {
    return db.select().from(system);
};

export const deleteSystem = async (id: number): Promise<{ deleted: boolean }> => {
    const existing = await getSystemById(id);
    if (!existing) {
        throw new ActionError({ code: 'NOT_FOUND', message: `System with id ${id} not found` });
    }
    await db.delete(system).where(eq(system.id, id));
    return { deleted: true };
};

export const getSystemsWithCampaignCount = async (): Promise<Array<System & { campaignCount: number }>> => {
    const campaignCounts = db
        .select({
            systemId: campaignDetails.systemId,
            count: count().as('count'),
        })
        .from(campaignDetails)
        .groupBy(campaignDetails.systemId)
        .as('campaign_counts');

    return db
        .select({
            id: system.id,
            slug: system.slug,
            name: system.name,
            campaignCount: sql<number>`coalesce(${campaignCounts.count}, 0)`,
        })
        .from(system)
        .leftJoin(campaignCounts, eq(system.id, campaignCounts.systemId))
        .orderBy(asc(system.name));
};
