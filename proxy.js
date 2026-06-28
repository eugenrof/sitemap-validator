// api/proxy.js
export default async function handler(req, res) {
  const { url } = req.query;
  try {
    const response = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
    });
    const data = await response.text();
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.status(200).send(data);
  } catch (err) {
    res.status(500).send(err.message);
  }
}
