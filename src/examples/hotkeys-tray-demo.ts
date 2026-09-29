import { createOverlayApplication } from '../index.js';
import { SpotifyService } from '../data/spotify-service.js';
import { SystemController } from '../system/system-controller.js';
import { TrayMenu } from '../system/types.js';

export async function runHotkeysTrayDemo(): Promise<void> {
  console.log('=== Desktop Overlay: Global Hotkeys & System Tray Demonstration ===\n');

  // 1. Initialize native overlay engine and platform adapters
  const { engine, platform } = await createOverlayApplication({
    visible: true,
    placement: {
      anchor: 'bottom-center',
      offset: { x: 0, y: -40 },
      size: { width: 750, height: 120 },
      relativeTo: 'workArea',
    },
    zOrder: 'overlay',
    interaction: {
      pointer: 'passthrough',
      keyboard: 'none',
    },
    display: { type: 'primary' },
    fullscreenBehavior: 'hide-on-exclusive-fullscreen',
    opacity: 0.95,
  });

  console.log('1. Overlay Engine Initialized:');
  const initialIntent = engine.getIntent();
  console.log(`   - Visible: ${initialIntent.visible}`);
  console.log(`   - Pointer interaction: ${initialIntent.interaction.pointer}`);
  console.log(`   - Target display: ${JSON.stringify(initialIntent.display)}`);

  // 2. Initialize Spotify Service
  const spotify = new SpotifyService({
    autoStartPolling: true,
    pollIntervalMs: 1000,
  });

  // 3. Initialize System Controller
  const systemController = new SystemController({
    engine,
    displayProvider: platform.getDisplayProvider(),
    spotifyService: spotify,
  });
  await systemController.start();

  console.log('\n2. System Controller & Global Hotkeys Registered:');
  for (const binding of systemController.getHotkeyManager().getBindings()) {
    console.log(`   [${binding.accelerator}] -> ${binding.description} (${binding.action})`);
  }

  // 4. Initial System Tray Menu State
  console.log('\n3. Initial System Tray Menu Layout:');
  renderTrayMenu(systemController.getTrayManager().getMenu());

  // 5. Simulate Hotkey Trigger: Ctrl+Shift+X (Toggle Click-Through)
  console.log('\n>>> Simulating Global Hotkey: Ctrl+Shift+X (Toggle Click-Through)...');
  await systemController.getHotkeyManager().trigger('Ctrl+Shift+X');
  console.log(`   - Pointer interaction is now: ${engine.getIntent().interaction.pointer}`);

  // 6. Simulate Hotkey Trigger: Ctrl+Shift+M (Cycle Monitor)
  console.log('\n>>> Simulating Global Hotkey: Ctrl+Shift+M (Cycle Monitor)...');
  await systemController.getHotkeyManager().trigger('Ctrl+Shift+M');
  console.log(`   - Display selector is now: ${JSON.stringify(engine.getIntent().display)}`);

  // 7. Simulate Hotkey Trigger: Ctrl+Shift+H (Toggle Visibility)
  console.log('\n>>> Simulating Global Hotkey: Ctrl+Shift+H (Toggle Visibility)...');
  await systemController.getHotkeyManager().trigger('Ctrl+Shift+H');
  console.log(`   - Overlay visibility is now: ${engine.getIntent().visible}`);

  // 8. Re-render Updated System Tray Menu
  console.log('\n4. Updated System Tray Menu (Reflecting New States):');
  renderTrayMenu(systemController.getTrayManager().getMenu());

  // 9. Restore visibility and click-through
  await systemController.getHotkeyManager().trigger('Ctrl+Shift+H');
  await systemController.getHotkeyManager().trigger('Ctrl+Shift+X');

  console.log('\n=== Hotkeys & Tray Demonstration Completed Successfully ===\n');

  systemController.dispose();
  spotify.dispose();
  engine.dispose();
  platform.dispose();
}

function renderTrayMenu(menu: TrayMenu | null): void {
  if (!menu) return;
  for (const item of menu.items) {
    if (item.type === 'separator') {
      console.log('   ---');
    } else if (item.type === 'checkbox') {
      const mark = item.checked ? '[x]' : '[ ]';
      const shortcut = item.shortcut ? ` (${item.shortcut})` : '';
      console.log(`   ${mark} ${item.label}${shortcut}`);
    } else if (item.type === 'submenu') {
      console.log(`   > ${item.label}:`);
      for (const subItem of item.children ?? []) {
        if (subItem.type === 'checkbox') {
          const mark = subItem.checked ? '(*)' : '( )';
          console.log(`       ${mark} ${subItem.label}`);
        } else {
          console.log(`       ${subItem.label}`);
        }
      }
    } else {
      const shortcut = item.shortcut ? ` (${item.shortcut})` : '';
      const state = item.enabled === false ? ' [disabled]' : '';
      console.log(`   ${item.label}${shortcut}${state}`);
    }
  }
}

if (process.argv[1]?.endsWith('hotkeys-tray-demo.js') || process.argv[1]?.endsWith('hotkeys-tray-demo.ts')) {
  void runHotkeysTrayDemo();
}
