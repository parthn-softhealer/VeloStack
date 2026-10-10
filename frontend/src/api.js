import { API_BASE } from "./config.js";
import mock from "./mock.json";

// Tab values ("amazon") vs backend platform keys ("amazon.in").
const PLATFORM_MAP = {
  amazon: "amazon.in",
  "amazon.in": "amazon.in",
  flipkart: "flipkart.com",
  "flipkart.com": "flipkart.com",
  meesho: "meesho",
  ajio: "ajio",
  1688: "1688",
};

const PLATFORMS = ["amazon", "flipkart", "meesho", "ajio", "1688"];

function filterListings(listings, { platform, canonical, limit } = {}) {
  let out = [...listings];
  if (platform && platform !== "all") {
    out = out.filter((l) => samePlatform(l.platform, platform));
  }
  if (canonical && canonical !== "all") {
    out = out.filter((l) => matchesCategory(l, canonical));
  }
  if (limit && Number(limit) > 0) {
    out = out.slice(0, Number(limit));
  }
  return out;
}

const CATEGORY_STOPWORDS = new Set([
  "the",
  "and",
  "for",
  "with",
  "from",
  "men",
  "mens",
  "women",
  "womens",
]);

function categoryTokens(category) {
  return String(category || "")
    .toLowerCase()
    .replace(/-/g, " ")
    .split(/[^a-z0-9]+/)
    .filter((t) => t.length > 2 && !CATEGORY_STOPWORDS.has(t));
}

import { matchesMainCategory } from "./categories.js";

export function matchesCategory(item, category) {
  if (!category || category === "all") return true;
  if (matchesMainCategory(item, category)) return true;
  if (item && item.canonical === category) return true;
  const title = String((item && item.title) || "").toLowerCase();
  if (!title) return false;
  return categoryTokens(category).some((tok) => title.includes(tok));
}

export function samePlatform(itemPlatform, tab) {
  if (!tab || tab === "all") return true;
  const full = PLATFORM_MAP[tab] || tab;
  return itemPlatform === full || itemPlatform === tab;
}

export function toBackendPlatform(tab) {
  if (!tab || tab === "all") return null;
  return PLATFORM_MAP[tab] || tab;
}

export function canonicalSlug(entry) {
  if (typeof entry === "string") return entry;
  return (entry && (entry.slug || entry.name_en)) || "";
}

function normalizeListing(row) {
  if (!row || typeof row !== "object") return row;
  if (!("title" in row) || "image" in row) return row;
  // Backend platform_listings row -> frontend card shape.
  const snapshots = Array.isArray(row.snapshots) ? row.snapshots : [];

  let rawObj = {};
  if (row.raw && typeof row.raw === "object") {
    rawObj = row.raw;
  } else if (typeof row.raw === "string") {
    try {
      rawObj = JSON.parse(row.raw);
    } catch {}
  }

  const extCat = row.ext_category || rawObj.ext_category || rawObj.category || null;

  return {
    id: row.id,
    platform: row.platform,
    title: row.title,
    price: row.price ?? 0,
    mrp: row.mrp ?? null,
    currency: "₹",
    rating: row.rating ?? null,
    reviewCount: row.review_count ?? 0,
    seller: row.seller || "—",
    image: row.image_url ?? null,
    image_url: row.image_url ?? null,
    url: row.url || row.link || null,
    link: row.url || row.link || null,
    fetchedAt: row.fetched_at || row.updated_at || row.date || null,
    updatedAt: row.fetched_at || row.updated_at || row.date || null,
    canonical: row.canonical || rawObj.canonical || null,
    rawCategory: row.raw_category || extCat || null,
    extCategory: extCat,
    reviewHistory: snapshots.map((s) => ({
      date: String(s.snapped_at || "").slice(0, 10),
      reviewCount: s.review_count ?? 0,
    })),
  };
}

function normalizeCategories(data) {
  if (!data || typeof data !== "object") return data;
  // New backend shape {canonical, platforms, mapping} passes through.
  if (data.platforms && typeof data.platforms === "object") return data;
  // Legacy backend shape {canonical, platform_raws} -> group mapped raws.
  const raws = Array.isArray(data.platform_raws) ? data.platform_raws : [];
  const platforms = {};
  for (const r of raws) {
    if (r.canonical_id == null) continue;
    (platforms[r.platform] = platforms[r.platform] || []).push(r.raw_name);
  }
  return { canonical: data.canonical || [], platforms, mapping: {} };
}

async function getJSON(path) {
  const res = await fetch(`${API_BASE}${path}`);
  if (!res.ok) throw new Error(`API ${res.status} for ${path}`);
  return res.json();
}

export async function fetchCategories() {
  if (!API_BASE) {
    // Same shape as GET /api/categories
    return mock.categories;
  }
  try {
    return normalizeCategories(await getJSON("/api/categories"));
  } catch {
    // Backend unreachable -> mock fallback only.
    return mock.categories;
  }
}

export async function fetchListings({ platform, canonical, limit } = {}) {
  if (!API_BASE) {
    // Same shape as GET /api/listings?platform&canonical&limit
    return filterListings(mock.listings, { platform, canonical, limit });
  }
  try {
    const q = new URLSearchParams();
    const backendPlatform = toBackendPlatform(platform);
    if (backendPlatform) q.set("platform", backendPlatform);
    if (canonical && canonical !== "all") q.set("canonical", canonical);
    if (limit) {
      const safeLimit = Math.min(Number(limit) || 2000, 5000);
      q.set("limit", String(safeLimit));
    }
    const suffix = q.toString() ? `?${q.toString()}` : "";
    const data = await getJSON(`/api/listings${suffix}`);
    const items = Array.isArray(data) ? data : data.items || [];
    return items.map(normalizeListing);
  } catch (err) {
    console.error("fetchListings error, falling back to mock:", err);
    // Backend unreachable -> mock fallback only.
    return filterListings(mock.listings, { platform, canonical, limit });
  }
}

export async function fetchListingById(id) {
  if (!API_BASE) {
    // Same shape as GET /api/listings/:id
    return mock.listings.find((l) => l.id === id) || null;
  }
  try {
    return normalizeListing(await getJSON(`/api/listings/${encodeURIComponent(id)}`));
  } catch {
    return mock.listings.find((l) => l.id === id) || null;
  }
}

export { PLATFORMS, PLATFORM_MAP };
