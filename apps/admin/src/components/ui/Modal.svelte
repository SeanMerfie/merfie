<script lang="ts">
    let {title, isOpen = false, onClose, children} :
    {title: string; isOpen?: boolean; onClose?: () => void; children: any} = $props();
</script>
{#if isOpen}
    <dialog class="modal modal-open">
        <div class="modal-box">
            <h3 class="font-bold text-lg mb-4">{title}</h3>
            <button
                class="btn btn-sm btn-circle btn-ghost absolute right-2 top-2"
                onclick={onClose}
            >
                ✕
            </button>
            {@render children?.()}
        </div>
        <form method="dialog" class="modal-backdrop">
            <button onclick={onClose}>close</button>
        </form>
    </dialog>
{/if}