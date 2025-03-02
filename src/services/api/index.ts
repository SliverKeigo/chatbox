import { OpenAIProvider } from './providers/OpenAIProvider';
import { GroqProvider } from './providers/GroqProvider';
import { OllamaProvider } from './providers/OllamaProvider';
import { BaseApiProvider, ChatMessage, ModelInfo } from './base';
import { ModelConfig } from '../store/model';
import { ProxyConfig } from '../store/proxy';

// 导出所有提供商类型
export type ApiProviderType = 'openai' | 'groq' | 'ollama';

// 导出基础类型
export type { ChatMessage, ModelInfo };

// 创建API提供商的工厂函数
export function createApiProvider(type: ApiProviderType): BaseApiProvider {
  switch (type) {
    case 'openai':
      return new OpenAIProvider();
    case 'groq':
      return new GroqProvider();
    case 'ollama':
      return new OllamaProvider();
    default:
      console.warn(`未知的API提供商类型: ${type}，使用OpenAI作为默认值`);
      return new OpenAIProvider();
  }
}

// API服务类，用于管理当前活跃的提供商
export class ApiService {
  private static instance: ApiService;
  private providers: Record<ApiProviderType, BaseApiProvider>;
  private activeProvider: ApiProviderType = 'openai';
  
  private constructor() {
    // 初始化所有提供商
    this.providers = {
      openai: new OpenAIProvider(),
      groq: new GroqProvider(),
      ollama: new OllamaProvider()
    };
  }
  
  public static getInstance(): ApiService {
    if (!ApiService.instance) {
      ApiService.instance = new ApiService();
    }
    return ApiService.instance;
  }
  
  public setActiveProvider(providerType: ApiProviderType): void {
    console.log(`设置活跃提供商: ${providerType}`);
    this.activeProvider = providerType;
  }
  
  public getActiveProvider(): ApiProviderType {
    return this.activeProvider;
  }
  
  public setProxyConfig(config: ProxyConfig | null): void {
    // 为所有提供商设置代理
    Object.values(this.providers).forEach(provider => {
      provider.setProxyConfig(config);
    });
  }
  
  public setModelConfig(providerType: ApiProviderType, config: ModelConfig | null): void {
    // 为指定提供商设置模型配置
    if (this.providers[providerType]) {
      this.providers[providerType].setModelConfig(config);
    }
  }
  
  public setCurrentModel(model: string): void {
    // 为当前活跃提供商设置模型
    this.providers[this.activeProvider].setCurrentModel(model);
  }
  
  public async sendMessage(message: string, context: ChatMessage[] = []): Promise<string> {
    return this.providers[this.activeProvider].sendMessage(message, context);
  }
  
  public async streamMessage(
    message: string, 
    context: ChatMessage[] = [], 
    onChunk: (chunk: string) => void
  ): Promise<string> {
    return this.providers[this.activeProvider].streamMessage(message, context, onChunk);
  }
  
  public async fetchAvailableModels(providerType?: ApiProviderType): Promise<ModelInfo[]> {
    const provider = providerType || this.activeProvider;
    try {
      return await this.providers[provider].fetchAvailableModels();
    } catch (error: any) {
      console.error(`获取${provider}可用模型失败:`, error);
      throw error;
    }
  }
} 