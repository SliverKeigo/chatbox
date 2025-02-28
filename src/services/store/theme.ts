import { BaseStorageService } from './base';

const defaultTheme = 'wireframe';

export class ThemeStorageService extends BaseStorageService {
  // 保存主题
  async saveTheme(theme: string) {
    try {
      console.log('Saving theme:', theme);
      const store = await this.ensureStore();
      
      const currentTheme = await store.get<string>('theme');
      if (currentTheme === theme) {
        console.log('Theme unchanged, skipping save');
        return;
      }
      
      await store.set('theme', theme);
      await store.save();
      console.log('Theme saved successfully:', theme);
    } catch (error) {
      console.error('Failed to save theme:', error);
      throw new Error('保存主题失败');
    }
  }

  // 加载主题
  async loadTheme(): Promise<string> {
    try {
      console.log('Loading theme...');
      const store = await this.ensureStore();
      const theme = await store.get<string>('theme');
      
      const finalTheme = theme || defaultTheme;
      
      // 直接应用主题到文档
      document.documentElement.setAttribute('data-theme', finalTheme);
      
      console.log('Theme loaded:', finalTheme);
      return finalTheme;
    } catch (error) {
      console.error('Failed to load theme:', error);
      return defaultTheme;
    }
  }
}

export const themeStorage = new ThemeStorageService(); 