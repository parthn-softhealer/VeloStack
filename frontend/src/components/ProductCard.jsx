import { PhotoIcon, BoltIcon, StarIcon, ExternalLinkIcon, ClockIcon } from "./Icons.jsx";

function discount(price, mrp) {
  if (mrp == null || price == null || mrp <= price) return null;
  return Math.round(((mrp - price) / mrp) * 100);
}

function fmt(n) {
  if (n == null || Number.isNaN(Number(n))) return "—";
  return Number(n).toLocaleString("en-IN");
}

function getVelocity(item) {
  if (!item) return null;
  const history = item.reviewHistory || [];
  if (history.length >= 2) {
    const first = Number(history[0].reviewCount);
    const last = Number(history[history.length - 1].reviewCount);
    if (first > 0 && last > first) {
      const growth = ((last - first) / first) * 100;
      if (growth > 0) return `+${growth.toFixed(1)}%`;
    }
  }
  if (Number(item.reviewCount) >= 5000 && (item.rating == null || Number(item.rating) >= 3.8)) {
    return "Surging";
  }
  return null;
}

function getProductUrl(item) {
  if (!item) return "#";
  const rawUrl = item.url || item.link;
  if (rawUrl && typeof rawUrl === "string" && rawUrl.startsWith("http")) {
    return rawUrl;
  }
  const plat = String(item.platform || "").toLowerCase();
  const q = encodeURIComponent(item.title || "product");
  if (plat.includes("amazon")) return `https://www.amazon.in/s?k=${q}`;
  if (plat.includes("flipkart")) return `https://www.flipkart.com/search?q=${q}`;
  if (plat.includes("meesho")) return `https://www.meesho.com/search?q=${q}`;
  if (plat.includes("ajio")) return `https://www.ajio.com/search/?text=${q}`;
  return `https://www.google.com/search?q=${q}`;
}

function formatLastUpdated(dateStr) {
  if (!dateStr) return "Just now";
  try {
    const d = new Date(dateStr);
    if (Number.isNaN(d.getTime())) return String(dateStr);
    return d.toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  } catch {
    return String(dateStr);
  }
}

export default function ProductCard({ item, onOpen, onPreviewImage }) {
  const off = discount(item.price, item.mrp);
  const img = item.image ?? item.image_url ?? null;
  const velocity = getVelocity(item);
  const productUrl = getProductUrl(item);
  const lastUpdated = formatLastUpdated(item.fetchedAt || item.updatedAt);

  function handleCornerExpandClick(e) {
    e.stopPropagation();
    if (img && onPreviewImage) {
      onPreviewImage({
        url: img,
        title: item.title,
        price: item.price,
        currency: item.currency,
        platform: item.platform,
      });
    }
  }

  function handleCardClick(e) {
    // If user clicked corner expand button, let that open image modal
    if (e.target.closest(".img-corner-expand-btn")) return;
    
    // Redirect directly to the product on the marketplace
    if (productUrl && productUrl !== "#") {
      window.open(productUrl, "_blank", "noopener,noreferrer");
    } else if (onOpen) {
      onOpen(item.id);
    }
  }

  return (
    <article
      className="card product"
      onClick={handleCardClick}
      role="link"
      tabIndex={0}
      title={`Click to open product on ${item.platform || "marketplace"}`}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") handleCardClick(e);
      }}
    >
      <div className="img-wrap">
        {img ? (
          <>
            <img src={img} alt={item.title} loading="lazy" />
            <button
              type="button"
              className="img-corner-expand-btn"
              onClick={handleCornerExpandClick}
              title="Click to view full image"
              aria-label="Click to view full image"
            >
              <svg
                viewBox="0 0 24 24"
                width="16"
                height="16"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="15 3 21 3 21 9" />
                <polyline points="9 21 3 21 3 15" />
                <line x1="21" y1="3" x2="14" y2="10" />
                <line x1="3" y1="21" x2="10" y2="14" />
              </svg>
            </button>
          </>
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
            <span className="velocity-chip" title="Demand & review velocity">
              <BoltIcon size={12} className="inline-bolt-icon" /> {velocity}
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
            <StarIcon size={12} className="star-svg-icon" /> {item.rating ?? "—"}
          </span>
          <span className="reviews">{fmt(item.reviewCount)} reviews</span>
        </div>

        <div className="seller-row">
          <span className="seller-name">by {item.seller || "Verified Seller"}</span>
        </div>

        {/* Last Update from Database & Direct Store Link */}
        <div className="product-footer-bar">
          <div className="last-update-badge" title="Timestamp from database">
            <ClockIcon size={12} className="inline-clock-svg" />
            <span>Last Update : {lastUpdated}</span>
          </div>
          <a
            href={productUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="direct-store-link"
            onClick={(e) => e.stopPropagation()}
            title={`Open product directly on ${item.platform}`}
          >
            <span>Open</span>
            <ExternalLinkIcon size={11} />
          </a>
        </div>
      </div>
    </article>
  );
}
