import { useState } from 'react';
import { Chat, Message as MessageType } from './types/chat';
import { ChatList } from './components/Sidebar/ChatList';
import { Message } from './components/Chat/Message';
import { ChatInput } from './components/Chat/ChatInput';
import { chatService } from './services/api';
import "./App.css";



function App() {

  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  

  const defaultChat: Chat = {
    id: 'default',
    title: '默认对话',
    messages: [],
    createdAt: new Date().toISOString()
  };

  const [chats, setChats] = useState<Chat[]>([defaultChat]);
  const [activeChat, setActiveChat] = useState<string>(defaultChat.id);
  const [isLoading, setIsLoading] = useState(false);
  
  const currentChat = chats.find(chat => chat.id === activeChat);

  // 创建新对话
  const handleNewChat = () => {
    const newChat: Chat = {
      id: Date.now().toString(),
      title: `新对话 ${chats.length + 1}`,
      messages: [],
      createdAt: new Date().toISOString()
    };
    setChats([...chats, newChat]);
    setActiveChat(newChat.id);
  };

  const getAssistantResponse = async (userMessage: string) => {
    try {
      console.log('Sending message:', userMessage);
      
      // 获取当前对话的上下文
      const context = currentChat?.messages.map(msg => ({
        role: msg.type,
        content: msg.content
      })) || [];

      const response = await chatService.sendMessage(userMessage, context);

      return {
        id: Date.now().toString(),
        content: response,
        timestamp: new Date().toISOString(),
        type: 'assistant' as const
      };
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  };

  const handleSendMessage = async (content: string) => {
    console.log('handleSendMessage', content);
    
    if (!activeChat || !content.trim()) return;
    
    const userMessage: MessageType = {
      id: Date.now().toString(),
      content,
      timestamp: new Date().toISOString(),
      type: 'user'
    };

    setChats(chats.map(chat => {
      if (chat.id === activeChat) {
        return {
          ...chat,
          messages: [...chat.messages, userMessage],
          lastMessage: userMessage,
          firstMessage: chat.firstMessage || userMessage
        };
      }
      return chat;
    }));

    setIsLoading(true);

    try {
      const assistantMessage = await getAssistantResponse(content);
      
      setChats(chats.map(chat => {
        if (chat.id === activeChat) {
          return {
            ...chat,
            messages: [...chat.messages, userMessage, assistantMessage],
            lastMessage: assistantMessage,
            firstMessage: chat.firstMessage || userMessage
          };
        }
        return chat;
      }));
    } catch (error) {
      // 可以添加错误提示UI
      console.error('Failed to get response:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="chat-container">
      <aside className={`sidebar ${isSidebarCollapsed ? 'collapsed' : ''}`}>
        <div className="sidebar-header">
          <div className="sidebar-actions">
            <button 
              className="collapse-button"
              onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            >
              {isSidebarCollapsed ? '展开' : '收起'}
            </button>
            <button 
              className="new-chat-button"
              onClick={handleNewChat}
            >
              新对话
            </button>
          </div>
        </div>
        <ChatList
          chats={chats}
          activeChat={activeChat}
          onChatSelect={setActiveChat}
        />
      </aside>
      
      <main className="chat-main">
        <div className="chat-header">
          <h3>{currentChat?.title || '新对话'}</h3>
        </div>
        <div className="messages-container">
          {currentChat?.messages.map(message => (
            <Message key={message.id} message={message} />
          ))}
          {isLoading && (
            <div className="message assistant">
              <div className="message-content">
                <div className="typing-indicator">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              </div>
            </div>
          )}
        </div>
        <ChatInput
          onSendMessage={handleSendMessage}
          disabled={isLoading}
        />
      </main>
    </div>
  );
}

export default App;
