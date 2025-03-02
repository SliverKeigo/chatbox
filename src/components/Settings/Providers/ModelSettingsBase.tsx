import { useState, useEffect } from 'react';
import { ApiService, ModelInfo } from '../../../services/api';
import { ProviderType } from '../ModelSettingsTab';
import { modelStorage } from '../../../services/store/model';

interface ModelSettingsBaseProps {
  providerType: ProviderType;
  apiKey?: string;
  apiUrl: string;
  selectedModel: string;
  onApiKeyChange?: (value: string) => void;
  onApiUrlChange: (value: string) => void;
  onModelChange: (value: string) => void;
  requiresApiKey?: boolean;
  apiUrlPlaceholder?: string;
  apiUrlHelpText?: string;
}

export function ModelSettingsBase({
  providerType,
  apiKey = '',
  apiUrl,
  selectedModel,
  onApiKeyChange,
  onApiUrlChange,
  onModelChange,
  requiresApiKey = true,
  apiUrlPlaceholder,
  apiUrlHelpText
}: ModelSettingsBaseProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [availableModels, setAvailableModels] = useState<ModelInfo[]>([]);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importText, setImportText] = useState('');
  
  // 组件加载时尝试从store加载模型列表
  useEffect(() => {
    const loadSavedModels = async () => {
      try {
        const savedModels = await modelStorage.loadProviderModels(providerType);
        
        if (savedModels && savedModels.length > 0) {
          console.log(`从存储加载${providerType}模型列表:`, savedModels.length);
          setAvailableModels(savedModels);
        }
      } catch (error) {
        console.error('加载存储的模型列表失败:', error);
      }
    };
    
    loadSavedModels();
  }, [providerType]);
  
  // 获取可用模型
  const fetchModels = async () => {
    if (requiresApiKey && (!apiKey || !apiUrl)) {
      setError('请先设置API密钥和API地址');
      return;
    }
    
    if (!requiresApiKey && !apiUrl) {
      setError('请先设置API地址');
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      // 获取API服务实例
      const apiService = ApiService.getInstance();
      
      // 临时设置API配置
      apiService.setModelConfig(providerType, {
        provider: providerType,
        apiKey: apiKey || '',
        apiUrl,
        model: selectedModel
      });
      
      // 获取可用模型
      const models = await apiService.fetchAvailableModels(providerType);
      setAvailableModels(models);
      
      // 保存模型列表到store
      if (models && models.length > 0) {
        await modelStorage.saveProviderModels(providerType, models);
        console.log(`保存${providerType}模型列表到存储:`, models.length);
      }
    } catch (error: any) {
      console.error('获取模型列表失败:', error);
      setError(error.message || '获取模型列表失败');
    } finally {
      setIsLoading(false);
    }
  };

  // 处理模型导入
  const handleImport = async () => {
    if (!importText.trim()) {
      setError('请输入要导入的模型');
      return;
    }

    try {

      const modelIds = importText.split(',').map(id => id.trim()).filter(id => id);
      
      if (modelIds.length === 0) {
        setError('没有找到有效的模型ID');
        return;
      }


      const newModels: ModelInfo[] = modelIds.map(id => ({
        id,
        name: id
      }));

      // 合并现有模型和新导入的模型
      const existingIds = new Set(availableModels.map(model => model.id));
      const uniqueNewModels = newModels.filter(model => !existingIds.has(model.id));
      
      if (uniqueNewModels.length === 0) {
        setError('所有模型已存在，未添加新模型');
        return;
      }

      const updatedModels = [...availableModels, ...uniqueNewModels];
      setAvailableModels(updatedModels);
      
      // 保存更新后的模型列表
      await modelStorage.saveProviderModels(providerType, updatedModels);
      console.log(`导入${uniqueNewModels.length}个新模型，总计${updatedModels.length}个模型`);
      
      // 关闭导入对话框并清空输入
      setIsImportModalOpen(false);
      setImportText('');
      setError(null);
    } catch (error: any) {
      console.error('导入模型失败:', error);
      setError(error.message || '导入模型失败');
    }
  };
  
  return (
    <div className="space-y-4">
      <div className="d-card bg-base-100 shadow-sm">
        <div className="d-card-body">
          <h3 className="text-lg font-medium mb-2">API设置</h3>
          
          <div className="form-control w-full mt-2">
            <label className="d-label">
              <span className="d-label-text">API地址</span>
            </label>
            <input 
              type="text" 
              placeholder={apiUrlPlaceholder || "https://api.example.com/v1"} 
              className="d-input d-input-bordered w-full" 
              value={apiUrl}
              onChange={(e) => onApiUrlChange(e.target.value)}
            />
            <label className="d-label">
              <span className="d-label-text-alt text-base-content/70">
                {apiUrlHelpText || "以/结尾忽略v1版本，以#结尾强制使用输入地址，否则只保存到/v1"}
              </span>
            </label>
          </div>

          {requiresApiKey && (
            <div className="form-control w-full mt-2">
              <label className="d-label">
                <span className="d-label-text">API密钥</span>
              </label>
              <input 
                type="password" 
                placeholder="sk-..." 
                className="d-input d-input-bordered w-full" 
                value={apiKey}
                onChange={(e) => onApiKeyChange && onApiKeyChange(e.target.value)}
              />
            </div>
          )}
          
        </div>
      </div>
      
      <div className="d-card bg-base-100 shadow-sm">
        <div className="d-card-body">
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-lg font-medium">可用模型</h3>
            <div className="flex gap-2">
              <button 
                className="d-btn d-btn-sm d-btn-outline"
                onClick={() => setIsImportModalOpen(true)}
              >
                导入模型
              </button>
              <button 
                className="d-btn d-btn-sm d-btn-outline"
                onClick={fetchModels}
                disabled={isLoading}
              >
                {isLoading ? (
                  <span className="d-loading d-loading-spinner d-loading-xs"></span>
                ) : (
                  <span>获取模型</span>
                )}
              </button>
            </div>
          </div>
          
          {error && (
            <div className="d-alert d-alert-error mb-4">
              <span>{error}</span>
            </div>
          )}
          
          {availableModels.length > 0 ? (
            <div className="overflow-x-auto max-h-[400px] overflow-y-auto">
              <table className="d-table w-full">
                <thead className="sticky top-0 bg-base-100 z-10">
                  <tr>
                    <th>名称</th>
                  </tr>
                </thead>
                <tbody>
                  {availableModels.map(model => (
                    <tr 
                      key={model.id}
                      className={selectedModel === model.id ? 'bg-primary/10' : 'hover:bg-base-200 cursor-pointer'}
                      onClick={() => onModelChange(model.id)}
                    >
                      <td>{model.name}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-4 text-base-content/70">
              {isLoading ? '加载中...' : '点击"获取模型"按钮获取可用模型列表，或点击"导入模型"手动添加'}
            </div>
          )}
        </div>
      </div>

      {/* 导入模型对话框 */}
      {isImportModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="d-modal-box max-w-md">
            <h3 className="font-bold text-lg mb-4">导入模型</h3>
            <p className="mb-2 text-sm opacity-70">请输入模型ID列表，以逗号分隔（例如：model1,model2,model3）</p>
            <textarea 
              className="d-textarea d-textarea-bordered w-full h-24" 
              value={importText}
              onChange={(e) => setImportText(e.target.value)}
              placeholder="model1,model2,model3"
            />
            <div className="d-modal-action">
              <button 
                className="d-btn d-btn-outline"
                onClick={() => {
                  setIsImportModalOpen(false);
                  setImportText('');
                  setError(null);
                }}
              >
                取消
              </button>
              <button 
                className="d-btn d-btn-primary"
                onClick={handleImport}
              >
                导入
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 