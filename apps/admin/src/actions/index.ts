import { campaigns } from './campaigns';
import { contentActions } from './content';
import { systemsActions } from './systems';
import { tagsActions } from './tags';
import { uploads } from './uploads';

export const server = {
    content: contentActions,
    campaigns,
    systems: systemsActions,
    tags: tagsActions,
    uploads,
};