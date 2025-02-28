import { useState, useRef, useEffect } from 'react';
import { Chat, Message as MessageType } from './types/chat';
import { ChatList } from './components/Sidebar/ChatList';
import { Message } from './components/Chat/Message';
import { ChatInput } from './components/Chat/ChatInput';
import { chatService } from './services/api';
import { storageService } from './services/store';


function App() {
  const [theme, setTheme] = useState<string | null>(null);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editingTitle, setEditingTitle] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);
  const [avatar, setAvatar] = useState<string>('');
  const titleInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const [chats, setChats] = useState<Chat[]>([]);
  const [activeChat, setActiveChat] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [streamingMessage, setStreamingMessage] = useState<MessageType | null>(null);
  
  const currentChat = chats.find(chat => chat.id === activeChat) || null;

  // 加载保存的数据
  useEffect(() => {
    const loadSavedData = async () => {
      try {
        console.log('开始加载保存的数据...');
        
        // 加载主题
        const savedTheme = await storageService.loadTheme();
        setTheme(savedTheme);
        
        // 加载头像
        const savedAvatar = await storageService.loadAvatar();
        setAvatar(savedAvatar);
        
        // 加载聊天列表
        const savedChats = await storageService.loadChats();
        console.log('加载到的聊天列表:', savedChats);
        
        // 加载上次活动的聊天
        const savedActiveChat = await storageService.loadActiveChat();
        console.log('加载到的活动聊天:', savedActiveChat);

        // 如果有保存的聊天列表，直接使用
        if (savedChats && savedChats.length > 0) {
          setChats(savedChats);
          // 如果有保存的活动聊天并且该聊天存在于列表中，则设置它
          if (savedActiveChat && savedChats.some(chat => chat.id === savedActiveChat)) {
            setActiveChat(savedActiveChat);
          } else {
            // 如果没有有效的活动聊天，设置第一个聊天为活动聊天
            setActiveChat(savedChats[0].id);
          }
        } else {
          // 如果没有保存的聊天，创建默认聊天
          const defaultChat: Chat = {
            id: 'default',
            title: '默认对话',
            messages: [],
            createdAt: new Date().toISOString()
          };
          setChats([defaultChat]);
          setActiveChat(defaultChat.id);
        }
        
        console.log('数据加载完成');
      } catch (error) {
        console.error('加载保存的数据失败:', error);
        setErrorMessage('加载保存的数据失败');
      } finally {
        setIsInitializing(false);
      }
    };

    loadSavedData();
  }, []);

  // 保存聊天数据的副作用
  useEffect(() => {
    const saveData = async () => {
      try {
        if (chats.length > 0) {
          console.log('保存聊天列表:', chats);
          await storageService.saveChats(chats);
        }
        if (activeChat !== null) {
          console.log('保存活动聊天:', activeChat);
          await storageService.saveActiveChat(activeChat);
        }
      } catch (error) {
        console.error('保存数据失败:', error);
        setErrorMessage('保存数据失败');
      }
    };

    // 只在初始化完成后才保存数据
    if (!isInitializing) {
      saveData();
    }
  }, [chats, activeChat, isInitializing]);

  // 保存主题设置
  useEffect(() => {
    if (theme !== null && !isInitializing) {
      console.log('Theme changed, saving:', theme);
      storageService.saveTheme(theme).catch(error => {
        console.error('Failed to save theme:', error);
        setErrorMessage('保存主题设置失败');
      });
    }
  }, [theme, isInitializing]);

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
    // 找出当前最大的对话编号
    const maxNumber = chats.reduce((max, chat) => {
      const match = chat.title.match(/新对话\s*(\d+)/);
      if (match) {
        const num = parseInt(match[1]);
        return num > max ? num : max;
      }
      return max;
    }, 0);

    const newChat: Chat = {
      id: Date.now().toString(),
      title: `新对话 ${maxNumber + 1}`,
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
    
    // 生成唯一的消息ID
    const generateMessageId = () => {
      return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    };
    
    const userMessage: MessageType = {
      id: generateMessageId(),
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
    setErrorMessage(null); // 清除之前的错误消息

    try {
      // 创建一个初始的空助手消息用于流式更新
      const assistantMessageId = generateMessageId();
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
      setErrorMessage(error instanceof Error ? error.message : '发送消息失败');
    } finally {
      setIsLoading(false);
      setStreamingMessage(null);
    }
  };


  useEffect(() => {
    if (errorMessage) {
      const timer = setTimeout(() => {
        setErrorMessage(null);
      }, 5000); // 5秒后自动隐藏
      return () => clearTimeout(timer);
    }
  }, [errorMessage]);

  // 渲染加载界面
  const renderLoading = () => {
    return (
      <div className="flex h-screen items-center justify-center" data-theme={theme || 'wireframe'}>
        <div className="d-loading d-loading-spinner d-loading-lg"></div>
      </div>
    );
  };

  // 如果还在初始化，显示加载界面
  if (isInitializing) {
    return renderLoading();
  }

  return (
    <div className="flex h-screen" data-theme={theme || 'wireframe'}>

      {errorMessage && (
        <div className="d-toast d-toast-top d-toast-center">
          <div className="d-alert d-alert-error">
            <span>{errorMessage}</span>
          </div>
        </div>
      )}

      <aside className={`${isSidebarCollapsed ? 'w-0 overflow-hidden' : 'w-56 md:w-64'} transition-all duration-300 flex flex-col h-full d-card rounded-none`}>
        <div className="px-2 py-2 d-card-title flex justify-between items-center">
        </div>
        <div className="flex-1 overflow-y-auto p-2">
          <ChatList
            chats={chats}
            activeChat={activeChat || undefined}
            onChatSelect={setActiveChat}
            onChatDelete={async (chatId) => {
              try {
                // 先从存储中删除
                await storageService.deleteChat(chatId);
                
                // 然后更新状态
                if (chatId === activeChat) {
                  const otherChat = chats.find(chat => chat.id !== chatId);
                  if (otherChat) {
                    setActiveChat(otherChat.id);
                  } else {
                    setActiveChat(null);
                  }
                }
                setChats(prevChats => prevChats.filter(chat => chat.id !== chatId));
              } catch (error) {
                console.error('删除聊天失败:', error);
                setErrorMessage('删除聊天失败');
              }
            }}
          />
        </div>
      </aside>
      

      <main className="flex-1 flex flex-col h-full">
        <header className="d-navbar shadow-sm px-4">
          <div className="flex-1 flex items-center">
            <button 
              className="d-btn d-btn-sm d-btn-ghost d-btn-circle mr-2"
              onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
              title={isSidebarCollapsed ? '展开' : '收起'}
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                {isSidebarCollapsed ? (
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
                )}
              </svg>
            </button>
            <button 
            className="d-btn d-btn-sm d-btn-ghost d-btn-circle mr-2"
            onClick={handleNewChat}
            title="新对话"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v6m3-3H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </button>
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
          <div className="flex items-center gap-4">
            <select 
              className="d-select d-select-sm d-select-bordered w-full max-w-xs"
              value={theme || 'wireframe'}
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
            <div className="d-avatar">
              <div className="w-10 h-10 rounded-full flex items-center justify-center">
                <img src={avatar} alt="用户头像" />
              </div>
            </div>
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
