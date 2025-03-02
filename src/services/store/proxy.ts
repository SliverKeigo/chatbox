import { BaseStorageService } from './base';

export type ProxyType = 'none' | 'custom' | 'system';

export interface ProxyConfig {
  type: ProxyType;
  address?: string; // 自定义代理地址，格式如 http://127.0.0.1:7890
}

const defaultConfig: ProxyConfig = {
  type: 'system'
};

export class ProxyStorageService extends BaseStorageService {

  async saveProxyConfig(config: ProxyConfig) {
    try {
      console.log('保存代理配置:', config);
      const store = await this.ensureStore();
      
      const currentConfig = await store.get<ProxyConfig>('proxyConfig');
      if (JSON.stringify(currentConfig) === JSON.stringify(config)) {
        console.log('代理配置未变更，跳过保存');
        return;
      }
      
      await store.set('proxyConfig', config);
      await store.save();
      console.log('代理配置保存成功:', config);
    } catch (error) {
      console.error('保存代理配置失败:', error);
      throw new Error('保存代理配置失败');
    }
  }

  // 加载代理配置
  async loadProxyConfig(): Promise<ProxyConfig> {
    try {
      console.log('加载代理配置...');
      const store = await this.ensureStore();
      const config = await store.get<ProxyConfig>('proxyConfig');
      
      if (!config) {
        console.log('未找到代理配置，使用默认配置:', defaultConfig);
        return defaultConfig;
      }
      
      console.log('加载到的代理配置:', config);
      return config;
    } catch (error) {
      console.error('加载代理配置失败:', error);
      return defaultConfig;
    }
  }
}

export const proxyStorage = new ProxyStorageService(); 