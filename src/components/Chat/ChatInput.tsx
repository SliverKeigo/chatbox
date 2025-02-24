import { useState, KeyboardEvent } from 'react';

interface ChatInputProps {
  onSendMessage: (content: string) => void;
  disabled?: boolean;
}

export function ChatInput({ onSendMessage, disabled }: ChatInputProps) {
  const [message, setMessage] = useState('');

  const handleSend = () => {
    if (message.trim() && !disabled) {
      onSendMessage(message);
      setMessage('');
    }
  };

  const handleKeyPress = (e: KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey && !disabled) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="input-container">
      <textarea
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        onKeyPress={handleKeyPress}
        placeholder="输入消息..."
        rows={4}
        disabled={disabled}
      />
      <div className="input-actions">
        <button 
          className="send-button" 
          onClick={handleSend}
          disabled={disabled || !message.trim()}
        >
          发送
        </button>
      </div>
    </div>
  );
} 