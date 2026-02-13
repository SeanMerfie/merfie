<script lang="ts">
    let {type = 'button', onclick, disabled = false, label, additionalClasses = ''} :
    {type?: 'button' | 'submit' | 'reset'; onclick?: () => void; disabled?: boolean; label: string; additionalClasses?: string} = $props();
</script>

<button
    {type}
    {onclick}
    {disabled}
    class={`btn ${additionalClasses}`}
>
    {label}
</button>