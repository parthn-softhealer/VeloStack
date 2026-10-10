// background.js - Live Scraper with ALL Categories + 20-Minute Auto-Refresh Cache

// ═══════════════════════════════════════════════════════════════════
// ALL PRODUCT CATEGORIES - Amazon Best Sellers, Flipkart, Meesho, and Ajio
// ═══════════════════════════════════════════════════════════════════
const CATEGORY_CONFIG = {
  "electronics": {
    amazonUrl: "https://www.amazon.in/gp/bestsellers/electronics",
    flipkartQuery: "electronics",
    meeshoQuery: "electronics",
    ajioQuery: "electronics"
  },
  "computers": {
    amazonUrl: "https://www.amazon.in/gp/bestsellers/computers",
    flipkartQuery: "computers laptops",
    meeshoQuery: "computers laptops",
    ajioQuery: "computers laptops"
  },
  "fashion": {
    amazonUrl: "https://www.amazon.in/gp/bestsellers/apparel",
    flipkartQuery: "fashion clothing",
    meeshoQuery: "fashion clothing",
    ajioQuery: "fashion clothing"
  },
  "shoes": {
    amazonUrl: "https://www.amazon.in/gp/bestsellers/shoes",
    flipkartQuery: "shoes footwear",
    meeshoQuery: "shoes footwear",
    ajioQuery: "shoes footwear"
  },
  "watches": {
    amazonUrl: "https://www.amazon.in/gp/bestsellers/watches",
    flipkartQuery: "watches",
    meeshoQuery: "watches",
    ajioQuery: "watches"
  },
  "jewellery": {
    amazonUrl: "https://www.amazon.in/gp/bestsellers/jewelry",
    flipkartQuery: "jewellery",
    meeshoQuery: "jewellery",
    ajioQuery: "jewellery"
  },
  "bags luggage": {
    amazonUrl: "https://www.amazon.in/gp/bestsellers/luggage",
    flipkartQuery: "bags luggage",
    meeshoQuery: "bags luggage",
    ajioQuery: "bags luggage"
  },
  "home kitchen": {
    amazonUrl: "https://www.amazon.in/gp/bestsellers/kitchen",
    flipkartQuery: "home kitchen",
    meeshoQuery: "home kitchen",
    ajioQuery: "home kitchen"
  },
  "home improvement": {
    amazonUrl: "https://www.amazon.in/gp/bestsellers/home-improvement",
    flipkartQuery: "home improvement",
    meeshoQuery: "home improvement",
    ajioQuery: "home improvement"
  },
  "furniture": {
    amazonUrl: "https://www.amazon.in/gp/bestsellers/furniture",
    flipkartQuery: "furniture",
    meeshoQuery: "furniture",
    ajioQuery: "furniture"
  },
  "beauty": {
    amazonUrl: "https://www.amazon.in/gp/bestsellers/beauty",
    flipkartQuery: "beauty",
    meeshoQuery: "beauty",
    ajioQuery: "beauty"
  },
  "health personal care": {
    amazonUrl: "https://www.amazon.in/gp/bestsellers/hpc",
    flipkartQuery: "health personal care",
    meeshoQuery: "health personal care",
    ajioQuery: "health personal care"
  },
  "sports fitness": {
    amazonUrl: "https://www.amazon.in/gp/bestsellers/sports",
    flipkartQuery: "sports fitness",
    meeshoQuery: "sports fitness",
    ajioQuery: "sports fitness"
  },
  "books": {
    amazonUrl: "https://www.amazon.in/gp/bestsellers/books",
    flipkartQuery: "books",
    meeshoQuery: "books",
    ajioQuery: "books"
  },
  "stationery office": {
    amazonUrl: "https://www.amazon.in/gp/bestsellers/office",
    flipkartQuery: "stationery office supplies",
    meeshoQuery: "stationery office supplies",
    ajioQuery: "stationery office supplies"
  },
  "baby": {
    amazonUrl: "https://www.amazon.in/gp/bestsellers/baby",
    flipkartQuery: "baby products",
    meeshoQuery: "baby products",
    ajioQuery: "baby products"
  },
  "toys games": {
    amazonUrl: "https://www.amazon.in/gp/bestsellers/toys",
    flipkartQuery: "toys games",
    meeshoQuery: "toys games",
    ajioQuery: "toys games"
  },
  "grocery": {
    amazonUrl: "https://www.amazon.in/gp/bestsellers/grocery",
    flipkartQuery: "grocery",
    meeshoQuery: "grocery",
    ajioQuery: "grocery"
  },
  "automotive": {
    amazonUrl: "https://www.amazon.in/gp/bestsellers/automotive",
    flipkartQuery: "automotive accessories",
    meeshoQuery: "automotive accessories",
    ajioQuery: "automotive accessories"
  },
  "garden outdoor": {
    amazonUrl: "https://www.amazon.in/gp/bestsellers/lawn-garden",
    flipkartQuery: "garden outdoor",
    meeshoQuery: "garden outdoor",
    ajioQuery: "garden outdoor"
  },
  "pet supplies": {
    amazonUrl: "https://www.amazon.in/gp/bestsellers/pet-supplies",
    flipkartQuery: "pet supplies",
    meeshoQuery: "pet supplies",
    ajioQuery: "pet supplies"
  },
  "gaming": {
    amazonUrl: "https://www.amazon.in/gp/bestsellers/videogames",
    flipkartQuery: "gaming",
    meeshoQuery: "gaming",
    ajioQuery: "gaming"
  },
  "musical instruments": {
    amazonUrl: "https://www.amazon.in/gp/bestsellers/musical-instruments",
    flipkartQuery: "musical instruments",
    meeshoQuery: "musical instruments",
    ajioQuery: "musical instruments"
  }
};

