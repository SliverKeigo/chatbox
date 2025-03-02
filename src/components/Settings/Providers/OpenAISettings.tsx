import { ModelSettingsBase } from './ModelSettingsBase';

interface OpenAISettingsProps {
  apiKey: string;
  apiUrl: string;
  selectedModel: string;
  onApiKeyChange: (value: string) => void;
  onApiUrlChange: (value: string) => void;
  onModelChange: (value: string) => void;
}

export function OpenAISettings({
  apiKey,
  apiUrl,
  selectedModel,
  onApiKeyChange,
  onApiUrlChange,
  onModelChange
}: OpenAISettingsProps) {
  return (
    <ModelSettingsBase
      providerType="openai"
      apiKey={apiKey}
      apiUrl={apiUrl}
      selectedModel={selectedModel}
      onApiKeyChange={onApiKeyChange}
      onApiUrlChange={onApiUrlChange}
      onModelChange={onModelChange}
      requiresApiKey={true}
      apiUrlPlaceholder="https://api.openai.com/v1"
      apiUrlHelpText="使用代理时可修改API地址"
    />
  );
} 