<script lang="ts">
    import Form from '@components/Form.svelte';
    import PageTitle from '@components/PageTitle.svelte';
    import LinkButton from '@components/LinkButton.svelte';
    import Button from '@components/Button.svelte';
    import TextInput from '@components/TextInput.svelte';
    import Select from '@components/Select.svelte';
    import Modal from '@components/Modal.svelte';
    import FileUpload from '@components/FileUpload.svelte';
    import MultiSelector from '@components/MultiSelector.svelte';
    import MilkdownEditor from '@components/MilkdownCrepeEditor.svelte';
    import { actions } from 'astro:actions';
    import { onMount } from 'svelte';

    interface ImageData {
        id: number;
        groupId: string;
        contentId: number;
        contentType: string;
        imageSize: string;
        imagePath: string;
        imageAlt?: string | null;
        imageFocalX?: number | null;
        imageFocalY?: number | null;
        imageArtist?: string | null;
        imageArtistUrl?: string | null;
    }

    interface ImageGroup {
        full?: ImageData;
        content?: ImageData;
        thumbnail?: ImageData;
    }

    interface CampaignData {
        id?: number | null;
        title?: string | null;
        subtitle?: string | null;
        systemId?: number | null;
        content?: string | null;
        hiddenContent?: string | null;
        images?: ImageGroup[];
        tags?: string[];
        status?: string | null;
    }

    let { campaignData }: { campaignData?: CampaignData} = $props();
    let title = $derived(campaignData?.id ? `Editing Campaign ${campaignData.title}` : 'Create Campaign');
    let isPending = $state(false);
    let formError: string | null = $state(null);
    let systems: { value: string; text: string }[] = $state([]);
    let tags: string[] = $state([]);
    let isModalOpen = $state(false);

    async function handleSubmit(e: SubmitEvent) {
        e.preventDefault();
        isPending = true;
        formError = null;

        const formData = new FormData(e.target as HTMLFormElement);
        const result = await actions.campaigns.upsertCampaign(formData);

        if (result.error) {
            formError = result.error.message;
            isPending = false;
        } else if (result.data) {
            const data = Array.isArray(result.data) ? result.data[0] : result.data;
            const campaignId = data?.id;
            if (campaignId) {
                window.location.href = `/campaigns/${campaignId}`;
            }
        }
    }
    
    onMount(async () => {
        let result = await actions.systems.getAllSystems();
        if (result.data) {
            systems = result.data.map((system: { id: number; name: string }) => ({
                value: system.id.toString(),
                text: system.name,
            }));
        }
        let tagsResult = await actions.tags.getAllTags();
        if (tagsResult.data) {
            tags = tagsResult.data.map((tag: { id: number; tag: string; slug: string }) => tag.tag);
        }
    });
</script>

<Form id="campaign-form" onsubmit={handleSubmit}>
    {#if formError}
        <div class="alert alert-error mb-4">{formError}</div>
    {/if}
    <PageTitle title={title} hvalue={1}>
        <Button
            type="submit"
            label={isPending ? "Saving..." : "Save Campaign"}
            additionalClasses={isPending ? "btn-disabled" : "btn-primary"}
            disabled={isPending}
        />
        {#if campaignData?.id}
            <Button
                type="button"
                label={isPending ? "Publishing..." : "Publish"}
                additionalClasses={isPending ? "btn-disabled" : "btn-secondary"}
                disabled={isPending}
            />
        {/if}
        <LinkButton href="/campaigns">Back to Campaigns</LinkButton>
    </PageTitle>
    {#if campaignData?.id}
        <input type="hidden" name="id" value={campaignData.id} />
    {/if}
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div class="lg:col-span-2 lg:overflow-y-auto flex flex-col gap-6">
            <PageTitle title="Content" hvalue={2} />
            <fieldset class="fieldset">
                <legend class="fieldset-legend">Public Content</legend>
                <MilkdownEditor
                    name="content"
                    defaultValue={campaignData?.content || ""}
                />
            </fieldset>
        </div>
        <div class="flex flex-col gap-2">
            <PageTitle title="Details" hvalue={2} />
            <TextInput
                id="title"
                name="title"
                label="Campaign Title"
                value={campaignData?.title || ""}
                placeholder="Enter campaign title"
                maxLength={100}
                required
            />
            <TextInput
                id="subtitle"
                name="subtitle"
                label="Campaign Subtitle"
                value={campaignData?.subtitle || ""}
                placeholder="Enter campaign subtitle"
                maxLength={100}
                required
            />
            <div class="flex gap-2 items-end">
                <div class="flex-1 w-[80%]">
                    <Select
                        id="systemId"
                        name="systemId"
                        label="System Name"
                        placeholder="Select system"
                        selectedValue={campaignData?.systemId?.toString() || "none"}
                        options={systems}
                    />
                </div>
                <div class="w-[20%] py-1">
                    <Button
                        type="button"
                        label="Add"
                        onclick={() => isModalOpen = true}
                        additionalClasses="btn-primary w-full"
                    />
                </div>
            </div>
            <PageTitle title="Media" hvalue={2} />
            <FileUpload
                imageName="coverImage"
                imageAltName="coverImageAlt"
                setFocalPoint={true}
                focalXName="coverImageFocalX"
                focalYName="coverImageFocalY"
                artistNameName="artistName"
                artistURLName="artistURL"
                initialImage={campaignData?.images?.[0]?.content?.imagePath}
                initialAlt={campaignData?.images?.[0]?.content?.imageAlt ?? undefined}
                initialFocalX={campaignData?.images?.[0]?.content?.imageFocalX}
                initialFocalY={campaignData?.images?.[0]?.content?.imageFocalY}
                initialArtistName={campaignData?.images?.[0]?.content?.imageArtist}
                initialArtistURL={
                    campaignData?.images?.[0]?.content?.imageArtistUrl ?? undefined
                }
            />
            <PageTitle title="Metadata" hvalue={2} />
            <Select
                id="status"
                name="status"
                label="Status"
                placeholder="Select Status"
                selectedValue={campaignData?.status || "active"}
                options={[
                    { value: "Planning", text: "Planning" },
                    { value: "Active", text: "Active" },
                    { value: "On Hold", text: "On Hold" },
                    { value: "Completed", text: "Completed" },
                    { value: "Cancelled", text: "Cancelled" },
                ]}
            />
            <MultiSelector
                name="tags"
                label="Tags"
                placeholder="Type and press Enter to add tags"
                options={tags}
                defaultValue={campaignData?.tags || []} 
            />
        </div>        
    </div>
</Form>
<Modal title="Add System" isOpen={isModalOpen} onClose={() => isModalOpen = false}>
    <p>System addition form goes here.</p>
</Modal>