const PRODUCT_PLACEHOLDER = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='65' height='65' viewBox='0 0 65 65'%3E%3Crect width='65' height='65' rx='8' fill='%23e5e7eb'/%3E%3Cpath d='M19 43h27l-8-10-6 7-4-5-9 8z' fill='%239ca3af'/%3E%3Ccircle cx='25' cy='24' r='5' fill='%239ca3af'/%3E%3C/svg%3E";
const MEESHO_SEARCH_URL = "https://www.meesho.com/api/v1/products/search";
const AJIO_SEARCH_URL = "https://www.ajio.com/api/search";
const PRODUCTS_PER_STORE = 100;
const AMAZON_MAX_PAGES = 2;
const FLIPKART_MAX_PAGES = 5;
const MEESHO_PAGE_SIZE = 20;
const AJIO_PAGE_SIZE = 45;
const AJIO_MAX_PAGES = 3;
const CACHE_VERSION = "v7";

// DemandPulse backend - extension data goes to DB FIRST, UI reads from DB.
const BACKEND_URL = "http://192.168.1.66:8000";

async function postToBackend(products, category) {
  if (!products || !products.length) return;
  try {
    const items = products
      .filter((p) => p.image && !p.image.startsWith("data:"))
      .map((p) => ({
        store: p.store, title: p.title, price: p.price,
        originalPrice: p.originalPrice || "", rating: p.rating,
        starRating: p.starRating || "", reviewCount: p.reviewCount || "",
        discount: p.discount || "", stockText: p.stockText || "",
        image: p.image, link: p.link, category: category
      }));
    if (!items.length) return;
    const res = await fetch(`${BACKEND_URL}/api/ingest`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items })
    });
    console.log(`DB push "${category}":`, await res.text());
  } catch (err) {
    console.error("DB push failed:", err);
  }
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

// Cache duration: 20 minutes in milliseconds
const CACHE_DURATION_MS = 20 * 60 * 1000;

// ═══════════════════════════════════════════════════════════════════
// UTILITY FUNCTIONS
// ═══════════════════════════════════════════════════════════════════

