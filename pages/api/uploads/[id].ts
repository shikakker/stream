import { NextApiRequest, NextApiResponse } from 'next';
import mux, { isMuxConfigured } from '../../../lib/mux-client';

const isValidMuxId = (value: unknown): value is string => (
  typeof value === 'string' && /^[A-Za-z0-9_-]{1,160}$/.test(value)
);

export default async function uploadHandler(req: NextApiRequest, res: NextApiResponse): Promise<void> {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
    return;
  }

  const uploadId = Array.isArray(req.query.id) ? req.query.id[0] : req.query.id;
  if (!isValidMuxId(uploadId)) {
    res.status(400).json({ error: 'Invalid upload ID' });
    return;
  }

  if (!isMuxConfigured()) {
    res.status(503).json({ error: 'Video uploads are not configured' });
    return;
  }

  try {
    const upload = await mux.video.uploads.retrieve(uploadId);
    res.json({
      upload: {
        status: upload.status,
        url: upload.url,
        asset_id: upload.asset_id,
      },
    });
  } catch (error) {
    console.error('Error getting Mux upload', error); // eslint-disable-line no-console
    res.status(502).json({ error: 'Unable to load upload' });
  }
}
