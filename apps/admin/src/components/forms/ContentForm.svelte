<script lang="ts">
    import Form from "@components/ui/Form.svelte";
    import TextInput from "@components/ui/TextInput.svelte";
    import PageTitle from "@components/ui/PageTitle.svelte";
    import Button from "@components/ui/Button.svelte";
    import Modal from "@components/ui/Modal.svelte";
    import { actions } from 'astro:actions';

    let { contentType } : {contentType: string} = $props();
    let isPending = $state(false);
    let formError: string | null = $state(null);
    let isModalOpen = $state(false);

    async function  handleSubmit(e: SubmitEvent) {
        e.preventDefault();
        isPending = true;
        formError = null;

        const formData = new FormData(e.target as HTMLFormElement);
        const result = await actions.content.createContent(formData);
        if (result.error) {
            formError = result.error.message;
            isPending = false;
        } else if (result.data) {
            const data = Array.isArray(result.data) ? result.data[0] : result.data;
            const contnetId = data?.id;
            if (contnetId) {
                window.location.href = `/${contentType}/${contnetId}`;
            }
        }
    }

</script>
<Button
    type="button"
    label={`Add ${contentType}`}
    onclick={() => isModalOpen = true}
    additionalClasses="btn-primary"
/>
<Modal title={`New ${contentType}`} isOpen={isModalOpen} onClose={() => isModalOpen = false}>
    <Form id="content-form" onsubmit={handleSubmit}>
        <input type="hidden" name="contentType" value={contentType} />
        <TextInput name="title" label="Title" required />
        <Button type="submit" 
            label="Save" 
            additionalClasses={isPending ? "btn-disabled" : "btn-primary"}
            disabled={isPending}
        />
    </Form> 
</Modal>
