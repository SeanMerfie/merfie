<script lang="ts">
    interface ContentResponse {
        results: ContentItem[];
        totalPages: number;
        totalCount: number;
        page: number;
    }
    interface ContentItem {
        id: number;
        contentType: ContentType;
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

    // Props
    let items: ContentItem[] = $props();

</script>

{#if items.length === 0}
    <div class="alert alert-info">
        <span>No content to display</span>
    </div>
{:else}
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {#each items as item}
            <div class="card bg-base-100 shadow-xl hover:shadow-2xl transition-shadow">
                <!-- Card Image -->
                {#if item.image}
                    <figure class="relative">
                        <img
                            src={item.image.imagePath}
                            alt={item.image.imageAlt || item.title}
                            class="w-full h-48 object-cover"
                        />
                    </figure>
                {:else}
                    <div class="bg-base-200 h-48 flex items-center justify-center relative">
                    </div>
                {/if}

                <!-- Card Body -->
                <div class="card-body">
                    <h2 class="card-title">
                        {item.title}
                        {#if item.published}
                            <div class="badge badge-success badge-sm">Published</div>
                        {:else}
                            <div class="badge badge-ghost badge-sm">Draft</div>
                        {/if}
                    </h2>

                    {#if item.subtitle}
                        <p class="text-sm text-base-content/70">{item.subtitle}</p>
                    {/if}

                    <!-- Tags -->
                    {#if item.tags.length > 0}
                        <div class="flex flex-wrap gap-1 mt-2">
                            {#each item.tags as tag}
                                <span class="badge badge-outline badge-sm">{tag}</span>
                            {/each}
                        </div>
                    {/if}

                    <!-- Meta -->
                    <div class="flex justify-between items-center text-xs text-base-content/60 mt-2">
                        <time datetime={item.createdAt}>
                            {new Date(item.createdAt).toLocaleDateString()}
                        </time>
                    </div>

                    <!-- Action -->
                    <div class="card-actions justify-end mt-4">
                        <a href={`/${item.contentType}/${item.id}`} class="btn btn-primary btn-sm">
                            View Details
                        </a>
                    </div>
                </div>
            </div>
        {/each}
    </div>
{/if}