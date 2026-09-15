import { NextApiRequest, NextApiResponse } from 'next';
import { sendAbuseReport } from '../../lib/slack-notifier';

const notify = async ({playbackId, reason, comment }: { playbackId: string, reason: string, comment?: string }) => {
  if (process.env.AIRTABLE_KEY && process.env.AIRTABLE_BASE_ID) {
    try {
      const response = await fetch(
        `https://api.airtable.com/v0/${encodeURIComponent(process.env.AIRTABLE_BASE_ID)}/Reported`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${process.env.AIRTABLE_KEY}`,
            'content-type': 'application/json',
          },
          body: JSON.stringify({
            records: [
              { fields: { playbackId, reason, comment, status: 'Pending' } },
            ],
          }),
        },
      );

      if (!response.ok) {
        console.error('Error reporting to Airtable', response.status); // eslint-disable-line no-console
      }
    } catch (error) {
      console.error('Error reporting to Airtable', error); // eslint-disable-line no-console
    }
  }

  try {
    await sendAbuseReport({ playbackId, reason, comment });
  } catch (error) {
    console.error('Error reporting to Slack', error); // eslint-disable-line no-console
  }
};

export default async (req: NextApiRequest, res: NextApiResponse): Promise<void> => {
  const { method } = req;

  switch (method) {
    case 'POST':
      await notify(req.body);
      res.json({ message: 'thank you' });
      break;
    default:
      res.setHeader('Allow', ['POST']);
      res.status(405).end(`Method ${method} Not Allowed`);
  }
};
