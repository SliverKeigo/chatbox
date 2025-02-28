import { useState, useRef, useEffect } from 'react';
import { Chat, Message as MessageType } from './types/chat';
import { ChatList } from './components/Sidebar/ChatList';
import { Message } from './components/Chat/Message';
import { ChatInput } from './components/Chat/ChatInput';
import { SettingsDialog } from './components/Settings/SettingsDialog';
import { chatService } from './services/api';
import { chatStorage, themeStorage, userStorage } from './services/store/index';


function App() {
  const [theme, setTheme] = useState<string | null>(null);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
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
        const savedTheme = await themeStorage.loadTheme();
        setTheme(savedTheme);
        
        // 加载头像
        const savedAvatar = await userStorage.loadAvatar();
        setAvatar(savedAvatar);
        
        // 加载聊天列表
        const savedChats = await chatStorage.loadChats();
        console.log('加载到的聊天列表:', savedChats);
        
        // 加载上次活动的聊天
        const savedActiveChat = await chatStorage.loadActiveChat();
        console.log('加载到的活动聊天:', savedActiveChat);

        // 如果有保存的聊天列表，直接使用
        if (savedChats && savedChats.length > 0) {
          setChats(savedChats);
          // 如果有保存的活动聊天并且该聊天存在于列表中，则设置它
          if (savedActiveChat && savedChats.some((chat: Chat) => chat.id === savedActiveChat)) {
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
      } catch (error: any) {
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
          await chatStorage.saveChats(chats);
        }
        if (activeChat !== null) {
          console.log('保存活动聊天:', activeChat);
          await chatStorage.saveActiveChat(activeChat);
        }
      } catch (error: any) {
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
      themeStorage.saveTheme(theme).catch((error: any) => {
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
    <div className="flex h-screen overflow-hidden" data-theme={theme || 'wireframe'}>

      {errorMessage && (
        <div className="d-toast d-toast-top d-toast-center z-50">
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
                await chatStorage.deleteChat(chatId);
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
        
        <div className="p-5 border-t">
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            fill="none" 
            viewBox="0 0 24 24" 
            strokeWidth={1.5} 
            stroke="currentColor" 
            className="w-5 h-5 cursor-pointer hover:text-primary"
            onClick={() => setIsSettingsOpen(true)}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </div>
      </aside>
      

      <main className="flex-1 flex flex-col h-full min-w-0">
        <header className="d-navbar shadow-sm px-2 md:px-4">
          <div className="flex-1 flex items-center overflow-hidden">
            <button 
              className="d-btn d-btn-sm d-btn-ghost d-btn-circle mr-1 md:mr-2 flex-shrink-0"
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
              className="d-btn d-btn-sm d-btn-ghost d-btn-circle mr-1 md:mr-2 flex-shrink-0"
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
                className="d-input d-input-sm d-input-bordered max-w-xs flex-shrink"
                value={editingTitle}
                onChange={(e) => setEditingTitle(e.target.value)}
                onBlur={saveTitle}
                onKeyDown={handleTitleKeyDown}
              />
            ) : (
              <h3 
                className="text-lg font-medium cursor-pointer hover:underline truncate"
                onClick={startEditingTitle}
                title="点击修改对话名称"
              >
                {currentChat?.title || '新对话'}
              </h3>
            )}
          </div>
          <div className="flex items-center gap-2 md:gap-4">
            <select 
              className="d-select d-select-sm d-select-bordered w-full max-w-[120px] md:max-w-xs hidden sm:block"
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
            <div className="d-dropdown d-dropdown-end sm:hidden">
              <div tabIndex={0} role="button" className="d-btn d-btn-ghost d-btn-circle d-btn-sm">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.098 19.902a3.75 3.75 0 005.304 0l6.401-6.402M6.75 21A3.75 3.75 0 013 17.25V4.125C3 3.504 3.504 3 4.125 3h5.25c.621 0 1.125.504 1.125 1.125v4.072M6.75 21a3.75 3.75 0 003.75-3.75V8.197M6.75 21h13.125c.621 0 1.125-.504 1.125-1.125v-5.25c0-.621-.504-1.125-1.125-1.125h-4.072M10.5 8.197l2.88-2.88c.438-.439 1.15-.439 1.59 0l3.712 3.713c.44.44.44 1.152 0 1.59l-2.879 2.88M6.75 17.25h.008v.008H6.75v-.008z" />
                </svg>
              </div>
              <ul tabIndex={0} className="d-dropdown-content z-[1] d-menu p-2 shadow bg-base-100 rounded-box w-52">
                {["light", "dark", "wireframe", "cupcake", "bumblebee", "emerald", "corporate"].map(t => (
                  <li key={t}>
                    <a 
                      className={theme === t ? "active" : ""} 
                      onClick={() => setTheme(t)}
                    >
                      {t.charAt(0).toUpperCase() + t.slice(1)}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
            <div className="d-avatar flex-shrink-0">
              <div className="w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center">
                <img src={avatar} alt="用户头像" />
              </div>
            </div>
          </div>
        </header>
        
        <div className="flex-1 overflow-y-auto p-2 md:p-4">
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
        
        <div className="p-2 md:p-3 d-navbar">
          <ChatInput
            onSendMessage={handleSendMessage}
            disabled={isLoading}
          />
        </div>
      </main>

      <SettingsDialog 
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />
    </div>
  );
}

export default App;
