import { Chat } from '../../types/chat';
import { useState, MouseEvent, useEffect } from 'react';

interface ChatListProps {
  chats: Chat[];
  activeChat?: string;
  onChatSelect: (chatId: string) => void;
  onChatDelete?: (chatId: string) => void;
}

export function ChatList({ chats, activeChat, onChatSelect, onChatDelete }: ChatListProps) {
  const [contextMenu, setContextMenu] = useState<{
    visible: boolean;
    x: number;
    y: number;
    chatId: string;
  }>({
    visible: false,
    x: 0,
    y: 0,
    chatId: ''
  });

  // 添加全局点击事件监听
  useEffect(() => {
    const handleGlobalClick = () => {
      if (contextMenu.visible) {
        setContextMenu(prev => ({ ...prev, visible: false }));
      }
    };

    document.addEventListener('click', handleGlobalClick);
    return () => {
      document.removeEventListener('click', handleGlobalClick);
    };
  }, [contextMenu.visible]);

  const handleContextMenu = (e: MouseEvent) => {
    e.preventDefault();
    e.stopPropagation(); // 阻止事件冒泡
    const chatId = (e.currentTarget as HTMLElement).dataset.chatId;
    if (chatId) {
      setContextMenu({
        visible: true,
        x: e.clientX,
        y: e.clientY,
        chatId
      });
    }
  };

  const handleDelete = (e: MouseEvent) => {
    e.stopPropagation(); // 阻止事件冒泡
    if (onChatDelete && contextMenu.chatId) {
      onChatDelete(contextMenu.chatId);
    }
  };

  return (
    <>
      <ul className="d-menu d-menu-md p-0 [&_li>*]:rounded-md">
        {chats.map((chat) => (
          <li key={chat.id} className="mb-1">
            <a 
              className={chat.id === activeChat ? 'active font-medium' : 'font-medium'}
              onClick={() => onChatSelect(chat.id)}
              onContextMenu={handleContextMenu}
              data-chat-id={chat.id}
            >
              <div className="flex flex-col">
                <span>{chat.title}</span>
                {chat.firstMessage?.content && (
                  <span className="text-xs opacity-70 truncate">{chat.firstMessage.content}</span>
                )}
              </div>
            </a>
          </li>
        ))}
      </ul>

      {contextMenu.visible && (
        <div 
          className="d-menu d-menu-sm bg-base-200 rounded-box shadow-lg fixed z-50 p-2"
          style={{ 
            left: `${contextMenu.x}px`, 
            top: `${contextMenu.y}px` 
          }}
          onClick={e => e.stopPropagation()} // 防止点击菜单本身时触发关闭
        >
          <li>
            <a 
              className="text-error" 
              onClick={handleDelete}
            >
              删除对话
            </a>
          </li>
        </div>
      )}
    </>
  );
} 