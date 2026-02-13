<script lang="ts">
    import { onMount, onDestroy } from 'svelte';
    import { Crepe } from '@milkdown/crepe';
    import { listener, listenerCtx } from '@milkdown/plugin-listener';
    import { imageBlockComponent, imageBlockConfig } from '@milkdown/components/image-block';
    import { upload, uploadConfig, type Uploader } from '@milkdown/kit/plugin/upload';
    import { slash, createSlashView } from '@components/ui/SlashMenu';
    import { commonmark } from '@milkdown/kit/preset/commonmark';
    import { gfm } from '@milkdown/kit/preset/gfm';
    import type { Node } from '@milkdown/kit/prose/model';
    import { actions } from 'astro:actions';

    let {name, defaultValue = '', suggestions = []}: {name: string; defaultValue?: string, suggestions?: any[]} = $props();

    let editorRef: HTMLDivElement | undefined = $state();
    let markdown = $state(defaultValue);
    let crepe: Crepe | undefined;

    async function uploadImage(file: File): Promise<string> {
        const formData = new FormData();
        formData.append('image', file);
        const { data, error } = await actions.uploads.uploadImage(formData);
        if (error) {
            console.error('Upload failed:', error);
            throw new Error('Image upload failed');
        }
        return data.content;
    }

    const uploader: Uploader = async (files, schema) => {
        const images: File[] = [];
        for (let i = 0; i < files.length; i++) {
            const file = files.item(i);
            if (!file) continue;
            if (!file.type.includes('image')) continue;
            images.push(file);
        }
        const nodes: Node[] = await Promise.all(
            images.map(async (image) => {
                const src = await uploadImage(image);
                const alt = image.name;
                return schema.nodes.image.createAndFill({ src, alt }) as Node;
            })
        );
        return nodes;
    };

    onMount(async () => {
        if (!editorRef) return;

        crepe = new Crepe({
            root: editorRef,
            defaultValue,
        });
        crepe.editor
        .config((ctx) => {
            ctx.update(imageBlockConfig.key, (defaultConfig) => ({
                ...defaultConfig,
                onUpload: async (file: File) => {
                    return await uploadImage(file);
                },
            }));
            ctx.update(uploadConfig.key, (prev) => ({
                ...prev,
                uploader,
            }));
            const listenerPlugin = ctx.get(listenerCtx);
            listenerPlugin.markdownUpdated((_ctx, md) => {
                markdown = md;
            });
            ctx.set(slash.key, {
                view: createSlashView(ctx, suggestions),
            });
        })
        .use(listener)
        .use(imageBlockComponent)
        .use(upload)
        .use(slash)
        .use(commonmark)
        .use(gfm);

        await crepe.create();
    });
    onDestroy(() => {
        crepe?.destroy();
    });
</script>
<input type="hidden" {name} value={markdown} />
<div bind:this={editorRef}></div>