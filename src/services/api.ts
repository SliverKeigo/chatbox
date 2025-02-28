import { createOpenAI } from '@ai-sdk/openai';
import { generateText } from 'ai';

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
  compatibility: 'strict', // 使用OpenAI API时启用严格模式
});

export class ChatService {
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
    } catch (error) {
      console.error('Chat API Error:', error);
      throw new Error('发送消息失败，请检查网络连接或API配置');
    }
  }

  // 添加流式响应方法 - 使用原生fetch API实现流式响应
  async streamMessage(message: string, context: ChatMessage[] = [], onChunk: (chunk: string) => void): Promise<string> {
    try {
      // 将上下文消息转换为适合API的格式
      const messages = [
        ...context.map(msg => ({
          role: msg.role,
          content: msg.content,
        })),
        { role: 'user', content: message }
      ];
      
      // 使用fetch API直接调用
      const response = await fetch(`${API_URL}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${API_KEY}`,
        },
        body: JSON.stringify({
          model: 'Meta-Llama-3.1-8B-Instruct',
          messages: messages,
          stream: true,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('API Response Error:', {
          status: response.status,
          statusText: response.statusText,
          error: errorText
        });
        
        let errorMessage = '发送消息失败';
        if (response.status === 401) {
          errorMessage = 'API密钥无效或已过期';
        } else if (response.status === 404) {
          errorMessage = 'API地址无效';
        } else if (response.status === 429) {
          errorMessage = 'API调用次数超限';
        } else if (response.status >= 500) {
          errorMessage = 'API服务器错误';
        }
        
        throw new Error(errorMessage);
      }

      if (!response.body) {
        throw new Error('响应内容为空');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let fullResponse = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        const chunk = decoder.decode(value);
        const lines = chunk
          .split('\n')
          .filter(line => line.trim() !== '' && line.trim() !== 'data: [DONE]');
        
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              const content = data.choices[0]?.delta?.content || '';
              if (content) {
                fullResponse += content;
                onChunk(content);
              }
            } catch (e) {
              console.error('Error parsing SSE:', line, e);
              throw new Error('解析响应数据失败');
            }
          }
        }
      }
      
      if (!fullResponse) {
        throw new Error('未收到有效的响应内容');
      }
      
      return fullResponse;
    } catch (error) {
      console.error('Chat API Error:', error);
      throw new Error(error instanceof Error ? error.message : '发送消息失败');
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
}

// 导出单例实例
export const chatService = new ChatService(); 