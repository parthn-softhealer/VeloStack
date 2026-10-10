import { MAIN_CATEGORIES, matchesMainCategory } from "../categories.js";

function getCategoryIcon(icon) {
  switch (icon) {
    case "zap":
      return (
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
        </svg>
      );
    case "shirt":
      return (
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20.38 3.46L16 2a4 4 0 01-8 0L3.62 3.46a2 2 0 00-1.34 2.23l.58 3.47a2 2 0 001.23 1.55L6 11.5V20a2 2 0 002 2h8a2 2 0 002-2v-8.5l1.91-.79a2 2 0 001.23-1.55l.58-3.47a2 2 0 00-1.34-2.23z" />
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
    case "shoe":
      return (
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 16v-2.38C4 11.5 5.5 10 7.38 10H10l3-5 5 2-1 4.5 3 2.5v2H4z" />
          <path d="M4 16h16v3a2 2 0 01-2 2H6a2 2 0 01-2-2v-3z" />
        </svg>
      );
    case "home":
      return (
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
          <polyline points="9 22 9 12 15 12 15 22" />
        </svg>
      );
    case "sparkles":
      return (
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 2l2.4 5.6L20 10l-5.6 2.4L12 18l-2.4-5.6L4 10l5.6-2.4z" />
          <path d="M19 17l1 2 2 1-2 1-1 2-1-2-2-1 2-1z" />
        </svg>
      );
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
    <aside className="sidebar">
      <div className="sidebar-brand">
        <div className="brand-logo-glow">
          <span className="logo-symbol">⚡</span>
        </div>
        <div className="brand-meta">
          <h1 className="brand-name">DemandPulse</h1>
          <span className="brand-tagline">Dropship Intelligence</span>
        </div>
      </div>

      <div className="sidebar-section">
        <div className="sidebar-nav-group">
          <button
            type="button"
            className={`nav-btn ${activeView === "products" ? "active" : ""}`}
            onClick={() => onSelectView("products")}
          >
            <span className="nav-icon">🔥</span>
            <span className="nav-label">Trending Products</span>
          </button>
          <button
            type="button"
            className={`nav-btn ${activeView === "categories" ? "active" : ""}`}
            onClick={() => onSelectView("categories")}
          >
            <span className="nav-icon">🗂️</span>
            <span className="nav-label">Category Mappings</span>
          </button>
        </div>
      </div>

      <div className="sidebar-section flex-grow">
        <div className="section-header">
          <span className="section-heading">PRODUCT CATEGORIES</span>
          <span className="section-badge">{listings.length} items</span>
        </div>

        <nav className="category-menu" aria-label="Product Categories">
          {MAIN_CATEGORIES.map((cat) => {
            const isSelected = selectedCategory === cat.id;
            const count = categoryCounts[cat.id] ?? 0;
            return (
              <button
                key={cat.id}
                type="button"
                className={`category-item ${isSelected ? "active" : ""}`}
                onClick={() => onSelectCategory(cat.id)}
                title={cat.description}
              >
                <span className="category-icon-wrap">
                  {getCategoryIcon(cat.icon)}
                </span>
                <span className="category-text">{cat.name}</span>
                <span className={`count-pill ${isSelected ? "active-pill" : ""}`}>
                  {count}
                </span>
              </button>
            );
          })}
        </nav>
      </div>

      <div className="sidebar-footer">
        <div className="pro-callout">
          <div className="callout-header">
            <span className="live-dot" />
            <strong className="callout-title">Live Scraper Sync</strong>
          </div>
          <p className="callout-desc">
            Tracking velocity across Amazon, Flipkart, Meesho, Ajio & 1688 wholesale.
          </p>
        </div>
      </div>
    </aside>
  );
}
