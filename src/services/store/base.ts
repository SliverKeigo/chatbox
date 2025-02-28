import { Store } from '@tauri-apps/plugin-store';

export class BaseStorageService {
  protected store: Store | null = null;
  protected initialized = false;

  constructor() {
    this.initStore();
  }

  protected async initStore() {
    if (this.initialized) return;
    
    try {
      console.log('Initializing store...');
      this.store = await Store.load('store.bin');
      this.initialized = true;
      console.log('Store initialized successfully');
    } catch (error) {
      console.error('Failed to initialize store:', error);
      throw new Error('存储初始化失败');
    }
  }

  protected async ensureStore(): Promise<Store> {
    if (!this.initialized) {
      await this.initStore();
    }
    if (!this.store) {
      throw new Error('存储初始化失败');
    }
    return this.store;
  }
} 