import { PhotoIcon, BoltIcon, StarIcon } from "./Icons.jsx";

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

export default function ProductCard({ item, onOpen, onPreviewImage }) {
  const off = discount(item.price, item.mrp);
  const img = item.image ?? item.image_url ?? null;
  const velocity = getVelocity(item.reviewHistory);

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
            <StarIcon size={12} className="star-svg-icon" /> {item.rating ?? "—"}
          </span>
          <span className="reviews">{fmt(item.reviewCount)} reviews</span>
        </div>

        <div className="seller-row">
          <span className="seller-name">by {item.seller || "Verified Seller"}</span>
        </div>
      </div>
    </article>
  );
}
