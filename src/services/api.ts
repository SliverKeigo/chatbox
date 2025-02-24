import OpenAI from 'openai';

const API_URL = "https://new.openai.com/v1";
const API_KEY = "sk-";


const openai = new OpenAI({
  apiKey: API_KEY,
  baseURL: API_URL,
  dangerouslyAllowBrowser: true
});

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export class ChatService {
  async sendMessage(message: string, context: ChatMessage[] = []): Promise<string> {
    try {
      const response = await openai.chat.completions.create({
        model: 'Meta-Llama-3.1-8B-Instruct',
        messages: [
          ...context,
          { role: 'user', content: message }
        ],
      });

      return response.choices[0]?.message?.content || '';
    } catch (error) {
      console.error('Chat API Error:', error);
      throw new Error(error instanceof Error ? error.message : 'Failed to get response');
    }
  }
}

// 导出单例实例
export const chatService = new ChatService(); 