function normalizeCategory(categoryName) {
  return String(categoryName || "electronics")
    .toLowerCase()
    .replace(/&/g, " ")
    .replace(/[^\w\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function getCategoryConfig(categoryName) {
  const key = normalizeCategory(categoryName);
  const config = CATEGORY_CONFIG[key] || {};
  return {
    amazonUrl: config.amazonUrl || CATEGORY_CONFIG.electronics.amazonUrl,
    flipkartQuery: config.flipkartQuery || key || "electronics",
    meeshoQuery: config.meeshoQuery || config.flipkartQuery || key || "electronics",
    ajioQuery: config.ajioQuery || config.flipkartQuery || key || "electronics"
  };
}

function decodeHtml(value) {
  return String(value || "")
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
    .replace(/&#x([\da-f]+);/gi, (_, code) => String.fromCharCode(parseInt(code, 16)))
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ");
}

function cleanText(value) {
  return decodeHtml(value)
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function cleanUrl(value) {
  return decodeHtml(value).replace(/\\u002F/g, "/").trim();
}

function addQueryParam(url, paramName, paramValue) {
  const separator = url.includes("?") ? "&" : "?";
  return `${url}${separator}${encodeURIComponent(paramName)}=${encodeURIComponent(paramValue)}`;
}

function normalizeRating(value) {
  const text = cleanText(value);
  const match = text.match(/(\d+(?:\.\d+)?)/);
  return match ? `${match[1]}★` : "N/A";
}

function normalizeReviewCount(value) {
  const text = cleanText(value);
  const match = text.match(/([\d,]+)\s*(?:ratings?|reviews?)/i) || text.match(/^([\d,]+)$/);
  return match ? match[1] : "N/A";
}

function normalizeDiscount(value) {
  const text = cleanText(value);
  const match = text.match(/(\d+% off)/i) || text.match(/(₹[\d,]+\s*off)/i);
  return match ? match[1] : "N/A";
}

function normalizePrice(value) {
  const text = cleanText(value);
  if (!text) return "N/A";
  return text.includes("₹") ? text : `₹${text}`;
}

function normalizeStockText(value) {
  const text = cleanText(value);
  const match = text.match(/only\s+\d+\s+left[^.<>]*/i) ||
    text.match(/\d+\s+left\s+in\s+stock[^.<>]*/i) ||
    text.match(/limited\s+stock[^.<>]*/i);
  return match ? match[0] : "Check site";
}

async function fetchPageHTML(url) {
  try {
    const response = await fetch(url, {
      headers: {
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8"
      }
    });
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    return await response.text();
  } catch (error) {
    console.error(`Fetch failed for ${url}:`, error);
    return null;
  }
}

async function fetchJSON(url, data) {
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Accept": "application/json",
        "Content-Type": "application/json",
        "MEESHO-ISO-COUNTRY-CODE": "IN"
      },
      body: JSON.stringify(data)
    });
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    return await response.json();
  } catch (error) {
    console.error(`JSON fetch failed for ${url}:`, error);
    return null;
  }
}

async function fetchJSONGet(url) {
  try {
    const response = await fetch(url, {
      headers: {
        "Accept": "application/json, text/plain, */*"
      }
    });
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    return await response.json();
  } catch (error) {
    console.error(`JSON GET failed for ${url}:`, error);
    return null;
  }
}

// ═══════════════════════════════════════════════════════════════════
// CACHE SYSTEM - Store scraped data in chrome.storage.local
// ═══════════════════════════════════════════════════════════════════

async function getCachedData(category) {
  const key = `cache_${CACHE_VERSION}_${normalizeCategory(category)}`;
  try {
    const result = await chrome.storage.local.get(key);
    if (result[key]) {
      const cached = result[key];
      const age = Date.now() - cached.timestamp;
      if (age < CACHE_DURATION_MS) {
        console.log(`Cache HIT for "${category}" (age: ${Math.round(age / 1000)}s)`);
        return cached.data;
      }
      console.log(`Cache EXPIRED for "${category}" (age: ${Math.round(age / 1000)}s)`);
    }
  } catch (err) {
    console.error("Cache read error:", err);
  }
  return null;
}

async function setCachedData(category, data) {
  const key = `cache_${CACHE_VERSION}_${normalizeCategory(category)}`;
  try {
    await chrome.storage.local.set({
      [key]: {
        data: data,
        timestamp: Date.now()
      }
    });
    console.log(`Cache SAVED for "${category}" (${data.length} products)`);
  } catch (err) {
    console.error("Cache write error:", err);
  }
}

// ═══════════════════════════════════════════════════════════════════
// SCRAPERS
// ═══════════════════════════════════════════════════════════════════

// Scrape Official Amazon Best Sellers Page
async function scrapeAmazonBestSellers(categoryName) {
  const baseUrl = getCategoryConfig(categoryName).amazonUrl;
  const products = [];
  const seenLinks = new Set();

  for (let page = 1; page <= AMAZON_MAX_PAGES && products.length < PRODUCTS_PER_STORE; page++) {
    const url = page === 1 ? baseUrl : addQueryParam(baseUrl, "pg", page);
    const html = await fetchPageHTML(url);
    if (!html) break;

    // Parse Best Seller Card blocks in /gp/bestsellers/
    const items = [...html.matchAll(/id="gridItemRoot"[\s\S]*?<\/div>\s*<\/div>\s*<\/div>/gi)];
    if (!items.length) break;

    for (const match of items) {
      if (products.length >= PRODUCTS_PER_STORE) break;
      const block = match[0];

      // Extract Title
      const titleMatch = block.match(/<div class="[^"]*_cDE12_p13n-sc-css-line-clamp[^"]*"[^>]*>([^<]+)<\/div>/i) ||
        block.match(/alt="([^"]+)"/i);
      const title = titleMatch ? cleanText(titleMatch[1]) : null;

      // Extract Price (multiple patterns for Best Sellers page)
      const priceMatch = block.match(/<span class="[^"]*_cDE12_p13n-sc-price[^"]*"[^>]*>([^<]+)<\/span>/i) ||
        block.match(/<span class="a-price-whole">([^<]+)<\/span>/i) ||
        block.match(/a-price[^>]*>.*?<span[^>]*>(₹[\d,\.]+)<\/span>/i) ||
        block.match(/₹\s*([\d,\.]+)/i) ||
        block.match(/&#8377;\s*([\d,]+)/i);
      const priceValue = priceMatch ? cleanText(priceMatch[1]) : "";
      const price = priceValue ? (priceValue.includes("₹") ? priceValue : `₹${priceValue}`) : "Check Site";
      const originalPriceMatch = block.match(/<span class="[^"]*a-text-price[^"]*"[^>]*>[\s\S]*?<span[^>]*>(₹[\d,\.]+)<\/span>/i) ||
        block.match(/<span[^>]*data-a-strike="true"[^>]*>[\s\S]*?(₹[\d,\.]+)[\s\S]*?<\/span>/i) ||
        block.match(/M\.R\.P\.?:?\s*<\/span>\s*<span[^>]*>(₹[\d,\.]+)<\/span>/i) ||
        block.match(/List Price:?\s*<\/span>\s*<span[^>]*>(₹[\d,\.]+)<\/span>/i);
      const originalPrice = originalPriceMatch ? normalizePrice(originalPriceMatch[1]) : "N/A";
      const ratingMatch = block.match(/(\d+(?:\.\d+)?)\s*out of 5 stars/i) ||
        block.match(/aria-label="([^"]*out of 5 stars[^"]*)"/i) ||
        block.match(/title="([^"]*out of 5 stars[^"]*)"/i);
      const reviewMatch = block.match(/([\d,]+)\s*(?:ratings?|reviews?)/i) ||
        block.match(/<span[^>]*class="[^"]*a-size-small[^"]*"[^>]*>\s*([\d,]+)\s*<\/span>/i);
      const discountMatch = block.match(/(\d+% off)/i) || block.match(/(₹[\d,]+\s*off)/i);
      const stockMatch = block.match(/only\s+\d+\s+left[^<]*/i) || block.match(/\d+\s+left\s+in\s+stock[^<]*/i);

      // Extract Image (multiple patterns: src, data-a-dynamic-image, srcset, any amazon image)
      const imgMatch =
        block.match(/src="(https:\/\/m\.media-amazon\.com\/images\/I\/[^"]+)"/i) ||
        block.match(/src="(https:\/\/images-eu\.ssl-images-amazon\.com\/images\/I\/[^"]+)"/i) ||
        block.match(/data-a-dynamic-image="\{&quot;(https:\/\/[^&]+)&quot;/i) ||
        block.match(/data-a-dynamic-image="[^"]*?(https:\/\/m\.media-amazon\.com\/images\/I\/[^"&\s,]+)/i) ||
        block.match(/srcset="(https:\/\/m\.media-amazon\.com\/images\/I\/[^"\s,]+)/i) ||
        block.match(/"(https:\/\/m\.media-amazon\.com\/images\/I\/[^"]+\._[^"]+\.jpg)"/i) ||
        block.match(/src="(https:\/\/[^"]*amazon[^"]*\/images\/I\/[^"]+)"/i);
      const image = imgMatch ? cleanUrl(imgMatch[1]) : PRODUCT_PLACEHOLDER;

      // Extract Link
      const linkMatch = block.match(/href="(\/[^"]+dp\/[^"]+)"/i) || block.match(/href="(\/[^"]+)"/i);
      const link = linkMatch ? `https://www.amazon.in${linkMatch[1].split('?')[0]}` : "https://www.amazon.in";

      if (title && title.length > 3 && !seenLinks.has(link)) {
        seenLinks.add(link);
        products.push({
          id: `amz-bs-${products.length + 1}-${Date.now()}`,
          title: title,
          price: price,
          originalPrice: originalPrice,
          rating: `#${products.length + 1} Best Seller`,
          starRating: normalizeRating(ratingMatch ? ratingMatch[1] : ""),
          reviewCount: normalizeReviewCount(reviewMatch ? reviewMatch[1] : ""),
          discount: normalizeDiscount(discountMatch ? discountMatch[1] : ""),
          stockText: normalizeStockText(stockMatch ? stockMatch[0] : ""),
          store: "amazon",
          image: image,
          link: link
        });
      }
    }
  }

  return products;
}

