import { createOpenAI } from '@ai-sdk/openai';
import { generateText, streamText } from 'ai';

const API_URL = "https://new.wei.bi/v1";
const API_KEY = "sk-DW85c4MRi0VYKS8IW1GhaJZvn6HPZmcd558unQiDD1BjgC4f";

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

// 创建OpenAI提供程序实例
const openai = createOpenAI({
  apiKey: API_KEY,
  baseURL: API_URL,
  compatibility: 'compatible',
});

export class ChatService {
  // 添加重试计数器和最大重试次数
  private maxStreamRetries = 3;
  
  async sendMessage(message: string, context: ChatMessage[] = []): Promise<string> {
    try {
      // 将上下文消息转换为适合AI SDK的格式
      const messages = this.formatMessages(context, message);
      
      // 使用AI SDK的generateText函数
      const { text } = await generateText({
        model: openai('Meta-Llama-3.1-405B-Instruct'),
        messages: messages,
      });

      return text;
    } catch (error: any) {
      console.error('Chat API Error:', error);
      throw new Error('发送消息失败，请检查网络连接或API配置');
    }
  }

  // 使用AI SDK的streamText函数实现流式响应
  async streamMessage(message: string, context: ChatMessage[] = [], onChunk: (chunk: string) => void): Promise<string> {
    // 添加重试逻辑
    return this.streamMessageWithRetry(message, context, onChunk, 0);
  }
  
