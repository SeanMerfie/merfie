<script lang="ts">
    import Form from '@components/ui/Form.svelte';
    import PageTitle from '@components/ui/PageTitle.svelte';
    import LinkButton from '@components/ui/LinkButton.svelte';
    import Button from '@components/ui/Button.svelte';
    import TextInput from '@components/ui/TextInput.svelte';
    import Select from '@components/ui/Select.svelte';
    import Modal from '@components/ui/Modal.svelte';
    import FileUpload from '@components/ui/FileUpload.svelte';
    import MultiSelector from '@components/ui/MultiSelector.svelte';
    import MilkdownEditor from '@components/ui/MilkdownCrepeEditor.svelte';
    import { actions } from 'astro:actions';
    import { onMount } from 'svelte';

    interface SystemData {
        id?: number | null;
        name?: string | null;
        slug?: string | null;
    }

    let { systemData }: { systemData?: SystemData} = $props();
    let title = $derived(systemData?.id ? `Editing System ${systemData.name}` : 'Create System');
    let isPending = $state(false);
    let formError: string | null = $state(null);

    async function handleSubmit(e: SubmitEvent) {
        e.preventDefault();
        isPending = true;
        formError = null;

        const formData = new FormData(e.target as HTMLFormElement);
        const result = await actions.systems.upsertSystem(formData);
        if (result.error) {
            formError = result.error.message;
            isPending = false;
        }
        else {
            window.location.href = '/systems';
        }
    }
</script>
<Form id="system-form"onsubmit={handleSubmit}>
    {#if systemData?.id}
        <input type="hidden" name="id" value={systemData.id} />
    {/if}
    <PageTitle title={title} hvalue={1}>
        <Button
            type="submit"
            label={isPending ? "Saving..." : "Save System"}
            additionalClasses={isPending ? "btn-disabled" : "btn-primary"}
            disabled={isPending}
        />
        {#if systemData?.id}
            <Button
                type="button"
                label={isPending ? "Publishing..." : "Publish"}
                additionalClasses={isPending ? "btn-disabled" : "btn-secondary"}
                disabled={isPending}
            />
        {/if}
        <LinkButton href="/systems">Back to Systems</LinkButton>
    </PageTitle>
    {#if formError}
        <div class="error">{formError}</div>
    {/if}
    <TextInput name="systemName" label="System Name" value={systemData?.name||''} required />
</Form>