// Scrape Flipkart Popularity Sorted Results
async function scrapeFlipkartLive(categoryName) {
  const flipkartQuery = getCategoryConfig(categoryName).flipkartQuery;
  const products = [];
  const seenLinks = new Set();

  for (let page = 1; page <= FLIPKART_MAX_PAGES && products.length < PRODUCTS_PER_STORE; page++) {
    const url = `https://www.flipkart.com/search?q=${encodeURIComponent(flipkartQuery)}&sort=popularity&page=${page}`;
    const html = await fetchPageHTML(url);
    if (!html) break;

    const dataIdBlocks = html.split(/<div data-id="/i).slice(1);
    const productBlocks = dataIdBlocks.map((block) => `<div data-id="${block}`);

    if (!productBlocks.length) {
      const productLinkRegex = /href="(\/[^"]*(?:\/p\/itm|pid=)[^"]*)"/gi;
      let linkMatch;

      while ((linkMatch = productLinkRegex.exec(html)) && productBlocks.length < PRODUCTS_PER_STORE) {
        const blockStart = Math.max(0, linkMatch.index - 500);
        const blockEnd = Math.min(html.length, linkMatch.index + 5000);
        productBlocks.push(html.slice(blockStart, blockEnd));
      }
    }

    if (!productBlocks.length) break;

    for (const block of productBlocks) {
      if (products.length >= PRODUCTS_PER_STORE) break;

      const linkMatch = block.match(/href="(\/[^"]*(?:\/p\/itm|pid=)[^"]*)"/i);
      if (!linkMatch) continue;

      const relativeLink = cleanUrl(linkMatch[1]).replace(/&amp;/g, "&");
      const canonicalLink = relativeLink.split("&iid=")[0];
      if (seenLinks.has(canonicalLink)) continue;
      seenLinks.add(canonicalLink);

      const titleMatch = block.match(/alt="([^"]+)"/i) ||
        block.match(/class="RG5Slk"[^>]*>([^<]+)<\/div>/i) ||
        block.match(/class="[^"]*(?:_4rR01T|KzDlHZ|wjcEIp|s1Q9rs|IRpwTa|WKTcLC|RG5Slk)[^"]*"[^>]*>([\s\S]*?)<\/a>/i) ||
        block.match(/class="[^"]*(?:_4rR01T|KzDlHZ|wjcEIp|s1Q9rs|IRpwTa|WKTcLC|RG5Slk)[^"]*"[^>]*>([\s\S]*?)<\/div>/i) ||
        block.match(/title="([^"]+)"/i);
      const priceMatch = block.match(/class="[^"]*(?:_30jeq3|Nx9bqj|Nx9bgU|_1_WHN1|hZ3P6w)[^"]*"[^>]*>\s*₹?([^<]+)</i);
      const imageMatch = block.match(/(?:src|data-src)="(https:\/\/rukminim\d*\.flixcart\.com\/image\/[^"]+)"/i) ||
        block.match(/srcset="(https:\/\/rukminim\d*\.flixcart\.com\/image\/[^"\s,]+)/i) ||
        block.match(/"(https:\/\/rukminim\d*\.flixcart\.com\/image\/[^"]+)"/i);

      const title = titleMatch ? cleanText(titleMatch[1]) : null;
      const priceValue = priceMatch ? cleanText(priceMatch[1]) : "";
      const price = priceValue ? (priceValue.includes("₹") ? priceValue : `₹${priceValue}`) : "Check Site";
      const originalPriceMatch = block.match(/class="[^"]*(?:_3I9_wc|yRaY8j|kRYCnD)[^"]*"[^>]*>\s*₹?([^<]+)/i) ||
        block.match(/<span[^>]*>\s*₹\s*<!-- -->\s*([\d,]+)\s*<\/span>/i);
      const originalPrice = originalPriceMatch ? normalizePrice(originalPriceMatch[1]) : "N/A";
      const image = imageMatch ? cleanUrl(imageMatch[1]) : PRODUCT_PLACEHOLDER;
      const ratingMatch = block.match(/class="[^"]*(?:MKiFS6|_3LWZlK|XQDdHH)[^"]*"[^>]*>\s*([\d.]+)/i);
      const reviewMatch = block.match(/([\d,]+)\s*Ratings?(?:\s*&amp;|\s*&)?\s*([\d,]+)?\s*Reviews?/i) ||
        block.match(/([\d,]+)\s*Reviews?/i);
      const discountMatch = block.match(/(\d+% off)/i);
      const stockMatch = block.match(/only\s+\d+\s+left[^<]*/i) || block.match(/limited\s+stock[^<]*/i);

      if (title && title.length > 5) {
        products.push({
          id: `fk-${products.length + 1}-${Date.now()}`,
          title: title,
          price: price,
          originalPrice: originalPrice,
          rating: `#${products.length + 1} Popular`,
          starRating: normalizeRating(ratingMatch ? ratingMatch[1] : ""),
          reviewCount: normalizeReviewCount(reviewMatch ? (reviewMatch[2] || reviewMatch[1]) : ""),
          discount: normalizeDiscount(discountMatch ? discountMatch[1] : ""),
          stockText: normalizeStockText(stockMatch ? stockMatch[0] : ""),
          store: "flipkart",
          image: image,
          link: `https://www.flipkart.com${relativeLink}`
        });
      }
    }
  }

  return products;
}

