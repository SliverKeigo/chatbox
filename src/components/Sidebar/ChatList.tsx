import { Chat } from '../../types/chat';
import { useState, MouseEvent } from 'react';

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


  const handleContextMenu = (e: MouseEvent, chatId: string) => {
    e.preventDefault();
    setContextMenu({
      visible: true,
      x: e.clientX,
      y: e.clientY,
      chatId
    });
  };


  const handleDelete = () => {
    if (onChatDelete && contextMenu.chatId) {
      onChatDelete(contextMenu.chatId);
    }
    setContextMenu({ ...contextMenu, visible: false });
  };


  const handleClick = () => {
    if (contextMenu.visible) {
      setContextMenu({ ...contextMenu, visible: false });
    }
  };

  return (
    <>
      <ul 
        className="d-menu d-menu-md p-0 [&_li>*]:rounded-md" 
        onClick={handleClick}
      >
        {chats.map((chat) => (
          <li key={chat.id} className="mb-1">
            <a 
              className={chat.id === activeChat ? 'active font-medium' : 'font-medium'}
              onClick={() => onChatSelect(chat.id)}
              onContextMenu={(e) => handleContextMenu(e, chat.id)}
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