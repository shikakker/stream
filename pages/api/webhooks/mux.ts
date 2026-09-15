import { NextApiRequest, NextApiResponse } from 'next';
import Mux from '@mux/mux-node';
import { buffer } from 'micro';
import { sendSlackAssetReady, sendSlackAutoDeleteMessage } from '../../../lib/slack-notifier';
import { getScores as moderationGoogle } from '../../../lib/moderation-google';
import { getScores as moderationHive } from '../../../lib/moderation-hive';
import { autoDelete } from '../../../lib/moderation-action';

const verifyWebhookSignature = (
  rawBody: string | Buffer,
  signature: string,
  webhookSignatureSecret: string,
) => {
  Mux.Webhooks.verifyHeader(rawBody, signature, webhookSignatureSecret);
};

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function muxWebhookHandler (req: NextApiRequest, res: NextApiResponse): Promise<void> {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
    return;
  }

  res.setHeader('Cache-Control', 'private, no-store');

  const webhookSignatureSecret = process.env.MUX_WEBHOOK_SIGNATURE_SECRET;
  if (!webhookSignatureSecret) {
    res.status(503).json({
      code: 'WEBHOOK_NOT_CONFIGURED',
      message: 'Webhook verification is unavailable.',
    });
    return;
  }

  const signatureHeader = req.headers['mux-signature'];
  const signature = Array.isArray(signatureHeader) ? signatureHeader[0] : signatureHeader;
  if (!signature) {
    res.status(401).json({
      code: 'WEBHOOK_UNAUTHORIZED',
      message: 'Invalid webhook signature.',
    });
    return;
  }

  let rawBody: string | Buffer;
  try {
    rawBody = await buffer(req, { limit: '2mb' });
  } catch (error) {
    console.warn('Rejected Mux webhook body', error); // eslint-disable-line no-console
    res.status(413).json({
      code: 'WEBHOOK_BODY_TOO_LARGE',
      message: 'Webhook payload is too large.',
    });
    return;
  }

  try {
    verifyWebhookSignature(rawBody, signature, webhookSignatureSecret);
  } catch {
    console.warn('Rejected Mux webhook signature'); // eslint-disable-line no-console
    res.status(401).json({
      code: 'WEBHOOK_UNAUTHORIZED',
      message: 'Invalid webhook signature.',
    });
    return;
  }

  const rawBodyText = Buffer.isBuffer(rawBody)
    ? rawBody.toString('utf8')
    : rawBody;

  let jsonBody: unknown;
  try {
    jsonBody = JSON.parse(rawBodyText);
  } catch {
    res.status(400).json({
      code: 'INVALID_WEBHOOK_PAYLOAD',
      message: 'Webhook payload must be valid JSON.',
    });
    return;
  }

  const payload = jsonBody && typeof jsonBody === 'object'
    ? jsonBody as { data?: any; type?: unknown }
    : {};
  const { data, type } = payload;

  if (type !== 'video.asset.ready') {
    res.status(200).json({ message: 'thanks Mux' });
    return;
  }

  const assetId = typeof data?.id === 'string' ? data.id : '';
  const playbackId =
    Array.isArray(data?.playback_ids) && typeof data.playback_ids[0]?.id === 'string'
      ? data.playback_ids[0].id
      : '';
  const duration = Number(data?.duration);

  if (!assetId || !playbackId || !Number.isFinite(duration) || duration < 0) {
    res.status(400).json({
      code: 'INVALID_WEBHOOK_PAYLOAD',
      message: 'Webhook asset payload is incomplete.',
    });
    return;
  }

  try {
    const googleScores = await moderationGoogle({ playbackId, duration });
    const hiveScores = await moderationHive({ playbackId, duration });

    const didAutoDelete = hiveScores
      ? await autoDelete({ assetId, playbackId, hiveScores })
      : false;

    if (didAutoDelete) {
      await sendSlackAutoDeleteMessage({ assetId, duration, hiveScores });
      res.status(200).json({ message: 'thanks Mux, I autodeleted this asset because it was bad' });
    } else {
      await sendSlackAssetReady({
        assetId,
        playbackId,
        duration,
        googleScores,
        hiveScores,
      });
      res.status(200).json({ message: 'thanks Mux, I notified myself about this' });
    }
  } catch (error) {
    console.error('Error handling verified Mux webhook', error); // eslint-disable-line no-console
    res.status(500).json({
      code: 'WEBHOOK_PROCESSING_FAILED',
      message: 'Unable to process webhook.',
    });
  }
}
