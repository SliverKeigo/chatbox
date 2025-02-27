import { useState, KeyboardEvent, useRef, useEffect, ChangeEvent } from 'react';

interface ChatInputProps {
  onSendMessage: (content: string) => void;
  disabled?: boolean;
}

export function ChatInput({ onSendMessage, disabled }: ChatInputProps) {
  const [message, setMessage] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // 自动调整高度
  const adjustHeight = () => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      const newHeight = Math.min(textarea.scrollHeight, 200); // 最大高度200px
      textarea.style.height = `${newHeight}px`;
    }
  };

  const handleChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    setMessage(e.target.value);
  };


  useEffect(() => {
    adjustHeight();
  }, [message]);

  const handleSend = () => {
    if (message.trim() && !disabled) {
      onSendMessage(message);
      setMessage('');
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    // 只处理纯 Enter 键
    if (e.key === 'Enter' && 
        !e.shiftKey && 
        !e.ctrlKey && 
        !e.altKey && 
        !e.metaKey && 

        !e.nativeEvent.isComposing &&

        e.nativeEvent.keyCode !== 229) {
      
      if (!disabled && message.trim()) {
        e.preventDefault();
        handleSend();
      }
    }
  };

  return (
    <div className="relative w-full">
      <textarea
        ref={textareaRef}
        rows={1}
        className="d-textarea d-textarea-bordered w-full pr-16 min-h-12 max-h-[200px] resize-none"
        value={message}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder={`输入消息... (${navigator.platform.includes('Mac') ? 'fn+E' : 'win+.'} 打开表情, Shift+Enter 换行)`}
        disabled={disabled}
      />
      <div className="absolute right-4 top-6 -translate-y-1/2">
        {disabled ? (
          <span className="d-loading d-loading-spinner d-loading-sm"></span>
        ) : (
          <kbd className="d-kbd d-kbd-sm opacity-50">↵</kbd>
        )}
      </div>
    </div>
  );
} 