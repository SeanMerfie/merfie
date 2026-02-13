<script lang="ts">
    interface TagOption {
        id: number;
        tag: string;
    }
    let { allTags, initialTags }: { allTags?: TagOption[], initialTags?: TagOption[] } = $props();
    let selectedTags: TagOption[] = $state(initialTags || []);

    function toggleTag(tag: TagOption) {
        console.log('Toggling tag:', tag);
        const index = selectedTags.findIndex(t => t.id === tag.id);
        if (index === -1) {
            selectedTags = [...selectedTags, tag];
        } else {
            selectedTags = selectedTags.filter(t => t.id !== tag.id);
        }

        // Update URL query string
        const url = new URL(window.location.href);
        url.searchParams.delete('tags');
        selectedTags.forEach(t => {
            url.searchParams.append('tags', t.id.toString());
        });
        window.history.pushState({}, '', url);
    }
</script>
<div class="flex flex-wrap gap-2">
    {#each allTags as tag}
        <button
            type="button"
            class="badge {selectedTags.find(t => t.id === tag.id) ? 'badge-primary' : 'badge-neutral'}"
            onclick={() => toggleTag(tag)}
        >
            {tag.tag}
        </button>
    {/each}
</div>
{#if selectedTags.length > 0}
    <div class="mt-4 text-sm">
        <strong>Selected Tag IDs:</strong> {selectedTags.map(t => t.id).join(', ')}
    </div>
{/if}
