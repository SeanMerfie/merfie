<script lang="ts">
    import type {HTMLInputAttributes} from 'svelte/elements';

    let {label, error, datalist, maxLength, value = $bindable(''), ...rest}:
    {label: string; error?: string; datalist?: string[]; maxLength?: number; value?: string} & HTMLInputAttributes = $props();

    let currentLength = $derived(value?.toString().length ?? 0);
    let isAtLimit = $derived(maxLength ? currentLength >= maxLength : false);
    let datalistId = $derived(datalist && (rest.name || rest.id) ? `${rest.name || rest.id}-list` : undefined);
</script>

<fieldset class="fieldset">
    <legend class="fieldset-legend">{label}</legend>
    <label class="input w-full {isAtLimit || error ? 'input-error' : ''}">
        <input
            {...rest}
            maxlength={maxLength}
            bind:value
            list={datalistId}
            class="grow"
        />
        {#if datalist && datalistId}
            <datalist id={datalistId}>
                {#each datalist as item}
                    <option value={item}></option>
                {/each}
            </datalist>
        {/if}
        {#if maxLength}
            <span>{currentLength} / {maxLength}</span>
        {/if}
    </label>
    <p class="label text-error">{error}</p>
</fieldset>
