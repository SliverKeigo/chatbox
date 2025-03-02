import { useState, useEffect, useRef } from 'react';
import { modelStorage, providerDefaults } from '../../services/store/model';
import { ApiService, ModelInfo, ApiProviderType } from '../../services/api';

interface ModelSelectorProps {
  currentModel: string;
  onModelChange: (model: string) => void;
}

// 按提供商分组的模型
interface GroupedModels {
  [provider: string]: ModelInfo[];
}

export function ModelSelector({ currentModel, onModelChange }: ModelSelectorProps) {
  const [currentProvider, setCurrentProvider] = useState<ApiProviderType>('openai');
  const [groupedModels, setGroupedModels] = useState<GroupedModels>({});
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const dropdownRef = useRef<HTMLDetailsElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // 加载提供商和模型信息
  useEffect(() => {
    const loadModelInfo = async () => {
      try {
        setIsLoading(true);
        const config = await modelStorage.loadModelConfig();
        
        if (config) {
          const providerType = config.provider as ApiProviderType;
          setCurrentProvider(providerType);
          
          // 加载所有提供商的模型
          await loadAllProviderModels();
        }
      } catch (error) {
        console.error('加载模型信息失败:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadModelInfo();
  }, []);

  // 当下拉框打开时，自动聚焦到搜索框
  useEffect(() => {
    const details = dropdownRef.current;
    if (!details) return;

    const handleToggle = () => {
      if (details.hasAttribute('open') && searchInputRef.current) {
        setTimeout(() => {
          searchInputRef.current?.focus();
        }, 100);
      } else {
        setSearchQuery('');
      }
    };

    details.addEventListener('toggle', handleToggle);
    return () => {
      details.removeEventListener('toggle', handleToggle);
    };
  }, []);
  
  // 加载所有提供商的模型
  const loadAllProviderModels = async () => {
    const providers: ApiProviderType[] = ['openai', 'groq', 'ollama'];
    const newGroupedModels: GroupedModels = {};
    
    for (const provider of providers) {
      try {
        // 尝试从存储加载模型列表
        const savedModels = await modelStorage.loadProviderModels(provider);
        if (savedModels && savedModels.length > 0) {
          console.log(`从存储加载${provider}模型列表:`, savedModels.length);
          newGroupedModels[provider] = savedModels;
          continue;
        }
        
        // 如果存储中没有，尝试从API获取
        const apiService = ApiService.getInstance();
        try {
          const models = await apiService.fetchAvailableModels(provider);
          if (models && models.length > 0) {
            newGroupedModels[provider] = models;
            // 保存到存储
            await modelStorage.saveProviderModels(provider, models);
            continue;
          }
        } catch (error) {
          console.warn(`从${provider} API获取模型失败，使用默认模型列表:`, error);
        }
        
        // 如果API获取失败，使用默认模型列表
        switch (provider) {
          case 'openai':
            newGroupedModels[provider] = [
            ];
            break;
          case 'groq':
            newGroupedModels[provider] = [
            ];
            break;
          case 'ollama':
            newGroupedModels[provider] = [
            ];
            break;
        }
      } catch (error) {
        console.error(`加载${provider}模型失败:`, error);
        newGroupedModels[provider] = [];
      }
    }
    
    setGroupedModels(newGroupedModels);
  };
  
  // 处理模型变更
  const handleModelChange = async (modelId: string, provider: ApiProviderType) => {
    try {
      // 更新当前模型和提供商
      await modelStorage.saveCurrentModel(modelId);
      
      // 如果提供商变更，需要更新配置
      if (provider !== currentProvider) {
        const config = await modelStorage.loadModelConfig();
        const newConfig = {
          ...config,
          provider,
          model: modelId
        };
        await modelStorage.saveModelConfig(newConfig);
        setCurrentProvider(provider);
      }
      
      // 通知父组件
      onModelChange(modelId);
      
      // 关闭下拉框
      if (dropdownRef.current) {
        dropdownRef.current.removeAttribute('open');
      }
    } catch (error) {
      console.error('更改模型失败:', error);
    }
  };
  
  // 获取当前模型名称
  const getCurrentModelName = () => {
    for (const provider in groupedModels) {
      const model = groupedModels[provider].find(m => m.id === currentModel);
      if (model) return model.name;
    }
    return currentModel;
  };
  
  // 获取提供商名称
  const getProviderName = (provider: string) => {
    switch (provider) {
      case 'openai': return 'OpenAI';
      case 'groq': return 'Groq';
      case 'ollama': return 'Ollama';
      default: return provider;
    }
  };

  // 过滤模型列表
  const getFilteredModels = () => {
    if (!searchQuery.trim()) return groupedModels;
    
    const filtered: GroupedModels = {};
    const query = searchQuery.toLowerCase();
    
    Object.keys(groupedModels).forEach(provider => {
      const matchedModels = groupedModels[provider].filter(model => 
        model.name.toLowerCase().includes(query) || 
        model.id.toLowerCase().includes(query)
      );
      
      if (matchedModels.length > 0) {
        filtered[provider] = matchedModels;
      }
    });
    
    return filtered;
  };
  
  const filteredModels = getFilteredModels();
  const hasResults = Object.keys(filteredModels).some(provider => filteredModels[provider].length > 0);
  
  if (isLoading) {
    return (
      <div className="d-dropdown">
        <div tabIndex={0} role="button" className="d-btn d-btn-ghost d-btn-sm">
          <span className="d-loading d-loading-spinner d-loading-xs"></span>
        </div>
      </div>
    );
  }
  
  return (
    <details ref={dropdownRef} className="d-dropdown">
      <summary className="d-btn d-btn-ghost d-btn-sm flex items-center">
        <div className="flex flex-col items-start text-left">
          <span className="text-xs opacity-70">{getProviderName(currentProvider)}</span>
          <span className="font-medium">{getCurrentModelName()}</span>
        </div>
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="ml-1 h-3 w-3">
          <path d="m6 9 6 6 6-6"/>
        </svg>
      </summary>
      <div className="d-dropdown-content z-[1] p-2 shadow bg-base-100 rounded-box w-72 max-h-96 overflow-y-auto">
        <div className="sticky top-0 bg-base-100 pb-2 pt-1 z-10">
          <div className="relative">
            <input
              ref={searchInputRef}
              type="text"
              placeholder="搜索模型..."
              className="d-input d-input-bordered d-input-sm w-full"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onClick={(e) => e.stopPropagation()}
            />
            {searchQuery && (
              <button 
                className="absolute right-2 top-1/2 -translate-y-1/2 text-base-content/50 hover:text-base-content"
                onClick={() => setSearchQuery('')}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 6 6 18"></path>
                  <path d="m6 6 12 12"></path>
                </svg>
              </button>
            )}
          </div>
        </div>
        
        {hasResults ? (
          <div className="mt-2">
            {Object.keys(filteredModels).map(provider => 
              filteredModels[provider].length > 0 && (
                <div key={provider} className="mb-3">
                  <div className="font-medium text-sm opacity-70 mb-1 px-2">
                    {getProviderName(provider)}
                  </div>
                  <div className="flex flex-col gap-1">
                    {filteredModels[provider].map(model => (
                      <div 
                        key={`${provider}-${model.id}`}
                        className={`px-3 py-1.5 rounded cursor-pointer hover:bg-base-200 ${currentModel === model.id ? 'bg-base-200 font-medium' : ''}`}
                        onClick={() => handleModelChange(model.id, provider as ApiProviderType)}
                      >
                        <div className="break-words text-sm">{model.name}</div>
                        <div className="text-xs opacity-60 truncate">{model.id}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )
            )}
          </div>
        ) : (
          <div className="py-2 text-center text-base-content/50">
            未找到匹配的模型
          </div>
        )}
      </div>
    </details>
  );
} 