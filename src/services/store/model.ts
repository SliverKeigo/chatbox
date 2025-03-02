import { BaseStorageService } from './base';
import { ProviderType } from '../../components/Settings/ModelSettingsTab';
import { ModelInfo } from '../../services/api';

export interface ModelConfig {
  provider: ProviderType;
  apiKey: string;
  apiUrl: string;
  model: string;
}

const defaultConfig: ModelConfig = {
  provider: 'openai',
  apiKey: '',
  apiUrl: 'https://api.openai.com/v1',
  model: 'gpt-3.5-turbo'
};

// 各提供商的默认配置
export const providerDefaults: Record<ProviderType, Partial<ModelConfig>> = {
  openai: {
    apiUrl: 'https://api.openai.com/v1',
    model: 'gpt-3.5-turbo'
  },
  groq: {
    apiUrl: 'https://api.groq.com/v1',
    model: 'llama2-70b-4096'
  },
  ollama: {
    apiUrl: 'http://localhost:11434',
    model: 'llama2'
  }
};

// 提供商配置类型
export interface ProviderConfigs {
  [provider: string]: {
    apiKey: string;
    apiUrl: string;
    model: string;
  };
}

export class ModelStorageService extends BaseStorageService {
  // 处理API地址
  private processApiUrl(apiUrl: string): string {
    if (!apiUrl) return '';
    
    // 如果以#结尾，强制使用输入地址
    if (apiUrl.endsWith('#')) {
      return apiUrl.slice(0, -1); // 移除#符号
    }
    
    // 如果以/结尾，忽略v1版本
    if (apiUrl.endsWith('/')) {
      return apiUrl;
    }
    
    // 默认情况：只保存到v1，后面的值都舍去
    const v1Index = apiUrl.indexOf('/v1');
    if (v1Index !== -1) {
      return apiUrl.substring(0, v1Index + 3); // 包含/v1
    }
    
    return apiUrl;
  }

  // 保存模型配置
  async saveModelConfig(config: ModelConfig) {
    try {
      console.log('保存模型配置:', config);
      const store = await this.ensureStore();
      
      const currentConfig = await store.get<ModelConfig>('modelConfig');
      if (JSON.stringify(currentConfig) === JSON.stringify(config)) {
        console.log('模型配置未变更，跳过保存');
        return;
      }
      
      const provider = config.provider;
      const defaults = providerDefaults[provider];
      
      // 处理API地址
      const processedApiUrl = this.processApiUrl(config.apiUrl);
      
      const mergedConfig = {
        ...config,
        apiUrl: processedApiUrl || defaults.apiUrl,
        model: config.model || defaults.model
      };
      
      await store.set('modelConfig', mergedConfig);
      await store.save();
      console.log('模型配置保存成功:', mergedConfig);
    } catch (error) {
      console.error('保存模型配置失败:', error);
      throw new Error('保存模型配置失败');
    }
  }

  // 加载模型配置
  async loadModelConfig(): Promise<ModelConfig> {
    try {
      console.log('加载模型配置...');
      const store = await this.ensureStore();
      const config = await store.get<ModelConfig>('modelConfig');
      
      if (!config) {
        console.log('未找到模型配置，使用默认配置:', defaultConfig);
        return defaultConfig;
      }
      
      // 确保配置中包含默认值
      const provider = config.provider;
      const defaults = providerDefaults[provider];
      const mergedConfig = {
        ...config,
        apiUrl: config.apiUrl || defaults?.apiUrl || defaultConfig.apiUrl,
        model: config.model || defaults?.model || defaultConfig.model
      };
      
      console.log('加载到的模型配置:', mergedConfig);
      return mergedConfig;
    } catch (error) {
      console.error('加载模型配置失败:', error);
      return defaultConfig;
    }
  }
  
  // 保存当前使用的模型
  async saveCurrentModel(model: string) {
    try {
      console.log('保存当前模型:', model);
      const store = await this.ensureStore();
      await store.set('currentModel', model);
      await store.save();
    } catch (error) {
      console.error('保存当前模型失败:', error);
      throw new Error('保存当前模型失败');
    }
  }
  
  // 加载当前使用的模型
  async loadCurrentModel(): Promise<string> {
    try {
      const store = await this.ensureStore();
      const model = await store.get<string>('currentModel');
      return model || defaultConfig.model;
    } catch (error) {
      console.error('加载当前模型失败:', error);
      return defaultConfig.model;
    }
  }
  
  // 保存所有提供商的配置
  async saveAllProviderConfigs(configs: ProviderConfigs) {
    try {
      console.log('保存所有提供商配置:', configs);
      const store = await this.ensureStore();
      await store.set('allProviderConfigs', configs);
      await store.save();
      console.log('所有提供商配置保存成功');
    } catch (error) {
      console.error('保存所有提供商配置失败:', error);
      throw new Error('保存所有提供商配置失败');
    }
  }
  
  // 加载所有提供商的配置
  async loadAllProviderConfigs(): Promise<ProviderConfigs | null> {
    try {
      console.log('加载所有提供商配置...');
      const store = await this.ensureStore();
      const configs = await store.get<ProviderConfigs>('allProviderConfigs');
      
      if (!configs) {
        console.log('未找到提供商配置');
        return null;
      }
      
      console.log('加载到的提供商配置:', configs);
      return configs;
    } catch (error) {
      console.error('加载所有提供商配置失败:', error);
      return null;
    }
  }
  
  // 保存提供商的模型列表
  async saveProviderModels(provider: ProviderType, models: ModelInfo[]) {
    try {
      console.log(`保存${provider}模型列表:`, models.length);
      const store = await this.ensureStore();
      const key = `models_${provider}`;
      await store.set(key, models);
      await store.save();
      console.log(`${provider}模型列表保存成功`);
    } catch (error) {
      console.error(`保存${provider}模型列表失败:`, error);
      throw new Error(`保存${provider}模型列表失败`);
    }
  }
  
  // 加载提供商的模型列表
  async loadProviderModels(provider: ProviderType): Promise<ModelInfo[] | null> {
    try {
      console.log(`加载${provider}模型列表...`);
      const store = await this.ensureStore();
      const key = `models_${provider}`;
      const models = await store.get<ModelInfo[]>(key);
      
      if (!models) {
        console.log(`未找到${provider}模型列表`);
        return null;
      }
      
      console.log(`加载到的${provider}模型列表:`, models.length);
      return models;
    } catch (error) {
      console.error(`加载${provider}模型列表失败:`, error);
      return null;
    }
  }
}

export const modelStorage = new ModelStorageService(); 