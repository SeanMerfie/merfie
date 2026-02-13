<script lang="ts">
    let {name, label, placeholder = 'Type and press Enter...', options = [], defaultValue = [], error}:
    {name: string; label: string; placeholder?: string; options?: string[]; defaultValue?: string[]; error?: string} = $props();

    let selected: string[] = $state(defaultValue);
    let inputValue = $state('');
    let inputRef: HTMLInputElement | undefined = $state();
    let datalistId = `${name}-datalist`;
    let availableOptions = $derived(options.filter((opt) => !selected.includes(opt)));


    function addItem(value: string) {
        const trimmedValue = value.trim();
        if (trimmedValue && !selected.includes(trimmedValue)) {
            selected = [...selected, trimmedValue];
        }
        inputValue = '';
        inputRef?.focus();
    }
    function removeItem(value: string) {
        selected = selected.filter(item => item !== value);
    }

    function handleKeyDown(e: KeyboardEvent) {
        if (e.key === 'Enter' && inputValue.trim()) {
            e.preventDefault();
            addItem(inputValue);
        }
    }
</script>
<fieldset class="fieldset">
    <legend class="fieldset-legend">{label}</legend>

    <input type="hidden" {name} value={JSON.stringify(selected)} />

    <input
        bind:this={inputRef}
        type="text"
        bind:value={inputValue}
        onkeydown={handleKeyDown}
        {placeholder}
        list={datalistId}
        class="input input-bordered w-full"
    />
    <datalist id={datalistId}>
        {#each availableOptions as option}
            <option value={option} ></option>
        {/each}
    </datalist>
    {#if selected.length > 0}
        <div class="flex flex-wrap gap-2 mt-2">
            {#each selected as item}
                <span class="badge badge-primary gap-1">
                    {item}
                    <button
                        type="button"
                        class="btn btn-ghost btn-xs p-0 h-auto min-h-0"
                        onclick={() => removeItem(item)}
                        aria-label={`Remove ${item}`}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3" fill="none"
                            viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round"
                                stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </span>
            {/each}
        </div>
    {/if}
    {#if error}
        <p class="text-sm text-error mt-1">{error}</p>
    {/if}
</fieldset>