function toBase36Id(value) {
  const numericValue = Number(value);
  return Number.isFinite(numericValue) && numericValue > 0 ? numericValue.toString(36) : "";
}

// Scrape Meesho search results through the same product API used by meesho.com/search.
async function scrapeMeeshoLive(categoryName) {
  const meeshoQuery = getCategoryConfig(categoryName).meeshoQuery;
  const products = [];
  let cursor = null;
  let searchSessionId = null;
  let page = 1;

  while (products.length < PRODUCTS_PER_STORE) {
    const data = await fetchJSON(MEESHO_SEARCH_URL, {
      query: meeshoQuery,
      type: "text_search",
      page: page,
      offset: products.length,
      limit: MEESHO_PAGE_SIZE,
      sort_option: null,
      selected_filters: [],
      selectedFilterIds: [],
      cursor: cursor,
      ...(searchSessionId ? { search_session_id: searchSessionId } : {})
    });

    const catalogs = data && Array.isArray(data.catalogs) ? data.catalogs : [];
    if (!catalogs.length) break;

    cursor = data.cursor || null;
    searchSessionId = data.search_session_id || searchSessionId;

    for (const catalog of catalogs) {
      if (products.length >= PRODUCTS_PER_STORE) break;

      const imageData = Array.isArray(catalog.product_images) ? catalog.product_images[0] : null;
      const productId = toBase36Id(catalog.hero_pid || (imageData && imageData.id) || catalog.id);
      const title = cleanText(catalog.hero_product_name || catalog.name);
      const priceValue = catalog.min_product_price || catalog.min_catalog_price || catalog.original_price;
      const originalPriceValue = catalog.original_price || catalog.mrp || catalog.max_product_price;
      const ratingSummary = catalog.catalog_reviews_summary || {};
      const ratingValue = ratingSummary.average_rating_str || ratingSummary.average_rating;
      const ratingCount = ratingSummary.rating_count || ratingSummary.review_count;
      const slug = catalog.slug || title.toLowerCase().replace(/[^\w\s-]/g, "").replace(/\s+/g, "-");
      const discountValue = catalog.discount_text ||
        (catalog.max_product_discount ? `${catalog.max_product_discount}% off` : "") ||
        (catalog.total_discount_in_rs ? `₹${catalog.total_discount_in_rs} off` : "");
      const stockValue = catalog.available_quantity ? `Only ${catalog.available_quantity} left` : "";

      if (!title || !productId) continue;

      products.push({
        id: `meesho-${products.length + 1}-${Date.now()}`,
        title: title,
        price: priceValue ? `₹${priceValue}` : "Check Site",
        originalPrice: originalPriceValue ? `₹${originalPriceValue}` : "N/A",
        rating: ratingValue ? `${ratingValue}★${ratingCount ? ` (${ratingCount})` : ""}` : `#${products.length + 1} Popular`,
        starRating: ratingValue ? `${ratingValue}★` : "N/A",
        reviewCount: ratingCount ? String(ratingCount) : "N/A",
        discount: normalizeDiscount(discountValue),
        stockText: normalizeStockText(stockValue),
        store: "meesho",
        image: imageData && imageData.url ? cleanUrl(imageData.url) : PRODUCT_PLACEHOLDER,
        link: `https://www.meesho.com/${slug}/p/${productId}`
      });
    }

    if (!cursor || catalogs.length < MEESHO_PAGE_SIZE) break;
    page++;
  }

  return products;
}

