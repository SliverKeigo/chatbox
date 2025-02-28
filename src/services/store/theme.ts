import { BaseStorageService } from './base';

const defaultState = {
  theme: 'wireframe' as string
};

export class ThemeStorageService extends BaseStorageService {
  // 保存主题设置
  async saveTheme(theme: string) {
    try {
      console.log('Saving theme:', theme);
      const store = await this.ensureStore();
      
      // 先获取当前主题，避免重复保存相同的值
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
      throw new Error('保存主题设置失败');
    }
  }

  // 加载主题设置
  async loadTheme(): Promise<string> {
    try {
      console.log('Loading theme...');
      const store = await this.ensureStore();
      const theme = await store.get<string>('theme');
      console.log('Raw loaded theme:', theme);
      
      // 只有当 theme 是 undefined 或 null 时才使用默认值
      if (theme === undefined || theme === null) {
        console.log('Using default theme:', defaultState.theme);
        return defaultState.theme;
      }
      
      console.log('Using stored theme:', theme);
      return theme;
    } catch (error) {
      console.error('Failed to load theme:', error);
      return defaultState.theme;
    }
  }
}

export const themeStorage = new ThemeStorageService(); 