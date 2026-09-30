<script lang="ts">
  import { tick } from 'svelte';
  import { activeLineIndex, currentTrack, lineProgress, lyrics } from '../stores/playback.js';
  import { displaySettings } from '../stores/display-settings.js';
  import LyricsLine from './LyricsLine.svelte';

  let viewportHeight = 120;
  let scrollY = 0;
  let listEl: HTMLElement | null = null;
  let lineElements: HTMLElement[] = [];

  $: if ($lyrics) {
    lineElements = [];
  }

  // 3-Line Sliding Window
  $: visibleTripleLines = (() => {
    if (!$lyrics || $lyrics.length === 0) return [];

    if ($activeLineIndex < 0) {
      return [
        { key: 'intro-prev', line: null, isPast: true, isActive: false },
        { key: 'intro-curr', line: { timeMs: 0, text: '♪ ... ♪' }, isPast: false, isActive: true },
        { key: 'intro-next', line: $lyrics[0], isPast: false, isActive: false },
      ];
    }

    const prev = $activeLineIndex > 0 ? $lyrics[$activeLineIndex - 1] : null;
    const curr = $lyrics[$activeLineIndex];
    const next = $activeLineIndex + 1 < $lyrics.length ? $lyrics[$activeLineIndex + 1] : null;

    return [
      { key: prev ? `line-${$activeLineIndex - 1}` : 'empty-prev', line: prev, isPast: true, isActive: false },
      { key: `line-${$activeLineIndex}`, line: curr, isPast: false, isActive: true },
      { key: next ? `line-${$activeLineIndex + 1}` : 'empty-next', line: next, isPast: false, isActive: false }
    ];
  })();

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

  // Continuous Scroller positioning
  async function updateScroll() {
    await tick();
    if ($displaySettings.lineMode !== 'scroller' || !listEl || $activeLineIndex < 0 || !lineElements[$activeLineIndex]) {
      scrollY = 0;
      return;
    }
    const activeEl = lineElements[$activeLineIndex];
    if (activeEl) {
      const lineCenter = activeEl.offsetTop + activeEl.offsetHeight / 2;
      scrollY = Math.max(0, Math.round(lineCenter - viewportHeight / 2));
    }
  }

  $: if ($displaySettings.lineMode === 'scroller' && ($activeLineIndex !== undefined || viewportHeight)) {
    void updateScroll();
  }
</script>

<div
  bind:clientHeight={viewportHeight}
  class="relative flex-1 w-full min-h-[70px] overflow-hidden no-scrollbar flex flex-col justify-center {alignClass}"
  style="
    mask-image: linear-gradient(to bottom, transparent 0%, black 5%, black 95%, transparent 100%);
    -webkit-mask-image: linear-gradient(to bottom, transparent 0%, black 5%, black 95%, transparent 100%);
  "
>
  {#if $lyrics.length === 0}
    <div class="h-full flex flex-col items-center justify-center text-white/40 text-xs gap-1.5 py-2">
      <span class="text-xl animate-pulse">♪</span>
      <span>{$currentTrack ? 'No synchronized lyrics found' : 'Waiting for Spotify playback...'}</span>
    </div>

  {:else if $displaySettings.lineMode === 'single'}
    <!-- 1-Line Mode: Only active line dead-center -->
    <div class="w-full flex flex-col justify-center {alignClass} select-none">
      {#if $activeLineIndex >= 0 && $lyrics[$activeLineIndex]}
        <LyricsLine
          text={$lyrics[$activeLineIndex].text}
          isActive={true}
          isPast={false}
          progress={$lineProgress}
        />
      {:else}
        <p class="text-base text-white/30 italic">♪ Music playing ♪</p>
      {/if}
    </div>

  {:else if $displaySettings.lineMode === 'triple'}
    <!-- 3-Line Mode: Sliding window with guaranteed dead-center active line -->
    <div class="w-full flex flex-col justify-center {alignClass} {spacingClass} select-none transition-all duration-300">
      {#each visibleTripleLines as item (item.key)}
        <div class="w-full flex {alignClass} transition-all duration-300">
          {#if item.line}
            <LyricsLine
              text={item.line.text}
              isActive={item.isActive}
              isPast={item.isPast}
              progress={item.isActive ? $lineProgress : 0}
            />
          {:else}
            <!-- Transparent spacer preserving vertical symmetry -->
            <div class="py-2 px-4 invisible select-none">
              <p class="text-base md:text-lg">&nbsp;</p>
            </div>
          {/if}
        </div>
      {/each}
    </div>

  {:else}
    <!-- Continuous Scroller Mode -->
    <div
      bind:this={listEl}
      class="relative w-full flex flex-col {alignClass} will-change-transform transition-transform duration-350 ease-out"
      style="transform: translate3d(0, -{scrollY}px, 0);"
    >
      <div style="height: {Math.max(0, Math.round(viewportHeight / 2 - 22))}px; flex-shrink: 0;"></div>

      {#each $lyrics as line, idx (line.timeMs)}
        <div
          bind:this={lineElements[idx]}
          class="w-full flex {alignClass} shrink-0"
        >
          <LyricsLine
            text={line.text}
            isActive={idx === $activeLineIndex}
            isPast={idx < $activeLineIndex}
            progress={idx === $activeLineIndex ? $lineProgress : 0}
          />
        </div>
      {/each}

      <div style="height: {Math.max(0, Math.round(viewportHeight / 2 - 22))}px; flex-shrink: 0;"></div>
    </div>
  {/if}
</div>
