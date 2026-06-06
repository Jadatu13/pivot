import { kv } from '@vercel/kv';
import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const id = req.query.id as string;

  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, PUT, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(204).end();

  try {
    if (req.method === 'GET') {
      const data = await kv.get(`game:${id}`);
      if (!data) return res.status(404).json({ error: 'Not found' });
      return res.json(data);
    }

    if (req.method === 'PUT') {
      await kv.set(`game:${id}`, req.body, { ex: 60 * 60 * 24 * 180 });
      return res.status(200).json({ ok: true });
    }
  } catch (err) {
    console.error('KV error:', err);
    return res.status(500).json({ error: 'Storage unavailable' });
  }

  return res.status(405).end();
}
