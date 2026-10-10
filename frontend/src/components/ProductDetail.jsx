export default function ProductDetail({ item, onBack }) {
  if (!item) {
    return (
      <section>
        <button className="btn ghost" onClick={onBack}>
          ← Back
        </button>
        <p className="empty">No data yet - worker is collecting.</p>
      </section>
    );
  }

  const history = item.reviewHistory || [];
  const needsMore = history.length < 2;
  const img = item.image ?? item.image_url ?? null;
  const fmt = (n) =>
    n == null || Number.isNaN(Number(n)) ? "—" : Number(n).toLocaleString("en-IN");

  return (
    <section>
      <button className="btn ghost" onClick={onBack}>
        ← Back to products
      </button>
      <div className="card detail">
        <div className="detail-grid">
          {img ? (
            <img className="detail-img" src={img} alt={item.title} />
          ) : (
            <div
              className="detail-img no-image"
              role="img"
              aria-label="No image yet"
            >
              No image yet
            </div>
          )}
          <div>
            <span className="badge">{item.platform}</span>
            <h2 className="detail-title">{item.title}</h2>
            <p className="price big">
              {item.currency}
              {fmt(item.price)}{" "}
              {item.mrp != null && (
                <span className="mrp">
                  {item.currency}
                  {fmt(item.mrp)}
                </span>
              )}
            </p>
            <p className="meta-row">
              <span className="rating">★ {item.rating ?? "—"}</span>
              <span className="reviews">{fmt(item.reviewCount)} reviews</span>
            </p>
            <dl className="facts">
              <div>
                <dt>Seller</dt>
                <dd>{item.seller || "—"}</dd>
              </div>
              <div>
                <dt>Canonical category</dt>
                <dd>{item.canonical || "—"}</dd>
              </div>
              <div>
                <dt>Raw category</dt>
                <dd>{item.rawCategory || "—"}</dd>
              </div>
              <div>
                <dt>Listing ID</dt>
                <dd>{item.id}</dd>
              </div>
            </dl>
          </div>
        </div>
        <div className="history">
          <h3 className="sub-title">Review-count history</h3>
          {history.length === 0 ? (
            <p className="empty">No data yet - worker is collecting.</p>
          ) : (
            <ul className="raw-list">
              {history.map((h) => (
                <li key={h.date}>
                  {h.date}: {fmt(h.reviewCount)} reviews
                </li>
              ))}
            </ul>
          )}
          {needsMore && (
            <p className="note">
              Velocity needs 2 snapshots - only {history.length} saved so far.
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
