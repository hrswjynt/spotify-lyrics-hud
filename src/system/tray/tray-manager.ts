import { TrayMenu, TrayMenuItem } from '../types.js';

export class TrayManager {
  private currentMenu: TrayMenu | null = null;
  private changeListeners: Array<(menu: TrayMenu) => void> = [];

  public setMenu(menu: TrayMenu): void {
    this.currentMenu = menu;
    for (const listener of this.changeListeners) {
      listener(menu);
    }
  }

  public getMenu(): TrayMenu | null {
    return this.currentMenu;
  }

  public onChange(callback: (menu: TrayMenu) => void): () => void {
    this.changeListeners.push(callback);
    return () => {
      this.changeListeners = this.changeListeners.filter((l) => l !== callback);
    };
  }

  /**
   * Recursively finds a menu item by ID and executes its associated action.
   */
  public triggerItem(itemId: string): boolean {
    if (!this.currentMenu) return false;

    const findAndExecute = (items: TrayMenuItem[]): boolean => {
      for (const item of items) {
        if (item.id === itemId) {
          item.action?.();
          return true;
        }
        if (item.children && item.children.length > 0) {
          const found = findAndExecute(item.children);
          if (found) return true;
        }
      }
      return false;
    };

    return findAndExecute(this.currentMenu.items);
  }

  public dispose(): void {
    this.currentMenu = null;
    this.changeListeners = [];
  }
}
