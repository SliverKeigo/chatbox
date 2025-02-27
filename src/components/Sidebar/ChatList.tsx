import { Chat } from '../../types/chat';

interface ChatListProps {
  chats: Chat[];
  activeChat?: string;
  onChatSelect: (chatId: string) => void;
}

export function ChatList({ chats, activeChat, onChatSelect }: ChatListProps) {
  return (
    <ul className="d-menu d-menu-md p-0 [&_li>*]:rounded-md">
      {chats.map((chat) => (
        <li key={chat.id} className="mb-1">
          <a 
            className={chat.id === activeChat ? 'active font-medium' : 'font-medium'}
            onClick={() => onChatSelect(chat.id)}
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
  );
} 