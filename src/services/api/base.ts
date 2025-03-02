import { ProxyConfig } from '../store/proxy';
import { ModelConfig } from '../store/model';

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface ApiResponse {
  text: string;
}

export interface ApiStreamResponse {
  textStream: AsyncIterable<string>;
}

export interface ModelInfo {
  id: string;
  name: string;
}

// API服务提供商的基础接口
export abstract class BaseApiProvider {
  protected proxyConfig: ProxyConfig | null = null;
  protected modelConfig: ModelConfig | null = null;
  protected currentModel: string = '';
  protected maxRetries: number = 0;
  
  // 设置代理配置
  abstract setProxyConfig(config: ProxyConfig | null): void;
  
  // 设置模型配置
  abstract setModelConfig(config: ModelConfig | null): void;
  
  // 设置当前使用的模型
  abstract setCurrentModel(model: string): void;
  
  // 发送消息并获取完整响应
  abstract sendMessage(message: string, context: ChatMessage[]): Promise<string>;
  
  // 发送消息并获取流式响应
  abstract streamMessage(
    message: string, 
    context: ChatMessage[], 
    onChunk: (chunk: string) => void
  ): Promise<string>;
  
  // 获取可用模型列表
  abstract fetchAvailableModels(): Promise<ModelInfo[]>;
  
  // 格式化消息
  abstract formatMessages(context: ChatMessage[], currentMessage: string): any;
  
  // 创建超时信号
  protected createTimeoutSignal(timeoutMs: number): AbortSignal {
    const controller = new AbortController();
    setTimeout(() => controller.abort(), timeoutMs);
    return controller.signal;
  }
} 