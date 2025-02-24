import { Message as MessageType } from '../../types/chat';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import copy from 'copy-to-clipboard';
import { useState } from 'react';
import { Components } from 'react-markdown';

interface MessageProps {
  message: MessageType;
}

export function Message({ message }: MessageProps) {
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const handleCopy = (code: string) => {
    copy(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const components: Components = {
    code({node, className, children, ...props}) {
      const match = /language-(\w+)/.exec(className || '');
      const code = String(children).replace(/\n$/, '');
      

      const isInline = !node?.position || 
        node.position.start.line === node.position.end.line;
      
      if (isInline) {
        return <code className={className} {...props}>{children}</code>;
      }

      if (match) {
        return (
          <div className="code-block">
            <div className="code-header">
              <span className="code-language">{match[1]}</span>
              <button 
                className="copy-button"
                onClick={() => handleCopy(code)}
              >
                {copiedCode === code ? '已复制!' : '复制'}
              </button>
            </div>
            <SyntaxHighlighter
              style={vscDarkPlus}
              language={match[1]}
              PreTag="div"
            >
              {code}
            </SyntaxHighlighter>
          </div>
        );
      }

      return <code className={className} {...props}>{children}</code>;
    }
  };

  return (
    <div className={`message ${message.type}`}>
      <div className="message-content">
        <div className="message-text">
          <ReactMarkdown 
            remarkPlugins={[remarkGfm]}
            rehypePlugins={[rehypeRaw]}
            components={components}
          >
            {message.content}
          </ReactMarkdown>
        </div>
        <p className="message-timestamp">{message.timestamp}</p>
      </div>
    </div>
  );
} 