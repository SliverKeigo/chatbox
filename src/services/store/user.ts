import { BaseStorageService } from './base';

const defaultState = {
  avatar: 'https://ui-avatars.com/api/?name=User',
  name: 'User'
};

export class UserStorageService extends BaseStorageService {
  // 保存头像
  async saveAvatar(avatar: string) {
    try {
      console.log('Saving avatar:', avatar);
      const store = await this.ensureStore();
      
      // 先获取当前头像，避免重复保存相同的值
      const currentAvatar = await store.get<string>('avatar');
      if (currentAvatar === avatar) {
        console.log('Avatar unchanged, skipping save');
        return;
      }
      
      await store.set('avatar', avatar);
      await store.save();
      console.log('Avatar saved successfully:', avatar);
    } catch (error) {
      console.error('Failed to save avatar:', error);
      throw new Error('保存头像失败');
    }
  }

  // 加载头像
  async loadAvatar(): Promise<string> {
    try {
      console.log('Loading avatar...');
      const store = await this.ensureStore();
      const avatar = await store.get<string>('avatar');
      console.log('Raw loaded avatar:', avatar);
      
      if (!avatar || avatar.includes('multiavatar.com')) {
        // 如果没有存储的头像或使用旧的API，使用默认头像并保存
        console.log('No avatar found or using old API, using default avatar');
        await this.saveAvatar(defaultState.avatar);
        return defaultState.avatar;
      }
      
      console.log('Using stored avatar:', avatar);
      return avatar;
    } catch (error) {
      console.error('Failed to load avatar:', error);
      return defaultState.avatar;
    }
  }

  // 保存用户名
  async saveName(name: string) {
    try {
      console.log('Saving name:', name);
      const store = await this.ensureStore();
      
      const currentName = await store.get<string>('name');
      if (currentName === name) {
        console.log('Name unchanged, skipping save');
        return;
      }
      
      await store.set('name', name);
      await store.save();
      console.log('Name saved successfully:', name);
    } catch (error) {
      console.error('Failed to save name:', error);
      throw new Error('保存用户名失败');
    }
  }

  // 加载用户名
  async loadName(): Promise<string> {
    try {
      console.log('Loading name...');
      const store = await this.ensureStore();
      const name = await store.get<string>('name');
      
      if (!name) {
        console.log('No name found, using default:', defaultState.name);
        return defaultState.name;
      }
      
      return name;
    } catch (error) {
      console.error('Failed to load name:', error);
      return defaultState.name;
    }
  }
}

export const userStorage = new UserStorageService(); 