import { Message as MessageType } from '../../types/chat';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneLight, oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import copy from 'copy-to-clipboard';
import { useState, useEffect } from 'react';
import { Components } from 'react-markdown';

interface MessageProps {
  message: MessageType;
}

export function Message({ message }: MessageProps) {
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  // 检测当前主题
  useEffect(() => {
    const detectTheme = () => {
      const htmlElement = document.documentElement;
      const currentTheme = htmlElement.getAttribute('data-theme');
      setTheme(currentTheme === 'dark' ? 'dark' : 'light');
    };

    detectTheme();
    
    // 创建一个观察器来监听data-theme属性的变化
    const observer = new MutationObserver(mutations => {
      mutations.forEach(mutation => {
        if (
          mutation.type === 'attributes' &&
          mutation.attributeName === 'data-theme'
        ) {
          detectTheme();
        }
      });
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme']
    });

    return () => observer.disconnect();
  }, []);

  const handleCopy = (code: string) => {
    copy(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  // 自定义代码高亮样式，覆盖默认的白色背景
  const getCustomStyle = () => {
    // 基于当前主题的样式
    const baseStyle = theme === 'dark' ? oneDark : oneLight;
    
    // 创建一个新的样式对象，覆盖背景色
    return {
      ...baseStyle,
      'pre[class*="language-"]': {
        ...baseStyle['pre[class*="language-"]'],
        background: 'transparent',
        margin: 0,
        padding: 0
      },
      'code[class*="language-"]': {
        ...baseStyle['code[class*="language-"]'],
        background: 'transparent',
      }
    };
  };

  const components: Components = {
    code({node, className, children, ...props}) {
      const match = /language-(\w+)/.exec(className || '');
      const code = String(children).replace(/\n$/, '');
      
      const isInline = !node?.position || 
        node.position.start.line === node.position.end.line;
      
      if (isInline) {
        return <code className="bg-opacity-50 bg-base-300 px-1 rounded text-sm" {...props}>{children}</code>;
      }

      if (match) {
        return (
          <div className="not-prose rounded overflow-hidden my-2 border border-base-300 border-opacity-30">
            <div className="flex justify-between items-center px-3 py-1 bg-base-300 bg-opacity-30 text-xs">
              <span className="opacity-70">{match[1]}</span>
              <button 
                className="p-1 hover:bg-base-300 rounded transition-colors"
                onClick={() => handleCopy(code)}
                title={copiedCode === code ? '已复制!' : '复制代码'}
              >
                {copiedCode === code ? (
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-3.5 h-3.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-3.5 h-3.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 01-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 011.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 00-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.375H9.375a1.125 1.125 0 01-1.125-1.125v-9.25m12 6.625v-1.875a3.375 3.375 0 00-3.375-3.375h-1.5a1.125 1.125 0 01-1.125-1.125v-1.5a3.375 3.375 0 00-3.375-3.375H9.75" />
                  </svg>
                )}
              </button>
            </div>
            <div className="overflow-x-auto text-sm bg-base-300 bg-opacity-20">
              <SyntaxHighlighter
                style={getCustomStyle()}
                language={match[1]}
                customStyle={{
                  margin: 0,
                  padding: '0.75rem',
                  background: 'transparent',
                  borderRadius: 0
                }}
                codeTagProps={{
                  style: {
                    fontSize: 'inherit'
                  }
                }}
              >
                {code}
              </SyntaxHighlighter>
            </div>
          </div>
        );
      }

      return <code className="bg-opacity-50 bg-base-300 px-1 rounded text-sm" {...props}>{children}</code>;
    }
  };

  return (
    <div className={`d-chat ${message.type === 'user' ? 'd-chat-end' : 'd-chat-start'} mb-4`}>
      <div className={`d-chat-bubble ${message.type === 'user' ? 'd-chat-bubble-primary' : ''}`}>
        <div className="prose max-w-none">
          <ReactMarkdown 
            remarkPlugins={[remarkGfm]}
            rehypePlugins={[rehypeRaw]}
            components={components}
          >
            {message.content}
          </ReactMarkdown>
        </div>
      </div>
      <div className="d-chat-footer opacity-50 text-xs mt-1">
        {new Date(message.timestamp).toLocaleTimeString()}
      </div>
    </div>
  );
} 