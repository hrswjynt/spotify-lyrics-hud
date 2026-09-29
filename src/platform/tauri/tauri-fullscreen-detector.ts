import { FullscreenDetector, FullscreenState } from '../../core/types.js';

export class TauriFullscreenDetector implements FullscreenDetector {
  private changeListeners: Array<(state: FullscreenState) => void> = [];

  public async getFullscreenState(): Promise<FullscreenState> {
    return { state: 'windowed' };
  }

  public onFullscreenChanged(callback: (state: FullscreenState) => void): () => void {
    this.changeListeners.push(callback);
    return () => {
      this.changeListeners = this.changeListeners.filter((cb) => cb !== callback);
    };
  }

  public dispose(): void {
    this.changeListeners = [];
  }
}
