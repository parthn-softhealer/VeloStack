import Tabs from "./Tabs.jsx";
import { canonicalSlug } from "../api.js";

const PLATFORM_KEY = {
  amazon: "amazon.in",
  flipkart: "flipkart.com",
  meesho: "meesho",
  ajio: "ajio",
  1688: "1688",
};

function labelOf(entry) {
  const slug = canonicalSlug(entry);
  if (entry && typeof entry === "object" && entry.name_en) return entry.name_en;
  return slug;
}

function keyOf(entry) {
  return canonicalSlug(entry) || labelOf(entry);
}

export default function CategoryView({ categories, platform, onPlatform }) {
  const tabs = [
    { value: "all", label: "All" },
    { value: "amazon", label: "Amazon" },
    { value: "flipkart", label: "Flipkart" },
    { value: "meesho", label: "Meesho" },
    { value: "ajio", label: "Ajio" },
    { value: "1688", label: "1688" },
  ];

  if (!categories) {
    return <p className="empty">No data yet - worker is collecting.</p>;
  }

  const platforms = categories.platforms || {};
  const canonical = categories.canonical || [];

  // Resolve the selected tab to backend platform key(s).
  function keysFor(tab) {
    if (tab === "all") return Object.keys(platforms);
    const full = PLATFORM_KEY[tab] || tab;
    if (platforms[full]) return [full];
    if (platforms[tab]) return [tab];
    return [full];
  }

  const platformsToShow = keysFor(platform);

  return (
    <section>
      <h2 className="view-heading" style={{ marginBottom: "16px" }}>
        Platform Category Mappings
      </h2>
      <div style={{ marginBottom: "20px" }}>
        <Tabs options={tabs} value={platform} onChange={onPlatform} isPlatformTabs />
      </div>

      <h3 className="sub-title">Canonical categories</h3>
      {canonical.length === 0 ? (
        <p className="empty">No data yet - worker is collecting.</p>
      ) : (
        <div className="chips">
          {canonical.map((c) => (
            <span key={keyOf(c)} className="chip">
              {labelOf(c)}
            </span>
          ))}
        </div>
      )}

      <h3 className="sub-title">Raw categories per platform</h3>
      {platformsToShow.map((p) => {
        const list = platforms[p] || [];
        return (
          <div key={p} className="card platform-block">
            <div className="platform-row">
              <strong className="platform-name">{p}</strong>
              <span className="badge">{p}</span>
            </div>
            {list.length === 0 ? (
              <p className="empty">No data yet - worker is collecting.</p>
            ) : (
              <ul className="raw-list">
                {list.map((r) => (
                  <li key={r}>{r}</li>
                ))}
              </ul>
            )}
          </div>
        );
      })}
    </section>
  );
}
