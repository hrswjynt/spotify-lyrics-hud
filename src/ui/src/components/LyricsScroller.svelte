<script lang="ts">
  import { activeLineIndex, lineProgress, lyrics } from '../stores/playback.js';
  import LyricsLine from './LyricsLine.svelte';

  const LINE_HEIGHT = 52; // Estimated height per lyric line
  let viewportHeight = 220;

  $: scrollY = $activeLineIndex >= 0
    ? Math.max(0, $activeLineIndex * LINE_HEIGHT - (viewportHeight / 2 - LINE_HEIGHT / 2))
    : 0;
</script>

<div
  bind:clientHeight={viewportHeight}
  class="relative flex-1 w-full overflow-hidden no-scrollbar"
  style="
    mask-image: linear-gradient(to bottom, transparent 0%, black 22%, black 78%, transparent 100%);
    -webkit-mask-image: linear-gradient(to bottom, transparent 0%, black 22%, black 78%, transparent 100%);
  "
>
  {#if $lyrics.length === 0}
    <div class="h-full flex flex-col items-center justify-center text-white/40 text-sm gap-2">
      <span class="text-2xl animate-bounce">♪</span>
      <span>Waiting for Spotify playback...</span>
    </div>
  {:else}
    <div
      class="w-full flex flex-col items-center will-change-transform transition-transform duration-350 ease-out"
      style="transform: translate3d(0, -{scrollY}px, 0);"
    >
      <!-- Top padding space so first line can center -->
      <div style="height: {Math.max(0, viewportHeight / 2 - LINE_HEIGHT / 2)}px;"></div>

      {#each $lyrics as line, idx (line.timeMs)}
        <LyricsLine
          text={line.text}
          isActive={idx === $activeLineIndex}
          isPast={idx < $activeLineIndex}
          progress={idx === $activeLineIndex ? $lineProgress : 0}
        />
      {/each}

      <!-- Bottom padding space so last line can center -->
      <div style="height: {Math.max(0, viewportHeight / 2 - LINE_HEIGHT / 2)}px;"></div>
    </div>
  {/if}
</div>
