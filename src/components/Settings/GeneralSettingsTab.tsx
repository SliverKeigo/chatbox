interface GeneralSettingsTabProps {
  onClose: () => void;
}

export function GeneralSettingsTab({ onClose }: GeneralSettingsTabProps) {
  return (
    <div className="space-y-4">
      {/* 用户设置 */}
      <div className="form-control">
        <label className="label">
          <span className="label-text">用户名</span>
        </label>
        <input 
          type="text" 
          className="d-input d-input-bordered w-full" 
          placeholder="请输入用户名"
        />
      </div>

      {/* 界面设置 */}
      <div className="form-control">
        <label className="d-label cursor-pointer">
          <span className="label-text">发送消息时使用 Enter</span>
          <input type="checkbox" className="d-toggle" />
        </label>
      </div>

      <div className="form-control">
        <label className="d-label cursor-pointer">
          <span className="label-text">自动滚动到底部</span>
          <input type="checkbox" className="d-toggle" defaultChecked />
        </label>
      </div>

      <div className="d-modal-action">
        <button className="d-btn" onClick={onClose}>取消</button>
        <button className="d-btn d-btn-primary">保存</button>
      </div>
    </div>
  );
} 