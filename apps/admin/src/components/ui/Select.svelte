<script lang="ts">
    let {id, name, label, placeholder, selectedValue, options = []} :
    {id: string; name: string; label: string; placeholder?: string; selectedValue?: string; options?: {value: string; text: string}[]} = $props();
</script>
<fieldset class="fieldset">
    <legend class="fieldset-legend">{label}</legend>
    <select id={id} name={name} value={selectedValue} class="select w-full">
        <option value="none" disabled={true}>{placeholder}</option>
        {#each options as option}
            <option value={option.value}>{option.text}</option>
        {/each}
    </select>
</fieldset>