export interface Message {
  id: string;
  content: string;
  timestamp: string;
  type: 'user' | 'assistant';

}

export interface Chat {
  id: string;
  title: string;
  messages: Message[];
  firstMessage?: Message;
  lastMessage?: Message;
  createdAt: string;
} 