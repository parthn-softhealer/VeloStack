import { MAIN_CATEGORIES, matchesMainCategory } from "../categories.js";
import { TrendingIcon, CategoryMapIcon, DashboardIcon, BoltIcon } from "./Icons.jsx";

function getCategoryIcon(icon) {
  switch (icon) {
    case "zap":
      return (
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
        </svg>
      );
    case "laptop":
      return (
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
          <line x1="2" y1="20" x2="22" y2="20" />
        </svg>
      );
    case "shirt":
      return (
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20.38 3.46L16 2a4 4 0 01-8 0L3.62 3.46a2 2 0 00-1.34 2.23l.58 3.47a2 2 0 001.23 1.55L6 11.5V20a2 2 0 002 2h8a2 2 0 002-2v-8.5l1.91-.79a2 2 0 001.23-1.55l.58-3.47a2 2 0 00-1.34-2.23z" />
        </svg>
      );
    case "shoe":
      return (
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 16v-2.38C4 11.5 5.5 10 7.38 10H10l3-5 5 2-1 4.5 3 2.5v2H4z" />
          <path d="M4 16h16v3a2 2 0 01-2 2H6a2 2 0 01-2-2v-3z" />
        </svg>
      );
    case "watch":
      return (
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="7" />
          <polyline points="12 9 12 12 13.5 13.5" />
          <path d="M16.51 17.35l-.35 3.83a2 2 0 01-2 1.82H9.83a2 2 0 01-2-1.82l-.35-3.83m.35-10.7l.35-3.83A2 2 0 0110.17 1h3.99a2 2 0 012 1.82l.35 3.83" />
        </svg>
      );
    case "gem":
      return (
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M6 3h12l4 6-10 12L2 9z" />
          <path d="M2 9h20" />
          <path d="M10 3l2 6-2 12" />
          <path d="M14 3l-2 6 2 12" />
        </svg>
      );
    case "luggage":
      return (
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="6" y="7" width="12" height="14" rx="2" />
          <path d="M9 7V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v3" />
          <line x1="10" y1="12" x2="14" y2="12" />
          <line x1="8" y1="21" x2="8.01" y2="21" />
          <line x1="16" y1="21" x2="16.01" y2="21" />
        </svg>
      );
    case "home":
      return (
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
          <polyline points="9 22 9 12 15 12 15 22" />
        </svg>
      );
    case "tool":
      return (
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
        </svg>
      );
    case "armchair":
      return (
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M19 9V6a2 2 0 0 0-2-2H7a2 2 0 0 0-2 2v3" />
          <path d="M3 11v5a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2z" />
          <path d="M5 18v3" />
          <path d="M19 18v3" />
        </svg>
      );
    case "sparkles":
      return (
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 2l2.4 5.6L20 10l-5.6 2.4L12 18l-2.4-5.6L4 10l5.6-2.4z" />
          <path d="M19 17l1 2 2 1-2 1-1 2-1-2-2-1 2-1z" />
        </svg>
      );
    case "heart-pulse":
      return (
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
          <path d="M12 5v14" />
        </svg>
      );
    case "activity":
      return (
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
        </svg>
      );
    case "book":
      return (
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
          <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
        </svg>
      );
    case "edit":
      return (
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 20h9" />
          <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
        </svg>
      );
    case "smile":
      return (
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <path d="M8 14s1.5 2 4 2 4-2 4-2" />
          <line x1="9" y1="9" x2="9.01" y2="9" />
          <line x1="15" y1="9" x2="15.01" y2="9" />
        </svg>
      );
    case "puzzle":
      return (
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M19.439 7.85c0-1.571-1.274-2.845-2.846-2.845a2.845 2.845 0 0 0-2.845 2.845V9.5H9.5V5.253a2.845 2.845 0 0 0-2.845-2.846A2.845 2.845 0 0 0 3.81 5.253V9.5H2v5h1.81v4.247a2.845 2.845 0 0 0 2.845 2.846 2.845 2.845 0 0 0 2.845-2.846V14.5h4.248v1.657a2.845 2.845 0 0 0 2.845 2.846 2.845 2.845 0 0 0 2.846-2.846V14.5H22v-5h-2.561z" />
        </svg>
      );
    case "shopping-cart":
      return (
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="9" cy="21" r="1" />
          <circle cx="20" cy="21" r="1" />
          <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
        </svg>
      );
    case "car":
      return (
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="11" width="18" height="6" rx="2" />
          <path d="M5 11l2-5h10l2 5" />
          <circle cx="7.5" cy="17.5" r="2.5" />
          <circle cx="16.5" cy="17.5" r="2.5" />
        </svg>
      );
    case "leaf":
      return (
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z" />
          <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12" />
        </svg>
      );
    case "paw":
      return (
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="15" r="3" />
          <circle cx="6" cy="10" r="2" />
          <circle cx="18" cy="10" r="2" />
          <circle cx="9" cy="6" r="2" />
          <circle cx="15" cy="6" r="2" />
        </svg>
      );
    case "gamepad":
      return (
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="6" width="20" height="12" rx="6" />
          <line x1="6" y1="12" x2="10" y2="12" />
          <line x1="8" y1="10" x2="8" y2="14" />
          <circle cx="15" cy="11" r="1" />
          <circle cx="17" cy="13" r="1" />
        </svg>
      );
    case "music":
      return (
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M9 18V5l12-2v13" />
          <circle cx="6" cy="18" r="3" />
          <circle cx="18" cy="16" r="3" />
        </svg>
      );
    case "grid":
    default:
      return (
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="7" height="7" rx="1.5" />
          <rect x="14" y="3" width="7" height="7" rx="1.5" />
          <rect x="14" y="14" width="7" height="7" rx="1.5" />
          <rect x="3" y="14" width="7" height="7" rx="1.5" />
        </svg>
      );
  }
}

