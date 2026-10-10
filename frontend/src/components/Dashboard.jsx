import { useMemo, useState } from "react";
import { MAIN_CATEGORIES, matchesMainCategory } from "../categories.js";
import Tabs from "./Tabs.jsx";

const PRICE_FILTERS = [
  { value: "all", label: "Any price", test: () => true },
  { value: "under-500", label: "Under ₹500", test: (price) => price > 0 && price < 500 },
  { value: "500-1000", label: "₹500 - 1k", test: (price) => price >= 500 && price < 1000 },
  { value: "1000-2500", label: "₹1k - 2.5k", test: (price) => price >= 1000 && price < 2500 },
  { value: "2500-5000", label: "₹2.5k - 5k", test: (price) => price >= 2500 && price < 5000 },
  { value: "over-5000", label: "Over ₹5k", test: (price) => price >= 5000 },
];

const RATING_FILTERS = [
  { value: "all", label: "Any rating", min: 0 },
  { value: "4.5", label: "4.5+", min: 4.5 },
  { value: "4", label: "4.0+", min: 4 },
  { value: "3.5", label: "3.5+", min: 3.5 },
];

const CATEGORY_COLORS = [
  "#2563eb",
  "#f97316",
  "#16a34a",
  "#db2777",
  "#7c3aed",
  "#0891b2",
  "#ca8a04",
  "#475569",
];

