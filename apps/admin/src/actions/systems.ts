import { defineAction, ActionError } from 'astro:actions';
import { z } from 'astro/zod';
import { db, systems, campaignDetails, eq, count, sql, asc } from '@repo/db';
import { get } from 'node:http';

type System = typeof systems.$inferSelect;
type CampaignDetail = typeof campaignDetails.$inferSelect;

export const systemsActions = {
    upsertSystem: defineAction({
        accept: 'form',
        input: z.object({
            id: z.number().optional(),
            systemName: z.string().min(2).max(100),
        }),
        handler: async ({ id, systemName }) => {
            if (id) {
                const existingSystem = await getSystemById(id);
                if (!existingSystem) {
                    throw new ActionError({ code: 'NOT_FOUND', message: `System with id ${id} not found` });
                }
                await db.update(systems).set({ name:systemName }).where(eq(systems.id, id));
                return { id, systemName };
            } else {
                const newSystem = await createSystem(systemName);
                return newSystem;
            }
        }
    }),
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
    getAllSystems: defineAction({
        handler: async () => {
            return getAllSystems();
        },
    }),
    getAllSystemsFull: defineAction({
        handler: async () => {
            return getAllSystemsWithCampaignDetails();
        },
    }),
};

export const createSystem = async (name: string): Promise<System> => {
    const existingSystem = await getSystemByName(name);
    if (existingSystem) {
        throw new ActionError({ code: 'CONFLICT', message: `System with name ${name} already exists` });
    }
    const slug = name.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '');
    const result = await db.insert(systems).values({ name, slug }).returning({ id: systems.id, name: systems.name, slug: systems.slug });
    return result[0];
};

export const getSystemById = async (id: number): Promise<System | undefined> => {
    const rows = await db.select().from(systems).where(eq(systems.id, id)).limit(1);
    return rows[0];
};

export const getSystemByName = async (name: string): Promise<System | undefined> => {
    const rows = await db.select().from(systems).where(eq(systems.name, name)).limit(1);
    return rows[0];
};

export const getAllSystems = async (): Promise<System[]> => {
    return db.select().from(systems).orderBy(asc(systems.name));
};

export const getAllSystemsWithCampaignDetails = async (): Promise< { system: System; campaignDetails: CampaignDetail[] }[]> => {
    const rows = await db.select({
        system: systems,
        campaignDetail: campaignDetails,
    }).from(systems).leftJoin(campaignDetails, eq(campaignDetails.systemId, systems.id)).all();
    const results = rows.reduce<Record<number, { system: System; campaignDetails: CampaignDetail[] }>>((acc, row) => {
        const system = row.system;
        const campaignDetail = row.campaignDetail;
        if (!acc[system.id]) {
            acc[system.id] = { system, campaignDetails: [] };
        }
        if (campaignDetail) {
            acc[system.id].campaignDetails.push(campaignDetail);
        }
        return acc;
    }, {});
    return Object.values(results);
};

