import { useCallback, useEffect, useMemo, useState } from "react";
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
import Dashboard from "./components/Dashboard.jsx";
import ProductCard from "./components/ProductCard.jsx";
import ProductDetail from "./components/ProductDetail.jsx";
import Pagination from "./components/Pagination.jsx";
import { SearchIcon, EmptyBoxIcon, SunIcon, MoonIcon, RefreshIcon } from "./components/Icons.jsx";

const PLATFORM_TABS = [
  { value: "all", label: "All Platforms" },
  { value: "amazon", label: "Amazon.in" },
  { value: "flipkart", label: "Flipkart" },
  { value: "meesho", label: "Meesho" },
  { value: "ajio", label: "Ajio" },
  { value: "1688", label: "1688 Wholesale" },
];

const SORTS = [
  { value: "trend", label: "Trend Velocity (Highest)" },
  { value: "reviews", label: "Top Reviews (Highest)" },
  { value: "rating", label: "Top Rating (Highest)" },
  { value: "price-low", label: "Price: Low to High" },
  { value: "price-high", label: "Price: High to Low" },
];

const INITIAL_LISTING_LIMIT = 5000;

function num(v, fallback = 0) {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

function calculateTrendScore(item) {
  if (!item) return 0;
  let velocityPct = 0;
  if (Array.isArray(item.reviewHistory) && item.reviewHistory.length >= 2) {
    const first = num(item.reviewHistory[0]?.reviewCount);
    const last = num(item.reviewHistory[item.reviewHistory.length - 1]?.reviewCount);
    if (first > 0 && last >= first) {
      velocityPct = ((last - first) / first) * 100;
    }
  }

  const reviews = num(item.reviewCount);
  const rating = num(item.rating, 3.8);

  if (velocityPct > 0) {
    return velocityPct * 100 + Math.log10(reviews + 10) * 20 + rating * 10;
  }

  return Math.log10(reviews + 1) * Math.pow(rating, 2);
}

export default function App() {
  const [view, setView] = useState("products");
  const [platform, setPlatform] = useState("all");
  const [category, setCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [sort, setSort] = useState("trend");
  const [categories, setCategories] = useState(null);
  const [listings, setListings] = useState([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [previewImage, setPreviewImage] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [theme, setTheme] = useState(() => {
    try {
      return localStorage.getItem("demandpulse_theme") || "dark";
    } catch {
      return "dark";
    }
  });
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    try {
      return localStorage.getItem("demandpulse_sidebar_collapsed") === "true";
    } catch {
      return false;
    }
  });

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    try {
      localStorage.setItem("demandpulse_theme", theme);
    } catch {}
  }, [theme]);

  function toggleTheme() {
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));
  }

  useEffect(() => {
    setCurrentPage(1);
  }, [platform, category, searchQuery, sort]);

  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === "Escape") {
        setPreviewImage(null);
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  function toggleSidebar() {
    setSidebarCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem("demandpulse_sidebar_collapsed", String(next));
      } catch {}
      return next;
    });
  }

  const refreshData = useCallback(async (silent = false) => {
    if (!silent) setIsSyncing(true);
    try {
      const [cats, items] = await Promise.all([
        fetchCategories(),
        fetchListings({ limit: INITIAL_LISTING_LIMIT }),
      ]);
      if (cats) setCategories(cats);
      if (items && Array.isArray(items) && items.length > 0) {
        setListings(items);
      }
    } catch {
      // keep existing state on network hiccup
    } finally {
      if (!silent) setIsSyncing(false);
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Initial fetch
    refreshData(false);

    // Live auto-polling every 5 seconds so newly scraped items appear without reloading!
    const timer = setInterval(() => {
      refreshData(true);
    }, 5000);

    // Instant refresh when user switches back from extension popup to this tab
    function handleVisibility() {
      if (!document.hidden) {
        refreshData(true);
      }
    }
    window.addEventListener("focus", handleVisibility);
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      clearInterval(timer);
      window.removeEventListener("focus", handleVisibility);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [refreshData]);

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
      case "trend":
        out.sort((a, b) => calculateTrendScore(b) - calculateTrendScore(a));
        break;
      case "price-low":
        out.sort((a, b) => num(a.price) - num(b.price));
        break;
      case "price-high":
        out.sort((a, b) => num(b.price) - num(a.price));
        break;
      case "rating":
        out.sort((a, b) => num(b.rating, -1) - num(a.rating, -1));
        break;
      case "reviews":
        out.sort((a, b) => num(b.reviewCount) - num(a.reviewCount));
        break;
      default:
        out.sort((a, b) => calculateTrendScore(b) - calculateTrendScore(a));
    }
    return out;
  }, [listings, platform, category, searchQuery, sort]);

  const totalPages = Math.max(1, Math.ceil(visible.length / pageSize));
  const safeCurrentPage = Math.min(Math.max(1, currentPage), totalPages);

  const paginatedVisible = useMemo(() => {
    const startIndex = (safeCurrentPage - 1) * pageSize;
    return visible.slice(startIndex, startIndex + pageSize);
  }, [visible, safeCurrentPage, pageSize]);

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
            <button
              type="button"
              className="theme-toggle-btn"
              onClick={toggleTheme}
              title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
              aria-label="Toggle dark/light theme"
            >
              {theme === "dark" ? (
                <>
                  <SunIcon size={15} />
                  <span>Light</span>
                </>
              ) : (
                <>
                  <MoonIcon size={15} />
                  <span>Dark</span>
                </>
              )}
            </button>
            <div className="status-indicator">
              <span className="live-pulse" />
              <span>5 Marketplaces Online</span>
            </div>
            <button
              type="button"
              className={`live-sync-btn ${isSyncing ? "syncing" : ""}`}
              onClick={() => refreshData(false)}
              title="Click to manually sync live trending products"
              aria-label="Live sync products"
            >
              <RefreshIcon size={14} className={isSyncing ? "spin-icon" : ""} />
              <span>{isSyncing ? "Syncing..." : "Live Sync"}</span>
            </button>
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

          {!loading && view === "dashboard" && (
            <Dashboard
              items={visible}
              platform={platform}
              onPlatform={selectPlatform}
              platformOptions={PLATFORM_TABS}
              selectedCategoryName={selectedCategoryObj.name}
              searchQuery={searchQuery}
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
                    Real-time trend velocity, review acceleration & dropship margins
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
                <>
                  <div className="product-grid">
                    {paginatedVisible.map((item) => (
                      <ProductCard
                        key={item.id}
                        item={item}
                        onOpen={openDetail}
                        onPreviewImage={setPreviewImage}
                      />
                    ))}
                  </div>

                  <Pagination
                    currentPage={safeCurrentPage}
                    totalItems={visible.length}
                    pageSize={pageSize}
                    onPageChange={(page) => {
                      setCurrentPage(page);
                      window.scrollTo({ top: 0, behavior: "smooth" });
                    }}
                    onPageSizeChange={setPageSize}
                  />
                </>
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
          <span>DemandPulse • Real-Time Trending Product Discovery & Velocity Radar</span>
          <span className="footer-meta">
            Tracking {listings.length} active listings across 5 platforms
          </span>
        </footer>
      </div>

      {/* Image Hover / Zoom Lightbox Popup Modal with Close Cross */}
      {previewImage && (
        <div
          className="image-popup-backdrop"
          onClick={() => setPreviewImage(null)}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="image-popup-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              className="image-popup-close-btn"
              onClick={() => setPreviewImage(null)}
              title="Close image"
              aria-label="Close image"
            >
              <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>

            <div className="image-popup-body">
              <img
                src={previewImage.url}
                alt={previewImage.title || "Product preview"}
                className="image-popup-img"
              />
              <div className="image-popup-info">
                <h4 className="image-popup-title">{previewImage.title}</h4>
                {previewImage.price != null && (
                  <span className="image-popup-price">
                    {previewImage.currency || "₹"}{Number(previewImage.price).toLocaleString("en-IN")}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
