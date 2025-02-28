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
      
      
    } catch (error) {
      console.error('保存设置失败:', error);
    } finally {
      setIsSaving(false);
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
        <select 
          className="d-select d-select-bordered w-full" 
          value={theme}
          onChange={(e) => setTheme(e.target.value)}
        >
          <option value="light">🌝 亮色</option>
          <option value="dark">🌚 暗色</option>
          <option value="cupcake">🧁 杯子蛋糕</option>
          <option value="bumblebee">🐝 大黄蜂</option>
          <option value="emerald">💎 祖母绿</option>
          <option value="corporate">🏢 企业</option>
          <option value="synthwave">🌃 合成波</option>
          <option value="retro">📺 复古</option>
          <option value="cyberpunk">🤖 赛博朋克</option>
          <option value="wireframe">📝 线框</option>
          <option value="night">🌙 夜晚</option>
          <option value="coffee">☕ 咖啡</option>
          <option value="winter">❄️ 冬季</option>
        </select>
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
          保存
        </button>
      </div>
    </div>
  );
} 