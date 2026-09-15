import { NextApiRequest, NextApiResponse } from 'next';
import { HOST_URL } from '../../../constants';
import mux, { isMuxConfigured } from '../../../lib/mux-client';

export default async function uploadsHandler(req: NextApiRequest, res: NextApiResponse): Promise<void> {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
    return;
  }

  if (!isMuxConfigured()) {
    res.status(503).json({ error: 'Video uploads are not configured' });
    return;
  }

  try {
    const upload = await mux.video.uploads.create({
      new_asset_settings: { playback_policy: ['public'] },
      cors_origin: HOST_URL,
    });

    res.status(201).json({
      id: upload.id,
      url: upload.url,
    });
  } catch (error) {
    console.error('Error creating Mux upload', error); // eslint-disable-line no-console
    res.status(502).json({ error: 'Unable to create upload' });
  }
}
