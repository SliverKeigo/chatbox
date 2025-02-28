import { useState, useEffect, ChangeEvent, useRef } from 'react';
import { themeStorage, userStorage } from '../../services/store/index';

interface GeneralSettingsTabProps {
  onClose: () => void;
  onThemeChange?: (theme: string) => void;
  onAvatarChange?: (avatar: string) => void;
  onUsernameChange?: (username: string) => void;
}

export function GeneralSettingsTab({ onClose, onThemeChange, onAvatarChange, onUsernameChange }: GeneralSettingsTabProps) {
  const [username, setUsername] = useState<string>('');
  const [avatar, setAvatar] = useState<string>('');
  const [theme, setTheme] = useState<string>('wireframe');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 从存储中加载数据
  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        
        // 加载用户名
        const savedName = await userStorage.loadName();
        setUsername(savedName);
        
        // 加载头像
        const savedAvatar = await userStorage.loadAvatar();
        setAvatar(savedAvatar);
        
        // 加载主题
        const savedTheme = await themeStorage.loadTheme();
        setTheme(savedTheme || 'wireframe');
        
        // 这里可以加载其他设置，如果有的话
        // 目前使用默认值
      } catch (error) {
        console.error('加载设置失败:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadData();
  }, []);

  // 保存设置
  const handleSave = async () => {
    try {
      setIsSaving(true);
      
      // 保存用户名
      await userStorage.saveName(username);
      // 调用用户名更新回调
      if (onUsernameChange) {
        onUsernameChange(username);
      }
      
      // 保存头像
      await userStorage.saveAvatar(avatar);
      // 调用头像更新回调
      if (onAvatarChange) {
        onAvatarChange(avatar);
      }
      
      // 保存主题
      await themeStorage.saveTheme(theme);
      // 调用主题更新回调
      if (onThemeChange) {
        onThemeChange(theme);
      }
      
      // 关闭设置对话框
      onClose();
      
    } catch (error) {
      console.error('保存设置失败:', error);
    } finally {
      setIsSaving(false);
    }
  };

  // 处理主题变更
  const handleThemeChange = (e: ChangeEvent<HTMLInputElement>) => {
    const newTheme = e.target.value;
    setTheme(newTheme);
    
    // 立即应用主题变更
    if (onThemeChange) {
      onThemeChange(newTheme);
    }
  };

  // 处理头像文件选择
  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // 检查文件类型
    if (!file.type.match('image.*')) {
      alert('请选择图片文件');
      return;
    }
    
    // 检查文件大小（限制为2MB）
    if (file.size > 2 * 1024 * 1024) {
      alert('图片大小不能超过2MB');
      return;
    }
    
    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setAvatar(event.target.result as string);
      }
    };
    reader.readAsDataURL(file);
  };

  // 触发文件选择对话框
  const handleSelectFile = () => {
    fileInputRef.current?.click();
  };

  // 使用默认头像
  const handleUseDefaultAvatar = () => {
    setAvatar('https://ui-avatars.com/api/?name=User');
  };

  if (isLoading) {
    return <div className="flex justify-center p-4"><span className="d-loading d-loading-spinner"></span></div>;
  }

  return (
    <div className="space-y-4">
      {/* 用户设置 */}
      <div className="form-control">
        <label className="d-label">
          <span className="d-label-text">用户名</span>
        </label>
        
        <div className="flex flex-col md:flex-row gap-6 items-center">
          <div className="relative w-full">
            <div className="d-input-group">
              <span className="d-input-group-addon bg-primary text-primary-content">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </span>
              <input 
                type="text" 
                className="d-input d-input-bordered w-full" 
                placeholder="请输入用户名"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
              {username && (
                <button 
                  className="d-input-group-addon bg-base-300 hover:bg-base-200 cursor-pointer"
                  onClick={() => setUsername('')}
                  title="清除用户名"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
            <div className="mt-2 text-xs opacity-70 px-2">
              设置您的用户名，它将显示在应用的头部区域
            </div>
          </div>
        </div>
      </div>

      <div className="form-control">
        <label className="d-label">
          <span className="d-label-text">头像</span>
        </label>
        
        <div className="flex flex-col md:flex-row gap-6 items-center">

          <div className="relative group">

            <div className="relative w-28 h-28">

              <div className="absolute inset-0 z-10 rounded-full overflow-hidden bg-base-200">
                <img 
                  src={avatar || 'https://ui-avatars.com/api/?name=User'} 
                  alt="用户头像" 
                  className="w-full h-full object-cover"
                />
              </div>
              
              {/* 装饰边框层 - 位于图片上方 */}
              <div className="absolute inset-0 z-20 rounded-full border-4 border-primary"></div>
              
              {/* 外部偏移环 */}
              <div className="absolute -inset-1 z-0 rounded-full bg-base-100"></div>
              
              {/* 悬停效果层 - 最高层级 */}
              <div 
                className="absolute inset-0 z-30 flex items-center justify-center rounded-full bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                onClick={handleSelectFile}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
            </div>
          </div>
          

          <div className="flex flex-col gap-3 flex-1">
            <input 
              ref={fileInputRef}
              type="file" 
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
            />
            
            <div className="flex flex-wrap gap-2">
              <button 
                type="button"
                className="d-btn d-btn-primary d-btn-sm flex-1"
                onClick={handleSelectFile}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0l-4 4m4-4v12" />
                </svg>
                上传图片
              </button>
              
              <button 
                type="button"
                className="d-btn d-btn-outline d-btn-sm flex-1"
                onClick={handleUseDefaultAvatar}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                默认头像
              </button>
            </div>
            
            <div className="d-card d-card-compact bg-base-200">
              <div className="d-card-body">
                <h3 className="text-sm font-medium">提示：</h3>
                <ul className="text-xs opacity-70 list-disc list-inside space-y-1">
                  <li>支持JPG、PNG等常见图片格式</li>
                  <li>图片大小不超过2MB</li>
                  <li>鼠标悬停在头像上可快速上传</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="form-control">
        <label className="d-label">
          <span className="d-label-text">主题</span>
        </label>
        
        <div className="flex flex-wrap gap-2 justify-center">
          {/* 第一行 - 基础主题 */}
          <div className="d-join">
            <input
              type="radio"
              name="theme-buttons"
              className="d-btn d-theme-controller d-join-item"
              aria-label="Light"
              value="light"
              checked={theme === 'light'}
              onChange={handleThemeChange}
            />
            <input
              type="radio"
              name="theme-buttons"
              className="d-btn d-theme-controller d-join-item"
              aria-label="Dark"
              value="dark"
              checked={theme === 'dark'}
              onChange={handleThemeChange}
            />
            <input
              type="radio"
              name="theme-buttons"
              className="d-btn d-theme-controller d-join-item"
              aria-label="Cupcake"
              value="cupcake"
              checked={theme === 'cupcake'}
              onChange={handleThemeChange}
            />
            <input
              type="radio"
              name="theme-buttons"
              className="d-btn d-theme-controller d-join-item"
              aria-label="Bumblebee"
              value="bumblebee"
              checked={theme === 'bumblebee'}
              onChange={handleThemeChange}
            />
            <input
              type="radio"
              name="theme-buttons"
              className="d-btn d-theme-controller d-join-item"
              aria-label="Emerald"
              value="emerald"
              checked={theme === 'emerald'}
              onChange={handleThemeChange}
            />
          </div>
          
          {/* 第二行 */}
          <div className="d-join">
            <input
              type="radio"
              name="theme-buttons"
              className="d-btn d-theme-controller d-join-item"
              aria-label="Corporate"
              value="corporate"
              checked={theme === 'corporate'}
              onChange={handleThemeChange}
            />
            <input
              type="radio"
              name="theme-buttons"
              className="d-btn d-theme-controller d-join-item"
              aria-label="Synthwave"
              value="synthwave"
              checked={theme === 'synthwave'}
              onChange={handleThemeChange}
            />
            <input
              type="radio"
              name="theme-buttons"
              className="d-btn d-theme-controller d-join-item"
              aria-label="Retro"
              value="retro"
              checked={theme === 'retro'}
              onChange={handleThemeChange}
            />
            <input
              type="radio"
              name="theme-buttons"
              className="d-btn d-theme-controller d-join-item"
              aria-label="Cyberpunk"
              value="cyberpunk"
              checked={theme === 'cyberpunk'}
              onChange={handleThemeChange}
            />
            <input
              type="radio"
              name="theme-buttons"
              className="d-btn d-theme-controller d-join-item"
              aria-label="Valentine"
              value="valentine"
              checked={theme === 'valentine'}
              onChange={handleThemeChange}
            />
          </div>
          
          {/* 第三行 */}
          <div className="d-join">
            <input
              type="radio"
              name="theme-buttons"
              className="d-btn d-theme-controller d-join-item"
              aria-label="Halloween"
              value="halloween"
              checked={theme === 'halloween'}
              onChange={handleThemeChange}
            />
            <input
              type="radio"
              name="theme-buttons"
              className="d-btn d-theme-controller d-join-item"
              aria-label="Garden"
              value="garden"
              checked={theme === 'garden'}
              onChange={handleThemeChange}
            />
            <input
              type="radio"
              name="theme-buttons"
              className="d-btn d-theme-controller d-join-item"
              aria-label="Forest"
              value="forest"
              checked={theme === 'forest'}
              onChange={handleThemeChange}
            />
            <input
              type="radio"
              name="theme-buttons"
              className="d-btn d-theme-controller d-join-item"
              aria-label="Aqua"
              value="aqua"
              checked={theme === 'aqua'}
              onChange={handleThemeChange}
            />
            <input
              type="radio"
              name="theme-buttons"
              className="d-btn d-theme-controller d-join-item"
              aria-label="Lofi"
              value="lofi"
              checked={theme === 'lofi'}
              onChange={handleThemeChange}
            />
          </div>
          
          {/* 第四行 */}
          <div className="d-join">
            <input
              type="radio"
              name="theme-buttons"
              className="d-btn d-theme-controller d-join-item"
              aria-label="Pastel"
              value="pastel"
              checked={theme === 'pastel'}
              onChange={handleThemeChange}
            />
            <input
              type="radio"
              name="theme-buttons"
              className="d-btn d-theme-controller d-join-item"
              aria-label="Fantasy"
              value="fantasy"
              checked={theme === 'fantasy'}
              onChange={handleThemeChange}
            />
            <input
              type="radio"
              name="theme-buttons"
              className="d-btn d-theme-controller d-join-item"
              aria-label="Wireframe"
              value="wireframe"
              checked={theme === 'wireframe'}
              onChange={handleThemeChange}
            />
            <input
              type="radio"
              name="theme-buttons"
              className="d-btn d-theme-controller d-join-item"
              aria-label="Black"
              value="black"
              checked={theme === 'black'}
              onChange={handleThemeChange}
            />
            <input
              type="radio"
              name="theme-buttons"
              className="d-btn d-theme-controller d-join-item"
              aria-label="Luxury"
              value="luxury"
              checked={theme === 'luxury'}
              onChange={handleThemeChange}
            />
          </div>
          
          {/* 第五行 */}
          <div className="d-join">
            <input
              type="radio"
              name="theme-buttons"
              className="d-btn d-theme-controller d-join-item"
              aria-label="Dracula"
              value="dracula"
              checked={theme === 'dracula'}
              onChange={handleThemeChange}
            />
            <input
              type="radio"
              name="theme-buttons"
              className="d-btn d-theme-controller d-join-item"
              aria-label="CMYK"
              value="cmyk"
              checked={theme === 'cmyk'}
              onChange={handleThemeChange}
            />
            <input
              type="radio"
              name="theme-buttons"
              className="d-btn d-theme-controller d-join-item"
              aria-label="Autumn"
              value="autumn"
              checked={theme === 'autumn'}
              onChange={handleThemeChange}
            />
            <input
              type="radio"
              name="theme-buttons"
              className="d-btn d-theme-controller d-join-item"
              aria-label="Business"
              value="business"
              checked={theme === 'business'}
              onChange={handleThemeChange}
            />
            <input
              type="radio"
              name="theme-buttons"
              className="d-btn d-theme-controller d-join-item"
              aria-label="Acid"
              value="acid"
              checked={theme === 'acid'}
              onChange={handleThemeChange}
            />
          </div>
          
          {/* 第六行 */}
          <div className="d-join">
            <input
              type="radio"
              name="theme-buttons"
              className="d-btn d-theme-controller d-join-item"
              aria-label="Lemonade"
              value="lemonade"
              checked={theme === 'lemonade'}
              onChange={handleThemeChange}
            />
            <input
              type="radio"
              name="theme-buttons"
              className="d-btn d-theme-controller d-join-item"
              aria-label="Night"
              value="night"
              checked={theme === 'night'}
              onChange={handleThemeChange}
            />
            <input
              type="radio"
              name="theme-buttons"
              className="d-btn d-theme-controller d-join-item"
              aria-label="Coffee"
              value="coffee"
              checked={theme === 'coffee'}
              onChange={handleThemeChange}
            />
            <input
              type="radio"
              name="theme-buttons"
              className="d-btn d-theme-controller d-join-item"
              aria-label="Winter"
              value="winter"
              checked={theme === 'winter'}
              onChange={handleThemeChange}
            />
            <input
              type="radio"
              name="theme-buttons"
              className="d-btn d-theme-controller d-join-item"
              aria-label="Dim"
              value="dim"
              checked={theme === 'dim'}
              onChange={handleThemeChange}
            />
          </div>
          
          {/* 第七行 */}
          <div className="d-join">
            <input
              type="radio"
              name="theme-buttons"
              className="d-btn d-theme-controller d-join-item"
              aria-label="Nord"
              value="nord"
              checked={theme === 'nord'}
              onChange={handleThemeChange}
            />
            <input
              type="radio"
              name="theme-buttons"
              className="d-btn d-theme-controller d-join-item"
              aria-label="Sunset"
              value="sunset"
              checked={theme === 'sunset'}
              onChange={handleThemeChange}
            />
          </div>
        </div>
      </div>

      <div className="d-modal-action">
        <button 
          className="d-btn d-btn-primary" 
          onClick={handleSave}
          disabled={isSaving}
        >
          {isSaving ? <span className="d-loading d-loading-spinner d-loading-xs mr-2"></span> : null}
          保存
        </button>
      </div>
    </div>
  );
} 