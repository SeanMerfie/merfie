import { campaigns } from './campaigns';
import { contentActions } from './content';
import { systems } from './systems';
import { tagsActions } from './tags';
import { uploads } from './uploads';

export const server = {
    content: contentActions,
    campaigns,
    systems,
    tags: tagsActions,
    uploads,
};