export default function Sidebar({
  selectedCategory,
  onSelectCategory,
  listings = [],
  platform = "all",
  activeView = "products",
  onSelectView,
  collapsed = false,
  onToggleCollapse,
}) {
  // Count items matching each category under current platform filter
  const categoryCounts = MAIN_CATEGORIES.reduce((acc, cat) => {
    if (cat.id === "all") {
      acc[cat.id] = listings.length;
    } else {
      acc[cat.id] = listings.filter((item) => matchesMainCategory(item, cat.id)).length;
    }
    return acc;
  }, {});

  return (
    <aside className={`sidebar ${collapsed ? "collapsed" : ""}`}>
      {/* Sidebar Header with Brand and Collapse Toggle */}
      <div className="sidebar-brand">
        <div className="brand-header-left">
          <div className="brand-logo-glow" title="DemandPulse Trend Discovery & Radar">
            <span className="logo-symbol">
              <BoltIcon size={22} />
            </span>
          </div>
          {!collapsed && (
            <div className="brand-meta">
              <h1 className="brand-name">DemandPulse</h1>
              <span className="brand-tagline">Trend Discovery & Radar</span>
            </div>
          )}
        </div>

        <button
          type="button"
          className="collapse-toggle-btn"
          onClick={onToggleCollapse}
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? (
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          )}
        </button>
      </div>

      {/* Main View Navigation (Products / Category Mappings) */}
      <div className="sidebar-section">
        <div className="sidebar-nav-group">
          <button
            type="button"
            className={`nav-btn ${activeView === "dashboard" ? "active" : ""}`}
            onClick={() => onSelectView("dashboard")}
            title="Dashboard"
          >
            <span className="nav-icon">
              <DashboardIcon size={18} />
            </span>
            {!collapsed && <span className="nav-label">Dashboard</span>}
          </button>
          <button
            type="button"
            className={`nav-btn ${activeView === "products" ? "active" : ""}`}
            onClick={() => onSelectView("products")}
            title="Trending Products"
          >
            <span className="nav-icon">
              <TrendingIcon size={18} />
            </span>
            {!collapsed && <span className="nav-label">Trending Products</span>}
          </button>
          <button
            type="button"
            className={`nav-btn ${activeView === "categories" ? "active" : ""}`}
            onClick={() => onSelectView("categories")}
            title="Category Mappings"
          >
            <span className="nav-icon">
              <CategoryMapIcon size={18} />
            </span>
            {!collapsed && <span className="nav-label">Category Mappings</span>}
          </button>
        </div>
      </div>

      {/* Category Selection Menu */}
      <div className="sidebar-section flex-grow">
        {!collapsed && (
          <div className="section-header">
            <span className="section-heading">PRODUCT CATEGORIES</span>
            <span className="section-badge">{MAIN_CATEGORIES.length - 1} categories</span>
          </div>
        )}

        <nav className="category-menu" aria-label="Product Categories">
          {MAIN_CATEGORIES.map((cat) => {
            const isSelected = selectedCategory === cat.id;
            const count = categoryCounts[cat.id] ?? 0;
            const tooltip = `${cat.name} (${count} items)`;

            return (
              <button
                key={cat.id}
                type="button"
                className={`category-item ${isSelected ? "active" : ""}`}
                onClick={() => onSelectCategory(cat.id)}
                title={tooltip}
              >
                <span className="category-icon-wrap">
                  {getCategoryIcon(cat.icon)}
                </span>
                {!collapsed && (
                  <>
                    <span className="category-text">{cat.name}</span>
                    <span className={`count-pill ${isSelected ? "active-pill" : ""}`}>
                      {count}
                    </span>
                  </>
                )}
              </button>
            );
          })}
        </nav>
      </div>
    </aside>
  );
}
