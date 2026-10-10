import { Client } from 'live-football-api';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 'no-store');
  const KEY = process.env.LIVE_FOOTBALL_API_KEY || process.env.APISPORT_KEY;
  if(!KEY) return res.status(200).json({ data: [], error: "No LIVE_FOOTBALL_API_KEY in Vercel" });
  const date = req.query.date || new Date().toISOString().split('T')[0];
  const client = new Client(KEY);
  try {
    const result = await client.matches(date, 'en');
    const matches = result?.data?.matches || [];
    return res.status(200).json({ data: matches, count: matches.length, date, source: "live-football-api.com" });
  } catch(err) {
    return res.status(200).json({ data: [], error: `API Error ${err.statusCode||''}: ${err.message}`, date });
  }
}
