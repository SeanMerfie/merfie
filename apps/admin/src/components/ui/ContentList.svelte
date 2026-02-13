<script lang="ts">
    import { actions } from "astro:actions";
    import ContentCard from "./ContentCard.svelte";
    import Pagination from "./Pagination.svelte";

    interface ContentResponse {
        results: ContentItem[];
        totalPages: number;
        totalCount: number;
        page: number;
    }
    interface ContentItem {
        id: number;
        contentType: string;
        slug: string;
        title: string;
        subtitle: string | null;
        published: boolean;
        createdAt: string;
        updatedAt: string | null;
        tags: string[];
        image: ContentImage | null;
    }

    interface ContentImage {
        imagePath: string;
        imageAlt: string | null;
        imageFocalX: number | null;
        imageFocalY: number | null;
        imageArtist: string | null;
        imageArtistUrl: string | null;
    }
    type ContentType = 'campaign' | 'session' | 'note' | 'miniature';

    let {contentType = null, searchTerm = null, page = 1, pageSize = 18, baseUrl}:
    {contentType?: ContentType | null; searchTerm?: string | null; page?: number; pageSize?: number; baseUrl?: string} = $props();

    let data: ContentResponse | null = $state(null);
    let loading = $state(true);
    let error: string | null = $state(null);

    $effect(() => {
        async function fetchContent() {
            loading = true;
            error = null;

            const result = await actions.content.search({
                contentType,
                searchTerm: searchTerm || null,
                page,
                pageSize,
            });

            if (result.error) {
                error = result.error.message;
            } else {
                data = result.data;
            }
            loading = false;
        }

        fetchContent();
    });

    function getContentUrl(item: ContentItem) {
        if (baseUrl) return `${baseUrl}/${item.id}`;
        return `/${item.contentType}s/${item.id}`;
    }
</script>

{#if loading}
    <div class="flex justify-center p-8">
        <span class="loading loading-spinner loading-lg"></span>
    </div>
{:else if error}
    <div class="alert alert-error">{error}</div>
{:else if !data || data.results.length === 0}
    <div class="alert alert-info">No content found.</div>
{:else}
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
    {#each data.results as item (item.id)}
        <ContentCard
            imageUrl={item.image?.imagePath}
            focusX={item.image?.imageFocalX}
            focusY={item.image?.imageFocalY}
            title={item.title}
            contentUrl={getContentUrl(item)}
        >
            {#if item.subtitle}
                <p class="text-sm opacity-70">{item.subtitle}</p>
            {/if}
            {#if contentType === null}
                <p class="text-xs opacity-50 capitalize">{item.contentType}</p>
            {/if}
            {#if item.tags.length > 0}
                <div class="card-actions mt-2">
                    {#each item.tags as tag}
                        <span class="badge badge-outline badge-sm">{tag}</span>
                    {/each}
                </div>
            {/if}
        </ContentCard>
    {/each}
    </div>
    <Pagination
        currentPage={data.page}
        totalPages={data.totalPages}
        totalCount={data.totalCount}
        {pageSize}
    />
{/if}