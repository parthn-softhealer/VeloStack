import { PhotoIcon, BoltIcon } from "./Icons.jsx";

function discount(price, mrp) {
  if (mrp == null || price == null || mrp <= price) return null;
  return Math.round(((mrp - price) / mrp) * 100);
}

function fmt(n) {
  if (n == null || Number.isNaN(Number(n))) return "—";
  return Number(n).toLocaleString("en-IN");
}

function getVelocity(history = []) {
  if (!history || history.length < 2) return null;
  const first = history[0].reviewCount;
  const last = history[history.length - 1].reviewCount;
  if (!first || !last || last <= first) return null;
  const growth = ((last - first) / first) * 100;
  return growth > 0 ? growth.toFixed(1) : null;
}

function DynamicSparkline({ history = [] }) {
  if (!history || history.length < 2) {
    // Elegant baseline wave
    return (
      <svg className="spark" viewBox="0 0 100 28" aria-hidden="true">
        <path
          d="M 0,22 Q 25,18 50,14 T 100,6"
          fill="none"
          stroke="var(--accent)"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
      </svg>
    );
  }

  const values = history.map((h) => h.reviewCount || 0);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;

  const points = values.map((val, idx) => {
    const x = (idx / (values.length - 1)) * 96 + 2;
    // Map normalized value: inverted y (24 at bottom, 4 at top)
    const norm = (val - min) / range;
    const y = 24 - norm * 18;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });

  const polylineStr = points.join(" ");

  return (
    <svg className="spark" viewBox="0 0 100 28" aria-hidden="true">
      <defs>
        <linearGradient id="sparkGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.25" />
          <stop offset="100%" stopColor="var(--accent)" stopOpacity="0.0" />
        </linearGradient>
      </defs>
      <polyline
        points={polylineStr}
        fill="none"
        stroke="var(--accent)"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function ProductCard({ item, onOpen }) {
  const off = discount(item.price, item.mrp);
  const img = item.image ?? item.image_url ?? null;
  const velocity = getVelocity(item.reviewHistory);

  return (
    <article
      className="card product"
      onClick={() => onOpen(item.id)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") onOpen(item.id);
      }}
    >
      <div className="img-wrap">
        {img ? (
          <img src={img} alt={item.title} loading="lazy" />
        ) : (
          <div className="no-image" role="img" aria-label="No image yet">
            <span className="no-image-icon">
              <PhotoIcon size={28} />
            </span>
            <span>Awaiting preview</span>
          </div>
        )}
        <div className="badge-row">
          <span className={`badge platform platform-${item.platform}`}>
            {item.platform}
          </span>
          {velocity && (
            <span className="velocity-chip" title="Review growth velocity">
              <BoltIcon size={12} className="inline-bolt-icon" /> +{velocity}%
            </span>
          )}
        </div>
      </div>

      <div className="product-body">
        <div className="category-pill-row">
          <span className="mini-category-pill">
            {item.canonical || item.rawCategory || "Trending"}
          </span>
        </div>

        <h3 className="product-title" title={item.title}>
          {item.title}
        </h3>

        <div className="price-row">
          <span className="price">
            {item.currency}
            {fmt(item.price)}
          </span>
          {item.mrp != null && item.mrp > item.price && (
            <span className="mrp">
              {item.currency}
              {fmt(item.mrp)}
            </span>
          )}
          {off && <span className="off">{off}% off</span>}
        </div>

        <div className="meta-row">
          <span className="rating">
            <span className="star-icon">★</span> {item.rating ?? "—"}
          </span>
          <span className="reviews">{fmt(item.reviewCount)} reviews</span>
        </div>

        <div className="seller-row">
          <span className="seller-name">by {item.seller || "Verified Seller"}</span>
        </div>

        <div className="spark-container">
          <div className="spark-header">
            <span className="spark-label">Demand Velocity</span>
            <span className="spark-status">Surging</span>
          </div>
          <DynamicSparkline history={item.reviewHistory} />
        </div>
      </div>
    </article>
  );
}
