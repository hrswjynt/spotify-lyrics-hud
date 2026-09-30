<script lang="ts">
  import { tick } from 'svelte';
  import { activeLineIndex, currentTrack, lineProgress, lyrics } from '../stores/playback.js';
  import { displaySettings } from '../stores/display-settings.js';
  import type { LineModeOption } from '../stores/display-settings.js';
  import LyricsLine from './LyricsLine.svelte';

  let viewportHeight = 120;
  let scrollY = 0;
  let listEl: HTMLElement | null = null;
  let lineElements: HTMLElement[] = [];

  $: if ($lyrics) {
    lineElements = [];
  }

  // Spacing class
  $: spacingClass = $displaySettings.lineSpacing === 'compact'
    ? 'gap-0.5'
    : $displaySettings.lineSpacing === 'relaxed'
    ? 'gap-2.5'
    : 'gap-1.5';

  // Alignment container class
  $: alignClass = $displaySettings.alignment === 'left'
    ? 'items-start'
    : $displaySettings.alignment === 'right'
    ? 'items-end'
    : 'items-center';

  // Visibility and opacity rules per line mode
  function getLineStyle(idx: number, activeIdx: number, mode: LineModeOption): string {
    if (mode === 'single') {
      return idx === activeIdx
        ? 'opacity: 1;'
        : 'opacity: 0; pointer-events: none;';
    }
    if (mode === 'triple') {
      if (activeIdx < 0) {
        return idx === 0 ? 'opacity: 0.6;' : 'opacity: 0; pointer-events: none;';
      }
      const dist = Math.abs(idx - activeIdx);
      return dist <= 1 ? '' : 'opacity: 0; pointer-events: none;';
    }
    // Continuous Scroller: all lines visible
    return '';
  }

  // Smooth GPU-accelerated centering
  async function updateScroll() {
    await tick();
    if (!listEl || !$lyrics || $lyrics.length === 0) {
      scrollY = 0;
      return;
    }

    const targetIdx = $activeLineIndex >= 0 ? $activeLineIndex : 0;
    let targetEl = lineElements[targetIdx];
    if (!targetEl) {
      requestAnimationFrame(() => {
        targetEl = lineElements[targetIdx];
        if (targetEl) {
          const lineCenter = targetEl.offsetTop + targetEl.offsetHeight / 2;
          const targetCenter = $activeLineIndex < 0 ? viewportHeight * 0.72 : viewportHeight / 2;
          scrollY = Math.round(lineCenter - targetCenter);
        }
      });
      return;
    }

    const lineCenter = targetEl.offsetTop + targetEl.offsetHeight / 2;
    const targetCenter = $activeLineIndex < 0 ? viewportHeight * 0.72 : viewportHeight / 2;
    scrollY = Math.round(lineCenter - targetCenter);
  }

  $: if (
    $activeLineIndex !== undefined ||
    viewportHeight ||
    $displaySettings.lineSpacing ||
    $displaySettings.lineMode ||
    $displaySettings.fontSize
  ) {
    void updateScroll();
  }
</script>

<div
  bind:clientHeight={viewportHeight}
  class="relative flex-1 w-full min-h-[70px] overflow-hidden no-scrollbar {alignClass}"
  style="
    mask-image: linear-gradient(to bottom, transparent 0%, black 8%, black 92%, transparent 100%);
    -webkit-mask-image: linear-gradient(to bottom, transparent 0%, black 8%, black 92%, transparent 100%);
  "
>
  {#if $lyrics.length === 0}
    <div class="h-full flex flex-col items-center justify-center text-white/40 text-xs gap-1.5 py-2">
      <span class="text-xl animate-pulse">♪</span>
      <span>{$currentTrack ? 'No synchronized lyrics found' : 'Waiting for Spotify playback...'}</span>
    </div>

  {:else}
    <!-- Unified Smooth Sliding Track -->
    <div
      bind:this={listEl}
      class="relative w-full flex flex-col {alignClass} {spacingClass} will-change-transform select-none"
      style="
        transform: translate3d(0, -{scrollY}px, 0);
        transition: transform 380ms cubic-bezier(0.16, 1, 0.3, 1);
      "
    >
      {#each $lyrics as line, idx (line.timeMs)}
        <div
          bind:this={lineElements[idx]}
          class="w-full flex {alignClass} shrink-0 transition-opacity duration-300"
          style={getLineStyle(idx, $activeLineIndex, $displaySettings.lineMode)}
        >
          <LyricsLine
            text={line.text}
            isActive={idx === $activeLineIndex}
            isPast={idx < $activeLineIndex}
            progress={idx === $activeLineIndex ? $lineProgress : 0}
          />
        </div>
      {/each}
    </div>
  {/if}
</div>
