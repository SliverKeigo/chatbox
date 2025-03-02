import { Chat } from '../../types/chat';
import { useState, MouseEvent, useEffect, useRef } from 'react';

interface ChatListProps {
  chats: Chat[];
  activeChat?: string;
  isSidebarCollapsed?: boolean;
  onChatSelect: (chatId: string) => void;
  onChatDelete?: (chatId: string) => void;
}

export function ChatList({ chats, activeChat, onChatSelect, onChatDelete, isSidebarCollapsed = false }: ChatListProps) {
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
  
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isScrolling, setIsScrolling] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  
  // 添加宽度调整相关状态
  const [containerWidth, setContainerWidth] = useState(240); // 默认宽度
  const [isResizing, setIsResizing] = useState(false);
  const [resizeStartX, setResizeStartX] = useState(0);

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
      setContextMenu(prev => ({ ...prev, visible: false }));
    }
  };

  // 处理水平滚动开始
  const handleMouseDown = (e: React.MouseEvent) => {
    if (!scrollContainerRef.current) return;
    
    setIsScrolling(true);
    setIsDragging(true);
    setStartX(e.pageX - scrollContainerRef.current.offsetLeft);
    setScrollLeft(scrollContainerRef.current.scrollLeft);
  };

  // 处理水平滚动移动
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isScrolling || !scrollContainerRef.current) return;
    
    e.preventDefault();
    const x = e.pageX - scrollContainerRef.current.offsetLeft;
    const walk = (x - startX) * 2.5; // 增加滚动速度
    scrollContainerRef.current.scrollLeft = scrollLeft - walk;
  };

  // 处理水平滚动结束
  const handleMouseUp = () => {
    setIsScrolling(false);
    setIsDragging(false);
  };

  // 处理触摸滚动开始
  const handleTouchStart = (e: React.TouchEvent) => {
    if (!scrollContainerRef.current) return;
    
    setIsScrolling(true);
    setIsDragging(true);
    setStartX(e.touches[0].pageX - scrollContainerRef.current.offsetLeft);
    setScrollLeft(scrollContainerRef.current.scrollLeft);
  };

  // 处理触摸滚动移动
  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isScrolling || !scrollContainerRef.current) return;
    
    const x = e.touches[0].pageX - scrollContainerRef.current.offsetLeft;
    const walk = (x - startX) * 2.5; // 增加滚动速度
    scrollContainerRef.current.scrollLeft = scrollLeft - walk;
  };

  // 处理分割线拖动开始
  const handleResizeStart = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
    setResizeStartX(e.clientX);
  };

  // 处理分割线拖动
  const handleResize = (e: MouseEvent) => {
    if (!isResizing) return;
    
    const delta = e.clientX - resizeStartX;
    const newWidth = Math.max(180, Math.min(400, containerWidth + delta));
    
    setContainerWidth(newWidth);
    setResizeStartX(e.clientX);
  };

  // 处理分割线拖动结束
  const handleResizeEnd = () => {
    setIsResizing(false);
  };

  // 添加鼠标离开事件处理
  useEffect(() => {
    const handleMouseLeave = () => {
      setIsScrolling(false);
      setIsDragging(false);
    };

    document.addEventListener('mouseup', handleMouseUp);
    document.addEventListener('mouseleave', handleMouseLeave);
    
    // 添加调整大小的全局事件监听
    if (isResizing) {
      document.addEventListener('mousemove', handleResize as any);
      document.addEventListener('mouseup', handleResizeEnd);
    }
    
    return () => {
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('mouseleave', handleMouseLeave);
      
      // 清理调整大小的事件监听
      document.removeEventListener('mousemove', handleResize as any);
      document.removeEventListener('mouseup', handleResizeEnd);
    };
  }, [isScrolling, isResizing, containerWidth]);

  // 检测滚动容器是否可以滚动
  const [canScroll, setCanScroll] = useState(false);
  
  useEffect(() => {
    const checkScrollable = () => {
      if (scrollContainerRef.current) {
        const { scrollWidth, clientWidth } = scrollContainerRef.current;
        setCanScroll(scrollWidth > clientWidth);
      }
    };
    
    checkScrollable();
    window.addEventListener('resize', checkScrollable);
    
    return () => {
      window.removeEventListener('resize', checkScrollable);
    };
  }, [chats]);

  return (
    <>
      <div 
        ref={containerRef}
        className="relative flex"
        style={{ width: `${containerWidth}px` }}
      >
        <div className="flex-1 overflow-hidden">
          <div 
            ref={scrollContainerRef}
            className={`overflow-x-auto overflow-y-hidden pb-2 ${canScroll ? 'cursor-grab' : ''} ${isDragging ? 'cursor-grabbing' : ''} transition-all duration-300`}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleMouseUp}
          >
            <div className={`${isDragging ? 'scale-[0.99] opacity-95' : ''} transition-transform duration-200`}>
              <ul className="d-menu d-menu-md p-0 [&_li>*]:rounded-md min-w-max">
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
            </div>
          </div>

          {canScroll && (
            <div className="flex justify-center mt-1 mb-2">
              <div className="flex gap-1">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="w-1 h-1 rounded-full bg-base-content opacity-30" />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>


      {!isSidebarCollapsed && containerWidth > 0 && (
        <div 
          className="fixed top-0 bottom-0 w-1 bg-base-300 hover:bg-primary cursor-col-resize group z-10"
          style={{ left: `${containerWidth}px` }}
          onMouseDown={handleResizeStart}
        >
          <div className="absolute inset-y-0 -right-1 -left-1 group-hover:bg-primary/10"></div>
        </div>
      )}

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