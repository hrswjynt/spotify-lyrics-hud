<script lang="ts">
  import { overlayBridge } from '../stores/overlay.js';
  import LyricsScroller from './LyricsScroller.svelte';
  import StatusBadge from './StatusBadge.svelte';
  import TrackHeader from './TrackHeader.svelte';
</script>

<div
  class="relative flex flex-col w-full h-full min-h-0 glass-panel rounded-2xl p-4 gap-3 overflow-hidden select-none border border-white/10"
  style="opacity: {$overlayBridge.opacity};"
>
  <!-- Top track header -->
  <TrackHeader />

  <!-- Middle karaoke lyrics scroller -->
  <LyricsScroller />

  <!-- Bottom status footer -->
  <div class="flex items-center justify-between pt-2 border-t border-white/10 text-xs shrink-0">
    <StatusBadge displayId={$overlayBridge.displayId} />

    <span class="text-[11px] text-white/40 font-mono tracking-tight">
      {$overlayBridge.inputMode === 'passthrough'
        ? 'Clicks pass through to game/app'
        : 'Overlay is interactive'}
    </span>
  </div>
</div>