function normalizeAjioImage(value) {
  const imageUrl = typeof value === "string" ? value : (
    value && (value.url || value.imageUrl || value.img || value.src)
  );
  if (!imageUrl) return "";

  const cleaned = cleanUrl(imageUrl);
  if (cleaned.startsWith("//")) return `https:${cleaned}`;
  if (cleaned.startsWith("/")) return `https://assets.ajio.com${cleaned}`;
  return cleaned;
}

function getAjioImage(product) {
  const imageFields = [
    product.images,
    product.galleryImages,
    product.productImages,
    product.image,
    product.imageUrl,
    product.thumbnail,
    product.thumbnailUrl
  ];

  for (const value of imageFields) {
    if (Array.isArray(value)) {
      const preferredImage = value.find((item) => item && /product|main|primary/i.test(item.format || item.imageType || "")) ||
        value[0];
      const image = normalizeAjioImage(preferredImage);
      if (image) return image;
    } else {
      const image = normalizeAjioImage(value);
      if (image) return image;
    }
  }

  return PRODUCT_PLACEHOLDER;
}

function getAjioPrice(product, fieldNames) {
  for (const fieldName of fieldNames) {
    const value = product[fieldName];
    if (!value) continue;

    if (typeof value === "object") {
      const formattedValue = value.formattedValue || value.displayValue || value.value;
      if (formattedValue) return normalizePrice(formattedValue);
    } else {
      return normalizePrice(value);
    }
  }

  return "N/A";
}

function getAjioLink(product) {
  const rawUrl = cleanUrl(product.url || product.productUrl || product.link || product.urlPath || "");
  if (!rawUrl) return "https://www.ajio.com";
  if (rawUrl.startsWith("http")) return rawUrl;
  return `https://www.ajio.com${rawUrl.startsWith("/") ? rawUrl : `/${rawUrl}`}`;
}

function getAjioProductsFromData(data) {
  if (!data || typeof data !== "object") return [];
  if (Array.isArray(data.products)) return data.products;
  if (Array.isArray(data.results)) return data.results;
  if (data.searchResult && Array.isArray(data.searchResult.products)) return data.searchResult.products;
  if (data.plpData && Array.isArray(data.plpData.products)) return data.plpData.products;
  return [];
}

function normalizeAjioRating(product) {
  return product.averageRating || product.avgRating || product.rating || product.ratingValue ||
    product.ratingsAverage || product.overallRating;
}

function normalizeAjioReviewCount(product) {
  return product.reviewCount || product.reviewsCount || product.noOfReviews || product.numberOfReviews ||
    product.ratingCount || product.ratingsCount || product.noOfRatings;
}

function normalizeAjioStock(product) {
  const stockValue = product.stock || product.stockLevel || product.availableQuantity || product.available_quantity;
  const stockStatus = product.stockStatus || product.stockLevelStatus || product.availability || "";
  if (Number(stockValue) > 0 && Number(stockValue) <= 5) return `Only ${stockValue} left`;
  if (/out\s*of\s*stock/i.test(stockStatus)) return "Out of stock";
  if (/low|limited/i.test(stockStatus)) return "Limited stock";
  return "Check site";
}

function normalizeAjioDiscount(value) {
  const text = cleanText(value);
  if (!text) return "N/A";
  return normalizeDiscount(/^\d+$/.test(text) ? `${text}% off` : text);
}

