<script lang="ts">
  export let text: string = '';
  export let isActive: boolean = false;
  export let isPast: boolean = false;
  export let progress: number = 0; // 0.0 to 1.0

  $: fillPercent = Math.min(100, Math.max(0, Math.round(progress * 100)));
</script>

<div
  class="w-full text-center py-2 px-4 transition-all duration-300 ease-out select-none
    {isActive
      ? 'scale-105 font-bold drop-shadow-[0_0_12px_rgba(255,255,255,0.45)]'
      : isPast
      ? 'scale-95 font-medium opacity-35'
      : 'scale-98 font-medium opacity-55 hover:opacity-80'}"
>
  {#if isActive}
    <p
      class="text-xl md:text-2xl tracking-wide leading-relaxed inline-block"
      style="
        background: linear-gradient(to right, #34d399 0%, #38bdf8 {fillPercent}%, #ffffff {fillPercent}%, #ffffff 100%);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
      "
    >
      {text}
    </p>
  {:else}
    <p class="text-base md:text-lg text-white tracking-normal leading-relaxed">
      {text}
    </p>
  {/if}
</div>
