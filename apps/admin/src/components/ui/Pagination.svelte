<script lang="ts">
    let {currentPage, totalPages, totalCount, pageSize = 15}:
    {currentPage: number; totalPages: number; totalCount: number; pageSize?: number} = $props();

    function handlePageClick(page: number) {
        console.log('page');
        const url = new URL(window.location.href);
        if (page === 1) {
            url.searchParams.delete('page');
        } else {
            url.searchParams.set('page', page.toString());
        }
        window.location.href = url.toString();
    }

    function getPageNumbers(): (number | 'ellipsis')[] {
        const pages: (number | 'ellipsis')[] = [];
        const showEllipsis = totalPages > 9;

        if (!showEllipsis) {
            return Array.from({length: totalPages}, (_, i) => i + 1);
        }

        pages.push(1);

        if (currentPage > 4) {
            pages.push('ellipsis');
        }

        for (let i = Math.max(2, currentPage - 2); i <= Math.min(totalPages - 1, currentPage + 2); i++) {
            pages.push(i);
        }

        if (currentPage < totalPages - 3) {
            pages.push('ellipsis');
        }

        if (totalPages > 1) {
            pages.push(totalPages);
        }

        return pages;
    }

    let pageNumbers = $derived(getPageNumbers());
    let startItem = $derived((currentPage - 1) * pageSize + 1);
    let endItem = $derived(Math.min(currentPage * pageSize, totalCount));
</script>

{#if totalPages <= 1}
    <p class="text-center text-sm opacity-50">
        Showing {totalCount} item{totalCount !== 1 ? 's' : ''}
    </p>
{:else}
    <div class="flex flex-col items-center gap-2 mt-6">
        <div class="join">
            <button
                class="join-item btn btn-sm"
                disabled={currentPage === 1}
                onclick={() => handlePageClick(currentPage - 1)}
            >
                «
            </button>

            {#each pageNumbers as page, index}
                {#if page === 'ellipsis'}
                    <button class="join-item btn btn-sm btn-disabled">
                        …
                    </button>
                {:else}
                    <button
                        class="join-item btn btn-sm {page === currentPage ? 'btn-active' : ''}"
                        onclick={() => handlePageClick(page)}
                    >
                        {page}
                    </button>
                {/if}
            {/each}

            <button
                class="join-item btn btn-sm"
                disabled={currentPage === totalPages}
                onclick={() => handlePageClick(currentPage + 1)}
            >
                »
            </button>
        </div>

        <p class="text-sm opacity-50">
            Showing {startItem}-{endItem} of {totalCount}
        </p>
    </div>
{/if}