function num(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function formatCurrency(value) {
  if (!Number.isFinite(value) || value <= 0) return "No data";
  return `₹${Math.round(value).toLocaleString("en-IN")}`;
}

function formatCompact(value) {
  return Math.round(num(value)).toLocaleString("en-IN");
}

function median(values) {
  const sorted = values.filter((v) => Number.isFinite(v) && v > 0).sort((a, b) => a - b);
  if (!sorted.length) return 0;
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

function average(values) {
  const clean = values.filter((v) => Number.isFinite(v) && v > 0);
  if (!clean.length) return 0;
  return clean.reduce((sum, value) => sum + value, 0) / clean.length;
}

function platformLabel(platform, platformOptions) {
  const normalized = String(platform || "").toLowerCase();
  const match = platformOptions.find((option) => {
    const value = String(option.value || "").toLowerCase();
    return normalized === value || normalized.includes(value);
  });
  if (match) return match.label;
  if (normalized === "amazon.in") return "Amazon.in";
  if (normalized === "flipkart.com") return "Flipkart";
  return platform || "Unknown";
}

function categoryForItem(item) {
  const main = MAIN_CATEGORIES.find(
    (category) => category.id !== "all" && matchesMainCategory(item, category.id)
  );
  return main ? main.name : item.canonical || item.rawCategory || "Unmapped";
}

function truncate(value, length = 34) {
  const text = String(value || "Untitled product");
  return text.length > length ? `${text.slice(0, length - 1)}…` : text;
}

function StatCard({ value, label }) {
  return (
    <div className="dashboard-stat-card">
      <strong>{value}</strong>
      <span>{label}</span>
    </div>
  );
}

function HorizontalBars({ items }) {
  const max = Math.max(...items.map((item) => Math.sqrt(num(item.reviewCount))), 1);
  return (
    <div className="dashboard-bar-list">
      {items.map((item, index) => {
        const width = Math.max(6, (Math.sqrt(num(item.reviewCount)) / max) * 100);
        return (
          <div className="dashboard-bar-row" key={item.id || `${item.title}-${index}`}>
            <span className="dashboard-bar-label">#{index + 1} {truncate(item.title)}</span>
            <span className="dashboard-bar-track">
              <span className="dashboard-bar-fill" style={{ width: `${width}%` }} />
            </span>
            <span className="dashboard-bar-value">
              {formatCompact(item.reviewCount)} · {formatCurrency(num(item.price))}
            </span>
          </div>
        );
      })}
    </div>
  );
}

function ScatterPlot({ items, categoryColor }) {
  const points = items
    .map((item, index) => ({ item, rank: index + 1, price: num(item.price) }))
    .filter((point) => point.price > 0);
  const logs = points.map((point) => Math.log10(point.price));
  const minLog = Math.min(...logs, 0);
  const maxLog = Math.max(...logs, 1);
  const span = Math.max(maxLog - minLog, 0.01);
  const maxRank = Math.max(points.length, 1);

  return (
    <div className="dashboard-scatter-wrap">
      <svg className="dashboard-scatter" viewBox="0 0 640 280" role="img" aria-label="Rank versus price scatter chart">
        <line x1="42" y1="238" x2="610" y2="238" className="chart-axis" />
        <line x1="42" y1="24" x2="42" y2="238" className="chart-axis" />
        {[0.25, 0.5, 0.75].map((tick) => (
          <line
            key={tick}
            x1="42"
            x2="610"
            y1={238 - tick * 214}
            y2={238 - tick * 214}
            className="chart-grid-line"
          />
        ))}
        {points.map(({ item, rank, price }) => {
          const x = 42 + ((rank - 1) / Math.max(maxRank - 1, 1)) * 568;
          const y = 238 - ((Math.log10(price) - minLog) / span) * 200;
          const category = categoryForItem(item);
          return (
            <circle
              key={item.id || `${item.title}-${rank}`}
              cx={x}
              cy={y}
              r="5.5"
              fill={categoryColor.get(category) || CATEGORY_COLORS[0]}
            >
              <title>{`${truncate(item.title, 60)} · rank #${rank} · ${formatCurrency(price)}`}</title>
            </circle>
          );
        })}
        {[1, Math.ceil(maxRank / 2), maxRank].map((rank) => {
          const x = 42 + ((rank - 1) / Math.max(maxRank - 1, 1)) * 568;
          return (
            <text key={rank} x={x} y="260" textAnchor="middle" className="chart-tick">
              #{rank}
            </text>
          );
        })}
      </svg>
    </div>
  );
}

function ColumnChart({ rows }) {
  const max = Math.max(...rows.map((row) => row.count), 1);
  return (
    <div className="dashboard-column-chart">
      {rows.map((row) => (
        <div className="dashboard-column" key={row.label}>
          <span className="dashboard-column-value">{row.count || "0"}</span>
          <span className="dashboard-column-bar" style={{ height: `${Math.max(2, (row.count / max) * 100)}%` }} />
          <span className="dashboard-column-label">{row.label}</span>
        </div>
      ))}
    </div>
  );
}

function PlatformChart({ rows }) {
  const max = Math.max(...rows.map((row) => row.count), 1);
  return (
    <div className="dashboard-platform-chart">
      {rows.map((row) => (
        <div className="dashboard-platform-row" key={row.label}>
          <span className="dashboard-platform-name">{row.label}</span>
          <span className="dashboard-platform-track">
            <span className="dashboard-platform-fill" style={{ width: `${(row.count / max) * 100}%` }} />
          </span>
          <span className="dashboard-platform-count">{row.count || "no data"}</span>
        </div>
      ))}
    </div>
  );
}

function MedianCategoryChart({ rows, categoryColor }) {
  const max = Math.max(...rows.map((row) => row.medianPrice), 1);
  return (
    <div className="dashboard-category-median-list">
      {rows.map((row) => (
        <div className="dashboard-category-median-row" key={row.name}>
          <span className="dashboard-category-name">{row.name}</span>
          <span className="dashboard-category-track">
            <span
              className="dashboard-category-fill"
              style={{
                width: `${Math.max(3, (row.medianPrice / max) * 100)}%`,
                background: categoryColor.get(row.name) || CATEGORY_COLORS[0],
              }}
            />
          </span>
          <span className="dashboard-category-value">{formatCurrency(row.medianPrice)}</span>
        </div>
      ))}
    </div>
  );
}

export default function Dashboard({
  items,
  platform,
  onPlatform,
  platformOptions,
  selectedCategoryName,
  searchQuery,
}) {
  const [priceFilter, setPriceFilter] = useState("all");
  const [ratingFilter, setRatingFilter] = useState("all");

  const dashboard = useMemo(() => {
    const priceRule = PRICE_FILTERS.find((filter) => filter.value === priceFilter) || PRICE_FILTERS[0];
    const ratingRule = RATING_FILTERS.find((filter) => filter.value === ratingFilter) || RATING_FILTERS[0];
    const filtered = items.filter((item) => {
      const price = num(item.price);
      const rating = num(item.rating);
      return priceRule.test(price) && (ratingRule.min === 0 || rating >= ratingRule.min);
    });

    const prices = filtered.map((item) => num(item.price)).filter((price) => price > 0);
    const ratings = filtered.map((item) => num(item.rating)).filter((rating) => rating > 0);
    const categories = filtered.map(categoryForItem);
    const categoryNames = [...new Set(categories)];
    const categoryColor = new Map(categoryNames.map((name, index) => [name, CATEGORY_COLORS[index % CATEGORY_COLORS.length]]));

    const topProducts = [...filtered]
      .sort((a, b) => num(b.reviewCount) - num(a.reviewCount))
      .slice(0, 10);

    const priceBands = PRICE_FILTERS.slice(1).map((filter) => ({
      label: filter.label.replace("₹", ""),
      count: filtered.filter((item) => filter.test(num(item.price))).length,
    }));

    const platformRows = platformOptions
      .filter((option) => option.value !== "all")
      .map((option) => ({
        label: option.label,
        count: filtered.filter((item) => platformLabel(item.platform, platformOptions) === option.label).length,
      }));

    const categoryRows = categoryNames
      .map((name) => {
        const inCategory = filtered.filter((item) => categoryForItem(item) === name);
        return {
          name,
          medianPrice: median(inCategory.map((item) => num(item.price))),
          count: inCategory.length,
        };
      })
      .filter((row) => row.count > 0)
      .sort((a, b) => b.medianPrice - a.medianPrice)
      .slice(0, 10);

    const ratingRows = [
      { label: "4.5+", count: filtered.filter((item) => num(item.rating) >= 4.5).length },
      { label: "4.0-4.4", count: filtered.filter((item) => num(item.rating) >= 4 && num(item.rating) < 4.5).length },
      { label: "3.5-3.9", count: filtered.filter((item) => num(item.rating) >= 3.5 && num(item.rating) < 4).length },
      { label: "<3.5", count: filtered.filter((item) => num(item.rating) > 0 && num(item.rating) < 3.5).length },
      { label: "No rating", count: filtered.filter((item) => !num(item.rating)).length },
    ];

    return {
      filtered,
      topProducts,
      priceBands,
      platformRows,
      categoryRows,
      ratingRows,
      categoryColor,
      medianPrice: median(prices),
      averageRating: average(ratings),
      categoryCount: categoryNames.length,
    };
  }, [items, platformOptions, priceFilter, ratingFilter]);

  const activePlatform = platformOptions.find((option) => option.value === platform)?.label || "All Platforms";
  const filterSummary = [
    activePlatform,
    selectedCategoryName,
    searchQuery ? `Search: ${searchQuery}` : null,
  ].filter(Boolean).join(" · ");

  return (
    <section className="dashboard-view">
      <div className="view-header-strip">
        <div className="view-title-block">
          <h2 className="view-heading">Market Dashboard</h2>
          <p className="view-subtext">
            Category, price and rating analytics from your current product data
          </p>
        </div>
      </div>

      <div className="platform-nav-row">
        <Tabs options={platformOptions} value={platform} onChange={onPlatform} isPlatformTabs />
      </div>

      <div className="dashboard-filter-panel">
        <div className="dashboard-filter-group">
          <span className="dashboard-filter-label">Price</span>
          <div className="dashboard-chip-row">
            {PRICE_FILTERS.map((filter) => (
              <button
                key={filter.value}
                type="button"
                className={`dashboard-chip ${priceFilter === filter.value ? "active" : ""}`}
                onClick={() => setPriceFilter(filter.value)}
              >
                {filter.label}
              </button>
            ))}
          </div>
        </div>

        <div className="dashboard-filter-group">
          <span className="dashboard-filter-label">Rating</span>
          <div className="dashboard-chip-row">
            {RATING_FILTERS.map((filter) => (
              <button
                key={filter.value}
                type="button"
                className={`dashboard-chip ${ratingFilter === filter.value ? "active" : ""}`}
                onClick={() => setRatingFilter(filter.value)}
              >
                {filter.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="dashboard-snapshot-line">
        Showing: {filterSummary || "All marketplace data"}
      </div>

      <div className="dashboard-stat-grid">
        <StatCard value={formatCompact(dashboard.filtered.length)} label="products in filter" />
        <StatCard value={formatCurrency(dashboard.medianPrice)} label="median price" />
        <StatCard value={dashboard.averageRating ? dashboard.averageRating.toFixed(1) : "No data"} label="average rating" />
        <StatCard value={dashboard.categoryCount} label="categories represented" />
      </div>

      {dashboard.filtered.length === 0 ? (
        <div className="empty-state-box dashboard-empty">
          <h3>No dashboard data for these filters</h3>
          <p>Try a wider price range, lower rating threshold, or reset the current search/category filters.</p>
        </div>
      ) : (
        <>
          <div className="dashboard-grid two-col">
            <article className="dashboard-card">
              <div className="dashboard-card-heading">
                <h3>Top 10 best sellers right now</h3>
                <p>Bar length follows customer rating count with a square-root scale.</p>
              </div>
              <HorizontalBars items={dashboard.topProducts} />
            </article>

            <article className="dashboard-card">
              <div className="dashboard-card-heading">
                <h3>Rank vs price</h3>
                <p>Each dot is a product: left is better rank, price uses a log scale, colour is category.</p>
              </div>
              <ScatterPlot items={dashboard.topProducts} categoryColor={dashboard.categoryColor} />
              <div className="dashboard-legend">
                {[...dashboard.categoryColor.entries()].slice(0, 5).map(([name, color]) => (
                  <span key={name}>
                    <i style={{ background: color }} />
                    {name}
                  </span>
                ))}
              </div>
            </article>
          </div>

          <div className="dashboard-grid two-col">
            <article className="dashboard-card">
              <div className="dashboard-card-heading">
                <h3>Price of current products</h3>
                <p>How many products sit in each price band.</p>
              </div>
              <ColumnChart rows={dashboard.priceBands} />
            </article>

            <article className="dashboard-card">
              <div className="dashboard-card-heading">
                <h3>Platform comparison</h3>
                <p>Number of products collected per marketplace after filters.</p>
              </div>
              <PlatformChart rows={dashboard.platformRows} />
            </article>
          </div>

          <div className="dashboard-grid two-col">
            <article className="dashboard-card">
              <div className="dashboard-card-heading">
                <h3>Median price per category</h3>
                <p>Median price from the filtered products, showing top represented categories.</p>
              </div>
              <MedianCategoryChart rows={dashboard.categoryRows} categoryColor={dashboard.categoryColor} />
            </article>

            <article className="dashboard-card">
              <div className="dashboard-card-heading">
                <h3>Rating distribution</h3>
                <p>Product count grouped by customer rating range.</p>
              </div>
              <ColumnChart rows={dashboard.ratingRows} />
            </article>
          </div>
        </>
      )}
    </section>
  );
}
