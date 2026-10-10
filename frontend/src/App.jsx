import { useEffect, useMemo, useState } from "react";
import {
  fetchCategories,
  fetchListings,
  fetchListingById,
  canonicalSlug,
  matchesCategory,
  samePlatform,
  toBackendPlatform,
} from "./api.js";
import { getCategoryById } from "./categories.js";
import Sidebar from "./components/Sidebar.jsx";
import Tabs from "./components/Tabs.jsx";
import CategoryView from "./components/CategoryView.jsx";
import ProductCard from "./components/ProductCard.jsx";
import ProductDetail from "./components/ProductDetail.jsx";
import { SearchIcon, EmptyBoxIcon } from "./components/Icons.jsx";

const PLATFORM_TABS = [
  { value: "all", label: "All Platforms" },
  { value: "amazon", label: "Amazon.in" },
  { value: "flipkart", label: "Flipkart" },
  { value: "meesho", label: "Meesho" },
  { value: "ajio", label: "Ajio" },
  { value: "1688", label: "1688 Wholesale" },
];

const SORTS = [
  { value: "reviews", label: "Top Reviews (Highest)" },
  { value: "rating", label: "Top Rating (★)" },
  { value: "price-low", label: "Price: Low to High" },
  { value: "price-high", label: "Price: High to Low" },
];

