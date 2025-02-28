import { useState, useEffect, ChangeEvent, useRef } from 'react';
import { themeStorage, userStorage } from '../../services/store/index';

interface GeneralSettingsTabProps {
  onClose: () => void;
  onThemeChange?: (theme: string) => void;
  onAvatarChange?: (avatar: string) => void;
}

export function GeneralSettingsTab({ onClose, onThemeChange, onAvatarChange }: GeneralSettingsTabProps) {
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
        <input 
          type="text" 
          className="d-input d-input-bordered w-full" 
          placeholder="请输入用户名"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />
      </div>

      <div className="form-control">
        <label className="d-label">
          <span className="d-label-text">头像</span>
        </label>
        
        <div className="flex flex-col items-center md:flex-row md:items-start gap-4">
          <div className="d-avatar">
            <div className="w-24 h-24 rounded-full">
              <img src={avatar} alt="用户头像" />
            </div>
          </div>
          
          <div className="flex flex-col gap-2 flex-1">
            <input 
              ref={fileInputRef}
              type="file" 
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
            />
            
            <button 
              type="button"
              className="d-btn d-btn-primary"
              onClick={handleSelectFile}
            >
              选择图片
            </button>
            
            <button 
              type="button"
              className="d-btn d-btn-outline"
              onClick={handleUseDefaultAvatar}
            >
              使用默认头像
            </button>
            
            <p className="text-xs opacity-70 mt-1">
              支持JPG、PNG格式，大小不超过2MB
            </p>
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
          className="d-btn" 
          onClick={onClose}
          disabled={isSaving}
        >
          取消
        </button>
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