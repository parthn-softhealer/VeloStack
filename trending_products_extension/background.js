// background.js - Live Scraper with ALL Categories + 20-Minute Auto-Refresh Cache

// ═══════════════════════════════════════════════════════════════════
// ALL PRODUCT CATEGORIES - Amazon Best Sellers Departments & Flipkart
// ═══════════════════════════════════════════════════════════════════
const CATEGORY_CONFIG = {
  "electronics": {
    amazonUrl: "https://www.amazon.in/gp/bestsellers/electronics",
    flipkartQuery: "electronics"
  },
  "computers": {
    amazonUrl: "https://www.amazon.in/gp/bestsellers/computers",
    flipkartQuery: "computers laptops"
  },
  "fashion": {
    amazonUrl: "https://www.amazon.in/gp/bestsellers/apparel",
    flipkartQuery: "fashion clothing"
  },
  "shoes": {
    amazonUrl: "https://www.amazon.in/gp/bestsellers/shoes",
    flipkartQuery: "shoes footwear"
  },
  "watches": {
    amazonUrl: "https://www.amazon.in/gp/bestsellers/watches",
    flipkartQuery: "watches"
  },
  "jewellery": {
    amazonUrl: "https://www.amazon.in/gp/bestsellers/jewelry",
    flipkartQuery: "jewellery"
  },
  "bags luggage": {
    amazonUrl: "https://www.amazon.in/gp/bestsellers/luggage",
    flipkartQuery: "bags luggage"
  },
  "home kitchen": {
    amazonUrl: "https://www.amazon.in/gp/bestsellers/kitchen",
    flipkartQuery: "home kitchen"
  },
  "home improvement": {
    amazonUrl: "https://www.amazon.in/gp/bestsellers/home-improvement",
    flipkartQuery: "home improvement"
  },
  "furniture": {
    amazonUrl: "https://www.amazon.in/gp/bestsellers/furniture",
    flipkartQuery: "furniture"
  },
  "beauty": {
    amazonUrl: "https://www.amazon.in/gp/bestsellers/beauty",
    flipkartQuery: "beauty"
  },
  "health personal care": {
    amazonUrl: "https://www.amazon.in/gp/bestsellers/hpc",
    flipkartQuery: "health personal care"
  },
  "sports fitness": {
    amazonUrl: "https://www.amazon.in/gp/bestsellers/sports",
    flipkartQuery: "sports fitness"
  },
  "books": {
    amazonUrl: "https://www.amazon.in/gp/bestsellers/books",
    flipkartQuery: "books"
  },
  "stationery office": {
    amazonUrl: "https://www.amazon.in/gp/bestsellers/office",
    flipkartQuery: "stationery office supplies"
  },
  "baby": {
    amazonUrl: "https://www.amazon.in/gp/bestsellers/baby",
    flipkartQuery: "baby products"
  },
  "toys games": {
    amazonUrl: "https://www.amazon.in/gp/bestsellers/toys",
    flipkartQuery: "toys games"
  },
  "grocery": {
    amazonUrl: "https://www.amazon.in/gp/bestsellers/grocery",
    flipkartQuery: "grocery"
  },
  "automotive": {
    amazonUrl: "https://www.amazon.in/gp/bestsellers/automotive",
    flipkartQuery: "automotive accessories"
  },
  "garden outdoor": {
    amazonUrl: "https://www.amazon.in/gp/bestsellers/lawn-garden",
    flipkartQuery: "garden outdoor"
  },
  "pet supplies": {
    amazonUrl: "https://www.amazon.in/gp/bestsellers/pet-supplies",
    flipkartQuery: "pet supplies"
  },
  "gaming": {
    amazonUrl: "https://www.amazon.in/gp/bestsellers/videogames",
    flipkartQuery: "gaming"
  },
  "musical instruments": {
    amazonUrl: "https://www.amazon.in/gp/bestsellers/musical-instruments",
    flipkartQuery: "musical instruments"
  }
};

const PRODUCT_PLACEHOLDER = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='65' height='65' viewBox='0 0 65 65'%3E%3Crect width='65' height='65' rx='8' fill='%23e5e7eb'/%3E%3Cpath d='M19 43h27l-8-10-6 7-4-5-9 8z' fill='%239ca3af'/%3E%3Ccircle cx='25' cy='24' r='5' fill='%239ca3af'/%3E%3C/svg%3E";

// Cache duration: 20 minutes in milliseconds
const CACHE_DURATION_MS = 20 * 60 * 1000;

// ═══════════════════════════════════════════════════════════════════
// UTILITY FUNCTIONS (unchanged from your code)
// ═══════════════════════════════════════════════════════════════════

