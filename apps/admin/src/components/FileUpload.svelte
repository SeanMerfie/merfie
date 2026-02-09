<script lang="ts">
    import TextInput from '@components/TextInput.svelte';

    let {imageName, imageAltName, setFocalPoint, focalXName, focalYName, artistNameName, artistURLName, initialImage, initialAlt, initialFocalX, initialFocalY, initialArtistName, initialArtistURL} :
    {imageName: string; imageAltName: string; setFocalPoint?: boolean; focalXName?: string; focalYName?: string; artistNameName?: string; artistURLName?: string; initialImage?: string; initialAlt?: string; initialFocalX?: number | null; initialFocalY?: number | null; initialArtistName?: string | null; initialArtistURL?: string | null} = $props();

    let selectedFile: File | null = $state(null);
    let imagePreview: string | null = $state(initialImage || null);
    let focalpoint = $state({x: initialFocalX ?? 50, y: initialFocalY ?? 50});
    let isFocalPointEnabled = $derived(() => setFocalPoint && focalXName && focalYName);
    let imgRef: HTMLImageElement | undefined = $state();

    $effect(() => {
        const current = imagePreview;
        return () => {
            if (current) URL.revokeObjectURL(current);
        };
    });

    function handleFileChange(e: Event) {
        const input = e.target as HTMLInputElement;
        const file = input.files?.[0];
        if (file) {
            selectedFile = file;
            imagePreview = URL.createObjectURL(file);
        }
    };

    function handleImageClick(e: MouseEvent) {
        if (!isFocalPointEnabled || !imgRef) return;

        const rect = imgRef.getBoundingClientRect();

        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        focalpoint = {
            x: Math.round(Math.max(0, Math.min(100, (x / rect.width) * 100))),
            y: Math.round(Math.max(0, Math.min(100, (y / rect.height) * 100)))
        };
    }

    function handleKeyDown(e: KeyboardEvent) {
        if (!isFocalPointEnabled()) return;

        const step = e.shiftKey ? 5 : 1; // Move faster if Shift is held

        if (e.key === 'ArrowUp') focalpoint.y = Math.max(0, focalpoint.y - step);
        if (e.key === 'ArrowDown') focalpoint.y = Math.min(100, focalpoint.y + step);
        if (e.key === 'ArrowLeft') focalpoint.x = Math.max(0, focalpoint.x - step);
        if (e.key === 'ArrowRight') focalpoint.x = Math.min(100, focalpoint.x + step);
    }
</script>
<input name={imageName} type="file" class="file-input w-full" onchange={handleFileChange} accept="image/*"/>
{#if imagePreview}
    <div class='relative inline-block' style='margin-top: 15px;'>
         <button 
            type="button"
            class="p-0 border-none bg-transparent cursor-crosshair block"
            onclick={handleImageClick}
            onkeydown={handleKeyDown}
            aria-label="Set image focal point"
        >
            <img 
                bind:this={imgRef}
                src={imagePreview} 
                alt="Upload preview" 
                style="width: 100%; max-height: 400px; object-fit: contain; display: block;"
            />
        </button>
        {#if isFocalPointEnabled()}
            <div 
                class="absolute w-6 h-6 rounded-full border-2 border-white bg-black/30 shadow-sm pointer-events-none transform -translate-x-1/2 -translate-y-1/2 transition-all duration-75 ease-out"
                style={`left: ${focalpoint.x}%; top: ${focalpoint.y}%;`}
            >
                <div class="absolute top-1/2 left-1/2 w-1.5 h-1.5 bg-white rounded-full transform -translate-x-1/2 -translate-y-1/2"></div>
            </div>
            <input type="hidden" name={focalXName} value={focalpoint.x}/>
            <input type="hidden" name={focalYName} value={focalpoint.y}/>
        {/if}
    </div>
{/if}
<TextInput label='Image Alt' name={imageAltName} placeholder='A descriptive alt text for the image' error='' maxLength={150} value={initialAlt || ''}/>
    {#if artistNameName}
        <TextInput
            label="Artist Name"
            maxlength={100}
            name={artistNameName}
            placeholder="e.g. Jane Doe"
            value={initialArtistName || ''}
        />
    {/if}
    {#if artistURLName}
        <TextInput
            label="Artist URL"
            name={artistURLName}
            placeholder="https://..."
            value={initialArtistURL || ''}
        />
    {/if}