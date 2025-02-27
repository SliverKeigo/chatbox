import { useState, useRef, useEffect } from 'react';
import { Chat, Message as MessageType } from './types/chat';
import { ChatList } from './components/Sidebar/ChatList';
import { Message } from './components/Chat/Message';
import { ChatInput } from './components/Chat/ChatInput';
import { chatService } from './services/api';


function App() {
  const [theme, setTheme] = useState<string>('light');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editingTitle, setEditingTitle] = useState('');
  const titleInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  

  const defaultChat: Chat = {
    id: 'default',
    title: '默认对话',
    messages: [],
    createdAt: new Date().toISOString()
  };

  const [chats, setChats] = useState<Chat[]>([defaultChat]);
  const [activeChat, setActiveChat] = useState<string>(defaultChat.id);
  const [isLoading, setIsLoading] = useState(false);
  const [streamingMessage, setStreamingMessage] = useState<MessageType | null>(null);
  
  const currentChat = chats.find(chat => chat.id === activeChat);

  // 自动滚动到最新消息
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // 当消息更新时自动滚动
  useEffect(() => {
    scrollToBottom();
  }, [currentChat?.messages, streamingMessage]);

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

  // 开始编辑对话标题
  const startEditingTitle = () => {
    if (currentChat) {
      setEditingTitle(currentChat.title);
      setIsEditingTitle(true);
      // 使用setTimeout确保DOM更新后再聚焦
      setTimeout(() => {
        titleInputRef.current?.focus();
        titleInputRef.current?.select();
      }, 50);
    }
  };

  // 保存编辑后的对话标题
  const saveTitle = () => {
    if (editingTitle.trim() && currentChat) {
      setChats(prevChats => prevChats.map(chat => {
        if (chat.id === activeChat) {
          return {
            ...chat,
            title: editingTitle.trim()
          };
        }
        return chat;
      }));
    }
    setIsEditingTitle(false);
  };

  // 处理标题输入框按键事件
  const handleTitleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      saveTitle();
    } else if (e.key === 'Escape') {
      setIsEditingTitle(false);
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

    // 添加用户消息
    setChats(prevChats => prevChats.map(chat => {
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
      // 创建一个初始的空助手消息用于流式更新
      const assistantMessageId = Date.now().toString();
      const initialAssistantMessage: MessageType = {
        id: assistantMessageId,
        content: '',
        timestamp: new Date().toISOString(),
        type: 'assistant'
      };
      
      setStreamingMessage(initialAssistantMessage);
      
      // 获取当前对话的上下文
      const context = currentChat?.messages.map(msg => ({
        role: msg.type,
        content: msg.content
      })) || [];
      
      // 使用流式响应
      const fullResponse = await chatService.streamMessage(
        content, 
        context,
        (chunk) => {
          // 更新流式消息内容
          setStreamingMessage(prev => {
            if (prev) {
              return {
                ...prev,
                content: prev.content + chunk
              };
            }
            return prev;
          });
        }
      );
      
      // 流式响应完成后，更新最终消息
      const finalAssistantMessage: MessageType = {
        id: assistantMessageId,
        content: fullResponse,
        timestamp: new Date().toISOString(),
        type: 'assistant'
      };
      
      // 更新聊天记录，只添加助手消息（用户消息已经添加过了）
      setChats(prevChats => prevChats.map(chat => {
        if (chat.id === activeChat) {
          return {
            ...chat,
            messages: [...chat.messages, finalAssistantMessage],
            lastMessage: finalAssistantMessage
          };
        }
        return chat;
      }));
      
    } catch (error) {
      console.error('Failed to get response:', error);
    } finally {
      setIsLoading(false);
      setStreamingMessage(null);
    }
  };

  return (
    <div className="flex h-screen" data-theme={theme}>
      {/* 侧边栏 */}
      <aside className={`${isSidebarCollapsed ? 'w-0 overflow-hidden' : 'w-56 md:w-64'} transition-all duration-300 flex flex-col h-full d-card rounded-none`}>
        <div className="p-3 d-card-title">
          <h2 className="text-lg font-bold">聊天列表</h2>
          <div className="flex gap-1">
            <button 
              className="d-btn d-btn-sm d-btn-ghost"
              onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
              title={isSidebarCollapsed ? '展开' : '收起'}
            >
              {isSidebarCollapsed ? '→' : '←'}
            </button>
            <button 
              className="d-btn d-btn-sm d-btn-circle"
              onClick={handleNewChat}
              title="新对话"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
            </button>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-2">
          <ChatList
            chats={chats}
            activeChat={activeChat}
            onChatSelect={setActiveChat}
            onChatDelete={(chatId) => {
              if (chatId === activeChat) {
                const otherChat = chats.find(chat => chat.id !== chatId);
                if (otherChat) {
                  setActiveChat(otherChat.id);
                }
              }
              setChats(prevChats => prevChats.filter(chat => chat.id !== chatId));
            }}
          />
        </div>
      </aside>
      

      <main className="flex-1 flex flex-col h-full">
        <header className="d-navbar shadow-sm">
          <div className="flex items-center">
            {isSidebarCollapsed && (
              <button 
                className="d-btn d-btn-sm d-btn-ghost mr-2"
                onClick={() => setIsSidebarCollapsed(false)}
                title="展开侧边栏"
              >
                ☰
              </button>
            )}
            {isEditingTitle ? (
              <input
                ref={titleInputRef}
                type="text"
                className="d-input d-input-sm d-input-bordered max-w-xs"
                value={editingTitle}
                onChange={(e) => setEditingTitle(e.target.value)}
                onBlur={saveTitle}
                onKeyDown={handleTitleKeyDown}
              />
            ) : (
              <h3 
                className="text-lg font-medium cursor-pointer hover:underline" 
                onClick={startEditingTitle}
                title="点击修改对话名称"
              >
                {currentChat?.title || '新对话'}
              </h3>
            )}
          </div>
          <div className="flex items-center gap-2">
            <select 
              className="d-select d-select-sm d-select-bordered w-full max-w-xs"
              value={theme}
              onChange={(e) => setTheme(e.target.value)}
            >
              <option value="light">🌝 Light</option>
              <option value="dark">🌚 Dark</option>
              <option value="cupcake">🧁 Cupcake</option>
              <option value="bumblebee">🐝 Bumblebee</option>
              <option value="emerald">💎 Emerald</option>
              <option value="corporate">🏢 Corporate</option>
              <option value="synthwave">🌃 Synthwave</option>
              <option value="retro">📺 Retro</option>
              <option value="cyberpunk">🤖 Cyberpunk</option>
              <option value="valentine">💝 Valentine</option>
              <option value="halloween">🎃 Halloween</option>
              <option value="garden">🌷 Garden</option>
              <option value="forest">🌲 Forest</option>
              <option value="aqua">💧 Aqua</option>
              <option value="lofi">🎵 Lo-Fi</option>
              <option value="pastel">🎨 Pastel</option>
              <option value="fantasy">🧚‍♀️ Fantasy</option>
              <option value="wireframe">📝 Wireframe</option>
              <option value="black">⚫ Black</option>
              <option value="luxury">💰 Luxury</option>
              <option value="dracula">🧛‍♂️ Dracula</option>
              <option value="cmyk">🖨️ CMYK</option>
              <option value="autumn">🍂 Autumn</option>
              <option value="business">💼 Business</option>
              <option value="acid">🧪 Acid</option>
              <option value="lemonade">🍋 Lemonade</option>
              <option value="night">🌙 Night</option>
              <option value="coffee">☕ Coffee</option>
              <option value="winter">❄️ Winter</option>
              <option value="dim">💡 Dim</option>
              <option value="nord">❄️ Nord</option>
              <option value="sunset">🌅 Sunset</option>
            </select>
          </div>
        </header>
        
        <div className="flex-1 overflow-y-auto p-4">
          {currentChat?.messages.map(message => (
            <Message key={message.id} message={message} />
          ))}
          {streamingMessage && (
            <Message key={streamingMessage.id} message={streamingMessage} />
          )}
          {isLoading && !streamingMessage && (
            <div className="d-chat d-chat-start mb-4">
              <div className="d-chat-header text-xs mb-1">
                AI助手
              </div>
              <div className="d-chat-bubble">
                <span className="d-loading d-loading-dots d-loading-sm"></span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
        
        <div className="p-3 d-navbar">
          <ChatInput
            onSendMessage={handleSendMessage}
            disabled={isLoading}
          />
        </div>
      </main>
    </div>
  );
}

export default App;
