import { Chat } from '../../types/chat';

interface ChatListProps {
  chats: Chat[];
  activeChat?: string;
  onChatSelect: (chatId: string) => void;
}

export function ChatList({ chats, activeChat, onChatSelect }: ChatListProps) {
  return (
    <div className="chat-list">
      {chats.map((chat) => (
        <div
          key={chat.id}
          className={`chat-item ${chat.id === activeChat ? 'active' : ''}`}
          onClick={() => onChatSelect(chat.id)}
        >
          <h4>{chat.title}</h4>
          <p className="last-message">{chat.firstMessage?.content}</p>
        </div>
      ))}
    </div>
  );
} 