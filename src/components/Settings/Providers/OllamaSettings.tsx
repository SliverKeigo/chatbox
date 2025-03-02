import { ModelSettingsBase } from './ModelSettingsBase';

interface OllamaSettingsProps {
  apiUrl: string;
  selectedModel: string;
  onApiUrlChange: (value: string) => void;
  onModelChange: (value: string) => void;
}

export function OllamaSettings({
  apiUrl,
  selectedModel,
  onApiUrlChange,
  onModelChange
}: OllamaSettingsProps) {
  return (
    <ModelSettingsBase
      providerType="ollama"
      apiUrl={apiUrl}
      selectedModel={selectedModel}
      onApiUrlChange={onApiUrlChange}
      onModelChange={onModelChange}
      requiresApiKey={false}
      apiUrlPlaceholder="http://localhost:11434"
      apiUrlHelpText="Ollama默认在本地运行，通常不需要修改"
    />
  );
} 