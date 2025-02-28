import { GeneralSettingsTab } from './GeneralSettingsTab';
import { ModelSettingsTab } from './ModelSettingsTab';
import { useState } from 'react';

interface SettingsDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SettingsDialog({ isOpen, onClose }: SettingsDialogProps) {
  const [activeTab, setActiveTab] = useState<'general' | 'model'>('general');
  
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="d-modal d-modal-open w-full">
        <div className="d-modal-box relative w-full max-w-2xl h-[600px] flex flex-col rounded-2xl mx-auto">
          <span 
            className="d-btn d-btn-sm d-btn-circle absolute right-2 top-2"
            onClick={onClose}
          >
            ✕
          </span>
          <h3 className="font-bold text-lg mb-4">系统设定</h3>
          
          <div className="border-b border-base-content/20 flex gap-4 md:gap-8 overflow-x-auto">
            <button 
              type="button" 
              className={`pb-2 px-2 md:px-4 relative whitespace-nowrap ${activeTab === 'general' ? 'text-base-content font-medium' : 'text-base-content/40 hover:text-base-content'}`}
              onClick={() => setActiveTab('general')}
            >
              一般
              {activeTab === 'general' && (
                <div className="absolute bottom-0 left-0 w-full h-0.5 bg-base-content"></div>
              )}
            </button>
            <button 
              type="button" 
              className={`pb-2 px-2 md:px-4 relative whitespace-nowrap ${activeTab === 'model' ? 'text-base-content font-medium' : 'text-base-content/40 hover:text-base-content'}`}
              onClick={() => setActiveTab('model')}
            >
              模型
              {activeTab === 'model' && (
                <div className="absolute bottom-0 left-0 w-full h-0.5 bg-base-content"></div>
              )}
            </button>
          </div>
          
          <div className="mt-6 flex-1 overflow-y-auto">
            {activeTab === 'general' ? (
              <GeneralSettingsTab onClose={onClose} />
            ) : (
              <ModelSettingsTab onClose={onClose} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 