<script lang="ts">
    import type {Snippet} from 'svelte';

    let {id, onsubmit, children}: {id: string; onsubmit?: (e: SubmitEvent) => void; children: Snippet} = $props();
</script>

<form {id} {onsubmit}>
    {@render children()}
</form>