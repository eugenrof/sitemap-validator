// --- assetScanner.js: Dedicated Deep-Link & Asset Validation ---

/**
 * Parses the HTML content and identifies internal assets (img, links, scripts)
 */
function extractAssetsFromPage(htmlText, baseUrl) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlText, 'text/html');
    const assets = [];

    // Helper to resolve relative URLs to absolute
    const resolveUrl = (url) => {
        try { return new URL(url, baseUrl).href; } catch { return url; }
    };

    doc.querySelectorAll('img[src]').forEach(img => assets.push({ type: 'Image', url: resolveUrl(img.src) }));
    doc.querySelectorAll('a[href]').forEach(a => assets.push({ type: 'Link', url: resolveUrl(a.href) }));
    doc.querySelectorAll('script[src]').forEach(s => assets.push({ type: 'Script', url: resolveUrl(s.src) }));
    
    return assets;
}

/**
 * Validates the assets found and updates the corresponding UI row
 * @param {Array} assets - List of assets extracted
 * @param {HTMLElement} row - The table row element to update
 */
async function validateAndDisplayAssets(assets, row) {
    const results = [];
    
    // We limit validation to the first 20 assets to prevent proxy/timeout issues
    const subset = assets.slice(0, 20); 

    for (const asset of subset) {
        try {
            // Using HEAD request is faster for asset validation
            const res = await fetch(MY_PROXY_URL + encodeURIComponent(asset.url), { method: 'HEAD' });
            results.push({ ...asset, status: res.status });
        } catch (err) {
            results.push({ ...asset, status: 0 }); // 0 indicates network/fetch failure
        }
    }

    // Attach results to the row as a data attribute for the PDF generator
    row.setAttribute('data-assets', JSON.stringify(results));
    
    // Optional: Log to console for debugging
    console.log(`Validated ${results.length} assets for ${row.cells[0].innerText.trim()}`);
    
    return results;
}
