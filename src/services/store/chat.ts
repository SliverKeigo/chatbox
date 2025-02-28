import { Chat } from '../../types/chat';
import { BaseStorageService } from './base';

const defaultState = {
  chats: [] as Chat[],
  activeChat: null as string | null,
};

export class ChatStorageService extends BaseStorageService {
  // 删除聊天数据
  async deleteChat(chatId: string) {
    try {
      console.log('Deleting chat:', chatId);
      const store = await this.ensureStore();
      
      // 获取当前的聊天列表
      const chats = await store.get<Chat[]>('chats') || [];
      
      // 从列表中移除指定的聊天
      const updatedChats = chats.filter(chat => chat.id !== chatId);
      
      // 保存更新后的列表
      await store.set('chats', updatedChats);
      
      // 如果删除的是当前活动的聊天，也需要更新 activeChat
      const currentActiveChat = await store.get<string>('activeChat');
      if (currentActiveChat === chatId) {
        const newActiveChat = updatedChats.length > 0 ? updatedChats[0].id : null;
        await store.set('activeChat', newActiveChat);
      }
      
      await store.save();
      console.log('Chat deleted successfully');
    } catch (error) {
      console.error('Failed to delete chat:', error);
      throw new Error('删除聊天记录失败');
    }
  }

  // 保存聊天列表
  async saveChats(chats: Chat[]) {
    try {
      console.log('Saving chats:', chats);
      const store = await this.ensureStore();
      
      // 先获取当前的聊天列表，避免重复保存相同的数据
      const currentChats = await store.get<Chat[]>('chats');
      if (JSON.stringify(currentChats) === JSON.stringify(chats)) {
        console.log('Chats unchanged, skipping save');
        return;
      }
      
      await store.set('chats', chats);
      await store.save();
      console.log('Chats saved successfully:', chats);
    } catch (error) {
      console.error('Failed to save chats:', error);
      throw new Error('保存聊天记录失败');
    }
  }

  // 加载聊天列表
  async loadChats(): Promise<Chat[]> {
    try {
      console.log('Loading chats...');
      const store = await this.ensureStore();
      const chats = await store.get<Chat[]>('chats');
      console.log('Raw loaded chats:', chats);
      
      if (!chats || !Array.isArray(chats)) {
        console.log('No valid chats found, using default:', defaultState.chats);
        return defaultState.chats;
      }
      
      console.log('Using stored chats:', chats);
      return chats;
    } catch (error) {
      console.error('Failed to load chats:', error);
      return defaultState.chats;
    }
  }

  // 保存当前活动聊天ID
  async saveActiveChat(chatId: string | null) {
    try {
      console.log('Saving active chat:', chatId);
      const store = await this.ensureStore();
      
      // 先获取当前的活动聊天ID，避免重复保存相同的值
      const currentActiveChat = await store.get<string>('activeChat');
      if (currentActiveChat === chatId) {
        console.log('Active chat unchanged, skipping save');
        return;
      }
      
      await store.set('activeChat', chatId);
      await store.save();
      console.log('Active chat saved successfully:', chatId);
    } catch (error) {
      console.error('Failed to save active chat:', error);
      throw new Error('保存当前对话失败');
    }
  }

  // 加载当前活动聊天ID
  async loadActiveChat(): Promise<string | null> {
    try {
      console.log('Loading active chat...');
      const store = await this.ensureStore();
      const activeChat = await store.get<string>('activeChat');
      console.log('Raw loaded active chat:', activeChat);
      
      if (!activeChat) {
        console.log('No active chat found, using default:', defaultState.activeChat);
        return defaultState.activeChat;
      }
      
      console.log('Using stored active chat:', activeChat);
      return activeChat;
    } catch (error) {
      console.error('Failed to load active chat:', error);
      return defaultState.activeChat;
    }
  }
}

export const chatStorage = new ChatStorageService(); 