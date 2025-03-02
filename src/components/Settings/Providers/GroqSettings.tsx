import { ModelSettingsBase } from './ModelSettingsBase';

interface GroqSettingsProps {
  apiKey: string;
  apiUrl: string;
  selectedModel: string;
  onApiKeyChange: (value: string) => void;
  onApiUrlChange: (value: string) => void;
  onModelChange: (value: string) => void;
}

export function GroqSettings({
  apiKey,
  apiUrl,
  selectedModel,
  onApiKeyChange,
  onApiUrlChange,
  onModelChange
}: GroqSettingsProps) {
  return (
    <ModelSettingsBase
      providerType="groq"
      apiKey={apiKey}
      apiUrl={apiUrl}
      selectedModel={selectedModel}
      onApiKeyChange={onApiKeyChange}
      onApiUrlChange={onApiUrlChange}
      onModelChange={onModelChange}
      requiresApiKey={true}
      apiUrlPlaceholder="https://api.groq.com/v1"
      apiUrlHelpText="Groq API服务地址"
    />
  );
} 