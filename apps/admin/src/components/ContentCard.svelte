<script lang="ts">
    let {title, contentUrl, imageUrl, altText, focusX = 50, focusY = 50, children} :
    {title: string; contentUrl: string; imageUrl?: string; altText?: string; focusX?: number | null; focusY?: number | null; children?: any} = $props();
</script>
<div class="card card-sm bg-base-100 shadow-sm">
    {#if imageUrl}
        <figure class="h-48">
            <img
                src={imageUrl}
                alt={altText || title}
                class="object-cover w-full h-full"
                style="object-position: {focusX}% {focusY}%"
            />
        </figure>
    {/if}
    <div class="card-body">
        <h2 class="card-title">
          <a href={contentUrl} class="link link-hover">
            {title}
          </a>
        </h2>
        {@render children()}
    </div>
</div>