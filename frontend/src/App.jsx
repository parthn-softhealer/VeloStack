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
import Tabs from "./components/Tabs.jsx";
import CategoryView from "./components/CategoryView.jsx";
import ProductCard from "./components/ProductCard.jsx";
import ProductDetail from "./components/ProductDetail.jsx";

const VIEW_TABS = [
  { value: "products", label: "Products" },
  { value: "categories", label: "Categories" },
];

const PLATFORM_TABS = [
  { value: "all", label: "All" },
  { value: "amazon", label: "Amazon" },
  { value: "flipkart", label: "Flipkart" },
  { value: "meesho", label: "Meesho" },
  { value: "ajio", label: "Ajio" },
  { value: "1688", label: "1688" },
];

const SORTS = [
  { value: "reviews", label: "Top reviews" },
  { value: "rating", label: "Top rating" },
  { value: "price-low", label: "Price: low first" },
  { value: "price-high", label: "Price: high first" },
];

function num(v, fallback = 0) {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

export default function App() {
  const [view, setView] = useState("products");
  const [platform, setPlatform] = useState("all");
  const [category, setCategory] = useState("all");
  const [sort, setSort] = useState("reviews");
  const [categories, setCategories] = useState(null);
  const [listings, setListings] = useState([]);
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(true);

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

  // Backend platform key for the selected tab ("amazon" -> "amazon.in").
  const platformKey = toBackendPlatform(platform) || platform;

  const canonicalSlugs = useMemo(() => {
    const list = (categories && categories.canonical) || [];
    return list.map(canonicalSlug).filter(Boolean);
  }, [categories]);

  // Raw names for the selected platform tab from /api/categories.
  const platformRaws = useMemo(() => {
    if (!categories || !categories.platforms) return [];
    if (platform === "all") return [];
    const plats = categories.platforms;
    const raws =
      plats[platform] || plats[platformKey] || plats[`${platform}.in`] || [];
    // Avoid repeating a canonical slug that is also a raw name.
    const canonSet = new Set(canonicalSlugs);
    return raws.filter((r) => !canonSet.has(r));
  }, [categories, platform, platformKey, canonicalSlugs]);

  // Canonical slugs that actually map to this platform (via mapping).
  // Falls back to all slugs when mapping info is absent.
  const platformCanonicals = useMemo(() => {
    if (platform === "all") return canonicalSlugs;
    const mapping =
      (categories && categories.mapping) || null;
    if (!mapping) return canonicalSlugs;
    const keys = [platform, platformKey];
    return canonicalSlugs.filter((slug) =>
      keys.some((k) => mapping[slug] && mapping[slug][k]),
    );
  }, [canonicalSlugs, categories, platform, platformKey]);

  // Category dropdown options: canonical chips + this platform's raw names.
  const categoryOptions = useMemo(() => {
    if (platform === "all") return canonicalSlugs.map((s) => ({ value: s, label: s }));
    const seen = new Set();
    const opts = [];
    for (const s of platformCanonicals) {
      if (!seen.has(s)) {
        seen.add(s);
        opts.push({ value: s, label: s, group: "canonical" });
      }
    }
    for (const r of platformRaws) {
      if (!seen.has(r)) {
        seen.add(r);
        opts.push({ value: r, label: r, group: "raw" });
      }
    }
    return opts;
  }, [platform, canonicalSlugs, platformCanonicals, platformRaws]);

  const visible = useMemo(() => {
    let out = [...listings];
    if (platform !== "all")
      out = out.filter((l) => samePlatform(l.platform, platform));
    if (category !== "all")
      out = out.filter((l) => matchesCategory(l, category));
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
  }, [listings, platform, category, sort]);

  async function openDetail(id) {
    const item =
      listings.find((l) => l.id === id) || (await fetchListingById(id));
    setDetail(item || null);
    setView("detail");
  }

  function selectPlatform(v) {
    setPlatform(v);
    setCategory("all");
  }

  const platformLabel =
    (PLATFORM_TABS.find((t) => t.value === platform) || {}).label || platform;

  return (
    <div className="app">
      <header className="header">
        <div className="brand">
          <span className="logo">DP</span>
          <div>
            <h1>DemandPulse</h1>
            <p>Trending products for dropshippers</p>
          </div>
        </div>
        <Tabs options={VIEW_TABS} value={view === "detail" ? "products" : view} onChange={setView} />
      </header>

      <main className="main">
        {loading && <p className="empty">Loading latest picks...</p>}

        {!loading && view === "categories" && (
          <CategoryView
            categories={categories}
            platform={platform}
            onPlatform={selectPlatform}
          />
        )}

        {!loading && view === "products" && (
          <section>
            <h2 className="section-title">Trending products</h2>
            <Tabs options={PLATFORM_TABS} value={platform} onChange={selectPlatform} />
            <div className="filters">
              <label>
                Category
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                >
                  <option value="all">All categories</option>
                  {platform === "all" ? (
                    categoryOptions.map((c) => (
                      <option key={c.value} value={c.value}>
                        {c.label}
                      </option>
                    ))
                  ) : (
                    <>
                      <optgroup label="Canonical">
                        {platformCanonicals.map((c) => (
                          <option key={c} value={c}>
                            {c}
                          </option>
                        ))}
                      </optgroup>
                      {platformRaws.length > 0 && (
                        <optgroup label={`${platformLabel} raw`}>
                          {platformRaws.map((r) => (
                            <option key={r} value={r}>
                              {r}
                            </option>
                          ))}
                        </optgroup>
                      )}
                    </>
                  )}
                </select>
              </label>
              <label>
                Sort by
                <select value={sort} onChange={(e) => setSort(e.target.value)}>
                  {SORTS.map((s) => (
                    <option key={s.value} value={s.value}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            {visible.length === 0 ? (
              <p className="empty">No data yet - worker is collecting.</p>
            ) : (
              <div className="grid">
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
      </main>

      <footer className="footer">
        <span>DemandPulse • {listings.length} listings tracked</span>
      </footer>
    </div>
  );
}
