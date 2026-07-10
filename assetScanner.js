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
 * Validates the assets found. 
 * Note: Uses the existing proxyFetch from script.js
 */
async function validateAssets(assets) {
    const results = [];
    for (const asset of assets) {
        try {
            // Using HEAD request is faster for asset validation
            const res = await fetch(MY_PROXY_URL + encodeURIComponent(asset.url), { method: 'HEAD' });
            results.push({ ...asset, status: res.status });
        } catch (err) {
            results.push({ ...asset, status: 'ERR' });
        }
    }
    return results;
}