function num(v, fallback = 0) {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

export default function App() {
  const [view, setView] = useState("products");
  const [platform, setPlatform] = useState("all");
  const [category, setCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [sort, setSort] = useState("reviews");
  const [categories, setCategories] = useState(null);
  const [listings, setListings] = useState([]);
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    try {
      return localStorage.getItem("demandpulse_sidebar_collapsed") === "true";
    } catch {
      return false;
    }
  });

  function toggleSidebar() {
    setSidebarCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem("demandpulse_sidebar_collapsed", String(next));
      } catch {}
      return next;
    });
  }

  useEffect(() => {
    let alive = true;
    Promise.all([fetchCategories(), fetchListings({ limit: 100 })])
      .then(([cats, items]) => {
        if (!alive) return;
        setCategories(cats);
        setListings(items);
      })
      .catch(() => {
        if (!alive) return;
        setCategories({ canonical: [], platforms: {} });
        setListings([]);
      })
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, []);

  const platformKey = toBackendPlatform(platform) || platform;

  const canonicalSlugs = useMemo(() => {
    const list = (categories && categories.canonical) || [];
    return list.map(canonicalSlug).filter(Boolean);
  }, [categories]);

  const platformRaws = useMemo(() => {
    if (!categories || !categories.platforms) return [];
    if (platform === "all") return [];
    const plats = categories.platforms;
    const raws =
      plats[platform] || plats[platformKey] || plats[`${platform}.in`] || [];
    const canonSet = new Set(canonicalSlugs);
    return raws.filter((r) => !canonSet.has(r));
  }, [categories, platform, platformKey, canonicalSlugs]);

  const visible = useMemo(() => {
    let out = [...listings];
    if (platform !== "all") {
      out = out.filter((l) => samePlatform(l.platform, platform));
    }
    if (category !== "all") {
      out = out.filter((l) => matchesCategory(l, category));
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      out = out.filter(
        (l) =>
          (l.title && l.title.toLowerCase().includes(q)) ||
          (l.seller && l.seller.toLowerCase().includes(q)) ||
          (l.canonical && l.canonical.toLowerCase().includes(q)) ||
          (l.rawCategory && l.rawCategory.toLowerCase().includes(q))
      );
    }
    switch (sort) {
      case "price-low":
        out.sort((a, b) => num(a.price) - num(b.price));
        break;
      case "price-high":
        out.sort((a, b) => num(b.price) - num(a.price));
        break;
      case "rating":
        out.sort((a, b) => num(b.rating, -1) - num(a.rating, -1));
        break;
      default:
        out.sort((a, b) => num(b.reviewCount) - num(a.reviewCount));
    }
    return out;
  }, [listings, platform, category, searchQuery, sort]);

  async function openDetail(id) {
    const item =
      listings.find((l) => l.id === id) || (await fetchListingById(id));
    setDetail(item || null);
    setView("detail");
  }

  function selectPlatform(v) {
    setPlatform(v);
  }

  const selectedCategoryObj = getCategoryById(category);
  const platformLabel =
    (PLATFORM_TABS.find((t) => t.value === platform) || {}).label || platform;

  return (
    <div className="app-shell">
      {/* Left Sidebar for Categories */}
      <Sidebar
        selectedCategory={category}
        onSelectCategory={(catId) => {
          setCategory(catId);
          if (view === "detail") setView("products");
        }}
        listings={
          platform === "all"
            ? listings
            : listings.filter((l) => samePlatform(l.platform, platform))
        }
        platform={platform}
        activeView={view}
        onSelectView={(v) => {
          setView(v);
          if (v !== "detail") setDetail(null);
        }}
        collapsed={sidebarCollapsed}
        onToggleCollapse={toggleSidebar}
      />

      {/* Main Workspace Area */}
      <div className="main-workspace">
        {/* Top Navbar */}
        <header className="top-navbar">
          <div className="navbar-left-group">
            <button
              type="button"
              className="nav-sidebar-toggle-btn"
              onClick={toggleSidebar}
              title={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
              aria-label={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                <line x1="9" y1="3" x2="9" y2="21" />
              </svg>
            </button>
            <div className="search-bar-wrapper">
              <span className="search-icon">
                <SearchIcon size={16} />
              </span>
            <input
              type="text"
              className="search-input"
              placeholder="Search products, keywords, brands or sellers..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button
                type="button"
                className="search-clear-btn"
                onClick={() => setSearchQuery("")}
                aria-label="Clear search"
              >
                ✕
              </button>
            )}
            </div>
          </div>

          <div className="top-meta-info">
            <div className="status-indicator">
              <span className="live-pulse" />
              <span>5 Marketplaces Online</span>
            </div>
            <div className="tracked-stats-pill">
              <strong>{listings.length}</strong> items tracked
            </div>
          </div>
        </header>

        {/* Workspace Body */}
        <div className="workspace-body">
          {loading && (
            <div className="loading-state">
              <div className="spinner" />
              <p>Fetching real-time trending products & categories...</p>
            </div>
          )}

          {!loading && view === "categories" && (
            <CategoryView
              categories={categories}
              platform={platform}
              onPlatform={selectPlatform}
            />
          )}

          {!loading && view === "products" && (
            <section className="products-view">
              {/* Controls bar */}
              <div className="view-header-strip">
                <div className="view-title-block">
                  <h2 className="view-heading">
                    {selectedCategoryObj.name}
                    {category !== "all" && (
                      <span className="active-tag-bubble">
                        Filtered Category
                      </span>
                    )}
                  </h2>
                  <p className="view-subtext">
                    Review acceleration & pricing intelligence for dropshippers
                  </p>
                </div>

                <div className="sort-dropdown-wrap">
                  <label htmlFor="sort-select">Sort by:</label>
                  <select
                    id="sort-select"
                    className="styled-select"
                    value={sort}
                    onChange={(e) => setSort(e.target.value)}
                  >
                    {SORTS.map((s) => (
                      <option key={s.value} value={s.value}>
                        {s.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Platform Selector Tabs on Top */}
              <div className="platform-nav-row">
                <Tabs
                  options={PLATFORM_TABS}
                  value={platform}
                  onChange={selectPlatform}
                  isPlatformTabs
                />
              </div>

              {/* Active Filter Pills Bar */}
              {(category !== "all" || platform !== "all" || searchQuery) && (
                <div className="active-filter-bar">
                  <span className="filter-label">Active Filters:</span>
                  {category !== "all" && (
                    <span className="filter-badge">
                      Category: {selectedCategoryObj.name}
                      <button
                        type="button"
                        onClick={() => setCategory("all")}
                      >
                        ✕
                      </button>
                    </span>
                  )}
                  {platform !== "all" && (
                    <span className="filter-badge">
                      Platform: {platformLabel}
                      <button
                        type="button"
                        onClick={() => setPlatform("all")}
                      >
                        ✕
                      </button>
                    </span>
                  )}
                  {searchQuery && (
                    <span className="filter-badge">
                      Query: "{searchQuery}"
                      <button
                        type="button"
                        onClick={() => setSearchQuery("")}
                      >
                        ✕
                      </button>
                    </span>
                  )}
                  <button
                    type="button"
                    className="clear-all-filters-btn"
                    onClick={() => {
                      setCategory("all");
                      setPlatform("all");
                      setSearchQuery("");
                    }}
                  >
                    Reset all
                  </button>
                </div>
              )}

              {/* Products Grid */}
              {visible.length === 0 ? (
                <div className="empty-state-box">
                  <span className="empty-icon">
                    <EmptyBoxIcon size={46} />
                  </span>
                  <h3>No matching products found</h3>
                  <p>
                    No items match the selected combination of category and platform.
                  </p>
                  <button
                    type="button"
                    className="btn primary-btn"
                    onClick={() => {
                      setCategory("all");
                      setPlatform("all");
                      setSearchQuery("");
                    }}
                  >
                    Show all products
                  </button>
                </div>
              ) : (
                <div className="product-grid">
                  {visible.map((item) => (
                    <ProductCard key={item.id} item={item} onOpen={openDetail} />
                  ))}
                </div>
              )}
            </section>
          )}

          {!loading && view === "detail" && (
            <ProductDetail
              item={detail}
              onBack={() => {
                setDetail(null);
                setView("products");
              }}
            />
          )}
        </div>

        {/* Footer */}
        <footer className="workspace-footer">
          <span>DemandPulse SaaS • Real-time Dropshipping & Sourcing Intelligence</span>
          <span className="footer-meta">
            Tracking {listings.length} active listings across 5 platforms
          </span>
        </footer>
      </div>
    </div>
  );
}
