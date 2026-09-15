import { timingSafeEqual } from 'crypto';
import { NextApiRequest, NextApiResponse } from 'next';
import Mux from '@mux/mux-node';

const { Video } = new Mux();

const isValidAssetId = (value: unknown): value is string => (
  typeof value === 'string' && /^[A-Za-z0-9_-]{1,160}$/.test(value)
);

const secureCompare = (candidate: unknown, expected: string): boolean => {
  if (typeof candidate !== 'string') return false;

  const candidateBuffer = Buffer.from(candidate);
  const expectedBuffer = Buffer.from(expected);

  if (candidateBuffer.length !== expectedBuffer.length) return false;
  return timingSafeEqual(candidateBuffer, expectedBuffer);
};

export default async function assetHandler (req: NextApiRequest, res: NextApiResponse): Promise<void> {
  const { method } = req;
  const assetId = Array.isArray(req.query.id) ? req.query.id[0] : req.query.id;

  if (!isValidAssetId(assetId)) {
    res.status(400).json({ error: 'Invalid asset ID' });
    return;
  }

  switch (method) {
    case 'GET':
      try {
        const asset = await Video.Assets.get(assetId);
        if (!(asset.playback_ids && asset.playback_ids[0])) {
          res.status(404).json({ error: 'Asset playback is not available' });
          return;
        }
        res.json({
          asset: {
            id: asset.id,
            status: asset.status,
            errors: asset.errors,
            playback_id: asset.playback_ids[0].id,
          },
        });
      } catch (error) {
        console.error('Request error', error); // eslint-disable-line no-console
        res.status(502).json({ error: 'Unable to load asset' });
      }
      break;
    case 'DELETE': {
      res.setHeader('Cache-Control', 'private, no-store');
      const configuredSecret = process.env.SLACK_MODERATOR_PASSWORD;

      if (!configuredSecret) {
        res.status(503).json({ error: 'Moderator deletion is not configured' });
        return;
      }

      if (!secureCompare(req.body?.slack_moderator_password, configuredSecret)) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      try {
        await Video.Assets.del(assetId);
        res.status(200).json({ deleted: true, asset_id: assetId });
      } catch (error) {
        console.error('Request error', error); // eslint-disable-line no-console
        res.status(502).json({ error: 'Unable to delete asset' });
      }
      break;
    }
    default:
      res.setHeader('Allow', ['GET', 'DELETE']);
      res.status(405).end(`Method ${method} Not Allowed`);
  }
}
