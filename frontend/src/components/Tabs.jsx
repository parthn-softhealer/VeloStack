const PLATFORM_ICONS = {
  all: "🌐",
  amazon: "📦",
  flipkart: "⚡",
  meesho: "🛍️",
  ajio: "🏷️",
  1688: "🏭",
};

export default function Tabs({ options, value, onChange, isPlatformTabs = false }) {
  return (
    <div className={`tabs ${isPlatformTabs ? "platform-tabs" : ""}`} role="tablist">
      {options.map((opt) => {
        const isActive = value === opt.value;
        const icon = isPlatformTabs ? PLATFORM_ICONS[opt.value] : null;
        return (
          <button
            key={opt.value}
            type="button"
            role="tab"
            aria-selected={isActive}
            className={`tab ${isActive ? "active" : ""} tab-${opt.value}`}
            onClick={() => onChange(opt.value)}
          >
            {icon && <span className="tab-icon">{icon}</span>}
            <span className="tab-label">{opt.label}</span>
          </button>
        );
      })}
    </div>
  );
}
