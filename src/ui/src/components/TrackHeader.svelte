<script lang="ts">
  import { currentTrack, karaokeMode, playbackState, toggleKaraokeMode, togglePlayPause } from '../stores/playback.js';
  import { formatTimestamp } from '../sync/lyrics-sync.js';

  export let onToggleSettings: () => void = () => {};

  $: progressPercent = $currentTrack && $currentTrack.durationMs > 0
    ? Math.min(100, Math.max(0, ($playbackState.currentTimeMs / $currentTrack.durationMs) * 100))
    : 0;
</script>

<div class="flex flex-col gap-2 w-full pb-3 border-b border-white/10 select-none shrink-0">

  <div class="flex items-center justify-between gap-3">
    <!-- Album art and track info -->
    <div class="flex items-center gap-3 overflow-hidden">
      {#if $currentTrack?.albumArtUrl}
        <img
          src={$currentTrack.albumArtUrl}
          alt={$currentTrack.title}
          class="w-10 h-10 rounded-lg object-cover shadow-md border border-white/10"
        />
      {:else}
        <div class="w-10 h-10 rounded-lg bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-bold text-sm shadow-inner">
          ♫
        </div>
      {/if}

      <div class="flex flex-col min-w-0">
        <h2 class="text-white font-semibold text-sm truncate leading-tight tracking-wide">
          {$currentTrack?.title ?? 'No Track Playing'}
        </h2>
        <p class="text-white/60 text-xs truncate leading-normal">
          {$currentTrack?.artist ?? 'Spotify Sync Ready'}
        </p>
      </div>
    </div>

    <!-- Playback & Feature controls -->
    <div class="flex items-center gap-2">
      <!-- Settings Button -->
      <button
        type="button"
        on:click={onToggleSettings}
        class="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 active:scale-95 text-white/70 hover:text-white flex items-center justify-center transition-all cursor-pointer border border-white/10"
        title="Pengaturan Display"
      >
        <svg class="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
          <path d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.09.63-.09.94s.02.64.07.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z"/>
        </svg>
      </button>

      <!-- Karaoke Mode Toggle Button -->
      <button
        type="button"
        on:click={toggleKaraokeMode}
        class="w-8 h-8 rounded-full flex items-center justify-center transition-all cursor-pointer border {$karaokeMode ? 'bg-emerald-500/25 text-emerald-300 border-emerald-400/50 shadow-[0_0_12px_rgba(52,211,153,0.35)]' : 'bg-white/10 hover:bg-white/20 text-white/40 border-white/10'} active:scale-95"
        title={$karaokeMode ? 'Karaoke Wipe: ON (Click to switch to Solid Glow)' : 'Karaoke Wipe: OFF (Click to switch to Gradient Wipe)'}
      >
        <svg class="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
          <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z"/>
          <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/>
        </svg>
      </button>

      <button
        type="button"
        on:click={togglePlayPause}
        class="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 active:scale-95 text-white flex items-center justify-center transition-all cursor-pointer border border-white/10"
        title={$playbackState.isPlaying ? 'Pause' : 'Play'}
      >
        {#if $playbackState.isPlaying}
          <svg class="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
            <rect x="6" y="4" width="4" height="16" rx="1" />
            <rect x="14" y="4" width="4" height="16" rx="1" />
          </svg>
        {:else}
          <svg class="w-3.5 h-3.5 fill-current translate-x-0.5" viewBox="0 0 24 24">
            <path d="M8 5v14l11-7z" />
          </svg>
        {/if}
      </button>
    </div>
  </div>

  <!-- Progress bar -->
  <div class="flex items-center gap-2 w-full pt-1">
    <span class="text-[10px] font-mono text-white/50 w-7 text-right">
      {formatTimestamp($playbackState.currentTimeMs)}
    </span>
    <div class="relative flex-1 h-1 bg-white/10 rounded-full overflow-hidden">
      <div
        class="absolute left-0 top-0 bottom-0 bg-gradient-to-r from-emerald-400 to-teal-300 rounded-full transition-all duration-100"
        style="width: {progressPercent}%;"
      ></div>
    </div>
    <span class="text-[10px] font-mono text-white/50 w-7">
      {formatTimestamp($currentTrack?.durationMs ?? 0)}
    </span>
  </div>
</div>
