import { useState } from "react";

export default function Pagination({
  currentPage = 1,
  totalItems = 0,
  pageSize = 25,
  onPageChange,
  onPageSizeChange,
}) {
  const [isCustomMode, setIsCustomMode] = useState(false);
  const [customInput, setCustomInput] = useState(String(pageSize));

  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const validCurrentPage = Math.min(Math.max(1, currentPage), totalPages);

  const startItem = totalItems === 0 ? 0 : (validCurrentPage - 1) * pageSize + 1;
  const endItem = Math.min(validCurrentPage * pageSize, totalItems);

  function handleSelectSize(e) {
    const val = e.target.value;
    if (val === "custom") {
      setIsCustomMode(true);
    } else {
      setIsCustomMode(false);
      const num = Number(val);
      if (num > 0) {
        onPageSizeChange(num);
        onPageChange(1);
      }
    }
  }

  function handleApplyCustom(e) {
    e.preventDefault();
    const parsed = parseInt(customInput, 10);
    if (!Number.isNaN(parsed) && parsed > 0) {
      const clamped = Math.min(Math.max(1, parsed), 500);
      onPageSizeChange(clamped);
      onPageChange(1);
      setCustomInput(String(clamped));
    }
  }

  // Generate pagination page numbers
  function getPageNumbers() {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    const pages = [1];
    const leftBound = Math.max(2, validCurrentPage - 1);
    const rightBound = Math.min(totalPages - 1, validCurrentPage + 1);

    if (leftBound > 2) {
      pages.push("...");
    }

    for (let i = leftBound; i <= rightBound; i++) {
      pages.push(i);
    }

    if (rightBound < totalPages - 1) {
      pages.push("...");
    }

    pages.push(totalPages);
    return pages;
  }

  return (
    <div className="pagination-bar">
      {/* Left: Item Range Info */}
      <div className="pagination-info">
        <span>
          Showing <strong>{startItem} - {endItem}</strong> of <strong>{totalItems}</strong> products
        </span>
      </div>

      {/* Center / Right: Page Size Selector & Controls */}
      <div className="pagination-controls">
        <div className="page-size-selector">
          <label htmlFor="page-size-select">Per page:</label>
          <select
            id="page-size-select"
            className="styled-select pagination-size-select"
            value={isCustomMode ? "custom" : pageSize}
            onChange={handleSelectSize}
          >
            <option value="10">10</option>
            <option value="25">25 (Default)</option>
            <option value="50">50</option>
            <option value="100">100</option>
            <option value="custom">Custom...</option>
          </select>

          {isCustomMode && (
            <form onSubmit={handleApplyCustom} className="custom-size-form">
              <input
                type="number"
                min="1"
                max="500"
                className="custom-size-input"
                value={customInput}
                onChange={(e) => setCustomInput(e.target.value)}
                placeholder="Qty"
                autoFocus
              />
              <button type="submit" className="custom-size-apply-btn" title="Apply limit">
                Apply
              </button>
            </form>
          )}
        </div>

        {/* Page navigation buttons */}
        <div className="page-nav-buttons">
          <button
            type="button"
            className="page-nav-btn prev-btn"
            disabled={validCurrentPage <= 1}
            onClick={() => onPageChange(validCurrentPage - 1)}
            aria-label="Previous page"
          >
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
            <span>Prev</span>
          </button>

          <div className="page-numbers-list">
            {getPageNumbers().map((p, idx) => {
              if (p === "...") {
                return (
                  <span key={`ellipsis-${idx}`} className="page-ellipsis">
                    …
                  </span>
                );
              }
              const isActive = p === validCurrentPage;
              return (
                <button
                  key={p}
                  type="button"
                  className={`page-num-btn ${isActive ? "active" : ""}`}
                  onClick={() => onPageChange(p)}
                  aria-current={isActive ? "page" : undefined}
                >
                  {p}
                </button>
              );
            })}
          </div>

          <button
            type="button"
            className="page-nav-btn next-btn"
            disabled={validCurrentPage >= totalPages}
            onClick={() => onPageChange(validCurrentPage + 1)}
            aria-label="Next page"
          >
            <span>Next</span>
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
