<script lang="ts">
  import { tick } from 'svelte';
  import { activeLineIndex, currentTrack, lineProgress, lyrics } from '../stores/playback.js';
  import { displaySettings } from '../stores/display-settings.js';
  import type { LineModeOption } from '../stores/display-settings.js';
  import LyricsLine from './LyricsLine.svelte';

  let containerEl: HTMLElement | null = null;

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

  // Native smooth scroll to element ID like an anchor link <a href="#lyric-{idx}">
  async function scrollToActiveLine() {
    await tick();
    if (!containerEl || !$lyrics || $lyrics.length === 0) return;

    const targetIdx = $activeLineIndex >= 0 ? $activeLineIndex : 0;
    const targetEl = document.getElementById(`lyric-${targetIdx}`);
    if (targetEl) {
      if (typeof targetEl.scrollIntoView === 'function') {
        targetEl.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
          inline: 'nearest',
        });
      } else {
        containerEl.scrollTop = targetEl.offsetTop - containerEl.clientHeight / 2;
      }
    }
  }

  $: if (
    $activeLineIndex !== undefined ||
    $displaySettings.lineSpacing ||
    $displaySettings.lineMode ||
    $displaySettings.fontSize
  ) {
    void scrollToActiveLine();
  }
</script>

<div
  bind:this={containerEl}
  class="relative flex-1 w-full min-h-[70px] overflow-y-auto no-scrollbar scroll-smooth"
  style="
    mask-image: linear-gradient(to bottom, transparent 0%, black 16%, black 84%, transparent 100%);
    -webkit-mask-image: linear-gradient(to bottom, transparent 0%, black 16%, black 84%, transparent 100%);
  "
>
  {#if $lyrics.length === 0}
    <div class="h-full flex flex-col items-center justify-center text-white/40 text-xs gap-1.5 py-2">
      <span class="text-xl animate-pulse">♪</span>
      <span>{$currentTrack ? 'No synchronized lyrics found' : 'Waiting for Spotify playback...'}</span>
    </div>

  {:else}
    <!-- Native Scrollable Track with top & bottom padding so line 0 & last line center perfectly -->
    <div class="w-full flex flex-col {alignClass} {spacingClass} py-[45px] select-none">
      {#each $lyrics as line, idx (line.timeMs)}
        <div
          id="lyric-{idx}"
          class="w-full min-h-[34px] flex items-center shrink-0 transition-opacity duration-300 ease-out"
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
