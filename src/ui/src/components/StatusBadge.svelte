<script lang="ts">
  import { overlayBridge, toggleClickThrough } from '../stores/overlay.js';

  export let displayId: string = 'primary';
</script>

<div class="flex items-center gap-2 text-xs font-mono select-none">
  <!-- Mode badge -->
  <button
    type="button"
    on:click={toggleClickThrough}
    class="flex items-center gap-1.5 px-2.5 py-1 rounded-full border transition-all duration-200 cursor-pointer
      {$overlayBridge.inputMode === 'passthrough'
        ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/25'
        : 'bg-amber-500/20 border-amber-500/40 text-amber-300 hover:bg-amber-500/30 shadow-[0_0_10px_rgba(245,158,11,0.2)]'}"
    title="Click to toggle click-through mode"
  >
    <span
      class="w-1.5 h-1.5 rounded-full animate-pulse
        {$overlayBridge.inputMode === 'passthrough' ? 'bg-emerald-400' : 'bg-amber-400'}"
    ></span>
    <span class="tracking-wide uppercase font-semibold">
      {$overlayBridge.inputMode === 'passthrough' ? 'Click-Through ON' : 'Interactive'}
    </span>
  </button>

  <!-- Monitor info badge -->
  <span class="px-2 py-1 rounded-full bg-white/5 border border-white/10 text-white/50">
    {displayId}
  </span>
</div>
