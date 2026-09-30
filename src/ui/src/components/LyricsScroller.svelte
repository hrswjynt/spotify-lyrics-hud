<script lang="ts">
  import { tick } from 'svelte';
  import { activeLineIndex, currentTrack, lineProgress, lyrics } from '../stores/playback.js';
  import { displaySettings } from '../stores/display-settings.js';
  import type { LineModeOption } from '../stores/display-settings.js';
  import LyricsLine from './LyricsLine.svelte';

  let viewportHeight = 120;
  let scrollY = 0;
  let trackEl: HTMLElement | null = null;
  let lineElements: HTMLElement[] = [];

  $: if ($lyrics) {
    lineElements = [];
  }

  // Spacing class
  $: spacingClass = $displaySettings.lineSpacing === 'compact'
    ? 'gap-1'
    : $displaySettings.lineSpacing === 'relaxed'
    ? 'gap-3'
    : 'gap-2';

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
        if (idx === 0) return 'opacity: 0.7;';
        if (idx === 1) return 'opacity: 0.25;';
        return 'opacity: 0; pointer-events: none;';
      }
      const dist = Math.abs(idx - activeIdx);
      if (dist === 0) return 'opacity: 1;';
      if (dist === 1) return ''; // Controlled by LyricsLine opacity classes
      if (dist === 2) return 'opacity: 0.2;'; // Peripheral preview in top/bottom vignette
      return 'opacity: 0; pointer-events: none;';
    }
    // Continuous Scroller: all lines visible
    return '';
  }

  // Calculate target scroll offset - pure CSS GPU compositor handles the 600ms smooth animation
  async function updateScroll() {
    await tick();
    if (!trackEl || !$lyrics || $lyrics.length === 0) {
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
  class="relative flex-1 w-full min-h-[70px] overflow-hidden no-scrollbar select-none"
  style="
    mask-image: linear-gradient(to bottom, transparent 0%, black 18%, black 82%, transparent 100%);
    -webkit-mask-image: linear-gradient(to bottom, transparent 0%, black 18%, black 82%, transparent 100%);
  "
>
  {#if $lyrics.length === 0}
    <div class="h-full flex flex-col items-center justify-center text-white/40 text-xs gap-1.5 py-2">
      <span class="text-xl animate-pulse">♪</span>
      <span>{$currentTrack ? 'No synchronized lyrics found' : 'Waiting for Spotify playback...'}</span>
    </div>

  {:else}
    <!-- Pure Hardware-Accelerated CSS GPU Track (bypasses CPU JS thread during animation) -->
    <div
      bind:this={trackEl}
      class="w-full flex flex-col {alignClass} {spacingClass}"
      style="
        transform: translate3d(0, -{scrollY}px, 0);
        transition: transform 600ms cubic-bezier(0.33, 1, 0.68, 1);
        will-change: transform;
        backface-visibility: hidden;
      "
    >
      {#each $lyrics as line, idx (line.timeMs)}
        <div
          id="lyric-{idx}"
          bind:this={lineElements[idx]}
          class="w-full min-h-[36px] flex items-center shrink-0 transition-opacity duration-600 ease-out"
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
