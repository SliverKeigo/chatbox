import { ProxyConfig } from '../../store/proxy';
import { ModelConfig } from '../../store/model';
import { BaseApiProvider, ChatMessage, ModelInfo } from '../base';

// Ollama使用不同的API格式，需要特殊处理
export class OllamaProvider extends BaseApiProvider {
  private apiUrl: string = "http://localhost:11434";
  private client: any = null;
  
  constructor() {
    super();
    this.currentModel = "llama2";
  }
  
  setProxyConfig(config: ProxyConfig | null): void {
    console.log('Ollama: 设置代理配置:', config);
    this.proxyConfig = config;
  }
  
  setModelConfig(config: ModelConfig | null): void {
    if (!config) return;
    
    console.log('Ollama: 设置模型配置:', config);
    this.modelConfig = config;
    this.apiUrl = config.apiUrl || this.apiUrl;
    this.currentModel = config.model || this.currentModel;
  }
  
  setCurrentModel(model: string): void {
    console.log('Ollama: 设置当前模型:', model);
    this.currentModel = model;
  }
  
  async sendMessage(message: string, context: ChatMessage[] = []): Promise<string> {
    try {
      const messages = this.formatMessages(context, message);
      
      const response = await fetch(`${this.apiUrl}/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: this.currentModel,
          messages: messages,
          stream: false,
        }),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      return data.message.content;
    } catch (error: any) {
      console.error('Ollama API Error:', error);
      throw new Error('发送消息失败，请检查Ollama服务是否运行');
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
      
      console.log(`Ollama API请求诊断信息 (尝试 ${retryCount + 1}/${this.maxRetries + 1}):`, diagnosticInfo);
      
      // 将上下文消息转换为适合Ollama API的格式
      const messages = this.formatMessages(context, message);
      
      try {
        // 创建一个更长的超时时间
        const timeoutMs = 90000; // 90秒
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
        
        const response = await fetch(`${this.apiUrl}/api/chat`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: this.currentModel,
            messages: messages,
            stream: true,
          }),
          signal: controller.signal,
        });
        
        clearTimeout(timeoutId);
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        if (!response.body) {
          throw new Error('响应没有可读取的流');
        }
        
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let fullResponse = '';
        let chunkCount = 0;
        let hasReceivedValidData = false;
        
        // 设置一个接收数据的超时检查
        const dataTimeoutMs = 30000; // 30秒
        let dataTimeoutId: any = null;
        
        const dataTimeoutPromise = new Promise<never>((_, reject) => {
          dataTimeoutId = setTimeout(() => {
            if (!hasReceivedValidData) {
              reject(new Error('数据接收超时'));
            }
          }, dataTimeoutMs);
        });
        
        // 处理流式响应
        const streamPromise = (async () => {
          try {
            while (true) {
              const { done, value } = await reader.read();
              
              if (done) {
                break;
              }
              
              const chunk = decoder.decode(value, { stream: true });
              
              // Ollama返回的是JSON行，每行是一个事件
              const lines = chunk.split('\n').filter(line => line.trim());
              
              for (const line of lines) {
                try {
                  const data = JSON.parse(line);
                  
                  if (data.message && data.message.content) {
                    chunkCount++;
                    hasReceivedValidData = true;
                    
                    const textPart = data.message.content;
                    fullResponse += textPart;
                    onChunk(textPart);
                  }
                } catch (e) {
                  console.warn('解析Ollama响应JSON失败:', e);
                }
              }
            }
            
            return fullResponse;
          } finally {
            clearTimeout(dataTimeoutId);
          }
        })();
        
        // 等待流式响应完成或超时
        fullResponse = await Promise.race([streamPromise, dataTimeoutPromise]);
        
        console.log(`Ollama 流式响应完成: 收到 ${chunkCount} 个数据块，总长度 ${fullResponse.length} 字符`);
        
        if (!fullResponse || fullResponse.trim().length === 0) {
          console.warn('收到空响应，抛出错误');
          throw new Error('空响应');
        }
        
        return fullResponse;
      } catch (streamError: any) {
        console.error(`Ollama 流式操作失败 (尝试 ${retryCount + 1}/${this.maxRetries + 1}):`, streamError, diagnosticInfo);
        
        // 检查是否可以重试
        if (retryCount < this.maxRetries && 
            (streamError.message.includes('空响应') || 
             streamError.message.includes('数据接收超时') ||
             streamError.message.includes('network') ||
             streamError.message.includes('Failed to fetch'))) {
          
          console.log(`Ollama 流式请求失败，准备重试 (${retryCount + 1}/${this.maxRetries})...`);
          
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
      console.error('Ollama API 流式请求最终失败:', error);
      
      let errorMessage = '请求失败，请稍后重试';
      
      if (error.message.includes('timeout') || error.message.includes('超时')) {
        errorMessage = '请求超时，请检查Ollama服务是否运行';
      } else if (error.message.includes('Failed to fetch') || error.message.includes('network')) {
        errorMessage = '网络请求失败，请检查Ollama服务是否运行';
      } else if (error.message.includes('空响应')) {
        errorMessage = '未收到任何响应数据，请重试';
      }
      
      throw new Error(errorMessage);
    }
  }
  
  formatMessages(context: ChatMessage[], currentMessage: string): any[] {
    // 转换上下文消息为Ollama格式
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
      console.log('Ollama: 获取可用模型列表...');
      
      const response = await fetch(`${this.apiUrl}/api/tags`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`获取模型列表失败: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      
      // 转换模型数据
      const models = data.models.map((model: any) => ({
        id: model.name,
        name: model.name
      }));
      
      console.log(`Ollama: 找到 ${models.length} 个可用模型`);
      return models;
    } catch (error: any) {
      console.error('获取模型列表失败:', error);
      throw new Error(`获取模型列表失败: ${error.message}`);
    }
  }
} 