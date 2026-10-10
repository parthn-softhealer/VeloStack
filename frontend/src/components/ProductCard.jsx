function discount(price, mrp) {
  if (mrp == null || price == null || mrp <= price) return null;
  return Math.round(((mrp - price) / mrp) * 100);
}

function Sparkline() {
  // Placeholder trend line (indigo stroke only)
  return (
    <svg className="spark" viewBox="0 0 100 28" aria-hidden="true">
      <polyline
        points="0,22 15,18 30,20 45,12 60,14 75,7 90,9 100,4"
        fill="none"
        stroke="#4f46e5"
        strokeWidth="2"
      />
    </svg>
  );
}

function fmt(n) {
  if (n == null || Number.isNaN(Number(n))) return "—";
  return Number(n).toLocaleString("en-IN");
}

export default function ProductCard({ item, onOpen }) {
  const off = discount(item.price, item.mrp);
  const img = item.image ?? item.image_url ?? null;
  return (
    <article className="card product" onClick={() => onOpen(item.id)}>
      <div className="img-wrap">
        {img ? (
          <img src={img} alt={item.title} loading="lazy" />
        ) : (
          <div className="no-image" role="img" aria-label="No image yet">
            No image yet
          </div>
        )}
        <span className="badge platform">{item.platform}</span>
      </div>
      <div className="product-body">
        <h3 className="product-title">{item.title}</h3>
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
          <span className="rating">★ {item.rating ?? "—"}</span>
          <span className="reviews">{fmt(item.reviewCount)} reviews</span>
        </div>
        <div className="meta-row dim">
          <span>{item.seller || "—"}</span>
        </div>
        <Sparkline />
      </div>
    </article>
  );
}
