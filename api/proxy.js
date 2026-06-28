// /api/proxy.js
export default async function handler(req, res) {
  const { url } = req.query;

  if (!url) {
    return res.status(400).json({ error: 'Missing target URL' });
  }

  try {
    const response = await fetch(decodeURIComponent(url), {
      method: req.method,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; SitemapScanner/1.0)',
      },
    });

    const data = await response.text();
    
    // Set headers to allow your own domain only (Security)
    res.setHeader('Access-Control-Allow-Origin', '*'); 
    res.status(response.status).send(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
