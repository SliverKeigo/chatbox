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
    <div className="flex items-center">
      <label className="d-input d-input-bordered flex items-center gap-2 w-full">
        <input
          type="text"
          className="grow"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="输入消息..."
          disabled={disabled}
        />
        <kbd className="d-kbd d-kbd-sm">⏎</kbd>
      </label>
    </div>
  );
} 