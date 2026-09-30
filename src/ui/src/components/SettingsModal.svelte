<script lang="ts">
  import {
    displaySettings,
    updateDisplaySettings,
    resetDisplaySettings,
  } from '../stores/display-settings.js';
  import type {
    FontSizeOption,
    FontFamilyOption,
    TextAlignmentOption,
    LineModeOption,
    LineSpacingOption,
    HighlightThemeOption,
    InactiveOpacityOption,
    BackgroundStyleOption,
    ScaleOption,
  } from '../stores/display-settings.js';

  export let isOpen: boolean = false;
  export let onClose: () => void = () => {};

  let activeTab: 'typography' | 'layout' | 'theme' = 'typography';
</script>

{#if isOpen}
  <div
    class="absolute inset-0 z-50 bg-black/90 backdrop-blur-xl rounded-2xl flex flex-col p-3 text-white overflow-hidden animate-in fade-in zoom-in-95 duration-200 select-none border border-white/15 shadow-2xl"
  >
    <!-- Modal Header -->
    <div class="flex items-center justify-between pb-2 border-b border-white/10 shrink-0">
      <div class="flex items-center gap-2">
        <span class="text-emerald-400 text-sm">⚙️</span>
        <h3 class="font-bold text-sm tracking-wide text-white">Pengaturan Display</h3>
      </div>

      <!-- Navigation Tabs -->
      <div class="flex items-center gap-1 bg-white/10 p-0.5 rounded-lg text-xs">
        <button
          type="button"
          on:click={() => (activeTab = 'typography')}
          class="px-2.5 py-1 rounded-md transition-all cursor-pointer {activeTab === 'typography' ? 'bg-emerald-500 text-black font-bold shadow' : 'text-white/70 hover:text-white'}"
        >
          Tipografi
        </button>
        <button
          type="button"
          on:click={() => (activeTab = 'layout')}
          class="px-2.5 py-1 rounded-md transition-all cursor-pointer {activeTab === 'layout' ? 'bg-emerald-500 text-black font-bold shadow' : 'text-white/70 hover:text-white'}"
        >
          Layout & Spasi
        </button>
        <button
          type="button"
          on:click={() => (activeTab = 'theme')}
          class="px-2.5 py-1 rounded-md transition-all cursor-pointer {activeTab === 'theme' ? 'bg-emerald-500 text-black font-bold shadow' : 'text-white/70 hover:text-white'}"
        >
          Tema & Warna
        </button>
      </div>

      <button
        type="button"
        on:click={onClose}
        class="w-6 h-6 rounded-full bg-white/10 hover:bg-white/20 active:scale-95 text-white/70 hover:text-white flex items-center justify-center transition-all cursor-pointer text-xs"
        title="Tutup"
      >
        ✕
      </button>
    </div>

    <!-- Modal Content -->
    <!-- Modal Content -->
    <div class="flex-1 overflow-y-auto no-scrollbar py-1 flex flex-col gap-1.5 min-h-0 text-xs">
      {#if activeTab === 'typography'}
        <!-- Ukuran Font -->
        <div class="flex flex-col gap-1">
          <span class="text-white/60 text-[11px] font-medium">Ukuran Font Lirik Aktif:</span>
          <div class="grid grid-cols-3 gap-2">
            {#each [
              { id: 'sm', label: 'Kecil' },
              { id: 'md', label: 'Sedang' },
              { id: 'lg', label: 'Besar' }
            ] as opt}
              <button
                type="button"
                on:click={() => updateDisplaySettings({ fontSize: opt.id as FontSizeOption })}
                class="py-1 px-2.5 rounded-lg border text-center transition-all cursor-pointer font-medium
                  {$displaySettings.fontSize === opt.id
                    ? 'border-emerald-400 bg-emerald-500/20 text-emerald-300 font-bold shadow-sm'
                    : 'border-white/10 bg-white/5 text-white/70 hover:bg-white/10 hover:text-white'}"
              >
                {opt.label}
              </button>
            {/each}
          </div>
        </div>

        <!-- Jenis Font -->
        <div class="flex flex-col gap-1 pt-0.5">
          <span class="text-white/60 text-[11px] font-medium">Jenis Font:</span>
          <div class="grid grid-cols-3 gap-2">
            {#each [
              { id: 'sans', label: 'Modern Sans', style: 'font-sans' },
              { id: 'rounded', label: 'Rounded', style: 'font-sans font-medium' },
              { id: 'mono', label: 'Monospace', style: 'font-mono' }
            ] as opt}
              <button
                type="button"
                on:click={() => updateDisplaySettings({ fontFamily: opt.id as FontFamilyOption })}
                class="py-1 px-2.5 rounded-lg border text-center transition-all cursor-pointer {opt.style}
                  {$displaySettings.fontFamily === opt.id
                    ? 'border-emerald-400 bg-emerald-500/20 text-emerald-300 font-bold shadow-sm'
                    : 'border-white/10 bg-white/5 text-white/70 hover:bg-white/10 hover:text-white'}"
              >
                {opt.label}
              </button>
            {/each}
          </div>
        </div>

        <!-- Perataan / Alignment -->
        <div class="flex flex-col gap-1 pt-0.5">
          <span class="text-white/60 text-[11px] font-medium">Perataan Lirik:</span>
          <div class="grid grid-cols-3 gap-2">
            {#each [
              { id: 'left', label: '⯇ Rata Kiri' },
              { id: 'center', label: '⯀ Tengah' },
              { id: 'right', label: '⯈ Rata Kanan' }
            ] as opt}
              <button
                type="button"
                on:click={() => updateDisplaySettings({ alignment: opt.id as TextAlignmentOption })}
                class="py-1 px-2.5 rounded-lg border text-center transition-all cursor-pointer font-medium
                  {$displaySettings.alignment === opt.id
                    ? 'border-emerald-400 bg-emerald-500/20 text-emerald-300 font-bold shadow-sm'
                    : 'border-white/10 bg-white/5 text-white/70 hover:bg-white/10 hover:text-white'}"
              >
                {opt.label}
              </button>
            {/each}
          </div>
        </div>

      {:else if activeTab === 'layout'}
        <!-- Skala Tampilan Keseluruhan (Scale) -->
        <div class="flex flex-col gap-1">
          <span class="text-white/60 text-[11px] font-medium">Skala Tampilan (Scale):</span>
          <div class="grid grid-cols-5 gap-1.5">
            {#each [
              { id: '0.5', label: '0.5x' },
              { id: '0.75', label: '0.75x' },
              { id: '1', label: '1.0x' },
              { id: '1.25', label: '1.25x' },
              { id: '1.5', label: '1.5x' }
            ] as opt}
              <button
                type="button"
                on:click={() => updateDisplaySettings({ scale: opt.id as ScaleOption })}
                class="py-1 px-1 rounded-lg border text-center transition-all cursor-pointer font-medium text-[11px]
                  {$displaySettings.scale === opt.id
                    ? 'border-emerald-400 bg-emerald-500/20 text-emerald-300 font-bold shadow-sm'
                    : 'border-white/10 bg-white/5 text-white/70 hover:bg-white/10 hover:text-white'}"
              >
                {opt.label}
              </button>
            {/each}
          </div>
        </div>

        <!-- Jumlah Baris -->
        <div class="flex flex-col gap-1 pt-0.5">
          <span class="text-white/60 text-[11px] font-medium">Mode Tampilan Baris:</span>
          <div class="grid grid-cols-3 gap-2">
            {#each [
              { id: 'single', label: '1 Baris Fokus' },
              { id: 'triple', label: '3 Baris (Center)' },
              { id: 'scroller', label: 'Scroller Penuh' }
            ] as opt}
              <button
                type="button"
                on:click={() => updateDisplaySettings({ lineMode: opt.id as LineModeOption })}
                class="py-1 px-2.5 rounded-lg border text-center transition-all cursor-pointer font-medium
                  {$displaySettings.lineMode === opt.id
                    ? 'border-emerald-400 bg-emerald-500/20 text-emerald-300 font-bold shadow-sm'
                    : 'border-white/10 bg-white/5 text-white/70 hover:bg-white/10 hover:text-white'}"
              >
                {opt.label}
              </button>
            {/each}
          </div>
        </div>

        <!-- Jarak Antar Baris -->
        <div class="flex flex-col gap-1 pt-0.5">
          <span class="text-white/60 text-[11px] font-medium">Jarak Antar Baris (Line Spacing):</span>
          <div class="grid grid-cols-3 gap-2">
            {#each [
              { id: 'compact', label: 'Rapat (Compact)' },
              { id: 'balanced', label: 'Normal (Balanced)' },
              { id: 'relaxed', label: 'Renggang (Relaxed)' }
            ] as opt}
              <button
                type="button"
                on:click={() => updateDisplaySettings({ lineSpacing: opt.id as LineSpacingOption })}
                class="py-1 px-2.5 rounded-lg border text-center transition-all cursor-pointer font-medium
                  {$displaySettings.lineSpacing === opt.id
                    ? 'border-emerald-400 bg-emerald-500/20 text-emerald-300 font-bold shadow-sm'
                    : 'border-white/10 bg-white/5 text-white/70 hover:bg-white/10 hover:text-white'}"
              >
                {opt.label}
              </button>
            {/each}
          </div>
        </div>

        <!-- Keredupan Lirik Lain -->
        <div class="flex flex-col gap-1 pt-0.5">
          <span class="text-white/60 text-[11px] font-medium">Keredupan Lirik Non-Aktif:</span>
          <div class="grid grid-cols-3 gap-2">
            {#each [
              { id: 'subtle', label: '25% (Sangat Redup)' },
              { id: 'balanced', label: '45% (Seimbang)' },
              { id: 'clear', label: '70% (Cukup Terang)' }
            ] as opt}
              <button
                type="button"
                on:click={() => updateDisplaySettings({ inactiveOpacity: opt.id as InactiveOpacityOption })}
                class="py-1 px-2.5 rounded-lg border text-center transition-all cursor-pointer font-medium
                  {$displaySettings.inactiveOpacity === opt.id
                    ? 'border-emerald-400 bg-emerald-500/20 text-emerald-300 font-bold shadow-sm'
                    : 'border-white/10 bg-white/5 text-white/70 hover:bg-white/10 hover:text-white'}"
              >
                {opt.label}
              </button>
            {/each}
          </div>
        </div>

      {:else if activeTab === 'theme'}
        <!-- Tema Warna Lirik -->
        <div class="flex flex-col gap-1">
          <span class="text-white/60 text-[11px] font-medium">Tema Warna Highlight:</span>
          <div class="grid grid-cols-4 gap-2">
            {#each [
              { id: 'emerald', label: 'Emerald', color: 'bg-emerald-400' },
              { id: 'cyan', label: 'Cyan', color: 'bg-sky-400' },
              { id: 'violet', label: 'Violet', color: 'bg-purple-400' },
              { id: 'white', label: 'Putih', color: 'bg-white' }
            ] as opt}
              <button
                type="button"
                on:click={() => updateDisplaySettings({ highlightTheme: opt.id as HighlightThemeOption })}
                class="py-1 px-2 rounded-lg border flex flex-col items-center gap-1 transition-all cursor-pointer font-medium
                  {$displaySettings.highlightTheme === opt.id
                    ? 'border-emerald-400 bg-emerald-500/20 text-emerald-300 font-bold shadow-sm'
                    : 'border-white/10 bg-white/5 text-white/70 hover:bg-white/10 hover:text-white'}"
              >
                <span class="w-3.5 h-3.5 rounded-full {opt.color} shadow-sm"></span>
                <span class="text-[11px]">{opt.label}</span>
              </button>
            {/each}
          </div>
        </div>

        <!-- Latar Belakang HUD -->
        <div class="flex flex-col gap-1 pt-0.5">
          <span class="text-white/60 text-[11px] font-medium">Gaya Latar Belakang HUD:</span>
          <div class="grid grid-cols-3 gap-2">
            {#each [
              { id: 'glass', label: 'Glass Blur' },
              { id: 'minimal', label: 'Ultra Minimal' },
              { id: 'solid', label: 'Solid Dark' }
            ] as opt}
              <button
                type="button"
                on:click={() => updateDisplaySettings({ backgroundStyle: opt.id as BackgroundStyleOption })}
                class="py-1 px-2.5 rounded-lg border text-center transition-all cursor-pointer font-medium
                  {$displaySettings.backgroundStyle === opt.id
                    ? 'border-emerald-400 bg-emerald-500/20 text-emerald-300 font-bold shadow-sm'
                    : 'border-white/10 bg-white/5 text-white/70 hover:bg-white/10 hover:text-white'}"
              >
                {opt.label}
              </button>
            {/each}
          </div>
        </div>
      {/if}
    </div>

    <!-- Modal Footer -->
    <div class="flex items-center justify-between pt-2 border-t border-white/10 shrink-0">
      <button
        type="button"
        on:click={resetDisplaySettings}
        class="text-[11px] text-white/50 hover:text-rose-400 transition-colors cursor-pointer"
      >
        ↺ Reset Default
      </button>

      <button
        type="button"
        on:click={onClose}
        class="px-4 py-1 rounded-lg bg-emerald-500 hover:bg-emerald-400 active:scale-95 text-black font-bold text-xs transition-all cursor-pointer shadow-md"
      >
        Selesai
      </button>
    </div>
  </div>
{/if}
