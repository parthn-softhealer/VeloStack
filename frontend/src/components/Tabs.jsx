import {
  GlobeIcon,
  PackageIcon,
  BoltIcon,
  ShoppingBagIcon,
  TagIcon,
  FactoryIcon,
} from "./Icons.jsx";

function getPlatformIcon(key) {
  switch (key) {
    case "amazon":
      return <PackageIcon size={15} />;
    case "flipkart":
      return <BoltIcon size={15} />;
    case "meesho":
      return <ShoppingBagIcon size={15} />;
    case "ajio":
      return <TagIcon size={15} />;
    case "1688":
      return <FactoryIcon size={15} />;
    case "all":
    default:
      return <GlobeIcon size={15} />;
  }
}

export default function Tabs({ options, value, onChange, isPlatformTabs = false }) {
  return (
    <div className={`tabs ${isPlatformTabs ? "platform-tabs" : ""}`} role="tablist">
      {options.map((opt) => {
        const isActive = value === opt.value;
        const icon = isPlatformTabs ? getPlatformIcon(opt.value) : null;
        return (
          <button
            key={opt.value}
            type="button"
            role="tab"
            aria-selected={isActive}
            className={`tab ${isActive ? "active" : ""} tab-${opt.value}`}
            onClick={() => onChange(opt.value)}
          >
            {icon && <span className="tab-icon-svg">{icon}</span>}
            <span className="tab-label">{opt.label}</span>
          </button>
        );
      })}
    </div>
  );
}
