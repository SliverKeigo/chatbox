import { createOpenAI } from '@ai-sdk/openai';
import { generateText, streamText } from 'ai';
import { ProxyConfig } from '../../store/proxy';
import { ModelConfig } from '../../store/model';
import { BaseApiProvider, ChatMessage, ModelInfo } from '../base';

// Groq使用与OpenAI兼容的API，但有不同的基础URL和模型
export class GroqProvider extends BaseApiProvider {
  private apiUrl: string = "https://api.groq.com/v1";
  private apiKey: string = "";
  private client: any;
  
  constructor() {
    super();
    this.currentModel = "llama2-70b-4096";
    this.initClient();
  }
  
  private initClient() {
    const options: any = {
      apiKey: this.apiKey,
      baseURL: this.apiUrl,
      compatibility: 'compatible',
    };

    if (this.proxyConfig) {
      if (this.proxyConfig.type === 'custom' && this.proxyConfig.address) {
        options.fetch = (url: string, options: RequestInit) => {
          const fetchOptions = {
            ...options,
            agent: this.proxyConfig?.address
          };
          return fetch(url, fetchOptions);
        };
      } else if (this.proxyConfig.type === 'system') {
        console.log('使用系统代理');
      }
    }

    this.client = createOpenAI(options);
  }
  
  setProxyConfig(config: ProxyConfig | null): void {
    console.log('Groq: 设置代理配置:', config);
    this.proxyConfig = config;
    this.initClient();
  }
  
  setModelConfig(config: ModelConfig | null): void {
    if (!config) return;
    
    console.log('Groq: 设置模型配置:', config);
    this.modelConfig = config;
    this.apiUrl = config.apiUrl || this.apiUrl;
    this.apiKey = config.apiKey || this.apiKey;
    this.currentModel = config.model || this.currentModel;
    this.initClient();
  }
  
  setCurrentModel(model: string): void {
    console.log('Groq: 设置当前模型:', model);
    this.currentModel = model;
  }
  
  async sendMessage(message: string, context: ChatMessage[] = []): Promise<string> {
    try {
      const messages = this.formatMessages(context, message);
      
      const { text } = await generateText({
        model: this.client(this.currentModel),
        messages: messages,
      });

      return text;
    } catch (error: any) {
      console.error('Groq API Error:', error);
      throw new Error('发送消息失败，请检查网络连接或API配置');
    }
  }
  
  async streamMessage(
    message: string, 
    context: ChatMessage[] = [], 
    onChunk: (chunk: string) => void
  ): Promise<string> {
    return this.streamMessageWithRetry(message, context, onChunk, 0);
  }
  
