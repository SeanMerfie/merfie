<script lang="ts">
    import { onMount } from 'svelte';

    // Props
    let { placeholder = 'Search...', queryParam = 'q' }: { placeholder?: string; queryParam?: string } = $props();

    // State
    let searchValue = $state('');
    let inputElement = $state<HTMLInputElement>();

    // Initialize search value from URL on mount
    onMount(() => {
        const params = new URLSearchParams(window.location.search);
        const initialValue = params.get(queryParam);
        if (initialValue) {
            searchValue = initialValue;
        }
    });

    // Update URL with search term
    function updateURL() {
        const url = new URL(window.location.href);

        if (searchValue.trim()) {
            url.searchParams.set(queryParam, searchValue.trim());
        } else {
            url.searchParams.delete(queryParam);
        }

        // Reset to page 1 if page param exists
        if (url.searchParams.has('page')) {
            url.searchParams.set('page', '1');
        }

        window.location.href = url.toString();

        // Trigger a custom event that parent components can listen to
        window.dispatchEvent(new CustomEvent('searchchange', {
            detail: { query: searchValue.trim() }
        }));
    }

    // Handle search on enter key
    function handleKeydown(event: KeyboardEvent) {
        if (event.key === 'Enter') {
            updateURL();
        }
    }

    // Handle search button click
    function handleSearch() {
        updateURL();
    }

    // Handle clear button
    function handleClear() {
        searchValue = '';
        updateURL();
        inputElement?.focus();
    }
</script>

<div class="flex items-center gap-2 mb-4">
    <label class="input flex-1">
        <svg class="h-[1em] opacity-50" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
            <g
            stroke-linejoin="round"
            stroke-linecap="round"
            stroke-width="2.5"
            fill="none"
            stroke="currentColor"
            >
            <circle cx="11" cy="11" r="8"></circle>
            <path d="m21 21-4.3-4.3"></path>
            </g>
        </svg>
        <input
            bind:this={inputElement}
            bind:value={searchValue}
            onkeydown={handleKeydown}
            type="text"
            {placeholder}
        />

        {#if searchValue}
            <button
                onclick={handleClear}
                class="btn btn-square btn-ghost"
                aria-label="Clear search"
            >
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
            </button>
        {/if}
    </label>

    <button
        onclick={handleSearch}
        class="btn btn-primary"
        aria-label="Search"
    >
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        Search
    </button>
</div>
