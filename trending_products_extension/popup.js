// popup.js - Live Dynamic E-Commerce UI Controller

document.addEventListener("DOMContentLoaded", () => {
  const categorySelect = document.getElementById("categorySelect");
  const fetchBtn = document.getElementById("fetchBtn");
  const productsGrid = document.getElementById("productsGrid");
  const emptyState = document.getElementById("emptyState");
  const statusBar = document.getElementById("statusBar");
  const statusText = document.getElementById("statusText");
  const tabButtons = document.querySelectorAll(".tab-btn");

  let currentStoreFilter = "all";
  let loadedProducts = [];
  const productPlaceholder = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='65' height='65' viewBox='0 0 65 65'%3E%3Crect width='65' height='65' rx='8' fill='%23e5e7eb'/%3E%3Cpath d='M19 43h27l-8-10-6 7-4-5-9 8z' fill='%239ca3af'/%3E%3Ccircle cx='25' cy='24' r='5' fill='%239ca3af'/%3E%3C/svg%3E";

  function getSelectedCategory() {
    return categorySelect.value.trim();
  }

  // Tab Filtering Logic
  tabButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      tabButtons.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      currentStoreFilter = btn.dataset.store;
      renderProducts(loadedProducts);
    });
  });

  // Fetch Button Click
  fetchBtn.addEventListener("click", () => {
    loadLiveCategoryData(getSelectedCategory());
  });

  // Category Dropdown Change Trigger
  categorySelect.addEventListener("change", () => {
    loadLiveCategoryData(getSelectedCategory());
  });

  // Fetch Live Data from Service Worker
  function loadLiveCategoryData(categoryQuery) {
    showLoading(true, `Scraping live trending ${categoryQuery} from Amazon & Flipkart...`);

    chrome.runtime.sendMessage(
      { action: "getTrendingProducts", category: categoryQuery },
      (response) => {
        showLoading(false);
        if (response && response.status === "success" && response.data && response.data.length > 0) {
          loadedProducts = response.data;
          renderProducts(loadedProducts);
          showStatus(`Fetched ${response.data.length} live trending products!`);
          setTimeout(() => statusBar.classList.add("hidden"), 3000);
        } else {
          showStatus("No live items found. Check internet connection or site layout.", true);
          emptyState.classList.remove("hidden");
          emptyState.querySelector("p").innerText = "Could not fetch live products. Click 'Find Trending Products' to retry.";
        }
      }
    );
  }

  // Render Product Cards to DOM
  function renderProducts(products) {
    productsGrid.innerHTML = "";

    // Filter by Store
    const filtered = products.filter((p) => {
      if (currentStoreFilter === "all") return true;
      return p.store === currentStoreFilter;
    });

    if (!filtered || filtered.length === 0) {
      emptyState.classList.remove("hidden");
      emptyState.querySelector("p").innerText = `No live products found for: ${currentStoreFilter.toUpperCase()}`;
      return;
    }

    emptyState.classList.add("hidden");

    filtered.forEach((product) => {
      const card = document.createElement("a");
      card.className = "product-card";
      card.href = product.link;
      card.target = "_blank";
      card.rel = "noopener noreferrer";
      card.title = product.title;

      const storeClass = product.store === "amazon" ? "amazon" : "flipkart";
      const storeName = product.store === "amazon" ? "Amazon" : "Flipkart";

      const image = document.createElement("img");
      image.src = product.image || productPlaceholder;
      image.alt = product.title || storeName;
      image.className = "product-img";
      image.addEventListener("error", () => {
        image.src = productPlaceholder;
      }, { once: true });

      const details = document.createElement("div");
      details.className = "product-details";

      const title = document.createElement("div");
      title.className = "product-title";
      title.textContent = product.title;

      const meta = document.createElement("div");
      meta.className = "product-meta";

      const price = document.createElement("span");
      price.className = "product-price";
      price.textContent = product.price;

      const badges = document.createElement("div");
      badges.className = "product-badges";

      const rating = document.createElement("span");
      rating.className = "rating";
      rating.textContent = product.rating;

      const storeTag = document.createElement("span");
      storeTag.className = `store-tag ${storeClass}`;
      storeTag.textContent = storeName;

      badges.append(rating, storeTag);
      meta.append(price, badges);
      details.append(title, meta);
      card.append(image, details);

      productsGrid.appendChild(card);
    });
  }

  // Loading UI Helper
  function showLoading(isLoading, msg = "") {
    const btnText = fetchBtn.querySelector(".btn-text");
    const spinner = fetchBtn.querySelector(".spinner");

    if (isLoading) {
      btnText.innerText = "Scraping Live...";
      spinner.classList.remove("hidden");
      fetchBtn.disabled = true;
      showStatus(msg);
    } else {
      btnText.innerText = "Find Trending Products";
      spinner.classList.add("hidden");
      fetchBtn.disabled = false;
    }
  }

  function showStatus(msg, isError = false) {
    statusBar.classList.remove("hidden");
    statusText.innerText = msg;
    if (isError) {
      statusBar.style.borderColor = "rgba(239, 68, 68, 0.4)";
      statusBar.style.color = "#f87171";
    } else {
      statusBar.style.borderColor = "rgba(56, 189, 248, 0.3)";
      statusBar.style.color = "var(--accent-blue)";
    }
  }

  // Auto Load Initial Category Live
  loadLiveCategoryData(getSelectedCategory());
});