// Scrape Ajio search results through the same API/page data used by ajio.com/search.
async function scrapeAjioLive(categoryName) {
  const ajioQuery = getCategoryConfig(categoryName).ajioQuery;
  const products = [];
  const seenLinks = new Set();

  for (let page = 0; page < AJIO_MAX_PAGES && products.length < PRODUCTS_PER_STORE; page++) {
    const params = new URLSearchParams({
      fields: "FULL",
      currentPage: String(page),
      pageSize: String(AJIO_PAGE_SIZE),
      format: "json",
      query: `${ajioQuery}:relevance`,
      sortBy: "relevance",
      gridColumns: "3",
      facets: "",
      advfilter: "true",
      platform: "Desktop"
    });
    const data = await fetchJSONGet(`${AJIO_SEARCH_URL}?${params.toString()}`);
    const apiProducts = getAjioProductsFromData(data);

    if (!apiProducts.length) {
      if (page === 0) {
        const fallbackProducts = await scrapeAjioHtmlFallback(ajioQuery, seenLinks);
        products.push(...fallbackProducts.slice(0, PRODUCTS_PER_STORE));
      }
      break;
    }

    for (const product of apiProducts) {
      if (products.length >= PRODUCTS_PER_STORE) break;

      const title = cleanText(product.name || product.productName || product.displayName || product.title);
      const link = getAjioLink(product);
      if (!title || seenLinks.has(link)) continue;
      seenLinks.add(link);

      const ratingValue = normalizeAjioRating(product);
      const reviewCount = normalizeAjioReviewCount(product);
      const discountValue = product.discountPercent || product.discountPercentage || product.discount ||
        product.offerPriceDiscount || product.priceDiscount || "";
      const price = getAjioPrice(product, ["price", "salePrice", "sellingPrice", "discountedPrice", "offerPrice"]);
      const originalPrice = getAjioPrice(product, ["wasPriceData", "wasPrice", "mrp", "originalPrice", "listPrice"]);

      products.push({
        id: `ajio-${products.length + 1}-${Date.now()}`,
        title: title,
        price: price === "N/A" ? "Check Site" : price,
        originalPrice: originalPrice,
        rating: ratingValue ? `${ratingValue}★${reviewCount ? ` (${reviewCount})` : ""}` : `#${products.length + 1} Popular`,
        starRating: ratingValue ? normalizeRating(ratingValue) : "N/A",
        reviewCount: reviewCount ? String(reviewCount) : "N/A",
        discount: normalizeAjioDiscount(discountValue),
        stockText: normalizeAjioStock(product),
        store: "ajio",
        image: getAjioImage(product),
        link: link
      });
    }

    if (apiProducts.length < AJIO_PAGE_SIZE) break;
  }

  return products;
}

async function scrapeAjioHtmlFallback(ajioQuery, seenLinks) {
  const products = [];
  const html = await fetchPageHTML(`https://www.ajio.com/search/?text=${encodeURIComponent(ajioQuery)}`);
  if (!html) return products;

  const linkRegex = /href="(\/[^"]*\/p\/[^"]*)"/gi;
  let linkMatch;

  while ((linkMatch = linkRegex.exec(html)) && products.length < PRODUCTS_PER_STORE) {
    const blockStart = Math.max(0, linkMatch.index - 1500);
    const blockEnd = Math.min(html.length, linkMatch.index + 3500);
    const block = html.slice(blockStart, blockEnd);
    const link = `https://www.ajio.com${cleanUrl(linkMatch[1]).split("?")[0]}`;
    if (seenLinks.has(link)) continue;
    seenLinks.add(link);

    const titleMatch = block.match(/alt="([^"]+)"/i) ||
      block.match(/class="[^"]*(?:nameCls|name|product-title)[^"]*"[^>]*>([\s\S]*?)<\/(?:div|span|a)>/i) ||
      block.match(/title="([^"]+)"/i);
    const priceMatch = block.match(/class="[^"]*(?:price|offer-pric|selling-price)[^"]*"[^>]*>\s*(₹?[^<]+)/i) ||
      block.match(/₹\s*([\d,]+)/i);
    const originalPriceMatch = block.match(/class="[^"]*(?:orginal-price|original-price|was-price|strike)[^"]*"[^>]*>\s*(₹?[^<]+)/i);
    const imageMatch = block.match(/(?:src|data-src)="([^"]*assets\.ajio\.com[^"]+)"/i) ||
      block.match(/srcset="([^"]*assets\.ajio\.com[^"\s,]+)/i);
    const discountMatch = block.match(/(\d+% off)/i);
    const ratingMatch = block.match(/(\d+(?:\.\d+)?)\s*★/i) || block.match(/rating[^>]*>\s*([\d.]+)/i);
    const reviewMatch = block.match(/([\d,]+)\s*(?:ratings?|reviews?)/i);
    const title = titleMatch ? cleanText(titleMatch[1]) : null;

    if (!title || title.length < 4) continue;

    products.push({
      id: `ajio-html-${products.length + 1}-${Date.now()}`,
      title: title,
      price: priceMatch ? normalizePrice(priceMatch[1]) : "Check Site",
      originalPrice: originalPriceMatch ? normalizePrice(originalPriceMatch[1]) : "N/A",
      rating: `#${products.length + 1} Popular`,
      starRating: normalizeRating(ratingMatch ? ratingMatch[1] : ""),
      reviewCount: normalizeReviewCount(reviewMatch ? reviewMatch[1] : ""),
      discount: normalizeDiscount(discountMatch ? discountMatch[1] : ""),
      stockText: "Check site",
      store: "ajio",
      image: imageMatch ? normalizeAjioImage(imageMatch[1]) : PRODUCT_PLACEHOLDER,
      link: link
    });
  }

  return products;
}

// ═══════════════════════════════════════════════════════════════════
// COMBINED FETCH WITH CACHE
// ═══════════════════════════════════════════════════════════════════

