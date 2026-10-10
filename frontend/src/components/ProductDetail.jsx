import { useState } from "react";
import { PhotoIcon, InfoIcon } from "./Icons.jsx";

function fmt(n) {
  if (n == null || Number.isNaN(Number(n))) return "—";
  return Number(n).toLocaleString("en-IN");
}

export default function ProductDetail({ item, onBack }) {
  const [sourcingCost, setSourcingCost] = useState(
    item ? Math.round((item.price || 500) * 0.35) : 200
  );
  const [shippingCost, setShippingCost] = useState(80);

  if (!item) {
    return (
      <section className="detail-container">
        <button className="btn back-btn" onClick={onBack}>
          ← Back to Trending Products
        </button>
        <p className="empty">Listing details not found.</p>
      </section>
    );
  }

  const history = item.reviewHistory || [];
  const needsMore = history.length < 2;
  const img = item.image ?? item.image_url ?? null;

  // Margin calculation
  const sellingPrice = Number(item.price) || 0;
  const totalCost = Number(sourcingCost) + Number(shippingCost);
  const netProfit = Math.max(0, sellingPrice - totalCost);
  const marginPercent =
    sellingPrice > 0 ? Math.round((netProfit / sellingPrice) * 100) : 0;

  return (
    <section className="detail-container">
      <div className="detail-header-bar">
        <button className="btn back-btn" onClick={onBack}>
          ← Back to Products
        </button>
        <div className="detail-actions">
          <span className={`badge platform platform-${item.platform}`}>
            {item.platform}
          </span>
          <span className="listing-tag">ID: {item.id}</span>
        </div>
      </div>

      <div className="card detail-card">
        <div className="detail-grid">
          <div className="detail-media">
            {img ? (
              <img className="detail-img" src={img} alt={item.title} />
            ) : (
              <div className="detail-img no-image">
                <PhotoIcon size={32} />
                <span>No image preview available</span>
              </div>
            )}
            <div className="detail-badges">
              <span className="badge category-badge">
                {item.canonical || "Trending"}
              </span>
              <span className="badge sub-badge">{item.rawCategory || "General"}</span>
            </div>
          </div>

          <div className="detail-info">
            <h2 className="detail-title">{item.title}</h2>

            <div className="detail-price-box">
              <div className="price big">
                {item.currency}
                {fmt(item.price)}
                {item.mrp != null && item.mrp > item.price && (
                  <span className="mrp">
                    {item.currency}
                    {fmt(item.mrp)}
                  </span>
                )}
              </div>
              <div className="rating-pill">
                <span className="star">★</span> {item.rating ?? "—"}
                <span className="reviews-sub">({fmt(item.reviewCount)} reviews)</span>
              </div>
            </div>

            <dl className="facts-grid">
              <div className="fact-item">
                <dt>Marketplace</dt>
                <dd className="platform-name-text">{item.platform}</dd>
              </div>
              <div className="fact-item">
                <dt>Seller / Merchant</dt>
                <dd>{item.seller || "—"}</dd>
              </div>
              <div className="fact-item">
                <dt>Canonical Category</dt>
                <dd>{item.canonical || "—"}</dd>
              </div>
              <div className="fact-item">
                <dt>Platform Category</dt>
                <dd>{item.rawCategory || "—"}</dd>
              </div>
            </dl>

            {/* Profit Margin Estimator */}
            <div className="calculator-box">
              <div className="calc-header">
                <h4>Dropship Profit Margin Estimator</h4>
                <span className="roi-badge">{marginPercent}% Estimated Margin</span>
              </div>
              <div className="calc-inputs">
                <label>
                  Est. Sourcing Cost ({item.currency})
                  <input
                    type="number"
                    value={sourcingCost}
                    onChange={(e) => setSourcingCost(Number(e.target.value) || 0)}
                  />
                </label>
                <label>
                  Est. Shipping / Pack ({item.currency})
                  <input
                    type="number"
                    value={shippingCost}
                    onChange={(e) => setShippingCost(Number(e.target.value) || 0)}
                  />
                </label>
                <div className="calc-result">
                  <span className="calc-result-label">Net Profit / Unit</span>
                  <span className="calc-result-val">
                    {item.currency}
                    {fmt(netProfit)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Historical Review Velocity */}
        <div className="history-section">
          <div className="history-header">
            <h3 className="sub-title">Review Acceleration History</h3>
            <span className="history-count">{history.length} snapshots logged</span>
          </div>

          {history.length === 0 ? (
            <p className="empty">No snapshots logged yet - background worker scheduled.</p>
          ) : (
            <div className="snapshots-table-wrap">
              <table className="snapshots-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Cumulative Reviews</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map((h, i) => {
                    const prev = i > 0 ? history[i - 1].reviewCount : null;
                    const diff = prev != null ? h.reviewCount - prev : null;
                    return (
                      <tr key={h.date || i}>
                        <td>{h.date}</td>
                        <td className="strong">{fmt(h.reviewCount)} reviews</td>
                        <td>
                          {diff != null && diff > 0 ? (
                            <span className="growth-positive">+{fmt(diff)} surge</span>
                          ) : (
                            <span className="growth-steady">Baseline</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {needsMore && (
            <div className="note-box">
              <InfoIcon size={18} />
              <p>
                Two or more daily snapshots required to compute accurate 7-day review acceleration velocity.
              </p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
