<script lang="ts">
    import type {Snippet} from 'svelte';
    let {href, children}: {href: string; children: Snippet} = $props();
</script>
<a class="btn btn-outline" href={href}>
    {@render children()}
</a>