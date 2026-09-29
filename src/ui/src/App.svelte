<script lang="ts">
  import { onMount } from 'svelte';
  import LyricsHUD from './components/LyricsHUD.svelte';
  import { overlayBridge, toggleClickThrough } from './stores/overlay.js';
  import {
    playbackState,
    setTrack,
    updateProgress,
  } from './stores/playback.js';
  import { initTauriRuntime } from '../../tauri-bootstrap.js';

  const SAMPLE_TRACK = {
    title: 'Starboy (feat. Daft Punk)',
    artist: 'The Weeknd, Daft Punk',
    album: 'Starboy',
    albumArtUrl: 'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?w=120&auto=format&fit=crop&q=80',
    durationMs: 45000,
  };

  const SAMPLE_LYRICS = [
    { timeMs: 1500, text: "I'm tryna put you in the worst mood, ah" },
    { timeMs: 4800, text: 'P1 cleaner than your church shoes, ah' },
    { timeMs: 8200, text: 'Milli point two just to hurt you, ah' },
    { timeMs: 11500, text: 'All red Lamb’ just to tease you, ah' },
    { timeMs: 15000, text: 'None of these toys on lease too, ah' },
    { timeMs: 18500, text: 'Made your whole year in a week too, yah' },
    { timeMs: 22000, text: 'Main bitch out your league too, ah' },
    { timeMs: 25500, text: 'Side bitch out of your league too, ah' },
    { timeMs: 29000, text: "Look what you've done" },
    { timeMs: 32500, text: "I'm a motherfuckin' starboy" },
    { timeMs: 36500, text: "Look what you've done" },
    { timeMs: 40000, text: "I'm a motherfuckin' starboy" },
  ];

  onMount(() => {
    let cleanupTauri: (() => void) | undefined;

    // Check if running in Tauri native runtime
    if (typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window) {
      void initTauriRuntime().then((runtime) => {
        if (runtime) {
          cleanupTauri = () => {
            runtime.controller.dispose();
            runtime.spotify.dispose();
            runtime.engine.dispose();
          };
        }
      });
    } else {
      // Standalone browser / dev preview fallback
      setTrack(SAMPLE_TRACK, SAMPLE_LYRICS);

      let animationFrameId: number;
      let lastTimestamp = performance.now();

      const tick = (now: number) => {
        const delta = now - lastTimestamp;
        lastTimestamp = now;

        if ($playbackState.isPlaying) {
          let nextTime = $playbackState.currentTimeMs + delta;
          if (nextTime > SAMPLE_TRACK.durationMs) {
            nextTime = 0;
          }
          updateProgress(nextTime);
        }

        animationFrameId = requestAnimationFrame(tick);
      };

      animationFrameId = requestAnimationFrame(tick);

      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.ctrlKey && e.shiftKey && (e.key === 'X' || e.key === 'x')) {
          toggleClickThrough();
        }
      };

      window.addEventListener('keydown', handleKeyDown);

      return () => {
        cancelAnimationFrame(animationFrameId);
        window.removeEventListener('keydown', handleKeyDown);
      };
    }

    return () => {
      cleanupTauri?.();
    };
  });
</script>

<main class="w-full h-full flex flex-col p-2 bg-transparent overflow-hidden box-border">
  <div class="w-full h-full flex flex-col min-h-0">
    <LyricsHUD />
  </div>
</main>


