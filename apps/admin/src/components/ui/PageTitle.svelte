<script lang="ts">
    import type {Snippet} from 'svelte';

    let {title, hvalue = 1, children}: {title: string; hvalue?: 1 | 2 | 3 | 4 | 5 | 6; children?: Snippet} = $props();

    const sizeMap: Record<number, string> = {
        1: 'text-5xl',
        2: 'text-4xl',
        3: 'text-3xl',
        4: 'text-2xl',
        5: 'text-xl',
        6: 'text-lg',
    };

    let sizeClass = $derived(sizeMap[hvalue]);
</script>

<div class="w-full border-b-2 border-content mb-4">
    <div class="flex gap-4 items-center">
        <svelte:element this={`h${hvalue}`} class="{sizeClass} font-bold flex-1">{title}</svelte:element>
        {#if children}
            {@render children()}
        {/if}
    </div>
</div>