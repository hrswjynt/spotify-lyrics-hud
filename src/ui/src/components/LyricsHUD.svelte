<script lang="ts">
  import { overlayBridge } from '../stores/overlay.js';
  import { displaySettings } from '../stores/display-settings.js';
  import LyricsScroller from './LyricsScroller.svelte';
  import StatusBadge from './StatusBadge.svelte';
  import TrackHeader from './TrackHeader.svelte';
  import SettingsModal from './SettingsModal.svelte';

  let isSettingsOpen = false;

  $: bgStyleClass = (() => {
    switch ($displaySettings.backgroundStyle) {
      case 'minimal':
        return 'bg-black/20 backdrop-blur-xs border-white/5 shadow-md';
      case 'solid':
        return 'bg-[#0f0f13] border-white/10 shadow-2xl';
      case 'glass':
      default:
        return 'glass-panel border-white/10 shadow-2xl';
    }
  })();
</script>

<div
  class="relative flex flex-col w-full h-full min-h-0 {bgStyleClass} rounded-2xl p-4 gap-3 overflow-hidden select-none border"
  style="opacity: {$overlayBridge.opacity};"
>
  <!-- Top track header -->
  <TrackHeader onToggleSettings={() => (isSettingsOpen = !isSettingsOpen)} />

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

  <!-- Settings Modal Overlay -->
  <SettingsModal
    isOpen={isSettingsOpen}
    onClose={() => (isSettingsOpen = false)}
  />
</div>

