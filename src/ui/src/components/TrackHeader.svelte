<script lang="ts">
  import { currentTrack, playbackState, togglePlayPause } from '../stores/playback.js';
  import { formatTimestamp } from '../sync/lyrics-sync.js';

  $: progressPercent = $currentTrack && $currentTrack.durationMs > 0
    ? Math.min(100, Math.max(0, ($playbackState.currentTimeMs / $currentTrack.durationMs) * 100))
    : 0;
</script>

<div class="flex flex-col gap-2 w-full pb-3 border-b border-white/10 select-none">
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

    <!-- Playback controls -->
    <div class="flex items-center gap-2">
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
