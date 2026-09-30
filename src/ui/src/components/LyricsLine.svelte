<script lang="ts">
  import { karaokeMode } from '../stores/playback.js';
  import { displaySettings } from '../stores/display-settings.js';

  export let text: string = '';
  export let isActive: boolean = false;
  export let isPast: boolean = false;
  export let progress: number = 0; // 0.0 to 1.0

  $: fillPercent = Math.min(100, Math.max(0, Math.round(progress * 100)));

  // Font Size Classes
  $: activeSizeClass = $displaySettings.fontSize === 'sm'
    ? 'text-lg md:text-xl'
    : $displaySettings.fontSize === 'lg'
    ? 'text-2xl md:text-3xl'
    : 'text-xl md:text-2xl';

  $: inactiveSizeClass = $displaySettings.fontSize === 'sm'
    ? 'text-sm md:text-base'
    : $displaySettings.fontSize === 'lg'
    ? 'text-lg md:text-xl'
    : 'text-base md:text-lg';

  // Font Family Class
  $: fontFamClass = $displaySettings.fontFamily === 'mono'
    ? 'font-mono'
    : $displaySettings.fontFamily === 'rounded'
    ? 'font-sans font-medium'
    : 'font-sans';

  // Alignment Class
  $: textAlignClass = $displaySettings.alignment === 'left'
    ? 'text-left'
    : $displaySettings.alignment === 'right'
    ? 'text-right'
    : 'text-center';

  // Inactive Opacity Class
  $: inactiveOpacityClass = isPast
    ? ($displaySettings.inactiveOpacity === 'subtle' ? 'opacity-20' : $displaySettings.inactiveOpacity === 'clear' ? 'opacity-55' : 'opacity-35')
    : ($displaySettings.inactiveOpacity === 'subtle' ? 'opacity-30' : $displaySettings.inactiveOpacity === 'clear' ? 'opacity-75' : 'opacity-50');

  // Theme Gradients and Solid Glow
  $: gradientBackground = (() => {
    switch ($displaySettings.highlightTheme) {
      case 'cyan':
        return `linear-gradient(to right, #38bdf8 0%, #818cf8 ${fillPercent}%, #ffffff ${fillPercent}%, #ffffff 100%)`;
      case 'violet':
        return `linear-gradient(to right, #c084fc 0%, #f472b6 ${fillPercent}%, #ffffff ${fillPercent}%, #ffffff 100%)`;
      case 'white':
        return `linear-gradient(to right, #ffffff 0%, #94a3b8 ${fillPercent}%, #ffffff ${fillPercent}%, #ffffff 100%)`;
      case 'emerald':
      default:
        return `linear-gradient(to right, #34d399 0%, #38bdf8 ${fillPercent}%, #ffffff ${fillPercent}%, #ffffff 100%)`;
    }
  })();

  $: solidThemeClass = (() => {
    switch ($displaySettings.highlightTheme) {
      case 'cyan':
        return 'text-sky-400 drop-shadow-[0_0_12px_rgba(56,189,248,0.55)]';
      case 'violet':
        return 'text-purple-400 drop-shadow-[0_0_12px_rgba(192,132,252,0.55)]';
      case 'white':
        return 'text-white drop-shadow-[0_0_12px_rgba(255,255,255,0.7)]';
      case 'emerald':
      default:
        return 'text-emerald-400 drop-shadow-[0_0_12px_rgba(52,211,153,0.55)]';
    }
  })();
</script>

<div
  class="w-full {textAlignClass} {fontFamClass} py-0.5 px-4 transition-all duration-500 ease-out select-none
    {isActive
      ? 'font-bold'
      : isPast
      ? `font-medium ${inactiveOpacityClass}`
      : `font-medium ${inactiveOpacityClass} hover:opacity-90`}"
>
  {#if !text || text.trim() === ''}
    {#if isActive}
      <p class="{activeSizeClass} tracking-normal opacity-30 select-none inline-block animate-pulse">♪</p>
    {:else}
      <p class="{inactiveSizeClass} tracking-normal opacity-0 select-none inline-block pointer-events-none">&nbsp;</p>
    {/if}
  {:else if isActive}
    {#if $karaokeMode}
      <p
        class="{activeSizeClass} tracking-wide leading-snug inline-block max-w-full drop-shadow-[0_2px_8px_rgba(0,0,0,0.6)]"
        style="
          background: {gradientBackground};
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        "
      >
        {text}
      </p>
    {:else}
      <p class="{activeSizeClass} tracking-wide leading-snug inline-block max-w-full {solidThemeClass}">
        {text}
      </p>
    {/if}
  {:else}
    <p class="{inactiveSizeClass} text-white tracking-normal leading-snug inline-block max-w-full drop-shadow-[0_1px_4px_rgba(0,0,0,0.4)]">
      {text}
    </p>
  {/if}
</div>