async function fetchTrendingProducts(category, forceRefresh = false) {
  // Check cache first (unless forced refresh)
  if (!forceRefresh) {
    const cached = await getCachedData(category);
    if (cached && cached.length > 0) {
      return { status: "success", data: cached, count: cached.length, fromCache: true };
    }
  }

  // Live scrape
  try {
    const [amazonProducts, flipkartProducts, meeshoProducts, ajioProducts] = await Promise.all([
      scrapeAmazonBestSellers(category),
      scrapeFlipkartLive(category),
      scrapeMeeshoLive(category),
      scrapeAjioLive(category)
    ]);

    // Interleave results
    const combined = [];
    const maxLength = Math.max(
      amazonProducts.length,
      flipkartProducts.length,
      meeshoProducts.length,
      ajioProducts.length
    );
    for (let i = 0; i < maxLength; i++) {
      if (amazonProducts[i]) combined.push(amazonProducts[i]);
      if (flipkartProducts[i]) combined.push(flipkartProducts[i]);
      if (meeshoProducts[i]) combined.push(meeshoProducts[i]);
      if (ajioProducts[i]) combined.push(ajioProducts[i]);
    }

    // Save to cache + push to DB (DB first, UI reads from DB)
    if (combined.length > 0) {
      await setCachedData(category, combined);
      await postToBackend(combined, category);
    }

    return { status: "success", data: combined, count: combined.length, fromCache: false };
  } catch (err) {
    console.error("Live Scraping Error:", err);
    // Fallback: return expired cache if available
    const staleCache = await getCachedData(category);
    if (staleCache) {
      return { status: "success", data: staleCache, count: staleCache.length, fromCache: true };
    }
    return { status: "error", message: err.toString() };
  }
}

// ═══════════════════════════════════════════════════════════════════
// 20-MINUTE AUTO-REFRESH ALARM
// ═══════════════════════════════════════════════════════════════════

const ALARM_NAME = "trending_refresh";

// MV3 service workers sleep + old alarms persist across code updates,
// so (re)create the 1-min alarm on EVERY worker start, not just install.
chrome.alarms.create(ALARM_NAME, { delayInMinutes: 0.1, periodInMinutes: 1 });

// Set up 1-minute alarm on extension install/startup (backup paths)
chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.set({ lastAlarmStartedAt: 0, alarmRunning: false });
  chrome.alarms.create(ALARM_NAME, { delayInMinutes: 0.1, periodInMinutes: 1 });
  console.log("TrendingPulse: 1-minute auto-fire alarm created.");
});

chrome.runtime.onStartup.addListener(() => {
  chrome.storage.local.set({ lastAlarmStartedAt: 0, alarmRunning: false });
  chrome.alarms.create(ALARM_NAME, { delayInMinutes: 0.1, periodInMinutes: 1 });
  console.log("TrendingPulse: 1-minute auto-fire alarm restored on startup.");
});

// When alarm fires: same button-click process, next category each tick
// (round-robin — automatically fetches every category in background!)
chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === ALARM_NAME) {
    const keys = Object.keys(CATEGORY_CONFIG);
    const stored = await chrome.storage.local.get(["catIndex", "lastAlarmStartedAt"]);
    const now = Date.now();

    // Stale lock guard: if previous cycle was within last 80 seconds, wait for it
    if (stored.lastAlarmStartedAt && now - stored.lastAlarmStartedAt < 80 * 1000) {
      console.log("TrendingPulse: previous cycle still active, skipping tick.");
      return;
    }

    const idx = (stored.catIndex || 0) % keys.length;
    const category = keys[idx];
    await chrome.storage.local.set({ lastAlarmStartedAt: now });

    try {
      console.log(`TrendingPulse: auto-fire [${idx + 1}/${keys.length}] "${category}"`);
      const response = await fetchTrendingProducts(category, true);
      console.log(`TrendingPulse: auto-fire done — ${response.count} products updated.`);
      await chrome.storage.local.set({ catIndex: idx + 1, lastCategory: category, lastAlarmStartedAt: 0 });
    } catch (err) {
      console.error("Auto-fire error:", err);
      await chrome.storage.local.set({ lastAlarmStartedAt: 0 });
    }
  }
});

// ═══════════════════════════════════════════════════════════════════
// MESSAGE LISTENER (popup.js communication)
// ═══════════════════════════════════════════════════════════════════

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "getTrendingProducts") {
    const category = request.category || "electronics";
    const forceRefresh = request.forceRefresh || false;

    // Save last used category for auto-refresh
    chrome.storage.local.set({ lastCategory: category });

    fetchTrendingProducts(category, forceRefresh).then(sendResponse);
    return true; // Keep message channel open for async response
  }

  if (request.action === "getAllCategories") {
    // Send category list to popup for dynamic dropdown
    const categories = Object.keys(CATEGORY_CONFIG);
    sendResponse({ categories: categories });
    return false;
  }

  if (request.action === "getCacheInfo") {
    const category = request.category || "electronics";
    const key = `cache_${CACHE_VERSION}_${normalizeCategory(category)}`;
    chrome.storage.local.get(key).then((result) => {
      if (result[key]) {
        const age = Date.now() - result[key].timestamp;
        const minutesAgo = Math.round(age / 60000);
        sendResponse({ cached: true, minutesAgo: minutesAgo, count: result[key].data.length });
      } else {
        sendResponse({ cached: false });
      }
    });
    return true;
  }
});
