import { useState, useEffect } from 'react';
import { OpenAISettings, GroqSettings, OllamaSettings } from './Providers';
import { modelStorage, ModelConfig, providerDefaults } from '../../services/store/model';

// 提供商类型
export type ProviderType = 'openai' | 'groq' | 'ollama';

// 模型定义
export interface Model {
  id: string;
  name: string;
  provider: ProviderType;
}

// 提供商定义
export interface Provider {
  id: ProviderType;
  name: string;
  logo: string;
  description?: string;
  models?: Model[];
}

// 可用的提供商列表
const providers: Provider[] = [
  {
    id: 'openai',
    name: 'OpenAI',
    logo: '/openai-logo.svg',
  },
  {
    id: 'groq',
    name: 'Groq',
    logo: '/groq-logo.svg',
  },
  {
    id: 'ollama',
    name: 'Ollama',
    logo: '/ollama-logo.svg',
  }
];

interface ModelSettingsTabProps {
  onModelConfigChange: (config: ModelConfig) => void;
  onClose: () => void;
}

export function ModelSettingsTab({ onClose, onModelConfigChange }: ModelSettingsTabProps) {
  const [selectedProvider, setSelectedProvider] = useState<ProviderType>('openai');
  const [providerConfigs, setProviderConfigs] = useState<Record<ProviderType, {
    apiKey: string;
    apiUrl: string;
    model: string;
  }>>({
    openai: { apiKey: '', apiUrl: '', model: '' },
    groq: { apiKey: '', apiUrl: '', model: '' },
    ollama: { apiKey: '', apiUrl: '', model: '' }
  });
  const [isLoading, setIsLoading] = useState(true);
  
  // 加载保存的设置
  useEffect(() => {
    const loadSettings = async () => {
      try {
        setIsLoading(true);
        const config = await modelStorage.loadModelConfig();
        
        if (config) {
          setSelectedProvider(config.provider);
          
          // 初始化所有提供商的配置
          const newProviderConfigs = { ...providerConfigs };
          
          // 设置当前选中提供商的配置
          newProviderConfigs[config.provider] = {
            apiKey: config.apiKey || '',
            apiUrl: config.apiUrl || '',
            model: config.model || ''
          };
          
          // 尝试加载其他提供商的配置
          try {
            const allProviderConfigs = await modelStorage.loadAllProviderConfigs();
            if (allProviderConfigs) {
              Object.keys(allProviderConfigs).forEach(provider => {
                if (provider in newProviderConfigs) {
                  newProviderConfigs[provider as ProviderType] = allProviderConfigs[provider];
                }
              });
            }
          } catch (e) {
            console.error('加载提供商配置失败:', e);
          }
          
          setProviderConfigs(newProviderConfigs);
        }
      } catch (error) {
        console.error('加载模型设置失败:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadSettings();
  }, []);
  
  // 当设置变化时自动保存
  useEffect(() => {
    if (!isLoading) {
      const timeoutId = setTimeout(() => {
        saveSettings();
      }, 500);
      
      return () => clearTimeout(timeoutId);
    }
  }, [providerConfigs, selectedProvider]);
  
  // 保存设置
  const saveSettings = async () => {
    try {
      if (isLoading) return;
      
      const currentConfig = providerConfigs[selectedProvider];
      
      const config: ModelConfig = {
        provider: selectedProvider,
        apiKey: currentConfig.apiKey,
        apiUrl: currentConfig.apiUrl || providerDefaults[selectedProvider].apiUrl || '',
        model: currentConfig.model || providerDefaults[selectedProvider].model || ''
      };
      
      // 保存当前提供商的配置
      await modelStorage.saveModelConfig(config);
      
      // 保存所有提供商的配置
      await modelStorage.saveAllProviderConfigs(providerConfigs);
      
      onModelConfigChange(config);
    } catch (error) {
      console.error('保存模型设置失败:', error);
    }
  };
  
  // 处理提供商变更
  const handleProviderChange = (provider: ProviderType) => {
    setSelectedProvider(provider);
  };
  
  // 处理API密钥变更
  const handleApiKeyChange = (value: string) => {
    setProviderConfigs(prev => ({
      ...prev,
      [selectedProvider]: {
        ...prev[selectedProvider],
        apiKey: value
      }
    }));
  };
  
  // 处理API地址变更
  const handleApiUrlChange = (value: string) => {
    setProviderConfigs(prev => ({
      ...prev,
      [selectedProvider]: {
        ...prev[selectedProvider],
        apiUrl: value
      }
    }));
  };
  
  // 处理模型变更
  const handleModelChange = (value: string) => {
    setProviderConfigs(prev => ({
      ...prev,
      [selectedProvider]: {
        ...prev[selectedProvider],
        model: value
      }
    }));
  };
  
  // 获取当前提供商的配置
  const getCurrentProviderConfig = () => {
    return providerConfigs[selectedProvider];
  };
  
  // 渲染提供商列表
  const renderProviders = () => {
    return (
      <div className="w-1/3 pr-4 sticky top-0 self-start">
        <h3 className="text-lg font-medium mb-4">服务提供商</h3>
        <div className="space-y-2">
          {providers.map(provider => (
            <div 
              key={provider.id}
              className={`d-card cursor-pointer transition-all ${selectedProvider === provider.id ? 'bg-primary/10 border-primary/30' : 'bg-base-100 hover:bg-base-200'}`}
              onClick={() => handleProviderChange(provider.id)}
            >
              <div className="d-card-body p-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 flex items-center justify-center bg-base-100 rounded-full">
                    {/* 这里可以放置提供商的logo */}
                    <span className="font-bold">{provider.name.charAt(0)}</span>
                  </div>
                  <div>
                    <h4 className="font-medium">{provider.name}</h4>
                    {provider.description && (
                      <p className="text-xs text-base-content/70">{provider.description}</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };
  
  // 渲染提供商设置
  const renderProviderSettings = () => {
    if (isLoading) {
      return (
        <div className="w-2/3 pl-4 flex items-center justify-center">
          <span className="d-loading d-loading-spinner d-loading-lg"></span>
        </div>
      );
    }
    
    const currentConfig = getCurrentProviderConfig();
    
    return (
      <div className="w-2/3 pl-4 max-h-[70vh] overflow-y-auto">
        <h3 className="text-lg font-medium mb-4">{providers.find(p => p.id === selectedProvider)?.name} 设置</h3>
        
        {selectedProvider === 'openai' && (
          <OpenAISettings 
            apiKey={currentConfig.apiKey}
            apiUrl={currentConfig.apiUrl}
            selectedModel={currentConfig.model}
            onApiKeyChange={handleApiKeyChange}
            onApiUrlChange={handleApiUrlChange}
            onModelChange={handleModelChange}
          />
        )}
        
        {selectedProvider === 'groq' && (
          <GroqSettings 
            apiKey={currentConfig.apiKey}
            apiUrl={currentConfig.apiUrl}
            selectedModel={currentConfig.model}
            onApiKeyChange={handleApiKeyChange}
            onApiUrlChange={handleApiUrlChange}
            onModelChange={handleModelChange}
          />
        )}
        
        {selectedProvider === 'ollama' && (
          <OllamaSettings 
            apiUrl={currentConfig.apiUrl}
            selectedModel={currentConfig.model}
            onApiUrlChange={handleApiUrlChange}
            onModelChange={handleModelChange}
          />
        )}
      </div>
    );
  };
  
  return (
    <div className="flex h-full">
      {renderProviders()}
      {renderProviderSettings()}
    </div>
  );
} 