function normalizeCategory(categoryName) {
  return String(categoryName || "smartphones")
    .toLowerCase()
    .replace(/&/g, " ")
    .replace(/[^\w\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function getCategoryConfig(categoryName) {
  const key = normalizeCategory(categoryName);
  return CATEGORY_CONFIG[key] || {
    amazonUrl: CATEGORY_CONFIG.smartphones.amazonUrl,
    flipkartQuery: key || "smartphones"
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

// ═══════════════════════════════════════════════════════════════════
// CACHE SYSTEM - Store scraped data in chrome.storage.local
// ═══════════════════════════════════════════════════════════════════

async function getCachedData(category) {
  const key = `cache_${normalizeCategory(category)}`;
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
  const key = `cache_${normalizeCategory(category)}`;
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
// SCRAPERS (unchanged from your working code)
// ═══════════════════════════════════════════════════════════════════

// Scrape Official Amazon Best Sellers Page
async function scrapeAmazonBestSellers(categoryName) {
  const url = getCategoryConfig(categoryName).amazonUrl;
  const html = await fetchPageHTML(url);
  if (!html) return [];

  const products = [];

  // Parse Best Seller Card blocks in /gp/bestsellers/
  const items = [...html.matchAll(/id="gridItemRoot"[\s\S]*?<\/div>\s*<\/div>\s*<\/div>/gi)];

  let rank = 1;
  for (const match of items) {
    if (rank > 5) break;
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

    if (title && title.length > 3) {
      products.push({
        id: `amz-bs-${rank}-${Date.now()}`,
        title: title,
        price: price,
        rating: `#${rank} Best Seller`,
        store: "amazon",
        image: image,
        link: link
      });
      rank++;
    }
  }

  return products;
}

// Scrape Flipkart Popularity Sorted Results
async function scrapeFlipkartLive(categoryName) {
  const flipkartQuery = getCategoryConfig(categoryName).flipkartQuery;
  const url = `https://www.flipkart.com/search?q=${encodeURIComponent(flipkartQuery)}&sort=popularity`;
  const html = await fetchPageHTML(url);
  if (!html) return [];

  const products = [];
  const seenLinks = new Set();
  const dataIdBlocks = html.split(/<div data-id="/i).slice(1);
  const productBlocks = dataIdBlocks.map((block) => `<div data-id="${block}`);

  if (!productBlocks.length) {
    const productLinkRegex = /href="(\/[^"]*(?:\/p\/itm|pid=)[^"]*)"/gi;
    let linkMatch;

    while ((linkMatch = productLinkRegex.exec(html)) && productBlocks.length < 12) {
      const blockStart = Math.max(0, linkMatch.index - 500);
      const blockEnd = Math.min(html.length, linkMatch.index + 5000);
      productBlocks.push(html.slice(blockStart, blockEnd));
    }
  }

  for (const block of productBlocks) {
    if (products.length >= 5) break;

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
    const image = imageMatch ? cleanUrl(imageMatch[1]) : PRODUCT_PLACEHOLDER;

    if (title && title.length > 5) {
      products.push({
        id: `fk-${products.length + 1}-${Date.now()}`,
        title: title,
        price: price,
        rating: `#${products.length + 1} Popular`,
        store: "flipkart",
        image: image,
        link: `https://www.flipkart.com${relativeLink}`
      });
    }
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
    const [amazonProducts, flipkartProducts] = await Promise.all([
      scrapeAmazonBestSellers(category),
      scrapeFlipkartLive(category)
    ]);

    // Interleave results
    const combined = [];
    const maxLength = Math.max(amazonProducts.length, flipkartProducts.length);
    for (let i = 0; i < maxLength; i++) {
      if (amazonProducts[i]) combined.push(amazonProducts[i]);
      if (flipkartProducts[i]) combined.push(flipkartProducts[i]);
    }

    // Save to cache
    if (combined.length > 0) {
      await setCachedData(category, combined);
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

// Set up 20-minute alarm on extension install/startup
chrome.runtime.onInstalled.addListener(() => {
  chrome.alarms.create(ALARM_NAME, { periodInMinutes: 20 });
  console.log("TrendingPulse: 20-minute auto-refresh alarm created.");
});

chrome.runtime.onStartup.addListener(() => {
  chrome.alarms.create(ALARM_NAME, { periodInMinutes: 20 });
  console.log("TrendingPulse: 20-minute auto-refresh alarm restored on startup.");
});

// When alarm fires, refresh the last-used category (or default)
chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === ALARM_NAME) {
    console.log("TrendingPulse: Auto-refresh triggered at", new Date().toLocaleTimeString());

    // Get the last category the user was looking at
    const result = await chrome.storage.local.get("lastCategory");
    const category = result.lastCategory || "smartphones";

    // Force refresh (bypass cache)
    const response = await fetchTrendingProducts(category, true);
    console.log(`TrendingPulse: Auto-refresh done for "${category}" — ${response.count} products updated.`);
  }
});

// ═══════════════════════════════════════════════════════════════════
// MESSAGE LISTENER (popup.js communication)
// ═══════════════════════════════════════════════════════════════════

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "getTrendingProducts") {
    const category = request.category || "smartphones";
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
    const category = request.category || "smartphones";
    const key = `cache_${normalizeCategory(category)}`;
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