  private async streamMessageWithRetry(
    message: string, 
    context: ChatMessage[] = [], 
    onChunk: (chunk: string) => void,
    retryCount: number
  ): Promise<string> {
    try {
      // 记录诊断信息
      const diagnosticInfo = {
        timestamp: new Date().toISOString(),
        platform: typeof navigator !== 'undefined' ? navigator.platform : 'unknown',
        userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown',
        apiUrl: this.apiUrl,
        model: this.currentModel,
        proxyType: this.proxyConfig?.type || 'none',
        retryAttempt: retryCount + 1
      };
      
      console.log(`Groq API请求诊断信息 (尝试 ${retryCount + 1}/${this.maxRetries + 1}):`, diagnosticInfo);
      
      // 将上下文消息转换为适合AI SDK的格式
      const messages = this.formatMessages(context, message);
      
      // 使用AI SDK的streamText函数
      try {
        // 创建一个更长的超时时间
        const timeoutMs = 90000; // 90秒
        
        const { textStream } = streamText({
          model: this.client(this.currentModel),
          messages: messages,
          abortSignal: this.createTimeoutSignal(timeoutMs),
        });
        
        let fullResponse = '';
        let chunkCount = 0;
        let lastChunkTime = Date.now();
        let hasReceivedValidData = false;
        
        // 设置一个接收数据的超时检查
        const dataTimeoutMs = 30000; // 30秒
        const dataTimeoutPromise = new Promise<never>((_, reject) => {
          setTimeout(() => {
            if (!hasReceivedValidData) {
              reject(new Error('数据接收超时'));
            }
          }, dataTimeoutMs);
        });
        
        // 使用Promise.race来处理流式响应或超时
        const streamPromise = (async () => {
          for await (const textPart of textStream) {
            // 更新计数器和时间戳
            chunkCount++;
            lastChunkTime = Date.now();
            
            if (textPart && textPart.trim()) {
              hasReceivedValidData = true;
              fullResponse += textPart;
              onChunk(textPart);
            }
          }
          
          return fullResponse;
        })();
        
        // 等待流式响应完成或超时
        fullResponse = await Promise.race([streamPromise, dataTimeoutPromise]);
        
        console.log(`Groq 流式响应完成: 收到 ${chunkCount} 个数据块，总长度 ${fullResponse.length} 字符`);
        
        if (!fullResponse || fullResponse.trim().length === 0) {
          console.warn('收到空响应，抛出错误');
          throw new Error('空响应');
        }
        
        return fullResponse;
      } catch (streamError: any) {
        console.error(`Groq 流式操作失败 (尝试 ${retryCount + 1}/${this.maxRetries + 1}):`, streamError, diagnosticInfo);
        
        // 检查是否可以重试
        if (retryCount < this.maxRetries && 
            (streamError.message.includes('空响应') || 
             streamError.message.includes('数据接收超时') ||
             streamError.message.includes('network') ||
             streamError.message.includes('Failed to fetch'))) {
          
          console.log(`Groq 流式请求失败，准备重试 (${retryCount + 1}/${this.maxRetries})...`);
          
          // 增加延迟时间，避免立即重试
          const delayMs = Math.min(1000 * Math.pow(2, retryCount), 10000);
          await new Promise(resolve => setTimeout(resolve, delayMs));
          
          // 递归调用自身进行重试
          return this.streamMessageWithRetry(message, context, onChunk, retryCount + 1);
        }
        
        // 重试次数用尽或不可重试的错误
        throw streamError;
      }
    } catch (error: any) {
      // 处理最终错误
      console.error('Groq API 流式请求最终失败:', error);
      
      let errorMessage = '请求失败，请稍后重试';
      
      if (error.message.includes('API密钥')) {
        errorMessage = 'API密钥无效或已过期，请更新API配置';
      } else if (error.message.includes('timeout') || error.message.includes('超时')) {
        errorMessage = '请求超时，请检查网络连接后重试';
      } else if (error.message.includes('Failed to fetch') || error.message.includes('network')) {
        errorMessage = '网络请求失败，请检查网络连接或代理设置';
      } else if (error.message.includes('空响应')) {
        errorMessage = '未收到任何响应数据，请重试';
      }
      
      throw new Error(errorMessage);
    }
  }
  
  formatMessages(context: ChatMessage[], currentMessage: string): any[] {
    // 转换上下文消息
    const formattedMessages = context.map(msg => ({
      role: msg.role,
      content: msg.content
    }));
    
    // 添加当前消息
    formattedMessages.push({
      role: 'user',
      content: currentMessage
    });
    
    return formattedMessages;
  }
  
  // 获取可用模型列表
  async fetchAvailableModels(): Promise<ModelInfo[]> {
    try {
      if (!this.apiKey) {
        throw new Error('API密钥未设置');
      }
      
      console.log('Groq: 获取可用模型列表...');
      
      const response = await fetch(`${this.apiUrl}/models`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('获取模型列表失败:', response.status, errorData);
        throw new Error(`获取模型列表失败: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      
      // 转换模型数据
      const models = data.data.map((model: any) => ({
        id: model.id,
        name: model.id
      }));
      
      console.log(`Groq: 找到 ${models.length} 个可用模型`);
      return models;
    } catch (error: any) {
      console.error('获取模型列表失败:', error);
      throw new Error(`获取模型列表失败: ${error.message}`);
    }
  }
} 