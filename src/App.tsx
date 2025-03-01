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
  const [username, setUsername] = useState<string>('');
  const [retryCount, setRetryCount] = useState<number>(0);
  const maxRetries = 3;
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
        
        // 加载用户名
        const savedUsername = await userStorage.loadName();
        setUsername(savedUsername);
        
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
    
    // 创建一个初始的空助手消息用于流式更新
    const assistantMessageId = generateMessageId();
    const initialAssistantMessage: MessageType = {
      id: assistantMessageId,
      content: '',
      timestamp: new Date().toISOString(),
      type: 'assistant'
    };
    
    // 不立即设置streamingMessage，而是等待第一个数据块到达
    
    // 添加超时处理
    let responseTimeout: NodeJS.Timeout | null = setTimeout(() => {
      if (!streamingMessage || !streamingMessage.content.trim()) {
        console.warn('响应超时 - 未收到有效数据');
        setErrorMessage('响应超时，未收到数据');
        setIsLoading(false);
      }
    }, 20000); // 20秒超时
    
    try {
      // 获取当前对话的上下文
      const context = currentChat?.messages.map(msg => ({
        role: msg.type,
        content: msg.content
      })) || [];
      
      let messageAdded = false; // 跟踪消息是否已添加到UI
      
      // 直接使用API服务发送消息，API服务内部已经实现了重试逻辑
      const fullResponse = await chatService.streamMessage(
        content, 
        context,
        (chunk) => {
          if (chunk && chunk.trim()) {
            // 第一个有效数据块到达时创建消息气泡
            if (!messageAdded) {
              messageAdded = true; // 标记消息已添加
              console.log('创建初始消息气泡');
              
              // 检查是否已经存在相同ID的消息
              const messageExists = currentChat?.messages.some(msg => msg.id === initialAssistantMessage.id) || false;
              
              if (!messageExists) {
                setStreamingMessage({
                  ...initialAssistantMessage,
                  content: chunk
                });
              }
            } else {
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
          }
        }
      );
      
      // 清除超时
      if (responseTimeout) {
        clearTimeout(responseTimeout);
        responseTimeout = null;
      }
      
      // 流式响应完成后，更新最终消息
      if (fullResponse && fullResponse.trim()) {
        const finalAssistantMessage: MessageType = {
          id: assistantMessageId,
          content: fullResponse,
          timestamp: new Date().toISOString(),
          type: 'assistant'
        };
        
        // 更新聊天记录，只添加助手消息（用户消息已经添加过了）
        setChats(prevChats => prevChats.map(chat => {
          if (chat.id === activeChat) {
            // 检查是否已经存在相同ID的消息，避免重复
            const messageExists = chat.messages.some(msg => msg.id === assistantMessageId);
            if (messageExists) {
              // 如果消息已存在，则更新内容而不是添加新消息
              return {
                ...chat,
                messages: chat.messages.map(msg => 
                  msg.id === assistantMessageId ? finalAssistantMessage : msg
                ),
                lastMessage: finalAssistantMessage
              };
            } else {
              // 如果消息不存在，则添加新消息
              return {
                ...chat,
                messages: [...chat.messages, finalAssistantMessage],
                lastMessage: finalAssistantMessage
              };
            }
          }
          return chat;
        }));
      } else {
        // 如果响应为空，显示错误
        setErrorMessage('收到了空响应，请重试');
      }
    } catch (error: any) {
      console.error('Failed to get response:', error);
      
      // 清除超时
      if (responseTimeout) {
        clearTimeout(responseTimeout);
        responseTimeout = null;
      }
      
      // 提供更友好的错误消息
      let friendlyError = error instanceof Error ? error.message : '发送消息失败';
      
      if (friendlyError.includes('解析响应数据失败') || friendlyError.includes('空响应')) {
        friendlyError = '服务器返回了无效数据，请稍后重试';
      } else if (friendlyError.includes('超时')) {
        friendlyError = '请求超时，请检查网络连接后重试';
      } else if (friendlyError.includes('API密钥')) {
        friendlyError = 'API密钥无效或已过期，请更新API配置';
      } else if (friendlyError.includes('Windows环境连接API失败')) {
        friendlyError = 'Windows环境连接API失败，请检查网络设置、代理或防火墙配置';
      } else if (friendlyError.includes('Failed to fetch')) {
        friendlyError = '网络请求失败，请检查网络连接或代理设置';
      } else if (friendlyError.includes('网络请求失败')) {
        friendlyError = '网络连接异常，请检查网络状态后重试';
      }
      
      setErrorMessage(friendlyError);
    } finally {
      setIsLoading(false);
      
      // 确保在完成后清除streamingMessage
      setStreamingMessage(null);
    }
  };

  // 更新主题
  const handleThemeChange = (newTheme: string) => {
    setTheme(newTheme);
  };

  // 更新头像
  const handleAvatarChange = (newAvatar: string) => {
    setAvatar(newAvatar);
  };

  // 更新用户名
  const handleUsernameChange = (newUsername: string) => {
    setUsername(newUsername);
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

      <aside className={`${isSidebarCollapsed ? 'w-0 overflow-hidden' : 'flex-shrink-0'} transition-all duration-300 flex flex-col h-full d-card rounded-none relative`}>
        <div className="px-2 py-2 d-card-title flex justify-between items-center">
          <h2 className="text-lg font-bold">聊天列表</h2>
          <button 
            className="d-btn d-btn-sm d-btn-ghost d-btn-circle"
            onClick={handleNewChat}
            title="新对话"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
          </button>
        </div>
        
        <div className="flex-1 overflow-hidden">
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
            <button
              className="d-btn d-btn-sm d-btn-ghost d-btn-circle"
              onClick={() => setIsSettingsOpen(true)}
              title="设置"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </button>
            <div className="flex items-center gap-2">
              {username && (
                <span className="text-sm font-medium hidden md:inline-block">
                  {username}
                </span>
              )}
              <div className="d-avatar flex-shrink-0">
                <div className="w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center">
                  <img src={avatar} alt="用户头像" />
                </div>
              </div>
            </div>
          </div>
        </header>
        
        <div className="flex-1 overflow-y-auto p-2 md:p-4">
          {currentChat?.messages.map(message => (
            <Message key={message.id} message={message} />
          ))}
          {streamingMessage && streamingMessage.content.trim() && 
           // 确保不显示已经在currentChat.messages中的消息
           !currentChat?.messages.some(msg => msg.id === streamingMessage.id) && (
            <Message key={streamingMessage.id} message={streamingMessage} />
          )}
          {isLoading && !streamingMessage && (
            <div className="flex justify-center my-4">
              <span className="d-loading d-loading-dots d-loading-md"></span>
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
        onThemeChange={handleThemeChange}
        onAvatarChange={handleAvatarChange}
        onUsernameChange={handleUsernameChange}
      />
    </div>
  );
}

export default App;