  // 带重试的流式消息实现
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
        apiUrl: API_URL,
        retryAttempt: retryCount + 1
      };
      
      console.log(`API请求诊断信息 (尝试 ${retryCount + 1}/${this.maxStreamRetries + 1}):`, diagnosticInfo);
      
      // 将上下文消息转换为适合AI SDK的格式
      const messages = this.formatMessages(context, message);
      
      // 使用AI SDK的streamText函数
      try {
        // 创建一个更长的超时时间
        const timeoutMs = 90000; // 90秒
        
        const { textStream } = streamText({
          model: openai('Meta-Llama-3.1-8B-Instruct'),
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
        
        console.log(`流式响应完成: 收到 ${chunkCount} 个数据块，总长度 ${fullResponse.length} 字符`);
        
        if (!fullResponse || fullResponse.trim().length === 0) {
          console.warn('收到空响应，抛出错误');
          throw new Error('空响应');
        }
        
        return fullResponse;
      } catch (streamError: any) {
        console.error(`流式操作失败 (尝试 ${retryCount + 1}/${this.maxStreamRetries + 1}):`, streamError, diagnosticInfo);
        
        // 检查是否为Windows环境中的特定错误
        if (typeof window !== 'undefined' && 
            navigator.userAgent.indexOf('Windows') !== -1 && 
            (streamError.message.includes('Failed to fetch') || 
             streamError.message.includes('network') || 
             streamError.message.includes('connection'))) {
          
          console.log('检测到Windows环境中的流式请求失败，尝试使用备用方法...');
          
          // 使用备用方法
          return await this.fallbackStreamRequest(messages, onChunk);
        }
        
        // 检查是否可以重试
        if (retryCount < this.maxStreamRetries && 
            (streamError.message.includes('空响应') || 
             streamError.message.includes('数据接收超时') ||
             streamError.message.includes('Failed to fetch') ||
             streamError.message.includes('network') ||
             streamError.message.includes('解析'))) {
          
          const delayMs = 2000 * (retryCount + 1); // 递增延迟
          console.log(`将在 ${delayMs}ms 后重试请求 (${retryCount + 1}/${this.maxStreamRetries})...`);
          
          // 延迟后重试
          await new Promise(resolve => setTimeout(resolve, delayMs));
          return this.streamMessageWithRetry(message, context, onChunk, retryCount + 1);
        }
        
        // 重新抛出原始错误
        throw streamError;
      }
    } catch (error: any) {
      console.error(`聊天API错误 (尝试 ${retryCount + 1}/${this.maxStreamRetries + 1}):`, error);
      
      // 检查是否为中止错误（用户取消或超时）
      if (error.name === 'AbortError') {
        throw new Error('请求超时，请检查网络连接后重试');
      }
      
      // 空响应错误处理
      if (error.message === '空响应') {
        throw new Error('服务器返回了空响应，请稍后重试');
      }
      
      // 数据接收超时
      if (error.message === '数据接收超时') {
        // 检查是否可以重试
        if (retryCount < this.maxStreamRetries) {
          const delayMs = 2000 * (retryCount + 1); // 递增延迟
          console.log(`数据接收超时，将在 ${delayMs}ms 后重试请求 (${retryCount + 1}/${this.maxStreamRetries})...`);
          
          // 延迟后重试
          await new Promise(resolve => setTimeout(resolve, delayMs));
          return this.streamMessageWithRetry(message, context, onChunk, retryCount + 1);
        } else {
          throw new Error('多次请求超时，请检查网络连接或API服务状态');
        }
      }
      
      // Windows特定错误处理
      if (typeof navigator !== 'undefined' && 
          navigator.userAgent.indexOf('Windows') !== -1 && 
          (error.message.includes('Failed to fetch') || 
           error.message.includes('network') || 
           error.message.includes('connection'))) {
        throw new Error('Windows环境连接API失败，请检查网络设置或防火墙配置');
      }
      
      throw new Error(error instanceof Error ? error.message : '发送消息失败');
    }
  }
  
  // 创建带超时的AbortSignal
  private createTimeoutSignal(timeoutMs: number): AbortSignal {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
    
    // 确保在信号被使用后清除超时
    const originalAbort = controller.abort.bind(controller);
    controller.abort = () => {
      clearTimeout(timeoutId);
      return originalAbort();
    };
    
    return controller.signal;
  }
  
  // Windows环境的备用请求方法
  private async fallbackStreamRequest(messages: any[], onChunk: (chunk: string) => void): Promise<string> {
    // 首先尝试使用fetch API的备用配置
    try {
      console.log('尝试使用备用fetch配置...');
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 60000);
      
      const response = await fetch(`${API_URL}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${API_KEY}`,
          'Accept': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
        },
        body: JSON.stringify({
          model: 'Meta-Llama-3.1-8B-Instruct',
          messages: messages.map(msg => ({
            role: msg.role,
            content: msg.content,
          })),
          stream: true,
        }),
        signal: controller.signal,
        // 特殊配置，解决某些Windows环境的问题
        mode: 'cors',
        credentials: 'same-origin',
        cache: 'no-store',
        redirect: 'follow',
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      if (!response.body) {
        throw new Error('响应内容为空');
      }
      
      const reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let fullResponse = '';
      let buffer = '';
      
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        const chunk = decoder.decode(value, { stream: true });
        buffer += chunk;
        
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';
        
        for (const line of lines) {
          const trimmedLine = line.trim();
          if (trimmedLine === '' || trimmedLine === 'data: [DONE]') continue;
          
          if (trimmedLine.startsWith('data: ')) {
            try {
              const jsonStr = trimmedLine.slice(6);
              if (this.isValidJSON(jsonStr)) {
                const data = JSON.parse(jsonStr);
                const content = data.choices?.[0]?.delta?.content || '';
                if (content) {
                  fullResponse += content;
                  onChunk(content);
                }
              }
            } catch (e) {
              console.warn('Parse error, continuing:', e);
            }
          }
        }
      }
      
      return fullResponse || '抱歉，服务器返回了空响应。请重试。';
    } catch (fetchError) {
      console.error('备用fetch配置失败，尝试使用XMLHttpRequest...', fetchError);
      
      // 如果备用fetch配置也失败，使用XMLHttpRequest
      return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        let fullResponse = '';
        let buffer = '';
        
        xhr.open('POST', `${API_URL}/chat/completions`);
        xhr.setRequestHeader('Content-Type', 'application/json');
        xhr.setRequestHeader('Authorization', `Bearer ${API_KEY}`);
        xhr.setRequestHeader('Accept', 'text/event-stream');
        xhr.setRequestHeader('Cache-Control', 'no-cache');
        xhr.setRequestHeader('Connection', 'keep-alive');
        
        xhr.timeout = 60000;
        
        xhr.onprogress = () => {
          if (xhr.status === 200) {
            const newText = xhr.responseText.substring(buffer.length);
            buffer = xhr.responseText;
            
            const lines = newText.split('\n');
            for (const line of lines) {
              const trimmedLine = line.trim();
              if (trimmedLine === '' || trimmedLine === 'data: [DONE]') continue;
              
              if (trimmedLine.startsWith('data: ')) {
                try {
                  const jsonStr = trimmedLine.slice(6);
                  if (this.isValidJSON(jsonStr)) {
                    const data = JSON.parse(jsonStr);
                    const content = data.choices?.[0]?.delta?.content || '';
                    if (content) {
                      fullResponse += content;
                      onChunk(content);
                    }
                  }
                } catch (e) {
                  console.warn('XHR parse error, continuing:', e);
                }
              }
            }
          }
        };
        
        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve(fullResponse || '抱歉，服务器返回了空响应。请重试。');
          } else {
            let errorMessage = '发送消息失败';
            if (xhr.status === 401) {
              errorMessage = 'API密钥无效或已过期';
            } else if (xhr.status === 404) {
              errorMessage = 'API地址无效';
            } else if (xhr.status === 429) {
              errorMessage = 'API调用次数超限';
            } else if (xhr.status >= 500) {
              errorMessage = 'API服务器错误';
            }
            reject(new Error(errorMessage));
          }
        };
        
        xhr.onerror = () => {
          reject(new Error('网络请求失败，请检查网络连接'));
        };
        
        xhr.ontimeout = () => {
          reject(new Error('请求超时，请检查网络连接后重试'));
        };
        
        xhr.send(JSON.stringify({
          model: 'Meta-Llama-3.1-8B-Instruct',
          messages: messages.map(msg => ({
            role: msg.role,
            content: msg.content,
          })),
          stream: true,
        }));
      });
    }
  }

  // 辅助方法：格式化消息
  private formatMessages(context: ChatMessage[], currentMessage: string) {
    // 将上下文消息转换为AI SDK格式
    const formattedMessages = context.map(msg => ({
      role: msg.role,
      content: msg.content,
    }));
    
    // 添加当前用户消息
    formattedMessages.push({
      role: 'user' as const,
      content: currentMessage,
    });
    
    return formattedMessages;
  }
  
  // 辅助方法：验证JSON字符串是否有效
  private isValidJSON(str: string): boolean {
    if (!str || typeof str !== 'string') return false;
    
    // 快速检查：JSON必须以{开始或以[开始
    if (!(str.trim().startsWith('{') || str.trim().startsWith('['))) {
      return false;
    }
    
    try {
      JSON.parse(str);
      return true;
    } catch (e) {
      return false;
    }
  }
}

// 导出单例实例
export const chatService = new ChatService(); 